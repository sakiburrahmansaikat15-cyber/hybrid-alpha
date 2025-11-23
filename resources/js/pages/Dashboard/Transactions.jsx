import React, { useState, useEffect } from 'react';
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
  Filter,
  MoreVertical,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  DollarSign,
  CreditCard,
  Package,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// API configuration
const API_BASE_URL = '/api';
const TRANSACTIONS_API = `${API_BASE_URL}/transaction`;
const STOCKS_API = `${API_BASE_URL}/stocks`;
const PAYMENT_TYPES_API = `${API_BASE_URL}/payment-types`;

const TransactionsManager = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [stocks, setStocks] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState({
    stock_id: '',
    payment_type_id: '',
    type: 'Buy',
    amount: '',
    status: 'active'
  });

  const [formErrors, setFormErrors] = useState({});

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  });

  // Get CSRF token for Laravel
  const getCSRFToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  };

  // Configure axios
  useEffect(() => {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
    }
    axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
  }, []);

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
  };

  // Enhanced error handler
  const handleApiError = (error, defaultMessage) => {
    console.error('API Error:', error);

    if (error.response?.status === 401) {
      return 'Authentication required. Please log in again.';
    }
    if (error.response?.status === 404) {
      return 'Resource not found.';
    }
    if (error.response?.status === 422) {
      return error.response.data.message || 'Validation failed.';
    }
    if (error.response?.status === 500) {
      return 'Server error. Please try again later.';
    }
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      return 'Network error. Please check your connection.';
    }

    return error.response?.data?.message || error.message || defaultMessage;
  };

  const fetchTransactions = async (page = 1, search = '') => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page,
        per_page: pagination.per_page,
        ...(search && { search }),
        ...(filterType !== 'all' && { type: filterType }),
        ...(filterStatus !== 'all' && { status: filterStatus === 'active' })
      };

      const response = await axios.get(TRANSACTIONS_API, { params });
      const responseData = response.data;

      // Handle different response formats
      if (responseData.success) {
        setTransactions(responseData.data || []);
        setPagination(prev => ({
          ...prev,
          current_page: responseData.pagination?.current_page || page,
          last_page: responseData.pagination?.last_page || 1,
          total: responseData.pagination?.total || (responseData.data?.length || 0),
          per_page: responseData.pagination?.per_page || prev.per_page
        }));
      } else if (Array.isArray(responseData)) {
        setTransactions(responseData);
        setPagination(prev => ({
          ...prev,
          current_page: 1,
          last_page: 1,
          total: responseData.length,
          per_page: responseData.length
        }));
      } else if (responseData.data && Array.isArray(responseData.data)) {
        setTransactions(responseData.data);
        setPagination(prev => ({
          ...prev,
          current_page: responseData.current_page || 1,
          last_page: responseData.last_page || 1,
          total: responseData.total || responseData.data.length,
          per_page: responseData.per_page || prev.per_page
        }));
      } else {
        throw new Error('Invalid response format from server');
      }

    } catch (err) {
      const errorMsg = handleApiError(err, 'Failed to fetch transactions. Please try again.');
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStocks = async () => {
    try {
      const response = await axios.get(STOCKS_API);
      const responseData = response.data;
      
      if (responseData.success) {
        setStocks(responseData.data || []);
      } else if (Array.isArray(responseData)) {
        setStocks(responseData);
      } else if (responseData.data && Array.isArray(responseData.data)) {
        setStocks(responseData.data);
      } else {
        setStocks([]);
      }
    } catch (err) {
      console.error('Error fetching stocks:', err);
      setStocks([]);
    }
  };

  const fetchPaymentTypes = async () => {
    try {
      const response = await axios.get(PAYMENT_TYPES_API);
      const responseData = response.data;
      
      if (responseData.success) {
        setPaymentTypes(responseData.data || []);
      } else if (Array.isArray(responseData)) {
        setPaymentTypes(responseData);
      } else if (responseData.data && Array.isArray(responseData.data)) {
        setPaymentTypes(responseData.data);
      } else {
        setPaymentTypes([]);
      }
    } catch (err) {
      console.error('Error fetching payment types:', err);
      setPaymentTypes([]);
    }
  };

  useEffect(() => {
    fetchTransactions(1);
    fetchStocks();
    fetchPaymentTypes();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTransactions(1, searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, filterType, filterStatus]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      fetchTransactions(newPage, searchTerm);
    }
  };

  const handleLimitChange = (newLimit) => {
    setPagination(prev => ({ ...prev, per_page: parseInt(newLimit) }));
    fetchTransactions(1, searchTerm);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      stock_id: '',
      payment_type_id: '',
      type: 'Buy',
      amount: '',
      status: 'active'
    });
    setEditingTransaction(null);
    setFormErrors({});
  };

  const openModal = (transaction = null) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setFormData({
        stock_id: transaction.stock_id || '',
        payment_type_id: transaction.payment_type_id || '',
        type: transaction.type || 'Buy',
        amount: transaction.amount || '',
        status: transaction.status ? 'active' : 'inactive'
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => {
      resetForm();
    }, 300);
  };

  const openDeleteModal = (transaction) => {
    setEditingTransaction(transaction);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setEditingTransaction(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setFormErrors({});
    setError('');

    // Validation
    const newErrors = {};
    if (!formData.stock_id) newErrors.stock_id = 'Stock is required';
    if (!formData.payment_type_id) newErrors.payment_type_id = 'Payment type is required';
    if (!formData.type) newErrors.type = 'Transaction type is required';
    if (!formData.amount || formData.amount <= 0) newErrors.amount = 'Valid amount is required';

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      setSubmitLoading(false);
      return;
    }

    try {
      const submitData = {
        stock_id: formData.stock_id,
        payment_type_id: formData.payment_type_id,
        type: formData.type,
        amount: parseFloat(formData.amount),
        status: formData.status === 'active'
      };

      let response;
      if (editingTransaction) {
        response = await axios.put(`${TRANSACTIONS_API}/${editingTransaction.id}`, submitData);
      } else {
        response = await axios.post(TRANSACTIONS_API, submitData);
      }

      if (response.data.success) {
        showNotification(
          response.data.message || `Transaction ${editingTransaction ? 'updated' : 'created'} successfully!`, 
          'success'
        );
        fetchTransactions(pagination.current_page, searchTerm);
        closeModal();
      } else {
        throw new Error(response.data.message || `Failed to ${editingTransaction ? 'update' : 'create'} transaction`);
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        const errorMessage = handleApiError(err, `Failed to ${editingTransaction ? 'update' : 'create'} transaction. Please try again.`);
        setError(errorMessage);
        showNotification(errorMessage, 'error');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await axios.delete(`${TRANSACTIONS_API}/${editingTransaction.id}`);
      
      if (response.data.success) {
        showNotification(response.data.message || 'Transaction deleted successfully!', 'success');
        if (transactions.length === 1 && pagination.current_page > 1) {
          fetchTransactions(pagination.current_page - 1, searchTerm);
        } else {
          fetchTransactions(pagination.current_page, searchTerm);
        }
      } else {
        throw new Error(response.data.message || 'Failed to delete transaction');
      }
    } catch (err) {
      const errorMsg = handleApiError(err, 'Failed to delete transaction. Please try again.');
      showNotification(errorMsg, 'error');
    }
    closeDeleteModal();
  };

  const toggleStatus = async (transaction) => {
    const newStatus = !transaction.status;
    
    try {
      const submitData = {
        stock_id: transaction.stock_id,
        payment_type_id: transaction.payment_type_id,
        type: transaction.type,
        amount: transaction.amount,
        status: newStatus
      };

      const response = await axios.put(`${TRANSACTIONS_API}/${transaction.id}`, submitData);

      if (response.data.success) {
        showNotification(`Transaction ${newStatus ? 'activated' : 'deactivated'}!`, 'success');
        fetchTransactions(pagination.current_page, searchTerm);
      } else {
        throw new Error(response.data.message || 'Failed to update transaction status');
      }
    } catch (err) {
      const errorMsg = handleApiError(err, 'Failed to update transaction status. Please try again.');
      showNotification(errorMsg, 'error');
    }
    setActionMenu(null);
  };

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActionMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Statistics
  const stats = {
    total: pagination.total,
    buy: transactions.filter(transaction => transaction.type === 'Buy').length,
    sell: transactions.filter(transaction => transaction.type === 'Sell').length,
    totalAmount: transactions.reduce((sum, transaction) => sum + parseFloat(transaction.amount || 0), 0)
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type) => {
    return type === 'Buy' ? 
      <TrendingUp className="text-green-400" size={20} /> : 
      <TrendingDown className="text-red-400" size={20} />;
  };

  const getAmountColor = (type) => {
    return type === 'Buy' ? 'text-green-400' : 'text-red-400';
  };

  // Table loading skeleton
  if (loading && transactions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <div className="h-8 bg-gray-800 rounded w-64 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-800 rounded w-48 animate-pulse"></div>
              </div>
              <div className="h-12 bg-gray-800 rounded-xl w-40 animate-pulse"></div>
            </div>
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700/40 animate-pulse">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
                    <div className="h-6 bg-gray-700 rounded w-16"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-700 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Table Skeleton */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 overflow-hidden">
            <div className="p-6 border-b border-gray-700/30">
              <div className="h-12 bg-gray-700/50 rounded-xl w-96 animate-pulse"></div>
            </div>
            <div className="p-6">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-center justify-between py-4 border-b border-gray-700/30 last:border-b-0 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-700 rounded-lg"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-32"></div>
                      <div className="h-3 bg-gray-700 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-6 bg-gray-700 rounded w-20"></div>
                    <div className="h-8 bg-gray-700 rounded w-8"></div>
                    <div className="h-8 bg-gray-700 rounded w-8"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 py-8">
      {/* Notification */}
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                Transactions Manager
              </h1>
              <p className="text-gray-400 mt-2 text-lg">
                Manage your stock transactions efficiently
              </p>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fetchTransactions(pagination.current_page, searchTerm)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 border border-gray-600 flex items-center gap-2"
              >
                <RefreshCw size={18} />
                Refresh
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openModal()}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-green-500/25 flex items-center gap-3"
              >
                <Plus size={22} />
                New Transaction
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40 hover:border-green-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Transactions</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-xl">
                <CreditCard size={24} className="text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40 hover:border-green-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Buy Transactions</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.buy}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <TrendingUp size={24} className="text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40 hover:border-green-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Sell Transactions</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.sell}</p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-xl">
                <TrendingDown size={24} className="text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40 hover:border-green-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Amount</p>
                <p className="text-2xl font-bold text-white mt-1">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <DollarSign size={24} className="text-purple-400" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search and Controls */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/30"
        >
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search transactions by stock, payment type, type, or amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent backdrop-blur-sm transition-all duration-200"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2 bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-transparent border-0 text-white text-sm focus:ring-0 focus:outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="Buy">Buy</option>
                  <option value="Sell">Sell</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-transparent border-0 text-white text-sm focus:ring-0 focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
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
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 bg-red-900/50 border border-red-700 rounded-xl p-4 backdrop-blur-sm"
            >
              <div className="flex items-center">
                <AlertCircle size={20} className="text-red-400 mr-3" />
                <span className="text-red-200 text-sm">{error}</span>
                <button
                  onClick={() => setError('')}
                  className="ml-auto text-red-400 hover:text-red-300 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transactions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 overflow-hidden mb-8"
        >
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-700/30 bg-gray-800/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Transactions List</h3>
              <span className="text-sm text-gray-400">
                {pagination.total} {pagination.total === 1 ? 'transaction' : 'transactions'} found
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/30">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Payment Type
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {transactions.map((transaction) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-700/10 transition-colors duration-200 group"
                  >
                    {/* Type */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.type)}
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                          transaction.type === 'Buy' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {transaction.type}
                        </span>
                      </div>
                    </td>

                    {/* Stock */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <Package size={20} className="text-blue-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-white group-hover:text-green-100 transition-colors">
                            {transaction.stock?.name || `Stock #${transaction.stock_id}`}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Payment Type */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                          <CreditCard size={20} className="text-purple-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-white">
                            {transaction.paymentType?.name || `Payment #${transaction.payment_type_id}`}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`font-bold text-lg ${getAmountColor(transaction.type)}`}>
                        {formatCurrency(transaction.amount)}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleStatus(transaction)}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                          transaction.status
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                        }`}
                      >
                        {transaction.status ? (
                          <>
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            Active
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                            Inactive
                          </>
                        )}
                      </button>
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Calendar size={14} />
                        {formatDate(transaction.created_at)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Quick Actions */}
                        <div className="hidden lg:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openModal(transaction)}
                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all duration-200"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openDeleteModal(transaction)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all duration-200"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </motion.button>
                        </div>

                        {/* Mobile Action Menu */}
                        <div className="lg:hidden relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenu(actionMenu === transaction.id ? null : transaction.id);
                            }}
                            className="p-2 hover:bg-gray-600/50 rounded-lg transition-colors duration-200"
                          >
                            <MoreVertical size={18} />
                          </button>

                          <AnimatePresence>
                            {actionMenu === transaction.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute right-0 top-10 z-10 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl min-w-[160px] py-2 backdrop-blur-sm"
                              >
                                <button
                                  onClick={() => openModal(transaction)}
                                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 transition-colors duration-200"
                                >
                                  <Edit size={16} />
                                  Edit
                                </button>
                                <button
                                  onClick={() => toggleStatus(transaction)}
                                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 transition-colors duration-200"
                                >
                                  {transaction.status ? <EyeOff size={16} /> : <Eye size={16} />}
                                  {transaction.status ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => openDeleteModal(transaction)}
                                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors duration-200"
                                >
                                  <Trash2 size={16} />
                                  Delete
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {transactions.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-800/40 rounded-full flex items-center justify-center border border-gray-700/40">
                  <CreditCard size={48} className="text-gray-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  {searchTerm ? 'No transactions found' : 'No transactions yet'}
                </h3>
                <p className="text-gray-400 text-lg mb-8">
                  {searchTerm
                    ? "Try adjusting your search terms or filters to find what you're looking for."
                    : "Get started by creating your first transaction."
                  }
                </p>
                {!searchTerm && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openModal()}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-green-500/25 flex items-center gap-3 mx-auto"
                  >
                    <Plus size={20} />
                    Create Your First Transaction
                  </motion.button>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row justify-between items-center gap-4 py-6 border-t border-gray-700/30"
          >
            <div className="text-sm text-gray-400">
              Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
              {pagination.total} entries
            </div>

            <div className="flex items-center gap-2">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className={`p-2 rounded-lg border transition-all duration-200 ${
                  pagination.current_page === 1
                    ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500'
                }`}
              >
                <ChevronLeft size={16} />
              </button>

              {/* Page Numbers */}
              {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                .filter(page =>
                  page === 1 ||
                  page === pagination.last_page ||
                  Math.abs(page - pagination.current_page) <= 2
                )
                .map((page, index, array) => {
                  const showEllipsis = index > 0 && page - array[index - 1] > 1;
                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded-lg border transition-all duration-200 ${
                          pagination.current_page === page
                            ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-500/25'
                            : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
                className={`p-2 rounded-lg border transition-all duration-200 ${
                  pagination.current_page === pagination.last_page
                    ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500'
                }`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700/50 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                    {editingTransaction ? 'Edit Transaction' : 'Create New Transaction'}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-gray-700/50"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    {/* Stock Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
                        Stock *
                      </label>
                      <select
                        name="stock_id"
                        value={formData.stock_id}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 bg-gray-700/50 border rounded-xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500 text-white placeholder-gray-400 transition-all duration-200 backdrop-blur-sm ${
                          formErrors.stock_id ? 'border-red-500' : 'border-gray-600/50'
                        }`}
                      >
                        <option value="">Select a stock</option>
                        {stocks.map((stock) => (
                          <option key={stock.id} value={stock.id}>
                            {stock.name || `Stock #${stock.id}`}
                          </option>
                        ))}
                      </select>
                      {formErrors.stock_id && (
                        <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                          <AlertCircle size={16} />
                          {formErrors.stock_id}
                        </p>
                      )}
                    </div>

                    {/* Payment Type Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
                        Payment Type *
                      </label>
                      <select
                        name="payment_type_id"
                        value={formData.payment_type_id}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 bg-gray-700/50 border rounded-xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500 text-white placeholder-gray-400 transition-all duration-200 backdrop-blur-sm ${
                          formErrors.payment_type_id ? 'border-red-500' : 'border-gray-600/50'
                        }`}
                      >
                        <option value="">Select a payment type</option>
                        {paymentTypes.map((paymentType) => (
                          <option key={paymentType.id} value={paymentType.id}>
                            {paymentType.name || `Payment Type #${paymentType.id}`}
                          </option>
                        ))}
                      </select>
                      {formErrors.payment_type_id && (
                        <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                          <AlertCircle size={16} />
                          {formErrors.payment_type_id}
                        </p>
                      )}
                    </div>

                    {/* Transaction Type */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
                        Transaction Type *
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <label className={`relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          formData.type === 'Buy'
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                        }`}>
                          <input
                            type="radio"
                            name="type"
                            value="Buy"
                            checked={formData.type === 'Buy'}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div className="text-center">
                            <TrendingUp size={20} className={`mx-auto mb-2 ${
                              formData.type === 'Buy' ? 'text-green-400' : 'text-gray-400'
                            }`} />
                            <span className={`font-medium ${
                              formData.type === 'Buy' ? 'text-green-400' : 'text-gray-400'
                            }`}>
                              Buy
                            </span>
                          </div>
                        </label>

                        <label className={`relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          formData.type === 'Sell'
                            ? 'border-red-500 bg-red-500/10'
                            : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                        }`}>
                          <input
                            type="radio"
                            name="type"
                            value="Sell"
                            checked={formData.type === 'Sell'}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div className="text-center">
                            <TrendingDown size={20} className={`mx-auto mb-2 ${
                              formData.type === 'Sell' ? 'text-red-400' : 'text-gray-400'
                            }`} />
                            <span className={`font-medium ${
                              formData.type === 'Sell' ? 'text-red-400' : 'text-gray-400'
                            }`}>
                              Sell
                            </span>
                          </div>
                        </label>
                      </div>
                      {formErrors.type && (
                        <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                          <AlertCircle size={16} />
                          {formErrors.type}
                        </p>
                      )}
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
                        Amount *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="number"
                          name="amount"
                          value={formData.amount}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          className={`w-full pl-12 pr-4 py-3 bg-gray-700/50 border rounded-xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500 text-white placeholder-gray-400 transition-all duration-200 backdrop-blur-sm ${
                            formErrors.amount ? 'border-red-500' : 'border-gray-600/50'
                          }`}
                          placeholder="0.00"
                        />
                      </div>
                      {formErrors.amount && (
                        <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                          <AlertCircle size={16} />
                          {formErrors.amount}
                        </p>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
                        Status
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <label className={`relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          formData.status === 'active'
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                        }`}>
                          <input
                            type="radio"
                            name="status"
                            value="active"
                            checked={formData.status === 'active'}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div className="text-center">
                            <Eye size={20} className={`mx-auto mb-2 ${
                              formData.status === 'active' ? 'text-green-400' : 'text-gray-400'
                            }`} />
                            <span className={`font-medium ${
                              formData.status === 'active' ? 'text-green-400' : 'text-gray-400'
                            }`}>
                              Active
                            </span>
                          </div>
                        </label>

                        <label className={`relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          formData.status === 'inactive'
                            ? 'border-red-500 bg-red-500/10'
                            : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                        }`}>
                          <input
                            type="radio"
                            name="status"
                            value="inactive"
                            checked={formData.status === 'inactive'}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div className="text-center">
                            <EyeOff size={20} className={`mx-auto mb-2 ${
                              formData.status === 'inactive' ? 'text-red-400' : 'text-gray-400'
                            }`} />
                            <span className={`font-medium ${
                              formData.status === 'inactive' ? 'text-red-400' : 'text-gray-400'
                            }`}>
                              Inactive
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-700/50">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={closeModal}
                      disabled={submitLoading}
                      className="px-6 py-3 text-sm font-medium text-gray-300 hover:text-white transition-colors bg-gray-700/50 hover:bg-gray-600/50 rounded-xl border border-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={submitLoading}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {submitLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          {editingTransaction ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        <>
                          <Check size={20} />
                          {editingTransaction ? 'Update Transaction' : 'Create Transaction'}
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && editingTransaction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={closeDeleteModal}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl max-w-md w-full border border-red-700/50 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-500/20 rounded-xl">
                    <AlertCircle size={24} className="text-red-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-red-400">
                    Confirm Deletion
                  </h2>
                </div>

                <p className="text-gray-300 mb-6">
                  Are you sure you want to delete this transaction? This action cannot be undone.
                </p>

                {editingTransaction && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                    <div className="text-white font-semibold">
                      {editingTransaction.type} - {editingTransaction.stock?.name || `Stock #${editingTransaction.stock_id}`}
                    </div>
                    <div className="text-gray-400 text-sm mt-1">
                      Amount: {formatCurrency(editingTransaction.amount)}
                    </div>
                    <div className="text-gray-400 text-sm">
                      Payment: {editingTransaction.paymentType?.name || `Payment #${editingTransaction.payment_type_id}`}
                    </div>
                  </div>
                )}

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 text-yellow-400 text-sm">
                    <AlertCircle size={16} />
                    This action cannot be undone!
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={closeDeleteModal}
                    className="px-6 py-3 text-sm font-medium text-gray-300 hover:text-white transition-colors bg-gray-700/50 hover:bg-gray-600/50 rounded-xl border border-gray-600/50"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDelete}
                    className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-red-500/25 flex items-center gap-2"
                  >
                    <Trash2 size={18} />
                    Delete Transaction
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransactionsManager;