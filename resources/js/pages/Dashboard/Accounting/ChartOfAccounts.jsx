import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Edit, Trash2, X, Loader, ChevronLeft, ChevronRight,
    Wallet, TrendingUp, TrendingDown, Activity, AlertCircle, FileText
} from 'lucide-react';

const API_URL = '/api/accounting/accounts';

const ChartOfAccounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [operationLoading, setOperationLoading] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        type: 'asset',
        sub_type: '',
        description: '',
        is_active: 1
    });
    const [errors, setErrors] = useState({});
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 10, total_items: 0 });

    const notificationTimerRef = useRef(null);

    const showNotification = useCallback((message, type = 'success') => {
        if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
        setNotification({ show: true, message, type });
        notificationTimerRef.current = setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3500);
    }, []);

    const fetchAccounts = useCallback(async (page = 1, keyword = searchTerm) => {
        setLoading(true);
        try {
            const params = { page, limit: pagination.per_page };
            if (keyword.trim()) params.keyword = keyword.trim();

            const response = await axios.get(API_URL, { params });
            const res = response.data.pagination || response.data; // Handle both paginated and non-paginated fallbacks

            setAccounts(response.data.data || []);
            setPagination({
                current_page: res.current_page || 1,
                last_page: res.total_pages || res.last_page || 1,
                per_page: res.per_page || 10,
                total_items: res.total_items || res.total || 0,
            });
        } catch (error) {
            console.error("Failed to fetch accounts", error);
            setAccounts([]);
        } finally {
            setLoading(false);
        }
    }, [pagination.per_page, searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => fetchAccounts(1), 500);
        return () => clearTimeout(timer);
    }, [searchTerm, fetchAccounts]);

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > pagination.last_page) return;
        fetchAccounts(newPage);
    };

    const openModal = (account = null) => {
        if (account) {
            setEditingAccount(account);
            setFormData({
                code: account.code || '',
                name: account.name || '',
                type: account.type || 'asset',
                sub_type: account.sub_type || '',
                description: account.description || '',
                is_active: account.is_active ?? 1
            });
        } else {
            setEditingAccount(null);
            setFormData({ code: '', name: '', type: 'asset', sub_type: '', description: '', is_active: 1 });
        }
        setErrors({});
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingAccount(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setOperationLoading('saving');
        try {
            if (editingAccount) {
                await axios.put(`${API_URL}/${editingAccount.id}`, formData);
                showNotification('Account updated successfully');
            } else {
                await axios.post(API_URL, formData);
                showNotification('Account created successfully');
            }
            fetchAccounts(pagination.current_page);
            closeModal();
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || {});
                showNotification('Validation failed', 'error');
            } else {
                showNotification(error.response?.data?.message || 'Operation failed', 'error');
            }
        } finally {
            setOperationLoading(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this account?')) return;
        setOperationLoading(id);
        try {
            await axios.delete(`${API_URL}/${id}`);
            showNotification('Account deleted successfully');
            fetchAccounts(1);
        } catch (error) {
            showNotification(error.response?.data?.message || 'Delete failed', 'error');
        } finally {
            setOperationLoading(null);
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'asset': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
            case 'liability': return 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400';
            case 'equity': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
            case 'revenue': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
            case 'expense': return 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans p-6">
            <AnimatePresence>
                {notification.show && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="fixed top-4 right-4 z-50">
                        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm border ${notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'}`}>
                            {notification.type === 'error' ? <AlertCircle size={16} /> : <Activity size={16} />}
                            <span className="font-semibold text-sm">{notification.message}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto space-y-6">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight dark:text-white mb-1 flex items-center gap-3">
                            <Wallet className="text-emerald-500" /> Chart of Accounts
                        </h1>
                        <p className="text-sm text-slate-500">Manage your financial structure and ledgers</p>
                    </div>
                    <button onClick={() => openModal()} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-emerald-500/20">
                        <Plus size={18} />
                        <span>Add Account</span>
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-3 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name or code..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                        />
                    </div>
                    <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2">
                            <FileText className="text-emerald-500" size={18} />
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</span>
                        </div>
                        <span className="text-xl font-bold text-emerald-600">{pagination.total_items}</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <Loader className="animate-spin text-emerald-500" size={32} />
                        </div>
                    ) : accounts.length === 0 ? (
                        <div className="p-12 flex flex-col items-center text-slate-400">
                            <Wallet size={48} className="mb-4 opacity-50" />
                            <p>No accounts found matching your search.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 uppercase text-xs font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Code</th>
                                        <th className="px-6 py-4">Name</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Sub Type</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {accounts.map(acc => (
                                        <tr key={acc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-300 font-medium">
                                                {acc.code}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900 dark:text-white">{acc.name}</div>
                                                {acc.description && <div className="text-xs text-slate-500 mt-0.5 max-w-xs truncate">{acc.description}</div>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${getTypeColor(acc.type)}`}>
                                                    {acc.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-sm">
                                                {acc.sub_type || '—'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${acc.is_active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${acc.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                    {acc.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => openModal(acc)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(acc.id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-600 transition-colors">
                                                        {operationLoading === acc.id ? <Loader className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {pagination.total_pages > 1 && (
                    <div className="flex justify-center mt-6">
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <button
                                onClick={() => handlePageChange(pagination.current_page - 1)}
                                disabled={pagination.current_page === 1}
                                className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="px-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                                {pagination.current_page} of {pagination.last_page}
                            </span>
                            <button
                                onClick={() => handlePageChange(pagination.current_page + 1)}
                                disabled={pagination.current_page === pagination.last_page}
                                className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-30 transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                                <h2 className="text-xl font-bold dark:text-white">{editingAccount ? 'Edit Account' : 'New Account'}</h2>
                                <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Code</label>
                                        <input
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono"
                                            placeholder="1001"
                                            required
                                        />
                                        {errors.code && <p className="text-rose-500 text-xs mt-1">{errors.code[0]}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                                        <select
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        >
                                            <option value="asset">Asset</option>
                                            <option value="liability">Liability</option>
                                            <option value="equity">Equity</option>
                                            <option value="revenue">Revenue</option>
                                            <option value="expense">Expense</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Account Name</label>
                                    <input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        placeholder="Cash on Hand"
                                        required
                                    />
                                    {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name[0]}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sub Type (Optional)</label>
                                    <input
                                        value={formData.sub_type}
                                        onChange={e => setFormData({ ...formData, sub_type: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        placeholder="e.g. Current Asset"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all h-20 resize-none"
                                        placeholder="Brief description..."
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="is_active" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500/20" />
                                    <label htmlFor="is_active" className="text-sm font-medium text-slate-700 dark:text-slate-300">Active Account</label>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={closeModal} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                                    <button
                                        type="submit"
                                        disabled={operationLoading === 'saving'}
                                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        {operationLoading === 'saving' ? <Loader className="animate-spin" size={18} /> : <Wallet size={18} />}
                                        {editingAccount ? 'Update Account' : 'Create Account'}
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

export default ChartOfAccounts;
