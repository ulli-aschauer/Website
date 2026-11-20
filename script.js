const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelectorAll('.main-nav a');
const year = document.querySelector('#year');

if (year) year.textContent = new Date().getFullYear();

if (navToggle) {
  navToggle.addEventListener('click', () => {
    const isOpen = document.body.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    document.body.classList.remove('nav-open');
    navToggle?.setAttribute('aria-expanded', 'false');
  });
});

const standingsBody = document.querySelector('#standings-body');

if (standingsBody) {
  fetch('data/standings.json', { cache: 'no-cache' })
    .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
    .then((data) => {
      const rows = Array.isArray(data.rows) ? data.rows : [];
      if (!rows.length) return;
      standingsBody.innerHTML = rows
        .map((row) => {
          const isOwnTeam = row.team === data.team;
          const cells = [row.rank, row.team, row.played, row.wins, row.losses, row.points]
            .map((value) => `<td>${value ?? '-'}</td>`)
            .join('');
          return `<tr${isOwnTeam ? ' class="highlight"' : ''}>${cells}</tr>`;
        })
        .join('');
    })
    .catch(() => {
      // Bei Fehler bleibt die statisch im HTML hinterlegte Tabelle sichtbar.
    });
}

const nextMatchday = document.querySelector('#next-matchday');

if (nextMatchday) {
  fetch('data/next-matchday.json', { cache: 'no-cache' })
    .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
    .then((data) => {
      const dateField = nextMatchday.querySelector('[data-field="date"]');
      const opponentField = nextMatchday.querySelector('[data-field="opponent"]');
      const locationField = nextMatchday.querySelector('[data-field="location"]');

      if (dateField) {
        dateField.textContent = data.date
          ? `${data.date}${data.time ? `, ${data.time} Uhr` : ''}`
          : 'Steht noch nicht fest';
      }
      if (opponentField) {
        const awayHome = data.homeOrAway === 'heim' ? 'Heimspiel' : data.homeOrAway === 'auswärts' ? 'Auswärtsspiel' : '';
        opponentField.textContent = data.opponent
          ? `${data.opponent}${awayHome ? ` (${awayHome})` : ''}`
          : 'Steht noch nicht fest';
      }
      if (locationField) {
        locationField.textContent = data.location || 'Steht noch nicht fest';
      }
    })
    .catch(() => {
      // Bei Fehler bleiben die "Wird geladen..."-Platzhalter sichtbar.
    });
}

const newsList = document.querySelector('#news-list');

if (newsList) {
  fetch('data/news.json', { cache: 'no-cache' })
    .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
    .then((data) => {
      const items = Array.isArray(data.items) ? data.items : [];
      if (!items.length) {
        newsList.innerHTML = '<article class="info-card"><p>Aktuell gibt es keine Neuigkeiten.</p></article>';
        return;
      }
      newsList.innerHTML = items
        .map((item) => {
          const date = item.date ? new Date(item.date).toLocaleDateString('de-AT') : '';
          return `<article class="info-card"><small>${date}</small><h3>${item.title ?? ''}</h3><p>${item.text ?? ''}</p></article>`;
        })
        .join('');
    })
    .catch(() => {
      newsList.innerHTML = '<article class="info-card"><p>Aktuell gibt es keine Neuigkeiten.</p></article>';
    });
}

const gesuchtList = document.querySelector('#gesucht-list');

if (gesuchtList) {
  fetch('data/gesucht.json', { cache: 'no-cache' })
    .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
    .then((data) => {
      const openings = Array.isArray(data.openings) ? data.openings : [];
      if (!openings.length) {
        gesuchtList.innerHTML = '<article class="info-card"><p>Aktuell suchen wir niemand Bestimmten - Interessierte sind trotzdem jederzeit willkommen, siehe Probetraining oben.</p></article>';
        return;
      }
      gesuchtList.innerHTML = openings
        .map((opening) => {
          const title = [opening.role, opening.position].filter(Boolean).join(' - ');
          return `<article class="info-card"><h3>${title}</h3><p>${opening.description ?? ''}</p></article>`;
        })
        .join('');
    })
    .catch(() => {
      gesuchtList.innerHTML = '<article class="info-card"><p>Aktuell suchen wir niemand Bestimmten - Interessierte sind trotzdem jederzeit willkommen, siehe Probetraining oben.</p></article>';
    });
}
