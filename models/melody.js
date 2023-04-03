const mongoose = require('mongoose');

const melodySchema = new mongoose.Schema({
  text: { type: String, required: true },
  emotion: { type: String, required: false },
  artistName: { type: String, required: true },
  dateGenerated: { type: Date, required: true, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // new field
  shareId: { type: String, required: true, unique: true } // new field


});

const Melody = mongoose.model('Melody', melodySchema);

module.exports = Melody;
