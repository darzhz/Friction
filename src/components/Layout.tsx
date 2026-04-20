import React from 'react';
import { Circle, Square as SquareIcon, Triangle, Home, Scan as ScanIcon, Settings, History } from 'lucide-react';
import { motion } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0 overflow-x-hidden">
      <header className="border-b-4 border-bauhaus-black p-4 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="flex -space-x-1">
              <Circle className="fill-bauhaus-red text-bauhaus-black w-6 h-6" />
              <SquareIcon className="fill-bauhaus-blue text-bauhaus-black w-6 h-6" />
              <Triangle className="fill-bauhaus-yellow text-bauhaus-black w-6 h-6" />
            </div>
            <span className="font-black text-2xl uppercase tracking-tighter ml-2">Friction</span>
          </button>
          <nav className="hidden md:block">
            <ul className="flex gap-6 uppercase font-bold text-sm tracking-widest">
              <li><button onClick={() => navigate('/')} className="hover:text-bauhaus-red">Home</button></li>
              <li><button onClick={() => navigate('/history')} className="hover:text-bauhaus-blue">History</button></li>
              <li><button onClick={() => navigate('/settings')} className="hover:text-bauhaus-yellow">Settings</button></li>
            </ul>
          </nav>
        </div>
      </header>

      <motion.main 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="flex-1 bg-bauhaus-white"
      >
        {children}
      </motion.main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-4 border-bauhaus-black z-50 h-20 flex items-center justify-around px-4">
        <button onClick={() => navigate('/')} className="flex flex-col items-center gap-1 group">
          <Home className="w-6 h-6 group-active:text-bauhaus-red" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
        </button>
        <button onClick={() => navigate('/scan')} className="flex flex-col items-center gap-1 group">
          <motion.div 
            whileTap={{ scale: 0.9, y: 2 }}
            className="bg-bauhaus-red p-3 -mt-10 border-4 border-bauhaus-black shadow-bauhaus-sm active:shadow-none transition-all"
          >
            <ScanIcon className="w-6 h-6 text-white" />
          </motion.div>
          <span className="text-[10px] font-bold uppercase tracking-widest mt-1">Scan</span>
        </button>
        <button onClick={() => navigate('/settings')} className="flex flex-col items-center gap-1 group">
          <Settings className="w-6 h-6 group-active:text-bauhaus-yellow" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Setup</span>
        </button>
      </nav>

      <footer className="hidden md:block bg-bauhaus-black text-white p-8 border-t-4 border-bauhaus-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
             <div className="flex -space-x-1 grayscale brightness-200">
              <Circle className="fill-white text-white w-4 h-4" />
              <SquareIcon className="fill-white text-white w-4 h-4" />
              <Triangle className="fill-white text-white w-4 h-4" />
            </div>
            <span className="font-black text-xl uppercase tracking-tighter">Friction</span>
          </div>
          <p className="text-xs uppercase tracking-widest text-gray-400">
            Form follows function. Discipline follows awareness.
          </p>
        </div>
      </footer>
    </div>
  );
};

