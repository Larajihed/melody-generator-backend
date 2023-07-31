const mongoose = require('mongoose');

const melodySchema = new mongoose.Schema({
  text: { type: String, required: false },
  artistName: { type: String, required: false },
  genre: { type: String, required: false },
  emotion: { type: String, required: false },
  tempo: { type: String, required: false },
  additionalInfo: { type: String, required: false },
  dateGenerated: { type: Date, required: true, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // new field
  shareId: { type: String, required: true, unique: true }, // new field
  name: { type: String, required: false, unique: true }

});

const Melody = mongoose.model('Melody', melodySchema);

module.exports = Melody;
