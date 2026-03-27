import { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

function formatApiError(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export default function Login() {
  const { loginUser, isAuthenticated, hasWallet } = useContext(AppContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (isAuthenticated && hasWallet) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const data = await loginUser(email, password);
      toast.success(`Welcome back, ${data.user.name}!`);
      if (data.user.wallet_id && data.user.role) {
        navigate('/dashboard');
      } else {
        navigate('/select-role');
      }
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
              Welcome Back
            </h1>
            <p className="text-[#8A99A8] text-sm">Sign in to your VoltNet account</p>
          </div>

          <div className="glass-panel rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div data-testid="login-error" className="bg-[#FF3366]/10 border border-[#FF3366]/20 rounded-lg px-4 py-3 text-sm text-[#FF3366]">
                  {error}
                </div>
              )}

              <div>
                <label className="text-xs text-[#8A99A8] block mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563]" />
                  <Input
                    data-testid="login-email-input"
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
                    data-testid="login-password-input"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-[#080B12] border-white/10 text-white focus:border-[#00FF66]/50 focus:ring-[#00FF66]/20"
                  />
                </div>
              </div>

              <Button
                data-testid="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full btn-neon-green rounded-xl h-12 text-base disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-[#8A99A8] mt-6">
              Don't have an account?{' '}
              <Link to="/signup" className="text-[#00FF66] hover:underline" data-testid="goto-signup-link">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
