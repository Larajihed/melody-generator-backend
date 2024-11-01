const router = require("express").Router();
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { User } = require("../models/user"); // import the User model you defined earlier
const bcrypt = require("bcrypt");
const path = require("path");
const Mailchimp = require("mailchimp-api-v3");
const mailchimp = new Mailchimp(process.env.MAILCHIMP_API_KEY);
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


// This route is used to create a stripe checkout session when the user buy the package
router.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: `${process.env.PACKAGE_PRICE_ID}`, // The Price ID you created in Stripe Dashboard or via API
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.HOMEPAGE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.HOMEPAGE_URL}/canceled`,
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error("Error creating Stripe checkout session:", error);
    res.status(500).send("Failed to create checkout session");
  }
});

//this route is called from the success page in the landing page 
router.post("/success", async (req, res) => {
  try {
    const sessionId = req.body.sessionId;
    const email = await getEmailFromSession(sessionId);

    const existingUser = await User.findOne({ email: email });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const subscriptionId = session.subscription; // This assumes you are using Stripe's Checkout for subscriptions
    const stripeCustomerId = session.customer; // Customer ID

    if (existingUser) {
      // Update existing user's info in the database
      existingUser.previousPayments.push(sessionId);
      existingUser.premium = true;
      existingUser.generations = 9999;

      const currentDate = new Date();
      existingUser.subscriptionExpiration = new Date(
        currentDate.setMonth(currentDate.getMonth() + 1)
      );
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
        subject: "Your Files from Our Website",
        html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 20px;
                            color: #ffffff;
                            line-height: 1.5;
                        }
                        .container {
                            border-radius: 8px;
                            padding: 20px;
                            max-width: 600px;
                            margin: 0 auto;
                            background-color: #030014;
                            border: 1px solid #ddd;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 20px;
                        }
                        .button {
                            display: inline-block;
                            padding: 10px 20px;
                            border-radius: 5px;
                            text-decoration: none;
                            background: #6366F1;
                            color: #ffffff;
                            font-weight: bold;
                        }


                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <img src="https://www.melodymuse.ai/full-logo.svg" alt="MelodyMuse Logo" width="150" />
                            <h2>Welcome Back to MelodyMuse!</h2>
                        </div>
                        <p>We've noticed that you already have an account with us. <br> <b>Thank you for choosing us again! </b></p>
                        <p>⬇️ Below are the files you've purchased</p>
                        <!-- You can format the file links attractively here. -->
                        <p>❓If you've forgotten your password, no worries! Just click the button below to reset it:</p>
                        <a href="https://app.melodymuse.ai/forgot-password" class="button">Reset Password</a>
                        <p>Thank you for being a part of our community. If you have any questions or need assistance, please don't hesitate to reach out.</p>
                        <p>Warm regards,<br>MelodyMuse Team</p>
                    </div>
                </body>
                </html>
                `,
        attachments: [
          {
            path: path.join(
              __dirname,
              "..",
              "files",
              "Most Streamed Chord Progressions.zip"
            ),
            filename: "Most Streamed Chord Progressions.zip",
          },
          {
            path: path.join(
              __dirname,
              "..",
              "files",
              "Original Chord Progressions.zip"
            ),
            filename: "Original Chord Progressions.zip",
          },
        ],
      };

      addToMailchimp(email);
      await transporter.sendMail(mailOptions);
    } else {
      const randomPassword = generateRandomPassword();
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      const currentDate = new Date();
      const subscriptionExpiration = new Date(
        currentDate.setMonth(currentDate.getMonth() + 1)
      );

      const user = new User({
        email: email,
        password: hashedPassword,
        generations: 9999,
        premium: true,
        previousPayments: [sessionId],
        admin: false,
        subscriptionExpiration: subscriptionExpiration,
        subscriptionId: subscriptionId,
        stripeCustomerId: stripeCustomerId,
      });
      await user.save();

      // Create email content for new user

      let credentials = {
        email: email,
        password: randomPassword,
      };

      // Send email
      await sendEmailWithPackage(credentials);

      res.send("Email sent successfully.");
      await addToMailchimp(email);
    }
  } catch (error) {
    console.error("Error sending package:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

async function getEmailFromSession(sessionId) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  //console.log(session)
  return session.customer_details.email;
}

function generateRandomPassword(length = 12) {
  return crypto.randomBytes(length).toString("hex").slice(0, length);
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
    subject: "Your Package from Our Website",
    html: `
        <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 20px;
                            color: #ffffff;
                            line-height: 1.5;
                        }
                        .container {
                            border-radius: 8px;
                            padding: 20px;
                            max-width: 600px;
                            margin: 0 auto;
                            background-color: #030014;
                            border: 1px solid #ddd;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 20px;
                        }
                        .button {
                            display: inline-block;
                            padding: 10px 20px;
                            border-radius: 5px;
                            text-decoration: none;
                            background: #6366F1;
                            color: #ffffff;
                            font-weight: bold;
                        }


                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <img src="https://www.melodymuse.ai/full-logo.svg" alt="MelodyMuse Logo" width="150" />
                            <h2>Welcome to MelodyMuse!</h2>
                        </div>
                        <p><strong>Thank you for your purchase!</strong></p>
                        <p>We're thrilled to have you on board. Along with the pack you've acquired, you also get access to our tool for generating chords.</p>
                    
                        <div style="background-color: #02000f; padding: 15px; margin: 20px 0; border-radius: 8px;">
                            <h3>Your Credentials</h3>
                            <p><b>Email:</b> ${credentials.email}</p>
                            <p><b>Password:</b> ${credentials.password}</p>
                            <a href="https://app.melodymuse.ai/login" class="button">Login Now</a>
                        </div>
                        
                        <p>📥 Below are the files you've purchased:</p>
                        <!-- You can add links to the files or list them out here -->
                    
                        <p>If you have any questions or need assistance, please don't hesitate to reach out. We're here to help!</p>
                        
                        <p>Warm regards,<br>MelodyMuse Team</p>
                    </div>
                    
                </body>
                </html>
        `,
    attachments: [
      {
        path: path.join(
          __dirname,
          "..",
          "files",
          "Most Streamed Chord Progressions.zip"
        ),
        filename: "Most Streamed Chord Progressions.zip",
      },
      {
        path: path.join(
          __dirname,
          "..",
          "files",
          "Original Chord Progressions.zip"
        ),
        filename: "Original Chord Progressions.zip",
      },
      {
        path: path.join(
          __dirname,
          "..",
          "files",
          "Dark Chords Pack.zip"
        ),
        filename: "Dark Chords Pack.zip",
      },
    ],
  };
  await transporter.sendMail(mailOptions);
}

async function addToMailchimp(email) {
  try {
    await mailchimp.post(`/lists/${process.env.MAILCHIMP_LIST_ID}/members`, {
      email_address: email,
      status: "subscribed", // "subscribed" means they are added to the list
    });
    console.log(`Added ${email} to Mailchimp list.`);
  } catch (error) {
    console.error(`Error adding ${email} to Mailchimp:`, error);
  }
}

// This route is used to handle the customer portal for all users
router.post("/create-customer-portal-session", async (req, res) => {
  try {


    const userId = req.body.user._id; // Replace with however you get the logged-in user's ID
    // Fetch the user from your database
    const user = await User.findById(userId);

    if (!user || !user.stripeCustomerId) {
      return res.status(404).send("User not found.");
    }

    // Create a session for the customer portal
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL}/`, // Replace with the URL to which customers are redirected after managing their subscription
    });

    // Redirect the customer to the Stripe customer portal
    res.json({ url: portalSession.url });
  } catch (error) {
    console.error("Error creating customer portal session:", error);
    res
      .status(500)
      .send("An error occurred while creating customer portal session.");
  }
});


module.exports = router;
