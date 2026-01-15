import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { IconMapper } from '../../components/UI/IconMapper';

const API_URL = '/api/audit-logs';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState(null);
    const [filters, setFilters] = useState({
        keyword: '',
        date_from: '',
        date_to: ''
    });

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0
    });

    const fetchLogs = async (page = 1) => {
        try {
            setLoading(true);
            const params = {
                page,
                limit: pagination.per_page,
                ...filters
            };

            const response = await axios.get(API_URL, { params });
            const data = response.data.data;

            setLogs(data.data || []);
            setPagination(prev => ({
                ...prev,
                current_page: data.current_page || 1,
                last_page: data.last_page || 1,
                total: data.total || 0
            }));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(1);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => fetchLogs(1), 800);
        return () => clearTimeout(timer);
    }, [filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= pagination.last_page) fetchLogs(page);
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">
                            System Audit Logs
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Traceability and accountability records</p>
                    </div>
                    <div className="text-sm font-mono text-slate-400 dark:text-slate-500">
                        TOTAL RECORDS: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{pagination.total}</span>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-end shadow-xl dark:shadow-none sticky top-4 z-40 transition-all">
                    <div className="flex-1 w-full md:w-auto">
                        <label className="text-xs font-mono text-slate-500 mb-1.5 block ml-1 uppercase">Search Query</label>
                        <div className="relative">
                            <IconMapper name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input
                                type="text"
                                name="keyword"
                                value={filters.keyword}
                                onChange={handleFilterChange}
                                placeholder="User, Action, Module..."
                                className="w-full bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                            />
                        </div>
                    </div>
                    <div className="w-full md:w-auto">
                        <label className="text-xs font-mono text-slate-500 mb-1.5 block ml-1 uppercase">From Date</label>
                        <input
                            type="date"
                            name="date_from"
                            value={filters.date_from}
                            onChange={handleFilterChange}
                            className="w-full bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                        />
                    </div>
                    <div className="w-full md:w-auto">
                        <label className="text-xs font-mono text-slate-500 mb-1.5 block ml-1 uppercase">To Date</label>
                        <input
                            type="date"
                            name="date_to"
                            value={filters.date_to}
                            onChange={handleFilterChange}
                            className="w-full bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => fetchLogs(1)}
                        className="w-full md:w-12 h-[46px] flex items-center justify-center bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-600/30 hover:border-emerald-500/50 rounded-xl text-emerald-400 hover:text-emerald-300 transition-all"
                    >
                        <IconMapper name="RefreshCw" size={20} />
                    </button>
                </div>

                {/* Table */}
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl dark:shadow-none">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-100 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 uppercase text-xs font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 border-b border-slate-200 dark:border-white/5">Timestamp</th>
                                    <th className="px-6 py-4 border-b border-slate-200 dark:border-white/5">User</th>
                                    <th className="px-6 py-4 border-b border-slate-200 dark:border-white/5">Role</th>
                                    <th className="px-6 py-4 border-b border-slate-200 dark:border-white/5">Action</th>
                                    <th className="px-6 py-4 border-b border-slate-200 dark:border-white/5">Module</th>
                                    <th className="px-6 py-4 border-b border-slate-200 dark:border-white/5">Context</th>
                                    <th className="px-6 py-4 border-b border-slate-200 dark:border-white/5">Network</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-sm">
                                {loading ? (
                                    <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2"><div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" /> Loading Logs...</td></tr>
                                ) : logs.length === 0 ? (
                                    <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">No logs found matching criteria</td></tr>
                                ) : (
                                    logs.map((log, index) => (
                                        <tr key={log.id} className="hover:bg-slate-800/40 transition-colors group cursor-pointer" onClick={() => setSelectedLog(log)}>
                                            <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                        {log.user?.name?.[0] || '?'}
                                                    </div>
                                                    <span className="font-sans font-medium text-slate-700 dark:text-slate-200">{log.user?.name || 'System'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 font-sans">
                                                {log.user?.role_id ? <span className="px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">RID: {log.user.role_id}</span> : '—'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${log.action === 'created' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                    log.action === 'updated' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                        log.action === 'deleted' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                    }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300 capitalize font-sans">{log.module}</td>
                                            <td className="px-6 py-4">
                                                <button onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }} className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline">
                                                    View Details
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-xs">{log.ip_address}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.total > 0 && (
                        <div className="px-6 py-4 border-t border-slate-800 flex justify-between items-center bg-slate-950/30">
                            <span className="text-sm text-slate-500 font-sans">
                                Page <span className="text-emerald-400">{pagination.current_page}</span> of {pagination.last_page}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handlePageChange(pagination.current_page - 1)}
                                    disabled={pagination.current_page === 1}
                                    className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-sm font-sans transition-colors"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => handlePageChange(pagination.current_page + 1)}
                                    disabled={pagination.current_page === pagination.last_page}
                                    className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-sm font-sans transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>

            </div>

            {/* Details Modal */}
            <AnimatePresence>
                {selectedLog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={() => setSelectedLog(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <IconMapper name="FileText" className="text-emerald-400" />
                                    Log Details <span className="text-slate-500 text-sm font-mono ml-2">#{selectedLog.id}</span>
                                </h3>
                                <button onClick={() => setSelectedLog(null)} className="text-slate-500 hover:text-white transition-colors">
                                    <IconMapper name="X" size={24} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto custom-scrollbar bg-slate-900 font-mono text-sm space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                        <div className="text-xs text-slate-500 uppercase mb-1">User Agent</div>
                                        <div className="text-slate-300 break-words">{selectedLog.user_agent || 'Unknown'}</div>
                                    </div>
                                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                        <div className="text-xs text-slate-500 uppercase mb-1">IP Address</div>
                                        <div className="text-slate-300">{selectedLog.ip_address}</div>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs text-slate-500 uppercase mb-2">Change Payload (JSON)</div>
                                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-emerald-300 overflow-x-auto">
                                        <pre>{JSON.stringify(selectedLog.details, null, 2)}</pre>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
                                <button onClick={() => setSelectedLog(null)} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-sans font-medium">Close</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default AuditLogs;
