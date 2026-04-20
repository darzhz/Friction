import React, { useRef } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { QRScanner } from '../components/QRScanner';
import { Keyboard, Image as ImageIcon } from 'lucide-react';
import { BrowserQRCodeReader } from '@zxing/library';

interface ScanProps {
  onScanSuccess: (raw: string) => void;
}

const Scan: React.FC<ScanProps> = ({ onScanSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const imageFile = e.target.files[0];
      const codeReader = new BrowserQRCodeReader();
      try {
        const imageUrl = URL.createObjectURL(imageFile);
        const result = await codeReader.decodeFromImageUrl(imageUrl);
        URL.revokeObjectURL(imageUrl);
        onScanSuccess(result.getText());
      } catch (err) {
        console.error("Error scanning file", err);
        alert("Could not find a QR code in this image.");
      }
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
        <h2 className="text-4xl font-black uppercase tracking-tighter border-b-4 border-bauhaus-black pb-4">
          Scan QR
        </h2>
        
        <div className="max-w-md mx-auto">
          <QRScanner onScanSuccess={onScanSuccess} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <Card decoration="square" decorationColor="blue">
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <div className="p-4 bg-bauhaus-blue/10 border-2 border-bauhaus-blue border-dashed rounded-full">
                <ImageIcon className="w-8 h-8 text-bauhaus-blue" />
              </div>
              <div>
                <p className="font-bold uppercase tracking-tight">From Gallery</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Select a screenshot or photo</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
              <Button 
                variant="outline" 
                className="w-full text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload Image
              </Button>
            </div>
          </Card>

          <Card decoration="triangle" decorationColor="yellow">
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <div className="p-4 bg-bauhaus-yellow/10 border-2 border-bauhaus-yellow border-dashed rounded-full">
                <Keyboard className="w-8 h-8 text-bauhaus-yellow" />
              </div>
              <div>
                <p className="font-bold uppercase tracking-tight">Manual Entry</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">If scanning fails completely</p>
              </div>
              <Button 
                variant="outline" 
                className="w-full text-xs"
                onClick={() => onScanSuccess('upi://pay')}
              >
                Quick Bypass
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Scan;
