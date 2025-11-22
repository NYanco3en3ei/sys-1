# 销售订单管理系统 - 前端部分

## 项目结构

这是销售订单管理系统的前端部分，使用React + TypeScript + Tailwind CSS开发。

```
src/
├── components/       # 可复用组件
│   ├── Empty.tsx
│   └── Layout.tsx
├── contexts/         # React上下文
│   └── authContext.ts
├── hooks/            # 自定义Hooks
│   └── useTheme.ts
├── lib/              # 工具库
│   ├── api.ts        # API接口封装
│   └── utils.ts      # 通用工具函数
├── pages/            # 页面组件
│   ├── Customers.tsx
│   ├── Dashboard.tsx
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── Orders.tsx
│   ├── Products.tsx
│   └── Salespersons.tsx
├── App.tsx           # 应用主组件
├── index.css         # 全局样式
├── main.tsx          # 入口文件
└── vite-env.d.ts     # Vite类型声明
```

## 安装和运行

### 前提条件

- Node.js 16+
- npm, yarn 或 pnpm

### 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 本地开发

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

### 构建生产版本

```bash
npm run build
# 或
yarn build
# 或
pnpm build
```

## 配置后端连接

前端需要连接到后端API。请在 `src/lib/api.ts` 文件中修改以下配置：

```javascript
// 将此值修改为您的后端API地址
const API_BASE_URL = 'https://your-backend-api.vercel.app/api';
```

## 部署指南

前端可以部署到任何支持静态网站的平台，如Vercel、Netlify、GitHub Pages等。

### Vercel部署步骤

1. 确保已构建生产版本 (`npm run build`)
2. 登录Vercel并创建新项目
3. 导入包含此前端代码的GitHub仓库
4. Vercel会自动检测这是一个Vite项目并应用正确的构建配置
5. 部署完成后，您可以访问前端应用

## 功能概述

- 管理员和业务员角色登录
- 产品管理（添加、编辑、删除、审核）
- 订单管理（创建、查看、状态更新、删除）
- 客户管理（添加、编辑、删除）
- 业务员管理（仅管理员）
- 数据可视化仪表盘