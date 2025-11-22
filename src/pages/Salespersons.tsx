import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from "@/lib/api";

// 业务员账号类型定义
interface Salesperson {
  id: string;
  username: string;
  password: string;
  name: string;
  role?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

const Salespersons = () => {
  const { userRole } = useContext(AuthContext);
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [pendingUsers, setPendingUsers] = useState<Salesperson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingSalesperson, setEditingSalesperson] = useState<Salesperson | null>(null);
  const [salespersonToDelete, setSalespersonToDelete] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'salesperson'
  });
  const [showPendingTab, setShowPendingTab] = useState(false);
  
  const navigate = useNavigate();

  // 检查用户角色
  useEffect(() => {
    if (userRole !== 'admin') {
      navigate('/');
    }
  }, [userRole, navigate]);

  // 加载业务员数据
  useEffect(() => {
    if (userRole === 'admin') {
      loadSalespersons();
      loadPendingUsers();
    }
  }, [userRole]);

  const loadSalespersons = () => {
    setLoading(true);
    try {
      // 优先从API获取
      const fetchSalespersons = async () => {
        try {
          const response = await api.salespersons.getAll();
          if (response && Array.isArray(response)) {
            setSalespersons(response);
            localStorage.setItem('salespersons', JSON.stringify(response));
            return;
          }
        } catch (error) {
          console.log('API加载失败，使用本地存储');
        }
        
        // 如果API失败，使用本地存储
        const storedSalespersons = localStorage.getItem('salespersons');
        if (storedSalespersons) {
          setSalespersons(JSON.parse(storedSalespersons));
        } else {
          // 初始化默认业务员账号
          const defaultSalespersons: Salesperson[] = [
            {
              id: '1',
              username: 'sales1',
              password: 'password',
              name: '业务员小王',
              role: 'salesperson',
              status: 'approved',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: '2',
              username: 'sales2',
              password: 'password',
              name: '业务员小李',
              role: 'salesperson',
              status: 'approved',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ];
          localStorage.setItem('salespersons', JSON.stringify(defaultSalespersons));
          setSalespersons(defaultSalespersons);
        }
      };
      
      fetchSalespersons();
    } catch (error) {
      toast.error('加载业务员数据失败');
      console.error('加载业务员数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载待审核用户
  const loadPendingUsers = () => {
    try {
      const storedUsers = localStorage.getItem('salespersons');
      if (storedUsers) {
        const users = JSON.parse(storedUsers);
        // 在模拟环境中，我们假设所有用户都是待审核的
        setPendingUsers(users);
      }
    } catch (error) {
      console.error('加载待审核用户失败:', error);
    }
  };

  // 打开新增/编辑模态框
  const openModal = (salesperson: Salesperson | null = null) => {
    setEditingSalesperson(salesperson);
    if (salesperson) {
      setFormData({
        username: salesperson.username,
        password: '', // 不显示现有密码
        name: salesperson.name,
        role: salesperson.role || 'salesperson'
      });
    } else {
      setFormData({
        username: '',
        password: '',
        name: ''
      });
    }
    setShowModal(true);
  };

  // 打开删除确认模态框
  const openDeleteModal = (id: string) => {
    setSalespersonToDelete(id);
    setDeletePassword('');
    setShowDeleteModal(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setShowModal(false);
    setShowDeleteModal(false);
    setEditingSalesperson(null);
    setSalespersonToDelete(null);
  };

  // 处理表单变化
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 保存业务员
  const saveSalesperson = (e: React.FormEvent) => {
    e.preventDefault();
    
  // 表单验证
  if (!formData.username.trim() || !formData.name.trim()) {
    toast.error('请填写完整的业务员信息');
    return;
  }
  
  // 如果是编辑模式，检查是否有role字段，如果没有则添加默认值
  if (editingSalesperson && !formData.role) {
    setFormData(prev => ({
      ...prev,
      role: 'salesperson'
    }));
  }

    // 检查用户名是否已存在
    const usernameExists = salespersons.some(s => 
      s.username === formData.username && (!editingSalesperson || s.id !== editingSalesperson.id)
    );
    
    if (usernameExists) {
      toast.error('用户名已存在');
      return;
    }

    try {
      let updatedSalespersons;
      const now = new Date().toISOString();
      
      if (editingSalesperson) {
        // 编辑现有业务员
        updatedSalespersons = salespersons.map(s => 
          s.id === editingSalesperson.id 
            ? { 
                ...s, 
                username: formData.username,
                password: formData.password ? formData.password : s.password,
                name: formData.name,
                updatedAt: now 
              } 
            : s
        );
        toast.success('业务员信息更新成功');
      } else {
        // 添加新业务员
        if (!formData.password) {
          toast.error('请设置密码');
          return;
        }
        
        const newSalesperson: Salesperson = {
          id: Date.now().toString(),
          ...formData,
          role: formData.role || 'salesperson',
          status: 'approved',
          createdAt: now,
          updatedAt: now
        };
        updatedSalespersons = [...salespersons, newSalesperson];
        toast.success('业务员添加成功');
      }
      
      // 保存到本地存储
      localStorage.setItem('salespersons', JSON.stringify(updatedSalespersons));
      setSalespersons(updatedSalespersons);
      closeModal();
    } catch (error) {
      toast.error('保存业务员信息失败');
      console.error('保存业务员信息失败:', error);
    }
  };

  // 删除业务员（需要密码确认）
  const deleteSalesperson = () => {
    if (!salespersonToDelete) return;

    // 检查密码（在实际应用中应该从后端验证）
    // 这里为了演示，我们假设默认管理员密码是 'password'
    if (deletePassword !== 'password') {
      toast.error('密码错误，无法删除业务员');
      return;
    }

    try {
      // 检查是否有订单关联到此业务员
      const ordersData = localStorage.getItem('orders');
      if (ordersData) {
        const orders = JSON.parse(ordersData);
        const salesperson = salespersons.find(s => s.id === salespersonToDelete);
        
        if (salesperson) {
          const hasRelatedOrders = orders.some((order: any) => order.createdBy === salesperson.username);
          
          if (hasRelatedOrders) {
            toast.error('该业务员已有创建的订单，无法删除');
            closeModal();
            return;
          }
        }
      }

      const updatedSalespersons = salespersons.filter(s => s.id !== salespersonToDelete);
      localStorage.setItem('salespersons', JSON.stringify(updatedSalespersons));
      setSalespersons(updatedSalespersons);
      closeModal();
      toast.success('业务员删除成功');
    } catch (error) {
      toast.error('删除业务员失败');
      console.error('删除业务员失败:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 md:mb-0">
          业务员管理
        </h1>
        
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
        >
          <i className="fa-solid fa-plus mr-2"></i>
          添加业务员
        </button>
      </div>
      
      {/* 标签页切换 */}
      <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden mb-6">
        <button
          onClick={() => setShowPendingTab(false)}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            !showPendingTab 
              ? 'bg-blue-600 text-white' 
              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          已批准业务员
        </button>
        <button
          onClick={() => setShowPendingTab(true)}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            showPendingTab 
              ? 'bg-blue-600 text-white' 
              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          待审核用户
          <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">
            {pendingUsers.length}
          </span>
        </button>
      </div>
      
      {/* 业务员列表或待审核用户列表 */}
      {!showPendingTab ? (
        // 已批准业务员列表
        salespersons.length > 0 ? (
          <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    用户名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    姓名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    更新时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {salespersons.map((salesperson) => (
                  <motion.tr 
                    key={salesperson.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-white">
                      {salesperson.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                      {salesperson.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {new Date(salesperson.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {new Date(salesperson.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openModal(salesperson)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        >
                          <i className="fa-solid fa-pen-to-square mr-1"></i>
                          编辑
                        </button>
                        
                        <button
                          onClick={() => openDeleteModal(salesperson.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        >
                          <i className="fa-solid fa-trash-alt mr-1"></i>
                          删除
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 mb-4">
              <i className="fa-solid fa-user-tie text-2xl text-slate-400 dark:text-slate-500"></i>
            </div>
            <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">暂无业务员账号</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              点击"添加业务员"按钮开始创建第一个业务员账号
            </p>
            
            <button
              onClick={() => openModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center"
            >
              <i className="fa-solid fa-plus mr-2"></i>
              添加业务员
            </button>
          </div>
        )
      ) : (
        // 待审核用户列表
        pendingUsers.length > 0 ? (
          <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl shadow-sm border-2 border-yellow-300 dark:border-yellow-600">
            <table className="w-full">
              <thead className="bg-yellow-50 dark:bg-yellow-900/20">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    用户名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    姓名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    角色
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    注册时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {pendingUsers.map((user) => (
                  <motion.tr 
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-white">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {user.role === 'admin' ? '管理员' : '业务员'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            // 模拟批准用户
                            const updatedUsers = pendingUsers.filter(u => u.id !== user.id);
                            setPendingUsers(updatedUsers);
                            
                            // 添加到已批准列表
                            const updatedSalespersons = [...salespersons, user];
                            setSalespersons(updatedSalespersons);
                            localStorage.setItem('salespersons', JSON.stringify(updatedSalespersons));
                            
                            toast.success('用户已批准');
                          }}
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                        >
                          <i className="fa-solid fa-check mr-1"></i>
                          批准
                        </button>
                        
                        <button
                          onClick={() => {
                            // 模拟拒绝用户
                            const updatedUsers = pendingUsers.filter(u => u.id !== user.id);
                            setPendingUsers(updatedUsers);
                            toast.success('用户已拒绝');
                          }}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        >
                          <i className="fa-solid fa-times mr-1"></i>
                          拒绝
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 mb-4">
              <i className="fa-solid fa-clock text-2xl text-slate-400 dark:text-slate-500"></i>
            </div>
            <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">暂无待审核用户</h3>
            <p className="text-slate-500 dark:text-slate-400">
              所有用户注册请求都已处理完毕
            </p>
          </div>
        )
      )}
      
      {/* 业务员表单模态框 */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={closeModal}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {editingSalesperson ? '编辑业务员' : '添加业务员'}
              </h2>
            </div>
            
            <form onSubmit={saveSalesperson} className="p-6 space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  用户名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleFormChange}
                  placeholder="请输入用户名"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>
              
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="请输入业务员姓名"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                required
              />
            </div>
            
            {/* 角色选择（仅管理员可见） */}
            {userRole === 'admin' && (
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  角色
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                >
                  <option value="salesperson">业务员</option>
                  <option value="admin">管理员</option>
                </select>
              </div>
            )}
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  密码 {editingSalesperson ? '(留空则不修改)' : <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  placeholder="请输入密码"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                  {...(!editingSalesperson && { required: true })}
                />
              </div>
              
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 px-4 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  取消
                </button>
                
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingSalesperson ? '保存修改' : '添加业务员'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      
      {/* 删除确认模态框 */}
      {showDeleteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={closeModal}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                <i className="fa-solid fa-exclamation-triangle text-yellow-500 mr-2"></i>
                确认删除
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-slate-700 dark:text-slate-300">
                您确定要删除此业务员账号吗？此操作不可撤销。
              </p>
              
              <div>
                <label htmlFor="deletePassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  请输入管理员密码确认
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <i className="fa-solid fa-lock"></i>
                  </span>
                  <input
                    type="password"
                    id="deletePassword"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="输入密码"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                    required
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  为防止误操作，删除业务员需要管理员密码确认
                </p>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 px-4 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  取消
                </button>
                
                <button
                  type="button"
                  onClick={deleteSalesperson}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <i className="fa-solid fa-trash-alt mr-1"></i>
                  确认删除
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Salespersons;