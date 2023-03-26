const stripe = require("stripe")("sk_test_51CkpKnAShxTdv5i7NOFC5GsMZWzXrjxGWClX0J6cOu9gfMRrISHDLK7GvlXrDIoVpJzUJNaRIVO9vbwjamhNKeQm00IsXRK1L5")


const router = require('express').Router();


router.post('/subscribe', async (req, res) => {
    createSubscription(req);

  });

  async function createSubscription(createSubscriptionRequest) {
  
    // create a stripe customer
    const customer = await stripe.customers.create({
      name: createSubscriptionRequest.body.name,
      email: createSubscriptionRequest.body.email,
      payment_method: createSubscriptionRequest.body.paymentMethod,
      invoice_settings: {
        default_payment_method: createSubscriptionRequest.body.paymentMethod,
      },
    });
    console.log("customer" , customer)


    // get the price id from the front-end
    const priceId = createSubscriptionRequest.body.priceId;

    // create a stripe subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_settings: {
        payment_method_options: {
          card: {
            request_three_d_secure: 'any',
          },
        },
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    });
console.log("subscription", subscription)
    // return the client secret and subscription id
    return {
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      subscriptionId: subscription.id,
    };
  }
  


  module.exports =router;