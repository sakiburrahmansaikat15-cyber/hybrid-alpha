import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Loader, ChevronLeft, ChevronRight,
  Activity, Zap, Target, MapPin, User, Globe, Home
} from 'lucide-react';

const API_URL = '/api/pos/customer-addresses';
const CUSTOMERS_API = '/api/pos/customers';

const CustomerAddresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    customer_id: '', address_line_1: '', address_line_2: '', city: '', state: '', zip_code: '', country: '', is_default: 0
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

  const fetchAddresses = useCallback(async (page = 1, keyword = searchTerm) => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.per_page };
      if (keyword.trim()) params.keyword = keyword.trim();
      const response = await axios.get(API_URL, { params });
      const res = response.data;
      setAddresses(res.pagination?.data || res.data || []);
      setPagination({
        current_page: res.pagination?.current_page || res.current_page || 1,
        last_page: res.pagination?.total_pages || res.last_page || 1,
        per_page: res.pagination?.per_page || res.per_page || 12,
        total_items: res.pagination?.total_items || res.total || 0,
      });
    } catch (error) {
      handleApiError(error);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.per_page, searchTerm, handleApiError]);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await axios.get(CUSTOMERS_API);
      setCustomers(response.data.pagination?.data || response.data.data || []);
    } catch (e) { console.error('Failed to load customers'); }
  }, []);

  useEffect(() => {
    fetchCustomers();
    const timer = setTimeout(() => fetchAddresses(1), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchAddresses, fetchCustomers]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page) return;
    fetchAddresses(newPage);
  };

  const openModal = (address = null) => {
    if (address) {
      setEditingAddress(address);
      setFormData({
        customer_id: address.customer_id,
        address_line_1: address.address_line_1,
        address_line_2: address.address_line_2 || '',
        city: address.city,
        state: address.state || '',
        zip_code: address.zip_code,
        country: address.country,
        is_default: address.is_default
      });
    } else {
      setEditingAddress(null);
      setFormData({ customer_id: '', address_line_1: '', address_line_2: '', city: '', state: '', zip_code: '', country: '', is_default: 0 });
    }
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAddress(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');
    try {
      if (editingAddress) {
        await axios.put(`${API_URL}/${editingAddress.id}`, formData);
        showNotification('Address updated successfully');
      } else {
        await axios.post(API_URL, formData);
        showNotification('Address created successfully');
      }
      fetchAddresses(pagination.current_page);
      closeModal();
    } catch (error) {
      handleApiError(error);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    setOperationLoading(id);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Address deleted successfully');
      fetchAddresses(1);
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
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm border ${notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' : 'bg-rose-500/10 border-rose-500/20 text-rose-600'}`}>
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
              <MapPin className="text-rose-500" /> Customer Addresses
            </h1>
            <p className="text-sm text-slate-500">Manage delivery locations and billing addresses</p>
          </div>
          <button onClick={() => openModal()} className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-rose-500/20">
            <Plus size={18} />
            <span>Add Address</span>
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="lg:col-span-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search addresses (city, zip, street)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all font-medium"
            />
          </div>
          <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <Activity className="text-rose-500" size={18} />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</span>
            </div>
            <span className="text-xl font-bold text-rose-600">{pagination.total_items}</span>
          </div>
        </div>

        {loading && addresses.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-800" />)}
          </div>
        ) : addresses.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {addresses.map((addr) => (
                <motion.div
                  key={addr.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4 }}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500/40 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all flex flex-col"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600">
                      <Home size={20} />
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openModal(addr)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-600 transition-colors">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(addr.id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-600 transition-colors">
                        {operationLoading === addr.id ? <Loader className="animate-spin" size={16} /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3 text-slate-600 dark:text-slate-300 font-medium">
                    <User size={16} className="text-slate-400" />
                    <span className="truncate">{addr.customer?.name || 'Unknown Customer'}</span>
                  </div>

                  <div className="flex-1 space-y-1 mb-4">
                    <p className="text-slate-900 dark:text-white font-bold line-clamp-1">{addr.address_line_1}</p>
                    {addr.address_line_2 && <p className="text-slate-500 text-sm">{addr.address_line_2}</p>}
                    <p className="text-slate-500 text-sm">
                      {addr.city}, {addr.state} {addr.zip_code}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-1 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <Globe size={12} /> {addr.country}
                    </div>
                    {addr.is_default ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-xs font-bold uppercase">Default</span>
                    ) : null}
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
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-rose-500 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-rose-500 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <MapPin size={64} className="mb-4 opacity-50" />
            <p className="font-semibold text-lg">No Addresses Found</p>
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
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-bold dark:text-white">{editingAddress ? 'Edit Address' : 'New Address'}</h2>
                <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Customer</label>
                  <select
                    value={formData.customer_id}
                    onChange={e => setFormData({ ...formData, customer_id: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {errors.customer_id && <p className="text-rose-500 text-xs mt-1">{errors.customer_id[0]}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address Line 1</label>
                    <input
                      type="text"
                      value={formData.address_line_1}
                      onChange={e => setFormData({ ...formData, address_line_1: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                      placeholder="Street address"
                      required
                    />
                    {errors.address_line_1 && <p className="text-rose-500 text-xs mt-1">{errors.address_line_1[0]}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      value={formData.address_line_2}
                      onChange={e => setFormData({ ...formData, address_line_2: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                      placeholder="Apt, Suite, Unit"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                      required
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={e => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Zip Code</label>
                    <input
                      type="text"
                      value={formData.zip_code}
                      onChange={e => setFormData({ ...formData, zip_code: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                      required
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Country</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={e => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-3 p-3 border border-slate-100 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.is_default == 1}
                      onChange={e => setFormData({ ...formData, is_default: e.target.checked ? 1 : 0 })}
                      className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500 border-gray-300"
                    />
                    <span className="font-medium text-sm">Set as Default Address</span>
                  </label>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                  <button
                    type="submit"
                    disabled={operationLoading === 'saving'}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium shadow-lg shadow-rose-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {operationLoading === 'saving' ? <Loader className="animate-spin" size={18} /> : <Target size={18} />}
                    {editingAddress ? 'Update Address' : 'Save Address'}
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

export default CustomerAddresses;