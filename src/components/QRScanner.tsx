import React, { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/library';
import { Button } from './Button';
import { motion, AnimatePresence } from 'framer-motion';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onScanFailure }) => {
  const onScanSuccessRef = useRef(onScanSuccess);
  const onScanFailureRef = useRef(onScanFailure);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
    onScanFailureRef.current = onScanFailure;
  }, [onScanSuccess, onScanFailure]);

  const startScanner = async () => {
    setError(null);
    setIsScanning(true);

    try {
      const codeReader = new BrowserQRCodeReader();
      codeReaderRef.current = codeReader;
      
      // Use null for default device selection
      await codeReader.decodeFromVideoDevice(
        null, 
        videoRef.current!,
        (result, err) => {
          if (result) {
            console.log("ZXing detected:", result.getText());
            // Stop scanning on success
            codeReader.reset();
            setIsScanning(false);
            onScanSuccessRef.current(result.getText());
          }
          if (err && onScanFailureRef.current) {
            // Failure occurs on every frame where no QR is found
            if (err.name !== 'NotFoundException') {
              console.warn("ZXing scan error:", err);
            }
          }
        }
      );
    } catch (err) {
      console.error("Unable to start ZXing scanner", err);
      setError("Camera access failed. Check permissions.");
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  return (
    <div className="bauhaus-border bg-bauhaus-black overflow-hidden relative aspect-square flex flex-col items-center justify-center">
      {/* ZXing needs a raw video element */}
      <video 
        ref={videoRef} 
        className={`w-full h-full object-cover ${!isScanning ? 'hidden' : ''}`}
      />
      
      <AnimatePresence>
        {!isScanning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-8 text-center space-y-4 z-10"
          >
            {error ? (
              <p className="text-bauhaus-red font-black uppercase tracking-tighter text-sm mb-4">{error}</p>
            ) : (
              <p className="text-white font-black uppercase tracking-widest text-xs opacity-60 italic">Lens ready</p>
            )}
            <Button variant="yellow" onClick={startScanner} className="w-48 h-16 text-xl">
              {error ? 'Retry' : 'Start Scan'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isScanning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
          >
            {/* Custom Bauhaus Overlay */}
            <div className="w-[70%] h-[70%] border-4 border-bauhaus-red/40 border-dashed relative overflow-hidden">
              <motion.div 
                animate={{ y: ['0%', '100%'] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="absolute top-0 left-0 w-full h-1 bg-bauhaus-red shadow-[0_0_15px_rgba(255,0,0,0.8)]"
              />
            </div>
            
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="absolute top-4 left-4 text-[10px] font-black uppercase text-white tracking-[0.2em] bg-bauhaus-red px-2 py-1 shadow-bauhaus-sm"
            >
              Live Feed
            </motion.div>
            
            <button 
              onClick={stopScanner}
              className="absolute bottom-4 pointer-events-auto bg-white border-2 border-bauhaus-black px-4 py-1 font-black uppercase text-[10px] tracking-widest active:translate-y-1 transition-all"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
