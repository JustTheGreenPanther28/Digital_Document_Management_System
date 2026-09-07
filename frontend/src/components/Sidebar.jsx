import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canClearanceAccess, checkCaseAccess } from '../services/abac';
import { 
  LayoutDashboard, 
  Briefcase, 
  Package, 
  GitCommit, 
  FileLock2, 
  Scale, 
  FileCode2, 
  Search, 
  ShieldAlert, 
  Terminal,
  Fingerprint,
  Users,
  Key,
  Archive,
  ChevronDown,
  Shield,
  Radio,
  Sparkles,
  Lock,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

export const Sidebar = () => {
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('operations'); // 'operations' or 'forensics'

  const operationLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Case Dossiers', path: '/cases', icon: Briefcase },
    { name: 'Evidence Locker', path: '/evidence', icon: Package, allowedRoles: ['ADMIN', 'SENIOR_OFFICER'] },
    { name: 'Chain of Custody', path: '/custody', icon: GitCommit },
    { name: 'Document Vault', path: '/documents', icon: FileLock2, allowedRoles: ['ADMIN', 'SENIOR_OFFICER'] },
    { name: 'Court & Legal', path: '/court', icon: Scale },
  ];

  const forensicLinks = [
    { name: 'Audit & Custody Ledger', path: '/audit', icon: FileCode2, allowedRoles: ['AUDITOR', 'ADMIN', 'SENIOR_OFFICER'] },
    { name: 'Threat Alerts', path: '/security-alerts', icon: ShieldAlert, badge: '2', allowedRoles: ['AUDITOR', 'ADMIN', 'SENIOR_OFFICER'] },
    { name: 'Retention & Disposal', path: '/retention-disposal', icon: Archive },
    { name: 'Global Search', path: '/search', icon: Search },
    { name: 'User Directory', path: '/admin/users', icon: Users, allowedRoles: ['ADMIN', 'SENIOR_OFFICER'] },
    { name: 'Role & Permissions', path: '/admin/roles', icon: Key, allowedRoles: ['ADMIN'] },
  ];

  const activeLinks = activeTab === 'operations' ? operationLinks : forensicLinks;
  const visibleLinks = activeLinks.filter(l => {
    if (l.allowedRoles) return l.allowedRoles.some(role => hasRole(role));
    if (l.adminOnly) return hasRole('ADMIN') || hasRole('SENIOR_OFFICER');
    if (l.auditorOnly) return hasRole('AUDITOR') || hasRole('ADMIN') || hasRole('SENIOR_OFFICER');
    return true;
  });

  // Featured Active Priority Case Cards (filtered by clearance level)
  const allActiveCasesSummary = [
    { id: 'CASE-2026-001', name: 'Cyber Breach Dossier', tag: 'HIGH SEV', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', classification: 'SECRET' },
    { id: 'CASE-2026-002', name: 'Cryptographic Tamper', tag: 'CRITICAL', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', classification: 'SECRET' },
    { id: 'CASE-2026-003', name: 'Document Exfiltration', tag: 'ACTIVE', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20', classification: 'CONFIDENTIAL' },
    { id: 'CASE-2026-004', name: 'Metro Transit & Toll', tag: 'PUBLIC', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', classification: 'PUBLIC' },
  ];

  const activeCasesSummary = allActiveCasesSummary
    .filter(c => checkCaseAccess(user, { id: c.id, caseNumber: c.id, classification: c.classification }).allowed)
    .slice(0, 3);

  return (
    <aside className="w-64 bg-[#0A0C14] border-r border-white/[0.06] flex flex-col justify-between p-4 flex-shrink-0 min-h-[calc(100vh-3.5rem)] select-none">
      <div className="space-y-4">
        {/* 1. Pill Segmented Switcher (Operations | Forensics) */}
        <div className="p-1 bg-[#121524] rounded-full flex items-center border border-white/[0.06]">
          <button
            onClick={() => setActiveTab('operations')}
            className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              activeTab === 'operations'
                ? 'bg-[#1D223A] text-white shadow-md border border-white/[0.08]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Operations
          </button>
          <button
            onClick={() => setActiveTab('forensics')}
            className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              activeTab === 'forensics'
                ? 'bg-[#1D223A] text-white shadow-md border border-white/[0.08]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Forensics
          </button>
        </div>

        {/* 3. Primary Navigation Links */}
        <nav className="space-y-1 pt-1">
          {visibleLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600/30 to-indigo-600/20 text-white border border-violet-500/40 shadow-sm shadow-violet-950/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#141829]'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* 4. Active Priority Dossiers Mini-List */}
        {activeCasesSummary.length > 0 && (
          <div className="pt-3 border-t border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between px-2 text-[11px] font-semibold text-slate-400">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-violet-400" />
                <span>Priority Dossiers</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 rounded-full bg-[#181D33] text-slate-300">
                {activeCasesSummary.length}
              </span>
            </div>

            <div className="space-y-1.5">
              {activeCasesSummary.map((c) => (
                <NavLink
                  key={c.id}
                  to="/cases"
                  className="flex items-center justify-between p-2 rounded-xl bg-[#121524] hover:bg-[#181D33] border border-white/[0.04] hover:border-white/[0.1] transition group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-3 h-3 text-violet-300" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-slate-200 truncate group-hover:text-white">
                        {c.name}
                      </p>
                      <p className="text-[9px] font-mono text-slate-500 truncate">
                        {c.id}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-full border ${c.color}`}>
                    {c.tag}
                  </span>
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. Bottom System Status Capsule */}
      <div className="pt-3 border-t border-white/[0.06] space-y-2">
        <div className="p-2.5 rounded-xl bg-[#121524] border border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-mono text-slate-300 font-semibold">
              VAULT STATUS
            </span>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            SECURE
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
