import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    Calendar, Download, Activity, TrendingUp, TrendingDown,
    ArrowLeft, Printer, Loader
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CashFlowStatement = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        start_date: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
    });

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/accounting/reports/cash-flow', {
                params: dateRange
            });
            setReportData(response.data);
        } catch (error) {
            console.error("Error fetching cash flow:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => fetchReport(), 500);
        return () => clearTimeout(timer);
    }, [dateRange]);

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({ ...prev, [name]: value }));
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const ActivitySection = ({ title, activities, total, colorClass, icon: Icon }) => (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-6 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/20">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colorClass} bg-opacity-20`}>
                        <Icon size={20} className={colorClass.replace('bg-', 'text-')} />
                    </div>
                    <h3 className="text-lg font-bold dark:text-white">{title}</h3>
                </div>
                <div className={`text-xl font-bold font-mono ${total >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency(total)}
                </div>
            </div>
            {activities.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activities.map((item, idx) => (
                        <div key={idx} className="px-6 py-3 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <span className="font-medium text-slate-700 dark:text-slate-200">{item.name}</span>
                            <span className="font-mono text-slate-900 dark:text-white">{formatCurrency(item.amount)}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="px-6 py-8 text-center text-slate-400 italic">No activity recorded for this category.</div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Link to="/accounting/reports" className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
                                <ArrowLeft size={16} /> Back to Reports
                            </Link>
                        </div>
                        <h1 className="text-3xl font-bold dark:text-white flex items-center gap-2">
                            <Activity className="text-violet-600" size={32} />
                            Cash Flow Statement
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">Analysis of cash inflows and outflows</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm overflow-hidden">
                            <input
                                type="date" name="start_date" value={dateRange.start_date} onChange={handleDateChange}
                                className="bg-transparent border-none outline-none text-sm px-3 py-1 font-medium text-slate-700 dark:text-white"
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                type="date" name="end_date" value={dateRange.end_date} onChange={handleDateChange}
                                className="bg-transparent border-none outline-none text-sm px-3 py-1 font-medium text-slate-700 dark:text-white"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/25">
                            <Download size={18} />
                            <span>Export</span>
                        </button>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader className="animate-spin text-blue-500 mb-4" size={40} />
                            <p className="text-slate-500 font-medium">Generating cash report...</p>
                        </div>
                    ) : reportData ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                            <ActivitySection
                                title="Operating Activities"
                                activities={reportData.operating_activities}
                                total={reportData.net_cash_operating}
                                colorClass="bg-blue-500 text-blue-600"
                                icon={Activity}
                            />

                            <ActivitySection
                                title="Investing Activities"
                                activities={reportData.investing_activities}
                                total={reportData.net_cash_investing}
                                colorClass="bg-purple-500 text-purple-600"
                                icon={TrendingUp}
                            />

                            <ActivitySection
                                title="Financing Activities"
                                activities={reportData.financing_activities}
                                total={reportData.net_cash_financing}
                                colorClass="bg-orange-500 text-orange-600"
                                icon={TrendingDown}
                            />

                            <div className="flex justify-end mt-8">
                                <div className="bg-white dark:bg-slate-900 px-8 py-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg text-right">
                                    <div className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Net Change in Cash</div>
                                    <div className={`text-3xl font-bold font-mono ${reportData.net_change_cash >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {formatCurrency(reportData.net_change_cash)}
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

export default CashFlowStatement;
