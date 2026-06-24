const stripe = require("stripe")(process.env.sk_test_51TlAyC2ZSem0gzvsVBL01NIf90GHqdolehEsMJZfGDdWO1R2c0E0SvH3kery9Vhk3GKsYF6AKqidMFwR5o1j08U700TWcys7Dw);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { payMode, totalPrice, service, size, dateStr, timeStr } =
      JSON.parse(event.body);

    // Decide what to charge now. Deposit is a fixed £15.
    // Amounts are in pence (Stripe uses the smallest currency unit).
    const isDeposit = payMode === "deposit";
    const amountPence = isDeposit ? 1500 : Math.round(Number(totalPrice) * 100);

    if (!amountPence || amountPence < 100) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid amount" }) };
    }

    const label = isDeposit
      ? `Booking deposit — ${service} (${size})`
      : `${service} (${size}) — paid in full`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: label,
              description: `${dateStr} at ${timeStr}`,
            },
            unit_amount: amountPence,
          },
          quantity: 1,
        },
      ],
      // Stripe sends the client back here. Your frontend reads these params.
      success_url: `https://michvl1.github.io/K.SHO-Hair/?booking=success`,
      cancel_url: `https://michvl1.github.io/K.SHO-Hair/?booking=cancelled`,
      // Stored on the payment so you can see the booking details in Stripe.
      metadata: { service, size, date: dateStr, time: timeStr, payMode },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
