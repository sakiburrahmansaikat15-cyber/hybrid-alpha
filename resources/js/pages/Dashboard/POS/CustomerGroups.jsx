import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Loader, ChevronLeft, ChevronRight,
  Activity, Zap, Target, Users, Percent, Shield
} from 'lucide-react';

const API_URL = '/api/pos/customer-groups';

const CustomerGroups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', percentage: '', is_active: 1 });
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

  const fetchGroups = useCallback(async (page = 1, keyword = searchTerm) => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.per_page };
      if (keyword.trim()) params.keyword = keyword.trim();
      const response = await axios.get(API_URL, { params });
      const res = response.data;
      setGroups(res.pagination?.data || res.data || []);
      setPagination({
        current_page: res.pagination?.current_page || res.current_page || 1,
        last_page: res.pagination?.total_pages || res.last_page || 1,
        per_page: res.pagination?.per_page || res.per_page || 12,
        total_items: res.pagination?.total_items || res.total || 0,
      });
    } catch (error) {
      handleApiError(error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.per_page, searchTerm, handleApiError]);

  useEffect(() => {
    const timer = setTimeout(() => fetchGroups(1), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchGroups]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page) return;
    fetchGroups(newPage);
  };

  const openModal = (group = null) => {
    if (group) {
      setEditingGroup(group);
      setFormData({ name: group.name, percentage: group.percentage, is_active: group.is_active });
    } else {
      setEditingGroup(null);
      setFormData({ name: '', percentage: '', is_active: 1 });
    }
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ name: '', percentage: '', is_active: 1 });
    setEditingGroup(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');
    try {
      if (editingGroup) {
        await axios.put(`${API_URL}/${editingGroup.id}`, formData);
        showNotification('Group updated successfully');
      } else {
        await axios.post(API_URL, formData);
        showNotification('Group created successfully');
      }
      fetchGroups(pagination.current_page);
      closeModal();
    } catch (error) {
      handleApiError(error);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this group?')) return;
    setOperationLoading(id);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Group deleted successfully');
      fetchGroups(1);
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
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm border ${notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' : 'bg-blue-500/10 border-blue-500/20 text-blue-600'}`}>
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
              <Users className="text-blue-500" /> Customer Groups
            </h1>
            <p className="text-sm text-slate-500">Manage customer loyalty tiers and segments</p>
          </div>
          <button onClick={() => openModal()} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20">
            <Plus size={18} />
            <span>Add Group</span>
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="lg:col-span-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
            />
          </div>
          <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <Activity className="text-blue-500" size={18} />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</span>
            </div>
            <span className="text-xl font-bold text-blue-600">{pagination.total_items}</span>
          </div>
        </div>

        {loading && groups.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-800" />)}
          </div>
        ) : groups.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {groups.map((group) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4 }}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                      <Shield size={24} />
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openModal(group)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(group.id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-600 transition-colors">
                        {operationLoading === group.id ? <Loader className="animate-spin" size={16} /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 truncate">{group.name}</h3>

                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase ${group.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {group.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-sm text-slate-500 font-medium">Discount</span>
                    <div className="flex items-center gap-1 text-blue-600 font-bold text-lg">
                      <Percent size={16} />
                      {parseFloat(group.percentage).toFixed(2)}%
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
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-blue-500 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-blue-500 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Users size={64} className="mb-4 opacity-50" />
            <p className="font-semibold text-lg">No Groups Found</p>
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
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-bold dark:text-white">{editingGroup ? 'Edit Group' : 'New Group'}</h2>
                <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Group Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="e.g. VIP Customers"
                    required
                  />
                  {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name[0]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Percentage (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.percentage}
                      onChange={e => setFormData({ ...formData, percentage: e.target.value })}
                      className="w-full pl-4 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="0.00"
                      required
                    />
                    <Percent size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  {errors.percentage && <p className="text-rose-500 text-xs mt-1">{errors.percentage[0]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select
                    value={formData.is_active}
                    onChange={e => setFormData({ ...formData, is_active: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={closeModal} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                  <button
                    type="submit"
                    disabled={operationLoading === 'saving'}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {operationLoading === 'saving' ? <Loader className="animate-spin" size={18} /> : <Target size={18} />}
                    {editingGroup ? 'Update Group' : 'Create Group'}
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

export default CustomerGroups;