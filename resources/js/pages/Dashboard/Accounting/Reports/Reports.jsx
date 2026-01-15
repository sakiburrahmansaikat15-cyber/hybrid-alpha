import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    FileText, TrendingUp, TrendingDown, PieChart, Activity,
    Calendar, ArrowRight, DollarSign, ChevronRight, BarChart3
} from 'lucide-react';

const ReportCard = ({ title, description, icon: Icon, to, colorClass, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="h-full"
    >
        <Link
            to={to}
            className="group flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 relative overflow-hidden"
        >
            <div className={`absolute top-0 right-0 w-32 h-32 ${colorClass} opacity-5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110`} />

            <div className="flex items-start justify-between mb-4 relative z-10">
                <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 dark:bg-opacity-20`}>
                    <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
                </div>
                <div className="p-2 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                    <ArrowRight size={16} className="-rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                </div>
            </div>

            <div className="relative z-10 mt-auto">
                <h3 className="text-xl font-bold dark:text-white mb-2 group-hover:text-blue-600 transition-colors">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{description}</p>
                <div className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-blue-600 transition-colors">
                    View Report <ChevronRight size={14} className="ml-1" />
                </div>
            </div>
        </Link>
    </motion.div>
);

const Reports = () => {
    const reportGroups = [
        {
            title: "Financial Statements",
            description: "Core financial documents for assessing company performance.",
            items: [
                {
                    title: "Balance Sheet",
                    description: "A snapshot of company's financial position including assets, liabilities, and equity at a specific point in time.",
                    icon: FileText,
                    to: "/accounting/components/BalanceSheet",
                    colorClass: "bg-blue-500 text-blue-600"
                },
                {
                    title: "Income Statement",
                    description: "Profit and Loss statement showing revenues, expenses, and net income over a period.",
                    icon: TrendingUp,
                    to: "/accounting/components/IncomeStatement",
                    colorClass: "bg-emerald-500 text-emerald-600"
                },
                {
                    title: "Cash Flow Statement",
                    description: "Current cash inflows and outflows from operations, investing, and financing activities.",
                    icon: Activity,
                    to: "/accounting/reports/cash-flow",
                    colorClass: "bg-violet-500 text-violet-600"
                }
            ]
        },
        {
            title: "Payables & Receivables",
            description: "Detailed breakdown of outstanding debts and expected payments.",
            items: [
                {
                    title: "Aged Receivables",
                    description: "Analyze outstanding invoices owed by customers aged by due date.",
                    icon: TrendingUp,
                    to: "/accounting/reports/aged-receivables",
                    colorClass: "bg-amber-500 text-amber-600"
                },
                {
                    title: "Aged Payables",
                    description: "Track money owed to suppliers and vendors aged by payment deadline.",
                    icon: TrendingDown,
                    to: "/accounting/reports/aged-payables",
                    colorClass: "bg-rose-500 text-rose-600"
                }
            ]
        },
        {
            title: "General Ledger & Audit",
            description: "Detailed transaction logs and verification tools.",
            items: [
                {
                    title: "Trial Balance",
                    description: "List of all general ledger account balances to ensure debits equal credits.",
                    icon: BarChart3,
                    to: "/accounting/components/TrialBalance",
                    colorClass: "bg-cyan-500 text-cyan-600"
                },
                {
                    title: "Journal Entries",
                    description: "Complete history of all recorded financial transactions and journal postings.",
                    icon: Calendar,
                    to: "/accounting/journals",
                    colorClass: "bg-slate-500 text-slate-600"
                }
            ]
        }
    ];

    return (
        <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <div className="mb-10 text-center max-w-2xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium mb-4"
                    >
                        <PieChart size={16} /> Financial Overview
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-bold dark:text-white mb-4 tracking-tight"
                    >
                        Financial Reports Hub
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-500 dark:text-slate-400 text-lg"
                    >
                        Access real-time financial data, statements, and analytics to make informed business decisions.
                    </motion.p>
                </div>

                <div className="space-y-12">
                    {reportGroups.map((group, groupIndex) => (
                        <div key={groupIndex}>
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * groupIndex }}
                                className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-2"
                            >
                                <h2 className="text-2xl font-bold dark:text-white flex items-center gap-3">
                                    {group.title}
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">{group.description}</p>
                            </motion.div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {group.items.map((item, index) => (
                                    <ReportCard
                                        key={index}
                                        {...item}
                                        delay={0.1 * index + (0.1 * groupIndex)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Reports;
