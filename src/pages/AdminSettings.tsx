import { useState, useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import api from "@/lib/api";

const AdminSettings = () => {
  const { userRole, userName, logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 处理密码表单变化
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 打开密码修改模态框
  const openPasswordModal = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordModal(true);
  };

  // 关闭密码修改模态框
  const closePasswordModal = () => {
    setShowPasswordModal(false);
  };

  // 修改密码
  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('请填写完整的密码信息');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('两次输入的新密码不一致');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('新密码长度至少为6位');
      return;
    }

    try {
      setLoading(true);
      
      // 尝试通过API修改密码
      const response = await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      // 如果API调用成功
      if (response && response.success) {
        toast.success('密码修改成功，请重新登录');
        // 延迟后退出登录，让用户重新登录
        setTimeout(() => {
          logout();
        }, 1500);
        closePasswordModal();
        return;
      }

      // 如果API返回错误信息
      if (response && response.message) {
        throw new Error(response.message);
      }

      // 如果API不可用，尝试在本地存储中修改密码
      if (process.env.NODE_ENV !== 'production') {
        console.log('API不可用，尝试在本地存储中修改密码');
        
        // 检查默认管理员账户密码
        if (passwordData.currentPassword === 'password' && userName === '管理员') {
          // 这里简化处理，实际环境中应该更安全地处理密码
          toast.success('开发环境：密码修改成功');
          closePasswordModal();
        } else {
          throw new Error('当前密码错误');
        }
      }
    } catch (error: any) {
      toast.error(error.message || '修改密码失败');
      console.error('修改密码失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 简化的API请求函数
  const apiRequest = async (endpoint: string, options: globalThis.RequestInit = {}) => {
    try {
      const authData = localStorage.getItem('auth');
      const token = authData ? JSON.parse(authData).token : null;
      
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://your-backend-api.vercel.app/api';
      
      // 如果使用默认API地址，直接返回null表示API不可用
      if (API_BASE_URL === 'https://your-backend-api.vercel.app/api') {
        return null;
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('API连接错误:', error);
      return null;
    }
  };

  // 如果不是管理员，不显示内容
  if (userRole !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 dark:text-slate-400">您没有权限访问此页面</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          管理员设置
        </h1>
      </div>
      
      {/* 设置卡片 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">账户安全</h2>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="text-base font-medium text-slate-800 dark:text-white mb-1">登录密码</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                定期更改密码可以提高账户安全性
              </p>
            </div>
            
            <button
              onClick={openPasswordModal}
              className="mt-3 md:mt-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors inline-flex items-center"
            >
              <i className="fa-solid fa-key mr-2"></i>
              修改密码
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4">
            <div>
              <h3 className="text-base font-medium text-slate-800 dark:text-white mb-1">会话管理</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                当前仅支持单设备登录
              </p>
            </div>
            
            <button
              onClick={() => {
                if (window.confirm('确定要退出所有设备的登录状态吗？')) {
                  toast.success('已退出所有设备登录');
                  logout();
                }
              }}
              className="mt-3 md:mt-0 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors inline-flex items-center"
            >
              <i className="fa-solid fa-sign-out-alt mr-2"></i>
              退出所有设备
            </button>
          </div>
        </div>
      </div>
      
      {/* 系统信息卡片 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">系统信息</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">角色</p>
              <p className="text-base font-medium text-slate-800 dark:text-white">管理员</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">环境</p>
              <p className="text-base font-medium text-slate-800 dark:text-white">
                {process.env.NODE_ENV === 'production' ? '生产环境' : '开发环境'}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">后端连接</p>
              <p className="text-base font-medium text-slate-800 dark:text-white">
                {import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL !== 'https://your-backend-api.vercel.app/api' 
                  ? '已连接' 
                  : '未连接（使用本地数据）'}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">数据存储</p>
              <p className="text-base font-medium text-slate-800 dark:text-white">
                {import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL !== 'https://your-backend-api.vercel.app/api' 
                  ? '数据库' 
                  : '本地存储'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 修改密码模态框 */}
      {showPasswordModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={closePasswordModal}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">修改密码</h2>
            </div>
            
            <form onSubmit={changePassword} className="p-6 space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  当前密码 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="请输入当前密码"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  新密码 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="请输入新密码（至少6位）"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                  minLength={6}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  确认新密码 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="请再次输入新密码"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                  minLength={6}
                  required
                />
              </div>
              
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  className="flex-1 py-2.5 px-4 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  取消
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors ${loading ? 'opacity-80 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>
                      处理中...
                    </>
                  ) : (
                    '确认修改'
                  )}
                </button>
              </div>
              
              {/* 开发环境提示 */}
              {process.env.NODE_ENV !== 'production' && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                  <i className="fa-solid fa-info-circle mr-1"></i>
                  开发环境提示：默认管理员密码为 "password"
                </div>
              )}
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default AdminSettings;