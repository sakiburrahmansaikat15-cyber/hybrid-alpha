import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Check, Loader, ChevronLeft, ChevronRight,
  MoreVertical, Eye, EyeOff, User, Mail, Phone, Calendar, Building,
  Briefcase, Filter, RefreshCw, Shield, MapPin, Zap
} from 'lucide-react';

const EMPLOYEES_API = '/api/hrm/employees';
const DEPARTMENTS_API = '/api/hrm/departments';
const DESIGNATIONS_API = '/api/hrm/designations';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: 'all', department: 'all' });
  const [actionMenu, setActionMenu] = useState(null);

  const [formData, setFormData] = useState({
    employee_code: '', first_name: '', last_name: '', gender: '',
    date_of_birth: '', phone: '', email: '', department_id: '',
    designation_id: '', join_date: '', job_type: 'permanent',
    salary_type: 'monthly', status: 'active'
  });

  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [pagination, setPagination] = useState({
    current_page: 1, last_page: 1, per_page: 9, total_items: 0
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

  const fetchEmployees = useCallback(async (page = 1, limit = 9, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await axios.get(EMPLOYEES_API, { params });
      const data = response.data.pagination || response.data;
      const list = data.data || [];

      setEmployees(list.map(item => ({
        ...item,
        full_name: `${item.first_name} ${item.last_name || ''}`.trim(),
        department: item.department?.name || '—',
        // designation: item.designation?.name || '—' // Some APIs return this, assuming structure
        // If nested designation isn't there, we handle it gracefully in UI
      })));

      setPagination({
        current_page: data.current_page || 1,
        last_page: data.total_pages || data.last_page || 1,
        per_page: data.per_page || limit,
        total_items: data.total_items || data.total || 0
      });
    } catch (error) {
      console.error(error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDropdowns = async () => {
    setDropdownLoading(true);
    try {
      const [deptRes, desigRes] = await Promise.all([
        axios.get(DEPARTMENTS_API),
        axios.get(DESIGNATIONS_API)
      ]);
      const getList = (res) => res.data.pagination?.data || res.data?.data || [];
      setDepartments(getList(deptRes));
      setDesignations(getList(desigRes));
    } catch (error) {
      console.error(error);
    } finally {
      setDropdownLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(1, 9);
    fetchDropdowns();
  }, [fetchEmployees]);

  useEffect(() => {
    const timer = setTimeout(() => fetchEmployees(1, pagination.per_page, searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchEmployees]);

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('.action-menu-btn')) setActionMenu(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handlePageChange = (p) => {
    if (p >= 1 && p <= pagination.last_page) fetchEmployees(p, pagination.per_page, searchTerm);
  };

  const openModal = (emp = null) => {
    setErrors({});
    if (emp) {
      setEditingEmployee(emp);
      setFormData({
        employee_code: emp.employee_code || '',
        first_name: emp.first_name || '',
        last_name: emp.last_name || '',
        gender: emp.gender || '',
        date_of_birth: emp.date_of_birth || '',
        phone: emp.phone || '',
        email: emp.email || '',
        department_id: emp.department_id || emp.department?.id || '',
        designation_id: emp.designation_id || emp.designation?.id || '',
        join_date: emp.join_date || '',
        job_type: emp.job_type || 'permanent',
        salary_type: emp.salary_type || 'monthly',
        status: emp.status || 'active'
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        employee_code: '', first_name: '', last_name: '', gender: '',
        date_of_birth: '', phone: '', email: '', department_id: '',
        designation_id: '', join_date: '', job_type: 'permanent',
        salary_type: 'monthly', status: 'active'
      });
    }
    setShowModal(true);
    setActionMenu(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');
    setErrors({});

    try {
      if (editingEmployee) {
        await axios.put(`${EMPLOYEES_API}/${editingEmployee.id}`, formData);
      } else {
        await axios.post(EMPLOYEES_API, formData);
      }
      showNotification(editingEmployee ? 'Updated successfully' : 'Created successfully');
      fetchEmployees(pagination.current_page, pagination.per_page, searchTerm);
      setShowModal(false);
    } catch (error) {
      handleApiError(error, 'Save failed');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete employee?')) return;
    setOperationLoading(`del-${id}`);
    try {
      await axios.delete(`${EMPLOYEES_API}/${id}`);
      showNotification('Deleted successfully');
      fetchEmployees(pagination.current_page, pagination.per_page, searchTerm);
    } catch (e) { handleApiError(e, 'Delete failed'); }
    finally { setOperationLoading(null); setActionMenu(null); }
  };

  const filteredEmployees = employees.filter(e => {
    if (filters.status !== 'all' && e.status !== filters.status) return false;
    if (filters.department !== 'all' && (e.department_id || e.department?.id) != filters.department) return false;
    return true;
  });

  const getInitials = (f, l) => `${f?.[0] || ''}${l?.[0] || ''}`.toUpperCase();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-cyan-500/30">
      <AnimatePresence>
        {notification.show && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className={`fixed top-6 right-1/2 translate-x-1/2 z-[60] px-6 py-3 rounded-full shadow-2xl backdrop-blur-md border border-white/10 flex items-center gap-3 font-medium ${notification.type === 'error' ? 'bg-rose-500/20 text-rose-300' : 'bg-cyan-500/20 text-cyan-300'}`}>
            {notification.type === 'error' ? <Shield size={18} /> : <Check size={18} />} {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">Workforce</span>
            </h1>
            <p className="text-slate-400 text-lg">Employee directory and administration</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openModal()} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-bold text-white shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 flex items-center gap-2">
            <Plus size={20} /> Add Employee
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Staff', value: pagination.total_items, icon: User, color: 'text-blue-400', bg: 'bg-blue-400/10' },
            { label: 'Active', value: filteredEmployees.filter(e => e.status === 'active').length, icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
            { label: 'Departments', value: departments.length, icon: Building, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-400 transition-colors" size={20} />
            <input type="text" placeholder="Find employee..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all placeholder:text-slate-500" />
          </div>

          <div className="flex gap-3 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-3 rounded-xl border border-white/10 min-w-[140px]">
              <Building size={16} className="text-slate-400" />
              <select value={filters.department} onChange={e => setFilters({ ...filters, department: e.target.value })} className="bg-transparent border-none text-sm text-slate-300 focus:ring-0 cursor-pointer outline-none w-full">
                <option value="all">Dept: All</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-3 rounded-xl border border-white/10 min-w-[140px]">
              <Filter size={16} className="text-slate-400" />
              <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="bg-transparent border-none text-sm text-slate-300 focus:ring-0 cursor-pointer outline-none w-full">
                <option value="all">Status: All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button onClick={() => fetchEmployees(pagination.current_page, pagination.per_page, searchTerm)} className="p-3 bg-slate-900/50 rounded-xl border border-white/10 hover:text-cyan-400 transition-colors">
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredEmployees.map(employee => (
              <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key={employee.id} className="group bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-500/30 transition-all hover:shadow-xl relative flex flex-col">
                <div className={`h-1 w-full ${employee.status === 'active' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-slate-700'}`} />

                <div className="p-6 flex-1 flex flex-col relative">
                  <div className="absolute top-4 right-4 z-20">
                    <button onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === employee.id ? null : employee.id); }} className="action-menu-btn p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><MoreVertical size={18} /></button>
                    {actionMenu === employee.id && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50 py-1 flex flex-col">
                        <button onClick={() => openModal(employee)} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-cyan-300 flex items-center gap-2"><Edit size={14} /> Edit</button>
                        <div className="h-px bg-white/5 my-1" />
                        <button onClick={() => handleDelete(employee.id)} className="w-full text-left px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"><Trash2 size={14} /> Delete</button>
                      </motion.div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center text-2xl font-bold text-cyan-300 border border-white/5">
                      {getInitials(employee.first_name, employee.last_name)}
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-white line-clamp-1">{employee.full_name}</h3>
                      <p className="text-xs text-slate-400 font-mono tracking-wider">ID: {employee.employee_code}</p>
                      <div className="flex gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${employee.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>{employee.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm text-slate-300 p-2 bg-white/5 rounded-lg">
                      <Briefcase size={16} className="text-cyan-400 shrink-0" />
                      <span className="truncate">{employee.designation?.name || 'No Designation'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-300 p-2 bg-white/5 rounded-lg">
                      <Building size={16} className="text-blue-400 shrink-0" />
                      <span className="truncate">{employee.department}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-300 p-2 bg-white/5 rounded-lg">
                      <Mail size={16} className="text-indigo-400 shrink-0" />
                      <span className="truncate">{employee.email || 'No email'}</span>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-white/5">
                    <div className='flex items-center gap-2'>
                      <Calendar size={14} />
                      <span>Joined: {new Date(employee.join_date).toLocaleDateString()}</span>
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
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-4xl bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900 shrink-0">
                <h2 className="text-xl font-bold text-white">{editingEmployee ? 'Edit Employee' : 'New Employee'}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"><X size={20} /></button>
              </div>

              <div className="overflow-y-auto p-6">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4">Personal Details</h3>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Employee Code *</label>
                    <input type="text" value={formData.employee_code} onChange={e => setFormData({ ...formData, employee_code: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" required placeholder="EMP-001" />
                    {errors.employee_code && <p className="text-rose-400 text-[10px] mt-1 font-bold">{errors.employee_code[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">First Name *</label>
                    <input type="text" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" required placeholder="First Name" />
                    {errors.first_name && <p className="text-rose-400 text-[10px] mt-1 font-bold">{errors.first_name[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Last Name</label>
                    <input type="text" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" placeholder="Last Name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Gender</label>
                    <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none">
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Date of Birth</label>
                    <input type="date" value={formData.date_of_birth} onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Email</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" placeholder="email@company.com" />
                    {errors.email && <p className="text-rose-400 text-[10px] mt-1 font-bold">{errors.email[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Phone</label>
                    <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" placeholder="+123456789" />
                  </div>

                  <div className="md:col-span-2 pt-4">
                    <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Professional Details</h3>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Department *</label>
                    <select value={formData.department_id} onChange={e => setFormData({ ...formData, department_id: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" required>
                      <option value="">Select Department</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    {errors.department_id && <p className="text-rose-400 text-[10px] mt-1 font-bold">{errors.department_id[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Designation *</label>
                    <select value={formData.designation_id} onChange={e => setFormData({ ...formData, designation_id: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" required>
                      <option value="">Select Designation</option>
                      {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Join Date</label>
                    <input type="date" value={formData.join_date} onChange={e => setFormData({ ...formData, join_date: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Job Type</label>
                    <select value={formData.job_type} onChange={e => setFormData({ ...formData, job_type: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none">
                      <option value="permanent">Permanent</option>
                      <option value="contract">Contract</option>
                      <option value="intern">Intern</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Salary Type</label>
                    <select value={formData.salary_type} onChange={e => setFormData({ ...formData, salary_type: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none">
                      <option value="monthly">Monthly</option>
                      <option value="hourly">Hourly</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Status</label>
                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 pt-6 border-t border-white/5">
                    <button type="submit" disabled={operationLoading} className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2">
                      {operationLoading && <Loader size={20} className="animate-spin" />} {editingEmployee ? 'Update Employee Record' : 'Create Employee Record'}
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

export default Employees;