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
  MoreVertical,
  ShoppingCart,
  Monitor,
  Calendar,
  Loader,
  ChevronLeft,
  ChevronRight,
  Package,
  DollarSign,
  Percent,
  Truck,
  Clock,
} from 'lucide-react';

const API_URL = 'http://localhost:8000/api/pos/hold-carts';
const TERMINALS_API_URL = 'http://localhost:8000/api/pos/terminals';

const HoldCarts = () => {
  const [holdCarts, setHoldCarts] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCart, setEditingCart] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMenu, setActionMenu] = useState(null);
  const [formData, setFormData] = useState({
    terminal_id: '',
    cart_data: '',
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

  const handleApiError = useCallback((error, defaultMessage) => {
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
  }, [showNotification]);

  // Parse cart_data safely
  const parseCartData = (cartDataStr) => {
    if (!cartDataStr) return null;
    try {
      const cleaned = cartDataStr
        .replace(/^"(.*)"$/, '$1')
        .replace(/\\"/g, '"')
        .replace(/\\n/g, '\n');
      return JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse cart_data:', e);
      return null;
    }
  };

  const fetchHoldCarts = useCallback(async (page = 1, perPage = 10, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit: perPage };
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await axios.get(API_URL, { params });
      const res = response.data;

      const cartData = res.pagination?.data || [];
      const formattedCarts = cartData.map(item => ({
        id: item.id,
        terminal_id: item.terminal_id,
        terminal: item.terminal || null,
        cart_data: item.cart_data || null,
        created_at: item.created_at,
        updated_at: item.updated_at,
        parsed_cart: parseCartData(item.cart_data), // Add parsed version
      }));

      setHoldCarts(formattedCarts);
      setPagination({
        current_page: res.pagination.current_page || 1,
        last_page: res.pagination.total_pages || 1,
        per_page: res.pagination.per_page || 10,
        total_items: res.pagination.total_items || 0,
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch hold carts');
      setHoldCarts([]);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const fetchTerminals = useCallback(async () => {
    try {
      const response = await axios.get(TERMINALS_API_URL);
      const res = response.data;
      const terminalData = res.pagination?.data || [];
      setTerminals(terminalData);
    } catch (error) {
      setTerminals([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHoldCarts(1, pagination.per_page, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchHoldCarts]);

  useEffect(() => {
    fetchHoldCarts(1, 10);
    fetchTerminals();
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page) return;
    fetchHoldCarts(newPage, pagination.per_page, searchTerm);
  };

  const handleLimitChange = (newLimit) => {
    const limit = parseInt(newLimit);
    setPagination(prev => ({ ...prev, per_page: limit }));
    fetchHoldCarts(1, limit, searchTerm);
  };

  const resetForm = () => {
    setFormData({ terminal_id: '', cart_data: '' });
    setEditingCart(null);
    setErrors({});
  };

  const openModal = (cart = null) => {
    if (cart) {
      setEditingCart(cart);
      setFormData({
        terminal_id: cart.terminal_id || '',
        cart_data: cart.cart_data || '',
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(resetForm, 300);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');
    setErrors({});

    try {
      const submitData = {
        terminal_id: parseInt(formData.terminal_id),
        cart_data: formData.cart_data.trim() || null,
      };

      if (editingCart) {
        await axios.post(`${API_URL}/${editingCart.id}`, submitData);
      } else {
        await axios.post(API_URL, submitData);
      }

      showNotification(`Hold cart ${editingCart ? 'updated' : 'created'} successfully!`);
      fetchHoldCarts(pagination.current_page, pagination.per_page, searchTerm);
      closeModal();
    } catch (error) {
      handleApiError(error, 'Failed to save hold cart');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this hold cart permanently?')) return;
    setOperationLoading(`delete-${id}`);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Hold cart deleted successfully');

      const remainingItems = pagination.total_items - 1;
      const maxPage = Math.ceil(remainingItems / pagination.per_page);
      const targetPage = pagination.current_page > maxPage ? maxPage : pagination.current_page;

      fetchHoldCarts(targetPage || 1, pagination.per_page, searchTerm);
    } catch (error) {
      handleApiError(error, 'Delete failed');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'N/A';

  const formatTime = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    const handler = () => setActionMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  if (loading && holdCarts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex justify-between">
            <div className="h-10 bg-gray-800 rounded w-64 animate-pulse"></div>
            <div className="h-12 bg-gray-800 rounded-xl w-40 animate-pulse"></div>
          </div>
          <div className="bg-gray-800/30 rounded-2xl p-6 mb-8 animate-pulse space-y-4">
            <div className="h-12 bg-gray-700 rounded"></div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-800/30 rounded-2xl p-6 animate-pulse space-y-4">
                <div className="h-8 bg-gray-700 rounded"></div>
                <div className="h-32 bg-gray-700/50 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 py-8">
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl ${notification.type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white font-medium`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
              Hold Carts Management
            </h1>
            <p className="text-gray-400 mt-2">Manage temporarily saved shopping carts from POS terminals</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-6 py-3 rounded-xl font-bold flex items-center gap-3 shadow-lg"
          >
            <Plus size={22} /> Hold New Cart
          </button>
        </div>

        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/30">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by hold cart ID or terminal name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none"
              />
            </div>
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
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { staggerChildren: 0.1 } }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8"
        >
          {holdCarts.map(cart => {
            const cartInfo = cart.parsed_cart;
            const hasItems = cartInfo && cartInfo.items && cartInfo.items.length > 0;

            return (
              <motion.div
                key={cart.id}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 hover:border-blue-500/50 transition-all overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <ShoppingCart size={20} className="text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Hold Cart #{cart.id}</h3>
                        <p className="text-sm text-gray-400 flex items-center gap-1">
                          <Monitor size={14} /> {cart.terminal?.name || 'Unknown Terminal'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === cart.id ? null : cart.id); }}
                      className="p-2 hover:bg-gray-700/50 rounded-lg"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>

                  {/* Professional Cart Summary */}
                  <div className="space-y-4">
                    {hasItems ? (
                      <>
                        {/* Summary Header */}
                        <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl p-4 border border-blue-500/30">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <Package size={18} className="text-cyan-400" />
                              <span className="font-semibold">{cartInfo.items.length} Item{cartInfo.items.length > 1 ? 's' : ''}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-cyan-400">${parseFloat(cartInfo.total || 0).toFixed(2)}</p>
                              <p className="text-xs text-gray-400">Total Amount</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-gray-400" />
                              <span>{cartInfo.total_qty} pcs</span>
                            </div>
                            <div className="flex items-center gap-2 justify-end">
                              <Percent size={14} className="text-yellow-400" />
                              <span>Tax: {cartInfo.displayed_tax_percent || 0}%</span>
                            </div>
                            {cartInfo.discount_value > 0 && (
                              <div className="col-span-2 text-green-400 text-xs">
                                Discount Applied: ${parseFloat(cartInfo.discount_value).toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Items List */}
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {cartInfo.items.map((item, idx) => (
                            <div key={idx} className="flex gap-3 bg-gray-700/30 rounded-lg p-3">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                              ) : (
                                <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                                  <Package size={24} className="text-gray-500" />
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-sm truncate">{item.name}</p>
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                  <span>{item.quantity} × ${parseFloat(item.price).toFixed(2)}</span>
                                  <span className="font-semibold text-cyan-400">
                                    ${(item.quantity * item.price).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Timestamp */}
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-3 border-t border-gray-700/50">
                          <Clock size={14} />
                          Held on: {formatTime(cartInfo.timestamp)}
                        </div>
                      </>
                    ) : (
                      <div className="bg-gray-700/30 rounded-lg p-8 text-center">
                        <Package size={40} className="mx-auto text-gray-600 mb-3" />
                        <p className="text-gray-400">Empty or invalid cart data</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700/30">
                    <span className="text-xs text-gray-500">Created: {formatDate(cart.created_at)}</span>
                    <div className="flex gap-2">
                      <button onClick={() => openModal(cart)} className="p-2 bg-blue-500/20 hover:bg-blue-500/40 rounded-lg">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDelete(cart.id)} disabled={operationLoading === `delete-${cart.id}`} className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg disabled:opacity-50">
                        {operationLoading === `delete-${cart.id}` ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {actionMenu === cart.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute right-4 top-20 bg-gray-800 border border-gray-600 rounded-xl shadow-xl py-2 z-10 min-w-[160px]"
                    >
                      <button onClick={() => { openModal(cart); setActionMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-sm">
                        <Edit size={16} /> Edit
                      </button>
                      <button onClick={() => { handleDelete(cart.id); setActionMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-red-500/20 text-red-400 flex items-center gap-3 text-sm">
                        <Trash2 size={16} /> Delete
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Pagination & Empty State - unchanged */}
        {pagination.last_page > 1 && (
          <div className="flex justify-between items-center py-6 border-t border-gray-700/30">
            <div className="text-sm text-gray-400">
              Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{' '}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total_items)} of {pagination.total_items}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="px-4 py-2 rounded-xl border border-gray-600 disabled:opacity-50 flex items-center gap-2"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pagination.last_page || Math.abs(p - pagination.current_page) <= 2)
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && p - arr[idx - 1] > 1 && <span className="px-3">...</span>}
                    <button
                      onClick={() => handlePageChange(p)}
                      className={`px-4 py-2 rounded-xl border ${pagination.current_page === p ? 'bg-blue-600 border-blue-500' : 'border-gray-600'}`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
                className="px-4 py-2 rounded-xl border border-gray-600 disabled:opacity-50 flex items-center gap-2"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {holdCarts.length === 0 && !loading && (
          <div className="text-center py-20">
            <ShoppingCart size={64} className="mx-auto text-gray-600 mb-6" />
            <h3 className="text-2xl font-bold mb-3">{searchTerm ? 'No hold carts found' : 'No hold carts yet'}</h3>
            <p className="text-gray-400 mb-8">{searchTerm ? 'Try different keywords' : 'No carts are currently on hold'}</p>
            {!searchTerm && (
              <button onClick={() => openModal()} className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-3 rounded-xl font-bold">
                <Plus className="inline mr-2" /> Hold First Cart
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal - unchanged (kept as is) */}
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
              className="bg-gray-800 rounded-3xl p-8 max-w-lg w-full border border-gray-700"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                  {editingCart ? 'Edit Hold Cart' : 'Hold New Cart'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-700 rounded-lg">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Terminal *</label>
                  <select
                    name="terminal_id"
                    value={formData.terminal_id}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.terminal_id ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select a terminal</option>
                    {terminals.map(term => (
                      <option key={term.id} value={term.id}>{term.name}</option>
                    ))}
                  </select>
                  {errors.terminal_id && <p className="text-red-400 text-sm mt-1">{Array.isArray(errors.terminal_id) ? errors.terminal_id[0] : errors.terminal_id}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Notes (Optional)</label>
                  <textarea
                    name="cart_data"
                    value={formData.cart_data}
                    onChange={handleInputChange}
                    rows="6"
                    placeholder="e.g., Customer will pick up tomorrow, waiting for payment confirmation..."
                    className={`w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.cart_data ? 'border-red-500' : ''}`}
                  />
                  <p className="text-xs text-gray-500 mt-1">Any free text notes about this held cart</p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={operationLoading === 'saving'}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-bold flex items-center gap-2 disabled:opacity-70"
                  >
                    {operationLoading === 'saving' ? <Loader size={20} className="animate-spin" /> : <Check size={20} />}
                    {editingCart ? 'Update' : 'Hold'} Cart
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HoldCarts;
