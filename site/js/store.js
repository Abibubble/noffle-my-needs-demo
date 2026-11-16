// The demo's data logic. These functions work on a plain state object, so
// they can be unit tested without a browser. Saving lives in persist.js.
//
// They replace the routes in the original app.py, which read and wrote MongoDB.

import { PANIC_ID, SAMPLE_NOFFLES, SAMPLE_PEOPLE } from './data.js';

export const STATE_VERSION = 1;

export function freshState() {
  return {
    version: STATE_VERSION,
    noffles: structuredClone(SAMPLE_NOFFLES),
    people: structuredClone(SAMPLE_PEOPLE),
    currentId: null,
  };
}

// Checks that saved data has the shape we expect, so a broken or old save
// can't break the page. Returns null if it isn't usable.
export function validateState(value) {
  if (!value || typeof value !== 'object') return null;
  if (value.version !== STATE_VERSION) return null;
  if (!Array.isArray(value.noffles) || !Array.isArray(value.people)) return null;
  const peopleOk = value.people.every(
    (p) => p && typeof p.id === 'string' && Array.isArray(p.noffles),
  );
  const nofflesOk = value.noffles.every((n) => n && typeof n.id === 'string');
  if (!peopleOk || !nofflesOk) return null;
  return value;
}

export function newId(prefix) {
  const random =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`;
}

export function findPerson(state, id) {
  return state.people.find((p) => p.id === id) ?? null;
}

export function findNoffle(state, id) {
  return state.noffles.find((n) => n.id === id) ?? null;
}

export function currentPerson(state) {
  return state.currentId ? findPerson(state, state.currentId) : null;
}

export function fullName(person) {
  return `${person.first_name} ${person.last_name}`;
}

export function hasPanic(person) {
  return person.noffles.includes(PANIC_ID);
}

// A person's noffles, in the order they set them.
export function noffleList(state, person) {
  return person.noffles.map((id) => findNoffle(state, id)).filter(Boolean);
}

// The noffles the viewer is allowed to see. Private noffles are only shown
// to the person who set them and to admins.
export function visibleNoffles(state, person, viewer) {
  const canSeePrivate = Boolean(viewer && (viewer.is_admin || viewer.id === person.id));
  return noffleList(state, person).filter((n) => canSeePrivate || !n.private);
}

// Permanent noffles and the panic button go in the first group, like the original.
export function groupNoffles(state) {
  const permanent = [];
  const temporary = [];
  for (const noffle of state.noffles) {
    if (noffle.permanent || noffle.id === PANIC_ID) permanent.push(noffle);
    else temporary.push(noffle);
  }
  return { permanent, temporary };
}

export function greeting(name, date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return `Good Morning, ${name}`;
  if (hour < 18) return `Good Afternoon, ${name}`;
  return `Good Evening, ${name}`;
}

export function choosePerson(state, id) {
  const person = findPerson(state, id);
  if (!person) return null;
  state.currentId = id;
  return person;
}

// Replaces /logout. Like the original, temporary noffles are cleared.
export function switchOut(state) {
  const person = currentPerson(state);
  if (person) {
    person.noffles = person.noffles.filter((id) => findNoffle(state, id)?.permanent);
  }
  state.currentId = null;
  return person;
}

// Replaces /add_noffle. Returns 'added' or 'removed'.
export function toggleNoffle(state, personId, noffleId) {
  const person = findPerson(state, personId);
  if (!person || !findNoffle(state, noffleId)) return null;
  if (person.noffles.includes(noffleId)) {
    person.noffles = person.noffles.filter((id) => id !== noffleId);
    return 'removed';
  }
  person.noffles.push(noffleId);
  return 'added';
}

// Replaces /register. No username or password: the demo has no accounts.
export function addPerson(state, { first_name, last_name, pronouns, image_no }) {
  const person = {
    id: newId('person'),
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    pronouns: pronouns.trim(),
    image_no: Number(image_no),
    is_admin: false,
    noffles: [],
  };
  state.people.push(person);
  return person;
}

// Replaces /update_user and /admin_update_user.
export function updatePerson(state, id, changes) {
  const person = findPerson(state, id);
  if (!person) return null;
  for (const key of ['first_name', 'last_name', 'pronouns']) {
    if (typeof changes[key] === 'string') person[key] = changes[key].trim();
  }
  if (changes.image_no !== undefined) person.image_no = Number(changes.image_no);
  return person;
}

// Replaces /delete_user and /delete_account.
export function deletePerson(state, id) {
  const person = findPerson(state, id);
  if (!person || person.protected) return null;
  state.people = state.people.filter((p) => p.id !== id);
  if (state.currentId === id) state.currentId = null;
  return person;
}

// Replaces /admin_toggle.
export function toggleAdmin(state, id) {
  const person = findPerson(state, id);
  if (!person || person.protected) return null;
  person.is_admin = !person.is_admin;
  return person;
}

// Replaces /new_noffle. Returns null if a noffle with that name already exists.
export function addNoffle(state, { name, description, icon, permanent, isPrivate }) {
  const trimmed = name.trim();
  const exists = state.noffles.some((n) => n.name.toLowerCase() === trimmed.toLowerCase());
  if (exists) return null;
  const noffle = {
    id: newId('noffle'),
    name: trimmed,
    description: description.trim(),
    icon: icon.trim(),
    permanent: Boolean(permanent),
    private: Boolean(isPrivate),
  };
  state.noffles.push(noffle);
  return noffle;
}

// Replaces /delete_noffle. Also removes the noffle from everyone who set it.
export function deleteNoffle(state, id) {
  const noffle = findNoffle(state, id);
  if (!noffle) return null;
  state.noffles = state.noffles.filter((n) => n.id !== id);
  for (const person of state.people) {
    person.noffles = person.noffles.filter((nid) => nid !== id);
  }
  return noffle;
}
