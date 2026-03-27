import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Zap, Wallet, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function WalletConnect() {
  const { role, API, updateUser, isAuthenticated, user, authLoading } = useContext(AppContext);
  const navigate = useNavigate();
  const [connecting, setConnecting] = useState(false);
  const [step, setStep] = useState(0);

  const steps = [
    'Initializing secure connection...',
    'Generating wallet keypair...',
    'Registering on VoltNet grid...',
    'Connection established!',
  ];

  if (!authLoading && !isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handleConnect = async () => {
    if (!role) {
      navigate('/select-role');
      return;
    }

    setConnecting(true);
    setStep(0);

    for (let i = 0; i < steps.length - 1; i++) {
      await new Promise((r) => setTimeout(r, 700));
      setStep(i + 1);
    }

    try {
      const res = await axios.post(`${API}/wallet/connect`, { role });
      await new Promise((r) => setTimeout(r, 500));
      setStep(3);
      updateUser(res.data);
      toast.success('Wallet connected successfully!');
      await new Promise((r) => setTimeout(r, 600));
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to connect wallet. Please try again.');
      setConnecting(false);
      setStep(0);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative" style={{ backgroundColor: '#030407' }}>
      <div className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: 'url(https://images.pexels.com/photos/7562085/pexels-photo-7562085.jpeg?auto=compress&w=1920)' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#030407] via-[#030407]/80 to-[#030407]" />

      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-[#00FF66]" />
          <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>VoltNet</span>
        </div>
        <Button data-testid="back-to-role-btn" variant="ghost" className="text-[#8A99A8] hover:text-white" onClick={() => navigate('/select-role')}>
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 pb-16 relative z-10">
        <div className="max-w-md w-full animate-fade-in">
          <div className="text-center mb-8">
            <p className="text-xs font-mono-data uppercase tracking-[0.2em] text-[#00F0FF] mb-4">Step 3</p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Connect Wallet
            </h1>
            <p className="text-[#8A99A8] text-sm">
              Hi <span className="text-white font-medium">{user?.name}</span>, connecting as{' '}
              <span className="text-[#00FF66] font-semibold capitalize">{role || 'user'}</span>
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-8">
            <div className="flex justify-center mb-8">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${connecting ? 'animate-pulse-glow' : ''}`}
                style={{ backgroundColor: 'rgba(0, 255, 102, 0.08)', border: '1px solid rgba(0, 255, 102, 0.2)' }}>
                <Wallet className="w-10 h-10 text-[#00FF66]" />
              </div>
            </div>

            {connecting && (
              <div className="terminal-card rounded-lg p-4 mb-6 font-mono-data text-xs space-y-2">
                {steps.map((s, i) => (
                  <div key={i} className={`flex items-center gap-2 transition-opacity duration-300 ${i <= step ? 'opacity-100' : 'opacity-20'}`}>
                    {i < step ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF66] flex-shrink-0" />
                    ) : i === step ? (
                      <Loader2 className="w-3.5 h-3.5 text-[#00F0FF] animate-spin flex-shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-[#4B5563] flex-shrink-0" />
                    )}
                    <span className={i < step ? 'text-[#00FF66]' : i === step ? 'text-[#00F0FF]' : 'text-[#4B5563]'}>{s}</span>
                  </div>
                ))}
              </div>
            )}

            <Button data-testid="connect-wallet-btn" onClick={handleConnect} disabled={connecting}
              className="w-full btn-neon-green rounded-xl h-12 text-base disabled:opacity-50">
              {connecting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Connecting...</> : <><Wallet className="w-4 h-4 mr-2" />Connect Wallet</>}
            </Button>
            <p className="text-center text-xs text-[#4B5563] mt-4">A simulated wallet ID will be generated for you</p>
          </div>
        </div>
      </div>
    </div>
  );
}
