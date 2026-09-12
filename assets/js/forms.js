const form = document.querySelector('#login-form');
const fields = [...form.querySelectorAll('input')];
const status = document.querySelector('#form-status');

function showError(field, message) {
  const error = document.querySelector(`#${field.id}-error`);
  error.textContent = message;
  error.hidden = !message;
  if (message) field.setAttribute('aria-invalid', 'true');
  else field.removeAttribute('aria-invalid');
}

form.addEventListener('submit', event => {
  event.preventDefault();
  status.textContent = '';
  let firstInvalid = null;

  for (const field of fields) {
    let message = '';
    if (field.validity.valueMissing) {
      message = field.type === 'email' ? 'Enter your email address.' : 'Enter your password.';
    } else if (field.validity.typeMismatch) {
      message = 'Enter a valid email address, such as alex@example.test.';
    } else if (field.validity.tooShort) {
      message = `Use at least ${field.minLength} characters.`;
    }
    showError(field, message);
    if (message && !firstInvalid) firstInvalid = field;
  }

  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  form.elements.password.value = '';
  status.textContent = 'Preview complete. The form is valid; you are not signed in. Your details were not sent or saved by AxonHub.';
});

for (const field of fields) {
  field.addEventListener('input', () => {
    showError(field, '');
    status.textContent = '';
  });
}

form.querySelector('button[type="submit"]').disabled = false;
