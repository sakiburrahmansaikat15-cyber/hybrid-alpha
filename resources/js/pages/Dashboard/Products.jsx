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
  Box,
  UploadCloud,
  Shield,
  ShieldOff,
  RefreshCw,
  BarChart3,
  Settings,
  DollarSign,
  Hash,
  ShoppingCart
} from 'lucide-react';

// Custom hook for debounce
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Product Card Component
const ProductCard = ({
  product,
  onEdit,
  onDelete,
  onView,
  onToggleStatus,
  actionLoading
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-500 border-2 border-gray-700/80 hover:border-gray-600/80 hover:shadow-2xl hover:scale-105 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image */}
      <div className="relative h-48 w-full bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
        {product.image ? (
          <>
            <img
              src={`/${product.image}`}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
              loading="lazy"
            />
            <div
              className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-500 flex items-center justify-center cursor-pointer"
              onClick={() => onView(product)}
            >
              <div className="transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 border border-white/30">
                  <Eye className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 group">
            <div className="relative">
              <Package className="w-12 h-12 mb-3 opacity-50 group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500" />
            </div>
            <span className="text-sm font-medium">No Image</span>
          </div>
        )}

        {/* Status Badge */}
        <div
          className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold shadow-2xl backdrop-blur-sm border transition-all duration-300 ${
            product.status === 'active'
              ? "bg-green-500/20 text-green-300 border-green-500/40 hover:bg-green-500/30"
              : "bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30"
          } transform hover:scale-105`}
        >
          {product.status === 'active' ? (
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              Active
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              Inactive
            </div>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-5 relative">
        <h3 className="font-bold text-white text-lg mb-3 line-clamp-2 leading-tight flex items-center gap-3 group-hover:text-blue-100 transition-colors duration-300">
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <Package className="w-4 h-4 text-blue-400" />
          </div>
          {product.name}
        </h3>

        <div className="text-gray-400 text-sm mb-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gray-700/50 rounded-lg">
              <Layers className="w-3.5 h-3.5 text-gray-300" />
            </div>
            <div>
              <span className="text-gray-500 text-xs">Category</span>
              <div className="text-gray-300 font-medium">
                {product.category?.name || 'No Category'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gray-700/50 rounded-lg">
              <Type className="w-3.5 h-3.5 text-gray-300" />
            </div>
            <div>
              <span className="text-gray-500 text-xs">Type</span>
              <div className="text-gray-300 font-medium">
                {product.product_type?.name || 'No Type'}
              </div>
            </div>
          </div>
        </div>

        {/* Description Preview */}
        {product.description && (
          <div className="mb-4 p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
            <p className="text-gray-400 text-xs line-clamp-2">{product.description}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-700/50">
          <div className="flex gap-2">
            <button
              onClick={() => onView(product)}
              className="p-2.5 text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500/20 rounded-xl transition-all duration-300 hover:scale-110 group/btn border border-blue-500/20 hover:border-blue-500/40"
              title="View Details"
            >
              <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
            </button>
            <button
              onClick={() => onEdit(product)}
              className="p-2.5 text-green-400 hover:text-white bg-green-500/10 hover:bg-green-500/20 rounded-xl transition-all duration-300 hover:scale-110 group/btn border border-green-500/20 hover:border-green-500/40"
              title="Edit Product"
            >
              <Edit className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onToggleStatus(product)}
              disabled={actionLoading}
              className={`p-2.5 rounded-xl transition-all duration-300 hover:scale-110 disabled:opacity-50 border backdrop-blur-sm ${
                product.status === 'active'
                  ? "bg-red-500/10 text-red-300 hover:bg-red-500/20 border-red-500/30 hover:border-red-500/50"
                  : "bg-green-500/10 text-green-300 hover:bg-green-500/20 border-green-500/30 hover:border-green-500/50"
              }`}
              title={product.status === 'active' ? "Deactivate" : "Activate"}
            >
              {actionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : product.status === 'active' ? (
                <ShieldOff className="w-4 h-4" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => onDelete(product)}
              className="p-2.5 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all duration-300 hover:scale-110 group/btn border border-red-500/20 hover:border-red-500/40"
              title="Delete Product"
            >
              <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  );
};

// Image Preview Component
const ImagePreview = ({ image, onRemove, isEditing = false }) => {
  if (!image) return null;

  return (
    <div className="mt-4">
      <div className="relative group bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-700 hover:border-blue-500/50 transition-all duration-300">
        <div className="relative overflow-hidden rounded-lg bg-gray-900">
          <img
            src={image.preview}
            alt="Preview"
            className="w-full h-32 object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <div className="mt-3 space-y-2">
          <div className="text-xs font-medium text-gray-200 truncate">
            {image.name}
          </div>
          <div className="text-xs text-gray-500 flex justify-between items-center">
            <span className="bg-gray-700 px-2 py-1 rounded-md">{image.size}</span>
            <span className="text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md">{image.type}</span>
          </div>
        </div>
        {isEditing && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg border border-red-400/30"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

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
    specification: '',
    status: 'active',
    cat_id: '',
    brand_id: '',
    sub_cat_id: '',
    sub_item_id: '',
    unit_id: '',
    product_type_id: '',
    image: null
  });
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [apiError, setApiError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 8,
    total_items: 0,
    total_pages: 1
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch products with pagination and search
  const fetchProducts = async (page = 1, limit = 8, keyword = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (keyword) {
        params.append('keyword', keyword);
      }

      const response = await axios.get(`/api/products?${params}`);
      
      if (response.data && response.data.data) {
        setProducts(response.data.data);
        setPagination({
          current_page: response.data.current_page,
          per_page: response.data.per_page,
          total_items: response.data.total_items,
          total_pages: response.data.total_pages
        });
      } else {
        setProducts([]);
      }
      setApiError('');
    } catch (error) {
      console.error('Error fetching products:', error);
      setApiError('Failed to fetch products. Please check your connection.');
      setProducts([]);
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
        axios.get('/api/categories').catch(() => ({ data: [] })),
        axios.get('/api/brands').catch(() => ({ data: [] })),
        axios.get('/api/sub-categories').catch(() => ({ data: [] })),
        axios.get('/api/sub-items').catch(() => ({ data: [] })),
        axios.get('/api/units').catch(() => ({ data: [] })),
        axios.get('/api/product-types').catch(() => ({ data: [] }))
      ]);

      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : categoriesRes.data?.data || []);
      setBrands(Array.isArray(brandsRes.data) ? brandsRes.data : brandsRes.data?.data || []);
      setSubCategories(Array.isArray(subCategoriesRes.data) ? subCategoriesRes.data : subCategoriesRes.data?.data || []);
      setSubItems(Array.isArray(subItemsRes.data) ? subItemsRes.data : subItemsRes.data?.data || []);
      setUnits(Array.isArray(unitsRes.data) ? unitsRes.data : unitsRes.data?.data || []);
      setProductTypes(Array.isArray(productTypesRes.data) ? productTypesRes.data : productTypesRes.data?.data || []);
    } catch (error) {
      console.error('Error fetching related data:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchRelatedData();
  }, []);

  useEffect(() => {
    fetchProducts(1, pagination.per_page, debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  // Show notification
  const showNotification = (message, type = "success") => {
    if (type === "success") {
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setApiError(message);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === 'file') {
      const file = files[0];

      if (file && !file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          image: 'Please select a valid image file (JPG, JPEG, PNG, WebP)'
        }));
        return;
      }

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

      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview({
          preview: e.target.result,
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + "MB",
          type: file.type.split('/')[1]?.toUpperCase() || 'IMAGE'
        });
        reader.readAsDataURL(file);
        setErrors(prev => ({ ...prev, image: '' }));
      } else {
        setImagePreview(null);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    if (apiError) {
      setApiError('');
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const event = { target: { files: [file] } };
      handleInputChange(event);
    }
  };

  // Validate form
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

      // Append all form data according to API structure
      submitData.append('name', formData.name);
      submitData.append('status', formData.status);

      // Append optional fields only if they have values
      if (formData.description) submitData.append('description', formData.description);
      if (formData.specification) submitData.append('specification', formData.specification);

      // Append foreign keys - send empty string for null values
      submitData.append('cat_id', formData.cat_id || '');
      submitData.append('brand_id', formData.brand_id || '');
      submitData.append('sub_cat_id', formData.sub_cat_id || '');
      submitData.append('sub_item_id', formData.sub_item_id || '');
      submitData.append('unit_id', formData.unit_id || '');
      submitData.append('product_type_id', formData.product_type_id || '');

      if (formData.image) {
        submitData.append('image', formData.image);
      }

      let response;

      if (selectedProduct) {
        // For update - using POST as per your API route
        response = await axios.post(`/api/products/${selectedProduct.id}`, submitData, {
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
      fetchProducts(pagination.current_page, pagination.per_page, searchTerm);
      showNotification(`Product ${selectedProduct ? 'updated' : 'created'} successfully!`);

    } catch (error) {
      console.error('Error saving product:', error);

      if (error.response?.data?.errors) {
        const serverErrors = error.response.data.errors;
        const formattedErrors = {};

        Object.keys(serverErrors).forEach(key => {
          formattedErrors[key] = serverErrors[key][0];
        });

        setErrors(formattedErrors);
        setApiError('Please fix the validation errors above.');
      } else if (error.response?.data?.message) {
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

    setActionLoading(true);
    setApiError('');

    try {
      await axios.delete(`/api/products/${selectedProduct.id}`);

      setShowDeleteModal(false);
      setSelectedProduct(null);
      fetchProducts(pagination.current_page, pagination.per_page, searchTerm);
      showNotification('Product deleted successfully!');

    } catch (error) {
      console.error('Error deleting product:', error);

      if (error.response?.data?.message) {
        setApiError(error.response.data.message);
      } else {
        setApiError('Error deleting product. Please try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle product status
  const toggleStatus = async (product) => {
    setActionLoading(true);
    try {
      const newStatus = product.status === 'active' ? 'inactive' : 'active';
      
      const submitData = new FormData();
      submitData.append('name', product.name);
      submitData.append('status', newStatus);
      if (product.description) submitData.append('description', product.description);
      if (product.specification) submitData.append('specification', product.specification);
      submitData.append('cat_id', product.cat_id || '');
      submitData.append('brand_id', product.brand_id || '');
      submitData.append('sub_cat_id', product.sub_cat_id || '');
      submitData.append('sub_item_id', product.sub_item_id || '');
      submitData.append('unit_id', product.unit_id || '');
      submitData.append('product_type_id', product.product_type_id || '');

      const response = await axios.post(
        `/api/products/${product.id}`,
        submitData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.data) {
        showNotification(`Product ${newStatus === 'active' ? "activated" : "deactivated"}!`);
        await fetchProducts(pagination.current_page, pagination.per_page, searchTerm);
      } else {
        throw new Error("Status update failed");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to update status!";
      showNotification(errorMsg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Edit product
  const handleEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      specification: product.specification || '',
      status: product.status,
      cat_id: product.cat_id ? product.cat_id.toString() : '',
      brand_id: product.brand_id ? product.brand_id.toString() : '',
      sub_cat_id: product.sub_cat_id ? product.sub_cat_id.toString() : '',
      sub_item_id: product.sub_item_id ? product.sub_item_id.toString() : '',
      unit_id: product.unit_id ? product.unit_id.toString() : '',
      product_type_id: product.product_type_id ? product.product_type_id.toString() : '',
      image: null
    });
    setImagePreview(product.image ? {
      preview: `/${product.image}`,
      name: 'Current image',
      size: 'Stored on server',
      type: 'EXISTING'
    } : null);
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
      specification: '',
      status: 'active',
      cat_id: '',
      brand_id: '',
      sub_cat_id: '',
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

  // Filter products (client-side filtering for status/category)
  const filteredProducts = products.filter(product => {
    if (filterStatus !== 'all' && product.status !== filterStatus) return false;
    if (filterCategory !== 'all' && product.cat_id?.toString() !== filterCategory) return false;
    return true;
  });

  // Pagination
  const paginate = (pageNumber) => {
    fetchProducts(pageNumber, pagination.per_page, searchTerm);
  };

  // Stats calculation
  const stats = {
    total: pagination.total_items,
    active: products.filter(p => p.status === 'active').length,
    inactive: products.filter(p => p.status === 'inactive').length,
    withImages: products.filter(p => p.image).length,
  };

  // Safe rendering functions
  const renderSelectOptions = (items, placeholder = "Select an option") => {
    if (!Array.isArray(items) || items.length === 0) {
      return <option value="">No {placeholder.toLowerCase()} available</option>;
    }

    return [
      <option key="placeholder" value="">{placeholder}</option>,
      ...items.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name || item.type || `ID: ${item.id}`}
        </option>
      ))
    ];
  };

  const getRelationName = (product, relationField) => {
    const relationMap = {
      cat_id: product.category,
      brand_id: product.brand,
      product_type_id: product.product_type,
      unit_id: product.unit,
      sub_cat_id: product.sub_category,
      sub_item_id: product.sub_item
    };

    const relation = relationMap[relationField];
    if (!relation) return 'Not Set';
    
    return relation.name || `ID: ${product[relationField]}`;
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image: null }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 text-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-3 flex items-center gap-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Package className="w-7 h-7 text-white" />
              </div>
              Product Management
              {loading && (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-2"></div>
              )}
            </h1>
            <p className="text-gray-400 flex items-center gap-2 text-sm">
              <Settings className="w-4 h-4" />
              Manage your products inventory and details • {stats.total} total products
            </p>
          </div>
          <button
            onClick={() => fetchProducts(pagination.current_page, pagination.per_page, searchTerm)}
            disabled={loading}
            className="px-5 py-3 bg-gray-800/80 hover:bg-gray-700/80 disabled:bg-gray-800 text-white rounded-xl font-medium flex items-center space-x-2 transition-all hover:scale-105 border border-gray-700 hover:border-gray-600 backdrop-blur-sm shadow-lg"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-3 mb-6">
        {apiError && (
          <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-between animate-fade-in backdrop-blur-sm shadow-lg">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-300">{apiError}</span>
            </div>
            <button
              onClick={() => setApiError('')}
              className="p-1 hover:bg-red-500/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center justify-between animate-fade-in backdrop-blur-sm shadow-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-300">{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              className="p-1 hover:bg-green-500/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:scale-105 shadow-xl group">
          <div className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
            {stats.total}
          </div>
          <div className="text-gray-400 text-sm font-medium">Total Products</div>
        </div>
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:scale-105 shadow-xl group">
          <div className="text-2xl font-bold text-green-400 flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20 group-hover:bg-green-500/20 transition-colors">
              <CheckCircle className="w-5 h-5" />
            </div>
            {stats.active}
          </div>
          <div className="text-gray-400 text-sm font-medium">Active Products</div>
        </div>
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:scale-105 shadow-xl group">
          <div className="text-2xl font-bold text-purple-400 flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
              <ShoppingCart className="w-5 h-5" />
            </div>
            {stats.withImages}
          </div>
          <div className="text-gray-400 text-sm font-medium">With Images</div>
        </div>
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:scale-105 shadow-xl group">
          <div className="text-2xl font-bold text-yellow-400 flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20 group-hover:bg-yellow-500/20 transition-colors">
              <Package className="w-5 h-5" />
            </div>
            {stats.inactive}
          </div>
          <div className="text-gray-400 text-sm font-medium">Inactive Products</div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/50 shadow-xl">
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-80 pl-12 pr-4 py-3.5 bg-gray-800/80 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all backdrop-blur-sm shadow-inner"
              />
            </div>

            <div className="flex gap-3 flex-wrap">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-10 pr-8 py-3.5 bg-gray-800/80 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm appearance-none cursor-pointer backdrop-blur-sm shadow-inner"
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
                  className="pl-10 pr-8 py-3.5 bg-gray-800/80 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm appearance-none cursor-pointer backdrop-blur-sm shadow-inner"
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
            className="flex-1 lg:flex-none px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all hover:scale-105 shadow-lg hover:shadow-blue-500/25 border border-blue-500/30"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Products Display */}
      <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl">
        {/* Header with counts */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="text-gray-400 text-sm font-medium flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Showing {filteredProducts.length} of {stats.total} products
            {debouncedSearchTerm && (
              <span className="text-blue-400 ml-3 flex items-center gap-1 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                <Search className="w-3 h-3" />
                Searching for "{debouncedSearchTerm}"
              </span>
            )}
          </div>
        </div>

        {loading && !products.length ? (
          // Loading skeleton
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-gray-800/50 rounded-2xl p-5 animate-pulse border border-gray-700/50">
                <div className="h-48 bg-gray-700 rounded-xl mb-4"></div>
                <div className="h-4 bg-gray-700 rounded mb-3"></div>
                <div className="h-3 bg-gray-700 rounded w-2/3 mb-4"></div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="h-8 bg-gray-700 rounded"></div>
                  <div className="h-8 bg-gray-700 rounded"></div>
                  <div className="h-8 bg-gray-700 rounded"></div>
                </div>
                <div className="flex gap-2">
                  <div className="h-10 bg-gray-700 rounded flex-1"></div>
                  <div className="h-10 bg-gray-700 rounded flex-1"></div>
                  <div className="h-10 bg-gray-700 rounded flex-1"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="relative inline-block mb-6">
              <Package className="w-20 h-20 mx-auto opacity-50" />
              <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-2xl" />
            </div>
            <p className="text-xl mb-3 font-semibold">
              {products.length === 0 ? "No products available" : "No matching products found"}
            </p>
            <p className="text-sm mb-8 max-w-md mx-auto text-gray-500">
              {searchTerm || filterStatus !== 'all' || filterCategory !== 'all'
                ? "Try adjusting your search criteria or filters to find what you're looking for."
                : "Get started by creating your first product to build your inventory."
              }
            </p>
            {products.length === 0 && (
              <button
                onClick={() => setShowModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all hover:scale-105 flex items-center gap-3 mx-auto shadow-lg hover:shadow-blue-500/25"
              >
                <Plus className="w-5 h-5" />
                Create Your First Product
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEdit}
                onDelete={(product) => {
                  setSelectedProduct(product);
                  setShowDeleteModal(true);
                }}
                onView={handleView}
                onToggleStatus={toggleStatus}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t border-gray-700/50">
            <div className="text-sm text-gray-400">
              Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total_items)} of {pagination.total_items} results
            </div>
            <div className="flex gap-1 sm:gap-2 flex-wrap justify-center">
              {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => paginate(page)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 ${
                    pagination.current_page === page
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-700/50 shadow-2xl">
            <div className="flex justify-between items-center p-8 border-b border-gray-700/50 sticky top-0 bg-gray-800/80 backdrop-blur-sm rounded-t-3xl">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                {selectedProduct ? (
                  <>
                    <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <Edit className="w-6 h-6 text-blue-400" />
                    </div>
                    Edit Product
                  </>
                ) : (
                  <>
                    <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                      <Plus className="w-6 h-6 text-green-400" />
                    </div>
                    Add New Product
                  </>
                )}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-3 hover:bg-gray-700/50 rounded-xl transition-all duration-300 hover:scale-110 border border-gray-600/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Basic Info */}
                <div className="space-y-6">
                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-4 flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                        <ImageIcon className="w-4 h-4 text-purple-400" />
                      </div>
                      Product Image
                    </label>
                    <div
                      className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 backdrop-blur-sm cursor-pointer ${
                        dragOver
                          ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10"
                          : "border-gray-700 hover:border-gray-600 bg-gray-800/50 hover:bg-gray-800/70"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('image-upload').click()}
                    >
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleInputChange}
                        className="hidden"
                        id="image-upload"
                        name="image"
                      />
                      <div className="flex flex-col items-center space-y-4">
                        <div className="p-4 bg-gray-700/50 rounded-2xl border border-gray-600/50">
                          <UploadCloud className="w-8 h-8 text-gray-300" />
                        </div>
                        <div className="space-y-2">
                          <span className="text-gray-300 font-semibold text-lg block">
                            Click to upload or drag and drop
                          </span>
                          <span className="text-gray-500 text-sm block">
                            JPG, PNG, WebP up to 2MB
                          </span>
                        </div>
                      </div>
                    </div>
                    {errors.image && (
                      <p className="mt-3 text-sm text-red-400 flex items-center space-x-2 bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.image}</span>
                      </p>
                    )}

                    {/* Image Preview */}
                    <ImagePreview
                      image={imagePreview}
                      onRemove={removeImage}
                      isEditing={!!selectedProduct}
                    />
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
                        className={`w-full px-4 py-3 bg-gray-800/80 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 text-sm backdrop-blur-sm ${
                          errors.name ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-700'
                        }`}
                        placeholder="Enter product name"
                        maxLength={255}
                      />
                      {errors.name && (
                        <p className="mt-2 text-sm text-red-400 flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.name}</span>
                        </p>
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
                        className="w-full px-4 py-3 bg-gray-800/80 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 text-sm backdrop-blur-sm"
                        placeholder="Enter product description"
                      />
                    </div>

                    {/* Specification */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Specification
                      </label>
                      <textarea
                        name="specification"
                        value={formData.specification}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-4 py-3 bg-gray-800/80 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 text-sm backdrop-blur-sm"
                        placeholder="Enter product specifications"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column - Relationships */}
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Product Relationships
                  </h3>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Category
                    </label>
                    <select
                      name="cat_id"
                      value={formData.cat_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800/80 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm backdrop-blur-sm"
                    >
                      {renderSelectOptions(categories, "Select Category")}
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
                      className="w-full px-4 py-3 bg-gray-800/80 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm backdrop-blur-sm"
                    >
                      {renderSelectOptions(brands, "Select Brand")}
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
                      className="w-full px-4 py-3 bg-gray-800/80 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm backdrop-blur-sm"
                    >
                      {renderSelectOptions(productTypes, "Select Product Type")}
                    </select>
                    {productTypes.length === 0 && (
                      <p className="mt-2 text-sm text-yellow-400">
                        No product types available. Please add some in the database.
                      </p>
                    )}
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
                      className="w-full px-4 py-3 bg-gray-800/80 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm backdrop-blur-sm"
                    >
                      {renderSelectOptions(units, "Select Unit")}
                    </select>
                  </div>

                  {/* Sub Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <Folder className="w-4 h-4" />
                      Sub Category
                    </label>
                    <select
                      name="sub_cat_id"
                      value={formData.sub_cat_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800/80 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm backdrop-blur-sm"
                    >
                      {renderSelectOptions(subCategories, "Select Sub Category")}
                    </select>
                  </div>

                  {/* Sub Item */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <Box className="w-4 h-4" />
                      Sub Item
                    </label>
                    <select
                      name="sub_item_id"
                      value={formData.sub_item_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800/80 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm backdrop-blur-sm"
                    >
                      {renderSelectOptions(subItems, "Select Sub Item")}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between p-4 bg-gray-800/60 rounded-xl border border-gray-700/50 backdrop-blur-sm">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${formData.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                      <div>
                        <label htmlFor="status" className="text-sm font-medium text-gray-300 cursor-pointer">
                          Product Status
                        </label>
                        <p className="text-xs text-gray-500">
                          {formData.status === 'active' ? "Product is visible and active" : "Product is hidden and inactive"}
                        </p>
                      </div>
                    </div>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-8 mt-8 border-t border-gray-700/50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-4 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-700 transition-all duration-300 hover:scale-105 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-800 disabled:to-blue-900 text-white rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-blue-500/25 border border-blue-500/30"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  <span className="text-lg">
                    {selectedProduct ? 'Update Product' : 'Create Product'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Product Modal */}
      {showViewModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700/50 shadow-2xl">
            <div className="flex justify-between items-center p-8 border-b border-gray-700/50 sticky top-0 bg-gray-800/80 backdrop-blur-sm rounded-t-3xl">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <Eye className="w-6 h-6 text-blue-400" />
                </div>
                Product Details
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-3 hover:bg-gray-700/50 rounded-xl transition-all duration-300 hover:scale-110 border border-gray-600/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Image */}
                <div className="lg:col-span-1">
                  {selectedProduct.image ? (
                    <div className="relative group">
                      <img
                        src={`/${selectedProduct.image}`}
                        alt={selectedProduct.name}
                        className="w-full h-64 object-cover rounded-2xl border border-gray-600 transition-all duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-500 rounded-2xl" />
                    </div>
                  ) : (
                    <div className="w-full h-64 rounded-2xl bg-gray-800 border border-gray-600 flex items-center justify-center">
                      <Package className="w-16 h-16 text-gray-500" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">{selectedProduct.name}</h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm border ${
                        selectedProduct.status === 'active'
                          ? 'bg-green-500/20 text-green-300 border-green-500/40'
                          : 'bg-red-500/20 text-red-300 border-red-500/40'
                      }`}>
                        {selectedProduct.status === 'active' ? (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4" />
                            Active
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <XCircle className="w-4 h-4" />
                            Inactive
                          </div>
                        )}
                      </span>
                    </div>
                  </div>

                  {selectedProduct.description && (
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                        <Type className="w-4 h-4" />
                        Description
                      </h4>
                      <p className="text-gray-400 text-sm leading-relaxed">{selectedProduct.description}</p>
                    </div>
                  )}

                  {selectedProduct.specification && (
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        Specification
                      </h4>
                      <p className="text-gray-400 text-sm whitespace-pre-wrap leading-relaxed">{selectedProduct.specification}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pt-6 border-t border-gray-700/50">
                    <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                      <p className="text-xs text-gray-400 mb-1">Category</p>
                      <p className="text-sm font-medium text-white">{getRelationName(selectedProduct, 'cat_id')}</p>
                    </div>
                    <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                      <p className="text-xs text-gray-400 mb-1">Brand</p>
                      <p className="text-sm font-medium text-white">{getRelationName(selectedProduct, 'brand_id')}</p>
                    </div>
                    <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                      <p className="text-xs text-gray-400 mb-1">Product Type</p>
                      <p className="text-sm font-medium text-white">{getRelationName(selectedProduct, 'product_type_id')}</p>
                    </div>
                    <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                      <p className="text-xs text-gray-400 mb-1">Unit</p>
                      <p className="text-sm font-medium text-white">{getRelationName(selectedProduct, 'unit_id')}</p>
                    </div>
                    <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                      <p className="text-xs text-gray-400 mb-1">Sub Category</p>
                      <p className="text-sm font-medium text-white">{getRelationName(selectedProduct, 'sub_cat_id')}</p>
                    </div>
                    <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                      <p className="text-xs text-gray-400 mb-1">Sub Item</p>
                      <p className="text-sm font-medium text-white">{getRelationName(selectedProduct, 'sub_item_id')}</p>
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl max-w-sm w-full p-8 border border-gray-700/50 shadow-2xl">
            <div className="text-center">
              <div className="p-3 bg-red-500/10 rounded-full w-16 h-16 mx-auto mb-4 border border-red-500/20">
                <Trash2 className="w-8 h-8 text-red-500 mx-auto" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Product</h3>
              <p className="text-gray-400 mb-6">
                Are you sure you want to delete <span className="text-white font-semibold">"{selectedProduct?.name}"</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-700 transition-all duration-300 hover:scale-105 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/25 border border-red-500/30"
              >
                {actionLoading ? (
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
