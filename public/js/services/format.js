// Number and text helpers (Persian digits, toman formatting).
const FA = '۰۱۲۳۴۵۶۷۸۹';
const AR = '٠١٢٣٤٥٦٧٨٩';

/** Converts Persian/Arabic digits to English digits ("۰۹۱۲" -> "0912"). */
export function normalizeDigits(value) {
  return String(value ?? '').replace(/[۰-۹٠-٩]/g, (d) => {
    const i = FA.indexOf(d);
    return String(i > -1 ? i : AR.indexOf(d));
  });
}

/** Formats a number with Persian digits and separators: 1250000 -> "۱٬۲۵۰٬۰۰۰". */
export function formatNumber(n) {
  return Number(n).toLocaleString('fa-IR');
}

export function formatToman(n) {
  return `${formatNumber(n)} ${window.SITE?.currency || 'تومان'}`;
}

/** Parses user input like "۱۲٬۰۰۰٬۰۰۰" or "12,000,000" into a number (or null). */
export function parseAmount(value) {
  const digits = normalizeDigits(value).replace(/[^\d]/g, '');
  return digits === '' ? null : Number(digits);
}

export function formatDate(ts) {
  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(ts));
}

export function maskPhone(phone) {
  const p = String(phone || '');
  return p.length >= 11 ? `${p.slice(0, 4)}***${p.slice(-4)}` : p;
}
