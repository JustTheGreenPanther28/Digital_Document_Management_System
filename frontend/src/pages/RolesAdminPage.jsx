import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Key, 
  Layers, 
  Check, 
  X, 
  RefreshCw, 
  AlertCircle,
  FileKey,
  ShieldAlert,
  Lock,
  Briefcase
} from 'lucide-react';

export const RolesAdminPage = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAuthorized = hasRole('ADMIN');

  useEffect(() => {
    if (isAuthorized) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rData, pData] = await Promise.all([
        api.getRoles(),
        api.getPermissions(),
      ]);
      setRoles(Array.isArray(rData) ? rData : []);
      setPermissions(Array.isArray(pData) ? pData : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch roles and permission matrix');
    } finally {
      setLoading(false);
    }
  };

  const categories = [...new Set(permissions.map(p => p.category))];

  if (!isAuthorized) {
    return (
      <div className="obsidian-card p-8 sm:p-10 rounded-3xl border border-rose-500/40 text-center space-y-6 max-w-xl mx-auto mt-12 select-none shadow-[0_20px_50px_rgba(244,63,94,0.18)] bg-[#0B0D17]">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400 shadow-lg shadow-rose-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold uppercase tracking-wider">
            <Lock className="w-3 h-3" />
            <span>403 FORBIDDEN • RBAC MATRIX RESTRICTION</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Superintendent / Root Administrator Required
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
            Viewing and editing the Master RBAC Matrix and system entitlement assignments is strictly restricted to Root System Administrators.
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
            <span className="text-cyan-400 font-bold">ADMIN (ROOT ONLY)</span>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-wide font-mono">RBAC & PERMISSION MATRIX</h1>
            <p className="text-sm text-slate-400">Granular Role Capability Mapping & Least-Privilege Entitlements</p>
          </div>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-medium transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-950/40 border border-red-800 text-red-300 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Roles Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map(r => (
          <div key={r.id || r.name} className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-blue-400">{r.name}</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{r.description || 'System standard persona'}</p>
          </div>
        ))}
      </div>

      {/* Permissions Matrix */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider">
            Canonical Entitlement Mapping Matrix ({permissions.length} System Permissions)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs font-mono uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Permission Name</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {permissions.map((p) => (
                <tr key={p.id || p.name} className="hover:bg-slate-800/30 transition">
                  <td className="px-6 py-3 font-semibold text-slate-200">
                    <span className="bg-slate-800 px-2 py-1 rounded text-blue-300 border border-slate-700">
                      {p.name}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-400 border border-indigo-800">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-400 font-sans text-xs">
                    {p.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
