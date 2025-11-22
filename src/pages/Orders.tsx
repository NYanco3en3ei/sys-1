import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import api from "@/lib/api";

// 标签类型定义
interface Tag {
  id: string;
  name: string;
  isPendingApproval?: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}


  
  // 产品类型
  interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
    createdAt: string;
    tags?: string[]; // 产品标签
  }

// 客户类型
interface Customer {
  id: string;
  name: string;
  address: string;
  contact: string;
  phone: string;
  createdAt: string;
}

// 订单项类型
interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  originalPrice?: number; // 原始价格
}

// 订单状态类型
type OrderStatus = 'pending' | 'approved' | 'shipped' | 'delivered' | 'cancelled';

// 订单类型 - 添加备注字段和业务员字段
interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  products: OrderItem[];
  totalAmount: number;
  deliveryDate: string;
  status: OrderStatus;
  createdBy: string;
  salespersonId?: string; // 所属业务员ID
  salespersonName?: string; // 所属业务员名称
  createdAt: string;
  updatedAt: string;
  notes?: string; // 订单备注
}

const Orders = () => {
  const { userRole, userName } = useContext(AuthContext);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false); // 新增备注模态框
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [searchType, setSearchType] = useState<'salesperson' | 'customer' | 'note'>('salesperson'); // 添加备注搜索类型
  const [searchValue, setSearchValue] = useState('');
  const [formData, setFormData] = useState({
    customerId: '',
    customerAddress: '', // 手动输入的地址
    selectedProducts: [] as { productId: string; quantity: number; unitPrice?: number }[],
    deliveryDate: '',
    notes: '', // 订单备注
    salespersonId: '' // 所属业务员ID
  });
  const [tags, setTags] = useState<Tag[]>([]); // 产品标签
  const [selectedTag, setSelectedTag] = useState<string | null>(null); // 当前选中的标签
  const [notesContent, setNotesContent] = useState(''); // 备注内容
  const [viewType, setViewType] = useState<'all' | 'pending' | 'processed' | 'pre'>('all'); // 视图类型：全部订单、待处理、已处理、预下单
  const [salespersons, setSalespersons] = useState<any[]>([]); // 业务员列表
  
  // 日期范围状态
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // 加载数据
  useEffect(() => {
    loadData();
  }, [userRole, userName]);

  // 搜索和视图切换效果
  useEffect(() => {
    filterOrders();
  }, [orders, searchType, searchValue, dateRange.startDate, dateRange.endDate, viewType]);

  // 检查预下单到期提醒
  useEffect(() => {
    checkPreOrderReminders();
  }, [orders]);

  // 加载数据（包括标签）
  const loadData = () => {
    setLoading(true);
    try {
      // 加载订单
      const storedOrders = localStorage.getItem('orders');
      if (storedOrders) {
        let parsedOrders: Order[] = JSON.parse(storedOrders);
        
        // 根据用户角色筛选订单
        if (userRole === 'salesperson') {
          parsedOrders = parsedOrders.filter(order => order.createdBy === userName);
        }
        
        setOrders(parsedOrders);
      }
      
      // 加载产品
      const storedProducts = localStorage.getItem('products');
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      }
      
      // 加载客户
      const storedCustomers = localStorage.getItem('customers');
      if (storedCustomers) {
        setCustomers(JSON.parse(storedCustomers));
      }

      // 加载业务员列表（仅管理员需要）
      if (userRole === 'admin') {
        const storedSalespersons = localStorage.getItem('salespersons');
        if (storedSalespersons) {
          setSalespersons(JSON.parse(storedSalespersons));
        }
      }

      // 加载产品标签
      const storedTags = localStorage.getItem('tags');
      if (storedTags) {
        const allTags = JSON.parse(storedTags);
        // 只显示已批准的标签
        const approvedTags = allTags.filter((tag: Tag) => !tag.isPendingApproval);
        setTags(approvedTags);
      }
    } catch (error) {
      toast.error('加载数据失败');
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 过滤订单 - 新增预下单过滤和备注搜索
  const filterOrders = () => {
    let filtered = [...orders];
    
    // 按视图类型过滤
    if (viewType === 'pre') {
      // 预下单：发货日期为当前日期之后且状态为待处理或已批准
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(order => 
        new Date(order.deliveryDate) >= today && 
        ['pending', 'approved'].includes(order.status)
      );
    } else if (viewType === 'pending') {
      // 待处理：状态为待审核
      filtered = filtered.filter(order => order.status === 'pending');
    } else if (viewType === 'processed') {
      // 已处理：状态为已批准、已发货或已送达
      filtered = filtered.filter(order => 
        ['approved', 'shipped', 'delivered'].includes(order.status)
      );
    }
    
    // 按搜索类型过滤
    if (searchValue.trim()) {
      filtered = filtered.filter(order => {
        if (searchType === 'salesperson') {
          return order.createdBy.toLowerCase().includes(searchValue.toLowerCase());
        } else if (searchType === 'customer') {
          return order.customerName.toLowerCase().includes(searchValue.toLowerCase());
        } else if (searchType === 'note') {
          // 备注搜索功能
          return order.notes?.toLowerCase().includes(searchValue.toLowerCase()) || false;
        }
        return false;
      });
    }
    
    // 按日期范围过滤
    if (dateRange.startDate || dateRange.endDate) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
        const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;
        
        // 设置结束日期为当天的结束时间
        if (endDate) {
          endDate.setHours(23, 59, 59, 999);
        }
        
        if (startDate && endDate) {
          return orderDate >= startDate && orderDate <= endDate;
        } else if (startDate) {
          return orderDate >= startDate;
        } else if (endDate) {
          return orderDate <= endDate;
        }
        return true;
      });
    }
    
    setFilteredOrders(filtered);
  };

  // 检查预下单到期提醒
  const checkPreOrderReminders = () => {
    // 只有管理员可以接收提醒
    if (userRole !== 'admin') return;
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // 查找明天到期的预下单
    const upcomingPreOrders = orders.filter(order => {
      const deliveryDate = new Date(order.deliveryDate);
      return deliveryDate.toDateString() === tomorrow.toDateString() && 
             ['pending', 'approved'].includes(order.status);
    });
    
    // 如果有到期的预下单，发送提醒
    if (upcomingPreOrders.length > 0) {
      // 检查是否已经发送过提醒，避免重复提醒
      const lastReminderKey = 'last_pre_order_reminder';
      const lastReminderDate = localStorage.getItem(lastReminderKey);
      const todayDateString = today.toDateString();
      
      if (lastReminderDate !== todayDateString) {
        // 发送微信通知
        upcomingPreOrders.forEach(order => {
          try {
            api.notifications.sendWechatNotification(
              `订单号 ${order.id} 明天到期发货，请及时处理。客户：${order.customerName}`, 
              '预下单到期提醒'
            );
          } catch (error) {
            console.error('发送预下单提醒失败:', error);
          }
        });
        
        // 记录最后提醒日期
        localStorage.setItem(lastReminderKey, todayDateString);
      }
    }
  };

  // 打开创建订单模态框
  const openCreateModal = () => {
    setFormData({
      customerId: '',
      customerAddress: '',
      selectedProducts: [],
      deliveryDate: '',
      notes: '',
      salespersonId: ''
    });
    setSelectedTag(null); // 重置选中的标签
    setShowModal(true);
  };

  // 当客户选择改变时，自动填充地址但允许修改
  useEffect(() => {
    if (formData.customerId && !formData.customerAddress) {
      const selectedCustomer = customers.find(customer => customer.id === formData.customerId);
      if (selectedCustomer) {
        setFormData(prev => ({
          ...prev,
          customerAddress: selectedCustomer.address
        }));
      }
    }
  }, [formData.customerId, customers, formData.customerAddress]);

  // 打开订单详情模态框
  const openDetailModal = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  // 打开备注编辑模态框
  const openNotesModal = (order: Order) => {
    setSelectedOrder(order);
    setNotesContent(order.notes || '');
    setShowNotesModal(true);
  };

  // 保存订单备注
  const saveOrderNotes = () => {
    if (!selectedOrder) return;
    
    try {
      const updatedOrders = orders.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, notes: notesContent.trim(), updatedAt: new Date().toISOString() } 
          : order
      );
      
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
      setOrders(updatedOrders);
      setShowNotesModal(false);
      toast.success('备注已保存');
    } catch (error) {
      toast.error('保存备注失败');
      console.error('保存备注失败:', error);
    }
  };

  // 打开删除确认模态框
  const openDeleteModal = (orderId: string) => {
    setOrderToDelete(orderId);
    setDeletePassword('');
    setShowDeleteModal(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setShowModal(false);
    setShowDetailModal(false);
    setShowDeleteModal(false);
    setShowNotesModal(false);
    setSelectedOrder(null);
    setOrderToDelete(null);
  };

  // 处理表单变化
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 处理日期范围变化
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 应用日期范围筛选
  const applyDateFilter = () => {
    filterOrders();
  };
  
  // 重置日期范围筛选
  const resetDateFilter = () => {
    setDateRange({
      startDate: '',
      endDate: ''
    });
    filterOrders();
  };

  // 添加产品到订单
  const addProductToOrder = (productId: string) => {
    const existingProduct = formData.selectedProducts.find(item => item.productId === productId);
    if (existingProduct) return;
    
    // 获取产品的原始价格
    const product = products.find(p => p.id === productId);
    const unitPrice = product ? product.price : 0;
    
    setFormData(prev => ({
      ...prev,
      selectedProducts: [...prev.selectedProducts, { productId, quantity: 1, unitPrice }]
    }));
  };

  // 更新产品数量
  const updateProductQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    
    setFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.map(item => 
        item.productId === productId ? { ...item, quantity } : item
      )
    }));
  };

  // 更新产品单价
  const updateProductPrice = (productId: string, price: number) => {
    if (price < 0) return;
    
    setFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.map(item => 
        item.productId === productId ? { ...item, unitPrice: price } : item
      )
    }));
  };

  // 从订单中移除产品
  const removeProductFromOrder = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.filter(item => item.productId !== productId)
    }));
  };

  // 创建订单
  const createOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!formData.customerId || formData.selectedProducts.length === 0 || !formData.deliveryDate) {toast.error('请填写完整的订单信息');
      return;
    }

    try {
      // 查找客户信息
      const selectedCustomer = customers.find(customer => customer.id === formData.customerId);
      if (!selectedCustomer) {
        toast.error('客户信息不存在');
        return;
      }
      
      // 构建订单项
      const orderItems: OrderItem[] = formData.selectedProducts.map(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) throw new Error('产品信息不存在');
        
        // 检查是否自定义了价格
        const hasCustomPrice = item.unitPrice !== undefined && item.unitPrice !== product.price;
        
        return {
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice || product.price,
          ...(hasCustomPrice && { originalPrice: product.price })
        };
      });
      
      // 计算总金额
      const totalAmount = orderItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      
      // 生成按时间的订单编号
      const generateOrderId = () => {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // 2025-11-15
        const timeStr = now.getTime().toString().slice(-4); // 后四位时间戳，确保唯一性
        return `${dateStr}-${timeStr}`;
      };
      
  // 创建新订单 - 添加备注字段和业务员字段
  const newOrder: Order = {
    id: generateOrderId(),
    customerId: selectedCustomer.id,
    customerName: selectedCustomer.name,
    customerAddress: formData.customerAddress || selectedCustomer.address,
    products: orderItems,
    totalAmount,
    deliveryDate: formData.deliveryDate,
    status: 'pending',
    createdBy: userName,
    salespersonId: formData.salespersonId,
    salespersonName: formData.salespersonId 
      ? salespersons.find(s => s.id === formData.salespersonId)?.name || '' 
      : '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: formData.notes || '' // 保存备注
  };
      
      // 保存到本地存储
      const updatedOrders = [...orders, newOrder];
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
      setOrders(updatedOrders);
      
    // 通知管理员有新订单
    if (userRole === 'salesperson') {
      // 尝试发送微信通知给管理员
      try {
        await api.notifications.notifyNewOrder(newOrder);
      } catch (error) {
        console.error('发送通知失败:', error);
      }
      toast.success('订单创建成功，等待管理员审核');
    } else {
      toast.success('订单创建成功');
    }
      
      closeModal();
    } catch (error) {
      toast.error('创建订单失败');
      console.error('创建订单失败:', error);
    }
  };

  // 更新订单状态
  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    try {
      const updatedOrders = orders.map(order =>order.id === orderId 
          ? { ...order, status: newStatus, updatedAt: new Date().toISOString() } 
          : order
      );
      
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
      setOrders(updatedOrders);
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus, updatedAt: new Date().toISOString() });
      }
      
      toast.success('订单状态已更新');
    } catch (error) {
      toast.error('更新订单状态失败');
      console.error('更新订单状态失败:', error);
    }
  };

  // 删除订单（需要密码确认）
  const deleteOrder = () => {
    if (!orderToDelete) return;

    // 检查密码（在实际应用中应该从后端验证）
    // 这里为了演示，我们假设默认管理员密码是 'password'
    if (deletePassword !== 'password') {
      toast.error('密码错误，无法删除订单');
      return;
    }

    try {
      const updatedOrders = orders.filter(order => order.id !== orderToDelete);
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
      setOrders(updatedOrders);
      closeModal();
      toast.success('订单已删除');
    } catch (error) {
      toast.error('删除订单失败');
      console.error('删除订单失败:', error);
    }
  };

  // 导出订单为Excel - 包含备注信息
  const exportToExcel = (filteredOrders?: Order[]) => {
    // 这里简化实现，实际项目中可以使用更复杂的Excel导出库
    try {
      let csvContent = "订单编号,客户名称,客户地址,总金额,发货日期,状态,创建时间,创建人,备注\n";
      
      // 如果有传入筛选后的订单，则使用筛选后的订单，否则使用全部订单
      const ordersToExport = filteredOrders || orders;
      
      ordersToExport.forEach(order => {
        const row = [
          order.id,
          `"${order.customerName}"`,
          `"${order.customerAddress}"`,
          order.totalAmount,
          order.deliveryDate,
          getStatusText(order.status),
          new Date(order.createdAt).toLocaleString(),
          order.createdBy,
          `"${order.notes || ''}"` // 添加备注字段
        ].join(',');
        
        csvContent += row + "\n";
      });
      
      // 创建Blob对象
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // 设置下载属性
      let filename = '订单数据';
      if (filteredOrders && filteredOrders.length > 0) {
        // 如果是筛选后的订单，添加特定标识
        if (searchType === 'salesperson' && searchValue) {
          filename += `_${searchValue}`;
        } else if (searchType === 'customer' && searchValue) {
          filename += `_${searchValue}`;
        } else if (searchType === 'note' && searchValue) {
          filename += `_备注_${searchValue}`;
        } else if (dateRange.startDate && dateRange.endDate) {
          filename += `_${dateRange.startDate}_to_${dateRange.endDate}`;
        }
      }
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toLocaleDateString()}.csv`);
      link.style.visibility = 'hidden';
      
      // 添加到文档并触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('订单数据已导出');
    } catch (error) {
      toast.error('导出订单失败');
      console.error('导出订单失败:', error);
    }
  };

  // 获取状态文本
  const getStatusText = (status: OrderStatus): string => {
    const statusMap: Record<OrderStatus, string> = {
      pending: '待审核',
      approved: '已批准',
      shipped: '已发货',
      delivered: '已送达',
      cancelled: '已取消'
    };
    return statusMap[status];
  };

  // 获取状态样式
  const getStatusStyle = (status: OrderStatus): string => {
    const statusStyles: Record<OrderStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      shipped: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      delivered: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return statusStyles[status];
  };

  // 格式化价格
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // 获取选中客户的地址
  const getSelectedCustomerAddress = () => {
    const selectedCustomer = customers.find(customer => customer.id === formData.customerId);
    return selectedCustomer ? selectedCustomer.address : '';
  };

  // 计算订单小计
  const calculateOrderSubtotal = () => {
    return formData.selectedProducts.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
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
          订单管理
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
           {/* 视图切换按钮 */}
          <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewType('all')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewType === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              全部订单
            </button>
            <button
              onClick={() => setViewType('pending')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewType === 'pending' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              待处理
            </button>
            <button
              onClick={() => setViewType('processed')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewType === 'processed' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              已处理
            </button>
            <button
              onClick={() => setViewType('pre')}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                viewType === 'pre' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-s-slate-300'
              }`}
            >
              预下单
              {/* 计算预下单数量 */}
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const preOrdersCount = orders.filter(order => 
                  new Date(order.deliveryDate) >= today && 
                  ['pending', 'approved'].includes(order.status)
                ).length;
                return preOrdersCount > 0 ? (
                  <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">
                    {preOrdersCount}
                  </span>
                ) : null;
              })()}
            </button>
          </div>
          
          {userRole === 'admin' && (
            <button
              onClick={() => exportToExcel()}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <i className="fa-solid fa-file-export mr-2"></i>
              导出订单
            </button>
          )}
          
          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            <i className="fa-solid fa-plus mr-2"></i>
            创建订单
          </button>
        </div>
      </div>
      
      {/* 搜索栏 - 优化移动端布局 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-4">
        {/* 桌面版搜索和筛选 */}
        <div className="hidden md:block">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden flex-grow">
              <button
                onClick={() => setSearchType('salesperson')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  searchType === 'salesperson' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                业务员
              </button>
              <button
                onClick={() => setSearchType('customer')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  searchType === 'customer' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                客户
              </button>
              <button
                onClick={() => setSearchType('note')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  searchType === 'note' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                备注
              </button>
            </div>
            
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <i className="fa-solid fa-search"></i>
              </span>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={`搜索${searchType === 'salesperson' ? '业务员' : searchType === 'customer' ? '客户' : '备注'}订单`}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
              />
            </div>
            
            {searchValue && (
              <button
                onClick={() => setSearchValue('')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors flex items-center justify-center"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            )}
          </div>
          
          {/* 日期范围筛选 */}
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <i className="fa-solid fa-calendar-alt"></i>
              </span>
              <input
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                placeholder="开始日期"
              />
            </div>
            
            <div className="flex items-center justify-center text-slate-500 px-2">
              至
            </div>
            
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <i className="fa-solid fa-calendar-alt"></i>
              </span>
              <input
                type="date"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                placeholder="结束日期"
              />
            </div>
            
            <button
              onClick={applyDateFilter}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center whitespace-nowrap"
            >
              <i className="fa-solid fa-filter mr-1"></i>
              应用筛选
            </button>
            
            {(dateRange.startDate || dateRange.endDate) && (
              <button
                onClick={resetDateFilter}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors flex items-center justify-center"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            )}
          </div>
          
          {/* 搜索结果统计 */}
          {(searchValue || dateRange.startDate || dateRange.endDate) && (
            <div className="mt-3 text-sm text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>找到 {filteredOrders.length} 条订单记录</span>
              
              {filteredOrders.length > 0 && (
                <button
                  onClick={() => exportToExcel(filteredOrders)}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center text-sm"
                >
                  <i className="fa-solid fa-file-export mr-1"></i>
                  导出当前筛选结果
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* 移动端搜索类型选择 */}
        <div className="md:hidden grid grid-cols-3 gap-2">
          <button
            onClick={() => setSearchType('salesperson')}
            className={`py-2.5 px-3 text-sm font-medium rounded-lg transition-colors ${
              searchType === 'salesperson' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
            }`}
          >
            业务员
          </button>
          <button
            onClick={() => setSearchType('customer')}
            className={`py-2.5 px-3 text-sm font-medium rounded-lg transition-colors ${
              searchType === 'customer' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
            }`}
          >
            客户
          </button>
          <button
            onClick={() => setSearchType('note')}
            className={`py-2.5 px-3 text-sm font-medium rounded-lg transition-colors ${
              searchType === 'note' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
            }`}
          >
            备注
          </button>
        </div>
        
        {/* 移动端搜索框 */}
        <div className="relative mt-3 md:hidden">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <i className="fa-solid fa-search"></i>
          </span>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={`搜索${searchType === 'salesperson' ? '业务员' : searchType === 'customer' ? '客户' : '备注'}订单`}
            className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
          />
          {searchValue && (
            <button
              onClick={() => setSearchValue('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400"
            >
              <i className="fa-solid fa-times"></i>
            </button>
          )}
        </div>
        
        {/* 移动端日期筛选（简化版） */}
        <div className="mt-3 md:hidden">
          <button
            onClick={() => {
              // 简化的日期选择逻辑
              const today = new Date();
              const lastWeek = new Date();
              lastWeek.setDate(today.getDate() - 7);
              
              setDateRange({
                startDate: lastWeek.toISOString().split('T')[0],
                endDate: today.toISOString().split('T')[0]
              });
              
              // 立即应用筛选
              setTimeout(() => {
                filterOrders();
              }, 100);
              
              toast.info('已筛选最近7天的订单');
            }}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
          >
            <i className="fa-solid fa-calendar-alt mr-2"></i>
            筛选最近7天订单
          </button>
          
          {(dateRange.startDate || dateRange.endDate) && (
            <button
              onClick={resetDateFilter}
              className="w-full mt-2 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors flex items-center justify-center"
            >
              <i className="fa-solid fa-times mr-1"></i>
              清除筛选
            </button>
          )}
        </div>
        
        {/* 移动端搜索结果统计 */}
        <div className="mt-3 text-sm text-slate-500 dark:text-slate-400 text-center md:hidden">
          找到 {filteredOrders.length} 条订单记录
        </div>
        
        {/* 移动端导出按钮 */}
        {(filteredOrders.length > 0 && userRole === 'admin') && (
          <button
            onClick={() => exportToExcel(filteredOrders)}
            className="w-full mt-3 py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center md:hidden"
          >
            <i className="fa-solid fa-file-export mr-2"></i>
            导出当前订单
          </button>
        )}
      </div>
      
      {/* 订单列表 */}
      {filteredOrders.length > 0 ? (
        <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <table className="w-full">
               <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    订单编号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    客户名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    金额
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    发货日期
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    业务员
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    备注
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredOrders.map((order) => (
                <motion.tr 
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-white">
                    {order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                    {order.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                    {formatPrice(order.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                    {order.deliveryDate}
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                      {order.salespersonName || '未分配'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 max-w-xs truncate relative group">
                      {order.notes || '无'}
                      {/* 鼠标悬停时显示完整备注 */}
                      {order.notes && (
                        <div className="absolute bottom-full left-0 mb-2 w-80 bg-slate-800 text-white p-2 rounded-lg text-xs whitespace-pre-wrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          {order.notes}
                        </div>
                      )}
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openDetailModal(order)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        aria-label="查看详情"
                      >
                        <i className="fa-solid fa-eye"></i>
                      </button>
                      
                      {(userRole === 'admin' || order.createdBy === userName) && (
                        <button
                          onClick={() => openNotesModal(order)}
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                          aria-label="编辑备注"
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                      )}
                      
                      {userRole === 'admin' && (
                        <>
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                            className="text-xs border border-slate-300 dark:border-slate-600 rounded-md p-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                          >
                            <option value="pending">待审核</option>
                            <option value="approved">已批准</option>
                            <option value="shipped">已发货</option>
                            <option value="delivered">已送达</option>
                            <option value="cancelled">已取消</option>
                          </select>
                          
                          <button
                            onClick={() => openDeleteModal(order.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                            aria-label="删除订单"
                          >
                            <i className="fa-solid fa-trash-alt"></i>
                          </button>
                        </>
                      )}
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
            <i className="fa-solid fa-file-invoice text-2xl text-slate-400 dark:text-slate-500"></i>
          </div>
          <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">暂无订单</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            {searchValue 
              ? `没有找到与"${searchValue}"相关的订单`
              : (userRole === 'admin' ? '暂无订单数据，请等待业务员创建订单' : '您还没有创建任何订单')
            }
          </p>
          
          {!searchValue && (
            <button
              onClick={openCreateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center"
            >
              <i className="fa-solid fa-plus mr-2"></i>
              创建订单
            </button>
          )}
        </div>
      )}
      
      {/* 创建订单模态框 */}
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
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">创建订单</h2>
            </div>
            
             <form onSubmit={createOrder} className="p-6 space-y-4">
               {/* 客户选择 */}
               <div>
                 <label htmlFor="customerId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                   选择客户 <span className="text-red-500">*</span>
                 </label>
                 <select
                   id="customerId"
                   name="customerId"
                   value={formData.customerId}
                   onChange={handleFormChange}
                   className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                   required
                 >
                   <option value="">请选择客户</option>
                   {customers.map(customer => (
                     <option key={customer.id} value={customer.id}>
                       {customer.name}
                     </option>
                   ))}
                 </select>
               </div>
               
               {/* 产品分类选择 */}
               {tags.length > 0 && (
                 <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                     选择产品系列分类
                   </label>
                   <div className="flex flex-wrap gap-2">
                     <button
                       type="button"
                       onClick={() => setSelectedTag(null)}
                       className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                         selectedTag === null 
                           ? 'bg-blue-600 text-white' 
                           : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                       }`}
                     >
                       全部产品
                     </button>
                     {tags.map(tag => (
                       <button
                         key={tag.id}
                         type="button"
                         onClick={() => setSelectedTag(tag.id)}
                         className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                           selectedTag === tag.id 
                             ? 'bg-blue-600 text-white' 
                             : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                         }`}
                       >
                         {tag.name}
                       </button>
                     ))}
                   </div>
                 </div>
               )}
              
               {/* 客户地址（自动填充但可编辑） */}
              {formData.customerId && (
                <div>
                  <label htmlFor="customerAddress" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    收货地址
                  </label>
                  <textarea
                    id="customerAddress"
                    name="customerAddress"
                    value={formData.customerAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
                    placeholder="请输入收货地址"
                    rows={2}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none resize-none"
                    required
                  />
                </div>
              )}
              
              {/* 产品选择 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  添加产品 <span className="text-red-500">*</span>
                </label>
                
                 {/* 可选产品列表 */}
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                   {/* 根据选中的标签过滤产品 */}
                   {products
                     .filter(product => !selectedTag || (!product.tags || product.tags.includes(selectedTag)))
                     .map(product => (
                     <button
                       key={product.id}
                       type="button"
                       onClick={() => addProductToOrder(product.id)}
                       disabled={formData.selectedProducts.some(item => item.productId === product.id)}
                       className={`p-2 border rounded-lg text-left transition-all ${
                         formData.selectedProducts.some(item => item.productId === product.id)
                           ? 'border-blue-300 bg-blue-50 dark:border-blue-900 dark:bg-blue-900/20 cursor-not-allowed'
                           : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:hover:border-blue-900 dark:hover:bg-blue-900/20'
                       }`}
                     >
                       <div className="text-xs text-slate-700 dark:text-slate-300">{product.name}</div>
                       <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">{formatPrice(product.price)}</div>
                     </button>
                   ))}
                </div>
                
                {/* 已选产品列表 */}
                {formData.selectedProducts.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">已选产品</h4>
                    <div className="space-y-2">
                      {formData.selectedProducts.map(item => {
                        const product = products.find(p => p.id === item.productId);
                        if (!product) return null;
                        
                        return (
                            <div key={item.productId} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                            <div className="flex flex-col">
                              <div className="text-sm text-slate-700 dark:text-slate-300">{product.name}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">原始价格: {formatPrice(product.price)}</div>
                            </div>
                            <div className="flex items-center space-x-3">
                              {/* 数量控制 */}
                              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden mr-2">
                                <button
                                  type="button"
                                  onClick={() => updateProductQuantity(item.productId, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  className="px-2 py-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-50"
                                >
                                  <i className="fa-solid fa-minus text-xs"></i>
                                </button>
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateProductQuantity(item.productId, parseInt(e.target.value) || 1)}
                                  min="1"
                                  className="w-10 text-center border-x border-slate-200 dark:border-slate-700 bg-transparent text-sm text-slate-700 dark:text-slate-300"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateProductQuantity(item.productId, item.quantity + 1)}
                                  className="px-2 py-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                >
                                  <i className="fa-solid fa-plus text-xs"></i>
                                </button>
                              </div>
                              
                              {/* 自定义价格输入 */}
                              <div className="flex items-center">
                                <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">单价:</span>
                                <input
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={(e) => updateProductPrice(item.productId, parseFloat(e.target.value) || 0)}
                                  min="0"
                                  step="0.01"
                                  className="w-20 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-md text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800"
                                />
                              </div>
                              
                              {/* 删除按钮 */}
                              <button
                                type="button"
                                onClick={() => removeProductFromOrder(item.productId)}
                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-2"
                              >
                                <i className="fa-solid fa-times"></i>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* 订单小计 */}
                      <div className="flex justify-between py-2 font-medium">
                        <div className="text-slate-700 dark:text-slate-300">小计</div>
                        <div className="text-blue-600 dark:text-blue-400">{formatPrice(calculateOrderSubtotal())}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 发货日期 */}
              <div>
                <label htmlFor="deliveryDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  发货日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="deliveryDate"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleFormChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>
              
               {/* 订单备注 */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  订单备注
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  placeholder="请输入订单备注信息（选填）..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none resize-none"
                />
              </div>
              
              {/* 选择业务员（仅管理员可见） */}
              {userRole === 'admin' && salespersons.length > 0 && (
                <div>
                  <label htmlFor="salespersonId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    所属业务员（可选）
                  </label>
                  <select
                    id="salespersonId"
                    name="salespersonId"
                    value={formData.salespersonId}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                  >
                    <option value="">请选择业务员</option>
                    {salespersons.map(salesperson => (
                      <option key={salesperson.id} value={salesperson.id}>
                        {salesperson.name} ({salesperson.username})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
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
                  创建订单
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      
      {/* 订单详情模态框 */}
      {showDetailModal && selectedOrder && (
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
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">订单详情</h2>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusStyle(selectedOrder.status)}`}>
                {getStatusText(selectedOrder.status)}
              </span>
            </div>
            
            <div className="p-6 space-y-6">
              {/* 订单基本信息 */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">订单信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-500">订单编号</p>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{selectedOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-500">创建时间</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-500">发货日期</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{selectedOrder.deliveryDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-500">创建人</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{selectedOrder.createdBy}</p>
                  </div>
                </div>
              </div>
              
              {/* 客户信息 */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">客户信息</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-500">客户名称</p>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-500">客户地址</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{selectedOrder.customerAddress}</p>
                  </div>
                </div>
              </div>
              
              {/* 产品列表 */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">产品明细</h3>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <div className="space-y-3">
                    {selectedOrder.products.map((item, index) => (
                          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                           <div>
                             <div className="text-sm text-slate-700 dark:text-slate-300">{item.productName}</div>
                             {item.originalPrice && item.originalPrice !== item.unitPrice && (
                               <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                                 自定义价格（原价: {formatPrice(item.originalPrice)}）
                               </div>
                             )}
                           </div>
                           <div className="flex items-center space-x-8">
                             <div className="text-sm text-slate-700 dark:text-slate-300">{item.quantity} x {formatPrice(item.unitPrice)}</div>
                             <div className="text-sm font-medium text-slate-800 dark:text-white">{formatPrice(item.quantity * item.unitPrice)}</div>
                           </div>
                         </div>
                    ))}
                    
                    {/* 订单总计 */}
                    <div className="flex justify-between py-2 font-medium">
                      <div className="text-slate-700 dark:text-slate-300">总计</div>
                      <div className="text-xl text-blue-600 dark:text-blue-400">{formatPrice(selectedOrder.totalAmount)}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 订单备注 */}
              {(userRole === 'admin' || selectedOrder.createdBy === userName) && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">订单备注</h3>
                    <button
                      onClick={() => openNotesModal(selectedOrder)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors text-sm flex items-center"
                    >
                      <i className="fa-solid fa-pen-to-square mr-1"></i>
                      编辑备注
                    </button>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 min-h-[100px]">
                    {selectedOrder.notes || (
                      <div className="text-slate-400 dark:text-slate-500 italic">暂无备注</div>
                    )}
                    {selectedOrder.notes && (
                      <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                        {selectedOrder.notes}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
               {/* 订单操作 */}
              {userRole === 'admin' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">更新状态</h3>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-slate-700 dark:text-slate-300">状态:</span>
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value as OrderStatus)}
                        className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                      >
                        <option value="pending">待审核</option>
                        <option value="approved">已批准</option>
                        <option value="shipped">已发货</option>
                        <option value="delivered">已送达</option>
                        <option value="cancelled">已取消</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* 分配业务员 */}
                  {salespersons.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">分配业务员</h3>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-slate-700 dark:text-slate-300">业务员:</span>
                        <select
                          value={selectedOrder.salespersonId || ''}
                          onChange={(e) => {
                            const salesperson = salespersons.find(s => s.id === e.target.value);
                            const updatedOrders = orders.map(order => 
                              order.id === selectedOrder.id 
                                ? { 
                                    ...order, 
                                    salespersonId: e.target.value || undefined, 
                                    salespersonName: salesperson?.name || undefined,
                                    updatedAt: new Date().toISOString() 
                                  } 
                                : order
                            );
                            localStorage.setItem('orders', JSON.stringify(updatedOrders));
                            setOrders(updatedOrders);
                            setSelectedOrder({
                              ...selectedOrder,
                              salespersonId: e.target.value || undefined,
                              salespersonName: salesperson?.name || undefined
                            });
                          }}
                          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                        >
                          <option value="">未分配</option>
                          {salespersons.map(salesperson => (
                            <option key={salesperson.id} value={salesperson.id}>
                              {salesperson.name} ({salesperson.username})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-center">
              <button
                onClick={closeModal}
                className="py-2.5 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
              >
                关闭
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      
      {/* 备注编辑模态框 */}
      {showNotesModal && selectedOrder && (
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
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">编辑订单备注</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">订单编号: {selectedOrder.id}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="notesContent" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  备注内容
                </label>
                <textarea
                  id="notesContent"
                  value={notesContent}
                  onChange={(e) => setNotesContent(e.target.value)}
                  placeholder="请输入订单备注信息..."
                  rows={8}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none resize-none"
                />
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
                  onClick={saveOrderNotes}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  保存备注
                </button>
              </div>
            </div>
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
                您确定要删除此订单吗？此操作不可撤销。
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
                  为防止误操作，删除订单需要管理员密码确认
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
                  onClick={deleteOrder}
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
}

export default Orders;