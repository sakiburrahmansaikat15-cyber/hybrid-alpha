import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  X, 
  Save,
  Upload,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Image as ImageIcon,
  Tag,
  Layers,
  Building,
  Ruler,
  Type,
  Folder,
  Box
} from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [subItems, setSubItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    specifications: '',
    status: 1,
    category_id: '',
    brand_id: '',
    sub_category_id: '',
    sub_item_id: '',
    unit_id: '',
    product_type_id: '',
    image: null
  });
  const [errors, setErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [imagePreview, setImagePreview] = useState(null);
  const [apiError, setApiError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        productsRes, 
        categoriesRes, 
        brandsRes, 
        subCategoriesRes, 
        subItemsRes, 
        unitsRes, 
        productTypesRes
      ] = await Promise.all([
        axios.get('/api/products'),
        axios.get('/api/categories'),
        axios.get('/api/brands'),
        axios.get('/api/sub-categories'),
        axios.get('/api/sub-items'),
        axios.get('/api/units'),
        axios.get('/api/product-types')
      ]);
      
      // Handle different response structures
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : categoriesRes.data?.data || []);
      setBrands(Array.isArray(brandsRes.data) ? brandsRes.data : brandsRes.data?.data || []);
      setSubCategories(Array.isArray(subCategoriesRes.data) ? subCategoriesRes.data : subCategoriesRes.data?.data || []);
      setSubItems(Array.isArray(subItemsRes.data) ? subItemsRes.data : subItemsRes.data?.data || []);
      setUnits(Array.isArray(unitsRes.data) ? unitsRes.data : unitsRes.data?.data || []);
      setProductTypes(Array.isArray(productTypesRes.data) ? productTypesRes.data : productTypesRes.data?.data || []);
      
      setApiError('');
    } catch (error) {
      console.error('Error fetching data:', error);
      setApiError('Failed to fetch data. Please check your connection.');
      // Initialize empty arrays to prevent errors
      setProducts([]);
      setCategories([]);
      setBrands([]);
      setSubCategories([]);
      setSubItems([]);
      setUnits([]);
      setProductTypes([]);
    } finally {
      setLoading(false);
    }
  };

  // Search products
  const searchProducts = async (query) => {
    if (!query.trim()) {
      fetchData();
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/api/products/search?search=${encodeURIComponent(query)}`);
      setProducts(Array.isArray(response.data) ? response.data : []);
      setApiError('');
    } catch (error) {
      console.error('Error searching products:', error);
      setApiError('Error searching products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        searchProducts(searchTerm);
      } else {
        fetchData();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      const file = files[0];
      
      // Validate file type
      if (file && !file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          image: 'Please select a valid image file (JPG, JPEG, PNG, WebP)'
        }));
        return;
      }

      // Validate file size (max 2MB)
      if (file && file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          image: 'Image size should be less than 2MB'
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        image: file
      }));

      // Create image preview
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
        setErrors(prev => ({ ...prev, image: '' }));
      } else {
        setImagePreview(null);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (value === '1' ? 0 : 1) : value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear API error when user makes changes
    if (apiError) {
      setApiError('');
    }
  };

  // Validate form - Only name is required
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setApiError('');

    try {
      const submitData = new FormData();
      
      // Append all form data
      submitData.append('name', formData.name);
      submitData.append('status', formData.status);
      
      // Append optional fields only if they have values
      if (formData.description) submitData.append('description', formData.description);
      if (formData.specifications) submitData.append('specifications', formData.specifications);
      
      // Handle foreign keys - send empty string for null values
      submitData.append('category_id', formData.category_id || '');
      submitData.append('brand_id', formData.brand_id || '');
      submitData.append('sub_category_id', formData.sub_category_id || '');
      submitData.append('sub_item_id', formData.sub_item_id || '');
      submitData.append('unit_id', formData.unit_id || '');
      submitData.append('product_type_id', formData.product_type_id || '');
      
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      let response;
      
      if (selectedProduct) {
        // For update
        response = await axios.put(`/api/products/${selectedProduct.id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // For create
        response = await axios.post('/api/products', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setShowModal(false);
      resetForm();
      fetchData();
      alert(`Product ${selectedProduct ? 'updated' : 'created'} successfully!`);
      
    } catch (error) {
      console.error('Error saving product:', error);
      
      // Handle different error types
      if (error.response?.data?.errors) {
        // Laravel validation errors
        const serverErrors = error.response.data.errors;
        const formattedErrors = {};
        
        Object.keys(serverErrors).forEach(key => {
          formattedErrors[key] = serverErrors[key][0];
        });
        
        setErrors(formattedErrors);
        setApiError('Please fix the validation errors above.');
        
      } else if (error.response?.data?.message) {
        // Custom server error message
        setApiError(error.response.data.message);
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        setApiError('Network error. Please check your connection.');
      } else {
        setApiError(`Error ${selectedProduct ? 'updating' : 'creating'} product. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete product
  const handleDelete = async () => {
    if (!selectedProduct) return;

    setLoading(true);
    setApiError('');
    
    try {
      await axios.delete(`/api/products/${selectedProduct.id}`);
      
      setShowDeleteModal(false);
      setSelectedProduct(null);
      fetchData();
      alert('Product deleted successfully!');
      
    } catch (error) {
      console.error('Error deleting product:', error);
      
      if (error.response?.data?.message) {
        setApiError(error.response.data.message);
      } else {
        setApiError('Error deleting product. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Edit product
  const handleEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      specifications: product.specifications || '',
      status: product.status,
      category_id: product.category_id ? product.category_id.toString() : '',
      brand_id: product.brand_id ? product.brand_id.toString() : '',
      sub_category_id: product.sub_category_id ? product.sub_category_id.toString() : '',
      sub_item_id: product.sub_item_id ? product.sub_item_id.toString() : '',
      unit_id: product.unit_id ? product.unit_id.toString() : '',
      product_type_id: product.product_type_id ? product.product_type_id.toString() : '',
      image: null
    });
    setImagePreview(product.image ? `/${product.image}` : null);
    setErrors({});
    setApiError('');
    setShowModal(true);
  };

  // View product details
  const handleView = (product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      specifications: '',
      status: 1,
      category_id: '',
      brand_id: '',
      sub_category_id: '',
      sub_item_id: '',
      unit_id: '',
      product_type_id: '',
      image: null
    });
    setSelectedProduct(null);
    setImagePreview(null);
    setErrors({});
    setApiError('');
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    if (filterStatus !== 'all' && product.status !== (filterStatus === 'active' ? 1 : 0)) return false;
    if (filterCategory !== 'all' && product.category_id?.toString() !== filterCategory) return false;
    return true;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Safe rendering functions
  const renderSelectOptions = (items, placeholder = "Select an option") => {
    if (!Array.isArray(items) || items.length === 0) {
      return <option value="">No {placeholder.toLowerCase()} available</option>;
    }

    return [
      <option key="placeholder" value="">{placeholder}</option>,
      ...items.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name}
        </option>
      ))
    ];
  };

  const getRelationName = (product, relation) => {
    return product[relation]?.name || 'Not Set';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Package className="w-8 h-8 text-blue-500" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Products Management</h1>
        </div>
        <p className="text-gray-400 text-sm sm:text-base">Manage your products inventory and details</p>
      </div>

      {/* Error Alert */}
      {apiError && (
        <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-200 text-sm">{apiError}</p>
          </div>
          <button
            onClick={() => setApiError('')}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search, Filters and Add Button */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 text-sm sm:text-base"
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="relative">
              <Layers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="pl-10 pr-8 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm appearance-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {renderSelectOptions(categories, "Select Category")}
              </select>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 w-full lg:w-auto justify-center"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Add New Product</span>
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading && !products.length ? (
          // Loading skeleton
          Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gray-700 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-700 rounded flex-1"></div>
                <div className="h-8 bg-gray-700 rounded flex-1"></div>
                <div className="h-8 bg-gray-700 rounded flex-1"></div>
              </div>
            </div>
          ))
        ) : (
          currentProducts.map((product) => (
            <div key={product.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10">
              <div className="flex items-center gap-3 mb-3">
                {product.image ? (
                  <img
                    src={`/${product.image}`}
                    alt={product.name}
                    className="w-12 h-12 rounded-lg object-cover border border-gray-600"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-700 border border-gray-600 flex items-center justify-center">
                    <Package className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{product.name}</h3>
                  <p className="text-gray-400 text-sm truncate">{getRelationName(product, 'category')}</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Brand:</span>
                  <span className="text-gray-300">{getRelationName(product, 'brand')}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-gray-300">{getRelationName(product, 'productType')}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Unit:</span>
                  <span className="text-gray-300">{getRelationName(product, 'unit')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  product.status 
                    ? 'bg-green-900 text-green-200' 
                    : 'bg-red-900 text-red-200'
                }`}>
                  {product.status ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 mr-1" />
                      Inactive
                    </>
                  )}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleView(product)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs transition-colors duration-200"
                  title="View Details"
                >
                  <Eye className="w-3 h-3" />
                  View
                </button>
                <button
                  onClick={() => handleEdit(product)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors duration-200"
                  title="Edit Product"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setSelectedProduct(product);
                    setShowDeleteModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors duration-200"
                  title="Delete Product"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Empty State */}
      {products.length === 0 && !loading && (
        <div className="text-center py-12">
          <Package className="mx-auto h-16 w-16 text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">No products found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterStatus !== 'all' || filterCategory !== 'all' 
              ? 'Try adjusting your search or filter terms' 
              : 'Get started by creating your first product'
            }
          </p>
          {!searchTerm && filterStatus === 'all' && filterCategory === 'all' && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              <Plus className="w-4 h-4" />
              Create Your First Product
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {filteredProducts.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
          <div className="text-sm text-gray-400">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length} results
          </div>
          <div className="flex gap-1 sm:gap-2 flex-wrap justify-center">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => paginate(page)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-700">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                {selectedProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-300 transition-colors duration-200"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Basic Info */}
                <div className="space-y-4">
                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Product Image
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="h-24 w-24 rounded-lg object-cover border-2 border-gray-600"
                          />
                        ) : (
                          <div className="h-24 w-24 rounded-lg bg-gray-700 border-2 border-dashed border-gray-600 flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition-colors duration-200 text-sm">
                          <Upload className="w-4 h-4" />
                          Upload Image
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleInputChange}
                            className="hidden"
                          />
                        </label>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP up to 2MB</p>
                        {errors.image && (
                          <p className="mt-1 text-xs text-red-400">{errors.image}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Basic Information
                    </h3>

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 text-sm ${
                          errors.name ? 'border-red-500' : 'border-gray-600'
                        }`}
                        placeholder="Enter product name"
                        maxLength={255}
                      />
                      {errors.name && (
                        <p className="mt-1 text-xs text-red-400">{errors.name}</p>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 text-sm"
                        placeholder="Enter product description"
                      />
                    </div>

                    {/* Specifications */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Specifications
                      </label>
                      <textarea
                        name="specifications"
                        value={formData.specifications}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 text-sm"
                        placeholder="Enter product specifications"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column - Optional Relationships */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Product Relationships (Optional)
                  </h3>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Category
                    </label>
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                    >
                      {renderSelectOptions(categories, "Select Category (Optional)")}
                    </select>
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Brand
                    </label>
                    <select
                      name="brand_id"
                      value={formData.brand_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                    >
                      {renderSelectOptions(brands, "Select Brand (Optional)")}
                    </select>
                  </div>

                  {/* Sub-category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <Folder className="w-4 h-4" />
                      Sub-category
                    </label>
                    <select
                      name="sub_category_id"
                      value={formData.sub_category_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                    >
                      {renderSelectOptions(subCategories, "Select Sub-category (Optional)")}
                    </select>
                  </div>

                  {/* Sub-item */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <Box className="w-4 h-4" />
                      Sub-item
                    </label>
                    <select
                      name="sub_item_id"
                      value={formData.sub_item_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                    >
                      {renderSelectOptions(subItems, "Select Sub-item (Optional)")}
                    </select>
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <Ruler className="w-4 h-4" />
                      Unit
                    </label>
                    <select
                      name="unit_id"
                      value={formData.unit_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                    >
                      {renderSelectOptions(units, "Select Unit (Optional)")}
                    </select>
                  </div>

                  {/* Product Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      Product Type
                    </label>
                    <select
                      name="product_type_id"
                      value={formData.product_type_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                    >
                      {renderSelectOptions(productTypes, "Select Product Type (Optional)")}
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="status"
                        checked={formData.status === 1}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="ml-2 text-sm text-gray-300">Active Product</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-6 mt-6 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {selectedProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Product Modal */}
      {showViewModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-700">
              <h2 className="text-lg sm:text-xl font-semibold text-white">Product Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-300 transition-colors duration-200"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Image */}
                <div className="md:col-span-1">
                  {selectedProduct.image ? (
                    <img
                      src={`/${selectedProduct.image}`}
                      alt={selectedProduct.name}
                      className="w-full h-48 object-cover rounded-lg border border-gray-600"
                    />
                  ) : (
                    <div className="w-full h-48 rounded-lg bg-gray-700 border border-gray-600 flex items-center justify-center">
                      <Package className="w-12 h-12 text-gray-500" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{selectedProduct.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedProduct.status 
                        ? 'bg-green-900 text-green-200' 
                        : 'bg-red-900 text-red-200'
                    }`}>
                      {selectedProduct.status ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {selectedProduct.description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-1">Description</h4>
                      <p className="text-gray-400 text-sm">{selectedProduct.description}</p>
                    </div>
                  )}

                  {selectedProduct.specifications && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-1">Specifications</h4>
                      <p className="text-gray-400 text-sm whitespace-pre-wrap">{selectedProduct.specifications}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                    <div>
                      <p className="text-xs text-gray-400">Category</p>
                      <p className="text-sm text-white">{getRelationName(selectedProduct, 'category')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Brand</p>
                      <p className="text-sm text-white">{getRelationName(selectedProduct, 'brand')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Sub-category</p>
                      <p className="text-sm text-white">{getRelationName(selectedProduct, 'subCategory')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Sub-item</p>
                      <p className="text-sm text-white">{getRelationName(selectedProduct, 'subItem')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Unit</p>
                      <p className="text-sm text-white">{getRelationName(selectedProduct, 'unit')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Product Type</p>
                      <p className="text-sm text-white">{getRelationName(selectedProduct, 'productType')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-sm w-full p-4 sm:p-6">
            <div className="text-center">
              <Trash2 className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-red-500" />
              <h3 className="mt-3 text-lg font-medium text-white">Delete Product</h3>
              <p className="mt-2 text-sm text-gray-400">
                Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;