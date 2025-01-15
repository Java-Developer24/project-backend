import { Router } from "express";
import Config from '../models/Config.js'; // Assuming Config model is already defined
const router = Router();

// Endpoint to get the current minimum UPI amount
router.get('/admin-api/upi-min-amt/min-upi-amount', async (req, res) => {
  try {
    let config = await Config.findOne(); // Assuming there is only one config document
    if (!config) {
      // If no config document exists, create a default one
      config = new Config({ minUpiAmount: 100 }); // Default minimum UPI amount
      await config.save();
    }
    res.json({ minUpiAmount: config.minUpiAmount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Endpoint to update the minimum UPI amount (admin only)
router.post('/admin-api/min-upi-amt-update/min-upi-amount', async (req, res) => {
  const { minUpiAmount } = req.body;

  // Validate that the minimum amount is a positive number
  if (isNaN(minUpiAmount) || minUpiAmount <= 0) {
    return res.status(400).json({ message: 'Invalid amount' });
  }

  try {
    let config = await Config.findOne();
    if (!config) {
      // If no config document exists, create one
      config = new Config({ minUpiAmount });
    } else {
      // Update the existing config document
      config.minUpiAmount = minUpiAmount;
    }

    await config.save();
    res.json({ message: 'Minimum UPI amount updated successfully', minUpiAmount: config.minUpiAmount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
