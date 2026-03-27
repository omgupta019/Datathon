import { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, User, Mail, Lock, MapPin, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

function formatApiError(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export default function Signup() {
  const { registerUser, isAuthenticated } = useContext(AppContext);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate('/select-role', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Full name is required'); return; }
    if (!email.trim()) { setError('Email is required'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Please enter a valid email'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      const data = await registerUser(name, email, password, address);
      toast.success(`Welcome to VoltNet, ${data.user.name}!`);
      navigate('/select-role');
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#030407' }}>
      {/* Header */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-6">
        <button className="flex items-center gap-2" onClick={() => navigate('/')}>
          <Zap className="w-6 h-6 text-[#00FF66]" />
          <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>VoltNet</span>
        </button>
        <Button
          data-testid="back-home-btn"
          variant="ghost"
          className="text-[#8A99A8] hover:text-white"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Home
        </Button>
      </nav>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="max-w-md w-full animate-fade-in">
          <div className="text-center mb-8">
            <h1
              className="text-3xl sm:text-4xl font-bold tracking-tight mb-3"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Create Account
            </h1>
            <p className="text-[#8A99A8] text-sm">Join VoltNet's decentralized energy grid</p>
          </div>

          <div className="glass-panel rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div data-testid="signup-error" className="bg-[#FF3366]/10 border border-[#FF3366]/20 rounded-lg px-4 py-3 text-sm text-[#FF3366]">
                  {error}
                </div>
              )}

              <div>
                <label className="text-xs text-[#8A99A8] block mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563]" />
                  <Input
                    data-testid="signup-name-input"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 bg-[#080B12] border-white/10 text-white focus:border-[#00FF66]/50 focus:ring-[#00FF66]/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#8A99A8] block mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563]" />
                  <Input
                    data-testid="signup-email-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-[#080B12] border-white/10 text-white focus:border-[#00FF66]/50 focus:ring-[#00FF66]/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#8A99A8] block mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563]" />
                  <Input
                    data-testid="signup-password-input"
                    type="password"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-[#080B12] border-white/10 text-white focus:border-[#00FF66]/50 focus:ring-[#00FF66]/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#8A99A8] block mb-1.5">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-[#4B5563]" />
                  <textarea
                    data-testid="signup-address-input"
                    placeholder="Your location (for local energy trading)"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="flex w-full rounded-md border border-white/10 bg-[#080B12] pl-10 pr-3 py-2 text-sm text-white placeholder:text-[#4B5563] focus:border-[#00FF66]/50 focus:ring-1 focus:ring-[#00FF66]/20 focus:outline-none resize-none"
                  />
                </div>
              </div>

              <Button
                data-testid="signup-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full btn-neon-green rounded-xl h-12 text-base disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-[#8A99A8] mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-[#00FF66] hover:underline" data-testid="goto-login-link">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
