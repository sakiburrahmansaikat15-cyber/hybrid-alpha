// components/Layout/Layout.jsx
import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024; // Better breakpoint for complex ERPs
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setMobileSidebarOpen(false);
        setIsSidebarOpen(true);
      }
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileSidebarOpen(!mobileSidebarOpen);
    } else {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  // Layout constants
  const sidebarWidth = isSidebarOpen ? 280 : 84;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#020617] transition-colors duration-500 overflow-hidden">
      {/* Sidebar - Desktop & Mobile */}
      <Sidebar
        isCollapsed={!isSidebarOpen}
        onToggle={toggleSidebar}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
      />

      {/* Main Content Area */}
      <motion.div
        animate={{
          paddingLeft: isMobile ? 0 : sidebarWidth,
          transition: { type: 'spring', damping: 25, stiffness: 120 }
        }}
        className="flex-1 flex flex-col min-w-0 h-screen"
      >
        {/* Header */}
        <Header
          onMenuToggle={toggleSidebar}
          isSidebarOpen={isMobile ? mobileSidebarOpen : isSidebarOpen}
        />

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              key={location.pathname} // Re-animate on route change
            >
              <Outlet />
            </motion.div>
          </div>

          {/* Subtle Ambient Glows */}
          <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary-500/5 blur-[120px] pointer-events-none z-0"></div>
          <div className="fixed bottom-[-10%] left-[10%] w-[30%] h-[30%] bg-indigo-500/5 blur-[100px] pointer-events-none z-0"></div>
        </main>
      </motion.div>
    </div>
  );
};

export default Layout;