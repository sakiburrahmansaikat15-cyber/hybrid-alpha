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
  MoreVertical,
  CreditCard, // Perfect icon for payment gateways
  Calendar,
  Loader,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';

const API_URL = 'http://localhost:8000/api/pos/payment-gateways';

const PaymentGateways = () => {
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingGateway, setEditingGateway] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMenu, setActionMenu] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    config: {},
    status: 'active',
  });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total_items: 0,
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
      setErrors({ _general: defaultMessage });
    }
  }, [showNotification]);

  // Fetch payment gateways with server-side search & pagination
  const fetchGateways = useCallback(async (page = 1, perPage = 10, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit: perPage };
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await axios.get(API_URL, { params });
      const res = response.data;

      const gatewayData = res.pagination?.data || [];
      const formattedGateways = gatewayData.map(item => ({
        id: item.id,
        name: item.name,
        config: item.config ? JSON.parse(item.config) : {},
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      setGateways(formattedGateways);
      setPagination({
        current_page: res.pagination.current_page || 1,
        last_page: res.pagination.total_pages || 1,
        per_page: res.pagination.per_page || 10,
        total_items: res.pagination.total_items || 0,
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch payment gateways');
      setGateways([]);
      setPagination({ current_page: 1, last_page: 1, per_page: 10, total_items: 0 });
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGateways(1, pagination.per_page, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchGateways]);

  // Initial load
  useEffect(() => {
    fetchGateways(1, 10);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page) return;
    fetchGateways(newPage, pagination.per_page, searchTerm);
  };

  const handleLimitChange = (newLimit) => {
    const limit = parseInt(newLimit);
    setPagination(prev => ({ ...prev, per_page: limit }));
    fetchGateways(1, limit, searchTerm);
  };

  const resetForm = () => {
    setFormData({ name: '', config: {}, status: 'active' });
    setEditingGateway(null);
    setErrors({});
  };

  const openModal = (gateway = null) => {
    if (gateway) {
      setEditingGateway(gateway);
      setFormData({
        name: gateway.name || '',
        config: gateway.config || {},
        status: gateway.status || 'active',
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
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleConfigChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      config: { ...prev.config, [key]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');
    setErrors({});

    try {
      const submitData = {
        name: formData.name.trim(),
        config: Object.keys(formData.config).length > 0 ? formData.config : null,
        status: formData.status,
      };

      let response;
      if (editingGateway) {
        response = await axios.post(`${API_URL}/${editingGateway.id}`, submitData);
      } else {
        response = await axios.post(API_URL, submitData);
      }

      showNotification(
        response.data.message || `Payment gateway ${editingGateway ? 'updated' : 'created'} successfully!`
      );
      fetchGateways(pagination.current_page, pagination.per_page, searchTerm);
      closeModal();
    } catch (error) {
      handleApiError(error, 'Failed to save payment gateway');
    } finally {
      setOperationLoading(null);
    }
  };

  const toggleStatus = async (gateway) => {
    const newStatus = gateway.status === 'active' ? 'inactive' : 'active';
    setOperationLoading(`status-${gateway.id}`);

    try {
      await axios.post(`${API_URL}/${gateway.id}`, {
        status: newStatus,
      });

      showNotification(`Gateway ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchGateways(pagination.current_page, pagination.per_page, searchTerm);
    } catch (error) {
      handleApiError(error, 'Failed to update status');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment gateway permanently?')) return;
    setOperationLoading(`delete-${id}`);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Payment gateway deleted successfully');

      const remainingItems = pagination.total_items - 1;
      const maxPage = Math.ceil(remainingItems / pagination.per_page);
      const targetPage = pagination.current_page > maxPage ? maxPage : pagination.current_page;

      fetchGateways(targetPage || 1, pagination.per_page, searchTerm);
    } catch (error) {
      handleApiError(error, 'Delete failed');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

  useEffect(() => {
    const handler = () => setActionMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  if (loading && gateways.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex justify-between">
            <div className="h-10 bg-gray-800 rounded w-64 animate-pulse"></div>
            <div className="h-12 bg-gray-800 rounded-xl w-40 animate-pulse"></div>
          </div>
          <div className="bg-gray-800/30 rounded-2xl p-6 mb-8 animate-pulse space-y-4">
            <div className="h-12 bg-gray-700 rounded"></div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-800/30 rounded-2xl p-6 animate-pulse space-y-4">
                <div className="h-8 bg-gray-700 rounded"></div>
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
              Payment Gateways Management
            </h1>
            <p className="text-gray-400 mt-2">Configure payment methods for your POS system</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-6 py-3 rounded-xl font-bold flex items-center gap-3 shadow-lg"
          >
            <Plus size={22} /> Add New Gateway
          </button>
        </div>

        {/* Search + Per Page */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/30">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search gateways by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none"
              />
            </div>
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

        {/* Gateways Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { staggerChildren: 0.1 } }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8"
        >
          {gateways.map(gateway => (
            <motion.div
              key={gateway.id}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 hover:border-blue-500/50 transition-all overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <CreditCard size={20} className="text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold">{gateway.name}</h3>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === gateway.id ? null : gateway.id); }}
                    className="p-2 hover:bg-gray-700/50 rounded-lg"
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>

                <div className="mb-4">
                  <button
                    onClick={() => toggleStatus(gateway)}
                    disabled={operationLoading === `status-${gateway.id}`}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-4 ${
                      gateway.status === 'active'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {operationLoading === `status-${gateway.id}` ? (
                      <Loader size={14} className="animate-spin" />
                    ) : gateway.status === 'active' ? (
                      <Eye size={16} />
                    ) : (
                      <EyeOff size={16} />
                    )}
                    {gateway.status === 'active' ? 'Active' : 'Inactive'}
                  </button>
                </div>

                <div className="bg-gray-700/30 rounded-lg p-3 min-h-[80px]">
                  <p className="text-xs text-gray-500 mb-1">Config Keys:</p>
                  <p className="text-sm text-gray-300">
                    {Object.keys(gateway.config).length > 0
                      ? Object.keys(gateway.config).join(', ')
                      : 'No configuration set'}
                  </p>
                </div>

                <div className="space-y-2 text-sm text-gray-400 mt-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} /> Created: {formatDate(gateway.created_at)}
                  </div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700/30">
                  <span className="text-xs text-gray-500">Updated: {formatDate(gateway.updated_at)}</span>
                  <div className="flex gap-2">
                    <button onClick={() => openModal(gateway)} className="p-2 bg-blue-500/20 hover:bg-blue-500/40 rounded-lg">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDelete(gateway.id)} className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {actionMenu === gateway.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-4 top-20 bg-gray-800 border border-gray-600 rounded-xl shadow-xl py-2 z-10 min-w-[180px]"
                  >
                    <button onClick={() => { openModal(gateway); setActionMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-sm">
                      <Edit size={16} /> Edit
                    </button>
                    <button onClick={() => toggleStatus(gateway)} className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-sm">
                      {gateway.status === 'active' ? <EyeOff size={16} /> : <Eye size={16} />}
                      {gateway.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => handleDelete(gateway.id)} className="w-full text-left px-4 py-2 hover:bg-red-500/20 text-red-400 flex items-center gap-3 text-sm">
                      <Trash2 size={16} /> Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="flex justify-between items-center py-6 border-t border-gray-700/30">
            <div className="text-sm text-gray-400">
              Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{' '}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total_items)} of {pagination.total_items}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="px-4 py-2 rounded-xl border border-gray-600 disabled:opacity-50 flex items-center gap-2"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pagination.last_page || Math.abs(p - pagination.current_page) <= 2)
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && p - arr[idx - 1] > 1 && <span className="px-3">...</span>}
                    <button
                      onClick={() => handlePageChange(p)}
                      className={`px-4 py-2 rounded-xl border ${pagination.current_page === p ? 'bg-blue-600 border-blue-500' : 'border-gray-600'}`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
                className="px-4 py-2 rounded-xl border border-gray-600 disabled:opacity-50 flex items-center gap-2"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {gateways.length === 0 && !loading && (
          <div className="text-center py-20">
            <CreditCard size={64} className="mx-auto text-gray-600 mb-6" />
            <h3 className="text-2xl font-bold mb-3">{searchTerm ? 'No gateways found' : 'No payment gateways yet'}</h3>
            <p className="text-gray-400 mb-8">{searchTerm ? 'Try different keywords' : 'Add your first payment method'}</p>
            {!searchTerm && (
              <button onClick={() => openModal()} className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-3 rounded-xl font-bold">
                <Plus className="inline mr-2" /> Add First Gateway
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
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-800 rounded-3xl p-8 max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                  {editingGateway ? 'Edit Payment Gateway' : 'Create New Payment Gateway'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-700 rounded-lg">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Gateway Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Stripe, PayPal, Cash"
                    className={`w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.name ? 'border-red-500' : ''}`}
                  />
                  {errors.name && <p className="text-red-400 text-sm mt-1">{Array.isArray(errors.name) ? errors.name[0] : errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Status</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['active', 'inactive'].map(st => (
                      <label
                        key={st}
                        onClick={() => setFormData(prev => ({ ...prev, status: st }))}
                        className={`p-4 border-2 rounded-xl text-center cursor-pointer transition ${
                          formData.status === st
                            ? st === 'active'
                              ? 'border-green-500 bg-green-500/10'
                              : 'border-red-500 bg-red-500/10'
                            : 'border-gray-600'
                        }`}
                      >
                        {st === 'active' ? <Eye size={20} className="mx-auto mb-2" /> : <EyeOff size={20} className="mx-auto mb-2" />}
                        <span className="capitalize font-medium">{st}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Configuration (Optional)</label>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Key (e.g., api_key)"
                        id="config-key"
                        className="flex-1 px-4 py-3 bg-gray-700/50 rounded-xl outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        id="config-value"
                        className="flex-1 px-4 py-3 bg-gray-700/50 rounded-xl outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const key = document.getElementById('config-key').value.trim();
                          const value = document.getElementById('config-value').value.trim();
                          if (key && value) {
                            handleConfigChange(key, value);
                            document.getElementById('config-key').value = '';
                            document.getElementById('config-value').value = '';
                          }
                        }}
                        className="px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl"
                      >
                        Add
                      </button>
                    </div>

                    {Object.keys(formData.config).length > 0 && (
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <p className="text-xs text-gray-500 mb-2">Current Config:</p>
                        {Object.entries(formData.config).map(([k, v]) => (
                          <div key={k} className="flex justify-between items-center py-1">
                            <span className="text-sm font-mono">{k}: {v}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newConfig = { ...formData.config };
                                delete newConfig[k];
                                setFormData(prev => ({ ...prev, config: newConfig }));
                              }}
                              className="text-red-400 hover:text-red-300"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={operationLoading === 'saving'}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-bold flex items-center gap-2 disabled:opacity-70"
                  >
                    {operationLoading === 'saving' ? <Loader size={20} className="animate-spin" /> : <Check size={20} />}
                    {editingGateway ? 'Update' : 'Create'} Gateway
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

export default PaymentGateways;