// Replaces the original /profile, /update_user and /delete_account routes.
// There's no username or password in the demo, so those fields have gone.

import { avatarName, avatarPickerHtml, avatarSrc } from '../avatars.js';
import { checkForm, clearErrorsOnInput } from '../forms.js';
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
                                        <div class="col-9 offset-1"><h3 class="h5">${esc(noffle.name)}</h3></div>
                                    </div>
                                    <hr>
                                    <p class="card-text">${esc(noffle.description)}</p>
                                    <p class="card-text">This Noffle is ${noffle.private ? 'private' : 'public'}</p>
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
                        <a href="set-noffles.html" class="btn btn-close-modal tap-target">Set my Noffles</a>
                    </div>
                </div>`;

  const canDelete = !me.is_admin && !me.protected;

  document.getElementById('profile').innerHTML = `
    <h1 class="text-center">${esc(me.first_name)}'s Profile</h1>
    <hr>
    <div class="row pb-5">
        <div class="col-12 col-md-5 p-4 profile-form-area rounded">
            <h2 class="section-heading">Your Details</h2>
            <img class="avatar-profile" src="${avatarSrc(me.image_no)}" alt="Your avatar: ${avatarName(me.image_no)}">
            <div class="login-form profile-login-form rounded mx-auto mb-2">
                <form id="update-user-form" novalidate>
                    <p class="mb-4">All fields are required.</p>
                    <div class="form-group row mb-4">
                        <div class="col-2 center-icon"><i class="fas fa-2x fa-genderless" aria-hidden="true"></i></div>
                        <div class="col-10">
                            <label for="pronouns" class="form-label">Pronouns</label>
                            <p id="pronouns-hint" class="form-hint">For example, she/her, he/him or they/them</p>
                            <input id="pronouns" value="${esc(me.pronouns)}" name="pronouns" type="text" minlength="2" maxlength="40" class="form-control" aria-describedby="pronouns-hint" data-required-message="Enter pronouns, for example they/them" required>
                        </div>
                    </div>
                    ${avatarPickerHtml(me.image_no)}
                    <div class="row">
                        <button class="btn login-btn btn-green mt-3 tap-target" type="submit">Update Details</button>
                    </div>
                </form>
            </div>
        </div>
        <div class="col-12 col-md-6 offset-md-1 p-4 profile-form-area rounded">
            <h2 class="section-heading">Your Noffles</h2>
            ${noffleCards}
        </div>
    </div>
    ${
      canDelete
        ? `
    <div class="row">
        <div class="col-12 text-center">
            <button type="button" class="btn btn-primary btn-delete mt-5 tap-target" data-bs-toggle="modal" data-bs-target="#delete-modal" aria-haspopup="dialog">
                Remove This Demo Person
            </button>
        </div>
    </div>`
        : ''
    }

    <!-- Modal -->
    <div class="modal fade" id="delete-modal" tabindex="-1" aria-labelledby="delete-modal-label" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title" id="delete-modal-label">Remove This Demo Person</h2>
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
                    <button type="button" id="delete-account" class="btn btn-primary btn-delete tap-target">Remove Person</button>
                </div>
            </div>
        </div>
    </div>`;

  const updateForm = document.getElementById('update-user-form');
  clearErrorsOnInput(updateForm);
  updateForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!checkForm(event.target)) return;
    updatePerson(state, me.id, Object.fromEntries(new FormData(event.target)));
    save();
    addFlash('Your details have been updated');
    go('profile.html');
  });

  document.getElementById('delete-account').addEventListener('click', () => {
    if (!canDelete) return;
    deletePerson(state, me.id);
    save();
    addFlash('User Successfully Deleted');
    go('choose.html');
  });
}
