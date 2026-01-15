import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, Zap, ShieldCheck, ChevronRight } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 rounded-full blur-[120px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-20 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo Section */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ rotate: -10, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-cyan-500 to-violet-600 rounded-2xl shadow-2xl shadow-cyan-500/20 mb-4"
                    >
                        <Zap size={32} className="text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-black text-white tracking-tight">HYBRID<span className="text-cyan-400">ALPHA</span></h1>
                    <p className="text-slate-500 mt-2 text-sm font-medium uppercase tracking-[0.2em]">Strategic Neural Interface</p>
                </div>

                {/* Form Card */}
                <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-3xl">
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            System Authentication
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Enter authorized credentials to proceed</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative group">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Access ID</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="admin@example.com"
                                        required
                                        className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all placeholder:text-slate-700"
                                    />
                                </div>
                            </div>

                            <div className="relative group">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Security Pattern</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" size={18} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all placeholder:text-slate-700"
                                    />
                                </div>
                            </div>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-start gap-3"
                                >
                                    <ShieldCheck size={18} className="text-rose-500 mt-0.5 shrink-0" />
                                    <span className="text-rose-400 text-xs font-medium">{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-cyan-600 to-violet-700 hover:from-cyan-500 hover:to-violet-600 text-white rounded-2xl py-4 font-bold shadow-xl shadow-cyan-950/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    Establish Connection
                                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-white/5 text-center">
                        <p className="text-slate-600 text-[10px] font-mono uppercase tracking-[0.2em]">Secure Encryption Layer Active | v2.4.0-Alpha</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
