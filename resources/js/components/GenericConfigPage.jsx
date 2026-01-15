import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Trash2, Edit2, X, Save, Loader,
    AlertCircle, ChevronLeft, ChevronRight, CheckCircle2,
    Filter, MoreHorizontal
} from 'lucide-react';

const GenericConfigPage = ({
    title,
    subtitle,
    icon: Icon,
    apiPath,
    columns = [
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        {
            key: 'status', label: 'Status', render: (val) => (
                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${val === 'active' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {val || 'active'}
                </span>
            )
        }
    ],
    fields = [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] }
    ]
}) => {
    // State
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [processing, setProcessing] = useState(false);
    const [notification, setNotification] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({ total_pages: 1 });

    // Fetch Data
    const fetchData = async (page = 1) => {
        setLoading(true);
        try {
            const res = await axios.get(apiPath, {
                params: { page, keyword: search, limit: 10 }
            });
            // Handle different API response structures
            const list = res.data.data?.data || res.data.pagination?.data || res.data.data || res.data || [];
            setData(Array.isArray(list) ? list : []);

            const meta = res.data.pagination || res.data.meta || {};
            setPagination({
                total_pages: meta.last_page || meta.total_pages || 1,
                current_page: meta.current_page || page
            });
            setCurrentPage(page);
        } catch (err) {
            console.error(err);
            showNotification('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => fetchData(1), 500);
        return () => clearTimeout(timer);
    }, [search, apiPath]);

    useEffect(() => {
        fetchData(currentPage);
    }, [currentPage]);

    // Actions
    const showNotification = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        // Pre-fill form
        const initialData = {};
        fields.forEach(f => {
            initialData[f.name] = item[f.name] || '';
        });
        setFormData(initialData);
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            await axios.delete(`${apiPath}/${id}`);
            showNotification('Item deleted successfully');
            fetchData(currentPage);
        } catch (err) {
            showNotification(err.response?.data?.message || 'Delete failed', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (editingItem) {
                await axios.post(`${apiPath}/${editingItem.id}`, { ...formData, _method: 'PUT' }); // Laravel PUT spoofing
                showNotification('Updated successfully');
            } else {
                await axios.post(apiPath, formData);
                showNotification('Created successfully');
            }
            setModalOpen(false);
            fetchData(currentPage);
        } catch (err) {
            showNotification(err.response?.data?.message || 'Operation failed', 'error');
        } finally {
            setProcessing(false);
        }
    };

    // Render Helpers
    const renderField = (field) => {
        const commonClasses = "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-medium text-slate-900 dark:text-white";

        if (field.type === 'select') {
            return (
                <div key={field.name} className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{field.label}</label>
                    <div className="relative">
                        <select
                            required={field.required}
                            value={formData[field.name] || ''}
                            onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                            className={`${commonClasses} appearance-none`}
                        >
                            <option value="">Select {field.label}</option>
                            {field.options.map(opt => (
                                <option key={opt} value={opt}>{opt.label || opt}</option>
                            ))}
                        </select>
                    </div>
                </div>
            );
        }

        if (field.type === 'textarea') {
            return (
                <div key={field.name} className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{field.label}</label>
                    <textarea
                        required={field.required}
                        value={formData[field.name] || ''}
                        onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                        className={`${commonClasses} h-24 resize-none`}
                        placeholder={`Enter ${field.label}...`}
                    />
                </div>
            );
        }

        return (
            <div key={field.name} className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{field.label}</label>
                <input
                    type={field.type || 'text'}
                    required={field.required}
                    value={formData[field.name] || ''}
                    onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                    className={commonClasses}
                    placeholder={`Enter ${field.label}...`}
                />
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">

            {/* Notifications */}
            <AnimatePresence>
                {notification && (
                    <motion.div initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className={`fixed top-6 left-1/2 z-[200] px-6 py-3 rounded-xl shadow-lg border backdrop-blur-md flex items-center gap-3 ${notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'}`}>
                        {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />} <span className="font-semibold text-sm">{notification.msg}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="px-8 py-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl text-white shadow-lg shadow-cyan-500/20">
                        {Icon ? <Icon size={24} /> : <Filter size={24} />}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">{title}</h1>
                        <p className="text-sm text-slate-500 font-medium">{subtitle || 'Manage your system configurations'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full md:w-64 pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all placeholder:text-slate-400"
                        />
                    </div>
                    <button
                        onClick={() => { setEditingItem(null); setFormData({}); setModalOpen(true); }}
                        className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <Plus size={18} /> <span className="hidden sm:inline">Add New</span>
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
                    {/* Table Header */}
                    <div className="grid border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr) 100px` }}>
                        {columns.map(col => (
                            <div key={col.key} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{col.label}</div>
                        ))}
                        <div className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</div>
                    </div>

                    {/* Table Body */}
                    {loading ? (
                        <div className="p-12 flex justify-center"><Loader className="animate-spin text-cyan-500" /></div>
                    ) : data.length === 0 ? (
                        <div className="p-12 flex flex-col items-center justify-center text-slate-400 opacity-60">
                            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-3"><Filter size={32} /></div>
                            <p className="font-medium">No records found</p>
                        </div>
                    ) : (
                        data.map(item => (
                            <motion.div
                                layout
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                key={item.id}
                                className="grid border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors items-center group"
                                style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr) 100px` }}
                            >
                                {columns.map(col => (
                                    <div key={col.key} className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                                        {col.render ? col.render(item[col.key], item) : item[col.key] || '-'}
                                    </div>
                                ))}

                                <div className="px-6 py-4 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(item.id)} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {pagination.total_pages > 1 && (
                    <div className="mt-6 flex justify-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-bold text-sm flex items-center">{currentPage} / {pagination.total_pages}</span>
                        <button
                            disabled={currentPage === pagination.total_pages}
                            onClick={() => setCurrentPage(p => Math.min(pagination.total_pages, p + 1))}
                            className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {modalOpen && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl p-8 border border-slate-100 dark:border-slate-800"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{editingItem ? 'Edit Item' : 'New Item'}</h2>
                                    <p className="text-sm text-slate-500">Fill in the details below</p>
                                </div>
                                <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {fields.map(field => renderField(field))}
                                <div className="pt-4">
                                    <button
                                        disabled={processing}
                                        type="submit"
                                        className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70 active:scale-[0.98]"
                                    >
                                        {processing ? <Loader className="animate-spin" /> : <><Save size={20} /> Save Changes</>}
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

export default GenericConfigPage;
