// Replaces the original /set_noffles and /add_noffle routes.
// In the original, each card was a link to the server. Here each card is a
// button that turns the noffle on or off, because there's no server.
//
// The page used to reload after each card, so focus went back to the top and the
// message wasn't announced. Now the card updates in place, focus stays on it, and
// the message is announced (WCAG 2.4.3 Focus Order and 4.1.3 Status Messages).

import { esc, setupPage, showStatus } from '../layout.js';
import { PANIC_ID } from '../data.js';
import { findNoffle, groupNoffles, toggleNoffle } from '../store.js';

const page = setupPage({ requires: 'person' });

function cardColour(noffle) {
  if (noffle.permanent) return 'btn-yellow';
  if (noffle.id === PANIC_ID) return 'btn-red';
  return 'btn-blue';
}

function card(noffle, isSet) {
  return `
                <div class="col-sm-12 col-md-4 col-lg-3 mb-4">
                    <button type="button" class="noffle-toggle" data-noffle-id="${esc(noffle.id)}" aria-pressed="${isSet}">
                        <span class="card noffle-card">
                            <span class="card-body h-100 d-block ${cardColour(noffle)}">
                                <span class="row card-title">
                                    <span class="row">
                                        <i class="${isSet ? 'fas fa-check-square' : 'far fa-square'} fa-2x mb-2 d-flex justify-content-end" aria-hidden="true" data-tick></i>
                                    </span>
                                    <span class="col-2">
                                        <i class="${esc(noffle.icon)} fa-2x noffle-icon" aria-hidden="true"></i>
                                    </span>
                                    <span class="col-10">
                                        <span class="h5 d-block">${esc(noffle.name)}</span>
                                    </span>
                                </span>
                                <span class="card-text d-block">${esc(noffle.description)}</span>
                                <span class="card-text d-block mt-3">This Noffle is ${noffle.private ? 'private' : 'public'}</span>
                            </span>
                        </span>
                    </button>
                </div>`;
}

if (page) {
  const { state, me, save } = page;
  const { permanent, temporary } = groupNoffles(state);

  const render = (id, noffles) => {
    document.getElementById(id).innerHTML = noffles
      .map((noffle) => card(noffle, me.noffles.includes(noffle.id)))
      .join('');
  };
  render('permanent-noffles', permanent);
  render('temporary-noffles', temporary);

  document.querySelector('main').addEventListener('click', (event) => {
    const button = event.target.closest('[data-noffle-id]');
    if (!button) return;
    const noffle = findNoffle(state, button.dataset.noffleId);
    const result = toggleNoffle(state, me.id, noffle.id);
    save();
    const isSet = result === 'added';
    button.setAttribute('aria-pressed', String(isSet));
    const tick = button.querySelector('[data-tick]');
    tick.classList.toggle('fas', isSet);
    tick.classList.toggle('fa-check-square', isSet);
    tick.classList.toggle('far', !isSet);
    tick.classList.toggle('fa-square', !isSet);
    showStatus(
      isSet
        ? `Noffle ${noffle.name} added to your Noffles`
        : `Noffle ${noffle.name} removed from your Noffles`,
    );
  });
}
