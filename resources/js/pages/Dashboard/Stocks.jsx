import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Check,
  Package,
  Truck,
  DollarSign,
  BarChart3,
  Calendar,
  Barcode,
  Hash,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const API_BASE = '/api/stocks';

const StocksManager = () => {
  const [stocks, setStocks] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total_items: 0,
    total_pages: 1
  });

  const [formData, setFormData] = useState({
    product_id: '',
    vendor_id: '',
    quantity: 1,
    buying_price: 0,
    selling_price: 0,
    total_amount: 0,
    due_amount: 0,
    stock_date: new Date().toISOString().split('T')[0],
    comission: 0,
    sku: '',
    status: 'active'
  });

  const [errors, setErrors] = useState({});
  const [operationLoading, setOperationLoading] = useState(false);

  const showNotification = useCallback((message, type = 'success') => {
    const el = document.createElement('div');
    el.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-2xl text-white font-medium transition-all ${
      type === 'error' ? 'bg-red-600' : 'bg-green-600'
    }`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }, []);

  const handleApiError = useCallback((error) => {
    if (error.response?.status === 422) {
      const errs = error.response.data.errors || {};
      setErrors(errs);
      const first = Object.values(errs)[0]?.[0];
      showNotification(first || 'Please check the form', 'error');
    } else if (error.response?.status === 404) {
      showNotification(error.response.data.message || 'Not found', 'error');
    } else {
      showNotification(error.response?.data?.message || 'Operation failed', 'error');
    }
  }, [showNotification]);

  const fetchStocks = useCallback(async (page = 1, limit = 10, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (keyword.trim()) params.keyword = keyword.trim();

      const res = await axios.get(API_BASE, { params });

      setStocks(res.data.data || []);
      setPagination({
        current_page: res.data.current_page,
        last_page: res.data.total_pages,
        per_page: res.data.per_page,
        total_items: res.data.total_items,
        total_pages: res.data.total_pages
      });
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStocks(1, pagination.per_page, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchStocks, pagination.per_page]);

  const fetchRelated = async () => {
    try {
      const [vRes, pRes] = await Promise.all([
        axios.get('/api/vendors'),
        axios.get('/api/products')
      ]);
      // Vendors: paginated → pagination.data
      // Products: non-paginated → data
      setVendors(vRes.data?.pagination?.data || []);
      setProducts(pRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load vendors/products', err);
      setVendors([]);
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchStocks(1, 10);
    fetchRelated();
  }, []);

  useEffect(() => {
    const total = (parseFloat(formData.quantity) || 0) * (parseFloat(formData.buying_price) || 0);
    setFormData(prev => ({ ...prev, total_amount: total.toFixed(2) }));
  }, [formData.quantity, formData.buying_price]);

  const resetForm = () => {
    setFormData({
      product_id: '',
      vendor_id: '',
      quantity: 1,
      buying_price: 0,
      selling_price: 0,
      total_amount: 0,
      due_amount: 0,
      stock_date: new Date().toISOString().split('T')[0],
      comission: 0,
      sku: '',
      status: 'active'
    });
    setEditingStock(null);
    setErrors({});
  };

  const openModal = (stock = null) => {
    if (stock) {
      setEditingStock(stock);
      setFormData({
        product_id: stock.product_id?.toString() || '',
        vendor_id: stock.vendor_id?.toString() || '',
        quantity: stock.quantity || 1,
        buying_price: parseFloat(stock.buying_price) || 0,
        selling_price: parseFloat(stock.selling_price) || 0,
        total_amount: parseFloat(stock.total_amount || 0),
        due_amount: parseFloat(stock.due_amount || 0),
        stock_date: stock.stock_date?.split('T')[0] || '',
        comission: parseFloat(stock.comission || 0),
        sku: stock.sku || '',
        status: stock.status || 'active'
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading(true);
    setErrors({});

    const payload = {
      quantity: parseInt(formData.quantity),
      buying_price: parseFloat(formData.buying_price),
      selling_price: parseFloat(formData.selling_price),
      total_amount: parseFloat(formData.total_amount) || null,
      status: formData.status,
    };

    if (formData.due_amount) payload.due_amount = parseFloat(formData.due_amount);
    if (formData.stock_date) payload.stock_date = formData.stock_date;
    if (formData.comission) payload.comission = parseFloat(formData.comission);
    if (formData.sku?.trim()) payload.sku = formData.sku.trim();

    try {
      if (editingStock) {
        // Only send product_id/vendor_id if they changed
        if (formData.product_id && parseInt(formData.product_id) !== editingStock.product_id) {
          payload.product_id = parseInt(formData.product_id);
        }
        if (formData.vendor_id && parseInt(formData.vendor_id) !== editingStock.vendor_id) {
          payload.vendor_id = parseInt(formData.vendor_id);
        }

        await axios.post(`${API_BASE}/${editingStock.id}`, {
          ...payload,
          _method: 'POST'   // This is REQUIRED for update
        });

        showNotification('Stock updated successfully');
      } else {
        // Create: both required
        payload.product_id = parseInt(formData.product_id);
        payload.vendor_id = parseInt(formData.vendor_id);

        await axios.post(API_BASE, payload);
        showNotification('Stock created successfully');
      }

      fetchStocks(pagination.current_page, pagination.per_page, searchTerm);
      setShowModal(false);
    } catch (err) {
      handleApiError(err);
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this stock permanently?')) return;

    try {
      await axios.delete(`${API_BASE}/${id}`);
      showNotification('Stock deleted successfully');

      const newTotal = pagination.total_items - 1;
      const maxPage = Math.ceil(newTotal / pagination.per_page);
      const targetPage = pagination.current_page > maxPage && maxPage > 0 ? maxPage : pagination.current_page;

      fetchStocks(targetPage, pagination.per_page, searchTerm);
    } catch (err) {
      handleApiError(err);
    }
  };

  const stats = {
    total: pagination.total_items,
    quantity: stocks.reduce((a, s) => a + (s.quantity || 0), 0),
    value: stocks.reduce((a, s) => a + ((s.quantity || 0) * (parseFloat(s.buying_price) || 0)), 0),
    active: stocks.filter(s => s.status === 'active').length
  };

  const filtered = stocks.filter(s => statusFilter === 'all' || s.status === statusFilter);

  const goToPage = (page) => {
    if (page < 1 || page > pagination.last_page || page === pagination.current_page) return;
    fetchStocks(page, pagination.per_page, searchTerm);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Stock Management</h1>
            <p className="text-gray-400 mt-1">Manage inventory and stock entries</p>
          </div>
          <button onClick={() => openModal()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-lg font-medium shadow-lg transition">
            <Plus size={20} /> Add Stock
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
            <div className="flex items-center gap-3">
              <Package className="text-blue-400" size={24} />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-gray-400 text-sm">Total Entries</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
            <div className="flex items-center gap-3">
              <Hash className="text-green-400" size={24} />
              <div>
                <div className="text-2xl font-bold">{stats.quantity}</div>
                <div className="text-gray-400 text-sm">Total Qty</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-purple-500">
            <div className="flex items-center gap-3">
              <DollarSign className="text-purple-400" size={24} />
              <div>
                <div className="text-2xl font-bold">${stats.value.toFixed(0)}</div>
                <div className="text-gray-400 text-sm">Total Value</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-yellow-500">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-yellow-400" size={24} />
              <div>
                <div className="text-2xl font-bold">{stats.active}</div>
                <div className="text-gray-400 text-sm">Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by SKU, Product or Vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {(searchTerm || statusFilter !== 'all') && (
              <button onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                fetchStocks(1, 10);
              }} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition">
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Vendor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Buy / Sell</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-500">
                        {searchTerm ? 'No stocks match your search' : 'No stocks found'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map(stock => (
                      <tr key={stock.id} className="hover:bg-gray-750 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Package className="text-blue-400" size={16} />
                            <span className="font-medium text-white">
                              {stock.product_name || '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Truck className="text-green-400" size={16} />
                            <span className="text-white">
                              {stock.vendor_name || '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {stock.sku ? (
                            <div className="flex items-center gap-1 text-sm font-mono">
                              <Barcode size={14} />
                              {stock.sku}
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-blue-400 font-bold text-lg">{stock.quantity}</span>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div>Buy: <span className="text-green-400 font-medium">${parseFloat(stock.buying_price || 0).toFixed(2)}</span></div>
                          <div>Sell: <span className="text-yellow-400 font-medium">${parseFloat(stock.selling_price || 0).toFixed(2)}</span></div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <Calendar size={14} className="inline mr-1 text-gray-400" />
                          {stock.stock_date ? new Date(stock.stock_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            stock.status === 'active'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {stock.status || 'unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right space-x-2">
                          <button
                            onClick={() => openModal(stock)}
                            className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(stock.id)}
                            className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="bg-gray-700 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-400">
                  Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{' '}
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total_items)} of {pagination.total_items} entries
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goToPage(pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className="px-4 py-2 rounded-lg bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                      .filter(page =>
                        page === 1 ||
                        page === pagination.total_pages ||
                        (page >= pagination.current_page - 2 && page <= pagination.current_page + 2)
                      )
                      .map((page, idx, arr) => (
                        <React.Fragment key={page}>
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <span className="px-3 py-2 text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => goToPage(page)}
                            className={`px-4 py-2 rounded-lg text-sm transition ${
                              pagination.current_page === page
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      ))}
                  </div>

                  <button
                    onClick={() => goToPage(pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.total_pages}
                    className="px-4 py-2 rounded-lg bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
            <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center p-6 border-b border-gray-700">
                <h2 className="text-2xl font-bold">{editingStock ? 'Edit Stock' : 'Add New Stock'}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-700 rounded-lg transition"><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Product *</label>
                    <select value={formData.product_id} onChange={e => setFormData(prev => ({...prev, product_id: e.target.value}))} required
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Product</option>
                      {Array.isArray(products) && products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    {errors.product_id && <p className="text-red-400 text-sm mt-1">{errors.product_id[0]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Vendor *</label>
                    <select value={formData.vendor_id} onChange={e => setFormData(prev => ({...prev, vendor_id: e.target.value}))} required
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Vendor</option>
                      {Array.isArray(vendors) && vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                    {errors.vendor_id && <p className="text-red-400 text-sm mt-1">{errors.vendor_id[0]}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Quantity *</label>
                    <input type="number" min="0" value={formData.quantity} onChange={e => setFormData(prev => ({...prev, quantity: e.target.value}))} required
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    {errors.quantity && <p className="text-red-400 text-sm mt-1">{errors.quantity[0]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Buying Price *</label>
                    <input type="number" step="0.01" min="0" value={formData.buying_price} onChange={e => setFormData(prev => ({...prev, buying_price: e.target.value}))} required
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    {errors.buying_price && <p className="text-red-400 text-sm mt-1">{errors.buying_price[0]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Selling Price *</label>
                    <input type="number" step="0.01" min="0" value={formData.selling_price} onChange={e => setFormData(prev => ({...prev, selling_price: e.target.value}))} required
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    {errors.selling_price && <p className="text-red-400 text-sm mt-1">{errors.selling_price[0]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Commission</label>
                    <input type="number" step="0.01" min="0" value={formData.comission} onChange={e => setFormData(prev => ({...prev, comission: e.target.value}))}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">SKU</label>
                    <input type="text" value={formData.sku} onChange={e => setFormData(prev => ({...prev, sku: e.target.value}))}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Optional" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Due Amount</label>
                    <input type="number" step="0.01" min="0" value={formData.due_amount} onChange={e => setFormData(prev => ({...prev, due_amount: e.target.value}))}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Stock Date</label>
                    <input type="date" value={formData.stock_date} onChange={e => setFormData(prev => ({...prev, stock_date: e.target.value}))}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Total Amount (Auto)</label>
                    <div className="text-2xl font-bold text-green-400">${formData.total_amount}</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select value={formData.status} onChange={e => setFormData(prev => ({...prev, status: e.target.value}))}
                      className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-700">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={operationLoading}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium flex items-center justify-center gap-2 transition">
                    {operationLoading ? 'Saving...' : <><Check size={20} /> {editingStock ? 'Update' : 'Create'} Stock</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StocksManager;
