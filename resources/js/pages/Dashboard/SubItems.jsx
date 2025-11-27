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
  Eye,
  EyeOff,
  Image as ImageIcon,
  Package,
  Calendar,
  Upload,
  ChevronLeft,
  ChevronRight,
  Loader
} from 'lucide-react';

const API_URL = '/api/sub-items';

const SubItemsManager = () => {
  const [subItems, setSubItems] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    sub_category_id: '',
    name: '',
    status: 'active',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

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

  const fetchSubItems = useCallback(async (page = 1, limit = pagination.per_page) => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL, { params: { page, limit } });
      const res = response.data;
      setSubItems(res.data || []);
      setPagination({
        current_page: res.page || 1,
        last_page: res.totalPages || 1,
        per_page: res.perPage || 10,
        total: res.totalItems || 0
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch sub-items');
      setSubItems([]);
    } finally {
      setLoading(false);
    }
  }, [handleApiError, pagination.per_page]);

  const searchSubItems = useCallback(async (keyword) => {
    if (!keyword.trim()) {
      fetchSubItems(pagination.current_page, pagination.per_page);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/search`, { params: { keyword } });
      setSubItems(response.data.data || []);
      setPagination({
        current_page: 1,
        last_page: 1,
        per_page: response.data.data?.length || 0,
        total: response.data.data?.length || 0
      });
    } catch (error) {
      handleApiError(error, 'Search failed');
      setSubItems([]);
    } finally {
      setLoading(false);
    }
  }, [fetchSubItems]);

  useEffect(() => {
    const timer = setTimeout(() => searchSubItems(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, searchSubItems]);

  const fetchSubCategories = async () => {
    try {
      const response = await axios.get('/api/sub-categories');
      setSubCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching sub-categories:', error);
    }
  };

  useEffect(() => {
    fetchSubItems(1, 10);
    fetchSubCategories();
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page || searchTerm) return;
    fetchSubItems(newPage, pagination.per_page);
  };

  const handleLimitChange = (newLimit) => {
    const limit = parseInt(newLimit);
    setPagination(prev => ({ ...prev, per_page: limit, current_page: 1 }));
    fetchSubItems(1, limit);
  };

  const resetForm = () => {
    setFormData({ sub_category_id: '', name: '', status: 'active', image: null });
    setImagePreview(null);
    setEditingItem(null);
    setErrors({});
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        sub_category_id: item.sub_category_id ? String(item.sub_category_id) : '',
        name: item.name || '',
        status: item.status === 'active' || item.status === true ? 'active' : 'inactive',
        image: null
      });
      setImagePreview(item.image ? `/${item.image}` : null);
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
      setErrors(prev => ({ ...prev, image: 'Image must be < 2MB' }));
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

    try {
      const submitData = new FormData();
      const catId = formData.sub_category_id ? parseInt(formData.sub_category_id, 10) : null;
      submitData.append('sub_category_id', catId ?? '');
      submitData.append('name', formData.name.trim());
      submitData.append('status', formData.status === 'active' ? 'active' : 'inactive');

      if (formData.image instanceof File) {
        submitData.append('image', formData.image);
      }

      let response;
      if (editingItem) {
        submitData.append('_method', 'POST');
        response = await axios.post(`${API_URL}/${editingItem.id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await axios.post(API_URL, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      showNotification(editingItem ? 'Updated successfully!' : 'Created successfully!');
      searchTerm ? searchSubItems(searchTerm) : fetchSubItems(pagination.current_page, pagination.per_page);
      closeModal();
    } catch (error) {
      handleApiError(error, 'Failed to save sub-item');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this sub-item permanently?')) return;
    setOperationLoading(`delete-${id}`);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Sub-item deleted successfully');
      if (subItems.length === 1 && pagination.current_page > 1) {
        fetchSubItems(pagination.current_page - 1, pagination.per_page);
      } else {
        searchTerm ? searchSubItems(searchTerm) : fetchSubItems(pagination.current_page, pagination.per_page);
      }
    } catch (error) {
      handleApiError(error, 'Delete failed');
    } finally {
      setOperationLoading(null);
    }
  };

  const toggleStatus = async (item) => {
    const newStatus = (item.status === 'active' || item.status === true) ? 'inactive' : 'active';
    setOperationLoading(`status-${item.id}`);
    try {
      const form = new FormData();
      form.append('status', newStatus);
      form.append('name', item.name);
      form.append('sub_category_id', item.sub_category_id || '');
      form.append('_method', 'POST');

      await axios.post(`${API_URL}/${item.id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showNotification(`Sub-item ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      searchTerm ? searchSubItems(searchTerm) : fetchSubItems(pagination.current_page, pagination.per_page);
    } catch (error) {
      handleApiError(error, 'Failed to update status');
    } finally {
      setOperationLoading(null);
    }
  };

  const getImageUrl = (path) => path ? `/${path}` : null;

  // Format date beautifully
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = {
    total: pagination.total,
    active: subItems.filter(i => i.status === 'active' || i.status === true).length,
    inactive: subItems.filter(i => i.status === 'inactive' || i.status === false).length
  };

  if (loading && subItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex justify-between">
            <div className="h-10 bg-gray-800 rounded w-64 animate-pulse"></div>
            <div className="h-12 bg-gray-800 rounded-xl w-40 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-800/40 rounded-2xl p-6 animate-pulse">
                <div className="h-12 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-800/30 rounded-2xl p-6 animate-pulse space-y-4">
                <div className="h-48 bg-gray-700/50 rounded-lg"></div>
                <div className="h-8 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl ${notification.type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white font-medium`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Sub Items Manager
              </h1>
              <p className="text-gray-400 mt-2">Manage your sub-items with ease and precision</p>
            </div>
            <button
              onClick={() => openModal()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 rounded-xl font-bold flex items-center gap-3 shadow-lg"
            >
              <Plus size={22} /> Add Sub Item
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Items</p>
                  <p className="text-3xl font-bold mt-1">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Package size={28} className="text-blue-400" />
                </div>
              </div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Active</p>
                  <p className="text-3xl font-bold mt-1">{stats.active}</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <Eye size={28} className="text-green-400" />
                </div>
              </div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Inactive</p>
                  <p className="text-3xl font-bold mt-1">{stats.inactive}</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-xl">
                  <EyeOff size={28} className="text-red-400" />
                </div>
              </div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Categories</p>
                  <p className="text-3xl font-bold mt-1">{subCategories.length}</p>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <Package size={28} className="text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/30">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name or category..."
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
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Sub Items Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { staggerChildren: 0.1 } }}
            className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 mb-8"
          >
            {subItems.map(item => {
              const categoryName = item.sub_category_id
                ? subCategories.find(cat => cat.id === item.sub_category_id)?.name || 'Uncategorized'
                : 'Uncategorized';

              return (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group bg-gray-800/30 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700/30 hover:border-blue-500/50 transition-all"
                >
                  <div className="relative h-48 bg-gradient-to-br from-gray-700 to-gray-800">
                    {item.image ? (
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={48} className="text-gray-500" />
                      </div>
                    )}

                    <div className="absolute top-4 right-4">
                      <button
                        onClick={() => toggleStatus(item)}
                        disabled={operationLoading === `status-${item.id}`}
                        className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border transition-all ${
                          (item.status === 'active' || item.status === true)
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}
                      >
                        {operationLoading === `status-${item.id}` ? <Loader size={12} className="animate-spin" /> : null}
                        {(item.status === 'active' || item.status === true) ? 'Active' : 'Inactive'}
                      </button>
                    </div>

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                      <button onClick={() => openModal(item)} className="p-3 bg-blue-500 hover:bg-blue-600 rounded-xl"><Edit size={18} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-3 bg-red-500 hover:bg-red-600 rounded-xl"><Trash2 size={18} /></button>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-lg mb-2 line-clamp-1">{item.name || 'Unnamed'}</h3>
                    <p className="text-sm text-gray-400 mb-3">
                      <span className="bg-gray-700/50 px-2 py-1 rounded-lg text-xs">
                        {categoryName}
                      </span>
                    </p>

                    {/* Created Date instead of ID */}
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700/30">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar size={14} />
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openModal(item)} className="p-2 bg-blue-500/20 hover:bg-blue-500/40 rounded-lg"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Pagination */}
          {!searchTerm && pagination.last_page > 1 && (
            <div className="flex justify-between items-center py-6 border-t border-gray-700/30">
              <div className="text-sm text-gray-400">
                Showing {(pagination.current_page - 1) * pagination.per_page + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handlePageChange(pagination.current_page - 1)} disabled={pagination.current_page === 1} className="px-4 py-2 rounded-xl border border-gray-600 disabled:opacity-50 flex items-center gap-2">
                  Previous
                </button>
                {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === pagination.last_page || Math.abs(p - pagination.current_page) <= 2)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && p - arr[idx - 1] > 1 && <span className="px-3">...</span>}
                      <button onClick={() => handlePageChange(p)} className={`px-4 py-2 rounded-xl border ${pagination.current_page === p ? 'bg-blue-600 border-blue-500' : 'border-gray-600'}`}>
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
                <button onClick={() => handlePageChange(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page} className="px-4 py-2 rounded-xl border border-gray-600 disabled:opacity-50 flex items-center gap-2">
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {subItems.length === 0 && !loading && (
            <div className="text-center py-20">
              <Package size={64} className="mx-auto text-gray-600 mb-6" />
              <h3 className="text-2xl font-bold mb-3">{searchTerm ? 'No sub-items found' : 'No sub-items yet'}</h3>
              <p className="text-gray-400 mb-8">{searchTerm ? 'Try different keywords' : 'Create your first sub-item'}</p>
              {!searchTerm && (
                <button onClick={() => openModal()} className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 rounded-xl font-bold">
                  Create First Sub Item
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 max-w-md w-full border border-gray-700/50 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    {editingItem ? 'Edit Sub Item' : 'Create Sub Item'}
                  </h2>
                  <button onClick={closeModal} className="p-2 hover:bg-gray-700 rounded-lg"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-3">Sub Category *</label>
                    <select
                      name="sub_category_id"
                      value={formData.sub_category_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white"
                    >
                      <option value="">Select category (optional)</option>
                      {subCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    {errors.sub_category_id && <p className="text-red-400 text-sm mt-1">{errors.sub_category_id[0]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-3">Item Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Enter sub-item name"
                    />
                    {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name[0]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-3">Item Image</label>
                    <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-blue-500 cursor-pointer">
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="subitem-img" />
                      <label htmlFor="subitem-img" className="cursor-pointer">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" className="mx-auto h-32 object-cover rounded-lg" />
                        ) : (
                          <>
                            <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-400">Click to upload (Max 2MB)</p>
                          </>
                        )}
                      </label>
                    </div>
                    {errors.image && <p className="text-red-400 text-sm mt-2">{errors.image}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-3">Status</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['active', 'inactive'].map(st => (
                        <label
                          key={st}
                          onClick={() => setFormData(prev => ({ ...prev, status: st }))}
                          className={`p-4 border-2 rounded-xl text-center cursor-pointer transition ${formData.status === st ? (st === 'active' ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10') : 'border-gray-600'}`}
                        >
                          {st === 'active' ? <Eye size={20} className="mx-auto mb-2" /> : <EyeOff size={20} className="mx-auto mb-2" />}
                          <span className="capitalize font-medium">{st}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={closeModal} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl">Cancel</button>
                    <button type="submit" disabled={operationLoading === 'saving'} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold flex items-center gap-2 disabled:opacity-70">
                      {operationLoading === 'saving' ? <Loader size={20} className="animate-spin" /> : <Check size={20} />}
                      {editingItem ? 'Update' : 'Create'} Sub Item
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default SubItemsManager;