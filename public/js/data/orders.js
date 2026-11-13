// Demo orders for the admin panel. They are generated from the demo products so they
// always match the catalog. These are NOT real orders.

export const ORDER_STATUSES = [
  { key: 'new', label: 'جدید' },
  { key: 'processing', label: 'در حال پردازش' },
  { key: 'shipped', label: 'ارسال‌شده' },
  { key: 'delivered', label: 'تحویل‌شده' },
  { key: 'canceled', label: 'لغوشده' },
];

// [productId, qty][] and a default status for each demo order
const SEED = [
  ['09121110001', [['men-03', 1]], 'delivered', 21],
  ['09121110002', [['women-05', 2], ['women-13', 1]], 'delivered', 19],
  ['09121110003', [['men-05', 1], ['men-14', 1]], 'shipped', 14],
  ['09121110004', [['women-09', 1]], 'processing', 11],
  ['09121110005', [['men-10', 1]], 'processing', 9],
  ['09121110006', [['women-04', 1], ['women-12', 1]], 'new', 7],
  ['09121110007', [['men-11', 1]], 'new', 5],
  ['09121110008', [['smart-02', 1]], 'new', 4],
  ['09121110009', [['men-13', 2]], 'canceled', 3],
  ['09121110010', [['women-15', 1]], 'new', 2],
  ['09121110011', [['men-06', 1], ['men-09', 1]], 'new', 1],
  ['09121110012', [['smart-05', 1]], 'new', 0],
];

export function buildOrders(findProduct, now = Date.now()) {
  return SEED.map(([phone, lines, status, daysAgo], i) => {
    const items = lines
      .map(([id, qty]) => {
        const p = findProduct(id);
        return p ? { id, name: p.name, qty, unitPrice: p.price } : null;
      })
      .filter(Boolean);
    return {
      id: `KS-${1001 + i}`,
      phone,
      items,
      total: items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0),
      status,
      createdAt: now - daysAgo * 86400000,
    };
  });
}
