const mongoose = require('mongoose');

const MinistrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Ministry name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    icon: {
      type: String,
      default: '🙏',
    },
    limit: {
      type: Number,
      default: 1,
      min: [1, 'Limit must be at least 1'],
      max: [20, 'Limit cannot exceed 20'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ministry', MinistrySchema);
