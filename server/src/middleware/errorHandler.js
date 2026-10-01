export function notFound(_req, res) {
  res.status(404).json({ success: false, message: 'Route not found' });
}

export function errorHandler(error, _req, res, _next) {
  const status = error.statusCode || (error.name === 'ValidationError' ? 400 : error.code === 11000 ? 409 : 500);
  const message = error.code === 11000
    ? 'An account with this email already exists'
    : status >= 500 && !error.statusCode
      ? 'Something went wrong. Please try again.'
      : error.message;
  if (status >= 500) console.error(error);
  res.status(status).json({ success: false, message });
}
