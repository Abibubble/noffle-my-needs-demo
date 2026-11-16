import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { PANIC_ID } from '../../site/js/data.js';
import {
  addNoffle,
  addPerson,
  choosePerson,
  currentPerson,
  deleteNoffle,
  deletePerson,
  freshState,
  greeting,
  groupNoffles,
  hasPanic,
  switchOut,
  toggleAdmin,
  toggleNoffle,
  updatePerson,
  validateState,
  visibleNoffles,
} from '../../site/js/store.js';

describe('freshState', () => {
  it('starts with sample data and nobody chosen', () => {
    const state = freshState();
    assert.ok(state.people.length > 0);
    assert.ok(state.noffles.length > 0);
    assert.equal(state.currentId, null);
  });

  it('gives a new copy each time, so changes never touch the sample data', () => {
    const a = freshState();
    a.people[0].first_name = 'Changed';
    assert.notEqual(freshState().people[0].first_name, 'Changed');
  });

  it('has exactly one protected admin', () => {
    const admins = freshState().people.filter((p) => p.is_admin);
    assert.equal(admins.length, 1);
    assert.equal(admins[0].protected, true);
  });

  it('only refers to noffles that exist', () => {
    const state = freshState();
    const ids = new Set(state.noffles.map((n) => n.id));
    for (const person of state.people) {
      for (const id of person.noffles) assert.ok(ids.has(id), `${person.id} has unknown ${id}`);
    }
  });
});

describe('validateState', () => {
  it('accepts a fresh state', () => {
    assert.ok(validateState(freshState()));
  });

  it('rejects missing, old or broken data', () => {
    assert.equal(validateState(null), null);
    assert.equal(validateState('text'), null);
    assert.equal(validateState({ ...freshState(), version: 0 }), null);
    assert.equal(validateState({ ...freshState(), people: 'nope' }), null);
    assert.equal(validateState({ ...freshState(), people: [{ id: 1 }] }), null);
  });
});

describe('choosing and switching people', () => {
  it('chooses a person by id', () => {
    const state = freshState();
    assert.equal(choosePerson(state, 'sam').first_name, 'Sam');
    assert.equal(currentPerson(state).id, 'sam');
  });

  it('ignores an unknown id', () => {
    const state = freshState();
    assert.equal(choosePerson(state, 'nobody'), null);
    assert.equal(state.currentId, null);
  });

  it('clears temporary noffles but keeps permanent ones when switching out', () => {
    const state = freshState();
    choosePerson(state, 'sam');
    // Sam has a permanent noffle (written-instructions) and a temporary one (on-a-break).
    const person = switchOut(state);
    assert.deepEqual(person.noffles, ['written-instructions']);
    assert.equal(state.currentId, null);
  });
});

describe('toggleNoffle', () => {
  it('adds and then removes a noffle', () => {
    const state = freshState();
    assert.equal(toggleNoffle(state, 'tom', 'speak-up'), 'added');
    assert.ok(state.people.find((p) => p.id === 'tom').noffles.includes('speak-up'));
    assert.equal(toggleNoffle(state, 'tom', 'speak-up'), 'removed');
    assert.ok(!state.people.find((p) => p.id === 'tom').noffles.includes('speak-up'));
  });

  it('turns the panic state on and off', () => {
    const state = freshState();
    const tom = state.people.find((p) => p.id === 'tom');
    assert.equal(hasPanic(tom), false);
    toggleNoffle(state, 'tom', PANIC_ID);
    assert.equal(hasPanic(tom), true);
  });

  it('returns null for an unknown person or noffle', () => {
    const state = freshState();
    assert.equal(toggleNoffle(state, 'nobody', 'speak-up'), null);
    assert.equal(toggleNoffle(state, 'tom', 'nothing'), null);
  });
});

describe('visibleNoffles', () => {
  it('hides private noffles from other non-admin people', () => {
    const state = freshState();
    const rowan = state.people.find((p) => p.id === 'rowan');
    const sam = state.people.find((p) => p.id === 'sam');
    const names = visibleNoffles(state, rowan, sam).map((n) => n.id);
    assert.ok(!names.includes('low-energy'));
    assert.ok(names.includes('focus-time'));
  });

  it('shows private noffles to the person who set them and to admins', () => {
    const state = freshState();
    const rowan = state.people.find((p) => p.id === 'rowan');
    const alex = state.people.find((p) => p.id === 'alex');
    assert.ok(visibleNoffles(state, rowan, rowan).some((n) => n.id === 'low-energy'));
    assert.ok(visibleNoffles(state, rowan, alex).some((n) => n.id === 'low-energy'));
  });
});

describe('groupNoffles', () => {
  it('puts permanent noffles and the panic button in the first group', () => {
    const { permanent, temporary } = groupNoffles(freshState());
    assert.ok(permanent.some((n) => n.id === PANIC_ID));
    assert.ok(permanent.every((n) => n.permanent || n.id === PANIC_ID));
    assert.ok(temporary.every((n) => !n.permanent && n.id !== PANIC_ID));
  });
});

describe('people', () => {
  it('adds a person with no username or password', () => {
    const state = freshState();
    const person = addPerson(state, {
      first_name: ' Kit ',
      last_name: 'Jones',
      pronouns: 'they/them',
      image_no: '5',
    });
    assert.equal(person.first_name, 'Kit');
    assert.equal(person.image_no, 5);
    assert.equal(person.is_admin, false);
    assert.ok(!('password' in person));
    assert.ok(!('username' in person));
  });

  it('updates only the allowed fields', () => {
    const state = freshState();
    updatePerson(state, 'sam', { pronouns: 'he/they', image_no: '8', is_admin: true });
    const sam = state.people.find((p) => p.id === 'sam');
    assert.equal(sam.pronouns, 'he/they');
    assert.equal(sam.image_no, 8);
    assert.equal(sam.is_admin, false);
  });

  it('deletes a person and clears them as the current person', () => {
    const state = freshState();
    choosePerson(state, 'sam');
    deletePerson(state, 'sam');
    assert.equal(state.people.some((p) => p.id === 'sam'), false);
    assert.equal(state.currentId, null);
  });

  it("won't delete or change admin rights for the protected admin", () => {
    const state = freshState();
    assert.equal(deletePerson(state, 'alex'), null);
    assert.equal(toggleAdmin(state, 'alex'), null);
    assert.equal(state.people.find((p) => p.id === 'alex').is_admin, true);
  });

  it('gives and removes admin rights', () => {
    const state = freshState();
    assert.equal(toggleAdmin(state, 'sam').is_admin, true);
    assert.equal(toggleAdmin(state, 'sam').is_admin, false);
  });
});

describe('noffles', () => {
  it('adds a new noffle', () => {
    const state = freshState();
    const noffle = addNoffle(state, {
      name: 'Standing desk',
      description: 'I need a standing desk',
      icon: 'fas fa-chair',
      permanent: true,
      isPrivate: false,
    });
    assert.equal(noffle.name, 'Standing desk');
    assert.equal(noffle.permanent, true);
    assert.equal(noffle.private, false);
  });

  it("won't add a noffle with a name that already exists", () => {
    const state = freshState();
    const result = addNoffle(state, {
      name: 'please SPEAK up',
      description: 'x',
      icon: 'fas fa-x',
    });
    assert.equal(result, null);
  });

  it('deletes a noffle and removes it from everyone', () => {
    const state = freshState();
    deleteNoffle(state, 'speak-up');
    assert.equal(state.noffles.some((n) => n.id === 'speak-up'), false);
    assert.ok(state.people.every((p) => !p.noffles.includes('speak-up')));
  });
});

describe('greeting', () => {
  it('changes with the time of day', () => {
    assert.equal(greeting('Sam', new Date(2021, 8, 10, 9)), 'Good Morning, Sam');
    assert.equal(greeting('Sam', new Date(2021, 8, 10, 14)), 'Good Afternoon, Sam');
    assert.equal(greeting('Sam', new Date(2021, 8, 10, 20)), 'Good Evening, Sam');
  });
});
