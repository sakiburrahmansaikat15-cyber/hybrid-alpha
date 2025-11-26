import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Check, AlertCircle, MoreVertical,
  Eye, EyeOff, CreditCard, Smartphone, Building, Wallet, QrCode,
  Upload, ChevronLeft, ChevronRight, Loader, FileText, Calendar
} from 'lucide-react';

const API_URL = 'http://localhost:8000/api/payment-types';

const PaymentTypes = () => {
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPaymentType, setEditingPaymentType] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [actionMenu, setActionMenu] = useState(null);

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0
  });

  const [formData, setFormData] = useState({
    name: '',
    type: 'mobile',
    account_number: '',
    notes: '',
    status: 'active',
    image: null
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const paymentTypeIcons = {
    mobile: Smartphone,
    card: CreditCard,
    bank: Building,
    wallet: Wallet,
    qr: QrCode
  };

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
  }, []);

  const handleApiError = useCallback((error, defaultMessage) => {
    console.error('API Error:', error);
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

  // Normal paginated fetch
  const fetchPaymentTypes = useCallback(async (page = 1, perPage = pagination.per_page) => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL, {
        params: { page, limit: perPage }
      });

      const res = response.data;
      setPaymentTypes(res.data || []);
      setPagination({
        current_page: res.page || 1,
        last_page: res.totalPages || res.last_page || 1,
        per_page: res.perPage || perPage,
        total: res.totalItems || res.total || 0,
        from: res.from || ((res.page - 1) * res.perPage) + 1 || 1,
        to: res.to || Math.min(res.page * res.perPage, res.totalItems) || 0
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch payment types');
      setPaymentTypes([]);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  // Search (non-paginated)
  const searchPaymentTypes = useCallback(async (keyword) => {
    if (!keyword.trim()) {
      fetchPaymentTypes(pagination.current_page, pagination.per_page);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/search`, {
        params: { keyword }
      });

      const items = response.data.data || [];
      setPaymentTypes(items);
      setPagination({
        current_page: 1,
        last_page: 1,
        per_page: items.length,
        total: items.length,
        from: 1,
        to: items.length
      });
    } catch (error) {
      handleApiError(error, 'Search failed');
      setPaymentTypes([]);
    } finally {
      setLoading(false);
    }
  }, [fetchPaymentTypes]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchPaymentTypes(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, searchPaymentTypes]);

  // Initial load
  useEffect(() => {
    fetchPaymentTypes(1, 10);
  }, []);

  // Handle page change (only when not searching)
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page || searchTerm) return;
    fetchPaymentTypes(newPage, pagination.per_page);
  };

  // Handle per_page change
  const handleLimitChange = (newLimit) => {
    const limit = parseInt(newLimit);
    setPagination(prev => ({ ...prev, per_page: limit, current_page: 1 }));
    if (!searchTerm.trim()) {
      fetchPaymentTypes(1, limit);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', type: 'mobile', account_number: '', notes: '', status: 'active', image: null
    });
    setImagePreview(null);
    setEditingPaymentType(null);
    setErrors({});
  };

  const openModal = (pt = null) => {
    if (pt) {
      setEditingPaymentType(pt);
      setFormData({
        name: pt.name || '',
        type: pt.type || 'mobile',
        account_number: pt.account_number || '',
        notes: pt.notes || '',
        status: pt.status || 'active',
        image: null
      });
      setImagePreview(pt.image ? `http://localhost:8000/${pt.image}` : null);
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

    const fd = new FormData();
    fd.append('name', formData.name.trim());
    fd.append('type', formData.type);
    fd.append('account_number', formData.account_number.trim());
    fd.append('notes', formData.notes.trim());
    fd.append('status', formData.status);
    if (formData.image instanceof File) fd.append('image', formData.image);

    try {
      let response;
      if (editingPaymentType) {
        fd.append('_method', 'POST');
        response = await axios.post(`${API_URL}/${editingPaymentType.id}`, fd);
      } else {
        response = await axios.post(API_URL, fd);
      }

      showNotification(response.data.message || `Payment type ${editingPaymentType ? 'updated' : 'created'} successfully!`);
      searchTerm ? searchPaymentTypes(searchTerm) : fetchPaymentTypes(pagination.current_page, pagination.per_page);
      closeModal();
    } catch (error) {
      handleApiError(error, 'Failed to save payment type');
    } finally {
      setOperationLoading(null);
    }
  };

  const toggleStatus = async (pt) => {
    const newStatus = pt.status === 'active' ? 'inactive' : 'active';
    setOperationLoading(`status-${pt.id}`);

    const fd = new FormData();
    fd.append('status', newStatus);
    fd.append('_method', 'POST');

    try {
      await axios.post(`${API_URL}/${pt.id}`, fd);
      showNotification(`Payment type ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      searchTerm ? searchPaymentTypes(searchTerm) : fetchPaymentTypes(pagination.current_page, pagination.per_page);
    } catch (error) {
      handleApiError(error, 'Failed to update status');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment type permanently?')) return;
    setOperationLoading(`delete-${id}`);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Payment type deleted successfully');
      if (paymentTypes.length === 1 && pagination.current_page > 1 && !searchTerm) {
        fetchPaymentTypes(pagination.current_page - 1, pagination.per_page);
      } else {
        searchTerm ? searchPaymentTypes(searchTerm) : fetchPaymentTypes(pagination.current_page, pagination.per_page);
      }
    } catch (error) {
      handleApiError(error, 'Delete failed');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  const stats = {
    total: pagination.total,
    active: paymentTypes.filter(pt => pt.status === 'active').length,
    inactive: paymentTypes.filter(pt => pt.status === 'inactive').length
  };

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
  const getImageUrl = (path) => path ? `http://localhost:8000/${path}` : null;
  const maskAccount = (num) => num && num.length > 4 ? `•••• ${num.slice(-4)}` : num || '';

  useEffect(() => {
    const handler = () => setActionMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const filteredAndSorted = React.useMemo(() => {
    let list = [...paymentTypes];
    if (filterStatus !== 'all') list = list.filter(pt => pt.status === filterStatus);
    list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'type') return a.type.localeCompare(b.type);
      if (sortBy === 'status') return (b.status === 'active' ? 1 : -1) - (a.status === 'active' ? 1 : -1);
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      return 0;
    });
    return list;
  }, [paymentTypes, filterStatus, sortBy]);

  if (loading && paymentTypes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-gray-800 rounded w-96"></div>
            <div className="grid grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => <div key={i} className="bg-gray-800/40 rounded-2xl p-6 h-32"></div>)}
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => <div key={i} className="bg-gray-800/30 rounded-2xl p-6 h-64"></div>)}
            </div>
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
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl ${notification.type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white font-medium flex items-center gap-3`}
          >
            {notification.type === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
              Payment Types Management
            </h1>
            <p className="text-gray-400 mt-2 text-lg">Manage all payment methods & accounts</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openModal()}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg flex items-center gap-3"
          >
            <Plus size={22} /> Add Payment Type
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Methods', value: stats.total, icon: CreditCard, color: 'blue' },
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

        {/* Filters */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/30">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, account, type or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2 bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3">
                Show:
                <select
                  value={pagination.per_page}
                  onChange={(e) => handleLimitChange(e.target.value)}
                  disabled={!!searchTerm}
                  className="bg-transparent border-0 text-white text-sm focus:ring-0 disabled:opacity-50"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A-Z</option>
                <option value="type">Type</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8"
        >
          {filteredAndSorted.map(pt => {
            const Icon = paymentTypeIcons[pt.type] || CreditCard;
            return (
              <motion.div
                key={pt.id}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative bg-gray-800/30 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700/30 hover:border-blue-500/50 transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Icon size={20} className="text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white truncate max-w-[180px]">{pt.name}</h3>
                        <p className="text-sm text-gray-400 capitalize">{pt.type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === pt.id ? null : pt.id); }}
                      className="p-2 hover:bg-gray-700/50 rounded-lg"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>

                  <div className="mb-4">
                    {pt.image ? (
                      <img src={getImageUrl(pt.image)} alt={pt.name} className="w-full h-32 object-cover rounded-lg border border-gray-600" />
                    ) : (
                      <div className="w-full h-32 bg-gray-700/50 rounded-lg border border-dashed border-gray-600 flex items-center justify-center">
                        <Icon size={36} className="text-gray-500" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Account:</span>
                      <span className="font-mono text-white">{maskAccount(pt.account_number)}</span>
                    </div>
                    {pt.notes && (
                      <div className="flex gap-2 text-gray-300">
                        <FileText size={16} className="text-gray-500 mt-0.5" />
                        <p className="line-clamp-2">{pt.notes}</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => toggleStatus(pt)}
                    disabled={operationLoading === `status-${pt.id}`}
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 ${pt.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
                  >
                    {operationLoading === `status-${pt.id}` ? <Loader size={12} className="animate-spin" /> : null}
                    {pt.status === 'active' ? 'Active' : 'Inactive'}
                  </button>

                  <div className="flex justify-between items-end pt-4 border-t border-gray-700/30">
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar size={14} /> {formatDate(pt.created_at)}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openModal(pt)} className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg"><Edit size={14} /></button>
                      <button onClick={() => handleDelete(pt.id)} className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {actionMenu === pt.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute right-4 top-20 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl py-2 z-10 min-w-[160px]"
                    >
                      <button onClick={() => { openModal(pt); setActionMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-sm"><Edit size={16} /> Edit</button>
                      <button onClick={() => toggleStatus(pt)} className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-sm">
                        {pt.status === 'active' ? <EyeOff size={16} /> : <Eye size={16} />}
                        {pt.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => handleDelete(pt.id)} className="w-full text-left px-4 py-2 hover:bg-red-500/20 text-red-400 flex items-center gap-3 text-sm"><Trash2 size={16} /> Delete</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Pagination - Only when NOT searching */}
        {!searchTerm && pagination.last_page > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center py-6 border-t border-gray-700/30">
            <div className="text-sm text-gray-400 mb-4 sm:mb-0">
              Showing {pagination.from} to {pagination.to} of {pagination.total} entries
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
                    {idx > 0 && p - arr[idx - 1] > 1 && <span className="px-3 py-2">...</span>}
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
        {paymentTypes.length === 0 && !loading && (
          <div className="text-center py-20">
            <CreditCard size={80} className="mx-auto text-gray-600 mb-6" />
            <h3 className="text-2xl font-bold mb-3">{searchTerm ? 'No payment types found' : 'No payment types yet'}</h3>
            <p className="text-gray-400 mb-8">{searchTerm ? 'Try adjusting your search' : 'Create your first payment method'}</p>
            {!searchTerm && (
              <button onClick={() => openModal()} className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-3 rounded-xl font-bold">
                <Plus className="inline mr-2" /> Create First Payment Type
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700/50 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                    {editingPaymentType ? 'Edit Payment Type' : 'Add New Payment Type'}
                  </h2>
                  <button onClick={closeModal} className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-700/50">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="e.g., M-Pesa, Visa Card" />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name[0]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">Type</label>
                    <select name="type" value={formData.type} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                      <option value="mobile">Mobile Money</option>
                      <option value="card">Card</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="wallet">E-Wallet</option>
                      <option value="qr">QR Code</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">Account Number / ID *</label>
                    <input type="text" name="account_number" value={formData.account_number} onChange={handleInputChange} required className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="e.g., 0712345678" />
                    {errors.account_number && <p className="text-red-400 text-xs mt-1">{errors.account_number[0]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">Notes (Optional)</label>
                    <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={3} className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Any additional info..." />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">Logo / QR Code</label>
                    <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="img-upload" />
                      <label htmlFor="img-upload" className="cursor-pointer block">
                        <Upload size={40} className="mx-auto mb-3 text-gray-400" />
                        <p className="text-gray-400">Click to upload logo</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP up to 2MB</p>
                      </label>
                    </div>
                    {errors.image && <p className="text-red-400 text-xs mt-2">{errors.image}</p>}
                    {imagePreview && (
                      <div className="mt-4 relative inline-block">
                        <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg border border-gray-600" />
                        <button type="button" onClick={() => { setImagePreview(null); setFormData(prev => ({ ...prev, image: null })); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">Status</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['active', 'inactive'].map(st => (
                        <label
                          key={st}
                          onClick={() => setFormData(prev => ({ ...prev, status: st }))}
                          className={`p-4 border-2 rounded-xl text-center cursor-pointer transition-all ${formData.status === st ? (st === 'active' ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10') : 'border-gray-600 hover:border-gray-500'}`}
                        >
                          {st === 'active' ? <Eye size={24} className="mx-auto mb-2 text-green-400" /> : <EyeOff size={24} className="mx-auto mb-2 text-red-400" />}
                          <span className="capitalize font-medium">{st}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-700/50">
                    <button type="button" onClick={closeModal} className="px-6 py-3 text-sm font-medium text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-600/50 rounded-xl border border-gray-600/50">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={operationLoading === 'saving'}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-70"
                    >
                      {operationLoading === 'saving' ? <Loader size={20} className="animate-spin" /> : <Check size={20} />}
                      {editingPaymentType ? 'Update' : 'Create'} Payment Type
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

export default PaymentTypes;