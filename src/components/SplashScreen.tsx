import React, { useState, useEffect } from 'react';
import { Circle, Square as SquareIcon, Triangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 600); // Wait for exit animation
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 bg-bauhaus-white z-[9999] flex items-center justify-center"
        >
          <div className="flex flex-col items-center gap-8">
            <div className="flex space-x-4">
              {[
                { Icon: Circle, color: 'fill-bauhaus-red' },
                { Icon: SquareIcon, color: 'fill-bauhaus-blue' },
                { Icon: Triangle, color: 'fill-bauhaus-yellow' }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 260, 
                    damping: 20, 
                    delay: 0.2 + i * 0.15 
                  }}
                >
                  <item.Icon className={`w-16 h-16 ${item.color} stroke-bauhaus-black stroke-[3px]`} />
                </motion.div>
              ))}
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="text-center space-y-4"
            >
              <h1 className="text-7xl font-black uppercase tracking-tighter">Friction</h1>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Awareness is the first step</p>
            </motion.div>

            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: 128 }}
              transition={{ delay: 1, duration: 1, ease: "easeInOut" }}
              className="h-2 border-2 border-bauhaus-black bg-bauhaus-muted overflow-hidden"
            >
              <motion.div 
                animate={{ x: [-128, 128] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="h-full w-full bg-bauhaus-red"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
