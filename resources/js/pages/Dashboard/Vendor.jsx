import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Check, Eye, EyeOff,
  MoreVertical, Store, Phone, Mail, MapPin, Upload,
  Shield, Filter, RefreshCw, ChevronLeft, ChevronRight, Loader
} from 'lucide-react';

const API_URL = '/api/vendors';
const APP_URL = import.meta.env.VITE_APP_URL?.replace(/\/$/, '') || '';

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

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMenu, setActionMenu] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    shop_name: '',
    email: '',
    contact: '',
    address: '',
    status: 'active',
    image: null
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const [pagination, setPagination] = useState({
    current_page: 1, per_page: 9, total_items: 0, total_pages: 1
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

  const fetchVendors = useCallback(async (page = 1, limit = 9, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await axios.get(API_URL, { params });
      const data = response.data.pagination || response.data;
      const itemList = data.data || [];

      setVendors(itemList);
      setPagination({
        current_page: data.current_page || 1,
        per_page: data.per_page || limit,
        total_items: data.total_items || data.total || itemList.length,
        total_pages: data.total_pages || data.last_page || 1
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch vendors');
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    fetchVendors(1, 9);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVendors(1, pagination.per_page, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchVendors]);

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
    fetchVendors(newPage, pagination.per_page, searchTerm);
  };

  const handleLimitChange = (newLimit) => {
    const limit = parseInt(newLimit);
    setPagination(prev => ({ ...prev, per_page: limit, current_page: 1 }));
    fetchVendors(1, limit, searchTerm);
  };

  const resetForm = () => {
    setFormData({
      name: '', shop_name: '', email: '', contact: '', address: '', status: 'active', image: null
    });
    setImagePreview(null);
    setEditingVendor(null);
    setErrors({});
  };

  const openModal = (vendor = null) => {
    if (vendor) {
      setEditingVendor(vendor);
      setFormData({
        name: vendor.name || '',
        shop_name: vendor.shop_name || '',
        email: vendor.email || '',
        contact: vendor.contact || '',
        address: vendor.address || '',
        status: vendor.status || 'active',
        image: null
      });
      setImagePreview(vendor.image ? `${APP_URL}/${vendor.image}` : null);
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
      setErrors(prev => ({ ...prev, image: ['Image must be < 2MB'] }));
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
      if (key === 'image' && !formData.image) return;
      submitData.append(key, formData[key]);
    });

    try {
      if (editingVendor) {
        // Laravel update workaround for FormData
        submitData.append('_method', 'POST');
        await axios.post(`${API_URL}/${editingVendor.id}`, submitData);
      } else {
        await axios.post(API_URL, submitData);
      }
      showNotification(editingVendor ? 'Vendor updated!' : 'Vendor created!');
      fetchVendors(pagination.current_page, pagination.per_page, searchTerm);
      closeModal();
    } catch (error) {
      handleApiError(error, 'Failed to save');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vendor?')) return;
    setOperationLoading(`delete-${id}`);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Vendor deleted');
      if (vendors.length === 1 && pagination.current_page > 1) {
        fetchVendors(pagination.current_page - 1, pagination.per_page, searchTerm);
      } else {
        fetchVendors(pagination.current_page, pagination.per_page, searchTerm);
      }
    } catch (error) {
      handleApiError(error, 'Failed to delete');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  const toggleStatus = async (vendor) => {
    const newStatus = vendor.status === 'active' ? 'inactive' : 'active';
    setOperationLoading(`status-${vendor.id}`);
    try {
      // Re-send required fields for update validation if necessary, or just status
      const data = new FormData();
      data.append('status', newStatus);
      data.append('_method', 'POST');
      // Some APIs require all fields, but usually status patch is separate. 
      // Assuming your API handles partial updates or we send everything.
      // To be safe based on previous code:
      data.append('name', vendor.name);
      data.append('shop_name', vendor.shop_name);
      data.append('email', vendor.email);

      await axios.post(`${API_URL}/${vendor.id}`, data);
      showNotification(`Vendor ${newStatus}`);
      fetchVendors(pagination.current_page, pagination.per_page, searchTerm);
    } catch (error) {
      handleApiError(error, 'Failed to update status');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  const stats = {
    total: pagination.total_items,
    active: vendors.filter(v => v.status === 'active').length,
    inactive: vendors.filter(v => v.status !== 'active').length
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-8 font-sans selection:bg-violet-500/30 transition-colors duration-300">
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
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-purple-500">
                Vendors
              </span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-light">
              Manage your supplier relationships
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openModal()}
            className="group relative px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl font-semibold text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 transition-all flex items-center gap-2 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <Plus size={20} className="relative z-10" />
            <span className="relative z-10">Add Vendor</span>
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Vendors', value: stats.total, icon: Store, color: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/20' },
            { label: 'Active', value: stats.active, icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
            { label: 'Inactive', value: stats.inactive, icon: EyeOff, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' },
          ].map((stat, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i}
              className={`relative overflow-hidden p-6 rounded-2xl border ${stat.border} bg-white dark:bg-white/5 backdrop-blur-sm group shadow-sm dark:shadow-none`}
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
        <div className="bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 backdrop-blur-md flex flex-col md:flex-row gap-4 items-center justify-between sticky top-4 z-40 shadow-xl dark:shadow-2xl dark:shadow-black/50">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-400 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
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
              onClick={() => fetchVendors(pagination.current_page, pagination.per_page, searchTerm)}
              className="p-3 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/10 hover:border-violet-500/30 hover:text-violet-600 dark:hover:text-violet-400 transition-colors shadow-sm dark:shadow-none"
              title="Refresh"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading && !vendors.length ? (
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
              {vendors.map((vendor) => (
                <motion.div
                  layout
                  variants={itemVariants}
                  key={vendor.id}
                  className="group relative bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-violet-900/10 hover:border-violet-500/30 shadow-sm dark:shadow-none"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-slate-800 border border-white/5 overflow-hidden flex items-center justify-center shrink-0">
                          {vendor.image ? (
                            <img src={`${APP_URL}/${vendor.image}`} alt={vendor.name} className="w-full h-full object-cover" />
                          ) : (
                            <Store size={24} className="text-violet-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg leading-tight group-hover:text-violet-400 transition-colors truncate max-w-[150px]">
                            {vendor.name}
                          </h3>
                          <p className="text-sm text-slate-400 truncate max-w-[150px]">{vendor.shop_name}</p>
                        </div>
                      </div>

                      <div className="relative action-menu-container">
                        <button
                          onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === vendor.id ? null : vendor.id); }}
                          className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                          <MoreVertical size={20} />
                        </button>

                        <AnimatePresence>
                          {actionMenu === vendor.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: 10, x: -50 }}
                              animate={{ opacity: 1, scale: 1, y: 0, x: -100 }}
                              exit={{ opacity: 0, scale: 0.9, y: 10, x: -50 }}
                              className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-2xl py-2 z-50 backdrop-blur-xl"
                            >
                              <button onClick={() => openModal(vendor)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-violet-400 transition-colors">
                                <Edit size={16} /> Edit Details
                              </button>
                              <button onClick={() => toggleStatus(vendor)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-violet-400 transition-colors">
                                {vendor.status === 'active' ? <EyeOff size={16} /> : <Eye size={16} />}
                                {vendor.status === 'active' ? 'Deactivate' : 'Activate'}
                              </button>
                              <div className="my-1 border-t border-white/5"></div>
                              <button onClick={() => handleDelete(vendor.id)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors">
                                <Trash2 size={16} /> Delete
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      {vendor.email && (
                        <div className="flex items-center gap-3 text-sm text-slate-300 bg-white/5 p-2 rounded-lg">
                          <Mail size={16} className="text-violet-400 shrink-0" />
                          <span className="truncate">{vendor.email}</span>
                        </div>
                      )}
                      {vendor.contact && (
                        <div className="flex items-center gap-3 text-sm text-slate-300 bg-white/5 p-2 rounded-lg">
                          <Phone size={16} className="text-violet-400 shrink-0" />
                          <span>{vendor.contact}</span>
                        </div>
                      )}
                      {vendor.address && (
                        <div className="flex items-start gap-3 text-sm text-slate-300 bg-white/5 p-2 rounded-lg">
                          <MapPin size={16} className="text-violet-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{vendor.address}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${vendor.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                        }`}>
                        {vendor.status}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && vendors.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed">
            <div className="p-6 bg-slate-900 rounded-full mb-4">
              <Store size={48} className="text-slate-600" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No vendors found</h3>
            <p className="text-slate-400 max-w-md text-center mb-8">
              {searchTerm ? "Try different keywords." : "Start adding your trusted suppliers."}
            </p>
            <button
              onClick={() => { searchTerm ? setSearchTerm('') : openModal(); }}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-violet-900/20"
            >
              {searchTerm ? 'Clear Search' : 'Add First Vendor'}
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
                          ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
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
              className="relative w-full max-w-2xl bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-400 to-purple-600" />

              <form onSubmit={handleSubmit}>
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900 sticky top-0 z-10">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {editingVendor ? 'Edit Vendor' : 'New Vendor'}
                    </h2>
                    <p className="text-slate-400 text-sm">
                      Configure vendor details.
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Image</label>
                      <div
                        onClick={() => document.getElementById('vm-upload').click()}
                        className="border-2 border-dashed border-white/10 rounded-xl p-4 h-32 flex items-center justify-center cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/5 transition-all text-center group"
                      >
                        <input type="file" id="vm-upload" hidden accept="image/*" onChange={handleImageChange} />
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" className="h-full object-contain rounded-lg" />
                        ) : (
                          <div className="space-y-2">
                            <div className="p-2 bg-slate-800 rounded-full w-fit mx-auto group-hover:bg-violet-500/20 transition-colors">
                              <Upload size={18} className="text-slate-400 group-hover:text-violet-400" />
                            </div>
                            <p className="text-xs text-slate-500">Upload Image</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Vendor Name"
                          className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-violet-500/50 outline-none transition-all"
                        />
                        {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name[0]}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Shop Name *</label>
                        <input
                          type="text"
                          name="shop_name"
                          value={formData.shop_name}
                          onChange={handleInputChange}
                          placeholder="Shop Name"
                          className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-violet-500/50 outline-none transition-all"
                        />
                        {errors.shop_name && <p className="text-rose-400 text-xs mt-1">{errors.shop_name[0]}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="vendor@example.com"
                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-violet-500/50 outline-none transition-all"
                      />
                      {errors.email && <p className="text-rose-400 text-xs mt-1">{errors.email[0]}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Contact</label>
                      <input
                        type="text"
                        name="contact"
                        value={formData.contact}
                        onChange={handleInputChange}
                        placeholder="+1 234 567 890"
                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-violet-500/50 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows="2"
                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-violet-500/50 outline-none transition-all resize-none"
                      placeholder="Full Address"
                    />
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

                <div className="p-6 border-t border-white/5 bg-slate-900/50 flex justify-end gap-3 sticky bottom-0 z-10">
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
                    className="px-8 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-violet-900/20 disabled:opacity-50 flex items-center gap-2 transition-all transform active:scale-95"
                  >
                    {operationLoading === 'saving' ? <RefreshCw size={18} className="animate-spin" /> : (editingVendor ? <Check size={18} /> : <Plus size={18} />)}
                    {editingVendor ? 'Save Changes' : 'Create Vendor'}
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

export default VendorManagement;