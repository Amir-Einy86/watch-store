// AppError = an error WE throw on purpose (wrong input, not found, ...).
// It carries an HTTP status code so the central error handler knows what to answer.
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode; // 400 bad input, 404 not found, ...
    this.details = details; // optional list of field problems
    this.isOperational = true; // "expected" error: its message is safe to show to the client
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
// Custom error class with statusCode.
