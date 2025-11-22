import express from 'express';
const router = express.Router();
import Tag from '../models/Tag.js';
import { verifyToken, isAdmin } from '../middlewares/auth.js';

// 获取所有标签
router.get('/', verifyToken, async (req, res) => {
  try {
    const query = {};
    
    // 管理员可以查看所有标签
    if (req.user.role !== 'admin') {
      // 非管理员只能看到已批准的标签和自己创建的待批准标签
      query.$or = [
        { isPendingApproval: false },
        { createdBy: req.user.id }
      ];
    }
    
    // 如果请求参数中指定了待批准状态
    if (req.query.isPendingApproval !== undefined) {
      query.isPendingApproval = req.query.isPendingApproval === 'true';
    }
    
    const tags = await Tag.find(query).sort({ createdAt: -1 });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 创建新标签
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    
    // 验证输入
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: '标签名称不能为空' });
    }
    
    // 检查标签是否已存在
    const existingTag = await Tag.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingTag) {
      return res.status(400).json({ success: false, message: '标签名称已存在' });
    }
    
    // 对于业务员，标签需要审核
    const isPendingApproval = req.user.role === 'salesperson';
    
    // 创建新标签
    const newTag = new Tag({
      name: name.trim(),
      isPendingApproval,
      createdBy: req.user.id
    });
    
    await newTag.save();
    
    res.status(201).json({
      success: true,
      message: isPendingApproval ? '标签已提交，等待管理员审核' : '标签创建成功',
      tag: newTag
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// 更新标签
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    
    // 查找标签
    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({ success: false, message: '标签不存在' });
    }
    
    // 检查权限
    if (req.user.role !== 'admin' && tag.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权修改此标签' });
    }
    
    // 验证输入
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: '标签名称不能为空' });
    }
    
    // 检查新标签名是否已存在（排除当前标签）
    const existingTag = await Tag.findOne({ 
      _id: { $ne: req.params.id },
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
    
    if (existingTag) {
      return res.status(400).json({ success: false, message: '标签名称已存在' });
    }
    
    // 更新标签
    tag.name = name.trim();
    tag.updatedAt = Date.now();
    
    await tag.save();
    
    res.json({
      success: true,
      message: '标签更新成功',
      tag
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// 审核标签（管理员专用）
router.post('/:id/approve', verifyToken, isAdmin, async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({ success: false, message: '标签不存在' });
    }
    
    // 批准标签
    tag.isPendingApproval = false;
    tag.updatedAt = Date.now();
    
    await tag.save();
    
    res.json({
      success: true,
      message: '标签已批准',
      tag
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// 删除标签
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({ success: false, message: '标签不存在' });
    }
    
    // 检查权限
    if (req.user.role !== 'admin' && tag.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权删除此标签' });
    }
    
    // 检查是否有产品使用此标签
    // 这里简化处理，实际项目中应该查询Product集合
    
    await tag.deleteOne();
    
    res.json({
      success: true,
      message: '标签已删除'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

export default router;