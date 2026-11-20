// Erzeugt für jeden Eintrag in data/news.json und data/gesucht.json ein Instagram-Story-Bild
// (1080x1920 JPEG) unter assets/stories/<id>.jpg. Bereits vorhandene Bilder bleiben unverändert.
// Benötigt: npm install sharp
import { readFile, mkdir, access } from 'node:fs/promises';
import sharp from 'sharp';

const W = 1080;
const H = 1920;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function wrap(text, maxChars) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if ((line + ' ' + word).trim().length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = (line + ' ' + word).trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}

function textBlock(lines, x, y, size, lineHeight, fill, weight = 400) {
  return lines
    .map((l, i) => `<text x="${x}" y="${y + i * lineHeight}" font-family="Arial, Helvetica, DejaVu Sans, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(l)}</text>`)
    .join('');
}

async function makeStory({ id, label, title, text }) {
  const out = `assets/stories/${id}.jpg`;
  if (await access(out).then(() => true, () => false)) return;

  const titleLines = wrap(title, 20);
  const textLines = wrap(text, 34).slice(0, 12);
  const titleY = 760;
  const textY = titleY + titleLines.length * 96 + 70;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="#030406"/>
    <rect x="0" y="0" width="${W}" height="18" fill="#f01436"/>
    <rect x="0" y="${H - 18}" width="${W}" height="18" fill="#f01436"/>
    ${textBlock([label.toUpperCase()], 80, 660, 44, 0, '#f01436', 700)}
    ${textBlock(titleLines, 80, titleY, 82, 96, '#ffffff', 700)}
    ${textBlock(textLines, 80, textY, 46, 66, '#d4d9e2')}
    <rect x="80" y="${H - 260}" width="${W - 160}" height="110" fill="#f01436"/>
    ${textBlock(['asvoe-blackwolves.at'], 120, H - 190, 52, 0, '#ffffff', 700)}
  </svg>`;

  const logo = await sharp('assets/logo.png').resize(360, 360, { fit: 'contain', background: '#030406' }).toBuffer();
  await mkdir('assets/stories', { recursive: true });
  await sharp(Buffer.from(svg))
    .composite([{ input: logo, left: (W - 360) / 2, top: 180 }])
    .jpeg({ quality: 88 })
    .toFile(out);
  console.log('Story erzeugt:', out);
}

const news = JSON.parse(await readFile('data/news.json', 'utf8'));
const gesucht = JSON.parse(await readFile('data/gesucht.json', 'utf8'));

for (const item of news.items ?? []) {
  if (item.id) await makeStory({ id: item.id, label: 'Neuigkeiten', title: item.title ?? '', text: item.text ?? '' });
}
for (const opening of gesucht.openings ?? []) {
  if (opening.id) {
    await makeStory({ id: opening.id, label: 'Wir suchen', title: opening.role ?? 'Wir suchen', text: opening.description ?? '' });
  }
}
