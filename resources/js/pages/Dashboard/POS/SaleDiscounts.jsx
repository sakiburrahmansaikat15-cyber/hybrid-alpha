import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Tag, ChevronLeft, ChevronRight, Activity, Zap, Percent, Calendar, DollarSign
} from 'lucide-react';

const API_URL = '/api/pos/sale-discounts';

const SaleDiscounts = () => {
  const [discounts, setDiscounts] = useState([]);
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
    const msg = error.response?.data?.message || 'Failed to load discount records';
    showNotification(msg, 'error');
  }, [showNotification]);

  const fetchDiscounts = useCallback(async (page = 1, keyword = searchTerm) => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.per_page };
      if (keyword.trim()) params.keyword = keyword.trim();
      const response = await axios.get(API_URL, { params });
      const res = response.data;
      setDiscounts(res.pagination?.data || res.data || []);
      setPagination({
        current_page: res.pagination?.current_page || res.current_page || 1,
        last_page: res.pagination?.total_pages || res.last_page || 1,
        per_page: res.pagination?.per_page || res.per_page || 12,
        total_items: res.pagination?.total_items || res.total || 0,
      });
    } catch (error) {
      handleApiError(error);
      setDiscounts([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.per_page, searchTerm, handleApiError]);

  useEffect(() => {
    const timer = setTimeout(() => fetchDiscounts(1), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchDiscounts]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page) return;
    fetchDiscounts(newPage);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <AnimatePresence>
        {notification.show && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="fixed top-4 right-4 z-50">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm border ${notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' : 'bg-green-500/10 border-green-500/20 text-green-600'}`}>
              <Zap size={16} />
              <span className="font-semibold text-sm">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight dark:text-white mb-1 flex items-center gap-3">
            <Tag className="text-green-500" /> Sale Discounts
          </h1>
          <p className="text-sm text-slate-500">Log of discounts applied to transactions</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="lg:col-span-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search discount records..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all font-medium"
            />
          </div>
          <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <Activity className="text-green-500" size={18} />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</span>
            </div>
            <span className="text-xl font-bold text-green-600">{pagination.total_items}</span>
          </div>
        </div>

        {loading && discounts.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-800" />)}
          </div>
        ) : discounts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {discounts.map((discount) => (
                <motion.div
                  key={discount.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-green-500/40 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 font-bold text-sm tracking-wide">
                      SALE #{discount.sale_id}
                    </div>
                    {discount.created_at && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(discount.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-3">
                      <span className="text-sm text-slate-500">Discount Type</span>
                      <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                        {discount.discount_type === 'percentage' ? <Percent size={14} /> : <DollarSign size={14} />}
                        <span className="capitalize">{discount.discount_type}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Value</span>
                      <span className="text-2xl font-black text-green-600 dark:text-green-500">
                        {discount.discount_type === 'percentage' ? `${discount.amount}%` : `$${parseFloat(discount.amount).toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <span className="text-sm font-medium text-slate-500">Page {pagination.current_page} of {pagination.last_page}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-green-500 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-green-500 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Tag size={64} className="mb-4 opacity-50" />
            <p className="font-semibold text-lg">No Discount Records Found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaleDiscounts;