import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Check, Loader, ChevronLeft, ChevronRight,
  MoreVertical, DollarSign, Calendar, RefreshCw, Shield, Briefcase, List
} from 'lucide-react';

const SALARIES_API = '/api/hrm/salaries';
const EMPLOYEES_API = '/api/hrm/employees';

const Salaries = () => {
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSalary, setEditingSalary] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMenu, setActionMenu] = useState(null);

  // Dynamic fields for allowance/deduction
  const [allowanceList, setAllowanceList] = useState([]);
  const [deductionList, setDeductionList] = useState([]);

  const [formData, setFormData] = useState({
    employee_id: '',
    basic_salary: '',
    effective_from: '',
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

  const parseJsonField = (field) => {
    try {
      if (typeof field === 'object' && field !== null) return field;
      if (typeof field === 'string' && field.trim()) return JSON.parse(field);
      return {};
    } catch (e) {
      return {};
    }
  };

  const fetchSalaries = useCallback(async (page = 1, limit = 10, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await axios.get(SALARIES_API, { params });
      const data = response.data.pagination || response.data;
      const list = data.data || [];

      setSalaries(list.map(item => ({
        ...item,
        employee_name: item.employee ? `${item.employee.first_name} ${item.employee.last_name || ''}`.trim() : '—',
        parsed_allowances: parseJsonField(item.allowances),
        parsed_deductions: parseJsonField(item.deductions),
      })));

      setPagination({
        current_page: data.current_page || 1,
        last_page: data.total_pages || data.last_page || 1,
        per_page: data.per_page || limit,
        total_items: data.total_items || data.total || 0
      });
    } catch (error) {
      console.error(error);
      setSalaries([]);
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
    fetchSalaries(1, 10);
    fetchEmployees();
  }, [fetchSalaries]);

  useEffect(() => {
    const timer = setTimeout(() => fetchSalaries(1, pagination.per_page, searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchSalaries]);

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('.action-menu-btn')) setActionMenu(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handlePageChange = (p) => {
    if (p >= 1 && p <= pagination.last_page) fetchSalaries(p, pagination.per_page, searchTerm);
  };

  const openModal = (item = null) => {
    setErrors({});
    if (item) {
      setEditingSalary(item);
      setFormData({
        employee_id: item.employee_id?.toString() || '',
        basic_salary: item.basic_salary,
        effective_from: item.effective_from || '',
      });

      const allowObj = item.parsed_allowances || {};
      const deducObj = item.parsed_deductions || {};

      setAllowanceList(Object.entries(allowObj).map(([name, amount], i) => ({ id: i, name, amount })));
      setDeductionList(Object.entries(deducObj).map(([name, amount], i) => ({ id: i, name, amount })));

    } else {
      setEditingSalary(null);
      setFormData({ employee_id: '', basic_salary: '', effective_from: '' });
      setAllowanceList([{ id: Date.now(), name: '', amount: '' }]);
      setDeductionList([{ id: Date.now() + 1, name: '', amount: '' }]);
    }
    setShowModal(true);
    setActionMenu(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleListChange = (setter, list, id, field, value) => {
    setter(list.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addParams = (setter, list) => {
    setter([...list, { id: Date.now(), name: '', amount: '' }]);
  };

  const removeParams = (setter, list, id) => {
    setter(list.filter(item => item.id !== id));
  };

  const listToJson = (list) => {
    const obj = {};
    list.forEach(item => {
      if (item.name && item.amount) obj[item.name] = item.amount;
    });
    return JSON.stringify(obj);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');

    const payload = {
      ...formData,
      allowances: listToJson(allowanceList),
      deductions: listToJson(deductionList),
    };

    try {
      if (editingSalary) {
        await axios.post(`${SALARIES_API}/${editingSalary.id}`, payload);
      } else {
        await axios.post(SALARIES_API, payload);
      }
      showNotification(editingSalary ? 'Updated successfully' : 'Created successfully');
      fetchSalaries(pagination.current_page, pagination.per_page, searchTerm);
      setShowModal(false);
    } catch (error) {
      handleApiError(error, 'Save failed');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this salary structure?')) return;
    setOperationLoading(`del-${id}`);
    try {
      await axios.delete(`${SALARIES_API}/${id}`);
      showNotification('Deleted successfully');
      fetchSalaries(pagination.current_page, pagination.per_page, searchTerm);
    } catch (e) { handleApiError(e, 'Delete failed'); }
    finally { setOperationLoading(null); setActionMenu(null); }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  const getTotal = (list) => list.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-violet-500/30">
      <AnimatePresence>
        {notification.show && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className={`fixed top-6 right-1/2 translate-x-1/2 z-[60] px-6 py-3 rounded-full shadow-2xl backdrop-blur-md border border-white/10 flex items-center gap-3 font-medium ${notification.type === 'error' ? 'bg-rose-500/20 text-rose-300' : 'bg-violet-500/20 text-violet-300'}`}>
            {notification.type === 'error' ? <Shield size={18} /> : <Check size={18} />} {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">Salary Structures</span>
            </h1>
            <p className="text-slate-400 text-lg">Base pay and compensation plans</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openModal()} className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-bold text-white shadow-lg shadow-violet-900/20 hover:shadow-violet-900/40 flex items-center gap-2">
            <Plus size={20} /> New Structure
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { label: 'Calculated Structures', value: pagination.total_items, icon: Briefcase, color: 'text-violet-400', bg: 'bg-violet-400/10' },
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
            <input type="text" placeholder="Search employee..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-violet-500/50 outline-none transition-all placeholder:text-slate-500" />
          </div>
          <button onClick={() => fetchSalaries(pagination.current_page, pagination.per_page, searchTerm)} className="p-3 bg-slate-900/50 rounded-xl border border-white/10 hover:text-violet-400 transition-colors">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {salaries.map(sal => (
              <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key={sal.id} className="group bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden hover:border-violet-500/30 transition-all hover:shadow-xl relative flex flex-col">
                <div className="h-1 w-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />

                <div className="p-6 flex-1 flex flex-col relative w-full">
                  <div className="absolute top-4 right-4 z-20">
                    <button onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === sal.id ? null : sal.id); }} className="action-menu-btn p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><MoreVertical size={18} /></button>
                    {actionMenu === sal.id && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50 py-1 flex flex-col">
                        <button onClick={() => openModal(sal)} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-violet-300 flex items-center gap-2"><Edit size={14} /> Edit</button>
                        <div className="h-px bg-white/5 my-1" />
                        <button onClick={() => handleDelete(sal.id)} className="w-full text-left px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"><Trash2 size={14} /> Delete</button>
                      </motion.div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold bg-white/5 border border-white/5 text-violet-400">
                      <DollarSign size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white line-clamp-1">{sal.employee_name}</h3>
                      <p className="text-sm text-slate-400 flex items-center gap-1"><Calendar size={12} /> {sal.effective_from || 'No Date'}</p>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 border border-white/5 mb-4">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-slate-400">Basic Salary</span>
                      <span className="text-xl font-bold text-white font-mono">{formatCurrency(sal.basic_salary)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {Object.keys(sal.parsed_allowances).length > 0 && (
                      <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg">
                        <div className="text-emerald-400 font-bold mb-1">Allowances</div>
                        {Object.entries(sal.parsed_allowances).map(([k, v]) => (
                          <div key={k} className="flex justify-between text-slate-400">
                            <span className='capitalize'>{k}</span>
                            <span>{v}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {Object.keys(sal.parsed_deductions).length > 0 && (
                      <div className="bg-rose-500/5 border border-rose-500/10 p-3 rounded-lg">
                        <div className="text-rose-400 font-bold mb-1">Deductions</div>
                        {Object.entries(sal.parsed_deductions).map(([k, v]) => (
                          <div key={k} className="flex justify-between text-slate-400">
                            <span className='capitalize'>{k}</span>
                            <span>{v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-4 flex justify-between items-center text-xs text-slate-500">
                    <span>ID: {sal.id}</span>
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
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900 shrink-0">
                <h2 className="text-xl font-bold text-white">{editingSalary ? 'Edit Structure' : 'New Structure'}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"><X size={20} /></button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Employee *</label>
                    <select name="employee_id" value={formData.employee_id} onChange={handleInputChange} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500/50 outline-none" required>
                      <option value="">Select Employee</option>
                      {employees.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Basic Salary *</label>
                      <div className="relative">
                        <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="number" step="0.01" name="basic_salary" value={formData.basic_salary} onChange={handleInputChange} className="w-full bg-slate-800 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-violet-500/50 outline-none" required placeholder="0.00" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Effective From *</label>
                      <input type="date" name="effective_from" value={formData.effective_from} onChange={handleInputChange} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500/50 outline-none" required />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs uppercase font-bold text-emerald-400 tracking-wider">Allowances</label>
                      <button type="button" onClick={() => addParams(setAllowanceList, allowanceList)} className="text-xs bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-white flex items-center gap-1 transition-colors"><Plus size={12} /> Add</button>
                    </div>
                    <div className="space-y-2">
                      {allowanceList.map((item) => (
                        <div key={item.id} className="flex gap-2">
                          <input type="text" placeholder="Name (e.g. Housing)" value={item.name} onChange={(e) => handleListChange(setAllowanceList, allowanceList, item.id, 'name', e.target.value)} className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500/50 outline-none" />
                          <input type="number" placeholder="Amount" value={item.amount} onChange={(e) => handleListChange(setAllowanceList, allowanceList, item.id, 'amount', e.target.value)} className="w-24 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500/50 outline-none" />
                          <button type="button" onClick={() => removeParams(setAllowanceList, allowanceList, item.id)} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg"><X size={16} /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs uppercase font-bold text-rose-400 tracking-wider">Deductions</label>
                      <button type="button" onClick={() => addParams(setDeductionList, deductionList)} className="text-xs bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-white flex items-center gap-1 transition-colors"><Plus size={12} /> Add</button>
                    </div>
                    <div className="space-y-2">
                      {deductionList.map((item) => (
                        <div key={item.id} className="flex gap-2">
                          <input type="text" placeholder="Name (e.g. Tax)" value={item.name} onChange={(e) => handleListChange(setDeductionList, deductionList, item.id, 'name', e.target.value)} className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-rose-500/50 outline-none" />
                          <input type="number" placeholder="Amount" value={item.amount} onChange={(e) => handleListChange(setDeductionList, deductionList, item.id, 'amount', e.target.value)} className="w-24 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-rose-500/50 outline-none" />
                          <button type="button" onClick={() => removeParams(setDeductionList, deductionList, item.id)} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg"><X size={16} /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Estimated Net Salary</span>
                    <span className="text-xl font-bold text-white font-mono">
                      {formatCurrency(
                        (parseFloat(formData.basic_salary) || 0) +
                        getTotal(allowanceList) -
                        getTotal(deductionList)
                      )}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <button type="submit" disabled={operationLoading} className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl font-bold shadow-lg shadow-violet-900/20 flex items-center justify-center gap-2">
                      {operationLoading && <Loader size={20} className="animate-spin" />} {editingSalary ? 'Update Structure' : 'Create Structure'}
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

export default Salaries;