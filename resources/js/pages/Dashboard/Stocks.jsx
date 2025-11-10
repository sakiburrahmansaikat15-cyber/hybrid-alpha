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
  Truck,
  Warehouse,
  DollarSign,
  BarChart3,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  Barcode,
  Hash
} from 'lucide-react';

const StocksManager = () => {
  const [stocks, setStocks] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('stock_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    vendor_id: '',
    product_id: '',
    warehouse_id: '',
    quantity: 1,
    buying_price: 0,
    selling_price: 0,
    total_amount: 0,
    due_amount: 0,
    stock_date: new Date().toISOString().split('T')[0],
    commission: 0,
    sku: '',
    barcode: '',
    status: true
  });
  const [errors, setErrors] = useState({});

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [stocksRes, vendorsRes, productsRes, warehousesRes] = await Promise.all([
        axios.get('/api/stocks'),
        axios.get('/api/vendors'),
        axios.get('/api/products'),
        axios.get('/api/warehouses')
      ]);
      setStocks(stocksRes.data);
      setVendors(vendorsRes.data);
      setProducts(productsRes.data);
      setWarehouses(warehousesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('Error fetching data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Calculate amounts when quantity or prices change
  useEffect(() => {
    const total = formData.quantity * formData.buying_price;
    const due = total - (formData.due_amount || 0);
    
    setFormData(prev => ({
      ...prev,
      total_amount: parseFloat(total.toFixed(2)),
      due_amount: parseFloat(due.toFixed(2))
    }));
  }, [formData.quantity, formData.buying_price]);

  // Search stocks
  const searchStocks = async () => {
    if (!searchTerm.trim()) {
      fetchData();
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/api/stocks/search?search=${searchTerm}`);
      setStocks(response.data);
    } catch (error) {
      console.error('Error searching stocks:', error);
      showNotification('Error searching stocks', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseFloat(value) || 0 : value
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
      if (editingStock) {
        await axios.put(`/api/stocks/${editingStock.id}`, formData);
        showNotification('Stock updated successfully!', 'success');
      } else {
        await axios.post('/api/stocks', formData);
        showNotification('Stock created successfully!', 'success');
      }

      resetForm();
      fetchData();
      setShowModal(false);
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        showNotification('Error saving stock', 'error');
      }
    }
  };

  // Edit stock
  const handleEdit = (stock) => {
    setEditingStock(stock);
    setFormData({
      name: stock.name,
      vendor_id: stock.vendor_id,
      product_id: stock.product_id,
      warehouse_id: stock.warehouse_id,
      quantity: stock.quantity,
      buying_price: parseFloat(stock.buying_price),
      selling_price: parseFloat(stock.selling_price),
      total_amount: parseFloat(stock.total_amount),
      due_amount: parseFloat(stock.due_amount),
      stock_date: stock.stock_date,
      commission: stock.commission || 0,
      sku: stock.sku || '',
      barcode: stock.barcode || '',
      status: stock.status
    });
    setShowModal(true);
  };

  // Delete stock
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this stock record?')) return;

    try {
      await axios.delete(`/api/stocks/${id}`);
      showNotification('Stock deleted successfully!', 'success');
      fetchData();
    } catch (error) {
      showNotification('Error deleting stock', 'error');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      vendor_id: '',
      product_id: '',
      warehouse_id: '',
      quantity: 1,
      buying_price: 0,
      selling_price: 0,
      total_amount: 0,
      due_amount: 0,
      stock_date: new Date().toISOString().split('T')[0],
      commission: 0,
      sku: '',
      barcode: '',
      status: true
    });
    setEditingStock(null);
    setErrors({});
  };

  // Show notification
  const showNotification = (message, type = 'info') => {
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

  // Calculate statistics
  const stats = {
    totalStocks: stocks.length,
    totalQuantity: stocks.reduce((sum, stock) => sum + stock.quantity, 0),
    totalValue: stocks.reduce((sum, stock) => sum + (stock.quantity * stock.buying_price), 0),
    totalDue: stocks.reduce((sum, stock) => sum + parseFloat(stock.due_amount), 0),
    activeStocks: stocks.filter(stock => stock.status).length
  };

  // Sort and filter stocks
  const sortedAndFilteredStocks = stocks
    .filter(stock => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'active') return stock.status;
      if (statusFilter === 'inactive') return !stock.status;
      return true;
    })
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'vendor') {
        aValue = a.vendor?.name || '';
        bValue = b.vendor?.name || '';
      } else if (sortField === 'product') {
        aValue = a.product?.name || '';
        bValue = b.product?.name || '';
      } else if (sortField === 'warehouse') {
        aValue = a.warehouse?.name || '';
        bValue = b.warehouse?.name || '';
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
            <h1 className="text-2xl md:text-3xl font-bold text-white">Stock Management</h1>
            <p className="text-gray-400 mt-1">Manage inventory, vendors, and stock levels</p>
          </div>
          
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium shadow-lg shadow-blue-600/25"
          >
            <Plus size={20} />
            Add Stock
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
            <div className="flex items-center gap-3">
              <Package className="text-blue-400" size={24} />
              <div>
                <div className="text-2xl font-bold text-white">{stats.totalStocks}</div>
                <div className="text-gray-400 text-sm">Total Stocks</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
            <div className="flex items-center gap-3">
              <Hash className="text-green-400" size={24} />
              <div>
                <div className="text-2xl font-bold text-white">{stats.totalQuantity}</div>
                <div className="text-gray-400 text-sm">Total Quantity</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-purple-500">
            <div className="flex items-center gap-3">
              <DollarSign className="text-purple-400" size={24} />
              <div>
                <div className="text-2xl font-bold text-white">${stats.totalValue.toLocaleString()}</div>
                <div className="text-gray-400 text-sm">Total Value</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-yellow-500">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-yellow-400" size={24} />
              <div>
                <div className="text-2xl font-bold text-white">{stats.activeStocks}</div>
                <div className="text-gray-400 text-sm">Active Stocks</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-red-500">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-400" size={24} />
              <div>
                <div className="text-2xl font-bold text-white">${stats.totalDue.toLocaleString()}</div>
                <div className="text-gray-400 text-sm">Total Due</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, SKU, barcode, product, or vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchStocks()}
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
              <option value="stock_date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="quantity">Sort by Quantity</option>
              <option value="vendor">Sort by Vendor</option>
              <option value="product">Sort by Product</option>
              <option value="warehouse">Sort by Warehouse</option>
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
                onClick={searchStocks}
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

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Stocks Table */}
        {!loading && (
          <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Stock Info
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Warehouse
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Pricing
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {sortedAndFilteredStocks.map((stock) => (
                    <tr 
                      key={stock.id}
                      className="hover:bg-gray-750 transition-colors duration-150"
                    >
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-white">{stock.name}</div>
                          <div className="text-sm text-gray-400 mt-1">
                            Qty: <span className="text-blue-400 font-medium">{stock.quantity}</span>
                          </div>
                          {stock.sku && (
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <Barcode size={12} />
                              {stock.sku}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            <Calendar size={12} className="inline mr-1" />
                            {new Date(stock.stock_date).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Truck className="text-green-400" size={16} />
                          <span className="text-white">
                            {stock.vendor?.name || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Package className="text-blue-400" size={16} />
                          <span className="text-white">
                            {stock.product?.name || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Warehouse className="text-purple-400" size={16} />
                          <span className="text-white">
                            {stock.warehouse?.name || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="text-sm">
                            Buy: <span className="text-green-400">${parseFloat(stock.buying_price).toFixed(2)}</span>
                          </div>
                          <div className="text-sm">
                            Sell: <span className="text-yellow-400">${parseFloat(stock.selling_price).toFixed(2)}</span>
                          </div>
                          <div className="text-sm">
                            Due: <span className="text-red-400">${parseFloat(stock.due_amount).toFixed(2)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            stock.status
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {stock.status ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(stock)}
                            className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors duration-200"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(stock.id)}
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
        {!loading && sortedAndFilteredStocks.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
              <Package className="mx-auto text-gray-500 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Stocks Found
              </h3>
              <p className="text-gray-400 mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'No stocks match your search criteria. Try different filters.'
                  : 'Get started by adding your first stock record.'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium"
                >
                  Add Stock
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">
                {editingStock ? 'Edit Stock' : 'Add New Stock'}
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
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Stock Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter stock name"
                  />
                  {errors.name && (
                    <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Stock Date *
                  </label>
                  <input
                    type="date"
                    name="stock_date"
                    value={formData.stock_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.stock_date && (
                    <p className="text-red-400 text-sm mt-1">{errors.stock_date}</p>
                  )}
                </div>
              </div>

              {/* Foreign Key Relationships */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Vendor *
                  </label>
                  <select
                    name="vendor_id"
                    value={formData.vendor_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                  {errors.vendor_id && (
                    <p className="text-red-400 text-sm mt-1">{errors.vendor_id}</p>
                  )}
                </div>

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
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                  {errors.product_id && (
                    <p className="text-red-400 text-sm mt-1">{errors.product_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Warehouse *
                  </label>
                  <select
                    name="warehouse_id"
                    value={formData.warehouse_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                  {errors.warehouse_id && (
                    <p className="text-red-400 text-sm mt-1">{errors.warehouse_id}</p>
                  )}
                </div>
              </div>

              {/* Quantity and Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.quantity && (
                    <p className="text-red-400 text-sm mt-1">{errors.quantity}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Buying Price *
                  </label>
                  <input
                    type="number"
                    name="buying_price"
                    value={formData.buying_price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.buying_price && (
                    <p className="text-red-400 text-sm mt-1">{errors.buying_price}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Selling Price *
                  </label>
                  <input
                    type="number"
                    name="selling_price"
                    value={formData.selling_price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.selling_price && (
                    <p className="text-red-400 text-sm mt-1">{errors.selling_price}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Commission
                  </label>
                  <input
                    type="number"
                    name="commission"
                    value={formData.commission}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.commission && (
                    <p className="text-red-400 text-sm mt-1">{errors.commission}</p>
                  )}
                </div>
              </div>

              {/* Calculated Amounts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-750 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Total Amount
                  </label>
                  <div className="text-xl font-bold text-green-400">
                    ${formData.total_amount.toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-400">Quantity × Buying Price</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Due Amount
                  </label>
                  <div className="text-xl font-bold text-red-400">
                    ${formData.due_amount.toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-400">Remaining payment</p>
                </div>
              </div>

              {/* Additional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    SKU
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Stock Keeping Unit"
                  />
                  {errors.sku && (
                    <p className="text-red-400 text-sm mt-1">{errors.sku}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Barcode
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Barcode number"
                  />
                  {errors.barcode && (
                    <p className="text-red-400 text-sm mt-1">{errors.barcode}</p>
                  )}
                </div>
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
                    {formData.status ? 'Stock is active and available' : 'Stock is inactive and hidden'}
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
                  {editingStock ? 'Update Stock' : 'Create Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StocksManager;