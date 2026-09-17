import { getSession } from './session.js';
import { getResources } from './services/resources.js';

const main = document.querySelector('main');
const list = document.querySelector('#your-resources');
const status = document.querySelector('#resource-status');
const retry = document.querySelector('#retry-resources');
const empty = document.querySelector('#empty-resources');
const template = document.querySelector('#profile-resource-template');
let loadId = 0;

function createRow(resource) {
  const row = template.content.firstElementChild.cloneNode(true);
  row.querySelector('.axon-resource-type').textContent = resource.type === 'model' ? 'Model' : 'Dataset';
  const link = row.querySelector('a');
  link.textContent = resource.name;
  link.href = `${resource.type}.html?id=${resource.id}`;
  row.querySelector('p').textContent = resource.summary;
  return row;
}

async function loadProfile() {
  const restoreFocus = document.activeElement === retry;
  const requestId = ++loadId;
  const session = getSession();
  if (!session) {
    main.hidden = true;
    location.replace('login.html?returnTo=profile.html');
    return;
  }
  const { user } = session;
  document.querySelector('#profile-name').textContent = user.displayName;
  document.querySelector('#profile-email').textContent = user.email;
  document.querySelector('#profile-avatar').textContent = user.displayName.trim().split(/\s+/)
    .slice(0, 2).map(word => [...word][0] || '').join('').toUpperCase();
  main.hidden = false;
  list.replaceChildren();
  list.setAttribute('aria-busy', 'true');
  empty.hidden = true;
  retry.hidden = true;
  retry.disabled = true;
  status.textContent = 'Loading your resources…';
  try {
    const resources = await getResources(user.id);
    if (requestId !== loadId || getSession()?.accessToken !== session.accessToken) return;
    list.replaceChildren(...resources.map(createRow));
    empty.hidden = resources.length !== 0;
    status.textContent = `${resources.length} ${resources.length === 1 ? 'resource' : 'resources'}`;
    if (restoreFocus) status.focus();
  } catch {
    if (requestId !== loadId) return;
    status.textContent = 'Could not load your resources. Check the local API and try again.';
    retry.hidden = false;
  } finally {
    if (requestId === loadId) {
      list.setAttribute('aria-busy', 'false');
      retry.disabled = false;
    }
  }
}

retry.addEventListener('click', loadProfile);
window.addEventListener('pageshow', event => { if (event.persisted) loadProfile(); });
// Do not leave account details in a restored back/forward page snapshot.
window.addEventListener('pagehide', () => { main.hidden = true; });
loadProfile();
