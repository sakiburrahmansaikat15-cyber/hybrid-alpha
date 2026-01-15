import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    Calendar, Download, BarChart3, ArrowLeft, Printer, Loader
} from 'lucide-react';
import { Link } from 'react-router-dom';

const TrialBalance = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/accounting/reports/trial-balance', {
                params: { date }
            });
            setReportData(response.data);
        } catch (error) {
            console.error("Error fetching trial balance:", error);
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

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Link to="/accounting/reports" className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
                                <ArrowLeft size={16} /> Back to Reports
                            </Link>
                        </div>
                        <h1 className="text-3xl font-bold dark:text-white flex items-center gap-2">
                            <BarChart3 className="text-cyan-600" size={32} />
                            Trial Balance
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">Ledger account balances (Debit vs Credit)</p>
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
                        </button>

                        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/25">
                            <Download size={18} />
                            <span>Export</span>
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader className="animate-spin text-blue-500 mb-4" size={40} />
                            <p className="text-slate-500 font-medium">Balancing books...</p>
                        </div>
                    ) : reportData ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500">
                                <div className="col-span-2">Code</div>
                                <div className="col-span-4">Account Name</div>
                                <div className="col-span-3 text-right">Debit</div>
                                <div className="col-span-3 text-right">Credit</div>
                            </div>

                            {/* Table Body */}
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {reportData.accounts.map((account, idx) => (
                                    <div key={idx} className="grid grid-cols-12 gap-4 px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors items-center">
                                        <div className="col-span-2 font-mono text-sm text-slate-500">{account.code}</div>
                                        <div className="col-span-4 font-medium text-slate-700 dark:text-slate-200">{account.name}</div>
                                        <div className="col-span-3 text-right font-mono text-slate-600 dark:text-slate-400">
                                            {account.debit > 0 ? formatCurrency(account.debit) : '-'}
                                        </div>
                                        <div className="col-span-3 text-right font-mono text-slate-600 dark:text-slate-400">
                                            {account.credit > 0 ? formatCurrency(account.credit) : '-'}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer / Totals */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 font-bold">
                                <div className="col-span-6 text-right text-slate-600 dark:text-slate-300">Total</div>
                                <div className="col-span-3 text-right font-mono text-slate-900 dark:text-white">{formatCurrency(reportData.total_debit)}</div>
                                <div className="col-span-3 text-right font-mono text-slate-900 dark:text-white">{formatCurrency(reportData.total_credit)}</div>
                            </div>

                            {/* Validation */}
                            <div className={`text-center py-2 text-sm font-medium ${Math.abs(reportData.total_debit - reportData.total_credit) < 0.01 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {Math.abs(reportData.total_debit - reportData.total_credit) < 0.01
                                    ? "✅ Books are Balanced"
                                    : `⚠️ Out of Balance by ${formatCurrency(Math.abs(reportData.total_debit - reportData.total_credit))}`}
                            </div>

                        </motion.div>
                    ) : (
                        <div className="text-center py-20 text-slate-500">Failed to load report data.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrialBalance;
