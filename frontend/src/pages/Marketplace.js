import { useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '@/context/AppContext';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Zap, Activity, Loader2,
  ArrowRightLeft, ShoppingCart, Sun, CheckCircle2
} from 'lucide-react';

export default function Marketplace() {
  const { user, API, isAuthenticated, hasWallet, authLoading } = useContext(AppContext);
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [buyOrders, setBuyOrders] = useState([]);
  const [sellOrders, setSellOrders] = useState([]);
  const [recentTxs, setRecentTxs] = useState([]);
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, buyRes, sellRes, txRes] = await Promise.all([
        axios.get(`${API}/market/stats`),
        axios.get(`${API}/orders?status=active&type=buy`),
        axios.get(`${API}/orders?status=active&type=sell`),
        axios.get(`${API}/transactions`),
      ]);
      setStats(statsRes.data);
      setBuyOrders(buyRes.data);
      setSellOrders(sellRes.data);
      setRecentTxs(txRes.data);
    } catch (e) {
      console.error('Fetch error:', e);
    }
  }, [API]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!hasWallet) { navigate('/select-role'); return; }
    fetchData();
  }, [authLoading, isAuthenticated, hasWallet, navigate, fetchData]);

  const handleMatch = async () => {
    setMatching(true);
    setMatchResult(null);
    try {
      const res = await axios.post(`${API}/match`);
      setMatchResult(res.data);
      if (res.data.matched > 0) {
        toast.success(`${res.data.matched} trade(s) matched successfully!`);
      } else {
        toast.info('No matching trades found. Bids may be lower than asks.');
      }
      fetchData();
    } catch (err) {
      toast.error('Matching failed');
    } finally {
      setMatching(false);
    }
  };

  if (authLoading || !user) return null;

  const truncateWallet = (w) => w ? `${w.slice(0, 6)}...${w.slice(-4)}` : '';

  const efficiencyColor = stats?.market_efficiency > 70 ? '#00FF66' : stats?.market_efficiency > 40 ? '#FFB800' : '#FF3366';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#030407' }}>
      <Header />
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 animate-fade-in">
        {/* Market Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6 stagger-children">
          <Card className="glass-panel border-white/5 card-hover animate-slide-up" data-testid="market-efficiency-score">
            <CardContent className="p-4 text-center">
              <p className="text-xs font-mono-data uppercase tracking-wider text-[#8A99A8] mb-2">Efficiency</p>
              <p className="text-3xl font-mono-data font-bold" style={{ color: efficiencyColor }}>{stats?.market_efficiency || 0}%</p>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/5 card-hover animate-slide-up">
            <CardContent className="p-4 text-center">
              <p className="text-xs font-mono-data uppercase tracking-wider text-[#8A99A8] mb-2">Avg Price</p>
              <p className="text-2xl font-mono-data text-white">₹{stats?.avg_price || '0.00'}</p>
              <p className="text-[10px] text-[#4B5563]">per kWh</p>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/5 card-hover animate-slide-up">
            <CardContent className="p-4 text-center">
              <p className="text-xs font-mono-data uppercase tracking-wider text-[#8A99A8] mb-2">Supply</p>
              <p className="text-2xl font-mono-data text-[#00FF66]">{stats?.total_supply || 0}</p>
              <p className="text-[10px] text-[#4B5563]">kWh listed</p>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/5 card-hover animate-slide-up">
            <CardContent className="p-4 text-center">
              <p className="text-xs font-mono-data uppercase tracking-wider text-[#8A99A8] mb-2">Demand</p>
              <p className="text-2xl font-mono-data text-[#00F0FF]">{stats?.total_demand || 0}</p>
              <p className="text-[10px] text-[#4B5563]">kWh requested</p>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/5 card-hover animate-slide-up col-span-2 lg:col-span-1">
            <CardContent className="p-4 text-center">
              <p className="text-xs font-mono-data uppercase tracking-wider text-[#8A99A8] mb-2">Total Traded</p>
              <p className="text-2xl font-mono-data text-white">{stats?.total_energy_traded || 0}</p>
              <p className="text-[10px] text-[#4B5563]">kWh exchanged</p>
            </CardContent>
          </Card>
        </div>

        {/* Match Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>Order Book</h2>
            <p className="text-xs text-[#4B5563]">{buyOrders.length} buy | {sellOrders.length} sell</p>
          </div>
          <Button data-testid="run-matching-btn" onClick={handleMatch} disabled={matching} className="btn-neon-green rounded-xl px-6 h-10">
            {matching ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Matching...</> : <><ArrowRightLeft className="w-4 h-4 mr-2" />Run Matching Engine</>}
          </Button>
        </div>

        {/* Match Result */}
        {matchResult && (
          <div className={`glass-panel rounded-xl p-4 mb-6 border ${matchResult.matched > 0 ? 'border-[#00FF66]/30' : 'border-white/10'}`} data-testid="match-result">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className={`w-4 h-4 ${matchResult.matched > 0 ? 'text-[#00FF66]' : 'text-[#8A99A8]'}`} />
              <span className="text-sm font-medium text-white">{matchResult.matched > 0 ? `${matchResult.matched} trade(s) executed` : 'No matches found'}</span>
            </div>
            {matchResult.transactions?.slice(0, 3).map((tx, i) => (
              <div key={i} className="terminal-card rounded-lg p-3 mt-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[#8A99A8]">{truncateWallet(tx.buyer_wallet)}</span>
                  <ArrowRightLeft className="w-3 h-3 text-[#00FF66]" />
                  <span className="text-[#8A99A8]">{truncateWallet(tx.seller_wallet)}</span>
                </div>
                <div className="font-mono-data">
                  <span className="text-white">{tx.energy_kwh} kWh</span>
                  <span className="text-[#00FF66] ml-2">@ ₹{tx.price_per_kwh}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Book */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="glass-panel border-white/5" data-testid="buy-orders-list">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono-data uppercase tracking-wider text-[#00F0FF] flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />Buy Orders ({buyOrders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[280px]">
                {buyOrders.length > 0 ? (
                  <div className="space-y-2">
                    {buyOrders.map((order, i) => {
                      const isGoodDeal = stats && order.price_per_kwh >= (stats.avg_price || 0) * 1.1;
                      return (
                        <div key={order.id} className="terminal-card rounded-lg p-3 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span className="font-mono-data text-[#4B5563]">#{i + 1}</span>
                            <div>
                              <p className="text-white text-sm">{order.user_name || truncateWallet(order.wallet_id)}</p>
                              <p className="text-[#4B5563] font-mono-data">{order.remaining_kwh} kWh remaining</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-mono-data text-[#00F0FF]">₹{order.price_per_kwh}/kWh</p>
                            {isGoodDeal && <Badge className="bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/20 text-[9px] mt-1">GOOD BID</Badge>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-[#4B5563] text-sm">No active buy orders</div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/5" data-testid="sell-orders-list">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono-data uppercase tracking-wider text-[#00FF66] flex items-center gap-2">
                <Sun className="w-4 h-4" />Sell Orders ({sellOrders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[280px]">
                {sellOrders.length > 0 ? (
                  <div className="space-y-2">
                    {sellOrders.map((order, i) => {
                      const isGoodDeal = stats && order.price_per_kwh <= (stats.avg_price || Infinity) * 0.9;
                      return (
                        <div key={order.id} className="terminal-card rounded-lg p-3 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span className="font-mono-data text-[#4B5563]">#{i + 1}</span>
                            <div>
                              <p className="text-white text-sm">{order.user_name || truncateWallet(order.wallet_id)}</p>
                              <p className="text-[#4B5563] font-mono-data">{order.remaining_kwh} kWh available</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-mono-data text-[#00FF66]">₹{order.price_per_kwh}/kWh</p>
                            {isGoodDeal && <Badge className="bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/20 text-[9px] mt-1">BEST DEAL</Badge>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-[#4B5563] text-sm">No active sell orders</div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Recent Global Transactions */}
        <Card className="glass-panel border-white/5" data-testid="global-transactions">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono-data uppercase tracking-wider text-[#8A99A8] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00F0FF]" />Recent Market Trades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {recentTxs.length > 0 ? (
                <div className="space-y-2">
                  {recentTxs.slice(0, 15).map((tx) => (
                    <div key={tx.id} className="terminal-card rounded-lg px-3 py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-[#00FF66]" />
                        <span className="font-mono-data text-[#8A99A8]">{truncateWallet(tx.buyer_wallet)}</span>
                        <ArrowRightLeft className="w-3 h-3 text-[#4B5563]" />
                        <span className="font-mono-data text-[#8A99A8]">{truncateWallet(tx.seller_wallet)}</span>
                      </div>
                      <div className="font-mono-data flex items-center gap-3">
                        <span className="text-white">{tx.energy_kwh} kWh</span>
                        <span className="text-[#00FF66]">₹{tx.total_cost?.toFixed(2)}</span>
                        <span className="text-[#4B5563]">B#{tx.block_index}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-[#4B5563] text-sm">No trades executed yet. Place orders and run matching.</div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
