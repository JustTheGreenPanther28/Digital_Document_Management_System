import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Clock, 
  User, 
  Globe, 
  FileWarning, 
  CheckCheck
} from 'lucide-react';

export const SecurityAlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resolvingId, setResolvingId] = useState(null);
  const [resolveNotes, setResolveNotes] = useState('');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.getSecurityAlerts();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load security alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await api.resolveSecurityAlert(id, resolveNotes || 'Mitigated and reviewed by security officer.');
      setResolvingId(null);
      setResolveNotes('');
      loadAlerts();
    } catch (err) {
      setError(err.message || 'Failed to resolve alert');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-wide font-mono">THREAT INTELLIGENCE & SECURITY ALERTS</h1>
            <p className="text-sm text-slate-400">Automated Intrusion Detection, Tamper Warnings & Anomaly Interceptions</p>
          </div>
        </div>
        <button
          onClick={loadAlerts}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-medium transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-950/40 border border-red-800 text-red-300 flex items-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-rose-900/50 bg-rose-950/20 space-y-1">
          <span className="text-xs font-mono text-rose-400 uppercase">Critical Active Threats</span>
          <div className="text-2xl font-bold font-mono text-rose-300">
            {alerts.filter(a => a.severity === 'CRITICAL' && !a.resolved).length}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-amber-900/50 bg-amber-950/20 space-y-1">
          <span className="text-xs font-mono text-amber-400 uppercase">Unresolved Incidents</span>
          <div className="text-2xl font-bold font-mono text-amber-300">
            {alerts.filter(a => !a.resolved).length}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-emerald-900/50 bg-emerald-950/20 space-y-1">
          <span className="text-xs font-mono text-emerald-400 uppercase">Remediated & Closed</span>
          <div className="text-2xl font-bold font-mono text-emerald-300">
            {alerts.filter(a => a.resolved).length}
          </div>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-mono">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-500" />
            Scanning security event stream...
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center border border-slate-800 rounded-xl bg-slate-900/30 font-mono text-slate-400">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            Zero security alerts detected. System is operating in nominal state.
          </div>
        ) : (
          alerts.map(a => {
            const isCritical = a.severity === 'CRITICAL';
            return (
              <div 
                key={a.id} 
                className={`p-5 rounded-xl border transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                  a.resolved 
                    ? 'bg-slate-900/30 border-slate-800 opacity-60' 
                    : isCritical 
                      ? 'bg-rose-950/30 border-rose-900/70 shadow-lg shadow-rose-950/30' 
                      : 'bg-amber-950/20 border-amber-900/50'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold font-mono border ${
                      isCritical ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      {a.alertType}
                    </span>
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(a.createdAt).toLocaleString()}
                    </span>
                    {a.resolved && (
                      <span className="px-2 py-0.5 rounded text-xs font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                        <CheckCheck className="w-3 h-3" /> Resolved
                      </span>
                    )}
                  </div>
                  <p className="text-slate-200 text-sm font-medium">{a.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {a.actorUsername || 'SYSTEM'}</span>
                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {a.ipAddress || '0.0.0.0'}</span>
                    {a.caseId && <span>Case Ref: {a.caseId}</span>}
                  </div>
                  {a.resolved && a.resolutionNotes && (
                    <div className="text-xs text-emerald-400/80 bg-emerald-950/30 p-2 rounded border border-emerald-900/40">
                      Resolution Note: {a.resolutionNotes}
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
                          className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200"
                        />
                        <button
                          onClick={() => handleResolve(a.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold font-mono"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setResolvingId(null)}
                          className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setResolvingId(a.id)}
                        className="px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium font-mono transition"
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
