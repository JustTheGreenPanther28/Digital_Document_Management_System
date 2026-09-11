import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
import { checkCaseAccess, canClearanceAccess, getStoredTeamAssignments as getStoredAbacAssignments } from '../services/abac';
import { logCaseCreated } from '../services/auditLogger';
import Pagination from '../components/Pagination';

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
  },
  {
    id: '4',
    caseNumber: 'CASE-2026-004',
    title: 'State vs Metro Automated Transit & Toll Registry Dispute',
    description: 'Public judicial inquiry into transit ticketing anomaly and automated municipal toll violation hearings.',
    firNumber: 'FIR-2026-0105',
    investigatingAgency: 'Metropolitan Public Traffic & Court Division',
    priority: 'LOW',
    classification: 'PUBLIC',
    status: 'HEARING_SCHEDULED',
    legalHold: false,
    createdByUsername: 'court_officer',
    teamAssignments: [
      { username: 'court_officer', fullName: 'Registrar Arthur Pendelton', roleInCase: 'COURT_REGISTRAR', clearance: 'PUBLIC' },
      { username: 'prosecutor', fullName: 'Counsel Diane Lockhart', roleInCase: 'PUBLIC_PROSECUTOR', clearance: 'SECRET' }
    ]
  }
];

export const CasesListPage = () => {
  const { hasRole, user, hasPermission } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalError, setModalError] = useState('');

  const canCreate = hasPermission ? hasPermission('CASE_CREATE') : (hasRole('SENIOR_OFFICER') || hasRole('ADMIN') || hasRole('INVESTIGATOR'));

  // Auto-open modal if navigated from "New Dossier" button
  useEffect(() => {
    if (searchParams.get('new') === 'true' || location.state?.openModal) {
      if (canCreate) {
        setShowCreateModal(true);
      } else {
        alert('ACCESS DENIED: Your current persona lacks the CASE_CREATE authorization granted in the Security Matrix.');
      }
      if (searchParams.get('new') === 'true') {
        const next = new URLSearchParams(searchParams);
        next.delete('new');
        setSearchParams(next, { replace: true });
      }
    }
  }, [searchParams, location, canCreate]);

  // Global listener for "New Dossier" action from any component
  useEffect(() => {
    const handleOpen = () => {
      if (canCreate) {
        setShowCreateModal(true);
      } else {
        alert('ACCESS DENIED: Case dossier creation is restricted to Senior Officers, Lead Investigators, and Administrators.');
      }
    };
    window.addEventListener('open-new-dossier-modal', handleOpen);
    return () => window.removeEventListener('open-new-dossier-modal', handleOpen);
  }, [canCreate]);

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
      if (!stored) return [];
      const list = JSON.parse(stored);
      if (!Array.isArray(list)) return [];

      let maxSeq = 4;
      list.forEach(c => {
        const m = c.caseNumber?.match(/CASE-\d{4}-(\d+)/);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n > maxSeq) maxSeq = n;
        }
      });

      let changed = false;
      const assignedNums = new Set(['CASE-2026-001']);
      const uniqueList = list.map(c => {
        let num = c.caseNumber?.trim();
        if (!num || assignedNums.has(num)) {
          maxSeq++;
          num = `CASE-2026-${String(maxSeq).padStart(3, '0')}`;
          changed = true;
          return { ...c, caseNumber: num };
        }
        assignedNums.add(num);
        return c;
      });

      if (changed) {
        localStorage.setItem('sih_registered_cases', JSON.stringify(uniqueList));
      }
      return uniqueList;
    } catch {
      return [];
    }
  };

  const saveCustomCase = (newCase) => {
    try {
      const current = getStoredCustomCases();
      const updated = [newCase, ...current.filter(c => String(c.id) !== String(newCase.id))];
      localStorage.setItem('sih_registered_cases', JSON.stringify(updated));
    } catch (_) {}
  };

  const getCaseOverrides = () => {
    try {
      const raw = localStorage.getItem('sih_case_overrides');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const loadCases = async () => {
    setLoading(true);
    setError('');
    const custom = getStoredCustomCases();
    const overrides = getCaseOverrides();
    const applyOverrides = (item) => {
      const ov = overrides[String(item.id)] || (item.caseNumber ? overrides[String(item.caseNumber)] : null) || {};
      return { ...item, ...ov };
    };

    try {
      const data = await api.getCases();
      if (Array.isArray(data) && data.length > 0) {
        const map = new Map();
        [...custom, ...data].forEach(item => map.set(String(item.id), applyOverrides(item)));
        setCases(Array.from(map.values()));
      } else {
        const map = new Map();
        [...custom, ...FALLBACK_CASES].forEach(item => map.set(String(item.id), applyOverrides(item)));
        setCases(Array.from(map.values()));
      }
    } catch (err) {
      console.warn('Backend cases fetch note:', err.message);
      const map = new Map();
      [...custom, ...FALLBACK_CASES].forEach(item => map.set(String(item.id), applyOverrides(item)));
      setCases(Array.from(map.values()));
    } finally {
      setLoading(false);
    }
  };

  const [scopeFilter, setScopeFilter] = useState('ALL');

  const handleCreateCase = async (e) => {
    e.preventDefault();
    if (!canCreate) {
      setModalError('ACCESS DENIED: Case registration is restricted to Senior Officers, Lead Investigators, and Administrators.');
      return;
    }
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
      
      const allExistingCases = [...cases, ...FALLBACK_CASES, ...getStoredCustomCases()];
      const existingNums = new Set();
      let maxSeq = 4;
      allExistingCases.forEach(c => {
        if (c.caseNumber) {
          const numTrim = c.caseNumber.trim();
          existingNums.add(numTrim);
          const match = numTrim.match(/CASE-\d{4}-(\d+)/);
          if (match) {
            const n = parseInt(match[1], 10);
            if (n > maxSeq) maxSeq = n;
          }
        }
      });

      let nextSeq = maxSeq + 1;
      let generatedCaseNumber = `CASE-2026-${String(nextSeq).padStart(3, '0')}`;
      while (existingNums.has(generatedCaseNumber)) {
        nextSeq++;
        generatedCaseNumber = `CASE-2026-${String(nextSeq).padStart(3, '0')}`;
      }

      const newCaseId = createdCase?.id || 'case-' + Date.now();
      const resolvedCaseNumber = (createdCase?.caseNumber && !existingNums.has(createdCase.caseNumber))
        ? createdCase.caseNumber
        : generatedCaseNumber;
      const creatorUsername = user?.username || 'senior_officer';
      const creatorFullName = user?.fullName || 'Assigned Lead Officer';

      const newCaseObj = (createdCase && createdCase.id) ? { ...createdCase, caseNumber: resolvedCaseNumber } : {
        id: newCaseId,
        caseNumber: resolvedCaseNumber,
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

      logCaseCreated({
        caseNumber: newCaseObj.caseNumber,
        title: newCaseObj.title,
        classification: newCaseObj.classification,
        priority: newCaseObj.priority,
        firNumber: newCaseObj.firNumber
      });

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

  const isAdmin = hasRole('ADMIN');

  const canReadCases = hasPermission ? hasPermission('CASE_READ') : true;

  // Mandatory Access Control (MAC): strictly filter out cases exceeding user's clearance level
  const clearedCases = cases.filter((c) => canClearanceAccess(user?.clearance, c.classification));

  const evaluatedCases = clearedCases.map((c) => {
    const access = checkCaseAccess(user, c);
    return { ...c, access };
  });

  const myAccessibleCount = canReadCases ? evaluatedCases.filter(c => c.access.allowed).length : 0;
  const restrictedCount = evaluatedCases.filter(c => !c.access.allowed).length;

  // Strict Person-Level Isolation: If CASE_READ revoked, show zero cases; else non-admin officers only see cases assigned to them
  const poolCases = !canReadCases ? [] : (isAdmin ? evaluatedCases : evaluatedCases.filter(c => c.access.allowed));

  const filteredCases = poolCases.filter((c) => {
    const matchesSearch = 
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.caseNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.firNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesScope = 
      !isAdmin ||
      scopeFilter === 'ALL' ||
      (scopeFilter === 'ASSIGNED' && c.access.allowed) ||
      (scopeFilter === 'RESTRICTED' && !c.access.allowed);

    return matchesSearch && matchesStatus && matchesScope;
  });

  // Reset to page 1 whenever filter parameters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, scopeFilter]);

  const paginatedCases = filteredCases.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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

      {/* Cases Content Area: 403 Revoked Notice or Case List */}
      {!canReadCases ? (
        <div className="obsidian-card p-8 sm:p-12 rounded-3xl border border-rose-500/40 text-center space-y-6 max-w-xl mx-auto my-8 select-none shadow-[0_20px_50px_rgba(244,63,94,0.18)] bg-[#0B0D17]">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400 shadow-lg shadow-rose-500/20">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold uppercase tracking-wider">
              <Lock className="w-3 h-3" />
              <span>403 FORBIDDEN • ENTITLEMENT REVOKED</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Case Dossier Access Revoked
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
              Your persona lacks the <span className="text-amber-400 font-mono font-bold">CASE_READ</span> authorization. Access to investigative dossiers has been explicitly revoked in the RBAC Security Matrix.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#121524] border border-white/[0.06] text-[11px] font-mono space-y-2 text-left">
            <div className="flex justify-between items-center text-slate-400">
              <span>Attempted By:</span>
              <span className="text-white font-bold">@{user?.username} ({user?.fullName || 'Officer'})</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Required Entitlement:</span>
              <span className="text-amber-400 font-bold">CASE_READ</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>RBAC Matrix Decision:</span>
              <span className="text-rose-400 font-bold">DENIED (ENTITLEMENT REVOKED)</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Scope Selector: All vs My Assigned vs Restricted (For Admin Supervision) */}
          {isAdmin ? (
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
      ) : (
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Assigned Dossiers ({myAccessibleCount})</span>
          </span>
        </div>
      )}

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
          {['ALL', 'REGISTERED', 'UNDER_INVESTIGATION', 'CHARGESHEET_FILED', 'IN_TRIAL', 'CLOSED', 'ARCHIVED'].map((status) => (
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
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedCases.map((c) => (
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

          <Pagination
            currentPage={currentPage}
            totalItems={filteredCases.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[6, 12, 24]}
            itemLabel="dossiers"
          />
        </div>
      )}
      </>
      )}

      {/* Register Case Modal */}
      {showCreateModal && createPortal(
        <div className="fixed inset-0 z-[99999] w-screen h-screen min-h-screen flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 animate-in fade-in duration-150">
          <div className="obsidian-card w-full max-w-lg p-6 rounded-3xl shadow-2xl space-y-4 border border-white/10">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-violet-400" />
                Register New Digital Case
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
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

            <form onSubmit={handleCreateCase} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Case Title / Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State vs Cyber Syndicate Alpha"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#13182E] border border-white/[0.08] rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">FIR Reference Number</label>
                  <input
                    type="text"
                    required
                    placeholder="FIR-2026-0891"
                    value={formData.firNumber}
                    onChange={(e) => setFormData({ ...formData, firNumber: e.target.value })}
                    className="w-full bg-[#13182E] border border-white/[0.08] rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Investigating Agency</label>
                  <input
                    type="text"
                    required
                    placeholder="Central Crime Branch (CCB)"
                    value={formData.investigatingAgency}
                    onChange={(e) => setFormData({ ...formData, investigatingAgency: e.target.value })}
                    className="w-full bg-[#13182E] border border-white/[0.08] rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Priority Level</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-[#13182E] border border-white/[0.08] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Security Clearance Level (ABAC)</label>
                  <select
                    value={formData.classification}
                    onChange={(e) => setFormData({ ...formData, classification: e.target.value })}
                    className="w-full bg-[#13182E] border border-white/[0.08] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    {[
                      { value: 'PUBLIC', label: 'PUBLIC (Court / Open Access)' },
                      { value: 'RESTRICTED', label: 'RESTRICTED' },
                      { value: 'CONFIDENTIAL', label: 'CONFIDENTIAL' },
                      { value: 'SECRET', label: 'SECRET' },
                      { value: 'TOP_SECRET', label: 'TOP_SECRET' },
                    ]
                      .filter((opt) => canClearanceAccess(user?.clearance, opt.value))
                      .map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Case Summary / Initial Brief</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Brief description of alleged digital offenses, forensic scope, and primary targets..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#13182E] border border-white/[0.08] rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/40 cursor-pointer disabled:opacity-50"
                >
                  {creating ? 'Registering...' : 'Register Dossier'}
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

export default CasesListPage;
