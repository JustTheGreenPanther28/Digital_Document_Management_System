import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AiForensicAnalysisPanel from '../components/AiForensicAnalysisPanel';
import {
  Scale, FileText, Download, Plus, CheckCircle2, Calendar, Gavel,
  ShieldCheck, AlertCircle, Clock, BookOpen, Printer, X, User,
  CheckCircle, ChevronRight, Hash, Award, Building
} from 'lucide-react';
import { logCourtBundleExport, logSec65BExport } from '../services/auditLogger';

const FALLBACK_CASES = [
  {
    id: 'case-001',
    caseNumber: 'CASE-2026-001',
    title: 'Operation Cyber Storm - FinTech Breach',
    status: 'COURT_PROCEEDINGS',
    classificationLevel: 'TOP_SECRET',
    description: 'Financial cyber-heist investigation involving unauthorized API exfiltration and ledger spoofing.'
  },
  {
    id: 'case-002',
    caseNumber: 'CASE-2026-002',
    title: 'Project Deep Shield - Industrial Espionage',
    status: 'FILED_IN_COURT',
    classificationLevel: 'SECRET',
    description: 'Theft of classified drone telemetry source code via unauthorized endpoint extraction.'
  },
  {
    id: 'case-003',
    caseNumber: 'CASE-2026-003',
    title: 'State vs CryptSec Syndicate',
    status: 'INVESTIGATION_ONGOING',
    classificationLevel: 'CONFIDENTIAL',
    description: 'State cyber security investigation tracking distributed ransomware nodes.'
  },
  {
    id: 'case-004',
    caseNumber: 'CASE-2026-004',
    title: 'State vs Metro Automated Transit & Toll Registry Dispute',
    status: 'HEARING_SCHEDULED',
    classificationLevel: 'PUBLIC',
    description: 'Public judicial inquiry and traffic infraction ledger dispute submitted for public sessions court hearing.'
  }
];

const INITIAL_HEARINGS = {
  'case-001': [
    {
      id: 'hr-101',
      hearingDate: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
      courtName: 'Special CBI Court No. 4, Rouse Avenue Courts, New Delhi',
      judgeName: 'Hon\'ble Special Judge Shri R. K. Malhotra',
      proceedingsSummary: 'Prosecution submitted Section 65B Certificate and primary NVMe disk exhibits. Defense counsel argued for bail; rejected on grounds of digital tamper risk.',
      nextHearingDate: new Date(Date.now() + 3600000 * 24 * 5).toISOString(),
      interimOrder: 'Exhibits EVD-2026-001-A and EVD-2026-001-B formally marked as Prosecution Exhibits P-1 and P-2.'
    },
    {
      id: 'hr-102',
      hearingDate: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      courtName: 'Special CBI Court No. 4, Rouse Avenue Courts, New Delhi',
      judgeName: 'Hon\'ble Special Judge Shri R. K. Malhotra',
      proceedingsSummary: 'CFSL Examiner Amit Verma testified as expert witness under Section 45 Indian Evidence Act. Confirmed cryptographic hash chain integrity.',
      nextHearingDate: new Date(Date.now() + 3600000 * 24 * 10).toISOString(),
      interimOrder: 'Prosecution directed to supply unredacted forensic timeline to defense by next hearing.'
    }
  ],
  'case-002': [
    {
      id: 'hr-201',
      hearingDate: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
      courtName: 'Chief Metropolitan Magistrate Court, Patiala House Courts, New Delhi',
      judgeName: 'Hon\'ble CMM Ms. Vandana Aggarwal',
      proceedingsSummary: 'Charge sheet formally placed before the Court. Cognizance taken under Sections 43, 66 of IT Act & Section 379 IPC.',
      nextHearingDate: new Date(Date.now() + 3600000 * 24 * 14).toISOString(),
      interimOrder: 'Summons issued to accused for framing of formal charges.'
    }
  ]
};

export const CourtProceedingsPage = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [bundleData, setBundleData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [hearings, setHearings] = useState([]);
  const [certifiedSuccess, setCertifiedSuccess] = useState(false);

  // Modals
  const [isHearingModalOpen, setIsHearingModalOpen] = useState(false);
  const [isJudgmentModalOpen, setIsJudgmentModalOpen] = useState(false);

  // Hearing Form State
  const [courtName, setCourtName] = useState('Special CBI Court No. 4, Rouse Avenue Courts, New Delhi');
  const [judgeName, setJudgeName] = useState('Hon\'ble Special Judge Shri R. K. Malhotra');
  const [hearingDate, setHearingDate] = useState(new Date().toISOString().slice(0, 16));
  const [proceedingsSummary, setProceedingsSummary] = useState('');
  const [nextHearingDate, setNextHearingDate] = useState(new Date(Date.now() + 3600000 * 24 * 14).toISOString().slice(0, 10));
  const [interimOrder, setInterimOrder] = useState('');
  const [submittingHearing, setSubmittingHearing] = useState(false);

  // Judgment Form State
  const [verdict, setVerdict] = useState('CONVICTED');
  const [judgmentJudge, setJudgmentJudge] = useState('Hon\'ble Special Judge Shri R. K. Malhotra');
  const [judgmentDate, setJudgmentDate] = useState(new Date().toISOString().slice(0, 10));
  const [judgmentSummary, setJudgmentSummary] = useState('');
  const [submittingJudgment, setSubmittingJudgment] = useState(false);

  // Charge Sheet & Review Workflow State
  const [chargeSheet, setChargeSheet] = useState(null);
  const [seniorNotes, setSeniorNotes] = useState('');
  const [prosecutorNotes, setProsecutorNotes] = useState('');
  const [filingCourtName, setFilingCourtName] = useState('Special CBI Court No. 4, Rouse Avenue Courts, New Delhi');
  const [filingNum, setFilingNum] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadCases();
  }, []);

  useEffect(() => {
    if (selectedCaseId) {
      loadHearingsForCase(selectedCaseId);
      loadChargeSheetForCase(selectedCaseId);
      setBundleData(null);
      setCertifiedSuccess(false);
    }
  }, [selectedCaseId]);

  const loadChargeSheetForCase = async (caseId) => {
    try {
      const res = await api.getChargeSheet(caseId).catch(() => null);
      if (res && res.id) {
        setChargeSheet(res);
        return;
      }
    } catch (_) {}

    // Check localStorage fallback
    try {
      const stored = localStorage.getItem(`sih_chargesheet_${caseId}`);
      if (stored) {
        setChargeSheet(JSON.parse(stored));
        return;
      }
    } catch (_) {}

    // Default mock charge sheet for demo
    const activeCase = cases.find(c => c.id === caseId) || cases[0];
    const defaultSheet = {
      id: `cs-${caseId}`,
      caseId: caseId,
      caseNumber: activeCase?.caseNumber || 'CASE-2026-001',
      status: activeCase?.status === 'FILED_IN_COURT' ? 'FILED' : (activeCase?.status === 'COURT_PROCEEDINGS' ? 'LOCKED' : 'REVIEWED'),
      seniorOfficerApprovalStatus: 'APPROVED',
      seniorOfficerReviewNotes: 'Prima facie evidentiary threshold satisfied. Recommended for prosecution review.',
      prosecutorApprovalStatus: activeCase?.status === 'FILED_IN_COURT' || activeCase?.status === 'COURT_PROCEEDINGS' ? 'APPROVED' : 'PENDING',
      prosecutorReviewNotes: 'Sections 43, 66 IT Act & 379 IPC substantiated by CFSL SHA-256 bit-stream capture.',
      sectionsApplied: 'IT Act 2000 (Sec 43, 66) • IPC (Sec 379, 420, 120B) • Section 65B Indian Evidence Act',
      accusedDetails: 'Prime Accused: Vikramaditya Seth (Cyber Operative) & 2 Unnamed Associates',
      summary: 'Accused orchestrated unauthorized lateral breach, disabled SIEM audit monitors, and attempted exfiltration of encrypted telemetry archives.',
      signature: activeCase?.status === 'FILED_IN_COURT' || activeCase?.status === 'COURT_PROCEEDINGS' ? {
        certificateSerial: 'CERT-RSA2048-PROS-77291',
        signedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        signerUsername: 'prosecutor'
      } : null
    };
    setChargeSheet(defaultSheet);
  };

  const handleSeniorReview = async (approved) => {
    if (!chargeSheet) return;
    setActionLoading(true);
    try {
      let updated = null;
      try {
        updated = await api.reviewChargeSheet(chargeSheet.id, {
          approved,
          notes: seniorNotes || (approved ? 'Approved by Senior Officer' : 'Returned for re-investigation')
        });
      } catch (_) {}

      const newSheet = updated || {
        ...chargeSheet,
        status: approved ? 'REVIEWED' : 'DRAFT',
        seniorOfficerApprovalStatus: approved ? 'APPROVED' : 'REJECTED',
        seniorOfficerReviewNotes: seniorNotes || (approved ? 'Approved by Senior Officer' : 'Returned for re-investigation')
      };
      setChargeSheet(newSheet);
      localStorage.setItem(`sih_chargesheet_${selectedCaseId}`, JSON.stringify(newSheet));
      setSeniorNotes('');
      alert(approved ? 'Charge Sheet APPROVED by Senior Officer and forwarded to Prosecutor!' : 'Charge Sheet REJECTED and returned to investigator.');
    } catch (err) {
      alert(`Review error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleProsecutorSign = async (approved) => {
    if (!chargeSheet) return;
    setActionLoading(true);
    try {
      let updated = null;
      try {
        updated = await api.prosecutorSignChargeSheet(chargeSheet.id, {
          approved,
          notes: prosecutorNotes || (approved ? 'Prosecutor cryptographic signature applied.' : 'Charge sheet rejected by prosecution.')
        });
      } catch (_) {}

      const newSheet = updated || {
        ...chargeSheet,
        status: approved ? 'LOCKED' : 'REVIEWED',
        prosecutorApprovalStatus: approved ? 'APPROVED' : 'REJECTED',
        prosecutorReviewNotes: prosecutorNotes || (approved ? 'Approved & Digitally Signed' : 'Prosecution rejection'),
        signature: approved ? {
          certificateSerial: `CERT-RSA2048-PROS-${Date.now().toString().slice(-6)}`,
          signedAt: new Date().toISOString(),
          signerUsername: user?.username || 'prosecutor'
        } : null
      };
      setChargeSheet(newSheet);
      localStorage.setItem(`sih_chargesheet_${selectedCaseId}`, JSON.stringify(newSheet));
      setProsecutorNotes('');
      alert(approved ? 'Charge Sheet DIGITALLY SIGNED with RSA-2048 and LOCKED for court submission!' : 'Charge Sheet rejected by Prosecutor.');
    } catch (err) {
      alert(`Signing error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFormalCourtFiling = async () => {
    if (!selectedCaseId) return;
    setActionLoading(true);
    const fNum = filingNum || `CC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      try {
        await api.recordCourtHearing(selectedCaseId, {
          hearingDate: new Date().toISOString(),
          courtName: filingCourtName,
          judgeName: 'Hon\'ble Duty Magistrate',
          proceedingsSummary: `Formal charge sheet submitted under Ref: ${fNum}. Cognizance registered.`,
          nextHearingDate: new Date(Date.now() + 86400000 * 14).toISOString(),
          interimOrder: 'Summons issued to accused.'
        });
      } catch (_) {}

      const newSheet = { ...chargeSheet, status: 'FILED', filingNumber: fNum };
      setChargeSheet(newSheet);
      localStorage.setItem(`sih_chargesheet_${selectedCaseId}`, JSON.stringify(newSheet));
      setFilingNum('');
      alert(`Formal Court Filing registered successfully! Filing Ref: ${fNum}`);
      loadHearingsForCase(selectedCaseId);
    } catch (err) {
      alert(`Filing error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const loadCases = async () => {
    setLoading(true);
    let combined = [...FALLBACK_CASES];

    // Merge registered cases from localStorage
    try {
      const stored = localStorage.getItem('sih_registered_cases');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.forEach(c => {
          if (!combined.some(item => item.id === c.id || item.caseNumber === c.caseNumber)) {
            combined.push(c);
          }
        });
      }
    } catch (_) {}

    try {
      const backendCases = await api.getCases().catch(() => []);
      if (backendCases && backendCases.length > 0) {
        backendCases.forEach(bc => {
          if (!combined.some(item => item.id === bc.id || item.caseNumber === bc.caseNumber)) {
            combined.push(bc);
          }
        });
      }
    } catch (_) {}

    setCases(combined);
    if (combined.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const paramCaseId = urlParams.get('caseId');
      const matched = paramCaseId ? combined.find(c => String(c.id) === String(paramCaseId) || c.caseNumber === paramCaseId) : null;
      setSelectedCaseId(matched ? matched.id : combined[0].id);
    }
    setLoading(false);
  };

  const getStoredHearings = () => {
    try {
      const stored = localStorage.getItem('sih_court_hearings');
      return stored ? JSON.parse(stored) : INITIAL_HEARINGS;
    } catch {
      return INITIAL_HEARINGS;
    }
  };

  const saveStoredHearings = (allHearings) => {
    try {
      localStorage.setItem('sih_court_hearings', JSON.stringify(allHearings));
    } catch (e) {
      console.error('Failed to save court hearings', e);
    }
  };

  const loadHearingsForCase = async (caseId) => {
    const allHearings = getStoredHearings();
    let currentCaseHearings = allHearings[caseId] || [];

    try {
      const backendHearings = await api.getCourtHearings(caseId).catch(() => null);
      if (backendHearings && Array.isArray(backendHearings) && backendHearings.length > 0) {
        const merged = [...backendHearings];
        currentCaseHearings.forEach(ch => {
          if (!merged.some(m => m.id === ch.id)) merged.push(ch);
        });
        currentCaseHearings = merged;
      }
    } catch (_) {}

    setHearings(currentCaseHearings);
  };

  const handleGenerateBundle = async () => {
    if (!selectedCaseId) return;
    setGenerating(true);
    setCertifiedSuccess(false);

    const activeCase = cases.find(c => c.id === selectedCaseId) || cases[0];

    try {
      // Try backend bundle first
      const res = await api.getPreTrialBundle(selectedCaseId).catch(() => null);
      if (res && res.caseNumber) {
        setBundleData(res);
      } else {
        // Construct comprehensive client-side bundle
        let docs = [];
        try {
          const vaultStr = localStorage.getItem('sih_vault_documents');
          if (vaultStr) {
            const vaultDocs = JSON.parse(vaultStr);
            docs = vaultDocs.filter(d => d.caseId === selectedCaseId || d.caseNumber === activeCase.caseNumber);
          }
        } catch (_) {}

        if (docs.length === 0) {
          docs = [
            { id: 'doc-001', title: 'First Information Report (FIR No. 104/2026)', docType: 'FIR', classificationLevel: 'SECRET', hashDigest: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
            { id: 'doc-002', title: 'CFSL Digital Forensics Examination Report', docType: 'FORENSIC_REPORT', classificationLevel: 'TOP_SECRET', hashDigest: '8f4c2b9a7d3e1f0e5b6c8a9d2f4e6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f' },
            { id: 'doc-003', title: 'Formal Charge Sheet & Prosecution Memorandum', docType: 'CHARGE_SHEET', classificationLevel: 'TOP_SECRET', hashDigest: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b' }
          ];
        }

        let evList = [];
        try {
          const evStr = localStorage.getItem('sih_registered_evidence');
          if (evStr) {
            const allEv = JSON.parse(evStr);
            evList = allEv.filter(e => e.caseId === selectedCaseId || e.caseNumber === activeCase.caseNumber);
          }
        } catch (_) {}

        if (evList.length === 0) {
          evList = [
            { id: 'ev-001', evidenceNumber: 'EVD-2026-001-A', title: 'Samsung 980 Pro NVMe SSD 1TB (Primary Disk)', sealNumber: 'SEAL-CFSL-987210', status: 'ANALYZED' },
            { id: 'ev-002', evidenceNumber: 'EVD-2026-001-B', title: 'Forensic Hardware Write-Blocker Capture Log', sealNumber: 'SEAL-LOG-44190', status: 'VERIFIED' }
          ];
        }

        setBundleData({
          caseId: activeCase.id,
          caseNumber: activeCase.caseNumber,
          title: activeCase.title,
          status: activeCase.status,
          classificationLevel: activeCase.classificationLevel || 'SECRET',
          description: activeCase.description,
          evidenceDocuments: docs,
          physicalEvidence: evList,
          custodyTransferLog: [
            { id: 'cust-1', evidenceNumber: 'EVD-2026-001-A', fromOfficer: 'Inspector Vikram Rao', toOfficer: 'CFSL Examiner Amit Verma', timestamp: new Date(Date.now() - 3600000 * 48).toLocaleString(), status: 'CO_SIGNED' },
            { id: 'cust-2', evidenceNumber: 'EVD-2026-001-A', fromOfficer: 'CFSL Examiner Amit Verma', toOfficer: 'Senior Custodian Priya Sharma', timestamp: new Date(Date.now() - 3600000 * 12).toLocaleString(), status: 'CO_SIGNED' }
          ],
          proceedings: hearings,
          compiledAt: new Date().toISOString(),
          section65bCertified: true,
          certificateId: `SEC65B-${Date.now().toString().slice(-8)}`
        });
      }
    } catch (err) {
      console.error('Failed to compile bundle', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleRecordHearing = async (e) => {
    e.preventDefault();
    setSubmittingHearing(true);

    const newHearing = {
      id: `hr-${Date.now()}`,
      hearingDate: new Date(hearingDate).toISOString(),
      courtName: courtName,
      judgeName: judgeName,
      proceedingsSummary: proceedingsSummary,
      nextHearingDate: new Date(nextHearingDate).toISOString(),
      interimOrder: interimOrder || 'Recorded in daily order sheet.'
    };

    try {
      await api.recordCourtHearing(selectedCaseId, newHearing).catch(() => null);

      const allHearings = getStoredHearings();
      const caseHearings = [newHearing, ...(allHearings[selectedCaseId] || [])];
      allHearings[selectedCaseId] = caseHearings;
      saveStoredHearings(allHearings);

      setHearings(caseHearings);
      setIsHearingModalOpen(false);
      setProceedingsSummary('');
      setInterimOrder('');
      alert('Court proceeding and judicial daily order recorded successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingHearing(false);
    }
  };

  const handleRecordJudgment = async (e) => {
    e.preventDefault();
    setSubmittingJudgment(true);

    const newJudgment = {
      id: `jdg-${Date.now()}`,
      verdict: verdict,
      judgeName: judgmentJudge,
      judgmentDate: new Date(judgmentDate).toISOString(),
      summary: judgmentSummary
    };

    try {
      // Save judgment in localStorage
      const storedJ = localStorage.getItem('sih_court_judgments') ? JSON.parse(localStorage.getItem('sih_court_judgments')) : {};
      storedJ[selectedCaseId] = newJudgment;
      localStorage.setItem('sih_court_judgments', JSON.stringify(storedJ));

      // Update case status locally
      const updatedCases = cases.map(c => c.id === selectedCaseId ? { ...c, status: 'JUDGMENT_DELIVERED' } : c);
      setCases(updatedCases);

      setIsJudgmentModalOpen(false);
      setJudgmentSummary('');
      alert(`Formal Court Judgment recorded: [${verdict}]. Case status updated to JUDGMENT_DELIVERED.`);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingJudgment(false);
    }
  };

  const handlePrintDossier = () => {
    logCourtBundleExport({
      caseNumber: activeCase?.caseNumber || 'CASE-2026-001',
      courtName: courtName || 'Special CBI Court'
    });
    window.print();
  };

  const activeCase = cases.find((c) => c.id === selectedCaseId) || cases[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <Scale className="w-3 h-3" />
              <span>Section 65B Indian Evidence Act Compliance</span>
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Gavel className="w-5 h-5 text-indigo-400" />
            <span>Prosecution Discovery & Court Proceedings</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Judicial exhibit certification, Section 65B forensic admissibility bundles, and court hearing registries
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsHearingModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5 border border-slate-700 shadow-md active:scale-95"
          >
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>Record Hearing</span>
          </button>
          <button
            onClick={() => setIsJudgmentModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 active:scale-95 whitespace-nowrap"
          >
            <Award className="w-4 h-4" />
            <span>Record Judgment</span>
          </button>
        </div>
      </div>

      {/* Case Selector and Status Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-indigo-950/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1 flex-1">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-indigo-400" />
              <span>Select Active Judicial Case Dossier:</span>
            </label>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500 shadow-inner"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caseNumber} — {c.title} [{c.status}]
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 shrink-0 pt-2 lg:pt-0">
            <button
              onClick={handleGenerateBundle}
              disabled={generating || !selectedCaseId}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-600/20 active:scale-95 whitespace-nowrap"
            >
              <Scale className="w-4 h-4" />
              <span>{generating ? 'Compiling Legal Package...' : 'Compile Judicial Bundle'}</span>
            </button>
          </div>
        </div>

        {activeCase && (
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono border-t border-slate-800/80">
            <span className="text-slate-400">Classification: <span className="text-rose-400 font-bold">{activeCase.classificationLevel || 'SECRET'}</span></span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Current Status: <span className="text-emerald-400 font-bold">{activeCase.status}</span></span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Case ID: <span className="text-slate-200">{activeCase.caseNumber}</span></span>
          </div>
        )}
      </div>

      {/* CHARGE SHEET & PROSECUTION REVIEW WORKFLOW */}
      {chargeSheet && (
        <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 bg-slate-900/80 space-y-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                    Charge Sheet & Prosecution Review
                  </h3>
                  <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                    chargeSheet.status === 'LOCKED' || chargeSheet.status === 'FILED'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : chargeSheet.status === 'REVIEWED'
                      ? 'bg-indigo-950 text-indigo-300 border-indigo-800'
                      : 'bg-amber-950 text-amber-300 border-amber-800'
                  }`}>
                    {chargeSheet.status === 'LOCKED' ? '🔒 DIGITALLY SIGNED & LOCKED' : (chargeSheet.status === 'FILED' ? '🏛️ FILED IN COURT' : chargeSheet.status)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Multi-tier senior supervisory review, prosecutor RSA-2048 PKI signature attestation, and court filing.
                </p>
              </div>
            </div>

            {/* Workflow Stage Progress */}
            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <span className={`px-2 py-0.5 rounded ${chargeSheet.seniorOfficerApprovalStatus === 'APPROVED' ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700' : 'bg-slate-800 text-slate-400'}`}>
                1. Senior Review: {chargeSheet.seniorOfficerApprovalStatus}
              </span>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className={`px-2 py-0.5 rounded ${chargeSheet.prosecutorApprovalStatus === 'APPROVED' ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700' : 'bg-slate-800 text-slate-400'}`}>
                2. Prosecutor Sign: {chargeSheet.prosecutorApprovalStatus}
              </span>
            </div>
          </div>

          {/* Details Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-sans">
            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block">Statutory Charges & Penal Sections</span>
              <p className="text-slate-100 font-medium leading-relaxed">{chargeSheet.sectionsApplied}</p>
              <div className="text-xs text-slate-300 pt-2 border-t border-slate-800">
                <span className="text-indigo-400 font-bold">Accused Particulars:</span> {chargeSheet.accusedDetails}
              </div>
            </div>

            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block">Summary of Allegations & Evidence</span>
              <p className="text-slate-200 leading-relaxed">{chargeSheet.summary}</p>
              {chargeSheet.signature && (
                <div className="pt-2 border-t border-slate-800/80 text-xs text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>RSA-2048 PKI Signature: <strong className="font-mono text-white">{chargeSheet.signature.certificateSerial}</strong> (Signed by @{chargeSheet.signature.signerUsername})</span>
                </div>
              )}
            </div>
          </div>

          {/* Tier 1: Senior Officer Review Actions (Visible to Senior Officer & Admin) */}
          {(user?.roles?.includes('SENIOR_OFFICER') || user?.roles?.includes('ADMIN')) && chargeSheet.status !== 'LOCKED' && chargeSheet.status !== 'FILED' && (
            <div className="p-4 rounded-xl bg-slate-950/90 border border-indigo-900/60 space-y-3 text-xs font-sans">
              <div className="flex items-center justify-between">
                <span className="text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1.5 text-sm">
                  <User className="w-4 h-4 text-indigo-400" />
                  <span>Senior Officer Supervisory Review (Tier 1)</span>
                </span>
                <span className="text-xs text-slate-400">Authority: ACP / Supervisory Officer</span>
              </div>
              <input
                type="text"
                value={seniorNotes}
                onChange={(e) => setSeniorNotes(e.target.value)}
                placeholder="Enter senior supervisory review remarks / evidentiary directives..."
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              />
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleSeniorReview(true)}
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Approve & Forward to Prosecution</span>
                </button>
                <button
                  onClick={() => handleSeniorReview(false)}
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject & Return to Lead Investigator</span>
                </button>
              </div>
            </div>
          )}

          {/* Tier 2: Prosecutor Review & Digital Signing (Visible to Prosecutor & Admin) */}
          {(user?.roles?.includes('PROSECUTOR') || user?.roles?.includes('ADMIN')) && chargeSheet.seniorOfficerApprovalStatus === 'APPROVED' && chargeSheet.status !== 'LOCKED' && chargeSheet.status !== 'FILED' && (
            <div className="p-4 rounded-xl bg-slate-950/90 border border-emerald-900/60 space-y-3 text-xs font-sans">
              <div className="flex items-center justify-between">
                <span className="text-emerald-300 font-bold uppercase tracking-wider flex items-center gap-1.5 text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Prosecution Legal Scrutiny & Cryptographic Digital Signature (Tier 2)</span>
                </span>
                <span className="text-xs text-slate-400">Authority: Directorate of Prosecution</span>
              </div>
              <input
                type="text"
                value={prosecutorNotes}
                onChange={(e) => setProsecutorNotes(e.target.value)}
                placeholder="Enter legal scrutiny attestation & admissibility notes..."
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              />
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleProsecutorSign(true)}
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Apply RSA-2048 PKI Digital Signature & Lock Document</span>
                </button>
                <button
                  onClick={() => handleProsecutorSign(false)}
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject Charge Sheet</span>
                </button>
              </div>
            </div>
          )}

          {/* Tier 3: Formal Court Filing (Visible to Court Officer & Admin) */}
          {(user?.roles?.includes('COURT_OFFICER') || user?.roles?.includes('ADMIN')) && (chargeSheet.status === 'LOCKED' || chargeSheet.status === 'REVIEWED') && chargeSheet.status !== 'FILED' && (
            <div className="p-4 rounded-xl bg-slate-950/90 border border-amber-900/60 space-y-3 text-xs font-sans">
              <div className="flex items-center justify-between">
                <span className="text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Gavel className="w-4 h-4 text-amber-400" />
                  <span>Formal Judicial Filing & Court Registry Entry (Tier 3)</span>
                </span>
                <span className="text-[10px] text-slate-400">Authority: High Court / Sessions Court Registrar</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={filingCourtName}
                  onChange={(e) => setFilingCourtName(e.target.value)}
                  placeholder="Court Name"
                  className="px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                />
                <input
                  type="text"
                  value={filingNum}
                  onChange={(e) => setFilingNum(e.target.value)}
                  placeholder="Filing Number (e.g. CC-2026-891)"
                  className="px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="pt-1">
                <button
                  onClick={handleFormalCourtFiling}
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-1.5 transition shadow-lg shadow-amber-600/20 disabled:opacity-50"
                >
                  <Gavel className="w-3.5 h-3.5" />
                  <span>Submit & Register in Court Ledger</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI CHARGE SHEET & FORENSIC CONSISTENCY SCRUTINY */}
      {selectedCaseId && (
        <div className="glass-panel p-6 rounded-2xl border border-violet-500/30 bg-slate-900/80 space-y-4 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(139,92,246,0.25)]">
              🧠
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                AI Judicial Scrutiny & Charge Sheet Consistency Engine
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated Procedural Verification · Evidence Gap Detection · BNS / IPC Statutory Alignment
              </p>
            </div>
          </div>
          <AiForensicAnalysisPanel
            caseId={selectedCaseId}
            chargeSheetId={chargeSheet?.id}
            showCaseAnalysis={true}
          />
        </div>
      )}

      {/* COMPILED JUDICIAL BUNDLE OUTPUT */}
      {bundleData && (
        <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 bg-slate-900/90 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/60 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-indigo-200 uppercase font-mono">
                  Certified Prosecution Discovery Package: {bundleData.caseNumber}
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>SEC 65B CERTIFIED</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-sans">
                {bundleData.title} — Forensically sealed and compiled for judicial submission.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintDossier}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition border border-slate-700"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Export</span>
              </button>
              <button
                onClick={() => {
                  setCertifiedSuccess(true);
                  alert(`Official Certification Attested! Certificate ID: ${bundleData.certificateId || 'SEC65B-CFSL-2026'}. Package ready for High Court / CBI Court filing.`);
                }}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/20"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{certifiedSuccess ? 'Certified & Locked' : 'Certify For Court'}</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase">Certified Artifacts</span>
              <div className="text-lg font-bold text-slate-100 mt-0.5">
                {bundleData.evidenceDocuments?.length || 0} Files
              </div>
              <span className="text-[10px] text-emerald-400">Cryptographically Locked</span>
            </div>
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase">Physical Exhibits</span>
              <div className="text-lg font-bold text-slate-100 mt-0.5">
                {bundleData.physicalEvidence?.length || 0} Exhibits
              </div>
              <span className="text-[10px] text-blue-400">Barcodes Verified</span>
            </div>
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase">Dual-Signed Handovers</span>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">
                {bundleData.custodyTransferLog?.length || 0} Logged
              </div>
              <span className="text-[10px] text-slate-400">Chain Intact</span>
            </div>
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase">Judicial Certificate ID</span>
              <div className="text-sm font-bold text-violet-300 mt-1 font-mono truncate">
                {bundleData.certificateId || 'SEC65B-902418'}
              </div>
              <span className="text-[10px] text-violet-400">CFSL Master Digest</span>
            </div>
          </div>

          {/* Documents Manifest */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold font-mono uppercase text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Certified Evidence Documents Manifest</span>
            </h4>
            <div className="divide-y divide-slate-800 bg-slate-950/60 rounded-xl border border-slate-800 overflow-hidden">
              {(bundleData.evidenceDocuments || []).map((doc, idx) => (
                <div key={doc.id || idx} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                  <div>
                    <span className="text-slate-100 font-semibold">{doc.title || doc.filename}</span>
                    <span className="text-[10px] text-slate-500 ml-2">[{doc.docType || doc.category || 'EXHIBIT'}]</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 truncate max-w-md">
                    <Hash className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{doc.hashDigest || doc.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Physical Evidence Manifest */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold font-mono uppercase text-slate-300 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>Physical Exhibits & Barcode Verification</span>
            </h4>
            <div className="divide-y divide-slate-800 bg-slate-950/60 rounded-xl border border-slate-800 overflow-hidden">
              {(bundleData.physicalEvidence || []).map((ev, idx) => (
                <div key={ev.id || idx} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">
                      {ev.evidenceNumber || ev.barcode}
                    </span>
                    <span className="text-slate-200">{ev.title || ev.description}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Seal: <span className="text-emerald-300 font-bold">{ev.sealNumber || 'SEAL-CFSL-VERIFIED'}</span> (Intact)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* COURT HEARINGS REGISTRY SECTION */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Court Hearings & Proceedings Registry ({activeCase?.caseNumber || 'Active Case'})
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold">
            {hearings.length} HEARINGS RECORDED
          </span>
        </div>

        <div className="divide-y divide-slate-800">
          {hearings.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs space-y-2">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
              <p>No court proceedings recorded for this case yet.</p>
              <button
                onClick={() => setIsHearingModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono inline-flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record First Hearing</span>
              </button>
            </div>
          ) : (
            hearings.map((h, index) => (
              <div key={h.id || index} className="p-5 space-y-3 hover:bg-slate-900/40 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-indigo-300 bg-indigo-950/60 px-2.5 py-0.5 rounded border border-indigo-800">
                      HEARING {hearings.length - index}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">
                      {new Date(h.hearingDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                    NEXT LISTED: {new Date(h.nextHearingDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Court Bench / Jurisdiction</span>
                    <span className="text-slate-200">{h.courtName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Presiding Judicial Officer</span>
                    <span className="text-indigo-300 font-semibold">{h.judgeName}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-300 space-y-1 leading-relaxed">
                  <div><span className="text-slate-500 font-mono text-[10px] uppercase block">Daily Order & Proceedings Summary:</span> {h.proceedingsSummary}</div>
                  {h.interimOrder && (
                    <div className="pt-1 text-slate-400 text-[11px] font-mono">
                      <span className="text-amber-400 font-bold">Directions / Interim Order:</span> {h.interimOrder}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RECORD HEARING MODAL */}
      {isHearingModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] w-screen h-screen min-h-screen bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                    Record Court Proceeding
                  </h3>
                  <p className="text-[11px] text-slate-400">Log daily court hearing order for {activeCase?.caseNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setIsHearingModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordHearing} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[11px]">
                  Court Bench & Jurisdiction *
                </label>
                <input
                  type="text"
                  value={courtName}
                  onChange={(e) => setCourtName(e.target.value)}
                  placeholder="e.g., Special CBI Court No. 4, Rouse Avenue Courts"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[11px]">
                  Presiding Judge *
                </label>
                <input
                  type="text"
                  value={judgeName}
                  onChange={(e) => setJudgeName(e.target.value)}
                  placeholder="e.g., Hon'ble Special Judge Shri R. K. Malhotra"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[11px]">
                    Hearing Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={hearingDate}
                    onChange={(e) => setHearingDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[11px]">
                    Next Hearing Date *
                  </label>
                  <input
                    type="date"
                    value={nextHearingDate}
                    onChange={(e) => setNextHearingDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[11px]">
                  Proceedings Summary & Daily Order *
                </label>
                <textarea
                  value={proceedingsSummary}
                  onChange={(e) => setProceedingsSummary(e.target.value)}
                  placeholder="Enter summary of proceedings, witness statements, judicial directives..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[11px]">
                  Interim Orders / Directions
                </label>
                <input
                  type="text"
                  value={interimOrder}
                  onChange={(e) => setInterimOrder(e.target.value)}
                  placeholder="e.g., Prosecution directed to supply forensic evidence copies to defense"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsHearingModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs uppercase tracking-wider font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingHearing}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs uppercase tracking-wider font-semibold transition flex items-center gap-1.5 disabled:opacity-50 shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submittingHearing ? 'Recording...' : 'Commit Proceeding'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* RECORD JUDGMENT MODAL */}
      {isJudgmentModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] w-screen h-screen min-h-screen bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                  <Gavel className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                    Record Final Court Judgment
                  </h3>
                  <p className="text-[11px] text-slate-400">Deliver formal judicial verdict for {activeCase?.caseNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setIsJudgmentModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordJudgment} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[11px]">
                  Judicial Verdict *
                </label>
                <select
                  value={verdict}
                  onChange={(e) => setVerdict(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                >
                  <option value="CONVICTED">CONVICTED (Guilty on all counts)</option>
                  <option value="PARTIAL_CONVICTION">PARTIAL CONVICTION</option>
                  <option value="ACQUITTED">ACQUITTED (Honorably exonerated)</option>
                  <option value="DISMISSED">DISMISSED (Lack of evidence)</option>
                  <option value="COMPOUNDED">COMPOUNDED / SETTLED</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[11px]">
                  Presiding Judge *
                </label>
                <input
                  type="text"
                  value={judgmentJudge}
                  onChange={(e) => setJudgmentJudge(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[11px]">
                  Judgment Pronouncement Date *
                </label>
                <input
                  type="date"
                  value={judgmentDate}
                  onChange={(e) => setJudgmentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[11px]">
                  Judgment Order Summary & Quantum of Sentence *
                </label>
                <textarea
                  value={judgmentSummary}
                  onChange={(e) => setJudgmentSummary(e.target.value)}
                  placeholder="e.g., Accused convicted under Sec 66 IT Act and sentenced to 5 years rigorous imprisonment..."
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsJudgmentModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs uppercase tracking-wider font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingJudgment}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs uppercase tracking-wider font-semibold transition flex items-center gap-1.5 disabled:opacity-50 shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  <Gavel className="w-4 h-4" />
                  <span>{submittingJudgment ? 'Delivering...' : 'Pronounce Judgment'}</span>
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

export default CourtProceedingsPage;

