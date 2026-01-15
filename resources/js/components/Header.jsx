import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/AuthContext';
import { IconMapper } from './UI/IconMapper';
import CommandSearch from './UI/CommandSearch';

const Header = ({ onMenuToggle, isSidebarOpen }) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { theme, toggleTheme, color, setColor } = useTheme();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleShortcut = (e) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  const notifications = [
    { id: 1, title: 'Network Security', message: 'Firewall rules updated successfully.', time: '2 mins ago', unread: true, type: 'security' },
    { id: 2, title: 'System Pulse', message: 'Main server CPU at 42% capacity.', time: '12 mins ago', unread: true, type: 'system' },
    { id: 3, title: 'Database Sync', message: 'Backup vault synchronization complete.', time: '1 hour ago', unread: false, type: 'sync' },
  ];

  const colorThemes = [
    { name: 'blue', value: 'blue', class: 'bg-blue-500 shadow-blue-500/40' },
    { name: 'purple', value: 'purple', class: 'bg-purple-500 shadow-purple-500/40' },
    { name: 'emerald', value: 'green', class: 'bg-emerald-500 shadow-emerald-500/40' },
    { name: 'rose', value: 'red', class: 'bg-rose-500 shadow-rose-500/40' },
    { name: 'amber', value: 'orange', class: 'bg-amber-500 shadow-amber-500/40' },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(notification => notification.unread).length;

  const colorConfig = {
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    green: 'text-emerald-500',
    red: 'text-rose-500',
    orange: 'text-amber-500',
  }[color] || 'text-blue-500';

  return (
    <header className="h-16 flex items-center bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 sticky top-0 z-40 px-4 sm:px-6 lg:px-8 w-full">
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuToggle}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-300 dark:hover:border-slate-700"
          >
            <IconMapper name={isSidebarOpen ? 'PanelLeftClose' : 'PanelLeftOpen'} size={18} />
          </button>

          <div className="hidden md:flex items-center space-x-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">CMD</span>
            <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
            <span className={`text-[11px] font-bold uppercase tracking-wider ${colorConfig}`}>Dashboard</span>
          </div>

          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center space-x-4 px-4 py-2 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all group"
          >
            <IconMapper name="Search" size={16} className="text-slate-400 group-hover:text-primary-500 transition-colors" />
            <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 uppercase tracking-widest flex items-center">
              Search Assets
              <span className="ml-4 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[9px] font-black opacity-40 group-hover:opacity-100">Ctrl K</span>
            </span>
          </button>
        </div>

        <CommandSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Theme Palette */}
          <div className="relative group">
            <button className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-all">
              <IconMapper name="Palette" size={18} />
            </button>
            <div className="absolute right-0 mt-3 w-44 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">Color Interface</span>
              <div className="grid grid-cols-5 gap-2">
                {colorThemes.map((themeItem) => (
                  <button
                    key={themeItem.value}
                    onClick={() => setColor(themeItem.value)}
                    className={`h-6 w-full rounded-md transition-all ${themeItem.class} ${color === themeItem.value ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-600' : 'hover:scale-110 opacity-70'
                      }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-all cursor-pointer relative z-50"
          >
            <IconMapper name={theme === 'dark' ? 'Sun' : 'Moon'} size={18} />
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => { setIsNotificationOpen(!isNotificationOpen); setIsUserMenuOpen(false); }}
              className={`p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-all relative ${isNotificationOpen ? 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white ring-1 ring-slate-200 dark:ring-slate-800' : ''}`}
            >
              <IconMapper name="Bell" size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-950 animate-pulse"></span>
              )}
            </button>

            <AnimatePresence>
              {isNotificationOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50"
                >
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Pulse Center</h3>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-tight">{unreadCount} Critical Updates</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-500 uppercase">Live</span>
                  </div>

                  <div className="max-h-[360px] overflow-y-auto py-2">
                    {notifications.map((n) => (
                      <div key={n.id} className="px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group">
                        <div className="flex items-start space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n.unread ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                            <IconMapper name={n.type === 'security' ? 'Shield' : n.type === 'system' ? 'Activity' : 'RefreshCcw'} size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate uppercase tracking-tight">{n.title}</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                            <span className="text-[9px] font-medium text-slate-400 uppercase mt-2 block">{n.time}</span>
                          </div>
                          {n.unread && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1 shrink-0"></span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full py-3 bg-slate-50 dark:bg-slate-800/30 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all border-t border-slate-100 dark:border-slate-800">
                    System Override Overview
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => { setIsUserMenuOpen(!isUserMenuOpen); setIsNotificationOpen(false); }}
              className={`flex items-center p-1 sm:p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-all border border-transparent ${isUserMenuOpen ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800' : ''}`}
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center shadow-lg border border-white/10 shrink-0 uppercase">
                <span className="text-white text-[10px] font-black">{user?.name?.substring(0, 2) || 'JD'}</span>
              </div>
              <div className="hidden lg:block ml-3 mr-4 text-left">
                <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider leading-none truncate max-w-[100px]">{user?.name || 'Guest'}</p>
                <p className={`text-[9px] font-bold uppercase tracking-tight mt-1 ${colorConfig}`}>{user?.role?.name || 'Authorized'}</p>
              </div>
              <IconMapper name="ChevronDown" size={14} className={`text-slate-400 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50"
                >
                  <div className="space-y-1">
                    <button className="w-full flex items-center px-3 py-2.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all uppercase tracking-tight">
                      <IconMapper name="User" size={14} className="mr-3" /> Profile Stats
                    </button>
                    <button className="w-full flex items-center px-3 py-2.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all uppercase tracking-tight">
                      <IconMapper name="Settings" size={14} className="mr-3" /> Core Registry
                    </button>
                  </div>
                  <div className="my-2 border-t border-slate-100 dark:border-slate-800"></div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center px-3 py-2.5 text-[11px] font-bold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all uppercase tracking-tight"
                  >
                    <IconMapper name="Power" size={14} className="mr-3" /> Terminate
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;