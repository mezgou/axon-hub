import { login } from './services/auth.js';
import { saveSession, getReturnPath } from './session.js';

const form = document.querySelector('.axon-auth-form');
const submit = form.querySelector('button[type="submit"]');
const fields = [...form.querySelectorAll('input')];
const status = document.querySelector('#form-status');
const requiredMessages = {
  displayName: 'Enter your display name.',
  email: 'Enter your email address.',
  password: 'Enter your password.',
};

function showError(field, message) {
  const error = document.querySelector(`#${field.id}-error`);
  error.textContent = message;
  error.hidden = !message;
  if (message) field.setAttribute('aria-invalid', 'true');
  else field.removeAttribute('aria-invalid');
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submit.disabled) return;
  status.textContent = '';
  let firstInvalid = null;

  for (const field of fields) {
    if (field.name === 'displayName') field.value = field.value.trim();
    let message = '';
    if (field.validity.valueMissing) {
      message = requiredMessages[field.name];
    } else if (field.validity.typeMismatch) {
      message = 'Enter a valid email address, such as alex@example.test.';
    } else if (field.validity.tooShort || (field.minLength > 0 && field.value.length < field.minLength)) {
      message = `Use at least ${field.minLength} characters.`;
    } else if (field.validity.tooLong || (field.maxLength > 0 && field.value.length > field.maxLength)) {
      message = `Use no more than ${field.maxLength} characters.`;
    }
    showError(field, message);
    if (message && !firstInvalid) firstInvalid = field;
  }

  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  if (form.id === 'register-form') {
    form.elements.password.value = '';
    status.textContent = 'Preview complete. The form is valid; no account was created. Your details were not sent or saved by AxonHub.';
    return;
  }
  submit.disabled = true;
  status.textContent = 'Signing in...';
  try {
    const session = await login(form.elements.email.value.trim().toLowerCase(), form.elements.password.value);
    saveSession(session);
    location.assign(getReturnPath(new URLSearchParams(location.search).get('returnTo')));
  } catch (error) {
    status.textContent = error.status === 400 || error.status === 401
      ? 'Email or password is incorrect.'
      : 'Could not sign in. Check the local API and browser session storage, then try again.';
  } finally {
    form.elements.password.value = '';
    submit.disabled = false;
  }
});

for (const field of fields) {
  field.addEventListener('input', () => {
    showError(field, '');
    status.textContent = '';
  });
}

form.querySelector('button[type="submit"]').disabled = false;
