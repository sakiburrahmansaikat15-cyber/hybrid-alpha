import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Trash2, X, Loader, ChevronLeft, ChevronRight,
  Activity, Zap, History, Clock, Monitor, Package, ArrowRight, RotateCcw
} from 'lucide-react';

const API_URL = '/api/pos/hold-carts';
const TERMINALS_API = '/api/pos/terminals';

const HoldCarts = () => {
  const [carts, setCarts] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTerminal, setSelectedTerminal] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 12, total_items: 0 });

  const notificationTimerRef = useRef(null);

  const showNotification = useCallback((message, type = 'success') => {
    if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    setNotification({ show: true, message, type });
    notificationTimerRef.current = setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3500);
  }, []);

  useEffect(() => () => { if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current); }, []);

  const handleApiError = useCallback((error) => {
    const msg = error.response?.data?.message || 'Operation failed';
    showNotification(msg, 'error');
  }, [showNotification]);

  const fetchCarts = useCallback(async (page = 1, keyword = searchTerm) => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.per_page };
      if (keyword.trim()) params.keyword = keyword.trim();
      if (selectedTerminal) params.terminal_id = selectedTerminal;

      const response = await axios.get(API_URL, { params });
      const res = response.data;
      setCarts(res.pagination?.data || res.data || []);
      setPagination({
        current_page: res.pagination?.current_page || res.current_page || 1,
        last_page: res.pagination?.total_pages || res.last_page || 1,
        per_page: res.pagination?.per_page || res.per_page || 12,
        total_items: res.pagination?.total_items || res.total || 0,
      });
    } catch (error) {
      handleApiError(error);
      setCarts([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.per_page, searchTerm, selectedTerminal, handleApiError]);

  const fetchTerminals = useCallback(async () => {
    try {
      const response = await axios.get(TERMINALS_API);
      setTerminals(response.data.pagination?.data || response.data.data || []);
    } catch (e) { console.error('Failed to load terminals'); }
  }, []);

  useEffect(() => {
    fetchTerminals();
  }, [fetchTerminals]);

  useEffect(() => {
    const timer = setTimeout(() => fetchCarts(1), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedTerminal, fetchCarts]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page) return;
    fetchCarts(newPage);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this held cart?')) return;
    setOperationLoading(id);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Cart deleted successfully');
      fetchCarts(1);
    } catch (error) {
      handleApiError(error);
    } finally {
      setOperationLoading(null);
    }
  };

  // Helper to parse cart data safely
  const parseCartData = (cartData) => {
    try {
      // Handle nested JSON strings which might happen with some serializers
      const parsed = typeof cartData === 'string' ? JSON.parse(cartData) : cartData;
      return typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
    } catch (e) {
      return { items: [], total: 0 };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <AnimatePresence>
        {notification.show && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="fixed top-4 right-4 z-50">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm border ${notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' : 'bg-amber-500/10 border-amber-500/20 text-amber-600'}`}>
              <Zap size={16} />
              <span className="font-semibold text-sm">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight dark:text-white mb-1 flex items-center gap-3">
              <History className="text-amber-500" /> Held Carts
            </h1>
            <p className="text-sm text-slate-500">Manage suspended transactions and saved carts</p>
          </div>

          <div className="relative">
            <Monitor className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select
              value={selectedTerminal}
              onChange={e => setSelectedTerminal(e.target.value)}
              className="pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none appearance-none shadow-sm"
            >
              <option value="">All Terminals</option>
              {terminals.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 transform rotate-90 text-slate-400 pointer-events-none" size={14} />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="lg:col-span-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by ID or content..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
            />
          </div>
          <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <Activity className="text-amber-500" size={18} />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</span>
            </div>
            <span className="text-xl font-bold text-amber-600">{pagination.total_items}</span>
          </div>
        </div>

        {loading && carts.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-56 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-800" />)}
          </div>
        ) : carts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {carts.map((cart) => {
                const data = parseCartData(cart.cart_data);
                return (
                  <motion.div
                    key={cart.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -4 }}
                    className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all flex flex-col h-full"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 font-bold text-xs uppercase tracking-wider border border-amber-100 dark:border-amber-800/30">
                        SAVED #{cart.id}
                      </div>
                      <button
                        onClick={() => handleDelete(cart.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                      >
                        {operationLoading === cart.id ? <Loader className="animate-spin" size={16} /> : <Trash2 size={16} />}
                      </button>
                    </div>

                    <div className="flex-1 space-y-4 mb-6">
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-500 uppercase font-semibold mb-1">Total Value</span>
                          <span className="text-3xl font-black text-slate-900 dark:text-white">
                            ${parseFloat(data.total || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-slate-500 uppercase font-semibold mb-1">Items</span>
                          <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                            <Package size={16} /> {data.items?.length || 0}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 space-y-2">
                        {data.items?.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                            <span className="truncate pr-2">{item.name}</span>
                            <span className="font-medium whitespace-nowrap">x{item.quantity}</span>
                          </div>
                        ))}
                        {(data.items?.length || 0) > 3 && (
                          <p className="text-xs text-slate-400 italic font-medium pt-1 border-t border-slate-100 dark:border-slate-700">
                            + {(data.items?.length || 0) - 3} more items
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <Clock size={14} />
                        {new Date(cart.created_at).toLocaleString()}
                      </span>
                      <button
                        onClick={() => window.location.href = '/pos/checkout'} // Ideally use router navigation and pass cart data via state/context
                        className="text-amber-500 hover:text-amber-600 font-bold text-sm flex items-center gap-1 transition-colors"
                      >
                        Reload <RotateCcw size={16} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <span className="text-sm font-medium text-slate-500">Page {pagination.current_page} of {pagination.last_page}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-amber-500 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-amber-500 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <History size={64} className="mb-4 opacity-50" />
            <p className="font-semibold text-lg">No Pending Transactions</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HoldCarts;
