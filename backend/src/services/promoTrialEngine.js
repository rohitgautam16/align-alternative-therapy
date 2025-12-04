const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


async function resolveTrialDays({ trial, plan, promoCode }) {
  // 1. Admin trial override — always wins
  if (trial) return 30;

  // 2. Public promo trial (ONLY when promo applied)
  if (promoCode) {
    const promo = await stripe.promotionCodes.list({
      code: promoCode,
      active: true,
      limit: 1,
    });

    if (promo.data.length > 0) {
      const p = promo.data[0];

      if (p.code.toUpperCase() === "7DAYSFREE") {
        return 7;
      }
    }
  }

  return 0;
}
module.exports = { resolveTrialDays };