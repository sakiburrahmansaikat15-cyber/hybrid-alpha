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
  AlertCircle 
} from 'lucide-react';

const SubItemsManager = () => {
  const [subItems, setSubItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    sub_category_id: '',
    name: '',
    status: true,
    image: null
  });
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);

  // Fetch sub-items
  const fetchSubItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/sub-items');
      setSubItems(response.data);
    } catch (error) {
      console.error('Error fetching sub-items:', error);
      showNotification('Error fetching sub-items', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Search sub-items
  const searchSubItems = async () => {
    if (!searchTerm.trim()) {
      fetchSubItems();
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/api/sub-items/search?search=${searchTerm}`);
      setSubItems(response.data);
    } catch (error) {
      console.error('Error searching sub-items:', error);
      showNotification('Error searching sub-items', 'error');
    } finally {
      setLoading(false);
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

    try {
      const submitData = new FormData();
      submitData.append('sub_category_id', formData.sub_category_id);
      submitData.append('name', formData.name);
      submitData.append('status', formData.status);
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      if (editingItem) {
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
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        showNotification('Error saving sub-item', 'error');
      }
    }
  };

  // Edit sub-item
  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      sub_category_id: item.sub_category_id,
      name: item.name,
      status: item.status,
      image: null
    });
    setImagePreview(item.image ? `${window.location.origin}/${item.image}` : null);
    setShowModal(true);
  };

  // Delete sub-item
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this sub-item?')) return;

    try {
      await axios.delete(`/api/sub-items/${id}`);
      showNotification('Sub-item deleted successfully!', 'success');
      fetchSubItems();
    } catch (error) {
      showNotification('Error deleting sub-item', 'error');
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

  // Show notification
  const showNotification = (message, type = 'info') => {
    // You can integrate with a proper notification system here
    alert(`${type.toUpperCase()}: ${message}`);
  };

  // Initialize
  useEffect(() => {
    fetchSubItems();
  }, []);

  // Filter sub-items based on search (client-side fallback)
  const filteredSubItems = subItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sub_category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Sub Items Manager</h1>
            <p className="text-gray-400 mt-1">Manage your sub-items efficiently</p>
          </div>
          
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
          >
            <Plus size={20} />
            Add Sub Item
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search sub-items by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchSubItems()}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={searchSubItems}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium"
            >
              Search
            </button>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  fetchSubItems();
                }}
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Sub Items Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSubItems.map((item) => (
              <div
                key={item.id}
                className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10"
              >
                {/* Image */}
                <div className="relative h-48 bg-gray-700">
                  {item.image ? (
                    <img
                      src={`/${item.image}`}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="text-gray-500" size={48} />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {item.status ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-white text-lg mb-1 truncate">
                    {item.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">
                    Category: {item.sub_category?.name || 'N/A'}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors duration-200"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors duration-200"
                        title="Delete"
                      >
                        <Trash2 size={16} />
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
          <div className="text-center py-12">
            <div className="bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
              <AlertCircle className="mx-auto text-gray-500 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Sub Items Found
              </h3>
              <p className="text-gray-400 mb-4">
                {searchTerm
                  ? 'No sub-items match your search criteria. Try different keywords.'
                  : 'Get started by creating your first sub-item.'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium"
                >
                  Create Sub Item
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">
                {editingItem ? 'Edit Sub Item' : 'Create Sub Item'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Image
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gray-700 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="text-gray-500" size={24} />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleInputChange}
                      className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG, WEBP up to 2MB
                    </p>
                  </div>
                </div>
                {errors.image && (
                  <p className="text-red-400 text-sm mt-1">{errors.image}</p>
                )}
              </div>

              {/* Sub Category ID */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sub Category ID *
                </label>
                <input
                  type="text"
                  name="sub_category_id"
                  value={formData.sub_category_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter sub category ID"
                />
                {errors.sub_category_id && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.sub_category_id}
                  </p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter sub item name"
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="status"
                    checked={formData.status}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <span className="text-sm font-medium text-gray-300">
                  Active Status
                </span>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium flex items-center justify-center gap-2"
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