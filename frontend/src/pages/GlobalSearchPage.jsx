import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canClearanceAccess, checkCaseAccess, isEvidenceSubmittedByUser } from '../services/abac';
import { 
  Search, 
  Briefcase, 
  Package, 
  FileText, 
  ArrowRight, 
  ShieldCheck, 
  GitCommit, 
  Filter, 
  Sparkles, 
  Layers, 
  ArrowUpRight, 
  X
} from 'lucide-react';

const FALLBACK_CASES = [
  {
    id: '1',
    caseNumber: 'CASE-2026-001',
    title: 'State vs Cyber Syndicate Alpha (Critical Cyber Breach)',
    description: 'High-profile cyber espionage targeting power grid SCADA telemetry servers with zero-day exploits and firmware duplication.',
    firNumber: 'FIR-2026-0981',
    investigatingAgency: 'Central Crime Branch (CCB)',
    priority: 'CRITICAL',
    classification: 'SECRET',
    status: 'UNDER_INVESTIGATION',
    registrationDate: '2026-08-16T10:00:00Z',
    leadOfficer: 'Officer Michael Vance',
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
    registrationDate: '2026-08-18T14:30:00Z',
    leadOfficer: 'Officer Michael Vance',
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
    registrationDate: '2026-08-20T09:00:00Z',
    leadOfficer: 'Dr. Evelyn Reed',
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
    registrationDate: '2026-08-22T08:00:00Z',
    leadOfficer: 'Registrar Arthur Pendelton',
    createdByUsername: 'court_officer',
    teamAssignments: [
      { username: 'court_officer', fullName: 'Registrar Arthur Pendelton', roleInCase: 'COURT_REGISTRAR', clearance: 'PUBLIC' },
      { username: 'prosecutor', fullName: 'Counsel Diane Lockhart', roleInCase: 'PUBLIC_PROSECUTOR', clearance: 'SECRET' }
    ]
  }
];

const FALLBACK_EVIDENCE = [
  {
    id: 'evd-1',
    barcode: 'EVD-2026-001-A',
    caseNumber: 'CASE-2026-001',
    itemCategory: 'DIGITAL_DEVICE',
    description: 'Encrypted NVMe SSD containing exfiltrated server memory dumps and telemetry logs.',
    storageLocation: 'Vault 01 - Compartment 4B',
    status: 'IN_CUSTODY',
    currentCustodian: 'Officer Michael Vance',
    classification: 'SECRET'
  },
  {
    id: 'evd-2',
    barcode: 'EVD-2026-001-B',
    caseNumber: 'CASE-2026-001',
    itemCategory: 'HARDWARE_CONTROLLER',
    description: 'Compromised SCADA Gateway hardware controller extracted from power station.',
    storageLocation: 'Vault 01 - Shelf C',
    status: 'IN_FORENSIC_ANALYSIS',
    currentCustodian: 'Dr. Evelyn Reed',
    classification: 'SECRET'
  },
  {
    id: 'evd-3',
    barcode: 'EVD-2026-002-A',
    caseNumber: 'CASE-2026-002',
    itemCategory: 'STORAGE_MEDIA',
    description: 'SanDisk Extreme 1TB Flash Drive with private key transaction signatures.',
    storageLocation: 'Vault 02 - Bin 9',
    status: 'IN_CUSTODY',
    currentCustodian: 'Officer Michael Vance',
    classification: 'SECRET'
  },
  {
    id: 'evd-4',
    barcode: 'EVD-2026-004-A',
    caseNumber: 'CASE-2026-004',
    itemCategory: 'DOCUMENTARY',
    description: 'Public municipal transit ticket logs and automated toll registry printouts.',
    storageLocation: 'Public Registry Vault - Shelf 1',
    status: 'IN_CUSTODY',
    currentCustodian: 'Registrar Arthur Pendelton',
    classification: 'PUBLIC'
  }
];

const FALLBACK_DOCS = [
  {
    id: 'doc-1',
    title: 'SCADA Telemetry Exfiltration Forensics Report',
    caseNumber: 'CASE-2026-001',
    documentType: 'FORENSIC_REPORT',
    classification: 'TOP_SECRET',
    originalFilename: 'scada_telemetry_dump.bin.gz',
    sha256Hash: 'a8b9412cde458711094324fbcde710294324bca8412948710294812734',
    uploadedAt: '2026-08-17T14:20:00Z'
  },
  {
    id: 'doc-2',
    title: 'Preliminary FIR & Seizure Memo',
    caseNumber: 'CASE-2026-001',
    documentType: 'POLICE_REPORT',
    classification: 'SECRET',
    originalFilename: 'fir_0981_signed.pdf',
    sha256Hash: '7c3ae941bca94812739481274918237491823749182374918237491823749182',
    uploadedAt: '2026-08-16T10:15:00Z'
  },
  {
    id: 'doc-3',
    title: 'Public Judicial Gazette & Seizure Proclamation',
    caseNumber: 'CASE-2026-004',
    documentType: 'POLICE_REPORT',
    classification: 'PUBLIC',
    originalFilename: 'public_judicial_proclamation.pdf',
    sha256Hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    uploadedAt: '2026-08-22T09:30:00Z'
  }
];

const FALLBACK_TRANSFERS = [
  {
    id: 'tr-1',
    transferId: 'TRF-2026-001',
    evidenceBarcode: 'EVD-2026-001-A',
    caseNumber: 'CASE-2026-001',
    itemDescription: 'Encrypted NVMe SSD Memory Dump',
    fromOfficer: 'Officer Michael Vance',
    toOfficer: 'Dr. Evelyn Reed',
    reason: 'Deep Forensic Memory Carving & Bitstream Acquisition',
    status: 'ACCEPTED',
    timestamp: '2026-08-17T11:30:00Z'
  },
  {
    id: 'tr-2',
    transferId: 'TRF-2026-002',
    evidenceBarcode: 'EVD-2026-001-B',
    caseNumber: 'CASE-2026-001',
    itemDescription: 'SCADA Gateway Controller',
    fromOfficer: 'Officer Michael Vance',
    toOfficer: 'Forensic Lab Lead',
    reason: 'Firmware EEPROM physical extraction',
    status: 'IN_TRANSIT',
    timestamp: '2026-08-18T09:15:00Z'
  }
];

const safeGetArray = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
};

export const GlobalSearchPage = () => {
  const { user, hasRole, permVersion } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [domainFilter, setDomainFilter] = useState('ALL');

  const isSupervisor = hasRole ? (hasRole('ADMIN') || hasRole('SENIOR_OFFICER')) : false;

  // Sync state if URL query param changes
  useEffect(() => {
    const qParam = searchParams.get('q');
    if (qParam !== null && qParam !== query) {
      setQuery(qParam);
    }
  }, [searchParams]);

  // Aggregate unified searchable corpus across cases, evidence, documents, and transfers
  const allDataset = useMemo(() => {
    // 1. Cases: fallback + registered
    const customCases = safeGetArray('sih_registered_cases');
    const caseMap = new Map();
    [...FALLBACK_CASES, ...customCases].forEach(c => {
      if (c && (c.id || c.caseNumber)) {
        caseMap.set(String(c.caseNumber || c.id), c);
      }
    });
    const mergedCases = Array.from(caseMap.values());

    // 2. Evidence: fallback + registered
    const customEvidence = safeGetArray('sih_registered_evidence');
    const evMap = new Map();
    [...FALLBACK_EVIDENCE, ...customEvidence].forEach(e => {
      if (e && (e.id || e.barcode || e.evidenceNumber)) {
        evMap.set(String(e.barcode || e.evidenceNumber || e.id), e);
      }
    });
    const mergedEvidence = Array.from(evMap.values());

    // 3. Documents: fallback + vault docs
    const customDocs = safeGetArray('sih_vault_documents');
    const docMap = new Map();
    [...FALLBACK_DOCS, ...customDocs].forEach(d => {
      if (d && (d.id || d.title)) {
        docMap.set(String(d.id || d.title), d);
      }
    });
    const mergedDocs = Array.from(docMap.values());

    // 4. Custody Transfers
    const customTransfers = safeGetArray('sih_custody_transfers');
    const trMap = new Map();
    [...FALLBACK_TRANSFERS, ...customTransfers].forEach(t => {
      if (t && (t.id || t.transferId)) {
        trMap.set(String(t.id || t.transferId), t);
      }
    });
    const mergedTransfers = Array.from(trMap.values());

    return {
      cases: mergedCases,
      evidence: mergedEvidence,
      documents: mergedDocs,
      transfers: mergedTransfers
    };
  }, []);

  // Compute matched results reactively as user types query or toggles domain
  const results = useMemo(() => {
    const qLower = (query || '').toLowerCase().trim();

    // Map case numbers to classifications for cross-entity MAC clearance enforcement
    const caseClassificationMap = {};
    const caseRefMap = {};
    (allDataset.cases || []).forEach(c => {
      if (c.caseNumber) {
        caseClassificationMap[c.caseNumber] = c.classification;
        caseRefMap[c.caseNumber] = c;
      }
      if (c.id) {
        caseClassificationMap[String(c.id)] = c.classification;
        caseRefMap[String(c.id)] = c;
      }
    });

    const canUserAccessCaseRef = (caseRef) => {
      if (!caseRef) return false;
      const parentCase = caseRefMap[caseRef] || { id: caseRef, caseNumber: caseRef };
      return checkCaseAccess(user, parentCase).allowed;
    };

    // Matching Cases (Person-Based ABAC: user must have clearance AND assignment/creator/admin access)
    const cases = (allDataset.cases || []).filter(c => {
      if (!c) return false;
      const access = checkCaseAccess(user, c);
      if (!access.allowed) return false;
      if (!qLower) return true;
      return (
        (c.title || '').toLowerCase().includes(qLower) ||
        (c.caseNumber || '').toLowerCase().includes(qLower) ||
        (c.firNumber || '').toLowerCase().includes(qLower) ||
        (c.description || '').toLowerCase().includes(qLower) ||
        (c.investigatingAgency || '').toLowerCase().includes(qLower) ||
        (c.status || '').toLowerCase().includes(qLower) ||
        (c.leadOfficer || '').toLowerCase().includes(qLower) ||
        (c.classification || '').toLowerCase().includes(qLower)
      );
    });

    // Matching Evidence (Person-Based ABAC: clearance + parent case access + submitted/held by user unless admin)
    const evidence = (allDataset.evidence || []).filter(e => {
      if (!e) return false;
      const caseRef = e.caseNumber || (e.caseId ? String(e.caseId) : '');
      if (!isSupervisor && caseRef && !canUserAccessCaseRef(caseRef)) return false;
      const itemClassification = e.classification || caseClassificationMap[e.caseNumber] || caseClassificationMap[String(e.caseId)] || 'RESTRICTED';
      if (!canClearanceAccess(user?.clearance, itemClassification)) return false;
      if (!isEvidenceSubmittedByUser(e, user)) return false;
      if (!qLower) return true;
      return (
        (e.barcode || '').toLowerCase().includes(qLower) ||
        (e.description || '').toLowerCase().includes(qLower) ||
        (e.itemCategory || '').toLowerCase().includes(qLower) ||
        (e.storageLocation || '').toLowerCase().includes(qLower) ||
        (e.currentCustodian || '').toLowerCase().includes(qLower) ||
        (e.caseNumber || '').toLowerCase().includes(qLower) ||
        (e.classification || '').toLowerCase().includes(qLower)
      );
    });

    // Matching Documents (Mandatory Access Control: hide documents exceeding user clearance or unassigned case)
    const documents = (allDataset.documents || []).filter(d => {
      if (!d) return false;
      const caseRef = d.caseNumber || (d.caseId ? String(d.caseId) : '');
      if (!isSupervisor && caseRef && !canUserAccessCaseRef(caseRef)) return false;
      const docClassification = d.classification || caseClassificationMap[d.caseNumber] || caseClassificationMap[String(d.caseId)] || 'RESTRICTED';
      if (!canClearanceAccess(user?.clearance, docClassification)) return false;
      if (!qLower) return true;
      return (
        (d.title || '').toLowerCase().includes(qLower) ||
        (d.originalFilename || '').toLowerCase().includes(qLower) ||
        (d.sha256Hash || '').toLowerCase().includes(qLower) ||
        (d.documentType || '').toLowerCase().includes(qLower) ||
        (d.caseNumber || '').toLowerCase().includes(qLower)
      );
    });

    // Matching Custody Transfers (Mandatory Access Control: hide transfers for cases exceeding user clearance or unassigned case)
    const transfers = (allDataset.transfers || []).filter(t => {
      if (!t) return false;
      const caseRef = t.caseNumber || (t.caseId ? String(t.caseId) : '');
      if (!isSupervisor && caseRef && !canUserAccessCaseRef(caseRef)) return false;
      const transferClassification = caseClassificationMap[t.caseNumber] || 'RESTRICTED';
      if (!canClearanceAccess(user?.clearance, transferClassification)) return false;
      if (!qLower) return true;
      return (
        (t.transferId || '').toLowerCase().includes(qLower) ||
        (t.evidenceBarcode || '').toLowerCase().includes(qLower) ||
        (t.caseNumber || '').toLowerCase().includes(qLower) ||
        (t.toOfficer || '').toLowerCase().includes(qLower) ||
        (t.fromOfficer || '').toLowerCase().includes(qLower) ||
        (t.reason || '').toLowerCase().includes(qLower) ||
        (t.itemDescription || '').toLowerCase().includes(qLower)
      );
    });

    return {
      cases,
      evidence,
      documents,
      transfers,
      totalMatches: cases.length + evidence.length + documents.length + transfers.length
    };
  }, [allDataset, query, user, permVersion]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim()) {
      setSearchParams({ q: val.trim() }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const handleFormSubmit = (e) => {
    e?.preventDefault?.();
    const cleanQ = query.trim();
    if (cleanQ) {
      setSearchParams({ q: cleanQ });
    } else {
      setSearchParams({});
    }
  };

  const handleQuickTagClick = (tag) => {
    setQuery(tag);
    setSearchParams({ q: tag });
  };

  const clearSearch = () => {
    setQuery('');
    setSearchParams({});
  };

  const activeTabClass = (tab) => 
    domainFilter === tab
      ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 font-semibold'
      : 'bg-[#141829] text-slate-400 hover:text-white hover:bg-[#1C223A] border border-white/[0.04]';

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3 h-3 text-cyan-400" />
              <span>Federated Intelligence Search</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Clearance: <span className="text-amber-400 font-bold">{user?.clearance || 'TOP_SECRET'}</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Search className="w-6 h-6 text-violet-400" />
            <span>Unified Case & Evidence Intelligence Search</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Cross-domain real-time query across case dossiers, FIR numbers, evidence barcodes, sealed vault documents, and custody handovers.
          </p>
        </div>
      </div>

      {/* Main Search Query Box Card */}
      <form onSubmit={handleFormSubmit} className="obsidian-card p-5 rounded-3xl space-y-4 border border-white/10 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="Search by FIR number, case title, barcode (e.g. EVD-), SHA-256 hash, officer name, or keyword..."
              className="w-full pl-10 pr-10 py-3 bg-[#121524] border border-white/[0.08] hover:border-white/[0.18] focus:border-violet-500 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none transition shadow-inner font-sans"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition p-0.5 rounded-full hover:bg-white/10"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold uppercase tracking-wider transition shadow-lg shadow-violet-600/30 whitespace-nowrap flex items-center gap-2 cursor-pointer w-full md:w-auto justify-center"
            >
              <Sparkles className="w-4 h-4 text-violet-200" />
              <span>Execute Search</span>
            </button>
          </div>
        </div>

        {/* Domain Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/[0.05]">
          <span className="text-[11px] font-mono text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-500" />
            Filter Domain:
          </span>
          <button
            type="button"
            onClick={() => setDomainFilter('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-mono transition flex items-center gap-1.5 cursor-pointer ${activeTabClass('ALL')}`}
          >
            <Layers className="w-3 h-3" />
            <span>ALL DOMAINS ({results.totalMatches})</span>
          </button>
          <button
            type="button"
            onClick={() => setDomainFilter('CASES')}
            className={`px-3 py-1 rounded-xl text-xs font-mono transition flex items-center gap-1.5 cursor-pointer ${activeTabClass('CASES')}`}
          >
            <Briefcase className="w-3 h-3" />
            <span>CASES ({results.cases.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setDomainFilter('EVIDENCE')}
            className={`px-3 py-1 rounded-xl text-xs font-mono transition flex items-center gap-1.5 cursor-pointer ${activeTabClass('EVIDENCE')}`}
          >
            <Package className="w-3 h-3" />
            <span>EVIDENCE ({results.evidence.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setDomainFilter('DOCUMENTS')}
            className={`px-3 py-1 rounded-xl text-xs font-mono transition flex items-center gap-1.5 cursor-pointer ${activeTabClass('DOCUMENTS')}`}
          >
            <FileText className="w-3 h-3" />
            <span>VAULT DOCUMENTS ({results.documents.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setDomainFilter('CUSTODY')}
            className={`px-3 py-1 rounded-xl text-xs font-mono transition flex items-center gap-1.5 cursor-pointer ${activeTabClass('CUSTODY')}`}
          >
            <GitCommit className="w-3 h-3" />
            <span>CUSTODY ({results.transfers.length})</span>
          </button>
        </div>

        {/* Quick Search Tag Suggestions */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono text-slate-400">
          <span className="text-slate-500">Quick Searches:</span>
          {['CASE-2026-001', 'FIR-2026-0981', 'EVD-2026-001-A', 'SCADA', 'Cyber', 'NVMe', 'TOP_SECRET'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleQuickTagClick(tag)}
              className={`px-2.5 py-1 rounded-lg text-slate-300 hover:text-violet-200 border border-white/[0.06] transition cursor-pointer ${
                query.toLowerCase() === tag.toLowerCase() ? 'bg-violet-600/40 border-violet-500/50 text-white font-bold' : 'bg-[#141829] hover:bg-violet-600/20'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </form>

      {/* Results Header Bar */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-white/[0.08] pb-3">
        <span className="flex items-center gap-2">
          {query.trim() ? (
            <>Instant Intelligence Matches for: <span className="text-violet-300 font-bold bg-violet-500/20 px-2 py-0.5 rounded-md border border-violet-500/30">"{query.trim()}"</span></>
          ) : (
            <>All Active Intelligence Repository Records</>
          )}
        </span>
        <span className="px-3 py-1 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-bold">
          {results.totalMatches} records found
        </span>
      </div>

      {/* 1. Case Dossiers Section */}
      {(domainFilter === 'ALL' || domainFilter === 'CASES') && results.cases.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-violet-400" />
              <span>Matching Case Dossiers ({results.cases.length})</span>
            </h3>
            <Link to="/cases" className="text-[11px] font-mono text-violet-400 hover:text-violet-300 flex items-center gap-1">
              <span>View All Cases</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.cases.map((c) => (
              <div
                key={c.id || c.caseNumber}
                className="obsidian-card p-5 rounded-3xl space-y-3.5 border border-white/[0.08] hover:border-violet-500/40 transition group flex flex-col justify-between shadow-lg"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-violet-400 group-hover:text-violet-300">
                      {c.caseNumber}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                      {c.classification || 'SECRET'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-violet-200 transition">
                    {c.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                  <div className="p-3 rounded-2xl bg-[#121524] border border-white/[0.04] text-[10px] font-mono text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">FIR:</span>
                      <span className="text-slate-200 font-bold">{c.firNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Agency:</span>
                      <span className="text-slate-300 truncate max-w-[180px]">{c.investigatingAgency || 'CCB'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <span className="text-emerald-400 font-semibold">{c.status}</span>
                    </div>
                  </div>
                </div>
                <Link
                  to={`/cases/${c.id}`}
                  className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400 group-hover:text-white transition"
                >
                  <span className="font-semibold text-violet-400 group-hover:text-violet-300">Inspect Dossier</span>
                  <ArrowUpRight className="w-4 h-4 text-violet-400 group-hover:text-violet-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Evidence Artifacts Section */}
      {(domainFilter === 'ALL' || domainFilter === 'EVIDENCE') && results.evidence.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>Matching Registered Evidence Artifacts ({results.evidence.length})</span>
            </h3>
            <Link to="/evidence" className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              <span>Open Evidence Locker</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.evidence.map((ev) => (
              <div
                key={ev.id || ev.barcode}
                className="obsidian-card p-5 rounded-3xl space-y-3 border border-white/[0.08] hover:border-emerald-500/40 transition flex flex-col justify-between shadow-lg"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {ev.barcode}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      {ev.status || 'IN_CUSTODY'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white">
                    {ev.description}
                  </h4>
                  <div className="p-3 rounded-2xl bg-[#121524] border border-white/[0.04] text-[10px] font-mono text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Case Link:</span>
                      <span className="text-violet-300 font-bold">{ev.caseNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Category:</span>
                      <span className="text-slate-200">{ev.itemCategory}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Location:</span>
                      <span className="text-slate-200">{ev.storageLocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Custodian:</span>
                      <span className="text-amber-300 font-semibold">{ev.currentCustodian}</span>
                    </div>
                  </div>
                </div>
                <Link
                  to="/evidence"
                  className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400 hover:text-emerald-300 transition"
                >
                  <span className="font-semibold text-emerald-400">Open Evidence Locker</span>
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Vault Documents Section */}
      {(domainFilter === 'ALL' || domainFilter === 'DOCUMENTS') && results.documents.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Matching Vault Documents ({results.documents.length})</span>
            </h3>
            <Link to="/documents" className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              <span>Open Document Vault</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {results.documents.map((doc) => (
              <div
                key={doc.id || doc.title}
                className="obsidian-card p-4 rounded-3xl space-y-2 border border-white/[0.08] hover:border-cyan-500/40 transition shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{doc.title}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                    {doc.classification || 'CONFIDENTIAL'}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 space-y-0.5">
                  <div>Associated Case: <span className="text-violet-300 font-bold">{doc.caseNumber}</span></div>
                  <div>Filename: <span className="text-slate-200">{doc.originalFilename}</span></div>
                  <div className="truncate">SHA-256 Seal: <span className="text-cyan-400">{doc.sha256Hash}</span></div>
                </div>
                <Link
                  to="/documents"
                  className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400 hover:text-cyan-300 transition"
                >
                  <span className="font-semibold text-cyan-400">Open in Document Vault</span>
                  <ArrowUpRight className="w-4 h-4 text-cyan-400" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Custody Handover Logs Section */}
      {(domainFilter === 'ALL' || domainFilter === 'CUSTODY') && results.transfers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-amber-400" />
              <span>Matching Custody Handover Logs ({results.transfers.length})</span>
            </h3>
            <Link to="/custody" className="text-[11px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1">
              <span>View Custody Timeline</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {results.transfers.map((tr) => (
              <div
                key={tr.id || tr.transferId}
                className="obsidian-card p-4 rounded-3xl space-y-2 border border-white/[0.08] hover:border-amber-500/40 transition shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-400">{tr.transferId}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    {tr.status}
                  </span>
                </div>
                <p className="text-xs text-slate-200">
                  Evidence: <span className="font-mono text-emerald-300 font-bold">{tr.evidenceBarcode}</span> ({tr.itemDescription || 'Digital Artifact'})
                </p>
                <div className="text-[10px] font-mono text-slate-400 space-y-0.5">
                  <div>From: <span className="text-slate-300">{tr.fromOfficer || 'Evidence Custodian'}</span> ➔ To: <span className="text-violet-300 font-bold">{tr.toOfficer}</span></div>
                  <div>Reason: <span className="text-slate-200">{tr.reason}</span></div>
                </div>
                <Link
                  to="/custody"
                  className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400 hover:text-amber-300 transition"
                >
                  <span className="font-semibold text-amber-400">Inspect Chain of Custody</span>
                  <ArrowUpRight className="w-4 h-4 text-amber-400" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Zero Results State */}
      {results.totalMatches === 0 && (
        <div className="obsidian-card p-12 text-center text-slate-400 space-y-4 rounded-3xl border border-dashed border-white/[0.12] shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto text-slate-500">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">No Matching Intelligence Records</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              No case dossiers, evidence barcodes, or vault documents matched <span className="text-violet-400 font-mono font-bold">"{query}"</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={clearSearch}
            className="px-5 py-2.5 rounded-2xl bg-violet-600/20 hover:bg-violet-600/30 text-xs font-semibold text-violet-300 border border-violet-500/30 transition cursor-pointer"
          >
            Clear Search & Show All Records
          </button>
        </div>
      )}
    </div>
  );
};

export default GlobalSearchPage;
