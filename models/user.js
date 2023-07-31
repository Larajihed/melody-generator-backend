const mongoose = require('mongoose');
const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  subscriptionId: { type: String, required: true },
  currency: { type: String, required: true },
  customer: { type: String, required: true },
  defaultPaymentMethod: { type: String, required: false },
  latest_invoice: { type: String, required: true },
  accountCountry: { type: String, required: false },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  hosted_invoice_url: { type: String, required: true },
});


const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  generations: { type: Number, default: 5 },
  premium: { type: Boolean, default: false },
  previousPayments: { type: [String], default: [] },
  admin: { type: Boolean, default: false },
  subscriptionExpiration: { type: Date, default: null },
  melodyCount: { type: Number, default: 0 }


});



const User = mongoose.model('User', userSchema);
const Payment = mongoose.model('Payment', paymentSchema);

User.findByEmail = async function(email) {
  return await User.findOne({ email: email }).exec();
}

module.exports = {
  Payment,
  User,
  
};