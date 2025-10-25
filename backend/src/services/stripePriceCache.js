'use strict';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const FREE_PRICE_ID = process.env.STRIPE_FREE_PREMIUM_PRICE_ID;

let cachedProducts = null;
let cachedPrices = null;

/**
 * Load all products and prices from Stripe (paginated) and cache them.
 */
async function loadProductsAndPrices() {
  const products = [];
  let startingAfter = null;

  do {
    const params = { limit: 100 };
    if (startingAfter) params.starting_after = startingAfter;

    const resp = await stripe.products.list(params);
    products.push(...resp.data);

    startingAfter = resp.has_more && resp.data.length > 0
      ? resp.data[resp.data.length - 1].id
      : null;
  } while (startingAfter);

  const prices = [];
  startingAfter = null;

  do {
    const params = { limit: 100, expand: ['data.product'] };
    if (startingAfter) params.starting_after = startingAfter;

    const resp = await stripe.prices.list(params);
    prices.push(...resp.data);

    startingAfter = resp.has_more && resp.data.length > 0
      ? resp.data[resp.data.length - 1].id
      : null;
  } while (startingAfter);

  cachedProducts = products;
  cachedPrices = prices;
  console.log(`Loaded ${products.length} products and ${prices.length} prices from Stripe.`);
  return { products, prices };
}

/**
 * Build product price map using STRIPE_BASE_PRODUCT_ID and include free-access.
 */
function buildProductPriceMap() {
  if (!cachedPrices) throw new Error('Prices not loaded yet');

  const BASE_PRODUCT_ID = process.env.STRIPE_BASE_PRODUCT_ID;
  const result = { base: { productId: null, name: null, prices: {} } };

  for (const price of cachedPrices) {
    const product = price.product?.id ? price.product : null;
    if (!product) continue;

    // Filter by base product if set
    if (BASE_PRODUCT_ID && product.id !== BASE_PRODUCT_ID) continue;

    if (!result.base.productId) {
      result.base.productId = product.id;
      result.base.name = product.name || 'Music Platform Premium';
    }

    const interval = price.recurring?.interval;
    if (interval === 'month') result.base.prices.monthly = price.id;
    else if (interval === 'year') result.base.prices.annual = price.id;

    // Add free-access price if it matches env var
    if (FREE_PRICE_ID && price.id === FREE_PRICE_ID) {
      result.base.prices.free_access = price.id;
    }
  }

  // Fallback if STRIPE_BASE_PRODUCT_ID set but not found
  if (BASE_PRODUCT_ID && !result.base.productId) {
    console.warn(
      `⚠️ STRIPE_BASE_PRODUCT_ID=${BASE_PRODUCT_ID} not found in fetched prices.`
    );
  }

  // Fallback if no base product configured
  if (!BASE_PRODUCT_ID && !result.base.productId) {
    console.warn(
      '⚠️ No STRIPE_BASE_PRODUCT_ID provided and no base product found — using first available recurring product.'
    );
    const firstActive = cachedPrices.find(p => p.recurring?.interval);
    if (firstActive?.product?.id) {
      result.base.productId = firstActive.product.id;
      result.base.name = firstActive.product.name || 'Music Platform Premium';
      const interval = firstActive.recurring?.interval;
      if (interval === 'month') result.base.prices.monthly = firstActive.id;
      else if (interval === 'year') result.base.prices.annual = firstActive.id;
    }
  }

  return result;
}

async function getProductPriceMap() {
  if (!cachedPrices) await loadProductsAndPrices();
  return buildProductPriceMap();
}

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
