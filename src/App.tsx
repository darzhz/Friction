import { useState, useEffect } from 'react';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Scan from './pages/Scan';
import PaymentGate from './pages/PaymentGate';
import { parseUPILink, UPIPayload } from './engine/upiParser';
import { useTransactionStore } from './store/transactionStore';
import { Layout } from './components/Layout';
import { Card } from './components/Card';
import { Button } from './components/Button';
import { SplashScreen } from './components/SplashScreen';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [path, setPath] = useState(window.location.pathname);
  const [activePayload, setActivePayload] = useState<UPIPayload | null>(null);
  const { pendingConfirm, confirmTransaction, discardTransaction, setPendingConfirm } = useTransactionStore();

  useEffect(() => {
    const handleLocationChange = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    
    // Check for pending transaction in session storage on boot
    const saved = sessionStorage.getItem('pending_transaction');
    if (saved && !pendingConfirm) {
      setPendingConfirm(JSON.parse(saved));
    }

    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [pendingConfirm, setPendingConfirm]);

  const navigate = (newPath: string) => {
    window.history.pushState({}, '', newPath);
    window.dispatchEvent(new Event('popstate'));
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // Simple router
  const renderPage = () => {
    if (pendingConfirm) {
      return (
        <Layout>
          <div className="max-w-md mx-auto py-24 px-4">
            <Card title="Verify Payment" decoration="circle" decorationColor="yellow">
              <div className="space-y-6 text-center">
                <p className="uppercase font-bold tracking-widest text-sm">Did your payment of ₹{pendingConfirm.amount} to {pendingConfirm.payee} go through?</p>
                <div className="flex gap-4">
                  <Button 
                    className="flex-1" 
                    variant="primary"
                    onClick={async () => {
                      await confirmTransaction(pendingConfirm.id);
                      navigate('/');
                    }}
                  >
                    Yes, Log it
                  </Button>
                  <Button 
                    className="flex-1" 
                    variant="outline"
                    onClick={async () => {
                      await discardTransaction(pendingConfirm.id);
                      navigate('/');
                    }}
                  >
                    No, Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </Layout>
      );
    }

    if (activePayload) {
      return (
        <PaymentGate 
          payload={activePayload} 
          onCancel={() => setActivePayload(null)} 
          onSuccess={() => {
            setActivePayload(null);
            navigate('/');
          }}
        />
      );
    }

    switch (path) {
      case '/settings':
        return <Settings />;
      case '/scan':
        return <Scan onScanSuccess={(raw) => {
          console.log("Raw scan result:", raw);
          const payload = parseUPILink(raw);
          if (payload) {
            setActivePayload(payload);
          } else {
            console.error("Invalid UPI QR:", raw);
            alert(`Not a valid UPI QR. Detected content: ${raw.slice(0, 50)}${raw.length > 50 ? '...' : ''}`);
          }
        }} />;
      case '/':
      default:
        return <Home onScanRequest={() => navigate('/scan')} />;
    }
  };

  return renderPage();
}

export default App;
