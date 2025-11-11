import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = 'http://localhost:8000/api/products';
const CATEGORIES_API_URL = 'http://localhost:8000/api/categories';
const BRANDS_API_URL = 'http://localhost:8000/api/brands';
const SUBCATEGORIES_API_URL = 'http://localhost:8000/api/sub-categories';
const SUBITEMS_API_URL = 'http://localhost:8000/api/sub-items';
const UNITS_API_URL = 'http://localhost:8000/api/units';
const PRODUCT_TYPES_API_URL = 'http://localhost:8000/api/product-types';

const Product = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [subItems, setSubItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    specifications: '',
    status: true,
    category_id: '',
    brand_id: '',
    sub_category_id: '',
    sub_item_id: '',
    unit_id: '',
    product_type_id: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 12,
    total: 0
  });

  // Fetch products with pagination
  const fetchProducts = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.per_page,
        ...(search && { search })
      };

      const response = await axios.get(API_URL, { params });
      const data = response.data;

      setProducts(data.data || []);
      setPagination({
        current_page: data.current_page || page,
        last_page: data.last_page || 1,
        total: data.total || 0,
        per_page: data.per_page || pagination.per_page
      });
      setError('');
    } catch (err) {
      setError('Failed to fetch products. Please try again.');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all related data
  const fetchRelatedData = async () => {
    try {
      const [
        categoriesRes,
        brandsRes,
        subCategoriesRes,
        subItemsRes,
        unitsRes,
        productTypesRes
      ] = await Promise.all([
        axios.get(CATEGORIES_API_URL),
        axios.get(BRANDS_API_URL),
        axios.get(SUBCATEGORIES_API_URL),
        axios.get(SUBITEMS_API_URL),
        axios.get(UNITS_API_URL),
        axios.get(PRODUCT_TYPES_API_URL)
      ]);

      setCategories(categoriesRes.data.data || categoriesRes.data || []);
      setBrands(brandsRes.data.data || brandsRes.data || []);
      setSubCategories(subCategoriesRes.data.data || subCategoriesRes.data || []);
      setSubItems(subItemsRes.data.data || subItemsRes.data || []);
      setUnits(unitsRes.data.data || unitsRes.data || []);
      setProductTypes(productTypesRes.data.data || productTypesRes.data || []);
    } catch (err) {
      console.error('Error fetching related data:', err);
    }
  };

  useEffect(() => {
    fetchProducts(1);
    fetchRelatedData();
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts(1, searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      fetchProducts(newPage, searchTerm);
    }
  };

  // Handle limit change
  const handleLimitChange = (newLimit) => {
    setPagination(prev => ({ ...prev, per_page: parseInt(newLimit) }));
    fetchProducts(1, searchTerm);
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

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }

    // Clear image errors
    if (formErrors.image) {
      setFormErrors(prev => ({ ...prev, image: '' }));
    }
  };

  // Remove image preview
  const removeImagePreview = () => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image: null }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      specifications: '',
      status: true,
      category_id: '',
      brand_id: '',
      sub_category_id: '',
      sub_item_id: '',
      unit_id: '',
      product_type_id: '',
      image: null
    });
    setImagePreview(null);
    setEditingProduct(null);
    setFormErrors({});
  };

  // Open modal for create/edit
  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || '',
        description: product.description || '',
        specifications: product.specifications || '',
        status: product.status ?? true,
        category_id: product.category_id || '',
        brand_id: product.brand_id || '',
        sub_category_id: product.sub_category_id || '',
        sub_item_id: product.sub_item_id || '',
        unit_id: product.unit_id || '',
        product_type_id: product.product_type_id || '',
        image: null
      });
      setImagePreview(product.image ? `http://localhost:8000/${product.image}` : null);
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
      const submitData = new FormData();

      // Append form data
      submitData.append('name', formData.name.trim());
      submitData.append('description', formData.description.trim());
      submitData.append('specifications', formData.specifications.trim());
      submitData.append('status', formData.status ? '1' : '0');
      submitData.append('category_id', formData.category_id);
      submitData.append('brand_id', formData.brand_id);
      submitData.append('sub_category_id', formData.sub_category_id);
      submitData.append('sub_item_id', formData.sub_item_id);
      submitData.append('unit_id', formData.unit_id);
      submitData.append('product_type_id', formData.product_type_id);

      // Append image
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      let response;
      if (editingProduct) {
        submitData.append('_method', 'PUT');
        response = await axios.post(`${API_URL}/${editingProduct.id}`, submitData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
          }
        });
      } else {
        response = await axios.post(API_URL, submitData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
          }
        });
      }

      if (response.data) {
        fetchProducts(pagination.current_page, searchTerm);
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
        setError(`Failed to ${editingProduct ? 'update' : 'create'} product. Please try again.`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Delete product
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/${id}`);
      // If we're on the last page and it's now empty, go to previous page
      if (products.length === 1 && pagination.current_page > 1) {
        fetchProducts(pagination.current_page - 1, searchTerm);
      } else {
        fetchProducts(pagination.current_page, searchTerm);
      }
    } catch (err) {
      setError('Failed to delete product. Please try again.');
      console.error('Error deleting product:', err);
    }
  };

  // Toggle product status
  const toggleStatus = async (product) => {
    try {
      const submitData = new FormData();
      submitData.append('name', product.name);
      submitData.append('description', product.description || '');
      submitData.append('specifications', product.specifications || '');
      submitData.append('category_id', product.category_id || '');
      submitData.append('brand_id', product.brand_id || '');
      submitData.append('sub_category_id', product.sub_category_id || '');
      submitData.append('sub_item_id', product.sub_item_id || '');
      submitData.append('unit_id', product.unit_id || '');
      submitData.append('product_type_id', product.product_type_id || '');
      submitData.append('status', product.status ? '0' : '1');
      submitData.append('_method', 'PUT');

      await axios.post(`${API_URL}/${product.id}`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        }
      });
      fetchProducts(pagination.current_page, searchTerm);
    } catch (err) {
      setError('Failed to update product status. Please try again.');
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
  if (loading && products.length === 0) {
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
                <div className="w-full h-48 bg-gray-700 rounded-lg mb-4"></div>
                <div className="flex justify-between mb-4">
                  <div className="h-6 bg-gray-700 rounded w-32"></div>
                  <div className="h-6 bg-gray-700 rounded w-12"></div>
                </div>
                <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
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
                Products Management
              </h1>
              <p className="text-gray-400">
                Manage your product catalog and inventory
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
              Add New Product
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
                placeholder="Search products by name or description..."
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
                    {products.filter(product => product.status).length}
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

        {/* Products Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8"
        >
          {products.map((product) => (
            <motion.div
              key={product.id}
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-gray-800 rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden border border-gray-700"
            >
              {/* Product Image */}
              {product.image && (
                <div className="h-48 bg-gray-700 overflow-hidden">
                  <img
                    src={`http://localhost:8000/${product.image}`}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-6">
                {/* Header with status */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-white truncate">
                      {product.name}
                    </h3>
                    {product.category && (
                      <p className="text-sm text-indigo-400 mt-1 truncate">
                        {product.category.name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStatus(product)}
                      className={`p-1 rounded-full transition-colors ${
                        product.status
                          ? 'text-green-400 hover:text-green-300'
                          : 'text-red-400 hover:text-red-300'
                      }`}
                    >
                      {product.status ? (
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
                      product.status
                        ? 'bg-green-900/50 text-green-400 border border-green-800'
                        : 'bg-red-900/50 text-red-400 border border-red-800'
                    }`}>
                      {product.status ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {product.description && (
                  <div className="mb-3">
                    <p className="text-gray-300 text-sm line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Related Information */}
                <div className="space-y-2 mb-4">
                  {product.brand && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <span className="text-gray-400">Brand:</span>
                      <span className="text-white">{product.brand.name}</span>
                    </div>
                  )}

                  {product.unit && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-400">Unit:</span>
                      <span className="text-white">{product.unit.name}</span>
                    </div>
                  )}

                  {product.product_type && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span className="text-gray-400">Type:</span>
                      <span className="text-white">{product.product_type.name}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openModal(product)}
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
                    onClick={() => handleDelete(product.id)}
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
        {products.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700">
                <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No products found</h3>
              <p className="text-gray-400 mb-8">
                {searchTerm
                  ? "No products match your search criteria. Try adjusting your search terms."
                  : "Get started by creating your first product."
                }
              </p>
              {!searchTerm && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openModal()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-indigo-500/25"
                >
                  Create Your First Product
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
              className="bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    {editingProduct ? 'Edit Product' : 'Create New Product'}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name Field */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-400 transition-all duration-200 ${
                          formErrors.name ? 'border-red-500' : 'border-gray-600'
                        }`}
                        placeholder="Enter product name"
                      />
                      {formErrors.name && (
                        <p className="text-red-400 text-sm mt-2">{formErrors.name}</p>
                      )}
                    </div>

                    {/* Category Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
                        Category
                      </label>
                      <select
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-400 transition-all duration-200 ${
                          formErrors.category_id ? 'border-red-500' : 'border-gray-600'
                        }`}
                      >
                        <option value="">Select Category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.category_id && (
                        <p className="text-red-400 text-sm mt-2">{formErrors.category_id}</p>
                      )}
                    </div>

                    {/* Brand Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
                        Brand
                      </label>
                      <select
                        name="brand_id"
                        value={formData.brand_id}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-400 transition-all duration-200 ${
                          formErrors.brand_id ? 'border-red-500' : 'border-gray-600'
                        }`}
                      >
                        <option value="">Select Brand</option>
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.brand_id && (
                        <p className="text-red-400 text-sm mt-2">{formErrors.brand_id}</p>
                      )}
                    </div>

                    {/* Sub Category Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
                        Sub Category
                      </label>
                      <select
                        name="sub_category_id"
                        value={formData.sub_category_id}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-400 transition-all duration-200 ${
                          formErrors.sub_category_id ? 'border-red-500' : 'border-gray-600'
                        }`}
                      >
                        <option value="">Select Sub Category</option>
                        {subCategories.map((subCategory) => (
                          <option key={subCategory.id} value={subCategory.id}>
                            {subCategory.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.sub_category_id && (
                        <p className="text-red-400 text-sm mt-2">{formErrors.sub_category_id}</p>
                      )}
                    </div>

                    {/* Sub Item Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
                        Sub Item
                      </label>
                      <select
                        name="sub_item_id"
                        value={formData.sub_item_id}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-400 transition-all duration-200 ${
                          formErrors.sub_item_id ? 'border-red-500' : 'border-gray-600'
                        }`}
                      >
                        <option value="">Select Sub Item</option>
                        {subItems.map((subItem) => (
                          <option key={subItem.id} value={subItem.id}>
                            {subItem.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.sub_item_id && (
                        <p className="text-red-400 text-sm mt-2">{formErrors.sub_item_id}</p>
                      )}
                    </div>

                    {/* Unit Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
                        Unit
                      </label>
                      <select
                        name="unit_id"
                        value={formData.unit_id}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-400 transition-all duration-200 ${
                          formErrors.unit_id ? 'border-red-500' : 'border-gray-600'
                        }`}
                      >
                        <option value="">Select Unit</option>
                        {units.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.unit_id && (
                        <p className="text-red-400 text-sm mt-2">{formErrors.unit_id}</p>
                      )}
                    </div>

                    {/* Product Type Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
                        Product Type
                      </label>
                      <select
                        name="product_type_id"
                        value={formData.product_type_id}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-400 transition-all duration-200 ${
                          formErrors.product_type_id ? 'border-red-500' : 'border-gray-600'
                        }`}
                      >
                        <option value="">Select Product Type</option>
                        {productTypes.map((productType) => (
                          <option key={productType.id} value={productType.id}>
                            {productType.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.product_type_id && (
                        <p className="text-red-400 text-sm mt-2">{formErrors.product_type_id}</p>
                      )}
                    </div>
                  </div>

                  {/* Description Field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-400 transition-all duration-200 resize-none ${
                        formErrors.description ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="Enter product description"
                    />
                    {formErrors.description && (
                      <p className="text-red-400 text-sm mt-2">{formErrors.description}</p>
                    )}
                  </div>

                  {/* Specifications Field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Specifications
                    </label>
                    <textarea
                      name="specifications"
                      value={formData.specifications}
                      onChange={handleInputChange}
                      rows="3"
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-400 transition-all duration-200 resize-none ${
                        formErrors.specifications ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="Enter product specifications"
                    />
                    {formErrors.specifications && (
                      <p className="text-red-400 text-sm mt-2">{formErrors.specifications}</p>
                    )}
                  </div>

                  {/* Image Upload Section */}
                  <div className={`bg-gray-700/50 rounded-xl p-4 border ${
                    formErrors.image ? 'border-red-500' : 'border-gray-600'
                  }`}>
                    <div className="flex justify-between items-center mb-4">
                      <label className="block text-sm font-semibold text-gray-300">
                        Product Image
                      </label>
                    </div>

                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-gray-500 transition-colors overflow-hidden">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-6 text-center">
                          <svg className="w-8 h-8 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm text-gray-400 mb-1">Click to upload image</p>
                          <p className="text-xs text-gray-500">PNG, JPG, JPEG, WEBP up to 2MB</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>

                    {imagePreview && (
                      <div className="mt-4 flex justify-center">
                        <button
                          type="button"
                          onClick={removeImagePreview}
                          className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Remove Image
                        </button>
                      </div>
                    )}

                    {formErrors.image && (
                      <p className="text-red-400 text-sm mt-2">{formErrors.image}</p>
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
                        Active Product
                      </label>
                      <p className="text-xs text-gray-400 mt-1">
                        Inactive products won't be available for sale
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
                      {editingProduct ? 'Update Product' : 'Create Product'}
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

export default Product;
