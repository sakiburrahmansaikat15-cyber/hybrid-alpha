import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = 'http://localhost:8000/api/product-types';

const ProductType = () => {
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProductType, setEditingProductType] = useState(null);
  const [formData, setFormData] = useState({
    type: '',
    status: true,
    meta: {}
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 12,
    total: 0
  });

  // Fetch product types with pagination
  const fetchProductTypes = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      const data = response.data;

      let filteredData = data.data || [];

      // Client-side search since the API doesn't support search
      if (search) {
        filteredData = filteredData.filter(item =>
          item.type.toLowerCase().includes(search.toLowerCase())
        );
      }

      setProductTypes(filteredData);
      setPagination(prev => ({
        ...prev,
        current_page: page,
        last_page: 1,
        total: filteredData.length,
        per_page: filteredData.length
      }));
      setError('');
    } catch (err) {
      setError('Failed to fetch product types. Please try again.');
      console.error('Error fetching product types:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductTypes(1);
  }, []);

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

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle meta field changes
  const handleMetaChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      meta: {
        ...prev.meta,
        [key]: value
      }
    }));
  };

  // Add new meta field
  const addMetaField = () => {
    const newKey = `key_${Date.now()}`;
    setFormData(prev => ({
      ...prev,
      meta: {
        ...prev.meta,
        [newKey]: ''
      }
    }));
  };

  // Remove meta field
  const removeMetaField = (key) => {
    setFormData(prev => {
      const newMeta = { ...prev.meta };
      delete newMeta[key];
      return {
        ...prev,
        meta: newMeta
      };
    });
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      type: '',
      status: true,
      meta: {}
    });
    setEditingProductType(null);
    setFormErrors({});
  };

  // Open modal for create/edit
  const openModal = (productType = null) => {
    if (productType) {
      setEditingProductType(productType);
      setFormData({
        type: productType.type || '',
        status: productType.status ?? true,
        meta: productType.meta || {}
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

  // Submit form (create/update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});
    setError('');

    try {
      const submitData = {
        type: formData.type.trim(),
        status: formData.status,
        meta: Object.keys(formData.meta).length > 0 ? formData.meta : null
      };

      let response;
      if (editingProductType) {
        response = await axios.put(`${API_URL}/${editingProductType.id}`, submitData, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
      } else {
        response = await axios.post(API_URL, submitData, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
      }

      if (response.data.success) {
        fetchProductTypes(pagination.current_page, searchTerm);
        closeModal();
        setError('');
      }
    } catch (err) {
      console.error('Error submitting form:', err);

      if (err.response?.status === 422) {
        // Handle validation errors
        const validationErrors = err.response.data.errors || {};
        const formattedErrors = {};

        Object.keys(validationErrors).forEach(key => {
          formattedErrors[key] = Array.isArray(validationErrors[key])
            ? validationErrors[key][0]
            : validationErrors[key];
        });

        setFormErrors(formattedErrors);
        setError('Please fix the form errors below.');
      } else {
        setError(`Failed to ${editingProductType ? 'update' : 'create'} product type. Please try again.`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Delete product type
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product type? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchProductTypes(pagination.current_page, searchTerm);
    } catch (err) {
      setError('Failed to delete product type. Please try again.');
      console.error('Error deleting product type:', err);
    }
  };

  // Toggle product type status
  const toggleStatus = async (productType) => {
    try {
      const submitData = {
        type: productType.type,
        status: !productType.status,
        meta: productType.meta || null
      };

      await axios.put(`${API_URL}/${productType.id}`, submitData, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      fetchProductTypes(pagination.current_page, searchTerm);
    } catch (err) {
      setError('Failed to update product type status. Please try again.');
      console.error('Error updating status:', err);
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
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <div className="h-8 bg-gray-800 rounded w-64 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-800 rounded w-48 animate-pulse"></div>
              </div>
              <div className="h-12 bg-gray-800 rounded-lg w-40 animate-pulse"></div>
            </div>
          </div>

          {/* Search Skeleton */}
          <div className="mb-6">
            <div className="h-12 bg-gray-800 rounded-lg w-96 animate-pulse"></div>
          </div>

          {/* Cards Skeleton */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-gray-800 rounded-xl p-6 animate-pulse">
                <div className="flex justify-between mb-4">
                  <div className="h-6 bg-gray-700 rounded w-32"></div>
                  <div className="h-6 bg-gray-700 rounded w-12"></div>
                </div>
                <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="flex justify-between mt-6 pt-4 border-t border-gray-700">
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
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Product Types Management
              </h1>
              <p className="text-gray-400">
                Manage product types and their metadata
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openModal()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-indigo-500/25 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Product Type
            </motion.button>
          </div>
        </motion.div>

        {/* Search and Controls */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search product types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-400 transition-all duration-200"
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="bg-gray-800 rounded-xl px-4 py-3 border border-gray-700">
                <span className="text-sm text-gray-400">
                  Total: <span className="font-semibold text-white">{pagination.total}</span>
                </span>
              </div>
              <div className="bg-gray-800 rounded-xl px-4 py-3 border border-gray-700">
                <span className="text-sm text-gray-400">
                  Active: <span className="font-semibold text-green-400">
                    {productTypes.filter(type => type.status).length}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-4 py-3 border border-gray-700">
                <span className="text-sm text-gray-400">Show:</span>
                <select
                  value={pagination.per_page}
                  onChange={(e) => handleLimitChange(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-white text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="8">8</option>
                  <option value="12">12</option>
                  <option value="24">24</option>
                  <option value="48">48</option>
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
                <svg className="h-5 w-5 text-red-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-200 text-sm">{error}</span>
                <button
                  onClick={() => setError('')}
                  className="ml-auto text-red-400 hover:text-red-300 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
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
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8"
        >
          {productTypes.map((productType) => (
            <motion.div
              key={productType.id}
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-gray-800 rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden border border-gray-700"
            >
              <div className="p-6">
                {/* Header with status */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white truncate pr-2">
                    {productType.type}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStatus(productType)}
                      className={`p-1 rounded-full transition-colors ${
                        productType.status
                          ? 'text-green-400 hover:text-green-300'
                          : 'text-red-400 hover:text-red-300'
                      }`}
                    >
                      {productType.status ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      productType.status
                        ? 'bg-green-900/50 text-green-400 border border-green-800'
                        : 'bg-red-900/50 text-red-400 border border-red-800'
                    }`}>
                      {productType.status ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>

                {/* Meta Information */}
                {productType.meta && Object.keys(productType.meta).length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h4 className="text-sm font-semibold text-gray-300">Meta Data</h4>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(productType.meta).slice(0, 3).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 truncate">{key}:</span>
                          <span className="text-white truncate ml-2">{String(value)}</span>
                        </div>
                      ))}
                      {Object.keys(productType.meta).length > 3 && (
                        <div className="text-xs text-gray-400 text-center">
                          +{Object.keys(productType.meta).length - 3} more fields
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Created Date */}
                <div className="text-sm text-gray-400 mb-6">
                  Created: {new Date(productType.created_at).toLocaleDateString()}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openModal(productType)}
                    className="text-indigo-400 hover:text-indigo-300 font-medium text-sm transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(productType.id)}
                    className="text-red-400 hover:text-red-300 font-medium text-sm transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </motion.button>
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
            className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4 border-t border-gray-700"
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
                className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                  pagination.current_page === 1
                    ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500'
                }`}
              >
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
                        className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                          pagination.current_page === page
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
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
                className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                  pagination.current_page === pagination.last_page
                    ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500'
                }`}
              >
                Next
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
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700">
                <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No product types found</h3>
              <p className="text-gray-400 mb-8">
                {searchTerm
                  ? "No product types match your search criteria. Try adjusting your search terms."
                  : "Get started by creating your first product type."
                }
              </p>
              {!searchTerm && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openModal()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-indigo-500/25"
                >
                  Create Your First Product Type
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
              className="bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    {editingProductType ? 'Edit Product Type' : 'Create New Product Type'}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Form Error Display */}
                {error && (
                  <div className="mb-6 bg-red-900/50 border border-red-700 rounded-xl p-4">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-red-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-red-200 text-sm">{error}</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Type Field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Product Type Name *
                    </label>
                    <input
                      type="text"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-400 transition-all duration-200 ${
                        formErrors.type ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="Enter product type name (e.g., Electronics, Clothing)"
                    />
                    {formErrors.type && (
                      <p className="text-red-400 text-sm mt-2">{formErrors.type}</p>
                    )}
                  </div>

                  {/* Meta Fields Section */}
                  <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                    <div className="flex justify-between items-center mb-4">
                      <label className="block text-sm font-semibold text-gray-300">
                        Meta Data (Optional)
                      </label>
                      <button
                        type="button"
                        onClick={addMetaField}
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Field
                      </button>
                    </div>

                    {Object.keys(formData.meta).length === 0 ? (
                      <div className="text-center py-4 text-gray-400 text-sm">
                        No meta fields added. Click "Add Field" to add custom metadata.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(formData.meta).map(([key, value]) => (
                          <div key={key} className="flex gap-2 items-start">
                            <input
                              type="text"
                              value={key}
                              onChange={(e) => {
                                const newKey = e.target.value;
                                const newMeta = { ...formData.meta };
                                const oldValue = newMeta[key];
                                delete newMeta[key];
                                newMeta[newKey] = oldValue;
                                setFormData(prev => ({ ...prev, meta: newMeta }));
                              }}
                              placeholder="Key"
                              className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500"
                            />
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => handleMetaChange(key, e.target.value)}
                              placeholder="Value"
                              className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={() => removeMetaField(key)}
                              className="p-2 text-red-400 hover:text-red-300 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Status Field */}
                  <div className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-xl border border-gray-600">
                    <input
                      type="checkbox"
                      name="status"
                      checked={formData.status}
                      onChange={handleInputChange}
                      className="h-5 w-5 text-indigo-600 bg-gray-600 border-gray-500 rounded focus:ring-indigo-500"
                    />
                    <div>
                      <label className="block text-sm font-semibold text-white">
                        Active Product Type
                      </label>
                      <p className="text-xs text-gray-400 mt-1">
                        Inactive product types won't be available for selection
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-700">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={closeModal}
                      disabled={submitting}
                      className="px-6 py-3 text-sm font-medium text-gray-300 hover:text-white transition-colors bg-gray-700 hover:bg-gray-600 rounded-xl border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={submitting}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {submitting && (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {editingProductType ? 'Update Product Type' : 'Create Product Type'}
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

export default ProductType;
