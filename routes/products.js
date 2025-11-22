import express from 'express';
const router = express.Router();
import Product from '../models/Product.js';
import { verifyToken, isAdmin } from '../middlewares/auth.js';

// Get all products
router.get('/', verifyToken, async (req, res) => {
  try {
    const { isPendingApproval } = req.query;
    const query = {};
    
    // Filter by pending approval status if provided
    if (isPendingApproval !== undefined) {
      query.isPendingApproval = isPendingApproval === 'true';
    } else {
      // By default, non-admin users can only see approved products
      if (req.user.role !== 'admin') {
        query.isPendingApproval = false;
      }
    }
    
    // Salespersons can only see their own pending products
    if (req.user.role === 'salesperson' && query.isPendingApproval) {
      query.createdBy = req.user.id;
    }
    
    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new product
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, price, image } = req.body;
    
    // For salespersons, products need approval
    const isPendingApproval = req.user.role === 'salesperson';
    
    const newProduct = new Product({
      name,
      price,
      image,
      isPendingApproval,
      createdBy: req.user.id
    });
    
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a product
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name, price, image } = req.body;
    
    // Find the product
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if user is allowed to update this product
    if (req.user.role !== 'admin' && product.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to update this product' });
    }
    
    // Update product
    product.name = name;
    product.price = price;
    product.image = image;
    product.updatedAt = Date.now();
    product.save();
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve a product (admin only)
router.post('/:id/approve', verifyToken, isAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    product.isPendingApproval = false;
    product.updatedAt = Date.now();
    
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a product
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if user is allowed to delete this product
    if (req.user.role !== 'admin' && product.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this product' });
    }
    
    await product.deleteOne();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;