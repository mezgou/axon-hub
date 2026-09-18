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
  const commentPath = /^\/discussions\/([1-9]\d*)$/.exec(request.path);
  if (commentPath && ['PATCH', 'DELETE'].includes(request.method)) {
    if (!isPositiveId(commentPath[1]) || new URL(request.originalUrl, 'http://127.0.0.1').search) {
      return response.status(400).json({ message: 'Invalid comment request.' });
    }
    if (!request.app.db.get('discussions').find({ id: Number(commentPath[1]) }).value()) {
      return response.status(404).json({ message: 'Comment not found.' });
    }
    if (request.method === 'PATCH') {
      const body = request.body;
      if (!body || !Object.keys(body).every(key => ['body', 'updatedAt'].includes(key))
        || typeof body.body !== 'string' || !body.body.trim() || body.body.trim().length > 1000
        || typeof body.updatedAt !== 'string' || !Number.isFinite(Date.parse(body.updatedAt))) {
        return response.status(400).json({ message: 'Invalid comment update.' });
      }
      body.body = body.body.trim();
    }
    return next();
  }
  if (request.path === '/discussions') {
    const query = [...new URL(request.originalUrl, 'http://127.0.0.1').searchParams];
    if (request.method === 'GET') {
      const keys = new Map(query);
      if (query.length !== 3 || keys.size !== 3 || !isPositiveId(keys.get('resourceId'))
        || keys.get('_sort') !== 'createdAt' || keys.get('_order') !== 'asc') {
        return response.status(400).json({ message: 'Invalid discussion query.' });
      }
      return next();
    }
    if (request.method === 'POST') {
      const body = request.body;
      const fields = ['userId', 'resourceId', 'authorName', 'body', 'createdAt', 'updatedAt'];
      if (query.length || !body || !Object.keys(body).every(key => fields.includes(key))
        || !['userId', 'resourceId'].every(key => Number.isSafeInteger(body[key]) && body[key] > 0)
        || typeof body.authorName !== 'string' || !body.authorName.trim() || body.authorName.trim().length > 60
        || typeof body.body !== 'string' || !body.body.trim() || body.body.trim().length > 1000
        || !['createdAt', 'updatedAt'].every(key => typeof body[key] === 'string'
          && Number.isFinite(Date.parse(body[key])))) {
        return response.status(400).json({ message: 'Invalid comment details.' });
      }
      if (!request.app.db.get('resources').find({ id: body.resourceId }).value()) {
        return response.status(404).json({ message: 'Resource not found.' });
      }
      body.body = body.body.trim();
      body.authorName = body.authorName.trim();
      return next();
    }
    return response.status(403).json({ message: 'Endpoint is not available.' });
  }
  const relationPath = /^\/(stars|subscriptions)(?:\/([1-9]\d*))?$/.exec(request.path);
  if (relationPath) {
    const query = [...new URL(request.originalUrl, 'http://127.0.0.1').searchParams];
    const db = request.app.db;
    if (request.method === 'GET' && !relationPath[2]) {
      const filters = relationPath[1] === 'subscriptions' ? ['resourceId', 'userId'] : ['resourceId'];
      if (query.length !== 1 || !filters.includes(query[0][0]) || !isPositiveId(query[0][1])) {
        return response.status(400).json({ message: 'A valid relation filter is required.' });
      }
      return next();
    }
    if (query.length) return response.status(400).json({ message: 'Unsupported query parameters.' });
    if (request.method === 'POST' && !relationPath[2]) {
      const body = request.body;
      if (!body || !Object.keys(body).every(key => ['userId', 'resourceId', 'createdAt'].includes(key))
        || !Number.isSafeInteger(body.userId) || body.userId <= 0
        || !Number.isSafeInteger(body.resourceId) || body.resourceId <= 0
        || typeof body.createdAt !== 'string' || !Number.isFinite(Date.parse(body.createdAt))) {
        return response.status(400).json({ message: 'Invalid relation details.' });
      }
      if (!db.get('resources').find({ id: body.resourceId }).value()) {
        return response.status(404).json({ message: 'Resource not found.' });
      }
      return next();
    }
    if (request.method === 'DELETE' && isPositiveId(relationPath[2])) {
      if (!db.get(relationPath[1]).find({ id: Number(relationPath[2]) }).value()) {
        return response.status(404).json({ message: 'Relation not found.' });
      }
      return next();
    }
    return response.status(403).json({ message: 'Endpoint is not available.' });
  }
  const resourcePath = /^\/resources(?:\/([1-9]\d*))?$/.exec(request.path);
  if (request.path === '/resources' && request.method === 'POST') {
    const body = request.body;
    const copied = ['type', 'summary', 'description', 'task', 'framework', 'license', 'sizeBytes',
      'tags', 'metrics', 'usageExample', 'demoFile', 'revision', 'reproducibility'];
    const allowed = [...copied, 'name', 'userId', 'authorName', 'sourceResourceId', 'downloadCount'];
    if (new URL(request.originalUrl, 'http://127.0.0.1').search || !body
      || !Object.keys(body).every(key => allowed.includes(key))
      || !Number.isSafeInteger(body.userId) || body.userId <= 0
      || !Number.isSafeInteger(body.sourceResourceId) || body.sourceResourceId <= 0
      || typeof body.authorName !== 'string' || !body.authorName.trim() || body.authorName.trim().length > 60
      || body.downloadCount !== 0) {
      return response.status(400).json({ message: 'Invalid fork details.' });
    }
    const source = request.app.db.get('resources').find({ id: body.sourceResourceId }).value();
    if (!source) return response.status(404).json({ message: 'Source resource not found.' });
    // This endpoint only copies existing metadata; arbitrary resource editing is not enabled.
    if (body.name !== `${source.name.slice(0, 73)} (fork)`
      || !copied.every(key => JSON.stringify(body[key]) === JSON.stringify(source[key]))) {
      return response.status(400).json({ message: 'Fork metadata must match the source.' });
    }
    body.authorName = body.authorName.trim();
    return next();
  }
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
