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
  FolderOpen,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Layers
} from 'lucide-react';

const SubCategories = () => {
  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    status: 1,
    image: null
  });
  const [errors, setErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [imagePreview, setImagePreview] = useState(null);
  const [apiError, setApiError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch sub-categories and categories
  const fetchData = async () => {
    setLoading(true);
    try {
      const [subCategoriesRes, categoriesRes] = await Promise.all([
        axios.get('/api/sub-categories'),
        axios.get('/api/categories') // Make sure you have this endpoint
      ]);
      
      // Handle different response structures
      setSubCategories(Array.isArray(subCategoriesRes.data) ? subCategoriesRes.data : []);
      
      // Fix for categories response - handle different structures
      const categoriesData = categoriesRes.data;
      if (Array.isArray(categoriesData)) {
        setCategories(categoriesData);
      } else if (categoriesData && Array.isArray(categoriesData.data)) {
        // If response has { data: [] } structure
        setCategories(categoriesData.data);
      } else {
        console.warn('Unexpected categories response structure:', categoriesData);
        setCategories([]);
      }
      
      setApiError('');
    } catch (error) {
      console.error('Error fetching data:', error);
      setApiError('Failed to fetch data. Please check your connection.');
      setCategories([]); // Ensure categories is always an array
    } finally {
      setLoading(false);
    }
  };

  // Search sub-categories
  const searchSubCategories = async (query) => {
    if (!query.trim()) {
      fetchData();
      return;
    }

    setLoading(true);
    try {
      // Since we don't have a search endpoint, we'll filter client-side
      const filtered = subCategories.filter(subCat => 
        subCat.name.toLowerCase().includes(query.toLowerCase()) ||
        subCat.category?.name.toLowerCase().includes(query.toLowerCase())
      );
      setSubCategories(filtered);
      setApiError('');
    } catch (error) {
      console.error('Error searching sub-categories:', error);
      setApiError('Error searching sub-categories');
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
        searchSubCategories(searchTerm);
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

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.category_id) newErrors.category_id = 'Category is required';
    if (!formData.name.trim()) newErrors.name = 'Sub-category name is required';
    if (formData.name.trim().length > 255) newErrors.name = 'Name must be less than 255 characters';

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
      submitData.append('category_id', formData.category_id);
      submitData.append('name', formData.name);
      submitData.append('status', formData.status);
      
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      let response;
      
      if (selectedSubCategory) {
        // For update
        response = await axios.post(`/api/sub-categories/${selectedSubCategory.id}`, submitData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            'X-HTTP-Method-Override': 'PUT'
          }
        });
      } else {
        // For create
        response = await axios.post('/api/sub-categories', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setShowModal(false);
      resetForm();
      fetchData();
      alert(`Sub-category ${selectedSubCategory ? 'updated' : 'created'} successfully!`);
      
    } catch (error) {
      console.error('Error saving sub-category:', error);
      
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
        setApiError(`Error ${selectedSubCategory ? 'updating' : 'creating'} sub-category. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete sub-category
  const handleDelete = async () => {
    if (!selectedSubCategory) return;

    setLoading(true);
    setApiError('');
    
    try {
      await axios.delete(`/api/sub-categories/${selectedSubCategory.id}`);
      
      setShowDeleteModal(false);
      setSelectedSubCategory(null);
      fetchData();
      alert('Sub-category deleted successfully!');
      
    } catch (error) {
      console.error('Error deleting sub-category:', error);
      
      if (error.response?.data?.message) {
        setApiError(error.response.data.message);
      } else {
        setApiError('Error deleting sub-category. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Edit sub-category
  const handleEdit = (subCategory) => {
    setSelectedSubCategory(subCategory);
    setFormData({
      category_id: subCategory.category_id.toString(),
      name: subCategory.name,
      status: subCategory.status,
      image: null
    });
    setImagePreview(subCategory.image ? `/${subCategory.image}` : null);
    setErrors({});
    setApiError('');
    setShowModal(true);
  };

  // View sub-category details
  const handleView = (subCategory) => {
    setSelectedSubCategory(subCategory);
    alert(`Sub-category Details:\nName: ${subCategory.name}\nCategory: ${subCategory.category?.name}\nStatus: ${subCategory.status ? 'Active' : 'Inactive'}\nImage: ${subCategory.image ? 'Yes' : 'No'}`);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      category_id: '',
      name: '',
      status: 1,
      image: null
    });
    setSelectedSubCategory(null);
    setImagePreview(null);
    setErrors({});
    setApiError('');
  };

  // Filter sub-categories by status
  const filteredSubCategories = Array.isArray(subCategories) ? subCategories.filter(subCat => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return subCat.status === 1;
    if (filterStatus === 'inactive') return subCat.status === 0;
    return true;
  }) : [];

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSubCategories = filteredSubCategories.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSubCategories.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Safe category rendering function
  const renderCategoryOptions = () => {
    if (!Array.isArray(categories) || categories.length === 0) {
      return <option value="">No categories available</option>;
    }

    return categories.map((category) => (
      <option key={category.id} value={category.id}>
        {category.name}
      </option>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Layers className="w-8 h-8 text-blue-500" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Sub-Categories</h1>
        </div>
        <p className="text-gray-400 text-sm sm:text-base">Manage your product sub-categories and their details</p>
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

      {/* Search, Filter and Add Button */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search sub-categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 text-sm sm:text-base"
            />
          </div>
          
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
        </div>
        
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 w-full lg:w-auto justify-center"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Add Sub-Category</span>
        </button>
      </div>

      {/* Sub-Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading && !subCategories.length ? (
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
          currentSubCategories.map((subCategory) => (
            <div key={subCategory.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors duration-200">
              <div className="flex items-center gap-3 mb-3">
                {subCategory.image ? (
                  <img
                    src={`/${subCategory.image}`}
                    alt={subCategory.name}
                    className="w-12 h-12 rounded-lg object-cover border border-gray-600"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-700 border border-gray-600 flex items-center justify-center">
                    <FolderOpen className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{subCategory.name}</h3>
                  <p className="text-gray-400 text-sm truncate">{subCategory.category?.name}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  subCategory.status 
                    ? 'bg-green-900 text-green-200' 
                    : 'bg-red-900 text-red-200'
                }`}>
                  {subCategory.status ? (
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
                  onClick={() => handleView(subCategory)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs transition-colors duration-200"
                  title="View"
                >
                  <Eye className="w-3 h-3" />
                  View
                </button>
                <button
                  onClick={() => handleEdit(subCategory)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors duration-200"
                  title="Edit"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setSelectedSubCategory(subCategory);
                    setShowDeleteModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors duration-200"
                  title="Delete"
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
      {subCategories.length === 0 && !loading && (
        <div className="text-center py-12">
          <FolderOpen className="mx-auto h-16 w-16 text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">No sub-categories found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterStatus !== 'all' ? 'Try adjusting your search or filter terms' : 'Get started by creating your first sub-category'}
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              <Plus className="w-4 h-4" />
              Create Sub-Category
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {filteredSubCategories.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
          <div className="text-sm text-gray-400">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredSubCategories.length)} of {filteredSubCategories.length} results
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

      {/* Add/Edit Sub-Category Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-700">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                {selectedSubCategory ? 'Edit Sub-Category' : 'Add New Sub-Category'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-300 transition-colors duration-200"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sub-Category Image
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg object-cover border-2 border-gray-600"
                      />
                    ) : (
                      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg bg-gray-700 border-2 border-dashed border-gray-600 flex items-center justify-center">
                        <FolderOpen className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" />
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

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Parent Category *
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm ${
                    errors.category_id ? 'border-red-500' : 'border-gray-600'
                  }`}
                >
                  <option value="">Select a category</option>
                  {renderCategoryOptions()}
                </select>
                {errors.category_id && (
                  <p className="mt-1 text-xs text-red-400">{errors.category_id}</p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sub-Category Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 text-sm ${
                    errors.name ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="Enter sub-category name"
                  maxLength={255}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-400">{errors.name}</p>
                )}
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
                  <span className="ml-2 text-sm text-gray-300">Active Sub-Category</span>
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
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
                  {selectedSubCategory ? 'Update' : 'Create'} Sub-Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-sm w-full p-4 sm:p-6">
            <div className="text-center">
              <Trash2 className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-red-500" />
              <h3 className="mt-3 text-lg font-medium text-white">Delete Sub-Category</h3>
              <p className="mt-2 text-sm text-gray-400">
                Are you sure you want to delete "{selectedSubCategory?.name}"? This action cannot be undone.
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

export default SubCategories;