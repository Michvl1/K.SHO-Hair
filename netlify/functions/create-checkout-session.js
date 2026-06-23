// netlify/functions/create-checkout-session.js
//
// Creates a Stripe Checkout session and returns its URL.
// The browser redirects the client to that URL to pay.

const Stripe = require('stripe');

const DEPOSIT_PENCE = 1500; // £15 deposit — fixed and controlled by the server

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not configured');
      return { statusCode: 500, body: JSON.stringify({ error: 'Payment is not configured yet' }) };
    }

    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const SITE_URL = process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://lucent-lily-2cfac9.netlify.app';
    const { payMode, totalPrice, service, size, dateStr, timeStr } =
      JSON.parse(event.body || '{}');

    if (!service || !size) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing booking details' }) };
    }

    // --- Work out the amount, server-side ---
    // Deposit is a fixed amount the browser cannot influence — recommended.
    //
    // "Pay in full" currently trusts the total the browser sent. Before you
    // rely on full payment for real, validate it against your own price list
    // here so a user can't tamper with the amount. (See SETUP.md.)
    let amountPence;
    let label;

    if (payMode === 'full') {
      const pounds = Number(totalPrice);
      if (!Number.isFinite(pounds) || pounds <= 0 || pounds > 1000) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid amount' }) };
      }
      amountPence = Math.round(pounds * 100);
      label = `${service} (${size})`;
    } else {
      amountPence = DEPOSIT_PENCE;
      label = `Booking deposit — ${service} (${size})`;
    }

    const productData = { name: label };
    if (dateStr && timeStr) productData.description = `${dateStr} at ${timeStr}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'gbp',
            unit_amount: amountPence,
            product_data: productData,
          },
        },
      ],
      // Stored on the payment so you can read it back later (webhook/dashboard)
      metadata: {
        service,
        size,
        date: dateStr || '',
        time: timeStr || '',
        payMode: payMode || 'deposit',
      },
      success_url: `${SITE_URL}/?booking=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/?booking=cancelled`,
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    console.error('Stripe error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Could not start payment' }) };
  }
};
