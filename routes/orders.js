import express from 'express';
const router = express.Router();
import Order from '../models/Order.js';
import { verifyToken, isAdmin } from '../middlewares/auth.js';

// Get all orders
router.get('/', verifyToken, async (req, res) => {
  try {
    const query = {};
    
    // Salespersons can only see their own orders
    if (req.user.role === 'salesperson') {
      query.createdBy = req.user.id;
    }
    
    const orders = await Order.find(query)
      .populate('customer', 'name address contact phone')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get order by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name address contact phone')
      .populate('createdBy', 'name');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user is allowed to view this order
    if (req.user.role !== 'admin' && order.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to view this order' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new order
router.post('/', verifyToken, async (req, res) => {
  try {
    const { customer, customerName, customerAddress, products, deliveryDate } = req.body;
    
    // Calculate total amount
    const totalAmount = products.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    
    const newOrder = new Order({
      customer,
      customerName,
      customerAddress,
      products,
      totalAmount,
      deliveryDate,
      status: 'pending',
      createdBy: req.user.id
    });
    
    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update an order
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { customer, customerName, customerAddress, products, deliveryDate } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user is allowed to update this order
    if (req.user.role !== 'admin' && order.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to update this order' });
    }
    
    // Calculate total amount if products have changed
    let totalAmount = order.totalAmount;
    if (products) {
      totalAmount = products.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    }
    
    // Update order
    order.customer = customer || order.customer;
    order.customerName = customerName || order.customerName;
    order.customerAddress = customerAddress || order.customerAddress;
    order.products = products || order.products;
    order.totalAmount = totalAmount;
    order.deliveryDate = deliveryDate || order.deliveryDate;
    order.updatedAt = Date.now();
    
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update order status
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Only admin can update status
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to update order status' });
    }
    
    order.status = status;
    order.updatedAt = Date.now();
    
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;