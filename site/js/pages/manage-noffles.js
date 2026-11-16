// Replaces the original /manage_noffles and /delete_noffle routes.
//
// "Delete Noffle" was a link with href="#" acting as a button, and it deleted
// straight away. Now it's a real button that asks you to confirm first
// (WCAG 4.1.2 Name, Role, Value and 3.3.4 Error Prevention).

import { addFlash, esc, go, setupPage } from '../layout.js';
import { PANIC_ID } from '../data.js';
import { deleteNoffle, findNoffle } from '../store.js';

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
                                    <i class="${esc(noffle.icon)} fa-2x noffle-icon" aria-hidden="true"></i>
                                </div>
                                <div class="col-10">
                                    <h2 class="card-heading-title">${esc(noffle.name)}</h2>
                                </div>
                            </div>
                            <hr>
                            <p class="card-text">${esc(noffle.description)}</p>
                            <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
                            <p class="card-text">This Noffle is ${noffle.private ? 'private' : 'public'}</p>
                            <div>
                                <button type="button" class="btn btn-red btn-sm w-100 mt-2 pt-2 tap-target" data-bs-toggle="modal" data-bs-target="#delete-noffle-modal" data-delete-noffle="${esc(noffle.id)}" aria-haspopup="dialog" aria-label="Delete Noffle: ${esc(noffle.name)}">
                                    Delete Noffle
                                </button>
                            </div>
                        </div>
                    </div>
                </div>`,
    )
    .join('');

  const modal = document.getElementById('delete-noffle-modal');
  let chosenId = null;

  // Fill in the pop-up with the Noffle you chose, and how many people it affects.
  modal.addEventListener('show.bs.modal', (event) => {
    chosenId = event.relatedTarget?.dataset.deleteNoffle ?? null;
    const noffle = findNoffle(state, chosenId);
    if (!noffle) return;
    const count = state.people.filter((p) => p.noffles.includes(noffle.id)).length;
    const people = count === 1 ? '1 person' : `${count} people`;
    modal.querySelector('#delete-noffle-title').textContent = `Delete "${noffle.name}"?`;
    modal.querySelector('#delete-noffle-detail').textContent =
      `This removes it from ${people} who set it. You can't undo this, except by resetting the whole demo.`;
  });

  document.getElementById('confirm-delete-noffle').addEventListener('click', () => {
    if (!chosenId) return;
    deleteNoffle(state, chosenId);
    save();
    addFlash('Noffle Successfully Deleted');
    go('manage-noffles.html');
  });
}
