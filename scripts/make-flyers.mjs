// Erzeugt den Spieltag-Flyer (Feed 1080x1350 + Story 1080x1920) aus den Homepage-Daten:
//   data/next-matchday.json, data/standings.json, data/hallen.json, data/hallen-info.json, data/spieltag-info.json
// Ausgabe: assets/flyers/<YYYY-MM-DD>-feed.jpg, -story.jpg und <YYYY-MM-DD>.json (Beschreibungstext fuer Instagram).
// Optionale Hintergrundfotos: assets/posts/*.jpg|png (werden im Wechsel verwendet).
// Benoetigt: npm install puppeteer-core und einen installierten Chrome/Chromium (CHROME_PATH).
import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import puppeteer from 'puppeteer-core';

const require = createRequire(import.meta.url);
const { buildHTML, buildStoryHTML } = require('./flyer-html.cjs');

const OWN = 'ABW-Black Wolves';
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const OUT_DIR = process.env.FLYER_OUT || 'assets/flyers';
const POSTS_DIR = 'assets/posts';
const MONATE = ['', 'JANUAR', 'FEBRUAR', 'MÄRZ', 'APRIL', 'MAI', 'JUNI', 'JULI', 'AUGUST', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DEZEMBER'];

const readJson = async (path, fallback) => readFile(path, 'utf8').then(JSON.parse).catch(() => fallback);
const show = (name) => (name === OWN ? 'Black Wolves' : name);

function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

async function pickPhotos(matchdayDate) {
  const files = (await readdir(POSTS_DIR).catch(() => [])).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();
  if (!files.length) return { feed: '', story: '' };
  const week = isoWeek(matchdayDate);
  const load = async (file) => {
    const mime = /\.png$/i.test(file) ? 'png' : 'jpeg';
    return `data:image/${mime};base64,` + (await readFile(`${POSTS_DIR}/${file}`)).toString('base64');
  };
  return { feed: await load(files[week % files.length]), story: await load(files[(week + 1) % files.length]) };
}

const md = await readJson('data/next-matchday.json', {});
const standings = await readJson('data/standings.json', {});
const hallen = await readJson('data/hallen.json', {});
const hallenInfo = await readJson('data/hallen-info.json', {});
const info = await readJson('data/spieltag-info.json', {});

await mkdir(OUT_DIR, { recursive: true });

if (!md.date || !Array.isArray(md.games) || !md.games.length) {
  for (const f of await readdir(OUT_DIR)) await rm(`${OUT_DIR}/${f}`);
  console.log('Kein kommender Spieltag - keine Flyer.');
  process.exit(0);
}

const [d, m, y] = md.date.split('.').map(Number);
const id = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const rank = {};
for (const r of standings.rows || []) rank[r.team] = r.rank;

const location = md.games[0].location || '';
const hallKey = Object.keys(hallen).find((k) => hallen[k] === location);
const verpflegung = Boolean(hallKey && hallenInfo[hallKey]?.verpflegung);
const eintritt = info[md.date]?.eintritt ?? info.standard?.eintritt ?? 'Frei';

const payload = {
  datum: `${d}. ${MONATE[m]} ${y}`,
  ort: location,
  eintritt,
  verpflegung,
  spiele: md.games.map((g) => {
    const home = g.homeOrAway === 'heim';
    const a = home ? OWN : g.opponent;
    const b = home ? g.opponent : OWN;
    return { zeit: g.time, teamA: show(a), teamB: show(b), platzA: rank[a] || '', platzB: rank[b] || '', highlight: true };
  }),
  tabelle: (standings.rows || []).map((r) => ({ platz: r.rank, name: show(r.team), punkte: r.points })),
};

const photos = await pickPhotos(new Date(y, m - 1, d));
const lines = [`SPIELTAG – ${payload.datum}`];
if (payload.ort) lines.push(`Ort: ${payload.ort}`);
lines.push('');
for (const s of payload.spiele) lines.push(`${s.zeit}  ${s.teamA} vs ${s.teamB}`);
lines.push('');
lines.push(`Eintritt: ${eintritt}`);
if (verpflegung) lines.push('Für Essen und Trinken ist gesorgt!');
lines.push('');
lines.push('#blackwolves #salzburg');
const caption = lines.join('\n');

// Nur neu erzeugen, wenn sich Inhalt oder Foto geaendert haben.
const hash = createHash('sha256').update(JSON.stringify({ payload, caption, feed: photos.feed.length, story: photos.story.length })).digest('hex');
const meta = await readJson(`${OUT_DIR}/${id}.json`, null);
const existing = await readdir(OUT_DIR);
if (meta?.hash === hash && existing.includes(`${id}-feed.jpg`) && existing.includes(`${id}-story.jpg`)) {
  console.log(`Flyer ${id} ist aktuell.`);
  process.exit(0);
}

const browser = await puppeteer.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
try {
  const render = async (html, width, height, options) => {
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const image = await page.screenshot(options);
    await page.close();
    return image;
  };
  await writeFile(`${OUT_DIR}/${id}-feed.jpg`, await render(buildHTML({ ...payload, hintergrund: photos.feed }), 1080, 1350, { type: 'jpeg', quality: 92 }));

  // Story: Flyer (ohne Foto-Hintergrund) mittig, das Foto fuellt den Story-Hintergrund
  const poster = await render(buildHTML({ ...payload, hintergrund: '' }), 1080, 1350, { type: 'png' });
  const storyHtml = buildStoryHTML(Buffer.from(poster).toString('base64'), { hintergrund: photos.story });
  await writeFile(`${OUT_DIR}/${id}-story.jpg`, await render(storyHtml, 1080, 1920, { type: 'jpeg', quality: 92 }));
} finally {
  await browser.close();
}

await writeFile(`${OUT_DIR}/${id}.json`, `${JSON.stringify({ id, date: md.date, hash, caption }, null, 2)}\n`);

// Flyer vergangener Spieltage entfernen
for (const f of await readdir(OUT_DIR)) {
  if (!f.startsWith(id)) await rm(`${OUT_DIR}/${f}`);
}
console.log(`Flyer ${id} erzeugt.`);
