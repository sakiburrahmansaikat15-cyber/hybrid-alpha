import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Check, Eye, EyeOff,
  MoreVertical, Warehouse as WarehouseIcon, MapPin, Phone, Mail,
  Globe, Shield, Calendar, Layers, Filter, RefreshCw, ChevronLeft, ChevronRight, Loader, Star
} from 'lucide-react';

const API_URL = '/api/warehouses';

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

const WarehouseManagement = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMenu, setActionMenu] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState({
    name: '', code: '', type: '', contact_person: '', phone: '', email: '',
    address: '', country: '', state: '', city: '', capacity: '',
    is_default: false, status: 'active'
  });

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

  const fetchWarehouses = useCallback(async (page = 1, limit = 9, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await axios.get(API_URL, { params });
      const data = response.data.pagination || response.data;
      const itemList = data.data || [];

      setWarehouses(itemList);
      setPagination({
        current_page: data.current_page || 1,
        per_page: data.per_page || limit,
        total_items: data.total_items || data.total || itemList.length,
        total_pages: data.total_pages || data.last_page || 1
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch warehouses');
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    fetchWarehouses(1, 9);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWarehouses(1, pagination.per_page, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchWarehouses]);

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
    fetchWarehouses(newPage, pagination.per_page, searchTerm);
  };

  const handleLimitChange = (newLimit) => {
    const limit = parseInt(newLimit);
    setPagination(prev => ({ ...prev, per_page: limit, current_page: 1 }));
    fetchWarehouses(1, limit, searchTerm);
  };

  const resetForm = () => {
    setFormData({
      name: '', code: '', type: '', contact_person: '', phone: '', email: '',
      address: '', country: '', state: '', city: '', capacity: '',
      is_default: false, status: 'active'
    });
    setEditingWarehouse(null);
    setErrors({});
  };

  const openModal = (warehouse = null) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setFormData({
        name: warehouse.name || '',
        code: warehouse.code || '',
        type: warehouse.type || '',
        contact_person: warehouse.contact_person || '',
        phone: warehouse.phone || '',
        email: warehouse.email || '',
        address: warehouse.address || '',
        country: warehouse.country || '',
        state: warehouse.state || '',
        city: warehouse.city || '',
        capacity: warehouse.capacity || '',
        is_default: warehouse.is_default ? true : false,
        status: warehouse.status || 'active'
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');
    setErrors({});

    const data = { ...formData };
    data.capacity = data.capacity ? parseInt(data.capacity) : null;
    data.is_default = data.is_default ? 1 : 0;

    try {
      if (editingWarehouse) {
        await axios.put(`${API_URL}/${editingWarehouse.id}`, data);
      } else {
        await axios.post(API_URL, data);
      }
      showNotification(editingWarehouse ? 'Warehouse updated!' : 'Warehouse created!');
      fetchWarehouses(pagination.current_page, pagination.per_page, searchTerm);
      closeModal();
    } catch (error) {
      handleApiError(error, 'Failed to save');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this warehouse?')) return;
    setOperationLoading(`delete-${id}`);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Warehouse deleted');
      if (warehouses.length === 1 && pagination.current_page > 1) {
        fetchWarehouses(pagination.current_page - 1, pagination.per_page, searchTerm);
      } else {
        fetchWarehouses(pagination.current_page, pagination.per_page, searchTerm);
      }
    } catch (error) {
      handleApiError(error, 'Failed to delete');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  const toggleStatus = async (warehouse) => {
    const newStatus = warehouse.status === 'active' ? 'inactive' : 'active';
    setOperationLoading(`status-${warehouse.id}`);
    try {
      await axios.put(`${API_URL}/${warehouse.id}`, { status: newStatus });
      showNotification(`Warehouse ${newStatus}`);
      fetchWarehouses(pagination.current_page, pagination.per_page, searchTerm);
    } catch (error) {
      handleApiError(error, 'Failed to update status');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  const stats = {
    total: pagination.total_items,
    active: warehouses.filter(w => w.status === 'active').length,
    inactive: warehouses.filter(w => w.status !== 'active').length
  };

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

  const filteredWarehouses = warehouses.filter(w =>
    statusFilter === 'all' || w.status === statusFilter
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-yellow-500/30">
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
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-600">
                Warehouses
              </span>
            </h1>
            <p className="text-slate-400 text-lg font-light">
              Manage your inventory storage locations
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openModal()}
            className="group relative px-6 py-3 bg-gradient-to-r from-yellow-600 to-amber-600 rounded-xl font-semibold text-white shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 transition-all flex items-center gap-2 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <Plus size={20} className="relative z-10" />
            <span className="relative z-10">Add Warehouse</span>
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Locations', value: stats.total, icon: WarehouseIcon, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-yellow-400 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search warehouses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 outline-none transition-all placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-3 rounded-xl border border-white/10">
              <Filter size={16} className="text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none text-sm text-slate-300 focus:ring-0 cursor-pointer outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-3 rounded-xl border border-white/10">
              <Layers size={16} className="text-slate-400" />
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
              onClick={() => fetchWarehouses(pagination.current_page, pagination.per_page, searchTerm)}
              className="p-3 bg-slate-900/50 rounded-xl border border-white/10 hover:border-yellow-500/30 hover:text-yellow-400 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading && !warehouses.length ? (
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
              {filteredWarehouses.map((warehouse) => (
                <motion.div
                  layout
                  variants={itemVariants}
                  key={warehouse.id}
                  className={`group relative bg-slate-900/40 border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-900/10 ${warehouse.is_default ? 'border-yellow-500/50 shadow-yellow-500/10' : 'border-white/10 hover:border-yellow-500/30'}`}
                >
                  {warehouse.is_default && (
                    <div className="absolute top-0 right-0 bg-yellow-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-bl-xl z-10 flex items-center gap-1 shadow-lg">
                      <Star size={12} fill="currentColor" /> Default
                    </div>
                  )}

                  <div className="p-6">
                    {/* Header Section */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-slate-800 rounded-xl border border-white/5 group-hover:border-yellow-500/30 transition-colors">
                        <WarehouseIcon size={24} className="text-yellow-400" />
                      </div>

                      <div className="relative action-menu-container">
                        <button
                          onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === warehouse.id ? null : warehouse.id); }}
                          className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                          <MoreVertical size={20} />
                        </button>

                        <AnimatePresence>
                          {actionMenu === warehouse.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: 10, x: -50 }}
                              animate={{ opacity: 1, scale: 1, y: 0, x: -100 }}
                              exit={{ opacity: 0, scale: 0.9, y: 10, x: -50 }}
                              className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-2xl py-2 z-50 backdrop-blur-xl"
                            >
                              <button onClick={() => openModal(warehouse)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-yellow-400 transition-colors">
                                <Edit size={16} /> Edit Details
                              </button>
                              <button onClick={() => toggleStatus(warehouse)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-yellow-400 transition-colors">
                                {warehouse.status === 'active' ? <EyeOff size={16} /> : <Eye size={16} />}
                                {warehouse.status === 'active' ? 'Deactivate' : 'Activate'}
                              </button>
                              <div className="my-1 border-t border-white/5"></div>
                              <button onClick={() => handleDelete(warehouse.id)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors">
                                <Trash2 size={16} /> Delete
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Main Info */}
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-white group-hover:text-yellow-400 transition-colors mb-1 truncate">
                        {warehouse.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs font-mono text-slate-400">{warehouse.code}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${warehouse.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                          }`}>
                          {warehouse.status}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-slate-300">
                        {warehouse.address && (
                          <div className="flex items-start gap-2">
                            <MapPin size={14} className="mt-1 text-slate-500 shrink-0" />
                            <span className="line-clamp-2">{warehouse.address}, {warehouse.city}, {warehouse.country}</span>
                          </div>
                        )}
                        {warehouse.contact_person && (
                          <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg">
                            <div className="w-1 h-8 bg-yellow-500/50 rounded-full" />
                            <div className="overflow-hidden">
                              <p className="text-xs text-slate-400">Contact Person</p>
                              <p className="font-medium truncate">{warehouse.contact_person}</p>
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {warehouse.phone && (
                            <div className="flex items-center gap-2 text-xs truncate" title={warehouse.phone}>
                              <Phone size={12} className="text-slate-500" />
                              {warehouse.phone}
                            </div>
                          )}
                          {warehouse.email && (
                            <div className="flex items-center gap-2 text-xs truncate" title={warehouse.email}>
                              <Mail size={12} className="text-slate-500" />
                              {warehouse.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Globe size={12} /> {warehouse.type || 'General'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {formatDate(warehouse.created_at)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && warehouses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed">
            <div className="p-6 bg-slate-900 rounded-full mb-4">
              <WarehouseIcon size={48} className="text-slate-600" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No warehouses found</h3>
            <p className="text-slate-400 max-w-md text-center mb-8">
              {searchTerm ? "Try adjusting your search." : "Establish your first storage location."}
            </p>
            <button
              onClick={() => { searchTerm ? setSearchTerm('') : openModal(); }}
              className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-yellow-900/20"
            >
              {searchTerm ? 'Clear Search' : 'Add Warehouse'}
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
                            ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/30'
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
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-amber-600" />

              <form onSubmit={handleSubmit}>
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900 sticky top-0 z-10">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {editingWarehouse ? 'Edit Warehouse' : 'New Warehouse'}
                    </h2>
                    <p className="text-slate-400 text-sm">
                      Configure location details.
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
                      <label className="text-sm font-medium text-slate-300">Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Main Warehouse"
                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-yellow-500/50 outline-none transition-all"
                      />
                      {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name[0]}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Code *</label>
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        placeholder="WH-001"
                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-yellow-500/50 outline-none transition-all font-mono"
                      />
                      {errors.code && <p className="text-rose-400 text-xs mt-1">{errors.code[0]}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Type</label>
                      <input
                        type="text"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        placeholder="e.g. Cold Storage"
                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-yellow-500/50 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Capacity</label>
                      <input
                        type="number"
                        name="capacity"
                        value={formData.capacity}
                        onChange={handleChange}
                        placeholder="Max units"
                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-yellow-500/50 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows="2"
                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-yellow-500/50 outline-none transition-all resize-none"
                      placeholder="Street Address"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">City</label>
                      <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-yellow-500/50 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">State</label>
                      <input type="text" name="state" value={formData.state} onChange={handleChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-yellow-500/50 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Country</label>
                      <input type="text" name="country" value={formData.country} onChange={handleChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-yellow-500/50 outline-none" />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5 space-y-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-400">Contact Person</label>
                        <input type="text" name="contact_person" value={formData.contact_person} onChange={handleChange} className="w-full bg-slate-900 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:ring-1 focus:ring-yellow-500/50 outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400">Phone</label>
                        <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-slate-900 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:ring-1 focus:ring-yellow-500/50 outline-none" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs text-slate-400">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-900 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:ring-1 focus:ring-yellow-500/50 outline-none" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 border border-yellow-500/20 bg-yellow-500/5 rounded-xl">
                    <input
                      type="checkbox"
                      name="is_default"
                      id="is_default"
                      checked={formData.is_default}
                      onChange={handleChange}
                      className="w-5 h-5 rounded border-gray-600 text-yellow-500 focus:ring-yellow-500 bg-slate-700"
                    />
                    <label htmlFor="is_default" className="text-sm font-medium text-yellow-200 cursor-pointer select-none">
                      Set as Default Warehouse
                    </label>
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
                    className="px-8 py-2.5 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white rounded-xl font-bold shadow-lg shadow-yellow-900/20 disabled:opacity-50 flex items-center gap-2 transition-all transform active:scale-95"
                  >
                    {operationLoading === 'saving' && <Loader size={18} className="animate-spin" />}
                    {editingWarehouse ? 'Save Changes' : 'Create Warehouse'}
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

export default WarehouseManagement;
