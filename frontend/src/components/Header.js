import { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, LayoutDashboard, Store, Blocks, LogOut, Menu, X, Wallet, User } from 'lucide-react';

export default function Header() {
  const { user, logout } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Marketplace', path: '/marketplace', icon: Store },
    { label: 'Blockchain', path: '/blockchain', icon: Blocks },
  ];

  const truncateWallet = (w) => w ? `${w.slice(0, 6)}...${w.slice(-4)}` : '';

  return (
    <header className="sticky top-0 z-50 glass-panel-solid" data-testid="app-header">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <button className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')} data-testid="header-logo">
          <Zap className="w-6 h-6 text-[#00FF66]" />
          <span className="text-lg font-bold tracking-tight hidden sm:block" style={{ fontFamily: "'Outfit', sans-serif" }}>VoltNet</span>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Button key={item.path} data-testid={`nav-${item.label.toLowerCase()}`} variant="ghost"
                className={`px-4 h-9 text-sm transition-all duration-200 ${isActive ? 'text-[#00FF66] bg-[#00FF66]/5' : 'text-[#8A99A8] hover:text-white hover:bg-white/5'}`}
                onClick={() => navigate(item.path)}>
                <item.icon className="w-4 h-4 mr-2" />{item.label}
              </Button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-[#8A99A8]">
                <User className="w-3.5 h-3.5" />
                <span className="text-white font-medium" data-testid="header-user-name">{user.name}</span>
              </div>
              <Badge className={`text-[10px] font-mono-data px-2 py-0.5 ${
                user.role === 'buyer' ? 'bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/20' : 'bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/20'
              }`}>
                {user.role?.toUpperCase()}
              </Badge>
              <span className="text-[10px] font-mono-data text-[#4B5563]">{truncateWallet(user.wallet_id)}</span>
            </div>
          )}

          <Button data-testid="disconnect-wallet-btn" variant="ghost" size="sm"
            className="text-[#8A99A8] hover:text-[#FF3366] hover:bg-[#FF3366]/5 hidden md:flex" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>

          <Button data-testid="mobile-menu-btn" variant="ghost" size="icon" className="md:hidden text-[#8A99A8]"
            onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden glass-panel border-t border-white/5 px-4 py-3 space-y-1">
          {user && (
            <div className="flex items-center gap-2 px-3 py-2 mb-2">
              <User className="w-4 h-4 text-[#00FF66]" />
              <span className="text-xs text-white font-medium">{user.name}</span>
              <Badge className={`text-[9px] font-mono-data ml-auto ${
                user.role === 'buyer' ? 'bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/20' : 'bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/20'
              }`}>{user.role?.toUpperCase()}</Badge>
            </div>
          )}
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Button key={item.path} variant="ghost"
                className={`w-full justify-start px-3 h-10 text-sm ${isActive ? 'text-[#00FF66] bg-[#00FF66]/5' : 'text-[#8A99A8] hover:text-white'}`}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}>
                <item.icon className="w-4 h-4 mr-3" />{item.label}
              </Button>
            );
          })}
          <Button variant="ghost" className="w-full justify-start px-3 h-10 text-sm text-[#FF3366] hover:bg-[#FF3366]/5" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-3" />Disconnect
          </Button>
        </div>
      )}
    </header>
  );
}
