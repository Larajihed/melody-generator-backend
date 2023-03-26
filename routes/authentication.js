const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user'); // import the User model you defined earlier

const router = express.Router();
router.post('/register', async (req, res) => {
    try {
      // Check if the user already exists with that email
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).send('User with that email already exists');
      }
  
      // Hash the password using bcrypt
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
  
      // Create a new user with the hashed password and new fields
      const user = new User({
        email: req.body.email,
        password: hashedPassword,
        generations: 5,
        premium: false,
        previousPayments: [],
        admin: false
      });
  
      // Save the user to the database
      await user.save();
  
      res.status(201).send('User created');
    } catch (error) {
      console.error(error);
      res.status(500).send();
    }
  });
  
  router.post('/login', async (req, res) => {
    try {
      // Find the user with the specified email
      const user = await User.findOne({ email: req.body.email });
  
      // If the user doesn't exist, return an error
      if (!user) {
        return res.status(401).send('Invalid email or password');
      }
    // Compare the password provided by the user to the hashed password
    const isMatch = await bcrypt.compare(req.body.password, user.password);

    // If the passwords don't match, return an error
    if (!isMatch) {
      return res.status(401).send('Invalid email or password');
    }

    // Generate a JWT and send it to the user
    const token = jwt.sign({
        id: user._id,
        email: user.email,
        generations: user.generations,
        premium: user.premium,
        previousPayments: user.previousPayments,
        admin: user.admin
      }, process.env.JWT_SECRET);
          res.send({ token });
  } catch {
    res.status(500).send();
  }

});
  
module.exports = router;
