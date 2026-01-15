import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { IconMapper } from '../../../components/UI/IconMapper';

const AccountingDashboard = () => {
    const [stats, setStats] = useState({
        cash: 0,
        receivables: 0,
        payables: 0,
        net_income: 0,
        revenue: 0,
        expense: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await axios.get('/api/accounting/stats');
            setStats(response.data);
        } catch (error) {
            console.error("Failed to fetch accounting stats", error);
            // Fallback for demo
            setStats({
                cash: 125000,
                receivables: 45000,
                payables: 12000,
                net_income: 85000,
                revenue: 150000,
                expense: 65000
            });
        } finally {
            setLoading(false);
        }
    };

    const cards = [
        { title: 'Net Income', value: stats.net_income, icon: 'TrendingUp', color: 'emerald', prefix: '$' },
        { title: 'Cash on Hand', value: stats.cash, icon: 'Briefcase', color: 'blue', prefix: '$' },
        { title: 'Receivables', value: stats.receivables, icon: 'ArrowDownLeft', color: 'cyan', prefix: '$' },
        { title: 'Payables', value: stats.payables, icon: 'ArrowUpRight', color: 'rose', prefix: '$' }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-8">

                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-cyan-600 dark:from-emerald-400 dark:to-cyan-500">
                            Financial Overview
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time financial pulse</p>
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-500 font-mono">
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>

                {/* Stats Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {cards.map((card, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            className={`bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-${card.color}-500/50 transition-all shadow-sm dark:shadow-none`}
                        >
                            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${card.color}-500/10 rounded-full blur-2xl group-hover:bg-${card.color}-500/20 transition-all`} />

                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl bg-${card.color}-500/10 text-${card.color}-600 dark:text-${card.color}-400`}>
                                    <IconMapper name={card.icon} size={24} />
                                </div>
                                {card.title === 'Net Income' && (
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                                        +12% vs last month
                                    </span>
                                )}
                            </div>

                            <div>
                                <div className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{card.title}</div>
                                <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                                    {card.prefix}{Number(card.value).toLocaleString()}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Charts Section Placeholder */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="lg:col-span-2 bg-white/60 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 h-96 relative overflow-hidden shadow-sm dark:shadow-none"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Revenue vs Expenses</h3>
                            <div className="text-xs text-slate-500">Last 12 Months</div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-600">
                            <div className="text-center">
                                <IconMapper name="BarChart3" size={48} className="mx-auto mb-2 opacity-50" />
                                <p>Chart Visualization Placeholder</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white/60 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 h-96 relative overflow-hidden shadow-sm dark:shadow-none"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Expense Breakdown</h3>
                        </div>
                        <div className="space-y-4">
                            {[
                                { label: 'Cost of Goods', pct: 65, color: 'bg-rose-500' },
                                { label: 'Salaries', pct: 20, color: 'bg-blue-500' },
                                { label: 'Operations', pct: 10, color: 'bg-amber-500' },
                                { label: 'Marketing', pct: 5, color: 'bg-violet-500' },
                            ].map((item, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-500 dark:text-slate-400">{item.label}</span>
                                        <span className="text-slate-700 dark:text-slate-200">{item.pct}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

            </div>
        </div>
    );
};

export default AccountingDashboard;
