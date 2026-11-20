// Holt Tabelle und nächsten Spieltag vom SVV (svv.volleynet.at) und schreibt data/*.json.
// Aufruf: node scripts/update-data.mjs   (Node 18+, keine Abhängigkeiten)
import { readFile, writeFile } from 'node:fs/promises';

const BEWERB = '39872'; // SVV - 1LLH - Grunddurchgang 2026/2027
const OWN_TEAM = 'ABW-Black Wolves';
const BASE = 'https://svv.volleynet.at';

// Schreibt nur, wenn sich die Daten (ohne Zeitstempel) geändert haben.
async function writeIfChanged(path, data) {
  const strip = (value) => JSON.stringify({ ...value, updatedAt: undefined });
  const current = await readFile(path, 'utf8').then(JSON.parse).catch(() => null);
  if (current && strip(current) === strip(data)) return false;
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`);
  return true;
}

async function loadText(page) {
  const response = await fetch(`${BASE}/${page}/${BEWERB}`, { headers: { 'User-Agent': 'BlackWolvesSiteBot/1.0' } });
  if (!response.ok) throw new Error(`${page}: HTTP ${response.status}`);
  const html = new TextDecoder('windows-1252').decode(await response.arrayBuffer());
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, '|')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/[\s|]*\|[\s|]*/g, '|');
}

const num = (value) => Number.parseInt(value, 10);
const todayVienna = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Vienna' }).format(new Date()); // YYYY-MM-DD
const isoDate = (dmy) => dmy.split('.').reverse().join('-');

async function updateStandings() {
  const text = await loadText('Tabelle');
  const start = text.indexOf('Mannschaft|Sp.|');
  const end = text.indexOf('Heimtabelle', start);
  if (start < 0 || end < 0) throw new Error('Tabelle: Struktur nicht erkannt');
  const rows = [];
  const rowPattern = /(\d+)\|([^|]+)\|(\d+)\|(\d+)\|(\d+)\|\d+\|\d+\|\d+\|\d+\|(\d+)\|/g;
  for (const match of text.slice(start, end).matchAll(rowPattern)) {
    rows.push({ rank: num(match[1]), team: match[2], played: num(match[3]), wins: num(match[4]), losses: num(match[5]), points: num(match[6]) });
  }
  if (rows.length < 2) throw new Error('Tabelle: keine Zeilen gefunden');
  const data = { source: `${BASE}/Tabelle/${BEWERB}`, updatedAt: new Date().toISOString(), team: OWN_TEAM, rows };
  const changed = await writeIfChanged('data/standings.json', data);
  console.log(`Tabelle: ${rows.length} Teams${changed ? ' (geändert)' : ''}`);
}

async function updateNextMatchday() {
  // Hallen-Bezeichnung des SVV -> Adresse (data/hallen.json, aus dem Tab "Hallen" im Sheet)
  const hallen = JSON.parse(await readFile('data/hallen.json', 'utf8'));
  const [termine, ergebnisse] = await Promise.all([loadText('Termine'), loadText('Ergebnisse')]);
  const played = new Set([...ergebnisse.matchAll(/(SVV - [^|]+)\|\d\d\.\d\d\.\d{4}\|/g)].map((m) => m[1]));
  const gamePattern = /\d+\|(SVV - [^|]+)\|\w\w\|(\d\d\.\d\d\.\d{4})\|(\d\d:\d\d)\|([^|]+)\|([^|]+)\|([^|]+)\|Google\|/g;
  const today = todayVienna();
  const games = [...termine.matchAll(gamePattern)]
    .map((m) => ({ id: m[1], date: m[2], time: m[3], home: m[4], away: m[5], hall: m[6] }))
    .filter((g) => (g.home === OWN_TEAM || g.away === OWN_TEAM) && !played.has(g.id) && isoDate(g.date) >= today)
    .sort((a, b) => `${isoDate(a.date)} ${a.time}`.localeCompare(`${isoDate(b.date)} ${b.time}`));

  // Ein Spieltag hat zwei Spiele: alle Spiele des nächsten Spieltags (gleiches Datum) übernehmen.
  const matchday = games
    .filter((g) => g.date === games[0].date)
    .map((g) => ({
      time: g.time,
      opponent: g.home === OWN_TEAM ? g.away : g.home,
      location: hallen[g.hall] ?? g.hall,
      homeOrAway: g.home === OWN_TEAM ? 'heim' : 'auswärts',
    }));
  for (const g of games.filter((x) => x.date === games[0]?.date)) {
    if (!hallen[g.hall]) console.warn(`WARNUNG: keine Adresse für Halle "${g.hall}" in data/hallen.json`);
  }
  const first = matchday[0];
  const data = {
    source: `${BASE}/Termine/${BEWERB}`,
    updatedAt: new Date().toISOString(),
    date: first ? games[0].date : null,
    games: matchday,
    // Felder des ersten Spiels bleiben für ältere Auswertungen erhalten
    time: first?.time ?? null,
    opponent: first?.opponent ?? null,
    location: first?.location ?? null,
    homeOrAway: first?.homeOrAway ?? null,
  };
  const changed = await writeIfChanged('data/next-matchday.json', data);
  console.log(`Nächster Spieltag${changed ? ' (geändert)' : ''}:`, data.date ?? 'keiner', matchday.map((g) => `${g.time} ${g.opponent}`).join(' | '));
}

await updateStandings();
await updateNextMatchday();
