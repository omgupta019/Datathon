import { useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '@/context/AppContext';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { Blocks, ArrowRight, RefreshCw, Hash, Clock, Zap, User, ChevronDown, ChevronUp } from 'lucide-react';

export default function BlockchainLedger() {
  const { user, API, isAuthenticated, hasWallet, authLoading } = useContext(AppContext);
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState([]);
  const [expanded, setExpanded] = useState({});

  const fetchBlocks = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/blockchain`);
      setBlocks(res.data);
    } catch (e) {
      console.error('Failed to fetch blockchain:', e);
    }
  }, [API]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!hasWallet) { navigate('/select-role'); return; }
    fetchBlocks();
  }, [authLoading, isAuthenticated, hasWallet, navigate, fetchBlocks]);

  const toggleExpand = (index) => {
    setExpanded((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const truncateHash = (h) => h ? `${h.slice(0, 10)}...${h.slice(-8)}` : '';
  const truncateWallet = (w) => w ? `${w.slice(0, 8)}...${w.slice(-6)}` : '';
  const formatTime = (ts) => {
    try {
      return new Date(ts).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    } catch {
      return ts;
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#030407' }}>
      <Header />

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-6 animate-fade-in" data-testid="blockchain-ledger">
        {/* Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Blocks className="w-6 h-6 text-[#00FF66]" />
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Blockchain Ledger
              </h1>
            </div>
            <p className="text-sm text-[#4B5563] font-mono-data">{blocks.length} block(s) on chain</p>
          </div>
          <Button
            data-testid="refresh-blockchain-btn"
            variant="ghost"
            className="text-[#8A99A8] hover:text-[#00FF66] hover:bg-[#00FF66]/5"
            onClick={fetchBlocks}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Genesis block info */}
        {blocks.length > 0 && (
          <div className="terminal-card rounded-lg p-3 mb-6 flex items-center gap-3 text-xs font-mono-data animate-border-glow">
            <span className="text-[#00FF66]">GENESIS</span>
            <span className="text-[#4B5563]">|</span>
            <span className="text-[#8A99A8]">Chain initialized with {blocks.length} blocks</span>
            <span className="text-[#4B5563]">|</span>
            <span className="text-[#8A99A8]">Latest: Block #{blocks[0]?.index}</span>
          </div>
        )}

        {/* Blocks */}
        <div className="space-y-3">
          {blocks.length > 0 ? blocks.map((block, i) => (
            <div
              key={block.index}
              className="animate-slide-in-left"
              style={{ animationDelay: `${Math.min(i * 60, 400)}ms` }}
            >
              <div
                className={`terminal-card rounded-xl overflow-hidden transition-all duration-300 ${expanded[block.index] ? 'border-[#00FF66]/40' : ''}`}
                data-testid={`block-${block.index}`}
              >
                {/* Block Header */}
                <button
                  className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-[#00FF66]/[0.02] transition-colors duration-200"
                  onClick={() => toggleExpand(block.index)}
                  data-testid={`block-toggle-${block.index}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 255, 102, 0.06)', border: '1px solid rgba(0, 255, 102, 0.15)' }}>
                      <span className="font-mono-data text-sm text-[#00FF66] font-bold">#{block.index}</span>
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white font-medium">{block.buyer_name || truncateWallet(block.buyer_wallet)}</span>
                        <ArrowRight className="w-3 h-3 text-[#00FF66]" />
                        <span className="text-sm text-white font-medium">{block.seller_name || truncateWallet(block.seller_wallet)}</span>
                      </div>
                      <p className="text-[10px] font-mono-data text-[#4B5563] mt-0.5">
                        {formatTime(block.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-mono-data text-sm text-white">{block.energy_traded} kWh</p>
                      <p className="font-mono-data text-xs text-[#00FF66]">₹{block.price}/kWh</p>
                    </div>
                    {expanded[block.index] ? (
                      <ChevronUp className="w-4 h-4 text-[#4B5563]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#4B5563]" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {expanded[block.index] && (
                  <div className="px-4 pb-4 border-t border-[#00FF66]/10 pt-3 space-y-2 text-xs font-mono-data">
                    <div className="flex items-center gap-2">
                      <Hash className="w-3 h-3 text-[#4B5563]" />
                      <span className="text-[#4B5563]">Hash:</span>
                      <span className="text-[#00F0FF]">{truncateHash(block.hash)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="w-3 h-3 text-[#4B5563]" />
                      <span className="text-[#4B5563]">Prev:</span>
                      <span className="text-[#8A99A8]">{truncateHash(block.prev_hash)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 text-[#4B5563]" />
                      <span className="text-[#4B5563]">Buyer:</span>
                      <span className="text-[#00F0FF]">{truncateWallet(block.buyer_wallet)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 text-[#4B5563]" />
                      <span className="text-[#4B5563]">Seller:</span>
                      <span className="text-[#00FF66]">{truncateWallet(block.seller_wallet)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-[#4B5563]" />
                      <span className="text-[#4B5563]">Total:</span>
                      <span className="text-white">₹{(block.energy_traded * block.price).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-[#4B5563]" />
                      <span className="text-[#4B5563]">Time:</span>
                      <span className="text-[#8A99A8]">{formatTime(block.timestamp)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chain connector */}
              {i < blocks.length - 1 && (
                <div className="flex justify-center py-1">
                  <div className="w-px h-4 bg-[#00FF66]/20" />
                </div>
              )}
            </div>
          )) : (
            <div className="text-center py-20">
              <Blocks className="w-12 h-12 text-[#4B5563] mx-auto mb-4" />
              <p className="text-[#4B5563] text-sm">No blocks on the chain yet.</p>
              <p className="text-[#4B5563] text-xs mt-1">Execute trades in the marketplace to create blocks.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
