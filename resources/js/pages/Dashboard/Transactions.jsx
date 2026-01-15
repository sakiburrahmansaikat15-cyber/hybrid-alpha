import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Check, AlertCircle, Filter,
  MoreVertical, Eye, EyeOff, TrendingUp, TrendingDown, RefreshCw,
  DollarSign, CreditCard, Package, Calendar, ChevronLeft, ChevronRight,
  ArrowUpRight, ArrowDownRight, Activity, Wallet, PieChart
} from 'lucide-react';

// --- Constants & Config ---
const API_URL = '/api/transaction';
const PAYMENT_TYPES_API = '/api/payment-types';

// --- Components ---

const StatCard = ({ title, value, icon: Icon, type, trend }) => {
  const gradients = {
    blue: 'from-blue-500/20 to-cyan-500/20 text-cyan-400 border-cyan-500/30',
    green: 'from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/30',
    red: 'from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/30',
    purple: 'from-violet-500/20 to-purple-500/20 text-violet-400 border-violet-500/30',
  };

  const style = gradients[type] || gradients.blue;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="relative overflow-hidden bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl transition-all duration-300 group"
    >
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${style} blur-2xl opacity-40 group-hover:opacity-60 transition-opacity`} />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-2xl bg-slate-950/50 border ${style.split(' ').pop()}`}>
            <Icon size={24} className={style.split(' ')[2]} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 font-medium text-xs py-1 px-2 rounded-lg bg-slate-950/30 border border-slate-800 ${trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>

        <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">{title}</h3>
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
      </div>
    </motion.div>
  );
};

const TransactionRow = ({ transaction, onEdit, onDelete, onStatusToggle }) => {
  const isBuy = transaction.type === 'Buy';
  const statusColor = transaction.status === 'active' ? 'bg-emerald-500' : 'bg-slate-500';

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-xl ${isBuy ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {isBuy ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
          </div>
          <div>
            <span className="block text-white font-semibold text-sm">{transaction.type}</span>
            <span className="text-slate-500 text-xs uppercase tracking-wider">{transaction.uuid || `#${transaction.id}`}</span>
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-slate-300">
          <Package size={16} className="text-slate-500" />
          <span className="font-medium font-mono text-sm">STK-{transaction.stock_id}</span>
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
            {transaction.paymentType?.name || 'Unknown'}
          </span>
        </div>
      </td>

      <td className="px-6 py-4">
        <span className={`text-lg font-bold font-mono tracking-tight ${isBuy ? 'text-emerald-400' : 'text-white'}`}>
          {isBuy ? '-' : '+'}${parseFloat(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      </td>

      <td className="px-6 py-4">
        <button onClick={() => onStatusToggle(transaction)} className="flex items-center gap-2 group/status cursor-pointer">
          <span className={`w-2.5 h-2.5 rounded-full ${statusColor} shadow-[0_0_10px_rgba(0,0,0,0.3)] group-hover/status:scale-125 transition-transform`} />
          <span className="text-sm font-medium text-slate-400 group-hover/status:text-white transition-colors capitalize">{transaction.status}</span>
        </button>
      </td>

      <td className="px-6 py-4 text-slate-500 text-sm">
        {new Date(transaction.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </td>

      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onEdit(transaction)} className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">
            <Edit size={16} />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onDelete(transaction)} className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20">
            <Trash2 size={16} />
          </motion.button>
        </div>
      </td>
    </motion.tr>
  );
};

// --- Main Page Component ---

const TransactionsManager = () => {
  // State
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [formData, setFormData] = useState({ stock_id: '', payment_type_id: '', type: 'Buy', amount: '', status: 'active' });
  const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1, total_items: 0, per_page: 10 });
  const [notification, setNotification] = useState(null);

  // Fetch Logic
  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const [transRes, typesRes] = await Promise.all([
        axios.get(API_URL, { params: { page, limit: pagination.per_page, keyword: searchTerm } }),
        axios.get(PAYMENT_TYPES_API)
      ]);

      const paginated = transRes.data.pagination;
      setTransactions(paginated.data || []);
      setPagination(prev => ({ ...prev, current_page: paginated.current_page, total_pages: paginated.total_pages, total_items: paginated.total_items }));

      // Handle payment types structure variation
      const typesData = typesRes.data;
      setPaymentTypes(Array.isArray(typesData) ? typesData : (typesData.data || []));

    } catch (error) {
      console.error(error);
      showNotify('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.per_page, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(pagination.current_page), 300);
    return () => clearTimeout(timer);
  }, [fetchData, pagination.current_page]);

  // Actions
  const showNotify = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `${API_URL}/${editingItem.id}` : API_URL;
      const payload = { ...formData, _method: editingItem ? 'PUT' : 'POST' };

      if (editingItem) {
        // Use POST for update as per Laravel resource method spoofing if needed, strictly speaking PUT is standard but some configs differ
        await axios.put(url, formData);
      } else {
        await axios.post(url, formData);
      }

      showNotify(editingItem ? 'Transaction updated' : 'Transaction created');
      setShowModal(false);
      fetchData(pagination.current_page);
    } catch (error) {
      showNotify(error.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotify('Transaction deleted');
      fetchData(pagination.current_page);
    } catch (error) {
      showNotify('Failed to delete', 'error');
    }
  };

  const handleStatusToggle = async (item) => {
    try {
      const newStatus = item.status === 'active' ? 'inactive' : 'active';
      await axios.put(`${API_URL}/${item.id}`, { ...item, status: newStatus });
      showNotify('Status updated');
      fetchData(pagination.current_page);
    } catch (error) {
      showNotify('Failed to update status', 'error');
    }
  };

  // Stats Calculation (Memoized)
  const stats = useMemo(() => {
    const totalVol = transactions.reduce((acc, t) => acc + Number(t.amount), 0);
    const buyCount = transactions.filter(t => t.type === 'Buy').length;
    const sellCount = transactions.filter(t => t.type === 'Sell').length;
    return { totalVol, buyCount, sellCount };
  }, [transactions]);

  // Modal Handlers
  const openModal = (item = null) => {
    setEditingItem(item);
    setFormData(item ? {
      stock_id: item.stock_id,
      payment_type_id: item.payment_type_id,
      type: item.type,
      amount: item.amount,
      status: item.status
    } : { stock_id: '', payment_type_id: '', type: 'Buy', amount: '', status: 'active' });
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 font-sans selection:bg-cyan-500/30">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-cyan-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-violet-600/5 rounded-full blur-[100px]" />
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className={`fixed top-6 left-1/2 z-50 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl backdrop-blur-md border ${notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}
          >
            {notification.type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
            <span className="font-medium text-sm">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-[1600px] mx-auto p-6 lg:p-10 space-y-8">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">
              Financial <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500">Transactions</span>
            </h1>
            <p className="text-slate-400 font-medium">Monitoring system liquidity and trade flow</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => fetchData(pagination.current_page)}
              className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all active:scale-95"
            >
              <RefreshCw size={20} />
            </button>
            <button
              onClick={() => openModal()}
              className="group relative px-6 py-3 bg-gradient-to-r from-cyan-600 to-violet-600 rounded-xl font-bold text-white shadow-lg shadow-cyan-900/20 hover:shadow-cyan-900/40 transition-all active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center gap-2"><Plus size={20} /> New Entry</span>
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-white text-3xl font-bold">
          <StatCard
            title="Total Volume"
            value={`$${stats.totalVol.toLocaleString()}`}
            icon={Wallet}
            type="purple"
          />
          <StatCard
            title="Active Trades"
            value={pagination.total_items}
            icon={Activity}
            type="blue"
            trend={12}
          />
          <StatCard
            title="Buy Orders"
            value={stats.buyCount}
            icon={TrendingUp}
            type="green"
          />
          <StatCard
            title="Sell Orders"
            value={stats.sellCount}
            icon={TrendingDown}
            type="red"
          />
        </div>

        {/* Controls & Filters */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input
              type="text"
              placeholder="Search by ID, type or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
            />
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-3 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-colors flex items-center gap-2">
              <Filter size={18} />
              <span className="font-medium">Filter</span>
            </button>
            <div className="h-full w-px bg-slate-800 mx-1" />
            <select
              value={pagination.per_page}
              onChange={(e) => setPagination(prev => ({ ...prev, per_page: Number(e.target.value) }))}
              className="px-4 py-3 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-400 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
            >
              <option value={10}>10 rows</option>
              <option value={20}>20 rows</option>
              <option value={50}>50 rows</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            </div>
          ) : transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/50 border-b border-slate-800 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-5">Transaction Type</th>
                    <th className="px-6 py-5">Stock Reference</th>
                    <th className="px-6 py-5">Payment Method</th>
                    <th className="px-6 py-5">Amount (USD)</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5">Date</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  <AnimatePresence mode='popLayout'>
                    {transactions.map(transaction => (
                      <TransactionRow
                        key={transaction.id}
                        transaction={transaction}
                        onEdit={openModal}
                        onDelete={() => handleDelete(transaction.id)}
                        onStatusToggle={handleStatusToggle}
                      />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500">
              <Package size={64} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">No transactions found</p>
            </div>
          )}

          {/* Pagination Stats */}
          <div className="px-6 py-4 bg-slate-950/30 border-t border-slate-800 flex items-center justify-between text-sm">
            <span className="text-slate-500">
              Showing <span className="text-white font-medium">{transactions.length > 0 ? ((pagination.current_page - 1) * pagination.per_page) + 1 : 0}</span> to <span className="text-white font-medium">{Math.min(pagination.current_page * pagination.per_page, pagination.total_items)}</span> of <span className="text-white font-medium">{pagination.total_items}</span> results
            </span>
            <div className="flex gap-2">
              <button
                disabled={pagination.current_page === 1}
                onClick={() => setPagination(p => ({ ...p, current_page: p.current_page - 1 }))}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                disabled={pagination.current_page >= pagination.total_pages}
                onClick={() => setPagination(p => ({ ...p, current_page: p.current_page + 1 }))}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal Overlay */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-violet-500" />

              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-white">
                  {editingItem ? 'Edit Transaction' : 'New Entry'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                    >
                      <option value="Buy">Buy Intake</option>
                      <option value="Sell">Sell Output</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Stock ID</label>
                  <div className="relative">
                    <Package size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      required
                      type="number"
                      value={formData.stock_id}
                      onChange={e => setFormData({ ...formData, stock_id: e.target.value })}
                      placeholder="e.g. 1024"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Payment Method</label>
                  <div className="relative">
                    <CreditCard size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <select
                      required
                      value={formData.payment_type_id}
                      onChange={e => setFormData({ ...formData, payment_type_id: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 appearance-none"
                    >
                      <option value="">Select Method</option>
                      {paymentTypes.map(pt => (
                        <option key={pt.id} value={pt.id}>{pt.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Amount (USD)</label>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-2xl font-bold text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 placeholder:text-slate-700"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-400 hover:bg-slate-800 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-3 px-4 rounded-xl font-bold bg-gradient-to-r from-cyan-600 to-violet-600 text-white shadow-lg shadow-cyan-900/30 hover:shadow-cyan-900/50 transition-all active:scale-95">
                    {editingItem ? 'Update Changes' : 'Confirm Entry'}
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

export default TransactionsManager;
