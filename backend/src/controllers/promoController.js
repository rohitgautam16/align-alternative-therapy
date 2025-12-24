// backend/src/controllers/promoController.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { resolveTrialDays } = require("../services/promoTrialEngine");

async function fetchStripePromoMetadata(code) {
  try {
    const promoList = await stripe.promotionCodes.list({
      code,
      active: true,
      limit: 1,
    });

    if (!promoList || promoList.data.length === 0) return null;

    const p = promoList.data[0];
    // normalize useful metadata (be defensive with fields)
    return {
      id: p.id,
      code: p.code,
      active: p.active,
      created: p.created ? new Date(p.created * 1000).toISOString() : null,
      expires_at: p.expires_at ? new Date(p.expires_at * 1000).toISOString() : null,
      redeem_by: p.redeem_by ? new Date(p.redeem_by * 1000).toISOString() : null,
      max_redemptions: p.max_redemptions ?? null,
      times_redeemed: p.times_redeemed ?? 0,
      coupon: p.coupon ? {
        id: p.coupon.id,
        name: p.coupon.name || null,
        amount_off: p.coupon.amount_off ?? null,
        percent_off: p.coupon.percent_off ?? null,
        currency: p.coupon.currency ?? null,
        duration: p.coupon.duration || null
      } : null
    };
  } catch (err) {
    console.error("fetchStripePromoMetadata error:", err);
    // fail-safe: do not crash validation because Stripe had an issue
    return null;
  }
}

exports.validatePromoCode = async (req, res) => {
  try {
    const { promoCode } = req.body;

    if (!promoCode || typeof promoCode !== "string" || promoCode.trim() === "") {
      return res.status(400).json({ valid: false, error: "Promo code required" });
    }

    const normalizedCode = promoCode.trim();

    // Resolve trial days using your existing logic (this encapsulates admin flags, stripe promo logic, etc.)
    const trialDays = await resolveTrialDays({
      trial: false,
      plan: null,
      promoCode: normalizedCode,
    });

    // Fetch extra metadata from Stripe (best-effort)
    const metadata = await fetchStripePromoMetadata(normalizedCode);

    const response = {
      valid: trialDays > 0,
      trialDays: trialDays || 0,
      promoCode: normalizedCode,
      metadata, // may be null if stripe error or not found
    };

    return res.json(response);
  } catch (err) {
    console.error("validatePromoCode error:", err);
    return res.status(500).json({ valid: false, error: "Server error validating promo code" });
  }
};
