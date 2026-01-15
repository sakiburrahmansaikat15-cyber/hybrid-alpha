import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Loader, ChevronLeft, ChevronRight,
  AlertCircle, Clock, CheckCircle, HelpCircle, Zap, User
} from 'lucide-react';

const API_URL = '/api/crm/tickets';
const CUSTOMERS_URL = '/api/crm/customers';

const Ticket = () => {
  const [tickets, setTickets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ customer_id: '', subject: '', priority: 'medium', status: 'open' });
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

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await axios.get(CUSTOMERS_URL);
      setCustomers(response.data.pagination?.data || response.data.data || []);
    } catch (e) { console.error('Failed to load customers'); }
  }, []);

  const fetchTickets = useCallback(async (page = 1, keyword = searchTerm) => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.per_page };
      if (keyword.trim()) params.keyword = keyword.trim();
      const response = await axios.get(API_URL, { params });
      const res = response.data.pagination || response.data;
      setTickets(res.data || []);
      setPagination({
        current_page: res.current_page || 1,
        last_page: res.total_pages || res.last_page || 1,
        per_page: res.per_page || 12,
        total_items: res.total_items || res.total || 0,
      });
    } catch (error) {
      handleApiError(error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.per_page, searchTerm, handleApiError]);

  useEffect(() => {
    fetchCustomers();
    const timer = setTimeout(() => fetchTickets(1), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchTickets, fetchCustomers]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page) return;
    fetchTickets(newPage);
  };

  const openModal = (ticket = null) => {
    if (ticket) {
      setEditingTicket(ticket);
      setFormData({
        customer_id: ticket.customer_id || ticket.customer?.id || '',
        subject: ticket.subject || '',
        priority: ticket.priority || 'medium',
        status: ticket.status || 'open'
      });
    } else {
      setEditingTicket(null);
      setFormData({ customer_id: '', subject: '', priority: 'medium', status: 'open' });
    }
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTicket(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');
    try {
      if (editingTicket) {
        await axios.put(`${API_URL}/${editingTicket.id}`, formData);
        showNotification('Ticket updated successfully');
      } else {
        await axios.post(API_URL, formData);
        showNotification('Ticket created successfully');
      }
      fetchTickets(pagination.current_page);
      closeModal();
    } catch (error) {
      handleApiError(error);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this ticket?')) return;
    setOperationLoading(id);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Ticket deleted successfully');
      fetchTickets(1);
    } catch (error) {
      handleApiError(error);
    } finally {
      setOperationLoading(null);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-rose-500 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-900/30';
      case 'medium': return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-900/30';
      case 'low': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/30';
      default: return 'text-slate-500 bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <AlertCircle size={16} />;
      case 'in_progress': return <Clock size={16} />;
      case 'closed': return <CheckCircle size={16} />;
      default: return <HelpCircle size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <AnimatePresence>
        {notification.show && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="fixed top-4 right-4 z-50">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm border ${notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' : 'bg-orange-500/10 border-orange-500/20 text-orange-600'}`}>
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
              <HelpCircle className="text-orange-500" /> Support Tickets
            </h1>
            <p className="text-sm text-slate-500">Manage customer inquiries and support requests</p>
          </div>
          <button onClick={() => openModal()} className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-orange-500/20">
            <Plus size={18} />
            <span>New Ticket</span>
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="lg:col-span-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-medium"
            />
          </div>
          <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-orange-500" size={18} />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</span>
            </div>
            <span className="text-xl font-bold text-orange-600">{pagination.total_items}</span>
          </div>
        </div>

        {loading && tickets.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-800" />)}
          </div>
        ) : tickets.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {tickets.map((ticket) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4 }}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-500/40 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 uppercase tracking-wide ${getPriorityColor(ticket.priority)}`}>
                      <AlertCircle size={12} />
                      {ticket.priority} Priority
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openModal(ticket)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-orange-600 transition-colors">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(ticket.id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-600 transition-colors">
                        {operationLoading === ticket.id ? <Loader className="animate-spin" size={16} /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 truncate">{ticket.subject}</h3>

                  <div className="flex items-center gap-2 mb-4 text-sm text-slate-500">
                    <User size={14} />
                    <span className="truncate">{ticket.customer?.name || 'Unknown Customer'}</span>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <div className={`p-1.5 rounded-full ${ticket.status === 'open' ? 'bg-rose-100 text-rose-600' : ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {getStatusIcon(ticket.status)}
                    </div>
                    <span className="text-sm font-medium capitalize text-slate-700 dark:text-slate-300">
                      {ticket.status.replace('_', ' ')}
                    </span>
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
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-orange-500 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-orange-500 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <HelpCircle size={64} className="mb-4 opacity-50" />
            <p className="font-semibold text-lg">No Tickets Found</p>
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
                <h2 className="text-xl font-bold dark:text-white">{editingTicket ? 'Edit Ticket' : 'New Ticket'}</h2>
                <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    placeholder="Login issue"
                    required
                  />
                  {errors.subject && <p className="text-rose-500 text-xs mt-1">{errors.subject[0]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Customer</label>
                  <select
                    value={formData.customer_id}
                    onChange={e => setFormData({ ...formData, customer_id: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={e => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                  <button
                    type="submit"
                    disabled={operationLoading === 'saving'}
                    className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium shadow-lg shadow-orange-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {operationLoading === 'saving' ? <Loader className="animate-spin" size={18} /> : <HelpCircle size={18} />}
                    {editingTicket ? 'Update Ticket' : 'Create Ticket'}
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

export default Ticket;
