import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Check,
  Download,
  Upload,
  Filter,
  ArrowUp,
  ArrowDown,
  Calendar,
  CreditCard,
  Package,
  DollarSign,
  BarChart3,
  Image as ImageIcon
} from 'lucide-react';

const TransactionsManager = () => {
  const [transactions, setTransactions] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    type: 'income',
    amount: 0,
    stock_id: '',
    payment_type_id: '',
    image: null,
    status: true
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});

  // Safe array access helper
  const safeArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    return [];
  };

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [transactionsRes, stocksRes, paymentTypesRes] = await Promise.all([
        axios.get('/api/transactions'),
        axios.get('/api/stocks'),
        axios.get('/api/payment-types')
      ]);

      setTransactions(safeArray(transactionsRes.data));
      setStocks(safeArray(stocksRes.data));
      setPaymentTypes(safeArray(paymentTypesRes.data));
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('Error fetching data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Search transactions
  const searchTransactions = async () => {
    if (!searchTerm.trim()) {
      fetchData();
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/api/transactions/search?search=${encodeURIComponent(searchTerm)}`);
      setTransactions(safeArray(response.data));
    } catch (error) {
      console.error('Error searching transactions:', error);
      showNotification('Error searching transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked :
              type === 'file' ? files[0] : value
    }));

    // Handle image preview
    if (name === 'image' && files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(files[0]);
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'image' && formData[key]) {
        submitData.append('image', formData[key]);
      } else {
        submitData.append(key, formData[key]);
      }
    });

    try {
      if (editingTransaction) {
        await axios.post(`/api/transactions/${editingTransaction.id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showNotification('Transaction updated successfully!', 'success');
      } else {
        await axios.post('/api/transactions', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showNotification('Transaction created successfully!', 'success');
      }

      resetForm();
      fetchData();
      setShowModal(false);
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        showNotification('Error saving transaction', 'error');
      }
    }
  };

  // Edit transaction
  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type || 'income',
      amount: parseFloat(transaction.amount) || 0,
      stock_id: transaction.stock_id || '',
      payment_type_id: transaction.payment_type_id || '',
      image: null,
      status: transaction.status !== undefined ? transaction.status : true
    });
    setImagePreview(transaction.image ? `/${transaction.image}` : null);
    setShowModal(true);
  };

  // Delete transaction
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      await axios.delete(`/api/transactions/${id}`);
      showNotification('Transaction deleted successfully!', 'success');
      fetchData();
    } catch (error) {
      showNotification('Error deleting transaction', 'error');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      type: 'income',
      amount: 0,
      stock_id: '',
      payment_type_id: '',
      image: null,
      status: true
    });
    setImagePreview(null);
    setEditingTransaction(null);
    setErrors({});
  };

  // Show notification
  const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg z-50 ${
      type === 'success' ? 'bg-green-600' :
      type === 'error' ? 'bg-red-600' : 'bg-blue-600'
    } text-white shadow-lg`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  // Calculate statistics
  const stats = {
    totalTransactions: transactions.length,
    totalIncome: transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
    totalExpense: transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
    netAmount: transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) -
      transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
    activeTransactions: transactions.filter(t => t.status).length
  };

  // Sort and filter transactions
  const sortedAndFilteredTransactions = transactions
    .filter(transaction => {
      if (typeFilter !== 'all' && transaction.type !== typeFilter) return false;
      if (statusFilter !== 'all') {
        if (statusFilter === 'active' && !transaction.status) return false;
        if (statusFilter === 'inactive' && transaction.status) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'stock') {
        aValue = a.stock?.name || '';
        bValue = b.stock?.name || '';
      } else if (sortField === 'payment_type') {
        aValue = a.payment_type?.name || '';
        bValue = b.payment_type?.name || '';
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Initialize
  useEffect(() => {
    fetchData();
  }, []);

  // Safe data access helpers
  const getStockName = (transaction) => transaction.stock?.name || 'N/A';
  const getPaymentTypeName = (transaction) => transaction.payment_type?.name || 'N/A';

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Transaction Management</h1>
            <p className="text-gray-400 mt-1">Manage financial transactions and payments</p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium shadow-lg shadow-blue-600/25"
          >
            <Plus size={20} />
            Add Transaction
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-blue-400" size={24} />
              <div>
                <div className="text-2xl font-bold text-white">{stats.totalTransactions}</div>
                <div className="text-gray-400 text-sm">Total Transactions</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
            <div className="flex items-center gap-3">
              <ArrowDown className="text-green-400" size={24} />
              <div>
                <div className="text-2xl font-bold text-white">${stats.totalIncome.toLocaleString()}</div>
                <div className="text-gray-400 text-sm">Total Income</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-red-500">
            <div className="flex items-center gap-3">
              <ArrowUp className="text-red-400" size={24} />
              <div>
                <div className="text-2xl font-bold text-white">${stats.totalExpense.toLocaleString()}</div>
                <div className="text-gray-400 text-sm">Total Expense</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-purple-500">
            <div className="flex items-center gap-3">
              <DollarSign className="text-purple-400" size={24} />
              <div>
                <div className="text-2xl font-bold text-white">${stats.netAmount.toLocaleString()}</div>
                <div className="text-gray-400 text-sm">Net Amount</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by amount, stock, payment type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchTransactions()}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Sort */}
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="created_at">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="type">Sort by Type</option>
              <option value="stock">Sort by Stock</option>
              <option value="payment_type">Sort by Payment Type</option>
            </select>

            {/* Sort Direction */}
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="p-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg transition-colors duration-200 text-white"
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={searchTransactions}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium"
              >
                Search
              </button>
              {(searchTerm || typeFilter !== 'all' || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setTypeFilter('all');
                    setStatusFilter('all');
                    fetchData();
                  }}
                  className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Transactions Grid */}
        {!loading && sortedAndFilteredTransactions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedAndFilteredTransactions.map((transaction) => (
              <div key={transaction.id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-700">
                {/* Image */}
                {transaction.image && (
                  <div className="h-48 bg-gray-700 overflow-hidden">
                    <img
                      src={`/${transaction.image}`}
                      alt="Transaction receipt"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden h-full w-full flex items-center justify-center bg-gray-600">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        transaction.type === 'income'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {transaction.type === 'income' ? 'Income' : 'Expense'}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.status
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {transaction.status ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Amount */}
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${
                        transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        ${parseFloat(transaction.amount || 0).toFixed(2)}
                      </div>
                      <p className="text-sm text-gray-400">Transaction Amount</p>
                    </div>

                    {/* Stock and Payment Type */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="text-blue-400" size={16} />
                        <span className="text-gray-300">Stock:</span>
                        <span className="text-white font-medium">{getStockName(transaction)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="text-purple-400" size={16} />
                        <span className="text-gray-300">Payment:</span>
                        <span className="text-white font-medium">{getPaymentTypeName(transaction)}</span>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Calendar size={14} />
                      <span>
                        {transaction.created_at ? new Date(transaction.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
                    <span className="text-xs text-gray-500">
                      ID: {transaction.id}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors duration-200"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors duration-200"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && sortedAndFilteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
              <BarChart3 className="mx-auto text-gray-500 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Transactions Found
              </h3>
              <p className="text-gray-400 mb-4">
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'No transactions match your search criteria. Try different filters.'
                  : 'Get started by adding your first transaction.'}
              </p>
              {!searchTerm && typeFilter === 'all' && statusFilter === 'all' && (
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium"
                >
                  Add Transaction
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">
                {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200 text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Transaction Type and Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Transaction Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                  {errors.type && (
                    <p className="text-red-400 text-sm mt-1">{errors.type}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                  {errors.amount && (
                    <p className="text-red-400 text-sm mt-1">{errors.amount}</p>
                  )}
                </div>
              </div>

              {/* Stock and Payment Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Stock *
                  </label>
                  <select
                    name="stock_id"
                    value={formData.stock_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Stock</option>
                    {stocks.map((stock) => (
                      <option key={stock.id} value={stock.id}>
                        {stock.name}
                      </option>
                    ))}
                  </select>
                  {errors.stock_id && (
                    <p className="text-red-400 text-sm mt-1">{errors.stock_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Payment Type *
                  </label>
                  <select
                    name="payment_type_id"
                    value={formData.payment_type_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Payment Type</option>
                    {paymentTypes.map((paymentType) => (
                      <option key={paymentType.id} value={paymentType.id}>
                        {paymentType.name}
                      </option>
                    ))}
                  </select>
                  {errors.payment_type_id && (
                    <p className="text-red-400 text-sm mt-1">{errors.payment_type_id}</p>
                  )}
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Transaction Image
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    name="image"
                    onChange={handleInputChange}
                    accept="image/*"
                    className="flex-1 text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                  {imagePreview && (
                    <div className="w-20 h-20 border border-gray-600 rounded-lg overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
                {errors.image && (
                  <p className="text-red-400 text-sm mt-1">{errors.image}</p>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center gap-3 p-4 bg-gray-750 rounded-lg">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="status"
                    checked={formData.status}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <div>
                  <span className="text-sm font-medium text-gray-300">
                    Active Status
                  </span>
                  <p className="text-xs text-gray-400">
                    {formData.status ? 'Transaction is active' : 'Transaction is inactive'}
                  </p>
                </div>
              </div>

              {/* Amount Preview */}
              <div className="p-4 bg-gray-750 rounded-lg">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    formData.type === 'income' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    ${parseFloat(formData.amount || 0).toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-400 capitalize">
                    {formData.type} Amount
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  {editingTransaction ? 'Update Transaction' : 'Create Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsManager;
