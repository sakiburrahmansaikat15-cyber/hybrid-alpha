import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Check, Loader, ChevronLeft, ChevronRight,
  MoreVertical, Calendar, Layers, RefreshCw, Shield, ToggleLeft, ToggleRight
} from 'lucide-react';

const LEAVE_TYPES_API = '/api/hrm/leave-types';

const LeaveTypes = () => {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMenu, setActionMenu] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    max_days: '',
    status: 'active',
  });

  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [pagination, setPagination] = useState({
    current_page: 1, last_page: 1, per_page: 10, total_items: 0
  });

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
  }, []);

  const handleApiError = useCallback((error, defaultMessage) => {
    if (error.response?.status === 422) {
      setErrors(error.response.data.errors || {});
      showNotification('Validation failed', 'error');
    } else {
      showNotification(error.response?.data?.message || defaultMessage, 'error');
    }
  }, [showNotification]);

  const fetchLeaveTypes = useCallback(async (page = 1, limit = 10, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await axios.get(LEAVE_TYPES_API, { params });
      const data = response.data.pagination || response.data;
      const list = data.data || [];

      setLeaveTypes(list);

      setPagination({
        current_page: data.current_page || 1,
        last_page: data.total_pages || data.last_page || 1,
        per_page: data.per_page || limit,
        total_items: data.total_items || data.total || 0
      });
    } catch (error) {
      console.error(error);
      setLeaveTypes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaveTypes(1, 10);
  }, [fetchLeaveTypes]);

  useEffect(() => {
    const timer = setTimeout(() => fetchLeaveTypes(1, pagination.per_page, searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchLeaveTypes]);

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('.action-menu-btn')) setActionMenu(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handlePageChange = (p) => {
    if (p >= 1 && p <= pagination.last_page) fetchLeaveTypes(p, pagination.per_page, searchTerm);
  };

  const openModal = (type = null) => {
    setErrors({});
    if (type) {
      setEditingLeaveType(type);
      setFormData({
        name: type.name,
        max_days: type.max_days.toString(),
        status: type.status,
      });
    } else {
      setEditingLeaveType(null);
      setFormData({ name: '', max_days: '', status: 'active' });
    }
    setShowModal(true);
    setActionMenu(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');

    try {
      if (editingLeaveType) {
        await axios.post(`${LEAVE_TYPES_API}/${editingLeaveType.id}`, formData);
      } else {
        await axios.post(LEAVE_TYPES_API, formData);
      }
      showNotification(editingLeaveType ? 'Updated successfully' : 'Created successfully');
      fetchLeaveTypes(pagination.current_page, pagination.per_page, searchTerm);
      setShowModal(false);
    } catch (error) {
      handleApiError(error, 'Save failed');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this leave type? It may be used in existing applications.')) return;
    setOperationLoading(`del-${id}`);
    try {
      await axios.delete(`${LEAVE_TYPES_API}/${id}`);
      showNotification('Deleted successfully');
      fetchLeaveTypes(pagination.current_page, pagination.per_page, searchTerm);
    } catch (e) { handleApiError(e, 'Delete failed'); }
    finally { setOperationLoading(null); setActionMenu(null); }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-teal-500/30">
      <AnimatePresence>
        {notification.show && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className={`fixed top-6 right-1/2 translate-x-1/2 z-[60] px-6 py-3 rounded-full shadow-2xl backdrop-blur-md border border-white/10 flex items-center gap-3 font-medium ${notification.type === 'error' ? 'bg-rose-500/20 text-rose-300' : 'bg-teal-500/20 text-teal-300'}`}>
            {notification.type === 'error' ? <Shield size={18} /> : <Check size={18} />} {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400">Leave Types</span>
            </h1>
            <p className="text-slate-400 text-lg">Define leave policies and limits</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openModal()} className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl font-bold text-white shadow-lg shadow-teal-900/20 hover:shadow-teal-900/40 flex items-center gap-2">
            <Plus size={20} /> Create Type
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { label: 'Total Categories', value: pagination.total_items, icon: Layers, color: 'text-teal-400', bg: 'bg-teal-400/10' },
          ].map((s, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">{s.label}</p>
                <h3 className="text-3xl font-bold text-white mt-1">{s.value}</h3>
              </div>
              <div className={`p-4 rounded-xl ${s.bg}`}><s.icon size={24} className={s.color} /></div>
            </div>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md flex flex-col md:flex-row gap-4 items-center justify-between sticky top-4 z-40 shadow-2xl">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-400 transition-colors" size={20} />
            <input type="text" placeholder="Search leave types..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-teal-500/50 outline-none transition-all placeholder:text-slate-500" />
          </div>
          <button onClick={() => fetchLeaveTypes(pagination.current_page, pagination.per_page, searchTerm)} className="p-3 bg-slate-900/50 rounded-xl border border-white/10 hover:text-teal-400 transition-colors">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {leaveTypes.map(type => (
              <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key={type.id} className="group bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden hover:border-teal-500/30 transition-all hover:shadow-xl relative flex flex-col">
                <div className={`h-1 w-full ${type.status === 'active' ? 'bg-teal-500' : 'bg-slate-500'}`} />

                <div className="p-6 flex-1 flex flex-col relative w-full">
                  <div className="absolute top-4 right-4 z-20">
                    <button onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === type.id ? null : type.id); }} className="action-menu-btn p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><MoreVertical size={18} /></button>
                    {actionMenu === type.id && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50 py-1 flex flex-col">
                        <button onClick={() => openModal(type)} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-teal-300 flex items-center gap-2"><Edit size={14} /> Edit</button>
                        <div className="h-px bg-white/5 my-1" />
                        <button onClick={() => handleDelete(type.id)} className="w-full text-left px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"><Trash2 size={14} /> Delete</button>
                      </motion.div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold bg-white/5 border border-white/5 ${type.status === 'active' ? 'text-teal-400' : 'text-slate-500'}`}>
                      <Layers size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white line-clamp-1">{type.name}</h3>
                      <div className={`text-xs font-bold px-2 py-0.5 rounded w-fit mt-1 border ${type.status === 'active' ? 'bg-teal-500/20 text-teal-300 border-teal-500/20' : 'bg-slate-500/20 text-slate-400 border-slate-500/20'}`}>
                        {type.status.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Days Allowed</span>
                    <span className="text-xl font-bold text-white">{type.max_days}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {!loading && pagination.last_page > 1 && (
          <div className="flex justify-center pt-8">
            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/10">
              <button onClick={() => handlePageChange(pagination.current_page - 1)} disabled={pagination.current_page === 1} className="p-3 hover:bg-white/10 rounded-lg disabled:opacity-30 text-white"><ChevronLeft size={20} /></button>
              <span className="px-4 py-3 font-mono text-sm text-slate-400">Page {pagination.current_page} of {pagination.last_page}</span>
              <button onClick={() => handlePageChange(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page} className="p-3 hover:bg-white/10 rounded-lg disabled:opacity-30 text-white"><ChevronRight size={20} /></button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-cyan-500" />
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900 shrink-0">
                <h2 className="text-xl font-bold text-white">{editingLeaveType ? 'Edit Leave Type' : 'New Leave Type'}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"><X size={20} /></button>
              </div>

              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Type Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-teal-500/50 outline-none" required placeholder="e.g. Annual Leave, Sick Leave" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Max Days Allowed *</label>
                    <input type="number" name="max_days" value={formData.max_days} onChange={handleInputChange} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-teal-500/50 outline-none" required placeholder="20" />
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="flex items-center gap-3 bg-slate-800 p-4 rounded-xl border border-white/10 cursor-pointer hover:bg-white/5 transition-colors">
                      <div onClick={() => setFormData({ ...formData, status: formData.status === 'active' ? 'inactive' : 'active' })} className={`w-12 h-6 rounded-full relative transition-colors ${formData.status === 'active' ? 'bg-teal-500' : 'bg-slate-600'}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${formData.status === 'active' ? 'left-7' : 'left-1'}`} />
                      </div>
                      <span className="text-sm font-medium text-slate-300 flex-1">Status: {formData.status.toUpperCase()}</span>
                    </label>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <button type="submit" disabled={operationLoading} className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-teal-900/20 flex items-center justify-center gap-2">
                      {operationLoading && <Loader size={20} className="animate-spin" />} {editingLeaveType ? 'Update Type' : 'Create Type'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeaveTypes;