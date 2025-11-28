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

const API_URL = '/api/transaction';
const PAYMENT_TYPES_API = '/api/payment-types';

const TransactionsManager = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
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
      setFormErrors(validationErrors);
      const firstError = Object.values(validationErrors)[0]?.[0] || 'Validation error';
      showNotification(firstError, 'error');
    } else if (error.response?.data?.message) {
      showNotification(error.response.data.message, 'error');
    } else {
      showNotification(defaultMessage || 'Something went wrong', 'error');
    }
  }, [showNotification]);

  const fetchTransactions = useCallback(async (page = 1, limit = 10, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await axios.get(API_URL, { params });
      const paginated = response.data.pagination;

      setTransactions(paginated.data || []);
      setPagination({
        current_page: paginated.current_page,
        per_page: paginated.per_page,
        total_items: paginated.total_items,
        total_pages: paginated.total_pages
      });
    } catch (err) {
      handleApiError(err, 'Failed to fetch transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const fetchPaymentTypes = async () => {
    try {
      const response = await axios.get(PAYMENT_TYPES_API);
      const data = response.data;

      if (Array.isArray(data)) {
        setPaymentTypes(data);
      } else if (data?.data && Array.isArray(data.data)) {
        setPaymentTypes(data.data);
      } else if (data?.pagination?.data) {
        setPaymentTypes(data.pagination.data);
      } else {
        setPaymentTypes([]);
      }
    } catch (err) {
      console.error('Error fetching payment types:', err);
      setPaymentTypes([]);
    }
  };

  useEffect(() => {
    fetchTransactions(1, pagination.per_page);
    fetchPaymentTypes();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions(1, pagination.per_page, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchTransactions]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.total_pages || newPage === pagination.current_page) return;
    fetchTransactions(newPage, pagination.per_page, searchTerm);
  };

  const handleLimitChange = (newLimit) => {
    const limit = parseInt(newLimit);
    setPagination(prev => ({ ...prev, per_page: limit, current_page: 1 }));
    fetchTransactions(1, limit, searchTerm);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
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
        status: transaction.status === 'active' ? 'active' : 'inactive'
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

  const openDeleteModal = (transaction) => {
    setEditingTransaction(transaction);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setEditingTransaction(null);
  };

  // FIXED: Update uses POST + _method=PUT as per your Laravel route
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setFormErrors({});

    const payload = {
      stock_id: formData.stock_id,
      payment_type_id: formData.payment_type_id,
      type: formData.type,
      amount: formData.amount,
      status: formData.status
    };

    try {
      let response;
      if (editingTransaction) {
        // Laravel: POST /{id} with _method=PUT
        response = await axios.post(`${API_URL}/${editingTransaction.id}`, {
          ...payload,
          _method: 'POST'
        });
      } else {
        response = await axios.post(API_URL, payload);
      }

      showNotification(editingTransaction ? 'Transaction updated successfully!' : 'Transaction created successfully!');
      fetchTransactions(pagination.current_page, pagination.per_page, searchTerm);
      closeModal();
    } catch (err) {
      handleApiError(err, 'Failed to save transaction');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/${editingTransaction.id}`);
      showNotification('Transaction deleted successfully');
      if (transactions.length === 1 && pagination.current_page > 1) {
        fetchTransactions(pagination.current_page - 1, pagination.per_page, searchTerm);
      } else {
        fetchTransactions(pagination.current_page, pagination.per_page, searchTerm);
      }
      closeDeleteModal();
    } catch (err) {
      handleApiError(err, 'Failed to delete transaction');
    }
  };

  const toggleStatus = async (transaction) => {
    const newStatus = transaction.status === 'active' ? 'inactive' : 'active';
    try {
      await axios.post(`${API_URL}/${transaction.id}`, {
        status: newStatus,
        _method: 'POST'
      });
      showNotification(`Transaction ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchTransactions(pagination.current_page, pagination.per_page, searchTerm);
    } catch (err) {
      handleApiError(err, 'Failed to update status');
    } finally {
      setActionMenu(null);
    }
  };

  const stats = {
    total: pagination.total_items,
    buy: transactions.filter(t => t.type === 'Buy').length,
    sell: transactions.filter(t => t.type === 'Sell').length,
    totalAmount: transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
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

  useEffect(() => {
    const handler = () => setActionMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  if (loading && transactions.length === 0) {
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-800/40 rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-700 rounded w-16"></div>
              </div>
            ))}
          </div>
          <div className="bg-gray-800/30 rounded-2xl p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-700/50 rounded-lg animate-pulse"></div>
              ))}
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
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                Transactions Manager
              </h1>
              <p className="text-gray-400 mt-2 text-lg">Manage your stock transactions efficiently</p>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => fetchTransactions(pagination.current_page, pagination.per_page, searchTerm)}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-xl font-semibold flex items-center gap-2"
              >
                <RefreshCw size={18} /> Refresh
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => openModal()}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-6 py-3 rounded-xl font-bold flex items-center gap-3 shadow-lg"
              >
                <Plus size={22} /> New Transaction
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

        {/* Search & Filters */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/30">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by type or payment type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent backdrop-blur-sm transition-all duration-200"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2 bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3">
                <Filter size={16} className="text-gray-400" />
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-transparent border-0 text-white text-sm focus:ring-0 focus:outline-none">
                  <option value="all">All Types</option>
                  <option value="Buy">Buy</option>
                  <option value="Sell">Sell</option>
                </select>
              </div>
              <div className="flex items-center gap-2 bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3">
                <Filter size={16} className="text-gray-400" />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-transparent border-0 text-white text-sm focus:ring-0 focus:outline-none">
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex items-center gap-2 bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3">
                <span className="text-sm text-gray-400">Show:</span>
                <select value={pagination.per_page} onChange={(e) => handleLimitChange(e.target.value)} className="bg-transparent border-0 text-white text-sm focus:ring-0 focus:outline-none">
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-700/30 bg-gray-800/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Transactions List</h3>
              <span className="text-sm text-gray-400">
                {pagination.total_items} {pagination.total_items === 1 ? 'transaction' : 'transactions'} found
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/30">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Payment Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {transactions
                  .filter(t => filterType === 'all' || t.type === filterType)
                  .filter(t => filterStatus === 'all' || t.status === filterStatus)
                  .map((transaction) => (
                    <motion.tr key={transaction.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-700/10 transition-colors duration-200 group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(transaction.type)}
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${transaction.type === 'Buy' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                            {transaction.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Package size={20} className="text-blue-400" />
                          </div>
                          <div className="font-semibold text-white">
                            Stock #{transaction.stock_id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-500/10 rounded-lg">
                            <CreditCard size={20} className="text-purple-400" />
                          </div>
                          <div className="font-semibold text-white">
                            {transaction.paymentType?.name || `ID: ${transaction.payment_type_id}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`font-bold text-lg ${getAmountColor(transaction.type)}`}>
                          {formatCurrency(transaction.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleStatus(transaction)}
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${transaction.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'}`}
                        >
                          {transaction.status === 'active' ? (
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Calendar size={14} />
                          {formatDate(transaction.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="hidden lg:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => openModal(transaction)} className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all duration-200" title="Edit">
                              <Edit size={16} />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => openDeleteModal(transaction)} className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all duration-200" title="Delete">
                              <Trash2 size={16} />
                            </motion.button>
                          </div>
                          <div className="lg:hidden relative">
                            <button onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === transaction.id ? null : transaction.id); }} className="p-2 hover:bg-gray-600/50 rounded-lg transition-colors duration-200">
                              <MoreVertical size={18} />
                            </button>
                            <AnimatePresence>
                              {actionMenu === transaction.id && (
                                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="absolute right-0 top-10 z-10 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl min-w-[160px] py-2 backdrop-blur-sm">
                                  <button onClick={() => { openModal(transaction); setActionMenu(null); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 transition-colors duration-200">
                                    <Edit size={16} /> Edit
                                  </button>
                                  <button onClick={() => { toggleStatus(transaction); setActionMenu(null); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 transition-colors duration-200">
                                    {transaction.status === 'active' ? <EyeOff size={16} /> : <Eye size={16} />}
                                    {transaction.status === 'active' ? 'Deactivate' : 'Activate'}
                                  </button>
                                  <button onClick={() => { openDeleteModal(transaction); setActionMenu(null); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors duration-200">
                                    <Trash2 size={16} /> Delete
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
                  {searchTerm ? "Try adjusting your search terms or filters." : "Get started by creating your first transaction."}
                </p>
                {!searchTerm && (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openModal()} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-green-500/25 flex items-center gap-3 mx-auto">
                    <Plus size={20} /> Create Your First Transaction
                  </motion.button>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-center gap-4 py-6 border-t border-gray-700/30">
            <div className="text-sm text-gray-400">
              Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total_items)} of {pagination.total_items} entries
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handlePageChange(pagination.current_page - 1)} disabled={pagination.current_page === 1} className={`p-2 rounded-lg border transition-all duration-200 ${pagination.current_page === 1 ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500'}`}>
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => handlePageChange(pagination.current_page + 1)} disabled={pagination.current_page === pagination.total_pages} className={`p-2 rounded-lg border transition-all duration-200 ${pagination.current_page === pagination.total_pages ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500'}`}>
                <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeModal}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700/50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                    {editingTransaction ? 'Edit Transaction' : 'Create New Transaction'}
                  </h2>
                  <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-gray-700/50">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">Stock ID *</label>
                      <input type="text" name="stock_id" value={formData.stock_id} onChange={handleInputChange} required className={`w-full px-4 py-3 bg-gray-700/50 border rounded-xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500 text-white placeholder-gray-400 transition-all duration-200 backdrop-blur-sm ${formErrors.stock_id ? 'border-red-500' : 'border-gray-600/50'}`} placeholder="Enter stock ID" />
                      {formErrors.stock_id && <p className="text-red-400 text-sm mt-2 flex items-center gap-2"><AlertCircle size={16} />{formErrors.stock_id[0]}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">Payment Type *</label>
                      <select name="payment_type_id" value={formData.payment_type_id} onChange={handleInputChange} required className={`w-full px-4 py-3 bg-gray-700/50 border rounded-xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500 text-white transition-all duration-200 backdrop-blur-sm ${formErrors.payment_type_id ? 'border-red-500' : 'border-gray-600/50'}`}>
                        <option value="">Select payment type</option>
                        {paymentTypes.map((pt) => (
                          <option key={pt.id} value={pt.id}>{pt.name}</option>
                        ))}
                      </select>
                      {formErrors.payment_type_id && <p className="text-red-400 text-sm mt-2 flex items-center gap-2"><AlertCircle size={16} />{formErrors.payment_type_id[0]}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">Transaction Type *</label>
                      <div className="grid grid-cols-2 gap-4">
                        <label className={`relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${formData.type === 'Buy' ? 'border-green-500 bg-green-500/10' : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'}`}>
                          <input type="radio" name="type" value="Buy" checked={formData.type === 'Buy'} onChange={handleInputChange} className="sr-only" />
                          <div className="text-center">
                            <TrendingUp size={20} className={`mx-auto mb-2 ${formData.type === 'Buy' ? 'text-green-400' : 'text-gray-400'}`} />
                            <span className={`font-medium ${formData.type === 'Buy' ? 'text-green-400' : 'text-gray-400'}`}>Buy</span>
                          </div>
                        </label>
                        <label className={`relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${formData.type === 'Sell' ? 'border-red-500 bg-red-500/10' : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'}`}>
                          <input type="radio" name="type" value="Sell" checked={formData.type === 'Sell'} onChange={handleInputChange} className="sr-only" />
                          <div className="text-center">
                            <TrendingDown size={20} className={`mx-auto mb-2 ${formData.type === 'Sell' ? 'text-red-400' : 'text-gray-400'}`} />
                            <span className={`font-medium ${formData.type === 'Sell' ? 'text-red-400' : 'text-gray-400'}`}>Sell</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">Amount *</label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} step="0.01" min="0" required className={`w-full pl-12 pr-4 py-3 bg-gray-700/50 border rounded-xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500 text-white placeholder-gray-400 transition-all duration-200 backdrop-blur-sm ${formErrors.amount ? 'border-red-500' : 'border-gray-600/50'}`} placeholder="0.00" />
                      </div>
                      {formErrors.amount && <p className="text-red-400 text-sm mt-2 flex items-center gap-2"><AlertCircle size={16} />{formErrors.amount[0]}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">Status</label>
                      <div className="grid grid-cols-2 gap-4">
                        <label className={`relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${formData.status === 'active' ? 'border-green-500 bg-green-500/10' : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'}`}>
                          <input type="radio" name="status" value="active" checked={formData.status === 'active'} onChange={handleInputChange} className="sr-only" />
                          <div className="text-center">
                            <Eye size={20} className={`mx-auto mb-2 ${formData.status === 'active' ? 'text-green-400' : 'text-gray-400'}`} />
                            <span className={`font-medium ${formData.status === 'active' ? 'text-green-400' : 'text-gray-400'}`}>Active</span>
                          </div>
                        </label>
                        <label className={`relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${formData.status === 'inactive' ? 'border-red-500 bg-red-500/10' : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'}`}>
                          <input type="radio" name="status" value="inactive" checked={formData.status === 'inactive'} onChange={handleInputChange} className="sr-only" />
                          <div className="text-center">
                            <EyeOff size={20} className={`mx-auto mb-2 ${formData.status === 'inactive' ? 'text-red-400' : 'text-gray-400'}`} />
                            <span className={`font-medium ${formData.status === 'inactive' ? 'text-red-400' : 'text-gray-400'}`}>Inactive</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-700/50">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={closeModal} disabled={submitLoading} className="px-6 py-3 text-sm font-medium text-gray-300 hover:text-white transition-colors bg-gray-700/50 hover:bg-gray-600/50 rounded-xl border border-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed">
                      Cancel
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={submitLoading} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeDeleteModal}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl max-w-md w-full border border-red-700/50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-500/20 rounded-xl">
                    <AlertCircle size={24} className="text-red-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-red-400">Confirm Deletion</h2>
                </div>
                <p className="text-gray-300 mb-6">Are you sure you want to delete this transaction? This action cannot be undone.</p>
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                  <div className="text-white font-semibold">{editingTransaction.type} - Stock #{editingTransaction.stock_id}</div>
                  <div className="text-gray-400 text-sm mt-1">Amount: {formatCurrency(editingTransaction.amount)}</div>
                  <div className="text-gray-400 text-sm">Payment: {editingTransaction.paymentType?.name || `ID: ${editingTransaction.payment_type_id}`}</div>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 text-yellow-400 text-sm"><AlertCircle size={16} />This action cannot be undone!</div>
                </div>
                <div className="flex justify-end gap-3">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={closeDeleteModal} className="px-6 py-3 text-sm font-medium text-gray-300 hover:text-white transition-colors bg-gray-700/50 hover:bg-gray-600/50 rounded-xl border border-gray-600/50">
                    Cancel
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleDelete} className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-red-500/25 flex items-center gap-2">
                    <Trash2 size={18} /> Delete Transaction
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