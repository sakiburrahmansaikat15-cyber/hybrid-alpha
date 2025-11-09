// components/Layout/Layout.jsx
import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
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

  const contentVariants = {
    expanded: { width: "calc(100% - 280px)", marginLeft: "280px", transition: { duration: 0.3, ease: "easeInOut" } },
    collapsed: { width: "calc(100% - 80px)", marginLeft: "80px", transition: { duration: 0.3, ease: "easeInOut" } },
    mobile: { width: "100%", marginLeft: "0px", transition: { duration: 0.3, ease: "easeInOut" } }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {!isMobile && (
        <div className="fixed left-0 top-0 h-screen z-30">
          <Sidebar isCollapsed={!isSidebarOpen} onToggle={toggleSidebar} mobileOpen={mobileSidebarOpen} onMobileClose={closeMobileSidebar} />
        </div>
      )}
      {isMobile && <Sidebar isCollapsed={false} onToggle={toggleSidebar} mobileOpen={mobileSidebarOpen} onMobileClose={closeMobileSidebar} />}
      <AnimatePresence>
        {isMobile && mobileSidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeMobileSidebar} className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" />
        )}
      </AnimatePresence>
      <motion.div variants={contentVariants} initial={false} animate={isMobile ? "mobile" : isSidebarOpen ? "expanded" : "collapsed"} className="flex-1 flex flex-col min-w-0 relative z-10">
        <div className="sticky top-0 z-20 w-full">
          <Header onMenuToggle={toggleSidebar} isSidebarOpen={isMobile ? mobileSidebarOpen : isSidebarOpen} />
        </div>
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 lg:p-6 max-w-8xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <Outlet />
            </motion.div>
          </div>
        </main>
      </motion.div>
    </div>
  );
};

export default Layout;