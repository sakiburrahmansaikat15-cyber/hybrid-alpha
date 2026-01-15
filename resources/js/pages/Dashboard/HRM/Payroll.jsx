import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Check, Loader, ChevronLeft, ChevronRight,
  MoreVertical, DollarSign, Calendar, Wallet, RefreshCw, Shield, Banknote
} from 'lucide-react';

const PAYROLL_API = '/api/hrm/payroll';
const EMPLOYEES_API = '/api/hrm/employees';

const Payroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMenu, setActionMenu] = useState(null);

  const [formData, setFormData] = useState({
    employee_id: '',
    month: '',
    year: new Date().getFullYear(),
    basic_salary: '',
    total_allowance: '',
    total_deduction: '',
    net_salary: '',
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

  const fetchPayrolls = useCallback(async (page = 1, limit = 10, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await axios.get(PAYROLL_API, { params });
      const data = response.data.pagination || response.data;
      const list = data.data || [];

      setPayrolls(list.map(item => ({
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
      setPayrolls([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmployees = async () => {
    setDropdownLoading(true);
    try {
      const response = await axios.get(EMPLOYEES_API);
      const data = response.data.pagination?.data || response.data.data || [];
      setEmployees(data.map(e => ({ id: e.id, name: `${e.first_name} ${e.last_name || ''}`.trim() })));
    } catch (error) {
      console.error(error);
    } finally {
      setDropdownLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls(1, 10);
    fetchEmployees();
  }, [fetchPayrolls]);

  useEffect(() => {
    const timer = setTimeout(() => fetchPayrolls(1, pagination.per_page, searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchPayrolls]);

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('.action-menu-btn')) setActionMenu(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handlePageChange = (p) => {
    if (p >= 1 && p <= pagination.last_page) fetchPayrolls(p, pagination.per_page, searchTerm);
  };

  const openModal = (item = null) => {
    setErrors({});
    if (item) {
      setEditingPayroll(item);
      setFormData({
        employee_id: item.employee_id?.toString() || '',
        month: item.month,
        year: item.year,
        basic_salary: item.basic_salary,
        total_allowance: item.total_allowance,
        total_deduction: item.total_deduction,
        net_salary: item.net_salary,
        status: item.status,
      });
    } else {
      setEditingPayroll(null);
      setFormData({ employee_id: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), basic_salary: '', total_allowance: '', total_deduction: '', net_salary: '', status: 'pending' });
    }
    setShowModal(true);
    setActionMenu(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Auto-calculate net salary if basic/allowance/deduction changes
      if (['basic_salary', 'total_allowance', 'total_deduction'].includes(name)) {
        const basic = parseFloat(newData.basic_salary) || 0;
        const allowance = parseFloat(newData.total_allowance) || 0;
        const deduction = parseFloat(newData.total_deduction) || 0;
        newData.net_salary = (basic + allowance - deduction).toFixed(2);
      }
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');

    try {
      if (editingPayroll) {
        await axios.post(`${PAYROLL_API}/${editingPayroll.id}`, formData);
      } else {
        await axios.post(PAYROLL_API, formData);
      }
      showNotification(editingPayroll ? 'Updated successfully' : 'Created successfully');
      fetchPayrolls(pagination.current_page, pagination.per_page, searchTerm);
      setShowModal(false);
    } catch (error) {
      handleApiError(error, 'Save failed');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this payroll record?')) return;
    setOperationLoading(`del-${id}`);
    try {
      await axios.delete(`${PAYROLL_API}/${id}`);
      showNotification('Deleted successfully');
      fetchPayrolls(pagination.current_page, pagination.per_page, searchTerm);
    } catch (e) { handleApiError(e, 'Delete failed'); }
    finally { setOperationLoading(null); setActionMenu(null); }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20';
      case 'rejected': return 'bg-rose-500/20 text-rose-300 border-rose-500/20';
      default: return 'bg-amber-500/20 text-amber-300 border-amber-500/20';
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-amber-500/30">
      <AnimatePresence>
        {notification.show && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className={`fixed top-6 right-1/2 translate-x-1/2 z-[60] px-6 py-3 rounded-full shadow-2xl backdrop-blur-md border border-white/10 flex items-center gap-3 font-medium ${notification.type === 'error' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'}`}>
            {notification.type === 'error' ? <Shield size={18} /> : <Check size={18} />} {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-400">Payroll</span>
            </h1>
            <p className="text-slate-400 text-lg">Process monthly salaries and payments</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openModal()} className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl font-bold text-white shadow-lg shadow-amber-900/20 hover:shadow-amber-900/40 flex items-center gap-2">
            <Plus size={20} /> New Entry
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { label: 'Total Records', value: pagination.total_items, icon: Wallet, color: 'text-amber-400', bg: 'bg-amber-400/10' },
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-400 transition-colors" size={20} />
            <input type="text" placeholder="Search employee or year..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all placeholder:text-slate-500" />
          </div>
          <button onClick={() => fetchPayrolls(pagination.current_page, pagination.per_page, searchTerm)} className="p-3 bg-slate-900/50 rounded-xl border border-white/10 hover:text-amber-400 transition-colors">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {payrolls.map(pay => (
              <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key={pay.id} className="group bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden hover:border-amber-500/30 transition-all hover:shadow-xl relative flex flex-col">
                <div className={`h-1 w-full ${pay.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}`} />

                <div className="p-6 flex-1 flex flex-col relative w-full">
                  <div className="absolute top-4 right-4 z-20">
                    <button onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === pay.id ? null : pay.id); }} className="action-menu-btn p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><MoreVertical size={18} /></button>
                    {actionMenu === pay.id && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50 py-1 flex flex-col">
                        <button onClick={() => openModal(pay)} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-amber-300 flex items-center gap-2"><Edit size={14} /> Edit</button>
                        <div className="h-px bg-white/5 my-1" />
                        <button onClick={() => handleDelete(pay.id)} className="w-full text-left px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"><Trash2 size={14} /> Delete</button>
                      </motion.div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold bg-white/5 border border-white/5 text-amber-400">
                      <Banknote size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white line-clamp-1">{pay.employee_name}</h3>
                      <p className="text-sm text-slate-400">{months[pay.month - 1]} {pay.year}</p>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3 mb-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Basic Salary</span>
                      <span className="text-white font-mono">{formatCurrency(pay.basic_salary)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Total Allowance</span>
                      <span className="text-emerald-400 font-mono">+{formatCurrency(pay.total_allowance)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Total Deduction</span>
                      <span className="text-rose-400 font-mono">-{formatCurrency(pay.total_deduction)}</span>
                    </div>
                    <div className='h-px bg-white/10 my-2' />
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 font-bold">Net Salary</span>
                      <span className="text-amber-400 font-bold font-mono text-lg">{formatCurrency(pay.net_salary)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border uppercase tracking-wider ${getStatusColor(pay.status)}`}>
                      {pay.status}
                    </span>
                    <span className="text-xs text-slate-500">ID: {pay.id}</span>
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
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900 shrink-0">
                <h2 className="text-xl font-bold text-white">{editingPayroll ? 'Edit Entry' : 'New Payroll Entry'}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"><X size={20} /></button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Employee *</label>
                    <select name="employee_id" value={formData.employee_id} onChange={handleInputChange} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500/50 outline-none" required>
                      <option value="">Select Employee</option>
                      {employees.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Month *</label>
                      <select name="month" value={formData.month} onChange={handleInputChange} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500/50 outline-none" required>
                        <option value="">Select Month</option>
                        {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Year *</label>
                      <input type="number" name="year" value={formData.year} onChange={handleInputChange} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500/50 outline-none" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Basic Salary *</label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="number" step="0.01" name="basic_salary" value={formData.basic_salary} onChange={handleInputChange} className="w-full bg-slate-800 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-amber-500/50 outline-none" required placeholder="0.00" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Allowances</label>
                      <div className="relative">
                        <Plus size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                        <input type="number" step="0.01" name="total_allowance" value={formData.total_allowance} onChange={handleInputChange} className="w-full bg-slate-800 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-amber-500/50 outline-none" placeholder="0.00" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Deductions</label>
                      <div className="relative">
                        <X size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500" />
                        <input type="number" step="0.01" name="total_deduction" value={formData.total_deduction} onChange={handleInputChange} className="w-full bg-slate-800 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-amber-500/50 outline-none" placeholder="0.00" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Net Salary (Calculated)</label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" />
                      <input type="number" step="0.01" name="net_salary" value={formData.net_salary} readOnly className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-amber-400 font-bold outline-none cursor-default" placeholder="0.00" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500/50 outline-none">
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <button type="submit" disabled={operationLoading} className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl font-bold shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2">
                      {operationLoading && <Loader size={20} className="animate-spin" />} {editingPayroll ? 'Update Entry' : 'Create Entry'}
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

export default Payroll;