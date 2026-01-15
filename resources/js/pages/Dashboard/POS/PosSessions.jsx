import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Loader, ChevronLeft, ChevronRight,
  Activity, Zap, Target, Clock, DollarSign, Calendar, TrendingUp
} from 'lucide-react';

const API_URL = '/api/pos/sessions';
const TERMINALS_API = '/api/pos/terminals';

const PosSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ terminal_id: '', opening_cash: '', closing_cash: '', opened_at: '', closed_at: '' });
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
  const fetchSessions = useCallback(async (page = 1, perPage = perPageValue, keyword = searchTerm) => {
    setLoading(true);
    try {
      const params = { page, limit: perPage };
      if (keyword.trim()) params.keyword = keyword.trim();
      const response = await axios.get(API_URL, { params });
      const res = response.data;
      setSessions(res.pagination?.data || []);
      setPagination({
        current_page: res.pagination.current_page || 1,
        last_page: res.pagination.total_pages || 1,
        per_page: res.pagination.per_page || 12,
        total_items: res.pagination.total_items || 0,
      });
    } catch (error) {
      handleApiError(error, 'Failed to load sessions');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [handleApiError, perPageValue, searchTerm]);

  const fetchTerminals = useCallback(async () => {
    try {
      const response = await axios.get(TERMINALS_API);
      setTerminals(response.data.pagination?.data || response.data.data || []);
    } catch (error) {
      console.error('Failed to load terminals');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchSessions(1), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, perPageValue, fetchSessions]);

  useEffect(() => {
    fetchTerminals();
  }, [fetchTerminals]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page) return;
    fetchSessions(newPage);
  };

  const resetForm = () => {
    setFormData({ terminal_id: '', opening_cash: '', closing_cash: '', opened_at: '', closed_at: '' });
    setEditingSession(null);
    setErrors({});
  };

  const openModal = (session = null) => {
    if (session) {
      setEditingSession(session);
      setFormData({
        terminal_id: session.terminal_id || '',
        opening_cash: session.opening_cash || '',
        closing_cash: session.closing_cash || '',
        opened_at: session.opened_at || '',
        closed_at: session.closed_at || '',
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
      if (editingSession) {
        response = await axios.post(`${API_URL}/${editingSession.id}`, { ...formData, _method: 'PUT' });
      } else {
        response = await axios.post(API_URL, formData);
      }
      showNotification(response.data.message || `Session ${editingSession ? 'updated' : 'created'} successfully!`);
      fetchSessions(pagination.current_page);
      closeModal();
    } catch (error) {
      handleApiError(error, 'Failed to save session');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this session?')) return;
    setOperationLoading(`delete-${id}`);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Session deleted successfully');
      fetchSessions(1);
    } catch (error) {
      handleApiError(error, 'Failed to delete session');
    } finally {
      setOperationLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <AnimatePresence>
        {notification.show && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="fixed top-4 right-4 z-50">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm border ${notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600'}`}>
              <Zap size={16} />
              <span className="font-semibold text-sm">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight dark:text-white mb-1">POS Sessions</h1>
            <p className="text-sm text-slate-500">Manage terminal sessions</p>
          </div>
          <button onClick={() => openModal()} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
            <Plus size={18} />
            <span>New Session</span>
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="lg:col-span-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input type="text" placeholder="Search sessions..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="text-indigo-500" size={18} />
              <span className="text-xs font-medium text-slate-500">Total</span>
            </div>
            <span className="text-lg font-bold text-indigo-600">{pagination.total_items}</span>
          </div>
        </div>

        {loading && sessions.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl animate-pulse" />)}
          </div>
        ) : sessions.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {sessions.map((s) => (
                <motion.div key={s.id} whileHover={{ y: -4 }}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 rounded-xl p-4 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
                      <Clock size={20} />
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openModal(s)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <Edit size={16} className="text-slate-400 hover:text-indigo-600" />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <Trash2 size={16} className="text-slate-400 hover:text-rose-600" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-medium text-slate-500 mb-1">Terminal</h3>
                      <p className="text-lg font-bold text-slate-900 dark:text-white truncate">{s.terminal?.name || 'Unknown'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                        <div className="flex items-center gap-2 text-emerald-600 mb-1">
                          <TrendingUp size={14} />
                          <span className="text-xs font-medium">Opening</span>
                        </div>
                        <p className="text-lg font-bold">${parseFloat(s.opening_cash || 0).toFixed(2)}</p>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-600 mb-1">
                          <DollarSign size={14} />
                          <span className="text-xs font-medium">Closing</span>
                        </div>
                        <p className="text-lg font-bold">${parseFloat(s.closing_cash || 0).toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar size={14} />
                        <span>Opened: {s.opened_at ? new Date(s.opened_at).toLocaleString() : 'N/A'}</span>
                      </div>
                      {s.closed_at && (
                        <div className="flex items-center gap-2 text-slate-500">
                          <Calendar size={14} />
                          <span>Closed: {new Date(s.closed_at).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.closed_at ? 'bg-slate-100 text-slate-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {s.closed_at ? 'Closed' : 'Active'}
                    </span>
                    <span className="text-xs font-medium text-indigo-600">#{s.id}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="text-sm text-slate-500">Page {pagination.current_page} of {pagination.last_page}</div>
              <div className="flex items-center gap-2">
                <button onClick={() => handlePageChange(pagination.current_page - 1)} disabled={pagination.current_page === 1}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-30 hover:bg-indigo-500 hover:text-white transition-colors">
                  <ChevronLeft size={20} />
                </button>
                {Array.from({ length: Math.min(pagination.last_page, 5) }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => handlePageChange(p)}
                    className={`w-10 h-10 rounded-lg font-medium transition-all ${pagination.current_page === p ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => handlePageChange(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-30 hover:bg-indigo-500 hover:text-white transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Clock size={64} className="mb-4 opacity-20" />
            <p className="font-medium">No sessions found</p>
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
                <h2 className="text-2xl font-bold">{editingSession ? 'Edit Session' : 'New Session'}</h2>
                <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Terminal *</label>
                  <select name="terminal_id" value={formData.terminal_id} onChange={handleInputChange} required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
                    <option value="">Select terminal...</option>
                    {terminals.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Opening Cash *</label>
                    <input type="number" step="0.01" name="opening_cash" value={formData.opening_cash} onChange={handleInputChange} required placeholder="0.00"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Closing Cash</label>
                    <input type="number" step="0.01" name="closing_cash" value={formData.closing_cash} onChange={handleInputChange} placeholder="0.00"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Opened At *</label>
                    <input type="datetime-local" name="opened_at" value={formData.opened_at} onChange={handleInputChange} required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Closed At</label>
                    <input type="datetime-local" name="closed_at" value={formData.closed_at} onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg font-medium hover:bg-slate-200 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={operationLoading === 'saving'}
                    className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2">
                    {operationLoading === 'saving' ? <Loader className="animate-spin" size={18} /> : <Target size={18} />}
                    <span>{editingSession ? 'Update' : 'Create'}</span>
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

export default PosSessions;