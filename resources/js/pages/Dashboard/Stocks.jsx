import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Check,
  AlertCircle,
  Package,
  DollarSign,
  BarChart3,
  Calendar,
  Barcode,
  Hash,
  Loader,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Building,
} from 'lucide-react';

const API_URL = '/api/stocks';
const PRODUCTS_URL = '/api/products';
const VENDORS_URL = '/api/vendors';
const WAREHOUSES_URL = '/api/warehouses';

const StocksManager = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Initialized as empty arrays to prevent .map() errors
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  // Track if the selected product is electronic
  const [isElectronicProduct, setIsElectronicProduct] = useState(false);

  // Dynamic SKU inputs for electronic products
  const [skuInputs, setSkuInputs] = useState([]);

  const [formData, setFormData] = useState({
    product_id: '',
    vendor_id: '',
    warehouse_id: '',
    quantity: '',
    buying_price: '',
    selling_price: '',
    total_amount: '',
    due_amount: '',
    stock_date: new Date().toISOString().split('T')[0],
    comission: '',
    sku: '', // used only for non-electronic
    status: 'active',
  });

  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total_items: 0,
  });

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
  }, []);

  const handleApiError = useCallback(
    (error, defaultMessage) => {
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors || {};
        setErrors(validationErrors);
        const firstError = Object.values(validationErrors)[0]?.[0];
        showNotification(firstError || 'Validation error', 'error');
      } else if (error.response?.data?.message) {
        showNotification(error.response.data.message, 'error');
        setErrors({ _general: error.response.data.message });
      } else {
        showNotification(defaultMessage || 'Something went wrong', 'error');
        setErrors({ _general: defaultMessage });
      }
    },
    [showNotification]
  );

  const fetchStocks = useCallback(
    async (page = 1, perPage = 10, keyword = '') => {
      setLoading(true);
      try {
        const params = { page, limit: perPage };
        if (keyword.trim()) params.keyword = keyword.trim();

        const response = await axios.get(API_URL, { params });
        const res = response.data;

        const stockData = res.data || [];
        const formatted = stockData.map((item) => ({
          id: item.id,
          product: item.product || {},
          vendor: item.vendor || {},
          warehouse: item.warehouse || {},
          quantity: item.quantity ?? 0,
          buying_price: item.buying_price ?? '0.00',
          selling_price: item.selling_price ?? '0.00',
          total_amount: item.total_amount ?? null,
          due_amount: item.due_amount ?? null,
          comission: item.comission ?? null,
          stock_date: item.stock_date ?? null,
          sku: item.sku || '',
          status: item.status || 'active',
          created_at: item.created_at,
          updated_at: item.updated_at,
        }));

        setStocks(formatted);
        setPagination({
          current_page: res.current_page || 1,
          last_page: res.total_pages || 1,
          per_page: res.per_page || 10,
          total_items: res.total_items || 0,
        });
      } catch (error) {
        handleApiError(error, 'Failed to fetch stocks');
        setStocks([]);
      } finally {
        setLoading(false);
      }
    },
    [handleApiError]
  );

  const fetchRelatedData = useCallback(async () => {
    try {
      const [prodRes, vendRes, wareRes] = await Promise.all([
        axios.get(PRODUCTS_URL),
        axios.get(VENDORS_URL),
        axios.get(WAREHOUSES_URL),
      ]);

      const extractItems = (response) => {
        const data = response.data;
        if (Array.isArray(data)) return data;
        if (data?.data && Array.isArray(data.data)) return data.data;
        if (data?.pagination?.data && Array.isArray(data.pagination.data)) return data.pagination.data;
        return [];
      };

      const prods = extractItems(prodRes);
      setProducts(prods);
      setVendors(extractItems(vendRes));
      setWarehouses(extractItems(wareRes));

      if (editingStock && editingStock.product?.id) {
        const selectedProduct = prods.find(p => p.id === editingStock.product.id);
        if (selectedProduct?.product_type?.name || selectedProduct?.productType?.name) {
          const typeName = (selectedProduct.product_type?.name || selectedProduct.productType?.name || '').toLowerCase();
          setIsElectronicProduct(typeName === 'electronic');
        }
      }
    } catch (error) {
      console.error('Failed to load related data', error);
      showNotification('Failed to load products, vendors, or warehouses', 'error');
      setProducts([]);
      setVendors([]);
      setWarehouses([]);
    }
  }, [showNotification, editingStock]);

  useEffect(() => {
    fetchStocks(1, 10);
    fetchRelatedData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStocks(1, pagination.per_page, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchStocks]);

  // Update isElectronicProduct when product changes
  useEffect(() => {
    if (formData.product_id) {
      const selectedProduct = products.find(p => p.id === parseInt(formData.product_id));
      const typeName = (selectedProduct?.product_type?.name || selectedProduct?.productType?.name || '').toLowerCase();
      const isElectronic = typeName === 'electronic';
      setIsElectronicProduct(isElectronic);

      if (isElectronic) {
        const qty = parseInt(formData.quantity) || 0;
        setSkuInputs(Array(qty).fill(''));
        setFormData(prev => ({ ...prev, sku: '' }));
      } else {
        setSkuInputs([]);
      }
    } else {
      setIsElectronicProduct(false);
      setSkuInputs([]);
    }
  }, [formData.product_id, products]);

  // Adjust skuInputs length when quantity changes (electronic only)
  useEffect(() => {
    if (isElectronicProduct) {
      const qty = parseInt(formData.quantity) || 0;
      setSkuInputs(prev => {
        const newArr = [...prev];
        newArr.length = qty;
        for (let i = prev.length; i < qty; i++) {
          newArr[i] = '';
        }
        return newArr.filter(s => s !== undefined);
      });
    }
  }, [formData.quantity, isElectronicProduct]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page) return;
    fetchStocks(newPage, pagination.per_page, searchTerm);
  };

  const handleLimitChange = (newLimit) => {
    const limit = parseInt(newLimit);
    setPagination((prev) => ({ ...prev, per_page: limit }));
    fetchStocks(1, limit, searchTerm);
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      vendor_id: '',
      warehouse_id: '',
      quantity: '',
      buying_price: '',
      selling_price: '',
      total_amount: '',
      due_amount: '',
      stock_date: new Date().toISOString().split('T')[0],
      comission: '',
      sku: '',
      status: 'active',
    });
    setErrors({});
    setEditingStock(null);
    setIsElectronicProduct(false);
    setSkuInputs([]);
  };

  const openModal = (stock = null) => {
    if (stock) {
      setEditingStock(stock);
      setFormData({
        product_id: stock.product?.id?.toString() || '',
        vendor_id: stock.vendor?.id?.toString() || '',
        warehouse_id: stock.warehouse?.id?.toString() || '',
        quantity: stock.quantity?.toString() || '',
        buying_price: stock.buying_price || '',
        selling_price: stock.selling_price || '',
        total_amount: stock.total_amount || '',
        due_amount: stock.due_amount || '',
        comission: stock.comission || '',
        stock_date: stock.stock_date || new Date().toISOString().split('T')[0],
        sku: stock.sku || '',
        status: stock.status || 'active',
      });

      const selectedProduct = products.find(p => p.id === stock.product?.id);
      const typeName = (selectedProduct?.product_type?.name || selectedProduct?.productType?.name || '').toLowerCase();
      const isElec = typeName === 'electronic';

      if (isElec && stock.sku) {
        const skuList = stock.sku.split(',').map(s => s.trim());
        setSkuInputs(skuList);
      } else {
        setSkuInputs([]);
      }
      setIsElectronicProduct(isElec);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(resetForm, 300);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');
    setErrors({});

    let finalSku = '';

    if (isElectronicProduct) {
      const filledSkus = skuInputs.filter(s => s.trim() !== '');
      if (filledSkus.length !== skuInputs.length || skuInputs.length === 0) {
        setErrors({ sku: ['All SKU fields must be filled for electronic products.'] });
        showNotification('Please fill all SKU fields for electronic products.', 'error');
        setOperationLoading(null);
        return;
      }
      finalSku = skuInputs.map(s => s.trim()).join(',');
    } else {
      finalSku = formData.sku.trim();
    }

    const payload = {
      product_id: formData.product_id ? parseInt(formData.product_id) : null,
      vendor_id: formData.vendor_id ? parseInt(formData.vendor_id) : null,
      warehouse_id: formData.warehouse_id ? parseInt(formData.warehouse_id) : null,
      quantity: formData.quantity ? parseInt(formData.quantity) : 0,
      buying_price: parseFloat(formData.buying_price) || 0,
      selling_price: parseFloat(formData.selling_price) || 0,
      total_amount: formData.total_amount ? parseFloat(formData.total_amount) : null,
      due_amount: formData.due_amount ? parseFloat(formData.due_amount) : null,
      comission: formData.comission ? parseFloat(formData.comission) : null,
      stock_date: formData.stock_date || null,
      sku: finalSku || null,
      status: formData.status,
    };

    try {
      if (editingStock) {
        await axios.post(`${API_URL}/${editingStock.id}`, payload);
        showNotification('Stock updated successfully!');
      } else {
        await axios.post(API_URL, payload);
        showNotification('Stock created successfully!');
      }

      fetchStocks(pagination.current_page, pagination.per_page, searchTerm);
      closeModal();
    } catch (error) {
      handleApiError(error, 'Failed to save stock');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    setOperationLoading(`delete-${id}`);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Stock deleted successfully');
      const remaining = pagination.total_items - 1;
      const maxPage = Math.ceil(remaining / pagination.per_page);
      const targetPage = pagination.current_page > maxPage ? maxPage : pagination.current_page;
      fetchStocks(targetPage || 1, pagination.per_page, searchTerm);
    } catch (error) {
      handleApiError(error, 'Delete failed');
    } finally {
      setOperationLoading(null);
      setDeleteConfirm(null);
    }
  };

  const toggleStatus = async (stock) => {
    const newStatus = stock.status === 'active' ? 'inactive' : 'active';
    setOperationLoading(`status-${stock.id}`);
    try {
      await axios.post(`${API_URL}/${stock.id}`, { status: newStatus });
      showNotification(`Stock ${newStatus === 'active' ? 'activated' : 'deactivated'}!`);
      fetchStocks(pagination.current_page, pagination.per_page, searchTerm);
    } catch (error) {
      handleApiError(error, 'Status update failed');
    } finally {
      setOperationLoading(null);
    }
  };

  const stats = {
    total: pagination.total_items,
    quantity: stocks.reduce((acc, s) => acc + (parseInt(s.quantity) || 0), 0),
    value: stocks.reduce(
      (acc, s) => acc + ((parseInt(s.quantity) || 0) * (parseFloat(s.buying_price) || 0)),
      0
    ),
    active: stocks.filter((s) => s.status === 'active').length,
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '—';
    return `$${parseFloat(value).toFixed(2)}`;
  };

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 py-8">
      {/* Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl ${
              notification.type === 'error' ? 'bg-red-600' : 'bg-green-600'
            } text-white font-medium flex items-center gap-2`}
          >
            {notification.type === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
              Stock Management
            </h1>
            <p className="text-gray-400 mt-2">Manage inventory entries and stock levels</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-6 py-3 rounded-xl font-bold flex items-center gap-3 shadow-lg"
          >
            <Plus size={22} /> Add New Stock
          </button>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Stocks', value: stats.total, icon: Package, color: 'blue' },
            { label: 'Total Quantity', value: stats.quantity, icon: Hash, color: 'green' },
            { label: 'Total Value', value: `$${stats.value.toFixed(0)}`, icon: DollarSign, color: 'purple' },
            { label: 'Active Entries', value: stats.active, icon: BarChart3, color: 'yellow' },
          ].map((s, i) => (
            <div key={i} className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{s.label}</p>
                  <p className="text-3xl font-bold mt-1">{s.value}</p>
                </div>
                <div className={`p-3 bg-${s.color}-500/10 rounded-xl`}>
                  <s.icon size={28} className={`text-${s.color}-400`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/30">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by SKU, product, vendor, or warehouse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2 bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3">
                <span className="text-sm text-gray-400">Show:</span>
                <select
                  value={pagination.per_page}
                  onChange={(e) => handleLimitChange(e.target.value)}
                  className="bg-transparent border-0 text-white text-sm focus:ring-0 focus:outline-none"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm min-w-[140px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700/30 bg-gray-800/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Stock Entries</h3>
              <span className="text-sm text-gray-400">{pagination.total_items} entries</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-gray-700/30">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Warehouse</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Qty</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Buy Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Sell Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Total Amt</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Due Amt</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Commission</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {loading ? (
                  <tr>
                    <td colSpan="13" className="px-6 py-12 text-center">
                      <Loader size={32} className="animate-spin mx-auto text-blue-400" />
                      <p className="text-gray-400 mt-3">Loading stocks...</p>
                    </td>
                  </tr>
                ) : stocks.length === 0 ? (
                  <tr>
                    <td colSpan="13" className="px-6 py-16 text-center">
                      <Package size={64} className="mx-auto text-gray-500 mb-4" />
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {searchTerm ? 'No stocks found' : 'No stock entries yet'}
                      </h3>
                      <p className="text-gray-400 mb-6">
                        {searchTerm ? 'Try different search terms' : 'Add your first stock entry to get started'}
                      </p>
                      {!searchTerm && (
                        <button
                          onClick={() => openModal()}
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-3 rounded-xl font-bold flex items-center gap-2 mx-auto"
                        >
                          <Plus size={20} /> Add First Stock
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  stocks
                    .filter((s) => statusFilter === 'all' || s.status === statusFilter)
                    .map((stock) => (
                      <tr key={stock.id} className="hover:bg-gray-700/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Package size={20} className="text-blue-400" />
                            <span className="font-medium">{stock.product?.name || '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">{stock.vendor?.name || '-'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Building size={20} className="text-amber-400" />
                            <span>{stock.warehouse?.name || '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {stock.sku ? (
                            <div className="flex items-center gap-2">
                              <Barcode size={16} />
                              <span className="font-mono">{stock.sku}</span>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 font-bold text-blue-400">{stock.quantity}</td>
                        <td className="px-6 py-4 text-green-400">{formatCurrency(stock.buying_price)}</td>
                        <td className="px-6 py-4 text-yellow-400">{formatCurrency(stock.selling_price)}</td>
                        <td className="px-6 py-4 font-bold text-purple-400">{formatCurrency(stock.total_amount)}</td>
                        <td className="px-6 py-4 text-orange-400 font-medium">{formatCurrency(stock.due_amount)}</td>
                        <td className="px-6 py-4 text-cyan-400 font-medium">{formatCurrency(stock.comission)}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          <Calendar size={16} className="inline mr-2" />
                          {formatDate(stock.stock_date)}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleStatus(stock)}
                            disabled={operationLoading === `status-${stock.id}`}
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                              stock.status === 'active'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {operationLoading === `status-${stock.id}` ? (
                              <Loader size={12} className="animate-spin" />
                            ) : null}
                            {stock.status === 'active' ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openModal(stock)}
                              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(stock.id)}
                              className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="px-6 py-4 border-t border-gray-700/30 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-400">
                Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{' '}
                {Math.min(pagination.current_page * pagination.per_page, pagination.total_items)} of{' '}
                {pagination.total_items}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="px-3 py-2 rounded-xl border border-gray-600 disabled:opacity-50 flex items-center gap-2"
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                <button className="px-4 py-2 rounded-xl bg-blue-600 border-blue-500">
                  {pagination.current_page}
                </button>
                <button
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="px-3 py-2 rounded-xl border border-gray-600 disabled:opacity-50 flex items-center gap-2"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-800 rounded-3xl p-8 max-w-4xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                  {editingStock ? 'Edit Stock' : 'Add New Stock'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-700 rounded-lg">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Product & Vendor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Product</label>
                    <select
                      name="product_id"
                      value={formData.product_id}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">No Product (Optional)</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    {errors.product_id && <p className="text-red-400 text-sm mt-1">{errors.product_id[0]}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Vendor</label>
                    <select
                      name="vendor_id"
                      value={formData.vendor_id}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">No Vendor (Optional)</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Warehouse */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Warehouse</label>
                  <select
                    name="warehouse_id"
                    value={formData.warehouse_id}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">No Warehouse (Optional)</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Required Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Quantity *</label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      required
                      min="0"
                      className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Buying Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="buying_price"
                      value={formData.buying_price}
                      onChange={handleChange}
                      required
                      min="0"
                      className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Selling Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="selling_price"
                      value={formData.selling_price}
                      onChange={handleChange}
                      required
                      min="0"
                      className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Optional Fields */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Total Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      name="total_amount"
                      value={formData.total_amount}
                      onChange={handleChange}
                      placeholder="Optional"
                      className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Due Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      name="due_amount"
                      value={formData.due_amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Commission</label>
                    <input
                      type="number"
                      step="0.01"
                      name="comission"
                      value={formData.comission}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Stock Date</label>
                    <input
                      type="date"
                      name="stock_date"
                      value={formData.stock_date}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* SKU Field - Dynamic for Electronic */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    SKU {isElectronicProduct && <span className="text-red-400">*</span>}
                  </label>

                  {isElectronicProduct ? (
                    <div className="space-y-3">
                      {skuInputs.map((sku, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <span className="text-gray-400 w-12 text-sm">#{index + 1}</span>
                          <input
                            type="text"
                            value={sku}
                            onChange={(e) => {
                              const newSkus = [...skuInputs];
                              newSkus[index] = e.target.value;
                              setSkuInputs(newSkus);
                            }}
                            placeholder={`SKU for item ${index + 1}`}
                            className="flex-1 px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                          />
                        </div>
                      ))}
                      <p className="text-xs text-gray-400 mt-2">
                        Provide exactly <strong>{formData.quantity || 0}</strong> unique SKU(s) – one per item.
                      </p>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        name="sku"
                        value={formData.sku}
                        onChange={handleChange}
                        placeholder="Optional – will be auto-generated if left empty"
                        className="w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        Leave empty for auto-generated single SKU (non-electronic products).
                      </p>
                    </>
                  )}

                  {errors.sku && <p className="text-red-400 text-sm mt-1">{errors.sku[0]}</p>}
                  {errors._general && <p className="text-red-400 text-sm mt-1">{errors._general}</p>}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold mb-3">Status</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['active', 'inactive'].map((st) => (
                      <label
                        key={st}
                        onClick={() => setFormData((prev) => ({ ...prev, status: st }))}
                        className={`p-4 border-2 rounded-xl text-center cursor-pointer transition ${
                          formData.status === st
                            ? st === 'active'
                              ? 'border-green-500 bg-green-500/10'
                              : 'border-red-500 bg-red-500/10'
                            : 'border-gray-600'
                        }`}
                      >
                        {st === 'active' ? (
                          <CheckCircle size={20} className="mx-auto mb-2 text-green-400" />
                        ) : (
                          <XCircle size={20} className="mx-auto mb-2 text-red-400" />
                        )}
                        <span className="capitalize font-medium">{st}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={operationLoading === 'saving'}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-bold flex items-center gap-2 disabled:opacity-70"
                  >
                    {operationLoading === 'saving' ? (
                      <Loader size={20} className="animate-spin" />
                    ) : (
                      <Check size={20} />
                    )}
                    {editingStock ? 'Update Stock' : 'Create Stock'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-800 rounded-3xl p-8 max-w-md w-full border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <Trash2 size={48} className="mx-auto text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Delete Stock Entry</h3>
                <p className="text-gray-400 mb-6">This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    disabled={operationLoading?.startsWith('delete-')}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {operationLoading?.startsWith('delete-') ? (
                      <Loader size={20} className="animate-spin" />
                    ) : (
                      <Trash2 size={20} />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StocksManager;