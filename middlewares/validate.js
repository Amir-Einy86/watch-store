// validate(parser) = a middleware that checks the request BEFORE the controller runs.
// A "parser" is a function (req) => ({ value, errors }).
//   - errors not empty -> answer 400 with the list of problems
//   - otherwise        -> the clean, converted values are stored in req.validated
// Controllers must read req.validated, never the raw req.query / req.params.
const AppError = require('../utils/AppError');

module.exports = (parser) => (req, res, next) => {
  const { value, errors } = parser(req);
  if (errors.length > 0) return next(new AppError('Invalid request', 400, errors));
  req.validated = value;
  next();
};
// Run validator rules and return errors.
