import express from 'express';
import { Account } from '../models/account.js';

const router = express.Router();

// Create new account
router.post('/', async (req, res) => {
  try {
    const { cardNo, pin, balance } = req.body;

    // Check if account already exists
    const existing = await Account.findOne({ cardNo });
    if (existing) {
      return res.status(400).json({ 
        status: 'ERROR',
        message: 'Account with this card number already exists' 
      });
    }

    // Create new account
    const account = new Account({
      cardNo,
      pin,
      balance: balance || 0,
      locked: false
    });

    await account.save();

    res.status(201).json({
      status: 'SUCCESS',
      message: 'Account created successfully',
      account: {
        cardNo: account.cardNo,
        balance: account.balance
      }
    });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ 
      status: 'ERROR',
      message: 'Failed to create account',
      error: error.message 
    });
  }
});

// Get account details
router.get('/:cardNo', async (req, res) => {
  try {
    const account = await Account.findOne({ cardNo: req.params.cardNo });
    
    if (!account) {
      return res.status(404).json({ 
        status: 'ERROR',
        message: 'Account not found' 
      });
    }

    res.json({
      status: 'SUCCESS',
      account: {
        cardNo: account.cardNo,
        balance: account.balance,
        locked: account.locked
      }
    });
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ 
      status: 'ERROR',
      message: 'Failed to fetch account',
      error: error.message 
    });
  }
});

// Get all accounts (for testing)
router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find({});
    res.json({
      status: 'SUCCESS',
      count: accounts.length,
      accounts: accounts.map(acc => ({
        cardNo: acc.cardNo,
        balance: acc.balance,
        locked: acc.locked
      }))
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ 
      status: 'ERROR',
      message: 'Failed to fetch accounts',
      error: error.message 
    });
  }
});

// Delete account (for testing)
router.delete('/:cardNo', async (req, res) => {
  try {
    const account = await Account.findOneAndDelete({ cardNo: req.params.cardNo });
    
    if (!account) {
      return res.status(404).json({ 
        status: 'ERROR',
        message: 'Account not found' 
      });
    }

    res.json({
      status: 'SUCCESS',
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ 
      status: 'ERROR',
      message: 'Failed to delete account',
      error: error.message 
    });
  }
});

export default router;