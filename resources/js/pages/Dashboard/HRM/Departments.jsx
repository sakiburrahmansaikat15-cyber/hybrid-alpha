import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Check, Loader, ChevronLeft, ChevronRight,
  MoreVertical, Eye, EyeOff, Building, RefreshCw, Shield, Layers, Users
} from 'lucide-react';

const DEPARTMENTS_API = '/api/hrm/departments';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionMenu, setActionMenu] = useState(null);

  const [formData, setFormData] = useState({ name: '', status: 'active' });
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

  const fetchDepartments = useCallback(async (page = 1, limit = 10, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await axios.get(DEPARTMENTS_API, { params });
      const data = response.data.pagination || response.data;
      const list = data.data || [];

      setDepartments(list);
      setPagination({
        current_page: data.current_page || 1,
        last_page: data.total_pages || data.last_page || 1,
        per_page: data.per_page || limit,
        total_items: data.total_items || data.total || 0
      });
    } catch (error) {
      console.error(error);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments(1, 10);
  }, [fetchDepartments]);

  useEffect(() => {
    const timer = setTimeout(() => fetchDepartments(1, pagination.per_page, searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchDepartments]);

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('.action-menu-btn')) setActionMenu(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handlePageChange = (p) => {
    if (p >= 1 && p <= pagination.last_page) fetchDepartments(p, pagination.per_page, searchTerm);
  };

  const openModal = (dept = null) => {
    setErrors({});
    if (dept) {
      setEditingDepartment(dept);
      setFormData({ name: dept.name, status: dept.status || 'active' });
    } else {
      setEditingDepartment(null);
      setFormData({ name: '', status: 'active' });
    }
    setShowModal(true);
    setActionMenu(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');

    // Using FormData for standard POST
    const payload = new FormData();
    payload.append('name', formData.name);
    payload.append('status', formData.status);

    try {
      if (editingDepartment) {
        await axios.post(`${DEPARTMENTS_API}/${editingDepartment.id}`, payload);
      } else {
        await axios.post(DEPARTMENTS_API, payload);
      }
      showNotification(editingDepartment ? 'Updated successfully' : 'Created successfully');
      fetchDepartments(pagination.current_page, pagination.per_page, searchTerm);
      setShowModal(false);
    } catch (error) {
      handleApiError(error, 'Save failed');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this department? Employees assigned to it may be affected.')) return;
    setOperationLoading(`del-${id}`);
    try {
      await axios.delete(`${DEPARTMENTS_API}/${id}`);
      showNotification('Deleted successfully');
      fetchDepartments(pagination.current_page, pagination.per_page, searchTerm);
    } catch (e) { handleApiError(e, 'Delete failed'); }
    finally { setOperationLoading(null); setActionMenu(null); }
  };

  const toggleStatus = async (dept) => {
    const newStatus = dept.status === 'active' ? 'inactive' : 'active';
    setOperationLoading(`status-${dept.id}`);
    try {
      const form = new FormData();
      form.append('status', newStatus);
      await axios.post(`${DEPARTMENTS_API}/${dept.id}`, form);
      showNotification(`Department ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchDepartments(pagination.current_page, pagination.per_page, searchTerm);
    } catch (error) {
      handleApiError(error, 'Status update failed');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  const filteredDepartments = departments.filter(d => statusFilter === 'all' || d.status === statusFilter);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-violet-500/30">
      <AnimatePresence>
        {notification.show && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className={`fixed top-6 right-1/2 translate-x-1/2 z-[60] px-6 py-3 rounded-full shadow-2xl backdrop-blur-md border border-white/10 flex items-center gap-3 font-medium ${notification.type === 'error' ? 'bg-rose-500/20 text-rose-300' : 'bg-violet-500/20 text-violet-300'}`}>
            {notification.type === 'error' ? <Shield size={18} /> : <Check size={18} />} {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">Departments</span>
            </h1>
            <p className="text-slate-400 text-lg">Organizational structure and units</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openModal()} className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-bold text-white shadow-lg shadow-violet-900/20 hover:shadow-violet-900/40 flex items-center gap-2">
            <Plus size={20} /> New Department
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Units', value: pagination.total_items, icon: Layers, color: 'text-violet-400', bg: 'bg-violet-400/10' },
            { label: 'Active', value: filteredDepartments.filter(d => d.status === 'active').length, icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            { label: 'Inactive', value: filteredDepartments.filter(d => d.status === 'inactive').length, icon: EyeOff, color: 'text-rose-400', bg: 'bg-rose-400/10' },
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-400 transition-colors" size={20} />
            <input type="text" placeholder="Search departments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-violet-500/50 outline-none transition-all placeholder:text-slate-500" />
          </div>

          <div className="flex gap-3 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-3 rounded-xl border border-white/10 min-w-[140px]">
              <Eye size={16} className="text-slate-400" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-transparent border-none text-sm text-slate-300 focus:ring-0 cursor-pointer outline-none w-full">
                <option value="all">Status: All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button onClick={() => fetchDepartments(pagination.current_page, pagination.per_page, searchTerm)} className="p-3 bg-slate-900/50 rounded-xl border border-white/10 hover:text-violet-400 transition-colors">
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredDepartments.map(dept => (
              <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key={dept.id} className="group bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden hover:border-violet-500/30 transition-all hover:shadow-xl relative flex flex-col">
                <div className={`h-1 w-full ${dept.status === 'active' ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500' : 'bg-slate-700'}`} />

                <div className="p-6 flex-1 flex flex-col relative">
                  <div className="absolute top-4 right-4 z-20">
                    <button onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === dept.id ? null : dept.id); }} className="action-menu-btn p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><MoreVertical size={18} /></button>
                    {actionMenu === dept.id && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50 py-1 flex flex-col">
                        <button onClick={() => openModal(dept)} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-violet-300 flex items-center gap-2"><Edit size={14} /> Edit</button>
                        <button onClick={() => toggleStatus(dept)} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-cyan-300 flex items-center gap-2">
                          {dept.status === 'active' ? <EyeOff size={14} /> : <Eye size={14} />} {dept.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <div className="h-px bg-white/5 my-1" />
                        <button onClick={() => handleDelete(dept.id)} className="w-full text-left px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"><Trash2 size={14} /> Delete</button>
                      </motion.div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center text-xl font-bold text-fuchsia-300 border border-white/5">
                      {dept.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white line-clamp-1">{dept.name}</h3>
                      <div className="flex gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${dept.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>{dept.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-white/5">
                    <div className='flex items-center gap-2'>
                      <Shield size={14} />
                      <span>ID: {dept.id}</span>
                    </div>
                    <span>Updated: {new Date(dept.updated_at).toLocaleDateString()}</span>
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
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900 shrink-0">
                <h2 className="text-xl font-bold text-white">{editingDepartment ? 'Edit Department' : 'New Department'}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"><X size={20} /></button>
              </div>

              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Department Name *</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500/50 outline-none" required placeholder="e.g. Engineering" />
                    {errors.name && <p className="text-rose-400 text-xs">{errors.name[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Status</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['active', 'inactive'].map(st => (
                        <div key={st} onClick={() => setFormData({ ...formData, status: st })} className={`p-3 rounded-xl border cursor-pointer flex items-center justify-center gap-2 transition-all ${formData.status === st ? (st === 'active' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-rose-500/20 border-rose-500 text-rose-400') : 'bg-slate-800 border-white/10 text-slate-400 hover:bg-white/5'}`}>
                          {st === 'active' ? <Check size={16} /> : <EyeOff size={16} />}
                          <span className="capitalize font-bold text-sm">{st}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <button type="submit" disabled={operationLoading} className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl font-bold shadow-lg shadow-violet-900/20 flex items-center justify-center gap-2">
                      {operationLoading && <Loader size={20} className="animate-spin" />} {editingDepartment ? 'Update Department' : 'Create Department'}
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

export default Departments;