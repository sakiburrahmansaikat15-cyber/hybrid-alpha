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
  DollarSign,
  Receipt,
  Calendar,
  User,
  Loader,
  ChevronLeft,
  ChevronRight,
  Package,
  CreditCard,
} from 'lucide-react';

const API_URL = 'http://localhost:8000/api/pos/sales';
const TERMINALS_API_URL = 'http://localhost:8000/api/pos/terminals';
const CUSTOMERS_API_URL = 'http://localhost:8000/api/pos/customers';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMenu, setActionMenu] = useState(null);
  const [formData, setFormData] = useState({
    terminal_id: '',
    customer_id: '',
    invoice_no: '',
    total_amount: '',
    status: 'pending',
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

  // Fetch sales with server-side search & pagination
  const fetchSales = useCallback(async (page = 1, perPage = 10, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit: perPage };
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await axios.get(API_URL, { params });
      const res = response.data;

      const saleData = res.pagination?.data || [];
      const formattedSales = saleData.map(item => ({
        id: item.id,
        invoice_no: item.invoice_no,
        total_amount: item.total_amount,
        status: item.status,
        terminal: item.terminal || null,
        customer: item.customer || null,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      setSales(formattedSales);
      setPagination({
        current_page: res.pagination.current_page || 1,
        last_page: res.pagination.total_pages || 1,
        per_page: res.pagination.per_page || 10,
        total_items: res.pagination.total_items || 0,
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch sales');
      setSales([]);
      setPagination({ current_page: 1, last_page: 1, per_page: 10, total_items: 0 });
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  // Fetch terminals and customers for dropdowns
  const fetchTerminals = useCallback(async () => {
    try {
      const response = await axios.get(TERMINALS_API_URL);
      const res = response.data;
      const terminalData = res.pagination?.data || res.data || [];
      setTerminals(terminalData);
    } catch (error) {
      setTerminals([]);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await axios.get(CUSTOMERS_API_URL);
      const res = response.data;
      const customerData = res.pagination?.data || res.data || [];
      setCustomers(customerData);
    } catch (error) {
      setCustomers([]);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSales(1, pagination.per_page, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchSales]);

  // Initial load
  useEffect(() => {
    fetchSales(1, 10);
    fetchTerminals();
    fetchCustomers();
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page) return;
    fetchSales(newPage, pagination.per_page, searchTerm);
  };

  const handleLimitChange = (newLimit) => {
    const limit = parseInt(newLimit);
    setPagination(prev => ({ ...prev, per_page: limit }));
    fetchSales(1, limit, searchTerm);
  };

  const resetForm = () => {
    setFormData({
      terminal_id: '',
      customer_id: '',
      invoice_no: '',
      total_amount: '',
      status: 'pending',
    });
    setEditingSale(null);
    setErrors({});
  };

  const openModal = (sale = null) => {
    if (sale) {
      setEditingSale(sale);
      setFormData({
        terminal_id: sale.terminal?.id || '',
        customer_id: sale.customer?.id || '',
        invoice_no: sale.invoice_no || '',
        total_amount: sale.total_amount || '',
        status: sale.status || 'pending',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');
    setErrors({});

    try {
      const submitData = {
        terminal_id: formData.terminal_id,
        customer_id: formData.customer_id || null,
        invoice_no: formData.invoice_no.trim(),
        total_amount: parseFloat(formData.total_amount),
        status: formData.status,
      };

      let response;
      if (editingSale) {
        response = await axios.post(`${API_URL}/${editingSale.id}`, submitData);
      } else {
        response = await axios.post(API_URL, submitData);
      }

      showNotification(
        response.data.message || `Sale ${editingSale ? 'updated' : 'created'} successfully!`
      );
      fetchSales(pagination.current_page, pagination.per_page, searchTerm);
      closeModal();
    } catch (error) {
      handleApiError(error, 'Failed to save sale');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sale permanently?')) return;
    setOperationLoading(`delete-${id}`);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Sale deleted successfully');

      const remainingItems = pagination.total_items - 1;
      const maxPage = Math.ceil(remainingItems / pagination.per_page);
      const targetPage = pagination.current_page > maxPage ? maxPage : pagination.current_page;

      fetchSales(targetPage || 1, pagination.per_page, searchTerm);
    } catch (error) {
      handleApiError(error, 'Delete failed');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

  const formatCurrency = (amount) => `$${parseFloat(amount).toFixed(2)}`;

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  useEffect(() => {
    const handler = () => setActionMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  if (loading && sales.length === 0) {
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
              Sales Management
            </h1>
            <p className="text-gray-400 mt-2">Track and manage all point-of-sale transactions</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-green-700 hover:to-cyan-700 px-6 py-3 rounded-xl font-bold flex items-center gap-3 shadow-lg"
          >
            <Plus size={22} /> New Sale
          </button>
        </div>

        {/* Search + Per Page */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/30">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by invoice number or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-green-500/50 outline-none"
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

        {/* Sales Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { staggerChildren: 0.1 } }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8"
        >
          {sales.map(sale => (
            <motion.div
              key={sale.id}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 hover:border-green-500/50 transition-all overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-500/10 rounded-full">
                      <Receipt size={24} className="text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{sale.invoice_no}</h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(sale.status)}`}>
                        {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === sale.id ? null : sale.id); }}
                    className="p-2 hover:bg-gray-700/50 rounded-lg"
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>

                <div className="space-y-3 mt-4">
                  <div className="flex items-center justify-between text-lg font-bold text-green-400">
                    <span>Total Amount</span>
                    <span>{formatCurrency(sale.total_amount)}</span>
                  </div>

                  {sale.terminal && (
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                      <Package size={16} />
                      <span>Terminal: {sale.terminal.name || sale.terminal.id}</span>
                    </div>
                  )}

                  {sale.customer && (
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                      <User size={16} />
                      <span>Customer: {sale.customer.name}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm text-gray-400 mt-6">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} /> Created: {formatDate(sale.created_at)}
                  </div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700/30">
                  <span className="text-xs text-gray-500">Updated: {formatDate(sale.updated_at)}</span>
                  <div className="flex gap-2">
                    <button onClick={() => openModal(sale)} className="p-2 bg-blue-500/20 hover:bg-blue-500/40 rounded-lg">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDelete(sale.id)} className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {actionMenu === sale.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-4 top-20 bg-gray-800 border border-gray-600 rounded-xl shadow-xl py-2 z-10 min-w-[160px]"
                  >
                    <button onClick={() => { openModal(sale); setActionMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-sm">
                      <Edit size={16} /> Edit
                    </button>
                    <button onClick={() => handleDelete(sale.id)} className="w-full text-left px-4 py-2 hover:bg-red-500/20 text-red-400 flex items-center gap-3 text-sm">
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
                      className={`px-4 py-2 rounded-xl border ${pagination.current_page === p ? 'bg-green-600 border-green-500' : 'border-gray-600'}`}
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
        {sales.length === 0 && !loading && (
          <div className="text-center py-20">
            <CreditCard size={64} className="mx-auto text-gray-600 mb-6" />
            <h3 className="text-2xl font-bold mb-3">{searchTerm ? 'No sales found' : 'No sales yet'}</h3>
            <p className="text-gray-400 mb-8">{searchTerm ? 'Try different keywords' : 'Record your first sale'}</p>
            {!searchTerm && (
              <button onClick={() => openModal()} className="bg-gradient-to-r from-green-600 to-cyan-600 px-8 py-3 rounded-xl font-bold">
                <Plus className="inline mr-2" /> Record First Sale
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
              className="bg-gray-800 rounded-3xl p-8 max-w-lg w-full border border-gray-700"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-cyan-500 bg-clip-text text-transparent">
                  {editingSale ? 'Edit Sale' : 'Create New Sale'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-700 rounded-lg">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Terminal *</label>
                  <select
                    name="terminal_id"
                    value={formData.terminal_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="">Select Terminal</option>
                    {terminals.map(terminal => (
                      <option key={terminal.id} value={terminal.id}>{terminal.name || `Terminal ${terminal.id}`}</option>
                    ))}
                  </select>
                  {errors.terminal_id && <p className="text-red-400 text-sm mt-1">{Array.isArray(errors.terminal_id) ? errors.terminal_id[0] : errors.terminal_id}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Customer (Optional)</label>
                  <select
                    name="customer_id"
                    value={formData.customer_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="">Walk-in / No Customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Invoice Number *</label>
                  <input
                    type="text"
                    name="invoice_no"
                    value={formData.invoice_no}
                    onChange={handleInputChange}
                    required
                    placeholder="INV-00123"
                    className={`w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-green-500 outline-none ${errors.invoice_no ? 'border-red-500' : ''}`}
                  />
                  {errors.invoice_no && <p className="text-red-400 text-sm mt-1">{Array.isArray(errors.invoice_no) ? errors.invoice_no[0] : errors.invoice_no}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Total Amount *</label>
                  <input
                    type="number"
                    name="total_amount"
                    value={formData.total_amount}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className={`w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-green-500 outline-none ${errors.total_amount ? 'border-red-500' : ''}`}
                  />
                  {errors.total_amount && <p className="text-red-400 text-sm mt-1">{Array.isArray(errors.total_amount) ? errors.total_amount[0] : errors.total_amount}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={operationLoading === 'saving'}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-cyan-600 rounded-xl font-bold flex items-center gap-2 disabled:opacity-70"
                  >
                    {operationLoading === 'saving' ? <Loader size={20} className="animate-spin" /> : <Check size={20} />}
                    {editingSale ? 'Update' : 'Create'} Sale
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

export default Sales;