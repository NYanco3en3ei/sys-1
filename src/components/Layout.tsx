import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { isAuthenticated, userRole, userName, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  // 如果未认证，重定向到登录页
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }
  
  // 导航链接配置
  const navLinks = [
    {
      path: '/',
      label: '仪表盘',
      icon: 'fa-chart-line',
      showFor: ['admin', 'salesperson']
    },
    {
      path: '/products',
      label: '产品管理',
      icon: 'fa-box',
      showFor: ['admin', 'salesperson']
    },
    {
      path: '/orders',
      label: '订单管理',
      icon: 'fa-file-invoice',
      showFor: ['admin', 'salesperson']
    },
    {
      path: '/customers',
      label: '客户管理',
      icon: 'fa-users',
      showFor: ['admin']
    },
    {
      path: '/salespersons',
      label: '业务员管理',
      icon: 'fa-user-tie',
      showFor: ['admin']
    },
    {
      path: '/admin-settings',
      label: '管理员设置',
      icon: 'fa-cog',
      showFor: ['admin']
    }
  ];
  
  // 过滤显示的导航链接
  const visibleLinks = navLinks.filter(link => 
    link.showFor.includes(userRole || 'salesperson')
  );
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col">
      {/* 顶部导航栏 */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* 左侧Logo和标题 */}
                <div className="flex items-center">
                  <div className="flex-shrink-0 flex items-center">
                    <i className="fa-solid fa-clipboard-list text-blue-600 dark:text-blue-400 text-2xl mr-2"></i>
                    <div className="flex flex-col">
                      <span className="font-bold text-lg">销售订单管理系统</span>
                      <span className="text-xs text-blue-500 dark:text-blue-400">NYanco3en3ei</span>
                    </div>
                  </div>
                </div>
            
            {/* 右侧操作区 */}
            <div className="flex items-center space-x-4">
              {/* 主题切换 */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                aria-label={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
              >
                {theme === 'light' ? (
                  <i className="fa-solid fa-moon text-slate-700 dark:text-slate-300"></i>
                ) : (
                  <i className="fa-solid fa-sun text-yellow-500"></i>
                )}
              </button>
              
              {/* 用户信息 */}
              <div className="relative group">
                <button className="flex items-center space-x-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <i className="fa-solid fa-user"></i>
                  </div>
                  <span className="text-sm font-medium hidden md:inline-block">
                    {userName}
                  </span>
                  <i className="fa-solid fa-chevron-down text-xs text-slate-500 dark:text-slate-400"></i>
                </button>
                
                {/* 下拉菜单 */}
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    {userRole === 'admin' ? '管理员' : '业务员'}
                  </div>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <i className="fa-solid fa-sign-out-alt mr-2"></i>
                    退出登录
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
        {/* 主体内容区 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 侧边导航栏 - 桌面版 */}
          <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shadow-sm p-4">
            <nav className="flex-1 space-y-1">
              {visibleLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) => cn(
                    "flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  )}
                >
                  <i className={`fa-solid ${link.icon} w-5 h-5 mr-3`}></i>
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </aside>
          
           {/* 移动端导航按钮 */}
           <div className="md:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
             <div className="flex bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 px-1 py-1">
               {visibleLinks.map((link) => (
                 <NavLink
                   key={link.path}
                   to={link.path}
                   className={({ isActive }) => cn(
                     "flex flex-col items-center justify-center px-3 py-2 rounded-full text-sm transition-colors",
                     isActive
                       ? "text-blue-600 dark:text-blue-400"
                       : "text-slate-700 dark:text-slate-300"
                   )}
                 >
                   <i className={`fa-solid ${link.icon} w-5 h-5 mb-0.5`}></i>
                   <span className="text-xs">{link.label}</span>
                 </NavLink>
               ))}
             </div>
           </div>
           
           {/* 移动端搜索框 */}
           {location.pathname === '/orders' && (
             <div className="md:hidden sticky top-16 bg-white dark:bg-slate-800 z-30 p-3 border-b border-slate-200 dark:border-slate-700">
               <div className="relative">
                 <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                   <i className="fa-solid fa-search"></i>
                 </span>
                 <input
                   type="text"
                   placeholder="搜索订单..."
                   className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                 />
               </div>
             </div>
           )}
          
          {/* 主要内容区域 */}
          <main className="flex-1 overflow-auto p-4 pb-20 md:pb-4">
            {children}
          </main>
        </div>
        
        {/* 后端服务连接状态指示器 */}
        <div className="hidden md:flex items-center justify-center py-2 bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
          <i className={`fa-solid ${process.env.NODE_ENV === 'production' ? 'fa-server' : 'fa-laptop-code'} mr-1`}></i>
          {process.env.NODE_ENV === 'production' 
            ? '已连接到在线服务器' 
            : '开发模式 - 使用本地存储数据'
          }
        </div>
    </div>
  );
};

export default Layout;