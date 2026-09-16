const apiBase = 'http://127.0.0.1:3001';

export async function getJson(path) {
  const response = await fetch(`${apiBase}${path}`, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) {
    const error = new Error(`Request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}
