import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, UserCheck, UserMinus, Building2,
    Calendar, TrendingUp, Gift,
    Clock, ArrowRight, UserPlus, FileText,
    Briefcase, MapPin, Search, Filter,
    Download, RefreshCw, MoreVertical, Bell,
    Shield, PieChart as LucidePieChart
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar,
    Cell, Legend, Pie, PieChart as RePieChart
} from 'recharts';

const API_URL = '/api/hrm/dashboard';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
};

const HrmDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            setRefreshing(true);
            const response = await axios.get(API_URL);
            setData(response.data.data);
        } catch (error) {
            console.error('Error fetching HRM dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const COLORS = ['#818cf8', '#22d3ee', '#fb7185', '#34d399', '#f472b6', '#a78bfa'];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="p-3 bg-indigo-500/20 rounded-full border border-indigo-500/30"
                >
                    <RefreshCw className="text-indigo-400" size={32} />
                </motion.div>
                <p className="text-slate-400 font-medium animate-pulse uppercase tracking-[0.2em] text-xs">Initializing HR Command Center...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-8 selection:bg-indigo-500/30">

            {/* 🚀 Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="space-y-1"
                >
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
                        HRM <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 bg-300% animate-gradient">CONSOLE</span>
                    </h1>
                    <p className="text-slate-400 text-lg font-light flex items-center gap-2">
                        <Shield className="text-indigo-400" size={18} />
                        Unified Workforce Intelligence Monitoring
                    </p>
                </motion.div>

                <div className="flex items-center gap-3">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={fetchData}
                        className={`p-4 bg-slate-900 border border-white/5 rounded-2xl hover:bg-slate-800 transition-all shadow-xl ${refreshing ? 'animate-spin' : ''}`}
                    >
                        <RefreshCw size={20} className="text-slate-300" />
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-6 py-4 bg-indigo-600 rounded-2xl font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all border border-indigo-400/20"
                    >
                        <UserPlus size={20} />
                        <span>Onboard Personnel</span>
                    </motion.button>
                </div>
            </div>

            {/* 📊 Key Performance Nodes */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                <StatsCard
                    icon={<Users size={24} />}
                    label="Total Workforce"
                    value={data?.counters?.total_employees}
                    trend="Active Assets"
                    color="indigo"
                />
                <StatsCard
                    icon={<UserCheck size={24} />}
                    label="Operational Nodes"
                    value={data?.counters?.present_today}
                    trend="Present Today"
                    color="emerald"
                />
                <StatsCard
                    icon={<UserMinus size={24} />}
                    label="Out of Office"
                    value={data?.counters?.on_leave_today}
                    trend="Approved Absences"
                    color="rose"
                />
                <StatsCard
                    icon={<Clock size={24} />}
                    label="Pending Validations"
                    value={data?.counters?.pending_leaves}
                    trend="Leave Requests"
                    color="cyan"
                />
            </motion.div>

            {/* 📈 Intelligence Grids */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Attendance Analytical Hub */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="xl:col-span-2 bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 transition-colors group-hover:bg-indigo-500/10" />

                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">Operational Pulse</h3>
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold text-indigo-400/80">Last 7-Day Attendance Vector</p>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-900 border border-white/5 p-1 rounded-xl">
                            <button className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-bold">Vector View</button>
                            <button className="px-3 py-1.5 text-slate-500 rounded-lg text-xs font-bold hover:text-slate-300">Data Grid</button>
                        </div>
                    </div>

                    <div className="h-[350px] min-h-[350px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.trends?.attendance}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dy={10}
                                    formatter={(val) => new Date(val).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }}
                                    itemStyle={{ color: '#818cf8' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#818cf8"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorCount)"
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Division Matrix */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 flex flex-col group"
                >
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-white">Division Matrix</h3>
                        <LucidePieChart className="text-slate-500" size={20} />
                    </div>

                    <div className="flex-1 min-h-[300px] flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie
                                    data={data?.distributions?.department}
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={8}
                                    dataKey="count"
                                    animationDuration={1500}
                                >
                                    {data?.distributions?.department.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={10} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }}
                                />
                            </RePieChart>
                        </ResponsiveContainer>

                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-black text-white">{data?.counters?.total_departments}</span>
                            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Divisions</span>
                        </div>
                    </div>

                    <div className="space-y-3 mt-4">
                        {data?.distributions?.department.slice(0, 4).map((dept, i) => (
                            <div key={i} className="flex items-center justify-between group/item">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="text-sm font-medium text-slate-400 group-hover/item:text-slate-200 transition-colors">{dept.name}</span>
                                </div>
                                <span className="text-xs font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">{dept.count}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

            </div>

            {/* 📜 Tactical Logs & Manifests */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Personnel Pipeline (Recent Hires) */}
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">Personnel Pipeline</h3>
                            <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                Active Deployment Queue
                            </div>
                        </div>
                        <button className="text-indigo-400 hover:text-indigo-300 text-sm font-bold flex items-center gap-1 group">
                            Full Roster <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {data?.recent_hires.map((employee, i) => (
                            <motion.div
                                key={employee.id}
                                className="flex items-center justify-between p-4 bg-slate-800/20 border border-white/5 rounded-2xl hover:bg-slate-800/40 hover:border-indigo-500/20 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600/20 to-cyan-600/20 border border-white/10 flex items-center justify-center text-indigo-400 font-black text-lg">
                                        {employee.first_name[0]}{employee.last_name[0]}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors uppercase tracking-wide">
                                            {employee.first_name} {employee.last_name}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">{employee.designation?.name || 'Asset'}</span>
                                            <div className="w-1 h-1 rounded-full bg-slate-700" />
                                            <span className="text-[10px] text-indigo-400 font-medium">{employee.department?.name}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Engaged</span>
                                    <span className="text-xs text-slate-300 font-mono italic">{employee.join_date ? new Date(employee.join_date).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Temporal Events (Birthdays) */}
                <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">Temporal Events</h3>
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold text-rose-400/80">30-Day Anniversary Matrix</p>
                        </div>
                        <Calendar size={20} className="text-rose-500/30" />
                    </div>

                    <div className="space-y-4">
                        {data?.upcoming_birthdays.length > 0 ? data.upcoming_birthdays.map((employee, i) => (
                            <div key={employee.id} className="flex items-center justify-between p-4 bg-slate-800/20 border border-white/5 rounded-2xl group hover:bg-rose-500/5 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 relative overflow-hidden">
                                        <Gift size={22} className="relative z-10" />
                                        <div className="absolute inset-0 bg-rose-500/5 -translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white uppercase tracking-tight">{employee.first_name} {employee.last_name}</h4>
                                        <p className="text-[10px] text-slate-500 font-bold flex items-center gap-2 mt-0.5">
                                            <MapPin size={10} className="text-rose-500/50" />
                                            {employee.city || 'Remote Node'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="flex items-center gap-2 text-rose-400 text-sm font-black">
                                        {new Date(employee.date_of_birth).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                    </span>
                                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Solar Anniversary</span>
                                </div>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-600 space-y-3 grayscale opacity-30">
                                <Calendar size={48} strokeWidth={1} />
                                <p className="text-xs font-black uppercase tracking-widest">No Solar Cycles Detected</p>
                            </div>
                        )}
                    </div>
                </motion.div>

            </div>

        </div>
    );
}

const StatsCard = ({ icon, label, value, trend, color }) => {
    const themes = {
        indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-500/20 text-indigo-400',
        emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-500/20 text-emerald-400',
        rose: 'from-rose-500 to-rose-600 shadow-rose-500/20 text-rose-400',
        cyan: 'from-cyan-500 to-cyan-600 shadow-cyan-500/20 text-cyan-400'
    };

    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[2rem] p-7 shadow-2xl relative overflow-hidden group"
        >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${themes[color]} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rounded-bl-[5rem]`} />

            <div className="flex items-center justify-between mb-6">
                <div className={`p-4 rounded-2xl bg-slate-950 border border-white/5 ${themes[color]} group-hover:scale-110 transition-transform duration-500`}>
                    {icon}
                </div>
                <div className="flex flex-col items-end">
                    <MoreVertical size={16} className="text-slate-700 hover:text-slate-300 cursor-pointer transition-colors" />
                </div>
            </div>

            <div className="space-y-1">
                <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">{label}</p>
                <h2 className="text-4xl font-black text-white group-hover:tracking-wider transition-all duration-300">{value || '0'}</h2>
            </div>

            <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{trend}</span>
                <TrendingUp size={14} className={themes[color]} />
            </div>
        </motion.div>
    );
};

export default HrmDashboard;
