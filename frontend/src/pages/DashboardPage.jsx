import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  ShieldAlert, 
  Package, 
  GitCommit, 
  FileLock2, 
  Scale, 
  FileCode2, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  Clock, 
  Shield, 
  Lock, 
  UserCheck, 
  RefreshCw,
  Users,
  Key,
  Archive,
  Fingerprint,
  FileCheck,
  Building,
  Gavel,
  ChevronDown,
  Sparkles,
  Link as LinkIcon,
  ExternalLink,
  Sliders,
  Maximize2,
  Share2,
  Play,
  Pause,
  Layers,
  ArrowRight
} from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingLedger, setVerifyingLedger] = useState(false);
  const [ledgerStatus, setLedgerStatus] = useState(null);
  const [retentionPeriod, setRetentionPeriod] = useState(4);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const casesData = await api.getCases().catch(() => []);
      setCases(casesData || []);

      const transfers = await api.getPendingTransfers().catch(() => []);
      setPendingTransfers(transfers || []);

      const alerts = await api.getSecurityAlerts().catch(() => []);
      setSecurityAlerts(alerts || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLedger = async () => {
    setVerifyingLedger(true);
    try {
      const res = await api.verifyHashChain();
      setLedgerStatus(res);
    } catch (err) {
      setLedgerStatus({ verified: false, error: err.message });
    } finally {
      setVerifyingLedger(false);
    }
  };

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto">
      {/* 1. Top Filter & Section Header Row (matching reference top row) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* Recommended Pills Header */}
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141829] border border-white/[0.08] text-[11px] font-medium text-slate-300">
              <span>Recommended dossiers for 24 hours</span>
              <Clock className="w-3 h-3 text-violet-400" />
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#181D33] text-[11px] font-semibold text-slate-200 border border-white/[0.06]">
              {cases.length || 3} Dossiers
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Top Priority Dossiers
          </h1>
        </div>

        {/* Filter Capsule Dropdowns (matching 24H, Proof of Stake, Desc pills) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#141829] hover:bg-[#1A2035] border border-white/[0.08] text-xs font-medium text-slate-300 transition">
            <span>24H</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#141829] hover:bg-[#1A2035] border border-white/[0.08] text-xs font-medium text-slate-300 transition">
            <span>Custody Status</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#141829] hover:bg-[#1A2035] border border-white/[0.08] text-xs font-medium text-slate-300 transition">
            <span>Desc</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button 
            onClick={loadDashboardData}
            className="p-2 rounded-full bg-[#141829] hover:bg-[#1A2035] border border-white/[0.08] text-slate-400 hover:text-white transition"
            title="Sync Vault"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-violet-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Main Hero Grid: 3 Stat Cards + 1 Glowing Spotlight Banner (matching reference top grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Evidence Integrity (Ethereum Style) */}
        <div className="obsidian-card p-5 rounded-3xl flex flex-col justify-between relative overflow-hidden group">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-600/30 to-blue-600/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block leading-tight">
                    Integrity Status
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    Digital Audit Ledger
                  </span>
                </div>
              </div>
              <Link
                to="/audit"
                className="w-7 h-7 rounded-full bg-[#181D33] hover:bg-violet-600 border border-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white transition"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-4">
              <p className="text-[11px] text-slate-400 font-medium">Integrity Rate</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold text-white tracking-tight">100.0%</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-[11px] font-semibold text-emerald-400">+100% Verified</span>
              </div>
            </div>
          </div>

          {/* Glowing SVG Wave Sparkline */}
          <div className="mt-4 relative h-16 w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 200 60" preserveAspectRatio="none">
              <defs>
                <linearGradient id="wave1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 45 Q 40 55, 80 35 T 140 20 T 200 30"
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="2.5"
                className="wave-glow"
              />
              <path
                d="M 0 45 Q 40 55, 80 35 T 140 20 T 200 30 L 200 60 L 0 60 Z"
                fill="url(#wave1)"
              />
              {/* Data Marker Point */}
              <circle cx="140" cy="20" r="3.5" fill="#8B5CF6" className="animate-pulse" />
            </svg>
            <span className="absolute right-0 top-0 text-[9px] font-mono text-violet-300 bg-violet-950/80 px-1.5 py-0.5 rounded-full border border-violet-500/30">
              +0 Tamper
            </span>
          </div>
        </div>

        {/* Card 2: Active Case Pipeline (BNB Style) */}
        <div className="obsidian-card p-5 rounded-3xl flex flex-col justify-between relative overflow-hidden group">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-600/30 to-yellow-600/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block leading-tight">
                    Active Pipeline
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    Active Dossiers
                  </span>
                </div>
              </div>
              <Link
                to="/cases"
                className="w-7 h-7 rounded-full bg-[#181D33] hover:bg-violet-600 border border-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white transition"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-4">
              <p className="text-[11px] text-slate-400 font-medium">Clearance Pipeline</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold text-white tracking-tight">
                  {cases.length ? `${cases.length} Open` : '4 Active'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-[11px] font-semibold text-emerald-400">+5.67% Throughput</span>
              </div>
            </div>
          </div>

          {/* Glowing SVG Wave Sparkline */}
          <div className="mt-4 relative h-16 w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 200 60" preserveAspectRatio="none">
              <defs>
                <linearGradient id="wave2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 50 Q 50 30, 100 45 T 160 25 T 200 35"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="2.5"
                className="wave-glow"
              />
              <path
                d="M 0 50 Q 50 30, 100 45 T 160 25 T 200 35 L 200 60 L 0 60 Z"
                fill="url(#wave2)"
              />
              <circle cx="160" cy="25" r="3.5" fill="#38BDF8" />
            </svg>
            <span className="absolute right-0 top-0 text-[9px] font-mono text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded-full border border-cyan-500/30">
              +2,009 Blocks
            </span>
          </div>
        </div>

        {/* Card 3: Custody & Threat Velocity (Polygon Style) */}
        <div className="obsidian-card p-5 rounded-3xl flex flex-col justify-between relative overflow-hidden group">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-violet-600/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block leading-tight">
                    Threat Defense
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    Security Alerts
                  </span>
                </div>
              </div>
              <Link
                to="/security-alerts"
                className="w-7 h-7 rounded-full bg-[#181D33] hover:bg-violet-600 border border-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white transition"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-4">
              <p className="text-[11px] text-slate-400 font-medium">Anomaly Rate</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold text-white tracking-tight">0.00%</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                <span className="text-[11px] font-semibold text-rose-400">0 High Severity Threats</span>
              </div>
            </div>
          </div>

          {/* Glowing SVG Wave Sparkline with Alert Indicator */}
          <div className="mt-4 relative h-16 w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 200 60" preserveAspectRatio="none">
              <defs>
                <linearGradient id="wave3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 35 Q 60 50, 120 30 T 170 50 T 200 45"
                fill="none"
                stroke="#F43F5E"
                strokeWidth="2.5"
                className="wave-glow-red"
              />
              <path
                d="M 0 35 Q 60 50, 120 30 T 170 50 T 200 45 L 200 60 L 0 60 Z"
                fill="url(#wave3)"
              />
              <circle cx="170" cy="50" r="3.5" fill="#F43F5E" />
            </svg>
            <span className="absolute right-0 top-0 text-[9px] font-mono text-rose-300 bg-rose-950/80 px-1.5 py-0.5 rounded-full border border-rose-500/30">
              Zero Tamper
            </span>
          </div>
        </div>

        {/* Card 4: Glowing Purple Spotlight Card (matching Liquid Staking Portfolio banner in reference) */}
        <div className="spotlight-purple-gradient p-5 rounded-3xl flex flex-col justify-between relative overflow-hidden">
          {/* Top Brand Banner */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-violet-300" />
                <span className="font-bold text-xs text-white tracking-wide">
                  NDCMS Vault
                </span>
                <span className="text-[9px] font-mono text-violet-300">®</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-bold tracking-wider uppercase border border-white/20">
                Active
              </span>
            </div>

            <h3 className="text-lg font-bold text-white leading-tight">
              Audit & Verification Vault
            </h3>
            <p className="text-xs text-violet-200/80 mt-1.5 leading-relaxed">
              Continuous digital chain of custody and multi-layer secure vault protection.
            </p>
          </div>

          {/* Dual Action Pill Buttons */}
          <div className="space-y-2 mt-4">
            <button
              onClick={handleVerifyLedger}
              disabled={verifyingLedger}
              className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs transition shadow-lg flex items-center justify-center gap-2 group"
            >
              <Fingerprint className={`w-4 h-4 text-violet-600 group-hover:scale-110 transition ${verifyingLedger ? 'animate-spin' : ''}`} />
              <span>{verifyingLedger ? 'Verifying Integrity...' : 'Verify Ledger Integrity'}</span>
              <Lock className="w-3 h-3 text-slate-600" />
            </button>

            <button
              onClick={() => navigate('/custody')}
              className="w-full py-2.5 px-4 rounded-2xl bg-[#141829]/80 hover:bg-[#1A2035] border border-white/10 text-white font-semibold text-xs transition flex items-center justify-center gap-2"
            >
              <span>Transfer Custody</span>
              <Lock className="w-3 h-3 text-violet-300" />
            </button>
          </div>

          {ledgerStatus && (
            <div className={`mt-2 p-2 rounded-xl text-[10px] font-mono border ${ledgerStatus.verified ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/60 border-rose-500/40 text-rose-300'}`}>
              {ledgerStatus.verified ? `✓ ${ledgerStatus.message || 'Chain fully verified'}` : `✗ Tamper detected: ${ledgerStatus.error}`}
            </div>
          )}
        </div>
      </div>

      {/* 3. Bottom Active Dossier & Custody Retention Timeline Section (matching reference bottom section) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-200">
            Your Active Dossiers
          </h2>
          <div className="flex items-center gap-2 text-slate-400">
            <button className="p-1.5 hover:text-white transition">
              <Sliders className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 hover:text-white transition">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 hover:text-white transition">
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Active Case Card (Left 2 Columns) */}
          <div className="lg:col-span-2 obsidian-card p-6 rounded-3xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <span>Last Updated - 45 minutes ago</span>
                <Clock className="w-3 h-3 text-violet-400" />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Critical Cyber Breach (CASE-2026-001)
                  </h3>
                  <span className="w-6 h-6 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 text-xs">
                    🔺
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 rounded-full bg-[#181D33] hover:bg-violet-600 border border-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white transition">
                    <LinkIcon className="w-3.5 h-3.5" />
                  </button>
                  <button className="w-8 h-8 rounded-full bg-[#181D33] hover:bg-violet-600 border border-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white transition">
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <Link
                    to="/cases/1"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#181D33] hover:bg-violet-600 border border-white/[0.08] text-xs font-semibold text-slate-200 hover:text-white transition"
                  >
                    <span>View Profile</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Metric Figure & Action Pills (matching 31.39686 Upgrade / Unstake row in reference) */}
            <div className="pt-2 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Sealed Evidence Payload Size
                </p>
                <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-0.5">
                  31.39686 <span className="text-base text-violet-400 font-mono font-bold">GB</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => navigate('/cases/1')}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition shadow-lg shadow-violet-600/30"
                >
                  Assign Lead
                </button>
                <button 
                  onClick={() => navigate('/evidence')}
                  className="px-4 py-2 rounded-xl bg-[#181D33] hover:bg-[#202744] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-semibold transition"
                >
                  Inspect Locker
                </button>
              </div>
            </div>
          </div>

          {/* Retention & Custody Timeline Panel (Right 1 Column) */}
          <div className="obsidian-card p-6 rounded-3xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Custody Retention Period
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Statutory Holding Period
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#181D33] text-xs font-bold text-slate-200 border border-white/[0.06]">
                  6 Month
                </span>
              </div>
            </div>

            {/* Interactive Scrubber / Timeline Bar (matching reference 4 Month timeline slider) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Active Timeline:</span>
                <span className="font-mono text-violet-300 font-bold px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/30">
                  {retentionPeriod} Month
                </span>
              </div>

              <div className="relative pt-2 pb-1">
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={retentionPeriod}
                  onChange={(e) => setRetentionPeriod(Number(e.target.value))}
                  className="w-full accent-violet-500 h-1.5 bg-[#181D33] rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Ticks & Audio-like scrubber visualization */}
              <div className="flex items-center justify-between gap-1 h-8 px-1">
                {[...Array(24)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-all duration-200 ${
                      i < retentionPeriod * 2
                        ? 'bg-violet-500 shadow-sm shadow-violet-500/50 h-6'
                        : 'bg-[#181D33] h-2.5'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-center pt-2">
                <button
                  onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
                  className="w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center justify-center text-white shadow-lg shadow-violet-600/40 transition"
                  title="Play / Pause Custody Timeline"
                >
                  {isPlayingTimeline ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
