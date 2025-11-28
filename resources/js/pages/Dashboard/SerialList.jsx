import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Check, MoreVertical,
  Eye, EyeOff, Image as ImageIcon, Package, Upload,
  ChevronLeft, ChevronRight, Loader, Hash, Palette, StickyNote
} from 'lucide-react';

const API_URL = 'http://localhost:8000/api/serial-list';

const SerialList = () => {
  const [serials, setSerials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSerial, setEditingSerial] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionMenu, setActionMenu] = useState(null);
  const [formData, setFormData] = useState({
    stock_id: '',
    sku: '',
    barcode: '',
    color: '',
    notes: '',
    image: null,
    status: 'active'
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
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

  const fetchSerials = useCallback(async (page = 1, limit = 10, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await axios.get(API_URL, { params });
      const paginated = response.data.pagination;

      setSerials(paginated.data || []);
      setPagination({
        current_page: paginated.current_page,
        per_page: paginated.per_page,
        total_items: paginated.total_items,
        total_pages: paginated.total_pages
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch serials');
      setSerials([]);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSerials(1, pagination.per_page, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchSerials]);

  useEffect(() => {
    fetchSerials();
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.total_pages || newPage === pagination.current_page) return;
    fetchSerials(newPage, pagination.per_page, searchTerm);
  };

  const handleLimitChange = (newLimit) => {
    const limit = parseInt(newLimit);
    setPagination(prev => ({ ...prev, per_page: limit, current_page: 1 }));
    fetchSerials(1, limit, searchTerm);
  };

  const resetForm = () => {
    setFormData({
      stock_id: '', sku: '', barcode: '', color: '', notes: '', image: null, status: 'active'
    });
    setImagePreview(null);
    setEditingSerial(null);
    setErrors({});
  };

  const openModal = (serial = null) => {
    if (serial) {
      setEditingSerial(serial);
      setFormData({
        stock_id: serial.stock_id || '',
        sku: serial.sku || '',
        barcode: serial.barcode || '',
        color: serial.color || '',
        notes: serial.notes || '',
        image: null,
        status: serial.status || 'active'
      });
      setImagePreview(serial.image ? `http://localhost:8000/${serial.image}` : null);
    } else {
      resetForm();
    }
    setShowModal(true);
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
      setErrors(prev => ({ ...prev, image: 'Only JPEG, PNG, WebP allowed' }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'Image must be less than 2MB' }));
      return;
    }

    setFormData(prev => ({ ...prev, image: file }));
    setImagePreview(URL.createObjectURL(file));
    if (errors.image) setErrors(prev => ({ ...prev, image: undefined }));
  };

  // FULLY FIXED: CREATE & UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');
    setErrors({});

    try {
      const submitData = new FormData();
      submitData.append('stock_id', formData.stock_id);
      submitData.append('sku', formData.sku);
      if (formData.barcode) submitData.append('barcode', formData.barcode);
      if (formData.color) submitData.append('color', formData.color);
      if (formData.notes) submitData.append('notes', formData.notes);
      submitData.append('status', formData.status);
      if (formData.image instanceof File) {
        submitData.append('image', formData.image);
      }

      let response;
      if (editingSerial) {
        submitData.append('_method', 'POST');
        response = await axios.post(`${API_URL}/${editingSerial.id}`, submitData);
      } else {
        response = await axios.post(API_URL, submitData);
      }

      showNotification(response.data.message || `Serial ${editingSerial ? 'updated' : 'created'} successfully!`);
      fetchSerials(pagination.current_page, pagination.per_page, searchTerm);
      closeModal();
    } catch (error) {
      console.error('Submit error:', error.response || error);
      handleApiError(error, 'Failed to save serial');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this serial permanently?')) return;
    setOperationLoading(`delete-${id}`);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Serial deleted successfully');
      if (serials.length === 1 && pagination.current_page > 1) {
        fetchSerials(pagination.current_page - 1, pagination.per_page, searchTerm);
      } else {
        fetchSerials(pagination.current_page, pagination.per_page, searchTerm);
      }
    } catch (error) {
      handleApiError(error, 'Delete failed');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  const toggleStatus = async (serial) => {
    const newStatus = serial.status === 'active' ? 'inactive' : 'active';
    setOperationLoading(`status-${serial.id}`);
    try {
      const form = new FormData();
      form.append('status', newStatus);
      form.append('_method', 'PUT');

      await axios.post(`${API_URL}/${serial.id}`, form);

      showNotification(`Serial ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchSerials(pagination.current_page, pagination.per_page, searchTerm);
    } catch (error) {
      handleApiError(error, 'Failed to update status');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  const stats = {
    total: pagination.total_items,
    active: serials.filter(s => s.status === 'active').length,
    inactive: serials.filter(s => s.status === 'inactive').length
  };

  const getImageUrl = (path) => path ? `http://localhost:8000/${path}` : null;

  useEffect(() => {
    const handler = () => setActionMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  if (loading && serials.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex justify-between">
            <div className="h-10 bg-gray-800 rounded w-64 animate-pulse"></div>
            <div className="h-12 bg-gray-800 rounded-xl w-40 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-800/40 rounded-2xl p-6 animate-pulse">
                <div className="h-12 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-800/30 rounded-2xl p-6 animate-pulse space-y-4">
                <div className="h-32 bg-gray-700/50 rounded-lg"></div>
                <div className="h-8 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 py-8">
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl ${notification.type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white font-medium`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
              Serial List Management
            </h1>
            <p className="text-gray-400 mt-2">Manage product serial numbers and tracking details</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-6 py-3 rounded-xl font-bold flex items-center gap-3 shadow-lg transition-all"
          >
            <Plus size={22} /> Add New Serial
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Serials', value: stats.total, icon: Package, color: 'blue' },
            { label: 'Active', value: stats.active, icon: Eye, color: 'green' },
            { label: 'Inactive', value: stats.inactive, icon: EyeOff, color: 'red' },
          ].map((s, i) => (
            <div key={i} className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{s.label}</p>
                  <p className="text-3xl font-bold mt-1">{s.value}</p>
                </div>
                <div className={`p-3 bg-${s.color}-500/10 rounded-xl`}>
                  <s.icon size={28} className={`text-${s.color}-400`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/30">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by color..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2 bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3">
                <span className="text-sm text-gray-400">Show:</span>
                <select
                  value={pagination.per_page}
                  onChange={(e) => handleLimitChange(e.target.value)}
                  className="bg-transparent border-0 text-white text-sm focus:ring-0 focus:outline-none"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm min-w-[140px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Serials Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { staggerChildren: 0.1 } }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8"
        >
          {serials
            .filter(s => filterStatus === 'all' || s.status === filterStatus)
            .map(serial => (
              <motion.div
                key={serial.id}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 hover:border-blue-500/50 transition-all overflow-hidden relative"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Package size={20} className="text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{serial.sku}</h3>
                        <p className="text-sm text-gray-400">Stock ID: #{serial.stock_id}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === serial.id ? null : serial.id); }}
                      className="p-2 hover:bg-gray-700/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>

                  <div className="mb-4">
                    {serial.image ? (
                      <img src={getImageUrl(serial.image)} alt={serial.sku} className="w-full h-32 object-cover rounded-lg border border-gray-600" />
                    ) : (
                      <div className="w-full h-32 bg-gray-700/50 rounded-lg flex items-center justify-center">
                        <ImageIcon size={32} className="text-gray-500" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    {serial.barcode && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Hash size={16} /> {serial.barcode}
                      </div>
                    )}
                    {serial.color && (
                      <div className="flex items-center gap-2">
                        <Palette size={16} className="text-purple-400" /> {serial.color}
                      </div>
                    )}
                    <button
                      onClick={() => toggleStatus(serial)}
                      disabled={operationLoading === `status-${serial.id}`}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${serial.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
                    >
                      {operationLoading === `status-${serial.id}` ? <Loader size={12} className="animate-spin" /> : null}
                      {serial.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  {serial.notes && (
                    <div className="mt-3 p-3 bg-gray-700/30 rounded-lg text-xs text-gray-400 flex items-start gap-2">
                      <StickyNote size={14} className="mt-0.5 flex-shrink-0" />
                      <span>{serial.notes}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700/30">
                    <span className="text-xs text-gray-500">ID: #{serial.id}</span>
                    <div className="flex gap-2">
                      <button onClick={() => openModal(serial)} className="p-2 bg-blue-500/20 hover:bg-blue-500/40 rounded-lg transition-colors">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDelete(serial.id)} className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {actionMenu === serial.id && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-4 top-16 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl py-2 z-50 min-w-[160px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button onClick={() => { openModal(serial); setActionMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-sm">
                        <Edit size={16} /> Edit
                      </button>
                      <button onClick={() => { toggleStatus(serial); setActionMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-sm">
                        {serial.status === 'active' ? <EyeOff size={16} /> : <Eye size={16} />}
                        {serial.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => { handleDelete(serial.id); setActionMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-red-500/20 text-red-400 flex items-center gap-3 text-sm">
                        <Trash2 size={16} /> Delete
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
        </motion.div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center py-6 border-t border-gray-700/30 gap-4">
            <div className="text-sm text-gray-400">
              Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{' '}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total_items)} of {pagination.total_items} serials
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="px-4 py-2 rounded-xl border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-gray-800 transition-colors"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                let pageNum;
                if (pagination.total_pages <= 5) pageNum = i + 1;
                else if (pagination.current_page <= 3) pageNum = i + 1;
                else if (pagination.current_page >= pagination.total_pages - 2) pageNum = pagination.total_pages - 4 + i;
                else pageNum = pagination.current_page - 2 + i;

                return pageNum >= 1 && pageNum <= pagination.total_pages ? (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-4 py-2 rounded-xl border ${pagination.current_page === pageNum ? 'bg-blue-600 border-blue-500' : 'border-gray-600 hover:bg-gray-800'}`}
                  >
                    {pageNum}
                  </button>
                ) : null;
              })}
              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.total_pages}
                className="px-4 py-2 rounded-xl border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-gray-800 transition-colors"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {serials.length === 0 && !loading && (
          <div className="text-center py-20">
            <Package size={64} className="mx-auto text-gray-600 mb-6" />
            <h3 className="text-2xl font-bold mb-3">{searchTerm ? 'No serials found' : 'No serials yet'}</h3>
            <p className="text-gray-400 mb-8">{searchTerm ? 'Try searching with different color' : 'Start by adding your first serial'}</p>
            {!searchTerm && (
              <button onClick={() => openModal()} className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-cyan-700 transition-all">
                <Plus className="inline mr-2" /> Add First Serial
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                  {editingSerial ? 'Edit Serial' : 'Add New Serial'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Stock ID *</label>
                    <input
                      type="text"
                      name="stock_id"
                      value={formData.stock_id}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="e.g., 1001"
                    />
                    {errors.stock_id && <p className="text-red-400 text-sm mt-1">{errors.stock_id[0]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">SKU *</label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="e.g., ABC123"
                    />
                    {errors.sku && <p className="text-red-400 text-sm mt-1">{errors.sku[0]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Barcode</label>
                    <input
                      type="text"
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Optional barcode"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Color</label>
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="e.g., Black, Red"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-2">Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                      placeholder="Additional information..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-3">Status</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['active', 'inactive'].map(st => (
                        <label
                          key={st}
                          onClick={() => setFormData(prev => ({ ...prev, status: st }))}
                          className={`p-4 border-2 rounded-xl text-center cursor-pointer transition-all ${formData.status === st ? (st === 'active' ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10') : 'border-gray-600'}`}
                        >
                          {st === 'active' ? <Eye size={20} className="mx-auto mb-2" /> : <EyeOff size={20} className="mx-auto mb-2" />}
                          <span className="capitalize font-medium">{st}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-3">Product Image</label>
                    <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-blue-500 cursor-pointer transition-colors">
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="serial-img" />
                      <label htmlFor="serial-img" className="cursor-pointer">
                        <Upload size={36} className="mx-auto mb-3 text-gray-400" />
                        <p className="text-sm text-gray-400">Click to upload (Max 2MB)</p>
                      </label>
                    </div>
                    {imagePreview && (
                      <div className="mt-4 relative inline-block">
                        <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg border border-gray-600" />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setFormData(prev => ({ ...prev, image: null }));
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 p-1.5 rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    {errors.image && <p className="text-red-400 text-sm mt-2">{errors.image}</p>}
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-700/50">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={operationLoading === 'saving'}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl font-bold flex items-center gap-3 disabled:opacity-70 transition-all"
                  >
                    {operationLoading === 'saving' ? <Loader size={20} className="animate-spin" /> : <Check size={20} />}
                    {editingSerial ? 'Update Serial' : 'Create Serial'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SerialList;