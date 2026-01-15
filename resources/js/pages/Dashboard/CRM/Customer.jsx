import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Loader, ChevronLeft, ChevronRight,
  Activity, Zap, User, Briefcase, MapPin, Globe, Mail, Phone, Building
} from 'lucide-react';

const API_URL = '/api/crm/customers';
const COMPANIES_URL = '/api/crm/companies';

const Customer = () => {
  const [customers, setCustomers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', company_id: '',
    type: 'individual', status: 1, address: '', website: ''
  });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 12, total_items: 0 });

  const notificationTimerRef = useRef(null);

  const showNotification = useCallback((message, type = 'success') => {
    if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    setNotification({ show: true, message, type });
    notificationTimerRef.current = setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3500);
  }, []);

  useEffect(() => () => { if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current); }, []);

  const handleApiError = useCallback((error) => {
    if (error.response?.status === 422) {
      const validationErrors = error.response.data.errors || {};
      setErrors(validationErrors);
      showNotification(Object.values(validationErrors)[0]?.[0] || 'Check input fields', 'error');
    } else {
      const msg = error.response?.data?.message || 'Operation failed';
      showNotification(msg, 'error');
    }
  }, [showNotification]);

  const fetchMeta = useCallback(async () => {
    try {
      const response = await axios.get(COMPANIES_URL);
      setCompanies(response.data.pagination?.data || response.data.data || []);
    } catch (e) { console.error('Failed to load companies'); }
  }, []);

  const fetchCustomers = useCallback(async (page = 1, keyword = searchTerm) => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.per_page };
      if (keyword.trim()) params.keyword = keyword.trim();
      const response = await axios.get(API_URL, { params });
      const res = response.data.pagination || response.data;
      setCustomers(res.data || []);
      setPagination({
        current_page: res.current_page || 1,
        last_page: res.total_pages || res.last_page || 1,
        per_page: res.per_page || 12,
        total_items: res.total_items || res.total || 0,
      });
    } catch (error) {
      handleApiError(error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.per_page, searchTerm, handleApiError]);

  useEffect(() => {
    fetchMeta();
    const timer = setTimeout(() => fetchCustomers(1), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchCustomers, fetchMeta]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page) return;
    fetchCustomers(newPage);
  };

  const openModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        company_id: customer.company_id || '',
        type: customer.type || 'individual',
        status: customer.status ? 1 : 0,
        address: customer.address || '',
        website: customer.website || ''
      });
    } else {
      setEditingCustomer(null);
      setFormData({ name: '', email: '', phone: '', company_id: '', type: 'individual', status: 1, address: '', website: '' });
    }
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');
    try {
      if (editingCustomer) {
        await axios.put(`${API_URL}/${editingCustomer.id}`, formData);
        showNotification('Customer updated successfully');
      } else {
        await axios.post(API_URL, formData);
        showNotification('Customer created successfully');
      }
      fetchCustomers(pagination.current_page);
      closeModal();
    } catch (error) {
      handleApiError(error);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    setOperationLoading(id);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Customer deleted successfully');
      fetchCustomers(1);
    } catch (error) {
      handleApiError(error);
    } finally {
      setOperationLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <AnimatePresence>
        {notification.show && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="fixed top-4 right-4 z-50">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm border ${notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' : 'bg-blue-500/10 border-blue-500/20 text-blue-600'}`}>
              <Zap size={16} />
              <span className="font-semibold text-sm">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight dark:text-white mb-1 flex items-center gap-3">
              <User className="text-blue-500" /> Customers
            </h1>
            <p className="text-sm text-slate-500">Manage client relationships and B2B contacts</p>
          </div>
          <button onClick={() => openModal()} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20">
            <Plus size={18} />
            <span>Add Customer</span>
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="lg:col-span-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
            />
          </div>
          <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <Activity className="text-blue-500" size={18} />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</span>
            </div>
            <span className="text-xl font-bold text-blue-600">{pagination.total_items}</span>
          </div>
        </div>

        {loading && customers.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <div key={i} className="h-64 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-800" />)}
          </div>
        ) : customers.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {customers.map((customer) => (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4 }}
                  className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-bold text-sm">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openModal(customer)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(customer.id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-600 transition-colors">
                        {operationLoading === customer.id ? <Loader className="animate-spin" size={16} /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate mb-1">{customer.name}</h3>
                  <p className="text-sm text-slate-500 mb-4 flex items-center gap-1.5 truncate">
                    {customer.company ? (
                      <>
                        <Briefcase size={14} className="text-blue-400" /> {customer.company.name}
                      </>
                    ) : (
                      <span className="text-slate-400 italic">No Company</span>
                    )}
                  </p>

                  <div className="space-y-2 mb-4">
                    {customer.email && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Mail size={14} className="text-slate-400" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Phone size={14} className="text-slate-400" />
                        <span className="truncate">{customer.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${customer.type === 'business' ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                      {customer.type}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${customer.status ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <span className="text-sm font-medium text-slate-500">Page {pagination.current_page} of {pagination.last_page}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-blue-500 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-blue-500 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <User size={64} className="mb-4 opacity-50" />
            <p className="font-semibold text-lg">No Customers Found</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-bold dark:text-white">{editingCustomer ? 'Edit Customer' : 'New Customer'}</h2>
                <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Jane Smith"
                    required
                  />
                  {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name[0]}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="Email"
                      />
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="Phone"
                      />
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company</label>
                    <select
                      value={formData.company_id}
                      onChange={e => setFormData({ ...formData, company_id: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option value="">No Company</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option value="individual">Individual</option>
                      <option value="business">Business</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all h-20 resize-none"
                    placeholder="123 Main St"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-3 p-3 border border-slate-100 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.status == 1}
                      onChange={e => setFormData({ ...formData, status: e.target.checked ? 1 : 0 })}
                      className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="font-medium text-sm">Active Customer</span>
                  </label>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                  <button
                    type="submit"
                    disabled={operationLoading === 'saving'}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {operationLoading === 'saving' ? <Loader className="animate-spin" size={18} /> : <div className="flex items-center gap-2"><User size={18} /> {editingCustomer ? 'Update' : 'Create'}</div>}
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

export default Customer;
