import { getJson, requestJson } from './http.js';

export async function getStars(resourceId) {
  const stars = await getJson(`/stars?resourceId=${resourceId}`);
  if (!Array.isArray(stars) || !stars.every(star => star
    && Number.isSafeInteger(star.id) && star.id > 0
    && Number.isSafeInteger(star.userId) && star.userId > 0
    && star.resourceId === resourceId)) throw new Error('Invalid star list.');
  return stars;
}

export function addStar(resourceId, userId) {
  return requestJson('/stars', { method: 'POST', authenticated: true,
    body: { resourceId, userId, createdAt: new Date().toISOString() } });
}

export function removeStar(id) {
  return requestJson(`/stars/${id}`, { method: 'DELETE', authenticated: true });
}
