import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Check, Loader, ChevronLeft, ChevronRight,
  MoreVertical, Clock, User, Calendar, RefreshCw, Shield, AlertTriangle, Moon
} from 'lucide-react';

const ATTENDANCES_API = '/api/hrm/attendances';
const EMPLOYEES_API = '/api/hrm/employees';

const Attendance = () => {
  const [attendances, setAttendances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMenu, setActionMenu] = useState(null);

  const [formData, setFormData] = useState({
    employee_id: '',
    date: '',
    clock_in: '',
    clock_out: '',
    late: false,
    early_leave: false,
    working_hours: '',
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

  const fetchAttendances = useCallback(async (page = 1, limit = 10, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await axios.get(ATTENDANCES_API, { params });
      const data = response.data.pagination || response.data;
      const list = data.data || [];

      setAttendances(list.map(item => ({
        ...item,
        employee_name: item.employee ? `${item.employee.first_name} ${item.employee.last_name || ''}`.trim() : '—',
      })));

      setPagination({
        current_page: data.current_page || 1,
        last_page: data.total_pages || data.last_page || 1,
        per_page: data.per_page || limit,
        total_items: data.total_items || data.total || 0
      });
    } catch (error) {
      console.error(error);
      setAttendances([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmployees = async () => {
    setDropdownLoading(true);
    try {
      const response = await axios.get(EMPLOYEES_API);
      const data = response.data.pagination?.data || response.data?.data || [];
      setEmployees(data.map(emp => ({
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name || ''}`.trim() || emp.employee_code,
      })));
    } catch (error) {
      console.error(error);
    } finally {
      setDropdownLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendances(1, 10);
    fetchEmployees();
  }, [fetchAttendances]);

  useEffect(() => {
    const timer = setTimeout(() => fetchAttendances(1, pagination.per_page, searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchAttendances]);

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('.action-menu-btn')) setActionMenu(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handlePageChange = (p) => {
    if (p >= 1 && p <= pagination.last_page) fetchAttendances(p, pagination.per_page, searchTerm);
  };

  const openModal = (att = null) => {
    setErrors({});
    if (att) {
      setEditingAttendance(att);
      setFormData({
        employee_id: att.employee_id?.toString() || '',
        date: att.date || '',
        clock_in: att.clock_in || '',
        clock_out: att.clock_out || '',
        late: !!att.late,
        early_leave: !!att.early_leave,
        working_hours: att.working_hours || '',
      });
    } else {
      setEditingAttendance(null);
      setFormData({ employee_id: '', date: new Date().toISOString().split('T')[0], clock_in: '', clock_out: '', late: false, early_leave: false, working_hours: '' });
    }
    setShowModal(true);
    setActionMenu(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');

    const payload = new FormData();
    payload.append('employee_id', formData.employee_id);
    payload.append('date', formData.date);
    if (formData.clock_in) payload.append('clock_in', formData.clock_in);
    if (formData.clock_out) payload.append('clock_out', formData.clock_out);
    payload.append('late', formData.late ? '1' : '0');
    payload.append('early_leave', formData.early_leave ? '1' : '0');
    if (formData.working_hours) payload.append('working_hours', formData.working_hours);

    try {
      if (editingAttendance) {
        await axios.post(`${ATTENDANCES_API}/${editingAttendance.id}`, payload);
      } else {
        await axios.post(ATTENDANCES_API, payload);
      }
      showNotification(editingAttendance ? 'Updated successfully' : 'Created successfully');
      fetchAttendances(pagination.current_page, pagination.per_page, searchTerm);
      setShowModal(false);
    } catch (error) {
      handleApiError(error, 'Save failed');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this attendance record?')) return;
    setOperationLoading(`del-${id}`);
    try {
      await axios.delete(`${ATTENDANCES_API}/${id}`);
      showNotification('Deleted successfully');
      fetchAttendances(pagination.current_page, pagination.per_page, searchTerm);
    } catch (e) { handleApiError(e, 'Delete failed'); }
    finally { setOperationLoading(null); setActionMenu(null); }
  };

  const formatTime = (time) => time ? new Date(`2000-01-01 ${time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-emerald-500/30">
      <AnimatePresence>
        {notification.show && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className={`fixed top-6 right-1/2 translate-x-1/2 z-[60] px-6 py-3 rounded-full shadow-2xl backdrop-blur-md border border-white/10 flex items-center gap-3 font-medium ${notification.type === 'error' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
            {notification.type === 'error' ? <Shield size={18} /> : <Check size={18} />} {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">Attendance</span>
            </h1>
            <p className="text-slate-400 text-lg">Daily logs and timesheets</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openModal()} className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl font-bold text-white shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 flex items-center gap-2">
            <Plus size={20} /> Mark Attendance
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { label: 'Total Logs', value: pagination.total_items, icon: Calendar, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition-colors" size={20} />
            <input type="date" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-500" />
          </div>
          <button onClick={() => fetchAttendances(pagination.current_page, pagination.per_page, searchTerm)} className="p-3 bg-slate-900/50 rounded-xl border border-white/10 hover:text-emerald-400 transition-colors">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {attendances.map(att => (
              <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key={att.id} className="group bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all hover:shadow-xl relative flex flex-col">
                <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />

                <div className="p-6 flex-1 flex flex-col relative">
                  <div className="absolute top-4 right-4 z-20">
                    <button onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === att.id ? null : att.id); }} className="action-menu-btn p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><MoreVertical size={18} /></button>
                    {actionMenu === att.id && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50 py-1 flex flex-col">
                        <button onClick={() => openModal(att)} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-emerald-300 flex items-center gap-2"><Edit size={14} /> Edit</button>
                        <div className="h-px bg-white/5 my-1" />
                        <button onClick={() => handleDelete(att.id)} className="w-full text-left px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"><Trash2 size={14} /> Delete</button>
                      </motion.div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-xl font-bold text-emerald-300 border border-white/5">
                      {new Date(att.date).getDate()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white line-clamp-1">{att.employee_name}</h3>
                      <p className="text-xs text-slate-400 font-mono tracking-wider">{new Date(att.date).toLocaleDateString([], { month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-400 block mb-1">Clock In</span>
                      <span className="text-sm font-bold text-emerald-300">{formatTime(att.clock_in)}</span>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-400 block mb-1">Clock Out</span>
                      <span className="text-sm font-bold text-emerald-300">{formatTime(att.clock_out)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap mb-4">
                    {att.late ? <span className="bg-rose-500/20 text-rose-300 text-xs px-2 py-1 rounded-lg border border-rose-500/20 flex items-center gap-1"><AlertTriangle size={12} /> Late</span> : null}
                    {att.early_leave ? <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1"><Moon size={12} /> Early Leave</span> : null}
                    {att.working_hours && <span className="bg-slate-700/50 text-slate-300 text-xs px-2 py-1 rounded-lg border border-white/5">{att.working_hours} hrs</span>}
                  </div>

                  <div className="mt-auto flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-white/5">
                    <div className='flex items-center gap-2'>
                      <Shield size={14} />
                      <span>ID: {att.id}</span>
                    </div>
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
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900 shrink-0">
                <h2 className="text-xl font-bold text-white">{editingAttendance ? 'Edit Attendance' : 'New Attendance'}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"><X size={20} /></button>
              </div>

              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Employee *</label>
                    <select value={formData.employee_id} onChange={handleInputChange} name="employee_id" className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none" required>
                      <option value="">Select Employee</option>
                      {employees.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Date *</label>
                      <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Working Hours</label>
                      <input type="number" step="0.1" name="working_hours" value={formData.working_hours} onChange={handleInputChange} placeholder="e.g 8.5" className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Clock In</label>
                      <input type="time" name="clock_in" value={formData.clock_in} onChange={handleInputChange} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Clock Out</label>
                      <input type="time" name="clock_out" value={formData.clock_out} onChange={handleInputChange} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <label className="flex items-center gap-3 bg-slate-800 p-3 rounded-xl border border-white/10 cursor-pointer hover:bg-white/5 transition-colors">
                      <input type="checkbox" name="late" checked={formData.late} onChange={handleInputChange} className="w-5 h-5 accent-emerald-500" />
                      <span className="text-sm font-medium text-slate-300">Mark as Late</span>
                    </label>
                    <label className="flex items-center gap-3 bg-slate-800 p-3 rounded-xl border border-white/10 cursor-pointer hover:bg-white/5 transition-colors">
                      <input type="checkbox" name="early_leave" checked={formData.early_leave} onChange={handleInputChange} className="w-5 h-5 accent-emerald-500" />
                      <span className="text-sm font-medium text-slate-300">Early Leave</span>
                    </label>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <button type="submit" disabled={operationLoading} className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2">
                      {operationLoading && <Loader size={20} className="animate-spin" />} {editingAttendance ? 'Update Record' : 'Record Attendance'}
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

export default Attendance;