import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    Calendar, Download, TrendingUp, TrendingDown,
    ArrowLeft, Printer, Loader, Clock, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AgedReport = ({ type = 'receivable' }) => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Dynamic content based on type
    const isReceivable = type === 'receivable';
    const title = isReceivable ? 'Aged Receivables' : 'Aged Payables';
    const subtitle = isReceivable ? 'Outstanding Customer Invoices' : 'Outstanding Vendor Bills';
    const apiType = isReceivable ? 'receivable' : 'payable';
    const ThemeIcon = isReceivable ? TrendingUp : TrendingDown;
    const themeColor = isReceivable ? 'text-amber-600' : 'text-rose-600';
    const bgTheme = isReceivable ? 'bg-amber-500' : 'bg-rose-500';

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/accounting/reports/aged-report', {
                params: { date, type: apiType }
            });
            setReportData(response.data);
        } catch (error) {
            console.error(`Error fetching aged ${apiType}:`, error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [date, type]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const BucketCard = ({ label, amount, isTotal }) => (
        <div className={`p-4 rounded-xl border ${isTotal ? 'bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'} shadow-sm`}>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</div>
            <div className={`text-xl font-mono font-bold ${isTotal ? 'text-blue-600' : amount > 0 ? themeColor : 'text-slate-700 dark:text-slate-300'}`}>
                {formatCurrency(amount)}
            </div>
            {amount > 0 && !isTotal && (
                <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${bgTheme}`} style={{ width: '100%' }}></div>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Link to="/accounting/reports" className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
                                <ArrowLeft size={16} /> Back to Reports
                            </Link>
                        </div>
                        <h1 className="text-3xl font-bold dark:text-white flex items-center gap-2">
                            <ThemeIcon className={themeColor} size={32} />
                            {title}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">{subtitle}</p>
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
                <div className="space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader className="animate-spin text-blue-500 mb-4" size={40} />
                            <p className="text-slate-500 font-medium">Analyzing aging...</p>
                        </div>
                    ) : reportData ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                            {/* Buckets Summary */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                                <BucketCard label="Current" amount={reportData.summary.current} />
                                <BucketCard label="0-30 Days" amount={reportData.summary['0-30']} />
                                <BucketCard label="31-60 Days" amount={reportData.summary['31-60']} />
                                <BucketCard label="61-90 Days" amount={reportData.summary['61-90']} />
                                <BucketCard label="90+ Days" amount={reportData.summary['90+']} />
                                <BucketCard label="Total Outstanding" amount={reportData.summary.total} isTotal />
                            </div>

                            {/* Detailed Table */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500">
                                    <div className="col-span-3">{isReceivable ? 'Customer' : 'Vendor'}</div>
                                    <div className="col-span-2">Ref #</div>
                                    <div className="col-span-2">Due Date</div>
                                    <div className="col-span-2 text-right">Age (Days)</div>
                                    <div className="col-span-3 text-right">Balance</div>
                                </div>

                                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
                                    {reportData.details.length > 0 ? reportData.details.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-12 gap-4 px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors items-center">
                                            <div className="col-span-3 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full 
                                                    ${item.age > 90 ? 'bg-rose-500' :
                                                        item.age > 60 ? 'bg-orange-500' :
                                                            item.age > 30 ? 'bg-amber-400' :
                                                                item.age > 0 ? 'bg-yellow-400' : 'bg-emerald-400'}`
                                                } />
                                                {item.name}
                                            </div>
                                            <div className="col-span-2 text-sm text-slate-500">{item.ref}</div>
                                            <div className="col-span-2 text-sm text-slate-500">{item.due_date}</div>
                                            <div className="col-span-2 text-right text-sm">
                                                {item.age > 0 ? (
                                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600">
                                                        {item.age} days
                                                    </span>
                                                ) : (
                                                    <span className="text-emerald-500 text-xs font-bold">Current</span>
                                                )}
                                            </div>
                                            <div className="col-span-3 text-right font-mono font-medium text-slate-700 dark:text-slate-200">
                                                {formatCurrency(item.balance)}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="px-6 py-12 text-center text-slate-400">
                                            No outstanding {isReceivable ? 'invoices' : 'bills'} found.
                                        </div>
                                    )}
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

export default AgedReport;
