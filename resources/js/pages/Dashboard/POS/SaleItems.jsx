import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Package, Calendar, ChevronLeft, ChevronRight,
  Activity, Zap, DollarSign, Tag, ShoppingBag, ArrowUpRight
} from 'lucide-react';

const API_URL = '/api/pos/sale-items';

const SaleItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 12, total_items: 0 });
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const notificationTimerRef = useRef(null);

  const showNotification = useCallback((message, type = 'success') => {
    if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    setNotification({ show: true, message, type });
    notificationTimerRef.current = setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3500);
  }, []);

  useEffect(() => () => { if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current); }, []);

  const handleApiError = useCallback((error) => {
    const msg = error.response?.data?.message || 'Failed to load sale items';
    showNotification(msg, 'error');
  }, [showNotification]);

  const perPageValue = pagination.per_page;
  const fetchItems = useCallback(async (page = 1, perPage = perPageValue, keyword = searchTerm) => {
    setLoading(true);
    try {
      const params = { page, limit: perPage };
      if (keyword.trim()) params.keyword = keyword.trim();
      const response = await axios.get(API_URL, { params });
      const res = response.data;
      setItems(res.pagination?.data || res.data || []);
      setPagination({
        current_page: res.pagination?.current_page || res.current_page || 1,
        last_page: res.pagination?.total_pages || res.last_page || 1,
        per_page: res.pagination?.per_page || res.per_page || 12,
        total_items: res.pagination?.total_items || res.total || 0,
      });
    } catch (error) {
      handleApiError(error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [handleApiError, perPageValue, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => fetchItems(1), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, perPageValue, fetchItems]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page) return;
    fetchItems(newPage);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <AnimatePresence>
        {notification.show && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="fixed top-4 right-4 z-50">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm border ${notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'}`}>
              <Zap size={16} />
              <span className="font-semibold text-sm">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight dark:text-white mb-1 flex items-center gap-3">
              <Package className="text-emerald-500" /> Sale Items
            </h1>
            <p className="text-sm text-slate-500">Comprehensive log of individual sold units</p>
          </div>
        </header>

        {/* Stats / Filter Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="lg:col-span-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by product name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
            />
          </div>
          <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <Activity className="text-emerald-500" size={18} />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Records</span>
            </div>
            <span className="text-xl font-bold text-emerald-600">{pagination.total_items}</span>
          </div>
        </div>

        {loading && items.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="h-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse" />)}
          </div>
        ) : items.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                      <ShoppingBag size={20} />
                    </div>
                    <span className="text-xs font-medium text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">
                      ID: {item.sale_id}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate mb-1">
                    {item.product?.name || 'Unknown Product'}
                  </h3>

                  <div className="space-y-3 mt-4">
                    <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="text-slate-500 flex items-center gap-2"><Tag size={14} /> Quantity</span>
                      <span className="font-bold text-slate-900 dark:text-white">{item.quantity}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="text-slate-500 flex items-center gap-2"><DollarSign size={14} /> Unit Price</span>
                      <span className="font-medium text-slate-900 dark:text-white">${parseFloat(item.price).toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg mt-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total</span>
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        ${(parseFloat(item.price) * parseFloat(item.quantity)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {item.created_at && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-400">
                      <Calendar size={12} />
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <span className="text-sm font-medium text-slate-500">
                Page <span className="text-slate-900 dark:text-white">{pagination.current_page}</span> of {pagination.last_page}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 disabled:opacity-40 hover:bg-emerald-500 hover:text-white transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 disabled:opacity-40 hover:bg-emerald-500 hover:text-white transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300 dark:text-slate-700">
            <Package size={80} strokeWidth={1} className="mb-4 opacity-50" />
            <p className="font-semibold text-lg">No Items Recorded</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaleItems;