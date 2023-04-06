const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cors = require('cors');
const cookieParser = require("cookie-parser");
const Melody = require('./models/melody');

const app = express();
//app.use(cors({credentials: true, origin: 'http://localhost:3000'}));
const corsOptions = {
  origin: 'https://melody-generator-front-orcin.vercel.app',
  credentials: true
}
app.use(cors(corsOptions));
const port = process.env.PORT || 4033;

const authenticationRouter = require('./routes/AuthenticationController');
const paymentRouter = require('./routes/subscriptionController');
const melodyRouter = require('./routes/melodyController');
const verifyToken = require('./middleware/AuthenticateToken');


app.use(cookieParser());
app.use(express.json());
app.use('/authentication', authenticationRouter);
app.use('/payment', paymentRouter);
app.use('/melodies', verifyToken, melodyRouter);


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
  

  
app.get('/share/:shareId', async (req, res) => {

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


 



  