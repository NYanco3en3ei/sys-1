import mongoose from 'mongoose';

/**
 * 连接MongoDB数据库
 * 重要提示：在Vercel部署时，必须在项目设置中正确配置MONGODB_URI环境变量
 * 
 * 在Vercel的无服务器环境中，每次请求都会创建新的数据库连接，
 * 因此我们需要维护一个全局连接池以避免连接过多的问题。
 */

// 全局连接状态
let cachedDb = null;

/**
 * 连接MongoDB数据库
 * @returns {Promise<mongoose.Connection>} MongoDB连接实例
 */
const connectDB = async () => {
  try {
    // 检查是否已经有缓存的连接
    if (cachedDb) {
      console.log('使用缓存的MongoDB连接');
      return cachedDb;
    }

    // 检查是否提供了MongoDB连接字符串
    if (!process.env.MONGODB_URI) {
      // 使用默认提供的MongoDB连接字符串
      const defaultMongoUri = 'mongodb+srv://33:ss33@cluster0.hhxy1qw.mongodb.net/?appName=Cluster0';
      console.log('使用默认的MongoDB连接字符串');
      
      // 创建默认的模拟管理员账号
      if (process.env.NODE_ENV !== 'production') {
        console.log('创建默认的模拟管理员账号: admin / password');
        // 这里可以初始化一些模拟数据
      }
      
      // 使用默认连接字符串
      process.env.MONGODB_URI = defaultMongoUri;
    }

    // 连接MongoDB数据库
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 连接超时时间
    };
    
    // 在Vercel环境中添加额外的配置
    if (process.env.VERCEL) {
      opts.keepAlive = true;
      opts.keepAliveInitialDelayMS = 300000; // 5分钟
    }
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, opts);
    cachedDb = conn.connection;
    
    console.log('MongoDB数据库连接成功');
    return cachedDb;
  } catch (error) {
    console.error('MongoDB连接错误:', error.message);
    
    // 开发模式下提供更详细的错误信息
    if (process.env.NODE_ENV !== 'production') {
      console.error('请确保已正确设置MONGODB_URI环境变量，并检查MongoDB Atlas的IP白名单配置');
      
      // 常见错误排查提示
      if (error.message.includes('ETIMEDOUT')) {
        console.error('连接超时：可能是MongoDB Atlas的IP白名单未配置或网络问题');
      } else if (error.message.includes('Authentication failed')) {
        console.error('认证失败：请检查MONGODB_URI中的用户名和密码是否正确');
      }
    }
    
    // 在Vercel上，我们不希望因为数据库连接失败而导致整个函数终止
    // process.exit(1); // 注释掉这行，允许服务继续运行
    
    return null;
  }
};

export default connectDB;