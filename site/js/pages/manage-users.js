// Replaces the original /manage_users, /admin_toggle, /admin_update_user
// and /delete_user routes.
//
// The team's "Modify User" pop-up opened and closed with inline styles, so focus
// stayed behind it and Escape didn't close it. Now it's a Bootstrap modal, like
// the Office pop-ups (WCAG 2.4.3 Focus Order). The admin and delete controls were
// links with href="#" acting as buttons, and are now real buttons (WCAG 4.1.2).
// Deleting a user now asks you to confirm first (WCAG 3.3.4).

import { avatarSrc } from '../avatars.js';
import { checkForm, clearErrorsOnInput } from '../forms.js';
import { addFlash, esc, go, setupPage } from '../layout.js';
import {
  deletePerson,
  findPerson,
  fullName,
  toggleAdmin,
  updatePerson,
  visibleNoffles,
} from '../store.js';

const page = setupPage({ requires: 'admin' });

function controlsHtml(user) {
  if (user.protected) return '';
  const id = esc(user.id);
  const name = esc(fullName(user));
  const adminButton = user.is_admin
    ? `<button type="button" class="btn btn-blue btn-sm w-100 tap-target" data-toggle-admin="${id}" aria-label="Remove admin rights from ${name}">
                                <i class="fas fa-lock-open" aria-hidden="true"></i> Remove admin rights
                            </button>`
    : `<button type="button" class="btn btn-green btn-sm w-100 tap-target" data-toggle-admin="${id}" aria-label="Make user admin: ${name}">
                                <i class="fas fa-lock" aria-hidden="true"></i> Make user admin
                            </button>`;
  return `
                            ${adminButton}
                            <button type="button" class="btn btn-red btn-sm w-100 mt-2 tap-target" data-bs-toggle="modal" data-bs-target="#modal-${id}" aria-haspopup="dialog" aria-label="Modify User: ${name}">
                                Modify User
                            </button>`;
}

function modalHtml(user) {
  if (user.protected) return '';
  const id = esc(user.id);
  const name = esc(fullName(user));
  return `
            <div class="modal fade" tabindex="-1" id="modal-${id}" aria-labelledby="modal-${id}-title" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2 class="modal-title" id="modal-${id}-title">Modify user ${esc(user.first_name)}</h2>
                            <button type="button" class="close tap-target" aria-label="Close" data-bs-dismiss="modal">
                                <span aria-hidden="true"><i class="fas fa-2x fa-times"></i></span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="login-form profile-login-form rounded mx-auto mb-2">
                                <form data-update-user="${id}" novalidate>
                                    <div class="form-group row mb-4">
                                        <div class="col-2 center-icon"><i class="fas fa-2x fa-address-card" aria-hidden="true"></i></div>
                                        <div class="col-10">
                                            <label for="first_name-${id}" class="form-label">First name</label>
                                            <input id="first_name-${id}" value="${esc(user.first_name)}" name="first_name" class="form-control" type="text" maxlength="50" autocomplete="off" data-required-message="Enter a first name" required>
                                        </div>
                                    </div>
                                    <div class="form-group row mb-4">
                                        <div class="col-2 center-icon"><i class="fas fa-2x fa-address-card" aria-hidden="true"></i></div>
                                        <div class="col-10">
                                            <label for="last_name-${id}" class="form-label">Last name</label>
                                            <input id="last_name-${id}" value="${esc(user.last_name)}" name="last_name" type="text" class="form-control" maxlength="50" autocomplete="off" data-required-message="Enter a last name" required>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <button class="btn login-btn btn-green mt-3 tap-target" type="submit">Update Details</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-blue tap-target" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-delete tap-target" data-ask-delete="${id}" aria-expanded="false" aria-controls="confirm-delete-${id}">
                                Delete User
                            </button>
                            <div class="delete-confirm w-100" id="confirm-delete-${id}" hidden>
                                <p id="confirm-delete-text-${id}" tabindex="-1">
                                    <strong>Delete ${name}?</strong> You can't undo this, except by resetting the whole demo.
                                </p>
                                <div class="d-flex gap-2 justify-content-end">
                                    <button type="button" class="btn btn-blue tap-target" data-cancel-delete="${id}">Cancel</button>
                                    <button type="button" class="btn btn-red tap-target" data-delete-user="${id}">Yes, delete ${name}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
}

if (page) {
  const { state, me, save } = page;
  const list = document.getElementById('user-list');
  const modals = document.getElementById('user-modals');

  list.innerHTML = state.people
    .map((user) => {
      const noffles = visibleNoffles(state, user, me);
      return `
                <div class="col-sm-12 col-md-4 col-lg-3 mb-4">
                    <div class="card user-card border-dark pt-1">
                        <img class="card-img-top" src="${avatarSrc(user.image_no)}" alt="Icon for ${esc(user.first_name)}">
                        <div class="card-header">
                            <h2 class="card-title card-heading-title">
                                Name: ${esc(user.first_name)} ${esc(user.last_name)} (${esc(user.pronouns)})
                            </h2>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <details>
                                    <summary>Noffles</summary>
                                    <ul>
                                        ${noffles
                                          .map(
                                            (noffle) => `
                                        <li class="mb-2">
                                            <i class="${esc(noffle.icon)}"></i>
                                            <strong>${esc(noffle.name)}</strong> - ${esc(noffle.description)}
                                        </li>`,
                                          )
                                          .join('')}
                                    </ul>
                                </details>
                            </div>
                            ${controlsHtml(user)}
                        </div>
                    </div>
                </div>`;
    })
    .join('');

  modals.innerHTML = state.people.map(modalHtml).join('');

  list.addEventListener('click', (event) => {
    const adminButton = event.target.closest('[data-toggle-admin]');
    if (!adminButton) return;
    const user = toggleAdmin(state, adminButton.dataset.toggleAdmin);
    if (!user) return;
    save();
    addFlash(user.is_admin ? 'User Admin Rights Added' : 'User Admin Rights Removed');
    go(user.id === me.id ? 'office.html' : 'manage-users.html');
  });

  function showConfirm(id, show) {
    const ask = modals.querySelector(`[data-ask-delete="${CSS.escape(id)}"]`);
    const confirm = document.getElementById(`confirm-delete-${id}`);
    confirm.hidden = !show;
    ask.setAttribute('aria-expanded', String(show));
    if (show) document.getElementById(`confirm-delete-text-${id}`).focus();
    else ask.focus();
  }

  modals.addEventListener('click', (event) => {
    const ask = event.target.closest('[data-ask-delete]');
    if (ask) {
      showConfirm(ask.dataset.askDelete, true);
      return;
    }
    const cancel = event.target.closest('[data-cancel-delete]');
    if (cancel) {
      showConfirm(cancel.dataset.cancelDelete, false);
      return;
    }
    const deleteButton = event.target.closest('[data-delete-user]');
    if (deleteButton) {
      const user = deletePerson(state, deleteButton.dataset.deleteUser);
      if (!user) return;
      save();
      addFlash('User Successfully Deleted');
      go(user.id === me.id ? 'choose.html' : 'manage-users.html');
    }
  });

  // Closing the pop-up puts the delete step back to the start.
  modals.addEventListener('hidden.bs.modal', (event) => {
    const confirm = event.target.querySelector('.delete-confirm');
    if (confirm) confirm.hidden = true;
    event.target.querySelector('[data-ask-delete]')?.setAttribute('aria-expanded', 'false');
  });

  clearErrorsOnInput(modals);
  modals.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-update-user]');
    if (!form) return;
    event.preventDefault();
    if (!checkForm(form)) return;
    const user = findPerson(state, form.dataset.updateUser);
    updatePerson(state, user.id, {
      first_name: form.elements.first_name.value,
      last_name: form.elements.last_name.value,
    });
    save();
    addFlash(`${user.first_name} ${user.last_name} has been updated`);
    go('manage-users.html');
  });
}
