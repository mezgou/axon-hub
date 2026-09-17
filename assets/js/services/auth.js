import { requestJson } from './http.js';

export function login(email, password) {
  return requestJson('/login', { method: 'POST', body: { email, password } });
}
