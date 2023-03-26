const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  generations: { type: Number, default: 5 },
  premium: { type: Boolean, default: false },
  previousPayments: { type: [String], default: [] },
  admin: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

module.exports = User;