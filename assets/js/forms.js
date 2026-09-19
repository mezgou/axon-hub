import { login, register } from './services/auth.js';
import { saveSession, getReturnPath } from './session.js';

const form = document.querySelector('.axon-auth-form');
const submit = form.querySelector('button[type="submit"]');
const fields = [...form.querySelectorAll('input')];
const status = document.querySelector('#form-status');
const summary = document.querySelector('#error-summary');
const isRegistering = form.id === 'register-form';
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

function updateSummary() {
  const count = fields.filter(field => field.getAttribute('aria-invalid') === 'true').length;
  summary.textContent = count > 1 ? `Check the ${count} highlighted fields. Each field has an explanation below it.` : '';
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submit.disabled) return;
  status.textContent = '';
  status.classList.remove('axon-form-failure');
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
    } else if (field.name === 'password' && new TextEncoder().encode(field.value).length > 72) {
      message = 'Use a shorter password: at most 72 bytes (some characters use more than one).';
    }
    showError(field, message);
    if (message && !firstInvalid) firstInvalid = field;
  }

  updateSummary();
  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  submit.disabled = true;
  fields.forEach(field => { field.readOnly = true; });
  status.textContent = isRegistering ? 'Creating your account...' : 'Signing in...';
  let accountCreated = false;
  try {
    const email = form.elements.email.value.trim().toLowerCase();
    const password = form.elements.password.value;
    const session = isRegistering
      ? await register(email, password, form.elements.displayName.value)
      : await login(email, password);
    accountCreated = isRegistering;
    saveSession(session);
    form.elements.password.value = '';
    location.assign(isRegistering ? 'profile.html' : getReturnPath(new URLSearchParams(location.search).get('returnTo')));
  } catch (error) {
    status.classList.add('axon-form-failure');
    if (isRegistering) {
      if (error.status === 409) {
        showError(form.elements.email, 'This email is already registered. Log in or use another email.');
        form.elements.email.focus();
      }
      status.textContent = accountCreated
        ? 'Account created, but the session could not be saved. Allow browser session storage, then log in.'
        : error.status === 409 ? 'Account not created. Check the highlighted email field.'
        : error.status === 400 ? 'Check your account details and try again.'
        : 'Could not confirm registration. Check the local API. Try logging in before submitting again.';
    } else status.textContent = error.status === 400 || error.status === 401
      ? 'Email or password is incorrect.'
      : 'Could not sign in. Check the local API and browser session storage, then try again.';
  } finally {
    fields.forEach(field => { field.readOnly = false; });
    submit.disabled = false;
  }
});

for (const field of fields) {
  field.addEventListener('input', () => {
    showError(field, '');
    updateSummary();
    status.textContent = '';
    status.classList.remove('axon-form-failure');
  });
}

form.querySelector('button[type="submit"]').disabled = false;
