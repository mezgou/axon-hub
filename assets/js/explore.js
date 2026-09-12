const form = document.querySelector('#resource-filters');
const rows = [...document.querySelectorAll('.axon-resource-row')];
const filterNames = ['type', 'task', 'license', 'size', 'framework'];
const resultCount = document.querySelector('#result-count');
const filterCount = document.querySelector('#filter-count');
const emptyResults = document.querySelector('#empty-results');
const filterPanel = document.querySelector('#filter-panel');
const desktop = window.matchMedia('(min-width: 992px)');

function matchesSize(bytes, size) {
  if (size === 'small') return bytes < 100 * 1024 ** 2;
  if (size === 'medium') return bytes >= 100 * 1024 ** 2 && bytes < 1024 ** 3;
  if (size === 'large') return bytes >= 1024 ** 3;
  return true;
}

function applyFilters() {
  const values = Object.fromEntries(new FormData(form));
  const query = values.q.trim().toLowerCase();
  let visibleCount = 0;

  for (const row of rows) {
    const text = `${row.querySelector('h2').textContent} ${row.querySelector('p').textContent}`;
    const matchesFields = filterNames.every(name => !values[name] || (name === 'size'
      ? matchesSize(Number(row.dataset.sizeBytes), values.size)
      : row.dataset[name] === values[name]));
    row.hidden = !(text.toLowerCase().includes(query) && matchesFields);
    if (!row.hidden) visibleCount += 1;
  }

  resultCount.textContent = `${visibleCount} ${visibleCount === 1 ? 'resource' : 'resources'}`;
  emptyResults.hidden = visibleCount !== 0;
  filterCount.textContent = `(${filterNames.filter(name => values[name]).length})`;
}

function restoreFilters() {
  const params = new URLSearchParams(window.location.search);
  for (const name of ['q', ...filterNames]) {
    const control = form.elements.namedItem(name);
    const value = params.get(name) || '';
    control.value = name === 'q' || [...control.options].some(option => option.value === value)
      ? value : '';
  }
  applyFilters();
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const params = new URLSearchParams();
  for (const [name, value] of new FormData(form)) {
    if (value.trim()) params.set(name, value.trim());
  }
  history.replaceState(null, '', `${location.pathname}${params.size ? `?${params}` : ''}${location.hash}`);
  applyFilters();
});

form.addEventListener('reset', event => {
  event.preventDefault();
  for (const name of ['q', ...filterNames]) form.elements.namedItem(name).value = '';
  history.replaceState(null, '', `${location.pathname}${location.hash}`);
  applyFilters();
});

window.addEventListener('popstate', restoreFilters);
desktop.addEventListener('change', () => { filterPanel.open = desktop.matches; });
filterPanel.open = desktop.matches;
restoreFilters();
