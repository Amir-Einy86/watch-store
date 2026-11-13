// Demo product data (phase 1). It is separate from the UI on purpose: in the backend phase
// this file is replaced by real API responses with the same shape (see services/productService.js).
//
// Product shape:
//   id, slug, name, brand, category ('men' | 'women' | 'smart'),
//   price (toman, SAMPLE value), strapType ('leather' | 'steel' | 'silicone' | 'fabric' | null),
//   image (path or null), description (string or null), stock (SAMPLE value), active (bool)
//
// Notes about the data:
//  - Prices and stock are sample values chosen for the demo, not real prices.
//  - strapType was read from the photos; please confirm it.
//  - Descriptions were not provided yet, so they are null and the UI says "coming soon".
//  - Smart watches have no photos yet; the UI shows an image icon instead.

export const STRAP_LABELS = {
  leather: 'چرمی',
  steel: 'استیل',
  silicone: 'سیلیکونی',
  fabric: 'پارچه‌ای',
};

export const CATEGORY_ORDER = ['men', 'women', 'smart'];

// [file, name, brand, strapType, price, stock]
const MEN = [
  ['01-rolex-submariner', 'Rolex Submariner', 'Rolex', 'steel', 485000000, 2],
  ['02-omega-speedmaster', 'Omega Speedmaster', 'Omega', 'steel', 312000000, 3],
  ['03-seiko-presage', 'Seiko Presage', 'Seiko', 'leather', 42500000, 8],
  ['04-tissot-prx', 'Tissot PRX', 'Tissot', 'steel', 38900000, 6],
  ['05-casio-gshock-ga2100', 'Casio G-Shock GA-2100', 'Casio', 'silicone', 9800000, 14],
  ['06-citizen-eco-drive', 'Citizen Eco-Drive', 'Citizen', 'steel', 21400000, 9],
  ['07-hamilton-khaki-field', 'Hamilton Khaki Field', 'Hamilton', 'fabric', 33800000, 5],
  ['08-tag-heuer-carrera', 'TAG Heuer Carrera', 'TAG Heuer', 'steel', 265000000, 2],
  ['09-fossil-grant', 'Fossil Grant', 'Fossil', 'leather', 11900000, 12],
  ['10-apple-watch-ultra', 'Apple Watch Ultra', 'Apple', 'fabric', 62000000, 4],
  ['11-orient-bambino', 'Orient Bambino', 'Orient', 'leather', 14700000, 10],
  ['12-bulova-precisionist', 'Bulova Precisionist', 'Bulova', 'steel', 27500000, 6],
  ['13-seiko-5-sports', 'Seiko 5 Sports', 'Seiko', 'steel', 16900000, 11],
  ['14-casio-edifice', 'Casio Edifice', 'Casio', 'steel', 12600000, 13],
  ['15-skagen-aaren', 'Skagen Aaren', 'Skagen', 'steel', 10400000, 7],
];

const WOMEN = [
  ['01-rolex-datejust', 'Rolex Datejust', 'Rolex', 'steel', 520000000, 1],
  ['02-cartier-tank', 'Cartier Tank', 'Cartier', 'leather', 395000000, 2],
  ['03-omega-seamaster', 'Omega Seamaster', 'Omega', 'steel', 288000000, 3],
  ['04-tissot-prx', 'Tissot PRX', 'Tissot', 'steel', 36800000, 7],
  ['05-casio-baby-g', 'Casio Baby-G', 'Casio', 'silicone', 8900000, 15],
  ['06-citizen-eco-drive', 'Citizen Eco-Drive', 'Citizen', 'steel', 19700000, 8],
  ['07-hamilton-jazzmaster', 'Hamilton Jazzmaster', 'Hamilton', 'leather', 41200000, 5],
  ['08-swarovski-crystal', 'Swarovski Crystal', 'Swarovski', 'steel', 18300000, 0],
  ['09-longines-presence', 'Longines Presence', 'Longines', 'leather', 52000000, 4],
  ['10-michael-kors-access', 'Michael Kors Access', 'Michael Kors', 'silicone', 24500000, 6],
  ['11-seiko-presage', 'Seiko Presage', 'Seiko', 'leather', 39600000, 7],
  ['12-fossil-jacqueline', 'Fossil Jacqueline', 'Fossil', 'steel', 13200000, 10],
  ['13-daniel-wellington', 'Daniel Wellington', 'Daniel Wellington', 'steel', 12800000, 12],
  ['14-guess-luna', 'Guess Luna', 'Guess', 'steel', 11400000, 9],
  ['15-skagen-anita', 'Skagen Anita', 'Skagen', 'fabric', 9700000, 8],
];

const SMART_PRICES = [8500000, 12900000, 17800000, 21500000, 26000000, 31500000, 38000000, 44500000, 51000000, 58000000];
const SMART_STOCK = [10, 8, 6, 9, 5, 3, 7, 4, 2, 6];

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function fromRows(category, rows) {
  return rows.map(([file, name, brand, strapType, price, stock]) => ({
    id: `${category}-${file.slice(0, 2)}`,
    slug: `${category}-${slugify(name)}`,
    name,
    brand,
    category,
    price,
    strapType,
    image: `/images/${category}/${file}.png`,
    description: null,
    stock,
    active: true,
  }));
}

const smart = SMART_PRICES.map((price, i) => {
  const n = String(i + 1).padStart(2, '0');
  return {
    id: `smart-${n}`,
    slug: `smart-watch-${n}`,
    name: `ساعت هوشمند ${n}`,
    brand: null,
    category: 'smart',
    price,
    strapType: null,
    image: null, // photos not provided yet
    description: null,
    stock: SMART_STOCK[i],
    active: true,
  };
});

export const PRODUCTS = [...fromRows('men', MEN), ...fromRows('women', WOMEN), ...smart];
