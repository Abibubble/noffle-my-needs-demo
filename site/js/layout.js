// Builds the parts of the page that base.html used to provide:
// the navbar, the flash messages and the footer. Also adds the demo banner.

import { addFlash, loadState, saveState, storageAvailable, takeFlashes } from './persist.js';
import { currentPerson, fullName, switchOut } from './store.js';

export const ORIGINAL_REPO = 'https://github.com/Abibubble/noffle-my-needs';

const TEAM = [
  { name: 'Abi Harrison', github: 'https://github.com/Abibubble' },
  { name: 'Andrew Dempsey', github: 'https://github.com/andrewdempsey2018' },
  { name: 'Carla Buongiorno', github: 'https://github.com/CarlaBuongiorno' },
  { name: 'Henrique Peroni', github: 'https://github.com/Henriqueperoni' },
  { name: 'Monika Hrda', github: 'https://github.com/monika-hrda' },
];

// Escapes text before it goes into HTML, so nothing a visitor types can run as code.
export function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function go(url) {
  window.location.assign(url);
}

function navItem(href, label) {
  return `<li class="nav-item">
                        <a class="nav-link tap-target" href="${href}">${label}</a>
                    </li>`;
}

function renderNav(me) {
  const nav = document.getElementById('site-nav');
  if (!nav) return;
  let items;
  if (me) {
    items = [
      navItem('office.html', 'Office'),
      navItem('profile.html', 'Profile'),
      navItem('set-noffles.html', 'Set My Noffles'),
      ...(me.is_admin
        ? [navItem('manage-users.html', 'Manage Users'), navItem('manage-noffles.html', 'Manage Noffles')]
        : []),
      `<li class="nav-item">
                        <button type="button" class="nav-link nav-link-button tap-target" id="switch-person">Switch Person</button>
                    </li>`,
    ].join('');
  } else {
    items = navItem('choose.html', 'Choose a Demo Person');
  }

  nav.innerHTML = `
        <div class="container">
            <a class="navbar-brand tap-target" href="index.html"><h1>Noffle My Needs</h1></a>

            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarToggler"
                aria-controls="navbarToggler" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"><i class="fas fa-2x fa-bars tap-target"></i></span>
            </button>

            <div class="collapse navbar-collapse right-justify" id="navbarToggler">
                <ul class="nav navbar-nav">
                    ${items}
                </ul>
            </div>
        </div>`;
}

function renderBanner(me) {
  const banner = document.getElementById('demo-banner');
  if (!banner) return;
  const storageNote = storageAvailable
    ? 'Anything you change is saved only in this browser.'
    : `Your browser is blocking storage, so the demo can't remember your changes.${
        me ? ` You're viewing as ${esc(fullName(me))}.` : ''
      }`;
  banner.innerHTML = `
        <p class="mb-0">
            <strong>This is a demo.</strong> There are no real accounts, and nothing is sent anywhere.
            ${storageNote}
            <a href="index.html#about-demo" class="demo-banner-link">About this demo</a>
        </p>`;
}

function renderFlashes() {
  const section = document.getElementById('flash');
  if (!section) return;
  section.innerHTML = takeFlashes()
    .map(
      ({ message, category }) => `
                        <div class="row pb-4">
                            <div class="col-12 rounded flash-message">
                                <p class="flash fw-bold py-1 ${category === 'error' ? 'error' : ''}">${esc(message)}</p>
                            </div>
                        </div>`,
    )
    .join('');
}

function renderFooter() {
  const footer = document.getElementById('site-footer');
  if (!footer) return;
  const people = TEAM.map(
    ({ name, github }) => `
            <div class="col-sm-6 col-md-2 text-center">
                <a href="${github}" class="tap-target" rel="noopener" target="_blank">${name}</a><br>
            </div>`,
  ).join('');
  footer.innerHTML = `
        <div class="row">
            ${people}
            <div class="col-sm-6 col-md-2 text-center">
                <small class="copyright">Copyright &copy; A11y Allies 2021</small>
            </div>
        </div>`;
}

// Call this at the top of every page script.
// requires: null (anyone), 'person' (a demo person is chosen) or 'admin'.
export function setupPage({ requires = null } = {}) {
  const state = loadState();
  const me = currentPerson(state);

  if (requires && !me) {
    addFlash('You need to choose a demo person to see this page', 'error');
    window.location.replace('choose.html');
    return null;
  }
  if (requires === 'admin' && !me.is_admin) {
    addFlash('You need to be an admin to access this page', 'error');
    window.location.replace('office.html');
    return null;
  }

  renderNav(me);
  renderBanner(me);
  renderFlashes();
  renderFooter();

  document.getElementById('switch-person')?.addEventListener('click', () => {
    const person = switchOut(state);
    saveState(state);
    addFlash(person ? `You've stopped viewing as ${fullName(person)}` : "You're already logged out!");
    go('choose.html');
  });

  return { state, me, save: () => saveState(state) };
}

export { addFlash };
