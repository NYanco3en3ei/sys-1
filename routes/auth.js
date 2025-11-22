import express from 'express';
const router = express.Router();
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { verifyToken } from '../middlewares/auth.js';

// Register new user (admin or salesperson)
router.post('/register', async (req, res) => {
  try {
    const { username, password, name, role } = req.body;
    
    // Validate input
    if (!username || !password || !name || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    if (!['admin', 'salesperson'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    
    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }
  // 只允许注册业务员角色，管理员账户由系统默认创建
  if (role !== 'salesperson') {
    return res.status(400).json({ success: false, message: '只允许注册业务员账号' });
  }
  
  // Create new salesperson
  const newUser = new User({
    username,
    password,
    name,
    role: 'salesperson',
    status: 'pending' // 所有业务员账号默认需要审批
  });
    
    await newUser.save();
    
    res.status(201).json({ 
      success: true, 
      message: role === 'salesperson' 
        ? 'Registration submitted for approval' 
        : 'Registration successful',
      needsApproval: role === 'salesperson'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Check if user is approved
    if (user.status !== 'approved') {
      return res.status(400).json({ 
        success: false, 
        message: user.status === 'pending' 
          ? 'Your account is pending approval' 
          : 'Your account has been rejected' 
      });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Change password for authenticated user
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: '当前密码错误' });
    }
    
    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: '新密码长度至少为6位' });
    }
    
    // Update password
    user.password = newPassword;
    user.updatedAt = Date.now();
    await user.save();
    
    res.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误', error: error.message });
  }
});

export default router;