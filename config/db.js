// MongoDB connection (Mongoose).
const mongoose = require('mongoose');
const env = require('./env');

// Unknown fields in a query filter are ignored instead of silently matching everything.
mongoose.set('strictQuery', true);

let listening = false;

// Connection events are only logged here; they never print the connection string
// (it can contain the database password).
function logConnectionEvents() {
  if (listening) return;
  listening = true;
  const conn = mongoose.connection;
  conn.on('connected', () => console.log(`MongoDB connected: ${conn.host}/${conn.name}`));
  conn.on('disconnected', () => console.warn('MongoDB disconnected'));
  conn.on('error', (err) => console.error('MongoDB error:', err.message));
}

/** Opens the connection. Rejects if the database cannot be reached within 5 seconds. */
async function connectDB() {
  logConnectionEvents();
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 5000, // give up quickly instead of waiting 30 s
    autoIndex: !env.isProd, // build indexes automatically in development only
  });
  return mongoose.connection;
}

/** Closes the connection (used when the server shuts down). */
async function disconnectDB() {
  await mongoose.connection.close();
}

/** true only while the connection is fully open (readyState 1). */
function isConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDB, disconnectDB, isConnected };
