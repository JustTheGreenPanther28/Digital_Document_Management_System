import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  Shield, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  X, 
  FileText,
  ArrowUpRight,
  Sparkles,
  Layers,
  Clock,
  ShieldCheck,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { checkCaseAccess, getStoredTeamAssignments as getStoredAbacAssignments } from '../services/abac';

const FALLBACK_CASES = [
  {
    id: '1',
    caseNumber: 'CASE-2026-001',
    title: 'State vs Syndicate Alpha (Cyber Breach & Exfiltration)',
    description: 'High-profile cyber espionage targeting power grid SCADA telemetry servers with zero-day exploits.',
    firNumber: 'FIR-2026-0981',
    investigatingAgency: 'Central Crime Branch (CCB)',
    priority: 'CRITICAL',
    classification: 'SECRET',
    status: 'UNDER_INVESTIGATION',
    legalHold: true,
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
    title: 'Financial Securities Manipulation & Ledger Tamper',
    description: 'Cryptographic fraud investigation involving unauthorized off-chain asset liquidation and forged signatures.',
    firNumber: 'FIR-2026-1142',
    investigatingAgency: 'Economic Offenses Wing (EOW)',
    priority: 'HIGH',
    classification: 'SECRET',
    status: 'CHARGESHEET_FILED',
    legalHold: false,
    createdByUsername: 'senior_officer',
    teamAssignments: [
      { username: 'investigator_a', fullName: 'Det. John Miller', roleInCase: 'LEAD_INVESTIGATOR', clearance: 'SECRET' },
      { username: 'prosecutor', fullName: 'Counsel Diane Lockhart', roleInCase: 'LEAD_PROSECUTOR', clearance: 'SECRET' }
    ]
  },
  {
    id: '3',
    caseNumber: 'CASE-2026-003',
    title: 'Confidential Document Exfiltration & Trade Secrets',
    description: 'Internal breach of classified engineering blueprints and unauthorized physical media duplication.',
    firNumber: 'FIR-2026-0428',
    investigatingAgency: 'Cyber Forensics Division (CFD)',
    priority: 'MEDIUM',
    classification: 'CONFIDENTIAL',
    status: 'REGISTERED',
    legalHold: false,
    createdByUsername: 'senior_officer',
    teamAssignments: [
      { username: 'forensic_officer', fullName: 'Dr. Evelyn Reed', roleInCase: 'FORENSIC_EXPERT', clearance: 'SECRET' },
      { username: 'custodian', fullName: 'Officer Michael Vance', roleInCase: 'EVIDENCE_CUSTODIAN', clearance: 'CONFIDENTIAL' }
    ]
  }
];

export const CasesListPage = () => {
  const { hasRole, user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [modalError, setModalError] = useState('');

  // Auto-open modal if navigated from "New Dossier" button
  useEffect(() => {
    if (searchParams.get('new') === 'true' || location.state?.openModal) {
      setShowCreateModal(true);
      if (searchParams.get('new') === 'true') {
        const next = new URLSearchParams(searchParams);
        next.delete('new');
        setSearchParams(next, { replace: true });
      }
    }
  }, [searchParams, location]);

  // Global listener for "New Dossier" action from any component
  useEffect(() => {
    const handleOpen = () => setShowCreateModal(true);
    window.addEventListener('open-new-dossier-modal', handleOpen);
    return () => window.removeEventListener('open-new-dossier-modal', handleOpen);
  }, []);

  // New Case Form
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    firNumber: '',
    incidentDate: new Date().toISOString().slice(0, 16),
    investigatingAgency: 'Central Crime Branch (CCB)',
    priority: 'HIGH',
    classification: 'RESTRICTED',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadCases();
  }, [user]);

  const getStoredCustomCases = () => {
    try {
      const stored = localStorage.getItem('sih_registered_cases');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveCustomCase = (newCase) => {
    try {
      const current = getStoredCustomCases();
      const updated = [newCase, ...current.filter(c => c.id !== newCase.id)];
      localStorage.setItem('sih_registered_cases', JSON.stringify(updated));
    } catch (_) {}
  };

  const loadCases = async () => {
    setLoading(true);
    setError('');
    const custom = getStoredCustomCases();
    try {
      const data = await api.getCases();
      if (Array.isArray(data) && data.length > 0) {
        const map = new Map();
        [...custom, ...data].forEach(item => map.set(String(item.id), item));
        setCases(Array.from(map.values()));
      } else {
        const map = new Map();
        [...custom, ...FALLBACK_CASES].forEach(item => map.set(String(item.id), item));
        setCases(Array.from(map.values()));
      }
    } catch (err) {
      console.warn('Backend cases fetch note:', err.message);
      const map = new Map();
      [...custom, ...FALLBACK_CASES].forEach(item => map.set(String(item.id), item));
      setCases(Array.from(map.values()));
    } finally {
      setLoading(false);
    }
  };

  const [scopeFilter, setScopeFilter] = useState('ALL');

  const handleCreateCase = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.firNumber.trim()) {
      setModalError('Title and FIR Number are mandatory.');
      return;
    }

    setCreating(true);
    setModalError('');
    setError('');
    try {
      const payload = {
        ...formData,
        incidentDate: formData.incidentDate ? new Date(formData.incidentDate).toISOString() : new Date().toISOString(),
      };
      
      let createdCase = null;
      try {
        createdCase = await api.createCase(payload);
      } catch (apiErr) {
        console.warn('API createCase note:', apiErr.message);
      }
      
      const newCaseId = createdCase?.id || 'case-' + Date.now();
      const newCaseNumber = `CASE-2026-${String(cases.length + 1).padStart(3, '0')}`;
      const creatorUsername = user?.username || 'senior_officer';
      const creatorFullName = user?.fullName || 'Assigned Lead Officer';

      const newCaseObj = (createdCase && createdCase.id) ? createdCase : {
        id: newCaseId,
        caseNumber: newCaseNumber,
        title: formData.title,
        description: formData.description || 'Initial investigation dossier brief.',
        firNumber: formData.firNumber,
        investigatingAgency: formData.investigatingAgency,
        priority: formData.priority,
        classification: formData.classification,
        status: 'REGISTERED',
        legalHold: false,
        createdByUsername: creatorUsername,
        createdByName: creatorFullName,
        registrationDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      // Register initial ABAC assignment for creator
      const creatorAsgn = {
        id: `asgn-creator-${newCaseObj.id}`,
        caseId: newCaseObj.id,
        caseNumber: newCaseObj.caseNumber,
        userId: creatorUsername,
        username: creatorUsername,
        fullName: creatorFullName,
        roleInCase: 'LEAD_INVESTIGATOR',
        assignedAt: new Date().toISOString(),
        clearance: user?.clearance || formData.classification
      };

      try {
        const storedAsgns = JSON.parse(localStorage.getItem('sih_team_assignments') || '[]');
        localStorage.setItem('sih_team_assignments', JSON.stringify([...storedAsgns, creatorAsgn]));
      } catch (_) {}

      saveCustomCase(newCaseObj);
      setCases((prev) => [newCaseObj, ...prev.filter(c => String(c.id) !== String(newCaseObj.id))]);

      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        firNumber: '',
        incidentDate: new Date().toISOString().slice(0, 16),
        investigatingAgency: 'Central Crime Branch (CCB)',
        priority: 'HIGH',
        classification: 'RESTRICTED',
      });
    } catch (err) {
      console.error('Case creation error:', err);
      setModalError(err.message || 'Failed to create case');
    } finally {
      setCreating(false);
    }
  };

  const evaluatedCases = cases.map((c) => {
    const access = checkCaseAccess(user, c);
    return { ...c, access };
  });

  const myAccessibleCount = evaluatedCases.filter(c => c.access.allowed).length;
  const restrictedCount = evaluatedCases.filter(c => !c.access.allowed).length;

  const filteredCases = evaluatedCases.filter((c) => {
    const matchesSearch = 
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.caseNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.firNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesScope = 
      scopeFilter === 'ALL' ||
      (scopeFilter === 'ASSIGNED' && c.access.allowed) ||
      (scopeFilter === 'RESTRICTED' && !c.access.allowed);

    return matchesSearch && matchesStatus && matchesScope;
  });

  const canCreate = hasRole('SENIOR_OFFICER') || hasRole('ADMIN') || hasRole('INVESTIGATOR');

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-cyan-400" />
              <span>ABAC Access Guard Active</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Clearance: <span className="text-amber-400 font-bold">{user?.clearance || 'RESTRICTED'}</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-violet-400" />
            <span>Digital Case Dossiers</span>
          </h1>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-violet-600/30 transition border border-violet-400/30"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Dossier</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Scope Selector: All vs My Assigned vs Restricted */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setScopeFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
            scopeFilter === 'ALL'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30 border border-violet-400/40'
              : 'bg-[#121524] text-slate-400 hover:text-white border border-white/[0.06]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Dossiers ({cases.length})</span>
        </button>

        <button
          onClick={() => setScopeFilter('ASSIGNED')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
            scopeFilter === 'ASSIGNED'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 border border-emerald-400/40'
              : 'bg-[#121524] text-slate-400 hover:text-white border border-white/[0.06]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>My Authorized Cases ({myAccessibleCount})</span>
        </button>

        <button
          onClick={() => setScopeFilter('RESTRICTED')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
            scopeFilter === 'RESTRICTED'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 border border-rose-400/40'
              : 'bg-[#121524] text-slate-400 hover:text-white border border-white/[0.06]'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-rose-400" />
          <span>Restricted / Unassigned ({restrictedCount})</span>
        </button>
      </div>

      {/* Filters & Search Bar with Clean Spacing & Enhanced Scrollbar */}
      <div className="obsidian-card p-4 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-84">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by case #, FIR, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#121524] border border-white/[0.08] hover:border-white/[0.15] focus:border-violet-500 rounded-full text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition"
          />
        </div>

        {/* Filter Option Pills with Dedicated Bottom Padding & Custom Scrollbar */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-3 pt-1 custom-scrollbar-x">
          {['ALL', 'REGISTERED', 'UNDER_INVESTIGATION', 'CHARGESHEET_FILED', 'IN_TRIAL', 'CLOSED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 whitespace-nowrap flex-shrink-0 ${
                statusFilter === status
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/40 ring-1 ring-violet-400/40'
                  : 'bg-[#121524] text-slate-400 hover:bg-[#181D33] hover:text-slate-200 border border-white/[0.05]'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Cases Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs font-mono">
          Loading authorized dossiers from cryptographic vault...
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs border border-dashed border-white/[0.08] rounded-3xl obsidian-card">
          No case records match your query or clearance criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCases.map((c) => (
            <Link
              key={c.id}
              to={`/cases/${c.id}`}
              className={`obsidian-card p-5 rounded-3xl transition group flex flex-col justify-between hover:scale-[1.01] ${
                !c.access.allowed ? 'border-rose-500/30 hover:border-rose-500/50' : ''
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-violet-400 group-hover:text-violet-300">
                    {c.caseNumber}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {c.access.allowed ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>{c.access.role === 'ADMIN' ? 'ADMIN' : (c.access.role === 'COMMAND' ? 'COMMAND' : 'ASSIGNED')}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold flex items-center gap-1">
                        <Lock className="w-3 h-3 text-rose-400" />
                        <span>RESTRICTED</span>
                      </span>
                    )}
                    <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase font-semibold ${
                      c.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                      c.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {c.priority}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-violet-200 transition">
                    {c.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {c.description}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-[#121524] border border-white/[0.04] space-y-1 text-[11px] text-slate-400 font-mono">
                  <div className="flex justify-between">
                    <span>FIR:</span>
                    <span className="text-slate-200 font-bold">{c.firNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Agency:</span>
                    <span className="text-slate-300 truncate max-w-[150px]">{c.investigatingAgency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Classification:</span>
                    <span className="text-cyan-400 font-bold">{c.classification}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-violet-950/80 text-violet-300 border border-violet-500/30 uppercase font-semibold">
                  {c.status}
                </span>

                {c.legalHold ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/40 font-semibold animate-pulse">
                    LEGAL HOLD
                  </span>
                ) : c.access.allowed ? (
                  <span className="text-xs text-slate-400 group-hover:text-white flex items-center gap-1 font-medium">
                    <span>Inspect</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className="text-xs text-rose-400/80 group-hover:text-rose-300 flex items-center gap-1 font-medium font-mono">
                    <Lock className="w-3.5 h-3.5 text-rose-400" />
                    <span>Locked (ABAC)</span>
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Register Case Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="obsidian-card w-full max-w-lg p-6 rounded-3xl shadow-2xl space-y-4 border border-white/10">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-violet-400" />
                Register New Digital Case
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCase} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Case Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. State vs Cyber Syndicate Alpha"
                  className="w-full px-3.5 py-2 bg-[#121524] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">FIR Number</label>
                <input
                  type="text"
                  required
                  value={formData.firNumber}
                  onChange={(e) => setFormData({ ...formData, firNumber: e.target.value })}
                  placeholder="e.g. FIR-2026-9812"
                  className="w-full px-3.5 py-2 bg-[#121524] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-[#121524] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Classification</label>
                  <select
                    value={formData.classification}
                    onChange={(e) => setFormData({ ...formData, classification: e.target.value })}
                    className="w-full px-3 py-2 bg-[#121524] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="RESTRICTED">RESTRICTED</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                    <option value="SECRET">SECRET</option>
                    <option value="TOP_SECRET">TOP_SECRET</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Summary Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter initial investigation brief..."
                  className="w-full px-3.5 py-2 bg-[#121524] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#181D33] text-slate-300 text-xs font-medium hover:bg-[#202744]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/40"
                >
                  {creating ? 'Registering...' : 'Register Dossier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CasesListPage;
