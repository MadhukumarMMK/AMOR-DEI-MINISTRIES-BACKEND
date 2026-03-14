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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ministry', MinistrySchema);
