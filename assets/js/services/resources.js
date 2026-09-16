import { getJson } from './http.js';

export async function getResources() {
  const resources = await getJson('/resources');
  if (!Array.isArray(resources) || !resources.every(resource => resource
    && Number.isSafeInteger(resource.id) && resource.id > 0
    && ['model', 'dataset'].includes(resource.type)
    && ['name', 'summary', 'task', 'framework', 'license'].every(key => typeof resource[key] === 'string')
    && Number.isFinite(resource.sizeBytes) && resource.sizeBytes >= 0)) {
    throw new Error('Invalid resource list.');
  }
  return resources;
}
