import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Calendar, Edit, Trash2, X, Check, Loader, ChevronLeft, ChevronRight,
  MoreVertical, User, FileText, CheckCircle, XCircle, Clock, RefreshCw, Shield
} from 'lucide-react';

const LEAVE_APPLICATIONS_API = '/api/hrm/leave-applications';
const EMPLOYEES_API = '/api/hrm/employees';
const LEAVE_TYPES_API = '/api/hrm/leave-types';

const LeaveApplications = () => {
  const [applications, setApplications] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMenu, setActionMenu] = useState(null);

  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type_id: '',
    start_date: '',
    end_date: '',
    reason: '',
    status: 'pending',
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

  const fetchApplications = useCallback(async (page = 1, limit = 10, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await axios.get(LEAVE_APPLICATIONS_API, { params });
      const data = response.data.pagination || response.data;
      const list = data.data || [];

      setApplications(list.map(item => ({
        ...item,
        employee_name: item.employee ? `${item.employee.first_name} ${item.employee.last_name || ''}`.trim() : '—',
        leave_type_name: item.leave_type?.name || '—',
      })));

      setPagination({
        current_page: data.current_page || 1,
        last_page: data.total_pages || data.last_page || 1,
        per_page: data.per_page || limit,
        total_items: data.total_items || data.total || 0
      });
    } catch (error) {
      console.error(error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchData = async () => {
    setDropdownLoading(true);
    try {
      const [empRes, typeRes] = await Promise.all([
        axios.get(EMPLOYEES_API),
        axios.get(LEAVE_TYPES_API)
      ]);

      const emps = empRes.data.pagination?.data || empRes.data.data || [];
      setEmployees(emps.map(e => ({ id: e.id, name: `${e.first_name} ${e.last_name || ''}`.trim() })));

      const types = typeRes.data.pagination?.data || typeRes.data.data || [];
      setLeaveTypes(types);

    } catch (error) {
      console.error(error);
    } finally {
      setDropdownLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications(1, 10);
    fetchData();
  }, [fetchApplications]);

  useEffect(() => {
    const timer = setTimeout(() => fetchApplications(1, pagination.per_page, searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchApplications]);

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('.action-menu-btn')) setActionMenu(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handlePageChange = (p) => {
    if (p >= 1 && p <= pagination.last_page) fetchApplications(p, pagination.per_page, searchTerm);
  };

  const openModal = (app = null) => {
    setErrors({});
    if (app) {
      setEditingApplication(app);
      setFormData({
        employee_id: app.employee_id?.toString() || '',
        leave_type_id: app.leave_type_id?.toString() || '',
        start_date: app.start_date,
        end_date: app.end_date,
        reason: app.reason || '',
        status: app.status || 'pending',
      });
    } else {
      setEditingApplication(null);
      setFormData({ employee_id: '', leave_type_id: '', start_date: '', end_date: '', reason: '', status: 'pending' });
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
      if (editingApplication) {
        await axios.post(`${LEAVE_APPLICATIONS_API}/${editingApplication.id}`, formData);
      } else {
        await axios.post(LEAVE_APPLICATIONS_API, formData);
      }
      showNotification(editingApplication ? 'Updated successfully' : 'Created successfully');
      fetchApplications(pagination.current_page, pagination.per_page, searchTerm);
      setShowModal(false);
    } catch (error) {
      handleApiError(error, 'Save failed');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this application?')) return;
    setOperationLoading(`del-${id}`);
    try {
      await axios.delete(`${LEAVE_APPLICATIONS_API}/${id}`);
      showNotification('Deleted successfully');
      fetchApplications(pagination.current_page, pagination.per_page, searchTerm);
    } catch (e) { handleApiError(e, 'Delete failed'); }
    finally { setOperationLoading(null); setActionMenu(null); }
  };

  const formatDate = (date) => date ? new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20';
      case 'rejected': return 'bg-rose-500/20 text-rose-300 border-rose-500/20';
      default: return 'bg-amber-500/20 text-amber-300 border-amber-500/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle size={14} />;
      case 'rejected': return <XCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-emerald-500/30">
      <AnimatePresence>
        {notification.show && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className={`fixed top-6 right-1/2 translate-x-1/2 z-[60] px-6 py-3 rounded-full shadow-2xl backdrop-blur-md border border-white/10 flex items-center gap-3 font-medium ${notification.type === 'error' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
            {notification.type === 'error' ? <Shield size={18} /> : <Check size={18} />} {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">Leave Requests</span>
            </h1>
            <p className="text-slate-400 text-lg">Manage employee time off</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openModal()} className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl font-bold text-white shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 flex items-center gap-2">
            <Plus size={20} /> New Request
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { label: 'Total Applications', value: pagination.total_items, icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
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
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition-colors" size={20} />
            <input type="date" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-500" />
          </div>
          <button onClick={() => fetchApplications(pagination.current_page, pagination.per_page, searchTerm)} className="p-3 bg-slate-900/50 rounded-xl border border-white/10 hover:text-emerald-400 transition-colors">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {applications.map(app => (
              <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key={app.id} className="group bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all hover:shadow-xl relative flex flex-col">
                <div className={`h-1 w-full ${app.status === 'approved' ? 'bg-emerald-500' : app.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'}`} />

                <div className="p-6 flex-1 flex flex-col relative">
                  <div className="absolute top-4 right-4 z-20">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusColor(app.status)} mb-2`}>
                      {getStatusIcon(app.status)}
                      <span className="uppercase tracking-wider">{app.status}</span>
                    </div>
                  </div>

                  <div className="absolute top-12 right-4 z-20">
                    <button onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === app.id ? null : app.id); }} className="action-menu-btn p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><MoreVertical size={18} /></button>
                    {actionMenu === app.id && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50 py-1 flex flex-col">
                        <button onClick={() => openModal(app)} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-emerald-300 flex items-center gap-2"><Edit size={14} /> Edit</button>
                        <div className="h-px bg-white/5 my-1" />
                        <button onClick={() => handleDelete(app.id)} className="w-full text-left px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"><Trash2 size={14} /> Delete</button>
                      </motion.div>
                    )}
                  </div>

                  <div className="mb-4 pt-2">
                    <h3 className="font-bold text-lg text-white mb-1 line-clamp-1">{app.employee_name}</h3>
                    <p className="text-sm text-emerald-400 font-medium">{app.leave_type_name}</p>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/5 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">From</span>
                      <span className="text-white font-mono">{formatDate(app.start_date)}</span>
                    </div>
                    <div className='h-px bg-white/5' />
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">To</span>
                      <span className="text-white font-mono">{formatDate(app.end_date)}</span>
                    </div>
                  </div>

                  {app.reason && (
                    <div className="bg-slate-950/30 p-3 rounded-xl border border-white/5 mb-4">
                      <p className="text-xs text-slate-400 italic line-clamp-2">"{app.reason}"</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs text-slate-500 mt-auto pt-2">
                    <span>Applied: {formatDate(app.created_at)}</span>
                    <span>ID: {app.id}</span>
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
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900 shrink-0">
                <h2 className="text-xl font-bold text-white">{editingApplication ? 'Edit Request' : 'New Leave Request'}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"><X size={20} /></button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Employee *</label>
                    <select name="employee_id" value={formData.employee_id} onChange={handleInputChange} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none" required>
                      <option value="">Select Employee</option>
                      {employees.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Leave Type *</label>
                    <select name="leave_type_id" value={formData.leave_type_id} onChange={handleInputChange} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none" required>
                      <option value="">Select Type</option>
                      {leaveTypes.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Start Date *</label>
                      <input type="date" name="start_date" value={formData.start_date} onChange={handleInputChange} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">End Date *</label>
                      <input type="date" name="end_date" value={formData.end_date} onChange={handleInputChange} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Reason</label>
                    <textarea name="reason" value={formData.reason} onChange={handleInputChange} rows="3" placeholder="Reason for leave..." className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none resize-none" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none">
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <button type="submit" disabled={operationLoading} className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2">
                      {operationLoading && <Loader size={20} className="animate-spin" />} {editingApplication ? 'Update Request' : 'Submit Request'}
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

export default LeaveApplications;