// Replaces the original /office route and office.html template.
//
// Each card was a link with href="#" acting as a button. Now the person's name is a
// real button (so Space and Enter both work), and Bootstrap's stretched-link class
// keeps the whole card clickable (WCAG 4.1.2 Name, Role, Value).
//
// The noffles on each card were icons only, and the panic button was only shown
// by a red card. Now each icon has its name next to it, and the panic state has a
// visible text label (WCAG 1.1.1 Non-text Content, 1.4.1 Use of Colour).

import { avatarSrc } from '../avatars.js';
import { esc, setupPage } from '../layout.js';
import { showsPanic, visibleNoffles } from '../store.js';

const page = setupPage({ requires: 'person' });

if (page) {
  const { state, me } = page;

  document.getElementById('office').innerHTML = state.people
    .map((user) => {
      const panic = showsPanic(state, user, me);
      const colour = panic ? 'btn-red' : 'btn-green';
      const noffles = visibleNoffles(state, user, me);
      const id = esc(user.id);
      const name = `${esc(user.first_name)} ${esc(user.last_name)}`;
      return `
                <div class="col-sm-12 col-md-4 col-lg-3 mb-4">
                        <div class="card office-card">
                            <div class="card-body ${colour} office-card-body">
                                <div class="row">
                                    <div class="col-12 mp-0 my-2">
                                        <img class="avatar-office img-fluid" src="${avatarSrc(user.image_no)}" alt="">
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-12 my-2">
                                        <h2 class="card-heading-title">
                                            <button type="button" class="card-name-button stretched-link" data-bs-toggle="modal" data-bs-target="#user-modal-${id}" aria-haspopup="dialog">${name}</button>
                                        </h2>
                                        <p class="fw-bold fst-italic">(${esc(user.pronouns)})</p>
                                        ${
                                          panic
                                            ? `<p class="panic-flag"><i class="fas fa-exclamation-circle" aria-hidden="true"></i> Needs urgent help</p>`
                                            : ''
                                        }
                                    </div>
                                </div>
                                ${
                                  noffles.length
                                    ? `<ul class="list-unstyled noffle-icon-list" aria-label="Noffles">
                                    ${noffles
                                      .map(
                                        (noffle) => `
                                        <li>
                                            <i class="${esc(noffle.icon)} fa-lg noffle-icon" aria-hidden="true"></i>
                                            <span>${esc(noffle.name)}</span>
                                        </li>`,
                                      )
                                      .join('')}
                                </ul>`
                                    : ''
                                }
                            </div>
                        </div>
                </div>

                <!-- Modal -->
                <div class="modal fade" id="user-modal-${id}" tabindex="-1" aria-labelledby="user-modal-${id}-label" aria-hidden="true">
                    <div class="modal-dialog">
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
                                  panic
                                    ? `<p class="h5 text-uppercase">
                                        <b>${esc(user.first_name)} is in need of urgent help!</b>
                                    </p>`
                                    : ''
                                }
                                <b>Noffles:</b>
                                ${noffles.length ? '' : '<p>No Noffles to show.</p>'}
                                ${noffles
                                  .map(
                                    (noffle) => `
                                    <div class="card mt-2 p-3 border-black">
                                        <h3 class="h6">
                                            <i class="${esc(noffle.icon)} fa-2x noffle-icon" aria-hidden="true"></i>
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
}
