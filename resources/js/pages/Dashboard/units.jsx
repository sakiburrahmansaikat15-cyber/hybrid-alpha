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
  Shield
} from 'lucide-react';

const API_URL = 'http://localhost:8000/api/units';

const Units = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMenu, setActionMenu] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [errors, setErrors] = useState({});

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

  // Fixed: Pass per_page explicitly — avoid stale closure
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
      setLoading(false);
    }
  }, [handleApiError]);

  // Debounced search + reacts to per_page change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUnits(1, pagination.per_page, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchUnits]);

  // Initial load
  useEffect(() => {
    fetchUnits(1, 10);
  }, [fetchUnits]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page) return;
    fetchUnits(newPage, pagination.per_page, searchTerm);
  };

  // Fixed: Now correctly updates per_page and resets to page 1
  const handleLimitChange = (newLimit) => {
    const limit = parseInt(newLimit, 10);
    setPagination(prev => ({
      ...prev,
      per_page: limit,
      current_page: 1
    }));
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
    if (!window.confirm('Delete this unit permanently?')) return;

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

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

  useEffect(() => {
    const handler = () => setActionMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  if (loading && units.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex justify-between">
            <div className="h-10 bg-gray-800 rounded w-64 animate-pulse"></div>
            <div className="h-12 bg-gray-800 rounded-xl w-40 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-800/40 rounded-2xl p-6 animate-pulse">
                <div className="h-12 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-800/30 rounded-2xl p-6 animate-pulse space-y-4">
                <div className="h-8 bg-gray-700 rounded"></div>
                <div className="h-20 bg-gray-700/50 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 py-8">
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 ${
              notification.type === 'error' ? 'bg-red-600' : 'bg-green-600'
            } text-white font-medium`}
          >
            {notification.type === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Units Management
            </h1>
            <p className="text-gray-400 mt-2">Manage measurement units and their status</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openModal()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-3 rounded-xl font-bold flex items-center gap-3 shadow-lg"
          >
            <Plus size={22} /> Add New Unit
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Units', value: stats.total, icon: Ruler, color: 'purple' },
            { label: 'Active Units', value: stats.active, icon: Activity, color: 'green' },
            { label: 'Inactive Units', value: stats.inactive, icon: EyeOff, color: 'red' },
          ].map((stat, i) => (
            <div key={i} className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 bg-${stat.color}-500/10 rounded-xl`}>
                  <stat.icon size={28} className={`text-${stat.color}-400`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Limit */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/30">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search units by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-400">Show:</span>
              <select
                value={pagination.per_page}
                onChange={(e) => handleLimitChange(e.target.value)}
                className="bg-gray-700/50 px-4 py-3 rounded-xl text-white border border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span className="text-gray-400">per page</span>
            </div>
          </div>
        </div>

        {/* Units Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8"
        >
          {units.map(unit => {
            const isActive = unit.status === 'active';
            return (
              <motion.div
                key={unit.id}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 hover:border-purple-500/50 transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Ruler size={20} className="text-purple-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white">{unit.name}</h3>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionMenu(actionMenu === unit.id ? null : unit.id);
                      }}
                      className="p-2 hover:bg-gray-700/50 rounded-lg opacity-0 group-hover:opacity-100 transition"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>

                  <button
                    onClick={() => toggleStatus(unit)}
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4 ${
                      isActive
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    {isActive ? 'Active' : 'Inactive'}
                  </button>

                  <div className="mt-6 space-y-3 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Shield size={16} /> ID: #{unit.id}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} /> Created: {formatDate(unit.created_at)}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700/30">
                    <span className="text-xs text-gray-500">Updated: {formatDate(unit.updated_at)}</span>
                    <div className="flex gap-2">
                      <button onClick={() => openModal(unit)} className="p-2 bg-blue-500/20 hover:bg-blue-500/40 rounded-lg">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDelete(unit.id)} className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {actionMenu === unit.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute right-4 top-20 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl py-2 z-10 min-w-[160px]"
                    >
                      <button
                        onClick={() => { openModal(unit); setActionMenu(null); }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-sm"
                      >
                        <Edit size={16} /> Edit
                      </button>
                      <button
                        onClick={() => { toggleStatus(unit); setActionMenu(null); }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-sm"
                      >
                        {isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                        {isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => { handleDelete(unit.id); setActionMenu(null); }}
                        className="w-full text-left px-4 py-2 hover:bg-red-500/20 text-red-400 flex items-center gap-3 text-sm"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center py-6 border-t border-gray-700/30">
            <div className="text-sm text-gray-400 mb-4 sm:mb-0">
              Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} units
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="px-4 py-2 rounded-xl border border-gray-600 disabled:opacity-50 flex items-center gap-2"
              >
                <ChevronLeft size={16} /> Previous
              </button>

              {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pagination.last_page || Math.abs(p - pagination.current_page) <= 2)
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && p - arr[idx - 1] > 1 && <span className="px-3 py-2">...</span>}
                    <button
                      onClick={() => handlePageChange(p)}
                      className={`px-4 py-2 rounded-xl border ${
                        pagination.current_page === p
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'border-gray-600 hover:border-purple-500'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}

              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
                className="px-4 py-2 rounded-xl border border-gray-600 disabled:opacity-50 flex items-center gap-2"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {units.length === 0 && !loading && (
          <div className="text-center py-20">
            <Ruler size={80} className="mx-auto text-gray-600 mb-6" />
            <h3 className="text-2xl font-bold mb-3">
              {searchTerm ? 'No units found' : 'No units yet'}
            </h3>
            <p className="text-gray-400 mb-8">
              {searchTerm ? 'Try different keywords' : 'Create your first unit to get started'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => openModal()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-3 rounded-xl font-bold shadow-lg"
              >
                <Plus className="inline mr-2" /> Create First Unit
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl max-w-md w-full border border-gray-700/50 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                    {editingUnit ? 'Edit Unit' : 'Create New Unit'}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-700/50"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">Unit Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 bg-gray-700/50 border ${
                        errors.name ? 'border-red-500' : 'border-gray-600/50'
                      } rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
                      placeholder="e.g., Kilogram, Liter, Piece"
                    />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name[0]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">Status</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['active', 'inactive'].map((st) => (
                        <label
                          key={st}
                          onClick={() => handleStatusChange(st)}
                          className={`p-4 border-2 rounded-xl text-center cursor-pointer transition-all ${
                            formData.status === st
                              ? st === 'active'
                                ? 'border-green-500 bg-green-500/10'
                                : 'border-red-500 bg-red-500/10'
                              : 'border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          {st === 'active' ? (
                            <Activity size={24} className="mx-auto mb-2 text-green-400" />
                          ) : (
                            <EyeOff size={24} className="mx-auto mb-2 text-red-400" />
                          )}
                          <span className="capitalize font-medium">{st}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-700/50">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-6 py-3 text-sm font-medium text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-600/50 rounded-xl border border-gray-600/50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2"
                    >
                      <Check size={20} />
                      {editingUnit ? 'Update' : 'Create'} Unit
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Units;