const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cors = require('cors');
const cookieParser = require("cookie-parser");
const Melody = require('./models/melody');
 const { User } = require('./models/user');
 const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


const app = express();
app.use(cors({credentials: true, origin: ['http://localhost:3000', 'https://app.melodymuse.ai','https://dev.melodymuse.ai','https://www.melodymuse.ai']}));

const port = process.env.PORT || 4033;

const authenticationRouter = require('./routes/AuthenticationController');
const paymentRouter = require('./routes/subscriptionController');
const melodyRouter = require('./routes/melodyController');
const freeGeneratorRouter = require('./routes/freeGeneratorController');
const packageRouter = require('./routes/packageController');
const expirationController = require('./routes/expirationController');
const stripeWebhookController = require('./services/stripeWebhook');

const verifyToken = require('./middleware/AuthenticateToken');


app.use(cookieParser());
app.use('/api/v1/stripe/webhook', express.raw({type: "*/*"}));

app.use(express.json());

app.use('/api/v1/authentication', authenticationRouter);
app.use('/api/v1/payment',  paymentRouter);
app.use('/api/v1/melodies', verifyToken, melodyRouter);
app.use('/api/v1/freegenerator', freeGeneratorRouter);
app.use('/api/v1/package', packageRouter);
app.use('/api/v1/subscription', expirationController);
app.use('/api/v1/stripe', stripeWebhookController);




app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => {
    console.log('Connected to MongoDB');
  }).catch((error) => {
    console.error(error);
  });


  app.get('/', (req, res) => {
    res.send('Hello World!');
  });
  
  app.get('/api/v1/resetGenerations', async (req, res) => {
    try {
      await User.updateMany({ generations: { $lt: 5 } }, { $set: { generations: 5 } });
      res.status(200).send('Generations reset to 5 for all users');
    } catch (error) {
      console.error(error);
      res.status(500).send('Error resetting generations');
    }
  });
  

  
app.get('/api/v1/share/:shareId', async (req, res) => {

  try {
    const melody = await Melody.findOne({ shareId: req.params.shareId });
    if (!melody) {
      return res.status(404).json({ error: 'Melody not found' });
    }
    res.json(melody);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});




  