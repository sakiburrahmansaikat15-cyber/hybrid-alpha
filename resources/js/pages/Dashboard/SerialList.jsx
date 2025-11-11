import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Image as ImageIcon,
  Warehouse,
  Package,
  Barcode,
  Palette,
  FileText,
  Calendar,
  X,
  Check,
  AlertCircle,
  Loader,
  Filter
} from 'lucide-react';

const SerialListManager = () => {
  const [serialLists, setSerialLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSerial, setEditingSerial] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    stocks_id: '',
    warehouse_id: '',
    sku: '',
    barcode: '',
    color: '',
    notes: '',
    status: true,
    image: null
  });
  const [warehouses, setWarehouses] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Fetch initial data
  useEffect(() => {
    fetchSerialLists();
    fetchWarehouses();
    fetchStocks();
  }, []);

  const fetchSerialLists = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/serial-lists');

      if (response.data && Array.isArray(response.data)) {
        setSerialLists(response.data);
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setSerialLists(response.data.data);
      } else {
        console.warn('Unexpected API response format:', response.data);
        setSerialLists([]);
      }
    } catch (error) {
      console.error('Error fetching serial lists:', error);
      setError('Error loading serial lists');
      setSerialLists([]);
    }
    setLoading(false);
  };

  const fetchWarehouses = async () => {
    try {
      const response = await axios.get('/api/warehouses');
      if (response.data && Array.isArray(response.data)) {
        setWarehouses(response.data);
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setWarehouses(response.data.data);
      } else {
        setWarehouses([]);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      setWarehouses([]);
    }
  };

  const fetchStocks = async () => {
    try {
      const response = await axios.get('/api/stocks');
      if (response.data && Array.isArray(response.data)) {
        setStocks(response.data);
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setStocks(response.data.data);
      } else {
        setStocks([]);
      }
    } catch (error) {
      console.error('Error fetching stocks:', error);
      setStocks([]);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchSerialLists();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/serial-lists/search?search=${encodeURIComponent(searchTerm)}`);

      if (response.data && Array.isArray(response.data)) {
        setSerialLists(response.data);
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setSerialLists(response.data.data);
      } else {
        setSerialLists([]);
      }
    } catch (error) {
      console.error('Error searching:', error);
      setError('Error searching serial lists');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'image' && formData[key]) {
        submitData.append('image', formData[key]);
      } else {
        submitData.append(key, formData[key]);
      }
    });

    try {
      if (editingSerial) {
        await axios.post(`/api/serial-lists/${editingSerial.id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('/api/serial-lists', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setShowModal(false);
      resetForm();
      fetchSerialLists();
    } catch (error) {
      console.error('Error saving serial list:', error);
      setError('Error saving serial list');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this serial list?')) return;

    try {
      await axios.delete(`/api/serial-lists/${id}`);
      fetchSerialLists();
    } catch (error) {
      console.error('Error deleting serial list:', error);
      setError('Error deleting serial list');
    }
  };

  const handleEdit = (serial) => {
    setEditingSerial(serial);
    setFormData({
      name: serial.name || '',
      stocks_id: serial.stocks_id || '',
      warehouse_id: serial.warehouse_id || '',
      sku: serial.sku || '',
      barcode: serial.barcode || '',
      color: serial.color || '',
      notes: serial.notes || '',
      status: serial.status !== undefined ? serial.status : true,
      image: null
    });

    // Set image preview if exists
    if (serial.image) {
      setImagePreview(getImageUrl(serial));
    } else {
      setImagePreview(null);
    }

    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      stocks_id: '',
      warehouse_id: '',
      sku: '',
      barcode: '',
      color: '',
      notes: '',
      status: true,
      image: null
    });
    setEditingSerial(null);
    setError(null);
    setImagePreview(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'file' && files[0]) {
      const file = files[0];
      setFormData(prev => ({
        ...prev,
        [name]: file
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const getStatusBadge = (status) => {
    return status ? (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-300 border border-green-700">
        <Check className="w-3 h-3 mr-1" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-900/50 text-red-300 border border-red-700">
        <X className="w-3 h-3 mr-1" />
        Inactive
      </span>
    );
  };

  // Safe data access helpers
  const getStockName = (serial) => {
    return serial.stock?.name || 'N/A';
  };

  const getWarehouseName = (serial) => {
    return serial.warehouse?.name || 'N/A';
  };

  const getImageUrl = (serial) => {
    return serial.image ? `/${serial.image}` : null;
  };

  // Ensure serialLists is always an array
  const safeSerialLists = Array.isArray(serialLists) ? serialLists : [];

  const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg font-medium shadow-lg transition-all duration-300 ${
      type === 'success'
        ? 'bg-green-600 text-white'
        : type === 'error'
        ? 'bg-red-600 text-white'
        : 'bg-blue-600 text-white'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Serial Lists Management</h1>
            <p className="text-gray-400">Manage your serialized inventory items in dark style</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 md:mt-0 inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Serial List
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 bg-red-900/50 border border-red-700 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-300">Error</h3>
                <p className="text-sm text-red-400 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-4 mb-6 border border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, SKU, barcode, color..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-colors"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  fetchSerialLists();
                }}
                className="px-6 py-2.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors border border-gray-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}

        {/* Serial Lists Grid */}
        {!loading && safeSerialLists.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {safeSerialLists.map((serial) => (
              <div key={serial.id} className="bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-700 hover:border-gray-600">
                {/* Image */}
                <div className="h-48 bg-gray-700 overflow-hidden relative">
                  {getImageUrl(serial) ? (
                    <img
                      src={getImageUrl(serial)}
                      alt={serial.name || 'Serial List Image'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center bg-gray-700">
                      <ImageIcon className="w-12 h-12 text-gray-500 mb-2" />
                      <span className="text-gray-400 text-sm">No Image</span>
                    </div>
                  )}

                  {/* Status Badge on Image */}
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(serial.status)}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-3 truncate">
                    {serial.name || 'Unnamed'}
                  </h3>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center text-gray-300">
                      <Package className="w-4 h-4 mr-3 text-gray-400" />
                      <span className="truncate">{getStockName(serial)}</span>
                    </div>

                    <div className="flex items-center text-gray-300">
                      <Warehouse className="w-4 h-4 mr-3 text-gray-400" />
                      <span>{getWarehouseName(serial)}</span>
                    </div>

                    {serial.sku && (
                      <div className="flex items-center text-gray-300">
                        <Barcode className="w-4 h-4 mr-3 text-gray-400" />
                        <div>
                          <span className="text-gray-400 text-xs block">SKU</span>
                          <span>{serial.sku}</span>
                        </div>
                      </div>
                    )}

                    {serial.barcode && (
                      <div className="flex items-center text-gray-300">
                        <Barcode className="w-4 h-4 mr-3 text-gray-400" />
                        <div>
                          <span className="text-gray-400 text-xs block">Barcode</span>
                          <span>{serial.barcode}</span>
                        </div>
                      </div>
                    )}

                    {serial.color && (
                      <div className="flex items-center text-gray-300">
                        <Palette className="w-4 h-4 mr-3 text-gray-400" />
                        <div>
                          <span className="text-gray-400 text-xs block">Color</span>
                          <span>{serial.color}</span>
                        </div>
                      </div>
                    )}

                    {serial.notes && (
                      <div className="flex items-start text-gray-300">
                        <FileText className="w-4 h-4 mr-3 text-gray-400 mt-0.5" />
                        <div>
                          <span className="text-gray-400 text-xs block">Notes</span>
                          <p className="text-xs line-clamp-2">{serial.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center text-gray-400 text-xs">
                      <Calendar className="w-3 h-3 mr-1" />
                      {serial.created_at ? new Date(serial.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(serial)}
                        className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-gray-700 border border-gray-600 hover:border-blue-500 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(serial.id)}
                        className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-gray-700 border border-gray-600 hover:border-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && safeSerialLists.length === 0 && (
          <div className="text-center py-16 bg-gray-800 rounded-xl border border-gray-700">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
              <Package className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No serial lists found</h3>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">
              {searchTerm
                ? 'No results found for your search. Try adjusting your search terms.'
                : 'Get started by creating your first serial list to manage your inventory.'
              }
            </p>
            <div className="flex gap-3 justify-center">
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    fetchSerialLists();
                  }}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors border border-gray-600"
                >
                  Clear Search
                </button>
              )}
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-2 inline" />
                Add Serial List
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">
                  {editingSerial ? 'Edit Serial List' : 'Create New Serial List'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-300 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                {editingSerial ? 'Update the serial list details' : 'Add a new serial list to your inventory'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Image Preview */}
              {(imagePreview || (editingSerial && getImageUrl(editingSerial))) && (
                <div className="flex justify-center">
                  <div className="relative">
                    <img
                      src={imagePreview || getImageUrl(editingSerial)}
                      alt="Preview"
                      className="h-32 w-32 object-cover rounded-lg border border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setFormData(prev => ({ ...prev, image: null }));
                      }}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 border border-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-colors"
                    placeholder="Enter serial list name"
                  />
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Stock *</label>
                  <select
                    name="stocks_id"
                    value={formData.stocks_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white transition-colors"
                  >
                    <option value="" className="bg-gray-700">Select Stock</option>
                    {stocks.map(stock => (
                      <option key={stock.id} value={stock.id} className="bg-gray-700">{stock.name}</option>
                    ))}
                  </select>
                </div>

                {/* Warehouse */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Warehouse *</label>
                  <select
                    name="warehouse_id"
                    value={formData.warehouse_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white transition-colors"
                  >
                    <option value="" className="bg-gray-700">Select Warehouse</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id} className="bg-gray-700">{warehouse.name}</option>
                    ))}
                  </select>
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">SKU</label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-colors"
                    placeholder="Enter SKU"
                  />
                </div>

                {/* Barcode */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Barcode</label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-colors"
                    placeholder="Enter barcode"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-colors"
                    placeholder="Enter color"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-colors"
                  placeholder="Enter any additional notes"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Image</label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors">
                  <input
                    type="file"
                    name="image"
                    onChange={handleInputChange}
                    accept="image/*"
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center cursor-pointer p-4"
                  >
                    <ImageIcon className="w-8 h-8 text-gray-500 mb-2" />
                    <span className="text-sm text-gray-400 text-center">
                      Click to upload image or drag and drop
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF, WEBP up to 2MB
                    </span>
                  </label>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="status"
                  checked={formData.status}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                />
                <label className="ml-2 block text-sm text-gray-300">Active Status</label>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2.5 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg font-medium hover:bg-gray-600 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading && <Loader className="w-4 h-4 animate-spin" />}
                  {loading ? 'Saving...' : (editingSerial ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SerialListManager;
