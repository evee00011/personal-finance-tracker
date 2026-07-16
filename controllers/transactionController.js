const Transaction = require('../models/Transaction');

/**
 * @desc    Get all transactions (Sorted by newest first)
 * @route   GET /api/v1/transactions
 * @access  Public
 */
exports.getTransactions = async (req, res) => {
  try {
    // Fetch all documents from the collection and sort them by date in descending order
    const transactions = await Transaction.find().sort({ date: -1 });

    return res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server Error: Unable to retrieve transactions.'
    });
  }
};

/**
 * @desc    Add a new transaction
 * @route   POST /api/v1/transactions
 * @access  Public
 */
exports.addTransaction = async (req, res) => {
  try {
    const { description, amount, category, date } = req.body;

    // Create the document using the Mongoose model schema
    const newTransaction = await Transaction.create({
      description,
      amount,
      category,
      date // If undefined, schema default (Date.now) takes over
    });

    return res.status(201).json({
      success: true,
      data: newTransaction
    });
  } catch (error) {
    // Handle Mongoose validation errors explicitly (e.g., missing required fields, invalid enum)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Server Error: Transaction processing failed.'
    });
  }
};