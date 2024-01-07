const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const app = express();
const {User} = require('../models/user'); 




const endpointSecret = process.env.WEBHOOK_ENDPOINT_SECRET;


app.post('/webhook', express.raw({type: 'application/json'}), async (request, response) => {
  const sig = request.headers['stripe-signature'];
  console.log(" Signature : " , sig)
  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      await handleSubscriptionChange(subscription);
      break;
    case 'invoice.payment_succeeded':
      const paymentIntent = event.data.object;
      await handlePaymentSuccess(paymentIntent);
      break;
    case 'invoice.payment_failed':
      const invoice = event.data.object;
      await handlePaymentFailure(invoice);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  response.send();
});

async function handleSubscriptionChange(subscription) {
  try {
    const user = await User.findOne({ stripeCustomerId: subscription.customer });
    console.log("User is " +user )
    if (!user) {
      console.log(`User not found for Stripe Customer ID In handleSubscriptionChange: ${subscription.customer}`);
      return;
    }

    if (subscription.status === 'canceled' || subscription.status === 'deleted') {
      // Handle cancellation of the subscription
      user.premium = false;
      console.log("Subscription Canceled for " + user)
    } else {
      // Handle other subscription changes
      user.subscriptionId = subscription.id;
      user.premium = (subscription.status === 'active' || subscription.status === 'trialing');
    }

    await user.save();
    console.log(`Subscription status updated for user: ${user.email}`);
  } catch (error) {
    console.error(`Error updating subscription status: ${error}`);
  }
}


async function handlePaymentSuccess(paymentIntent) {
  try {
    const user = await User.findOne({ stripeCustomerId: paymentIntent.customer });
    if (!user) {
      console.log(`User not found for Stripe Customer ID In handlePaymentSuccess: ${paymentIntent.customer}`);
      return;
    }

    user.previousPayments.push(paymentIntent.id);
    user.premium = true; // Assuming successful payment makes the user premium
    user.subscriptionExpiration = new Date(paymentIntent.created * 1000).setMonth(new Date(paymentIntent.created * 1000).getMonth() + 1); // Set expiration to one month from payment date

    await user.save();
    console.log(`Payment succeeded for user: ${user.email}`);
  } catch (error) {
    console.error(`Error handling payment success: ${error}`);
  }
}

async function handlePaymentFailure(invoice) {
  try {
    const user = await User.findOne({ stripeCustomerId: invoice.customer });
    if (!user) {
      console.log(`User not found for Stripe Customer ID in handlePaymentFailure: ${invoice.customer}`);
      return;
    }

    user.premium = false; // User is no longer premium on payment failure
    user.generations=5
    await user.save();
    console.log(`Handled payment failure for user: ${user.email}`);
  } catch (error) {
    console.error(`Error handling payment failure: ${error}`);
  }
}


module.exports = app;
