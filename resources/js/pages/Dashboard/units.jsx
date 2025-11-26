import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  Ruler,
  Activity,
  Calendar,
  Shield
} from 'lucide-react';

const API_URL = 'http://localhost:8000/api/units';

const Units = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [formData, setFormData] = useState({
    name: '',
    status: 'active'
  });

  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    totalItems: 0,
    totalPages: 1
  });

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
  };

  // Fetch paginated units
  const fetchUnits = async (page = 1, limit = pagination.perPage) => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL, {
        params: { page, limit }
      });

      const res = response.data;
      setUnits(res.data || []);
      setPagination({
        page: res.page || 1,
        perPage: res.perPage || 10,
        totalItems: res.totalItems || 0,
        totalPages: res.totalPages || 1
      });
      setError('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load units';
      setError(msg);
      showNotification(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Search units (no pagination)
  const searchUnits = async (keyword) => {
    if (!keyword.trim()) {
      fetchUnits(pagination.page);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/search`, {
        params: { keyword }
      });

      setUnits(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        page: 1,
        totalPages: 1,
        totalItems: response.data.data?.length || 0
      }));
    } catch (err) {
      showNotification('Search failed', 'error');
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchUnits(1);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUnits(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages || searchTerm) return;
    fetchUnits(newPage);
  };

  const handleLimitChange = (newLimit) => {
    const limit = parseInt(newLimit);
    setPagination(prev => ({ ...prev, perPage: limit }));
    fetchUnits(1, limit);
  };

  // Form handlers
  const resetForm = () => {
    setFormData({ name: '', status: 'active' });
    setEditingUnit(null);
    setError('');
  };

  const openModal = (unit = null) => {
    if (unit) {
      setEditingUnit(unit);
      setFormData({
        name: unit.name,
        status: unit.status
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
  };

  const handleStatusChange = (status) => {
    setFormData(prev => ({ ...prev, status }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        status: formData.status
      };

      if (editingUnit) {
        await axios.post(`${API_URL}/${editingUnit.id}`, payload);
        showNotification('Unit updated successfully!');
      } else {
        await axios.post(API_URL, payload);
        showNotification('Unit created successfully!');
      }

      searchTerm ? searchUnits(searchTerm) : fetchUnits(pagination.page);
      closeModal();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.name?.[0] || 'Operation failed';
      setError(msg);
      showNotification(msg, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this unit?')) return;

    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Unit deleted');
      if (units.length === 1 && pagination.page > 1) {
        fetchUnits(pagination.page - 1);
      } else {
        searchTerm ? searchUnits(searchTerm) : fetchUnits(pagination.page);
      }
    } catch {
      showNotification('Delete failed', 'error');
    }
    setActionMenu(null);
  };

  const toggleStatus = async (unit) => {
    const newStatus = unit.status === 'active' ? 'inactive' : 'active';
    try {
      await axios.post(`${API_URL}/${unit.id}`, { status: newStatus });
      showNotification(`Unit ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      searchTerm ? searchUnits(searchTerm) : fetchUnits(pagination.page);
    } catch {
      showNotification('Status update failed', 'error');
    }
    setActionMenu(null);
  };

  const stats = {
    total: pagination.totalItems,
    active: units.filter(u => u.status === 'active').length,
    inactive: units.filter(u => u.status === 'inactive').length
  };

  const formatDate = (date) => date ? new Date(date).toLocaleDateString() : 'N/A';

  useEffect(() => {
    const handler = () => setActionMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

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
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl ${
              notification.type === 'error' ? 'bg-red-600' : 'bg-green-600'
            }`}
          >
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
          <button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-3 rounded-xl font-bold flex items-center gap-3 shadow-lg"
          >
            <Plus size={22} /> Add New Unit
          </button>
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
                placeholder="Search units..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-400">Show:</span>
              <select
                value={pagination.perPage}
                onChange={(e) => handleLimitChange(e.target.value)}
                className="bg-gray-700/50 px-4 py-3 rounded-xl outline-none"
              >
                {[5, 10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Units Grid */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {units.map(unit => {
            const isActive = unit.status === 'active';
            return (
              <motion.div key={unit.id} variants={itemVariants} whileHover={{ y: -8, scale: 1.02 }} className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 hover:border-purple-500/50 transition-all">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg"><Ruler size={20} className="text-purple-400" /></div>
                      <h3 className="text-xl font-bold">{unit.name}</h3>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === unit.id ? null : unit.id); }}
                      className="p-2 hover:bg-gray-700/50 rounded-lg"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>

                  {/* Status Badge */}
                  <button onClick={() => toggleStatus(unit)} className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                    isActive ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {isActive ? <div className="w-2 h-2 bg-green-400 rounded-full"></div> : <div className="w-2 h-2 bg-red-400 rounded-full"></div>}
                    {isActive ? 'Active' : 'Inactive'}
                  </button>

                  <div className="mt-6 space-y-3 text-sm text-gray-400">
                    <div className="flex items-center gap-2"><Shield size={16} /> ID: #{unit.id}</div>
                    <div className="flex items-center gap-2"><Calendar size={16} /> Created: {formatDate(unit.created_at)}</div>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700/30">
                    <span className="text-xs text-gray-500">Updated: {formatDate(unit.updated_at)}</span>
                    <div className="flex gap-2">
                      <button onClick={() => openModal(unit)} className="p-2 bg-blue-500/20 hover:bg-blue-500/40 rounded-lg"><Edit size={14} /></button>
                      <button onClick={() => handleDelete(unit.id)} className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>

                {/* Action Menu */}
                <AnimatePresence>
                  {actionMenu === unit.id && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute right-4 top-20 bg-gray-800 border border-gray-600 rounded-xl shadow-xl py-2 z-10">
                      <button onClick={() => { openModal(unit); setActionMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-sm"><Edit size={16} /> Edit</button>
                      <button onClick={() => { toggleStatus(unit); }} className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-sm">
                        {isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                        {isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => { handleDelete(unit.id); }} className="w-full text-left px-4 py-2 hover:bg-red-500/20 text-red-400 flex items-center gap-3 text-sm"><Trash2 size={16} /> Delete</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Pagination – Only show when NOT searching */}
        {!searchTerm && pagination.totalPages > 1 && (
          <div className="flex justify-between items-center py-6 border-t border-gray-700/30">
            <div className="text-sm text-gray-400">
              Showing {(pagination.page - 1) * pagination.perPage + 1} to {Math.min(pagination.page * pagination.perPage, pagination.totalItems)} of {pagination.totalItems}
            </div>
            <div className="flex gap-2">
              <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="px-4 py-2 rounded-xl border border-gray-600 disabled:opacity-50">Previous</button>
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button key={i + 1} onClick={() => handlePageChange(i + 1)} className={`px-4 py-2 rounded-xl border ${pagination.page === i + 1 ? 'bg-purple-600 border-purple-500' : 'border-gray-600'}`}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="px-4 py-2 rounded-xl border border-gray-600 disabled:opacity-50">Next</button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {units.length === 0 && !loading && (
          <div className="text-center py-20">
            <Ruler size={64} className="mx-auto text-gray-600 mb-6" />
            <h3 className="text-2xl font-bold mb-3">{searchTerm ? 'No units found' : 'No units yet'}</h3>
            <p className="text-gray-400 mb-8">{searchTerm ? 'Try different keywords' : 'Create your first unit to get started'}</p>
            {!searchTerm && (
              <button onClick={() => openModal()} className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 rounded-xl font-bold">
                <Plus className="inline mr-2" /> Create First Unit
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-3xl p-8 max-w-md w-full border border-gray-700" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  {editingUnit ? 'Edit Unit' : 'Create New Unit'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-700 rounded-lg"><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Unit Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="e.g., Kilogram"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3">Status</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['active', 'inactive'].map(st => (
                      <label key={st} onClick={() => handleStatusChange(st)} className={`p-4 border-2 rounded-xl text-center cursor-pointer transition ${formData.status === st ? (st === 'active' ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10') : 'border-gray-600'}`}>
                        {st === 'active' ? <Activity size={20} className="mx-auto mb-2" /> : <EyeOff size={20} className="mx-auto mb-2" />}
                        <span className="capitalize font-medium">{st}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl">Cancel</button>
                  <button type="submit" className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold flex items-center gap-2">
                    <Check size={20} />
                    {editingUnit ? 'Update' : 'Create'}
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