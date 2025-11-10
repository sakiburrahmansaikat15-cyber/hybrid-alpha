import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Check,
  AlertCircle,
  Package,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';

const VariantsManager = () => {
  const [variants, setVariants] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    product_id: '',
    name: '',
    value: '',
    description: '',
    status: true
  });
  const [errors, setErrors] = useState({});

  // Fetch variants and products
  const fetchData = async () => {
    setLoading(true);
    try {
      const [variantsRes, productsRes] = await Promise.all([
        axios.get('/api/variants'),
        axios.get('/api/products') // Assuming you have a products endpoint
      ]);
      setVariants(variantsRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('Error fetching data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Search variants
  const searchVariants = async () => {
    if (!searchTerm.trim()) {
      fetchData();
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/api/variants/search?search=${searchTerm}`);
      setVariants(response.data);
    } catch (error) {
      console.error('Error searching variants:', error);
      showNotification('Error searching variants', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

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
      if (editingVariant) {
        await axios.put(`/api/variants/${editingVariant.id}`, formData);
        showNotification('Variant updated successfully!', 'success');
      } else {
        await axios.post('/api/variants', formData);
        showNotification('Variant created successfully!', 'success');
      }

      resetForm();
      fetchData();
      setShowModal(false);
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        showNotification('Error saving variant', 'error');
      }
    }
  };

  // Edit variant
  const handleEdit = (variant) => {
    setEditingVariant(variant);
    setFormData({
      product_id: variant.product_id,
      name: variant.name,
      value: variant.value,
      description: variant.description || '',
      status: variant.status
    });
    setShowModal(true);
  };

  // Delete variant
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;

    try {
      await axios.delete(`/api/variants/${id}`);
      showNotification('Variant deleted successfully!', 'success');
      fetchData();
    } catch (error) {
      showNotification('Error deleting variant', 'error');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      product_id: '',
      name: '',
      value: '',
      description: '',
      status: true
    });
    setEditingVariant(null);
    setErrors({});
  };

  // Show notification
  const showNotification = (message, type = 'info') => {
    // You can integrate with a proper notification system here
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg z-50 ${
      type === 'success' ? 'bg-green-600' : 
      type === 'error' ? 'bg-red-600' : 'bg-blue-600'
    } text-white shadow-lg`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  // Sort variants
  const sortedAndFilteredVariants = variants
    .filter(variant => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'active') return variant.status;
      if (statusFilter === 'inactive') return !variant.status;
      return true;
    })
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'product') {
        aValue = a.product?.name || '';
        bValue = b.product?.name || '';
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Initialize
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Variants Manager</h1>
            <p className="text-gray-400 mt-1">Manage product variants and attributes</p>
          </div>
          
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium shadow-lg shadow-blue-600/25"
          >
            <Plus size={20} />
            Add Variant
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search variants by name, value, or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchVariants()}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Sort */}
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Sort by Name</option>
              <option value="value">Sort by Value</option>
              <option value="product">Sort by Product</option>
              <option value="created_at">Sort by Date</option>
            </select>

            {/* Sort Direction */}
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="p-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg transition-colors duration-200"
            >
              {sortDirection === 'asc' ? <SortAsc size={20} /> : <SortDesc size={20} />}
            </button>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={searchVariants}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium"
              >
                Search
              </button>
              {(searchTerm || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    fetchData();
                  }}
                  className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
            <div className="text-2xl font-bold text-white">{variants.length}</div>
            <div className="text-gray-400 text-sm">Total Variants</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
            <div className="text-2xl font-bold text-white">
              {variants.filter(v => v.status).length}
            </div>
            <div className="text-gray-400 text-sm">Active Variants</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-red-500">
            <div className="text-2xl font-bold text-white">
              {variants.filter(v => !v.status).length}
            </div>
            <div className="text-gray-400 text-sm">Inactive Variants</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-purple-500">
            <div className="text-2xl font-bold text-white">
              {new Set(variants.map(v => v.product_id)).size}
            </div>
            <div className="text-gray-400 text-sm">Products with Variants</div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Variants Table */}
        {!loading && (
          <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Variant
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {sortedAndFilteredVariants.map((variant) => (
                    <tr 
                      key={variant.id}
                      className="hover:bg-gray-750 transition-colors duration-150"
                    >
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-white">{variant.name}</div>
                          {variant.description && (
                            <div className="text-sm text-gray-400 mt-1 line-clamp-2">
                              {variant.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Package className="text-blue-400" size={16} />
                          <span className="text-white">
                            {variant.product?.name || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          {variant.value}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            variant.status
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {variant.status ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-400">
                        {new Date(variant.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(variant)}
                            className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors duration-200"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(variant.id)}
                            className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors duration-200"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && sortedAndFilteredVariants.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
              <AlertCircle className="mx-auto text-gray-500 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Variants Found
              </h3>
              <p className="text-gray-400 mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'No variants match your search criteria. Try different filters.'
                  : 'Get started by creating your first variant.'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium"
                >
                  Create Variant
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">
                {editingVariant ? 'Edit Variant' : 'Create Variant'}
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

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Product *
                </label>
                <select
                  name="product_id"
                  value={formData.product_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                {errors.product_id && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.product_id}
                  </p>
                )}
              </div>

              {/* Name and Value */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    placeholder="e.g., Color, Size, Material"
                  />
                  {errors.name && (
                    <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Value *
                  </label>
                  <input
                    type="text"
                    name="value"
                    value={formData.value}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Red, Large, Cotton"
                  />
                  {errors.value && (
                    <p className="text-red-400 text-sm mt-1">{errors.value}</p>
                  )}
                </div>
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
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Optional variant description..."
                />
                {errors.description && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center gap-3 p-4 bg-gray-750 rounded-lg">
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
                <div>
                  <span className="text-sm font-medium text-gray-300">
                    Active Status
                  </span>
                  <p className="text-xs text-gray-400">
                    {formData.status ? 'Variant is active and available' : 'Variant is inactive and hidden'}
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  {editingVariant ? 'Update Variant' : 'Create Variant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VariantsManager;