// Replaces the original /manage_noffles and /delete_noffle routes.

import { addFlash, esc, go, setupPage } from '../layout.js';
import { PANIC_ID } from '../data.js';
import { deleteNoffle } from '../store.js';

const page = setupPage({ requires: 'admin' });

function cardColour(noffle) {
  if (noffle.permanent) return 'btn-yellow';
  if (noffle.id === PANIC_ID) return 'btn-red';
  return 'btn-blue';
}

if (page) {
  const { state, save } = page;
  const list = document.getElementById('noffle-list');

  list.innerHTML = state.noffles
    .map(
      (noffle) => `
                <div class="col-sm-12 col-md-4 col-lg-3 mb-4">
                    <div class="card noffle-card">
                        <div class="card-body ${cardColour(noffle)}">
                            <div class="row card-title">
                                <div class="col-2">
                                    <i class="${esc(noffle.icon)} fa-2x noffle-icon"></i>
                                </div>
                                <div class="col-10">
                                    <h3 class="card-heading-title">${esc(noffle.name)}</h3>
                                </div>
                            </div>
                            <hr>
                            <p class="card-text">${esc(noffle.description)}</p>
                            <i class="fas fa-exclamation-circle"></i>
                            <p class="card-text">This Noffle is ${noffle.private ? 'private' : 'public'}</p>
                            <div>
                                <a role="button" class="btn btn-red btn-sm w-100 mt-2 pt-2 tap-target" href="#" data-delete-noffle="${esc(noffle.id)}">
                                    Delete Noffle
                                </a>
                            </div>
                        </div>
                    </div>
                </div>`,
    )
    .join('');

  list.addEventListener('click', (event) => {
    const link = event.target.closest('[data-delete-noffle]');
    if (!link) return;
    event.preventDefault();
    deleteNoffle(state, link.dataset.deleteNoffle);
    save();
    addFlash('Noffle Successfully Deleted');
    go('manage-noffles.html');
  });
}
