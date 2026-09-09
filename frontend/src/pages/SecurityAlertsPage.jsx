import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Clock, 
  User, 
  Globe, 
  FileWarning, 
  CheckCheck,
  Lock,
  Briefcase
} from 'lucide-react';

const FALLBACK_SECURITY_ALERTS = [
  {
    id: 'alt-001',
    severity: 'CRITICAL',
    alertType: 'CRYPTO_HASH_MISMATCH',
    description: 'SHA-256 seal discrepancy detected on custody transition for disk node EVD-2026-001-A.',
    sourceIp: '192.168.1.108',
    actorUsername: 'SYSTEM',
    resolved: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: 'alt-002',
    severity: 'HIGH',
    alertType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
    description: 'Failed ABAC authorization attempt on TOP_SECRET case CASE-2026-001 by unassigned terminal.',
    sourceIp: '10.0.4.22',
    actorUsername: 'SYSTEM',
    resolved: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
  },
  {
    id: 'alt-003',
    severity: 'MEDIUM',
    alertType: 'SESSION_ANOMALY',
    description: 'Concurrent login detected across geographically separate APNIC subnets for investigator badge.',
    sourceIp: '172.16.0.45',
    actorUsername: 'SYSTEM',
    resolved: true,
    resolvedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    resolutionNotes: 'Verified legitimate remote triage through secure VPN gateway.',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  }
];

export const SecurityAlertsPage = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resolvingId, setResolvingId] = useState(null);
  const [resolveNotes, setResolveNotes] = useState('');

  const isAuthorized = hasRole('ADMIN') || hasRole('AUDITOR') || hasRole('SENIOR_OFFICER');

  const getStoredAlerts = () => {
    try {
      const stored = localStorage.getItem('sih_security_alerts');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const saveStoredAlerts = (alertsList) => {
    try {
      localStorage.setItem('sih_security_alerts', JSON.stringify(alertsList));
    } catch (_) {}
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    setError('');
    
    const localSaved = getStoredAlerts();
    let baseAlerts = localSaved && localSaved.length > 0 ? localSaved : FALLBACK_SECURITY_ALERTS;

    try {
      const data = await api.getSecurityAlerts();
      if (Array.isArray(data) && data.length > 0) {
        const merged = data.map(item => {
          const localMatch = localSaved?.find(l => l.id === item.id);
          if (localMatch && localMatch.resolved) {
            return { ...item, resolved: true, resolutionNotes: localMatch.resolutionNotes, resolvedAt: localMatch.resolvedAt };
          }
          return item;
        });
        setAlerts(merged);
        saveStoredAlerts(merged);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Backend alerts note:', err.message);
    }

    setAlerts(baseAlerts);
    if (!localSaved) {
      saveStoredAlerts(baseAlerts);
    }
    setLoading(false);
  };

  const handleResolve = async (id) => {
    const notes = resolveNotes.trim() || 'Mitigated and reviewed by security officer.';
    const now = new Date().toISOString();

    try {
      await api.resolveSecurityAlert(id, notes).catch(() => null);
    } catch (_) {}

    setAlerts(prev => {
      const updated = prev.map(a => a.id === id ? { 
        ...a, 
        resolved: true, 
        resolutionNotes: notes, 
        resolvedAt: now 
      } : a);
      saveStoredAlerts(updated);
      return updated;
    });

    setResolvingId(null);
    setResolveNotes('');
  };

  const formatAlertDate = (alert) => {
    const rawDate = alert.createdAt || alert.timestamp || alert.resolvedAt;
    if (!rawDate) return 'Just now';
    const parsed = new Date(rawDate);
    if (isNaN(parsed.getTime())) return 'Recently';
    return parsed.toLocaleString();
  };

  if (!isAuthorized) {
    return (
      <div className="obsidian-card p-8 sm:p-10 rounded-3xl border border-rose-500/40 text-center space-y-6 max-w-xl mx-auto mt-12 select-none shadow-[0_20px_50px_rgba(244,63,94,0.18)] bg-[#0B0D17]">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400 shadow-lg shadow-rose-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold uppercase tracking-wider">
            <Lock className="w-3 h-3" />
            <span>403 FORBIDDEN • THREAT ALERTS RESTRICTION</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Security Clearance Required
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
            Access to Live Threat Intelligence, Cryptographic Tamper Interceptions, and Intrusion Detection Feeds is restricted exclusively to System Administrators, Security Auditors, and Senior Officers.
          </p>
        </div>

        {/* Security Policy Context */}
        <div className="p-4 rounded-2xl bg-[#121524] border border-white/[0.06] text-[11px] font-mono space-y-2 text-left">
          <div className="flex justify-between items-center text-slate-400">
            <span>Active Persona:</span>
            <span className="text-white font-bold">@{user?.username} ({user?.fullName || 'Officer'})</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Assigned Roles:</span>
            <span className="text-amber-400 font-bold">{user?.roles?.join(', ') || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Required Authority:</span>
            <span className="text-cyan-400 font-bold">ADMIN | AUDITOR | SENIOR_OFFICER</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Security Policy Decision:</span>
            <span className="text-rose-400 font-bold">ACCESS BLOCKED (UNAUTHORIZED PERSONA)</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Briefcase className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight font-sans">THREAT INTELLIGENCE & SECURITY ALERTS</h1>
            <p className="text-xs text-slate-400">Automated Intrusion Detection, Tamper Warnings & Anomaly Interceptions</p>
          </div>
        </div>
        <button
          onClick={loadAlerts}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stream
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800 text-red-300 flex items-center gap-3 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-rose-900/50 bg-rose-950/20 space-y-1">
          <span className="text-xs font-mono text-rose-400 uppercase font-semibold">Critical Active Threats</span>
          <div className="text-2xl font-bold font-mono text-rose-300">
            {alerts.filter(a => a.severity === 'CRITICAL' && !a.resolved).length}
          </div>
        </div>
        <div className="p-4 rounded-2xl border border-amber-900/50 bg-amber-950/20 space-y-1">
          <span className="text-xs font-mono text-amber-400 uppercase font-semibold">Unresolved Incidents</span>
          <div className="text-2xl font-bold font-mono text-amber-300">
            {alerts.filter(a => !a.resolved).length}
          </div>
        </div>
        <div className="p-4 rounded-2xl border border-emerald-900/50 bg-emerald-950/20 space-y-1">
          <span className="text-xs font-mono text-emerald-400 uppercase font-semibold">Remediated & Closed</span>
          <div className="text-2xl font-bold font-mono text-emerald-300">
            {alerts.filter(a => a.resolved).length}
          </div>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-mono text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-500" />
            Scanning security event stream...
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center border border-slate-800 rounded-2xl bg-slate-900/30 font-mono text-slate-400 text-xs">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            Zero security alerts detected. System is operating in nominal state.
          </div>
        ) : (
          alerts.map(a => {
            const isCritical = a.severity === 'CRITICAL';
            return (
              <div 
                key={a.id} 
                className={`p-5 rounded-2xl border transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                  a.resolved 
                    ? 'bg-slate-900/30 border-slate-800 opacity-65' 
                    : isCritical 
                      ? 'bg-rose-950/30 border-rose-900/70 shadow-lg shadow-rose-950/30' 
                      : 'bg-amber-950/20 border-amber-900/50'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold font-mono border ${
                      isCritical ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      {a.alertType}
                    </span>
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatAlertDate(a)}
                    </span>
                    {a.resolved && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1 font-semibold">
                        <CheckCheck className="w-3 h-3" /> Resolved
                      </span>
                    )}
                  </div>
                  <p className="text-slate-200 text-xs sm:text-sm font-medium">{a.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {a.actorUsername || 'SYSTEM'}</span>
                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {a.ipAddress || '0.0.0.0'}</span>
                    {a.caseId && <span>Case Ref: {a.caseId}</span>}
                  </div>
                  {a.resolved && a.resolutionNotes && (
                    <div className="text-xs text-emerald-400/90 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-900/50 font-mono">
                      <span className="font-bold">Resolution Note:</span> {a.resolutionNotes}
                    </div>
                  )}
                </div>

                {!a.resolved && (
                  <div className="flex-shrink-0">
                    {resolvingId === a.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Resolution rationale..."
                          value={resolveNotes}
                          onChange={(e) => setResolveNotes(e.target.value)}
                          className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                          autoFocus
                        />
                        <button
                          onClick={() => handleResolve(a.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-mono transition cursor-pointer shadow-md shadow-emerald-600/30"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setResolvingId(null)}
                          className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setResolvingId(a.id);
                          setResolveNotes('');
                        }}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium font-mono transition cursor-pointer"
                      >
                        Remediate
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
