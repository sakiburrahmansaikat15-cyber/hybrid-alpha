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
  Eye,
  EyeOff,
  ChevronDown,
  Image as ImageIcon,
  Folder,
  Calendar,
  Shield,
  Upload,
  ChevronLeft,
  ChevronRight,
  Loader
} from 'lucide-react';

const API_URL = 'http://localhost:8000/api/categories';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [actionMenu, setActionMenu] = useState(null);
  const [formData, setFormData] = useState({
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
    if (error.response?.status === 404) {
      showNotification('Category not found.', 'error');
      return { _general: 'Category not found.' };
    } else if (error.response?.status === 500) {
      showNotification('Server error. Please try again later.', 'error');
      return { _general: 'Internal server error.' };
    } else if (error.response?.data?.errors) {
      const validationErrors = error.response.data.errors;
      const firstError = Object.values(validationErrors)[0]?.[0];
      showNotification(firstError || 'Validation error', 'error');
      return validationErrors;
    } else if (error.response?.data?.message) {
      showNotification(error.response.data.message, 'error');
      return { _general: error.response.data.message };
    } else if (error.message === 'Network Error') {
      showNotification('Network error - please check your connection', 'error');
      return { _general: 'Network error' };
    } else {
      showNotification(defaultMessage, 'error');
      return { _general: defaultMessage };
    }
  }, [showNotification]);

  const fetchCategories = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.per_page,
        ...(search && { search })
      };

      const response = await axios.get(API_URL, { params });

      if (response.data.success) {
        setCategories(response.data.data || []);
        setPagination({
          current_page: response.data.pagination?.current_page || 1,
          last_page: response.data.pagination?.last_page || 1,
          per_page: response.data.pagination?.per_page || 10,
          total: response.data.pagination?.total || 0
        });
      } else {
        throw new Error(response.data.message || 'Failed to fetch categories');
      }
    } catch (error) {
      handleApiError(error, 'Error fetching categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [handleApiError, pagination.per_page]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, image: 'Please select a valid image file (JPEG, PNG, WebP)' }));
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'Image size must be less than 2MB' }));
        return;
      }
      setFormData(prev => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
      if (errors.image) {
        setErrors(prev => ({ ...prev, image: '' }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setOperationLoading('saving');
    const submitData = new FormData();
    submitData.append('name', formData.name.trim());
    submitData.append('status', formData.status);

    // Only append image if a new one is selected
    if (formData.image instanceof File) {
      submitData.append('image', formData.image);
    }

    try {
      let response;
      if (editingCategory) {
        // Laravel: Use POST + _method=PUT for update with file upload
        submitData.append('_method', 'PUT');
        response = await axios.post(`${API_URL}/${editingCategory.id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await axios.post(API_URL, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (response.data.success) {
        showNotification(
          response.data.message || `Category ${editingCategory ? 'updated' : 'created'} successfully!`,
          'success'
        );
        fetchCategories(pagination.current_page, searchTerm);
        closeModal();
      } else {
        throw new Error(response.data.message || `Failed to ${editingCategory ? 'update' : 'create'} category`);
      }
    } catch (error) {
      const err = handleApiError(error, 'Error saving category');
      setErrors(prev => ({ ...prev, ...err }));
    } finally {
      setOperationLoading(null);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      image: null,
      status: category.status ? 'active' : 'inactive'
    });
    setImagePreview(category.image ? `http://localhost:8000/${category.image}` : null);
    setErrors({});
    setShowModal(true);
    setActionMenu(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      setActionMenu(null);
      return;
    }

    setOperationLoading(`delete-${id}`);
    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      if (response.data.success) {
        showNotification(response.data.message || 'Category deleted successfully!', 'success');
        fetchCategories(pagination.current_page, searchTerm);
      } else {
        throw new Error(response.data.message || 'Failed to delete category');
      }
    } catch (error) {
      handleApiError(error, 'Error deleting category');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  const toggleStatus = async (category) => {
    setOperationLoading(`status-${category.id}`);
    try {
      const response = await axios.post(`${API_URL}/${category.id}/toggle-status`);
      if (response.data.success) {
        showNotification(response.data.message || `Category ${!category.status ? 'activated' : 'deactivated'}!`, 'success');
        fetchCategories(pagination.current_page, searchTerm);
      } else {
        throw new Error(response.data.message || 'Failed to update category status');
      }
    } catch (error) {
      handleApiError(error, 'Error updating status');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', image: null, status: 'active' });
    setImagePreview(null);
    setEditingCategory(null);
    setErrors({});
  };

  const openModal = (category = null) => {
    if (category) {
      handleEdit(category);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(resetForm, 300);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      fetchCategories(newPage, searchTerm);
    }
  };

  const handleLimitChange = (newLimit) => {
    setPagination(prev => ({ ...prev, per_page: parseInt(newLimit) }));
    fetchCategories(1, searchTerm);
  };

  const filteredCategories = React.useMemo(() => {
    let filtered = categories.filter(item => {
      const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'active' ? item.status : !item.status);
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name': return (a.name || '').localeCompare(b.name || '');
        case 'status': return (b.status ? 1 : -1) - (a.status ? 1 : -1);
        case 'newest': return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case 'oldest': return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        default: return 0;
      }
    });
  }, [categories, searchTerm, filterStatus, sortBy]);

  useEffect(() => {
    fetchCategories(1);
  }, [fetchCategories]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCategories(1, searchTerm);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, fetchCategories]);

  useEffect(() => {
    const handleClickOutside = () => setActionMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const stats = {
    total: pagination.total,
    active: categories.filter(item => item.status).length,
    inactive: categories.filter(item => !item.status).length
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:8000/${imagePath}`;
  };

  if (loading && categories.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <div className="h-8 bg-gray-800 rounded w-64 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-800 rounded w-48 animate-pulse"></div>
              </div>
              <div className="h-12 bg-gray-800 rounded-xl w-40 animate-pulse"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700/40 animate-pulse">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
                    <div className="h-6 bg-gray-700 rounded w-16"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-700 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 animate-pulse">
                <div className="flex justify-between mb-4">
                  <div className="h-6 bg-gray-700 rounded w-32"></div>
                  <div className="h-6 bg-gray-700 rounded w-12"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                </div>
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
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                Categories Management
              </h1>
              <p className="text-gray-400 mt-2 text-lg">Manage product categories</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openModal()}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-blue-500/25 flex items-center gap-3"
            >
              <Plus size={22} />
              Add New Category
            </motion.button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40 hover:border-blue-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Categories</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Folder size={24} className="text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40 hover:border-blue-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Active Categories</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-xl">
                <Eye size={24} className="text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40 hover:border-blue-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Inactive Categories</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.inactive}</p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-xl">
                <EyeOff size={24} className="text-red-400" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/30">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search categories by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent backdrop-blur-sm transition-all duration-200"
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
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm min-w-[140px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm min-w-[140px]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A-Z</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {errors._general && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 bg-red-900/50 border border-red-700 rounded-xl p-4 backdrop-blur-sm"
            >
              <div className="flex items-center">
                <AlertCircle size={20} className="text-red-400 mr-3" />
                <span className="text-red-200 text-sm">{errors._general}</span>
                <button onClick={() => setErrors({})} className="ml-auto text-red-400 hover:text-red-300 transition-colors">
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
          initial="hidden"
          animate="visible"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8"
        >
          {filteredCategories.map((category) => (
            <motion.div
              key={category.id}
              variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { y: 0, opacity: 1 }
              }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group bg-gray-800/30 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700/30 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Folder size={20} className="text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-100 transition-colors truncate max-w-[160px]">
                      {category.name}
                    </h3>
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionMenu(actionMenu === category.id ? null : category.id);
                      }}
                      className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors duration-200 opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical size={18} />
                    </button>
                    <AnimatePresence>
                      {actionMenu === category.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute right-0 top-10 z-10 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl min-w-[160px] py-2 backdrop-blur-sm"
                        >
                          <button
                            onClick={() => handleEdit(category)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 transition-colors duration-200"
                          >
                            <Edit size={16} />
                            Edit
                          </button>
                          <button
                            onClick={() => toggleStatus(category)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 transition-colors duration-200"
                          >
                            {category.status ? <EyeOff size={16} /> : <Eye size={16} />}
                            {category.status ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
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

                <div className="mb-4">
                  {category.image ? (
                    <div className="relative">
                      <img
                        src={getImageUrl(category.image)}
                        alt={category.name}
                        className="w-full h-32 object-cover rounded-lg border border-gray-600 group-hover:border-blue-500/50 transition-colors duration-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="w-full h-32 rounded-lg border border-gray-600 hidden items-center justify-center bg-gray-700/50">
                        <ImageIcon size={32} className="text-gray-500" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-32 rounded-lg border border-gray-600 flex items-center justify-center bg-gray-700/50">
                      <ImageIcon size={32} className="text-gray-500" />
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <button
                    onClick={() => toggleStatus(category)}
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                      category.status
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                    }`}
                  >
                    {category.status ? (
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
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Shield size={16} />
                    <span>ID: #{category.id}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar size={16} />
                    <span>Created: {formatDate(category.created_at)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-700/30">
                  <span className="text-xs text-gray-500">
                    Updated: {formatDate(category.updated_at)}
                  </span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEdit(category)}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all duration-200"
                    >
                      <Edit size={14} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(category.id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all duration-200"
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {pagination.last_page > 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-center gap-4 py-6 border-t border-gray-700/30">
            <div className="text-sm text-gray-400">
              Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
              {pagination.total} entries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className={`px-4 py-2 rounded-xl border transition-all duration-200 flex items-center gap-2 ${
                  pagination.current_page === 1
                    ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500'
                }`}
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                .filter(page =>
                  page === 1 ||
                  page === pagination.last_page ||
                  Math.abs(page - pagination.current_page) <= 2
                )
                .map((page, index, array) => {
                  const showEllipsis = index > 0 && page - array[index - 1] > 1;
                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && <span className="px-3 py-2 text-gray-400">...</span>}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-xl border transition-all duration-200 ${
                          pagination.current_page === page
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25'
                            : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}
              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
                className={`px-4 py-2 rounded-xl border transition-all duration-200 flex items-center gap-2 ${
                  pagination.current_page === pagination.last_page
                    ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500'
                }`}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {categories.length === 0 && !loading && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-800/40 rounded-full flex items-center justify-center border border-gray-700/40">
                <Folder size={48} className="text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {searchTerm ? 'No categories found' : 'No categories yet'}
              </h3>
              <p className="text-gray-400 text-lg mb-8">
                {searchTerm
                  ? "Try adjusting your search terms or filters."
                  : "Get started by creating your first product category."
                }
              </p>
              {!searchTerm && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openModal()}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-blue-500/25 flex items-center gap-3 mx-auto"
                >
                  <Plus size={20} />
                  Create Your First Category
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700/50 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                    {editingCategory ? 'Edit Category' : 'Create New Category'}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-gray-700/50"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 bg-gray-700/50 border rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-white placeholder-gray-400 transition-all duration-200 backdrop-blur-sm ${
                        errors.name ? 'border-red-500' : 'border-gray-600/50'
                      }`}
                      placeholder="Enter category name"
                    />
                    {errors.name && (
                      <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                        <AlertCircle size={16} />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Category Image
                    </label>
                    <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-blue-500 transition-colors duration-200 group cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer block">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:text-blue-400 transition-colors" />
                        <span className="text-gray-400 text-sm group-hover:text-blue-300 transition-colors">
                          Click to upload image
                        </span>
                        <p className="text-gray-500 text-xs mt-1">
                          PNG, JPG, WebP up to 2MB
                        </p>
                      </label>
                    </div>
                    {imagePreview && (
                      <div className="mt-4">
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          Image Preview
                        </label>
                        <div className="relative inline-block">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-32 h-32 object-cover rounded-lg border border-gray-600"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              setFormData(prev => ({ ...prev, image: null }));
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                    {errors.image && (
                      <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                        <AlertCircle size={16} />
                        {errors.image}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Status
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className={`relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        formData.status === 'active'
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                      }`}>
                        <input
                          type="radio"
                          name="status"
                          value="active"
                          checked={formData.status === 'active'}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className="text-center">
                          <Eye size={20} className={`mx-auto mb-2 ${
                            formData.status === 'active' ? 'text-green-400' : 'text-gray-400'
                          }`} />
                          <span className={`font-medium ${
                            formData.status === 'active' ? 'text-green-400' : 'text-gray-400'
                          }`}>
                            Active
                          </span>
                        </div>
                      </label>
                      <label className={`relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        formData.status === 'inactive'
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                      }`}>
                        <input
                          type="radio"
                          name="status"
                          value="inactive"
                          checked={formData.status === 'inactive'}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className="text-center">
                          <EyeOff size={20} className={`mx-auto mb-2 ${
                            formData.status === 'inactive' ? 'text-red-400' : 'text-gray-400'
                          }`} />
                          <span className={`font-medium ${
                            formData.status === 'inactive' ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            Inactive
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-700/50">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={closeModal}
                      className="px-6 py-3 text-sm font-medium text-gray-300 hover:text-white transition-colors bg-gray-700/50 hover:bg-gray-600/50 rounded-xl border border-gray-600/50"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={operationLoading === 'saving'}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-blue-500/25 flex items-center gap-2 disabled:opacity-70"
                    >
                      {operationLoading === 'saving' ? (
                        <Loader size={20} className="animate-spin" />
                      ) : (
                        <Check size={20} />
                      )}
                      {editingCategory ? 'Update Category' : 'Create Category'}
                    </motion.button>
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

export default Categories;
