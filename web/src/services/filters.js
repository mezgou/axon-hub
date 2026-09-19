export const filterOptions = {
  type: [
    ['model', 'Models'],
    ['dataset', 'Datasets'],
  ],
  task: [
    ['text-classification', 'Text classification'],
    ['image-classification', 'Image classification'],
    ['translation', 'Translation'],
  ],
  license: [
    ['apache-2.0', 'Apache-2.0'],
    ['mit', 'MIT'],
    ['cc-by-4.0', 'CC-BY-4.0'],
  ],
  size: [
    ['small', 'Under 100 MiB'],
    ['medium', '100 MiB to <1 GiB'],
    ['large', '1 GiB and above'],
  ],
  framework: [
    ['pytorch', 'PyTorch'],
    ['tensorflow', 'TensorFlow'],
    ['scikit-learn', 'scikit-learn'],
    ['none', 'Not applicable'],
  ],
};
export function readFilters(query) {
  const filters = { q: typeof query.q === 'string' ? query.q : '' };
  for (const [key, options] of Object.entries(filterOptions)) {
    filters[key] = options.some(([value]) => value === query[key]) ? query[key] : '';
  }
  return filters;
}
export function matchesResource(resource, filters) {
  const text = [resource.name, resource.summary, ...(resource.tags || [])].join(' ').toLowerCase();
  if (!text.includes(filters.q.trim().toLowerCase())) return false;
  return Object.keys(filterOptions).every((key) => {
    const value = filters[key];
    if (!value) return true;
    if (key !== 'size') return resource[key] === value;
    if (value === 'small') return resource.sizeBytes < 100 * 1024 ** 2;
    if (value === 'medium')
      return resource.sizeBytes >= 100 * 1024 ** 2 && resource.sizeBytes < 1024 ** 3;
    return resource.sizeBytes >= 1024 ** 3;
  });
}
export function displayLabel(key, value) {
  return filterOptions[key]?.find(([id]) => id === value)?.[1] || value;
}
export function displaySize(bytes) {
  return bytes >= 1024 ** 3
    ? `${Number((bytes / 1024 ** 3).toFixed(2))} GiB`
    : `${Number((bytes / 1024 ** 2).toFixed(2))} MiB`;
}
