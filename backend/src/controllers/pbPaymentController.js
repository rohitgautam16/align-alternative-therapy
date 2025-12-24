'use strict';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../db');

// === Utility: format currency minor units ===
const toMinorUnits = (amount) => Math.round(Number(amount) * 100);

exports.createPaymentLink = async function createPaymentLink(req, res) {
  try {
    const { recommendationId, price, isFree } = req.body;
    const adminId = req.user?.id || null;

    // 🔹 Default currency & product from env
    const DEFAULT_CURRENCY = process.env.STRIPE_DEFAULT_CURRENCY || 'USD';
    const GLOBAL_PRODUCT_ID = process.env.STRIPE_PERSONALIZE_PRODUCT_ID;

    if (!recommendationId) {
      return res.status(400).json({ error: 'recommendationId is required' });
    }

    // --- Fetch Recommendation ---
    const [[rec]] = await db.query(
      `SELECT id, user_id, payment_status, title
         FROM pb_recommendations
        WHERE id = ? LIMIT 1`,
      [recommendationId]
    );

    if (!rec) return res.status(404).json({ error: 'Recommendation not found' });
    if (rec.payment_status === 'paid')
      return res.status(400).json({ error: 'Already paid' });

    // ✅ FREE RECOMMENDATION SHORT-CIRCUIT
    if (isFree || Number(price) === 0) {
      await db.query(
        `UPDATE pb_recommendations
           SET payment_status = 'free',
               price_cents = 0,
               currency = ?,
               paid_at = NOW(),
               updated_at = NOW(),
               created_by_admin_id = ?
         WHERE id = ?`,
        [DEFAULT_CURRENCY.toUpperCase(), adminId, rec.id]
      );

      return res.json({
        success: true,
        paymentLink: null,
        amount: 0,
        currency: DEFAULT_CURRENCY.toUpperCase(),
        status: 'free',
        message: 'Recommendation marked as free',
      });
    }

    // --- Validation for paid recommendations ---
    if (!price) {
      return res.status(400).json({ error: 'Price is required for paid recommendations' });
    }

    if (!GLOBAL_PRODUCT_ID) {
      return res.status(500).json({
        error: 'Missing STRIPE_PERSONALIZE_PRODUCT_ID in environment variables.',
      });
    }

    // --- Create Price with nickname + metadata ---
    const priceObj = await stripe.prices.create({
      product: GLOBAL_PRODUCT_ID,
      unit_amount: toMinorUnits(price),
      currency: DEFAULT_CURRENCY.toLowerCase(),
      nickname: `PB-REC-${rec.id} | USER-${rec.user_id} | ${price} ${DEFAULT_CURRENCY.toUpperCase()}`,
      metadata: {
        purpose: 'personalized_recommendation_payment',
        recommendation_id: rec.id.toString(),
        user_id: rec.user_id.toString(),
        created_by_admin: adminId ? adminId.toString() : 'system',
        internal_label: `PB_REC_${rec.id}_USER_${rec.user_id}`,
      },
    });

    // --- Create Payment Link ---
    const link = await stripe.paymentLinks.create({
      line_items: [{ price: priceObj.id, quantity: 1 }],
      metadata: {
        purpose: 'personalized_recommendation_payment',
        recommendation_id: rec.id.toString(),
        user_id: rec.user_id.toString(),
        created_by_admin: adminId ? adminId.toString() : 'system',
      },
      after_completion: {
        type: 'redirect',
        redirect: { url: `${process.env.FRONTEND_URL}/dashboard?pb=success` },
      },
    });

    // --- Update DB ---
    await db.query(
      `UPDATE pb_recommendations
          SET price_cents = ?, 
              currency = ?, 
              payment_status = 'pending',
              payment_link_id = ?, 
              payment_link_url = ?, 
              stripe_price_id = ?, 
              stripe_product_id = ?, 
              created_by_admin_id = ?
        WHERE id = ?`,
      [
        toMinorUnits(price),
        DEFAULT_CURRENCY.toUpperCase(),
        link.id,
        link.url,
        priceObj.id,
        GLOBAL_PRODUCT_ID,
        adminId,
        rec.id,
      ]
    );

    return res.json({
      success: true,
      paymentLink: link.url,
      paymentLinkId: link.id,
      amount: price,
      currency: DEFAULT_CURRENCY.toUpperCase(),
      status: 'pending',
    });
  } catch (err) {
    console.error('createPaymentLink error:', err);
    return res.status(500).json({ error: 'Failed to create payment link' });
  }
};



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

    let status = rec.payment_status;

    // ⚡️ Instant Stripe fallback check if not yet paid
    if (status !== 'paid' && rec.payment_link_url) {
      try {
        // Extract the payment link ID from the URL
        const match = rec.payment_link_url.match(/links\/(pl_[A-Za-z0-9]+)/);
        if (match) {
          const linkId = match[1];
          const link = await stripe.paymentLinks.retrieve(linkId);

          // Check latest payment if available
          if (link.active === false || link.after_completion) {
            // optionally confirm via PaymentIntent if you store it
          }

          // Alternative: query PaymentIntents filtered by metadata (recommended)
          const payments = await stripe.paymentIntents.list({
            limit: 1,
            metadata: { recommendation_id: String(rec.id) },
          });
          const intent = payments.data[0];
          if (intent && intent.status === 'succeeded') {
            status = 'paid';

            // update DB instantly to reflect the real payment state
            await db.query(
              `UPDATE pb_recommendations
                 SET payment_status='paid', paid_at=NOW()
               WHERE id = ?`,
              [rec.id]
            );
          }
        }
      } catch (stripeErr) {
        console.warn('Stripe verification fallback failed:', stripeErr.message);
      }
    }

    return res.json({
      status,
      price: (rec.price_cents || 0) / 100,
      currency: rec.currency,
      paymentLinkUrl: rec.payment_link_url,
    });
  } catch (err) {
    console.error('getRecommendationPaymentStatus error:', err);
    return res.status(500).json({ error: 'Failed to get status' });
  }
};

