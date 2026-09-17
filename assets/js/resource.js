import { getResource } from './services/resources.js';

const content = document.querySelector('#resource-content');
const status = document.querySelector('#resource-status');
const retry = document.querySelector('#retry-resource');
const pageType = document.querySelector('main').dataset.resourceType;
const params = new URLSearchParams(location.search);
const rawId = params.get('id') ?? (pageType === 'model' ? '1' : '4');
const id = Number(rawId);
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
    document.querySelector('#resource-owner').hidden = false;
    content.hidden = false;
    status.textContent = 'Resource loaded.';
    retry.hidden = true;
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
