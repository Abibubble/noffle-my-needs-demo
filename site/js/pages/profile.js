// Replaces the original /profile, /update_user and /delete_account routes.
// There's no username or password in the demo, so those fields have gone.

import { avatarSrc, renderCarousel } from '../avatars.js';
import { addFlash, esc, go, setupPage } from '../layout.js';
import { PANIC_ID } from '../data.js';
import { deletePerson, noffleList, updatePerson } from '../store.js';

const page = setupPage({ requires: 'person' });

function cardColour(noffle) {
  if (noffle.permanent) return 'btn-yellow';
  if (noffle.id === PANIC_ID) return 'btn-red';
  return 'btn-blue';
}

if (page) {
  const { state, me, save } = page;
  const noffles = noffleList(state, me);

  const noffleCards = noffles.length
    ? `
                <div class="row">
                    ${noffles
                      .map(
                        (noffle) => `
                        <div class="col-sm-12 col-lg-6 mb-2">
                            <div class="card noffle-card">
                                <div class="card-body ${cardColour(noffle)}">
                                    <div class="row card-title">
                                        <div class="col-2"><i class="${esc(noffle.icon)} fa-2x noffle-icon"></i></div>
                                        <div class="col-9 offset-1"><h5>${esc(noffle.name)}</h5></div>
                                    </div>
                                    <hr>
                                    <p class="card-text">${esc(noffle.description)}</p>
                                    <i class="fas fa-exclamation-circle"></i>
                                    <input id="private" type="checkbox"${noffle.private ? ' checked' : ''}>
                                    <label for="private">Private</label>
                                    <br>
                                </div>
                            </div>
                        </div>`,
                      )
                      .join('')}
                </div>`
    : `
                <div class="row">
                    <div class="col-12 mb-5">
                        <h3 class="text-danger">You haven't got any Noffles set!</h3>
                        <p>Set your Noffles now!</p>
                        <a role="button" href="set-noffles.html" class="btn btn-close-modal tap-target">Set my Noffles</a>
                    </div>
                </div>`;

  const canDelete = !me.is_admin && !me.protected;

  document.getElementById('profile').innerHTML = `
    <h2 class="text-center">${esc(me.first_name)}'s Profile</h2>
    <hr>
    <div class="row pb-5">
        <div class="col-12 col-md-5 p-4 profile-form-area rounded">
            <img class="avatar-profile" src="${avatarSrc(me.image_no)}" alt="Icon for ${esc(me.first_name)}">
            <div class="login-form profile-login-form rounded mx-auto mb-2">
                <form id="update-user-form">
                    <div class="form-group row mb-4">
                        <div class="col-2 center-icon"><i class="fas fa-2x fa-genderless"></i></div>
                        <label for="pronouns" class="sr-only">Pronouns</label>
                        <div class="col-10">
                            <input id="pronouns" value="${esc(me.pronouns)}" name="pronouns" type="text" minlength="5" maxlength="40" class="form-control" placeholder="Pronouns - (she/her, he/him, they/them)" required>
                        </div>
                    </div>
                    <div class="form-group row mb-4">
                        <div class="col-2 center-icon"><i class="fas fa-2x fa-image"></i></div>
                        <label for="image_no" class="sr-only">Image Number</label>
                        <div class="col-10">
                            <input id="image_no" value="${esc(me.image_no)}" name="image_no" placeholder="Avatar image number" min="1" max="13" type="number" class="form-control" required>
                        </div>
                    </div>
                    <div class="row">
                        <button name="login" id="login" class="btn login-btn btn-green mt-3 tap-target" type="submit">Update Details</button>
                    </div>
                </form>
            </div>
        </div>
        <div class="col-12 col-md-6 offset-md-1 p-4 profile-form-area rounded">
            ${noffleCards}
        </div>
    </div>
    ${
      canDelete
        ? `
    <div class="row">
        <div class="col-12 text-center">
            <button type="button" class="btn btn-primary btn-delete mt-5 tap-target" data-bs-toggle="modal" data-bs-target="#delete-modal">
                Remove This Demo Person
            </button>
        </div>
    </div>`
        : ''
    }
    <div class="row">
        <div class="col-sm-12 col-md-6 offset-md-3" id="avatar-carousel"></div>
    </div>

    <!-- Modal -->
    <div class="modal fade" id="delete-modal" tabindex="-1" role="dialog" aria-labelledby="delete-modal-label" aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="delete-modal-label">Remove This Demo Person</h5>
                    <button type="button" class="close tap-target" data-bs-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true"><i class="fas fa-2x fa-times"></i></span>
                    </button>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to remove ${esc(me.first_name)} from the demo?</p>
                    <p>You can get the sample colleagues back by resetting the demo.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary btn-close-modal tap-target" data-bs-dismiss="modal">Close</button>
                    <a href="#" id="delete-account" role="button" class="btn btn-primary btn-delete tap-target">Remove Person</a>
                </div>
            </div>
        </div>
    </div>`;

  renderCarousel(document.getElementById('avatar-carousel'), 'h4');

  document.getElementById('update-user-form').addEventListener('submit', (event) => {
    event.preventDefault();
    updatePerson(state, me.id, Object.fromEntries(new FormData(event.target)));
    save();
    addFlash('Your details have been updated');
    go('profile.html');
  });

  document.getElementById('delete-account').addEventListener('click', (event) => {
    event.preventDefault();
    if (!canDelete) return;
    deletePerson(state, me.id);
    save();
    addFlash('User Successfully Deleted');
    go('choose.html');
  });
}
