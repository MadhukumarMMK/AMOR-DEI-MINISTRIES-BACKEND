const mongoose = require('mongoose');

// Stores which member is interested in which ministry
const InterestSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
    ministryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ministry',
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate interest entries
InterestSchema.index({ memberId: 1, ministryId: 1 }, { unique: true });

module.exports = mongoose.model('Interest', InterestSchema);
