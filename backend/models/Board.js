const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
  },
  { _id: false }
);

const boardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: {
      type: [memberSchema],
      default: [],
      validate: {
        validator: function validateMembers(items) {
          return items.every((item) => item && item.user && item.role);
        },
        message: 'Board members must include a user and role.',
      },
    },
  },
  { timestamps: true }
);

boardSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Board', boardSchema);
