# 销售订单管理系统部署指南

本指南将帮助您快速部署销售订单管理系统，包括前端和后端部分。

## 系统概述

这是一个完整的销售订单管理系统，具有以下功能：
- 管理员和业务员角色分离
- 产品管理
- 客户管理
- 订单创建和管理
- 订单导出功能
- 数据可视化仪表板

## 部署准备

在开始部署之前，请确保您已准备好以下内容：
- GitHub 账号（用于代码仓库）
- Vercel 账号（用于免费托管）
- MongoDB Atlas 账号（用于数据库服务）

## 后端部署步骤

### 1. 创建 MongoDB 数据库

1. 访问 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 并创建账号
2. 创建一个新的项目
3. 构建一个免费的集群（Free Tier）
4. 设置数据库用户和密码
5. 配置网络访问权限（允许所有IP地址访问）
6. 获取连接字符串（Connection String）

### 2. 部署后端到 Vercel

1. Fork 本仓库到您的 GitHub 账号
2. 登录 [Vercel](https://vercel.com/) 并导入您的仓库
3. 在 Vercel 项目设置中配置环境变量：
   - `MONGODB_URI`: 从 MongoDB Atlas 获取的连接字符串
   - `JWT_SECRET`: 一个随机字符串，用于加密 JWT 令牌
4. 点击部署按钮

## 前端部署步骤

前端代码已经与后端代码集成在同一仓库中，当您在 Vercel 上部署整个仓库时，前端会自动部署。您只需确保在 Vercel 项目设置中配置了正确的环境变量。

## 环境变量配置

在 Vercel 项目设置中，您需要配置以下环境变量：

| 变量名 | 描述 | 必填 |
|-------|------|------|
| MONGODB_URI | MongoDB 连接字符串 | 是 |
| JWT_SECRET | 用于 JWT 令牌的密钥 | 是 |
| VITE_API_BASE_URL | 后端 API 地址（默认为 Vercel 项目 URL） | 否 |

## 部署后的访问

部署完成后，您可以通过 Vercel 提供的 URL 访问系统。默认的管理员账号是：
- 用户名: admin
- 密码: password

请在首次登录后立即修改管理员密码。

## 本地开发设置

如果您想在本地开发和测试系统，请按照以下步骤操作：

1. 克隆仓库
2. 安装依赖：`npm install`
3. 创建 `.env` 文件，并配置必要的环境变量
4. 启动开发服务器：`npm run dev`
5. 在浏览器中访问 `http://localhost:3000`

## 项目结构

```
├── .env.example           # 环境变量示例文件
├── .gitignore            # Git忽略文件配置
├── index.html            # 前端入口HTML
├── index.js              # 后端入口文件
├── models/               # MongoDB数据模型
│   ├── Customer.js       # 客户模型
│   ├── Order.js          # 订单模型
│   ├── Product.js        # 产品模型
│   └── User.js           # 用户模型
├── routes/               # API路由
│   ├── auth.js           # 认证路由
│   ├── customers.js      # 客户管理路由
│   ├── orders.js         # 订单管理路由
│   ├── products.js       # 产品管理路由
│   └── salespersons.js   # 业务员管理路由
├── src/                  # 前端源码
│   ├── components/       # React组件
│   ├── contexts/         # React Context
│   ├── hooks/            # 自定义Hooks
│   ├── lib/              # 工具函数和API调用
│   ├── pages/            # 页面组件
│   └── main.tsx          # 前端入口文件
└── utils/                # 工具函数
    └── db.js             # 数据库连接工具
```

## 关键文件说明

### 后端文件
- **index.js**: 后端服务器入口点，处理路由和中间件配置
- **models/**: 包含所有数据库模型定义
- **routes/**: 包含所有API路由处理程序
- **utils/db.js**: 处理MongoDB连接逻辑

### 前端文件
- **src/main.tsx**: 前端应用程序入口点
- **src/App.tsx**: 应用程序主组件，处理路由
- **src/pages/**: 包含所有应用程序页面组件
- **src/lib/api.ts**: 处理与后端API的通信
- **src/components/Layout.tsx**: 应用程序布局组件

## 常见问题解决

### MongoDB 连接问题
- 确保 MongoDB Atlas 的 IP 白名单配置正确
- 检查 `MONGODB_URI` 环境变量格式是否正确
- 确认数据库用户权限设置正确

### 部署问题
- 确保所有必要的环境变量都已配置
- 检查 Vercel 构建日志以获取详细错误信息
- 确保项目结构符合 Vercel 的要求

### 其他问题
- 如果遇到认证问题，请确认 `JWT_SECRET` 环境变量已设置
- 对于前端API调用问题，请检查 `VITE_API_BASE_URL` 环境变量

## 安全注意事项

- 生产环境中不要使用默认的管理员密码
- 定期更新数据库密码和JWT密钥
- 考虑在生产环境中限制IP访问权限
- 确保敏感信息不会提交到代码仓库

祝您部署顺利！如有任何问题，请参考相关文档或寻求技术支持。