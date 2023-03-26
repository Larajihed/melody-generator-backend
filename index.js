const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cors = require('cors');

const app = express();
const port = process.env.PORT || 4033;
app.use(cors());

const authenticationRouter = require('./routes/authentication');
const paymentRouter = require('./routes/subscriptionController');
const melodyRouter = require('./routes/melodyController');
const verifyToken = require('./middleware/AuthenticateToken');




app.use(express.json());


mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => {
    console.log('Connected to MongoDB');
  }).catch((error) => {
    console.error(error);
  });



  

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
  app.use('/authentication', authenticationRouter);
  app.use('/payment', paymentRouter);
  app.use('/melodies', verifyToken, melodyRouter);


  app.get('/', (req, res) => {
    res.send('Hello World!');
  });
  