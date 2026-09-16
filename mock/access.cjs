function isPositiveId(value) {
  return typeof value === 'string' && /^[1-9]\d*$/.test(value)
    && Number.isSafeInteger(Number(value));
}

module.exports = function access(request, response, next) {
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
