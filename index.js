import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './utils/db.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import customerRoutes from './routes/customers.js';
import tagRoutes from './routes/tags.js';
import salespersonRoutes from './routes/salespersons.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors()); // 允许所有跨域请求
app.use(express.json()); // 解析JSON请求体

  // 确保MongoDB连接正常
  connectDB().catch(err => {
    console.error('MongoDB连接失败，将继续运行但部分功能可能受限');
    
    // 在非生产环境中，提供更多调试信息
    if (process.env.NODE_ENV !== 'production') {
      console.log('提示：在开发环境中，系统将自动使用本地存储数据进行模拟操作');
      console.log('请确保在生产环境中正确配置了MONGODB_URI环境变量');
    }
  });

// API Routes - 所有API都以/api前缀开始
app.use('/api/auth', authRoutes);         // 认证相关路由
app.use('/api/products', productRoutes); // 产品管理路由
app.use('/api/orders', orderRoutes);     // 订单管理路由
app.use('/api/customers', customerRoutes); // 客户管理路由
app.use('/api/tags', tagRoutes);         // 标签管理路由
app.use('/api/salespersons', salespersonRoutes); // 业务员管理路由

// Serve the verification file for WeChat
app.get('/8147b3d06baa305771ec637adbdcee5d.txt', (req, res) => {
  res.type('text/plain').send('470b76c4f36d39039f2be9df2eff01e982bc639f');
});

// Health check endpoint - 用于验证服务是否正常运行
app.get('/', (req, res) => {
  res.json({ 
    message: 'Sales Order Management API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 404路由处理
app.use((req, res) => {
  res.status(404).json({ message: 'API端点不存在' });
});

// Error handling middleware - 统一错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err.stack);
  res.status(500).json({ 
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'production' ? '请稍后再试' : err.message 
  });
});

// Start server - Vercel会自动处理端口绑定
const PORT = process.env.PORT || 3001;

// 只有在直接运行此文件时才启动服务器（避免在Vercel上重复启动）
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`API Base URL: http://localhost:${PORT}/api`);
  });
}

// 在Vercel上，导出app供Vercel的无服务器函数使用
export default app;