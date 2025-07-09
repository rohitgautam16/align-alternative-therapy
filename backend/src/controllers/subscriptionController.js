// src/controllers/subscriptionController.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const {
  createOrUpdateSubscriptionSession,
  handleStripeWebhook,
} = require('../services/subscriptionService');

/**
 * POST /api/subscribe/checkout
 */
async function checkoutController(req, res) {
  try {
    const { plan, trial } = req.body;
    const userId = req.user.id;
    const result = await createOrUpdateSubscriptionSession(userId, plan, !!trial);
    if (result.type === 'new') {
      return res.json({ url: result.session.url });
    } else {
      return res.json({ subscription: result.subscription });
    }
  } catch (err) {
    console.error('Checkout error:', err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/webhooks/stripe
 */
async function webhookController(req, res) {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(200).send('ok');
  }
  try {
    await handleStripeWebhook(event);
  } catch (err) {
    console.error('Webhook handling error:', err);
  }
  return res.status(200).send('ok');
}

module.exports = { checkoutController, webhookController };
