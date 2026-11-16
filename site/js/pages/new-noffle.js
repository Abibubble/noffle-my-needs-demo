// Replaces the original /new_noffle route.

import { addFlash, go, setupPage } from '../layout.js';
import { addNoffle } from '../store.js';

const page = setupPage({ requires: 'admin' });

if (page) {
  const { state, save } = page;

  document.getElementById('new-noffle-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.target;
    const name = form.elements.name.value;
    const noffle = addNoffle(state, {
      name,
      description: form.elements.description.value,
      icon: form.elements.icon.value,
      permanent: form.elements.permanent.checked,
      isPrivate: form.elements.private.checked,
    });
    if (!noffle) {
      addFlash(`Noffle ${name} already exists`, 'error');
      go('manage-noffles.html');
      return;
    }
    save();
    addFlash(`Noffle ${noffle.name} has been added`);
    go('manage-noffles.html');
  });
}
