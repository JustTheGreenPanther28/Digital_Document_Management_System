import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
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
  BadgeAlert
} from 'lucide-react';

const DEFAULT_SEED_USERS = [
  { id: 'usr-1', username: 'admin', fullName: 'Superintendent Vance (Admin)', email: 'admin@demo.local', department: 'Security & Forensics HQ', badgeNumber: 'ADMIN-001', securityClearance: 'TOP_SECRET', roles: [{ name: 'ADMIN' }, { name: 'AUDITOR' }], enabled: true, accountLocked: false },
  { id: 'usr-2', username: 'senior_officer', fullName: 'Commissioner Sterling', email: 'senior@demo.local', department: 'Crime Branch HQ', badgeNumber: 'IPS-8921', securityClearance: 'TOP_SECRET', roles: [{ name: 'SENIOR_OFFICER' }], enabled: true, accountLocked: false },
  { id: 'usr-3', username: 'investigator_a', fullName: 'Det. John Miller (Lead)', email: 'investigator_a@demo.local', department: 'Cyber Crime Cell', badgeNumber: 'INS-4412', securityClearance: 'SECRET', roles: [{ name: 'INVESTIGATOR' }], enabled: true, accountLocked: false },
  { id: 'usr-4', username: 'investigator_b', fullName: 'Det. Sarah Connor', email: 'investigator_b@demo.local', department: 'Special Cell', badgeNumber: 'INS-4413', securityClearance: 'CONFIDENTIAL', roles: [{ name: 'INVESTIGATOR' }], enabled: true, accountLocked: false },
  { id: 'usr-5', username: 'custodian', fullName: 'Officer Michael Vance', email: 'custodian@demo.local', department: 'Central Malkhana / Evidence Vault', badgeNumber: 'CUST-009', securityClearance: 'CONFIDENTIAL', roles: [{ name: 'EVIDENCE_CUSTODIAN' }], enabled: true, accountLocked: false },
  { id: 'usr-6', username: 'forensic_officer', fullName: 'Dr. Evelyn Reed', email: 'forensic@demo.local', department: 'Central Forensic Science Laboratory (CFSL)', badgeNumber: 'CFSL-901', securityClearance: 'SECRET', roles: [{ name: 'FORENSIC_OFFICER' }], enabled: true, accountLocked: false },
  { id: 'usr-7', username: 'prosecutor', fullName: 'Counsel Diane Lockhart', email: 'prosecutor@demo.local', department: 'Directorate of Prosecution', badgeNumber: 'PROS-112', securityClearance: 'SECRET', roles: [{ name: 'PROSECUTOR' }], enabled: true, accountLocked: false },
  { id: 'usr-8', username: 'court_officer', fullName: 'Registrar Arthur Pendelton', email: 'court@demo.local', department: 'Principal Sessions Court Registry', badgeNumber: 'CRT-004', securityClearance: 'CONFIDENTIAL', roles: [{ name: 'COURT_OFFICER' }], enabled: true, accountLocked: false },
  { id: 'usr-9', username: 'auditor', fullName: 'Inspector General Hayes', email: 'auditor@demo.local', department: 'Vigilance & Digital Compliance Directorate', badgeNumber: 'AUD-991', securityClearance: 'TOP_SECRET', roles: [{ name: 'AUDITOR' }], enabled: true, accountLocked: false }
];

export const UsersAdminPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

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
    const custom = getStoredCustomUsers();
    try {
      const data = await api.getUsers();
      if (Array.isArray(data) && data.length > 0) {
        const map = new Map();
        [...DEFAULT_SEED_USERS, ...custom, ...data].forEach(u => map.set(u.username, u));
        setUsers(Array.from(map.values()));
      } else {
        const map = new Map();
        [...DEFAULT_SEED_USERS, ...custom].forEach(u => map.set(u.username, u));
        setUsers(Array.from(map.values()));
      }
    } catch (err) {
      console.warn('Backend users fetch note:', err.message);
      const map = new Map();
      [...DEFAULT_SEED_USERS, ...custom].forEach(u => map.set(u.username, u));
      setUsers(Array.from(map.values()));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLock = async (user) => {
    setError('');
    setSuccess('');
    try {
      let updated = null;
      try {
        updated = await api.updateUserStatus(user.id, user.enabled, !user.accountLocked);
      } catch (_) {}
      
      const newStatus = updated || { ...user, accountLocked: !user.accountLocked };
      setUsers(users.map(u => u.username === user.username ? newStatus : u));
      saveCustomUser(newStatus);
      setSuccess(`Account status updated for ${user.username}`);
    } catch (err) {
      setError(err.message || 'Failed to update account status');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      let created = null;
      try {
        created = await api.createUser(formData);
      } catch (apiErr) {
        console.warn('Backend user create API note:', apiErr.message);
      }

      const newUserObj = created || {
        id: 'usr-' + Date.now(),
        username: formData.username,
        email: formData.email,
        fullName: formData.fullName || formData.username,
        badgeNumber: formData.badgeNumber || `OFFICER-${Math.floor(100 + Math.random() * 900)}`,
        department: formData.department,
        securityClearance: formData.securityClearance,
        roles: formData.roles.map(r => (typeof r === 'string' ? { name: r } : r)),
        enabled: true,
        accountLocked: false,
        createdAt: new Date().toISOString()
      };

      saveCustomUser(newUserObj);
      setUsers(prev => [newUserObj, ...prev.filter(u => u.username !== newUserObj.username)]);
      setSuccess(`User @${newUserObj.username} created and recorded successfully.`);
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
    } catch (err) {
      setError(err.message || 'Failed to provision user');
    }
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase())
  );

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
            onClick={fetchUsers}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-medium transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-lg shadow-blue-600/20 transition"
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
              filteredUsers.map((u) => {
                const clearanceColors = {
                  TOP_SECRET: 'bg-red-500/10 text-red-400 border-red-500/30',
                  SECRET: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                  CONFIDENTIAL: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                  RESTRICTED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
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
                      <button
                        onClick={() => handleToggleLock(u)}
                        className={`p-2 rounded-lg border transition ${
                          u.accountLocked 
                            ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400 hover:bg-emerald-900/60' 
                            : 'bg-rose-950/40 border-rose-800 text-rose-400 hover:bg-rose-900/60'
                        }`}
                        title={u.accountLocked ? 'Unlock Account' : 'Lock Account'}
                      >
                        {u.accountLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Provision User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
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
                <label className="text-xs font-mono text-slate-400">Gov Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-slate-400">Initial Password</label>
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
                  <label className="text-xs font-mono text-slate-400">Security Clearance</label>
                  <select
                    value={formData.securityClearance}
                    onChange={(e) => setFormData({ ...formData, securityClearance: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200"
                  >
                    <option value="UNCLASSIFIED">UNCLASSIFIED (Level 0)</option>
                    <option value="RESTRICTED">RESTRICTED (Level 1)</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL (Level 2)</option>
                    <option value="SECRET">SECRET (Level 3)</option>
                    <option value="TOP_SECRET">TOP_SECRET (Level 4)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-400">Primary Role</label>
                  <select
                    value={formData.roles[0]}
                    onChange={(e) => setFormData({ ...formData, roles: [e.target.value] })}
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200"
                  >
                    <option value="INVESTIGATOR">INVESTIGATOR</option>
                    <option value="SENIOR_OFFICER">SENIOR_OFFICER</option>
                    <option value="EVIDENCE_CUSTODIAN">EVIDENCE_CUSTODIAN</option>
                    <option value="FORENSIC_OFFICER">FORENSIC_OFFICER</option>
                    <option value="PROSECUTOR">PROSECUTOR</option>
                    <option value="COURT_OFFICER">COURT_OFFICER</option>
                    <option value="AUDITOR">AUDITOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-lg shadow-blue-600/20"
                >
                  Confirm Provisioning
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
