import { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '@/context/AppContext';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Wallet, Zap, ShoppingCart, Activity,
  TrendingUp, Send, AlertCircle, CheckCircle2, Info, MapPin
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Area, AreaChart
} from 'recharts';

const chartTooltipStyle = {
  backgroundColor: 'rgba(10, 14, 23, 0.95)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '8px',
  fontSize: '12px',
  fontFamily: "'JetBrains Mono', monospace",
};

const formatINR = (val) => {
  if (val == null || isNaN(val)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
};

export default function Dashboard() {
  const { user, API, isAuthenticated, hasWallet, updateUser, authLoading } = useContext(AppContext);
  const navigate = useNavigate();
  const fetchedRef = useRef(false);

  const [stats, setStats] = useState(null);
  const [prices, setPrices] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [energyInput, setEnergyInput] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.wallet_id) return;
    try {
      const [statsRes, pricesRes, txRes, ordersRes, notifRes, walletRes] = await Promise.all([
        axios.get(`${API}/market/stats`),
        axios.get(`${API}/market/prices`),
        axios.get(`${API}/transactions?wallet_id=${user.wallet_id}`),
        axios.get(`${API}/orders/user/${user.wallet_id}`),
        axios.get(`${API}/notifications/${user.wallet_id}`),
        axios.get(`${API}/wallet/${user.wallet_id}`),
      ]);
      setStats(statsRes.data);
      setPrices(pricesRes.data.map((p, i) => ({ ...p, index: i + 1, label: `#${i + 1}` })));
      setTransactions(txRes.data);
      setOrders(ordersRes.data);
      setNotifications(notifRes.data);
      if (walletRes.data) {
        updateUser(walletRes.data);
      }
    } catch (e) {
      console.error('Fetch error:', e);
    }
  }, [user?.wallet_id, API, updateUser]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!hasWallet) { navigate('/select-role'); return; }
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchData();
    }
  }, [authLoading, isAuthenticated, hasWallet, navigate, fetchData]);

  const handleSubmitOrder = async () => {
    const energy = parseFloat(energyInput);
    const price = parseFloat(priceInput);
    if (!energy || energy <= 0 || !price || price <= 0) {
      toast.error('Please enter valid energy and price values');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/orders`, {
        wallet_id: user.wallet_id,
        type: user.role === 'buyer' ? 'buy' : 'sell',
        energy_kwh: energy,
        price_per_kwh: price,
      });
      toast.success(user.role === 'buyer' ? 'Buy order placed!' : 'Energy listed!');
      setEnergyInput('');
      setPriceInput('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      await axios.delete(`${API}/orders/${orderId}`);
      toast.success('Order cancelled');
      fetchData();
    } catch { toast.error('Failed to cancel order'); }
  };

  if (authLoading || !user) return null;

  const isBuyer = user.role === 'buyer';
  const activeOrders = orders.filter((o) => ['active', 'partially_filled'].includes(o.status));
  const supplyDemandData = stats ? [
    { name: 'Supply', value: stats.total_supply, fill: '#00FF66' },
    { name: 'Demand', value: stats.total_demand, fill: '#00F0FF' },
  ] : [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#030407' }}>
      <Header />
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 animate-fade-in">
        {/* Welcome */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }} data-testid="welcome-message">
              Welcome, {user.name}
            </h1>
            {user.address && (
              <p className="text-xs text-[#4B5563] flex items-center gap-1 mt-1" data-testid="user-address">
                <MapPin className="w-3 h-3" /> {user.address}
              </p>
            )}
          </div>
          <Badge className={`w-fit text-xs font-mono-data px-3 py-1 ${isBuyer ? 'bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/20' : 'bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/20'}`}>
            {user.role?.toUpperCase()} MODE
          </Badge>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-6 space-y-2">
            {notifications.slice(0, 2).map((n, i) => (
              <div key={i} data-testid={`notification-${i}`} className="glass-panel rounded-lg px-4 py-3 flex items-center gap-3 text-sm">
                {n.type === 'warning' ? <AlertCircle className="w-4 h-4 text-[#FFB800] flex-shrink-0" /> : n.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-[#00FF66] flex-shrink-0" /> : <Info className="w-4 h-4 text-[#00F0FF] flex-shrink-0" />}
                <span className="text-[#8A99A8]">{n.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger-children">
          <Card className="glass-panel border-white/5 card-hover animate-slide-up" data-testid="token-balance">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono-data uppercase tracking-wider text-[#8A99A8]">Balance</p>
                  <p className="text-lg lg:text-xl font-mono-data mt-1 text-white">{formatINR(user.token_balance)}</p>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 255, 102, 0.08)' }}>
                  <Wallet className="w-5 h-5 text-[#00FF66]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/5 card-hover animate-slide-up" data-testid="energy-balance">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono-data uppercase tracking-wider text-[#8A99A8]">Energy</p>
                  <p className="text-lg lg:text-xl font-mono-data mt-1 text-white">{(user.energy_balance || 0).toFixed(2)} <span className="text-xs text-[#8A99A8]">kWh</span></p>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 240, 255, 0.08)' }}>
                  <Zap className="w-5 h-5 text-[#00F0FF]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/5 card-hover animate-slide-up" data-testid="active-orders">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono-data uppercase tracking-wider text-[#8A99A8]">Active Orders</p>
                  <p className="text-xl lg:text-2xl font-mono-data mt-1 text-white">{activeOrders.length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 184, 0, 0.08)' }}>
                  <ShoppingCart className="w-5 h-5 text-[#FFB800]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/5 card-hover animate-slide-up" data-testid="total-trades">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono-data uppercase tracking-wider text-[#8A99A8]">My Trades</p>
                  <p className="text-xl lg:text-2xl font-mono-data mt-1 text-white">{transactions.length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 240, 255, 0.08)' }}>
                  <Activity className="w-5 h-5 text-[#00F0FF]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts + Order Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="glass-panel border-white/5 lg:col-span-2" data-testid="price-trend-chart">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono-data uppercase tracking-wider text-[#8A99A8] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#00F0FF]" />
                Price Trends (₹/kWh)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {prices.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={prices}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00F0FF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="label" tick={{ fill: '#4B5563', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
                    <YAxis tick={{ fill: '#4B5563', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`₹${v}`, 'Price']} />
                    <Area type="monotone" dataKey="price" stroke="#00F0FF" strokeWidth={2} fill="url(#priceGradient)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-[#4B5563] text-sm">No price data yet. Place orders to see trends.</div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/5" data-testid="order-form">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono-data uppercase tracking-wider text-[#8A99A8] flex items-center gap-2">
                {isBuyer ? <ShoppingCart className="w-4 h-4 text-[#00F0FF]" /> : <Zap className="w-4 h-4 text-[#00FF66]" />}
                {isBuyer ? 'Place Buy Order' : 'List Energy'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs text-[#8A99A8] block mb-1.5">{isBuyer ? 'Energy Required (kWh)' : 'Energy Available (kWh)'}</label>
                <Input data-testid="energy-input" type="number" placeholder="e.g. 25" value={energyInput} onChange={(e) => setEnergyInput(e.target.value)} className="bg-[#080B12] border-white/10 text-white font-mono-data focus:border-[#00FF66]/50 focus:ring-[#00FF66]/20" />
              </div>
              <div>
                <label className="text-xs text-[#8A99A8] block mb-1.5">{isBuyer ? 'Max Bid Price (₹/kWh)' : 'Min Price (₹/kWh)'}</label>
                <Input data-testid="price-input" type="number" step="0.5" placeholder="e.g. 8" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} className="bg-[#080B12] border-white/10 text-white font-mono-data focus:border-[#00FF66]/50 focus:ring-[#00FF66]/20" />
                {stats && stats.suggested_bid_price > 0 && isBuyer && (
                  <p className="text-xs text-[#00FF66]/70 mt-1 font-mono-data">Suggested: ₹{stats.suggested_bid_price}/kWh</p>
                )}
              </div>
              <Button data-testid={isBuyer ? 'place-buy-order-btn' : 'list-energy-btn'} onClick={handleSubmitOrder} disabled={submitting}
                className={`w-full rounded-xl h-11 ${isBuyer ? 'bg-[#00F0FF] text-black hover:bg-[#00D4E0] hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]' : 'btn-neon-green'} transition-all duration-300`}>
                <Send className="w-4 h-4 mr-2" />
                {submitting ? 'Processing...' : isBuyer ? 'Place Buy Order' : 'List Energy'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Supply/Demand + Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="glass-panel border-white/5" data-testid="supply-demand-chart">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono-data uppercase tracking-wider text-[#8A99A8] flex items-center gap-2">
                <BarChart3Icon className="w-4 h-4 text-[#FFB800]" />
                Supply vs Demand
              </CardTitle>
            </CardHeader>
            <CardContent>
              {supplyDemandData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={supplyDemandData} barSize={48}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="name" tick={{ fill: '#8A99A8', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
                    <YAxis tick={{ fill: '#4B5563', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-[#4B5563] text-sm">No supply/demand data yet.</div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/5" data-testid="recent-transactions">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono-data uppercase tracking-wider text-[#8A99A8] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#00F0FF]" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                {transactions.length > 0 ? (
                  <div className="space-y-2">
                    {transactions.slice(0, 10).map((tx) => {
                      const isBought = tx.buyer_wallet === user.wallet_id;
                      return (
                        <div key={tx.id} className="terminal-card rounded-lg p-3 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${isBought ? 'bg-[#00F0FF]' : 'bg-[#00FF66]'}`} />
                            <div>
                              <span className="text-white font-medium">{isBought ? 'Bought' : 'Sold'}</span>
                              <span className="text-[#8A99A8] ml-2">{tx.energy_kwh} kWh</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono-data text-white">₹{tx.price_per_kwh}/kWh</span>
                            <p className="text-[#4B5563] font-mono-data text-[10px]">Block #{tx.block_index}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-[#4B5563] text-sm">No transactions yet.</div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <Card className="glass-panel border-white/5" data-testid="active-orders-list">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono-data uppercase tracking-wider text-[#8A99A8] flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#FFB800]" />
                Your Active Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activeOrders.map((order) => (
                  <div key={order.id} className="terminal-card rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={`text-[10px] font-mono-data ${order.type === 'buy' ? 'bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/20' : 'bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/20'}`}>
                        {order.type.toUpperCase()}
                      </Badge>
                      <div className="text-xs">
                        <span className="text-white">{order.remaining_kwh}/{order.energy_kwh} kWh</span>
                        <span className="text-[#8A99A8] ml-2">@ ₹{order.price_per_kwh}/kWh</span>
                      </div>
                    </div>
                    <Button data-testid={`cancel-order-${order.id}`} variant="ghost" size="sm" className="text-[#FF3366] hover:text-[#FF3366] hover:bg-[#FF3366]/10 text-xs h-7" onClick={() => handleCancelOrder(order.id)}>Cancel</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function BarChart3Icon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
    </svg>
  );
}
