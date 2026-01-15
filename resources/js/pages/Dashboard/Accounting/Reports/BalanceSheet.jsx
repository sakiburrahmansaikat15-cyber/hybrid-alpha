import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    Calendar, Download, FileText, TrendingUp, TrendingDown,
    DollarSign, Filter, RefreshMq, Printer, Loader, Save
} from 'lucide-react';

const BalanceSheet = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewMode, setViewMode] = useState('detail'); // detail, summary

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/accounting/reports/balance-sheet', {
                params: { date }
            });
            setReportData(response.data);
        } catch (error) {
            console.error("Error fetching balance sheet:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [date]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const Section = ({ title, items, total, colorClass, icon: Icon }) => (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-6 shadow-sm">
            <div className={`px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center ${colorClass} bg-opacity-10`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colorClass} bg-opacity-20`}>
                        <Icon size={20} className={colorClass.replace('bg-', 'text-')} />
                    </div>
                    <h3 className="text-lg font-bold dark:text-white capitalize">{title}</h3>
                </div>
                <div className="text-right">
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total {title}</div>
                    <div className={`text-xl font-bold font-mono ${colorClass.replace('bg-', 'text-')}`}>
                        {formatCurrency(total)}
                    </div>
                </div>
            </div>

            {items.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((item, idx) => (
                        <div key={idx} className="px-6 py-3 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                            <div className="flex items-center gap-3">
                                <span className="px-2 py-0.5 rounded textxs font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-blue-600 transition-colors">
                                    {item.code}
                                </span>
                                <span className="font-medium text-slate-700 dark:text-slate-200">{item.name}</span>
                            </div>
                            <span className="font-mono font-medium text-slate-900 dark:text-white">
                                {formatCurrency(item.balance)}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="px-6 py-8 text-center text-slate-400 italic">
                    No accounts found for this category.
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold dark:text-white flex items-center gap-2">
                            <FileText className="text-blue-600" size={32} />
                            Balance Sheet
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">Financial Position Report (Statement of Financial Position)</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm">
                            <div className="px-3 py-2 border-r border-slate-100 dark:border-slate-800">
                                <Calendar size={18} className="text-slate-400" />
                            </div>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 dark:text-white px-3"
                            />
                        </div>

                        <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 hover:text-blue-600 hover:border-blue-200 font-medium transition-all shadow-sm">
                            <Printer size={18} />
                            <span>Print</span>
                        </button>

                        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/25">
                            <Download size={18} />
                            <span>Export PDF</span>
                        </button>
                    </div>
                </div>

                {/* Dashboard Summary Cards */}
                {reportData && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-xl">
                                    <TrendingUp size={24} />
                                </div>
                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold uppercase">Assets</span>
                            </div>
                            <div className="text-2xl font-bold font-mono dark:text-white mb-1">{formatCurrency(reportData.total_assets)}</div>
                            <div className="text-sm text-slate-500">Total Owned Resources</div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-xl">
                                    <TrendingDown size={24} />
                                </div>
                                <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold uppercase">Liabilities</span>
                            </div>
                            <div className="text-2xl font-bold font-mono dark:text-white mb-1">{formatCurrency(reportData.total_liabilities)}</div>
                            <div className="text-sm text-slate-500">Total Obligations</div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-xl">
                                    <DollarSign size={24} />
                                </div>
                                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold uppercase">Equity</span>
                            </div>
                            <div className="text-2xl font-bold font-mono dark:text-white mb-1">{formatCurrency(reportData.total_equity)}</div>
                            <div className="text-sm text-slate-500">Net Value (Assets - Liab)</div>
                        </motion.div>
                    </div>
                )}

                {/* Main Content */}
                <div className="bg-slate-50 dark:bg-slate-950">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader className="animate-spin text-blue-500 mb-4" size={40} />
                            <p className="text-slate-500 font-medium">Generating financial report...</p>
                        </div>
                    ) : reportData ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                            {/* Equation Check */}
                            <div className={`mb-6 p-4 rounded-xl border ${Math.abs(reportData.total_assets - (reportData.total_liabilities + reportData.total_equity)) < 0.1 ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'} flex items-center justify-center font-medium`}>
                                {Math.abs(reportData.total_assets - (reportData.total_liabilities + reportData.total_equity)) < 0.1
                                    ? "✅ Balance Sheet is Balanced: Assets = Liabilities + Equity"
                                    : "⚠️ Unbalanced: Assets ≠ Liabilities + Equity. Please check journal entries."}
                            </div>

                            <Section
                                title="Assets"
                                items={reportData.assets}
                                total={reportData.total_assets}
                                colorClass="bg-emerald-500 text-emerald-600"
                                icon={TrendingUp}
                            />

                            <Section
                                title="Liabilities"
                                items={reportData.liabilities}
                                total={reportData.total_liabilities}
                                colorClass="bg-rose-500 text-rose-600"
                                icon={TrendingDown}
                            />

                            <Section
                                title="Equity"
                                items={reportData.equity}
                                total={reportData.total_equity}
                                colorClass="bg-blue-500 text-blue-600"
                                icon={DollarSign}
                            />

                        </motion.div>
                    ) : (
                        <div className="text-center py-20 text-slate-500">Failed to load report data.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BalanceSheet;
