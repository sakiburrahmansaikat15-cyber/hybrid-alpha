import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Check, Eye, EyeOff,
  MoreVertical, Tag, Activity, Calendar, Shield,
  ChevronLeft, ChevronRight, Loader, Layers, Filter, RefreshCw
} from 'lucide-react';

const API_URL = '/api/product-type';

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

const ProductTypesManager = () => {
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMenu, setActionMenu] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    status: 'active'
  });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 9,
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

  const fetchProductTypes = useCallback(async (page = 1, limit = 9, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await axios.get(API_URL, { params });
      // Adaptive handling for different API response structures
      const data = response.data.pagination || response.data;
      const itemList = data.data || [];

      setProductTypes(itemList);
      setPagination({
        current_page: data.current_page || 1,
        per_page: data.per_page || limit,
        total_items: data.total_items || data.total || itemList.length,
        total_pages: data.total_pages || data.last_page || 1
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch product types');
      setProductTypes([]);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    fetchProductTypes(1, 9);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProductTypes(1, pagination.per_page, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchProductTypes]);

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

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.total_pages || newPage === pagination.current_page) return;
    fetchProductTypes(newPage, pagination.per_page, searchTerm);
  };

  const handleLimitChange = (newLimit) => {
    const limit = parseInt(newLimit);
    setPagination(prev => ({ ...prev, per_page: limit, current_page: 1 }));
    fetchProductTypes(1, limit, searchTerm);
  };

  const resetForm = () => {
    setFormData({ name: '', status: 'active' });
    setEditingType(null);
    setErrors({});
  };

  const openModal = (type = null) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name || '',
        status: type.status === 'active' ? 'active' : 'inactive' // Normalize status
      });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');
    setErrors({});

    const payload = {
      name: formData.name.trim(),
      status: formData.status
    };

    try {
      if (editingType) {
        // Laravel update spoofing if needed, though strictly JSON endpoints might support PUT directly
        // Using POST + _method=POST/PUT pattern for consistency with form-data based controllers
        await axios.post(`${API_URL}/${editingType.id}`, { ...payload, _method: 'POST' });
        showNotification('Product type updated!');
      } else {
        await axios.post(API_URL, payload);
        showNotification('Product type created!');
      }
      fetchProductTypes(pagination.current_page, pagination.per_page, searchTerm);
      closeModal();
    } catch (error) {
      handleApiError(error, 'Failed to save');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product type?')) return;
    setOperationLoading(`delete-${id}`);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Product type deleted');
      if (productTypes.length === 1 && pagination.current_page > 1) {
        fetchProductTypes(pagination.current_page - 1, pagination.per_page, searchTerm);
      } else {
        fetchProductTypes(pagination.current_page, pagination.per_page, searchTerm);
      }
    } catch (error) {
      handleApiError(error, 'Failed to delete');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  const toggleStatus = async (type) => {
    const newStatus = type.status === 'active' ? 'inactive' : 'active';
    setOperationLoading(`status-${type.id}`);
    try {
      await axios.post(`${API_URL}/${type.id}`, {
        name: type.name,
        status: newStatus,
        _method: 'POST'
      });
      showNotification(`Status updated to ${newStatus}`);
      fetchProductTypes(pagination.current_page, pagination.per_page, searchTerm);
    } catch (error) {
      handleApiError(error, 'Failed to update status');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

  const stats = {
    total: pagination.total_items,
    active: productTypes.filter(t => t.status === 'active').length,
    inactive: productTypes.filter(t => t.status !== 'active').length
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-emerald-500/30">
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
            {notification.type === 'error' ? <Shield size={18} /> : <Check size={18} />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">
                Product Types
              </span>
            </h1>
            <p className="text-slate-400 text-lg font-light">
              Define the available types of products
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openModal()}
            className="group relative px-6 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-xl font-semibold text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all flex items-center gap-2 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <Plus size={20} className="relative z-10" />
            <span className="relative z-10">Create Type</span>
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Types', value: stats.total, icon: Layers, color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20' },
            { label: 'Active', value: stats.active, icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
            { label: 'Inactive', value: stats.inactive, icon: EyeOff, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' },
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

        {/* Controls */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md flex flex-col md:flex-row gap-4 items-center justify-between sticky top-4 z-40 shadow-2xl shadow-black/50">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search product types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-500"
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
              onClick={() => fetchProductTypes(pagination.current_page, pagination.per_page, searchTerm)}
              className="p-3 bg-slate-900/50 rounded-xl border border-white/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading && !productTypes.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
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
              {productTypes.map((type) => (
                <motion.div
                  layout
                  variants={itemVariants}
                  key={type.id}
                  className="group relative bg-slate-900/40 border border-white/10 rounded-2xl p-6 overflow-hidden hover:border-emerald-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-900/20"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-emerald-500/10 transition-colors">
                      <Tag size={24} className="text-slate-400 group-hover:text-emerald-400 transition-colors" />
                    </div>

                    <div className="relative action-menu-container">
                      <button
                        onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === type.id ? null : type.id); }}
                        className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                      >
                        <MoreVertical size={20} />
                      </button>

                      <AnimatePresence>
                        {actionMenu === type.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10, x: -100 }}
                            animate={{ opacity: 1, scale: 1, y: 0, x: -150 }} // Shift left to align
                            exit={{ opacity: 0, scale: 0.9, y: 10, x: -100 }}
                            className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-2xl py-2 z-50 backdrop-blur-xl"
                          >
                            <button onClick={() => openModal(type)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-emerald-400 transition-colors">
                              <Edit size={16} /> Edit Details
                            </button>
                            <button onClick={() => toggleStatus(type)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-emerald-400 transition-colors">
                              {type.status === 'active' ? <EyeOff size={16} /> : <Eye size={16} />}
                              {type.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <div className="my-1 border-t border-white/5"></div>
                            <button onClick={() => handleDelete(type.id)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors">
                              <Trash2 size={16} /> Delete Forever
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                    {type.name}
                  </h3>

                  <div className="flex items-center gap-2 mb-6">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${type.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                      }`}>
                      {type.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {formatDate(type.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Shield size={12} /> ID: {type.id}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && productTypes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed">
            <div className="p-6 bg-slate-900 rounded-full mb-4">
              <Tag size={48} className="text-slate-600" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No product types found</h3>
            <p className="text-slate-400 max-w-md text-center mb-8">
              {searchTerm ? "Try adjusting your search terms." : "Define types to categorize your products effectively."}
            </p>
            <button
              onClick={() => { searchTerm ? setSearchTerm('') : openModal(); }}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-emerald-900/20"
            >
              {searchTerm ? 'Clear Search' : 'Create Product Type'}
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
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
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

      {/* Modal */}
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
              className="relative w-full max-w-lg bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-cyan-600" />

              <form onSubmit={handleSubmit}>
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {editingType ? 'Edit Details' : 'New Type'}
                    </h2>
                    <p className="text-slate-400 text-sm">
                      Configure product type information.
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

                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Type Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Service, Physical Good"
                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all hover:border-white/20 placeholder:text-slate-600"
                    />
                    {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name[0]}</p>}
                  </div>

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
                          {status === 'active' ? <Check size={16} /> : <X size={16} />}
                          <span className="capitalize font-medium text-sm">{status}</span>
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
                    className="px-8 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20 disabled:opacity-50 flex items-center gap-2 transition-all transform active:scale-95"
                  >
                    {operationLoading === 'saving' && <Loader size={18} className="animate-spin" />}
                    {editingType ? 'Save Changes' : 'Create Type'}
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

export default ProductTypesManager;