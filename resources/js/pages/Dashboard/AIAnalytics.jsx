import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, Cell
} from 'recharts';
import {
    BrainCircuit, Zap, Target, TrendingUp, TrendingDown,
    AlertTriangle, Cpu, Activity, RefreshCw, Layers,
    ChevronRight, Sparkles, Database, ShieldCheck
} from 'lucide-react';

const AIAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeInsight, setActiveInsight] = useState(0);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/ai-analytics');
            setData(response.data.data);
        } catch (error) {
            console.error("AI Engine Failure:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // Pulse every minute
        return () => clearInterval(interval);
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
    };

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#030712] text-cyan-500">
                <div className="relative">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="w-24 h-24 border-t-4 border-b-4 border-cyan-500 rounded-full"
                    />
                    <BrainCircuit size={48} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse text-cyan-400" />
                </div>
                <h2 className="mt-8 text-xl font-black uppercase tracking-[0.5em] animate-pulse">Synchronizing Neural Grids</h2>
                <div className="mt-4 flex gap-1">
                    {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#030712] text-slate-100 p-4 md:p-8 font-sans selection:bg-cyan-500/30 overflow-x-hidden">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-7xl mx-auto space-y-8 relative z-10"
            >
                {/* Header Section */}
                <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-cyan-400 font-mono tracking-widest text-xs mb-2">
                            <Sparkles size={14} className="animate-spin-slow" />
                            <span>ALPHA NEURAL KERNEL V4.2</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-300 to-blue-500">
                                AI Analytics
                            </span>
                        </h1>
                        <p className="text-slate-400 text-lg font-light max-w-2xl">
                            Real-time predictive insights powered by the Hybrid Alpha proprietary neural lattice.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 p-2 rounded-2xl">
                        <div className="px-6 py-3 border-r border-white/10 hidden md:block">
                            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Confidence Score</p>
                            <h3 className="text-2xl font-black text-emerald-400">{data?.summary?.confidence_score}%</h3>
                        </div>
                        <button
                            onClick={fetchData}
                            className="bg-cyan-600 hover:bg-cyan-500 p-4 rounded-xl transition-all shadow-lg shadow-cyan-900/20 group cursor-pointer"
                        >
                            <RefreshCw size={24} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Forecast & Anomaly Detection */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Main Forecast Chart */}
                        <motion.div variants={itemVariants} className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
                            <div className="flex justify-between items-center mb-8 relative z-10">
                                <div>
                                    <h3 className="text-2xl font-bold flex items-center gap-3">
                                        <TrendingUp className="text-cyan-400" /> Revenue Forecast
                                    </h3>
                                    <p className="text-xs text-slate-500 font-mono mt-1 uppercase tracking-widest">Predictive Vector Analysis (7D)</p>
                                </div>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-lg text-xs font-bold border border-cyan-500/20">AI Optimized</span>
                                </div>
                            </div>

                            <div className="h-[400px] w-full relative z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data?.forecast}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis
                                            dataKey="day"
                                            stroke="#64748b"
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { weekday: 'short' })}
                                        />
                                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                            itemStyle={{ color: '#22d3ee', fontWeight: 'bold' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="predicted_revenue"
                                            stroke="#06b6d4"
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill="url(#colorRev)"
                                            animationDuration={2000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Anomaly Detection */}
                            <motion.div variants={itemVariants} className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 flex flex-col">
                                <h3 className="text-xl font-bold flex items-center gap-3 mb-6">
                                    <AlertTriangle className="text-amber-400" /> Anomaly Monitor
                                </h3>
                                <div className="space-y-4 flex-1">
                                    {data?.anomalies?.map((anom, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.5 + (i * 0.1) }}
                                            className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all flex gap-4 items-start group"
                                        >
                                            <div className={`p-2 rounded-lg ${anom.severity === 'High' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                <Cpu size={18} className="group-hover:rotate-12 transition-transform" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-mono font-bold text-slate-500">{anom.id}</span>
                                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${anom.severity === 'High' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>{anom.severity}</span>
                                                </div>
                                                <p className="text-sm font-bold text-white mb-1">{anom.type}</p>
                                                <p className="text-xs text-slate-500 leading-relaxed">{anom.details}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Efficiency Radar */}
                            <motion.div variants={itemVariants} className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8">
                                <h3 className="text-xl font-bold flex items-center gap-3 mb-6">
                                    <Activity className="text-purple-400" /> System Efficiency
                                </h3>
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart data={data?.efficiency}>
                                            <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                            <PolarAngleAxis dataKey="dept" stroke="#64748b" fontSize={10} />
                                            <Radar
                                                name="Efficiency"
                                                dataKey="score"
                                                stroke="#a855f7"
                                                fill="#a855f7"
                                                fillOpacity={0.6}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    {data?.efficiency?.map((e, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs p-2 bg-white/5 rounded-xl">
                                            <span className="text-slate-500 font-medium">{e.dept}</span>
                                            <span className={e.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}>{e.change}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Right Column: Insights & Churn Risk */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* AI Insight Box */}
                        <motion.div variants={itemVariants} className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden h-[320px]">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-400/20 blur-[60px] rounded-full translate-y-1/2 -translate-x-1/2" />

                            <div className="relative z-10 h-full flex flex-col">
                                <BrainCircuit className="mb-6 opacity-30" size={48} />
                                <h3 className="text-2xl font-black mb-4">Neural Strategy Recommendation</h3>
                                <p className="text-cyan-50 font-light leading-relaxed flex-1 italic">
                                    "Significant pattern detected in Inventory Turnover. Reallocating $15k from General Accounts to Regional Warehousing could improve fulfillment speed by 14.8% over the next fiscal quarter."
                                </p>
                                <button className="mt-8 flex items-center gap-2 group text-white/90 hover:text-white font-bold transition-all">
                                    Execute Adaptive Plan <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" />
                                </button>
                            </div>
                        </motion.div>

                        {/* Top Leads At Risk */}
                        <motion.div variants={itemVariants} className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 flex flex-col">
                            <h3 className="text-xl font-bold flex items-center gap-3 mb-6">
                                <Target className="text-rose-400" /> Retention Probability
                            </h3>
                            <div className="space-y-6">
                                {data?.churnRisk?.map((lead, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="font-bold text-white">{lead.name}</p>
                                                <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-0.5">EST. VALUE: ${lead.value.toLocaleString()}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {lead.trend === 'up' ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-rose-400" />}
                                                <span className={`text-sm font-black ${lead.risk > 70 ? 'text-rose-400' : 'text-emerald-400'}`}>{lead.risk}% Risk</span>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${lead.risk}%` }}
                                                transition={{ duration: 1.5, delay: 1 + (i * 0.2) }}
                                                className={`h-full rounded-full ${lead.risk > 70 ? 'bg-gradient-to-r from-rose-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-cyan-500'}`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 pt-8 border-t border-white/5">
                                <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl flex items-center gap-4">
                                    <ShieldCheck className="text-emerald-400" size={32} />
                                    <div>
                                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Global Security</p>
                                        <p className="text-[10px] text-emerald-500/60 leading-tight mt-1">Lattice node integrity verified. Data encryption active across all analytical frameworks.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Footer Telemetry */}
                <motion.footer
                    variants={itemVariants}
                    className="flex flex-col md:flex-row justify-between items-center py-8 border-t border-white/5 text-[10px] font-mono text-slate-600 gap-4"
                >
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span>SYNCED TO CLOUD NODES</span>
                        </div>
                        <div className="h-4 w-[1px] bg-slate-800" />
                        <span>ACTIVE NODES: {data?.summary?.active_nodes}</span>
                        <div className="h-4 w-[1px] bg-slate-800" />
                        <span>LAST TRAINING: {data?.summary?.last_training?.toUpperCase()}</span>
                    </div>
                    <div>
                        HYBRID ALPHA NEURAL ENGINE © 2026 // SECURED INTERFACE
                    </div>
                </motion.footer>
            </motion.div>
        </div>
    );
};

export default AIAnalytics;
