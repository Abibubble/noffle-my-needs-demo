// Form error messages, shared by every form in the demo.
//
// Each form has `novalidate`, so the browser's own pop-up bubbles don't show.
// Instead, each problem is written in text next to its field, linked to the
// field with aria-describedby, and focus moves to the first field with a
// problem (WCAG 3.3.1 Error Identification and 3.3.3 Error Suggestion).
//
// Messages come from data attributes on the field:
//   data-required-message  shown when the field is empty
//   data-pattern-message   shown when the text doesn't match `pattern`
// For radio buttons, put data-required-message on their <fieldset>.

function labelText(input) {
  return (input.labels?.[0]?.textContent ?? input.name).trim();
}

// The element that owns the message: the field, or the fieldset for radio buttons.
function owner(input) {
  return input.type === 'radio' ? input.closest('fieldset') : input;
}

function setDescribedBy(el, id, add) {
  const ids = new Set((el.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean));
  if (add) ids.add(id);
  else ids.delete(id);
  if (ids.size) el.setAttribute('aria-describedby', [...ids].join(' '));
  else el.removeAttribute('aria-describedby');
}

function errorElement(input) {
  const el = owner(input);
  const id = `${input.type === 'radio' ? input.name : input.id}-error`;
  let error = document.getElementById(id);
  if (!error) {
    error = document.createElement('p');
    error.id = id;
    error.className = 'form-error';
    error.hidden = true;
    if (el.tagName === 'FIELDSET') el.querySelector('legend').after(error);
    else el.before(error);
  }
  return { el, error };
}

export function showError(input, message) {
  const { el, error } = errorElement(input);
  error.textContent = `Error: ${message}`;
  error.hidden = false;
  if (el.tagName !== 'FIELDSET') el.setAttribute('aria-invalid', 'true');
  setDescribedBy(el, error.id, true);
}

export function clearError(input) {
  const { el, error } = errorElement(input);
  error.hidden = true;
  error.textContent = '';
  el.removeAttribute('aria-invalid');
  setDescribedBy(el, error.id, false);
}

function messageFor(input) {
  const { validity } = input;
  const el = owner(input);
  if (validity.valueMissing) {
    return el.dataset.requiredMessage ?? `Enter ${labelText(input).toLowerCase()}`;
  }
  if (validity.tooShort) {
    return `${labelText(input)} must be ${input.minLength} characters or more`;
  }
  if (validity.patternMismatch) {
    return input.dataset.patternMessage ?? `Check the format of ${labelText(input).toLowerCase()}`;
  }
  return null;
}

// Checks every field. Shows a message by each one with a problem, and moves
// focus to the first. Returns true if the form is ready to save.
export function checkForm(form) {
  const seenRadioGroups = new Set();
  let first = null;
  for (const input of form.querySelectorAll('input, textarea, select')) {
    if (input.type === 'radio') {
      if (seenRadioGroups.has(input.name)) continue;
      seenRadioGroups.add(input.name);
    }
    if (!input.willValidate) continue;
    const message = messageFor(input);
    if (message) {
      showError(input, message);
      first ??= input;
    } else {
      clearError(input);
    }
  }
  first?.focus();
  return !first;
}

// Clears a field's message as soon as someone changes it.
export function clearErrorsOnInput(form) {
  form.addEventListener('input', (event) => {
    if (event.target.matches('input, textarea, select')) clearError(event.target);
  });
  form.addEventListener('change', (event) => {
    if (event.target.type === 'radio') clearError(event.target);
  });
}
