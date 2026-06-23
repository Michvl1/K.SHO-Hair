// netlify/functions/webhook.js
//
// OPTIONAL but strongly recommended before going live.
//
// The success page can be faked by anyone typing ?booking=success in the URL,
// so it must NOT be what records the booking. Stripe calls this endpoint only
// when a payment genuinely succeeds — that is where you save the booking and
// send the confirmation email.

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const sig = event.headers['stripe-signature'];

  // Signature verification needs the EXACT raw body. Netlify sometimes
  // base64-encodes it, so decode in that case.
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64')
    : event.body;

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;

    // ✅ Payment is real and complete. This is where you would:
    //    1. Save the booking (database, Google Sheet, Airtable, etc.)
    //    2. Send the confirmation email — including the full address
    //    3. Block out that slot so it can't be double-booked
    console.log('PAID BOOKING:', {
      email: session.customer_details && session.customer_details.email,
      amount: session.amount_total,
      details: session.metadata,
    });
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
