import React from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log to an external service if available
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#030712] flex items-center justify-center p-6 font-sans">
                    <div className="max-w-md w-full text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-500/10 rounded-3xl mb-6 border border-rose-500/20">
                            <AlertTriangle size={40} className="text-rose-500" />
                        </div>
                        <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Interface Fragmented</h1>
                        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                            A critical error occurred while rendering the tactical interface. This could be due to network instability or a corrupted asset.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full bg-slate-100 hover:bg-white text-slate-900 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group"
                            >
                                <RefreshCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                                Re-Establish Connection
                            </button>
                            <a
                                href="/"
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 border border-white/5"
                            >
                                <Home size={18} />
                                Return to Command Center
                            </a>
                        </div>

                        {process.env.NODE_ENV === 'development' && (
                            <div className="mt-8 text-left p-4 bg-black/50 rounded-xl border border-white/5 overflow-auto max-h-48 custom-scrollbar">
                                <p className="text-rose-400 font-mono text-[10px] whitespace-pre-wrap uppercase">
                                    [DEBUG INFO]: {this.state.error?.toString()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
