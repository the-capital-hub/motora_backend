function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err.code === 11000) {
    return res.status(409).json({ message: 'A record with these details already exists.' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid resource identifier.' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed',
      errors: Object.fromEntries(
        Object.entries(err.errors || {}).map(([key, value]) => [key, value.message]),
      ),
    });
  }

  if (err.message === 'CORS origin not allowed') {
    return res.status(403).json({ message: 'Origin is not allowed.' });
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  } else {
    console.error(`${req.method} ${req.originalUrl}:`, err.message);
  }

  return res.status(err.statusCode || err.status || 500).json({
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'Server error',
  });
}

module.exports = { notFound, errorHandler };
