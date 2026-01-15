import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Check, AlertCircle, Package, DollarSign,
  BarChart3, Calendar, Hash, Loader, ChevronLeft, ChevronRight,
  Filter, RefreshCw, MoreVertical, Building, CreditCard, Percent, ArrowRight
} from 'lucide-react';

const API_URL = '/api/stocks';
const PRODUCTS_URL = '/api/products';
const VENDORS_URL = '/api/vendors';
const WAREHOUSES_URL = '/api/warehouses';
const PAYMENT_TYPES_URL = '/api/payment-types';

const StocksManager = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: 'all', warehouse: 'all' });

  // Related Data
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);

  // Electronic Product Logic
  const [isElectronic, setIsElectronic] = useState(false);
  const [skuInputs, setSkuInputs] = useState(['']);
  const [colorInputs, setColorInputs] = useState(['']);
  const [barCodeInputs, setBarCodeInputs] = useState(['']);
  const [noteInputs, setNoteInputs] = useState(['']);

  const [formData, setFormData] = useState({
    product_id: '',
    vendor_id: '',
    warehouse_id: '',
    payment_type_id: '',
    quantity: '',
    buying_price: '',
    tax: '0',
    selling_price: '',
    total_amount: '',
    due_amount: '',
    paid_amount: '',
    stock_date: new Date().toISOString().split('T')[0],
    expire_date: '',
    comission: '',
    status: 'active',
  });

  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [pagination, setPagination] = useState({
    current_page: 1, per_page: 10, total_items: 0, total_pages: 1
  });

  const [actionMenu, setActionMenu] = useState(null);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
  }, []);

  const handleApiError = useCallback((error, defaultMessage) => {
    if (error.response?.status === 422) {
      const validationErrors = error.response.data.errors || {};
      setErrors(validationErrors);
      const firstError = Object.values(validationErrors)[0]?.[0];
      showNotification(firstError || 'Validation error', 'error');
    } else {
      showNotification(error.response?.data?.message || defaultMessage || 'Something went wrong', 'error');
    }
  }, [showNotification]);

  const fetchStocks = useCallback(async (page = 1, limit = 10, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (keyword.trim()) params.keyword = keyword.trim();
      const response = await axios.get(API_URL, { params });
      const data = response.data.pagination || response.data; // Handle structure

      const itemList = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);

      setStocks(itemList.map(item => ({
        id: item.id,
        product: item.product || {},
        vendor: item.vendor || {},
        warehouse: item.warehouse || {},
        paymentType: item.paymentType || {},
        quantity: item.quantity ?? 0,
        buying_price: item.buying_price ?? '0.00',
        tax: item.tax ?? '0.00',
        selling_price: item.selling_price ?? '0.00',
        total_amount: item.total_amount ?? '0.00',
        due_amount: item.due_amount ?? '0.00',
        paid_amount: item.paid_amount ?? '0.00',
        comission: item.comission ?? '0.00',
        stock_date: item.stock_date,
        expire_date: item.expire_date,
        status: item.status || 'active',
      })));

      setPagination({
        current_page: data.current_page || 1,
        per_page: data.per_page || limit,
        total_items: data.total_items || data.total || itemList.length,
        total_pages: data.total_pages || data.last_page || 1
      });
    } catch (error) {
      console.error(error);
      handleApiError(error, 'Failed to fetch stocks');
      setStocks([]);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const fetchRelatedData = useCallback(async () => {
    try {
      const [prodRes, vendRes, wareRes, payRes] = await Promise.all([
        axios.get(PRODUCTS_URL),
        axios.get(VENDORS_URL),
        axios.get(WAREHOUSES_URL),
        axios.get(PAYMENT_TYPES_URL),
      ]);
      const extract = (res) => res.data?.pagination?.data || res.data?.data || [];
      setProducts(extract(prodRes));
      setVendors(extract(vendRes));
      setWarehouses(extract(wareRes));
      setPaymentTypes(extract(payRes));
    } catch (error) {
      console.error("Related data error", error);
    }
  }, []);

  useEffect(() => {
    fetchStocks(1, 10);
    fetchRelatedData();
  }, [fetchStocks, fetchRelatedData]);

  useEffect(() => {
    const timer = setTimeout(() => fetchStocks(1, pagination.per_page, searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchStocks]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (actionMenu && !e.target.closest('.action-menu-container')) {
        setActionMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [actionMenu]);

  // Calculations
  useEffect(() => {
    if (!editingStock) {
      const qty = parseFloat(formData.quantity) || 0;
      const price = parseFloat(formData.buying_price) || 0;
      const total = (qty * price).toFixed(2);
      setFormData(prev => ({ ...prev, total_amount: total }));
    }
  }, [formData.quantity, formData.buying_price, editingStock]);

  useEffect(() => {
    if (!editingStock) {
      const total = parseFloat(formData.total_amount) || 0;
      const paid = parseFloat(formData.paid_amount) || 0;
      const due = total - paid >= 0 ? (total - paid).toFixed(2) : '0.00';
      setFormData(prev => ({ ...prev, due_amount: due }));
    }
  }, [formData.total_amount, formData.paid_amount, editingStock]);

  // Electronic Fields Sync
  useEffect(() => {
    const qty = parseInt(formData.quantity) || 0;
    if (isElectronic && qty > 0 && formData.product_id && !editingStock) {
      const adjustArray = (arr) => {
        if (arr.length < qty) return [...arr, ...Array(qty - arr.length).fill('')];
        if (arr.length > qty) return arr.slice(0, qty);
        return arr;
      };
      setSkuInputs(prev => adjustArray(prev));
      setColorInputs(prev => adjustArray(prev));
      setBarCodeInputs(prev => adjustArray(prev));
      setNoteInputs(prev => adjustArray(prev));
    }
  }, [formData.quantity, isElectronic, formData.product_id, editingStock]);


  const handleProductChange = (e) => {
    const productId = e.target.value;
    setFormData(prev => ({ ...prev, product_id: productId }));

    const selectedProduct = products.find(p => p.id == productId);
    const typeName = selectedProduct?.product_type?.name || selectedProduct?.productType?.name || '';
    const electronic = typeName.toLowerCase().includes('electronic');
    setIsElectronic(electronic);

    if (!editingStock) {
      setSkuInputs(['']); setColorInputs(['']); setBarCodeInputs(['']); setNoteInputs(['']);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.total_pages) return;
    fetchStocks(newPage, pagination.per_page, searchTerm);
  };

  const handleLimitChange = (e) => {
    const limit = parseInt(e.target.value);
    setPagination(prev => ({ ...prev, per_page: limit }));
    fetchStocks(1, limit, searchTerm);
  };

  const resetForm = () => {
    setFormData({
      product_id: '', vendor_id: '', warehouse_id: '', payment_type_id: '',
      quantity: '', buying_price: '', tax: '0', selling_price: '',
      total_amount: '', due_amount: '', paid_amount: '',
      stock_date: new Date().toISOString().split('T')[0], expire_date: '',
      comission: '', status: 'active',
    });
    setErrors({});
    setEditingStock(null);
    setIsElectronic(false);
    setSkuInputs(['']); setColorInputs(['']); setBarCodeInputs(['']); setNoteInputs(['']);
  };

  const openModal = (stock = null) => {
    resetForm();
    if (stock) {
      setEditingStock(stock);
      setFormData({
        product_id: stock.product?.id || '',
        vendor_id: stock.vendor?.id || '',
        warehouse_id: stock.warehouse?.id || '',
        payment_type_id: stock.paymentType?.id || '',
        quantity: stock.quantity || '',
        buying_price: stock.buying_price || '',
        tax: stock.tax || '0',
        selling_price: stock.selling_price || '',
        total_amount: stock.total_amount || '',
        due_amount: stock.due_amount || '',
        paid_amount: stock.paid_amount || '',
        stock_date: stock.stock_date ? stock.stock_date.split('T')[0] : '',
        expire_date: stock.expire_date ? stock.expire_date.split('T')[0] : '',
        comission: stock.comission || '',
        status: stock.status || 'active',
      });
      // Check if product is electronic
      const typeName = stock.product?.product_type?.name || stock.product?.productType?.name || '';
      setIsElectronic(typeName.toLowerCase().includes('electronic'));
    }
    setShowModal(true);
    setActionMenu(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(resetForm, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');
    setErrors({});

    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null) formDataToSend.append(key, formData[key]);
    });

    if (!editingStock && isElectronic) {
      if (skuInputs.some(s => !s.trim())) {
        setErrors({ sku: ['All SKU fields are required'] });
        showNotification('Fill all SKU fields', 'error');
        setOperationLoading(null);
        return;
      }
      formDataToSend.append('sku', skuInputs.join(','));
      formDataToSend.append('color', colorInputs.join(','));
      formDataToSend.append('bar_code', barCodeInputs.join(','));
      formDataToSend.append('note', noteInputs.join(','));

      const fileInput = document.getElementById('stock-image-upload');
      if (fileInput?.files[0]) formDataToSend.append('image', fileInput.files[0]);
    } else if (!editingStock) {
      // Non-electronic defaults
      formDataToSend.append('sku', skuInputs[0] || '');
      formDataToSend.append('color', colorInputs[0] || '');
      formDataToSend.append('bar_code', barCodeInputs[0] || '');
      formDataToSend.append('note', noteInputs[0] || '');
    }

    // Image handling if any (general)
    if (editingStock) formDataToSend.append('_method', 'POST');

    try {
      await axios.post(editingStock ? `${API_URL}/${editingStock.id}` : API_URL, formDataToSend);
      showNotification(editingStock ? 'Stock updated!' : 'Stock added successfully!');
      fetchStocks(pagination.current_page, pagination.per_page, searchTerm);
      closeModal();
    } catch (error) {
      handleApiError(error, 'Failed to save stock');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this stock entry?')) return;
    setOperationLoading(`delete-${id}`);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Stock deleted');
      fetchStocks(pagination.current_page, pagination.per_page, searchTerm);
    } catch (e) { handleApiError(e, 'Delete failed') }
    finally { setOperationLoading(null); setActionMenu(null); }
  };

  const toggleStatus = async (stock) => {
    const newStatus = stock.status === 'active' ? 'inactive' : 'active';
    setOperationLoading(`status-${stock.id}`);
    try {
      await axios.post(`${API_URL}/${stock.id}`, { status: newStatus, _method: 'POST', name: 'status_update' });
      showNotification(`Stock ${newStatus}`);
      fetchStocks(pagination.current_page, pagination.per_page, searchTerm);
    } catch (e) { handleApiError(e, 'Status update failed') }
    finally { setOperationLoading(null); setActionMenu(null); }
  };

  const stats = {
    total: pagination.total_items,
    quantity: stocks.reduce((acc, s) => acc + (parseFloat(s.quantity) || 0), 0),
    value: stocks.reduce((acc, s) => acc + (parseFloat(s.quantity) * parseFloat(s.buying_price) || 0), 0),
    due: stocks.reduce((acc, s) => acc + (parseFloat(s.due_amount) || 0), 0),
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-blue-500/30">
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '50%' }}
            animate={{ opacity: 1, y: 0, x: '50%' }}
            exit={{ opacity: 0, y: -20, x: '50%' }}
            className={`fixed top-6 right-1/2 translate-x-1/2 z-[60] px-6 py-3 rounded-full shadow-2xl backdrop-blur-md border flex items-center gap-3 font-medium ${notification.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/50 text-rose-400'
                : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
              }`}
          >
            {notification.type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-500">
                Stock Management
              </span>
            </h1>
            <p className="text-slate-400 text-lg font-light">
              Track inventory, costs, and movements
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openModal()}
            className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-bold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all flex items-center gap-2 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <Plus size={20} className="relative z-10" />
            <span className="relative z-10">Add Stock</span>
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Entries', value: stats.total, icon: Package, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
            { label: 'Total Items', value: stats.quantity, icon: Hash, color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20' },
            { label: 'Stock Value', value: formatCurrency(stats.value), icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
            { label: 'Total Due', value: formatCurrency(stats.due), icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' },
          ].map((stat, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i}
              className={`relative overflow-hidden p-6 rounded-2xl border ${stat.border} bg-white/5 backdrop-blur-sm group`}
            >
              <div className={`absolute top-0 right-0 p-32 opacity-10 rounded-full blur-3xl ${stat.bg}`} />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-slate-400 font-medium mb-1">{stat.label}</p>
                  <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                </div>
                <div className={`p-4 rounded-xl ${stat.bg}`}>
                  <stat.icon size={24} className={stat.color} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md flex flex-col xl:flex-row gap-4 items-center justify-between sticky top-4 z-40 shadow-2xl shadow-black/50">
          <div className="relative w-full xl:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search stocks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">
            <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-3 rounded-xl border border-white/10 whitespace-nowrap">
              <Filter size={16} className="text-slate-400" />
              <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="bg-transparent border-none text-sm text-slate-300 focus:ring-0 cursor-pointer outline-none w-24">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-3 rounded-xl border border-white/10 whitespace-nowrap">
              <Building size={16} className="text-slate-400" />
              <select value={filters.warehouse} onChange={e => setFilters({ ...filters, warehouse: e.target.value })} className="bg-transparent border-none text-sm text-slate-300 focus:ring-0 cursor-pointer outline-none max-w-[150px]">
                <option value="all">All Warehouses</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <button
              onClick={() => fetchStocks(pagination.current_page, pagination.per_page, searchTerm)}
              className="p-3 bg-slate-900/50 rounded-xl border border-white/10 hover:border-blue-500/30 hover:text-blue-400 transition-colors shrink-0"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-sm uppercase tracking-wider text-slate-400">
                  <th className="p-4 font-semibold">Product</th>
                  <th className="p-4 font-semibold">Vendor</th>
                  <th className="p-4 font-semibold">Warehouse</th>
                  <th className="p-4 font-semibold text-right">Qty</th>
                  <th className="p-4 font-semibold text-right">Buy Price</th>
                  <th className="p-4 font-semibold text-right">Total</th>
                  <th className="p-4 font-semibold text-right">Due</th>
                  <th className="p-4 font-semibold text-center">Date</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stocks.filter(s =>
                  (filters.status === 'all' || s.status === filters.status) &&
                  (filters.warehouse === 'all' || (s.warehouse?.id == filters.warehouse))
                ).map((stock) => (
                  <tr key={stock.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div>
                        <div className="font-bold text-white">{stock.product?.name || 'Unknown Item'}</div>
                        <div className="text-xs text-slate-500">{stock.product?.product_type?.name}</div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300 text-sm">{stock.vendor?.name || '-'}</td>
                    <td className="p-4 text-slate-300 text-sm">{stock.warehouse?.name || '-'}</td>
                    <td className="p-4 text-right font-mono text-cyan-300">{stock.quantity}</td>
                    <td className="p-4 text-right font-mono text-slate-300">{formatCurrency(stock.buying_price)}</td>
                    <td className="p-4 text-right font-mono text-emerald-300 font-bold">{formatCurrency(stock.total_amount)}</td>
                    <td className="p-4 text-right font-mono text-rose-300">{parseFloat(stock.due_amount) > 0 ? formatCurrency(stock.due_amount) : '-'}</td>
                    <td className="p-4 text-center text-xs text-slate-500">{stock.stock_date ? new Date(stock.stock_date).toLocaleDateString() : '-'}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleStatus(stock)}
                        className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${stock.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                          }`}>
                        {stock.status}
                      </button>
                    </td>
                    <td className="p-4 text-right relative">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openModal(stock)} className="p-2 hover:bg-white/10 rounded-lg text-blue-400 transition-colors"><Edit size={16} /></button>
                        <button onClick={() => handleDelete(stock.id)} className="p-2 hover:bg-white/10 rounded-lg text-rose-400 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && stocks.length === 0 && (
              <div className="p-12 text-center text-slate-500">
                <Package size={48} className="mx-auto mb-4 opacity-50" />
                <p>No stock entries found.</p>
              </div>
            )}
          </div>
          {!loading && pagination.total_pages > 1 && (
            <div className="p-4 border-t border-white/5 flex justify-center">
              <div className="flex gap-2">
                <button onClick={() => handlePageChange(pagination.current_page - 1)} disabled={pagination.current_page === 1} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-50"><ChevronLeft size={16} /></button>
                <span className="px-4 py-2 text-sm text-slate-400">Page {pagination.current_page}</span>
                <button onClick={() => handlePageChange(pagination.current_page + 1)} disabled={pagination.current_page === pagination.total_pages} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-50"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-4xl bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-cyan-600" />

              <form onSubmit={handleSubmit} className="flex flex-col h-full">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900 sticky top-0 z-10">
                  <h2 className="text-2xl font-bold text-white mb-1">{editingStock ? 'Edit Stock' : 'New Stock Entry'}</h2>
                  <button type="button" onClick={closeModal} className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
                </div>

                <div className="p-8 space-y-8">
                  {/* Core Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Product *</label>
                      <select name="product_id" value={formData.product_id} onChange={handleProductChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none" required>
                        <option value="">Select Product...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Warehouse</label>
                      <select name="warehouse_id" value={formData.warehouse_id} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none">
                        <option value="">Select Warehouse...</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Vendor</label>
                      <select name="vendor_id" value={formData.vendor_id} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none">
                        <option value="">Select Vendor...</option>
                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Financials */}
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-6">
                    <h3 className="text-white font-bold flex items-center gap-2 border-b border-white/5 pb-2"><DollarSign size={18} className="text-emerald-400" /> Pricing & Quantity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Quantity *</label>
                        <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none font-mono" placeholder="0" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Buy Price *</label>
                        <input type="number" name="buying_price" value={formData.buying_price} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none font-mono" placeholder="0.00" required step="0.01" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Tax %</label>
                        <input type="number" name="tax" value={formData.tax} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none font-mono" placeholder="0" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Sell Price</label>
                        <input type="number" name="selling_price" value={formData.selling_price} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none font-mono" placeholder="0.00" step="0.01" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/5 pt-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Total Amount</label>
                        <input type="number" name="total_amount" value={formData.total_amount} readOnly className="w-full bg-slate-900 border border-white/5 rounded-xl py-3 px-4 text-emerald-400 font-bold outline-none font-mono" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Paid Amount</label>
                        <input type="number" name="paid_amount" value={formData.paid_amount} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none font-mono" placeholder="0.00" step="0.01" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Due Amount</label>
                        <input type="number" name="due_amount" value={formData.due_amount} readOnly className="w-full bg-slate-900 border border-white/5 rounded-xl py-3 px-4 text-rose-400 font-bold outline-none font-mono" />
                      </div>
                    </div>
                  </div>

                  {/* Dates & Extras */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Stock Date</label>
                      <input type="date" name="stock_date" value={formData.stock_date} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Expire Date</label>
                      <input type="date" name="expire_date" value={formData.expire_date} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Payment Type</label>
                      <select name="payment_type_id" value={formData.payment_type_id} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                      >
                        <option value="">Select Payment...</option>
                        {paymentTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Electronic Items Logic */}
                  {isElectronic && !editingStock && (formData.quantity > 0) && (
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 space-y-4">
                      <h3 className="text-blue-300 font-bold flex items-center gap-2"><Hash size={18} /> Electronic Serial Numbers</h3>
                      <p className="text-xs text-blue-400/70">Please enter unique identifiers for each item.</p>
                      <div className="max-h-60 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        {skuInputs.map((_, i) => (
                          <div key={i} className="flex gap-4 items-center">
                            <span className="text-xs text-slate-500 w-6">{i + 1}.</span>
                            <input placeholder="SKU/Serial" value={skuInputs[i]} onChange={e => { const n = [...skuInputs]; n[i] = e.target.value; setSkuInputs(n) }} className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" />
                            <input placeholder="Color" value={colorInputs[i]} onChange={e => { const n = [...colorInputs]; n[i] = e.target.value; setColorInputs(n) }} className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" />
                            <input placeholder="Note (Opt)" value={noteInputs[i]} onChange={e => { const n = [...noteInputs]; n[i] = e.target.value; setNoteInputs(n) }} className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                <div className="p-6 border-t border-white/5 bg-slate-900/50 flex justify-end gap-3 sticky bottom-0 z-10 backdrop-blur-md">
                  <button type="button" onClick={closeModal} className="px-6 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-medium">Cancel</button>
                  <button type="submit" disabled={operationLoading === 'saving'} className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 disabled:opacity-50 flex items-center gap-2 transform active:scale-95 transition-all">
                    {operationLoading === 'saving' ? <RefreshCw size={18} className="animate-spin" /> : (editingStock ? <Check size={18} /> : <Plus size={18} />)}
                    {editingStock ? 'Save Changes' : 'Create Stock'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StocksManager;
