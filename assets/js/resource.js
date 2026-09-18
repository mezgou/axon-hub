import { getResource, getResources, forkResource } from './services/resources.js';
import { initDiscussion } from './discussion.js';
import { getStars, addStar, removeStar, getSubscriptions, setSubscription } from './services/social.js';
import { getSession } from './session.js';

const content = document.querySelector('#resource-content');
const status = document.querySelector('#resource-status');
const retry = document.querySelector('#retry-resource');
const pageType = document.querySelector('main').dataset.resourceType;
const params = new URLSearchParams(location.search);
const rawId = params.get('id') ?? (pageType === 'model' ? '1' : '4');
const id = Number(rawId);
let loadedResource;
const forkButton = document.querySelector('#fork-resource');
const forkStatus = document.querySelector('#fork-status');
const forkLogin = document.querySelector('#fork-login');
forkButton.addEventListener('click', async () => {
  if (forkButton.disabled || !loadedResource) return;
  const session = getSession();
  if (!session) {
    forkLogin.hidden = false;
    forkLogin.href = `login.html?returnTo=${encodeURIComponent(`${pageType}.html?id=${id}#fork-heading`)}`;
    forkStatus.textContent = 'Log in to create your own metadata copy.';
    forkLogin.focus();
    return;
  }
  forkButton.disabled = true;
  forkStatus.textContent = 'Opening your metadata copy…';
  try {
    const fork = await forkResource(loadedResource, session.user);
    location.assign(`${fork.type}.html?id=${fork.id}`);
  } catch (error) {
    forkStatus.textContent = error.status === 401 ? 'Your session expired. Log in and try again.'
      : 'Could not confirm the copy. Try again to check for an existing fork before creating one.';
    if (error.status === 401) {
      forkLogin.href = `login.html?returnTo=${encodeURIComponent(`${pageType}.html?id=${id}#fork-heading`)}`;
      forkLogin.hidden = false;
    }
  } finally { forkButton.disabled = false; }
});

async function renderFork(resource) {
  loadedResource = resource;
  forkButton.disabled = false;
  forkButton.textContent = 'Fork metadata';
  const sourceLink = document.querySelector('#fork-source');
  sourceLink.hidden = true;
  if (Number.isSafeInteger(resource.sourceResourceId) && resource.sourceResourceId > 0) {
    sourceLink.href = `${resource.type}.html?id=${resource.sourceResourceId}`;
    sourceLink.hidden = false;
  }
  const session = getSession();
  if (session) {
    try {
      const resources = await getResources(session.user.id);
      if (resources.some(item => item.sourceResourceId === resource.id)) forkButton.textContent = 'Open your fork';
    } catch { /* The click retries this lookup before any POST. */ }
  }
}
const starButton = document.querySelector('#star-resource');
const starStatus = document.querySelector('#star-status');
const starRetry = document.querySelector('#retry-stars');
const starLogin = document.querySelector('#star-login');
let stars = [];

function renderStars() {
  const userId = getSession()?.user.id;
  starButton.setAttribute('aria-pressed', String(stars.some(star => star.userId === userId)));
  document.querySelector('#star-count').textContent = new Set(stars.map(star => star.userId)).size;
  starLogin.hidden = Boolean(userId);
  starLogin.href = `login.html?returnTo=${encodeURIComponent(`${pageType}.html?id=${id}`)}`;
}

async function loadStars() {
  const restoreFocus = document.activeElement === starRetry;
  starButton.disabled = true;
  starRetry.disabled = true;
  starStatus.textContent = 'Loading stars…';
  try {
    stars = await getStars(id);
    renderStars();
    starStatus.textContent = '';
    starRetry.hidden = true;
    starButton.disabled = false;
    if (restoreFocus) starButton.focus();
  } catch {
    starStatus.textContent = 'Could not load stars. Please retry.';
    starRetry.hidden = false;
  } finally { starRetry.disabled = false; }
}

starRetry.addEventListener('click', loadStars);
window.addEventListener('pageshow', event => {
  if (event.persisted && !content.hidden && validId) { loadStars(); loadSubscription(); }
});
starButton.addEventListener('click', async () => {
  if (starButton.disabled) return;
  const session = getSession();
  if (!session) {
    renderStars();
    starStatus.textContent = 'Log in to star this resource.';
    starLogin.focus();
    return;
  }
  const remove = starButton.getAttribute('aria-pressed') === 'true';
  starButton.disabled = true;
  starStatus.textContent = 'Saving star…';
  try {
    // Re-read before mutation so a retry does not repeat an uncertain POST.
    const current = await getStars(id);
    const own = current.filter(star => star.userId === session.user.id);
    if (remove) {
      for (const star of own) await removeStar(star.id);
    } else if (!own.length) await addStar(id, session.user.id);
    stars = await getStars(id);
    renderStars();
    starStatus.textContent = remove ? 'Star removed.' : 'Star saved.';
  } catch (error) {
    starStatus.textContent = error.status === 401 ? 'Your session expired. Log in to continue.'
      : 'Could not confirm the change. Reload stars before trying again.';
    starRetry.hidden = false;
    renderStars();
    return;
  } finally {
    starButton.disabled = !starRetry.hidden;
  }
});
const subscriptionButton = document.querySelector('#subscribe-resource');
const subscriptionStatus = document.querySelector('#subscription-status');
const subscriptionRetry = document.querySelector('#retry-subscriptions');
const subscriptionLogin = document.querySelector('#subscription-login');
let subscriptions = [];

function renderSubscription() {
  const userId = getSession()?.user.id;
  subscriptionButton.setAttribute('aria-pressed', String(subscriptions.some(row => row.userId === userId)));
  subscriptionLogin.hidden = Boolean(userId);
  subscriptionLogin.href = `login.html?returnTo=${encodeURIComponent(`${pageType}.html?id=${id}`)}`;
}

async function loadSubscription() {
  const restoreFocus = document.activeElement === subscriptionRetry;
  subscriptionButton.disabled = true;
  subscriptionRetry.disabled = true;
  subscriptionStatus.textContent = 'Loading subscriptions…';
  try {
    subscriptions = await getSubscriptions('resourceId', id);
    renderSubscription();
    subscriptionStatus.textContent = '';
    subscriptionRetry.hidden = true;
    subscriptionButton.disabled = false;
    if (restoreFocus) subscriptionButton.focus();
  } catch {
    subscriptionStatus.textContent = 'Could not load subscriptions. Please retry.';
    subscriptionRetry.hidden = false;
  } finally { subscriptionRetry.disabled = false; }
}

subscriptionRetry.addEventListener('click', loadSubscription);
subscriptionButton.addEventListener('click', async () => {
  if (subscriptionButton.disabled) return;
  const session = getSession();
  if (!session) {
    renderSubscription();
    subscriptionStatus.textContent = 'Log in to subscribe to this resource.';
    subscriptionLogin.focus();
    return;
  }
  const remove = subscriptionButton.getAttribute('aria-pressed') === 'true';
  subscriptionButton.disabled = true;
  subscriptionStatus.textContent = 'Saving subscription…';
  try {
    await setSubscription(id, session.user.id, !remove);
    subscriptions = await getSubscriptions('resourceId', id);
    renderSubscription();
    subscriptionStatus.textContent = remove ? 'Unsubscribed.' : 'Subscribed.';
  } catch (error) {
    subscriptionStatus.textContent = error.status === 401 ? 'Your session expired. Log in to continue.'
      : 'Could not confirm the change. Reload subscriptions before trying again.';
    subscriptionRetry.hidden = false;
    renderSubscription();
    return;
  } finally {
    subscriptionButton.disabled = !subscriptionRetry.hidden;
  }
});
const validId = params.getAll('id').length <= 1 && /^[1-9]\d*$/.test(rawId)
  && Number.isSafeInteger(id);
const labels = {
  'text-classification': 'Text classification', 'image-classification': 'Image classification',
  translation: 'Translation', pytorch: 'PyTorch', tensorflow: 'TensorFlow',
  'scikit-learn': 'scikit-learn', none: 'Not applicable',
  'apache-2.0': 'Apache-2.0', mit: 'MIT', 'cc-by-4.0': 'CC-BY-4.0'
};

function setText(selector, value) {
  document.querySelector(selector).textContent = value;
}

function renderPairs(selector, pairs) {
  const rows = pairs.map(([label, value]) => {
    const row = document.createElement('div');
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label;
    description.textContent = value ?? 'Not provided';
    row.append(term, description);
    return row;
  });
  document.querySelector(selector).replaceChildren(...rows);
}

function renderResource(resource) {
  document.title = `${resource.name} · AxonHub`;
  setText('#resource-name', resource.name);
  setText('#resource-summary', resource.summary);
  setText('#author-name', resource.authorName);
  setText('#resource-description', resource.description);
  setText('#resource-usage', resource.usageExample);
  const size = resource.sizeBytes >= 1024 ** 3
    ? `${Number((resource.sizeBytes / 1024 ** 3).toFixed(2))} GiB`
    : `${Number((resource.sizeBytes / 1024 ** 2).toFixed(2))} MiB`;
  renderPairs('#resource-metadata', [
    ['Task', labels[resource.task] ?? resource.task],
    ['Framework', labels[resource.framework] ?? resource.framework],
    ['License', labels[resource.license] ?? resource.license],
    ['Size', size], ['Version', resource.revision]
  ]);
  renderPairs('#resource-metrics', resource.metrics.length ? resource.metrics.map(metric => [
    metric.label, metric.value == null ? null : `${metric.value}${metric.unit ? ` ${metric.unit}` : ''}`
  ]) : [['Metrics', null]]);
  renderPairs('#resource-reproduction', [
    ['Environment', resource.reproducibility.environment],
    ['Revision', resource.revision], ['Seed', resource.reproducibility.seed]
  ]);
  document.querySelector('#resource-steps').replaceChildren(...resource.reproducibility.steps.map(step => {
    const item = document.createElement('li');
    item.textContent = step;
    return item;
  }));
  const hasDownload = resource.demoFile === 'resource-manifest';
  document.querySelector('#resource-download').hidden = !hasDownload;
  document.querySelector('#download-unavailable').hidden = hasDownload;
  setText('#resource-downloads', `Demo downloads: ${Number.isSafeInteger(resource.downloadCount)
    && resource.downloadCount >= 0 ? resource.downloadCount : 'Not provided'}`);
}

async function loadResource() {
  if (retry.disabled) return;
  const restoreFocus = document.activeElement === retry;
  retry.disabled = true;
  content.hidden = true;
  document.querySelector('#resource-owner').hidden = true;
  status.textContent = 'Loading resource...';
  try {
    const resource = await getResource(id);
    if (resource.type !== pageType) {
      location.replace(`${resource.type}.html?id=${id}`);
      return;
    }
    renderResource(resource);
    renderFork(resource);
    initDiscussion(id);
    document.querySelector('#resource-owner').hidden = false;
    content.hidden = false;
    status.textContent = 'Resource loaded.';
    retry.hidden = true;
    loadStars();
    loadSubscription();
    if (restoreFocus) status.focus();
  } catch (error) {
    const missing = error.status === 404;
    setText('#resource-name', missing ? 'Resource not found' : 'Resource unavailable');
    document.title = `${missing ? 'Resource not found' : 'Resource unavailable'} · AxonHub`;
    status.textContent = missing ? 'This resource does not exist. Return to Explore to choose another.'
      : 'Could not load this resource. Please try again.';
    retry.hidden = missing;
  } finally {
    retry.disabled = false;
  }
}

retry.addEventListener('click', loadResource);
if (validId) {
  loadResource();
} else {
  setText('#resource-name', 'Invalid resource ID');
  document.title = 'Invalid resource ID · AxonHub';
  status.textContent = 'Choose a resource from Explore.';
}
