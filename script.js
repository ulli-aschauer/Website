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
  fetch('data/standings.json')
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
