// Avatar pictures, and the avatar picker used on the Choose a Demo Person and
// Profile pages.
//
// The team's original pages showed the avatars in a carousel that moved every
// 5 seconds, and asked you to type the avatar's number. That's been replaced
// with a group of radio buttons that shows every avatar with its name
// (WCAG 2.2.2 Pause, Stop, Hide and 3.3.2 Labels or Instructions).

import { AVATARS } from './data.js';

export function avatarSrc(number) {
  const n = Number(number);
  const valid = Number.isInteger(n) && n >= 1 && n <= AVATARS.length;
  return `img/avatar${valid ? n : 1}.svg`;
}

export function avatarName(number) {
  return AVATARS.find((a) => a.number === Number(number))?.name ?? AVATARS[0].name;
}

// Returns the HTML for a required radio group. `selected` is the avatar number
// to tick, if any.
export function avatarPickerHtml(selected) {
  const options = AVATARS.map(
    ({ number, name }) => `
                <div class="avatar-option">
                    <input type="radio" name="image_no" id="avatar-${number}" value="${number}"${
                      Number(selected) === number ? ' checked' : ''
                    }${number === 1 ? ' required' : ''}>
                    <label for="avatar-${number}">
                        <img src="${avatarSrc(number)}" alt="" width="48" height="48">
                        <span>${name}</span>
                    </label>
                </div>`,
  ).join('');

  return `
            <fieldset class="avatar-picker" data-required-message="Choose an avatar">
                <legend class="form-label">Avatar</legend>
                <div class="avatar-options">
                    ${options}
                </div>
            </fieldset>`;
}
