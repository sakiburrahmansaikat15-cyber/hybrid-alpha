import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Edit, Trash2, Eye, X, Save, Upload, Package, Check,
  AlertCircle, Filter, Image as ImageIcon, Layers, Building, Ruler,
  Type, Folder, Box, Shield, ShieldOff, RefreshCw, MoreVertical,
  ChevronLeft, ChevronRight, Loader, Tag, FileText
} from 'lucide-react';

const API_URL = '/api/products';
const APP_URL = import.meta.env.VITE_APP_URL?.replace(/\/$/, '') || '';

// Helper to get image URL safely
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${APP_URL}/${path.replace(/^\//, '')}`;
};

const ProductManagement = () => {
  // --- State ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actionMenu, setActionMenu] = useState(null);

  // Pagination
  const [pagination, setPagination] = useState({
    current_page: 1, per_page: 8, total_items: 0, total_pages: 1
  });

  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    brand: 'all'
  });

  // Modal & Form
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    specification: '',
    status: 'active',
    cat_id: '',
    brand_id: '',
    sub_cat_id: '',
    sub_item_id: '',
    unit_id: '',
    product_type_id: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});

  // Related Data
  const [relatedData, setRelatedData] = useState({
    categories: [],
    brands: [],
    subCategories: [],
    subItems: [],
    units: [],
    productTypes: []
  });

  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // --- Helpers ---
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
  }, []);

  const handleApiError = useCallback((error, defaultMessage) => {
    if (error.response?.status === 422) {
      const validationErrors = error.response.data.errors || {};
      setErrors(validationErrors);
      const firstError = Object.values(validationErrors)[0]?.[0];
      showNotification(firstError || 'Validation error', 'error');
    } else if (error.response?.data?.message) {
      showNotification(error.response.data.message, 'error');
    } else {
      showNotification(defaultMessage || 'Something went wrong', 'error');
    }
  }, [showNotification]);

  // --- Fetching ---
  const fetchRelatedData = useCallback(async () => {
    try {
      const [cat, brand, subCat, subItem, unit, pType] = await Promise.all([
        axios.get('/api/categories'),
        axios.get('/api/brands'),
        axios.get('/api/sub-categories'),
        axios.get('/api/sub-items'),
        axios.get('/api/units'),
        axios.get('/api/product-type')
      ]);

      // Helper to safely extract data array
      const extract = (res) => res.data?.pagination?.data || res.data?.data || [];

      setRelatedData({
        categories: extract(cat),
        brands: extract(brand),
        subCategories: extract(subCat),
        subItems: extract(subItem),
        units: extract(unit),
        productTypes: extract(pType)
      });
    } catch (error) {
      console.error('Failed to load related data', error);
    }
  }, []);

  const fetchProducts = useCallback(async (page = 1, limit = 8, keyword = '', status = 'all', cat_id = 'all') => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (keyword.trim()) params.keyword = keyword.trim();
      if (status !== 'all') params.status = status;
      if (cat_id !== 'all') params.cat_id = cat_id;

      const response = await axios.get(API_URL, { params });
      const data = response.data.pagination || response.data;
      const itemList = data.data || [];

      setProducts(itemList);
      setPagination({
        current_page: data.current_page || 1,
        per_page: data.per_page || limit,
        total_items: data.total_items || data.total || itemList.length,
        total_pages: data.total_pages || data.last_page || 1
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  // --- Effects ---
  useEffect(() => {
    fetchRelatedData();
    fetchProducts(1, 8);
  }, [fetchRelatedData, fetchProducts]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    fetchProducts(1, pagination.per_page, debouncedSearch, filters.status, filters.category);
  }, [debouncedSearch, pagination.per_page, filters.status, filters.category, fetchProducts]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (actionMenu && !e.target.closest('.action-menu-container')) {
        setActionMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [actionMenu]);


  // --- Handlers ---
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.total_pages) return;
    fetchProducts(newPage, pagination.per_page, debouncedSearch);
  };

  const handleLimitChange = (e) => {
    const limit = parseInt(e.target.value);
    setPagination(prev => ({ ...prev, per_page: limit, current_page: 1 }));
    fetchProducts(1, limit, debouncedSearch);
  };

  const resetForm = () => {
    setFormData({
      name: '', description: '', specification: '', status: 'active',
      cat_id: '', brand_id: '', sub_cat_id: '', sub_item_id: '',
      unit_id: '', product_type_id: '', image: null
    });
    setImagePreview(null);
    setSelectedProduct(null);
    setErrors({});
  };

  const openModal = (product = null) => {
    if (product) {
      setSelectedProduct(product);
      setFormData({
        name: product.name || '',
        description: product.description || '',
        specification: product.specification || '',
        status: product.status || 'active',
        cat_id: product.cat_id || product.category?.id || '',
        brand_id: product.brand_id || product.brand?.id || '',
        sub_cat_id: product.sub_cat_id || product.subCategory?.id || '',
        sub_item_id: product.sub_item_id || product.subItem?.id || '',
        unit_id: product.unit_id || product.unit?.id || '',
        product_type_id: product.product_type_id || product.productType?.id || '',
        image: null
      });
      setImagePreview(getImageUrl(product.image));
    } else {
      resetForm();
    }
    setShowModal(true);
    setActionMenu(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(resetForm, 300);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'Image must be < 2MB' }));
      return;
    }

    setFormData(prev => ({ ...prev, image: file }));
    setImagePreview(URL.createObjectURL(file));
    if (errors.image) setErrors(prev => ({ ...prev, image: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');
    setErrors({});

    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== '') {
        submitData.append(key, formData[key]);
      }
    });

    try {
      if (selectedProduct) {
        submitData.append('_method', 'POST'); // For Laravel PUT with file
        await axios.post(`${API_URL}/${selectedProduct.id}`, submitData);
      } else {
        await axios.post(API_URL, submitData);
      }
      showNotification(selectedProduct ? 'Product updated!' : 'Product created!');
      fetchProducts(pagination.current_page, pagination.per_page, debouncedSearch, filters.status, filters.category);
      closeModal();
    } catch (error) {
      handleApiError(error, 'Failed to save product');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setOperationLoading(`delete-${id}`);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Product deleted');
      fetchProducts(pagination.current_page, pagination.per_page, debouncedSearch, filters.status, filters.category);
    } catch (error) {
      handleApiError(error, 'Failed to delete product');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  const toggleStatus = async (product) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    setOperationLoading(`status-${product.id}`);

    const updateData = new FormData();
    updateData.append('status', newStatus);
    updateData.append('_method', 'POST');
    // Append minimal required fields if validation is strict, 
    // otherwise usually we can patch. Safe bet is to append name.
    updateData.append('name', product.name);

    try {
      await axios.post(`${API_URL}/${product.id}`, updateData);
      showNotification(`Product ${newStatus}`);
      fetchProducts(pagination.current_page, pagination.per_page, debouncedSearch, filters.status, filters.category);
    } catch (error) {
      handleApiError(error, 'Failed to update status');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  // Filtering logic for the view (client-side for categories/brands if needed, or we can push to API)
  // For now we filter the current page list or use API if backend supports it.
  // Assuming frontend filtering for now as per previous implementation pattern.
  const displayedProducts = products.filter(p => {
    if (filters.status !== 'all' && p.status !== filters.status) return false;
    if (filters.category !== 'all' && (p.cat_id != filters.category && p.category?.id != filters.category)) return false;
    if (filters.brand !== 'all' && (p.brand_id != filters.brand && p.brand?.id != filters.brand)) return false;
    return true;
  });

  // --- Render ---
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-8 font-sans selection:bg-cyan-500/30 transition-colors duration-300">
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '50%' }}
            animate={{ opacity: 1, y: 0, x: '50%' }}
            exit={{ opacity: 0, y: -20, x: '50%' }}
            className={`fixed top-6 right-1/2 translate-x-1/2 z-[60] px-6 py-3 rounded-full shadow-2xl backdrop-blur-md border flex items-center gap-3 font-medium ${notification.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/50 text-rose-400'
              : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
              }`}
          >
            {notification.type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-500">
                Product Inventory
              </span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-light">
              Master catalog and stock management
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openModal()}
            className="group relative px-6 py-3 bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-xl font-bold text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all flex items-center gap-2 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <Plus size={20} className="relative z-10" />
            <span className="relative z-10">Add Product</span>
          </motion.button>
        </div>

        {/* Controls Bar */}
        <div className="bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 backdrop-blur-md flex flex-col xl:flex-row gap-4 items-center justify-between sticky top-4 z-40 shadow-xl dark:shadow-2xl dark:shadow-black/50">
          {/* Search */}
          <div className="relative w-full xl:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-400 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            {/* Status Filter */}
            <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-3 rounded-xl border border-white/10">
              <Filter size={16} className="text-slate-400" />
              <select
                value={filters.status}
                onChange={(e) => setFilters(p => ({ ...p, status: e.target.value }))}
                className="bg-transparent border-none text-sm text-slate-300 focus:ring-0 cursor-pointer outline-none w-24"
              >
                <option value="all">Status: All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-3 rounded-xl border border-white/10">
              <Layers size={16} className="text-slate-400" />
              <select
                value={filters.category}
                onChange={(e) => setFilters(p => ({ ...p, category: e.target.value }))}
                className="bg-transparent border-none text-sm text-slate-300 focus:ring-0 cursor-pointer outline-none max-w-[150px]"
              >
                <option value="all">Category: All</option>
                {relatedData.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Limit */}
            <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-3 rounded-xl border border-white/10">
              <Layers size={16} className="text-slate-400" />
              <select
                value={pagination.per_page}
                onChange={handleLimitChange}
                className="bg-transparent border-none text-sm text-slate-300 focus:ring-0 cursor-pointer outline-none"
              >
                <option value="8">8 per page</option>
                <option value="16">16 per page</option>
                <option value="32">32 per page</option>
              </select>
            </div>

            <button
              onClick={() => fetchProducts(pagination.current_page, pagination.per_page, searchTerm, filters.status, filters.category)}
              className="p-3 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/10 hover:border-cyan-500/30 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading && !products.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-96 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {displayedProducts.map(product => (
                <motion.div
                  layout
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                  key={product.id}
                  className={`group relative bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-900/10 hover:border-cyan-500/30 flex flex-col`}
                >
                  {/* Image Section */}
                  <div className="relative h-48 bg-slate-800 overflow-hidden shrink-0">
                    {product.image ? (
                      <img src={getImageUrl(product.image)} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                        <Package size={48} className="mb-2 opacity-50" />
                        <span className="text-xs font-mono uppercase">No Image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />

                    <div className="absolute top-3 right-3 flex gap-2">
                      <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold border backdrop-blur-md shadow-lg ${product.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}>
                        {product.status}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1 relative">
                    {/* Action Menu */}
                    <div className="absolute top-4 right-4 action-menu-container z-20">
                      <button
                        onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === product.id ? null : product.id); }}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>
                      <AnimatePresence>
                        {actionMenu === product.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10, x: -50 }}
                            animate={{ opacity: 1, scale: 1, y: 0, x: -100 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10, x: -50 }}
                            className="absolute right-0 top-full mt-2 w-48 bg-slate-800/90 border border-white/10 rounded-xl shadow-2xl py-2 backdrop-blur-xl"
                          >
                            <button onClick={() => { setSelectedProduct(product); setShowViewModal(true); setActionMenu(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-cyan-400">
                              <Eye size={16} /> View Details
                            </button>
                            <button onClick={() => openModal(product)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-cyan-400">
                              <Edit size={16} /> Edit Product
                            </button>
                            <button onClick={() => toggleStatus(product)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-cyan-400">
                              <Shield size={16} /> {product.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <div className="my-1 border-t border-white/5"></div>
                            <button onClick={() => handleDelete(product.id)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10">
                              <Trash2 size={16} /> Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="mb-4 pr-6">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2 mb-1" title={product.name}>
                        {product.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{product.description || 'No description'}</p>
                    </div>

                    {/* Tags Grid */}
                    <div className="grid grid-cols-2 gap-2 mt-auto text-xs">
                      <div className="bg-white/5 rounded-lg p-2 border border-white/5 flex items-center gap-2 overflow-hidden">
                        <Layers size={14} className="text-cyan-400 shrink-0" />
                        <span className="truncate text-slate-300" title={product.category?.name || 'No Cat'}>{product.category?.name || '-'}</span>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 border border-white/5 flex items-center gap-2 overflow-hidden">
                        <Building size={14} className="text-purple-400 shrink-0" />
                        <span className="truncate text-slate-300" title={product.brand?.name || 'No Brand'}>{product.brand?.name || '-'}</span>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 border border-white/5 flex items-center gap-2 overflow-hidden">
                        <Ruler size={14} className="text-orange-400 shrink-0" />
                        <span className="truncate text-slate-300">{product.unit?.name || '-'}</span>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 border border-white/5 flex items-center gap-2 overflow-hidden">
                        <Type size={14} className="text-green-400 shrink-0" />
                        <span className="truncate text-slate-300">{product.productType?.name || '-'}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Pagination */}
        {!loading && pagination.total_pages > 1 && (
          <div className="flex justify-center mt-12 pb-12">
            <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-2xl border border-white/10">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="p-3 hover:bg-white/10 rounded-xl disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-white"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-1 px-2 text-sm text-slate-400">
                Page <span className="text-white font-bold ml-1">{pagination.current_page}</span> of <span className="text-white font-bold ml-1">{pagination.total_pages}</span>
              </div>
              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.total_pages}
                className="p-3 hover:bg-white/10 rounded-xl disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-white"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-4xl bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto block">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-emerald-600" />

              <form onSubmit={handleSubmit} className="flex flex-col h-full">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/95 sticky top-0 z-10 backdrop-blur-sm">
                  <h2 className="text-2xl font-bold text-white">{selectedProduct ? 'Edit Product' : 'New Product'}</h2>
                  <button type="button" onClick={closeModal} className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
                </div>

                <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Image & Basic Info */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Product Image</label>
                      <div
                        onClick={() => document.getElementById('prod-upload').click()}
                        className="border-2 border-dashed border-white/10 rounded-2xl aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-center group relative overflow-hidden bg-slate-800/50"
                      >
                        <input type="file" id="prod-upload" hidden accept="image/*" onChange={handleImageChange} />
                        {imagePreview ? (
                          <>
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-slate-900/80 p-2 rounded-xl text-white text-xs font-bold">Change Image</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="p-4 bg-slate-800 rounded-full mb-3 group-hover:scale-110 transition-transform"><Upload size={24} className="text-cyan-400" /></div>
                            <p className="text-sm text-slate-300 font-medium">Upload Image</p>
                            <p className="text-xs text-slate-500 mt-1">Max 2MB</p>
                          </>
                        )}
                      </div>
                      {errors.image && <p className="text-rose-400 text-xs">{errors.image}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Status</label>
                      <div className="grid grid-cols-2 gap-3">
                        {['active', 'inactive'].map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, status: s }))}
                            className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all ${formData.status === s
                              ? (s === 'active' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-rose-500/20 border-rose-500 text-rose-300')
                              : 'bg-slate-800 border-white/10 text-slate-500 hover:bg-slate-700'
                              }`}
                          >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Details form */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-white font-bold border-b border-white/5 pb-2">Core Details</h3>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Product Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none"
                          placeholder="e.g. Wireless Headphones"
                        />
                        {errors.name && <p className="text-rose-400 text-xs">{errors.name[0]}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Description</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows="2"
                          className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none resize-none"
                          placeholder="Brief summary..."
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-white font-bold border-b border-white/5 pb-2 mt-2">Classification</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { label: 'Category', name: 'cat_id', options: relatedData.categories },
                          { label: 'Sub Category', name: 'sub_cat_id', options: relatedData.subCategories },
                          { label: 'Brand', name: 'brand_id', options: relatedData.brands },
                          { label: 'Product Type', name: 'product_type_id', options: relatedData.productTypes },
                          { label: 'Unit', name: 'unit_id', options: relatedData.units },
                          { label: 'Sub Item', name: 'sub_item_id', options: relatedData.subItems },
                        ].map((field) => (
                          <div key={field.name} className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">{field.label}</label>
                            <select
                              name={field.name}
                              value={formData[field.name]}
                              onChange={handleInputChange}
                              className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none appearance-none cursor-pointer"
                            >
                              <option value="">Select {field.label}</option>
                              {field.options.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.name}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Specification</label>
                      <textarea
                        name="specification"
                        value={formData.specification}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none"
                        placeholder="Technical details..."
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-slate-900/50 flex justify-end gap-3 sticky bottom-0 z-10 backdrop-blur-md">
                  <button type="button" onClick={closeModal} className="px-6 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-medium">Cancel</button>
                  <button type="submit" disabled={operationLoading === 'saving'} className="px-8 py-2.5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-900/20 disabled:opacity-50 flex items-center gap-2 transform active:scale-95 transition-all">
                    {operationLoading === 'saving' ? <RefreshCw size={18} className="animate-spin" /> : (selectedProduct ? <Check size={18} /> : <Plus size={18} />)}
                    {selectedProduct ? 'Save Changes' : 'Create Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {showViewModal && selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowViewModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-2xl bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden p-8">
              <button onClick={() => setShowViewModal(false)} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"><X size={20} /></button>

              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3 aspect-square rounded-2xl overflow-hidden bg-slate-800 border border-white/5">
                  {selectedProduct.image ? (
                    <img src={getImageUrl(selectedProduct.image)} alt={selectedProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500"><Package size={48} /></div>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">{selectedProduct.name}</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${selectedProduct.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                      {selectedProduct.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{selectedProduct.description || 'No description provided.'}</p>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-500 block mb-1">Category</span>
                      <span className="text-sm font-medium text-cyan-300">{selectedProduct.category?.name || '-'}</span>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-500 block mb-1">Brand</span>
                      <span className="text-sm font-medium text-purple-300">{selectedProduct.brand?.name || '-'}</span>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-500 block mb-1">Type</span>
                      <span className="text-sm font-medium text-green-300">{selectedProduct.productType?.name || '-'}</span>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-500 block mb-1">Unit</span>
                      <span className="text-sm font-medium text-orange-300">{selectedProduct.unit?.name || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedProduct.specification && (
                <div className="mt-8 pt-8 border-t border-white/10">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <FileText size={18} className="text-slate-400" /> Specifications
                  </h3>
                  <p className="text-slate-400 text-sm whitespace-pre-wrap leading-relaxed p-4 bg-black/20 rounded-xl border border-white/5">
                    {selectedProduct.specification}
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductManagement;