'use strict';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

let cachedProducts = null;
let cachedPrices = null;

/**
 * Load all products and prices from Stripe (paginated) and cache them.
 * This implementation is defensive: only passes starting_after when truthy.
 */
async function loadProductsAndPrices() {
  const products = [];
  let startingAfter = null;

  // Load products (paginated)
  do {
    const params = { limit: 100 };
    if (startingAfter) params.starting_after = startingAfter;

    const response = await stripe.products.list(params);
    products.push(...response.data);

    if (response.has_more && response.data.length > 0) {
      startingAfter = response.data[response.data.length - 1].id;
    } else {
      startingAfter = null;
    }
  } while (startingAfter);

  // Load prices (paginated) and expand product in each price for metadata
  const prices = [];
  startingAfter = null;
  do {
    const params = { limit: 100, expand: ['data.product'] };
    if (startingAfter) params.starting_after = startingAfter;

    const response = await stripe.prices.list(params);
    prices.push(...response.data);

    if (response.has_more && response.data.length > 0) {
      startingAfter = response.data[response.data.length - 1].id;
    } else {
      startingAfter = null;
    }
  } while (startingAfter);

  cachedProducts = products;
  cachedPrices = prices;
  console.log(`Loaded ${products.length} products and ${prices.length} prices from Stripe.`);
  return { products, prices };
}

// Build a structured map of product types and prices keyed by billing interval
function buildProductPriceMap() {
  if (!cachedPrices) throw new Error('Prices not loaded yet');
  const result = {
    base: { productId: null, name: null, prices: {} },
    addon: { productId: null, name: null, prices: {} },
  };

  for (const price of cachedPrices) {
    // price.product may be an id or expanded object depending on response; handle both
    const product = price.product && price.product.id ? price.product : null;
    const metadata = product ? (product.metadata || {}) : {};

    // fallback: if product is not expanded, try to use price.product as id (we'll ignore metadata)
    const type = metadata.type ? String(metadata.type).toLowerCase() : null;
    if (!type) continue;
    if (!['base', 'addon'].includes(type)) continue;

    if (!result[type].productId) {
      result[type].productId = product.id;
      result[type].name = metadata.name || product.name || null;
    }

    if (price.recurring?.interval === 'month') {
      result[type].prices.monthly = price.id;
    } else if (price.recurring?.interval === 'year') {
      result[type].prices.annual = price.id;
    }
  }

  return result;
}

async function getProductPriceMap() {
  if (!cachedPrices) {
    await loadProductsAndPrices();
  }
  return buildProductPriceMap();
}

// Optional: expose a function to force-refresh cache
async function loadAndCache(force = false) {
  if (force) {
    cachedProducts = null;
    cachedPrices = null;
  }
  return getProductPriceMap();
}

module.exports = {
  loadProductsAndPrices,
  getProductPriceMap,
  loadAndCache,
};
