const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const router = require('express').Router();
const {User, Payment} = require('../models/user'); 

router.post('/subscribe', async (req, res) => {

  try {
    await createSubscription(req);
    res.status(200).send('Subscription successful');
  } catch (error) {
    res.status(500).send('Error processing subscription');
  }
});

async function createSubscription(createSubscriptionRequest) {
  try {
    // create a stripe customer
    const customer = await stripe.customers.create({
      name: createSubscriptionRequest.body.name,
      email: createSubscriptionRequest.body.email,
      payment_method: createSubscriptionRequest.body.paymentMethod,
      invoice_settings: {
        default_payment_method: createSubscriptionRequest.body.paymentMethod,
      },
    });

    // create a stripe subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: "price_1MuIBJEfB3VIPNaNYv3xf4Nk" }],
      payment_settings: {
        payment_method_types: ["card"],
        save_default_payment_method: "on_subscription",
      },
      expand: ['latest_invoice.payment_intent'],
    });

    // check if the user has previously canceled their subscription and is now resuming it
    const user = await User.findByEmail(createSubscriptionRequest.body.currentUserEmail);
    if (user && user.subscriptionExpiration < new Date()) {
      user.subscriptionExpiration = null;
      await user.save();
    }

    // create a payment object and save it to the database
    const payment = new Payment({
      amount: 9.99, 
      date: new Date(),
      subscriptionId: subscription.id,
      currency: subscription.currency,
      customer: subscription.customer,
      defaultPaymentMethod: subscription.default_payment_method,
      latest_invoice: subscription.latest_invoice.id,
      accountCountry: subscription.latest_invoice.account_Country,
      customerName: subscription.latest_invoice.customer_name,
      customerEmail: subscription.latest_invoice.customer_email,
      hosted_invoice_url: subscription.latest_invoice.hosted_invoice_url,
    });

    await payment.save();

    // update the user's premium status and previous payments array
    if (user) {
      user.premium = true;
      user.generations = 1000;
      user.previousPayments.push(payment._id);
      await user.save();
    }

    return {
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      subscriptionId: subscription.id,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}


router.get('/payments', async (req, res) => {
  
  try {
    const user = await User.findOne({ email: req.user.email });
    const payments = await Payment.find({ _id: { $in: user.previousPayments } });
    res.json(payments);
  } catch (err) {
    res.status(500).send({ message: 'Internal server error' });
  }
});



router.post('/cancel', async(req, res) => {
  try {
    const user = await User.findOne({ email: req.body.user.email }).populate('previousPayments').exec();    
    const lastPayment = user.previousPayments[user.previousPayments.length - 1];
    const payment = await Payment.findById(lastPayment); 
    const subscription = await stripe.subscriptions.del(payment.subscriptionId);
    const currentperiodenddateFormat = new Date(subscription.current_period_end*1000);    
    if (user) {
      user.premium = true;
      user.generations = 1000;
      user.subscriptionExpiration =currentperiodenddateFormat ;
      await user.save()
    }
    
    res.send({
      message: 'Subscription cancelled successfully'
    });

  } catch(err){
    console.log(err)
    res.status(500).send({
      message: 'Failed to cancel subscription'
    });
  }
});

module.exports = router;
