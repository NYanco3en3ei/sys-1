import express from 'express';
const router = express.Router();
import User from '../models/User.js';
import Order from '../models/Order.js';
import { verifyToken, isAdmin } from '../middlewares/auth.js';

// Get all salespersons (admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const salespersons = await User.find({ role: 'salesperson' }).sort({ createdAt: -1 });
    res.json(salespersons);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get pending registrations (admin only)
router.get('/pending', verifyToken, isAdmin, async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve a user registration (admin only)
router.put('/:id/approve', verifyToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.status = 'approved';
    user.updatedAt = Date.now();
    
    await user.save();
    res.json({ message: 'User approved successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject a user registration (admin only)
router.put('/:id/reject', verifyToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.status = 'rejected';
    user.updatedAt = Date.now();
    
    await user.save();
    res.json({ message: 'User registration rejected', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new salesperson (admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { username, password, name } = req.body;
    
    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Create new salesperson (directly approved)
    const newSalesperson = new User({
      username,
      password,
      name,
      role: 'salesperson',
      status: 'approved'
    });
    
    await newSalesperson.save();
    res.status(201).json(newSalesperson);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a salesperson (admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { username, password, name } = req.body;
    
    const salesperson = await User.findById(req.params.id);
    if (!salesperson || salesperson.role !== 'salesperson') {
      return res.status(404).json({ message: 'Salesperson not found' });
    }
    
    // Check if username is changing and already exists
    if (username && username !== salesperson.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      salesperson.username = username;
    }
    
    // Update password if provided
    if (password) {
      salesperson.password = password;
    }
    
    // Update other fields
    salesperson.name = name;
    salesperson.updatedAt = Date.now();
    
    await salesperson.save();
    res.json(salesperson);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a salesperson (admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const salesperson = await User.findById(req.params.id);
    if (!salesperson || salesperson.role !== 'salesperson') {
      return res.status(404).json({ message: 'Salesperson not found' });
    }
    
    // Check if salesperson has any orders
    const hasOrders = await Order.exists({ createdBy: salesperson.id });
    if (hasOrders) {
      return res.status(400).json({ message: 'Cannot delete salesperson with existing orders' });
    }
    
    await salesperson.deleteOne();
    res.json({ message: 'Salesperson deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;