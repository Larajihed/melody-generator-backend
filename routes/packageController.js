const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
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
          price: `${process.env.PACKAGE_PRICE_ID}`, // The Price ID you created in Stripe Dashboard or via API
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${process.env.HOMEPAGE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.HOMEPAGE_URL}/canceled`,
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
            // Update existing user's info in the database
            existingUser.previousPayments.push(sessionId);
            existingUser.premium = true;
            existingUser.generations = 9999;

            const currentDate = new Date();
            existingUser.subscriptionExpiration = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
            await existingUser.save();

          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false, // true for 465, false for other ports
            auth: {
              user: process.env.SMTP_USERNAME,
              pass: process.env.SMTP_PASSWORD,
            },
          });


            // Create email content for existing user
            mailOptions = {
                from: process.env.SMTP_USERNAME,
                to: email,
                subject: 'Your Files from Our Website',
                text: `Hello again! We've noticed that you already have an account with us. Here are the files you've purchased. If you've forgotten your password, you can reset it using the following link: https://app.melodymuse.ai/forgot-password`,
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

        } else {
            const randomPassword = generateRandomPassword();
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);

            const currentDate = new Date();
            const subscriptionExpiration = new Date(currentDate.setMonth(currentDate.getMonth() + 1));

            const user = new User({
                email: email,
                password: hashedPassword,
                generations: 9999,
                premium: true,
                previousPayments: [sessionId],
                admin: false,
                subscriptionExpiration: subscriptionExpiration
            });
  
            await user.save();

            // Create email content for new user
   
            let credentials = {
              email: email,
              password: randomPassword
            }
    
            // Send email
            await sendEmailWithPackage(credentials);
            res.send('Email sent successfully.');

        }

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

async function sendEmailWithPackage(credentials) {
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
        to: credentials.email,
        subject: 'Your Package from Our Website',
        text: `Thank you for your purchase! Here are your credentials:\n${credentials.email}\n${credentials.password}`,
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