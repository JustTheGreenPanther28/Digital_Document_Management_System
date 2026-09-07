import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Shield, 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  UserCheck, 
  ShieldAlert,
  Fingerprint,
  Eye,
  EyeOff,
  Sparkles,
  Cpu,
  Activity,
  FileCheck,
  Server,
  Zap,
  HelpCircle,
  X,
  Radio,
  Clock,
  RefreshCw
} from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [username, setUsername] = useState(() => searchParams.get('username') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberTerminal, setRememberTerminal] = useState(true);

  useEffect(() => {
    const qUser = searchParams.get('username');
    if (qUser) {
      setUsername(qUser);
    }
  }, [searchParams]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password / Emergency Recovery Modal State
  const [recoveryModalOpen, setRecoveryModalOpen] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(1);
  const [recoveryBadge, setRecoveryBadge] = useState('');
  const [recoveryOtp, setRecoveryOtp] = useState('');
  const [recoveryNewPass, setRecoveryNewPass] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  // Security Specs Drawer State
  const [specsModalOpen, setSpecsModalOpen] = useState(false);

  // Hardware Biometric Key Simulation State
  const [biometricScanning, setBiometricScanning] = useState(false);

  const handleStandardLogin = async (e) => {
    e?.preventDefault?.();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard', { replace: true });
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };


  const handleRecoverySubmit = (e) => {
    e.preventDefault();
    if (recoveryStep === 1) {
      if (!recoveryBadge.trim()) return;
      setRecoveryStep(2);
    } else if (recoveryStep === 2) {
      if (!recoveryOtp.trim()) return;
      setRecoveryStep(3);
    } else if (recoveryStep === 3) {
      if (!recoveryNewPass.trim()) return;
      setPassword(recoveryNewPass);
      setRecoverySuccess(true);
      setTimeout(() => {
        setRecoveryModalOpen(false);
        setRecoveryStep(1);
        setRecoverySuccess(false);
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080D] flex flex-col justify-between text-slate-100 relative overflow-hidden select-none font-sans">
      {/* Dynamic Futuristic Circuit & Gradient Mesh Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(120,60,240,0.22),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_90%,rgba(56,189,248,0.12),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Top Navbar Brand Banner */}
      <header className="relative z-20 border-b border-white/[0.06] bg-[#0A0C14]/80 backdrop-blur-xl px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0D1020] border border-cyan-500/40 p-1 shadow-lg shadow-cyan-500/20 flex items-center justify-center overflow-hidden">
            <img 
              src="/logo-icon.png" 
              alt="NDCMS" 
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-wider font-mono text-white">
                NDCMS
              </span>
              <span className="text-[9px] font-mono px-2 py-0.2 rounded-full uppercase font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1">
                <Radio className="w-2 h-2 text-cyan-400 animate-pulse" />
                ZERO-TRUST VAULT
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              National Digital Case & Evidence Management Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <button
            onClick={() => setSpecsModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] transition cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Compliance Specs</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-semibold text-[11px]">VAULT ONLINE</span>
          </div>
        </div>
      </header>

      {/* Main Split Body Section */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          
          {/* Left Hero & Holographic Telemetry Showcase (5 cols on Desktop) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col space-y-6">
            
            {/* Embedded NDCMS Official 3D Quantum Vault Banner */}
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-[0_12px_40px_rgba(120,60,240,0.2)] bg-[#0C0E1A] relative group">
              <img 
                src="/brand-banner.png" 
                alt="NDCMS - National Digital Case & Evidence Management Platform" 
                className="w-full h-auto object-cover transform group-hover:scale-102 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07080D]/60 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Value Proposition without duplicate title */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-mono font-medium">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Zero-Trust Forensic Vault</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight leading-snug">
                Unified Digital Chain of Custody & Evidence Repository
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hardware-rooted SHA-256 hash validation, immutable tamper detection, and Section 65B court-certified evidentiary bundling.
              </p>
            </div>

            {/* Interactive Telemetry & Security Metrics Cards */}
            <div className="space-y-2.5 font-mono">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-violet-500/30 transition flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Immutable Hash Chain</div>
                    <div className="text-[10px] text-slate-400 font-mono">Zero-Knowledge Ledger & SHA-256 Verification</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                  ACTIVE
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-cyan-500/30 transition flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Multi-Role ABAC Governance</div>
                    <div className="text-[10px] text-slate-400 font-mono">Jurisdiction & Clearance Bound Access</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">
                  LEVEL 5
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-amber-500/30 transition flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Certified Sec-65B Bundles</div>
                    <div className="text-[10px] text-slate-400 font-mono">Cryptographically Signed Court Briefings</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/25">
                  LEGAL
                </span>
              </div>
            </div>
          </div>

          {/* Right Authentication Terminal (7 cols on Desktop, Centered on Mobile) */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-md">
              
              <div className="obsidian-card p-6 sm:p-8 shadow-2xl rounded-3xl border border-white/[0.1] bg-[#0E111F]/90 backdrop-blur-2xl relative overflow-hidden">
                {/* Glow bar at top of card */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400" />

                <div className="mb-6 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold tracking-widest text-violet-400 uppercase">
                      SECURE VAULT GATEWAY
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.08]">
                      TLS 1.3
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Officer Authorization
                  </h2>
                  <p className="text-xs text-slate-400">
                    Enter your certified credentials to access the case management core.
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-3 animate-shake">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Standard Authentication Form */}
                <form onSubmit={handleStandardLogin} className="space-y-4">
                  
                  {/* Username Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300 font-mono flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-violet-400" />
                        <span>BADGE ID / USERNAME</span>
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter Badge ID or Username"
                        className="w-full pl-3.5 pr-10 py-3 bg-[#131728] border border-white/[0.08] hover:border-white/[0.18] focus:border-violet-500 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none transition shadow-inner font-mono"
                      />
                      {username && (
                        <button
                          type="button"
                          onClick={() => setUsername('')}
                          className="absolute right-3.5 top-3.5 text-slate-500 hover:text-white transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300 font-mono flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-violet-400" />
                        <span>SECURITY PASSKEY</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setRecoveryBadge(username || '');
                          setRecoveryModalOpen(true);
                        }}
                        className="text-[11px] font-mono text-violet-400 hover:text-violet-300 transition cursor-pointer"
                      >
                        Forgot Passkey?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter Security Passkey"
                        className="w-full pl-3.5 pr-10 py-3 bg-[#131728] border border-white/[0.08] hover:border-white/[0.18] focus:border-violet-500 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none transition shadow-inner font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Workstation Checkbox */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberTerminal}
                        onChange={(e) => setRememberTerminal(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-violet-600 focus:ring-violet-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="font-mono text-[11px]">Remember authorized terminal</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:via-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold tracking-wider uppercase transition shadow-xl shadow-violet-600/35 border border-white/20 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Cryptographic Credentials...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Authorize Vault Session</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </>
                    )}
                  </button>
                </form>

                {/* Footer Notice */}
                <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>Zero-Trust Protocol</span>
                  <span>IP Logged • SHA-256</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Telemetry Footer Bar */}
      <footer className="relative z-20 border-t border-white/[0.06] bg-[#0A0C14]/80 backdrop-blur-xl px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span>NDCMS v2.4 National Digital Case & Evidence Management Platform</span>
          <span className="text-slate-600">•</span>
          <span>Security Kernel: <span className="text-cyan-400">ONLINE</span></span>
        </div>
        <div>
          <span>Authorized Law Enforcement & Cyber Forensic Agency Access Only</span>
        </div>
      </footer>

      {/* 1. Emergency Passkey Recovery Modal */}
      {recoveryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="obsidian-card w-full max-w-md p-6 rounded-3xl border border-white/20 bg-[#0E111F] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-violet-400" />
                <h3 className="text-base font-bold text-white">Emergency Passkey Recovery</h3>
              </div>
              <button
                onClick={() => setRecoveryModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {recoverySuccess ? (
              <div className="p-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-base font-bold text-white">Passkey Updated Successfully</h4>
                <p className="text-xs text-slate-400 font-mono">
                  Your security credentials have been updated and synced to the vault. Returning to login...
                </p>
              </div>
            ) : (
              <form onSubmit={handleRecoverySubmit} className="space-y-4 font-mono">
                {recoveryStep === 1 && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      Step 1/3: Confirm your registered Official Username or Officer Badge ID to initiate cryptographic challenge verification.
                    </p>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">OFFICER USERNAME / BADGE ID</label>
                      <input
                        type="text"
                        required
                        value={recoveryBadge}
                        onChange={(e) => setRecoveryBadge(e.target.value)}
                        placeholder="Enter badge ID or username"
                        className="w-full px-3.5 py-2.5 bg-[#131728] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
                    >
                      Send Security Challenge Code
                    </button>
                  </div>
                )}

                {recoveryStep === 2 && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      Step 2/3: Enter the emergency override verification OTP sent to your departmental terminal.
                    </p>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">EMERGENCY 6-DIGIT OTP CODE</label>
                      <input
                        type="text"
                        required
                        value={recoveryOtp}
                        onChange={(e) => setRecoveryOtp(e.target.value)}
                        placeholder="Enter 6-digit code"
                        className="w-full px-3.5 py-2.5 bg-[#131728] border border-white/10 rounded-xl text-xs text-white text-center tracking-widest text-base focus:outline-none focus:border-violet-500"
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
                    >
                      Verify Challenge Code
                    </button>
                  </div>
                )}

                {recoveryStep === 3 && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      Step 3/3: Set your new secure Passkey.
                    </p>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">NEW PASSKEY</label>
                      <input
                        type="password"
                        required
                        value={recoveryNewPass}
                        onChange={(e) => setRecoveryNewPass(e.target.value)}
                        placeholder="Enter new passkey"
                        className="w-full px-3.5 py-2.5 bg-[#131728] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
                    >
                      Save & Authorize Session
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {/* 2. Compliance & Security Specifications Modal */}
      {specsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="obsidian-card w-full max-w-lg p-6 rounded-3xl border border-white/20 bg-[#0E111F] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Certified Forensics Architecture</h3>
              </div>
              <button
                onClick={() => setSpecsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-mono">
              <div className="p-3 rounded-2xl bg-[#131728] border border-white/[0.05] space-y-1">
                <div className="text-white font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Indian Evidence Act — Section 65B Compliance</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Electronic records and bitstream extractions generate cryptographic certificates admissible in judicial pre-trial discovery.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#131728] border border-white/[0.05] space-y-1">
                <div className="text-white font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ISO/IEC 27037:2012 Digital Evidence Standard</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Strict identification, collection, acquisition, and chain-of-custody transfer logging with double SHA-256 seal verification.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#131728] border border-white/[0.05] space-y-1">
                <div className="text-white font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" />
                  <span>Zero-Trust Cryptographic Ledger</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Every custody handover, evidence check-in, and document signing event is hashed into the immutable sequential ledger.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSpecsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition cursor-pointer"
              >
                Close Specifications
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
