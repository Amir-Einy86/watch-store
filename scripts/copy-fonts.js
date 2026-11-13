// Copies the web fonts (Vazirmatn, Oswald, Sacramento) from node_modules into public/fonts.
// Runs automatically after `npm install`. It never fails the install: if a font is missing,
// the CSS simply falls back to the next font in the stack.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'public', 'fonts');
fs.mkdirSync(out, { recursive: true });

function walk(dir, found = []) {
  if (!fs.existsSync(dir)) return found;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, found);
    else found.push(full);
  }
  return found;
}

function copy(from, toName) {
  if (!from) {
    console.warn(`[fonts] not found: ${toName}`);
    return;
  }
  fs.copyFileSync(from, path.join(out, toName));
  console.log(`[fonts] ${toName}`);
}

// Vazirmatn: prefer the variable font, fall back to the regular weight.
const vazirFiles = walk(path.join(root, 'node_modules', 'vazirmatn')).filter((f) => f.endsWith('.woff2'));
const vazir =
  vazirFiles.find((f) => /wght|variable/i.test(path.basename(f))) ||
  vazirFiles.find((f) => /Regular/i.test(path.basename(f)));
copy(vazir, 'Vazirmatn.woff2');

// Fontsource packages ship one woff2 file per weight and subset.
function fontsource(pkg, weight, toName) {
  const file = path.join(root, 'node_modules', '@fontsource', pkg, 'files', `${pkg}-latin-${weight}-normal.woff2`);
  copy(fs.existsSync(file) ? file : null, toName);
}
fontsource('oswald', 400, 'Oswald-400.woff2');
fontsource('oswald', 500, 'Oswald-500.woff2');
fontsource('sacramento', 400, 'Sacramento-400.woff2');
