// components/Layout/Header.jsx
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import { IconMapper } from './UI/IconMapper';
const Header = ({ onMenuToggle, isSidebarOpen }) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { theme, toggleTheme, color, setColor } = useTheme();
  
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  const notifications = [
    { id: 1, title: 'New message', message: 'You have a new message from John', time: '5 min ago', unread: true },
    { id: 2, title: 'System update', message: 'System maintenance scheduled', time: '1 hour ago', unread: true },
    { id: 3, title: 'Payment received', message: 'Your payment has been processed', time: '2 hours ago', unread: false },
    { id: 4, title: 'Welcome!', message: 'Welcome to our platform', time: '1 day ago', unread: false },
  ];

  const colorThemes = [
    { name: 'blue', value: 'blue', class: 'bg-gradient-to-r from-blue-500 to-blue-600' },
    { name: 'purple', value: 'purple', class: 'bg-gradient-to-r from-purple-500 to-purple-600' },
    { name: 'green', value: 'green', class: 'bg-gradient-to-r from-green-500 to-green-600' },
    { name: 'red', value: 'red', class: 'bg-gradient-to-r from-red-500 to-red-600' },
    { name: 'orange', value: 'orange', class: 'bg-gradient-to-r from-orange-500 to-orange-600' },
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

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 w-full">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button onClick={onMenuToggle} className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <IconMapper name={isSidebarOpen ? 'X' : 'Menu'} size={20} />
            </button>
            <div className="hidden md:flex items-center space-x-2 ml-4">
              <span className="text-gray-400 dark:text-gray-500">/</span>
              <span className="text-sm text-gray-600 dark:text-gray-300">Dashboard</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
    

            <div className="relative group">
              <button className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <IconMapper name="Palette" size={18} />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Color Theme</h3>
                </div>
                <div className="p-2 grid grid-cols-5 gap-2">
                  {colorThemes.map((colorTheme) => (
                    <button key={colorTheme.value} onClick={() => setColor(colorTheme.value)} className={`w-8 h-8 rounded-full ${colorTheme.class} border-2 ${
                      color === colorTheme.value ? 'border-gray-900 dark:border-white ring-2 ring-offset-2 ring-gray-400' : 'border-transparent'
                    } transition-all hover:scale-110`} title={colorTheme.name} />
                  ))}
                </div>
              </div>
            </div>

            <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <IconMapper name={theme === 'dark' ? 'Sun' : 'Moon'} size={18} />
            </button>

            <div className="relative" ref={notificationRef}>
              <button onClick={() => { setIsNotificationOpen(!isNotificationOpen); setIsUserMenuOpen(false); }} className="relative p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <IconMapper name="Bell" size={20} />
                {unreadCount > 0 && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </motion.span>
                )}
              </button>
              <AnimatePresence>
                {isNotificationOpen && (
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} transition={{ duration: 0.2 }} className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Notifications</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{unreadCount} unread messages</p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notification) => (
                        <motion.div key={notification.id} whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }} className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 cursor-pointer ${
                          notification.unread ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}>
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-gray-900 dark:text-white">{notification.title}</h4>
                            {notification.unread && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-2 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{notification.time}</p>
                        </motion.div>
                      ))}
                    </div>
                    <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                      <button className="w-full text-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium py-2">
                        View all notifications
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative" ref={userMenuRef}>
              <button onClick={() => { setIsUserMenuOpen(!isUserMenuOpen); setIsNotificationOpen(false); }} className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">JD</span>
                </div>
                <div className="hidden md:block text-left">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">John Doe</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Admin</p>
                </div>
                <IconMapper name="ChevronDown" size={16} className={`text-gray-500 dark:text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} transition={{ duration: 0.2 }} className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">John Doe</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">john.doe@example.com</p>
                    </div>
                    <div className="py-1">
                      <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <IconMapper name="User" size={16} className="mr-3" /> Profile
                      </a>
                      <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <IconMapper name="Settings" size={16} className="mr-3" /> Settings
                      </a>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 py-1">
                      <button className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <IconMapper name="LogOut" size={16} className="mr-3" /> Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
       
      </div>
    </header>
  );
};

export default Header;