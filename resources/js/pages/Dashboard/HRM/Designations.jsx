import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Check, Loader, ChevronLeft, ChevronRight,
  MoreVertical, Briefcase, Building, RefreshCw, Layers, Shield
} from 'lucide-react';

const DESIGNATIONS_API = '/api/hrm/designations';
const DEPARTMENTS_API = '/api/hrm/departments';

const Designations = () => {
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [actionMenu, setActionMenu] = useState(null);

  const [formData, setFormData] = useState({ name: '', department_id: '' });
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

  const fetchDesignations = useCallback(async (page = 1, limit = 10, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await axios.get(DESIGNATIONS_API, { params });
      const data = response.data.pagination || response.data;
      const list = data.data || [];

      setDesignations(list.map(d => ({
        ...d,
        department: d.department?.name || '—'
      })));

      setPagination({
        current_page: data.current_page || 1,
        last_page: data.total_pages || data.last_page || 1,
        per_page: data.per_page || limit,
        total_items: data.total_items || data.total || 0
      });
    } catch (error) {
      console.error(error);
      setDesignations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDepartments = async () => {
    setDropdownLoading(true);
    try {
      const response = await axios.get(DEPARTMENTS_API);
      const data = response.data.pagination?.data || response.data?.data || [];
      setDepartments(data);
    } catch (error) {
      console.error(error);
    } finally {
      setDropdownLoading(false);
    }
  };

  useEffect(() => {
    fetchDesignations(1, 10);
    fetchDepartments();
  }, [fetchDesignations]);

  useEffect(() => {
    const timer = setTimeout(() => fetchDesignations(1, pagination.per_page, searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchDesignations]);

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('.action-menu-btn')) setActionMenu(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handlePageChange = (p) => {
    if (p >= 1 && p <= pagination.last_page) fetchDesignations(p, pagination.per_page, searchTerm);
  };

  const openModal = (desig = null) => {
    setErrors({});
    if (desig) {
      setEditingDesignation(desig);
      setFormData({
        name: desig.name,
        department_id: desig.department_id || desig.department?.id || ''
      });
    } else {
      setEditingDesignation(null);
      setFormData({ name: '', department_id: '' });
    }
    setShowModal(true);
    setActionMenu(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');

    const payload = new FormData();
    payload.append('name', formData.name);
    payload.append('department_id', formData.department_id);

    try {
      if (editingDesignation) {
        await axios.post(`${DESIGNATIONS_API}/${editingDesignation.id}`, payload);
      } else {
        await axios.post(DESIGNATIONS_API, payload);
      }
      showNotification(editingDesignation ? 'Updated successfully' : 'Created successfully');
      fetchDesignations(pagination.current_page, pagination.per_page, searchTerm);
      setShowModal(false);
    } catch (error) {
      handleApiError(error, 'Save failed');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this designation? This may affect employee records.')) return;
    setOperationLoading(`del-${id}`);
    try {
      await axios.delete(`${DESIGNATIONS_API}/${id}`);
      showNotification('Deleted successfully');
      fetchDesignations(pagination.current_page, pagination.per_page, searchTerm);
    } catch (e) { handleApiError(e, 'Delete failed'); }
    finally { setOperationLoading(null); setActionMenu(null); }
  };

  const filteredDesignations = designations.filter(d =>
    deptFilter === 'all' || (d.department_id || d.department?.id) == deptFilter
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-amber-500/30">
      <AnimatePresence>
        {notification.show && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className={`fixed top-6 right-1/2 translate-x-1/2 z-[60] px-6 py-3 rounded-full shadow-2xl backdrop-blur-md border border-white/10 flex items-center gap-3 font-medium ${notification.type === 'error' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'}`}>
            {notification.type === 'error' ? <Shield size={18} /> : <Check size={18} />} {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-400">Designations</span>
            </h1>
            <p className="text-slate-400 text-lg">Job roles and titles</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openModal()} className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl font-bold text-white shadow-lg shadow-amber-900/20 hover:shadow-amber-900/40 flex items-center gap-2">
            <Plus size={20} /> New Designation
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { label: 'Total Roles', value: pagination.total_items, icon: Briefcase, color: 'text-amber-400', bg: 'bg-amber-400/10' },
            { label: 'Departments', value: departments.length, icon: Building, color: 'text-orange-400', bg: 'bg-orange-400/10' },
          ].map((s, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">{s.label}</p>
                <h3 className="text-3xl font-bold text-white mt-1">{s.value}</h3>
              </div>
              <div className={`p-4 rounded-xl ${s.bg}`}><s.icon size={24} className={s.color} /></div>
            </div>
          ))}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-center gap-2 opacity-60">
            <p className="text-slate-500 text-sm">Most common role</p>
            <div className="h-2 w-24 bg-slate-700 rounded-full animate-pulse" />
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md flex flex-col md:flex-row gap-4 items-center justify-between sticky top-4 z-40 shadow-2xl">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-400 transition-colors" size={20} />
            <input type="text" placeholder="Search designations..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all placeholder:text-slate-500" />
          </div>

          <div className="flex gap-3 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-3 rounded-xl border border-white/10 min-w-[160px]">
              <Layers size={16} className="text-slate-400" />
              <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="bg-transparent border-none text-sm text-slate-300 focus:ring-0 cursor-pointer outline-none w-full">
                <option value="all">Check All Depts</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <button onClick={() => fetchDesignations(pagination.current_page, pagination.per_page, searchTerm)} className="p-3 bg-slate-900/50 rounded-xl border border-white/10 hover:text-amber-400 transition-colors">
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredDesignations.map(desig => (
              <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key={desig.id} className="group bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden hover:border-amber-500/30 transition-all hover:shadow-xl relative flex flex-col">
                <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-orange-500" />

                <div className="p-6 flex-1 flex flex-col relative">
                  <div className="absolute top-4 right-4 z-20">
                    <button onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === desig.id ? null : desig.id); }} className="action-menu-btn p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><MoreVertical size={18} /></button>
                    {actionMenu === desig.id && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50 py-1 flex flex-col">
                        <button onClick={() => openModal(desig)} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-amber-300 flex items-center gap-2"><Edit size={14} /> Edit</button>
                        <div className="h-px bg-white/5 my-1" />
                        <button onClick={() => handleDelete(desig.id)} className="w-full text-left px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"><Trash2 size={14} /> Delete</button>
                      </motion.div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center text-xl font-bold text-orange-300 border border-white/5">
                      {desig.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white line-clamp-1">{desig.name}</h3>
                      <div className="flex gap-2 mt-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                          <Building size={12} />
                          {desig.department}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-white/5">
                    <div className='flex items-center gap-2'>
                      <Shield size={14} />
                      <span>ID: {desig.id}</span>
                    </div>
                    <span>Updated: {new Date(desig.updated_at).toLocaleDateString()}</span>
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
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900 shrink-0">
                <h2 className="text-xl font-bold text-white">{editingDesignation ? 'Edit Designation' : 'New Designation'}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"><X size={20} /></button>
              </div>

              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Designation Name *</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500/50 outline-none" required placeholder="e.g. Senior Developer" />
                    {errors.name && <p className="text-rose-400 text-xs">{errors.name[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Department *</label>
                    <select value={formData.department_id} onChange={e => setFormData({ ...formData, department_id: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500/50 outline-none" required>
                      <option value="">Select Department</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    {errors.department_id && <p className="text-rose-400 text-xs">{errors.department_id[0]}</p>}
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <button type="submit" disabled={operationLoading} className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl font-bold shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2">
                      {operationLoading && <Loader size={20} className="animate-spin" />} {editingDesignation ? 'Update Designation' : 'Create Designation'}
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

export default Designations;