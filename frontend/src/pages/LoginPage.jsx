import React, { useState } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, KeyRound, AlertCircle, ArrowRight, CheckCircle2, UserCheck, ShieldAlert } from 'lucide-react';

export const LoginPage = () => {
  const { login, verifyMfa, quickSwitch } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mfaState, setMfaState] = useState(null); // { token, message }
  const [totpCode, setTotpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStandardLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(username, password);
      if (res.mfaRequired) {
        setMfaState({
          token: res.mfaSessionToken,
          message: res.message,
        });
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyMfa(mfaState.token, totpCode);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'TOTP code verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoUsername) => {
    setError('');
    setLoading(true);
    const success = await quickSwitch(demoUsername);
    setLoading(false);
    if (success) {
      navigate('/dashboard');
    } else {
      setError(`Failed to authenticate demo persona: ${demoUsername}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090E] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Subtle glowing circuit background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.18),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* Brand Header with Logo Banner */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-3">
        {/* Brand Banner Preview */}
        <div className="mx-auto max-w-xs rounded-2xl overflow-hidden border border-white/10 shadow-[0_10px_35px_rgba(139,92,246,0.25)] bg-[#0C0E1A]">
          <img 
            src="/brand-banner.png" 
            alt="FORSIC Forensic Evidence Core" 
            className="w-full h-auto object-cover"
          />
        </div>

        <div>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-xl font-extrabold text-white tracking-wider font-mono">
              FORSIC
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
              Zero-Trust Vault
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Forensic Evidence Core & Certified Case Management Platform
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="obsidian-card py-7 px-6 shadow-2xl rounded-3xl sm:px-9 border border-white/[0.08]">
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {!mfaState ? (
            <form onSubmit={handleStandardLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  OFFICIAL USERNAME / BADGE ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. senior_officer, investigator_a"
                    className="w-full px-3.5 py-2.5 bg-[#121524] border border-white/[0.08] hover:border-white/[0.15] focus:border-violet-500/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  SECURITY PASSKEY / PASSWORD
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 bg-[#121524] border border-white/[0.08] hover:border-white/[0.15] focus:border-violet-500/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold tracking-wider uppercase transition shadow-lg shadow-violet-600/30 border border-violet-400/30 disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>{loading ? 'Authenticating...' : 'Authorize Vault Session'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-950/50 border border-blue-800 text-blue-200 text-xs">
                <p className="font-semibold">{mfaState.message || 'Two-Factor Authentication Required'}</p>
                <p className="text-[11px] text-blue-300/80 mt-1 font-mono">
                  Enter the 6-digit TOTP code generated by your hardware token or Google Authenticator.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 font-mono">
                  6-DIGIT MFA TOTP CODE
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-3 text-center tracking-[0.5em] font-mono text-xl bg-slate-900 border border-blue-500 rounded-lg text-blue-200 focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMfaState(null)}
                  className="w-1/3 py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || totpCode.length !== 6}
                  className="w-2/3 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold uppercase tracking-wider transition disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify MFA & Enter'}
                </button>
              </div>
            </form>
          )}

          {/* Quick Demo Login Grid for 8 Roles */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
                EVALUATION PERSONAS (1-CLICK LOGIN)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">PWD: Password@123</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => handleQuickLogin(acc.username)}
                  className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 text-left transition flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-blue-300">
                      {acc.username}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 group-hover:bg-blue-900 group-hover:text-blue-200">
                      {acc.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 truncate mt-1">
                    {acc.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security architecture highlights footer */}
        <div className="mt-6 text-center text-xs font-mono text-slate-500">
          <p>National Digital Case Management Platform • Certified Secure Architecture • Continuous Audit Registry</p>
        </div>
      </div>
    </div>
  );
};
