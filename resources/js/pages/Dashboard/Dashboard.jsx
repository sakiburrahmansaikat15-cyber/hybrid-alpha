// components/Pages/Dashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useTheme } from '../../hooks/useTheme';
import {
  LayoutDashboard,
  Package,
  Users,
  UserCheck,
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  AlertTriangle,
  Calendar,
  Download,
  Settings,
  Plus,
  BarChart3,
  PieChart,
  Activity,
  Brain,
  Zap,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  RefreshCw,
  Cpu,
  Layers,
  Network,
  ChevronDown
} from 'lucide-react';

const Dashboard = () => {
  const { color } = useTheme();
  const [activeModule, setActiveModule] = useState('overview');
  const [allStats, setAllStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportDropdown && !event.target.closest('.dropdown-container')) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportDropdown]);

  /* --------------------------------------------------------------
     Fetch Live Data
  -------------------------------------------------------------- */
  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get('/api/dashboard');
      setAllStats(response.data);
      setLastSync(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Dashboard Sync Failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 5 minutes for that "Live" feel
    const interval = setInterval(fetchStats, 300000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const aiInsights = [
    { id: 1, type: 'opportunity', title: 'Revenue Growth Opportunity', description: 'Neural engine predicts 23% revenue growth potential by optimizing product pricing in the next quarter.', confidence: 87, impact: 'high', action: 'Review pricing' },
    { id: 2, type: 'alert', title: 'Inventory Optimization', description: '5 critical nodes showing slow movement. Recommend automated re-stocking protocol adjustment.', confidence: 92, impact: 'medium', action: 'Analyze stock' },
    { id: 3, type: 'insight', title: 'Customer Peak Engagement', description: 'Traffic spikes detected between 14:00 - 16:00. Optimized campaign deployment active.', confidence: 78, impact: 'medium', action: 'Adjust timing' },
  ];

  const modules = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard, color: 'blue', description: 'System Performance' },
    { id: 'inventory', name: 'Inventory', icon: Package, color: 'orange', description: 'Asset Registry' },
    { id: 'crm', name: 'CRM', icon: Users, color: 'purple', description: 'Customer Nodes' },
    { id: 'hrm', name: 'HRM', icon: UserCheck, color: 'green', description: 'Human Capital' },
    { id: 'accounts', name: 'Accounts', icon: CreditCard, color: 'red', description: 'Fiscal Streams' },
  ];

  if (loading) return <DashboardSkeleton />;

  const currentStats = allStats?.[activeModule] || {};

  /* --------------------------------------------------------------
     Render correct overview
  -------------------------------------------------------------- */
  const renderModuleOverview = () => {
    switch (activeModule) {
      case 'inventory': return <InventoryOverview stats={currentStats} />;
      case 'crm': return <CRMOverview stats={currentStats} />;
      case 'hrm': return <HRMOverview stats={currentStats} />;
      case 'accounts': return <AccountsOverview stats={currentStats} />;
      default: return <GeneralOverview stats={allStats?.overview} />;
    }
  };

  return (
    <div className="space-y-8 p-4 lg:p-6 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 overflow-hidden relative">

      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-40">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      </div>

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 relative z-10"
      >
        <div>
          <div className="flex items-center space-x-3 mb-3">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/90">System Online</span>
            </div>
            <span className="h-px w-8 bg-slate-300 dark:bg-slate-700"></span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Node ID: AN-742</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
            COMMAND <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 via-indigo-500 to-purple-500">CENTER</span>
          </h1>
          <div className="flex items-center space-x-4 mt-4">
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md text-sm border-l-2 border-primary-500 pl-4">
              Real-time synchronization with global assets. Last update: <span className="text-slate-900 dark:text-slate-200 font-bold">{lastSync}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="p-1.5 glass-card rounded-2xl flex items-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-white/10 shadow-2xl">
            {['week', 'month', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${timeRange === range
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
                  }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={fetchStats}
            className="p-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl border border-slate-200 dark:border-white/10 hover:rotate-180 transition-all duration-500 shadow-xl group"
          >
            <RefreshCw size={18} className="group-active:scale-90" />
          </button>

          <div className="relative dropdown-container">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="flex items-center space-x-3 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(37,99,235,0.3)]"
            >
              <Download size={16} />
              <span>Telemetry Export</span>
              <ChevronDown size={14} className={`ml-2 transition-transform duration-300 ${showExportDropdown ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showExportDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 p-4 z-50 overflow-hidden"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block">Select Data Stream</span>
                  <div className="space-y-2">
                    {[
                      { label: 'Inventory Data', url: '/api/reports/inventory', icon: Package, color: 'text-primary-500' },
                      { label: 'Workforce Matrix', url: '/api/reports/employees', icon: UserCheck, color: 'text-emerald-500' },
                      { label: 'Fiscal Streams', url: '/api/reports/sales', icon: DollarSign, color: 'text-amber-500' },
                    ].map((item, i) => (
                      <a
                        key={i}
                        href={item.url}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all group/item"
                      >
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">{item.label}</span>
                        <item.icon size={14} className={`text-slate-400 group-hover/item:${item.color}`} />
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Module Selector - Industrial Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 relative z-10">
        {modules.map((mod, idx) => {
          const active = activeModule === mod.id;
          const Icon = mod.icon;

          return (
            <motion.button
              key={mod.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setActiveModule(mod.id)}
              className={`relative group p-6 rounded-3xl transition-all duration-500 ${active
                ? 'bg-slate-900 dark:bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] scale-105 h-full'
                : 'bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-white/5 hover:bg-white/80 dark:hover:bg-slate-900/80'
                }`}
            >
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${active
                    ? 'bg-primary-500 text-white shadow-[0_0_30px_rgba(37,99,235,0.5)] rotate-6'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-primary-500/10 group-hover:text-primary-500'
                    }`}>
                    <Icon size={24} strokeWidth={2.5} />
                  </div>
                  <h3 className={`text-sm font-black uppercase tracking-widest transition-colors ${active ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-slate-200'}`}>
                    {mod.name}
                  </h3>
                  <p className={`text-[10px] font-bold mt-2 uppercase tracking-tighter ${active ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'}`}>
                    {mod.description}
                  </p>
                </div>

                {active && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    className="h-1 bg-primary-500 rounded-full mt-6"
                  />
                )}
              </div>

              {/* Background Decoration */}
              <div className={`absolute -bottom-4 -right-4 transition-opacity duration-500 ${active ? 'opacity-10' : 'opacity-0'}`}>
                <Icon size={120} className={active ? 'text-white dark:text-black' : ''} />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Main Intelligence Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 relative z-10 items-start">
        <div className="xl:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {renderModuleOverview()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Tactical Info Panel */}
        <div className="space-y-8">

          {/* AI Intelligence Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-3xl p-8 bg-slate-950 dark:bg-black border border-white/10 group shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 blur-[60px]"></div>

            <div className="relative z-10 flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white flex items-center">
                  <Cpu size={14} className="mr-2 text-primary-500" /> Neural Analysis
                </h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-widest italic">Core Ver: 2.1.0-beta</p>
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              {(allStats?.telemetry || aiInsights).map((log, idx) => (
                <div
                  key={log.id}
                  className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all duration-300 cursor-default group/item"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${log.module === 'INVENTORY' ? 'bg-rose-500/20 text-rose-400' :
                      log.module === 'CRM' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary-500/20 text-primary-400'
                      }`}>
                      {log.module || 'System'}
                    </span>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">
                      {log.created_at ? new Date(log.created_at).toLocaleTimeString() : 'LIVE'}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-white uppercase tracking-tight mb-2 group-hover/item:text-primary-400 transition-colors">
                    {log.action?.replace(/_/g, ' ') || log.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">
                    {typeof log.details === 'string' ? log.details : (log.description || 'Neural patterns detected in node stream.')}
                  </p>
                </div>
              ))}
            </div>

            <button className="w-full mt-6 py-4 rounded-2xl border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/5 transition-all">
              Initialize Full Diagnostic
            </button>
          </motion.div>

          {/* Infrastructure Matrix */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl rounded-3xl p-8 border border-slate-200 dark:border-white/10 shadow-xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white flex items-center">
                <Network size={14} className="mr-2 text-indigo-500" /> Infra Status
              </h3>
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-[8px] font-black text-emerald-500 uppercase">Optimal</span>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Database Node</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white tracking-widest">99.9%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '99.9%' }}
                    className="h-full bg-gradient-to-r from-emerald-500 via-primary-500 to-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-primary-500/50 transition-colors group">
                  <Layers size={20} className="text-primary-500 mb-4 group-hover:scale-110 transition-transform" />
                  <div className="text-2xl font-black text-slate-900 dark:text-white">142</div>
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em] mt-1">Containers</div>
                </div>
                <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-indigo-500/50 transition-colors group">
                  <Activity size={20} className="text-indigo-500 mb-4 group-hover:scale-110 transition-transform" />
                  <div className="text-2xl font-black text-slate-900 dark:text-white">4.2ms</div>
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em] mt-1">Latency</div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

/* -----------------------------------------------------------------
   Sub-components
----------------------------------------------------------------- */
const GeneralOverview = ({ stats }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Gross Revenue"
        value={`$${(stats?.revenue / 1000).toFixed(1)}K`}
        change="+12.5%"
        changeType="positive"
        icon={DollarSign}
        color="green"
        chartData={[30, 40, 35, 50, 49, 60, 70, 91, 125, 150, 180, 200]}
      />
      <StatCard
        title="Asset Utilization"
        value={stats?.users?.toLocaleString()}
        change="+8.2%"
        changeType="positive"
        icon={Cpu}
        color="blue"
        chartData={[65, 78, 90, 81, 56, 55, 40, 45, 60, 75, 80, 95]}
      />
      <StatCard
        title="Node Throughput"
        value={stats?.orders}
        change="+3.1%"
        changeType="positive"
        icon={ShoppingCart}
        color="purple"
        chartData={[12, 19, 3, 5, 2, 3, 15, 18, 22, 25, 28, 32]}
      />
      <StatCard
        title="Efficiency Ratio"
        value={`${stats?.conversion}%`}
        change="+2.4%"
        changeType="positive"
        icon={Zap}
        color="orange"
        chartData={[1.2, 1.8, 2.1, 2.4, 2.6, 2.8, 3.0, 3.1, 3.2, 3.1, 3.2, 3.2]}
      />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
      {/* Revenue Projection Trend */}
      <div className="glass-card rounded-[2.5rem] p-8 bg-white/60 dark:bg-slate-900/40 backdrop-blur-3xl border border-slate-200 dark:border-white/10 shadow-2xl relative overflow-hidden h-[400px]">
        <div className="flex items-center justify-between mb-12 relative z-10">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white">Revenue Matrix</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase mt-2 tracking-widest">Financial Stream Live Integration</p>
          </div>
          <div className="p-3 bg-primary-500/10 text-primary-500 rounded-2xl shadow-inner border border-primary-500/20">
            <BarChart3 size={20} strokeWidth={2.5} />
          </div>
        </div>

        <div className="h-60 flex items-end justify-between space-x-2 relative z-10 pl-2">
          {[65, 78, 90, 81, 56, 55, 40, 45, 60, 75, 80, 95].map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(v / 100) * 100}%` }}
                className="w-full bg-gradient-to-t from-primary-600 via-indigo-500 to-indigo-400 rounded-t-xl transition-all duration-500 group-hover:from-primary-400 group-hover:scale-y-105 relative cursor-pointer group-hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]"
              >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 whitespace-nowrap z-20 shadow-2xl">
                  ${v}K
                </div>
              </motion.div>
              <span className="text-[8px] font-black text-slate-400 mt-4 uppercase tracking-tighter opacity-70">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Traffic Analysis Donut */}
      <div className="glass-card rounded-[2.5rem] p-8 bg-white/60 dark:bg-slate-900/40 backdrop-blur-3xl border border-slate-200 dark:border-white/10 shadow-2xl relative overflow-hidden h-[400px]">
        <div className="flex items-center justify-between mb-12 relative z-10">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white">Segment Analysis</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase mt-2 tracking-widest">Global Sectoral Distribution</p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl shadow-inner border border-indigo-500/20">
            <PieChart size={20} strokeWidth={2.5} />
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center space-x-0 md:space-x-12 relative z-10 h-64">
          <div className="relative w-48 h-48 drop-shadow-[0_20px_40px_rgba(0,0,0,0.2)]">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="96" cy="96" r="85" fill="transparent" stroke="currentColor" strokeWidth="16" className="text-slate-100 dark:text-slate-800/40" />
              <circle cx="96" cy="96" r="85" fill="transparent" stroke="currentColor" strokeWidth="16" strokeDasharray="534" strokeDashoffset="120" className="text-primary-500" />
              <circle cx="96" cy="96" r="85" fill="transparent" stroke="currentColor" strokeWidth="16" strokeDasharray="534" strokeDashoffset="340" className="text-indigo-500/80" />
              <circle cx="96" cy="96" r="85" fill="transparent" stroke="currentColor" strokeWidth="16" strokeDasharray="534" strokeDashoffset="480" className="text-emerald-500/60" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">84%</span>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Aggregated Op</span>
            </div>
          </div>

          <div className="space-y-4 mt-8 md:mt-0">
            {[
              { label: 'Direct Protocol', val: '45%', color: 'bg-primary-500' },
              { label: 'Network Proxy', val: '28%', color: 'bg-indigo-500' },
              { label: 'Neural Web', val: '18%', color: 'bg-emerald-500' },
              { label: 'External Nodes', val: '9%', color: 'bg-amber-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center space-x-5 group cursor-default">
                <div className={`w-3 h-3 rounded-full ${item.color} shadow-[0_0_15px_rgba(0,0,0,0.3)] group-hover:scale-125 transition-transform`} />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest transition-colors group-hover:text-primary-500">{item.label}</span>
                  <span className="text-[9px] font-bold text-slate-500">{item.val}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const StatCard = ({ title, value, change, changeType, icon: Icon, color, chartData = [] }) => {
  const colorMap = {
    blue: { bg: 'bg-primary-500', text: 'text-primary-500', glow: 'shadow-primary-500/20', border: 'border-primary-500/10' },
    green: { bg: 'bg-emerald-500', text: 'text-emerald-500', glow: 'shadow-emerald-500/20', border: 'border-emerald-500/10' },
    purple: { bg: 'bg-indigo-500', text: 'text-indigo-500', glow: 'shadow-indigo-500/20', border: 'border-indigo-500/10' },
    orange: { bg: 'bg-amber-500', text: 'text-amber-500', glow: 'shadow-amber-500/20', border: 'border-amber-500/10' },
    red: { bg: 'bg-rose-500', text: 'text-rose-500', glow: 'shadow-rose-500/20', border: 'border-rose-500/10' },
  };

  const activeColor = colorMap[color] || colorMap.blue;
  const changeClr = {
    positive: 'text-emerald-500 bg-emerald-500/10',
    negative: 'text-rose-500 bg-rose-500/10',
    warning: 'text-amber-500 bg-amber-500/10',
  };

  const max = chartData.length ? Math.max(...chartData) : 1;

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      className={`glass-card rounded-[2rem] p-7 shadow-xl group relative overflow-hidden transition-all duration-500 bg-white/70 dark:bg-slate-900/40 border border-white/20 dark:border-white/5 active:scale-95`}
    >
      {/* Mesh Gradient Background */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.25em] mb-3">{title}</p>
          <div className="flex items-center space-x-3">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{value || '---'}</h3>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${changeClr[changeType]} flex items-center shadow-sm`}>
              {changeType === 'positive' ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
              {change}
            </span>
          </div>
        </div>
        <div className={`p-4 rounded-2xl ${activeColor.bg} text-white ${activeColor.glow} transform transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-2xl`}>
          <Icon size={22} strokeWidth={2.5} />
        </div>
      </div>

      <div className="flex items-end space-x-1.5 h-12 mt-8 relative z-10">
        {chartData.slice(-12).map((v, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${(v / max) * 100}%` }}
            className={`flex-1 ${activeColor.bg} rounded-full opacity-30 group-hover:opacity-80 transition-all duration-500 shadow-sm`}
          />
        ))}
      </div>
    </motion.div>
  );
};

/* -----------------------------------------------------------------
   Module Overviews (Connecting Stats)
----------------------------------------------------------------- */
const InventoryOverview = ({ stats }) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-left duration-500">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Asset Registry" value={stats?.totalProducts} change="+24" changeType="positive" icon={Package} color="blue" chartData={[10, 15, 20, 25, 30, 28, 35, 42]} />
      <StatCard title="Critical Levels" value={stats?.lowStock} change="+5" changeType="negative" icon={AlertTriangle} color="orange" chartData={[5, 8, 4, 9, 12, 11, 7, 10]} />
      <StatCard title="Zero Redundancy" value={stats?.outOfStock} change="-2" changeType="positive" icon={TrendingDown} color="red" chartData={[10, 8, 7, 5, 4, 6, 5, 2]} />
      <StatCard title="Rotation Flux" value={`${stats?.turnover}x`} change="+0.3x" changeType="positive" icon={RefreshCw} color="green" chartData={[2.1, 2.2, 2.3, 2.4, 2.3, 2.5]} />
    </div>
  </div>
);

const CRMOverview = ({ stats }) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-left duration-500">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Lead Accumulation" value={stats?.leads} change="+12" changeType="positive" icon={Users} color="blue" chartData={[100, 110, 120, 130, 147]} />
      <StatCard title="Node Conversion" value={stats?.conversions} change="+4" changeType="positive" icon={TrendingUp} color="green" chartData={[20, 25, 28, 32, 35]} />
      <StatCard title="Tactical Syncs" value={stats?.meetings} change="+2" changeType="positive" icon={Calendar} color="purple" chartData={[10, 12, 14, 18, 20]} />
      <StatCard title="Signal Latency" value={`${stats?.responseTime}h`} change="-0.3h" changeType="positive" icon={Zap} color="orange" chartData={[2.8, 2.6, 2.4, 2.2, 2.1]} />
    </div>
  </div>
);

const HRMOverview = ({ stats }) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-left duration-500">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Human Infrastructure" value={stats?.employees} change="+3" changeType="positive" icon={Users} color="blue" chartData={[70, 75, 80, 84]} />
      <StatCard title="New Node Ingress" value={stats?.newHires} change="+1" changeType="positive" icon={UserCheck} color="green" chartData={[1, 0, 2, 3, 1]} />
      <StatCard title="Downtime Nodes" value={stats?.leaves} change="+2" changeType="negative" icon={Calendar} color="orange" chartData={[4, 5, 7, 6, 8]} />
      <StatCard title="Op Efficiency" value={`${stats?.productivity}%`} change="+5%" changeType="positive" icon={Activity} color="purple" chartData={[80, 82, 85, 87, 86]} />
    </div>
  </div>
);

const AccountsOverview = ({ stats }) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-left duration-500">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Fiscal Inflow" value={`$${(stats?.revenue / 1000).toFixed(1)}K`} change="+15.2%" changeType="positive" icon={DollarSign} color="green" chartData={[60, 70, 85, 89]} />
      <StatCard title="Op Burn Rate" value={`$${(stats?.expenses / 1000).toFixed(1)}K`} change="+8.7%" changeType="negative" icon={TrendingDown} color="red" chartData={[30, 35, 42, 45]} />
      <StatCard title="Net Yield" value={`$${(stats?.profit / 1000).toFixed(1)}K`} change="+22.4%" changeType="positive" icon={TrendingUp} color="blue" chartData={[30, 35, 43, 44]} />
      <StatCard title="Liquid Capital" value={`$${(stats?.cashFlow / 1000).toFixed(1)}K`} change="+12.1%" changeType="positive" icon={Activity} color="purple" chartData={[10, 11, 12, 12.5]} />
    </div>
  </div>
);

const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse p-6">
    <div className="flex justify-between items-end">
      <div className="space-y-4">
        <div className="h-3 w-40 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
        <div className="h-16 w-80 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
      </div>
      <div className="h-14 w-64 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
    </div>
    <div className="grid grid-cols-5 gap-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-40 bg-slate-100 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800"></div>
      ))}
    </div>
    <div className="grid grid-cols-4 gap-8">
      <div className="col-span-3 h-[500px] bg-slate-100 dark:bg-slate-900/50 rounded-[3rem] border border-slate-200 dark:border-slate-800"></div>
      <div className="h-[500px] bg-slate-100 dark:bg-slate-900/50 rounded-[3rem] border border-slate-200 dark:border-slate-800"></div>
    </div>
  </div>
);

export default Dashboard;
