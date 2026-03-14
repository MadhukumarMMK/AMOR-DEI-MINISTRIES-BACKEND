const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema(
  {
    ministryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ministry',
      required: true,
    },
    memberIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
      },
    ],
  },
  { _id: false }
);

const RosterSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true, // e.g. "Sunday, March 16, 2026"
    },
    assignments: [AssignmentSchema],
    status: {
      type: String,
      enum: ['draft', 'confirmed'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Roster', RosterSchema);
