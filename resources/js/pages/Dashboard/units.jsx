import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Check,
  AlertCircle,
  MoreVertical,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Ruler,
  Activity,
  Calendar,
  Shield,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const API_URL = '/api/units';

const Units = () => {
  const { color } = useTheme();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMenu, setActionMenu] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [errors, setErrors] = useState({});

  // Theme-aware color classes
  const colorMap = {
    blue: { primary: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-500/10', border: 'border-blue-500/20', glow: 'shadow-blue-500/20' },
    green: { primary: 'bg-emerald-500', text: 'text-emerald-500', light: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/20' },
    purple: { primary: 'bg-indigo-500', text: 'text-indigo-500', light: 'bg-indigo-500/10', border: 'border-indigo-500/20', glow: 'shadow-indigo-500/20' },
    orange: { primary: 'bg-amber-500', text: 'text-amber-500', light: 'bg-amber-500/10', border: 'border-amber-500/20', glow: 'shadow-amber-500/20' },
    red: { primary: 'bg-rose-500', text: 'text-rose-500', light: 'bg-rose-500/10', border: 'border-rose-500/20', glow: 'shadow-rose-500/20' },
  }[color] || { primary: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-500/10', border: 'border-blue-500/20', glow: 'shadow-blue-500/20' };

  const [formData, setFormData] = useState({
    name: '',
    status: 'active'
  });

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  });

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
  }, []);

  const handleApiError = useCallback((error) => {
    console.error('API Error:', error);
    if (error.response?.status === 422) {
      const validationErrors = error.response.data.errors || {};
      setErrors(validationErrors);
      const firstError = Object.values(validationErrors)[0]?.[0];
      showNotification(firstError || 'Validation error', 'error');
    } else if (error.response?.data?.message) {
      showNotification(error.response.data.message, 'error');
    } else {
      showNotification('Something went wrong', 'error');
    }
  }, [showNotification]);

  const fetchUnits = useCallback(async (page = 1, perPage = 10, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit: perPage };
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await axios.get(API_URL, { params });
      const res = response.data;

      setUnits(res.pagination?.data || []);
      setPagination({
        current_page: res.pagination?.current_page || 1,
        last_page: res.pagination?.total_pages || 1,
        per_page: res.pagination?.per_page || perPage,
        total: res.pagination?.total_items || 0
      });
      setErrors({});
    } catch (error) {
      handleApiError(error);
      setUnits([]);
    } finally {
      // Simulate industrial delay for effect
      setTimeout(() => setLoading(false), 300);
    }
  }, [handleApiError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUnits(1, pagination.per_page, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchUnits]);

  useEffect(() => {
    const handler = () => setActionMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page) return;
    fetchUnits(newPage, pagination.per_page, searchTerm);
  };

  const handleLimitChange = (newLimit) => {
    const limit = parseInt(newLimit, 10);
    setPagination(prev => ({ ...prev, per_page: limit, current_page: 1 }));
    fetchUnits(1, limit, searchTerm);
  };

  const resetForm = () => {
    setFormData({ name: '', status: 'active' });
    setEditingUnit(null);
    setErrors({});
  };

  const openModal = (unit = null) => {
    if (unit) {
      setEditingUnit(unit);
      setFormData({
        name: unit.name || '',
        status: unit.status || 'active'
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(resetForm, 300);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleStatusChange = (status) => {
    setFormData(prev => ({ ...prev, status }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    try {
      if (editingUnit) {
        await axios.post(`${API_URL}/${editingUnit.id}`, formData);
        showNotification('Unit updated successfully!');
      } else {
        await axios.post(API_URL, formData);
        showNotification('Unit created successfully!');
      }
      fetchUnits(pagination.current_page, pagination.per_page, searchTerm);
      closeModal();
    } catch (error) {
      handleApiError(error);
    }
  };

  const toggleStatus = async (unit) => {
    const newStatus = unit.status === 'active' ? 'inactive' : 'active';
    try {
      await axios.post(`${API_URL}/${unit.id}`, { status: newStatus });
      showNotification(`Unit ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchUnits(pagination.current_page, pagination.per_page, searchTerm);
    } catch (error) {
      handleApiError(error);
    }
    setActionMenu(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Confirm deletion of this unit?')) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Unit deleted successfully');
      if (units.length === 1 && pagination.current_page > 1) {
        fetchUnits(pagination.current_page - 1, pagination.per_page, searchTerm);
      } else {
        fetchUnits(pagination.current_page, pagination.per_page, searchTerm);
      }
    } catch (error) {
      handleApiError(error);
    }
    setActionMenu(null);
  };

  const stats = useMemo(() => ({
    total: pagination.total,
    active: units.filter(u => u.status === 'active').length,
    inactive: units.filter(u => u.status === 'inactive').length
  }), [pagination.total, units]);

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-US', { year: '2-digit', month: 'short', day: '2-digit' }) : 'N/A';

  // Skeleton Loader for Industrial Theme
  if (loading && units.length === 0) {
    return (
      <div className="p-4 lg:p-0 space-y-6">
        <div className="flex justify-between items-end animate-pulse">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 lg:p-0">
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 50 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 50 }}
            className={`fixed top-24 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md border border-white/10 ${notification.type === 'error' ? 'bg-rose-500/90 text-white' : 'bg-emerald-500/90 text-white'
              }`}
          >
            {notification.type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
            <span className="text-xs font-bold uppercase tracking-wide">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className={`h-1.5 w-8 rounded-full ${colorMap.primary}`}></span>
            <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${colorMap.text}`}>Inventory Control</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Unit <span className="text-slate-400 dark:text-slate-600">Configuration</span>
          </h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => openModal()}
          className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg ${colorMap.primary} ${colorMap.glow} flex items-center gap-2 uppercase tracking-wider text-xs`}
        >
          <Plus size={16} strokeWidth={3} /> Initialize New Unit
        </motion.button>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Registry', value: stats.total, icon: Ruler, color: 'text-slate-900 dark:text-white' },
          { label: 'Active Nodes', value: stats.active, icon: Activity, color: 'text-emerald-500' },
          { label: 'Suspended', value: stats.inactive, icon: EyeOff, color: 'text-rose-500' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5 rounded-2xl flex items-center justify-between group"
          >
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            </div>
            <div className={`p-3 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors`}>
              <stat.icon size={20} className="text-slate-500" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Control Bar */}
      <div className="glass-card p-2 rounded-2xl flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search registry protocol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-transparent focus:border-slate-300 dark:focus:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-0 transition-all placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
          />
        </div>
        <div className="flex items-center gap-2 w-full lg:w-auto px-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap hidden sm:block">Display Limit</span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/50 rounded-lg p-1">
            {[10, 25, 50].map(limit => (
              <button
                key={limit}
                onClick={() => handleLimitChange(limit)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${pagination.per_page === limit
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
              >
                {limit}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Units Grid - Responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {units.map((unit) => {
            const isActive = unit.status === 'active';
            return (
              <motion.div
                key={unit.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -5 }}
                className="glass-card rounded-2xl p-6 relative group overflow-hidden border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300"
              >
                {/* Status Indicator Bar */}
                <div className={`absolute top-0 left-0 w-1.5 h-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'} opacity-50 group-hover:opacity-100 transition-opacity`} />

                <div className="flex justify-between items-start pl-4 relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                        {isActive ? 'Operational' : 'Suspended'}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400">#{unit.id.toString().padStart(4, '0')}</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2 mb-1 tracking-tight">{unit.name}</h3>
                  </div>

                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionMenu(actionMenu === unit.id ? null : unit.id);
                      }}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                      <MoreVertical size={18} />
                    </button>

                    <AnimatePresence>
                      {actionMenu === unit.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 10 }}
                          className="absolute right-0 top-10 w-40 glass-card rounded-xl shadow-2xl z-50 p-1 border border-slate-200 dark:border-white/10"
                        >
                          <button onClick={() => { openModal(unit); setActionMenu(null); }} className="w-full flex items-center gap-3 px-3 py-2 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg uppercase tracking-wide">
                            <Edit size={14} /> Modify
                          </button>
                          <button onClick={() => { toggleStatus(unit); setActionMenu(null); }} className="w-full flex items-center gap-3 px-3 py-2 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg uppercase tracking-wide">
                            {isActive ? <EyeOff size={14} /> : <Eye size={14} />} {isActive ? 'Disable' : 'Enable'}
                          </button>
                          <div className="h-px bg-slate-100 dark:bg-white/10 my-1" />
                          <button onClick={() => { handleDelete(unit.id); setActionMenu(null); }} className="w-full flex items-center gap-3 px-3 py-2 text-[11px] font-bold text-rose-500 hover:bg-rose-500/10 rounded-lg uppercase tracking-wide">
                            <Trash2 size={14} /> Terminate
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="mt-8 pl-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Entry Date</p>
                    <div className="flex items-center gap-1.5 mt-1 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                      <Calendar size={12} /> {formatDate(unit.created_at)}
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Modified</p>
                    <div className="flex items-center gap-1.5 mt-1 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                      <RefreshCw size={12} /> {formatDate(unit.updated_at)}
                    </div>
                  </div>
                </div>

                {/* Decorative Background Icon */}
                <div className="absolute -bottom-6 -right-6 text-slate-100 dark:text-slate-800 opacity-50 rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                  <Ruler size={100} strokeWidth={1} />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {units.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
          <Ruler size={64} className="text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Registry Empty</h3>
          <p className="text-xs font-medium text-slate-500 mt-2">No measurement units found in database</p>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.last_page > 1 && (
        <div className="flex justify-between items-center bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-white/5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Page {pagination.current_page} of {pagination.last_page}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.current_page - 1)}
              disabled={pagination.current_page === 1}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => handlePageChange(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.last_page}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Industrial Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`p-6 border-b border-slate-100 dark:border-white/5 ${colorMap.light} flex justify-between items-center`}>
                <h2 className={`text-lg font-black uppercase tracking-wider ${colorMap.text}`}>
                  {editingUnit ? 'Modify Protocol' : 'Initialize Unit'}
                </h2>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Unit Designation *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm font-bold"
                    placeholder="e.g. KILOGRAM"
                  />
                  {errors.name && <p className="text-rose-500 text-[10px] font-bold mt-1 uppercase">{errors.name[0]}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Operational Status</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['active', 'inactive'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleStatusChange(st)}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${formData.status === st
                            ? st === 'active'
                              ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600'
                              : 'border-rose-500 bg-rose-500/5 text-rose-600'
                            : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300'
                          }`}
                      >
                        {st === 'active' ? <Activity size={20} /> : <EyeOff size={20} />}
                        <span className="text-[10px] font-black uppercase tracking-widest">{st}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-3 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl uppercase tracking-wider transition-colors"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    className={`flex-[2] px-4 py-3 text-xs font-bold text-white rounded-xl uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 ${colorMap.primary} hover:brightness-110 transition-all`}
                  >
                    <Check size={16} strokeWidth={3} /> {editingUnit ? 'Save Updates' : 'Execute'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Units;