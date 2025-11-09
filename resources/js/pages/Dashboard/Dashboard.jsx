// components/Pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';

const Dashboard = () => {
  const { color } = useTheme();
  const [activeModule, setActiveModule] = useState('overview');
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');

  /* --------------------------------------------------------------
     Sample data (unchanged)
  -------------------------------------------------------------- */
  const sampleData = {
    overview: { revenue: 124526, users: 2438, orders: 324, growth: 12.5, conversion: 3.2 },
    inventory: { totalProducts: 1247, lowStock: 23, outOfStock: 5, categories: 18, turnover: 2.4 },
    crm: { leads: 147, conversions: 32, meetings: 18, satisfaction: 94, responseTime: 2.1 },
    hrm: { employees: 84, newHires: 3, leaves: 7, attendance: 96, productivity: 87 },
    accounts: { revenue: 89456, expenses: 45213, profit: 44243, tax: 8765, cashFlow: 12500 },
  };

  const aiInsights = [
    { id: 1, type: 'opportunity', title: 'Revenue Growth Opportunity', description: 'AI predicts 23% revenue growth potential by optimizing product pricing', confidence: 87, impact: 'high', action: 'Review pricing strategy' },
    { id: 2, type: 'alert', title: 'Inventory Optimization', description: '5 products showing slow movement. Consider promotions or bundling', confidence: 92, impact: 'medium', action: 'Analyze product performance' },
    { id: 3, type: 'insight', title: 'Customer Engagement Peak', description: 'Highest engagement occurs between 2-4 PM. Schedule campaigns accordingly', confidence: 78, impact: 'medium', action: 'Adjust campaign timing' },
  ];

  const modules = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard, color: 'blue', description: 'Business Performance' },
    { id: 'inventory', name: 'Inventory', icon: Package, color: 'orange', description: 'Stock Management' },
    { id: 'crm', name: 'CRM', icon: Users, color: 'purple', description: 'Customer Relations' },
    { id: 'hrm', name: 'HRM', icon: UserCheck, color: 'green', description: 'Human Resources' },
    { id: 'accounts', name: 'Accounts', icon: CreditCard, color: 'red', description: 'Financial Management' },
  ];

  /* --------------------------------------------------------------
     Load stats when module changes
  -------------------------------------------------------------- */
  useEffect(() => {
    const timer = setTimeout(() => {
      setStats(sampleData[activeModule] || {});
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [activeModule]);

  /* --------------------------------------------------------------
     Colour helper
  -------------------------------------------------------------- */
  const getColorClasses = (base) => {
    const map = {
      blue:   { bg: 'bg-blue-500',   light: 'bg-blue-100 dark:bg-blue-900',   text: 'text-blue-600 dark:text-blue-400' },
      orange: { bg: 'bg-orange-500', light: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-600 dark:text-orange-400' },
      purple: { bg: 'bg-purple-500', light: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-600 dark:text-purple-400' },
      green:  { bg: 'bg-green-500',  light: 'bg-green-100 dark:bg-green-900',  text: 'text-green-600 dark:text-green-400' },
      red:    { bg: 'bg-red-500',    light: 'bg-red-100 dark:bg-red-900',      text: 'text-red-600 dark:text-red-400' },
    };
    return map[base] || map.blue;
  };

  /* --------------------------------------------------------------
     Render correct overview
  -------------------------------------------------------------- */
  const renderModuleOverview = () => {
    switch (activeModule) {
      case 'inventory': return <InventoryOverview stats={stats} />;
      case 'crm':       return <CRMOverview stats={stats} />;
      case 'hrm':       return <HRMOverview stats={stats} />;
      case 'accounts':  return <AccountsOverview stats={stats} />;
      default:          return <GeneralOverview stats={sampleData.overview} />;
    }
  };

  if (loading) return <DashboardSkeleton />;

  /* --------------------------------------------------------------
     Main UI
  -------------------------------------------------------------- */
  return (
    <div className="space-y-6">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">AI-powered insights and business analytics</p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="quarter">Last quarter</option>
            <option value="year">Last year</option>
          </select>

          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
            <Download size={18} />
            <span>Export</span>
          </button>

          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </div>
      </motion.div>

      {/* Module Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-5 gap-4"
      >
        {modules.map((mod) => {
          const colors = getColorClasses(mod.color);
          const active = activeModule === mod.id;
          const Icon = mod.icon;

          return (
            <motion.button
              key={mod.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveModule(mod.id)}
              className={`p-4 rounded-xl text-left transition-all ${
                active
                  ? `${colors.bg} text-white shadow-lg`
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${active ? 'bg-white/20' : colors.light}`}>
                  <Icon size={20} className={active ? 'text-white' : colors.text} />
                </div>
                {active && <ArrowUpRight size={16} className="text-white/80" />}
              </div>

              <h3 className={`font-semibold ${active ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                {mod.name}
              </h3>
              <p className={`text-sm mt-1 ${active ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                {mod.description}
              </p>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">{renderModuleOverview()}</div>

        {/* Sidebar */}
        <div className="space-y-6">

          {/* AI Insights */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">AI Insights</h3>
              <Brain size={20} className="text-white/80" />
            </div>

            <div className="space-y-4">
              {aiInsights.map((insight, idx) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        insight.type === 'opportunity'
                          ? 'bg-green-500/20 text-green-200'
                          : insight.type === 'alert'
                          ? 'bg-red-500/20 text-red-200'
                          : 'bg-blue-500/20 text-blue-200'
                      }`}
                    >
                      {insight.type}
                    </span>
                    <span className="text-xs text-white/60">{insight.confidence}% confidence</span>
                  </div>

                  <h4 className="font-medium text-white text-sm mb-1">{insight.title}</h4>
                  <p className="text-white/70 text-xs mb-2">{insight.description}</p>
                  <button className="text-xs text-white/90 hover:text-white underline">
                    {insight.action} to
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Performance Metrics */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Score</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Overall Score</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="h-2 rounded-full bg-green-500" style={{ width: '87%' }}></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">87%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Target size={20} className="text-blue-500 mx-auto mb-1" />
                  <div className="text-lg font-bold text-gray-900 dark:text-white">94%</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Goals Met</div>
                </div>

                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Zap size={20} className="text-green-500 mx-auto mb-1" />
                  <div className="text-lg font-bold text-gray-900 dark:text-white">12.5%</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Growth Rate</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>

            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                <Plus size={20} />
                <span className="text-xs mt-1">New Report</span>
              </button>

              <button className="flex flex-col items-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                <RefreshCw size={20} />
                <span className="text-xs mt-1">Refresh Data</span>
              </button>

              <button className="flex flex-col items-center p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                <Eye size={20} />
                <span className="text-xs mt-1">View Analytics</span>
              </button>

              <button className="flex flex-col items-center p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
                <Activity size={20} />
                <span className="text-xs mt-1">Live Monitor</span>
              </button>
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
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    {/* Stat cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Revenue"
        value={`$${(stats.revenue / 1000).toFixed(0)}K`}
        change="+12.5%"
        changeType="positive"
        icon={DollarSign}
        color="green"
        chartData={[30, 40, 35, 50, 49, 60, 70, 91, 125, 150, 180, 200]}
      />
      <StatCard
        title="Active Users"
        value={stats.users?.toLocaleString()}
        change="+8.2%"
        changeType="positive"
        icon={Users}
        color="blue"
        chartData={[65, 78, 90, 81, 56, 55, 40, 45, 60, 75, 80, 95]}
      />
      <StatCard
        title="New Orders"
        value={stats.orders}
        change="+3.1%"
        changeType="positive"
        icon={ShoppingCart}
        color="purple"
        chartData={[12, 19, 3, 5, 2, 3, 15, 18, 22, 25, 28, 32]}
      />
      <StatCard
        title="Conversion Rate"
        value={`${stats.conversion}%`}
        change="+2.4%"
        changeType="positive"
        icon={TrendingUp}
        color="orange"
        chartData={[1.2, 1.8, 2.1, 2.4, 2.6, 2.8, 3.0, 3.1, 3.2, 3.1, 3.2, 3.2]}
      />
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue Trend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Trend</h3>
          <BarChart3 size={20} className="text-gray-400" />
        </div>
        <div className="h-48 flex items-end space-x-1">
          {[65, 78, 90, 81, 56, 55, 40, 45, 60, 75, 80, 95].map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-gradient-to-t from-blue-500 to-blue-600 rounded-t transition-all hover:opacity-80"
                style={{ height: `${(v / 100) * 100}%` }}
              />
              <span className="text-xs text-gray-500 mt-1">
                {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Traffic Sources (simulated pie) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Traffic Sources</h3>
          <PieChart size={20} className="text-gray-400" />
        </div>
        <div className="h-48 flex items-center justify-center">
          <div className="relative w-32 h-32">
            <div className="absolute inset-0 rounded-full border-8 border-blue-500" />
            <div className="absolute inset-0 rounded-full border-8 border-green-500 transform -rotate-45" />
            <div className="absolute inset-0 rounded-full border-8 border-purple-500 transform -rotate-90" />
            <div className="absolute inset-0 rounded-full border-8 border-orange-500 transform -rotate-135" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">100%</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {['Direct', 'Social', 'Organic', 'Email'].map((src, i) => (
            <div key={src} className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-green-500' : i === 2 ? 'bg-purple-500' : 'bg-orange-500'
                }`}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">{src}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
);

const StatCard = ({ title, value, change, changeType, icon: Icon, color, chartData = [] }) => {
  const bgMap = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
  };
  const changeClr = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    warning: 'text-orange-600 dark:text-orange-400',
  };

  const max = chartData.length ? Math.max(...chartData) : 1;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          <p className={`text-sm font-medium ${changeClr[changeType]} mt-1 flex items-center`}>
            {changeType === 'positive' ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
            {change}
          </p>
        </div>
        <div className={`p-3 ${bgMap[color]} bg-opacity-10 rounded-lg`}>
          <Icon size={24} className={bgMap[color].replace('bg-', 'text-')} />
        </div>
      </div>

      {/* Mini chart */}
      <div className="flex items-end space-x-1 h-8 mt-2">
        {chartData.slice(-6).map((v, i) => (
          <div
            key={i}
            className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-t transition-all hover:opacity-80"
            style={{ height: `${(v / max) * 100}%` }}
          />
        ))}
      </div>
    </motion.div>
  );
};

/* -----------------------------------------------------------------
   Module-specific overviews
----------------------------------------------------------------- */
const InventoryOverview = ({ stats }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Total Products" value={stats.totalProducts} change="+24" changeType="positive" icon={Package} color="blue" />
      <StatCard title="Low Stock" value={stats.lowStock} change="+5" changeType="negative" icon={AlertTriangle} color="orange" />
      <StatCard title="Out of Stock" value={stats.outOfStock} change="-2" changeType="positive" icon={TrendingDown} color="red" />
      <StatCard title="Turnover Rate" value={`${stats.turnover}x`} change="+0.3x" changeType="positive" icon={RefreshCw} color="green" />
    </div>
  </motion.div>
);

const CRMOverview = ({ stats }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Total Leads" value={stats.leads} change="+12" changeType="positive" icon={Users} color="blue" />
      <StatCard title="Conversions" value={stats.conversions} change="+4" changeType="positive" icon={TrendingUp} color="green" />
      <StatCard title="Meetings" value={stats.meetings} change="+2" changeType="positive" icon={Calendar} color="purple" />
      <StatCard title="Response Time" value={`${stats.responseTime}h`} change="-0.3h" changeType="positive" icon={Zap} color="orange" />
    </div>
  </motion.div>
);

const HRMOverview = ({ stats }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Total Employees" value={stats.employees} change="+3" changeType="positive" icon={Users} color="blue" />
      <StatCard title="New Hires" value={stats.newHires} change="+1" changeType="positive" icon={UserCheck} color="green" />
      <StatCard title="On Leave" value={stats.leaves} change="+2" changeType="negative" icon={Calendar} color="orange" />
      <StatCard title="Productivity" value={`${stats.productivity}%`} change="+5%" changeType="positive" icon={Activity} color="purple" />
    </div>
  </motion.div>
);

const AccountsOverview = ({ stats }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Total Revenue" value={`$${(stats.revenue / 1000).toFixed(0)}K`} change="+15.2%" changeType="positive" icon={DollarSign} color="green" />
      <StatCard title="Expenses" value={`$${(stats.expenses / 1000).toFixed(0)}K`} change="+8.7%" changeType="negative" icon={TrendingDown} color="red" />
      <StatCard title="Net Profit" value={`$${(stats.profit / 1000).toFixed(0)}K`} change="+22.4%" changeType="positive" icon={TrendingUp} color="blue" />
      <StatCard title="Cash Flow" value={`$${(stats.cashFlow / 1000).toFixed(0)}K`} change="+12.1%" changeType="positive" icon={Activity} color="purple" />
    </div>
  </motion.div>
);

/* -----------------------------------------------------------------
   Skeleton
----------------------------------------------------------------- */
const DashboardSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
      ))}
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
      </div>
    </div>
  </div>
);

export default Dashboard;