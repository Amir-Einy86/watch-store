// Entry point: check settings, connect to MongoDB, then start the HTTP server.
const env = require('./config/env'); // first: stops here if .env is incomplete
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

async function start() {
  await connectDB(); // no point serving pages if the database is down

  const server = app.listen(env.port, () => {
    console.log(`TIMELESS is running on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  // Graceful shutdown: stop accepting requests, close the database, then exit.
  let closing = false;
  async function shutdown(signal) {
    if (closing) return;
    closing = true;
    console.log(`${signal} received, shutting down...`);
    setTimeout(() => process.exit(1), 10000).unref(); // safety net if something hangs
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  }
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error('Could not start the server:', err.message);
  process.exit(1);
});
