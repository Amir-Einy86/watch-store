// Insert sample watches (images and descriptions will be provided later; prices set by Claude).
// Seed script: puts the 40 demo watches from the frontend into MongoDB.
//
//   npm run seed               add the products that are not in the database yet
//   npm run seed -- --fresh    delete ALL products first, then add them again
//   npm run seed -- --dry-run  only check the data against the model; does not touch the database
//
// The data is read from public/js/data/products.js so there is one single source of truth.
// Prices and stock there are SAMPLE values, and strapType was guessed from the photos.
const path = require('path');
const { pathToFileURL } = require('url');
const mongoose = require('mongoose');
const Product = require('../models/Product');

const args = process.argv.slice(2);
const FRESH = args.includes('--fresh');
const DRY_RUN = args.includes('--dry-run');

// products.js is an ES module (it uses "export"), so a CommonJS file loads it with import().
async function loadDemoProducts() {
  const file = path.join(__dirname, '..', 'public', 'js', 'data', 'products.js');
  const mod = await import(pathToFileURL(file).href);
  return mod.PRODUCTS;
}

// Keep only the fields the model knows. The frontend "id" is dropped: MongoDB makes its own _id.
function toDocument(p) {
  return {
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: p.price,
    strapType: p.strapType,
    image: p.image,
    description: p.description,
    stock: p.stock,
    active: p.active,
  };
}

async function main() {
  const docs = (await loadDemoProducts()).map(toDocument);

  // Validate every document with the model's rules before writing anything.
  const problems = [];
  for (const d of docs) {
    const err = new Product(d).validateSync();
    if (err) problems.push(`${d.slug}: ${Object.values(err.errors).map((e) => e.message).join('; ')}`);
  }
  if (problems.length) {
    console.error('Invalid data, nothing was written:\n  ' + problems.join('\n  '));
    process.exit(1);
  }
  const slugs = new Set(docs.map((d) => d.slug));
  if (slugs.size !== docs.length) {
    console.error('Duplicate slugs in the demo data, nothing was written.');
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log(`Dry run OK: ${docs.length} products are valid. The database was not touched.`);
    return;
  }

  // Only now load env + connect (so --dry-run works even without a database).
  const { connectDB, disconnectDB } = require('../config/db');
  await connectDB();
  try {
    if (FRESH) {
      const del = await Product.deleteMany({});
      console.log(`Deleted ${del.deletedCount} existing products.`);
    }
    // upsert by slug + $setOnInsert: a missing product is created, an existing one is left
    // untouched, so running the seed twice never duplicates or overwrites admin edits.
    const result = await Product.bulkWrite(
      docs.map((d) => ({
        updateOne: {
          filter: { slug: d.slug },
          update: { $setOnInsert: d },
          upsert: true,
        },
      }))
    );
    console.log(`Added ${result.upsertedCount} new, skipped ${docs.length - result.upsertedCount} that already existed.`);

    // Prove it: count what is really in the database.
    const byCategory = await Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
    console.log('In database now:', byCategory.map((c) => `${c._id}=${c.count}`).join(', '));
  } finally {
    await disconnectDB();
  }
}

main().catch(async (err) => {
  console.error('Seed failed:', err.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});
