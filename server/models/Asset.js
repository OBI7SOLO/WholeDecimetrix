const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['Pozo', 'Motor', 'Transformador'],
    },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    comments: { type: String },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Asset', assetSchema);
