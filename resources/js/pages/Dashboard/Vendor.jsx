import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Check,
  Store, Mail, Phone, MapPin, Upload, Shield,
  ChevronLeft, ChevronRight, Loader, AlertCircle
} from 'lucide-react';

const API_URL = 'http://localhost:8000/api/vendors';
const APP_URL = import.meta.env.VITE_APP_URL?.replace(/\/$/, '') || 'http://localhost:8000';

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    shop_name: '',
    email: '',
    contact: '',
    address: '',
    status: 'active',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);

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

  const handleApiError = useCallback((error, defaultMessage) => {
    console.error('API Error:', error);
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
    }
  }, [showNotification]);

  // Fixed: fetch with keyword + limit + page, no stale closure
  const fetchVendors = useCallback(async (page = 1, perPage = 10, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit: perPage };
      if (keyword.trim()) params.keyword = keyword.trim();

      const res = await axios.get(API_URL, { params });
      const data = res.data;

      setVendors(data.pagination?.data || []);
      setPagination({
        current_page: data.pagination?.current_page || 1,
        last_page: data.pagination?.total_pages || 1,
        per_page: data.pagination?.per_page || perPage,
        total: data.pagination?.total_items || 0
      });
      setErrors({});
    } catch (err) {
      handleApiError(err, 'Failed to fetch vendors');
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  // Debounced search + reacts to per_page change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVendors(1, pagination.per_page, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchVendors]);

  // Initial load
  useEffect(() => {
    fetchVendors(1, 10);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page) return;
    fetchVendors(newPage, pagination.per_page, searchTerm);
  };

  const handleLimitChange = (newLimit) => {
    const limit = parseInt(newLimit, 10);
    setPagination(prev => ({ ...prev, per_page: limit, current_page: 1 }));
    fetchVendors(1, limit, searchTerm);
  };

  const resetForm = () => {
    setFormData({
      name: '', shop_name: '', email: '', contact: '', address: '', status: 'active', image: null
    });
    setImagePreview(null);
    setEditingVendor(null);
    setErrors({});
  };

  const openModal = (vendor = null) => {
    if (vendor) {
      setEditingVendor(vendor);
      setFormData({
        name: vendor.name || '',
        shop_name: vendor.shop_name || '',
        email: vendor.email || '',
        contact: vendor.contact || '',
        address: vendor.address || '',
        status: vendor.status === 'active' ? 'active' : 'inactive',
        image: null
      });
      setImagePreview(vendor.image ? `${APP_URL}/${vendor.image}` : null);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(resetForm, 300);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, image: 'Only JPG, PNG, WebP allowed' }));
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

    const data = new FormData();
    data.append('name', formData.name.trim());
    data.append('shop_name', formData.shop_name.trim());
    data.append('email', formData.email.trim());
    data.append('contact', formData.contact.trim());
    data.append('address', formData.address.trim());
    data.append('status', formData.status);
    if (formData.image) data.append('image', formData.image);

    try {
      if (editingVendor) {
        await axios.post(`${API_URL}/${editingVendor.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showNotification('Vendor updated successfully!');
      } else {
        await axios.post(API_URL, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showNotification('Vendor created successfully!');
      }

      fetchVendors(pagination.current_page, pagination.per_page, searchTerm);
      closeModal();
    } catch (err) {
      handleApiError(err, 'Failed to save vendor');
    } finally {
      setOperationLoading(null);
    }
  };

  const toggleStatus = async (vendor) => {
    setOperationLoading(`status-${vendor.id}`);
    const newStatus = vendor.status === 'active' ? 'inactive' : 'active';

    const data = new FormData();
    data.append('status', newStatus);
    // Required fields must be sent even on status toggle
    data.append('name', vendor.name);
    data.append('shop_name', vendor.shop_name);
    data.append('email', vendor.email);
    data.append('contact', vendor.contact || '');
    data.append('address', vendor.address || '');

    try {
      await axios.post(`${API_URL}/${vendor.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showNotification(`Vendor ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchVendors(pagination.current_page, pagination.per_page, searchTerm);
    } catch (err) {
      handleApiError(err, 'Failed to update status');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    setOperationLoading(`delete-${id}`);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Vendor deleted successfully');
      if (vendors.length === 1 && pagination.current_page > 1) {
        fetchVendors(pagination.current_page - 1, pagination.per_page, searchTerm);
      } else {
        fetchVendors(pagination.current_page, pagination.per_page, searchTerm);
      }
    } catch (err) {
      handleApiError(err, 'Delete failed');
    } finally {
      setOperationLoading(null);
      setDeleteConfirm(null);
    }
  };

  const stats = useMemo(() => ({
    total: pagination.total,
    active: vendors.filter(v => v.status === 'active').length,
    inactive: vendors.filter(v => v.status === 'inactive').length
  }), [pagination.total, vendors]);

  if (loading && vendors.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-2xl text-gray-400 flex items-center gap-4">
          <Loader className="animate-spin" size={32} />
          Loading vendors...
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl text-white font-medium flex items-center gap-3 ${
              notification.type === 'error' ? 'bg-red-600' : 'bg-green-600'
            }`}
          >
            {notification.type === 'error' ? <AlertCircle size={22} /> : <Check size={22} />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">
                Vendor Management
              </h1>
              <p className="text-gray-400 mt-2">Manage all your vendors</p>
            </div>
            <button
              onClick={() => openModal()}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-3 shadow-lg"
            >
              <Plus size={22} /> Add Vendor
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700/40">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-400">Total</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <Store className="text-violet-400" size={40} />
              </div>
            </div>
            <div className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700/40">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-400">Active</p>
                  <p className="text-3xl font-bold text-green-400">{stats.active}</p>
                </div>
                <Check className="text-green-400" size={40} />
              </div>
            </div>
            <div className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700/40">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-400">Inactive</p>
                  <p className="text-3xl font-bold text-red-400">{stats.inactive}</p>
                </div>
                <X className="text-red-400" size={40} />
              </div>
            </div>
          </div>

          {/* Search + Limit */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search vendors by name or shop..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <select
              value={pagination.per_page}
              onChange={(e) => handleLimitChange(e.target.value)}
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="5">5 per page</option>
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-gray-800/30 rounded-2xl border border-gray-700/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr className="text-left text-sm font-medium text-gray-400">
                    <th className="px-6 py-4">Vendor</th>
                    <th className="px-6 py-4">Shop</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/20">
                  {vendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-gray-700/10 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {vendor.image ? (
                            <img
                              src={`${APP_URL}/${vendor.image}`}
                              alt={vendor.name}
                              className="w-12 h-12 rounded-lg object-cover border border-gray-600"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                              <Store size={20} className="text-gray-500" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold">{vendor.name}</div>
                            <div className="text-sm text-gray-400">ID: #{vendor.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>{vendor.shop_name}</div>
                        {vendor.address && <div className="text-sm text-gray-400 mt-1">{vendor.address}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>{vendor.email}</div>
                        {vendor.contact && <div className="text-gray-400">{vendor.contact}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleStatus(vendor)}
                          disabled={operationLoading === `status-${vendor.id}`}
                          className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 ${
                            vendor.status === 'active'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                              : 'bg-red-500/20 text-red-400 border border-red-500/40'
                          }`}
                        >
                          {operationLoading === `status-${vendor.id}` && <Loader size={14} className="animate-spin" />}
                          {vendor.status === 'active' ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openModal(vendor)} className="text-blue-400 hover:bg-blue-500/20 p-2 rounded">
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(vendor.id)}
                          className="text-red-400 hover:bg-red-500/20 p-2 rounded ml-2"
                          disabled={operationLoading === `delete-${vendor.id}`}
                        >
                          {operationLoading === `delete-${vendor.id}` ? <Loader size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className="flex justify-between items-center px-6 py-4 border-t border-gray-700/30">
                <div className="text-sm text-gray-400">
                  Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{' '}
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className="px-4 py-2 rounded-xl border border-gray-600 disabled:opacity-50 flex items-center gap-2"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
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
          </div>

          {/* Empty State */}
          {vendors.length === 0 && !loading && (
            <div className="text-center py-20">
              <Store size={80} className="mx-auto text-gray-600 mb-6" />
              <h3 className="text-2xl font-bold mb-3">
                {searchTerm ? 'No vendors found' : 'No vendors yet'}
              </h3>
              <p className="text-gray-400">
                {searchTerm ? 'Try searching with different keywords' : 'Start by adding your first vendor'}
              </p>
            </div>
          )}
        </div>

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={closeModal}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gray-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 p-8"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
                  </h2>
                  <button onClick={closeModal}><X size={28} className="text-gray-400" /></button>
                </div>

                {errors._general && (
                  <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-xl text-red-300">
                    {errors._general}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-3">Image</label>
                    <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-violet-500 cursor-pointer transition">
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="vendor-img" />
                      <label htmlFor="vendor-img" className="cursor-pointer">
                        <Upload className="mx-auto mb-3 text-gray-400" size={32} />
                        <span className="text-gray-400">Click to upload (Max 2MB)</span>
                      </label>
                    </div>
                    {imagePreview && (
                      <div className="mt-4 relative inline-block">
                        <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg border border-gray-600" />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setFormData(prev => ({ ...prev, image: null }));
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 p-1 rounded-full"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    {errors.image && <p className="text-red-400 text-sm mt-2">{errors.image}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        placeholder="Name *"
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                        className={`w-full px-4 py-3 bg-gray-700/50 border rounded-xl text-white ${errors.name ? 'border-red-500' : 'border-gray-600'}`}
                      />
                      {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name[0]}</p>}
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Shop Name *"
                        value={formData.shop_name}
                        onChange={e => setFormData(prev => ({ ...prev, shop_name: e.target.value }))}
                        required
                        className={`w-full px-4 py-3 bg-gray-700/50 border rounded-xl text-white ${errors.shop_name ? 'border-red-500' : 'border-gray-600'}`}
                      />
                      {errors.shop_name && <p className="text-red-400 text-xs mt-1">{errors.shop_name[0]}</p>}
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Email *"
                        value={formData.email}
                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        className={`w-full px-4 py-3 bg-gray-700/50 border rounded-xl text-white ${errors.email ? 'border-red-500' : 'border-gray-600'}`}
                      />
                      {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email[0]}</p>}
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Contact"
                        value={formData.contact}
                        onChange={e => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <textarea
                        placeholder="Address"
                        value={formData.address}
                        onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-6">
                    {['active', 'inactive'].map(st => (
                      <label
                        key={st}
                        onClick={() => setFormData(prev => ({ ...prev, status: st }))}
                        className={`flex-1 p-4 rounded-xl border-2 cursor-pointer text-center transition ${
                          formData.status === st
                            ? st === 'active'
                              ? 'border-green-500 bg-green-500/10'
                              : 'border-red-500 bg-red-500/10'
                            : 'border-gray-600'
                        }`}
                      >
                        <span className={`font-medium ${st === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                          {st.charAt(0).toUpperCase() + st.slice(1)}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="flex justify-end gap-4">
                    <button type="button" onClick={closeModal} className="px-6 py-3 bg-gray-700 rounded-xl">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={operationLoading === 'saving'}
                      className="px-8 py-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl text-white font-bold flex items-center gap-2"
                    >
                      {operationLoading === 'saving' ? <Loader size={20} className="animate-spin" /> : <Check size={20} />}
                      {editingVendor ? 'Update' : 'Create'} Vendor
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Confirm */}
        <AnimatePresence>
          {deleteConfirm && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setDeleteConfirm(null)}>
              <div className="bg-gray-800 rounded-2xl p-8 max-w-sm border border-gray-700">
                <h3 className="text-xl font-bold mb-4">Delete Vendor?</h3>
                <p className="text-gray-400 mb-6">This action cannot be undone.</p>
                <div className="flex gap-4">
                  <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 bg-gray-700 rounded-xl">
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    className="flex-1 py-3 bg-red-600 rounded-xl text-white font-bold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default VendorManagement;