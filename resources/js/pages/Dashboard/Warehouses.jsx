import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Warehouse as WarehouseIcon,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  X,
  Check,
  MoreVertical,
  Calendar,
  Shield,
  Package,
  Activity
} from 'lucide-react';

const WarehouseManagement = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    note: '',
    status: true
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // API base URL - adjust according to your backend
  const API_BASE = '/api/warehouses';

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    setLoading(true);
    setApiError('');
    try {
      const response = await fetch(API_BASE);

      if (!response.ok) {
        throw new Error(`Failed to fetch warehouses: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setWarehouses(result.data.data || result.data || []);
      } else {
        throw new Error(result.message || 'Failed to fetch warehouses');
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      setApiError(error.message);
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setApiError('');

    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSubmitting(false);
      return;
    }

    try {
      const url = editingWarehouse ? `${API_BASE}/${editingWarehouse.id}` : API_BASE;
      const method = editingWarehouse ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          ...formData,
          status: formData.status ? 1 : 0 // Convert to 1/0 for API
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${editingWarehouse ? 'update' : 'create'} warehouse`);
      }

      const result = await response.json();

      if (result.success) {
        await fetchWarehouses(); // Refresh the list
        setShowModal(false);
        resetForm();
        showNotification(
          `Warehouse ${editingWarehouse ? 'updated' : 'created'} successfully!`,
          'success'
        );
      } else {
        throw new Error(result.message || `Failed to ${editingWarehouse ? 'update' : 'create'} warehouse`);
      }
    } catch (error) {
      console.error('Error saving warehouse:', error);
      setApiError(error.message);
      showNotification(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      address: warehouse.address,
      note: warehouse.note || '',
      status: warehouse.status
    });
    setShowModal(true);
    setApiError('');
    setActionMenu(null);
  };

  const handleDelete = async (id) => {
    setSubmitting(true);
    setApiError('');

    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete warehouse');
      }

      const result = await response.json();

      if (result.success) {
        await fetchWarehouses(); // Refresh the list
        setDeleteConfirm(null);
        showNotification('Warehouse deleted successfully!', 'success');
      } else {
        throw new Error(result.message || 'Failed to delete warehouse');
      }
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      setApiError(error.message);
      showNotification(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (warehouse) => {
    const newStatus = !warehouse.status;

    try {
      const response = await fetch(`${API_BASE}/${warehouse.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          ...warehouse,
          status: newStatus ? 1 : 0
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update warehouse status');
      }

      const result = await response.json();

      if (result.success) {
        await fetchWarehouses();
        showNotification(`Warehouse ${newStatus ? 'activated' : 'deactivated'}!`, 'success');
      } else {
        throw new Error(result.message || 'Failed to update warehouse status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification(error.message, 'error');
    }
    setActionMenu(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      note: '',
      status: true
    });
    setErrors({});
    setEditingWarehouse(null);
    setApiError('');
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActionMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Filter and sort warehouses
  const filteredWarehouses = warehouses
    .filter(warehouse => {
      const matchesSearch = warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          warehouse.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (warehouse.note && warehouse.note.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' ||
                           (statusFilter === 'active' && warehouse.status) ||
                           (statusFilter === 'inactive' && !warehouse.status);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'created_at' || sortBy === 'updated_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const totalPages = Math.ceil(filteredWarehouses.length / perPage);
  const paginatedWarehouses = filteredWarehouses.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <ChevronDown className="w-4 h-4 opacity-50" />;
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  // Statistics
  const stats = {
    total: warehouses.length,
    active: warehouses.filter(warehouse => warehouse.status).length,
    inactive: warehouses.filter(warehouse => !warehouse.status).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 py-8">
      {/* Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className={`fixed top-4 right-4 z-50 max-w-sm ${
              notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
            } text-white px-6 py-3 rounded-xl shadow-2xl backdrop-blur-sm`}
          >
            <div className="flex items-center gap-3">
              <Check size={20} />
              <span className="font-medium">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Warehouse Management
              </h1>
              <p className="text-gray-400 mt-2 text-lg">
                Manage your storage facilities and inventory locations
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-amber-500/25 flex items-center gap-3"
            >
              <Plus size={22} />
              Add New Warehouse
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40 hover:border-amber-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Warehouses</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-xl">
                <WarehouseIcon size={24} className="text-amber-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40 hover:border-amber-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Active Warehouses</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-xl">
                <Activity size={24} className="text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40 hover:border-amber-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Inactive Warehouses</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.inactive}</p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-xl">
                <Package size={24} className="text-red-400" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search and Controls */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/30"
        >
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search warehouses by name, address, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent backdrop-blur-sm transition-all duration-200"
              />
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2 bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent border-0 text-white text-sm focus:ring-0 focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3">
                <span className="text-sm text-gray-400">Show:</span>
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-transparent border-0 text-white text-sm focus:ring-0 focus:outline-none"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {apiError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 bg-red-900/50 border border-red-700 rounded-xl p-4 backdrop-blur-sm"
            >
              <div className="flex items-center">
                <AlertCircle size={20} className="text-red-400 mr-3" />
                <span className="text-red-200 text-sm">{apiError}</span>
                <button
                  onClick={() => setApiError('')}
                  className="ml-auto text-red-400 hover:text-red-300 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Warehouse Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 overflow-hidden mb-8"
        >
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-700/30 bg-gray-800/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Warehouses List</h3>
              <span className="text-sm text-gray-400">
                {filteredWarehouses.length} {filteredWarehouses.length === 1 ? 'warehouse' : 'warehouses'} found
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/30">
                  <th
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700/10 transition-colors duration-200"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      <span>Warehouse</span>
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Notes
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700/10 transition-colors duration-200"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      <span>Status</span>
                      <SortIcon field="status" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                      </div>
                      <p className="text-gray-400 mt-3">Loading warehouses...</p>
                    </td>
                  </tr>
                ) : paginatedWarehouses.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <div className="max-w-md mx-auto">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gray-800/40 rounded-full flex items-center justify-center border border-gray-700/40">
                          <WarehouseIcon size={48} className="text-gray-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">
                          {warehouses.length === 0 ? 'No warehouses yet' : 'No warehouses found'}
                        </h3>
                        <p className="text-gray-400 text-lg mb-8">
                          {warehouses.length === 0
                            ? "Get started by creating your first warehouse."
                            : "Try adjusting your search or filter criteria."
                          }
                        </p>
                        {warehouses.length === 0 && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowModal(true)}
                            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-amber-500/25 flex items-center gap-3 mx-auto"
                          >
                            <Plus size={20} />
                            Create Your First Warehouse
                          </motion.button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedWarehouses.map((warehouse) => (
                    <motion.tr
                      key={warehouse.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-700/10 transition-colors duration-200 group"
                    >
                      {/* Warehouse Name */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-500/10 rounded-lg">
                            <WarehouseIcon size={20} className="text-amber-400" />
                          </div>
                          <div>
                            <div className="font-semibold text-white group-hover:text-amber-100 transition-colors">
                              {warehouse.name}
                            </div>
                            <div className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                              <Shield size={12} />
                              ID: #{warehouse.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Address */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2 max-w-xs">
                          <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm line-clamp-2">{warehouse.address}</span>
                        </div>
                      </td>

                      {/* Notes */}
                      <td className="px-6 py-4">
                        {warehouse.note ? (
                          <div className="flex items-start gap-2 max-w-xs">
                            <FileText size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm line-clamp-2">{warehouse.note}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleStatus(warehouse)}
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                            warehouse.status
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                          }`}
                        >
                          {warehouse.status ? (
                            <>
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              Active
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                              Inactive
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Quick Actions */}
                          <div className="hidden lg:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEdit(warehouse)}
                              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all duration-200"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setDeleteConfirm(warehouse.id)}
                              className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all duration-200"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </motion.button>
                          </div>

                          {/* Mobile Action Menu */}
                          <div className="lg:hidden relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionMenu(actionMenu === warehouse.id ? null : warehouse.id);
                              }}
                              className="p-2 hover:bg-gray-600/50 rounded-lg transition-colors duration-200"
                            >
                              <MoreVertical size={18} />
                            </button>

                            <AnimatePresence>
                              {actionMenu === warehouse.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className="absolute right-0 top-10 z-10 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl min-w-[160px] py-2 backdrop-blur-sm"
                                >
                                  <button
                                    onClick={() => handleEdit(warehouse)}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 transition-colors duration-200"
                                  >
                                    <Edit size={16} />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => toggleStatus(warehouse)}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 transition-colors duration-200"
                                  >
                                    {warehouse.status ? <XCircle size={16} /> : <CheckCircle size={16} />}
                                    {warehouse.status ? 'Deactivate' : 'Activate'}
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(warehouse.id)}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors duration-200"
                                  >
                                    <Trash2 size={16} />
                                    Delete
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-700/30 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-400">
                Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, filteredWarehouses.length)} of {filteredWarehouses.length} entries
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg border transition-all duration-200 ${
                    currentPage === 1
                      ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500'
                  }`}
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page =>
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 2
                  )
                  .map((page, index, array) => {
                    const showEllipsis = index > 0 && page - array[index - 1] > 1;
                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && (
                          <span className="px-2 text-gray-400">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-lg border transition-all duration-200 ${
                            currentPage === page
                              ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-500/25'
                              : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg border transition-all duration-200 ${
                    currentPage === totalPages
                      ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500'
                  }`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-700/50 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                    {editingWarehouse ? 'Edit Warehouse' : 'Create New Warehouse'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-gray-700/50"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Warehouse Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className={`w-full px-4 py-3 bg-gray-700/50 border rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-white placeholder-gray-400 transition-all duration-200 backdrop-blur-sm ${
                        errors.name ? 'border-red-500' : 'border-gray-600/50'
                      }`}
                      placeholder="Enter warehouse name"
                    />
                    {errors.name && (
                      <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                        <AlertCircle size={16} />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Address *
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      rows={3}
                      className={`w-full px-4 py-3 bg-gray-700/50 border rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-white placeholder-gray-400 transition-all duration-200 backdrop-blur-sm ${
                        errors.address ? 'border-red-500' : 'border-gray-600/50'
                      }`}
                      placeholder="Enter warehouse address"
                    />
                    {errors.address && (
                      <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                        <AlertCircle size={16} />
                        {errors.address}
                      </p>
                    )}
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Notes
                    </label>
                    <textarea
                      value={formData.note}
                      onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                      rows={2}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-white placeholder-gray-400 transition-all duration-200 backdrop-blur-sm"
                      placeholder="Additional notes (optional)"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Status
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className={`relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        formData.status
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                      }`}>
                        <input
                          type="radio"
                          name="status"
                          value="true"
                          checked={formData.status}
                          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value === 'true' }))}
                          className="sr-only"
                        />
                        <div className="text-center">
                          <CheckCircle size={20} className={`mx-auto mb-2 ${
                            formData.status ? 'text-green-400' : 'text-gray-400'
                          }`} />
                          <span className={`font-medium ${
                            formData.status ? 'text-green-400' : 'text-gray-400'
                          }`}>
                            Active
                          </span>
                        </div>
                      </label>

                      <label className={`relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        !formData.status
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                      }`}>
                        <input
                          type="radio"
                          name="status"
                          value="false"
                          checked={!formData.status}
                          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value === 'true' }))}
                          className="sr-only"
                        />
                        <div className="text-center">
                          <XCircle size={20} className={`mx-auto mb-2 ${
                            !formData.status ? 'text-red-400' : 'text-gray-400'
                          }`} />
                          <span className={`font-medium ${
                            !formData.status ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            Inactive
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-700/50">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setShowModal(false)}
                      disabled={submitting}
                      className="px-6 py-3 text-sm font-medium text-gray-300 hover:text-white transition-colors bg-gray-700/50 hover:bg-gray-600/50 rounded-xl border border-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={submitting}
                      className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          {editingWarehouse ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        <>
                          <Check size={20} />
                          {editingWarehouse ? 'Update Warehouse' : 'Create Warehouse'}
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl max-w-sm w-full p-6 border border-gray-700/50 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
                  <Trash2 size={32} className="text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Delete Warehouse</h3>
                <p className="text-gray-400 mb-6">
                  Are you sure you want to delete this warehouse? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 text-sm font-medium text-gray-300 hover:text-white transition-colors bg-gray-700/50 hover:bg-gray-600/50 rounded-xl border border-gray-600/50"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Trash2 size={16} />
                  )}
                  {submitting ? 'Deleting...' : 'Delete'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WarehouseManagement;
