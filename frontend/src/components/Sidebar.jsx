import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { checkCaseAccess } from '../services/abac';
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
  Users,
  Key,
  Archive,
  Layers,
  Database,
  X
} from 'lucide-react';

export const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('operations'); // 'operations' or 'forensics'

  // Admin, Senior Officer, and Auditor retain the tab switcher (Operations | Forensics) like last time
  const showTabs = hasRole('ADMIN') || hasRole('SENIOR_OFFICER') || hasRole('AUDITOR');

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
    { name: 'Backup & Recovery', path: '/backup', icon: Database, allowedRoles: ['ADMIN', 'AUDITOR', 'SENIOR_OFFICER'] },
    { name: 'Threat Alerts', path: '/security-alerts', icon: ShieldAlert, badge: '2', allowedRoles: ['AUDITOR', 'ADMIN', 'SENIOR_OFFICER'] },
    { name: 'Retention & Disposal', path: '/retention-disposal', icon: Archive },
    { name: 'Global Search', path: '/search', icon: Search },
    { name: 'User Directory', path: '/admin/users', icon: Users, allowedRoles: ['ADMIN', 'SENIOR_OFFICER'] },
    { name: 'Role & Permissions', path: '/admin/roles', icon: Key, allowedRoles: ['ADMIN', 'SENIOR_OFFICER'] },
  ];

  // Lower-level officers see all their authorized functions on one single page
  const singlePageLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Case Dossiers', path: '/cases', icon: Briefcase },
    { name: 'Chain of Custody', path: '/custody', icon: GitCommit },
    { name: 'Court & Legal', path: '/court', icon: Scale },
    { name: 'Retention & Disposal', path: '/retention-disposal', icon: Archive },
    { name: 'Global Search', path: '/search', icon: Search },
  ];

  const currentLinks = showTabs
    ? (activeTab === 'operations' ? operationLinks : forensicLinks)
    : singlePageLinks;

  const visibleLinks = currentLinks.filter(l => {
    if (l.allowedRoles) return l.allowedRoles.some(role => hasRole(role));
    if (l.adminOnly) return hasRole('ADMIN') || hasRole('SENIOR_OFFICER');
    if (l.auditorOnly) return hasRole('AUDITOR') || hasRole('ADMIN') || hasRole('SENIOR_OFFICER');
    return true;
  });

  // Featured Active Priority Case Cards (filtered by clearance level)
  const [activeCasesSummary, setActiveCasesSummary] = useState([]);

  useEffect(() => {
    const loadSidebarCases = () => {
      try {
        const stored = localStorage.getItem('sih_registered_cases');
        const customCases = stored ? JSON.parse(stored) : [];

        const defaultPriorityCases = [
          { 
            id: '1', 
            caseNumber: 'CASE-2026-001', 
            name: 'Cyber Breach Dossier', 
            tag: 'HIGH SEV', 
            color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', 
            classification: 'SECRET',
            createdByUsername: 'senior_officer',
            teamAssignments: [
              { username: 'investigator_a', fullName: 'Det. John Miller', roleInCase: 'LEAD_INVESTIGATOR', clearance: 'SECRET' },
              { username: 'forensic_officer', fullName: 'Dr. Evelyn Reed', roleInCase: 'FORENSIC_EXPERT', clearance: 'SECRET' },
              { username: 'custodian', fullName: 'Officer Michael Vance', roleInCase: 'EVIDENCE_CUSTODIAN', clearance: 'CONFIDENTIAL' }
            ]
          },
          { 
            id: '2', 
            caseNumber: 'CASE-2026-002', 
            name: 'Cryptographic Tamper', 
            tag: 'CRITICAL', 
            color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', 
            classification: 'SECRET',
            createdByUsername: 'senior_officer',
            teamAssignments: [
              { username: 'investigator_a', fullName: 'Det. John Miller', roleInCase: 'LEAD_INVESTIGATOR', clearance: 'SECRET' },
              { username: 'prosecutor', fullName: 'Counsel Diane Lockhart', roleInCase: 'LEAD_PROSECUTOR', clearance: 'SECRET' }
            ]
          },
          { 
            id: '3', 
            caseNumber: 'CASE-2026-003', 
            name: 'Document Exfiltration', 
            tag: 'ACTIVE', 
            color: 'text-violet-400 bg-violet-500/10 border-violet-500/20', 
            classification: 'CONFIDENTIAL',
            createdByUsername: 'senior_officer',
            teamAssignments: [
              { username: 'forensic_officer', fullName: 'Dr. Evelyn Reed', roleInCase: 'FORENSIC_EXPERT', clearance: 'SECRET' },
              { username: 'custodian', fullName: 'Officer Michael Vance', roleInCase: 'EVIDENCE_CUSTODIAN', clearance: 'CONFIDENTIAL' }
            ]
          },
          { 
            id: '4', 
            caseNumber: 'CASE-2026-004', 
            name: 'Metro Transit & Toll', 
            tag: 'PUBLIC', 
            color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', 
            classification: 'PUBLIC',
            createdByUsername: 'court_officer',
            teamAssignments: [
              { username: 'court_officer', fullName: 'Registrar Arthur Pendelton', roleInCase: 'COURT_REGISTRAR', clearance: 'PUBLIC' }
            ]
          },
        ];

        const formattedCustom = customCases.map((c) => ({
          id: c.id,
          caseNumber: c.caseNumber,
          name: c.title || c.name || 'Untitled Case',
          tag: c.priority === 'CRITICAL' ? 'CRITICAL' : (c.priority === 'HIGH' ? 'HIGH SEV' : 'ACTIVE'),
          color: c.priority === 'CRITICAL'
            ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
            : (c.priority === 'HIGH'
              ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
              : 'text-violet-400 bg-violet-500/10 border-violet-500/20'),
          classification: c.classification || 'RESTRICTED'
        }));

        const pool = [...formattedCustom, ...defaultPriorityCases];
        const seen = new Set();
        const unique = [];
        for (const item of pool) {
          const key = String(item.caseNumber || item.id);
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(item);
          }
        }

        const allowed = unique.filter((c) =>
          checkCaseAccess(user, { id: c.id, caseNumber: c.caseNumber, classification: c.classification }).allowed
        );
        setActiveCasesSummary(allowed.slice(0, 3));
      } catch (_) {
        setActiveCasesSummary([
          { id: '1', caseNumber: 'CASE-2026-001', name: 'Cyber Breach Dossier', tag: 'HIGH SEV', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', classification: 'SECRET' },
          { id: '2', caseNumber: 'CASE-2026-002', name: 'Cryptographic Tamper', tag: 'CRITICAL', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', classification: 'SECRET' },
          { id: '3', caseNumber: 'CASE-2026-003', name: 'Document Exfiltration', tag: 'ACTIVE', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20', classification: 'CONFIDENTIAL' },
        ]);
      }
    };

    loadSidebarCases();
    window.addEventListener('storage', loadSidebarCases);
    window.addEventListener('case-created', loadSidebarCases);
    return () => {
      window.removeEventListener('storage', loadSidebarCases);
      window.removeEventListener('case-created', loadSidebarCases);
    };
  }, [user]);

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          aria-label="Close mobile navigation"
        />
      )}

      {/* Sidebar: Persistent on md+ desktop, slide-over off-canvas drawer on mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0A0C14] border-r border-white/[0.08] flex flex-col justify-between p-4 select-none transition-transform duration-300 ease-in-out md:static md:w-64 md:translate-x-0 md:min-h-[calc(100vh-3.5rem)] md:z-auto overflow-y-auto ${
          isOpen ? 'translate-x-0 shadow-2xl shadow-black' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-4">
          {/* Mobile Drawer Header with Close Button */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] md:hidden">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Investigation Vault
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-[#141829] text-slate-400 hover:text-white hover:bg-[#1C223A] transition border border-white/[0.06]"
              aria-label="Close navigation menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 1. Pill Segmented Switcher (Operations | Forensics) */}
          {showTabs && (
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
          )}

          {/* Primary Navigation Links */}
          <nav className="space-y-1 pt-1">
            {visibleLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
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
                    key={c.id || c.caseNumber}
                    to={`/cases/${c.id || c.caseNumber}`}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center justify-between p-2 rounded-xl border transition group cursor-pointer ${
                        isActive
                          ? 'bg-[#1D223A] border-violet-500/40 shadow-sm shadow-violet-950/40 text-white'
                          : 'bg-[#121524] hover:bg-[#181D33] border-white/[0.04] hover:border-white/[0.1] text-slate-200'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-3 h-3 text-violet-300" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium truncate group-hover:text-white">
                          {c.name}
                        </p>
                        <p className="text-[9px] font-mono text-slate-500 truncate">
                          {c.caseNumber || c.id}
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
    </>
  );
};

export default Sidebar;
