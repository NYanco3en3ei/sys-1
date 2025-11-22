import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// 客户类型定义
interface Customer {
  id: string;
  name: string;
  address: string;
  contact: string;
  phone: string;
  createdAt: string;
}

const Customers = () => {
  const { userRole } = useContext(AuthContext);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact: '',
    phone: ''
  });
  
  const navigate = useNavigate();

  // 检查用户角色
  useEffect(() => {
    if (userRole !== 'admin') {
      navigate('/');
    }
  }, [userRole, navigate]);

  // 加载客户数据
  useEffect(() => {
    if (userRole === 'admin') {
      loadCustomers();
    }
  }, [userRole]);

  const loadCustomers = () => {
    setLoading(true);
    try {
      const storedCustomers = localStorage.getItem('customers');
      if (storedCustomers) {
        setCustomers(JSON.parse(storedCustomers));
      }
    } catch (error) {
      toast.error('加载客户数据失败');
      console.error('加载客户数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 打开新增/编辑模态框
  const openModal = (customer: Customer | null = null) => {
    setEditingCustomer(customer);
    if (customer) {
      setFormData({
        name: customer.name,
        address: customer.address,
        contact: customer.contact,
        phone: customer.phone
      });
    } else {
      setFormData({
        name: '',
        address: '',
        contact: '',
        phone: ''
      });
    }
    setShowModal(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
  };

  // 处理表单变化
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 保存客户
  const saveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!formData.name.trim() || !formData.address.trim() || !formData.contact.trim() || !formData.phone.trim()) {
      toast.error('请填写完整的客户信息');
      return;
    }

    try {
      let updatedCustomers;
      
      if (editingCustomer) {
        // 编辑现有客户
        updatedCustomers = customers.map(customer => 
          customer.id === editingCustomer.id 
            ? { ...customer, ...formData, updatedAt: new Date().toISOString() } 
            : customer
        );
        toast.success('客户信息更新成功');
      } else {
        // 添加新客户
        const newCustomer: Customer = {
          id: Date.now().toString(),
          ...formData,
          createdAt: new Date().toISOString()
        };
        updatedCustomers = [...customers, newCustomer];
        toast.success('客户添加成功');
      }
      
      // 保存到本地存储
      localStorage.setItem('customers', JSON.stringify(updatedCustomers));
      setCustomers(updatedCustomers);
      closeModal();
    } catch (error) {
      toast.error('保存客户信息失败');
      console.error('保存客户信息失败:', error);
    }
  };

  // 删除客户
  const deleteCustomer = (id: string) => {
    // 检查是否有订单关联到此客户
    const ordersData = localStorage.getItem('orders');
    if (ordersData) {
      const orders = JSON.parse(ordersData);
      const hasRelatedOrders = orders.some((order: any) => order.customerId === id);
      
      if (hasRelatedOrders) {
        toast.error('该客户已有关联订单，无法删除');
        return;
      }
    }

    if (window.confirm('确定要删除这个客户吗？')) {
      try {
        const updatedCustomers = customers.filter(customer => customer.id !== id);
        localStorage.setItem('customers', JSON.stringify(updatedCustomers));
        setCustomers(updatedCustomers);
        toast.success('客户删除成功');
      } catch (error) {
        toast.error('删除客户失败');
        console.error('删除客户失败:', error);
      }
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
          客户管理
        </h1>
        
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
        >
          <i className="fa-solid fa-plus mr-2"></i>
          添加客户
        </button>
      </div>
      
      {/* 客户列表 */}
      {customers.length > 0 ? (
        <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  客户名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  联系人
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  联系电话
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  地址
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {customers.map((customer) => (
                <motion.tr 
                  key={customer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-white">
                    {customer.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                    {customer.contact}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                    {customer.phone}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 max-w-xs truncate">
                    {customer.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openModal(customer)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                      >
                        <i className="fa-solid fa-pen-to-square mr-1"></i>
                        编辑
                      </button>
                      
                      <button
                        onClick={() => deleteCustomer(customer.id)}
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
            <i className="fa-solid fa-users text-2xl text-slate-400 dark:text-slate-500"></i>
          </div>
          <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">暂无客户</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            点击"添加客户"按钮开始创建您的第一个客户
          </p>
          
          <button
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center"
          >
            <i className="fa-solid fa-plus mr-2"></i>
            添加客户
          </button>
        </div>
      )}
      
      {/* 客户表单模态框 */}
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
                {editingCustomer ? '编辑客户' : '添加客户'}
              </h2>
            </div>
            
            <form onSubmit={saveCustomer} className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  客户名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="请输入客户名称"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="contact" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  联系人 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="contact"
                  name="contact"
                  value={formData.contact}
                  onChange={handleFormChange}
                  placeholder="请输入联系人姓名"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  联系电话 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  placeholder="请输入联系电话"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  客户地址 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  placeholder="请输入客户详细地址"
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none resize-none"
                  required
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
                  {editingCustomer ? '保存修改' : '添加客户'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Customers;