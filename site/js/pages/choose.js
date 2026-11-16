// Replaces the original /login and /register routes.

import { avatarPickerHtml, avatarSrc } from '../avatars.js';
import { checkForm, clearErrorsOnInput } from '../forms.js';
import { addFlash, esc, go, setupPage } from '../layout.js';
import { resetState } from '../persist.js';
import { addPerson, choosePerson, fullName, greeting } from '../store.js';

const page = setupPage();

if (page) {
  const { state, me, save } = page;

  if (me) {
    const viewingAs = document.getElementById('viewing-as');
    viewingAs.textContent = `You're viewing as ${fullName(me)}. Choose someone else to switch.`;
    viewingAs.hidden = false;
  }

  document.getElementById('avatar-picker').innerHTML = avatarPickerHtml();

  const list = document.getElementById('person-list');
  list.innerHTML = state.people
    .map(
      (person) => `
                    <li class="col-12 col-md-6 col-lg-4 mb-3">
                        <button type="button" class="person-button" data-person-id="${esc(person.id)}">
                            <img src="${avatarSrc(person.image_no)}" alt="">
                            <span>
                                <strong>${esc(fullName(person))}</strong> (${esc(person.pronouns)})
                                ${person.is_admin ? '<br>Admin' : ''}
                                ${me && me.id === person.id ? "<br>You're viewing as this person" : ''}
                            </span>
                        </button>
                    </li>`,
    )
    .join('');

  list.addEventListener('click', (event) => {
    const button = event.target.closest('[data-person-id]');
    if (!button) return;
    const person = choosePerson(state, button.dataset.personId);
    if (!person) return;
    save();
    addFlash(greeting(person.first_name));
    go('set-noffles.html');
  });

  const addPersonForm = document.getElementById('add-person-form');
  clearErrorsOnInput(addPersonForm);
  addPersonForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!checkForm(event.target)) return;
    const data = Object.fromEntries(new FormData(event.target));
    const person = addPerson(state, data);
    choosePerson(state, person.id);
    save();
    addFlash(`Hi, ${person.first_name}. Welcome to Noffle My Needs.`);
    go('profile.html');
  });

  document.getElementById('reset-demo').addEventListener('click', () => {
    resetState();
    addFlash('The demo has been reset');
    go('choose.html');
  });
}
