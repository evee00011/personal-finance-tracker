const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [100, 'Description cannot exceed 100 characters']
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Food', 'Transport', 'Utilities', 'Entertainment', 'Subscriptions', 'Shopping', 'Other'],
        message: '{VALUE} is not a supported category'
      }
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now
    }
  },
  {
    // Automatically injects createdAt and updatedAt timestamps into the document
    timestamps: true 
  }
);

module.exports = mongoose.model('Transaction', TransactionSchema);