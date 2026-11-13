
// Central error handling: one place decides what the client sees when something fails.
const AppError = require('../utils/AppError');
const env = require('../config/env');

// Any /api/... URL that no route answered -> JSON 404 (not the HTML 404 page).
function apiNotFound(req, res, next) {
  next(new AppError('API route not found', 404));
}

// Express knows this is an error handler because it has FOUR parameters (err first).
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err); // answer already started: let Express close it

  let status = err.statusCode || 500;
  let message = err.isOperational ? err.message : 'Something went wrong';

  // A value Mongoose could not convert (for example a bad id) is the client's mistake.
  if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid value';
  }

  // Unexpected errors (bugs, database down) are logged for us, but never explained to the client.
  if (status >= 500) {
    console.error('Unexpected error:', env.isProd ? err.message : err);
  }

  if (req.path.startsWith('/api')) {
    const body = { status: 'error', message };
    if (err.isOperational && err.details) body.errors = err.details;
    return res.status(status).json(body);
  }
  return res.status(status).type('text').send(message);
}

module.exports = { apiNotFound, errorHandler };
// Central error handler and 404 handler.
