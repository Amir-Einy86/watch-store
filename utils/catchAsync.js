// Express 4 does NOT catch errors thrown inside async functions (a rejected promise).
// This wrapper catches them and passes them to next(), which sends them to the error handler.
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
// Wrapper to forward async errors to the error handler.
