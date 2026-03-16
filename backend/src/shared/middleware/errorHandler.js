// Centralised error handler — must be registered LAST in Express
function errorHandler(err, req, res, next) {
  const status  = err.status  || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${status}] ${req.method} ${req.path} —`, err.message);
  }

  res.status(status).json({
    error:   message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

// Async route wrapper — eliminates try/catch boilerplate
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { errorHandler, asyncHandler };
