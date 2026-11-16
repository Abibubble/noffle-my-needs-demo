// Replaces the original /office route and office.html template.

import { avatarSrc } from '../avatars.js';
import { esc, setupPage } from '../layout.js';
import { hasPanic, visibleNoffles } from '../store.js';

const page = setupPage({ requires: 'person' });

if (page) {
  const { state, me } = page;

  document.getElementById('office').innerHTML = state.people
    .map((user) => {
      const colour = hasPanic(user) ? 'btn-red' : 'btn-green';
      const noffles = visibleNoffles(state, user, me);
      const id = esc(user.id);
      const name = `${esc(user.first_name)} ${esc(user.last_name)}`;
      return `
                <div class="col-sm-12 col-md-4 col-lg-3 mb-4">
                    <a href="#" role="button" data-bs-toggle="modal" data-bs-target="#user-modal-${id}">
                        <div class="card office-card">
                            <div class="card-body ${colour} office-card-body">
                                <div class="row">
                                    <div class="col-12 mp-0 my-2">
                                        <img class="avatar-office img-fluid" src="${avatarSrc(user.image_no)}" alt="Icon for ${esc(user.first_name)}">
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-12 my-2">
                                        <h2 class="card-heading-title">
                                            ${name}
                                        </h2>
                                        <p class="fw-bold fst-italic">(${esc(user.pronouns)})</p>
                                    </div>
                                </div>
                                <div class="row">
                                    ${noffles
                                      .map(
                                        (noffle) => `
                                        <div class="col-2 m-1 mt-2">
                                            <i class="${esc(noffle.icon)} fa-2x noffle-icon"></i>
                                        </div>`,
                                      )
                                      .join('')}
                                </div>
                            </div>
                        </div>
                    </a>
                </div>

                <!-- Modal -->
                <div class="modal fade" id="user-modal-${id}" tabindex="-1" role="dialog" aria-labelledby="user-modal-${id}-label" aria-hidden="true">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content ${colour}">
                            <div class="modal-header">
                                <h2 class="modal-title" id="user-modal-${id}-label">
                                    ${name} (${esc(user.pronouns)})
                                </h2>
                                <button type="button" class="close btn-close-modal tap-target" data-bs-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true"><i class="fas fa-2x fa-times"></i></span>
                                </button>
                            </div>
                            <div class="modal-body">
                                ${
                                  hasPanic(user)
                                    ? `<p class="h5 text-uppercase">
                                        <b>${esc(user.first_name)} is in need of urgent help!</b>
                                    </p>`
                                    : ''
                                }
                                <b>Noffles:</b>
                                ${noffles
                                  .map(
                                    (noffle) => `
                                    <div class="card mt-2 p-3 border-black">
                                        <h3 class="h6">
                                            <i class="${esc(noffle.icon)} fa-2x noffle-icon"></i>
                                            <b>${esc(noffle.name)}</b>
                                        </h3>
                                        <p>${esc(noffle.description)}</p>
                                    </div>`,
                                  )
                                  .join('')}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-primary btn-close-modal tap-target" data-bs-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>`;
    })
    .join('');

  // The cards are links with href="#", so stop them jumping to the top of the page.
  document.getElementById('office').addEventListener('click', (event) => {
    if (event.target.closest('a[href="#"]')) event.preventDefault();
  });
}
