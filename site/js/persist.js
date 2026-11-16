// Saves the demo's data in the visitor's own browser.
// Every storage call is wrapped in try/catch, because storage can be blocked
// (for example in some private windows). The demo still works without it,
// but it can't remember changes between pages.

import { freshState, validateState } from './store.js';

const STATE_KEY = 'noffle-my-needs-demo';
const FLASH_KEY = 'noffle-my-needs-demo-flash';
const FALLBACK_PERSON = 'sam';

function canUse(getStore) {
  try {
    const store = getStore();
    const key = '__noffle_test__';
    store.setItem(key, key);
    store.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export const storageAvailable = canUse(() => localStorage);
const sessionAvailable = canUse(() => sessionStorage);
const memoryFlashes = [];

export function loadState() {
  let state = null;
  if (storageAvailable) {
    try {
      state = validateState(JSON.parse(localStorage.getItem(STATE_KEY)));
    } catch {
      state = null;
    }
  }
  state ??= freshState();
  // Without storage, nobody can be chosen across pages, so show a sample person.
  if (!storageAvailable && !state.currentId) state.currentId = FALLBACK_PERSON;
  return state;
}

export function saveState(state) {
  if (!storageAvailable) return false;
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function resetState() {
  try {
    localStorage.removeItem(STATE_KEY);
  } catch {
    // Nothing saved, so nothing to reset.
  }
  return loadState();
}

// Flash messages replace Flask's flash(). They're kept until the next page shows them.
export function addFlash(message, category = 'info') {
  const flashes = takeFlashes();
  flashes.push({ message, category });
  if (sessionAvailable) {
    try {
      sessionStorage.setItem(FLASH_KEY, JSON.stringify(flashes));
      return;
    } catch {
      // Fall through to memory.
    }
  }
  memoryFlashes.splice(0, memoryFlashes.length, ...flashes);
}

export function takeFlashes() {
  if (sessionAvailable) {
    try {
      const flashes = JSON.parse(sessionStorage.getItem(FLASH_KEY)) ?? [];
      sessionStorage.removeItem(FLASH_KEY);
      return Array.isArray(flashes) ? flashes : [];
    } catch {
      return [];
    }
  }
  return memoryFlashes.splice(0, memoryFlashes.length);
}
