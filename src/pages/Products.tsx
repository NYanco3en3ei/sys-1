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

// 产品类型定义
interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  createdAt: string;
  isPendingApproval?: boolean; // 是否待审核
  createdBy?: string; // 创建者
  tags?: string[]; // 产品标签
}

const Products = () => {
  const { userRole, userName } = useContext(AuthContext);
  const [products, setProducts] = useState<Product[]>([]);
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [pendingTags, setPendingTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showPendingTab, setShowPendingTab] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    image: '',
    tags: [] as string[]
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagFormData, setTagFormData] = useState({
    name: ''
  });

  // 加载产品和标签数据
  useEffect(() => {
    loadAllData();
  }, []);

  // 当选择标签变化时过滤产品
  useEffect(() => {
    if (selectedTag) {
      const filtered = products.filter(product => 
        product.tags && product.tags.includes(selectedTag)
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [selectedTag, products]);

  const loadAllData = () => {
    setLoading(true);
    Promise.all([loadProducts(), loadTags()])
      .catch(error => {
        console.error('加载数据失败:', error);
        toast.error('加载数据失败');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const loadProducts = async (): Promise<void> => {
    try {
      // 尝试从API加载产品
      const response = await api.products.getAll();
      
      if (response && Array.isArray(response)) {
        // 从API获取成功
        const allProducts = response;
        // 分离已批准和待批准的产品
        const approvedProducts = allProducts.filter((p: Product) => !p.isPendingApproval);
        const pendingProductsList = allProducts.filter((p: Product) => p.isPendingApproval);
        
        // 如果是业务员，只显示自己创建的待批准产品
        const filteredPendingProducts = userRole === 'salesperson' 
          ? pendingProductsList.filter((p: Product) => p.createdBy === userName)
          : pendingProductsList;
        
        setProducts(approvedProducts);
        setPendingProducts(filteredPendingProducts);
        setFilteredProducts(approvedProducts);
        
        // 保存到本地存储
        localStorage.setItem('products', JSON.stringify(allProducts));
      } else {
        // API不可用，从本地存储加载
        const storedProducts = localStorage.getItem('products');
        if (storedProducts) {
          const allProducts = JSON.parse(storedProducts);
          // 分离已批准和待批准的产品
          const approvedProducts = allProducts.filter((p: Product) => !p.isPendingApproval);
          const pendingProductsList = allProducts.filter((p: Product) => p.isPendingApproval);
          
          // 如果是业务员，只显示自己创建的待批准产品
          const filteredPendingProducts = userRole === 'salesperson' 
            ? pendingProductsList.filter((p: Product) => p.createdBy === userName)
            : pendingProductsList;
          
          setProducts(approvedProducts);
          setPendingProducts(filteredPendingProducts);
          setFilteredProducts(approvedProducts);
        }
      }
    } catch (error) {
      console.error('加载产品数据失败:', error);
      // 如果出错，尝试从本地存储获取
      const storedProducts = localStorage.getItem('products');
      if (storedProducts) {
        const allProducts = JSON.parse(storedProducts);
        // 分离已批准和待批准的产品
        const approvedProducts = allProducts.filter((p: Product) => !p.isPendingApproval);
        const pendingProductsList = allProducts.filter((p: Product) => p.isPendingApproval);
        
        // 如果是业务员，只显示自己创建的待批准产品
        const filteredPendingProducts = userRole === 'salesperson' 
          ? pendingProductsList.filter((p: Product) => p.createdBy === userName)
          : pendingProductsList;
        
        setProducts(approvedProducts);
        setPendingProducts(filteredPendingProducts);
        setFilteredProducts(approvedProducts);
      }
    }
  };

  const loadTags = async (): Promise<void> => {
    try {
      // 尝试从API加载标签
      const response = await api.tags.getAll();
      
      if (response && Array.isArray(response)) {
        // 从API获取成功
        const allTags = response;
        const approvedTags = allTags.filter((t: Tag) => !t.isPendingApproval);
        const pendingTagsList = allTags.filter((t: Tag) => t.isPendingApproval);
        
        // 如果是业务员，只显示自己创建的待批准标签
        const filteredPendingTags = userRole === 'salesperson' 
          ? pendingTagsList.filter((t: Tag) => t.createdBy === userName)
          : pendingTagsList;
        
        setTags(approvedTags);
        setPendingTags(filteredPendingTags);
        
        // 保存到本地存储
        localStorage.setItem('tags', JSON.stringify(allTags));
      } else {
        // API不可用，从本地存储加载
        const storedTags = localStorage.getItem('tags');
        if (storedTags) {
          const allTags = JSON.parse(storedTags);
          const approvedTags = allTags.filter((t: Tag) => !t.isPendingApproval);
          const pendingTagsList = allTags.filter((t: Tag) => t.isPendingApproval);
          
          // 如果是业务员，只显示自己创建的待批准标签
          const filteredPendingTags = userRole === 'salesperson' 
            ? pendingTagsList.filter((t: Tag) => t.createdBy === userName)
            : pendingTagsList;
          
          setTags(approvedTags);
          setPendingTags(filteredPendingTags);
        } else {
          // 初始化一些默认标签
          const defaultTags: Tag[] = [
            {
              id: '1',
              name: '电子产品',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: '2',
              name: '办公用品',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: '3',
              name: '家居用品',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ];
          localStorage.setItem('tags', JSON.stringify(defaultTags));
          setTags(defaultTags);
          setFilteredProducts(products);
        }
      }
    } catch (error) {
      console.error('加载标签数据失败:', error);
      // 如果出错，尝试从本地存储获取
      const storedTags = localStorage.getItem('tags');
      if (storedTags) {
        const allTags = JSON.parse(storedTags);
        const approvedTags = allTags.filter((t: Tag) => !t.isPendingApproval);
        const pendingTagsList = allTags.filter((t: Tag) => t.isPendingApproval);
        
        // 如果是业务员，只显示自己创建的待批准标签
        const filteredPendingTags = userRole === 'salesperson' 
          ? pendingTagsList.filter((t: Tag) => t.createdBy === userName)
          : pendingTagsList;
        
        setTags(approvedTags);
        setPendingTags(filteredPendingTags);
      }
    }
  };

  // 打开新增/编辑产品模态框
  const openModal = (product: Product | null = null) => {
    setEditingProduct(product);
    if (product) {
      setFormData({
        name: product.name,
        price: product.price,
        image: product.image,
        tags: product.tags || []
      });
      setImagePreview(product.image);
    } else {
      setFormData({
        name: '',
        price: 0,
        image: '',
        tags: []
      });
      setImagePreview(null);
    }
    setShowModal(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setImagePreview(null);
    setUploadingImage(false);
  };

  // 处理表单变化
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
    
    // 如果是图片URL变化，更新预览
    if (name === 'image' && value) {
      setImagePreview(value);
    }
  };

  // 处理标签选择
  const handleTagToggle = (tagId: string) => {
    setFormData(prev => {
      const isSelected = prev.tags.includes(tagId);
      if (isSelected) {
        return {
          ...prev,
          tags: prev.tags.filter(id => id !== tagId)
        };
      } else {
        return {
          ...prev,
          tags: [...prev.tags, tagId]
        };
      }
    });
  };

  // 打开标签创建模态框
  const openTagModal = () => {
    setTagFormData({ name: '' });
    setShowTagModal(true);
  };

  // 处理图片文件上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('请上传有效的图片文件 (JPG, PNG, GIF, WebP)');
      return;
    }

    // 检查文件大小（限制为2MB）
    if (file.size > 2 * 1024 * 1024) {
      toast.error('图片大小不能超过2MB');
      return;
    }

    setUploadingImage(true);

    try {
      // 使用FileReader将图片转换为base64字符串
      const reader = new FileReader();
      
      await new Promise<void>((resolve, reject) => {
        reader.onload = () => resolve();
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64Image = reader.result as string;
      
      // 更新表单数据和预览
      setFormData(prev => ({
        ...prev,
        image: base64Image
      }));
      
      toast.success('图片上传成功');
    } catch (error) {
      toast.error('图片上传失败，请重试');
      console.error('图片上传失败:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  // 移除上传的图片
  const removeUploadedImage = () => {
    setFormData(prev => ({
      ...prev,
      image: ''
    }));
    setImagePreview(null);
  };

  // 创建标签
  const createTag = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tagFormData.name.trim()) {
      toast.error('请输入标签名称');
      return;
    }
    
    try {
      // 检查标签是否已存在
      const existingTag = tags.find(t => t.name.toLowerCase() === tagFormData.name.toLowerCase());
      if (existingTag) {
        toast.error('标签名称已存在');
        return;
      }
      
      // 创建新标签
      const newTag: Tag = {
        id: Date.now().toString(),
        name: tagFormData.name.trim(),
        isPendingApproval: userRole === 'salesperson',
        createdBy: userName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // 保存标签
      const storedTags = localStorage.getItem('tags');
      const allTags = storedTags ? JSON.parse(storedTags) : [];
      allTags.push(newTag);
      localStorage.setItem('tags', JSON.stringify(allTags));
      
      // 重新加载标签
      await loadTags();
      
      // 如果是管理员创建的标签，自动选择它
      if (userRole !== 'salesperson') {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag.id]
        }));
      }
      
      toast.success(userRole === 'salesperson' ? '标签已提交，等待管理员审核' : '标签创建成功');
      setShowTagModal(false);
    } catch (error) {
      console.error('创建标签失败:', error);
      toast.error('创建标签失败');
    }
  };

  // 审核标签
  const approveTag = (tagId: string, approve: boolean) => {
    if (userRole !== 'admin') return;
    
    try {
      // 获取所有标签
      const storedTags = localStorage.getItem('tags');
      if (!storedTags) return;
      
      const allTags = JSON.parse(storedTags);
      const updatedTags = allTags.map((tag: Tag) => 
        tag.id === tagId 
          ? { ...tag, isPendingApproval: !approve } 
          : tag
      );
      
      localStorage.setItem('tags', JSON.stringify(updatedTags));
      loadTags();
      
      toast.success(approve ? '标签已批准' : '标签已拒绝');
    } catch (error) {
      console.error('审核标签失败:', error);
      toast.error('审核标签失败');
    }
  };

  // 删除标签
  const deleteTag = (tagId: string) => {
    if (window.confirm('确定要删除这个标签吗？')) {
      try {
        // 获取所有标签
        const storedTags = localStorage.getItem('tags');
        if (!storedTags) return;
        
        const allTags = JSON.parse(storedTags);
        const updatedTags = allTags.filter((tag: Tag) => tag.id !== tagId);
        
        localStorage.setItem('tags', JSON.stringify(updatedTags));
        loadTags();
        
        // 如果删除的是当前选中的标签，清除选择
        if (selectedTag === tagId) {
          setSelectedTag(null);
        }
        
        toast.success('标签已删除');
      } catch (error) {
        console.error('删除标签失败:', error);
        toast.error('删除标签失败');
      }
    }
  };

  // 保存产品
  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!formData.name.trim() || formData.price <= 0) {
      toast.error('请填写有效的产品信息');
      return;
    }

    try {
      // 获取所有产品（包括待审核的）
      const storedProducts = localStorage.getItem('products');
      const allProducts = storedProducts ? JSON.parse(storedProducts) : [];
      
      let updatedProducts;
      
      if (editingProduct) {
        // 编辑现有产品
        updatedProducts = allProducts.map((product: Product) => 
          product.id === editingProduct.id 
            ? { ...product, ...formData, updatedAt: new Date().toISOString() } 
            : product
        );
        toast.success('产品更新成功');
      } else {
        // 添加新产品
        const newProduct: Product = {
          id: Date.now().toString(),
          ...formData,
          createdAt: new Date().toISOString(),
          isPendingApproval: userRole === 'salesperson', // 业务员创建的产品需要审核
          createdBy: userName
        };
        updatedProducts = [...allProducts, newProduct];
        
        if (userRole === 'salesperson') {
          // 尝试发送微信通知给管理员
          try {
            await api.notifications.notifyNewProduct(newProduct);
          } catch (error) {
            console.error('发送通知失败:', error);
          }
          toast.success('产品已提交，等待管理员审核');
        } else {
          toast.success('产品添加成功');
        }
      }
      
      // 保存到本地存储
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      
      // 重新加载产品列表
      loadProducts();
      closeModal();
    } catch (error) {
      toast.error('保存产品失败');
      console.error('保存产品失败:', error);
    }
  };

  // 审核产品
  const approveProduct = (productId: string, approve: boolean) => {
    if (!userRole || userRole !== 'admin') return;
    
    try {
      // 获取所有产品
      const storedProducts = localStorage.getItem('products');
      if (!storedProducts) return;
      
      const allProducts = JSON.parse(storedProducts);
      const updatedProducts = allProducts.map((product: Product) => 
        product.id === productId 
          ? approve 
            ? { ...product, isPendingApproval: false } 
            : product // 如果拒绝，保持原样（可以选择删除）
          : product
      );
      
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      loadProducts();
      
      toast.success(approve ? '产品已批准' : '产品已拒绝');
    } catch (error) {
      toast.error('审核产品失败');
      console.error('审核产品失败:', error);
    }
  };

  // 删除待审核产品
  const deletePendingProduct = (productId: string) => {
    if (window.confirm('确定要删除这个待审核的产品吗？')) {
      try {
        // 获取所有产品
        const storedProducts = localStorage.getItem('products');
        if (!storedProducts) return;
        
        const allProducts = JSON.parse(storedProducts);
        const updatedProducts = allProducts.filter((product: Product) => product.id !== productId);
        
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        loadProducts();
        
        toast.success('产品已删除');
      } catch (error) {
        toast.error('删除产品失败');
        console.error('删除产品失败:', error);
      }
    }
  };

  // 删除已批准的产品
  const deleteProduct = (id: string) => {
    if (window.confirm('确定要删除这个产品吗？')) {
      try {
        // 获取所有产品
        const storedProducts = localStorage.getItem('products');
        if (!storedProducts) return;
        
        const allProducts = JSON.parse(storedProducts);
        const updatedProducts = allProducts.filter((product: Product) => product.id !== id);
        
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        loadProducts();
        
        toast.success('产品删除成功');
      } catch (error) {
        toast.error('删除产品失败');
        console.error('删除产品失败:', error);
      }
    }
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

  // 获取产品标签名称
  const getProductTagNames = (tagIds: string[]) => {
    return tagIds.map(id => {
      const tag = tags.find(t => t.id === id);
      return tag ? tag.name : id;
    });
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
          产品管理
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* 待审核产品标签页（只有有待审核产品时显示） */}
          {(userRole === 'admin' && pendingProducts.length > 0) && (
            <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowPendingTab(false)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  !showPendingTab 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                已批准产品
              </button>
              <button
                onClick={() => setShowPendingTab(true)}
                className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                  showPendingTab 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                待审核产品
                <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">
                  {pendingProducts.length}
                </span>
              </button>
            </div>
          )}
          
          {/* 添加产品按钮 */}
          <button
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            <i className="fa-solid fa-plus mr-2"></i>
            {userRole === 'salesperson' ? '提交产品' : '添加产品'}
          </button>
        </div>
      </div>
      
      {/* 标签筛选区域 - 增强版，确保标签清晰可见 */}
      {!showPendingTab && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-3 flex items-center">
            <i className="fa-solid fa-tags text-blue-600 mr-2"></i>
            产品系列分类
          </h2>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedTag === null 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              全部产品
            </button>
            {tags.length > 0 ? (
              tags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => setSelectedTag(tag.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105 ${
                    selectedTag === tag.id 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  {tag.name}
                </button>
              ))
            ) : (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                暂无标签，请先创建标签
              </div>
            )}
            
            {/* 添加标签按钮 */}
            <button
              onClick={openTagModal}
              className="px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-800/30 transition-colors flex items-center"
            >
              <i className="fa-solid fa-plus mr-1 text-xs"></i>
              添加分类
            </button>
          </div>
        </div>
      )}
      
      {/* 标签筛选结果提示 */}
      {selectedTag && (
        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg text-blue-700 dark:text-blue-400 text-sm">
          <div className="flex items-center">
            <i className="fa-solid fa-filter mr-2"></i>
            <span>
              已筛选分类：<strong>{tags.find(t => t.id === selectedTag)?.name}</strong>
            </span>
          </div>
          <button
            onClick={() => setSelectedTag(null)}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
      )}
      
      {/* 产品列表或待审核产品列表 */}
      {(!showPendingTab && products.length > 0) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(selectedTag ? filteredProducts : products).map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-all hover:shadow-md"
            >
              <div className="h-48 overflow-hidden">
                 <img
                  src={product.image || 'https://space.coze.cn/api/coze_space/gen_image?image_size=square_hd&prompt=product%20placeholder&sign=5f01a548a7ff8f8fa96dc61046e75b54'}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                  loading="lazy"
                />
              </div>
              
              <div className="p-5">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                  {product.name}
                </h3>
                
                {/* 产品标签 - 明显显示 */}
                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {getProductTagNames(product.tags).map((tagName, index) => (
                      <span 
                        key={index} 
                        className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full dark:bg-blue-900/30 dark:text-blue-400"
                      >
                        {tagName}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                {userRole === 'admin' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openModal(product)}
                      className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors text-sm"
                    >
                      <i className="fa-solid fa-pen-to-square mr-1"></i>
                      编辑
                    </button>
                    
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="flex-1 py-2 px-3 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/30 text-red-700 dark:text-red-300 rounded-lg transition-colors text-sm"
                    >
                      <i className="fa-solid fa-trash-alt mr-1"></i>
                      删除
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : showPendingTab && pendingProducts.length > 0 ? (
        // 待审核产品列表
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {pendingProducts.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border-2 border-yellow-300 dark:border-yellow-600 overflow-hidden transition-all hover:shadow-md"
            >
              <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-semibold px-3 py-1 flex items-center">
                <i className="fa-solid fa-clock mr-1"></i>
                待审核
              </div>
              
              <div className="h-40 overflow-hidden">
                 <img
                  src={product.image || 'https://space.coze.cn/api/coze_space/gen_image?image_size=square_hd&prompt=product%20placeholder&sign=5f01a548a7ff8f8fa96dc61046e75b54'}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                  loading="lazy"
                />
              </div>
              
              <div className="p-5">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                  {product.name}
                </h3>
                
                {/* 产品标签 */}
                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {getProductTagNames(product.tags).map((tagName, index) => (
                      <span 
                        key={index} 
                        className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full dark:bg-blue-900/30 dark:text-blue-400"
                      >
                        {tagName}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatPrice(product.price)}
                  </span>
                </div>
                
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  提交人: {product.createdBy} | {new Date(product.createdAt).toLocaleDateString()}
                </div>
                
                {userRole === 'admin' ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => approveProduct(product.id, true)}
                      className="flex-1 py-2 px-3 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-800/30 text-green-700 dark:text-green-300 rounded-lg transition-colors text-sm"
                    >
                      <i className="fa-solid fa-check mr-1"></i>
                      批准
                    </button>
                    
                    <button
                      onClick={() => deletePendingProduct(product.id)}
                      className="flex-1 py-2 px-3 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/30 text-red-700 dark:text-red-300 rounded-lg transition-colors text-sm"
                    >
                      <i className="fa-solid fa-times mr-1"></i>
                      拒绝
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <button
                      onClick={() => deletePendingProduct(product.id)}
                      className="py-2 px-4 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/30 text-red-700 dark:text-red-300 rounded-lg transition-colors text-sm"
                    >
                      <i className="fa-solid fa-trash-alt mr-1"></i>
                      撤回
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 mb-4">
            <i className="fa-solid fa-box-open text-2xl text-slate-400 dark:text-slate-500"></i>
          </div>
          <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">
            {showPendingTab ? '暂无待审核产品' : '暂无产品'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            {showPendingTab 
              ? '所有产品都已审核完毕' 
              : (userRole === 'admin' ? '点击"添加产品"按钮开始创建您的第一个产品' : '暂无可用产品')
            }
          </p>
          
          {!showPendingTab && (
            <button
              onClick={() => openModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center"
            >
              <i className="fa-solid fa-plus mr-2"></i>
              {userRole === 'salesperson' ? '提交产品' : '添加产品'}
            </button>
          )}
        </div>
      )}
      
      {/* 产品表单模态框 */}
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
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {editingProduct ? '编辑产品' : '添加产品'}
              </h2>
            </div>
            
            <form onSubmit={saveProduct} className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  产品名称
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="请输入产品名称"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  产品单价
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleFormChange}
                  placeholder="请输入产品单价"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  产品图片
                </label>
                
                {/* 图片预览区 */}
                {imagePreview ? (
                  <div className="relative mb-3">
                    <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                      <img
                        src={imagePreview}
                        alt="产品预览"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeUploadedImage}
                      className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md transition-colors"
                      aria-label="移除图片"
                    >
                      <i className="fa-solid fa-times text-sm"></i>
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center mb-3 cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer"
                    >
                      {uploadingImage ? (
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400 mb-2"></div>
                          <span className="text-sm text-slate-500 dark:text-slate-400">上传中...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <i className="fa-solid fa-cloud-arrow-up text-slate-400 mb-2 text-2xl"></i><span className="text-sm text-slate-700 dark:text-slate-300">点击或拖拽文件到此处上传</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">支持 JPG, PNG, GIF, WebP (最大2MB)</span>
                        </div>
                      )}
                    </label>
                  </div>
                )}
                
                {/* 备用URL输入 */}
                <div className="mt-3">
                  <label htmlFor="image" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    或输入图片URL
                  </label>
                  <input
                    type="text"
                    id="image"
                    name="image"
                    value={formData.image}
                    onChange={handleFormChange}
                    placeholder="请输入产品图片URL"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                  />
                </div>
                
                {/* 产品标签选择 - 明显显示 */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      选择系列分类
                    </label>
                    <button
                      type="button"
                      onClick={openTagModal}
                      className="text-xs bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-800/30 text-green-700 dark:text-green-400 px-2 py-1 rounded transition-colors"
                    >
                      <i className="fa-solid fa-plus mr-1"></i>添加分类
                    </button>
                  </div>
                  
                  {tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {tags.map(tag => (
                        <label key={tag.id} className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.tags.includes(tag.id)}
                            onChange={() => handleTagToggle(tag.id)}
                            className="sr-only peer"
                          />
                          <span className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                            formData.tags.includes(tag.id)
                              ? 'bg-blue-600 text-white' 
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 peer-checked:bg-blue-600 peer-checked:text-white'
                          }`}>
                            {tag.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      暂无可用标签，请先创建标签
                    </div>
                  )}
                </div>
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
                  {editingProduct ? '保存修改' : '添加产品'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      
      {/* 标签创建模态框 */}
      {showTagModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowTagModal(false)}
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
                添加系列分类
              </h2>
            </div>
            
            <form onSubmit={createTag} className="p-6 space-y-4">
              <div>
                <label htmlFor="tagName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  分类名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="tagName"
                  value={tagFormData.name}
                  onChange={(e) => setTagFormData({ name: e.target.value })}
                  placeholder="请输入分类名称"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>
              
              {userRole === 'salesperson' && (
                <div className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  <i className="fa-solid fa-info-circle mr-1"></i>
                  分类创建后需要管理员审核才能使用
                </div>
              )}
              
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTagModal(false)}
                  className="flex-1 py-2.5 px-4 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  取消
                </button>
                
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  创建分类
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      
      {/* 待审核标签列表（管理员可见） */}
      {userRole === 'admin' && pendingTags.length > 0 && !showPendingTab && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border-2 border-yellow-300 dark:border-yellow-600 overflow-hidden">
          <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-semibold px-4 py-2 flex items-center justify-between">
            <div className="flex items-center">
              <i className="fa-solid fa-clock mr-1"></i>
              待审核系列分类
            </div>
            <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingTags.length}
            </span>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-3">
              {pendingTags.map(tag => (
                <div key={tag.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-slate-800 dark:text-white">{tag.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">提交人: {tag.createdBy}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => approveTag(tag.id, true)}
                      className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                      aria-label="批准分类"
                    >
                      <i className="fa-solid fa-check"></i>
                    </button>
                    <button
                      onClick={() => deleteTag(tag.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      aria-label="拒绝分类"
                    >
                      <i className="fa-solid fa-times"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;