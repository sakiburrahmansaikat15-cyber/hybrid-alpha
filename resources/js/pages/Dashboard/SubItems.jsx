import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Filter,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Package
} from 'lucide-react';

const SubItemsManager = () => {
  const [subItems, setSubItems] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [expandedItem, setExpandedItem] = useState(null);
  const [formData, setFormData] = useState({
    sub_category_id: '',
    name: '',
    status: true,
    image: null
  });
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Get CSRF token for Laravel
  const getCSRFToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  };

  // Configure axios defaults
  useEffect(() => {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = getCSRFToken();
    axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
  }, []);

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
  };

  // Fetch sub-items
  const fetchSubItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/sub-items');
      // Handle API response structure from your controller
      const items = response.data.data || response.data || [];
      setSubItems(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Error fetching sub-items:', error);
      showNotification('Error fetching sub-items', 'error');
      setSubItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sub-categories for dropdown
  const fetchSubCategories = async () => {
    try {
      const response = await axios.get('/api/sub-categories');
      const categories = response.data.data || response.data || [];
      setSubCategories(Array.isArray(categories) ? categories : []);
    } catch (error) {
      console.error('Error fetching sub-categories:', error);
      showNotification('Error fetching categories', 'error');
      setSubCategories([]);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'file') {
      const file = files[0];
      setFormData(prev => ({
        ...prev,
        image: file
      }));

      // Create image preview
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null);
      }
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors = {};
    if (!formData.sub_category_id) newErrors.sub_category_id = 'Sub category is required';
    if (!formData.name.trim()) newErrors.name = 'Name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('sub_category_id', formData.sub_category_id);
      submitData.append('name', formData.name);
      submitData.append('status', formData.status ? '1' : '0');
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      if (editingItem) {
        // Use PUT method for update
        await axios.put(`/api/sub-items/${editingItem.id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showNotification('Sub-item updated successfully!', 'success');
      } else {
        await axios.post('/api/sub-items', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showNotification('Sub-item created successfully!', 'success');
      }

      resetForm();
      fetchSubItems();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving sub-item:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        showNotification(error.response.data.message, 'error');
      } else {
        showNotification('Error saving sub-item. Please try again.', 'error');
      }
    }
  };

  // Edit sub-item
  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      sub_category_id: item.sub_category_id?.toString() || '',
      name: item.name || '',
      status: item.status !== undefined ? item.status : true,
      image: null
    });
    // Fix image path - your controller stores images in public/sub_item/
    setImagePreview(item.image ? `/${item.image}` : null);
    setShowModal(true);
  };

  // Delete sub-item
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this sub-item? This action cannot be undone.')) return;

    try {
      await axios.delete(`/api/sub-items/${id}`);
      showNotification('Sub-item deleted successfully!', 'success');
      fetchSubItems();
    } catch (error) {
      console.error('Error deleting sub-item:', error);
      showNotification('Error deleting sub-item', 'error');
    }
  };

  // Toggle item status
  const toggleStatus = async (item) => {
    try {
      const newStatus = !item.status;
      const submitData = new FormData();
      submitData.append('sub_category_id', item.sub_category_id);
      submitData.append('name', item.name);
      submitData.append('status', newStatus ? '1' : '0');
      submitData.append('_method', 'PUT');

      await axios.post(`/api/sub-items/${item.id}`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showNotification(`Sub-item ${newStatus ? 'activated' : 'deactivated'}!`, 'success');
      fetchSubItems();
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification('Error updating status', 'error');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      sub_category_id: '',
      name: '',
      status: true,
      image: null
    });
    setEditingItem(null);
    setImagePreview(null);
    setErrors({});
  };

  // Filter and sort sub-items
  const getFilteredAndSortedItems = () => {
    const items = Array.isArray(subItems) ? subItems : [];

    let filtered = items.filter(item => {
      if (!item || typeof item !== 'object') return false;

      const itemName = item.name || '';
      const categoryName = item.sub_category?.name || '';

      const matchesSearch = itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        categoryName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'active' && item.status) ||
        (filterStatus === 'inactive' && !item.status);

      return matchesSearch && matchesStatus;
    });

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'category':
          return (a.sub_category?.name || '').localeCompare(b.sub_category?.name || '');
        case 'newest':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case 'oldest':
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Initialize
  useEffect(() => {
    fetchSubItems();
    fetchSubCategories();
  }, []);

  const filteredSubItems = getFilteredAndSortedItems();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 p-4 md:p-6">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm ${
          notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 animate-in slide-in-from-right`}>
          <div className="flex items-center gap-3">
            <Check size={20} />
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Sub Items Manager
            </h1>
            <p className="text-gray-400 mt-2 text-lg">
              Manage your sub-items with ease and precision
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-blue-500/25 transform hover:-translate-y-0.5"
            >
              <Plus size={22} />
              Add Sub Item
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Items</p>
                <p className="text-2xl font-bold text-white mt-1">{subItems.length}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Package size={24} className="text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Active Items</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {subItems.filter(item => item?.status).length}
                </p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-xl">
                <Check size={24} className="text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Inactive Items</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {subItems.filter(item => item && !item.status).length}
                </p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-xl">
                <EyeOff size={24} className="text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Categories</p>
                <p className="text-2xl font-bold text-white mt-1">{subCategories.length}</p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <Filter size={24} className="text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/30">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent backdrop-blur-sm transition-all duration-200"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A-Z</option>
                <option value="category">Category</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full animate-spin"></div>
              <div className="w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
          </div>
        )}

        {/* Sub Items Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredSubItems.map((item) => (
              <div
                key={item.id}
                className="group bg-gray-800/30 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700/30 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10"
              >
                {/* Image Section */}
                <div className="relative h-48 bg-gradient-to-br from-gray-700 to-gray-800 overflow-hidden">
                  {item.image ? (
                    <img
                      src={`/${item.image}`}
                      alt={item.name || 'Sub item image'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="text-gray-500 group-hover:text-gray-400 transition-colors" size={48} />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => toggleStatus(item)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border transition-all duration-200 ${
                        item.status
                          ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                      }`}
                    >
                      {item.status ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 transform translate-y-4 group-hover:translate-y-0"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                      className="p-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all duration-200 transform translate-y-4 group-hover:translate-y-0 delay-75"
                      title="View Details"
                    >
                      {expandedItem === item.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 transform translate-y-4 group-hover:translate-y-0 delay-100"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5">
                  <h3 className="font-bold text-white text-lg mb-2 line-clamp-1">
                    {item.name || 'Unnamed Item'}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3 flex items-center gap-2">
                    <span className="bg-gray-700/50 px-2 py-1 rounded-lg text-xs">
                      {item.sub_category?.name || 'Uncategorized'}
                    </span>
                  </p>

                  {/* Expanded Details */}
                  {expandedItem === item.id && (
                    <div className="mt-4 pt-4 border-t border-gray-700/50 animate-in slide-in-from-top duration-300">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Created:</span>
                          <span className="text-white">
                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Unknown'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Updated:</span>
                          <span className="text-white">
                            {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'Unknown'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">ID:</span>
                          <span className="text-white font-mono">#{item.id}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-xs text-gray-500">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Unknown date'}
                    </span>
                    <div className="flex gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={() => toggleStatus(item)}
                        className="p-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-colors duration-200"
                        title={item.status ? 'Deactivate' : 'Activate'}
                      >
                        {item.status ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredSubItems.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-3xl p-12 max-w-2xl mx-auto border border-gray-700/30">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center">
                <AlertCircle className="text-gray-500" size={48} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {searchTerm || filterStatus !== 'all' ? 'No Items Found' : 'No Sub Items Yet'}
              </h3>
              <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search or filter criteria to find what you\'re looking for.'
                  : 'Get started by creating your first sub-item to organize your content efficiently.'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl transition-all duration-200 font-semibold inline-flex items-center gap-3"
                >
                  <Plus size={20} />
                  Create Your First Sub Item
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-700/50 shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-700/50">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                {editingItem ? 'Edit Sub Item' : 'Create Sub Item'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-700/50 rounded-xl transition-all duration-200 hover:rotate-90"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Item Image
                </label>
                <div className="flex flex-col items-center gap-4">
                  <div className="w-32 h-32 bg-gray-700/50 rounded-2xl border-2 border-dashed border-gray-600/50 flex items-center justify-center overflow-hidden group hover:border-blue-500/50 transition-all duration-300">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <ImageIcon className="mx-auto text-gray-500 mb-2" size={32} />
                        <span className="text-xs text-gray-400">Upload Image</span>
                      </div>
                    )}
                  </div>
                  <div className="w-full">
                    <input
                      type="file"
                      name="image"
                      accept="image/*"
                      onChange={handleInputChange}
                      className="block w-full text-sm text-gray-400 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-600 file:to-purple-600 file:text-white hover:file:from-blue-700 hover:file:to-purple-700 transition-all duration-200"
                    />
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      JPG, PNG, WEBP • Max 2MB
                    </p>
                  </div>
                </div>
                {errors.image && (
                  <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                    <AlertCircle size={16} />
                    {errors.image}
                  </p>
                )}
              </div>

              {/* Sub Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Sub Category *
                </label>
                <select
                  name="sub_category_id"
                  value={formData.sub_category_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                >
                  <option value="">Select a category</option>
                  {subCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.sub_category_id && (
                  <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                    <AlertCircle size={16} />
                    {errors.sub_category_id}
                  </p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Item Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                  placeholder="Enter sub item name"
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                    <AlertCircle size={16} />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl border border-gray-600/30">
                <div>
                  <label className="block text-sm font-semibold text-gray-300">
                    Status
                  </label>
                  <p className="text-xs text-gray-400">
                    {formData.status ? 'Item is active and visible' : 'Item is hidden and inactive'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="status"
                    checked={formData.status}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-8 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-xl transition-all duration-200 font-semibold border border-gray-600/50 hover:border-gray-500/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 font-semibold flex items-center justify-center gap-3 shadow-lg hover:shadow-blue-500/25"
                >
                  <Check size={20} />
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubItemsManager;
