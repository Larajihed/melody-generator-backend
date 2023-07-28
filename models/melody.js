const mongoose = require('mongoose');

const melodySchema = new mongoose.Schema({
  text: { type: String, required: true },
  artistName: { type: String, required: true },
  genre: { type: String, required: false },
  emotion: { type: String, required: false },
  tempo: { type: String, required: false },
  additionlInfo: { type: String, required: false },
  dateGenerated: { type: Date, required: true, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // new field
  shareId: { type: String, required: true, unique: true } // new field


});

const Melody = mongoose.model('Melody', melodySchema);

module.exports = Melody;
