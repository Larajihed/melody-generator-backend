const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const router = require('express').Router();
const {User, Payment} = require('../models/user'); 
const verifyToken = require('../middleware/AuthenticateToken');



//this route is used to upgrade users who signed up manually
router.post('/upgrade', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    let user = await User.findById(userId).exec();
    // Create Stripe customer if it doesn't exist
    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
      });
      user.stripeCustomerId = customer.id;
      await user.save();
    }

    // Create checkout session for the subscription
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: user.stripeCustomerId, // This ensures the customer ID is linked to the subscription
      line_items: [
        {
          price: process.env.PREMIUM_PRICE_ID, // Your premium price ID
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/`,
    });

    // Redirect to Stripe Checkout
    res.json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'An error occurred while creating the checkout session' });
  }
});

// this route is called when the user successfully upgraded 
router.post('/upgrade/success', async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const { customer: stripeCustomerId, subscription: subscriptionId } = session;

    if (!stripeCustomerId || !subscriptionId) {
      return res.status(404).json({ error: 'Stripe customer or subscription ID not found' });
    }

    // Retrieve customer's email and user record from the database
    const email = await getEmailFromSession(sessionId);
    const userToUpdate = await User.findOne({ email });

    if (!userToUpdate) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user's subscription details
    const updatedSubscriptionDetails = {
      premium: true,
      generations: 99999,
      subscriptionExpiration: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      subscriptionId,
      stripeCustomerId,
      // Add the sessionId to the array of previousPayments
      $push: { previousPayments: sessionId }
    };

    // Save the updated user details
    await User.updateOne({ email }, updatedSubscriptionDetails);

    res.json({ message: 'User upgraded successfully' });

  } catch (error) {
    console.error('Error in /upgrade/success:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

async function getEmailFromSession(sessionId) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return session.customer_details.email; 
}







/////////////////////
// DEPRECATED CODE //
// NEW PAYMENT ROUTE CHANGED ON 08/11/2023//
/////////////////////





/*
router.post('/subscribe', async (req, res) => {

  try {
    await createSubscription(req);
    res.status(200).send('Subscription successful');
  } catch (error) {
    res.status(500).send('Error processing subscription');
  }
});
*/


/*
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
*/

/*
router.get('/payments', async (req, res) => {
  
  try {
    const user = await User.findOne({ email: req.user.email });
    const payments = await Payment.find({ _id: { $in: user.previousPayments } });
    res.json(payments);
  } catch (err) {
    res.status(500).send({ message: 'Internal server error' });
  }
});
*/

/*
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

*/

module.exports = router;
