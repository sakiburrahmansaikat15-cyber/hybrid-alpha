import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Check,
  Eye, EyeOff, Package, Upload,
  ChevronLeft, ChevronRight, Loader, Barcode, AlertCircle
} from 'lucide-react';

const API_URL = '/api/serial-list'; // Correct endpoint

const SerialList = () => {
  const [serials, setSerials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSerial, setEditingSerial] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    stock_id: '',
    sku: '',
    barcode: '',
    color: '',
    notes: '',
    image: null,
    status: 'active'
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total_items: 0,
    total_pages: 1
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
    } else {
      showNotification(defaultMessage || 'Something went wrong', 'error');
    }
  }, [showNotification]);

  const fetchSerials = useCallback(async (page = 1, limit = 10, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await axios.get(API_URL, { params });
      const res = response.data;

      const serialData = res.pagination?.data || res.data || [];

      const mappedSerials = serialData.map(item => ({
        id: item.id,
        stock_id: item.stock_id,
        product_name: item.stock?.product?.name || 'N/A',
        vendor_name: item.stock?.vendor?.name || 'N/A',
        warehouse_name: item.stock?.warehouse?.name || 'N/A',
        sku: item.sku || '',
        color: item.color || '',
        barcode: item.barcode || '',
        notes: item.notes || '',
        image: item.image || null,
        status: item.status || 'active',
      }));

      setSerials(mappedSerials);
      setPagination({
        current_page: res.pagination?.current_page || res.current_page || 1,
        per_page: res.pagination?.per_page || res.per_page || 10,
        total_items: res.pagination?.total_items || res.total_items || 0,
        total_pages: res.pagination?.total_pages || res.total_pages || 1
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch serials');
      setSerials([]);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    fetchSerials(pagination.current_page, pagination.per_page, searchTerm);
  }, [fetchSerials, pagination.current_page, pagination.per_page, searchTerm]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.total_pages) return;
    fetchSerials(newPage, pagination.per_page, searchTerm);
  };

  const handleLimitChange = (newLimit) => {
    const limit = parseInt(newLimit);
    setPagination(prev => ({ ...prev, per_page: limit, current_page: 1 }));
    fetchSerials(1, limit, searchTerm);
  };

  const resetForm = () => {
    setFormData({
      stock_id: '',
      sku: '',
      barcode: '',
      color: '',
      notes: '',
      image: null,
      status: 'active'
    });
    setImagePreview(null);
    setEditingSerial(null);
    setErrors({});
  };

  const openModal = (serial = null) => {
    if (serial) {
      setEditingSerial(serial);
      setFormData({
        stock_id: serial.stock_id?.toString() || '',
        sku: serial.sku || '',
        barcode: serial.barcode || '',
        color: serial.color || '',
        notes: serial.notes || '',
        image: null,
        status: serial.status || 'active'
      });
      setImagePreview(serial.image ? `/${serial.image}` : null);
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, image: 'Only JPEG, PNG, WebP allowed' }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'Image must be less than 2MB' }));
      return;
    }

    setFormData(prev => ({ ...prev, image: file }));
    setImagePreview(URL.createObjectURL(file));
    if (errors.image) setErrors(prev => ({ ...prev, image: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');
    setErrors({});

    const submitData = new FormData();
    submitData.append('stock_id', formData.stock_id);
    submitData.append('sku', formData.sku.trim());
    if (formData.barcode) submitData.append('barcode', formData.barcode.trim());
    if (formData.color) submitData.append('color', formData.color.trim());
    if (formData.notes) submitData.append('notes', formData.notes.trim());
    submitData.append('status', formData.status);
    if (formData.image instanceof File) {
      submitData.append('image', formData.image);
    }

    try {
      let response;
      if (editingSerial) {
        response = await axios.post(`${API_URL}/${editingSerial.id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await axios.post(API_URL, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      showNotification(response.data.message || `Serial ${editingSerial ? 'updated' : 'created'} successfully!`);
      fetchSerials(pagination.current_page, pagination.per_page, searchTerm);
      closeModal();
    } catch (error) {
      handleApiError(error, 'Failed to save serial');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this serial permanently?')) return;
    setOperationLoading(`delete-${id}`);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Serial deleted successfully');
      fetchSerials(pagination.current_page, pagination.per_page, searchTerm);
    } catch (error) {
      handleApiError(error, 'Delete failed');
    } finally {
      setOperationLoading(null);
    }
  };

  const toggleStatus = async (serial) => {
    const newStatus = serial.status === 'active' ? 'inactive' : 'active';
    setOperationLoading(`status-${serial.id}`);
    try {
      const form = new FormData();
      form.append('status', newStatus);

      await axios.post(`${API_URL}/${serial.id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showNotification(`Serial ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchSerials(pagination.current_page, pagination.per_page, searchTerm);
    } catch (error) {
      handleApiError(error, 'Failed to update status');
    } finally {
      setOperationLoading(null);
    }
  };

  const stats = {
    total: pagination.total_items,
    active: serials.filter(s => s.status === 'active').length,
    inactive: serials.filter(s => s.status === 'inactive').length
  };

  const getImageUrl = (path) => path ? `/${path}` : null;

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
            } text-white font-medium flex items-center gap-2`}
          >
            {notification.type === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
              Serial List Management
            </h1>
            <p className="text-gray-400 mt-2">Manage individual product serials with SKU, color, barcode, notes, and image</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-6 py-3 rounded-xl font-bold flex items-center gap-3 shadow-lg"
          >
            <Plus size={22} /> Add New Serial
          </button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Serials', value: stats.total, icon: Package, color: 'blue' },
            { label: 'Active', value: stats.active, icon: Eye, color: 'green' },
            { label: 'Inactive', value: stats.inactive, icon: EyeOff, color: 'red' },
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

        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/30">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by SKU, color, barcode, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none"
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
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700/30 bg-gray-800/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Individual Serial Entries</h3>
              <span className="text-sm text-gray-400">{pagination.total_items} entries</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-gray-700/30">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Stock ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Product • Vendor • Warehouse</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Color</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Barcode</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Notes</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center">
                      <Loader size={32} className="animate-spin mx-auto text-blue-400" />
                      <p className="text-gray-400 mt-3">Loading serials...</p>
                    </td>
                  </tr>
                ) : serials.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-16 text-center">
                      <Package size={64} className="mx-auto text-gray-500 mb-4" />
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {searchTerm ? 'No serials found' : 'No serial entries yet'}
                      </h3>
                      <p className="text-gray-400 mb-6">
                        {searchTerm ? 'Try different search terms' : 'Add your first serial to get started'}
                      </p>
                      {!searchTerm && (
                        <button
                          onClick={() => openModal()}
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-3 rounded-xl font-bold flex items-center gap-2 mx-auto"
                        >
                          <Plus size={20} /> Add First Serial
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  serials
                    .filter(s => filterStatus === 'all' || s.status === filterStatus)
                    .map(serial => (
                      <tr key={serial.id} className="hover:bg-gray-700/20 transition-colors">
                        <td className="px-6 py-4">
                          {serial.image ? (
                            <img
                              src={getImageUrl(serial.image)}
                              alt={serial.sku}
                              className="w-16 h-16 object-cover rounded-lg shadow-md border border-gray-600"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                              <Package size={28} className="text-gray-500" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-blue-400">#{serial.stock_id}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{serial.product_name}</div>
                          <div className="text-sm text-gray-400">
                            {serial.vendor_name} • {serial.warehouse_name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {serial.sku ? (
                            <div className="flex items-center gap-2 font-mono text-sm">
                              <Barcode size={16} className="text-gray-400" />
                              <span className="text-blue-300 font-medium">{serial.sku}</span>
                            </div>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">{serial.color || '—'}</td>
                        <td className="px-6 py-4 text-sm font-mono">{serial.barcode || '—'}</td>
                        <td className="px-6 py-4 text-sm max-w-xs">
                          <div className="truncate" title={serial.notes}>
                            {serial.notes || '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleStatus(serial)}
                            disabled={operationLoading === `status-${serial.id}`}
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              serial.status === 'active'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {operationLoading === `status-${serial.id}` && <Loader size={12} className="animate-spin inline mr-1" />}
                            {serial.status}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openModal(serial)}
                              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(serial.id)}
                              className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition"
                            >
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

          {pagination.total_pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-700/30 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-400">
                Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{' '}
                {Math.min(pagination.current_page * pagination.per_page, pagination.total_items)} of {pagination.total_items} serials
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="px-3 py-2 rounded-xl border border-gray-600 disabled:opacity-50 flex items-center gap-2"
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                <button className="px-4 py-2 rounded-xl bg-blue-600">
                  {pagination.current_page}
                </button>
                <button
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.total_pages}
                  className="px-3 py-2 rounded-xl border border-gray-600 disabled:opacity-50 flex items-center gap-2"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal remains exactly as before */}
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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                  {editingSerial ? 'Edit Serial' : 'Add New Serial'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Stock ID *</label>
                    <input
                      type="number"
                      name="stock_id"
                      value={formData.stock_id}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Enter stock ID"
                    />
                    {errors.stock_id && <p className="text-red-400 text-sm mt-1">{errors.stock_id[0]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">SKU *</label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g., SAMSUNG-S21-001"
                    />
                    {errors.sku && <p className="text-red-400 text-sm mt-1">{errors.sku[0]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Barcode</label>
                    <input
                      type="text"
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Optional barcode"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Color</label>
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g., Phantom Black"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-2">Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows="4"
                      className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      placeholder="Any additional information..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-3">Status</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['active', 'inactive'].map(st => (
                        <label
                          key={st}
                          onClick={() => setFormData(prev => ({ ...prev, status: st }))}
                          className={`p-4 border-2 rounded-xl text-center cursor-pointer transition-all ${
                            formData.status === st
                              ? st === 'active'
                                ? 'border-green-500 bg-green-500/10'
                                : 'border-red-500 bg-red-500/10'
                              : 'border-gray-600'
                          }`}
                        >
                          {st === 'active' ? <Eye size={20} className="mx-auto mb-2 text-green-400" /> : <EyeOff size={20} className="mx-auto mb-2 text-red-400" />}
                          <span className="capitalize font-medium">{st}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-3">Serial Image</label>
                    <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-blue-500 cursor-pointer transition-colors">
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="serial-img-upload" />
                      <label htmlFor="serial-img-upload" className="cursor-pointer block">
                        <Upload size={36} className="mx-auto mb-3 text-gray-400" />
                        <p className="text-sm text-gray-400">Click to upload (Max 2MB)</p>
                      </label>
                    </div>

                    {imagePreview && (
                      <div className="mt-4 relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-40 h-40 object-cover rounded-lg border-2 border-gray-600 shadow-xl"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setFormData(prev => ({ ...prev, image: null }));
                          }}
                          className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-700 p-2 rounded-full transition"
                        >
                          <X size={16} className="text-white" />
                        </button>
                      </div>
                    )}

                    {errors.image && <p className="text-red-400 text-sm mt-2">{errors.image}</p>}
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-700/50">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={operationLoading === 'saving'}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl font-bold flex items-center gap-3 disabled:opacity-70 transition"
                  >
                    {operationLoading === 'saving' ? (
                      <Loader size={20} className="animate-spin" />
                    ) : (
                      <Check size={20} />
                    )}
                    {editingSerial ? 'Update Serial' : 'Create Serial'}
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

export default SerialList;
