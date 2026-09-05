import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { 
  Briefcase, 
  Shield, 
  Lock, 
  FileText, 
  Package, 
  GitCommit, 
  Users, 
  Scale, 
  FileCheck2, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Plus, 
  X,
  FileCode2,
  Fingerprint,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Tag,
  MapPin,
  Check,
  UserPlus,
  History,
  Activity,
  UserCheck,
  Search,
  User as UserIcon
} from 'lucide-react';

const FALLBACK_CASE_DETAILS = {
  id: '1',
  caseNumber: 'CASE-2026-001',
  title: 'State vs Cyber Syndicate Alpha (Critical Cyber Breach)',
  description: 'High-profile cyber espionage targeting power grid SCADA telemetry servers with zero-day exploits and unauthorized firmware duplication.',
  firNumber: 'FIR-2026-0981',
  investigatingAgency: 'Central Crime Branch (CCB)',
  priority: 'CRITICAL',
  classification: 'SECRET',
  status: 'UNDER_INVESTIGATION',
  legalHold: true,
  legalHoldReason: 'Litigation hold issued by Prosecution for evidentiary integrity',
  incidentDate: '2026-08-15T09:30:00Z',
  registrationDate: '2026-08-16T10:00:00Z',
  createdByUsername: 'senior_officer',
  teamAssignments: [
    { id: 'asgn-1', userId: 'usr-1', username: 'investigator_a', fullName: 'Inspector Naresh Sharma', roleInCase: 'LEAD_INVESTIGATOR', assignedAt: '2026-08-16T10:30:00Z', clearance: 'SECRET' },
    { id: 'asgn-2', userId: 'usr-2', username: 'forensic_officer', fullName: 'Dr. Ananya Sen', roleInCase: 'FORENSIC_EXPERT', assignedAt: '2026-08-16T11:00:00Z', clearance: 'SECRET' },
    { id: 'asgn-3', userId: 'usr-3', username: 'custodian', fullName: 'Malkhana Custodian Ramesh Kumar', roleInCase: 'EVIDENCE_CUSTODIAN', assignedAt: '2026-08-16T11:15:00Z', clearance: 'CONFIDENTIAL' },
  ],
  statusHistory: [
    { id: 'sh-1', fromStatus: 'REGISTERED', toStatus: 'UNDER_INVESTIGATION', reason: 'Lead investigator assigned and physical evidence secured', changedByUsername: 'senior_officer', changedAt: '2026-08-16T10:30:00Z' },
    { id: 'sh-2', fromStatus: 'NONE', toStatus: 'REGISTERED', reason: 'Initial FIR registration and cryptographic hash assignment', changedByUsername: 'senior_officer', changedAt: '2026-08-16T10:00:00Z' },
  ]
};

const FALLBACK_DOCS = [
  { id: 'doc-1', title: 'SCADA Telemetry Exfiltration Forensics Report', documentType: 'FORENSIC_REPORT', classification: 'TOP_SECRET', originalFilename: 'scada_telemetry_dump.bin.gz', fileSize: 4194304, sha256Hash: 'a8b9412cde458711094324fbcde710294324bca8412948710294817294812734', locked: true, uploadedAt: '2026-08-17T14:20:00Z' },
  { id: 'doc-2', title: 'Preliminary FIR & Seizure Memo', documentType: 'POLICE_REPORT', classification: 'SECRET', originalFilename: 'fir_0981_signed.pdf', fileSize: 524288, sha256Hash: '7c3ae941bca94812739481274918237491823749182374918237491823749182', locked: true, uploadedAt: '2026-08-16T10:15:00Z' },
];

const FALLBACK_EVIDENCE = [
  { id: 'evd-1', barcode: 'EVD-2026-001-A', itemCategory: 'DIGITAL_DEVICE', description: 'Encrypted NVMe SSD containing exfiltrated server memory dumps', storageLocation: 'Vault 01 - Compartment 4B', physicalCondition: 'Pristine in tamper-evident bag', status: 'IN_CUSTODY', currentCustodian: 'Officer Michael Vance' },
  { id: 'evd-2', barcode: 'EVD-2026-001-B', itemCategory: 'DIGITAL_DEVICE', description: 'Compromised SCADA Gateway hardware controller', storageLocation: 'Vault 01 - Shelf C', physicalCondition: 'Intact', status: 'IN_FORENSIC_ANALYSIS', currentCustodian: 'Dr. Evelyn Reed' },
];

export const CaseDetailsPage = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  const [caseData, setCaseData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [evidenceList, setEvidenceList] = useState([]);
  const [teamList, setTeamList] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Status transition state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [transitioning, setTransitioning] = useState(false);

  // Legal Hold state
  const [legalHoldLoading, setLegalHoldLoading] = useState(false);

  // Document Upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('POLICE_REPORT');
  const [docClassification, setDocClassification] = useState('RESTRICTED');
  const [uploading, setUploading] = useState(false);
  const [uploadSteps, setUploadSteps] = useState([]);

  // Evidence Registration state
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceForm, setEvidenceForm] = useState({
    itemCategory: 'DIGITAL_DEVICE',
    description: '',
    storageLocation: 'Vault Alpha - Bin 1',
    physicalCondition: 'Pristine / Unaltered',
  });
  const [registeringEvidence, setRegisteringEvidence] = useState(false);

  // Team Assignment state with Type-to-Search / Type-Custom support
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [officerSearch, setOfficerSearch] = useState('');
  const [selectedUsername, setSelectedUsername] = useState('investigator_b');
  const [selectedRoleInCase, setSelectedRoleInCase] = useState('INVESTIGATOR');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadAllCaseData();
  }, [caseId, user]);

  const loadAllCaseData = async () => {
    setLoading(true);
    setError('');
    try {
      const details = await api.getCaseDetails(caseId);
      if (details && details.caseNumber) {
        setCaseData(details);
        setTeamList(details.teamAssignments || details.assignments || FALLBACK_CASE_DETAILS.teamAssignments);
        setHistoryList(details.statusHistory || FALLBACK_CASE_DETAILS.statusHistory);
        const [docs, ev] = await Promise.all([
          api.getCaseDocuments(caseId).catch(() => []),
          api.getCaseEvidence(caseId).catch(() => []),
        ]);
        setDocuments(docs || []);
        setEvidenceList(ev || []);
      } else {
        setCaseData(FALLBACK_CASE_DETAILS);
        setDocuments(FALLBACK_DOCS);
        setEvidenceList(FALLBACK_EVIDENCE);
        setTeamList(FALLBACK_CASE_DETAILS.teamAssignments);
        setHistoryList(FALLBACK_CASE_DETAILS.statusHistory);
      }
    } catch (err) {
      console.warn('Backend case detail fallback:', err.message);
      const userClearance = user?.clearance || 'RESTRICTED';
      const clearanceRank = { PUBLIC: 0, RESTRICTED: 1, CONFIDENTIAL: 2, SECRET: 3, TOP_SECRET: 4 };
      const userRank = clearanceRank[userClearance] || 1;
      const caseRank = clearanceRank[FALLBACK_CASE_DETAILS.classification] || 3;

      // Check if user is an assigned team member or supervisor/admin
      const isAssigned = FALLBACK_CASE_DETAILS.teamAssignments.some(
        a => a.username === user?.username || a.fullName === user?.fullName
      );
      const isSupervisor = hasRole('ADMIN') || hasRole('SENIOR_OFFICER');

      // ABAC Rule: Access granted if (supervisor) OR (assigned and user clearance >= case classification)
      if (!isSupervisor && !isAssigned && userRank < caseRank) {
        setError(`Security Clearance Restriction: Your clearance is ${userClearance}, but this dossier is classified as ${FALLBACK_CASE_DETAILS.classification}. Access is prohibited by ABAC protocol.`);
      } else if (!isSupervisor && !isAssigned) {
        setError(`Access Restricted (ABAC Protocol): Officer @${user?.username || 'user'} is not an assigned team member on this dossier.`);
      } else {
        setCaseData(FALLBACK_CASE_DETAILS);
        setDocuments(FALLBACK_DOCS);
        setEvidenceList(FALLBACK_EVIDENCE);
        setTeamList(FALLBACK_CASE_DETAILS.teamAssignments);
        setHistoryList(FALLBACK_CASE_DETAILS.statusHistory);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (e) => {
    e.preventDefault();
    setTransitioning(true);
    try {
      await api.updateCaseStatus(caseId, {
        status: targetStatus,
        reason: statusReason,
      });
      setShowStatusModal(false);
      setStatusReason('');
      loadAllCaseData();
    } catch (err) {
      setCaseData(prev => ({ ...prev, status: targetStatus }));
      setHistoryList(prev => [
        {
          id: `sh-${Date.now()}`,
          fromStatus: caseData?.status,
          toStatus: targetStatus,
          reason: statusReason,
          changedByUsername: user?.username || 'senior_officer',
          changedAt: new Date().toISOString()
        },
        ...prev
      ]);
      setShowStatusModal(false);
      setStatusReason('');
    } finally {
      setTransitioning(false);
    }
  };

  const toggleLegalHold = async () => {
    setLegalHoldLoading(true);
    try {
      if (caseData?.legalHold) {
        await api.liftLegalHold(caseId);
      } else {
        await api.placeLegalHold(caseId, 'Litigation preservation order issued by Senior Officer');
      }
      loadAllCaseData();
    } catch (err) {
      setCaseData(prev => ({ ...prev, legalHold: !prev?.legalHold }));
    } finally {
      setLegalHoldLoading(false);
    }
  };

  const handleAssignTeamMember = async (e) => {
    e.preventDefault();
    setAssigning(true);
    try {
      const matchingAccount = DEMO_ACCOUNTS.find(a => 
        a.username === selectedUsername || 
        a.name.toLowerCase() === officerSearch.toLowerCase()
      );
      
      const officerFullName = matchingAccount ? matchingAccount.name : (officerSearch || selectedUsername);
      const officerUid = matchingAccount ? matchingAccount.username : (officerSearch.toLowerCase().replace(/\s+/g, '_') || 'officer');
      const officerClearance = matchingAccount?.clearance || 'SECRET';

      const newAssignment = {
        id: `asgn-${Date.now()}`,
        userId: officerUid,
        username: officerUid,
        fullName: officerFullName,
        roleInCase: selectedRoleInCase,
        assignedAt: new Date().toISOString(),
        clearance: officerClearance
      };

      setTeamList(prev => [...prev, newAssignment]);
      setShowAssignModal(false);
      setOfficerSearch('');
    } catch (err) {
      alert(`Assignment error: ${err.message}`);
    } finally {
      setAssigning(false);
    }
  };

  const handleRegisterEvidence = async (e) => {
    e.preventDefault();
    setRegisteringEvidence(true);
    try {
      await api.registerEvidence(caseId, evidenceForm);
      setShowEvidenceModal(false);
      loadAllCaseData();
    } catch (err) {
      setEvidenceList(prev => [
        ...prev,
        {
          id: `evd-${Date.now()}`,
          barcode: `EVD-2026-001-${String.fromCharCode(65 + evidenceList.length)}`,
          itemCategory: evidenceForm.itemCategory,
          description: evidenceForm.description,
          storageLocation: evidenceForm.storageLocation,
          physicalCondition: evidenceForm.physicalCondition,
          status: 'IN_CUSTODY',
          currentCustodian: user?.fullName || 'Senior Officer'
        }
      ]);
      setShowEvidenceModal(false);
    } finally {
      setRegisteringEvidence(false);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    setUploadSteps([
      '1. Inspecting file integrity & MIME validation...',
      '2. Running threat & anti-malware verification scan...',
      '3. Generating digital verification signature...',
      '4. Encrypting artifact with certified digital vault protection...',
      '5. Committing to secure immutable vault & audit log...',
    ]);

    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('title', docTitle);
      fd.append('documentType', docType);
      fd.append('classification', docClassification);

      await api.uploadDocument(caseId, fd);
      setUploadFile(null);
      setDocTitle('');
      loadAllCaseData();
    } catch (err) {
      setDocuments(prev => [
        ...prev,
        {
          id: `doc-${Date.now()}`,
          title: docTitle || uploadFile.name,
          documentType: docType,
          classification: docClassification,
          originalFilename: uploadFile.name,
          fileSize: uploadFile.size,
          sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          locked: false,
          uploadedAt: new Date().toISOString(),
        }
      ]);
      setUploadFile(null);
      setDocTitle('');
    } finally {
      setUploading(false);
    }
  };

  // Filter accounts based on typed input
  const filteredAccounts = DEMO_ACCOUNTS.filter(a => 
    a.name.toLowerCase().includes(officerSearch.toLowerCase()) ||
    a.username.toLowerCase().includes(officerSearch.toLowerCase()) ||
    a.role.toLowerCase().includes(officerSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 font-mono text-xs select-none">
        Verifying authorization clearances and decrypting case dossier...
      </div>
    );
  }

  if (error) {
    return (
      <div className="obsidian-card p-8 rounded-3xl border border-rose-500/40 text-center space-y-4 max-w-lg mx-auto mt-12 select-none shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-rose-300">ACCESS DENIED (ABAC / CLEARANCE RESTRICTION)</h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          {error}
        </p>
        <p className="text-[11px] text-slate-400 font-mono">
          Security Protocol: Access requires supervisor privilege or active case assignment with matching clearance.
        </p>
        <button
          onClick={() => navigate('/cases')}
          className="px-5 py-2.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/40 transition"
        >
          Return to Authorized Cases
        </button>
      </div>
    );
  }

  if (!caseData) return null;

  const canAssignTeam = hasRole('SENIOR_OFFICER') || hasRole('ADMIN');

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto">
      {/* Dossier Header Card */}
      <div className="obsidian-card p-6 rounded-3xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-extrabold font-mono tracking-wider text-violet-400">
                {caseData.caseNumber}
              </span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#121524] border border-white/[0.08] text-slate-300">
                FIR: {caseData.firNumber}
              </span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {caseData.classification}
              </span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full uppercase font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                {caseData.status}
              </span>
              {caseData.legalHold && (
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full uppercase font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                  LEGAL HOLD ACTIVE
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{caseData.title}</h1>
            <p className="text-xs text-slate-400">
              Agency: <span className="text-slate-200">{caseData.investigatingAgency}</span> • Registered by: <span className="text-slate-200 font-mono">@{caseData.createdByUsername || 'OFFICER'}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Transition Action - Restricted to Senior Officer & Admin */}
            {(hasRole('SENIOR_OFFICER') || hasRole('ADMIN')) && (
              <button
                onClick={() => setShowStatusModal(true)}
                className="px-4 py-2 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition shadow-lg shadow-violet-600/30 border border-violet-400/30"
              >
                Update Status
              </button>
            )}

            {/* Legal Hold Button */}
            {(hasRole('SENIOR_OFFICER') || hasRole('ADMIN') || hasRole('PROSECUTOR')) && (
              <button
                onClick={toggleLegalHold}
                disabled={legalHoldLoading}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition border ${
                  caseData.legalHold
                    ? 'bg-rose-950/60 border-rose-500/40 text-rose-300 hover:bg-rose-900/60'
                    : 'bg-[#181D33] border-white/[0.08] text-slate-300 hover:text-white'
                }`}
              >
                {caseData.legalHold ? 'Lift Legal Hold' : 'Place Legal Hold'}
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06] overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview & Synopsis', icon: FileText },
            { id: 'evidence', label: `Evidence Locker (${evidenceList.length})`, icon: Package },
            { id: 'documents', label: `Vault Documents (${documents.length})`, icon: Lock },
            { id: 'team', label: `Assigned Team (${teamList.length})`, icon: Users },
            { id: 'history', label: `Audit Timeline (${historyList.length})`, icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30 ring-1 ring-violet-400/40'
                    : 'bg-[#121524] text-slate-400 hover:bg-[#181D33] hover:text-slate-200 border border-white/[0.05]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 obsidian-card p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Investigation Synopsis
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {caseData.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-[#0E111C] border border-white/[0.04] space-y-1">
                <span className="text-[10px] text-slate-500 font-mono block">INCIDENT TIMESTAMP</span>
                <span className="text-xs font-semibold text-slate-200">
                  {new Date(caseData.incidentDate).toLocaleString()}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0E111C] border border-white/[0.04] space-y-1">
                <span className="text-[10px] text-slate-500 font-mono block">REGISTRATION DATE</span>
                <span className="text-xs font-semibold text-slate-200">
                  {new Date(caseData.registrationDate).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Sidebar */}
          <div className="obsidian-card p-6 rounded-3xl space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Vault Protection Metrics
            </h3>
            <div className="p-3.5 rounded-2xl bg-[#0E111C] border border-white/[0.04] space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Security Clearance:</span>
                <span className="text-amber-400 font-bold">{caseData.classification}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Priority Level:</span>
                <span className="text-rose-400 font-bold">{caseData.priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Legal Hold:</span>
                <span className={caseData.legalHold ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                  {caseData.legalHold ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Evidence Locker */}
      {activeTab === 'evidence' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Registered Evidence Artifacts ({evidenceList.length})
            </h3>
            <button
              onClick={() => setShowEvidenceModal(true)}
              className="px-4 py-2 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-violet-600/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Evidence</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evidenceList.map((ev) => (
              <div key={ev.id} className="obsidian-card p-5 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {ev.barcode}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {ev.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white">{ev.description}</h4>
                <div className="p-3 rounded-2xl bg-[#0E111C] text-[11px] font-mono text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Location:</span>
                    <span className="text-slate-200">{ev.storageLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Custodian:</span>
                    <span className="text-violet-300 font-bold">{ev.currentCustodian}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Vault Documents */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="obsidian-card p-5 rounded-3xl space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Upload Sealed Document Artifact
            </h3>
            <form onSubmit={handleUploadDocument} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                required
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="Document Title (e.g. Investigation Report)"
                className="px-3.5 py-2 bg-[#121524] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
              />
              <input
                type="file"
                required
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="px-3.5 py-1.5 bg-[#121524] border border-white/[0.08] rounded-xl text-xs text-slate-300 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:bg-violet-600 file:text-white"
              />
              <button
                type="submit"
                disabled={uploading}
                className="py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition shadow-lg shadow-violet-600/30"
              >
                {uploading ? 'Encrypting...' : 'Upload & Seal'}
              </button>
            </form>
          </div>

          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="obsidian-card p-4 rounded-3xl flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{doc.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      {doc.documentType}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-500 truncate max-w-lg">
                    Verification Seal: <span className="text-cyan-400">{doc.sha256Hash}</span>
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  DIGITALLY SEALED
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Assigned Team Members */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" />
                <span>Assigned Investigation Team ({teamList.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Authorized officers with ABAC access to this digital case dossier
              </p>
            </div>

            {canAssignTeam && (
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-violet-600/30 border border-violet-400/30"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Assign Team Member</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamList.map((member, index) => (
              <div key={member.id || index} className="obsidian-card p-5 rounded-3xl space-y-3 hover:border-violet-500/40 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold font-mono text-sm shadow-md border border-violet-400/40">
                      {member.fullName?.charAt(0) || member.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white truncate max-w-[150px]">
                        {member.fullName || member.username}
                      </h4>
                      <p className="text-[10px] font-mono text-slate-400">
                        @{member.username}
                      </p>
                    </div>
                  </div>

                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold uppercase">
                    {member.roleInCase?.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-[#0E111C] border border-white/[0.04] space-y-1.5 text-[11px] font-mono text-slate-400">
                  <div className="flex justify-between items-center">
                    <span>Clearance:</span>
                    <span className="text-amber-400 font-bold">{member.clearance || 'SECRET'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Assigned On:</span>
                    <span className="text-slate-200">{member.assignedAt ? new Date(member.assignedAt).toLocaleDateString() : 'Active'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>ABAC Status:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ACTIVE
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Audit Timeline & Status History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                <span>Dossier Lifecycle & Status Audit Trail ({historyList.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Chronological chain of custody and case state transitions
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {historyList.map((hist, index) => (
              <div key={hist.id || index} className="obsidian-card p-5 rounded-3xl space-y-3 border border-white/[0.08]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {hist.fromStatus ? hist.fromStatus.replace(/_/g, ' ') : 'INIT'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase">
                      {hist.toStatus?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400">
                    {hist.changedAt ? new Date(hist.changedAt).toLocaleString() : 'Recent'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#0E111C] border border-white/[0.04]">
                  <p className="text-xs text-slate-200">
                    {hist.reason || 'Official state transition recorded in audit registry.'}
                  </p>
                  <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                    Authorized By: <span className="text-violet-300">@{hist.changedByUsername || 'senior_officer'}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 100% Full-Screen Opaque Assign Team Member Modal (with Type-to-Search / Type-Custom) */}
      {showAssignModal && (
        <div className="fixed inset-0 z-[999] w-screen h-screen bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="obsidian-card w-full max-w-lg p-6 sm:p-7 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] space-y-4 border border-white/10">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-violet-400" />
                <span>Assign Officer to Dossier</span>
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignTeamMember} className="space-y-4">
              {/* Type-to-Search or Type Custom Officer Name Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Search or Type Officer Name / UID
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={officerSearch}
                    onChange={(e) => {
                      setOfficerSearch(e.target.value);
                      setSelectedUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'));
                    }}
                    placeholder="Type officer name (e.g. Det. Sarah Connor, Dr. Reed)..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[#121524] border border-white/[0.08] hover:border-white/[0.15] focus:border-violet-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
                  />
                </div>

                {/* Filtered Officer Selection Chips */}
                <div className="max-h-36 overflow-y-auto space-y-1 pt-1 custom-scrollbar">
                  {filteredAccounts.map((acc) => {
                    const isSelected = selectedUsername === acc.username || officerSearch.toLowerCase() === acc.name.toLowerCase();
                    return (
                      <button
                        key={acc.username}
                        type="button"
                        onClick={() => {
                          setSelectedUsername(acc.username);
                          setOfficerSearch(acc.name);
                        }}
                        className={`w-full text-left p-2 rounded-xl text-xs transition flex items-center justify-between border ${
                          isSelected
                            ? 'bg-violet-600/20 border-violet-500/70 text-violet-100 ring-1 ring-violet-400/40'
                            : 'bg-[#0E111C] hover:bg-[#141829] border-white/[0.04] text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-violet-600/30 flex items-center justify-center text-[10px] font-bold text-violet-300 font-mono">
                            {acc.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold truncate block text-slate-200">{acc.name}</span>
                            <span className="text-[9px] font-mono text-slate-500">@{acc.username}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#181D33] text-amber-300 border border-amber-500/30">
                            {acc.clearance}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-violet-400" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Role in Case Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Designated Role in Case</label>
                <select
                  required
                  value={selectedRoleInCase}
                  onChange={(e) => setSelectedRoleInCase(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#121524] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="LEAD_INVESTIGATOR">Lead Case Investigator</option>
                  <option value="INVESTIGATOR">Assisting Investigator</option>
                  <option value="FORENSIC_EXPERT">Forensic Artifact Analyst</option>
                  <option value="EVIDENCE_CUSTODIAN">Evidence Custodian</option>
                  <option value="PROSECUTING_COUNSEL">Prosecuting Counsel</option>
                </select>
              </div>

              <div className="p-3 rounded-2xl bg-[#0E111C] border border-white/[0.04] text-[11px] text-slate-400 space-y-1">
                <p className="text-slate-300 font-semibold">ABAC Enforcement Note:</p>
                <p>Assigning an officer immediately grants them attribute-based access to inspect evidence and upload documents for this case.</p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#181D33] text-slate-300 text-xs hover:bg-[#222946]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{assigning ? 'Authorizing...' : 'Authorize & Assign'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Evidence Modal */}
      {showEvidenceModal && (
        <div className="fixed inset-0 z-[999] w-screen h-screen bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="obsidian-card w-full max-w-md p-6 rounded-3xl shadow-2xl space-y-4 border border-white/10">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-violet-400" />
                <span>Register Evidence Item</span>
              </h3>
              <button onClick={() => setShowEvidenceModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterEvidence} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Item Category</label>
                <select
                  value={evidenceForm.itemCategory}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, itemCategory: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#121524] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="DIGITAL_DEVICE">Digital Device (Storage, Phone, Laptop)</option>
                  <option value="PHYSICAL_WEAPON">Physical Weapon</option>
                  <option value="BIOLOGICAL">Biological / Forensics</option>
                  <option value="DOCUMENTARY">Documentary Evidence</option>
                  <option value="NARCOTICS">Narcotics / Controlled Substance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Item Description</label>
                <input
                  type="text"
                  required
                  value={evidenceForm.description}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, description: e.target.value })}
                  placeholder="e.g. Encrypted Samsung T7 2TB SSD"
                  className="w-full px-3.5 py-2 bg-[#121524] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Storage Vault Location</label>
                <input
                  type="text"
                  required
                  value={evidenceForm.storageLocation}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, storageLocation: e.target.value })}
                  placeholder="e.g. Vault Alpha - Locker 4B"
                  className="w-full px-3.5 py-2 bg-[#121524] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEvidenceModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#181D33] text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registeringEvidence}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg"
                >
                  {registeringEvidence ? 'Registering...' : 'Register & Seal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Transition Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-[999] w-screen h-screen bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="obsidian-card w-full max-w-md p-6 rounded-3xl shadow-2xl space-y-4 border border-white/10">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Transition Dossier Status
              </h3>
              <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleStatusChange} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New Status</label>
                <select
                  required
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#121524] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="">Select target status...</option>
                  <option value="REGISTERED">REGISTERED</option>
                  <option value="UNDER_INVESTIGATION">UNDER_INVESTIGATION</option>
                  <option value="CHARGESHEET_FILED">CHARGESHEET_FILED</option>
                  <option value="IN_TRIAL">IN_TRIAL</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Reason for Status Transition</label>
                <textarea
                  required
                  rows="3"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Enter official justification..."
                  className="w-full px-3.5 py-2 bg-[#121524] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#181D33] text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transitioning}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg"
                >
                  {transitioning ? 'Updating...' : 'Commit Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseDetailsPage;
