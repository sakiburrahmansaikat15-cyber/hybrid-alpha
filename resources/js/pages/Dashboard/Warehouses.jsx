import React, { useState, useEffect, useCallback } from 'react';
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
  Warehouse as WarehouseIcon,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader,
  Shield,
  Package,
  Activity,
  Calendar
} from 'lucide-react';

const API_URL = '/api/warehouses'; // Adjust if your API base is different

const WarehouseManagement = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionMenu, setActionMenu] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    country: '',
    state: '',
    city: '',
    capacity: '',
    is_default: false,
    status: 'active'
  });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total_items: 0
  });

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
  }, []);

  const handleApiError = useCallback((error, defaultMessage) => {
    if (error.response?.status === 422) {
      const validationErrors = error.response.data.errors || {};
      setErrors(validationErrors);
      const firstError = Object.values(validationErrors)[0]?.[0];
      showNotification(firstError || 'Validation error', 'error');
    } else if (error.response?.data?.message) {
      showNotification(error.response.data.message, 'error');
      setErrors({ _general: error.response.data.message });
    } else {
      showNotification(defaultMessage || 'Something went wrong', 'error');
      setErrors({ _general: defaultMessage });
    }
  }, [showNotification]);

  // Fetch warehouses with server-side search & pagination
  const fetchWarehouses = useCallback(async (page = 1, perPage = 10, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit: perPage };
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await axios.get(API_URL, { params });
      const res = response.data;

      const warehouseData = res.pagination?.data || [];
      const formatted = warehouseData.map(item => ({
        id: item.id,
        name: item.name,
        code: item.code,
        type: item.type,
        contact_person: item.contact_person,
        phone: item.phone,
        email: item.email,
        address: item.address,
        country: item.country,
        state: item.state,
        city: item.city,
        capacity: item.capacity,
        is_default: item.is_default,
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      setWarehouses(formatted);
      setPagination({
        current_page: res.pagination.current_page || 1,
        last_page: res.pagination.total_pages || 1,
        per_page: res.pagination.per_page || 10,
        total_items: res.pagination.total_items || 0
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch warehouses');
      setWarehouses([]);
      setPagination({ current_page: 1, last_page: 1, per_page: 10, total_items: 0 });
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWarehouses(1, pagination.per_page, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchWarehouses]);

  useEffect(() => {
    fetchWarehouses(1, 10);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page) return;
    fetchWarehouses(newPage, pagination.per_page, searchTerm);
  };

  const handleLimitChange = (newLimit) => {
    const limit = parseInt(newLimit);
    setPagination(prev => ({ ...prev, per_page: limit }));
    fetchWarehouses(1, limit, searchTerm);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      type: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      country: '',
      state: '',
      city: '',
      capacity: '',
      is_default: false,
      status: 'active'
    });
    setErrors({});
    setEditingWarehouse(null);
  };

  const openModal = (warehouse = null) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setFormData({
        name: warehouse.name || '',
        code: warehouse.code || '',
        type: warehouse.type || '',
        contact_person: warehouse.contact_person || '',
        phone: warehouse.phone || '',
        email: warehouse.email || '',
        address: warehouse.address || '',
        country: warehouse.country || '',
        state: warehouse.state || '',
        city: warehouse.city || '',
        capacity: warehouse.capacity || '',
        is_default: warehouse.is_default || false,
        status: warehouse.status || 'active'
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');
    setErrors({});

    try {
      const data = { ...formData };
      data.status = formData.status; // already 'active'/'inactive'
      data.is_default = formData.is_default ? 1 : 0;
      data.capacity = formData.capacity ? parseInt(formData.capacity) : null;

      let response;
      if (editingWarehouse) {
        response = await axios.put(`${API_URL}/${editingWarehouse.id}`, data);
      } else {
        response = await axios.post(API_URL, data);
      }

      showNotification(response.data.message || `Warehouse ${editingWarehouse ? 'updated' : 'created'} successfully!`);
      fetchWarehouses(pagination.current_page, pagination.per_page, searchTerm);
      closeModal();
    } catch (error) {
      handleApiError(error, 'Failed to save warehouse');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    setOperationLoading(`delete-${id}`);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Warehouse deleted successfully');
      const remaining = pagination.total_items - 1;
      const maxPage = Math.ceil(remaining / pagination.per_page);
      const targetPage = pagination.current_page > maxPage ? maxPage : pagination.current_page;
      fetchWarehouses(targetPage || 1, pagination.per_page, searchTerm);
    } catch (error) {
      handleApiError(error, 'Delete failed');
    } finally {
      setOperationLoading(null);
      setDeleteConfirm(null);
    }
  };

  const toggleStatus = async (warehouse) => {
    const newStatus = warehouse.status === 'active' ? 'inactive' : 'active';
    setOperationLoading(`status-${warehouse.id}`);
    try {
      await axios.put(`${API_URL}/${warehouse.id}`, { status: newStatus });
      showNotification(`Warehouse ${newStatus === 'active' ? 'activated' : 'deactivated'}!`);
      fetchWarehouses(pagination.current_page, pagination.per_page, searchTerm);
    } catch (error) {
      handleApiError(error, 'Status update failed');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  const stats = {
    total: pagination.total_items,
    active: warehouses.filter(w => w.status === 'active').length,
    inactive: warehouses.filter(w => w.status === 'inactive').length
  };

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

  useEffect(() => {
    const handler = () => setActionMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const filteredWarehouses = warehouses.filter(w =>
    statusFilter === 'all' || w.status === statusFilter
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 py-8">
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl ${notification.type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white font-medium flex items-center gap-2`}
          >
            <Check size={20} />
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
              Warehouse Management
            </h1>
            <p className="text-gray-400 mt-2">Manage your storage facilities and locations</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-700 hover:to-cyan-700 px-6 py-3 rounded-xl font-bold flex items-center gap-3 shadow-lg"
          >
            <Plus size={22} /> Add New Warehouse
          </button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Warehouses', value: stats.total, icon: WarehouseIcon, color: 'amber' },
            { label: 'Active', value: stats.active, icon: Activity, color: 'green' },
            { label: 'Inactive', value: stats.inactive, icon: Package, color: 'red' },
          ].map((s, i) => (
            <div key={i} className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{s.label}</p>
                  <p className="text-3xl font-bold mt-1">{s.value}</p>
                </div>
                <div className={`p-3 bg-${s.color}-500/10 rounded-xl`}>
                  <s.icon size={28} className={`text-${s.color}-400`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Controls */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/30">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, code or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-amber-500/50 outline-none"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2 bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3">
                <span className="text-sm text-gray-400">Show:</span>
                <select
                  value={pagination.per_page}
                  onChange={(e) => handleLimitChange(e.target.value)}
                  className="bg-transparent border-0 text-white text-sm focus:ring-0 focus:outline-none"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 backdrop-blur-sm min-w-[140px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700/30 bg-gray-800/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Warehouses List</h3>
              <span className="text-sm text-gray-400">
                {filteredWarehouses.length} warehouse{filteredWarehouses.length !== 1 ? 's' : ''} found
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-gray-700/30">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Warehouse</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <Loader size={32} className="animate-spin mx-auto text-amber-400" />
                      <p className="text-gray-400 mt-3">Loading warehouses...</p>
                    </td>
                  </tr>
                ) : filteredWarehouses.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <WarehouseIcon size={64} className="mx-auto text-gray-500 mb-4" />
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {warehouses.length === 0 ? 'No warehouses yet' : 'No matching warehouses'}
                      </h3>
                      <p className="text-gray-400 mb-6">
                        {warehouses.length === 0 ? "Create your first warehouse to get started." : "Try different search or filter."}
                      </p>
                      {warehouses.length === 0 && (
                        <button onClick={() => openModal()} className="bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-700 hover:to-cyan-700 px-8 py-3 rounded-xl font-bold flex items-center gap-2 mx-auto">
                          <Plus size={20} /> Create First Warehouse
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredWarehouses.map(warehouse => (
                    <tr key={warehouse.id} className="hover:bg-gray-700/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-500/10 rounded-lg">
                            <WarehouseIcon size={20} className="text-amber-400" />
                          </div>
                          <div>
                            <div className="font-semibold text-white">{warehouse.name}</div>
                            <div className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                              <Shield size={12} /> ID: #{warehouse.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{warehouse.code || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{warehouse.type || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2 max-w-xs">
                          <MapPin size={16} className="text-gray-400 mt-1 flex-shrink-0" />
                          <span className="text-sm line-clamp-2">{warehouse.address || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleStatus(warehouse)}
                          disabled={operationLoading === `status-${warehouse.id}`}
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                            warehouse.status === 'active'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {operationLoading === `status-${warehouse.id}` ? <Loader size={12} className="animate-spin" /> : null}
                          {warehouse.status === 'active' ? (
                            <>
                              <CheckCircle size={12} /> Active
                            </>
                          ) : (
                            <>
                              <XCircle size={12} /> Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openModal(warehouse)} className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => setDeleteConfirm(warehouse.id)} className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="px-6 py-4 border-t border-gray-700/30 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-400">
                Showing {(pagination.current_page - 1) * pagination.per_page + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total_items)} of {pagination.total_items}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="px-3 py-2 rounded-xl border border-gray-600 disabled:opacity-50 flex items-center gap-2"
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === pagination.last_page || Math.abs(p - pagination.current_page) <= 2)
                  .map(p => (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`px-4 py-2 rounded-xl border ${pagination.current_page === p ? 'bg-amber-600 border-amber-500' : 'border-gray-600'}`}
                    >
                      {p}
                    </button>
                  ))}
                <button
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="px-3 py-2 rounded-xl border border-gray-600 disabled:opacity-50 flex items-center gap-2"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-800 rounded-3xl p-8 max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  {editingWarehouse ? 'Edit Warehouse' : 'Create New Warehouse'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-700 rounded-lg"><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-amber-500/50 outline-none ${errors.name ? 'border-red-500' : 'border-gray-600/50'}`}
                      placeholder="Warehouse name"
                    />
                    {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name[0] || errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Code *</label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-amber-500/50 outline-none ${errors.code ? 'border-red-500' : 'border-gray-600/50'}`}
                      placeholder="Unique code"
                    />
                    {errors.code && <p className="text-red-400 text-sm mt-1">{errors.code[0] || errors.code}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Type</label>
                    <input
                      type="text"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-amber-500/50 outline-none border-gray-600/50"
                      placeholder="e.g., Main, Cold Storage"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Capacity</label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-amber-500/50 outline-none border-gray-600/50"
                      placeholder="Max capacity (optional)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-amber-500/50 outline-none border-gray-600/50"
                    placeholder="Full address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-amber-500/50 outline-none border-gray-600/50"
                      placeholder="Country"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-amber-500/50 outline-none border-gray-600/50"
                      placeholder="State/Province"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-amber-500/50 outline-none border-gray-600/50"
                      placeholder="City"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Contact Person</label>
                    <input
                      type="text"
                      name="contact_person"
                      value={formData.contact_person}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-amber-500/50 outline-none border-gray-600/50"
                      placeholder="Contact name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Phone / Email</label>
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-amber-500/50 outline-none border-gray-600/50"
                        placeholder="Phone"
                      />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-amber-500/50 outline-none border-gray-600/50"
                        placeholder="Email"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_default"
                      checked={formData.is_default}
                      onChange={handleChange}
                      className="w-5 h-5 rounded border-gray-600 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-sm font-medium">Set as Default Warehouse</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3">Status</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['active', 'inactive'].map(st => (
                      <label
                        key={st}
                        onClick={() => setFormData(prev => ({ ...prev, status: st }))}
                        className={`p-4 border-2 rounded-xl text-center cursor-pointer transition ${
                          formData.status === st
                            ? st === 'active'
                              ? 'border-green-500 bg-green-500/10'
                              : 'border-red-500 bg-red-500/10'
                            : 'border-gray-600'
                        }`}
                      >
                        {st === 'active' ? <CheckCircle size={20} className="mx-auto mb-2 text-green-400" /> : <XCircle size={20} className="mx-auto mb-2 text-red-400" />}
                        <span className="capitalize font-medium">{st}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl">Cancel</button>
                  <button
                    type="submit"
                    disabled={operationLoading === 'saving'}
                    className="px-6 py-3 bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-700 hover:to-cyan-700 rounded-xl font-bold flex items-center gap-2 disabled:opacity-70"
                  >
                    {operationLoading === 'saving' ? <Loader size={20} className="animate-spin" /> : <Check size={20} />}
                    {editingWarehouse ? 'Update' : 'Create'} Warehouse
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-800 rounded-3xl p-8 max-w-md w-full border border-gray-700"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                <Trash2 size={48} className="mx-auto text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Delete Warehouse</h3>
                <p className="text-gray-400 mb-6">This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl">Cancel</button>
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    disabled={operationLoading === `delete-${deleteConfirm}`}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {operationLoading === `delete-${deleteConfirm}` ? <Loader size={20} className="animate-spin" /> : <Trash2 size={20} />}
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WarehouseManagement;
