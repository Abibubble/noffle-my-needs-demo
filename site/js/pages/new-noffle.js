// Replaces the original /new_noffle route.
//
// If the name is already taken, the original went back to Manage Noffles with
// an error, and everything you'd typed was lost. Now the error shows next to
// the name field and your typing stays.

import { checkForm, clearErrorsOnInput, showError } from '../forms.js';
import { addFlash, go, setupPage } from '../layout.js';
import { addNoffle } from '../store.js';

const page = setupPage({ requires: 'admin' });

if (page) {
  const { state, save } = page;
  const form = document.getElementById('new-noffle-form');
  clearErrorsOnInput(form);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!checkForm(form)) return;
    const nameField = form.elements.name;
    const noffle = addNoffle(state, {
      name: nameField.value,
      description: form.elements.description.value,
      icon: form.elements.icon.value,
      permanent: form.elements.permanent.checked,
      isPrivate: form.elements.private.checked,
    });
    if (!noffle) {
      showError(
        nameField,
        `There's already a Noffle called "${nameField.value.trim()}". Choose a different name.`,
      );
      nameField.focus();
      return;
    }
    save();
    addFlash(`Noffle ${noffle.name} has been added`);
    go('manage-noffles.html');
  });
}
