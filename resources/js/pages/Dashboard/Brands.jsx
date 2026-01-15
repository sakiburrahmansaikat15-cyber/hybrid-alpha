import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Check, Eye, EyeOff,
  MoreVertical, Tag, Image as ImageIcon, Upload,
  Shield, Calendar, ChevronLeft, ChevronRight, Loader,
  Layers, Filter, RefreshCw
} from 'lucide-react';

const API_URL = '/api/brands';
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

const Brands = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMenu, setActionMenu] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    image: null,
    status: 'active'
  });
  const [imagePreview, setImagePreview] = useState(null);
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

  const fetchBrands = useCallback(async (page = 1, limit = 9, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await axios.get(API_URL, { params });
      const data = response.data.pagination || response.data;
      const itemList = data.data || [];

      setBrands(itemList);
      setPagination({
        current_page: data.current_page || 1,
        per_page: data.per_page || limit,
        total_items: data.total_items || data.total || itemList.length,
        total_pages: data.total_pages || data.last_page || 1
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch brands');
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    fetchBrands(1, 9);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBrands(1, pagination.per_page, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchBrands]);

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
    fetchBrands(newPage, pagination.per_page, searchTerm);
  };

  const handleLimitChange = (newLimit) => {
    const limit = parseInt(newLimit);
    setPagination(prev => ({ ...prev, per_page: limit, current_page: 1 }));
    fetchBrands(1, limit, searchTerm);
  };

  const resetForm = () => {
    setFormData({ name: '', image: null, status: 'active' });
    setImagePreview(null);
    setEditingBrand(null);
    setErrors({});
  };

  const openModal = (brand = null) => {
    if (brand) {
      setEditingBrand(brand);
      setFormData({
        name: brand.name || '',
        image: null,
        status: brand.status || 'active'
      });
      setImagePreview(getImageUrl(brand.image));
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
    submitData.append('name', formData.name.trim());
    submitData.append('status', formData.status);
    if (formData.image instanceof File) {
      submitData.append('image', formData.image);
    }

    try {
      if (editingBrand) {
        submitData.append('_method', 'POST');
        await axios.post(`${API_URL}/${editingBrand.id}`, submitData);
      } else {
        await axios.post(API_URL, submitData);
      }
      showNotification(editingBrand ? 'Brand updated!' : 'Brand created!');
      fetchBrands(pagination.current_page, pagination.per_page, searchTerm);
      closeModal();
    } catch (error) {
      handleApiError(error, 'Failed to save');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this brand permanently?')) return;
    setOperationLoading(`delete-${id}`);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Brand deleted');
      if (brands.length === 1 && pagination.current_page > 1) {
        fetchBrands(pagination.current_page - 1, pagination.per_page, searchTerm);
      } else {
        fetchBrands(pagination.current_page, pagination.per_page, searchTerm);
      }
    } catch (error) {
      handleApiError(error, 'Failed to delete');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  const toggleStatus = async (brand) => {
    const newStatus = brand.status === 'active' ? 'inactive' : 'active';
    setOperationLoading(`status-${brand.id}`);
    try {
      // Create FormData to handle potential image requirements or simple consistent structure
      const form = new FormData();
      form.append('name', brand.name);
      form.append('status', newStatus);
      form.append('_method', 'POST');

      await axios.post(`${API_URL}/${brand.id}`, form);
      showNotification(`Brand ${newStatus}`);
      fetchBrands(pagination.current_page, pagination.per_page, searchTerm);
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
    active: brands.filter(b => b.status === 'active').length,
    inactive: brands.filter(b => b.status !== 'active').length
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-purple-500/30">
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
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-fuchsia-500">
                Brands
              </span>
            </h1>
            <p className="text-slate-400 text-lg font-light">
              Manage your product manufacturers and partners
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openModal()}
            className="group relative px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl font-semibold text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all flex items-center gap-2 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <Plus size={20} className="relative z-10" />
            <span className="relative z-10">Add New Brand</span>
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Brands', value: stats.total, icon: Layers, color: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10', border: 'border-fuchsia-400/20' },
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-400 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search brands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none transition-all placeholder:text-slate-500"
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
              onClick={() => fetchBrands(pagination.current_page, pagination.per_page, searchTerm)}
              className="p-3 bg-slate-900/50 rounded-xl border border-white/10 hover:border-purple-500/30 hover:text-purple-400 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading && !brands.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
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
              {brands.map((brand) => (
                <motion.div
                  layout
                  variants={itemVariants}
                  key={brand.id}
                  className="group relative bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-900/20"
                >
                  {/* Image Area */}
                  <div className="h-40 overflow-hidden relative bg-slate-800 flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10 opacity-60" />
                    {brand.image ? (
                      <img
                        src={getImageUrl(brand.image)}
                        alt={brand.name}
                        className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-500 z-0"
                      />
                    ) : (
                      <div className="text-slate-600 bg-slate-800/80 rounded-full p-4">
                        <Tag size={40} strokeWidth={1} />
                      </div>
                    )}

                    <div className="absolute top-4 left-4 z-20">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border ${brand.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}>
                        {brand.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="absolute top-4 right-4 z-30 action-menu-container">
                      <button
                        onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === brand.id ? null : brand.id); }}
                        className="p-2 bg-black/40 backdrop-blur-md rounded-lg text-white hover:bg-purple-500 transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>

                      <AnimatePresence>
                        {actionMenu === brand.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-2xl py-2 z-50 backdrop-blur-xl"
                          >
                            <button onClick={() => openModal(brand)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-purple-400 transition-colors">
                              <Edit size={16} /> Edit Details
                            </button>
                            <button onClick={() => toggleStatus(brand)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-purple-400 transition-colors">
                              {brand.status === 'active' ? <EyeOff size={16} /> : <Eye size={16} />}
                              {brand.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <div className="my-1 border-t border-white/5"></div>
                            <button onClick={() => handleDelete(brand.id)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors">
                              <Trash2 size={16} /> Delete Forever
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-6 relative">
                    <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors truncate mb-4">
                      {brand.name}
                    </h3>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {formatDate(brand.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Shield size={12} /> ID: {brand.id}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && brands.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed">
            <div className="p-6 bg-slate-900 rounded-full mb-4">
              <Tag size={48} className="text-slate-600" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No brands found</h3>
            <p className="text-slate-400 max-w-md text-center mb-8">
              {searchTerm ? "Try adjusting your search terms." : "Start by adding your first brand partner."}
            </p>
            <button
              onClick={() => { searchTerm ? setSearchTerm('') : openModal(); }}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-purple-900/20"
            >
              {searchTerm ? 'Clear Search' : 'Create Brand'}
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
                          ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
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
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-fuchsia-600" />

              <form onSubmit={handleSubmit}>
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {editingBrand ? 'Edit Brand' : 'New Brand'}
                    </h2>
                    <p className="text-slate-400 text-sm">
                      Set up brand details.
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
                    <label className="text-sm font-medium text-slate-300">Brand Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Nike, Apple"
                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all hover:border-white/20 placeholder:text-slate-600"
                    />
                    {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name[0]}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Logo</label>
                    <div
                      onClick={() => document.getElementById('brand-modal-upload').click()}
                      className="border-2 border-dashed border-white/10 rounded-2xl p-6 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all cursor-pointer group text-center relative overflow-hidden"
                    >
                      <input
                        id="brand-modal-upload"
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleImageChange}
                      />

                      {imagePreview ? (
                        <div className="relative w-full h-32 rounded-xl overflow-hidden mx-auto max-w-xs shadow-xl bg-white/5 p-2">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <RefreshCw className="text-white" size={24} />
                          </div>
                        </div>
                      ) : (
                        <div className="py-2">
                          <Upload size={32} className="mx-auto mb-3 text-slate-400 group-hover:text-purple-400 transition-colors" />
                          <p className="text-slate-300 font-medium text-sm">Click to upload logo</p>
                        </div>
                      )}
                    </div>
                    {errors.image && <p className="text-rose-400 text-xs mt-1">{errors.image[0] || errors.image}</p>}
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
                    className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white rounded-xl font-bold shadow-lg shadow-purple-900/20 disabled:opacity-50 flex items-center gap-2 transition-all transform active:scale-95"
                  >
                    {operationLoading === 'saving' && <Loader size={18} className="animate-spin" />}
                    {editingBrand ? 'Save Changes' : 'Create Brand'}
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

export default Brands;