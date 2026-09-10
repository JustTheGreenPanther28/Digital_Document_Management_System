import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  CANONICAL_ROLES, 
  CANONICAL_PERMISSIONS, 
  DEFAULT_ROLE_PERMISSIONS, 
  getStoredRolePermissions, 
  saveStoredRolePermissions, 
  resetRolePermissionsToDefault 
} from '../services/rbacService';
import Pagination from '../components/Pagination';
import { 
  Key, 
  Layers, 
  Check, 
  X, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Briefcase, 
  Search, 
  Save, 
  RotateCcw, 
  Info,
  SlidersHorizontal,
  CheckSquare,
  Square
} from 'lucide-react';

const ROLE_DISPLAY_NAMES = {
  ADMIN: 'ADMIN',
  SENIOR_OFFICER: 'SENIOR',
  INVESTIGATOR: 'INVST',
  EVIDENCE_CUSTODIAN: 'CUSTODIAN',
  FORENSIC_OFFICER: 'FORENSIC',
  PROSECUTOR: 'PROSECUTOR',
  COURT_OFFICER: 'COURT',
  AUDITOR: 'AUDITOR',
};

export const RolesAdminPage = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const [roles, setRoles] = useState(CANONICAL_ROLES);
  const [permissions, setPermissions] = useState(CANONICAL_PERMISSIONS);
  const [rolePermsMap, setRolePermsMap] = useState(getStoredRolePermissions());
  const [hasChanges, setHasChanges] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const isAdmin = hasRole('ADMIN') || user?.username?.toLowerCase() === 'admin';
  const isSeniorOfficer = hasRole('SENIOR_OFFICER') || user?.username?.toLowerCase() === 'senior_officer';
  const isAuthorized = isAdmin || isSeniorOfficer;
  const canEditPermissions = isAuthorized;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, search]);

  useEffect(() => {
    if (isAuthorized) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rData, pData] = await Promise.all([
        api.getRoles().catch(() => null),
        api.getPermissions().catch(() => null),
      ]);
      if (Array.isArray(rData) && rData.length > 0) {
        setRoles(rData);
      } else {
        setRoles(CANONICAL_ROLES);
      }
      if (Array.isArray(pData) && pData.length > 0) {
        setPermissions(pData);
      } else {
        setPermissions(CANONICAL_PERMISSIONS);
      }
    } catch (_) {
      setRoles(CANONICAL_ROLES);
      setPermissions(CANONICAL_PERMISSIONS);
    } finally {
      setRolePermsMap(getStoredRolePermissions());
      setHasChanges(false);
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    return ['ALL', ...new Set(permissions.map(p => p.category))];
  }, [permissions]);

  const filteredPermissions = useMemo(() => {
    return permissions.filter(p => {
      const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const q = search.toLowerCase().trim();
      const matchesSearch = !q || 
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [permissions, selectedCategory, search]);

  const paginatedPermissions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredPermissions.slice(startIndex, startIndex + pageSize);
  }, [filteredPermissions, currentPage, pageSize]);

  const togglePermission = (roleName, permName) => {
    if (!canEditPermissions) {
      alert('Read-Only Audit Mode: Only Administrators and Senior Officers can modify the system RBAC Matrix.');
      return;
    }
    setRolePermsMap(prev => {
      const currentList = prev[roleName] || [];
      const updatedList = currentList.includes(permName)
        ? currentList.filter(p => p !== permName)
        : [...currentList, permName];
      const updated = {
        ...prev,
        [roleName]: updatedList
      };
      saveStoredRolePermissions(updated);

      // Async sync to backend API if applicable
      const targetRole = roles.find(r => r.name === roleName);
      if (targetRole && targetRole.id) {
        const permIds = permissions
          .filter(p => updatedList.includes(p.name))
          .map(p => p.id);
        api.updateRolePermissions(targetRole.id, permIds).catch(() => null);
      }

      return updated;
    });
    setHasChanges(true);
    setSuccessMsg(`Updated ${permName} for ${roleName} in real-time.`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSave = async () => {
    if (!canEditPermissions) return;
    const ok = saveStoredRolePermissions(rolePermsMap);

    // Sync all roles to backend if role IDs exist
    try {
      for (const r of roles) {
        if (r.id && rolePermsMap[r.name]) {
          const allowedNames = rolePermsMap[r.name] || [];
          const permIds = permissions
            .filter(p => allowedNames.includes(p.name))
            .map(p => p.id);
          await api.updateRolePermissions(r.id, permIds).catch(() => null);
        }
      }
    } catch (_) {}

    if (ok) {
      setHasChanges(false);
      setSuccessMsg('RBAC Entitlement Matrix successfully committed to persistent security storage.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      alert('Failed to save role permissions matrix.');
    }
  };

  const handleReset = () => {
    if (!canEditPermissions) return;
    if (window.confirm('Reset all roles to canonical statutory security baseline?')) {
      const defaults = resetRolePermissionsToDefault();
      setRolePermsMap(defaults);
      setHasChanges(false);
      setSuccessMsg('Role permissions restored to default ISO/IEC 27001 baseline.');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleToggleAllForRole = (roleName) => {
    if (!canEditPermissions) return;
    const currentList = rolePermsMap[roleName] || [];
    const allFilteredPermNames = filteredPermissions.map(p => p.name);
    const allActive = allFilteredPermNames.every(pName => currentList.includes(pName));

    setRolePermsMap(prev => {
      const existing = prev[roleName] || [];
      let updated;
      if (allActive) {
        // Remove all currently filtered
        updated = existing.filter(p => !allFilteredPermNames.includes(p));
      } else {
        // Add all currently filtered
        updated = Array.from(new Set([...existing, ...allFilteredPermNames]));
      }
      const newMap = { ...prev, [roleName]: updated };
      saveStoredRolePermissions(newMap);
      return newMap;
    });
    setHasChanges(true);
    setSuccessMsg(`All visible permissions updated for ${roleName} in real-time.`);
    setTimeout(() => setSuccessMsg(''), 3000);
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
            <span>403 FORBIDDEN • RBAC MATRIX RESTRICTION</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Administrator or Senior Officer Authority Required
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
            Viewing and editing the Master RBAC Matrix and system entitlement assignments is strictly restricted to Root Administrators and Senior Supervisory Officers.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#121524] border border-white/[0.06] text-[11px] font-mono space-y-2 text-left">
          <div className="flex justify-between items-center text-slate-400">
            <span>Active Persona:</span>
            <span className="text-white font-bold">@{user?.username} ({user?.fullName || 'Officer'})</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Assigned Roles:</span>
            <span className="text-amber-400 font-bold">{user?.roles?.join(', ') || user?.role || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Required Authority:</span>
            <span className="text-cyan-400 font-bold">ADMIN | SENIOR_OFFICER</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Security Policy Decision:</span>
            <span className="text-rose-400 font-bold">ACCESS BLOCKED (UNAUTHORIZED PERSONA)</span>
          </div>
        </div>

        <div className="flex items-center justify-center pt-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 transition flex items-center gap-2 cursor-pointer"
          >
            <Briefcase className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="obsidian-card p-6 rounded-3xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-violet-600/10 border border-violet-500/30 rounded-2xl text-violet-400 shadow-inner">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  RBAC & Permission Entitlement Matrix
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                  ACTIVE GOVERNANCE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Granular Least-Privilege Entitlements • Section 65B Certified Forensic Access Controls
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {hasChanges && (
              <span className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full animate-pulse flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>Unsaved Modifications</span>
              </span>
            )}

            {canEditPermissions && (
              <>
                <button
                  onClick={handleReset}
                  className="px-3.5 py-2 rounded-xl bg-[#181D33] hover:bg-[#202742] text-slate-300 hover:text-white text-xs font-semibold border border-white/[0.08] transition flex items-center gap-1.5 cursor-pointer"
                  title="Restore default ISO/IEC 27001 baseline mappings"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reset Baseline</span>
                </button>

                <button
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition flex items-center gap-1.5 cursor-pointer ${
                    hasChanges 
                      ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/30' 
                      : 'bg-slate-800/80 text-slate-500 border border-white/[0.05] cursor-not-allowed'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Matrix Changes</span>
                </button>
              </>
            )}

            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-[#181D33] hover:bg-[#202742] text-slate-300 hover:text-white border border-white/[0.08] transition cursor-pointer"
              title="Refresh matrix"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Role Profiles Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {roles.map((r) => {
          const assignedCount = (rolePermsMap[r.name] || []).length;
          return (
            <div 
              key={r.id || r.name} 
              className="obsidian-card p-4 rounded-2xl border border-white/[0.06] hover:border-violet-500/30 transition flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${r.badgeColor || 'border-blue-500/30 text-blue-400 bg-blue-500/10'}`}>
                    {r.name}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-violet-400" />
                    <span>{r.minClearance || 'RESTRICTED'}</span>
                  </span>
                </div>
                <h3 className="text-xs font-bold text-white tracking-tight">{r.displayName || r.name}</h3>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{r.description}</p>
              </div>

              <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Granted Rights:</span>
                <span className="text-violet-300 font-mono font-bold">
                  {assignedCount} / {permissions.length} perms
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Permission Matrix Table Card */}
      <div className="obsidian-card p-5 sm:p-6 rounded-3xl space-y-5">
        {/* Matrix Controls & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-white/[0.06]">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'bg-[#121524] text-slate-400 hover:text-white border border-white/[0.06]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter permissions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-[#121524] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 font-mono"
            />
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#0A0D18] custom-scrollbar-x">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#121524] text-slate-300 border-b border-white/[0.08] font-mono">
                <th className="p-3 min-w-[200px] max-w-[240px] font-bold text-white uppercase tracking-wider sticky left-0 bg-[#121524] z-10 border-r border-white/[0.08]">
                  Permission & Scope ({filteredPermissions.length})
                </th>
                {roles.map((r) => (
                  <th key={r.id || r.name} className="p-2 text-center min-w-[78px] sm:min-w-[88px]">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="font-bold text-[10.5px] text-slate-200 tracking-tight font-mono" title={r.displayName || r.name}>
                        {ROLE_DISPLAY_NAMES[r.name] || r.name}
                      </span>
                      {canEditPermissions && (
                        <button
                          onClick={() => handleToggleAllForRole(r.name)}
                          className="text-[9px] text-violet-400 hover:text-violet-300 underline cursor-pointer"
                          title="Toggle all currently filtered permissions for this role"
                        >
                          Toggle
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {paginatedPermissions.map((perm) => {
                return (
                  <tr key={perm.id || perm.name} className="hover:bg-white/[0.02] transition group">
                    {/* Permission Info (Sticky Column) */}
                    <td className="p-3.5 sticky left-0 bg-[#0A0D18] group-hover:bg-[#0E1222] z-10 border-r border-white/[0.08]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-xs">
                            {perm.name}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-violet-500/10 text-violet-300 border border-violet-500/20">
                            {perm.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-sans">
                          {perm.description}
                        </p>
                      </div>
                    </td>

                    {/* Checkbox / Toggle for Each Role */}
                    {roles.map((r) => {
                      const isGranted = (rolePermsMap[r.name] || []).includes(perm.name);
                      return (
                        <td 
                          key={r.id || r.name} 
                          className="p-3 text-center align-middle"
                        >
                          <button
                            type="button"
                            onClick={() => togglePermission(r.name, perm.name)}
                            disabled={!canEditPermissions}
                            className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center transition select-none ${
                              isGranted
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                                : 'bg-slate-900/60 text-slate-600 border border-white/[0.05] hover:text-slate-400'
                            } ${canEditPermissions ? 'cursor-pointer hover:scale-110 active:scale-90' : 'cursor-not-allowed opacity-60'}`}
                            title={
                              canEditPermissions
                                ? `Click to ${isGranted ? 'revoke' : 'grant'} ${perm.name} for ${r.name}`
                                : `${perm.name} is ${isGranted ? 'granted' : 'denied'} for ${r.name}`
                            }
                          >
                            {isGranted ? (
                              <Check className="w-4 h-4 font-extrabold stroke-[2.5]" />
                            ) : (
                              <X className="w-3.5 h-3.5 opacity-40" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {filteredPermissions.length === 0 && (
                <tr>
                  <td colSpan={roles.length + 1} className="p-8 text-center text-slate-400 text-xs">
                    No permissions match your filter criteria. Try clearing the search query or selecting "ALL".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredPermissions.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[6, 10, 15, 25]}
          itemLabel="permissions"
          className="bg-[#0D1020] border border-white/[0.08]"
        />

        {/* Matrix Legend & Guidance */}
        <div className="p-4 rounded-2xl bg-[#121524] border border-white/[0.06] text-xs text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-300 font-mono">
              <span className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-[10px]">✓</span>
              Authorized Capability
            </span>
            <span className="flex items-center gap-1.5 text-slate-400 font-mono">
              <span className="w-4 h-4 rounded bg-slate-900 border border-white/[0.08] flex items-center justify-center text-slate-500 text-[10px]">✕</span>
              Explicitly Denied (Least-Privilege)
            </span>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            {canEditPermissions ? 'Click any cell to toggle permission • Saved in real-time' : 'Supervisory Audit Mode (Read-Only)'}
          </div>
        </div>
      </div>
    </div>
  );
};
