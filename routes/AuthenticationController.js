const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {User, Payment} = require('../models/user'); // import the User model you defined earlier
const verifyToken = require('../middleware/AuthenticateToken');
const nodemailer= require('nodemailer')
const router = express.Router();
router.post('/register', async (req, res) => {

    // Check if user with email already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(409).send('User already exists');
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(req.body.password, salt)

    const user = new User({
      email: req.body.email,
      password: hashedPassword,
      generations: 5,
      premium: false,
      previousPayments: [],
      admin: false,
    })

    const result = await user.save()

    const {password, ...data} = await result.toJSON()

    res.status(201).send('User created');
});

  router.post('/login', async (req, res) => {
    const user = await User.findOne({email: req.body.userEmail})

    if (!user) {
        return res.status(404).send({
            message: 'user not found'
        })
    }

    if (!await bcrypt.compare(req.body.userPassword, user.password  )) {
        return res.status(400).send({
            message: 'invalid credentials'
        })
    }

    const token = jwt.sign({
      id: user._id,
      email: user.email,
      generations: user.generations,
      premium: user.premium,
      previousPayments: user.previousPayments,
      admin: user.admin
    }, process.env.JWT_SECRET);



    res.cookie('token', token)

    res.send({
        message: 'success',token
        
    })
});

router.get('/getcurrentuser', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).send({ message: 'unauthenticated' });
    }

    const token = authHeader.split(' ')[1];
    const claims = jwt.verify(token, process.env.JWT_SECRET);

    if (!claims) {
      return res.status(401).send({ message: 'unauthenticated claims' });
    }

    const user = await User.findOne({ email: claims.email });
    const { password, ...data } = await user.toJSON();
    res.send(data);
  } catch (e) {
    return res.status(401).send({ message: 'unauthenticated' });
  }
});

router.post('/logout', (req, res) => {
  
    res.cookie('jwt', '', {maxAge: 0})
    res.send({
      message: 'Logged Out successfuly'
  })
})

router.post('/forgot-password', async (req, res) => {
    try {
      // Check if user with email exists
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res.status(404).send('User not found');
      }
  
      // Generate reset token and expiration date
      const resetToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });
  
      // Save reset token and expiration date to user document
      user.resetToken = resetToken;
      user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
      await user.save();
  
      // Send password reset email to user
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USERNAME,
          pass: process.env.SMTP_PASSWORD,
        },
      });
  
      const mailOptions = {
        from:  process.env.SMTP_USERNAME,
        to: user.email,
        subject: 'Password Reset',
        text: `Please click the following link to reset your password: ${process.env.CLIENT_URL}/reset-password/${resetToken}`,
      };
  
      await transporter.sendMail(mailOptions);
  
      res.send('Password reset email sent');
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal server error');
    }
  });
  

  router.post('/reset-password', async (req, res) => {
    const { resetToken } = req.params;
    const { password } = req.body;
  
    try {
      const user = await User.findOne({ resetToken });
  
      if (!user) {
        return res.status(404).json({ message: 'Reset token is invalid' });
      }
  
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      user.password = hashedPassword;
      user.resetToken = '';
      user.resetTokenExpiration = null;
      await user.save();
  
      return res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
router.post('/change-password', verifyToken, async (req, res) => {
    try {
        console.log(req.body)
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.id);
  
      // Check if current password matches
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid current password' });
      }
  
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
  
      // Update user's password
      user.password = hashedPassword;
      await user.save();
  
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  

module.exports = router;
