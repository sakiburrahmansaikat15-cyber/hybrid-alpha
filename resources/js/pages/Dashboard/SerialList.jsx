import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Check,
  Eye, EyeOff, Package, Upload, Barcode,
  ChevronLeft, ChevronRight, Loader, Filter,
  RefreshCw, MoreVertical, ScanLine, Tag
} from 'lucide-react';

const API_URL = '/api/serial-list';
const STOCKS_URL = '/api/stocks';

const SerialList = () => {
  const [serials, setSerials] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSerial, setEditingSerial] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionMenu, setActionMenu] = useState(null);

  const [formData, setFormData] = useState({
    stock_id: '',
    sku: '',
    barcode: '',
    color: '',
    notes: '',
    image: null,
    status: 'active'
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const [pagination, setPagination] = useState({
    current_page: 1, per_page: 12, total_items: 0, total_pages: 1
  });

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
  }, []);

  const handleApiError = useCallback((error, defaultMessage) => {
    if (error.response?.status === 422) {
      const validationErrors = error.response.data.errors || {};
      setErrors(validationErrors);
      showNotification('Please check input fields', 'error');
    } else {
      showNotification(error.response?.data?.message || defaultMessage || 'Something went wrong', 'error');
    }
  }, [showNotification]);

  const fetchStocks = useCallback(async () => {
    try {
      const response = await axios.get(STOCKS_URL, { params: { limit: 100 } });
      const data = response.data.pagination || response.data;
      setStocks(data.data || []);
    } catch (error) {
      console.error("Failed to load stocks", error);
    }
  }, []);

  const fetchSerials = useCallback(async (page = 1, limit = 12, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await axios.get(API_URL, { params });
      const data = response.data.pagination || response.data;
      const list = data.data || [];

      setSerials(list.map(item => ({
        ...item,
        stock_id: item.stock_id,
        sku: item.sku || '',
        color: item.color || '',
        barcode: item.barcode || '',
        notes: item.notes || '',
        status: item.status || 'active',
        product_name: item.stock?.product?.name || 'N/A',
      })));

      setPagination({
        current_page: data.current_page || 1,
        per_page: data.per_page || limit,
        total_items: data.total_items || 0,
        total_pages: data.total_pages || 1
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch serials');
      setSerials([]);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    fetchSerials(1, 12);
    fetchStocks();
  }, [fetchSerials, fetchStocks]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSerials(1, pagination.per_page, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchSerials]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (actionMenu && !e.target.closest('.action-menu-container')) {
        setActionMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [actionMenu]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.total_pages) return;
    fetchSerials(newPage, pagination.per_page, searchTerm);
  };

  const openModal = (serial = null) => {
    setErrors({});
    // Refresh stocks when opening modal to ensure latest are available
    if (stocks.length === 0) fetchStocks();

    if (serial) {
      setEditingSerial(serial);
      setFormData({
        stock_id: serial.stock_id || '',
        sku: serial.sku || '',
        barcode: serial.barcode || '',
        color: serial.color || '',
        notes: serial.notes || '',
        image: null,
        status: serial.status || 'active'
      });
      setImagePreview(serial.image ? `/${serial.image}` : null);
    } else {
      setEditingSerial(null);
      setFormData({
        stock_id: '', sku: '', barcode: '', color: '', notes: '', image: null, status: 'active'
      });
      setImagePreview(null);
    }
    setShowModal(true);
    setActionMenu(null);
  };

  const closeModal = () => setShowModal(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'image' && !formData.image) return;
      if (formData[key] !== null) data.append(key, formData[key]);
    });

    if (editingSerial) data.append('_method', 'POST'); // FormData requires POST

    try {
      await axios.post(editingSerial ? `${API_URL}/${editingSerial.id}?_method=PUT` : API_URL, data);
      showNotification(editingSerial ? 'Serial updated' : 'Serial created');
      fetchSerials(pagination.current_page, pagination.per_page, searchTerm);
      closeModal();
    } catch (error) {
      handleApiError(error, 'Failed to save');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this serial?')) return;
    setOperationLoading(`delete-${id}`);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Deleted successfully');
      fetchSerials(pagination.current_page, pagination.per_page, searchTerm);
    } catch (e) { handleApiError(e, 'Delete failed') }
    finally { setOperationLoading(null); setActionMenu(null); }
  };

  const toggleStatus = async (serial) => {
    const newStatus = serial.status === 'active' ? 'inactive' : 'active';
    setOperationLoading(`status-${serial.id}`);
    try {
      // For simple status update, we can use PUT if backend supports simple update without all fields
      // But using FormData for consistency with store/update methods
      const data = new FormData();
      data.append('status', newStatus);
      // We often need to send at least one other field or use _method=PUT with post

      await axios.post(`${API_URL}/${serial.id}?_method=PUT`, data);

      showNotification(`Status: ${newStatus}`);
      fetchSerials(pagination.current_page, pagination.per_page, searchTerm);
    } catch (e) { handleApiError(e, 'Status change failed') }
    finally { setOperationLoading(null); setActionMenu(null); }
  };

  const getImageUrl = (path) => path ? (path.startsWith('http') ? path : `/${path}`) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-indigo-500/30">
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
            {notification.type === 'error' ? <ScanLine size={18} /> : <Check size={18} />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                Serial Registry
              </span>
            </h1>
            <p className="text-slate-400 text-lg font-light">
              Individual item tracking and genealogy
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openModal()}
            className="group relative px-6 py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all flex items-center gap-2 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <Plus size={20} className="relative z-10" />
            <span className="relative z-10">Register Serial</span>
          </motion.button>
        </div>

        {/* Controls */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md flex flex-col md:flex-row gap-4 items-center justify-between sticky top-4 z-40 shadow-2xl shadow-black/50">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search SKU, Barcode, Serial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-3 rounded-xl border border-white/10">
              <Filter size={16} className="text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent border-none text-sm text-slate-300 focus:ring-0 cursor-pointer outline-none w-24"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button
              onClick={() => fetchSerials(pagination.current_page, pagination.per_page, searchTerm)}
              className="p-3 bg-slate-900/50 rounded-xl border border-white/10 hover:border-indigo-500/30 hover:text-indigo-400 transition-colors"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Grid View */}
        {loading && !serials.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {serials.filter(s => filterStatus === 'all' || s.status === filterStatus).map(item => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={item.id}
                  className="group bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-900/10 transition-all duration-300 relative flex flex-col"
                >
                  <div className="h-32 bg-slate-800 relative overflow-hidden flex items-center justify-center">
                    {item.image ? (
                      <img src={getImageUrl(item.image)} alt={item.sku} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <Barcode className="text-slate-700 w-16 h-16 opacity-50" />
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border backdrop-blur-md ${item.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-700/50 text-slate-400 border-white/10'}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="absolute top-2 left-2 action-menu-container">
                      <button onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === item.id ? null : item.id) }} className="bg-black/40 backdrop-blur-md p-1.5 rounded-lg text-white/50 hover:text-white transition-colors border border-white/5"><MoreVertical size={16} /></button>
                      <AnimatePresence>
                        {actionMenu === item.id && (
                          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute left-0 top-full mt-2 w-40 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-20 py-1">
                            <button onClick={() => openModal(item)} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-indigo-400 flex items-center gap-2"><Edit size={14} /> Edit</button>
                            <button onClick={() => toggleStatus(item)} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-indigo-400 flex items-center gap-2"><Eye size={14} /> Toggle Status</button>
                            <button onClick={() => handleDelete(item.id)} className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"><Trash2 size={14} /> Delete</button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="mb-3">
                      <div className="text-xs text-indigo-400 font-mono mb-1 flex items-center gap-1"><Tag size={12} /> {item.sku}</div>
                      <h3 className="text-white font-bold leading-tight line-clamp-2" title={item.stock?.product?.name || 'Item'}>
                        {item.stock?.product?.name || 'Unknown Product'}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-auto text-xs text-slate-400">
                      <div className="bg-white/5 rounded p-1.5 text-center">
                        <span className="block text-[10px] uppercase text-slate-500">Color</span>
                        <span className="text-slate-200">{item.color || '-'}</span>
                      </div>
                      <div className="bg-white/5 rounded p-1.5 text-center">
                        <span className="block text-[10px] uppercase text-slate-500">Stock ID</span>
                        <span className="text-slate-200">{item.stock_id}</span>
                      </div>
                    </div>

                    {item.barcode && (
                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-xs text-slate-500 font-mono">
                        <ScanLine size={12} /> {item.barcode}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {!loading && !serials.length && (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4"><Barcode size={32} className="text-slate-500" /></div>
            <h3 className="text-white font-bold text-lg">No Items Found</h3>
            <button onClick={() => openModal()} className="mt-4 text-indigo-400 hover:text-indigo-300">Add New Serial</button>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.total_pages > 1 && (
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-1 bg-slate-900/50 p-2 rounded-xl border border-white/10">
              <button onClick={() => handlePageChange(pagination.current_page - 1)} disabled={pagination.current_page === 1} className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30"><ChevronLeft size={18} className="text-white" /></button>
              <span className="px-4 text-sm font-mono text-slate-400">{pagination.current_page} / {pagination.total_pages}</span>
              <button onClick={() => handlePageChange(pagination.current_page + 1)} disabled={pagination.current_page === pagination.total_pages} className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30"><ChevronRight size={18} className="text-white" /></button>
            </div>
          </div>
        )}

      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-cyan-600" />

              <form onSubmit={handleSubmit}>
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">{editingSerial ? 'Edit Serial' : 'Register Serial'}</h2>
                  <button type="button" onClick={closeModal}><X size={20} className="text-slate-400 hover:text-white" /></button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Image</label>
                    <div onClick={() => document.getElementById('serial-up').click()} className="h-32 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all overflow-hidden relative">
                      <input type="file" id="serial-up" hidden accept="image/*" onChange={handleImageChange} />
                      {imagePreview ? <img src={imagePreview} className="w-full h-full object-contain" /> : <div className="text-center"><Upload className="mx-auto mb-2 text-slate-500" size={20} /><span className="text-xs text-slate-400">Upload Photo</span></div>}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Stock / Product</label>
                    <select
                      name="stock_id"
                      value={formData.stock_id}
                      onChange={handleInputChange}
                      className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
                      required
                    >
                      <option value="">Select Stock Source</option>
                      {stocks.map(stock => (
                        <option key={stock.id} value={stock.id}>
                          {stock.product?.name || `Stock #${stock.id}`} (Quantity: {stock.quantity})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500">Select the stock batch this serial belongs to.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">SKU / Serial</label>
                      <input type="text" name="sku" value={formData.sku} onChange={handleInputChange} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none" required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Barcode</label>
                      <input type="text" name="barcode" value={formData.barcode} onChange={handleInputChange} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Color</label>
                    <input type="text" name="color" value={formData.color} onChange={handleInputChange} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Notes</label>
                    <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="2" className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none resize-none" />
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    {['active', 'inactive'].map(s => (
                      <label key={s} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${formData.status === s ? (s === 'active' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-rose-500/20 border-rose-500 text-rose-300') : 'border-white/10 hover:bg-white/5'}`}>
                        <input type="radio" name="status" value={s} checked={formData.status === s} onChange={handleInputChange} className="hidden" />
                        <span className="capitalize font-bold text-sm">{s}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-slate-900 border-t border-white/5 flex justify-end gap-3">
                  <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
                  <button type="submit" disabled={operationLoading} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-indigo-900/20 flex items-center gap-2">
                    {operationLoading && <Loader size={14} className="animate-spin" />} {editingSerial ? 'Update' : 'Register'}
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

export default SerialList;
