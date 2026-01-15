import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    Calendar, Download, FileText, TrendingUp, TrendingDown,
    DollarSign, Printer, Loader, Percent, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

const IncomeStatement = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        start_date: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Jan 1st of current year
        end_date: new Date().toISOString().split('T')[0] // Today
    });

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/accounting/reports/income-statement', {
                params: dateRange
            });
            setReportData(response.data);
        } catch (error) {
            console.error("Error fetching income statement:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => fetchReport(), 500); // Debounce
        return () => clearTimeout(timer);
    }, [dateRange]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({ ...prev, [name]: value }));
    };

    const Section = ({ title, items, total, colorClass, icon: Icon, type }) => (
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
                                <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-blue-600 transition-colors">
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
                    No transactions recorded for this period.
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
                        <div className="flex items-center gap-2 mb-2">
                            <Link to="/accounting/reports" className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
                                <ArrowLeft size={16} /> Back to Reports
                            </Link>
                        </div>
                        <h1 className="text-3xl font-bold dark:text-white flex items-center gap-2">
                            <TrendingUp className="text-emerald-600" size={32} />
                            Income Statement
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">Profit and Loss (P&L) Statement</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm overflow-hidden">
                            <div className="flex items-center px-3 gap-2 border-r border-slate-100 dark:border-slate-800">
                                <span className="text-xs font-bold text-slate-400 uppercase">From</span>
                                <input
                                    type="date"
                                    name="start_date"
                                    value={dateRange.start_date}
                                    onChange={handleDateChange}
                                    className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 dark:text-white w-32"
                                />
                            </div>
                            <div className="flex items-center px-3 gap-2">
                                <span className="text-xs font-bold text-slate-400 uppercase">To</span>
                                <input
                                    type="date"
                                    name="end_date"
                                    value={dateRange.end_date}
                                    onChange={handleDateChange}
                                    className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 dark:text-white w-32"
                                />
                            </div>
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
                <div className="bg-slate-50 dark:bg-slate-950">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader className="animate-spin text-blue-500 mb-4" size={40} />
                            <p className="text-slate-500 font-medium">Calculating financial performance...</p>
                        </div>
                    ) : reportData ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <TrendingUp size={64} className="text-emerald-500" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Revenue</p>
                                    <h3 className="text-2xl font-bold text-emerald-600 font-mono">{formatCurrency(reportData.total_revenue)}</h3>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <TrendingDown size={64} className="text-rose-500" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Expenses</p>
                                    <h3 className="text-2xl font-bold text-rose-600 font-mono">{formatCurrency(reportData.total_expense)}</h3>
                                </div>

                                <div className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden group ${reportData.net_income >= 0 ? 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-800' : 'bg-orange-50 border-orange-100 dark:bg-orange-900/10 dark:border-orange-800'}`}>
                                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <DollarSign size={64} className={reportData.net_income >= 0 ? 'text-indigo-500' : 'text-orange-500'} />
                                    </div>
                                    <p className={`text-sm font-bold uppercase tracking-wider mb-1 ${reportData.net_income >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                        Net Income
                                    </p>
                                    <h3 className={`text-2xl font-bold font-mono ${reportData.net_income >= 0 ? 'text-indigo-700 dark:text-indigo-300' : 'text-orange-700 dark:text-orange-300'}`}>
                                        {formatCurrency(reportData.net_income)}
                                    </h3>
                                    {reportData.total_revenue > 0 && (
                                        <div className="mt-2 text-xs font-semibold px-2 py-0.5 rounded-full inline-block bg-white/50 backdrop-blur-sm">
                                            {((reportData.net_income / reportData.total_revenue) * 100).toFixed(1)}% Margin
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Section
                                title="Revenue"
                                items={reportData.revenues}
                                total={reportData.total_revenue}
                                colorClass="bg-emerald-500 text-emerald-600"
                                icon={TrendingUp}
                            />

                            <Section
                                title="Expenses"
                                items={reportData.expenses}
                                total={reportData.total_expense}
                                colorClass="bg-rose-500 text-rose-600"
                                icon={TrendingDown}
                            />

                            {/* Net Income Footer Check */}
                            <div className="flex justify-end mt-8">
                                <div className="bg-white dark:bg-slate-900 px-8 py-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg text-right">
                                    <div className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Net Income (Bottom Line)</div>
                                    <div className={`text-3xl font-bold font-mono ${reportData.net_income >= 0 ? 'text-indigo-600' : 'text-orange-600'}`}>
                                        {formatCurrency(reportData.net_income)}
                                    </div>
                                </div>
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

export default IncomeStatement;
