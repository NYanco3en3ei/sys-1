import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTheme } from '@/hooks/useTheme';

// 订单状态类型
type OrderStatus = 'pending' | 'approved' | 'shipped' | 'delivered' | 'cancelled';

// 订单数据类型
interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  products: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }[];
  totalAmount: number;
  deliveryDate: string;
  status: OrderStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 图表颜色
const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard = () => {
  const { userRole, userName } = useContext(AuthContext);
  const { isDark } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载订单数据
  useEffect(() => {
    const loadOrders = () => {
      setLoading(true);
      try {
        const storedOrders = localStorage.getItem('orders');
        if (storedOrders) {
          const parsedOrders: Order[] = JSON.parse(storedOrders);
          
          // 根据用户角色筛选订单
          let filteredOrders = parsedOrders;
          if (userRole === 'salesperson') {
            filteredOrders = parsedOrders.filter(order => order.createdBy === userName);
          }
          
          setOrders(filteredOrders);
          
          // 处理销售数据统计
          processSalesData(filteredOrders);
          
          // 处理订单状态统计
          processStatusData(filteredOrders);
        }
      } catch (error) {
        console.error('加载订单数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadOrders();
  }, [userRole, userName]);

  // 处理销售数据
  const processSalesData = (orders: Order[]) => {
    // 按月份统计销售额
    const monthlySales: Record<string, number> = {};
    
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlySales[monthKey]) {
        monthlySales[monthKey] += order.totalAmount;
      } else {
        monthlySales[monthKey] = order.totalAmount;
      }
    });
    
    // 转换为图表数据格式
    const chartData = Object.entries(monthlySales).map(([month, sales]) => ({
      month,
      sales: Math.round(sales / 100) * 100 // 简化数值显示
    }));
    
    setSalesData(chartData);
  };

  // 处理订单状态数据
  const processStatusData = (orders: Order[]) => {
    // 统计各状态订单数量
    const statusCount: Record<OrderStatus, number> = {
      pending: 0,
      approved: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };
    
    orders.forEach(order => {
      statusCount[order.status]++;
    });
    
    // 转换为图表数据格式
    const chartData = Object.entries(statusCount)
      .map(([status, count], index) => ({
        name: getStatusText(status as OrderStatus),
        value: count,
        color: CHART_COLORS[index % CHART_COLORS.length]
      }))
      .filter(item => item.value > 0);
    
    setStatusData(chartData);
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

  // 计算关键指标
  const totalOrders = orders.length;
  const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const recentOrders = [...orders].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);

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
          仪表盘
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          欢迎回来, {userName} ({userRole === 'admin' ? '管理员' : '业务员'})
        </p>
      </div>
      
      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-100 dark:border-slate-700 transition-transform hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">总订单数</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{totalOrders}</h3>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
              <i className="fa-solid fa-file-invoice text-blue-600 dark:text-blue-400 text-xl"></i>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-100 dark:border-slate-700 transition-transform hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">总销售额</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">¥{totalSales.toLocaleString()}</h3>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
              <i className="fa-solid fa-coins text-green-600 dark:text-green-400 text-xl"></i>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-100 dark:border-slate-700 transition-transform hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">待处理订单</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{pendingOrders}</h3>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg">
              <i className="fa-solid fa-clock text-yellow-600 dark:text-yellow-400 text-xl"></i>
            </div>
          </div>
        </div>
      </div>
      
      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 销售额趋势图 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">销售额趋势</h2>
          <div className="h-80">
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
                  <XAxis dataKey="month" stroke={isDark ? "#9ca3af" : "#6b7280"} />
                  <YAxis stroke={isDark ? "#9ca3af" : "#6b7280"} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? "#1f2937" : "#ffffff",
                      border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                      borderRadius: "0.5rem",
                      color: isDark ? "#ffffff" : "#000000"
                    }}
                    formatter={(value) => [`¥${value}`, '销售额']}
                  />
                  <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                暂无销售数据
              </div>
            )}
          </div>
        </div>
        
        {/* 订单状态分布图 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">订单状态分布</h2>
          <div className="h-80">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? "#1f2937" : "#ffffff",
                      border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                      borderRadius: "0.5rem",
                      color: isDark ? "#ffffff" : "#000000"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                暂无订单数据
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 最近订单表格 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">最近订单</h2>
        </div>
        
        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
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
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    创建时间
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-white">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                      {order.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                      ¥{order.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            暂无订单记录
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;