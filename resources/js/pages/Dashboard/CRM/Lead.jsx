import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Loader, ChevronLeft, ChevronRight,
  Activity, Zap, User, Star, Phone, Mail, Building, Target, Flag,
  Filter, ArrowUpRight, CheckCircle2
} from 'lucide-react';

const API_URL = '/api/crm/leads';
const SOURCES_URL = '/api/crm/lead-sources';
const STATUSES_URL = '/api/crm/lead-statuses';

const Lead = () => {
  const [leads, setLeads] = useState([]);
  const [sources, setSources] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', company: '', score: 0,
    lead_source_id: '', lead_status_id: ''
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
      const [src, sts] = await Promise.all([axios.get(SOURCES_URL), axios.get(STATUSES_URL)]);
      setSources(src.data.pagination?.data || src.data.data || []);
      setStatuses(sts.data.pagination?.data || sts.data.data || []);
    } catch (e) { console.error('Failed to load meta data'); }
  }, []);

  const fetchLeads = useCallback(async (page = 1, keyword = searchTerm) => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.per_page };
      if (keyword.trim()) params.keyword = keyword.trim();
      const response = await axios.get(API_URL, { params });
      const res = response.data.pagination || response.data;
      setLeads(res.data || []);
      setPagination({
        current_page: res.current_page || 1,
        last_page: res.total_pages || res.last_page || 1,
        per_page: res.per_page || 12,
        total_items: res.total_items || res.total || 0,
      });
    } catch (error) {
      handleApiError(error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.per_page, searchTerm, handleApiError]);

  useEffect(() => {
    fetchMeta();
    const timer = setTimeout(() => fetchLeads(1), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchLeads, fetchMeta]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page) return;
    fetchLeads(newPage);
  };

  const openModal = (lead = null) => {
    if (lead) {
      setEditingLead(lead);
      setFormData({
        name: lead.name,
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        score: lead.score || 0,
        lead_source_id: lead.lead_source_id || '',
        lead_status_id: lead.lead_status_id || ''
      });
    } else {
      setEditingLead(null);
      setFormData({ name: '', email: '', phone: '', company: '', score: 0, lead_source_id: '', lead_status_id: '' });
    }
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLead(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');
    try {
      if (editingLead) {
        await axios.put(`${API_URL}/${editingLead.id}`, formData);
        showNotification('Lead updated successfully');
      } else {
        await axios.post(API_URL, formData);
        showNotification('Lead created successfully');
      }
      fetchLeads(pagination.current_page);
      closeModal();
    } catch (error) {
      handleApiError(error);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    setOperationLoading(id);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Lead deleted successfully');
      fetchLeads(1);
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
            <h1 className="text-3xl font-bold tracking-tight dark:text-white mb-1 flex items-center gap-3">
              <Target className="text-indigo-500" /> Leads
            </h1>
            <p className="text-sm text-slate-500">Manage potential customers and sales pipeline</p>
          </div>
          <button onClick={() => openModal()} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20">
            <Plus size={18} />
            <span>New Lead</span>
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="lg:col-span-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
            />
          </div>
          <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <Activity className="text-indigo-500" size={18} />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Leads</span>
            </div>
            <span className="text-xl font-bold text-indigo-600">{pagination.total_items}</span>
          </div>
        </div>

        {loading && leads.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <div key={i} className="h-64 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-800" />)}
          </div>
        ) : leads.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {leads.map((lead) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4 }}
                  className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openModal(lead)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(lead.id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-600 transition-colors">
                        {operationLoading === lead.id ? <Loader className="animate-spin" size={16} /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate mb-1">{lead.name}</h3>
                  <p className="text-sm text-slate-500 mb-4 flex items-center gap-1.5 truncate">
                    <Building size={14} /> {lead.company || 'No Company'}
                  </p>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Mail size={14} className="text-indigo-400" />
                      <span className="truncate">{lead.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Phone size={14} className="text-indigo-400" />
                      <span className="truncate">{lead.phone || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Status & Source Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {lead.lead_status && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                        {lead.lead_status.name}
                      </span>
                    )}
                    {lead.lead_source && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                        {lead.lead_source.name}
                      </span>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Score</span>
                    <div className="flex items-center gap-1">
                      <Star size={14} className={lead.score > 0 ? "text-amber-400 fill-amber-400" : "text-slate-300"} />
                      <span className="font-bold text-slate-700 dark:text-slate-200">{lead.score}</span>
                    </div>
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
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-indigo-500 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-indigo-500 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Target size={64} className="mb-4 opacity-50" />
            <p className="font-semibold text-lg">No Leads Found</p>
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
                <h2 className="text-xl font-bold dark:text-white">{editingLead ? 'Edit Lead' : 'New Lead'}</h2>
                <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="John Doe"
                    required
                  />
                  {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name[0]}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="Acme Corp"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                    <select
                      value={formData.lead_status_id}
                      onChange={e => setFormData({ ...formData, lead_status_id: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      <option value="">Select Status</option>
                      {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Source</label>
                    <select
                      value={formData.lead_source_id}
                      onChange={e => setFormData({ ...formData, lead_source_id: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      <option value="">Select Source</option>
                      {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Lead Score (0-100)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0" max="100"
                      value={formData.score}
                      onChange={e => setFormData({ ...formData, score: e.target.value })}
                      className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <span className="w-10 text-center font-bold text-slate-700 dark:text-slate-300">{formData.score}</span>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                  <button
                    type="submit"
                    disabled={operationLoading === 'saving'}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {operationLoading === 'saving' ? <Loader className="animate-spin" size={18} /> : <Target size={18} />}
                    {editingLead ? 'Update Lead' : 'Create Lead'}
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

export default Lead;
