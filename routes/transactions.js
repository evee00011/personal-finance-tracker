const express = require('express');
const router = express.Router();

// Import the asynchronous logic handlers from your controller
const { getTransactions, addTransaction } = require('../controllers/transactionController');

// Map handlers to the base API path '/api/v1/transactions'
router
  .route('/')
  .get(getTransactions)   // Maps GET requests directly to retrieval logic
  .post(addTransaction); // Maps POST requests directly to creation logic

module.exports = router;