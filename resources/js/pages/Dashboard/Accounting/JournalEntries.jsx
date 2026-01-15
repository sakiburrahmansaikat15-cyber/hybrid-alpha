import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Edit, Trash2, X, Loader, ChevronLeft, ChevronRight,
    BookOpen, Calendar, FileText, AlertCircle, CheckCircle, RefreshCcw
} from 'lucide-react';

const API_URL = '/api/accounting/journals';
const ACCOUNTS_URL = '/api/accounting/accounts';

const JournalEntries = () => {
    const [journals, setJournals] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [operationLoading, setOperationLoading] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingJournal, setEditingJournal] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 10, total_items: 0 });

    // Form State
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        reference: '',
        description: '',
        items: [
            { chart_of_account_id: '', debit: 0, credit: 0 },
            { chart_of_account_id: '', debit: 0, credit: 0 }
        ]
    });

    const notificationTimerRef = useRef(null);

    const showNotification = useCallback((message, type = 'success') => {
        if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
        setNotification({ show: true, message, type });
        notificationTimerRef.current = setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3500);
    }, []);

    const fetchAccounts = useCallback(async () => {
        try {
            const response = await axios.get(ACCOUNTS_URL, { params: { limit: 1000 } });
            // Handle various response structures to avoid "map is not a function"
            const accountsData = response.data.data || response.data || [];
            if (Array.isArray(accountsData)) {
                setAccounts(accountsData);
            } else {
                console.error("Accounts data is not an array:", accountsData);
                setAccounts([]);
            }
        } catch (e) {
            console.error("Failed to load accounts", e);
            setAccounts([]);
        }
    }, []);

    const fetchJournals = useCallback(async (page = 1, keyword = searchTerm) => {
        setLoading(true);
        try {
            const params = { page, limit: pagination.per_page };
            if (keyword.trim()) params.keyword = keyword.trim();

            const response = await axios.get(API_URL, { params });
            const res = response.data.pagination || response.data;

            setJournals(response.data.data || []);
            setPagination({
                current_page: res.current_page || 1,
                last_page: res.total_pages || res.last_page || 1,
                per_page: res.per_page || 10,
                total_items: res.total_items || res.total || 0,
            });
        } catch (error) {
            console.error("Failed to fetch journals", error);
            setJournals([]);
        } finally {
            setLoading(false);
        }
    }, [pagination.per_page, searchTerm]);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    useEffect(() => {
        const timer = setTimeout(() => fetchJournals(1), 500);
        return () => clearTimeout(timer);
    }, [searchTerm, fetchJournals]);

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > pagination.last_page) return;
        fetchJournals(newPage);
    };

    const openModal = (journal = null) => {
        if (journal) {
            setEditingJournal(journal);
            const items = journal.items && Array.isArray(journal.items) ? journal.items.map(item => ({
                chart_of_account_id: item.chart_of_account_id,
                debit: Number(item.debit),
                credit: Number(item.credit)
            })) : [];

            setFormData({
                date: journal.date,
                reference: journal.reference || '',
                description: journal.description || '',
                items: items.length > 0 ? items : [{ chart_of_account_id: '', debit: 0, credit: 0 }, { chart_of_account_id: '', debit: 0, credit: 0 }]
            });
        } else {
            setEditingJournal(null);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                reference: '',
                description: '',
                items: [
                    { chart_of_account_id: '', debit: 0, credit: 0 },
                    { chart_of_account_id: '', debit: 0, credit: 0 }
                ]
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingJournal(null);
    };

    const handleRowChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData({ ...formData, items: newItems });
    };

    const addRow = () => {
        setFormData({ ...formData, items: [...formData.items, { chart_of_account_id: '', debit: 0, credit: 0 }] });
    };

    const removeRow = (index) => {
        if (formData.items.length <= 2) return;
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setOperationLoading('saving');
        try {
            if (editingJournal) {
                await axios.put(`${API_URL}/${editingJournal.id}`, formData);
                showNotification('Journal entry updated successfully');
            } else {
                await axios.post(API_URL, formData);
                showNotification('Journal entry posted successfully');
            }
            fetchJournals(pagination.current_page);
            closeModal();
        } catch (error) {
            showNotification(error.response?.data?.message || 'Operation failed', 'error');
        } finally {
            setOperationLoading(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this journal entry? This cannot be undone.')) return;
        setOperationLoading(id);
        try {
            await axios.delete(`${API_URL}/${id}`);
            showNotification('Journal entry deleted successfully');
            fetchJournals(1);
        } catch (error) {
            showNotification(error.response?.data?.message || 'Delete failed', 'error');
        } finally {
            setOperationLoading(null);
        }
    };

    // Calculations
    const totalDebit = formData.items.reduce((sum, item) => sum + Number(item.debit || 0), 0);
    const totalCredit = formData.items.reduce((sum, item) => sum + Number(item.credit || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans p-6">
            <AnimatePresence>
                {notification.show && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="fixed top-4 right-4 z-50">
                        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm border ${notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'}`}>
                            {notification.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                            <span className="font-semibold text-sm">{notification.message}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto space-y-6">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight dark:text-white mb-1 flex items-center gap-3">
                            <BookOpen className="text-blue-500" /> Journal Entries
                        </h1>
                        <p className="text-sm text-slate-500">Record and manage financial transactions</p>
                    </div>
                    <button onClick={() => openModal()} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20">
                        <Plus size={18} />
                        <span>New Entry</span>
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-3 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by reference or description..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                        />
                    </div>
                    <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2">
                            <FileText className="text-blue-500" size={18} />
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</span>
                        </div>
                        <span className="text-xl font-bold text-blue-600">{pagination.total_items}</span>
                    </div>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <Loader className="animate-spin text-blue-500" size={32} />
                        </div>
                    ) : journals.length === 0 ? (
                        <div className="p-12 flex flex-col items-center text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                            <BookOpen size={48} className="mb-4 opacity-50" />
                            <p>No journal entries found.</p>
                        </div>
                    ) : (
                        journals.map(journal => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={journal.id}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:border-blue-500/30 transition-all shadow-sm group"
                            >
                                <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                                    <div className="flex gap-4">
                                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg h-fit">
                                            <Calendar size={20} className="text-slate-500" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{journal.reference || 'No Ref'}</h3>
                                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 uppercase">Passed</span>
                                            </div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{journal.date}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{journal.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openModal(journal)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(journal.id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-600 transition-colors">
                                            {operationLoading === journal.id ? <Loader className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-950 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-100 dark:bg-slate-900/50 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-800">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Account</th>
                                                <th className="px-4 py-3 text-right">Debit</th>
                                                <th className="px-4 py-3 text-right">Credit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                            {journal.items && journal.items.map(item => (
                                                <tr key={item.id}>
                                                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                                                        <span className="font-mono text-slate-400 mr-2">{item.account?.code}</span>
                                                        {item.account?.name}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-mono text-slate-700 dark:text-slate-300">
                                                        {Number(item.debit) > 0 ? Number(item.debit).toFixed(2) : '-'}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-mono text-slate-700 dark:text-slate-300">
                                                        {Number(item.credit) > 0 ? Number(item.credit).toFixed(2) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-slate-100/50 dark:bg-slate-900/50 font-bold border-t border-slate-200 dark:border-slate-800">
                                                <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 uppercase text-xs">Total</td>
                                                <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-mono">
                                                    {journal.items ? journal.items.reduce((s, i) => s + Number(i.debit), 0).toFixed(2) : '0.00'}
                                                </td>
                                                <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400 font-mono">
                                                    {journal.items ? journal.items.reduce((s, i) => s + Number(i.credit), 0).toFixed(2) : '0.00'}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        ))
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
                            className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col"
                        >
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                                <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                                    <BookOpen className="text-blue-500" size={24} />
                                    {editingJournal ? 'Edit Journal Entry' : 'New Journal Entry'}
                                </h2>
                                <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                                            <input type="date" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reference</label>
                                            <input type="text" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. INV-001" value={formData.reference} onChange={e => setFormData({ ...formData, reference: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                            <input type="text" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Opening Balance" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <div className="flex text-xs uppercase text-slate-500 font-bold mb-3 px-2">
                                            <div className="flex-1">Account</div>
                                            <div className="w-32 text-right">Debit</div>
                                            <div className="w-32 text-right ml-4">Credit</div>
                                            <div className="w-8"></div>
                                        </div>
                                        <div className="space-y-2">
                                            {formData.items.map((row, i) => (
                                                <div key={i} className="flex gap-4 items-center group">
                                                    <div className="flex-1 relative">
                                                        <select
                                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-blue-500 mr-2"
                                                            value={row.chart_of_account_id}
                                                            onChange={e => handleRowChange(i, 'chart_of_account_id', e.target.value)}
                                                            required
                                                        >
                                                            <option value="">Select Account</option>
                                                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                                                        </select>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        className="w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-right text-slate-900 dark:text-white outline-none focus:border-blue-500 font-mono"
                                                        value={row.debit}
                                                        onChange={e => handleRowChange(i, 'debit', e.target.value)}
                                                        min="0"
                                                        step="0.01"
                                                        onFocus={e => e.target.select()}
                                                    />
                                                    <input
                                                        type="number"
                                                        className="w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-right text-slate-900 dark:text-white outline-none focus:border-blue-500 font-mono"
                                                        value={row.credit}
                                                        onChange={e => handleRowChange(i, 'credit', e.target.value)}
                                                        min="0"
                                                        step="0.01"
                                                        onFocus={e => e.target.select()}
                                                    />
                                                    <button type="button" onClick={() => removeRow(i)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors opacity-50 group-hover:opacity-100"><Trash2 size={18} /></button>
                                                </div>
                                            ))}
                                        </div>
                                        <button type="button" onClick={addRow} className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-500 px-2">
                                            <Plus size={16} /> Add Line Item
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 flex justify-between items-center shrink-0">
                                    <div className="flex gap-8">
                                        <div className="text-right">
                                            <div className="text-xs text-slate-500 uppercase font-bold">Total Debit</div>
                                            <div className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-500">{totalDebit.toFixed(2)}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-slate-500 uppercase font-bold">Total Credit</div>
                                            <div className="text-lg font-mono font-bold text-rose-600 dark:text-rose-500">{totalCredit.toFixed(2)}</div>
                                        </div>
                                        {!isBalanced && (
                                            <div className="flex items-center gap-2 text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-3 py-1 rounded-lg">
                                                <AlertCircle size={20} />
                                                <div className="text-sm font-bold">Unbalanced: {Math.abs(totalDebit - totalCredit).toFixed(2)}</div>
                                            </div>
                                        )}
                                        {isBalanced && (
                                            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-lg">
                                                <CheckCircle size={20} />
                                                <div className="text-sm font-bold">Balanced</div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <button type="button" onClick={closeModal} className="px-6 py-2.5 text-slate-500 font-medium hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors">Cancel</button>
                                        <button
                                            type="submit"
                                            disabled={!isBalanced || operationLoading === 'saving'}
                                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                        >
                                            {operationLoading === 'saving' ? <Loader className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                                            {editingJournal ? 'Update Journal' : 'Post Journal'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default JournalEntries;
