// Holt Tabelle und nächsten Spieltag vom SVV (svv.volleynet.at) und schreibt data/*.json.
// Aufruf: node scripts/update-data.mjs   (Node 18+, keine Abhängigkeiten)
import { readFile, writeFile } from 'node:fs/promises';

// Schreibt nur, wenn sich die Daten (ohne Zeitstempel) geändert haben.
async function writeIfChanged(path, data) {
  const strip = (value) => JSON.stringify({ ...value, updatedAt: undefined });
  const current = await readFile(path, 'utf8').then(JSON.parse).catch(() => null);
  if (current && strip(current) === strip(data)) return false;
  await writeFile(path, `${JSON.stringify(data, null, 2)}
`);
  return true;
}

const BEWERB = '39872'; // SVV - 1LLH - Grunddurchgang 2026/2027
const OWN_TEAM = 'ABW-Black Wolves';
const BASE = 'https://svv.volleynet.at';

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
  const data = {
    source: `${BASE}/Tabelle/${BEWERB}`,
    updatedAt: new Date().toISOString(),
    team: OWN_TEAM,
    rows,
  };
  await writeFile('data/standings.json', `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Tabelle: ${rows.length} Teams`);
}

async function updateNextMatchday() {
  const [termine, ergebnisse] = await Promise.all([loadText('Termine'), loadText('Ergebnisse')]);
  const played = new Set([...ergebnisse.matchAll(/(SVV - [^|]+)\|\d\d\.\d\d\.\d{4}\|/g)].map((m) => m[1]));
  const gamePattern = /\d+\|(SVV - [^|]+)\|\w\w\|(\d\d\.\d\d\.\d{4})\|(\d\d:\d\d)\|([^|]+)\|([^|]+)\|([^|]+)\|Google\|/g;
  const today = todayVienna();
  const games = [...termine.matchAll(gamePattern)]
    .map((m) => ({ id: m[1], date: m[2], time: m[3], home: m[4], away: m[5], hall: m[6] }))
    .filter((g) => (g.home === OWN_TEAM || g.away === OWN_TEAM) && !played.has(g.id) && isoDate(g.date) >= today)
    .sort((a, b) => `${isoDate(a.date)} ${a.time}`.localeCompare(`${isoDate(b.date)} ${b.time}`));

  const next = games[0];
  const data = {
    source: `${BASE}/Termine/${BEWERB}`,
    updatedAt: new Date().toISOString(),
    date: next ? next.date : null,
    time: next ? next.time : null,
    opponent: next ? (next.home === OWN_TEAM ? next.away : next.home) : null,
    location: next ? next.hall : null,
    homeOrAway: next ? (next.home === OWN_TEAM ? 'heim' : 'auswärts') : null,
  };
  await writeFile('data/next-matchday.json', `${JSON.stringify(data, null, 2)}\n`);
  console.log('Nächstes Spiel:', next ? `${next.date} ${next.time} ${data.opponent}` : 'keins');
}

await updateStandings();
await updateNextMatchday();
