// Reads settings from environment variables (they come from the .env file) and checks them
// once, at start-up. If something required is missing the app stops immediately with a clear
// message instead of failing later in a confusing way ("fail fast").

const nodeEnv = process.env.NODE_ENV || 'development';

// Variables the app cannot run without. More are added in later steps (session secret, SMS key...).
const REQUIRED = ['MONGO_URI'];

const missing = REQUIRED.filter((name) => !process.env[name] || !process.env[name].trim());
if (missing.length > 0) {
  throw new Error(
    `Missing environment variable(s): ${missing.join(', ')}. ` +
      'Copy .env.example to .env and fill them in.'
  );
}

const port = Number(process.env.PORT) || 3000;
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`PORT must be a whole number between 1 and 65535 (got "${process.env.PORT}").`);
}

module.exports = {
  nodeEnv,
  isProd: nodeEnv === 'production',
  port,
  mongoUri: process.env.MONGO_URI.trim(),
};
