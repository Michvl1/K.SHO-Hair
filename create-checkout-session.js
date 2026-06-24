const Stripe = require('stripe');

const stripe = Stripe(process.env.sk_test_51TlAyC2ZSem0gzvsVBL01NIf90GHqdolehEsMJZfGDdWO1R2c0E0SvH3kery9Vhk3GKsYF6AKqidMFwR5o1j08U700TWcys7Dw);

exports.handler = async (event) => {

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };
  }

  try {

    const data = JSON.parse(event.body);

    const amount =
      data.payMode === 'deposit'
      ? 1500
      : Math.round(data.totalPrice * 100);

    const session =
      await stripe.checkout.sessions.create({

        payment_method_types: ['card'],
        mode: 'payment',

        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: {
              name: data.service
            },
            unit_amount: amount
          },
          quantity: 1
        }],

        success_url:
          'https://michvl1.github.io/K.SHO-Hair/success.html',

        cancel_url:
          'https://michvl1.github.io/K.SHO-Hair/cancel.html'
      });

    return {
      statusCode: 200,
      body: JSON.stringify({
        url: session.url
      })
    };

  } catch (err) {

    return {
      statusCode: 500,
      body: err.message
    };

  }
};
