import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  X,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';

const ProductType = () => {
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    type: '',
    status: 'active'
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Correct API URL format
  const API_URL = 'http://localhost:8000/api/product-types';

  // Fetch product types
  const fetchProductTypes = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await axios.get(API_URL);
      console.log('API Response:', response.data); // Debug log
      
      if (response.data.success) {
        setProductTypes(response.data.data || []);
      } else {
        setErrorMessage('Failed to fetch product types');
      }
    } catch (error) {
      console.error('Error fetching product types:', error);
      setErrorMessage(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductTypes();
  }, []);

  // Filter product types
  const filteredTypes = productTypes.filter(type => {
    const matchesSearch = type.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || type.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Reset form
  const resetForm = () => {
    setFormData({ type: '', status: 'active' });
    setErrors({});
    setEditingType(null);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    if (type === 'success') {
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  // Create or Update product type
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      if (editingType) {
        // Update existing - PUT /api/product-types/{id}
        await axios.put(`${API_URL}/${editingType.id}`, formData);
        showNotification('Product type updated successfully!');
      } else {
        // Create new - POST /api/product-types
        await axios.post(API_URL, formData);
        showNotification('Product type created successfully!');
      }

      await fetchProductTypes();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Submit error:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        showNotification('Operation failed!', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Edit product type
  const handleEdit = (type) => {
    setEditingType(type);
    setFormData({
      type: type.type,
      status: type.status
    });
    setShowModal(true);
  };

  // Delete product type
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product type?')) {
      return;
    }

    try {
      // DELETE /api/product-types/{id}
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Product type deleted successfully!');
      await fetchProductTypes();
    } catch (error) {
      console.error('Delete error:', error);
      showNotification('Failed to delete product type!', 'error');
    }
  };

  // Toggle status
  const toggleStatus = async (type) => {
    try {
      const newStatus = type.status === 'active' ? 'inactive' : 'active';
      // PUT /api/product-types/{id}
      await axios.put(`${API_URL}/${type.id}`, {
        status: newStatus
      });
      showNotification(`Product type ${newStatus === 'active' ? 'activated' : 'deactivated'}!`);
      await fetchProductTypes();
    } catch (error) {
      console.error('Toggle status error:', error);
      showNotification('Failed to update status!', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Product Types</h1>
        <p className="text-gray-400">Manage your product categories and types</p>
      </div>

      {/* Error Notification */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-300">{errorMessage}</span>
          <button 
            onClick={() => setErrorMessage('')}
            className="ml-auto p-1 hover:bg-red-800 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-900/50 border border-green-700 rounded-lg flex items-center space-x-2">
          <Check className="w-5 h-5 text-green-400" />
          <span className="text-green-300">{successMessage}</span>
        </div>
      )}

      {/* Controls */}
      <div className="bg-gray-800 rounded-xl p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search product types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Add Button */}
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Product Type</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="text-2xl font-bold text-white">{productTypes.length}</div>
          <div className="text-gray-400">Total Types</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="text-2xl font-bold text-green-400">
            {productTypes.filter(t => t.status === 'active').length}
          </div>
          <div className="text-gray-400">Active Types</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="text-2xl font-bold text-red-400">
            {productTypes.filter(t => t.status === 'inactive').length}
          </div>
          <div className="text-gray-400">Inactive Types</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : filteredTypes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{productTypes.length === 0 ? 'No product types available' : 'No matching product types found'}</p>
            {productTypes.length === 0 && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Create First Product Type
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">ID</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Type Name</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Status</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Created Date</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTypes.map((type, index) => (
                  <tr 
                    key={type.id} 
                    className={`border-b border-gray-700 hover:bg-gray-750 transition-colors ${
                      index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/50'
                    }`}
                  >
                    <td className="py-4 px-6 font-mono text-sm text-gray-300">#{type.id}</td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-white">{type.type}</div>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => toggleStatus(type)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          type.status === 'active'
                            ? 'bg-green-900/50 text-green-300 hover:bg-green-800/50'
                            : 'bg-red-900/50 text-red-300 hover:bg-red-800/50'
                        }`}
                      >
                        {type.status}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-gray-400 text-sm">
                      {new Date(type.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(type)}
                          className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(type.id)}
                          className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">
                {editingType ? 'Edit Product Type' : 'Add New Product Type'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type Name *
                </label>
                <input
                  type="text"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 ${
                    errors.type ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="Enter product type name"
                />
                {errors.type && (
                  <p className="mt-1 text-sm text-red-400 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.type[0]}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>
                    {loading
                      ? editingType
                        ? 'Updating...'
                        : 'Creating...'
                      : editingType
                      ? 'Update'
                      : 'Create'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductType;