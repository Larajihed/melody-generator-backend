const stripe = require("stripe")(process.env.STRIPE_TEST_KEY)
const router = require('express').Router();
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const {User} = require('../models/user'); // import the User model you defined earlier
const bcrypt = require('bcrypt');
const path = require('path');

router.post('/create-checkout-session', async (req, res) => {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price: 'price_1O7OGgEfB3VIPNaNzWqc3IoQ', // The Price ID you created in Stripe Dashboard or via API
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'http://localhost:3000/canceled',
      });
  
      res.json({ id: session.id });
    } catch (error) {
      console.error("Error creating Stripe checkout session:", error);
      res.status(500).send("Failed to create checkout session");
    }
  });


  router.post('/send-email', async (req, res) => {
    try {
      const sessionId = req.body.sessionId;
      const email = await getEmailFromSession(sessionId);
  

      const existingUser = await User.findOne({ email: email });
      if (existingUser) {
        return res.status(409).send('User already exists');
      }

      const randomPassword = generateRandomPassword();
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      const user = new User({
        email: email,
        password: hashedPassword,
      });

      await user.save();

      const userCredentials = {
          username: email,
          password: randomPassword,
      };

  
      await sendEmailWithPackage(email, userCredentials);
  
      res.send('Email sent successfully.');
    } catch (error) {
      console.error('Error sending package:', error);
      res.status(500).send('An error occurred while processing your request.');
    }
  });
  

  async function getEmailFromSession(sessionId) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    //console.log(session)
    return session.customer_details.email; 
}

function generateRandomPassword(length = 12) {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
  }

async function sendEmailWithPackage(email, credentials) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USERNAME,
          pass: process.env.SMTP_PASSWORD,
        },
      });

    let mailOptions = {
        from: process.env.SMTP_USERNAME,
        to: email,
        subject: 'Your Package from Our Website',
        text: `Thank you for your purchase! Here are your credentials:\n${credentials.username}\n${credentials.password}`,
        attachments: [
            {
                path: path.join(__dirname, '..', 'files', 'Most Streamed Chord Progressions.zip'),
                filename: 'Most Streamed Chord Progressions.zip'

            },
            {
                path: path.join(__dirname, '..', 'files', 'Original Chord Progressions.zip'),
                filename: 'Original Chord Progressions.zip'

            }
        ]
    };
    await transporter.sendMail(mailOptions);
}



  module.exports = router;