// Flyer-Vorlage (HTML) fuer den Spieltag - Feed (1080x1350) und Story (1080x1920).
const fs = require('fs');
const path = require('path');

const LOGO_FILES = {
  blackwolves: 'blackwolves.png',
  schladming: 'schladming.png',
  schwarzach: 'schwarzach.png',
  kampfhummeln: 'kampfhummeln.jpg',
  psv: 'psv.png',
  oberndorf: 'oberndorf.jpg',
  tamsweg: 'tamsweg.jpg',
};
const LOGOS = {};
for (const [key, file] of Object.entries(LOGO_FILES)) {
  const ext = path.extname(file).slice(1).toLowerCase();
  const mime = ext === 'jpg' ? 'jpeg' : ext;
  LOGOS[key] = `data:image/${mime};base64,` + fs.readFileSync(path.join(__dirname, '..', 'assets', 'logos', file)).toString('base64');
}

function getLogo(teamName) {
  const key = teamName.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [k, v] of Object.entries(LOGOS)) {
    if (key.includes(k.replace(/[^a-z0-9]/g, ''))) return v;
  }
  return '';
}

// Hintergrundfoto nur uebernehmen, wenn es eine normale https-Adresse ist
function safePhotoUrl(url) {
  return /^(https:\/\/[^\s'"()<>]+|data:image\/(jpeg|png);base64,[A-Za-z0-9+\/=]+)$/.test(url || '') ? url : '';
}

function buildHTML(data) {
  const verpflegung = data.verpflegung
    ? 'Essen & Getränke vor Ort erhältlich'
    : 'Bitte Essen & Getränke selbst mitbringen';

  const photo = safePhotoUrl(data.hintergrund);
  const bodyStyle = photo
    ? ` style="background:linear-gradient(rgba(17,17,17,0.86),rgba(17,17,17,0.94)),url('${photo}') center/cover no-repeat;"`
    : '';

  const tabelle = data.tabelle || [];
  const tabelleHTML = tabelle
    .sort((a, b) => a.platz - b.platz)
    .map(t => {
      const isBlackWolves = t.name.toLowerCase().includes('black wolves') || t.name.toLowerCase().includes('wolf');
      return `<tr class="${isBlackWolves ? 'highlight-row' : ''}">
        <td class="platz-col">${t.platz}</td>
        <td class="name-col">${t.name}</td>
        <td class="punkte-col">${t.punkte} Pkt.</td>
      </tr>`;
    }).join('');

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
* { margin:0; padding:0; box-sizing:border-box; }
body { width:1080px; height:1350px; background:#111111; font-family:'Arial Black',Arial,sans-serif; color:#fff; overflow:hidden; }
.top-bar { width:100%; height:10px; background:#CC2200; }
.header { text-align:center; padding:16px 0 4px; }
.spieltag-label { font-size:15px; letter-spacing:8px; color:#CC2200; font-weight:900; }
.bw-logo { width:150px; height:150px; object-fit:contain; margin:8px auto; display:block; }
.club-name { font-size:26px; letter-spacing:5px; color:#fff; font-weight:900; }
.club-sub { font-size:12px; letter-spacing:10px; color:#CC2200; margin-top:2px; }
.divider { width:100%; height:1px; background:#333; margin:8px 0; }
.red-bar { width:140px; height:6px; background:#CC2200; border-radius:3px; margin:-4px auto 0; }
.meta { text-align:center; padding:6px 0; }
.date { font-size:16px; color:#CC2200; letter-spacing:3px; font-weight:700; }
.location { font-size:12px; color:#888; margin-top:3px; }
.spiele { padding:0 40px; }
.spiel { display:flex; align-items:center; background:#1a1a1a; border-radius:12px; margin:7px 0; padding:10px 16px; border-left:5px solid #555; height:108px; }
.spiel.highlight { border-left-color:#CC2200; }
.zeit { font-size:12px; color:#888; font-weight:700; letter-spacing:2px; width:75px; flex-shrink:0; }
.spiel.highlight .zeit { color:#CC2200; }
.team { display:flex; flex-direction:column; align-items:center; width:190px; }
.team img { width:58px; height:58px; object-fit:contain; }
.team-name { font-size:10px; color:#888; margin-top:3px; letter-spacing:1px; text-align:center; }
.team-platz { font-size:10px; color:#CC2200; margin-top:2px; font-weight:700; }
.vs { font-size:20px; color:#333; font-weight:900; flex:1; text-align:center; }
.bottom { text-align:center; margin-top:8px; padding:0 40px; }
.eintritt { display:inline-block; background:#CC2200; color:#fff; font-size:13px; font-weight:900; letter-spacing:3px; padding:9px 36px; border-radius:25px; }
.verpflegung { font-size:12px; color:#888; margin-top:8px; letter-spacing:1px; }
.tabelle-section { padding:10px 40px 0; }
.tabelle-titel { font-size:11px; letter-spacing:5px; color:#666; text-align:center; margin-bottom:6px; }
.tabelle-table { width:100%; border-collapse:collapse; }
.tabelle-table tr { border-bottom:1px solid #222; }
.tabelle-table tr.highlight-row { background:#2a0a0a; border-left:3px solid #CC2200; }
.tabelle-table td { padding:7px 10px; font-size:13px; font-family:Arial,sans-serif; }
.platz-col { width:40px; color:#555; font-weight:700; text-align:center; }
.highlight-row .platz-col { color:#CC2200; }
.name-col { color:#cccccc; }
.highlight-row .name-col { color:#ffffff; font-weight:700; }
.punkte-col { text-align:right; color:#555; font-size:12px; }
.highlight-row .punkte-col { color:#CC2200; }
.footer { font-size:10px; color:#444; letter-spacing:3px; margin-top:10px; text-align:center; padding-bottom:18px; }
.bottom-bar { width:100%; height:10px; background:#CC2200; position:absolute; bottom:0; }
</style></head><body${bodyStyle}>
<div class="top-bar"></div>
<div class="header">
  <div class="spieltag-label">SPIELTAG</div>
  <img class="bw-logo" src="${getLogo('black wolves')}" />
  <div class="club-name">BLACK WOLVES</div>
  <div class="club-sub">VOLLEYBALL</div>
</div>
<div class="divider"></div>
<div class="red-bar"></div>
<div class="meta">
  <div class="date">${data.datum}</div>
  <div class="location">${data.ort}</div>
</div>
<div class="divider"></div>
<div class="spiele">
  ${( data.spiele || [] ).map(s => `
  <div class="spiel ${s.highlight ? 'highlight' : ''}">
    <div class="zeit">${s.zeit} UHR</div>
    <div class="team">
      <img src="${getLogo(s.teamA)}" />
      <div class="team-name">${(s.teamA || '').toUpperCase()}</div>
      <div class="team-platz">${s.platzA ? 'Platz ' + s.platzA : ''}</div>
    </div>
    <div class="vs">VS</div>
    <div class="team">
      <img src="${getLogo(s.teamB)}" />
      <div class="team-name">${(s.teamB || '').toUpperCase()}</div>
      <div class="team-platz">${s.platzB ? 'Platz ' + s.platzB : ''}</div>
    </div>
  </div>`).join('')}
</div>
<div class="bottom">
  <div class="eintritt">EINTRITT ${String(data.eintritt || "Frei")}</div>
  <div class="verpflegung">${verpflegung}</div>
</div>
<div class="tabelle-section">
  <div class="divider"></div>
  <div class="tabelle-titel">1. LANDESLIGA HERREN · TABELLE</div>
  <table class="tabelle-table">
    ${tabelleHTML}
  </table>
</div>
<div class="footer">BLACK WOLVES VOLLEYBALL · SALZBURG</div>
<div class="bottom-bar"></div>
</body></html>`;
}

// Story (1080x1920): der Flyer mittig, oben/unten bleibt Platz fuer die Instagram-Oberflaeche.
// Mit Foto: das Foto fuellt den Hintergrund.
function buildStoryHTML(posterBase64, data) {
  const photo = safePhotoUrl(data.hintergrund);
  const background = photo
    ? `linear-gradient(rgba(0,0,0,0.30),rgba(0,0,0,0.30)),url('${photo}') center/cover no-repeat`
    : '#111111';
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
* { margin:0; padding:0; }
body { width:1080px; height:1920px; background:${background}; position:relative; overflow:hidden; }
img { position:absolute; left:0; top:285px; width:1080px; height:1350px; box-shadow:0 0 70px rgba(0,0,0,0.65); }
</style></head><body>
<img src="data:image/png;base64,${posterBase64}" />
</body></html>`;
}


module.exports = { buildHTML, buildStoryHTML };
