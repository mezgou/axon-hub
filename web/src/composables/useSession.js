import { readonly, shallowRef } from 'vue';

const key = 'axonhub-session';
export function safeSession(value) {
  const user = value?.user;
  if (
    typeof value?.accessToken !== 'string' ||
    !value.accessToken ||
    !Number.isSafeInteger(user?.id) ||
    user.id <= 0 ||
    typeof user.email !== 'string' ||
    typeof user.displayName !== 'string'
  )
    return null;
  return {
    accessToken: value.accessToken,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    },
  };
}
function readSession() {
  try {
    return safeSession(JSON.parse(sessionStorage.getItem(key)));
  } catch {
    return null;
  }
}
const current = shallowRef(readSession());
export const session = readonly(current);
export function saveSession(value) {
  const safe = safeSession(value);
  if (!safe) throw new Error('Invalid session response.');
  current.value = safe;
  try {
    sessionStorage.setItem(key, JSON.stringify(safe));
  } catch {
    /* In-memory session. */
  }
}
export function clearSession() {
  current.value = null;
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* Storage may be blocked. */
  }
}
export function useSession() {
  return { session, saveSession, clearSession };
}
export function getReturnPath(value) {
  if (
    typeof value !== 'string' ||
    !/^\/(explore|profile|resources\/[1-9]\d*)(?:[?#]|$)/.test(value) ||
    /[\\\r\n]/.test(value)
  )
    return '/profile';
  return value;
}
