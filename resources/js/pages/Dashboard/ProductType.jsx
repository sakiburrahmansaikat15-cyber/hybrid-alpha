import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Check,
  AlertCircle,
  MoreVertical,
  Eye,
  EyeOff,
  ChevronDown,
  Tag,
  Activity,
  Calendar,
  Shield,
  Loader
} from 'lucide-react';

const API_URL = '/api/product-type';

const ProductTypesManager = () => {
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    status: 'active'
  });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
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
      setErrors({ _general: error.response.data.message });
    } else {
      showNotification(defaultMessage || 'Something went wrong', 'error');
    }
  }, [showNotification]);

  const fetchProductTypes = useCallback(async (page = 1, limit = pagination.per_page) => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL, {
        params: { page, limit }
      });

      const res = response.data;
      setProductTypes(res.data || []);
      setPagination({
        current_page: res.page || 1,
        last_page: res.totalPages || 1,
        per_page: res.perPage || limit,
        total: res.totalItems || 0
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch product types');
      setProductTypes([]);
    } finally {
      setLoading(false);
    }
  }, [handleApiError, pagination.per_page]);

  const searchProductTypes = useCallback(async (keyword) => {
    if (!keyword.trim()) {
      fetchProductTypes(pagination.current_page);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/search`, {
        params: { keyword }
      });

      const res = response.data;
      setProductTypes(res.data || []);
      setPagination({
        current_page: 1,
        last_page: 1,
        per_page: res.data?.length || 0,
        total: res.data?.length || 0
      });
    } catch (error) {
      handleApiError(error, 'Search failed');
      setProductTypes([]);
    } finally {
      setLoading(false);
    }
  }, [fetchProductTypes]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchProductTypes(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, searchProductTypes]);

  useEffect(() => {
    fetchProductTypes(1, 10);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page || searchTerm) return;
    fetchProductTypes(newPage);
  };

  const handleLimitChange = (newLimit) => {
    const limit = parseInt(newLimit);
    setPagination(prev => ({ ...prev, per_page: limit, current_page: 1 }));
    fetchProductTypes(1, limit);
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
        status: type.status === 'active' || type.status === true ? 'active' : 'inactive'
      });
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

  const handleStatusChange = (status) => {
    setFormData(prev => ({ ...prev, status }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');
    setErrors({});

    const submitData = new FormData();
    submitData.append('name', formData.name.trim());
    submitData.append('status', formData.status);

    try {
      let response;
      if (editingType) {
        submitData.append('_method', 'POST');
        response = await axios.post(`${API_URL}/${editingType.id}`, submitData);
      } else {
        response = await axios.post(API_URL, submitData);
      }

      showNotification(editingType ? 'Product type updated!' : 'Product type created!');
      searchTerm ? searchProductTypes(searchTerm) : fetchProductTypes(pagination.current_page);
      closeModal();
    } catch (error) {
      handleApiError(error, 'Failed to save product type');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product type permanently?')) return;

    setOperationLoading(`delete-${id}`);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Product type deleted successfully');
      if (productTypes.length === 1 && pagination.current_page > 1) {
        fetchProductTypes(pagination.current_page - 1);
      } else {
        searchTerm ? searchProductTypes(searchTerm) : fetchProductTypes(pagination.current_page);
      }
    } catch (error) {
      handleApiError(error, 'Delete failed');
    } finally {
      setOperationLoading(null);
    }
  };

  const toggleStatus = async (type) => {
    const newStatus = type.status === 'active' ? 'inactive' : 'active';
    setOperationLoading(`status-${type.id}`);

    const form = new FormData();
    form.append('name', type.name);
    form.append('status', newStatus);
    form.append('_method', 'POST');

    try {
      await axios.post(`${API_URL}/${type.id}`, form);
      showNotification(`Product type ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      searchTerm ? searchProductTypes(searchTerm) : fetchProductTypes(pagination.current_page);
    } catch (error) {
      handleApiError(error, 'Failed to update status');
    } finally {
      setOperationLoading(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const stats = {
    total: pagination.total,
    active: productTypes.filter(t => t.status === 'active').length,
    inactive: productTypes.filter(t => t.status === 'inactive').length
  };

  if (loading && productTypes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <div className="h-8 bg-gray-800 rounded w-64 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-800 rounded w-48 animate-pulse"></div>
              </div>
              <div className="h-12 bg-gray-800 rounded-xl w-40 animate-pulse"></div>
            </div>
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
                <div className="h-6 bg-gray-700 rounded"></div>
                <div className="h-20 bg-gray-700/50 rounded-lg"></div>
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
            className={`fixed top-4 right-4 z-50 max-w-sm ${
              notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
            } text-white px-6 py-3 rounded-xl shadow-2xl backdrop-blur-sm`}
          >
            <div className="flex items-center gap-3">
              <Check size={20} />
              <span className="font-medium">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                Product Types Management
              </h1>
              <p className="text-gray-400 mt-2 text-lg">Manage product categories and types</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openModal()}
              className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-emerald-500/25 flex items-center gap-3"
            >
              <Plus size={22} /> Add New Type
            </motion.button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40 hover:border-emerald-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Types</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-cyan-500/10 rounded-xl">
                <Tag size={24} className="text-cyan-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40 hover:border-emerald-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Active Types</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.active}</p>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                <Activity size={24} className="text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40 hover:border-emerald-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Inactive Types</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.inactive}</p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-xl">
                <EyeOff size={24} className="text-red-400" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/30">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search product types by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent backdrop-blur-sm transition-all duration-200"
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
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {productTypes.map((type) => (
            <motion.div
              key={type.id}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group bg-gray-800/30 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700/30 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Tag size={20} className="text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-emerald-100 transition-colors truncate max-w-[160px]">
                      {type.name}
                    </h3>
                  </div>

                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Simple toggle menu
                      }}
                      className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors duration-200 opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <button
                    onClick={() => toggleStatus(type)}
                    disabled={operationLoading === `status-${type.id}`}
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                      type.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                    }`}
                  >
                    {operationLoading === `status-${type.id}` ? <Loader size={12} className="animate-spin" /> : null}
                    <div className={`w-2 h-2 rounded-full ${type.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                    {type.status === 'active' ? 'Active' : 'Inactive'}
                  </button>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Shield size={16} />
                    <span>ID: #{type.id}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar size={16} />
                    <span>Created: {formatDate(type.created_at)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-700/30">
                  <span className="text-xs text-gray-500">
                    Updated: {formatDate(type.updated_at)}
                  </span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => openModal(type)}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all duration-200"
                    >
                      <Edit size={14} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(type.id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all duration-200"
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {!searchTerm && pagination.last_page > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-6 border-t border-gray-700/30">
            <div className="text-sm text-gray-400">
              Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} entries
            </div>
            <div className="flex gap-2">
              <button onClick={() => handlePageChange(pagination.current_page - 1)} disabled={pagination.current_page === 1}
                className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${pagination.current_page === 1 ? 'bg-gray-800 border-gray-700 text-gray-500' : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'}`}>
                <ChevronDown size={16} className="rotate-90" /> Previous
              </button>

              {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pagination.last_page || Math.abs(p - pagination.current_page) <= 2)
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && p - arr[idx - 1] > 1 && <span className="px-3 py-2 text-gray-400">...</span>}
                    <button onClick={() => handlePageChange(p)}
                      className={`px-4 py-2 rounded-xl border ${pagination.current_page === p ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'}`}>
                      {p}
                    </button>
                  </React.Fragment>
                ))}

              <button onClick={() => handlePageChange(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page}
                className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${pagination.current_page === pagination.last_page ? 'bg-gray-800 border-gray-700 text-gray-500' : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'}`}>
                Next <ChevronDown size={16} className="-rotate-90" />
              </button>
            </div>
          </div>
        )}

        {productTypes.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-800/40 rounded-full flex items-center justify-center border border-gray-700/40">
                <Tag size={48} className="text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {searchTerm ? 'No product types found' : 'No product types yet'}
              </h3>
              <p className="text-gray-400 text-lg mb-8">
                {searchTerm ? "Try adjusting your search" : "Get started by creating your first product type."}
              </p>
              {!searchTerm && (
                <button onClick={() => openModal()}
                  className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg flex items-center gap-3 mx-auto">
                  <Plus size={20} /> Create Your First Type
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={closeModal}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-700/50 shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                    {editingType ? 'Edit Product Type' : 'Create New Product Type'}
                  </h2>
                  <button onClick={closeModal} className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-700/50">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">Type Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-emerald-500/50 text-white placeholder-gray-400 transition-all"
                      placeholder="e.g., Electronics, Clothing"
                    />
                    {errors.name && <p className="text-red-400 text-sm mt-2">{errors.name[0]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">Status</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['active', 'inactive'].map(st => (
                        <label key={st}
                          onClick={() => handleStatusChange(st)}
                          className={`flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            formData.status === st
                              ? st === 'active' ? 'border-emerald-500 bg-emerald-500/10' : 'border-red-500 bg-red-500/10'
                              : 'border-gray-600 hover:border-gray-500'
                          }`}>
                          <div className="text-center">
                            {st === 'active' ? <Activity size={20} className="mx-auto mb-2 text-emerald-400" /> : <EyeOff size={20} className="mx-auto mb-2 text-red-400" />}
                            <span className={`font-medium capitalize ${formData.status === st ? st === 'active' ? 'text-emerald-400' : 'text-red-400' : 'text-gray-400'}`}>
                              {st}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-700/50">
                    <button type="button" onClick={closeModal}
                      className="px-6 py-3 text-sm font-medium text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-600/50 rounded-xl border border-gray-600/50">
                      Cancel
                    </button>
                    <button type="submit"
                      className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2">
                      {operationLoading === 'saving' ? <Loader size={20} className="animate-spin" /> : <Check size={20} />}
                      {editingType ? 'Update Type' : 'Create Type'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductTypesManager;