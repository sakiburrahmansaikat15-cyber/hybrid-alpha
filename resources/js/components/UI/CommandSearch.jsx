import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Command, CornerDownLeft, Sparkles, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { menuData } from '../../data/menuData';

const CommandSearch = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();

    // Flatten menu for searching
    const flattenedMenu = useCallback(() => {
        let items = [];
        menuData.menuItems.forEach(item => {
            if (item.submenu) {
                item.submenu.forEach(sub => {
                    items.push({ ...sub, parent: item.title });
                });
            } else {
                items.push(item);
            }
        });
        return items;
    }, []);

    const results = flattenedMenu().filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.parent?.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8);

    const handleNavigate = (path) => {
        navigate(path);
        onClose();
        setQuery('');
    };

    useEffect(() => {
        if (isOpen) {
            setSelectedIndex(0);
            setQuery('');
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                isOpen ? onClose() : null; // Parent handles open
            }
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % Math.max(results.length, 1));
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(results.length, 1));
            }
            if (e.key === 'Enter' && results[selectedIndex]) {
                handleNavigate(results[selectedIndex].path);
            }
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        className="relative w-full max-w-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[2rem] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border border-white/20 dark:border-white/10 overflow-hidden"
                    >
                        {/* Search Header */}
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-4">
                            <div className="p-3 bg-primary-500 rounded-2xl text-white shadow-lg shadow-primary-500/20">
                                <Search size={24} strokeWidth={3} />
                            </div>
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search neural database (Ctrl + K)..."
                                className="flex-1 bg-transparent border-none outline-none text-xl font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 uppercase tracking-tight"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <div className="flex items-center space-x-2">
                                <div className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                    <span className="text-[10px] font-black text-slate-500 uppercase">ESC</span>
                                </div>
                                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {results.length > 0 ? (
                                <div className="space-y-1">
                                    <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Asset Index Results</p>
                                    {results.map((item, idx) => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleNavigate(item.path)}
                                            onMouseEnter={() => setSelectedIndex(idx)}
                                            className={`w-full text-left p-4 rounded-2xl flex items-center justify-between transition-all duration-200 group ${selectedIndex === idx
                                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl scale-[1.02]'
                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                                                }`}
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className={`p-2 rounded-xl transition-colors ${selectedIndex === idx ? 'bg-white/20 text-white dark:bg-slate-900/10 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                                    }`}>
                                                    <Zap size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black uppercase tracking-tight">{item.title}</p>
                                                    {item.parent && <p className={`text-[10px] font-bold uppercase opacity-60`}>{item.parent}</p>}
                                                </div>
                                            </div>
                                            <div className={`flex items-center space-x-3 transition-opacity ${selectedIndex === idx ? 'opacity-100' : 'opacity-0'}`}>
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Execute</span>
                                                <CornerDownLeft size={14} />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 flex flex-col items-center justify-center text-center">
                                    <div className="p-6 rounded-full bg-slate-50 dark:bg-slate-800/30 mb-4">
                                        <Sparkles size={40} className="text-slate-300 dark:text-slate-700 animate-pulse" />
                                    </div>
                                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">No matching neural patterns found</p>
                                    <p className="text-slate-400 text-xs mt-2 uppercase italic tracking-tighter">Query: "{query}" returned zero hits.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/20 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center space-x-6">
                                <div className="flex items-center space-x-2">
                                    <Command size={12} className="text-slate-400" />
                                    <span className="text-[9px] font-black text-slate-500 uppercase">Navigation Protocols Active</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                                <span className="text-[9px] font-black text-emerald-500 uppercase">Neural Stream: Stable</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CommandSearch;
