// GET /health — tells whether the app can reach its database.
// It reports only "ok / degraded", never connection details or error messages.
const { isConnected } = require('../config/db');

exports.health = (req, res) => {
  const dbUp = isConnected();
  res.status(dbUp ? 200 : 503).json({
    status: dbUp ? 'ok' : 'degraded',
    db: dbUp ? 'connected' : 'disconnected',
    uptimeSeconds: Math.round(process.uptime()),
  });
};
