// DEMO authentication. It only simulates the flow in the browser.
// The real version (SMS OTP, secure cookies, server-side sessions) is built in the backend phase.
import { normalizeDigits } from './format.js';
import { readJSON, writeJSON, remove } from './storage.js';

const KEY = 'timeless.session';

/** Returns a normalized Iranian mobile number ("09123456789") or null if invalid. */
export function normalizePhone(input) {
  let p = normalizeDigits(input).replace(/[\s\-()]/g, '');
  if (p.startsWith('+98')) p = '0' + p.slice(3);
  else if (p.startsWith('0098')) p = '0' + p.slice(4);
  else if (p.startsWith('98') && p.length === 12) p = '0' + p.slice(2);
  else if (/^9\d{9}$/.test(p)) p = '0' + p;
  return /^09\d{9}$/.test(p) ? p : null;
}

export const isValidCode = (code) => /^\d{6}$/.test(normalizeDigits(code));

export const getSession = () => readJSON(KEY, null);
export const isLoggedIn = () => Boolean(getSession());

/** Username rule (demo + later server rule): 3-32 chars, letters, digits, dot, underscore. */
export const isValidUsername = (value) => /^[A-Za-z0-9_.]{3,32}$/.test(value);
export const isValidPassword = (value) => typeof value === 'string' && value.length >= 6 && value.length <= 64;

/** SMS login (demo): the session remembers the phone number. */
export function login(phone) {
  writeJSON(KEY, { phone, method: 'sms', at: Date.now(), demo: true });
}

/** Username + password login (demo): nothing is checked or stored except the username. */
export function loginWithUsername(username) {
  writeJSON(KEY, { username, method: 'password', at: Date.now(), demo: true });
}

export function logout() {
  remove(KEY);
}
