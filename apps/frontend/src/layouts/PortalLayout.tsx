import { useState, type FC } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { motion } from 'framer-motion';

export const PortalLayout: FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg font-sans">
      <Sidebar 
        isOpen={mobileSidebarOpen} 
        onClose={() => setMobileSidebarOpen(false)} 
      />
      
      <div className="flex flex-1 flex-col overflow-hidden relative min-w-0">
        <Header onMenuToggle={() => setMobileSidebarOpen(prev => !prev)} />
        
        <main className="flex-1 overflow-y-auto bg-bg p-4 sm:p-6 md:p-8 relative selection:bg-accent/30">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-0 left-1/4 -translate-y-1/2 w-[650px] h-[350px] bg-accent/4 blur-[140px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-10 w-[500px] h-[300px] bg-indigo-500/3 blur-[160px] rounded-full pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="h-full w-full max-w-7xl mx-auto relative z-10"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;
