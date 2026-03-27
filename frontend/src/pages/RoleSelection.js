import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '@/context/AppContext';
import { ShoppingCart, Sun, Zap, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RoleSelection() {
  const { selectRole, isAuthenticated, hasWallet, authLoading, user } = useContext(AppContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { navigate('/login'); return; }
    if (hasWallet) { navigate('/dashboard'); return; }
  }, [authLoading, isAuthenticated, hasWallet, navigate]);

  const handleSelect = (role) => {
    selectRole(role);
    navigate('/connect-wallet');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#030407' }}>
      <nav className="flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-[#00FF66]" />
          <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>VoltNet</span>
        </div>
        <Button data-testid="back-to-home-btn" variant="ghost" className="text-[#8A99A8] hover:text-white" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="max-w-3xl w-full animate-fade-in">
          <div className="text-center mb-12">
            <p className="text-xs font-mono-data uppercase tracking-[0.2em] text-[#00F0FF] mb-4">Step 2</p>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Choose Your Role
            </h1>
            <p className="text-[#8A99A8] text-base">Are you looking to buy energy or sell your surplus?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Buyer Card */}
            <button
              data-testid="buyer-card"
              onClick={() => handleSelect('buyer')}
              className="glass-panel rounded-2xl p-8 text-left card-hover group cursor-pointer transition-all duration-300 hover:border-[#00F0FF]/40 hover:shadow-[0_0_30px_rgba(0,240,255,0.1)]"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#00F0FF]/10 flex items-center justify-center mb-6 group-hover:bg-[#00F0FF]/20 transition-colors duration-300">
                <ShoppingCart className="w-8 h-8 text-[#00F0FF]" />
              </div>
              <h2
                className="text-2xl font-bold mb-3 text-white"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Energy Buyer
              </h2>
              <p className="text-sm text-[#8A99A8] leading-relaxed mb-6">
                Purchase clean, locally produced solar energy at competitive prices through smart bidding.
              </p>
              <div className="flex items-center gap-2 text-[#00F0FF] text-sm font-medium">
                <span>Select Buyer</span>
                <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </button>

            {/* Seller Card */}
            <button
              data-testid="seller-card"
              onClick={() => handleSelect('seller')}
              className="glass-panel rounded-2xl p-8 text-left card-hover group cursor-pointer transition-all duration-300 hover:border-[#00FF66]/40 hover:shadow-[0_0_30px_rgba(0,255,102,0.1)]"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#00FF66]/10 flex items-center justify-center mb-6 group-hover:bg-[#00FF66]/20 transition-colors duration-300">
                <Sun className="w-8 h-8 text-[#00FF66]" />
              </div>
              <h2
                className="text-2xl font-bold mb-3 text-white"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Energy Seller
              </h2>
              <p className="text-sm text-[#8A99A8] leading-relaxed mb-6">
                Sell your surplus solar energy to nearby households and earn tokens through the marketplace.
              </p>
              <div className="flex items-center gap-2 text-[#00FF66] text-sm font-medium">
                <span>Select Seller</span>
                <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
