const stripe = require("stripe")(process.env.sk_test_51TlAyC2ZSem0gzvsVBL01NIf90GHqdolehEsMJZfGDdWO1R2c0E0SvH3kery9Vhk3GKsYF6AKqidMFwR5o1j08U700TWcys7Dw);

exports.handler = async (event) => {
  const sig = event.headers["stripe-signature"];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.whsec_TfU5Bogezy06NAVCDd6Xe8bH3mOWFU44
    );
  } catch (err) {
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object;
    const booking = session.metadata; // service, size, date, time, payMode

    // ✅ Payment confirmed. Do your fulfilment here:
    //   - save the booking to a database / Google Sheet / Airtable
    //   - email yourself + the client (e.g. via Resend, SendGrid, Postmark)
    //   - mark that time slot as taken
    console.log("Confirmed booking:", booking, session.customer_details?.email);
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
