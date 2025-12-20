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
  const [expandedItems, setExpandedItems] = useState(new Set([2, 3])); // open by default
  const [isMobile, setIsMobile] = useState(false);
  const { color } = useTheme();
  const location = useLocation();
  const navRef = useRef(null); // Ref to the nav container for smooth scrolling

  // -----------------------------------------------------------------
  // 1. Detect mobile
  // -----------------------------------------------------------------
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // -----------------------------------------------------------------
  // 2. Toggle submenu
  // -----------------------------------------------------------------
  const toggleSubmenu = (id) => {
    const copy = new Set(expandedItems);
    copy.has(id) ? copy.delete(id) : copy.add(id);
    setExpandedItems(copy);
  };

  // -----------------------------------------------------------------
  // 3. isActive – CORRECT LOGIC
  // -----------------------------------------------------------------
  const isActive = (path, itemId) => {
    const currentPath = location.pathname;

    // Top-level item: active if exact match OR any child is active
    if (itemId !== undefined) {
      const item = menuItems.find(i => i.id === itemId);
      const exactMatch = currentPath === path;
      const childActive = item?.submenu?.some(sub => currentPath.startsWith(sub.path));
      return exactMatch || childActive;
    }

    // Submenu item: active if URL starts with its path
    return currentPath.startsWith(path);
  };

  // -----------------------------------------------------------------
  // 4. Theme gradient
  // -----------------------------------------------------------------
  const colorClass = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    orange: 'from-orange-500 to-orange-600',
  }[color];

  // -----------------------------------------------------------------
  // 5. Animations
  // -----------------------------------------------------------------
  const sidebarVariants = {
    expanded: { width: 280, transition: { duration: 0.3, ease: 'easeInOut' } },
    collapsed: { width: 80, transition: { duration: 0.3, ease: 'easeInOut' } },
  };

  const mobileVariants = {
    open: { x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    closed: { x: '-100%', transition: { duration: 0.3, ease: 'easeIn' } },
  };

  const submenuVariants = {
    open: { height: 'auto', opacity: 1, transition: { height: { duration: 0.3 } } },
    closed: { height: 0, opacity: 0, transition: { height: { duration: 0.3 } } },
  };

  // -----------------------------------------------------------------
  // 6. Submenu Item
  // -----------------------------------------------------------------
  const SubItem = ({ sub }) => {
    const active = isActive(sub.path);
    return (
      <motion.div
        key={sub.id}
        className={`group relative rounded-lg transition-all duration-200 ${
          active
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent'
        } border`}
      >
        <Link
          to={sub.path}
          onClick={() => isMobile && onMobileClose?.()}
          className="w-full text-left p-3 rounded-lg flex items-center justify-between"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span
                className={`font-medium text-sm ${
                  active
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {sub.title}
              </span>
              {sub.badge && (
                <span className="px-2 py-1 text-xs rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium">
                  {sub.badge}
                </span>
              )}
            </div>
            {sub.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                {sub.description}
              </p>
            )}
          </div>
        </Link>

        {active && (
          <motion.div
            layoutId="activeSubItem"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full"
          />
        )}
      </motion.div>
    );
  };

  // -----------------------------------------------------------------
  // 7. Render submenu
  // -----------------------------------------------------------------
  const renderSubmenu = (items, parentId) => (
    <AnimatePresence>
      {expandedItems.has(parentId) && (
        <motion.div
          variants={submenuVariants}
          initial="closed"
          animate="open"
          exit="closed"
          className="overflow-hidden"
        >
          <div className="ml-6 pl-3 border-l-2 border-gray-200 dark:border-gray-700 space-y-1 py-2">
            {items.map((sub) => (
              <SubItem key={sub.id} sub={sub} />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // -----------------------------------------------------------------
  // 8. Top-level Item
  // -----------------------------------------------------------------
  const TopItem = ({ item }) => {
    const hasSub = !!item.submenu;
    const active = isActive(item.path, item.id); // pass item.id
    const expanded = expandedItems.has(item.id);

    return (
      <div className="px-3">
        {hasSub ? (
          /* Parent with submenu – only toggle, no direct nav */
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`group relative rounded-xl transition-all duration-200 ${
              active
                ? `bg-gradient-to-r ${colorClass} shadow-lg shadow-blue-500/25`
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <button
              onClick={() => toggleSubmenu(item.id)}
              className={`w-full p-3 rounded-xl flex items-center justify-between transition-all duration-200 ${
                isCollapsed && !isMobile ? 'justify-center' : ''
              }`}
            >
              <div
                className={`flex items-center ${
                  isCollapsed && !isMobile ? 'justify-center' : 'space-x-3'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
                  }`}
                >
                  <IconMapper
                    name={item.icon}
                    size={20}
                    className={active ? 'text-white' : ''}
                  />
                </div>

                {(!isCollapsed || isMobile) && (
                  <span
                    className={`font-medium ${
                      active ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                    } text-left`}
                  >
                    {item.title}
                  </span>
                )}
              </div>

              {(!isCollapsed || isMobile) && (
                <div className="flex items-center space-x-2">
                  {item.badge && (
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  <motion.div
                    animate={{ rotate: expanded ? 0 : -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <IconMapper
                      name="ChevronDown"
                      size={16}
                      className={active ? 'text-white' : 'text-gray-400 dark:text-gray-500'}
                    />
                  </motion.div>
                </div>
              )}
            </button>
          </motion.div>
        ) : (
          /* Direct navigation – no submenu */
          <Link to={item.path} onClick={() => isMobile && onMobileClose?.()}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`group relative rounded-xl transition-all duration-200 ${
                active
                  ? `bg-gradient-to-r ${colorClass} shadow-lg shadow-blue-500/25`
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <div
                className={`w-full p-3 rounded-xl flex items-center justify-between transition-all duration-200 ${
                  isCollapsed && !isMobile ? 'justify-center' : ''
                }`}
              >
                <div
                  className={`flex items-center ${
                    isCollapsed && !isMobile ? 'justify-center' : 'space-x-3'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
                    }`}
                  >
                    <IconMapper
                      name={item.icon}
                      size={20}
                      className={active ? 'text-white' : ''}
                    />
                  </div>

                  {(!isCollapsed || isMobile) && (
                    <span
                      className={`font-medium ${
                        active ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                      } text-left`}
                    >
                      {item.title}
                    </span>
                  )}
                </div>

                {(!isCollapsed || isMobile) && item.badge && (
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              {active && (
                <motion.div
                  layoutId="activeItem"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full"
                />
              )}
            </motion.div>
          </Link>
        )}

        {/* Submenu */}
        {hasSub && (!isCollapsed || isMobile) && renderSubmenu(item.submenu, item.id)}
      </div>
    );
  };

  // -----------------------------------------------------------------
  // 9. Render all menu items
  // -----------------------------------------------------------------
  const renderMenuItems = () => (
    <div className="space-y-1 py-4">
      {menuItems.map((item) => (
        <TopItem key={item.id} item={item} />
      ))}
    </div>
  );

  // -----------------------------------------------------------------
  // 10. MOBILE DRAWER
  // -----------------------------------------------------------------
  if (isMobile) {
    return (
      <>
        <button
          onClick={onToggle}
          className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <IconMapper name="Menu" size={20} className="text-gray-600 dark:text-gray-400" />
        </button>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              variants={mobileVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-900 shadow-xl border-r border-gray-200 dark:border-gray-800 flex flex-col"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 bg-gradient-to-r ${colorClass} rounded-xl flex items-center justify-center`}
                    >
                      <span className="text-white font-bold text-lg">M</span>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        Mystrix
                      </h1>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Hybrid Alpha
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onMobileClose}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <IconMapper name="X" size={20} className="text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto" ref={navRef}>{renderMenuItems()}</nav>

              <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">JD</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      John Doe
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Administrator
                    </p>
                  </div>
                  <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <IconMapper name="LogOut" size={16} className="text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // -----------------------------------------------------------------
  // 11. DESKTOP SIDEBAR
  // -----------------------------------------------------------------
  return (
    <motion.div
      variants={sidebarVariants}
      initial={false}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      className="hidden md:flex flex-col h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 sticky top-0 z-30"
    >
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          {!isCollapsed ? (
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 bg-gradient-to-r ${colorClass} rounded-xl flex items-center justify-center`}
              >
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Mystrix
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Hybrid Alpha
                </p>
              </div>
            </div>
          ) : (
            <div
              className={`w-10 h-10 bg-gradient-to-r ${colorClass} rounded-xl flex items-center justify-center mx-auto`}
            >
              <span className="text-white font-bold text-lg">M</span>
            </div>
          )}

          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <IconMapper
                name="ChevronRight"
                size={16}
                className="text-gray-500 dark:text-gray-400"
              />
            </motion.div>
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scroll-smooth" ref={navRef}>
        {renderMenuItems()}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed ? (
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">JD</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  John Doe
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Administrator
                </p>
              </div>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0">
                <IconMapper name="LogOut" size={16} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
              <span className="text-white font-semibold text-sm">JD</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
