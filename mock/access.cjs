function isPositiveId(value) {
  return typeof value === 'string' && /^[1-9]\d*$/.test(value)
    && Number.isSafeInteger(Number(value));
}

module.exports = function access(request, response, next) {
  if (request.method === 'POST' && ['/login', '/register'].includes(request.path)) {
    const body = request.body;
    const registering = request.path === '/register';
    const keys = registering ? ['email', 'password', 'displayName'] : ['email', 'password'];
    if (new URL(request.originalUrl, 'http://127.0.0.1').search
      || !body || !Object.keys(body).every(key => keys.includes(key))
      || typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)
      || body.email.length > 254 || typeof body.password !== 'string'
      || body.password.length < 8 || Buffer.byteLength(body.password, 'utf8') > 72
      || (registering && (typeof body.displayName !== 'string'
        || !body.displayName.trim() || body.displayName.trim().length > 60))) {
      return response.status(400).json({ message: 'Invalid account details.' });
    }
    body.email = body.email.trim().toLowerCase();
    if (registering) body.displayName = body.displayName.trim();
    if (registering && request.app.db.get('users').find({ email: body.email }).value()) {
      return response.status(409).json({ message: 'Email is already registered.' });
    }
    return next();
  }
  const resourcePath = /^\/resources(?:\/([1-9]\d*))?$/.exec(request.path);
  if (request.method !== 'GET' || !resourcePath
    || (resourcePath[1] && !isPositiveId(resourcePath[1]))) {
    return response.status(403).json({ message: 'Endpoint is not available.' });
  }

  const allowedKeys = resourcePath[1] ? [] : ['userId', 'sourceResourceId'];
  // Validate raw keys too: Express discards some special query properties.
  const query = [...new URL(request.originalUrl, 'http://127.0.0.1').searchParams];
  const validQuery = new Set(query.map(([key]) => key)).size === query.length
    && query.every(([key, value]) =>
      allowedKeys.includes(key) && isPositiveId(value));
  if (!validQuery) {
    return response.status(400).json({ message: 'Unsupported query parameters.' });
  }

  next();
};
