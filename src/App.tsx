import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuthContext } from '@/contexts/authContext';
import { Toaster } from 'sonner';
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Orders from "@/pages/Orders";
import Customers from "@/pages/Customers";
import Salespersons from "@/pages/Salespersons";
import AdminSettings from "@/pages/AdminSettings";
import Layout from "@/components/Layout";


// 模拟数据初始化 - 仅用于开发环境
const initializeMockData = () => {
  // 在实际部署时，这些数据将由后端提供
  if (process.env.NODE_ENV !== 'production') {
    // 初始化产品数据
    if (!localStorage.getItem('products')) {
      const mockProducts = [
        {
          id: '1',
          name: '高性能笔记本电脑',
          price: 8999,
          image: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square_hd&prompt=laptop%20high%20performance%20modern&sign=68ff687a31442481e32b96de72619dea',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: '专业显示器',
          price: 3299,
          image: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square_hd&prompt=professional%20monitor%20ultra%20hd&sign=80ed557956a15a4ff99cd94dec2186e7',
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          name: '无线蓝牙耳机',
          price: 1299,
          image: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square_hd&prompt=wireless%20bluetooth%20headphones%20premium&sign=ef570c36be577d451fd642da980d35e6',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('products', JSON.stringify(mockProducts));
    }

    // 初始化客户数据
    if (!localStorage.getItem('customers')) {
      const mockCustomers = [
        {
          id: '1',
          name: '科技有限公司',
          address: '北京市朝阳区科技园A座1001室',
          contact: '张经理',
          phone: '13800138001',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: '创新贸易公司',
          address: '上海市浦东新区贸易中心B栋505室',
          contact: '李总',
          phone: '13900139002',
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          name: '未来电子厂',
          address: '深圳市南山区电子产业园C区203室',
          contact: '王厂长',
          phone: '13700137003',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('customers', JSON.stringify(mockCustomers));
    }

    // 初始化订单数据
    if (!localStorage.getItem('orders')) {
      const mockOrders = [
        {
          id: '1',
          customerId: '1',
          customerName: '科技有限公司',
          customerAddress: '北京市朝阳区科技园A座1001室',
          products: [
            { productId: '1', productName: '高性能笔记本电脑', quantity: 2, unitPrice: 8999 }
          ],
          totalAmount: 17998,
          deliveryDate: '2025-11-15',
          status: 'pending',
          createdBy: 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          customerId: '2',
          customerName: '创新贸易公司',
          customerAddress: '上海市浦东新区贸易中心B栋505室',
          products: [
            { productId: '2', productName: '专业显示器', quantity: 3, unitPrice: 3299 },
            { productId: '3', productName: '无线蓝牙耳机', quantity: 5, unitPrice: 1299 }
          ],
          totalAmount: 3299 * 3 + 1299 * 5,
          deliveryDate: '2025-11-20',
          status: 'shipped',
          createdBy: 'sales1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('orders', JSON.stringify(mockOrders));
    }
  }
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "salesperson" | null>(null);
  const [userName, setUserName] = useState("");

  // 初始化模拟数据 - 仅用于开发环境
  useEffect(() => {
    initializeMockData();
  }, []);

  const logout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setUserName("");
    localStorage.removeItem('auth');
  };

  // 从本地存储加载认证状态
  useEffect(() => {
    const authData = localStorage.getItem('auth');
    if (authData) {
      const { role, name } = JSON.parse(authData);
      setIsAuthenticated(true);
      setUserRole(role);
      setUserName(name);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ 
        isAuthenticated, 
        userRole,
        userName,
        setIsAuthenticated, 
        setUserRole,
        setUserName,
        logout 
      }}
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* 需要认证的路由 */}
        <Route 
          path="/" 
          element={isAuthenticated ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/products" 
          element={isAuthenticated ? <Layout><Products /></Layout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/orders" 
          element={isAuthenticated ? <Layout><Orders /></Layout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/customers" 
          element={isAuthenticated && userRole === 'admin' ? <Layout><Customers /></Layout> : <Navigate to="/" />} 
        />
        <Route 
          path="/salespersons" 
          element={isAuthenticated && userRole === 'admin' ? <Layout><Salespersons /></Layout> : <Navigate to="/" />} 
        />
        <Route 
          path="/admin-settings" 
          element={isAuthenticated && userRole === 'admin' ? <Layout><AdminSettings /></Layout> : <Navigate to="/" />} 
        />
      </Routes>
      <Toaster position="top-right" />
    </AuthContext.Provider>
  );
}
