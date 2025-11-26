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
  MoreVertical,
  Folder,
  Image as ImageIcon,
  Upload,
  Shield,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader,
  Layers
} from 'lucide-react';

const API_URL = '/api/sub-categories';

const SubCategories = () => {
  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMenu, setActionMenu] = useState(null);
  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    image: null,
    status: 'active'
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

  // Fetch sub-categories
  const fetchSubCategories = useCallback(async (page = 1, perPage = pagination.per_page) => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL, {
        params: { page, limit: perPage }
      });

      const res = response.data;
      setSubCategories(res.data || []);
      setPagination({
        current_page: res.page || res.current_page || 1,
        last_page: res.totalPages || res.last_page || 1,
        per_page: res.perPage || res.per_page || perPage,
        total: res.totalItems || res.total || 0
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch sub-categories');
      setSubCategories([]);
    } finally {
      setLoading(false);
    }
  }, [handleApiError, pagination.per_page]);

  // Fetch parent categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get('/api/categories');
      const data = response.data;
      setCategories(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  // Search sub-categories
  const searchSubCategories = useCallback(async (keyword) => {
    if (!keyword.trim()) {
      fetchSubCategories(pagination.current_page, pagination.per_page);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/search`, {
        params: { keyword }
      });

      const items = response.data.data || [];
      setSubCategories(items);
      setPagination({
        current_page: 1,
        last_page: 1,
        per_page: items.length,
        total: items.length
      });
    } catch (error) {
      handleApiError(error, 'Search failed');
      setSubCategories([]);
    } finally {
      setLoading(false);
    }
  }, [fetchSubCategories, handleApiError, pagination.current_page, pagination.per_page]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchSubCategories(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, searchSubCategories]);

  // Initial load
  useEffect(() => {
    fetchSubCategories(1, 10);
    fetchCategories();
  }, []);

  // Pagination
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page || searchTerm) return;
    fetchSubCategories(newPage, pagination.per_page);
  };

  const handleLimitChange = (newLimit) => {
    const limit = parseInt(newLimit);
    setPagination(prev => ({ ...prev, per_page: limit, current_page: 1 }));
    fetchSubCategories(1, limit);
  };

  // Form handlers
  const resetForm = () => {
    setFormData({ category_id: '', name: '', image: null, status: 'active' });
    setImagePreview(null);
    setEditingSubCategory(null);
    setErrors({});
  };

  const openModal = (subCat = null) => {
    if (subCat) {
      setEditingSubCategory(subCat);
      setFormData({
        category_id: subCat.category_id?.toString() || '',
        name: subCat.name || '',
        status: subCat.status || 'active',
        image: null
      });
      setImagePreview(subCat.image ? `/${subCat.image}` : null);
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
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
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
    if (errors.image) setErrors(prev => ({ ...prev, image: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');
    setErrors({});

    try {
      const submitData = new FormData();
      submitData.append('category_id', formData.category_id);
      submitData.append('name', formData.name.trim());
      submitData.append('status', formData.status);
      if (formData.image instanceof File) {
        submitData.append('image', formData.image);
      }

      let response;
      if (editingSubCategory) {
        submitData.append('_method', 'POST');
        response = await axios.post(`${API_URL}/${editingSubCategory.id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await axios.post(API_URL, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      showNotification(response.data.message || `Sub-category ${editingSubCategory ? 'updated' : 'created'} successfully!`);
      searchTerm ? searchSubCategories(searchTerm) : fetchSubCategories(pagination.current_page, pagination.per_page);
      closeModal();
    } catch (error) {
      handleApiError(error, 'Failed to save sub-category');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this sub-category permanently?')) return;
    setOperationLoading(`delete-${id}`);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Sub-category deleted successfully');
      if (subCategories.length === 1 && pagination.current_page > 1) {
        fetchSubCategories(pagination.current_page - 1, pagination.per_page);
      } else {
        searchTerm ? searchSubCategories(searchTerm) : fetchSubCategories(pagination.current_page, pagination.per_page);
      }
    } catch (error) {
      handleApiError(error, 'Delete failed');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  const toggleStatus = async (subCat) => {
    const newStatus = subCat.status === 'active' ? 'inactive' : 'active';
    setOperationLoading(`status-${subCat.id}`);
    try {
      const form = new FormData();
      form.append('status', newStatus);
      form.append('name', subCat.name);
      form.append('category_id', subCat.category_id);
      form.append('_method', 'POST');

      await axios.post(`${API_URL}/${subCat.id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showNotification(`Sub-category ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      searchTerm ? searchSubCategories(searchTerm) : fetchSubCategories(pagination.current_page, pagination.per_page);
    } catch (error) {
      handleApiError(error, 'Failed to update status');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  const stats = {
    total: pagination.total,
    active: subCategories.filter(b => b.status === 'active').length,
    inactive: subCategories.filter(b => b.status === 'inactive').length
  };

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
  const getImageUrl = (path) => path ? `/${path}` : null;

  useEffect(() => {
    const handler = () => setActionMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  if (loading && subCategories.length === 0) {
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
                <div className="h-32 bg-gray-700/50 rounded-lg"></div>
                <div className="h-8 bg-gray-700 rounded"></div>
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
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl ${notification.type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white font-medium`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
              Sub-Categories Management
            </h1>
            <p className="text-gray-400 mt-2">Manage product sub-categories and their information</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 px-6 py-3 rounded-xl font-bold flex items-center gap-3 shadow-lg"
          >
            <Plus size={22} /> Add New Sub-Category
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Sub-Categories', value: stats.total, icon: Layers, color: 'teal' },
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

        {/* Search + Filters */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/30">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search sub-categories by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-teal-500/50 outline-none"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2 bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3">
                <span className="text-sm text-gray-400">Show:</span>
                <select
                  value={pagination.per_page}
                  onChange={(e) => handleLimitChange(e.target.value)}
                  className="bg-transparent border-0 text-white text-sm focus:ring-0 focus:outline-none"
                  disabled={!!searchTerm}
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

        {/* Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { staggerChildren: 0.1 } }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8"
        >
          {subCategories.map(subCat => (
            <motion.div
              key={subCat.id}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 hover:border-teal-500/50 transition-all overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-500/10 rounded-lg"><Folder size={20} className="text-teal-400" /></div>
                    <div>
                      <h3 className="text-xl font-bold">{subCat.name}</h3>
                      <p className="text-sm text-gray-400">in {subCat.category?.name || 'Uncategorized'}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === subCat.id ? null : subCat.id); }}
                    className="p-2 hover:bg-gray-700/50 rounded-lg"
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>

                <div className="mb-4">
                  {subCat.image ? (
                    <img src={getImageUrl(subCat.image)} alt={subCat.name} className="w-full h-32 object-cover rounded-lg border border-gray-600" />
                  ) : (
                    <div className="w-full h-32 bg-gray-700/50 rounded-lg flex items-center justify-center">
                      <ImageIcon size={32} className="text-gray-500" />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => toggleStatus(subCat)}
                  disabled={operationLoading === `status-${subCat.id}`}
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4 ${subCat.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
                >
                  {operationLoading === `status-${subCat.id}` ? <Loader size={12} className="animate-spin" /> : null}
                  {subCat.status === 'active' ? 'Active' : 'Inactive'}
                </button>

                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex items-center gap-2"><Shield size={16} /> ID: #{subCat.id}</div>
                  <div className="flex items-center gap-2"><Calendar size={16} /> Created: {formatDate(subCat.created_at)}</div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700/30">
                  <span className="text-xs text-gray-500">Updated: {formatDate(subCat.updated_at)}</span>
                  <div className="flex gap-2">
                    <button onClick={() => openModal(subCat)} className="p-2 bg-blue-500/20 hover:bg-blue-500/40 rounded-lg"><Edit size={14} /></button>
                    <button onClick={() => handleDelete(subCat.id)} className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {actionMenu === subCat.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-4 top-20 bg-gray-800 border border-gray-600 rounded-xl shadow-xl py-2 z-10 min-w-[160px]"
                  >
                    <button onClick={() => { openModal(subCat); setActionMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-sm"><Edit size={16} /> Edit</button>
                    <button onClick={() => toggleStatus(subCat)} className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-sm">
                      {subCat.status === 'active' ? <EyeOff size={16} /> : <Eye size={16} />}
                      {subCat.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => handleDelete(subCat.id)} className="w-full text-left px-4 py-2 hover:bg-red-500/20 text-red-400 flex items-center gap-3 text-sm"><Trash2 size={16} /> Delete</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

        {/* Pagination */}
        {!searchTerm && pagination.last_page > 1 && (
          <div className="flex justify-between items-center py-6 border-t border-gray-700/30">
            <div className="text-sm text-gray-400">
              Showing {(pagination.current_page - 1) * pagination.per_page + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total}
            </div>
            <div className="flex gap-2">
              <button onClick={() => handlePageChange(pagination.current_page - 1)} disabled={pagination.current_page === 1} className="px-4 py-2 rounded-xl border border-gray-600 disabled:opacity-50 flex items-center gap-2">
                <ChevronLeft size={16} /> Previous
              </button>
              {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pagination.last_page || Math.abs(p - pagination.current_page) <= 2)
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && p - arr[idx - 1] > 1 && <span className="px-3">...</span>}
                    <button onClick={() => handlePageChange(p)} className={`px-4 py-2 rounded-xl border ${pagination.current_page === p ? 'bg-teal-600 border-teal-500' : 'border-gray-600'}`}>
                      {p}
                    </button>
                  </React.Fragment>
                ))}
              <button onClick={() => handlePageChange(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page} className="px-4 py-2 rounded-xl border border-gray-600 disabled:opacity-50 flex items-center gap-2">
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {subCategories.length === 0 && !loading && (
          <div className="text-center py-20">
            <Layers size={64} className="mx-auto text-gray-600 mb-6" />
            <h3 className="text-2xl font-bold mb-3">{searchTerm ? 'No sub-categories found' : 'No sub-categories yet'}</h3>
            <p className="text-gray-400 mb-8">{searchTerm ? 'Try different keywords' : 'Create your first sub-category'}</p>
            {!searchTerm && (
              <button onClick={() => openModal()} className="bg-gradient-to-r from-teal-600 to-blue-600 px-8 py-3 rounded-xl font-bold">
                <Plus className="inline mr-2" /> Create First Sub-Category
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-3xl p-8 max-w-2xl w-full border border-gray-700" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
                  {editingSubCategory ? 'Edit Sub-Category' : 'Create New Sub-Category'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-700 rounded-lg"><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Parent Category *</label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-teal-500/50 outline-none"
                  >
                    <option value="">Select parent category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.category_id && <p className="text-red-400 text-sm mt-1">{errors.category_id[0]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Sub-Category Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-teal-500/50 outline-none"
                    placeholder="e.g., Smartphones, Laptops"
                  />
                  {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name[0]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3">Sub-Category Image</label>
                  <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-teal-500 cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="img-upload" />
                    <label htmlFor="img-upload" className="cursor-pointer">
                      <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-400">Click to upload (Max 2MB)</p>
                    </label>
                  </div>
                  {imagePreview && (
                    <div className="mt-4 relative inline-block">
                      <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg border border-gray-600" />
                      <button type="button" onClick={() => { setImagePreview(null); setFormData(prev => ({ ...prev, image: null })); }} className="absolute -top-2 -right-2 bg-red-500 p-1 rounded-full">
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  {errors.image && <p className="text-red-400 text-sm mt-2">{errors.image}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3">Status</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['active', 'inactive'].map(st => (
                      <label key={st} onClick={() => setFormData(prev => ({ ...prev, status: st }))} className={`p-4 border-2 rounded-xl text-center cursor-pointer transition ${formData.status === st ? (st === 'active' ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10') : 'border-gray-600'}`}>
                        {st === 'active' ? <Eye size={20} className="mx-auto mb-2" /> : <EyeOff size={20} className="mx-auto mb-2" />}
                        <span className="capitalize font-medium">{st}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl">Cancel</button>
                  <button type="submit" disabled={operationLoading === 'saving'} className="px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 rounded-xl font-bold flex items-center gap-2 disabled:opacity-70">
                    {operationLoading === 'saving' ? <Loader size={20} className="animate-spin" /> : <Check size={20} />}
                    {editingSubCategory ? 'Update' : 'Create'} Sub-Category
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

export default SubCategories;