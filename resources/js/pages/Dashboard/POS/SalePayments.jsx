import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  DollarSign,
  Loader,
  ChevronLeft,
  ChevronRight,
  Activity,
  Zap,
  Globe,
  Settings,
  Target,
  Layers,
} from 'lucide-react';

const API_URL = '/api/pos/sale-payments';
const SALES_API_URL = '/api/pos/sales';
const PAYMENT_METHODS_API_URL = '/api/pos/payment-methods';

const SalePayments = () => {
  const [payments, setPayments] = useState([]);
  const [sales, setSales] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    sale_id: '',
    payment_method_id: '',
    amount: '',
    reference_no: '',
  });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 12,
    total_items: 0,
  });

  // Fix: Proper notification cleanup
  const notificationTimerRef = useRef(null);

  const showNotification = useCallback((message, type = 'success') => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }
    setNotification({ show: true, message, type });
    notificationTimerRef.current = setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, []);

  const handleApiError = useCallback((error, defaultMessage) => {
    if (error.response?.status === 422) {
      const validationErrors = error.response.data.errors || {};
      setErrors(validationErrors);
      const firstError = Object.values(validationErrors)[0]?.[0];
      showNotification(firstError || 'Please check your input', 'error');
    } else if (error.response?.data?.message) {
      showNotification(error.response.data.message, 'error');
      setErrors({ _general: error.response.data.message });
    } else {
      showNotification(defaultMessage || 'Connection error', 'error');
      setErrors({ _general: defaultMessage });
    }
  }, [showNotification]);

  // Fix: Extract per_page to prevent infinite loop
  const perPageValue = pagination.per_page;

  const fetchPayments = useCallback(async (page = 1, perPage = perPageValue, keyword = searchTerm) => {
    setLoading(true);
    try {
      const params = { page, limit: perPage };
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await axios.get(API_URL, { params });
      const res = response.data;

      setPayments(res.pagination?.data || []);
      setPagination({
        current_page: res.pagination.current_page || 1,
        last_page: res.pagination.total_pages || 1,
        per_page: res.pagination.per_page || 12,
        total_items: res.pagination.total_items || 0,
      });
    } catch (error) {
      handleApiError(error, 'Failed to load payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [handleApiError, perPageValue, searchTerm]);

  const fetchSecondaryData = useCallback(async () => {
    try {
      const [salesRes, pmRes] = await Promise.all([
        axios.get(SALES_API_URL),
        axios.get(PAYMENT_METHODS_API_URL)
      ]);
      setSales(salesRes.data.pagination?.data || salesRes.data.data || []);
      setPaymentMethods(pmRes.data.pagination?.data || pmRes.data.data || []);
    } catch (error) {
      console.error('Failed to load related data');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayments(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, perPageValue, fetchPayments]);

  useEffect(() => {
    fetchSecondaryData();
  }, [fetchSecondaryData]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page) return;
    fetchPayments(newPage);
  };

  const resetForm = () => {
    setFormData({
      sale_id: '',
      payment_method_id: '',
      amount: '',
      reference_no: '',
    });
    setEditingPayment(null);
    setErrors({});
  };

  const openModal = (payment = null) => {
    if (payment) {
      setEditingPayment(payment);
      setFormData({
        sale_id: payment.sale_id || '',
        payment_method_id: payment.payment_method_id || '',
        amount: payment.amount || '',
        reference_no: payment.reference_no || '',
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
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
      let response;
      if (editingPayment) {
        response = await axios.post(`${API_URL}/${editingPayment.id}`, { ...formData, _method: 'PUT' });
      } else {
        response = await axios.post(API_URL, formData);
      }

      showNotification(
        response.data.message || `Payment ${editingPayment ? 'updated' : 'created'} successfully!`
      );
      fetchPayments(pagination.current_page);
      closeModal();
    } catch (error) {
      handleApiError(error, 'Failed to save payment');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment record?')) return;
    setOperationLoading(`delete-${id}`);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Payment deleted successfully');
      fetchPayments(1);
    } catch (error) {
      handleApiError(error, 'Failed to delete payment');
    } finally {
      setOperationLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <AnimatePresence>
        {notification.show && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="fixed top-4 right-4 z-50"
          >
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm border ${notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'}`}>
              <Zap size={16} />
              <span className="font-semibold text-sm">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight dark:text-white mb-1">
              Sale Payments
            </h1>
            <p className="text-sm text-slate-500">Manage payment transactions</p>
          </div>

          <button onClick={() => openModal()} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors">
            <Plus size={18} />
            <span>Add Payment</span>
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="lg:col-span-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input type="text" placeholder="Search payments..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="text-emerald-500" size={18} />
              <span className="text-xs font-medium text-slate-500">Total</span>
            </div>
            <span className="text-lg font-bold text-emerald-600">{pagination.total_items}</span>
          </div>
        </div>

        {loading && payments.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="h-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl animate-pulse" />)}
          </div>
        ) : payments.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
              {payments.map((p) => (
                <motion.div key={p.id} whileHover={{ y: -4 }}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 rounded-xl p-4 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                      <DollarSign size={20} />
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openModal(p)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <Edit size={16} className="text-slate-400 hover:text-emerald-600" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <Trash2 size={16} className="text-slate-400 hover:text-rose-600" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-emerald-600">
                      ${parseFloat(p.amount).toLocaleString()}
                    </h3>

                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Invoice</span>
                        <span className="font-medium">{p.sale?.invoice_no || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Method</span>
                        <span className="font-medium">{p.payment_method?.name || 'N/A'}</span>
                      </div>
                      {p.reference_no && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Ref</span>
                          <span className="font-mono text-xs">{p.reference_no}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400">{new Date(p.created_at).toLocaleDateString()}</span>
                    <span className="text-xs font-medium text-emerald-600">#{p.id}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="text-sm text-slate-500">
                Page {pagination.current_page} of {pagination.last_page}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handlePageChange(pagination.current_page - 1)} disabled={pagination.current_page === 1}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-30 hover:bg-emerald-500 hover:text-white transition-colors">
                  <ChevronLeft size={20} />
                </button>
                {Array.from({ length: Math.min(pagination.last_page, 5) }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => handlePageChange(p)}
                    className={`w-10 h-10 rounded-lg font-medium transition-all ${pagination.current_page === p ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => handlePageChange(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-30 hover:bg-emerald-500 hover:text-white transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <DollarSign size={64} className="mb-4 opacity-20" />
            <p className="font-medium">No payments found</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{editingPayment ? 'Edit Payment' : 'New Payment'}</h2>
                <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Sale Invoice *</label>
                  <select name="sale_id" value={formData.sale_id} onChange={handleInputChange} required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">Select invoice...</option>
                    {sales.map(s => <option key={s.id} value={s.id}>{s.invoice_no}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Payment Method *</label>
                  <select name="payment_method_id" value={formData.payment_method_id} onChange={handleInputChange} required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">Select method...</option>
                    {paymentMethods.map(pm => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Amount *</label>
                    <input type="number" step="0.01" name="amount" value={formData.amount} onChange={handleInputChange} required placeholder="0.00"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Reference No</label>
                    <input type="text" name="reference_no" value={formData.reference_no} onChange={handleInputChange} placeholder="Optional"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg font-medium hover:bg-slate-200 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={operationLoading === 'saving'}
                    className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
                  >
                    {operationLoading === 'saving' ? <Loader className="animate-spin" size={18} /> : <Target size={18} />}
                    <span>{editingPayment ? 'Update' : 'Create'}</span>
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

export default SalePayments;