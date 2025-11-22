import { toast } from 'sonner';

// 后端API基础URL - 请替换为您的实际后端Vercel地址
// 重要：部署前必须修改为您的后端Vercel项目地址
// 示例：const API_BASE_URL = 'https://your-backend-project.vercel.app/api';
// 可以从环境变量中读取，或直接在这里硬编码
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// 请求包装器，处理错误和认证
const apiRequest = async (endpoint: string, options: globalThis.RequestInit = {}) => {
  // 从localStorage获取token
  const authData = localStorage.getItem('auth');
  const token = authData ? JSON.parse(authData).token : null;
  
  // 显示连接状态提示（仅在首次请求时）
  if (!localStorage.getItem('apiConnectionChecked')) {
    localStorage.setItem('apiConnectionChecked', 'true');
    if (API_BASE_URL === 'https://your-backend-api.vercel.app/api') {
      toast.warning('注意：API地址尚未配置，将使用本地存储数据。请在部署前设置正确的后端地址。');
    }
  }
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
  
  try {
    // 检查是否使用了默认的API地址
    if (API_BASE_URL === 'https://your-backend-api.vercel.app/api') {
      console.warn('使用默认API地址，可能无法正常连接到后端服务。请在src/lib/api.ts中配置正确的API地址。');
      return null; // 直接触发本地存储数据加载
    }
    
    // 确保API请求路径正确
    const url = API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint;
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      console.error(`API请求失败: ${response.status} ${response.statusText}`);
      toast.error(`API请求失败: ${response.statusText}`);
      
      // 开发环境下，可以选择回退到本地存储
      if (process.env.NODE_ENV !== 'production') {
        console.warn('回退到本地存储数据');
        return null;
      }
      
      throw new Error(`API请求失败: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('API连接错误:', error);
    toast.error('无法连接到服务器，请检查网络连接或API配置');
    
    // 开发环境下，可以选择回退到本地存储
    if (process.env.NODE_ENV !== 'production') {
      console.warn('回退到本地存储数据');
      return null;
    }
    
    throw error;
  }
};

// 认证相关API
export const authAPI = {
  login: async (username: string, password: string) => {
    try {
      // 尝试使用API进行登录
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      
      // 如果API请求成功并返回数据
      if (response && response.success) {
        // 保存token到localStorage
        const authData = {
          ...response.user,
          token: response.token
        };
        localStorage.setItem('auth', JSON.stringify(authData));
        return response;
      }
      
      // API返回null表示使用本地存储（开发环境或API不可用）
      if (response === null) {
        console.log('使用本地存储进行身份验证（API不可用或开发环境）');
        
        // 简单的模拟验证逻辑 - 增强版
        let userData = null;
        
        // 1. 检查是否是默认管理员账户
        if (username === 'admin' && password === 'password') {
          userData = {
            id: 'admin_1',
            username,
            name: '管理员',
            role: 'admin',
            status: 'approved'
          };
          console.log('使用默认管理员账户登录');
        } 
        // 2. 检查是否是localStorage中保存的业务员账号
        else {
          // 从localStorage获取业务员账号信息
          const salespersonsData = localStorage.getItem('salespersons');
          if (salespersonsData) {
            const salespersons = JSON.parse(salespersonsData);
            const salesperson = salespersons.find((s: any) => s.username === username && s.password === password);
            if (salesperson) {
              userData = {
                id: salesperson.id,
                username: salesperson.username,
                name: salesperson.name,
                role: 'salesperson',
                status: 'approved' // 模拟环境下默认已批准
              };
              console.log('使用localStorage中的业务员账户登录');
            }
          }
        }

        if (userData) {
          // 保存认证信息到本地存储
          localStorage.setItem('auth', JSON.stringify(userData));
          
          return {
            success: true,
            user: userData
          };
        }
        
        // 提供更详细的错误信息
        const errorMessage = process.env.NODE_ENV !== 'production' 
          ? '用户名或密码错误。提示：默认管理员账号为admin/password' 
          : '用户名或密码错误，请检查您的凭据';
          
        throw new Error(errorMessage);
      }
      
      // API返回了错误信息
      if (response && response.message) {
        throw new Error(response.message);
      }
      
      throw new Error('登录失败：无法连接到服务器或服务器返回未知错误');
    } catch (error: any) {
      console.error('登录失败:', error.message);
      
      // 提供更友好的错误提示
      const displayMessage = error.message.includes('用户名或密码') 
        ? error.message 
        : '登录失败：无法连接到服务器或凭据错误';
      
      toast.error(displayMessage);
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('auth');
    // 清除可能的临时认证信息
    localStorage.removeItem('temp_auth');
  },

  // 注册新用户
  register: async (username: string, password: string, name: string, role: string) => {
    try {
      // 尝试使用API进行注册
      const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password, name, role })
      });
      
      // 如果API请求成功并返回数据
      if (response && response.success) {
        return response;
      }
      
      // API返回null表示使用本地存储（开发环境或API不可用）
      if (response === null) {
        console.log('使用本地存储进行用户注册（API不可用或开发环境）');
        
        // 检查用户名是否已存在
        const salespersonsData = localStorage.getItem('salespersons');
        let salespersons = salespersonsData ? JSON.parse(salespersonsData) : [];
        
        // 检查是否有同名用户
        const usernameExists = salespersons.some((s: any) => s.username === username);
        if (usernameExists) {
          throw new Error('用户名已存在');
        }
        
        // 创建新用户
        const newUser = {
          id: Date.now().toString(),
          username,
          password, // 在实际环境中应该加密
          name,
          role,
          status: role === 'salesperson' ? 'pending' : 'approved',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // 保存到localStorage
        salespersons.push(newUser);
        localStorage.setItem('salespersons', JSON.stringify(salespersons));
        
        return {
          success: true,
          message: role === 'salesperson' ? '注册成功，等待管理员审核' : '注册成功',
          needsApproval: role === 'salesperson'
        };
      }
      
      // API返回了错误信息
      if (response && response.message) {
        throw new Error(response.message);
      }
      
      throw new Error('注册失败：无法连接到服务器或服务器返回未知错误');
    } catch (error: any) {
      console.error('注册失败:', error.message);
      toast.error(error.message || '注册失败');
      throw error;
    }
  }
};

// 产品相关API
export const productAPI = {
  getAll: async () => {
    try {
      // 尝试从API获取数据
      const response = await apiRequest('/products');
      
      // 如果API请求成功并返回数据，保存到本地存储并返回
      if (response && Array.isArray(response)) {
        localStorage.setItem('products', JSON.stringify(response));
        return response;
      }
      
      // API返回null表示使用本地存储数据
      const storedProducts = localStorage.getItem('products');
      return storedProducts ? JSON.parse(storedProducts) : [];
    } catch (error) {
      console.error('获取产品数据失败:', error);
      // 出错时从本地存储获取数据
      const storedProducts = localStorage.getItem('products');
      return storedProducts ? JSON.parse(storedProducts) : [];
    }
  },
  
  create: async (product: any) => {
    try {
      const response = await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify(product)
      });
      
      // 如果API调用成功，更新本地存储
      if (response) {
        // 重新获取最新的产品列表
        const allProducts = await productAPI.getAll();
        localStorage.setItem('products', JSON.stringify(allProducts));
        return response;
      }
      
      // 开发环境下的本地存储处理
      if (process.env.NODE_ENV !== 'production') {
        const storedProducts = localStorage.getItem('products');
        const products = storedProducts ? JSON.parse(storedProducts) : [];
        
        const newProduct = {
          ...product,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        
        products.push(newProduct);
        localStorage.setItem('products', JSON.stringify(products));
        return newProduct;
      }
      
      throw new Error('创建产品失败');
    } catch (error) {
      console.error('创建产品失败:', error);
      toast.error('创建产品失败，请稍后重试');
      throw error;
    }
  },
  
  update: async (id: string, product: any) => {
    try {
      const response = await apiRequest(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(product)
      });
      
      // 如果API调用成功，更新本地存储
      if (response) {
        // 重新获取最新的产品列表
        const allProducts = await productAPI.getAll();
        localStorage.setItem('products', JSON.stringify(allProducts));
        return response;
      }
      
      // 开发环境下的本地存储处理
      if (process.env.NODE_ENV !== 'production') {
        const storedProducts = localStorage.getItem('products');
        if (storedProducts) {
          const products = JSON.parse(storedProducts);
          const index = products.findIndex((p: any) => p.id === id);
          
          if (index !== -1) {
            products[index] = {
              ...products[index],
              ...product,
              updatedAt: new Date().toISOString()
            };
            
            localStorage.setItem('products', JSON.stringify(products));
            return products[index];
          }
        }
      }
      
      throw new Error('更新产品失败');
    } catch (error) {
      console.error('更新产品失败:', error);
      toast.error('更新产品失败，请稍后重试');
      throw error;
    }
  },
  
  delete: async (id: string) => {
    try {
      const response = await apiRequest(`/products/${id}`, {
        method: 'DELETE'
      });
      
      // 如果API调用成功，更新本地存储
      if (response) {
        // 重新获取最新的产品列表
        const allProducts = await productAPI.getAll();
        localStorage.setItem('products', JSON.stringify(allProducts));
        return response;
      }
      
      // 开发环境下的本地存储处理
      if (process.env.NODE_ENV !== 'production') {
        const storedProducts = localStorage.getItem('products');
        if (storedProducts) {
          const products = JSON.parse(storedProducts);
          const filteredProducts = products.filter((p: any) => p.id !== id);
          
          localStorage.setItem('products', JSON.stringify(filteredProducts));
          return { message: '删除成功' };
        }
      }
      
      throw new Error('删除产品失败');
    } catch (error) {
      console.error('删除产品失败:', error);
      toast.error('删除产品失败，请稍后重试');
      throw error;
    }
  },
  
  approve: async (id: string) => {
    try {
      const response = await apiRequest(`/products/${id}/approve`, {
        method: 'POST'
      });
      
      // 如果API调用成功，更新本地存储
      if (response) {
        // 重新获取最新的产品列表
        const allProducts = await productAPI.getAll();
        localStorage.setItem('products', JSON.stringify(allProducts));
        return response;
      }
      
      // 开发环境下的本地存储处理
      if (process.env.NODE_ENV !== 'production') {
        const storedProducts = localStorage.getItem('products');
        if (storedProducts) {
          const products = JSON.parse(storedProducts);
          const index = products.findIndex((p: any) => p.id === id);
          
          if (index !== -1) {
            products[index].isPendingApproval = false;
            products[index].updatedAt = new Date().toISOString();
            
            localStorage.setItem('products', JSON.stringify(products));
            return products[index];
          }
        }
      }
      
      throw new Error('审核产品失败');
    } catch (error) {
      console.error('审核产品失败:', error);
      toast.error('审核产品失败，请稍后重试');
      throw error;
    }
  }
};

// 订单相关API
export const orderAPI = {
  getAll: async () => {
    try {
      // 尝试从API获取数据
      const response = await apiRequest('/orders');
      
      // 如果API请求成功并返回数据，保存到本地存储并返回
      if (response && Array.isArray(response)) {
        localStorage.setItem('orders', JSON.stringify(response));
        return response;
      }
      
      // API返回null表示使用本地存储数据
      const storedOrders = localStorage.getItem('orders');
      return storedOrders ? JSON.parse(storedOrders) : [];
    } catch (error) {
      console.error('获取订单数据失败:', error);
      // 出错时从本地存储获取数据
      const storedOrders = localStorage.getItem('orders');
      return storedOrders ? JSON.parse(storedOrders) : [];
    }
  },
  
  getById: async (id: string) => {
    try {
      const response = await apiRequest(`/orders/${id}`);
      
      if (response) {
        return response;
      }
      
      // API返回null时，尝试从本地存储获取
      const storedOrders = localStorage.getItem('orders');
      if (storedOrders) {
        const orders = JSON.parse(storedOrders);
        return orders.find((order: any) => order.id === id) || null;
      }
      
      return null;
    } catch (error) {
      console.error('获取订单详情失败:', error);
      throw error;
    }
  },
  
  create: async (order: any) => {
    try {
      const response = await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify(order)
      });
      
      // 如果API调用成功，更新本地存储
      if (response) {
        // 重新获取最新的订单列表
        const allOrders = await orderAPI.getAll();
        localStorage.setItem('orders', JSON.stringify(allOrders));
        return response;
      }
      
      // 开发环境下的本地存储处理
      if (process.env.NODE_ENV !== 'production') {
        const storedOrders = localStorage.getItem('orders');
        const orders = storedOrders ? JSON.parse(storedOrders) : [];
        
        const newOrder = {
          ...order,
          id: Date.now().toString(),
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        orders.push(newOrder);
        localStorage.setItem('orders', JSON.stringify(orders));
        return newOrder;
      }
      
      throw new Error('创建订单失败');
    } catch (error) {
      console.error('创建订单失败:', error);
      toast.error('创建订单失败，请稍后重试');
      throw error;
    }
  },
  
  update: async (id: string, order: any) => {
    try {
      const response = await apiRequest(`/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(order)
      });
      
      // 如果API调用成功，更新本地存储
      if (response) {
        // 重新获取最新的订单列表
        const allOrders = await orderAPI.getAll();
        localStorage.setItem('orders', JSON.stringify(allOrders));
        return response;
      }
      
      // 开发环境下的本地存储处理
      if (process.env.NODE_ENV !== 'production') {
        const storedOrders = localStorage.getItem('orders');
        if (storedOrders) {
          const orders = JSON.parse(storedOrders);
          const index = orders.findIndex((o: any) => o.id === id);
          
          if (index !== -1) {
            orders[index] = {
              ...orders[index],
              ...order,
              updatedAt: new Date().toISOString()
            };
            
            localStorage.setItem('orders', JSON.stringify(orders));
            return orders[index];
          }
        }
      }
      
      throw new Error('更新订单失败');
    } catch (error) {
      console.error('更新订单失败:', error);
      toast.error('更新订单失败，请稍后重试');
      throw error;
    }
  },
  
  updateStatus: async (id: string, status: string) => {
    try {
      const response = await apiRequest(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      
      // 如果API调用成功，更新本地存储
      if (response) {
        // 重新获取最新的订单列表
        const allOrders = await orderAPI.getAll();
        localStorage.setItem('orders', JSON.stringify(allOrders));
        return response;
      }
      
      // 开发环境下的本地存储处理
      if (process.env.NODE_ENV !== 'production') {
        const storedOrders = localStorage.getItem('orders');
        if (storedOrders) {
          const orders = JSON.parse(storedOrders);
          const index = orders.findIndex((o: any) => o.id === id);
          
          if (index !== -1) {
            orders[index].status = status;
            orders[index].updatedAt = new Date().toISOString();
            
            localStorage.setItem('orders', JSON.stringify(orders));
            return orders[index];
          }
        }
      }
      
      throw new Error('更新订单状态失败');
    } catch (error) {
      console.error('更新订单状态失败:', error);
      toast.error('更新订单状态失败，请稍后重试');
      throw error;
    }
  }
};

// 客户相关API
export const customerAPI = {
  getAll: async () => {
    try {
      // 尝试从API获取数据
      const response = await apiRequest('/customers');
      
      // 如果API请求成功并返回数据，保存到本地存储并返回
      if (response && Array.isArray(response)) {
        localStorage.setItem('customers', JSON.stringify(response));
        return response;
      }
      
      // API返回null表示使用本地存储数据
      const storedCustomers = localStorage.getItem('customers');
      return storedCustomers ? JSON.parse(storedCustomers) : [];
    } catch (error) {
      console.error('获取客户数据失败:', error);
      // 出错时从本地存储获取数据
      const storedCustomers = localStorage.getItem('customers');
      return storedCustomers ? JSON.parse(storedCustomers) : [];
    }
  },
  
  create: async (customer: any) => {
    try {
      const response = await apiRequest('/customers', {
        method: 'POST',
        body: JSON.stringify(customer)
      });
      
      // 如果API调用成功，更新本地存储
      if (response) {
        // 重新获取最新的客户列表
        const allCustomers = await customerAPI.getAll();
        localStorage.setItem('customers', JSON.stringify(allCustomers));
        return response;
      }
      
      // 开发环境下的本地存储处理
      if (process.env.NODE_ENV !== 'production') {
        const storedCustomers = localStorage.getItem('customers');
        const customers = storedCustomers ? JSON.parse(storedCustomers) : [];
        
        const newCustomer = {
          ...customer,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        };
        
        customers.push(newCustomer);
        localStorage.setItem('customers', JSON.stringify(customers));
        return newCustomer;
      }
      
      throw new Error('创建客户失败');
    } catch (error) {
      console.error('创建客户失败:', error);
      toast.error('创建客户失败，请稍后重试');
      throw error;
    }
  },
  
  update: async (id: string, customer: any) => {
    try {
      const response = await apiRequest(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(customer)
      });
      
      // 如果API调用成功，更新本地存储
      if (response) {
        // 重新获取最新的客户列表
        const allCustomers = await customerAPI.getAll();
        localStorage.setItem('customers', JSON.stringify(allCustomers));
        return response;
      }
      
      // 开发环境下的本地存储处理
      if (process.env.NODE_ENV !== 'production') {
        const storedCustomers = localStorage.getItem('customers');
        if (storedCustomers) {
          const customers = JSON.parse(storedCustomers);
          const index = customers.findIndex((c: any) => c.id === id);
          
          if (index !== -1) {
            customers[index] = {
              ...customers[index],
              ...customer,
              updatedAt: new Date().toISOString()
            };
            
            localStorage.setItem('customers', JSON.stringify(customers));
            return customers[index];
          }
        }
      }
      
      throw new Error('更新客户失败');
    } catch (error) {
      console.error('更新客户失败:', error);
      toast.error('更新客户失败，请稍后重试');
      throw error;
    }
  },
  
  delete: async (id: string) => {
    try {
      const response = await apiRequest(`/customers/${id}`, {
        method: 'DELETE'
      });
      
      // 如果API调用成功，更新本地存储
      if (response) {
        // 重新获取最新的客户列表
        const allCustomers = await customerAPI.getAll();
        localStorage.setItem('customers', JSON.stringify(allCustomers));
        return response;
      }
      
      // 开发环境下的本地存储处理
      if (process.env.NODE_ENV !== 'production') {
        const storedCustomers = localStorage.getItem('customers');
        if (storedCustomers) {
          const customers = JSON.parse(storedCustomers);
          const filteredCustomers = customers.filter((c: any) => c.id !== id);
          
          localStorage.setItem('customers', JSON.stringify(filteredCustomers));
          return { message: '删除成功' };
        }
      }
      
      throw new Error('删除客户失败');
    } catch (error) {
      console.error('删除客户失败:', error);
      toast.error('删除客户失败，请稍后重试');
      throw error;
    }
  }
};

// 业务员相关API（管理员使用）
export const salespersonAPI = {
  getAll: async () => {
    try {
      // 尝试从API获取数据
      const response = await apiRequest('/salespersons');
      
      // 如果API请求成功并返回数据，保存到本地存储并返回
      if (response && Array.isArray(response)) {
        localStorage.setItem('salespersons', JSON.stringify(response));
        return response;
      }
      
      // API返回null表示使用本地存储数据
      const storedSalespersons = localStorage.getItem('salespersons');
      return storedSalespersons ? JSON.parse(storedSalespersons) : [];
    } catch (error) {
      console.error('获取业务员数据失败:', error);
      // 出错时从本地存储获取数据
      const storedSalespersons = localStorage.getItem('salespersons');
      return storedSalespersons ? JSON.parse(storedSalespersons) : [];
    }
  },
  
  create: async (salesperson: any) => {
    try {
      const response = await apiRequest('/salespersons', {
        method: 'POST',
        body: JSON.stringify(salesperson)
      });
      
      // 如果API调用成功，更新本地存储
      if (response) {
        // 重新获取最新的业务员列表
        const allSalespersons = await salespersonAPI.getAll();
        localStorage.setItem('salespersons', JSON.stringify(allSalespersons));
        return response;
      }
      
      // 开发环境下的本地存储处理
      if (process.env.NODE_ENV !== 'production') {
        const storedSalespersons = localStorage.getItem('salespersons');
        const salespersons = storedSalespersons ? JSON.parse(storedSalespersons) : [];
        
        // 检查用户名是否已存在
        const usernameExists = salespersons.some((s: any) => s.username === salesperson.username);
        if (usernameExists) {
          throw new Error('用户名已存在');
        }
        
        const newSalesperson = {
          ...salesperson,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        salespersons.push(newSalesperson);
        localStorage.setItem('salespersons', JSON.stringify(salespersons));
        return newSalesperson;
      }
      
      throw new Error('创建业务员失败');
    } catch (error) {
      console.error('创建业务员失败:', error);
      toast.error(error.message || '创建业务员失败，请稍后重试');
      throw error;
    }
  },
  
  update: async (id: string, salesperson: any) => {
    try {
      const response = await apiRequest(`/salespersons/${id}`, {
        method: 'PUT',
        body: JSON.stringify(salesperson)
      });
      
      // 如果API调用成功，更新本地存储
      if (response) {
        // 重新获取最新的业务员列表
        const allSalespersons = await salespersonAPI.getAll();
        localStorage.setItem('salespersons', JSON.stringify(allSalespersons));
        return response;
      }
      
      // 开发环境下的本地存储处理
      if (process.env.NODE_ENV !== 'production') {
        const storedSalespersons = localStorage.getItem('salespersons');
        if (storedSalespersons) {
          const salespersons = JSON.parse(storedSalespersons);
          const index = salespersons.findIndex((s: any) => s.id === id);
          
          if (index !== -1) {
            // 检查用户名是否已存在（除了当前用户）
            if (salesperson.username && 
                salesperson.username !== salespersons[index].username && 
                salespersons.some((s: any) => s.username === salesperson.username)) {
              throw new Error('用户名已存在');
            }
            
            salespersons[index] = {
              ...salespersons[index],
              ...salesperson,
              updatedAt: new Date().toISOString()
            };
            
            localStorage.setItem('salespersons', JSON.stringify(salespersons));
            return salespersons[index];
          }
        }
      }
      
      throw new Error('更新业务员失败');
    } catch (error) {
      console.error('更新业务员失败:', error);
      toast.error(error.message || '更新业务员失败，请稍后重试');
      throw error;
    }
  },
  
  delete: async (id: string) => {
    try {
      const response = await apiRequest(`/salespersons/${id}`, {
        method: 'DELETE'
      });
      
      // 如果API调用成功，更新本地存储
      if (response) {
        // 重新获取最新的业务员列表
        const allSalespersons = await salespersonAPI.getAll();
        localStorage.setItem('salespersons', JSON.stringify(allSalespersons));
        return response;
      }
      
      // 开发环境下的本地存储处理
      if (process.env.NODE_ENV !== 'production') {
        const storedSalespersons = localStorage.getItem('salespersons');
        if (storedSalespersons) {
          const salespersons = JSON.parse(storedSalespersons);
          
          // 检查是否有订单关联到此业务员
          const ordersData = localStorage.getItem('orders');
          if (ordersData) {
            const orders = JSON.parse(ordersData);
            const salesperson = salespersons.find((s: any) => s.id === id);
            
            if (salesperson) {
              const hasRelatedOrders = orders.some((order: any) => order.createdBy === salesperson.username);
              if (hasRelatedOrders) {
                throw new Error('该业务员已有创建的订单，无法删除');
              }
            }
          }
          
          const filteredSalespersons = salespersons.filter((s: any) => s.id !== id);
          localStorage.setItem('salespersons', JSON.stringify(filteredSalespersons));
          return { message: '删除成功' };
        }
      }
      
      throw new Error('删除业务员失败');
    } catch (error) {
      console.error('删除业务员失败:', error);
      toast.error(error.message || '删除业务员失败，请稍后重试');
      throw error;
    }
  }
};

// 微信通知服务
// 标签相关API
export const tagAPI = {
  getAll: async () => {
    try {
      // 尝试从API获取数据
      const response = await apiRequest('/tags');
      
      // 如果API请求成功并返回数据，保存到本地存储并返回
      if (response && Array.isArray(response)) {
        localStorage.setItem('tags', JSON.stringify(response));
        return response;
      }
      
      // API返回null表示使用本地存储数据
      const storedTags = localStorage.getItem('tags');
      return storedTags ? JSON.parse(storedTags) : [];
    } catch (error) {
      console.error('获取标签数据失败:', error);
      // 出错时从本地存储获取数据
      const storedTags = localStorage.getItem('tags');
      return storedTags ? JSON.parse(storedTags) : [];
    }
  },
  
  create: async (tag: any) => {
    try {
      const response = await apiRequest('/tags', {
        method: 'POST',
        body: JSON.stringify(tag)
      });
      
      // 如果API调用成功，更新本地存储
      if (response && response.success) {
        // 重新获取最新的标签列表
        const allTags = await tagAPI.getAll();
        localStorage.setItem('tags', JSON.stringify(allTags));
        return response.tag;
      }
      
      // 开发环境下的本地存储处理
      if (process.env.NODE_ENV !== 'production') {
        const storedTags = localStorage.getItem('tags');
        const tags = storedTags ? JSON.parse(storedTags) : [];
        
        // 检查标签是否已存在
        const existingTag = tags.find((t: any) => t.name.toLowerCase() === tag.name.toLowerCase());
        if (existingTag) {
          throw new Error('标签名称已存在');
        }
        
        const newTag = {
          ...tag,
          id: Date.now().toString(),
          isPendingApproval: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        tags.push(newTag);
        localStorage.setItem('tags', JSON.stringify(tags));
        return newTag;
      }
      
      throw new Error('创建标签失败');
    } catch (error: any) {
      console.error('创建标签失败:', error);
      toast.error(error.message || '创建标签失败，请稍后重试');
      throw error;
    }
  },
  
  update: async (id: string, tag: any) => {
    try {
      const response = await apiRequest(`/tags/${id}`, {
        method: 'PUT',
        body: JSON.stringify(tag)
      });
      
      // 如果API调用成功，更新本地存储
      if (response && response.success) {
        // 重新获取最新的标签列表
        const allTags = await tagAPI.getAll();
        localStorage.setItem('tags', JSON.stringify(allTags));
        return response.tag;
      }
      
      // 开发环境下的本地存储处理
      if (process.env.NODE_ENV !== 'production') {
        const storedTags = localStorage.getItem('tags');
        if (storedTags) {
          const tags = JSON.parse(storedTags);
          const index = tags.findIndex((t: any) => t.id === id);
          
          if (index !== -1) {
            // 检查新标签名是否已存在（排除当前标签）
            const nameExists = tags.some((t: any) => 
              t.id !== id && t.name.toLowerCase() === tag.name.toLowerCase()
            );
            
            if (nameExists) {
              throw new Error('标签名称已存在');
            }
            
            tags[index] = {
              ...tags[index],
              ...tag,
              updatedAt: new Date().toISOString()
            };
            
            localStorage.setItem('tags', JSON.stringify(tags));
            return tags[index];
          }
        }
      }
      
      throw new Error('更新标签失败');
    } catch (error: any) {
      console.error('更新标签失败:', error);
      toast.error(error.message || '更新标签失败，请稍后重试');
      throw error;
    }
  },
  
  approve: async (id: string) => {
    try {
      const response = await apiRequest(`/tags/${id}/approve`, {
        method: 'POST'
      });
      
      // 如果API调用成功，更新本地存储
      if (response && response.success) {
        // 重新获取最新的标签列表
        const allTags = await tagAPI.getAll();
        localStorage.setItem('tags', JSON.stringify(allTags));
        return response.tag;
      }
      
      // 开发环境下的本地存储处理
      if (process.env.NODE_ENV !== 'production') {
        const storedTags = localStorage.getItem('tags');
        if (storedTags) {
          const tags = JSON.parse(storedTags);
          const index = tags.findIndex((t: any) => t.id === id);
          
          if (index !== -1) {
            tags[index].isPendingApproval = false;
            tags[index].updatedAt = new Date().toISOString();
            
            localStorage.setItem('tags', JSON.stringify(tags));
            return tags[index];
          }
        }
      }
      
      throw new Error('审核标签失败');
    } catch (error) {
      console.error('审核标签失败:', error);
      toast.error('审核标签失败，请稍后重试');
      throw error;
    }
  },
  
  delete: async (id: string) => {
    try {
      const response = await apiRequest(`/tags/${id}`, {
        method: 'DELETE'
      });
      
      // 如果API调用成功，更新本地存储
      if (response && response.success) {
        // 重新获取最新的标签列表
        const allTags = await tagAPI.getAll();
        localStorage.setItem('tags', JSON.stringify(allTags));
        return response;
      }
      
      // 开发环境下的本地存储处理
      if (process.env.NODE_ENV !== 'production') {
        const storedTags = localStorage.getItem('tags');
        if (storedTags) {
          const tags = JSON.parse(storedTags);
          const filteredTags = tags.filter((t: any) => t.id !== id);
          
          localStorage.setItem('tags', JSON.stringify(filteredTags));
          return { success: true, message: '删除成功' };
        }
      }
      
      throw new Error('删除标签失败');
    } catch (error) {
      console.error('删除标签失败:', error);
      toast.error('删除标签失败，请稍后重试');
      throw error;
    }
  }
};

export const notificationAPI = {
  // 发送微信通知
  sendWechatNotification: async (message: string, title: string = '系统通知') => {
    try {
      // 在实际环境中，这里应该调用微信通知的API
      // 目前只是一个模拟实现
      
      console.log('发送微信通知:', title, message);
      
      // 如果设置了微信通知URL，则尝试发送
      if (process.env.WECHAT_NOTIFY_URL) {
        await fetch(process.env.WECHAT_NOTIFY_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title,
            message,
            timestamp: new Date().toISOString()
          })
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('发送微信通知失败:', error);
      return { success: false, error: (error as Error).message };
    }
  },
  
  // 发送新订单通知给管理员
  notifyNewOrder: async (orderInfo: any) => {
    const message = `有新订单等待审核：\n客户：${orderInfo.customerName}\n金额：¥${orderInfo.totalAmount}\n创建时间：${new Date().toLocaleString()}`;
    return notificationAPI.sendWechatNotification(message, '新订单通知');
  },
  
  // 发送产品审核通知给管理员
  notifyNewProduct: async (productInfo: any) => {
    const message = `有新产品等待审核：\n产品名称：${productInfo.name}\n价格：¥${productInfo.price}\n提交人：${productInfo.createdBy}`;
    return notificationAPI.sendWechatNotification(message, '新产品通知');
  }
};

// 导出所有API
export default {
  auth: authAPI,
  products: productAPI,
  orders: orderAPI,
  customers: customerAPI,
  salespersons: salespersonAPI,
  notifications: notificationAPI,
  tags: tagAPI
};

// 导出单独的API请求函数供其他地方使用
export { apiRequest };