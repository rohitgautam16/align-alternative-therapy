'use strict';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../db');

// === Utility: format currency minor units ===
const toMinorUnits = (amount) => Math.round(Number(amount) * 100);

// --- 1. ADMIN: Create payment link for a recommendation ---
exports.createPaymentLink = async function createPaymentLink(req, res) {
  try {
    const { recommendationId, price } = req.body;
    const adminId = req.user?.id || null;

    // 🔹 Default currency from .env or fallback to CAD
    const DEFAULT_CURRENCY = process.env.STRIPE_DEFAULT_CURRENCY || 'CAD';

    if (!recommendationId || !price) {
      return res.status(400).json({ error: 'recommendationId and price are required' });
    }

 
    const [[rec]] = await db.query(
      `SELECT id, user_id, payment_status, title
         FROM pb_recommendations
        WHERE id = ? LIMIT 1`,
      [recommendationId]
    );

    if (!rec) return res.status(404).json({ error: 'Recommendation not found' });
    if (rec.payment_status === 'paid')
      return res.status(400).json({ error: 'Already paid' });

   
    const product = await stripe.products.create({
      name: rec.title || `PB Recommendation #${rec.id}`,
      metadata: { recommendation_id: rec.id, user_id: rec.user_id },
    });

    const toMinorUnits = (amount) => Math.round(Number(amount) * 100);

   
    const priceObj = await stripe.prices.create({
      product: product.id,
      unit_amount: toMinorUnits(price),
      currency: DEFAULT_CURRENCY.toLowerCase(),
    });


    const link = await stripe.paymentLinks.create({
      line_items: [{ price: priceObj.id, quantity: 1 }],
      metadata: {
        recommendation_id: rec.id,
        user_id: rec.user_id,
        created_by_admin: adminId,
      },
      after_completion: {
        type: 'redirect',
        redirect: { url: `${process.env.FRONTEND_URL}/dashboard?pb=success` },
      },
    });

    await db.query(
      `UPDATE pb_recommendations
          SET price_cents = ?, currency = ?, payment_status = 'pending',
              payment_link_id = ?, payment_link_url = ?, created_by_admin_id = ?
        WHERE id = ?`,
      [toMinorUnits(price), DEFAULT_CURRENCY.toUpperCase(), link.id, link.url, adminId, rec.id]
    );

    return res.json({
      success: true,
      paymentLink: link.url,
      paymentLinkId: link.id,
      amount: price,
      currency: DEFAULT_CURRENCY.toUpperCase(),
    });
  } catch (err) {
    console.error('createPaymentLink error:', err);
    return res.status(500).json({ error: 'Failed to create payment link' });
  }
};



// --- 2. USER: Get payment status for recommendation ---
exports.getRecommendationPaymentStatus = async function (req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const [[rec]] = await db.query(
      `SELECT id, user_id, payment_status, price_cents, currency, payment_link_url
         FROM pb_recommendations
        WHERE id = ? LIMIT 1`,
      [id]
    );

    if (!rec) return res.status(404).json({ error: 'Not found' });
    if (userId && rec.user_id !== userId)
      return res.status(403).json({ error: 'Forbidden' });

    return res.json({
      status: rec.payment_status,
      price: (rec.price_cents || 0) / 100,
      currency: rec.currency,
      paymentLinkUrl: rec.payment_link_url,
    });
  } catch (err) {
    console.error('getRecommendationPaymentStatus error:', err);
    return res.status(500).json({ error: 'Failed to get status' });
  }
};
