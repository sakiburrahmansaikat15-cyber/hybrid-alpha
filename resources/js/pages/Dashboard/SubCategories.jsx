import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  Check,
  AlertCircle,
  Filter,
  MoreVertical,
  Folder,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Upload,
  Shield,
  Calendar,
  Layers
} from 'lucide-react';

const API_URL = '/api/sub-categories';

const SubCategories = () => {
  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    status: 1,
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  });

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
  };

  // Create a proper fallback image component
  const FallbackImage = ({ className, alt }) => (
    <div className={`${className} bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border border-gray-600 rounded-lg`}>
      <div className="text-center">
        <ImageIcon size={20} className="text-gray-500 mx-auto mb-1" />
        <span className="text-xs text-gray-400">{alt}</span>
      </div>
    </div>
  );

  // Handle image error
  const handleImageError = (e) => {
    e.target.style.display = 'none';
    if (e.target.nextSibling) {
      e.target.nextSibling.style.display = 'flex';
    }
  };

  // Fetch sub-categories and categories
  const fetchData = async () => {
    setLoading(true);
    try {
      const [subCategoriesRes, categoriesRes] = await Promise.all([
        axios.get(API_URL),
        axios.get('/api/categories')
      ]);

      // Handle sub-categories response
      const subCategoriesData = subCategoriesRes.data;
      if (Array.isArray(subCategoriesData)) {
        setSubCategories(subCategoriesData);
      } else if (subCategoriesData && Array.isArray(subCategoriesData.data)) {
        setSubCategories(subCategoriesData.data);
      } else {
        setSubCategories([]);
      }

      // Handle categories response
      const categoriesData = categoriesRes.data;
      if (Array.isArray(categoriesData)) {
        setCategories(categoriesData);
      } else if (categoriesData && Array.isArray(categoriesData.data)) {
        setCategories(categoriesData.data);
      } else {
        setCategories([]);
      }

      setError('');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch data. Please check your connection.';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        searchSubCategories(searchTerm);
      } else {
        fetchData();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Search sub-categories
  const searchSubCategories = async (query) => {
    if (!query.trim()) {
      fetchData();
      return;
    }

    setLoading(true);
    try {
      // Filter client-side since we might not have search endpoint
      const filtered = subCategories.filter(subCat =>
        subCat.name.toLowerCase().includes(query.toLowerCase()) ||
        subCat.category?.name.toLowerCase().includes(query.toLowerCase())
      );
      setSubCategories(filtered);
      setPagination(prev => ({ ...prev, total: filtered.length }));
    } catch (err) {
      const errorMsg = 'Error searching sub-categories';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      setPagination(prev => ({ ...prev, current_page: newPage }));
    }
  };

  const handleLimitChange = (newLimit) => {
    setPagination(prev => ({ ...prev, per_page: parseInt(newLimit) }));
  };

  // Handle image change - THIS WAS MISSING!
  const handleImageChange = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showNotification('Please select a valid image file (JPG, JPEG, PNG, WebP)', 'error');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        showNotification('Image size should be less than 2MB', 'error');
        return;
      }

      setFormData(prev => ({
        ...prev,
        image: file
      }));

      // Create image preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Handle input change for other form fields
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'radio' ? parseInt(value) : value
    }));
  };

  const resetForm = () => {
    setFormData({
      category_id: '',
      name: '',
      status: 1,
      image: null
    });
    setEditingSubCategory(null);
    setImagePreview(null);
    setError('');
  };

  const openModal = (subCategory = null) => {
    if (subCategory) {
      setEditingSubCategory(subCategory);
      setFormData({
        category_id: subCategory.category_id.toString(),
        name: subCategory.name,
        status: subCategory.status,
        image: null
      });
      setImagePreview(subCategory.image ? `/${subCategory.image}` : null);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => {
      resetForm();
    }, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');

    // Basic validation
    if (!formData.category_id) {
      setError('Please select a category');
      setSubmitLoading(false);
      return;
    }
    if (!formData.name.trim()) {
      setError('Please enter a sub-category name');
      setSubmitLoading(false);
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('category_id', formData.category_id);
      submitData.append('name', formData.name);
      submitData.append('status', formData.status);

      if (formData.image) {
        submitData.append('image', formData.image);
      }

      if (editingSubCategory) {
        submitData.append('_method', 'PUT');
        await axios.post(`${API_URL}/${editingSubCategory.id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showNotification('Sub-category updated successfully!', 'success');
      } else {
        await axios.post(API_URL, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showNotification('Sub-category created successfully!', 'success');
      }

      fetchData();
      closeModal();
    } catch (err) {
      const errorMessage = err.response?.data?.message || `Failed to ${editingSubCategory ? 'update' : 'create'} sub-category. Please try again.`;
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      console.error('Error submitting form:', err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sub-category? This action cannot be undone.')) {
      setActionMenu(null);
      return;
    }

    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Sub-category deleted successfully!', 'success');
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete sub-category. Please try again.';
      showNotification(errorMsg, 'error');
      console.error('Error deleting sub-category:', err);
    }
    setActionMenu(null);
  };

  const toggleStatus = async (subCategory) => {
    const newStatus = subCategory.status === 1 ? 0 : 1;

    try {
      await axios.patch(`${API_URL}/${subCategory.id}/status`, {
        status: newStatus
      });
      showNotification(`Sub-category ${newStatus === 1 ? 'activated' : 'deactivated'}!`, 'success');
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update sub-category status. Please try again.';
      showNotification(errorMsg, 'error');
      console.error('Error updating status:', err);
    }
    setActionMenu(null);
  };

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActionMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Statistics
  const stats = {
    total: subCategories.length,
    active: subCategories.filter(subCat => subCat.status === 1).length,
    inactive: subCategories.filter(subCat => subCat.status === 0).length
  };

  // Table loading skeleton
  if (loading && subCategories.length === 0) {
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

          {/* Table Skeleton */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 overflow-hidden">
            <div className="p-6 border-b border-gray-700/30">
              <div className="h-12 bg-gray-700/50 rounded-xl w-96 animate-pulse"></div>
            </div>
            <div className="p-6">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-center justify-between py-4 border-b border-gray-700/30 last:border-b-0 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-700 rounded-lg"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-32"></div>
                      <div className="h-3 bg-gray-700 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-6 bg-gray-700 rounded w-20"></div>
                    <div className="h-8 bg-gray-700 rounded w-8"></div>
                    <div className="h-8 bg-gray-700 rounded w-8"></div>
                  </div>
                </div>
              ))}
            </div>
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
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
                Sub-Categories Management
              </h1>
              <p className="text-gray-400 mt-2 text-lg">
                Manage product sub-categories and their details
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openModal()}
              className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-teal-500/25 flex items-center gap-3"
            >
              <Plus size={22} />
              Add New Sub-Category
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
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40 hover:border-teal-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Sub-Categories</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-teal-500/10 rounded-xl">
                <Layers size={24} className="text-teal-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40 hover:border-teal-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Active Sub-Categories</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-xl">
                <Check size={24} className="text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40 hover:border-teal-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Inactive Sub-Categories</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.inactive}</p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-xl">
                <X size={24} className="text-red-400" />
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
                placeholder="Search sub-categories by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-transparent backdrop-blur-sm transition-all duration-200"
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
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 bg-red-900/50 border border-red-700 rounded-xl p-4 backdrop-blur-sm"
            >
              <div className="flex items-center">
                <AlertCircle size={20} className="text-red-400 mr-3" />
                <span className="text-red-200 text-sm">{error}</span>
                <button
                  onClick={() => setError('')}
                  className="ml-auto text-red-400 hover:text-red-300 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sub-Categories Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 overflow-hidden mb-8"
        >
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-700/30 bg-gray-800/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Sub-Categories List</h3>
              <span className="text-sm text-gray-400">
                {subCategories.length} {subCategories.length === 1 ? 'sub-category' : 'sub-categories'} found
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/30">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Sub-Category
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Parent Category
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {subCategories.map((subCategory) => (
                  <motion.tr
                    key={subCategory.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-700/10 transition-colors duration-200 group"
                  >
                    {/* Sub-Category Name */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-500/10 rounded-lg">
                          <Folder size={20} className="text-teal-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-white group-hover:text-teal-100 transition-colors">
                            {subCategory.name}
                          </div>
                          <div className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                            <Shield size={12} />
                            ID: #{subCategory.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Parent Category */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        {subCategory.category?.name || 'No Category'}
                      </div>
                    </td>

                    {/* Image */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {subCategory.image ? (
                          <div className="relative">
                            <img
                              src={`/${subCategory.image}`}
                              alt={subCategory.name}
                              className="w-8 h-8 object-cover rounded-lg border border-gray-600 group-hover:border-teal-500/50 transition-colors duration-200"
                              onError={handleImageError}
                            />
                            <FallbackImage
                              className="w-8 h-8 rounded-lg hidden"
                              alt={subCategory.name}
                            />
                          </div>
                        ) : (
                          <FallbackImage
                            className="w-8 h-8 rounded-lg"
                            alt="No Image"
                          />
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatus(subCategory)}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                          subCategory.status === 1
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                        }`}
                      >
                        {subCategory.status === 1 ? (
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

                    {/* Created Date */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Calendar size={14} />
                        {new Date(subCategory.created_at).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Quick Actions */}
                        <div className="hidden lg:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openModal(subCategory)}
                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all duration-200"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(subCategory.id)}
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
                              setActionMenu(actionMenu === subCategory.id ? null : subCategory.id);
                            }}
                            className="p-2 hover:bg-gray-600/50 rounded-lg transition-colors duration-200"
                          >
                            <MoreVertical size={18} />
                          </button>

                          <AnimatePresence>
                            {actionMenu === subCategory.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute right-0 top-10 z-10 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl min-w-[160px] py-2 backdrop-blur-sm"
                              >
                                <button
                                  onClick={() => openModal(subCategory)}
                                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 transition-colors duration-200"
                                >
                                  <Edit size={16} />
                                  Edit
                                </button>
                                <button
                                  onClick={() => toggleStatus(subCategory)}
                                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 transition-colors duration-200"
                                >
                                  {subCategory.status === 1 ? <X size={16} /> : <Check size={16} />}
                                  {subCategory.status === 1 ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => handleDelete(subCategory.id)}
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
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {subCategories.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-800/40 rounded-full flex items-center justify-center border border-gray-700/40">
                  <Layers size={48} className="text-gray-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  {searchTerm ? 'No sub-categories found' : 'No sub-categories yet'}
                </h3>
                <p className="text-gray-400 text-lg mb-8">
                  {searchTerm
                    ? "Try adjusting your search terms to find what you're looking for."
                    : "Get started by creating your first sub-category."
                  }
                </p>
                {!searchTerm && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openModal()}
                    className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-teal-500/25 flex items-center gap-3 mx-auto"
                  >
                    <Plus size={20} />
                    Create Your First Sub-Category
                  </motion.button>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        {subCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row justify-between items-center gap-4 py-6 border-t border-gray-700/30"
          >
            <div className="text-sm text-gray-400">
              Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
              {Math.min(pagination.current_page * pagination.per_page, subCategories.length)} of{' '}
              {subCategories.length} entries
            </div>

            <div className="flex items-center gap-2">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className={`p-2 rounded-lg border transition-all duration-200 ${
                  pagination.current_page === 1
                    ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500'
                }`}
              >
                <ChevronLeft size={16} />
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
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded-lg border transition-all duration-200 ${
                          pagination.current_page === page
                            ? 'bg-teal-600 border-teal-500 text-white shadow-lg shadow-teal-500/25'
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
                className={`p-2 rounded-lg border transition-all duration-200 ${
                  pagination.current_page === pagination.last_page
                    ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500'
                }`}
              >
                <ChevronRight size={16} />
              </button>
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
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
                    {editingSubCategory ? 'Edit Sub-Category' : 'Create New Sub-Category'}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-gray-700/50"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Sub-Category Image
                    </label>
                    <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-teal-500 transition-colors duration-200 group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer block">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:text-teal-400 transition-colors" />
                        <span className="text-gray-400 text-sm group-hover:text-teal-300 transition-colors">
                          Click to upload image
                        </span>
                        <p className="text-gray-500 text-xs mt-1">
                          PNG, JPG, WebP up to 2MB
                        </p>
                      </label>
                    </div>

                    {/* Image Preview */}
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
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Parent Category *
                    </label>
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-white transition-all duration-200 backdrop-blur-sm"
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Sub-Category Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-white placeholder-gray-400 transition-all duration-200 backdrop-blur-sm"
                      placeholder="Enter sub-category name"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Status
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className={`relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        formData.status === 1
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                      }`}>
                        <input
                          type="radio"
                          name="status"
                          value="1"
                          checked={formData.status === 1}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className="text-center">
                          <Check size={20} className={`mx-auto mb-2 ${
                            formData.status === 1 ? 'text-green-400' : 'text-gray-400'
                          }`} />
                          <span className={`font-medium ${
                            formData.status === 1 ? 'text-green-400' : 'text-gray-400'
                          }`}>
                            Active
                          </span>
                        </div>
                      </label>

                      <label className={`relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        formData.status === 0
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                      }`}>
                        <input
                          type="radio"
                          name="status"
                          value="0"
                          checked={formData.status === 0}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className="text-center">
                          <X size={20} className={`mx-auto mb-2 ${
                            formData.status === 0 ? 'text-red-400' : 'text-gray-400'
                          }`} />
                          <span className={`font-medium ${
                            formData.status === 0 ? 'text-red-400' : 'text-gray-400'
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
                      onClick={closeModal}
                      disabled={submitLoading}
                      className="px-6 py-3 text-sm font-medium text-gray-300 hover:text-white transition-colors bg-gray-700/50 hover:bg-gray-600/50 rounded-xl border border-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={submitLoading}
                      className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-teal-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {submitLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          {editingSubCategory ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        <>
                          <Check size={20} />
                          {editingSubCategory ? 'Update Sub-Category' : 'Create Sub-Category'}
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
    </div>
  );
};

export default SubCategories;
