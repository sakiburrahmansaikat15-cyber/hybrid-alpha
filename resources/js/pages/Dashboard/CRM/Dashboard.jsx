import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Target, DollarSign, Activity, Ticket,
    TrendingUp, ArrowUpRight, ArrowDownRight,
    Clock, Plus, Filter, RefreshCw, ChevronRight,
    Search, Briefcase, UserPlus
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';

const API_DASHBOARD = '/api/crm/dashboard';

const CrmDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDashboardData = useCallback(async () => {
        setRefreshing(true);
        try {
            const response = await axios.get(API_DASHBOARD);
            setData(response.data.data);
        } catch (error) {
            console.error("Failed to fetch CRM stats:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    if (loading) {
        return (
            <div className="h-screen w-full bg-slate-950 flex items-center justify-center">
                <div className="relative">
                    <div className="h-24 w-24 rounded-full border-t-4 border-cyan-500 animate-spin"></div>
                    <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-500 animate-pulse" />
                </div>
            </div>
        );
    }

    const { stats, leads_by_status, opportunities_by_stage, recent_leads, recent_activities, monthly_leads } = data || {};

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" }
        })
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 overflow-x-hidden p-4 md:p-8 selection:bg-cyan-500/30">
            {/* Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-cyan-900/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-900/20 blur-[120px] rounded-full" />
            </div>

            <main className="max-w-[1600px] mx-auto space-y-8 relative z-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-4xl md:text-5xl font-black tracking-tighter text-white"
                        >
                            CRM <span className="text-cyan-500 italic">CONTROL</span>
                        </motion.h1>
                        <p className="text-slate-400 font-medium">Intelligence unit for sales & customer relations</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={fetchDashboardData}
                            className={`p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all ${refreshing ? 'animate-spin' : ''}`}
                        >
                            <RefreshCw size={20} className="text-cyan-400" />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 rounded-xl font-bold text-white shadow-lg shadow-cyan-900/20 hover:shadow-cyan-900/40 flex items-center gap-2 transition-all border border-white/10"
                        >
                            <Plus size={18} /> Generate Report
                        </motion.button>
                    </div>
                </div>

                {/* Performance HUD (Top Stats) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Leads', val: stats?.total_leads, icon: UserPlus, color: 'cyan', trend: '+12%' },
                        { label: 'Active Deals', val: stats?.total_opportunities, icon: Target, color: 'indigo', trend: '+5%' },
                        { label: 'Revenue Forecast', val: `$${parseFloat(stats?.total_revenue).toLocaleString()}`, icon: DollarSign, color: 'emerald', trend: '+18%' },
                        { label: 'Conversion Rate', val: '24.5%', icon: TrendingUp, color: 'violet', trend: '+2%' }
                    ].map((s, i) => (
                        <motion.div
                            key={i}
                            custom={i}
                            initial="hidden"
                            animate="visible"
                            variants={cardVariants}
                            className="group bg-slate-900/50 backdrop-blur-xl border border-white/10 p-6 rounded-3xl hover:border-white/20 transition-all relative overflow-hidden"
                        >
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-${s.color}-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`} />

                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-2xl bg-${s.color}-500/10 text-${s.color}-400 border border-${s.color}-500/20`}>
                                    <s.icon size={24} />
                                </div>
                                <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                                    <ArrowUpRight size={12} /> {s.trend}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-3xl font-black text-white mb-1">{s.val}</h3>
                                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">{s.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Lead Acquisition Area Chart */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <div className="w-2 h-6 bg-cyan-500 rounded-full" /> Lead Growth
                            </h3>
                            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold outline-none cursor-pointer">
                                <option>Current Year</option>
                                <option>Last Year</option>
                            </select>
                        </div>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthly_leads}>
                                    <defs>
                                        <linearGradient id="leadColor" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="month" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ color: '#06b6d4' }}
                                    />
                                    <Area type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#leadColor)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Pipeline Distribution Pie Chart */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8"
                    >
                        <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                            <div className="w-2 h-6 bg-indigo-500 rounded-full" /> Pipeline Health
                        </h3>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={opportunities_by_stage}
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={8}
                                        dataKey="count"
                                    >
                                        {opportunities_by_stage?.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#06b6d4', '#4f46e5', '#8b5cf6', '#10b981'][index % 4]} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>

                {/* Activity & Lead Lists */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Hot Leads List */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 overflow-hidden"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Search size={20} className="text-cyan-400" /> Hot Leads
                            </h3>
                            <button className="text-xs font-bold text-cyan-500 hover:text-cyan-400 flex items-center gap-1">
                                VIEW ALL <ChevronRight size={14} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            {recent_leads?.map((lead, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-600 to-cyan-500 flex items-center justify-center font-black text-white text-lg">
                                            {lead.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white leading-none mb-1">{lead.name}</h4>
                                            <p className="text-xs text-slate-500">{lead.company || 'Private Entity'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-[10px] font-black px-2 py-0.5 rounded border mb-1 uppercase tracking-tighter ${lead.lead_status?.name === 'new' ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                                            }`}>
                                            {lead.lead_status?.name}
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold">{new Date(lead.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Operational Activity Log */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 overflow-hidden"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Clock size={20} className="text-indigo-400" /> Operations Log
                            </h3>
                        </div>
                        <div className="space-y-6 relative">
                            {/* Vertical Timeline Line */}
                            <div className="absolute left-[23px] top-2 bottom-2 w-px bg-white/10" />

                            {recent_activities?.map((activity, i) => (
                                <div key={i} className="flex gap-4 relative">
                                    <div className={`h-12 w-12 rounded-full border border-white/10 bg-slate-800 flex items-center justify-center z-10 ${activity.type === 'call' ? 'text-emerald-400' : 'text-indigo-400'
                                        }`}>
                                        <Activity size={20} />
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-white leading-none mb-2 capitalize">{activity.type} recorded</h4>
                                            <span className="text-[10px] font-bold text-slate-600 px-2 py-0.5 border border-white/5 rounded">
                                                {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 line-clamp-1">{activity.description || 'No detailed description provided.'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default CrmDashboard;
