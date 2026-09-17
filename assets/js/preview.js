const buttons = [...document.querySelectorAll('[data-preview-toggle]')];
const previewStatus = document.querySelector('#preview-status');

function resetPreview() {
  for (const button of buttons) {
    button.setAttribute('aria-pressed', 'false');
  }
  previewStatus.textContent = '';
}

for (const button of buttons) {
  button.addEventListener('click', () => {
    const isPressed = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(isPressed));

    previewStatus.textContent = isPressed
      ? 'Preview: subscribed locally. No notifications will be sent.'
      : 'Preview: subscription removed locally.';
  });
  button.disabled = false;
}

window.addEventListener('pageshow', resetPreview);
