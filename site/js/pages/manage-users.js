// Replaces the original /manage_users, /admin_toggle, /admin_update_user
// and /delete_user routes. The team's "Modify User" pop-up opened and closed
// with inline styles, and that's kept here.

import { avatarSrc } from '../avatars.js';
import { addFlash, esc, go, setupPage } from '../layout.js';
import { deletePerson, findPerson, toggleAdmin, updatePerson, visibleNoffles } from '../store.js';

const page = setupPage({ requires: 'admin' });

if (page) {
  const { state, me, save } = page;
  const list = document.getElementById('user-list');

  list.innerHTML = state.people
    .map((user) => {
      const id = esc(user.id);
      const noffles = visibleNoffles(state, user, me);
      const controls = user.protected
        ? ''
        : `
                            ${
                              user.is_admin
                                ? `<a role="button" class="btn btn-blue btn-sm w-100 tap-target" href="#" data-toggle-admin="${id}">
                                <div class="mt-1">
                                    <i class="fas fa-lock-open"></i> Remove admin rights
                                </div>
                            </a>`
                                : `<a role="button" class="btn btn-green btn-sm w-100 tap-target" href="#" data-toggle-admin="${id}">
                                <div class="mt-1">
                                    <i class="fas fa-lock"></i> Make user admin
                                </div>
                            </a>`
                            }

                            <!-- Create a unique delete button and modal for each user -->
                            <button data-open-modal="modal-${id}" class="btn btn-red btn-sm w-100 mt-2 tap-target">
                                Modify User
                            </button>

                            <!-- Modal for each user-->
                            <div class="modal" tabindex="-1" role="dialog" id="modal-${id}">
                                <div class="modal-dialog" role="document">
                                    <div class="modal-content">
                                        <div class="modal-header">
                                            <h4 class="modal-title">Modify user ${esc(user.first_name)}</h4>
                                            <button type="button" class="close tap-target" aria-label="Close" data-close-modal="modal-${id}">
                                                <span aria-hidden="true"><i class="fas fa-2x fa-times"></i></span>
                                            </button>
                                        </div>
                                        <div class="modal-body">
                                            <div class="login-form profile-login-form rounded mx-auto mb-2">
                                                <form data-update-user="${id}">
                                                    <div class="form-group row mb-4">
                                                        <div class="col-2 center-icon"><i class="fas fa-2x fa-address-card"></i></div>
                                                        <label for="first_name" class="sr-only">First Name</label>
                                                        <div class="col-10">
                                                            <input id="first_name" value="${esc(user.first_name)}" name="first_name" placeholder="First Name" class="form-control" type="text" minlength="3" maxlength="20" required>
                                                        </div>
                                                    </div>
                                                    <div class="form-group row mb-4">
                                                        <div class="col-2 center-icon"><i class="fas fa-2x fa-address-card"></i></div>
                                                        <label for="last_name" class="sr-only">Last Name</label>
                                                        <div class="col-10">
                                                            <input id="last_name" value="${esc(user.last_name)}" name="last_name" placeholder="Last Name" type="text" class="form-control" minlength="2" maxlength="40" required>
                                                        </div>
                                                    </div>
                                                    <div class="row">
                                                        <button name="login" id="login" class="btn login-btn btn-green mt-3 tap-target" type="submit">Update Details</button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                        <div class="modal-footer">
                                            <p>Delete user?</p>
                                            <button type="button" data-close-modal="modal-${id}" class="btn btn-blue tap-target">
                                                Cancel
                                            </button>
                                            <a type="button" href="#" data-delete-user="${id}" class="btn btn-delete tap-target">
                                                Delete User
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>`;

      return `
                <div class="col-sm-12 col-md-4 col-lg-3 mb-4">
                    <div class="card user-card border-dark pt-1">
                        <img class="card-img-top" src="${avatarSrc(user.image_no)}" alt="Icon for ${esc(user.first_name)}">
                        <div class="card-header">
                            <h3 class="card-title card-heading-title">
                                Name: ${esc(user.first_name)} ${esc(user.last_name)} (${esc(user.pronouns)})
                            </h3>
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
                            ${controls}
                        </div>
                    </div>
                </div>`;
    })
    .join('');

  list.addEventListener('click', (event) => {
    const open = event.target.closest('[data-open-modal]');
    if (open) {
      document.getElementById(open.dataset.openModal).style.display = 'block';
      return;
    }
    const close = event.target.closest('[data-close-modal]');
    if (close) {
      document.getElementById(close.dataset.closeModal).style.display = 'none';
      return;
    }
    const adminLink = event.target.closest('[data-toggle-admin]');
    if (adminLink) {
      event.preventDefault();
      const user = toggleAdmin(state, adminLink.dataset.toggleAdmin);
      if (!user) return;
      save();
      addFlash(user.is_admin ? 'User Admin Rights Added' : 'User Admin Rights Removed');
      go(user.id === me.id ? 'office.html' : 'manage-users.html');
      return;
    }
    const deleteLink = event.target.closest('[data-delete-user]');
    if (deleteLink) {
      event.preventDefault();
      const user = deletePerson(state, deleteLink.dataset.deleteUser);
      if (!user) return;
      save();
      addFlash('User Successfully Deleted');
      go(user.id === me.id ? 'choose.html' : 'manage-users.html');
    }
  });

  list.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-update-user]');
    if (!form) return;
    event.preventDefault();
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
