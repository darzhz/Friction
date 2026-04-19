import React, { useState, useEffect } from 'react';
import { Circle, Square as SquareIcon, Triangle } from 'lucide-react';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Bauhaus-style mechanical entrance
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Wait for exit animation
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 bg-bauhaus-white z-[9999] flex items-center justify-center transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="flex flex-col items-center gap-8">
        <div className="flex space-x-2 animate-bounce">
          <Circle className="w-12 h-12 fill-bauhaus-red stroke-bauhaus-black stroke-[3px]" />
          <SquareIcon className="w-12 h-12 fill-bauhaus-blue stroke-bauhaus-black stroke-[3px]" />
          <Triangle className="w-12 h-12 fill-bauhaus-yellow stroke-bauhaus-black stroke-[3px]" />
        </div>
        <h1 className="text-6xl font-black uppercase tracking-tighter animate-pulse">Friction</h1>
        <div className="w-32 h-2 border-2 border-bauhaus-black bg-bauhaus-muted">
          <div className="h-full bg-bauhaus-red animate-[progress_1.5s_ease-in-out_infinite]" />
        </div>
      </div>

      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 100%; }
          100% { width: 0%; }
        }
      `}</style>
    </div>
  );
};
