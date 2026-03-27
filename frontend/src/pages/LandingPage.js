import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Zap, Shield, BarChart3, ArrowRight, Cpu, Globe, TrendingUp } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#030407' }}>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1772050138768-2107c6e62a03?w=1920&q=80)',
          }}
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute inset-0 grid-pattern" />

        {/* Floating Nav */}
        <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 md:px-12 py-6">
          <div className="flex items-center gap-2">
            <Zap className="w-7 h-7 text-[#00FF66]" />
            <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              VoltNet
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              data-testid="hero-login-btn"
              onClick={() => navigate('/login')}
              className="btn-neon-blue rounded-full px-5 text-sm h-9"
              variant="outline"
            >
              Sign In
            </Button>
            <Button
              data-testid="hero-start-trading-btn"
              onClick={() => navigate('/signup')}
              className="btn-neon-green rounded-full px-5 text-sm h-9"
            >
              Get Started
            </Button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00FF66]/20 bg-[#00FF66]/5 mb-8">
            <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
            <span className="text-xs font-mono-data uppercase tracking-widest text-[#00FF66]">
              Decentralized Energy Grid
            </span>
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-tight mb-6"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Peer-to-Peer
            <br />
            <span className="text-[#00FF66]">Energy Trading</span>
          </h1>

          <p className="text-base md:text-lg text-[#8A99A8] max-w-2xl mx-auto mb-10 leading-relaxed">
            Trade clean energy locally with blockchain transparency.
            Buy and sell surplus solar power through smart bidding on a decentralized grid.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              data-testid="start-trading-btn"
              onClick={() => navigate('/signup')}
              className="btn-neon-green rounded-full px-8 py-3 text-base h-12"
              size="lg"
            >
              Start Trading
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              data-testid="explore-login-btn"
              onClick={() => navigate('/login')}
              className="btn-neon-blue rounded-full px-8 py-3 text-base h-12"
              variant="outline"
              size="lg"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-3 rounded-full bg-[#00FF66]/60" />
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-6 md:px-12" style={{ backgroundColor: '#030407' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-slide-up">
            <p className="text-xs font-mono-data uppercase tracking-[0.2em] text-[#00F0FF] mb-4">The Problem</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Energy Systems are <span className="text-[#FF3366]">Broken</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
            {[
              { icon: Globe, title: 'Centralized Control', desc: 'Traditional grids waste energy through inefficient centralized distribution systems.' },
              { icon: TrendingUp, title: 'Unfair Pricing', desc: 'Consumers have no control over energy prices set by monopolistic utilities.' },
              { icon: Cpu, title: 'No Transparency', desc: 'Zero visibility into where your energy comes from or where surplus goes.' },
            ].map((item, i) => (
              <div
                key={i}
                className="glass-panel rounded-2xl p-6 card-hover animate-slide-up"
              >
                <div className="w-12 h-12 rounded-xl bg-[#FF3366]/10 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-[#FF3366]" />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>{item.title}</h3>
                <p className="text-sm text-[#8A99A8] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 px-6 md:px-12" style={{ backgroundColor: '#080B12' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-mono-data uppercase tracking-[0.2em] text-[#00FF66] mb-4">The Solution</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              VoltNet <span className="text-[#00FF66]">P2P Energy Grid</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
            {[
              {
                icon: Zap,
                title: 'Smart Bidding',
                desc: 'Our greedy matching algorithm pairs buyers and sellers at the optimal price point.',
                color: '#00FF66',
              },
              {
                icon: Shield,
                title: 'Blockchain Verified',
                desc: 'Every transaction is recorded as an immutable block for complete transparency.',
                color: '#00F0FF',
              },
              {
                icon: BarChart3,
                title: 'Live Dashboards',
                desc: 'Real-time market data, price trends, and efficiency scores at your fingertips.',
                color: '#FFB800',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="glass-panel rounded-2xl p-6 card-hover animate-slide-up"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${item.color}10` }}
                >
                  <item.icon className="w-6 h-6" style={{ color: item.color }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>{item.title}</h3>
                <p className="text-sm text-[#8A99A8] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 md:px-12 relative" style={{ backgroundColor: '#030407' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Ready to <span className="text-[#00FF66]">Trade Energy?</span>
          </h2>
          <p className="text-[#8A99A8] mb-8 text-base">
            Join the decentralized energy revolution. Start buying or selling surplus solar power today.
          </p>
          <Button
            data-testid="cta-start-trading-btn"
            onClick={() => navigate('/signup')}
            className="btn-neon-green rounded-full px-10 py-3 text-base h-12"
            size="lg"
          >
            Get Started Now
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 md:px-12" style={{ backgroundColor: '#030407' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#00FF66]" />
            <span className="text-sm font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>VoltNet</span>
          </div>
          <p className="text-xs text-[#4B5563]">Decentralized Energy Grid Simulator</p>
        </div>
      </footer>
    </div>
  );
}
