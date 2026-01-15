// components/Layout/Sidebar.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import { IconMapper } from './UI/IconMapper';
import { menuData } from '../data/menuData';

const { menuItems } = menuData;

const Sidebar = ({
  isCollapsed = false,
  onToggle,
  mobileOpen = false,
  onMobileClose,
}) => {
  const [expandedItems, setExpandedItems] = useState(new Set([2, 3]));
  const [isMobile, setIsMobile] = useState(false);
  const { color, theme } = useTheme();
  const location = useLocation();
  const navRef = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const toggleSubmenu = (id) => {
    const copy = new Set(expandedItems);
    copy.has(id) ? copy.delete(id) : copy.add(id);
    setExpandedItems(copy);
  };

  const isActive = (path, itemId) => {
    const currentPath = location.pathname;
    if (itemId !== undefined) {
      const item = menuItems.find(i => i.id === itemId);
      const exactMatch = currentPath === path;
      const childActive = item?.submenu?.some(sub => currentPath.startsWith(sub.path));
      return exactMatch || childActive;
    }
    return currentPath === path;
  };

  const colorConfig = {
    blue: {
      from: 'from-blue-600/80',
      to: 'to-blue-400/80',
      glow: 'shadow-blue-500/20',
      text: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20'
    },
    purple: {
      from: 'from-purple-600/80',
      to: 'to-purple-400/80',
      glow: 'shadow-purple-500/20',
      text: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20'
    },
    green: {
      from: 'from-emerald-600/80',
      to: 'to-emerald-400/80',
      glow: 'shadow-emerald-500/20',
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20'
    },
    red: {
      from: 'from-rose-600/80',
      to: 'to-rose-400/80',
      glow: 'shadow-rose-500/20',
      text: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20'
    },
    orange: {
      from: 'from-amber-600/80',
      to: 'to-amber-400/80',
      glow: 'shadow-amber-500/20',
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20'
    },
  }[color] || colorConfig.blue;

  const sidebarVariants = {
    expanded: { width: 280, transition: { type: 'spring', damping: 20, stiffness: 100 } },
    collapsed: { width: 84, transition: { type: 'spring', damping: 20, stiffness: 100 } },
  };

  const mobileVariants = {
    open: { x: 0, transition: { type: 'spring', damping: 25, stiffness: 120 } },
    closed: { x: '-100%', transition: { type: 'spring', damping: 25, stiffness: 120 } },
  };

  const submenuVariants = {
    open: { height: 'auto', opacity: 1, transition: { height: { duration: 0.3 }, opacity: { duration: 0.2 } } },
    closed: { height: 0, opacity: 0, transition: { height: { duration: 0.3 }, opacity: { duration: 0.2 } } },
  };

  const SubItem = ({ sub }) => {
    const active = isActive(sub.path);
    return (
      <motion.div
        key={sub.id}
        whileHover={{ x: 4 }}
        className={`group relative rounded-lg transition-all duration-200 ${active
            ? `${colorConfig.bg} ${colorConfig.border} border shadow-inner`
            : 'hover:bg-gray-100/50 dark:hover:bg-slate-800/50 border-transparent'
          } border`}
      >
        <Link
          to={sub.path}
          onClick={() => isMobile && onMobileClose?.()}
          className="w-full text-left p-2.5 rounded-lg flex items-center justify-between"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span
                className={`font-medium text-sm transition-colors ${active
                    ? colorConfig.text
                    : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'
                  }`}
              >
                {sub.title}
              </span>
              {sub.badge && (
                <span className="px-1.5 py-0.5 text-[10px] rounded bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold tracking-wider uppercase">
                  {sub.badge}
                </span>
              )}
            </div>
          </div>
        </Link>
        {active && (
          <motion.div
            layoutId="activeSubIndicator"
            className={`absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-gradient-to-b ${colorConfig.from} ${colorConfig.to} shadow-lg ${colorConfig.glow}`}
          />
        )}
      </motion.div>
    );
  };

  const TopItem = ({ item }) => {
    const hasSub = !!item.submenu;
    const active = isActive(item.path, item.id);
    const expanded = expandedItems.has(item.id);

    return (
      <div className="px-3 mb-1">
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`group relative rounded-xl transition-all duration-300 ${active
              ? `bg-gradient-to-br ${colorConfig.from} ${colorConfig.to} shadow-lg ${colorConfig.glow} border border-white/10`
              : 'hover:bg-slate-100 dark:hover:bg-slate-800/40 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/50'
            }`}
        >
          {hasSub ? (
            <button
              onClick={() => toggleSubmenu(item.id)}
              className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-all duration-200 ${isCollapsed && !isMobile ? 'justify-center' : ''
                }`}
            >
              <div
                className={`flex items-center ${isCollapsed && !isMobile ? 'justify-center' : 'space-x-3'
                  }`}
              >
                <div
                  className={`p-2.5 rounded-lg transition-all duration-300 ${active
                      ? 'bg-white/20 text-white backdrop-blur-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                    }`}
                >
                  <IconMapper name={item.icon} size={20} />
                </div>

                {(!isCollapsed || isMobile) && (
                  <span
                    className={`font-semibold text-sm transition-colors ${active ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                      }`}
                  >
                    {item.title}
                  </span>
                )}
              </div>

              {(!isCollapsed || isMobile) && (
                <div className="flex items-center space-x-2">
                  {item.badge && (
                    <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold uppercase tracking-tight ${active ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                      {item.badge}
                    </span>
                  )}
                  <motion.div
                    animate={{ rotate: expanded ? 0 : -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <IconMapper
                      name="ChevronDown"
                      size={14}
                      className={active ? 'text-white' : 'text-slate-400'}
                    />
                  </motion.div>
                </div>
              )}
            </button>
          ) : (
            <Link
              to={item.path}
              onClick={() => isMobile && onMobileClose?.()}
              className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-all duration-200 ${isCollapsed && !isMobile ? 'justify-center' : ''
                }`}
            >
              <div
                className={`flex items-center ${isCollapsed && !isMobile ? 'justify-center' : 'space-x-3'
                  }`}
              >
                <div
                  className={`p-2.5 rounded-lg transition-all duration-300 ${active
                      ? 'bg-white/20 text-white backdrop-blur-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                    }`}
                >
                  <IconMapper name={item.icon} size={20} />
                </div>

                {(!isCollapsed || isMobile) && (
                  <span
                    className={`font-semibold text-sm transition-colors ${active ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                      }`}
                  >
                    {item.title}
                  </span>
                )}
              </div>
              {(!isCollapsed || isMobile) && item.badge && (
                <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold uppercase tracking-tight ${active ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          )}
        </motion.div>

        <AnimatePresence>
          {hasSub && (!isCollapsed || isMobile) && expanded && (
            <motion.div
              variants={submenuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="overflow-hidden"
            >
              <div className="ml-7 pl-4 mt-1 border-l border-slate-200 dark:border-slate-800 space-y-1 py-1">
                {item.submenu.map((sub) => (
                  <SubItem key={sub.id} sub={sub} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const Branding = ({ collapsed = false }) => (
    <div className={`flex items-center transition-all ${collapsed ? 'justify-center' : 'space-x-3'}`}>
      <div className={`w-10 h-10 bg-gradient-to-br ${colorConfig.from} ${colorConfig.to} rounded-xl flex items-center justify-center shadow-lg ${colorConfig.glow} border border-white/20`}>
        <span className="text-white font-black text-xl italic">M</span>
      </div>
      {!collapsed && (
        <div className="flex flex-col">
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
            Mystrix
          </h1>
          <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${colorConfig.text} mt-1`}>
            Hybrid Alpha
          </span>
        </div>
      )}
    </div>
  );

  const UserProfile = ({ collapsed = false }) => (
    <div className={`flex items-center p-2 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 transition-all ${collapsed ? 'justify-center' : 'space-x-3'}`}>
      <div className="w-9 h-9 bg-gradient-to-br from-slate-400 to-slate-600 dark:from-slate-700 dark:to-slate-900 rounded-xl flex items-center justify-center shadow-md border border-white/10 flex-shrink-0">
        <span className="text-white font-bold text-xs">JD</span>
      </div>
      {!collapsed && (
        <>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate uppercase tracking-wide">
              John Doe
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">
              Super Admin
            </p>
          </div>
          <button className="p-2 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-all">
            <IconMapper name="LogOut" size={14} />
          </button>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Main Sidebar Container */}
      <motion.aside
        variants={isMobile ? mobileVariants : sidebarVariants}
        initial={isMobile ? 'closed' : false}
        animate={isMobile ? (mobileOpen ? 'open' : 'closed') : (isCollapsed ? 'collapsed' : 'expanded')}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col glass-sidebar shadow-2xl ${isMobile ? 'w-72' : ''
          }`}
      >
        {/* Header/Branding */}
        <div className="h-20 flex items-center px-6 border-b border-slate-200/50 dark:border-slate-800/50">
          <Branding collapsed={isCollapsed && !isMobile} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 custom-scrollbar" ref={navRef}>
          {menuItems.map((item) => (
            <TopItem key={item.id} item={item} />
          ))}
        </nav>

        {/* Footer/User */}
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-950/20">
          <UserProfile collapsed={isCollapsed && !isMobile} />
        </div>

        {/* Collapse Toggle (Desktop only) */}
        {!isMobile && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onToggle}
            className={`absolute -right-3.5 top-24 w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-900 rounded-full shadow-lg border border-slate-200 dark:border-slate-800 z-50 text-slate-500 dark:text-slate-400`}
          >
            <IconMapper
              name={isCollapsed ? 'ChevronRight' : 'ChevronLeft'}
              size={14}
            />
          </motion.button>
        )}
      </motion.aside>
    </>
  );
};

export default Sidebar;


