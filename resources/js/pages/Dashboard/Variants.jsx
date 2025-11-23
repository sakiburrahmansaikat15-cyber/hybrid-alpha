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
  Package,
  Tag,
  FileText,
  ToggleLeft,
  ToggleRight,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Layers,
  Box
} from 'lucide-react';

const API_URL = '/api/variants';

const VariantManagement = () => {
  const [variants, setVariants] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [formData, setFormData] = useState({
    product_id: '',
    name: '',
    value: '',
    description: '',
    status: 1
  });

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

  // Fetch variants and products
  const fetchVariants = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const params = {
        ...(pagination.per_page && { limit: pagination.per_page }),
        ...(search && { search })
      };

      const [variantsResponse, productsResponse] = await Promise.all([
        axios.get(API_URL, { params }),
        axios.get('/api/products') // Assuming you have a products endpoint
      ]);

      const variantsData = variantsResponse.data;
      const productsData = productsResponse.data;

      if (Array.isArray(variantsData)) {
        setVariants(variantsData);
        setPagination(prev => ({
          ...prev,
          total: variantsData.length,
          current_page: page
        }));
      } else if (variantsData && Array.isArray(variantsData.data)) {
        setVariants(variantsData.data);
        setPagination(prev => ({
          ...prev,
          current_page: variantsData.current_page || page,
          last_page: variantsData.last_page || 1,
          total: variantsData.total || variantsData.data.length,
          per_page: variantsData.per_page || prev.per_page
        }));
      } else {
        setVariants([]);
      }

      setProducts(Array.isArray(productsData) ? productsData : productsData?.data || []);
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
    fetchVariants(1);
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        searchVariants(searchTerm);
      } else {
        fetchVariants(1);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Search variants
  const searchVariants = async (query) => {
    if (!query.trim()) {
      fetchVariants(1);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/search`, {
        params: { search: query }
      });

      const data = response.data;
      setVariants(Array.isArray(data) ? data : []);
      setPagination(prev => ({ ...prev, total: data.length, current_page: 1 }));
    } catch (err) {
      const errorMsg = 'Error searching variants';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      fetchVariants(newPage, searchTerm);
    }
  };

  const handleLimitChange = (newLimit) => {
    setPagination(prev => ({ ...prev, per_page: parseInt(newLimit) }));
    fetchVariants(1, searchTerm);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'radio' ? parseInt(value) : value
    }));
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      name: '',
      value: '',
      description: '',
      status: 1
    });
    setEditingVariant(null);
    setError('');
  };

  const openModal = (variant = null) => {
    if (variant) {
      setEditingVariant(variant);
      setFormData({
        product_id: variant.product_id,
        name: variant.name,
        value: variant.value,
        description: variant.description || '',
        status: variant.status
      });
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

    // Validation
    if (!formData.product_id) {
      setError('Please select a product');
      setSubmitLoading(false);
      return;
    }
    if (!formData.name.trim()) {
      setError('Variant name is required');
      setSubmitLoading(false);
      return;
    }
    if (!formData.value.trim()) {
      setError('Variant value is required');
      setSubmitLoading(false);
      return;
    }

    try {
      let response;

      if (editingVariant) {
        response = await axios.put(`${API_URL}/${editingVariant.id}`, formData);
        showNotification('Variant updated successfully!', 'success');
      } else {
        response = await axios.post(API_URL, formData);
        showNotification('Variant created successfully!', 'success');
      }

      fetchVariants(pagination.current_page, searchTerm);
      closeModal();
    } catch (err) {
      const errorMessage = err.response?.data?.message ||
        `Failed to ${editingVariant ? 'update' : 'create'} variant. Please try again.`;
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      console.error('Error submitting form:', err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this variant? This action cannot be undone.')) {
      setDeleteConfirm(null);
      return;
    }

    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Variant deleted successfully!', 'success');
      fetchVariants(pagination.current_page, searchTerm);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete variant. Please try again.';
      showNotification(errorMsg, 'error');
      console.error('Error deleting variant:', err);
    }
    setDeleteConfirm(null);
  };

  const toggleStatus = async (variant) => {
    const newStatus = variant.status === 1 ? 0 : 1;

    try {
      await axios.put(`${API_URL}/${variant.id}`, {
        ...variant,
        status: newStatus
      });

      showNotification(`Variant ${newStatus === 1 ? 'activated' : 'deactivated'}!`, 'success');
      fetchVariants(pagination.current_page, searchTerm);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update variant status. Please try again.';
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
    total: variants.length,
    active: variants.filter(variant => variant.status === 1).length,
    inactive: variants.filter(variant => variant.status === 0).length
  };

  // Get product name by ID
  const getProductName = (productId) => {
    const product = products.find(p => p.id == productId);
    return product ? product.name : 'Unknown Product';
  };

  // Table loading skeleton
  if (loading && variants.length === 0) {
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
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                Variant Management
              </h1>
              <p className="text-gray-400 mt-2 text-lg">
                Manage product variants and their attributes
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openModal()}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-blue-500/25 flex items-center gap-3"
            >
              <Plus size={22} />
              Add New Variant
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
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40 hover:border-blue-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Variants</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Layers size={24} className="text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40 hover:border-blue-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Active Variants</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-xl">
                <Check size={24} className="text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40 hover:border-blue-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Inactive Variants</p>
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
                placeholder="Search variants by name, value, or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent backdrop-blur-sm transition-all duration-200"
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

        {/* Variants Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 overflow-hidden mb-8"
        >
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-700/30 bg-gray-800/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Variants List</h3>
              <span className="text-sm text-gray-400">
                {variants.length} {variants.length === 1 ? 'variant' : 'variants'} found
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/30">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Variant
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {variants.map((variant) => (
                  <motion.tr
                    key={variant.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-700/10 transition-colors duration-200 group"
                  >
                    {/* Variant Info */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                          <Tag size={20} className="text-blue-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-white group-hover:text-blue-100 transition-colors">
                            {variant.name}
                          </div>
                          <div className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                            <Package size={12} />
                            ID: #{variant.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Product Info */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="font-medium text-white">
                          {getProductName(variant.product_id)}
                        </div>
                        <div className="text-sm text-gray-400">
                          Product ID: {variant.product_id}
                        </div>
                      </div>
                    </td>

                    {/* Variant Details */}
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">Value:</span>
                          <span className="text-sm text-white bg-gray-700/50 px-2 py-1 rounded-md">
                            {variant.value}
                          </span>
                        </div>
                        {variant.description && (
                          <div className="flex items-start gap-2 text-sm text-gray-400 max-w-xs">
                            <FileText size={14} className="mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{variant.description}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatus(variant)}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                          variant.status === 1
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                        }`}
                      >
                        {variant.status === 1 ? (
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
                            onClick={() => openModal(variant)}
                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all duration-200"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setDeleteConfirm(variant.id)}
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
                              setActionMenu(actionMenu === variant.id ? null : variant.id);
                            }}
                            className="p-2 hover:bg-gray-600/50 rounded-lg transition-colors duration-200"
                          >
                            <MoreVertical size={18} />
                          </button>

                          <AnimatePresence>
                            {actionMenu === variant.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute right-0 top-10 z-10 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl min-w-[160px] py-2 backdrop-blur-sm"
                              >
                                <button
                                  onClick={() => openModal(variant)}
                                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 transition-colors duration-200"
                                >
                                  <Edit size={16} />
                                  Edit
                                </button>
                                <button
                                  onClick={() => toggleStatus(variant)}
                                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 transition-colors duration-200"
                                >
                                  {variant.status === 1 ? <X size={16} /> : <Check size={16} />}
                                  {variant.status === 1 ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(variant.id)}
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
          {variants.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-800/40 rounded-full flex items-center justify-center border border-gray-700/40">
                  <Layers size={48} className="text-gray-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  {searchTerm ? 'No variants found' : 'No variants yet'}
                </h3>
                <p className="text-gray-400 text-lg mb-8">
                  {searchTerm
                    ? "Try adjusting your search terms to find what you're looking for."
                    : "Get started by creating your first variant."
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
                    Create Your First Variant
                  </motion.button>
                )}
              </div>
            </div>
          )}
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
              {Math.min(pagination.current_page * pagination.per_page, variants.length)} of{' '}
              {variants.length} entries
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
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25'
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
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700/50 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                    {editingVariant ? 'Edit Variant' : 'Create New Variant'}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-gray-700/50"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Product Selection */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
                        Product *
                      </label>
                      <select
                        name="product_id"
                        value={formData.product_id}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-white placeholder-gray-400 transition-all duration-200 backdrop-blur-sm"
                      >
                        <option value="">Select a product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Variant Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
                        Variant Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-white placeholder-gray-400 transition-all duration-200 backdrop-blur-sm"
                        placeholder="e.g., Color, Size, Material"
                      />
                    </div>

                    {/* Variant Value */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
                        Variant Value *
                      </label>
                      <input
                        type="text"
                        name="value"
                        value={formData.value}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-white placeholder-gray-400 transition-all duration-200 backdrop-blur-sm"
                        placeholder="e.g., Red, Large, Cotton"
                      />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-white placeholder-gray-400 transition-all duration-200 backdrop-blur-sm"
                        placeholder="Enter variant description (optional)"
                      />
                    </div>

                    {/* Status */}
                    <div className="md:col-span-2">
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
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {submitLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          {editingVariant ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        <>
                          <Check size={20} />
                          {editingVariant ? 'Update Variant' : 'Create Variant'}
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
                <h3 className="text-xl font-bold text-white mb-2">Delete Variant</h3>
                <p className="text-gray-400 mb-6">
                  Are you sure you want to delete this variant? This action cannot be undone.
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
                  disabled={submitLoading}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Trash2 size={16} />
                  )}
                  {submitLoading ? 'Deleting...' : 'Delete'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VariantManagement;
