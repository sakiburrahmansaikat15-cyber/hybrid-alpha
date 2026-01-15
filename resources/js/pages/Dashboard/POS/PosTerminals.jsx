import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Loader, ChevronLeft, ChevronRight,
  Activity, Zap, Target, Monitor, MapPin
} from 'lucide-react';

const API_URL = '/api/pos/terminals';

const PosTerminals = () => {
  const [terminals, setTerminals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTerminal, setEditingTerminal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', location: '', status: 'active' });
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

  const handleApiError = useCallback((error, defaultMessage) => {
    if (error.response?.status === 422) {
      const validationErrors = error.response.data.errors || {};
      setErrors(validationErrors);
      showNotification(Object.values(validationErrors)[0]?.[0] || 'Please check your input', 'error');
    } else {
      showNotification(error.response?.data?.message || defaultMessage || 'Connection error', 'error');
    }
  }, [showNotification]);

  const perPageValue = pagination.per_page;
  const fetchTerminals = useCallback(async (page = 1, perPage = perPageValue, keyword = searchTerm) => {
    setLoading(true);
    try {
      const params = { page, limit: perPage };
      if (keyword.trim()) params.keyword = keyword.trim();
      const response = await axios.get(API_URL, { params });
      const res = response.data;
      setTerminals(res.pagination?.data || []);
      setPagination({
        current_page: res.pagination.current_page || 1,
        last_page: res.pagination.total_pages || 1,
        per_page: res.pagination.per_page || 12,
        total_items: res.pagination.total_items || 0,
      });
    } catch (error) {
      handleApiError(error, 'Failed to load terminals');
      setTerminals([]);
    } finally {
      setLoading(false);
    }
  }, [handleApiError, perPageValue, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => fetchTerminals(1), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, perPageValue, fetchTerminals]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page) return;
    fetchTerminals(newPage);
  };

  const resetForm = () => {
    setFormData({ name: '', location: '', status: 'active' });
    setEditingTerminal(null);
    setErrors({});
  };

  const openModal = (terminal = null) => {
    if (terminal) {
      setEditingTerminal(terminal);
      setFormData({ name: terminal.name || '', location: terminal.location || '', status: terminal.status || 'active' });
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
      if (editingTerminal) {
        response = await axios.post(`${API_URL}/${editingTerminal.id}`, { ...formData, _method: 'PUT' });
      } else {
        response = await axios.post(API_URL, formData);
      }
      showNotification(response.data.message || `Terminal ${editingTerminal ? 'updated' : 'created'} successfully!`);
      fetchTerminals(pagination.current_page);
      closeModal();
    } catch (error) {
      handleApiError(error, 'Failed to save terminal');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this terminal?')) return;
    setOperationLoading(`delete-${id}`);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Terminal deleted successfully');
      fetchTerminals(1);
    } catch (error) {
      handleApiError(error, 'Failed to delete terminal');
    } finally {
      setOperationLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <AnimatePresence>
        {notification.show && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="fixed top-4 right-4 z-50">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm border ${notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-600'}`}>
              <Zap size={16} />
              <span className="font-semibold text-sm">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight dark:text-white mb-1">POS Terminals</h1>
            <p className="text-sm text-slate-500">Manage terminal devices</p>
          </div>
          <button onClick={() => openModal()} className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors">
            <Plus size={18} />
            <span>Add Terminal</span>
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="lg:col-span-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input type="text" placeholder="Search terminals..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="text-cyan-500" size={18} />
              <span className="text-xs font-medium text-slate-500">Total</span>
            </div>
            <span className="text-lg font-bold text-cyan-600">{pagination.total_items}</span>
          </div>
        </div>

        {loading && terminals.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="h-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl animate-pulse" />)}
          </div>
        ) : terminals.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
              {terminals.map((t) => (
                <motion.div key={t.id} whileHover={{ y: -4 }}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/40 rounded-xl p-4 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600">
                      <Monitor size={20} />
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openModal(t)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <Edit size={16} className="text-slate-400 hover:text-cyan-600" />
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <Trash2 size={16} className="text-slate-400 hover:text-rose-600" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{t.name}</h3>

                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-slate-500">
                        <MapPin size={14} />
                        <span className="truncate">{t.location || 'No location'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Status</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-right">
                    <span className="text-xs font-medium text-cyan-600">#{t.id}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="text-sm text-slate-500">Page {pagination.current_page} of {pagination.last_page}</div>
              <div className="flex items-center gap-2">
                <button onClick={() => handlePageChange(pagination.current_page - 1)} disabled={pagination.current_page === 1}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-30 hover:bg-cyan-500 hover:text-white transition-colors">
                  <ChevronLeft size={20} />
                </button>
                {Array.from({ length: Math.min(pagination.last_page, 5) }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => handlePageChange(p)}
                    className={`w-10 h-10 rounded-lg font-medium transition-all ${pagination.current_page === p ? 'bg-cyan-500 text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => handlePageChange(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-30 hover:bg-cyan-500 hover:text-white transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Monitor size={64} className="mb-4 opacity-20" />
            <p className="font-medium">No terminals found</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{editingTerminal ? 'Edit Terminal' : 'New Terminal'}</h2>
                <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Terminal Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="e.g. Main Counter"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Location</label>
                  <input type="text" name="location" value={formData.location} onChange={handleInputChange} placeholder="e.g. Floor 1, Section A"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Status *</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg font-medium hover:bg-slate-200 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={operationLoading === 'saving'}
                    className="flex-1 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2">
                    {operationLoading === 'saving' ? <Loader className="animate-spin" size={18} /> : <Target size={18} />}
                    <span>{editingTerminal ? 'Update' : 'Create'}</span>
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

export default PosTerminals;