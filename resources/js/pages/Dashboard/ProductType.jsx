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
  Tag,
  Activity,
  Calendar,
  Shield,
  Loader
} from 'lucide-react';

const API_URL = 'http://localhost:8000/api/product-type';

// API service with proper error handling
const productTypeAPI = {
  // Get all product types
  getAll: async (params = {}) => {
    try {
      const response = await axios.get(API_URL, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new product type
  create: async (data) => {
    try {
      const response = await axios.post(API_URL, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get single product type
  getById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update product type
  update: async (id, data) => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete product type
  delete: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

const ProductTypesManager = () => {
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [actionMenu, setActionMenu] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    status: true // Changed to boolean to match API
  });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Pagination state
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  });

  // Show notification
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
  }, []);

  // Enhanced error handler
  const handleApiError = useCallback((error, defaultMessage) => {
    console.error('API Error:', error);

    if (error.response?.status === 405) {
      showNotification('API endpoint not available. Please check your backend routes.', 'error');
      return { _general: 'Method not allowed. Please check API configuration.' };
    } else if (error.response?.status === 404) {
      showNotification('API endpoint not found.', 'error');
      return { _general: 'API endpoint not found.' };
    } else if (error.response?.status === 500) {
      showNotification('Server error. Please try again later.', 'error');
      return { _general: 'Internal server error.' };
    } else if (error.response?.data?.errors) {
      // Laravel-style validation errors
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

  // Fetch product types with better error handling
  const fetchProductTypes = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: pagination.per_page,
        ...(search && { search })
      };

      const response = await productTypeAPI.getAll(params);
      
      // Handle different response structures
      let types = [];
      let paginationData = {
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0
      };

      if (Array.isArray(response)) {
        types = response;
        paginationData.total = response.length;
      } else if (response && Array.isArray(response.data)) {
        types = response.data;
        paginationData = {
          current_page: response.current_page || 1,
          last_page: response.last_page || 1,
          per_page: response.per_page || 10,
          total: response.total || response.data.length
        };
      } else if (response && response.data && typeof response.data === 'object') {
        // If it's an object, convert to array
        types = Object.values(response.data);
        paginationData.total = types.length;
      }

      setProductTypes(types);
      setPagination(paginationData);
    } catch (error) {
      const apiErrors = handleApiError(error, 'Error fetching product types');
      if (apiErrors._general) {
        setProductTypes([]);
      }
    } finally {
      setLoading(false);
    }
  }, [handleApiError, pagination.per_page]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product type name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Product type name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Product type name must be less than 50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? e.target.checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle status radio button change
  const handleStatusChange = (status) => {
    setFormData(prev => ({
      ...prev,
      status: status === 'active'
    }));
  };

  // Submit form (create/update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setOperationLoading('saving');

    try {
      const payload = {
        name: formData.name.trim(),
        status: formData.status
      };

      if (editingType) {
        // Update existing product type
        await productTypeAPI.update(editingType.id, payload);
        showNotification('Product type updated successfully!', 'success');
      } else {
        // Create new product type
        await productTypeAPI.create(payload);
        showNotification('Product type created successfully!', 'success');
      }

      resetForm();
      fetchProductTypes(pagination.current_page, searchTerm);
      setShowModal(false);
    } catch (error) {
      const apiErrors = handleApiError(error, 'Error saving product type');
      if (apiErrors) {
        setErrors(apiErrors);
      }
    } finally {
      setOperationLoading(null);
    }
  };

  // Edit product type
  const handleEdit = (type) => {
    setEditingType(type);
    setFormData({
      name: type.name || '',
      status: Boolean(type.status)
    });
    setShowModal(true);
    setActionMenu(null);
  };

  // Delete product type with confirmation and loading state
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product type? This action cannot be undone.')) {
      setActionMenu(null);
      return;
    }

    setOperationLoading(`delete-${id}`);

    try {
      await productTypeAPI.delete(id);
      showNotification('Product type deleted successfully!', 'success');
      // If we're on the last page and it's now empty, go to previous page
      if (productTypes.length === 1 && pagination.current_page > 1) {
        fetchProductTypes(pagination.current_page - 1, searchTerm);
      } else {
        fetchProductTypes(pagination.current_page, searchTerm);
      }
    } catch (error) {
      handleApiError(error, 'Error deleting product type');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  // Toggle type status with loading state
  const toggleStatus = async (type) => {
    setOperationLoading(`status-${type.id}`);

    try {
      const newStatus = !type.status;
      const payload = {
        name: type.name,
        status: newStatus
      };

      await productTypeAPI.update(type.id, payload);
      showNotification(`Product type ${newStatus ? 'activated' : 'deactivated'}!`, 'success');
      fetchProductTypes(pagination.current_page, searchTerm);
    } catch (error) {
      handleApiError(error, 'Error updating status');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      status: true
    });
    setEditingType(null);
    setErrors({});
  };

  // Open modal for create/edit
  const openModal = (type = null) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name || '',
        status: Boolean(type.status)
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => {
      resetForm();
    }, 300);
  };

  // Handle search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProductTypes(1, searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      fetchProductTypes(newPage, searchTerm);
    }
  };

  // Handle limit change
  const handleLimitChange = (newLimit) => {
    setPagination(prev => ({ ...prev, per_page: parseInt(newLimit) }));
    fetchProductTypes(1, searchTerm);
  };

  // Filter and sort product types with useMemo for performance
  const filteredProductTypes = React.useMemo(() => {
    let filtered = productTypes.filter(item => {
      const itemName = item.name || '';
      const matchesSearch = itemName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' ? Boolean(item.status) : !Boolean(item.status));
      return matchesSearch && matchesStatus;
    });

    // Sort items
    return filtered.sort((a, b) => {
      const aName = a.name || '';
      const bName = b.name || '';

      switch (sortBy) {
        case 'name':
          return aName.localeCompare(bName);
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        case 'newest':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case 'oldest':
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        default:
          return 0;
      }
    });
  }, [productTypes, searchTerm, filterStatus, sortBy]);

  // Initialize
  useEffect(() => {
    fetchProductTypes(1);
  }, [fetchProductTypes]);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActionMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Statistics with safe calculations
  const stats = {
    total: pagination.total,
    active: productTypes.filter(item => Boolean(item.status)).length,
    inactive: productTypes.filter(item => !Boolean(item.status)).length
  };

  // Format date safely
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  // Loading skeleton
  if (loading && productTypes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <div className="h-8 bg-gray-800 rounded w-64 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-800 rounded w-48 animate-pulse"></div>
              </div>
              <div className="h-12 bg-gray-800 rounded-xl w-40 animate-pulse"></div>
            </div>
          </div>

          {/* Stats Skeleton */}
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

          {/* Search Skeleton */}
          <div className="mb-6">
            <div className="h-12 bg-gray-800 rounded-xl w-96 animate-pulse"></div>
          </div>

          {/* Cards Skeleton */}
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
                  <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                </div>
                <div className="flex justify-between mt-6 pt-4 border-t border-gray-700/30">
                  <div className="h-4 bg-gray-700 rounded w-16"></div>
                  <div className="h-4 bg-gray-700 rounded w-16"></div>
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
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                Product Types Management
              </h1>
              <p className="text-gray-400 mt-2 text-lg">
                Manage product categories and types
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openModal()}
              className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-emerald-500/25 flex items-center gap-3"
            >
              <Plus size={22} />
              Add New Type
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
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40 hover:border-emerald-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Types</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-cyan-500/10 rounded-xl">
                <Tag size={24} className="text-cyan-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40 hover:border-emerald-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Active Types</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.active}</p>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                <Activity size={24} className="text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40 hover:border-emerald-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Inactive Types</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.inactive}</p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-xl">
                <EyeOff size={24} className="text-red-400" />
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
                placeholder="Search product types by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent backdrop-blur-sm transition-all duration-200"
              />
            </div>

            {/* Controls */}
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
                className="px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 backdrop-blur-sm min-w-[140px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 backdrop-blur-sm min-w-[140px]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A-Z</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
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
                <button
                  onClick={() => setErrors({})}
                  className="ml-auto text-red-400 hover:text-red-300 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Types Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8"
        >
          {filteredProductTypes.map((type) => (
            <motion.div
              key={type.id}
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group bg-gray-800/30 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700/30 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Tag size={20} className="text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-emerald-100 transition-colors truncate max-w-[160px]">
                      {type.name}
                    </h3>
                  </div>

                  {/* Action Menu */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionMenu(actionMenu === type.id ? null : type.id);
                      }}
                      className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors duration-200 opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical size={18} />
                    </button>

                    <AnimatePresence>
                      {actionMenu === type.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute right-0 top-10 z-10 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl min-w-[160px] py-2 backdrop-blur-sm"
                        >
                          <button
                            onClick={() => handleEdit(type)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 transition-colors duration-200"
                          >
                            <Edit size={16} />
                            Edit
                          </button>
                          <button
                            onClick={() => toggleStatus(type)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 transition-colors duration-200"
                          >
                            {type.status ? <EyeOff size={16} /> : <Eye size={16} />}
                            {type.status ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDelete(type.id)}
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

                {/* Status */}
                <div className="mb-4">
                  <button
                    onClick={() => toggleStatus(type)}
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                      type.status
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                    }`}
                  >
                    {type.status ? (
                      <>
                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
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

                {/* Type Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Shield size={16} />
                    <span>ID: #{type.id}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar size={16} />
                    <span>Created: {formatDate(type.created_at)}</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-700/30">
                  <span className="text-xs text-gray-500">
                    Updated: {formatDate(type.updated_at)}
                  </span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEdit(type)}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all duration-200"
                      title="Edit"
                    >
                      <Edit size={14} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(type.id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all duration-200"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row justify-between items-center gap-4 py-6 border-t border-gray-700/30"
          >
            <div className="text-sm text-gray-400">
              Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
              {pagination.total} entries
            </div>

            <div className="flex gap-2">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className={`px-4 py-2 rounded-xl border transition-all duration-200 flex items-center gap-2 ${
                  pagination.current_page === 1
                    ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500'
                }`}
              >
                <ChevronDown size={16} className="rotate-90" />
                Previous
              </button>

              {/* Page Numbers */}
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
                      {showEllipsis && (
                        <span className="px-3 py-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-xl border transition-all duration-200 ${
                          pagination.current_page === page
                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                            : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}

              {/* Next Button */}
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
                <ChevronDown size={16} className="-rotate-90" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {productTypes.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-800/40 rounded-full flex items-center justify-center border border-gray-700/40">
                <Tag size={48} className="text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {searchTerm ? 'No product types found' : 'No product types yet'}
              </h3>
              <p className="text-gray-400 text-lg mb-8">
                {searchTerm
                  ? "Try adjusting your search terms or filters to find what you're looking for."
                  : "Get started by creating your first product type."
                }
              </p>
              {!searchTerm && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openModal()}
                  className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-emerald-500/25 flex items-center gap-3 mx-auto"
                >
                  <Plus size={20} />
                  Create Your First Type
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Create/Edit Modal */}
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
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-700/50 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                    {editingType ? 'Edit Product Type' : 'Create New Product Type'}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-gray-700/50"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Type Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-white placeholder-gray-400 transition-all duration-200 backdrop-blur-sm"
                      placeholder="Enter product type name (e.g., Electronics, Clothing)"
                    />
                    {errors.name && (
                      <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                        <AlertCircle size={16} />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Status Field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Status
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <label 
                        className={`relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          formData.status
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                        }`}
                        onClick={() => handleStatusChange('active')}
                      >
                        <div className="text-center">
                          <Activity size={20} className={`mx-auto mb-2 ${
                            formData.status ? 'text-emerald-400' : 'text-gray-400'
                          }`} />
                          <span className={`font-medium ${
                            formData.status ? 'text-emerald-400' : 'text-gray-400'
                          }`}>
                            Active
                          </span>
                        </div>
                      </label>

                      <label 
                        className={`relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          !formData.status
                            ? 'border-red-500 bg-red-500/10'
                            : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                        }`}
                        onClick={() => handleStatusChange('inactive')}
                      >
                        <div className="text-center">
                          <EyeOff size={20} className={`mx-auto mb-2 ${
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
                    <p className="text-xs text-gray-400 mt-3">
                      Inactive types won't be available for selection in the system
                    </p>
                  </div>

                  {/* Action Buttons */}
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
                      className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-emerald-500/25 flex items-center gap-2"
                    >
                      {operationLoading === 'saving' ? (
                        <Loader size={20} className="animate-spin" />
                      ) : (
                        <Check size={20} />
                      )}
                      {editingType ? 'Update Type' : 'Create Type'}
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

export default ProductTypesManager;