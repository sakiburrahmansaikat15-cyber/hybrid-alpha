import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Check, Eye, EyeOff,
  MoreVertical, Folder, Image as ImageIcon, Upload,
  Shield, Calendar, ChevronLeft, ChevronRight, Loader,
  Layers, Filter, RefreshCw
} from 'lucide-react';

const API_URL = '/api/sub-categories';
const CATEGORIES_API = '/api/categories';
const APP_URL = import.meta.env.VITE_APP_URL?.replace(/\/$/, '') || '';

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${APP_URL}/${path.replace(/^\//, '')}`;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

const SubCategories = () => {
  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMenu, setActionMenu] = useState(null);
  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    image: null,
    status: 'active'
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 9, // Adjusted for 3x3 grid
    total_items: 0,
    total_pages: 1
  });

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

  const fetchSubCategories = useCallback(async (page = 1, limit = 9, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await axios.get(API_URL, { params });
      const paginated = response.data.pagination;

      setSubCategories(paginated.data || []);
      setPagination({
        current_page: paginated.current_page,
        per_page: paginated.per_page,
        total_items: paginated.total_items,
        total_pages: paginated.total_pages
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch sub-categories');
      setSubCategories([]);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(CATEGORIES_API);
      const data = response.data;
      const list = Array.isArray(data) ? data : (data.data || data.pagination?.data || []);
      setCategories(list);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchSubCategories(1, 9);
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSubCategories(1, pagination.per_page, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchSubCategories]);

  // Click outside listener for action menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (actionMenu && !e.target.closest('.action-menu-container')) {
        setActionMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [actionMenu]);

  const stats = {
    total: pagination.total_items,
    active: subCategories.filter(b => b.status === 'active').length,
    inactive: subCategories.filter(b => b.status === 'inactive').length
  };

  // Form & Action Handlers
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.total_pages || newPage === pagination.current_page) return;
    fetchSubCategories(newPage, pagination.per_page, searchTerm);
  };

  const handleLimitChange = (newLimit) => {
    const limit = parseInt(newLimit);
    setPagination(prev => ({ ...prev, per_page: limit, current_page: 1 }));
    fetchSubCategories(1, limit, searchTerm);
  };

  const resetForm = () => {
    setFormData({ category_id: '', name: '', image: null, status: 'active' });
    setImagePreview(null);
    setEditingSubCategory(null);
    setErrors({});
  };

  const openModal = (subCat = null) => {
    if (subCat) {
      setEditingSubCategory(subCat);
      setFormData({
        category_id: subCat.category_id || '',
        name: subCat.name || '',
        status: subCat.status || 'active',
        image: null
      });
      setImagePreview(getImageUrl(subCat.image));
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

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, image: ['Only JPEG, PNG, WebP allowed'] }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: ['Image must be less than 2MB'] }));
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
    submitData.append('category_id', formData.category_id || '');
    submitData.append('name', formData.name.trim());
    submitData.append('status', formData.status);
    if (formData.image instanceof File) {
      submitData.append('image', formData.image);
    }

    try {
      if (editingSubCategory) {
        submitData.append('_method', 'POST');
        await axios.post(`${API_URL}/${editingSubCategory.id}`, submitData);
      } else {
        await axios.post(API_URL, submitData);
      }
      showNotification(editingSubCategory ? 'Updated successfully!' : 'Created successfully!');
      fetchSubCategories(pagination.current_page, pagination.per_page, searchTerm);
      closeModal();
    } catch (error) {
      handleApiError(error, 'Failed to save');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sub-category permanently?')) return;
    setOperationLoading(`delete-${id}`);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Deleted successfully');
      if (subCategories.length === 1 && pagination.current_page > 1) {
        fetchSubCategories(pagination.current_page - 1, pagination.per_page, searchTerm);
      } else {
        fetchSubCategories(pagination.current_page, pagination.per_page, searchTerm);
      }
    } catch (error) {
      handleApiError(error, 'Failed to delete');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  const toggleStatus = async (subCat) => {
    const newStatus = subCat.status === 'active' ? 'inactive' : 'active';
    setOperationLoading(`status-${subCat.id}`);
    try {
      const form = new FormData();
      form.append('status', newStatus);
      form.append('name', subCat.name);
      form.append('category_id', subCat.category_id || '');
      form.append('_method', 'POST');

      await axios.post(`${API_URL}/${subCat.id}`, form);
      showNotification(`Status updated to ${newStatus}`);
      fetchSubCategories(pagination.current_page, pagination.per_page, searchTerm);
    } catch (error) {
      handleApiError(error, 'Failed to update status');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-cyan-500/30">
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '50%' }}
            animate={{ opacity: 1, y: 0, x: '50%' }}
            exit={{ opacity: 0, y: -20, x: '50%' }}
            className={`fixed top-6 right-1/2 translate-x-1/2 z-[60] px-6 py-3 rounded-full shadow-2xl backdrop-blur-md border flex items-center gap-3 font-medium ${notification.type === 'error'
              ? 'bg-red-500/10 border-red-500/50 text-red-400'
              : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
              }`}
          >
            {notification.type === 'error' ? <Shield size={18} /> : <Check size={18} />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">
                Sub Categories
              </span>
            </h1>
            <p className="text-slate-400 text-lg font-light">
              Organize and manage your product hierarchy
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openModal()}
            className="group relative px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-semibold text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all flex items-center gap-2 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <Plus size={20} className="relative z-10" />
            <span className="relative z-10">Add New Sub Category</span>
          </motion.button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Sub-Categories', value: stats.total, icon: Layers, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
            { label: 'Active Items', value: stats.active, icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
            { label: 'Inactive Items', value: stats.inactive, icon: EyeOff, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' },
          ].map((stat, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i}
              className={`relative overflow-hidden p-6 rounded-2xl border ${stat.border} bg-white/5 backdrop-blur-sm group`}
            >
              <div className={`absolute top-0 right-0 p-32 opacity-10 rounded-full blur-3xl ${stat.bg}`} />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-slate-400 font-medium mb-1">{stat.label}</p>
                  <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                </div>
                <div className={`p-4 rounded-xl ${stat.bg}`}>
                  <stat.icon size={24} className={stat.color} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Controls Bar */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md flex flex-col md:flex-row gap-4 items-center justify-between sticky top-4 z-40 shadow-2xl shadow-black/50">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-400 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-3 rounded-xl border border-white/10">
              <Filter size={16} className="text-slate-400" />
              <select
                value={pagination.per_page}
                onChange={(e) => handleLimitChange(e.target.value)}
                className="bg-transparent border-none text-sm text-slate-300 focus:ring-0 cursor-pointer outline-none"
              >
                <option value="9">9 per page</option>
                <option value="18">18 per page</option>
                <option value="27">27 per page</option>
              </select>
            </div>
            <button
              onClick={() => fetchSubCategories(pagination.current_page, pagination.per_page, searchTerm)}
              className="p-3 bg-slate-900/50 rounded-xl border border-white/10 hover:border-cyan-500/30 hover:text-cyan-400 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Content Grid */}
        {loading && !subCategories.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode='popLayout'>
              {subCategories.map((subCat) => (
                <motion.div
                  layout
                  variants={itemVariants}
                  key={subCat.id}
                  className="group relative bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-900/20"
                >
                  {/* Image Area */}
                  <div className="h-48 overflow-hidden relative bg-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10 opacity-60" />
                    {subCat.image ? (
                      <img
                        src={getImageUrl(subCat.image)}
                        alt={subCat.name}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <ImageIcon size={48} strokeWidth={1} />
                      </div>
                    )}

                    {/* Quick Status Badge */}
                    <div className="absolute top-4 left-4 z-20">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border ${subCat.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}>
                        {subCat.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Action Menu Button */}
                    <div className="absolute top-4 right-4 z-30 action-menu-container">
                      <button
                        onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === subCat.id ? null : subCat.id); }}
                        className="p-2 bg-black/40 backdrop-blur-md rounded-lg text-white hover:bg-cyan-500 transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>

                      <AnimatePresence>
                        {actionMenu === subCat.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-2xl py-2 z-50 backdrop-blur-xl"
                          >
                            <button onClick={() => openModal(subCat)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-cyan-400 transition-colors">
                              <Edit size={16} /> Edit Details
                            </button>
                            <button onClick={() => toggleStatus(subCat)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-cyan-400 transition-colors">
                              {subCat.status === 'active' ? <EyeOff size={16} /> : <Eye size={16} />}
                              {subCat.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <div className="my-1 border-t border-white/5"></div>
                            <button onClick={() => handleDelete(subCat.id)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors">
                              <Trash2 size={16} /> Delete Forever
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-6 relative">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="p-1.5 rounded bg-blue-500/10 text-blue-400">
                          <Folder size={14} />
                        </span>
                        <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">
                          {subCat.category?.name || 'Uncategorized'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
                        {subCat.name}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {formatDate(subCat.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Shield size={12} /> ID: {subCat.id}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && subCategories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed">
            <div className="p-6 bg-slate-900 rounded-full mb-4">
              <Layers size={48} className="text-slate-600" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No sub-categories found</h3>
            <p className="text-slate-400 max-w-md text-center mb-8">
              {searchTerm ? "No results found for your search terms." : "Get started by adding your first sub-category to organize your inventory."}
            </p>
            <button
              onClick={() => { searchTerm ? setSearchTerm('') : openModal(); }}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-cyan-900/20"
            >
              {searchTerm ? 'Clear Search' : 'Create Sub-Category'}
            </button>
          </div>
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

              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === pagination.total_pages || Math.abs(p - pagination.current_page) <= 1)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && p - arr[idx - 1] > 1 && <span className="text-slate-600 px-1">...</span>}
                      <button
                        onClick={() => handlePageChange(p)}
                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${pagination.current_page === p
                          ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                          }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
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

      {/* Modern Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-600" />

              <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {editingSubCategory ? 'Edit Sub-Category' : 'New Sub-Category'}
                    </h2>
                    <p className="text-slate-400 text-sm">
                      Fill in the details below to {editingSubCategory ? 'update' : 'create'} the record.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="p-8 space-y-6 overflow-y-auto">
                  {/* Category Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Parent Category</label>
                    <div className="relative">
                      <select
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleInputChange}
                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3.5 pl-4 pr-10 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none appearance-none transition-all hover:border-white/20"
                      >
                        <option value="" className="bg-slate-900 text-slate-400">Select parent category...</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id} className="bg-slate-900 text-white">
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-500 pointer-events-none" size={16} />
                    </div>
                    {errors.category_id && <p className="text-rose-400 text-xs mt-1">{errors.category_id[0]}</p>}
                  </div>

                  {/* Name Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Wireless Headsets"
                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all hover:border-white/20 placeholder:text-slate-600"
                    />
                    {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name[0]}</p>}
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Featured Image</label>
                    <div
                      onClick={() => document.getElementById('modal-upload').click()}
                      className="border-2 border-dashed border-white/10 rounded-2xl p-8 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all cursor-pointer group text-center relative overflow-hidden"
                    >
                      <input
                        id="modal-upload"
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleImageChange}
                      />

                      {imagePreview ? (
                        <div className="relative w-full h-48 rounded-xl overflow-hidden mx-auto max-w-sm shadow-2xl">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white font-medium flex items-center gap-2">
                              <RefreshCw size={16} /> Change Image
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="py-4">
                          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <Upload size={24} className="text-slate-400 group-hover:text-cyan-400" />
                          </div>
                          <p className="text-slate-300 font-medium">Click to upload image</p>
                          <p className="text-slate-500 text-sm mt-1">SVG, PNG, JPG (Max 2MB)</p>
                        </div>
                      )}
                    </div>
                    {errors.image && <p className="text-rose-400 text-xs mt-1">{errors.image[0] || errors.image}</p>}
                  </div>

                  {/* Status Toggle */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Status</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['active', 'inactive'].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, status }))}
                          className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${formData.status === status
                            ? status === 'active'
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                              : 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                            : 'bg-slate-800/30 border-white/5 text-slate-500 hover:bg-slate-800'
                            }`}
                        >
                          {status === 'active' ? <Check size={18} /> : <X size={18} />}
                          <span className="capitalize font-medium">{status}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-slate-900/50 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={operationLoading === 'saving'}
                    className="px-8 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all transform active:scale-95"
                  >
                    {operationLoading === 'saving' && <Loader size={18} className="animate-spin" />}
                    {editingSubCategory ? 'Update Changes' : 'Create Sub-Category'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubCategories;