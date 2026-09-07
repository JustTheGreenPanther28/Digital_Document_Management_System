import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth, isUserLocked, setUserLockState, clearAllAccountLocks } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Lock, 
  Unlock, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Key, 
  RefreshCw,
  BadgeAlert,
  ShieldAlert,
  Briefcase
} from 'lucide-react';

const DEFAULT_SEED_USERS = [
  { id: 'usr-1', username: 'admin', fullName: 'Superintendent Vance (Admin)', email: 'admin@demo.local', department: 'Security & Forensics HQ', badgeNumber: 'ADMIN-001', securityClearance: 'TOP_SECRET', roles: [{ name: 'ADMIN' }, { name: 'AUDITOR' }], enabled: true, accountLocked: false },
  { id: 'usr-2', username: 'senior_officer', fullName: 'Commissioner Sterling', email: 'senior@demo.local', department: 'Crime Branch HQ', badgeNumber: 'IPS-8921', securityClearance: 'TOP_SECRET', roles: [{ name: 'SENIOR_OFFICER' }], enabled: true, accountLocked: false },
  { id: 'usr-3', username: 'investigator_a', fullName: 'Det. John Miller (Lead)', email: 'investigator_a@demo.local', department: 'Cyber Crime Cell', badgeNumber: 'INS-4412', securityClearance: 'SECRET', roles: [{ name: 'INVESTIGATOR' }], enabled: true, accountLocked: false },
  { id: 'usr-4', username: 'investigator_b', fullName: 'Det. Sarah Connor', email: 'investigator_b@demo.local', department: 'Special Cell', badgeNumber: 'INS-4413', securityClearance: 'CONFIDENTIAL', roles: [{ name: 'INVESTIGATOR' }], enabled: true, accountLocked: false },
  { id: 'usr-5', username: 'custodian', fullName: 'Officer Michael Vance', email: 'custodian@demo.local', department: 'Central Malkhana / Evidence Vault', badgeNumber: 'CUST-009', securityClearance: 'CONFIDENTIAL', roles: [{ name: 'EVIDENCE_CUSTODIAN' }], enabled: true, accountLocked: false },
  { id: 'usr-6', username: 'forensic_officer', fullName: 'Dr. Evelyn Reed', email: 'forensic@demo.local', department: 'Central Forensic Science Laboratory (CFSL)', badgeNumber: 'CFSL-901', securityClearance: 'SECRET', roles: [{ name: 'FORENSIC_OFFICER' }], enabled: true, accountLocked: false },
  { id: 'usr-7', username: 'prosecutor', fullName: 'Counsel Diane Lockhart', email: 'prosecutor@demo.local', department: 'Directorate of Prosecution', badgeNumber: 'PROS-112', securityClearance: 'SECRET', roles: [{ name: 'PROSECUTOR' }], enabled: true, accountLocked: false },
  { id: 'usr-8', username: 'court_officer', fullName: 'Registrar Arthur Pendelton', email: 'court@demo.local', department: 'Principal Sessions Court Registry', badgeNumber: 'CRT-004', securityClearance: 'PUBLIC', roles: [{ name: 'COURT_OFFICER' }], enabled: true, accountLocked: false },
  { id: 'usr-9', username: 'auditor', fullName: 'Inspector General Hayes', email: 'auditor@demo.local', department: 'Vigilance & Digital Compliance Directorate', badgeNumber: 'AUD-991', securityClearance: 'TOP_SECRET', roles: [{ name: 'AUDITOR' }], enabled: true, accountLocked: false }
];

export const UsersAdminPage = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isAuthorized = hasRole('ADMIN') || hasRole('SENIOR_OFFICER');

  // New user form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    badgeNumber: '',
    department: 'Central Investigative Bureau',
    securityClearance: 'CONFIDENTIAL',
    roles: ['INVESTIGATOR'],
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const getStoredCustomUsers = () => {
    try {
      const stored = localStorage.getItem('sih_registered_users');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveCustomUser = (newUser) => {
    try {
      const current = getStoredCustomUsers();
      const updated = [newUser, ...current.filter(u => u.id !== newUser.id && u.username !== newUser.username)];
      localStorage.setItem('sih_registered_users', JSON.stringify(updated));
    } catch (_) {}
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      if (Array.isArray(data) && data.length > 0) {
        // Sanitize root admin so it is always active and never locked
        const sanitized = data.map(u => {
          if (u.username?.toLowerCase() === 'admin') {
            return { ...u, accountLocked: false, enabled: true };
          }
          return u;
        });
        setUsers(sanitized);
      } else {
        setUsers(DEFAULT_SEED_USERS);
      }
    } catch (err) {
      console.warn('Users load error:', err.message);
      const custom = getStoredCustomUsers();
      const map = new Map();
      [...DEFAULT_SEED_USERS, ...custom].forEach(u => map.set(u.username, u));
      setUsers(Array.from(map.values()));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLock = async (targetUser) => {
    setError('');
    setSuccess('');

    // Root admin can NEVER be locked
    if (targetUser.username?.toLowerCase() === 'admin') {
      setError('Root Administrator account is permanently protected and cannot be locked.');
      return;
    }

    const nextLocked = !targetUser.accountLocked;
    try {
      const updated = await api.updateUserStatus(targetUser.id, targetUser.enabled !== false, nextLocked);
      setUserLockState(targetUser.username, nextLocked);

      const newStatus = updated || { ...targetUser, accountLocked: nextLocked };
      setUsers(users.map(u => (u.username === targetUser.username ? { ...u, accountLocked: nextLocked } : u)));
      saveCustomUser({ ...targetUser, accountLocked: nextLocked });
      
      setSuccess(`Account @${targetUser.username} has been ${nextLocked ? 'LOCKED (Access Suspended)' : 'UNLOCKED (Access Restored)'}.`);
    } catch (err) {
      setError(err.message || 'Failed to update account status');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const created = await api.createUser(formData);
      saveCustomUser(created || formData);
      setSuccess(`User @${(created && created.username) || formData.username} created and appended to database successfully.`);
      setShowCreateModal(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        fullName: '',
        badgeNumber: '',
        department: 'Central Investigative Bureau',
        securityClearance: 'CONFIDENTIAL',
        roles: ['INVESTIGATOR'],
      });
      await fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to provision user on database');
    }
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (!isAuthorized) {
    return (
      <div className="obsidian-card p-8 sm:p-10 rounded-3xl border border-rose-500/40 text-center space-y-6 max-w-xl mx-auto mt-12 select-none shadow-[0_20px_50px_rgba(244,63,94,0.18)] bg-[#0B0D17]">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400 shadow-lg shadow-rose-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold uppercase tracking-wider">
            <Lock className="w-3 h-3" />
            <span>403 FORBIDDEN • USER DIRECTORY RESTRICTION</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Administrator Clearance Required
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
            Access to Officer Clearance Provisioning, User Directories, and Account Lock Governance is restricted strictly to System Administrators and Senior Officers.
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
            <span className="text-cyan-400 font-bold">ADMIN | SENIOR_OFFICER</span>
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
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-wide font-mono">USER ACCESS & CLEARANCE GOVERNANCE</h1>
              <p className="text-sm text-slate-400">Enterprise User Directory, Clearance Attributes & Lock Control</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              clearAllAccountLocks();
              setUsers(users.map(u => ({ ...u, accountLocked: false, enabled: true })));
              setSuccess('All account locks revoked. Local storage and active sessions cleared.');
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-rose-950/40 border border-rose-800/80 hover:bg-rose-900/60 text-rose-300 text-sm font-medium transition cursor-pointer"
            title="Emergency clearance of all client-side account lockouts"
          >
            <Unlock className="w-4 h-4 text-rose-400" />
            Reset All Locks
          </button>
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-medium transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-lg shadow-blue-600/20 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Provision Officer
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-950/40 border border-red-800 text-red-300 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 flex items-center gap-3 text-sm">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search officers by name, badge, username or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800 font-mono">
            <tr>
              <th className="px-6 py-3.5">Officer / Identity</th>
              <th className="px-6 py-3.5">Role & Clearance</th>
              <th className="px-6 py-3.5">Department / Badge</th>
              <th className="px-6 py-3.5">Security Status</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                  Loading officers database...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-slate-500 font-mono">
                  No officers found matching search parameters.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((u) => {
                const clearanceColors = {
                  TOP_SECRET: 'bg-red-500/10 text-red-400 border-red-500/30',
                  SECRET: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                  CONFIDENTIAL: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                  RESTRICTED: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
                  PUBLIC: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                };
                const color = clearanceColors[u.securityClearance] || 'bg-slate-800 text-slate-400 border-slate-700';

                return (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">{u.fullName}</div>
                      <div className="text-xs text-slate-400 font-mono">@{u.username} • {u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${color}`}>
                          {u.securityClearance}
                        </span>
                        {u.roles?.map((r, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                            {r.name || r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-300">{u.department || 'General Bureau'}</div>
                      <div className="text-xs text-slate-500 font-mono">Badge: #{u.badgeNumber || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {u.accountLocked ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-950/60 text-rose-300 border border-rose-800">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      ) : u.enabled ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.username === 'admin' ? (
                        <span 
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-cyan-950/40 text-cyan-300 border border-cyan-700/50 shadow-sm select-none"
                          title="Root Administrator account is permanently protected and cannot be locked."
                        >
                          <Shield className="w-3.5 h-3.5 text-cyan-400" />
                          Root Protected
                        </span>
                      ) : (
                        <button
                          onClick={() => handleToggleLock(u)}
                          className={`p-2 rounded-lg border transition ${
                            u.accountLocked 
                              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400 hover:bg-emerald-900/60' 
                              : 'bg-rose-950/40 border-rose-800 text-rose-400 hover:bg-rose-900/60'
                          }`}
                          title={u.accountLocked ? 'Unlock Account (Restore Access)' : 'Lock Account (Suspend Access)'}
                        >
                          {u.accountLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={filteredUsers.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[4, 8, 16]}
        itemLabel="officers"
      />

      {/* Provision User Modal */}
      {showCreateModal && createPortal(
        <div className="fixed inset-0 z-[99999] w-screen h-screen min-h-screen flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-slate-100 font-mono flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-400" />
              Provision New Officer Identity
            </h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-slate-400">Username</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-400">Badge Number</label>
                  <input
                    type="text"
                    required
                    value={formData.badgeNumber}
                    onChange={(e) => setFormData({ ...formData, badgeNumber: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-mono text-slate-400">Full Name & Rank</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-slate-400">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-slate-400">Password / Digital Passkey</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-slate-400">Department / Unit</label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-400">Security Clearance</label>
                  <select
                    value={formData.securityClearance}
                    onChange={(e) => setFormData({ ...formData, securityClearance: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 cursor-pointer"
                  >
                    <option value="PUBLIC">PUBLIC (Level 0 - Court / Public Record)</option>
                    <option value="RESTRICTED">RESTRICTED (Level 1)</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL (Level 2)</option>
                    <option value="SECRET">SECRET (Level 3)</option>
                    <option value="TOP_SECRET">TOP_SECRET (Level 4)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-slate-400">Jurisdiction / Zone</label>
                  <input
                    type="text"
                    required
                    value={formData.jurisdiction || 'Metropolitan Police HQ'}
                    onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-400">System Role (RBAC)</label>
                  <select
                    value={formData.roles[0]}
                    onChange={(e) => setFormData({ ...formData, roles: [e.target.value] })}
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 cursor-pointer"
                  >
                    <option value="COURT_OFFICER">COURT_OFFICER (Judicial Registrar / Public Clerk)</option>
                    <option value="INVESTIGATOR">INVESTIGATOR</option>
                    <option value="EVIDENCE_CUSTODIAN">EVIDENCE_CUSTODIAN</option>
                    <option value="FORENSIC_OFFICER">FORENSIC_OFFICER</option>
                    <option value="PROSECUTOR">PROSECUTOR</option>
                    <option value="SENIOR_OFFICER">SENIOR_OFFICER</option>
                    <option value="AUDITOR">AUDITOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-lg shadow-blue-600/20 cursor-pointer"
                >
                  Confirm Provisioning
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
