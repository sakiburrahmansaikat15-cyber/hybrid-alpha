import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Package, Ruler, Layers, Box,
    Settings2, ArrowRight, Activity, Database
} from 'lucide-react';

const ConfigHubPage = ({ title, description, icon: Icon, items, colorClass }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans p-8">
            <header className="mb-12 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10 text-opacity-100`}>
                            <Icon size={20} className={colorClass.replace('bg-', 'text-')} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Configuration Hub</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight">{title}</h1>
                    <p className="text-slate-500 max-w-xl">{description}</p>
                </div>

                <div className="flex gap-4">
                    <div className="bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><Activity size={20} /></div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Status</p>
                            <p className="text-sm font-bold mt-1">Operational</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map((item, index) => (
                    <motion.div
                        key={item.path}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => navigate(item.path)}
                        className="group relative bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-emerald-500/5 hover:-translate-y-2 transition-all cursor-pointer overflow-hidden"
                    >
                        {/* Background Decoration */}
                        <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity`}>
                            <item.icon size={160} strokeWidth={1} />
                        </div>

                        <div className="relative z-10 flex flex-col h-full">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500 ${colorClass} bg-opacity-10`}>
                                <item.icon className={colorClass.replace('bg-', 'text-')} size={28} />
                            </div>

                            <h3 className="text-2xl font-bold mb-3 group-hover:text-emerald-500 transition-colors">{item.title}</h3>
                            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                                {item.description}
                            </p>

                            <div className="mt-auto flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">Configure Model</span>
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-slate-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-slate-900 transition-all">
                                    <ArrowRight size={18} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Placeholder for "System Integrity" card */}
                <div className="lg:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-950 p-8 rounded-[2.5rem] text-white flex flex-col justify-between shadow-xl">
                    <div>
                        <Database className="text-emerald-400 mb-6" size={32} />
                        <h3 className="text-2xl font-bold mb-2">Schema Integrity</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">All configuration models are synchronized with the central database kernel.</p>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700"></div>)}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Sync Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfigHubPage;
