import express from 'express';
const router = express.Router();
import Customer from '../models/Customer.js';
import { verifyToken, isAdmin } from '../middlewares/auth.js';

// Get all customers (admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new customer (admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, address, contact, phone } = req.body;
    
    const newCustomer = new Customer({
      name,
      address,
      contact,
      phone
    });
    
    await newCustomer.save();
    res.status(201).json(newCustomer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a customer (admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, address, contact, phone } = req.body;
    
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Update customer
    customer.name = name;
    customer.address = address;
    customer.contact = contact;
    customer.phone = phone;
    customer.updatedAt = Date.now();
    
    await customer.save();
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a customer (admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    await customer.deleteOne();
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;