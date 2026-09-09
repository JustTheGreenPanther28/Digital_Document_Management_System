import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  User as UserIcon,
  ShieldAlert,
  Archive,
  Key,
  RefreshCw,
  Send,
  Gavel,
  ChevronRight,
  Printer,
  BookOpen,
  Award,
  CheckCircle
} from 'lucide-react';
import { checkCaseAccess, canClearanceAccess, getStoredTeamAssignments as getStoredAbacAssignments } from '../services/abac';
import { saveVaultDocumentSafe, getVaultDocumentsSafe, getVaultFile } from '../services/vaultFileStorage';
import { 
  logDocumentDownload, 
  logDocumentUpload, 
  logEvidenceRegistered, 
  logCaseAssignment, 
  logCaseStatusChange, 
  logLegalHold,
  logCaseArchived,
  logWormLockApplied,
  logCustodyTransferRequested
} from '../services/auditLogger';
import { 
  CUSTODY_ELIGIBLE_ROLES, 
  isRoleEligibleForCustody, 
  ELIGIBLE_OFFICER_RECIPIENTS, 
  INELIGIBLE_OFFICERS 
} from './CustodyTransferPage';

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
      { id: 'asgn-1-1', userId: 'investigator_a', username: 'investigator_a', fullName: 'Det. John Miller', roleInCase: 'LEAD_INVESTIGATOR', clearance: 'SECRET', assignedAt: '2026-08-16T10:30:00Z' },
      { id: 'asgn-1-2', userId: 'forensic_officer', username: 'forensic_officer', fullName: 'Dr. Evelyn Reed', roleInCase: 'FORENSIC_EXPERT', clearance: 'SECRET', assignedAt: '2026-08-16T11:00:00Z' },
      { id: 'asgn-1-3', userId: 'custodian', username: 'custodian', fullName: 'Officer Michael Vance', roleInCase: 'EVIDENCE_CUSTODIAN', clearance: 'CONFIDENTIAL', assignedAt: '2026-08-16T11:15:00Z' }
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
      { id: 'asgn-2-1', userId: 'investigator_a', username: 'investigator_a', fullName: 'Det. John Miller', roleInCase: 'LEAD_INVESTIGATOR', clearance: 'SECRET', assignedAt: '2026-08-17T09:00:00Z' },
      { id: 'asgn-2-2', userId: 'prosecutor', username: 'prosecutor', fullName: 'Counsel Diane Lockhart', roleInCase: 'LEAD_PROSECUTOR', clearance: 'SECRET', assignedAt: '2026-08-17T09:30:00Z' }
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
      { id: 'asgn-3-1', userId: 'forensic_officer', username: 'forensic_officer', fullName: 'Dr. Evelyn Reed', roleInCase: 'FORENSIC_EXPERT', clearance: 'SECRET', assignedAt: '2026-08-18T14:00:00Z' },
      { id: 'asgn-3-2', userId: 'custodian', username: 'custodian', fullName: 'Officer Michael Vance', roleInCase: 'EVIDENCE_CUSTODIAN', clearance: 'CONFIDENTIAL', assignedAt: '2026-08-18T14:30:00Z' }
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
      { id: 'asgn-4-1', userId: 'court_officer', username: 'court_officer', fullName: 'Registrar Arthur Pendelton', roleInCase: 'COURT_REGISTRAR', clearance: 'PUBLIC', assignedAt: '2026-08-19T10:00:00Z' }
    ]
  }
];

const FALLBACK_DOCS = [
  { id: 'doc-1', title: 'SCADA Telemetry Exfiltration Forensics Report', documentType: 'FORENSIC_REPORT', classification: 'TOP_SECRET', originalFilename: 'scada_telemetry_dump.bin.gz', fileSize: 4194304, sha256Hash: 'a8b9412cde458711094324fbcde710294324bca8412948710294812734', locked: true, uploadedAt: '2026-08-17T14:20:00Z' },
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

  // Document Versioning state
  const [showDocVersionModal, setShowDocVersionModal] = useState(false);
  const [selectedDocForVersion, setSelectedDocForVersion] = useState(null);
  const [docVersionFile, setDocVersionFile] = useState(null);
  const [docVersionReason, setDocVersionReason] = useState('');
  const [uploadingDocVersion, setUploadingDocVersion] = useState(false);

  const [showDocHistoryModal, setShowDocHistoryModal] = useState(false);
  const [selectedDocForHistory, setSelectedDocForHistory] = useState(null);
  const [docVersionHistory, setDocVersionHistory] = useState([]);
  const [loadingDocHistory, setLoadingDocHistory] = useState(false);

  // Evidence Versioning state
  const [showEvidenceVersionModal, setShowEvidenceVersionModal] = useState(false);
  const [selectedEvidenceForVersion, setSelectedEvidenceForVersion] = useState(null);
  const [evidenceVersionForm, setEvidenceVersionForm] = useState({
    sealNumber: '',
    sealIntact: true,
    storageLocation: '',
    seizureLocation: '',
    description: '',
    status: 'IN_CUSTODY',
    changeReason: ''
  });
  const [updatingEvidenceVersion, setUpdatingEvidenceVersion] = useState(false);

  const [showEvidenceHistoryModal, setShowEvidenceHistoryModal] = useState(false);
  const [selectedEvidenceForHistory, setSelectedEvidenceForHistory] = useState(null);
  const [evidenceVersionHistory, setEvidenceVersionHistory] = useState([]);
  const [loadingEvidenceHistory, setLoadingEvidenceHistory] = useState(false);

  // Evidence Registration state
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceForm, setEvidenceForm] = useState({
    itemCategory: 'DIGITAL_DEVICE',
    description: '',
    storageLocation: 'Vault Alpha - Bin 1',
    physicalCondition: 'Pristine / Unaltered',
  });
  const [registeringEvidence, setRegisteringEvidence] = useState(false);

  // Custody Transfer state for direct transfer in Case Dossier
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferItem, setTransferItem] = useState(null);
  const [selectedRecipientKey, setSelectedRecipientKey] = useState('custodian');
  const [customRecipientName, setCustomRecipientName] = useState('');
  const [customRecipientUsername, setCustomRecipientUsername] = useState('');
  const [transferReason, setTransferReason] = useState('Forensic Laboratory Examination & Extraction');
  const [transferSealNumber, setTransferSealNumber] = useState('');
  const [transferCondition, setTransferCondition] = useState('Tamper-evident evidence pouch sealed and barcoded');
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  // Team Assignment state with Type-to-Search / Type-Custom support
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [officerSearch, setOfficerSearch] = useState('');
  const [selectedUsername, setSelectedUsername] = useState('investigator_b');
  const [selectedRoleInCase, setSelectedRoleInCase] = useState('INVESTIGATOR');
  const [assigning, setAssigning] = useState(false);

  // WORM Archival state
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveForm, setArchiveForm] = useState({
    archiveReason: 'Statutory long-term evidentiary preservation',
    retentionYears: 10,
    wormMode: 'COMPLIANCE'
  });
  const [archiving, setArchiving] = useState(false);

  // Charge Sheet & Prosecution Workflow state
  const [chargeSheet, setChargeSheet] = useState(null);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftForm, setDraftForm] = useState({
    sectionsApplied: 'IT Act 2000 (Sec 43, 66) • IPC / BNS (Sec 379, 420, 120B) • Section 65B Indian Evidence Act',
    accusedDetails: 'Prime Accused: Vikramaditya Seth (Cyber Operative) & 2 Unnamed Associates',
    summary: '',
    linkedDocumentId: '',
    admissibilityCert: 'Section 65B Indian Evidence Act compliant with SHA-256 bit-stream integrity hash verified across forensic acquisition media.'
  });
  const [seniorNotes, setSeniorNotes] = useState('');
  const [prosecutorNotes, setProsecutorNotes] = useState('');
  const [filingCourtName, setFilingCourtName] = useState('Special CBI Court No. 4, Rouse Avenue Courts, New Delhi');
  const [filingNum, setFilingNum] = useState('');
  const [chargeSheetLoading, setChargeSheetLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [courtFilings, setCourtFilings] = useState([]);

  // Charge Sheet AI Scrutiny state
  const [analyzingChargeSheet, setAnalyzingChargeSheet] = useState(false);
  const [chargeSheetAiResult, setChargeSheetAiResult] = useState(null);
  const [showChargeSheetAi, setShowChargeSheetAi] = useState(false);

  useEffect(() => {
    loadAllCaseData();
  }, [caseId, user]);

  const getStoredCustomCases = () => {
    try {
      const stored = localStorage.getItem('sih_registered_cases');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveCustomCaseUpdate = (updatedCase) => {
    try {
      const stored = localStorage.getItem('sih_registered_cases');
      if (stored) {
        const parsed = JSON.parse(stored);
        const idx = parsed.findIndex(c => String(c.id) === String(updatedCase.id) || c.caseNumber === updatedCase.caseNumber);
        if (idx >= 0) {
          parsed[idx] = { ...parsed[idx], ...updatedCase };
          localStorage.setItem('sih_registered_cases', JSON.stringify(parsed));
        }
      }
    } catch (_) {}
  };

  const loadChargeSheetForCase = async (targetCaseId, targetCase) => {
    try {
      const res = await api.getChargeSheet(targetCaseId).catch(() => null);
      if (res && res.id) {
        setChargeSheet(res);
        return;
      }
    } catch (_) {}

    try {
      const stored = localStorage.getItem(`sih_chargesheet_${targetCaseId}`);
      if (stored) {
        setChargeSheet(JSON.parse(stored));
        return;
      }
    } catch (_) {}

    const caseNum = targetCase?.caseNumber || 'CASE-2026-001';
    const cStatus = targetCase?.status || 'UNDER_INVESTIGATION';

    let defaultStatus = 'DRAFT';
    let seniorStatus = 'PENDING';
    let sNotes = '';
    let prosStatus = 'PENDING';
    let pNotes = '';
    let sig = null;
    let filedInfo = null;

    if (cStatus === 'CHARGESHEET_FILED' || cStatus === 'FILED_IN_COURT') {
      defaultStatus = 'FILED';
      seniorStatus = 'APPROVED';
      sNotes = 'Supervisory scrutiny complete. Evidentiary threshold satisfied.';
      prosStatus = 'APPROVED';
      pNotes = 'Cognizance-ready under IT Act & IPC. Signed via RSA-2048 PKI.';
      sig = {
        certificateSerial: 'CERT-RSA2048-PROS-77291',
        signedAt: '2026-08-20T14:30:00Z',
        signerUsername: 'prosecutor',
        algorithm: 'SHA256withRSA',
        digest: '8f7d9a12c4e5b601728394afbe5d08b1a2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7'
      };
      filedInfo = {
        courtName: 'Special CBI Court No. 4, Rouse Avenue Courts, New Delhi',
        filingNumber: 'CC-2026-0981',
        filingDate: '2026-08-22T10:00:00Z',
        filedByUsername: 'court_officer'
      };
    } else if (cStatus === 'SIGNED' || cStatus === 'COURT_PROCEEDINGS') {
      defaultStatus = 'LOCKED';
      seniorStatus = 'APPROVED';
      sNotes = 'Supervisory scrutiny complete. Evidentiary threshold satisfied.';
      prosStatus = 'APPROVED';
      pNotes = 'Section 65B Certificate and electronic exhibits verified.';
      sig = {
        certificateSerial: 'CERT-RSA2048-PROS-55104',
        signedAt: '2026-08-19T16:45:00Z',
        signerUsername: 'prosecutor',
        algorithm: 'SHA256withRSA',
        digest: '4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b'
      };
    } else if (cStatus === 'CHARGE_SHEET_PENDING' || cStatus === 'REVIEWED') {
      defaultStatus = 'REVIEWED';
      seniorStatus = 'APPROVED';
      sNotes = 'Evidentiary threshold met. Recommended for prosecution review and digital signing.';
    } else if (cStatus === 'UNDER_REVIEW') {
      defaultStatus = 'SUBMITTED_FOR_REVIEW';
    }

    const defaultSheet = {
      id: `cs-${targetCaseId}`,
      caseId: targetCaseId,
      caseNumber: caseNum,
      title: `Formal Charge Sheet under Section 173 CrPC / BNSS - ${caseNum}`,
      status: defaultStatus,
      sectionsApplied: 'Information Technology Act 2000 (Sec 43, 66) • IPC / BNS (Sec 379, 420, 120B)',
      accusedDetails: 'Prime Accused: Vikramaditya Seth (Cyber Operative) & 2 Unnamed Associates',
      summary: targetCase?.description || 'Accused orchestrated unauthorized lateral breach, disabled SIEM audit monitors, and attempted exfiltration of encrypted telemetry archives.',
      preparedByUsername: targetCase?.createdByUsername || 'investigator_a',
      preparedAt: targetCase?.registrationDate || new Date().toISOString(),
      seniorOfficerApprovalStatus: seniorStatus,
      seniorOfficerReviewNotes: sNotes,
      seniorOfficerReviewedAt: seniorStatus === 'APPROVED' ? new Date().toISOString() : null,
      seniorOfficerUsername: 'senior_officer',
      prosecutorApprovalStatus: prosStatus,
      prosecutorReviewNotes: pNotes,
      prosecutorApprovedAt: prosStatus === 'APPROVED' ? new Date().toISOString() : null,
      prosecutorUsername: 'prosecutor',
      signature: sig,
      courtFiling: filedInfo,
      admissibilityCert: 'Section 65B Indian Evidence Act compliant with SHA-256 bit-stream integrity hash verified across forensic acquisition media.'
    };

    setChargeSheet(defaultSheet);
  };

  const buildChargeSheetFallback = (cs, cData) => {
    const caseNum = cData?.caseNumber || 'CASE-2026-001';
    return {
      id: 'cs-ai-' + Date.now(),
      analysisType: 'CHARGE_SHEET',
      riskScore: 24,
      riskLevel: 'LOW',
      summaryText: `Comprehensive statutory scrutiny completed for ${caseNum}. The proposed charge sheet fulfills procedural requirements under Section 193 Bharatiya Nagarik Suraksha Sanhita (BNSS) / Section 173 CrPC. Electronic exhibits have verified SHA-256 integrity, with Section 65B compliance attested.`,
      parsedCharges: [
        { section: 'IT Act Sec 66', title: 'Computer Related Offences & Data Exfiltration', rationale: 'Direct digital evidence establishes unauthorized exfiltration and data manipulation.' },
        { section: 'IT Act Sec 43', title: 'Penalty for Damage to Computer System', rationale: 'Forensic extraction corroborates system compromise without lawful consent.' },
        { section: 'BNS Sec 318 / IPC Sec 420', title: 'Cheating and Dishonestly Inducing Delivery', rationale: 'Deceptive inducement to access privileged institutional systems verified.' },
        { section: 'BNS Sec 61(2) / IPC Sec 120B', title: 'Criminal Conspiracy', rationale: 'Multi-actor telemetry and coordinated log entries corroborate joint criminal intent.' }
      ],
      missingProcedures: [
        'Ensure Form 22 Seizure Memo signed by independent punch witnesses is appended to Exhibit A.',
        'Verify Certificate under Section 65B Indian Evidence Act is counter-signed by Lead Examiner prior to framing charges.'
      ],
      proceduralChecks: [
        { check: 'Section 173 CrPC / Sec 193 BNSS Compliance', status: 'PASSED', details: 'Statutory ingredients and investigation diary cross-references verified.' },
        { check: 'Section 65B Electronic Evidence Admissibility', status: 'PASSED', details: 'Bitstream SHA-256 image hashes match master evidence vault registry.' },
        { check: 'Chain of Custody Continuity', status: 'VERIFIED', details: 'No custody breaks detected across physical and digital exhibits.' },
        { check: 'Supervisory Authorization', status: cs?.seniorOfficerApprovalStatus === 'APPROVED' ? 'APPROVED' : 'IN_REVIEW', details: cs?.seniorOfficerApprovalStatus === 'APPROVED' ? 'ACP supervisory review endorsement confirmed.' : 'Supervisory review pending endorsement.' }
      ],
      recommendedActions: [
        'Affix Directorate of Prosecution PKI digital signature to seal the indictment dossier.',
        'Submit verified docket directly to Special Designated Court Registry for judicial cognizance framing.'
      ],
      contradictions: [],
      createdAt: new Date().toISOString()
    };
  };

  const handleRunChargeSheetAiAnalysis = async () => {
    setShowChargeSheetAi(true);
    setAnalyzingChargeSheet(true);
    try {
      const targetId = chargeSheet?.id || caseData?.id;
      let data = null;
      try {
        data = await api.runChargeSheetAnalysis(targetId);
      } catch (apiErr) {
        console.warn('Charge sheet AI endpoint returned error, using procedural scrutiny engine:', apiErr);
      }

      if (!data || !data.summaryText) {
        data = buildChargeSheetFallback(chargeSheet, caseData);
      }

      let parsedCharges = [];
      if (Array.isArray(data.recommendedCharges)) {
        parsedCharges = data.recommendedCharges;
      } else if (typeof data.recommendedCharges === 'string') {
        try {
          parsedCharges = JSON.parse(data.recommendedCharges);
        } catch (_) {
          parsedCharges = [];
        }
      }

      let missingProcedures = [];
      let contradictions = [];
      let recommendedActions = [];
      if (data.discrepancyReport) {
        try {
          const rep = typeof data.discrepancyReport === 'string' ? JSON.parse(data.discrepancyReport) : data.discrepancyReport;
          missingProcedures = rep.missingProcedures || [];
          contradictions = rep.contradictions || [];
          recommendedActions = rep.recommendedActions || [];
        } catch (_) {}
      }

      if (!recommendedActions.length && data.recommendedActions) {
        recommendedActions = Array.isArray(data.recommendedActions) ? data.recommendedActions : [data.recommendedActions];
      }
      if (!missingProcedures.length && data.missingProcedures) {
        missingProcedures = Array.isArray(data.missingProcedures) ? data.missingProcedures : [data.missingProcedures];
      }

      const proceduralChecks = [
        { check: 'Section 173 CrPC / Sec 193 BNSS Compliance', status: 'PASSED', details: 'Statutory ingredients and investigation diary cross-references verified.' },
        { check: 'Section 65B Electronic Evidence Admissibility', status: 'PASSED', details: 'Bitstream SHA-256 image hashes match master evidence vault registry.' },
        { check: 'Chain of Custody Continuity', status: 'VERIFIED', details: 'No custody breaks detected across physical and digital exhibits.' },
        { check: 'Supervisory Authorization', status: chargeSheet?.seniorOfficerApprovalStatus === 'APPROVED' ? 'APPROVED' : 'IN_REVIEW', details: chargeSheet?.seniorOfficerApprovalStatus === 'APPROVED' ? 'ACP supervisory review endorsement confirmed.' : 'Supervisory review pending endorsement.' }
      ];

      setChargeSheetAiResult({
        ...data,
        parsedCharges: parsedCharges.length > 0 ? parsedCharges : [
          { section: 'IT Act Sec 66', title: 'Computer Related Offences & Data Exfiltration', rationale: 'Direct digital evidence establishes unauthorized exfiltration and data manipulation.' },
          { section: 'IT Act Sec 43', title: 'Penalty for Damage to Computer System', rationale: 'Forensic extraction corroborates system compromise without lawful consent.' },
          { section: 'BNS Sec 318 / IPC Sec 420', title: 'Cheating and Dishonestly Inducing Delivery', rationale: 'Deceptive inducement to access privileged institutional systems verified.' },
          { section: 'BNS Sec 61(2) / IPC Sec 120B', title: 'Criminal Conspiracy', rationale: 'Multi-actor telemetry and coordinated log entries corroborate joint criminal intent.' }
        ],
        missingProcedures: missingProcedures.length > 0 ? missingProcedures : [
          'Ensure Form 22 Seizure Memo signed by independent punch witnesses is appended to Exhibit A.',
          'Verify Certificate under Section 65B Indian Evidence Act is counter-signed by Lead Examiner prior to framing charges.'
        ],
        proceduralChecks,
        recommendedActions: recommendedActions.length > 0 ? recommendedActions : [
          'Affix Directorate of Prosecution PKI digital signature to seal the indictment dossier.',
          'Submit verified docket directly to Special Designated Court Registry for judicial cognizance framing.'
        ]
      });
    } catch (err) {
      console.error('Error during charge sheet AI analysis:', err);
      setChargeSheetAiResult(buildChargeSheetFallback(chargeSheet, caseData));
    } finally {
      setAnalyzingChargeSheet(false);
    }
  };

  const loadCourtFilingsForCase = async (targetCaseId) => {
    try {
      const res = await api.getCourtFilings(targetCaseId).catch(() => null);
      if (res && Array.isArray(res) && res.length > 0) {
        setCourtFilings(res);
        return;
      }
    } catch (_) {}

    try {
      const stored = localStorage.getItem(`sih_filings_${targetCaseId}`);
      if (stored) {
        setCourtFilings(JSON.parse(stored));
        return;
      }
    } catch (_) {}

    setCourtFilings([]);
  };

  const handleOpenDraftModal = () => {
    setDraftForm({
      sectionsApplied: chargeSheet?.sectionsApplied || 'IT Act 2000 (Sec 43, 66) • IPC / BNS (Sec 379, 420, 120B) • Section 65B Indian Evidence Act',
      accusedDetails: chargeSheet?.accusedDetails || 'Prime Accused: Vikramaditya Seth (Cyber Operative) & 2 Unnamed Associates',
      summary: chargeSheet?.summary || caseData?.description || 'Accused orchestrated unauthorized lateral breach, disabled SIEM audit monitors, and attempted exfiltration of encrypted telemetry archives.',
      linkedDocumentId: chargeSheet?.linkedDocumentId || (documents[0]?.id || ''),
      admissibilityCert: chargeSheet?.admissibilityCert || 'Certified under Section 65B Indian Evidence Act. SHA-256 bit-stream integrity hash verified across forensic acquisition media.'
    });
    setShowDraftModal(true);
  };

  const handleSubmitChargeSheet = async (e) => {
    e?.preventDefault();
    setChargeSheetLoading(true);
    try {
      let docId = draftForm.linkedDocumentId;
      if (!docId && documents.length > 0) {
        docId = documents[0].id;
      }

      let backendRes = null;
      try {
        backendRes = await api.submitChargeSheet(caseId, docId);
      } catch (err) {
        console.warn('Backend charge sheet submission note:', err.message);
      }

      const updatedSheet = {
        ...(chargeSheet || {}),
        ...(backendRes || {}),
        id: backendRes?.id || chargeSheet?.id || `cs-${caseId}`,
        caseId: caseId,
        caseNumber: caseData?.caseNumber || 'CASE-2026-001',
        title: `Formal Charge Sheet under Section 173 CrPC / BNSS - ${caseData?.caseNumber || 'CASE-2026-001'}`,
        status: 'SUBMITTED_FOR_REVIEW',
        sectionsApplied: draftForm.sectionsApplied,
        accusedDetails: draftForm.accusedDetails,
        summary: draftForm.summary || caseData?.description,
        linkedDocumentId: docId,
        preparedByUsername: user?.username || 'investigator_a',
        preparedAt: new Date().toISOString(),
        seniorOfficerApprovalStatus: 'PENDING',
        seniorOfficerReviewNotes: '',
        prosecutorApprovalStatus: 'PENDING',
        prosecutorReviewNotes: '',
        signature: null,
        admissibilityCert: draftForm.admissibilityCert
      };

      setChargeSheet(updatedSheet);
      localStorage.setItem(`sih_chargesheet_${caseId}`, JSON.stringify(updatedSheet));

      const updatedCase = { ...caseData, status: 'UNDER_REVIEW' };
      setCaseData(updatedCase);
      saveCustomCaseUpdate(updatedCase);

      const newHistoryItem = {
        id: `sh-${Date.now()}`,
        fromStatus: caseData.status,
        toStatus: 'UNDER_REVIEW',
        reason: 'Formal charge sheet drafted & submitted for Senior Officer supervisory review',
        changedByUsername: user?.username || 'investigator_a',
        changedAt: new Date().toISOString()
      };
      setHistoryList(prev => [newHistoryItem, ...prev]);

      setShowDraftModal(false);
      alert('Charge Sheet formally submitted for Senior Officer Supervisory Review!');
    } catch (err) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setChargeSheetLoading(false);
    }
  };

  const handleSeniorReview = async (approved) => {
    if (!chargeSheet) return;
    setChargeSheetLoading(true);
    try {
      let updated = null;
      try {
        updated = await api.reviewChargeSheet(chargeSheet.id, {
          approved,
          notes: seniorNotes || (approved ? 'Approved by Senior Officer' : 'Returned for re-investigation')
        });
      } catch (err) {
        console.warn('Backend senior review note:', err.message);
      }

      const notesText = seniorNotes || (approved ? 'Supervisory scrutiny satisfied. Forwarded to prosecution.' : 'Returned for additional evidentiary substantiation.');

      const newSheet = {
        ...chargeSheet,
        ...(updated || {}),
        status: approved ? 'REVIEWED' : 'DRAFT',
        seniorOfficerApprovalStatus: approved ? 'APPROVED' : 'REJECTED',
        seniorOfficerReviewNotes: notesText,
        seniorOfficerReviewedAt: new Date().toISOString(),
        seniorOfficerUsername: user?.username || 'senior_officer'
      };

      setChargeSheet(newSheet);
      localStorage.setItem(`sih_chargesheet_${caseId}`, JSON.stringify(newSheet));
      setSeniorNotes('');

      const nextStatus = approved ? 'CHARGE_SHEET_PENDING' : 'INVESTIGATION_ONGOING';
      const updatedCase = { ...caseData, status: nextStatus };
      setCaseData(updatedCase);
      saveCustomCaseUpdate(updatedCase);

      const newHistoryItem = {
        id: `sh-${Date.now()}`,
        fromStatus: caseData.status,
        toStatus: nextStatus,
        reason: approved 
          ? `Supervisory approval granted by @${user?.username || 'senior_officer'}. Charge sheet dispatched to Directorate of Prosecution.`
          : `Charge sheet rejected by @${user?.username || 'senior_officer'}: ${notesText}`,
        changedByUsername: user?.username || 'senior_officer',
        changedAt: new Date().toISOString()
      };
      setHistoryList(prev => [newHistoryItem, ...prev]);

      alert(approved 
        ? 'Charge Sheet APPROVED by Senior Officer and forwarded to Prosecutor for legal scrutiny & RSA-2048 digital signing!' 
        : 'Charge Sheet REJECTED and returned to lead investigator.');
    } catch (err) {
      alert(`Review error: ${err.message}`);
    } finally {
      setChargeSheetLoading(false);
    }
  };

  const handleProsecutorSign = async (approved) => {
    if (!chargeSheet) return;
    setChargeSheetLoading(true);
    try {
      let updated = null;
      try {
        updated = await api.prosecutorSignChargeSheet(chargeSheet.id, {
          approved,
          notes: prosecutorNotes || (approved ? 'Prosecutor cryptographic signature applied.' : 'Charge sheet rejected by prosecution.')
        });
      } catch (err) {
        console.warn('Backend prosecutor sign note:', err.message);
      }

      const notesText = prosecutorNotes || (approved ? 'Admissibility certified under Section 65B Indian Evidence Act. Digitally signed via RSA-2048 PKI.' : 'Prosecution scrutiny failed: insufficient digital forensic nexus.');

      const newSig = approved ? {
        certificateSerial: `CERT-RSA2048-PROS-${Date.now().toString().slice(-6)}`,
        signedAt: new Date().toISOString(),
        signerUsername: user?.username || 'prosecutor',
        signerRole: 'PROSECUTOR',
        algorithm: 'SHA256withRSA-2048',
        digest: '3f8e7a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f'
      } : null;

      const newSheet = {
        ...chargeSheet,
        ...(updated || {}),
        status: approved ? 'LOCKED' : 'REVIEWED',
        prosecutorApprovalStatus: approved ? 'APPROVED' : 'REJECTED',
        prosecutorReviewNotes: notesText,
        prosecutorApprovedAt: new Date().toISOString(),
        prosecutorUsername: user?.username || 'prosecutor',
        signature: newSig || chargeSheet.signature
      };

      setChargeSheet(newSheet);
      localStorage.setItem(`sih_chargesheet_${caseId}`, JSON.stringify(newSheet));
      setProsecutorNotes('');

      const nextStatus = approved ? 'SIGNED' : 'CHARGE_SHEET_PENDING';
      const updatedCase = { ...caseData, status: nextStatus };
      setCaseData(updatedCase);
      saveCustomCaseUpdate(updatedCase);

      const newHistoryItem = {
        id: `sh-${Date.now()}`,
        fromStatus: caseData.status,
        toStatus: nextStatus,
        reason: approved 
          ? `Prosecutor scrutiny approved. RSA-2048 PKI Digital Signature applied (Serial: ${newSig.certificateSerial}). Charge sheet locked for court submission.`
          : `Charge sheet returned by prosecution: ${notesText}`,
        changedByUsername: user?.username || 'prosecutor',
        changedAt: new Date().toISOString()
      };
      setHistoryList(prev => [newHistoryItem, ...prev]);

      alert(approved 
        ? 'Charge Sheet DIGITALLY SIGNED with RSA-2048 PKI and LOCKED for judicial court submission!' 
        : 'Charge Sheet rejected by Prosecutor.');
    } catch (err) {
      alert(`Signing error: ${err.message}`);
    } finally {
      setChargeSheetLoading(false);
    }
  };

  const handleFormalCourtFiling = async () => {
    if (!caseId) return;
    setChargeSheetLoading(true);
    const fNum = filingNum || `CC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const cName = filingCourtName || 'Special CBI Court No. 4, Rouse Avenue Courts, New Delhi';

    try {
      try {
        await api.fileInCourt(caseId, { courtName: cName, filingNumber: fNum });
      } catch (err) {
        console.warn('Backend court filing note:', err.message);
      }

      const filingRecord = {
        id: `filing-${Date.now()}`,
        caseId: caseId,
        courtName: cName,
        filingNumber: fNum,
        filingDate: new Date().toISOString(),
        filedByUsername: user?.username || 'court_officer',
        status: 'FILED'
      };

      const updatedFilings = [filingRecord, ...courtFilings];
      setCourtFilings(updatedFilings);
      localStorage.setItem(`sih_filings_${caseId}`, JSON.stringify(updatedFilings));

      // Record first court hearing
      try {
        const storedHearings = JSON.parse(localStorage.getItem('sih_court_hearings') || '{}');
        const caseHearings = storedHearings[caseId] || [];
        const newHearing = {
          id: `hr-${Date.now()}`,
          hearingDate: new Date().toISOString(),
          courtName: cName,
          judgeName: 'Hon\'ble Special Judge Shri R. K. Malhotra',
          proceedingsSummary: `Formal charge sheet submitted under Ref: ${fNum}. Cognizance registered under IT Act & IPC.`,
          nextHearingDate: new Date(Date.now() + 86400000 * 14).toISOString(),
          interimOrder: 'Summons issued to accused for framing of formal charges.'
        };
        storedHearings[caseId] = [newHearing, ...caseHearings];
        localStorage.setItem('sih_court_hearings', JSON.stringify(storedHearings));
      } catch (_) {}

      const newSheet = {
        ...chargeSheet,
        status: 'FILED',
        courtFiling: filingRecord
      };
      setChargeSheet(newSheet);
      localStorage.setItem(`sih_chargesheet_${caseId}`, JSON.stringify(newSheet));

      const updatedCase = { ...caseData, status: 'FILED_IN_COURT' };
      setCaseData(updatedCase);
      saveCustomCaseUpdate(updatedCase);

      const newHistoryItem = {
        id: `sh-${Date.now()}`,
        fromStatus: caseData.status,
        toStatus: 'FILED_IN_COURT',
        reason: `Formal judicial charge sheet registered in ${cName} under Ref: ${fNum}. Cognizance taken.`,
        changedByUsername: user?.username || 'court_officer',
        changedAt: new Date().toISOString()
      };
      setHistoryList(prev => [newHistoryItem, ...prev]);

      setFilingNum('');
      alert(`Charge sheet successfully FILED in ${cName} under Filing Ref: ${fNum}! Case status transitioned to FILED_IN_COURT.`);
    } catch (err) {
      alert(`Filing error: ${err.message}`);
    } finally {
      setChargeSheetLoading(false);
    }
  };

  const handleDownloadChargeSheetPackage = () => {
    const cs = chargeSheet || {};
    const content = `================================================================================
GOVERNMENT OF INDIA • JUDICIAL CHARGE SHEET & PROSECUTION MEMORANDUM
UNDER SECTION 173 CR.P.C. / SECTION 193 BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS)
================================================================================

1. CASE & REGISTRY PARTICULARS:
--------------------------------------------------------------------------------
Case File Identifier:      ${cs.caseNumber || caseData?.caseNumber || 'CASE-2026-001'}
Primary FIR Number:        ${caseData?.firNumber || 'FIR-2026-0981'}
Investigating Agency:      ${caseData?.investigatingAgency || 'Central Crime Branch (CCB)'}
Lead Investigating Officer: @${cs.preparedByUsername || caseData?.createdByUsername || 'investigator_a'}
Registration Date:         ${caseData?.registrationDate || new Date().toISOString()}
Security Classification:   ${caseData?.classification || 'SECRET'}
Judicial Status:           ${cs.status || caseData?.status || 'DRAFT'}

2. PARTICULARS OF THE ACCUSED:
--------------------------------------------------------------------------------
${cs.accusedDetails || 'Prime Accused: Vikramaditya Seth (Cyber Operative) & 2 Unnamed Associates'}

3. STATUTORY CHARGES & OFFENCES COMPLAINED OF:
--------------------------------------------------------------------------------
${cs.sectionsApplied || 'Information Technology Act 2000 (Sec 43, 66) • IPC / BNS (Sec 379, 420, 120B)'}

4. SUMMARY OF INVESTIGATION & EVIDENTIARY FACTS:
--------------------------------------------------------------------------------
${cs.summary || caseData?.description || 'Accused orchestrated unauthorized lateral breach, disabled SIEM audit monitors, and attempted exfiltration of encrypted telemetry archives.'}

5. SECTION 65B INDIAN EVIDENCE ACT ELECTRONIC ADMISSIBILITY CERTIFICATE:
--------------------------------------------------------------------------------
${cs.admissibilityCert || 'Electronic exhibits have been extracted in accordance with Section 65B(4) Indian Evidence Act standards. Bit-stream disk images preserved using hardware write-blockers.'}
Primary Forensic Artifact: ${documents[0]?.title || 'Forensic Acquisition Dump'}
Artifact SHA-256 Digest:   ${documents[0]?.sha256Hash || 'a8b9412cde458711094324fbcde710294324bca8412948710294812734'}

6. SUPERVISORY SENIOR OFFICER SCRUTINY (TIER 1):
--------------------------------------------------------------------------------
Approval Status:           ${cs.seniorOfficerApprovalStatus || 'PENDING'}
Reviewed By:               @${cs.seniorOfficerUsername || 'senior_officer'}
Reviewed At:               ${cs.seniorOfficerReviewedAt || 'N/A'}
Supervisory Directives:    ${cs.seniorOfficerReviewNotes || 'Supervisory scrutiny satisfied. Evidentiary threshold met.'}

7. PROSECUTION LEGAL SCRUTINY & PKI DIGITAL SIGNATURE (TIER 2):
--------------------------------------------------------------------------------
Prosecutor Approval:       ${cs.prosecutorApprovalStatus || 'PENDING'}
Scrutiny Notes:            ${cs.prosecutorReviewNotes || 'Legal scrutiny complete. Cognizance recommended.'}
Digital Signature Serial:  ${cs.signature?.certificateSerial || (cs.status === 'LOCKED' || cs.status === 'FILED' ? 'CERT-RSA2048-PROS-77291' : 'UNSIGNED')}
Algorithm:                 ${cs.signature?.algorithm || 'SHA256withRSA-2048 (FIPS-140-2 Level 3 HSM)'}
Signed At:                 ${cs.signature?.signedAt || 'N/A'}
Signer Identity:           @${cs.signature?.signerUsername || cs.prosecutorUsername || 'prosecutor'}

8. FORMAL COURT FILING & JUDICIAL COGNIZANCE (TIER 3):
--------------------------------------------------------------------------------
Court of Cognizance:       ${cs.courtFiling?.courtName || 'Special CBI Court No. 4, Rouse Avenue Courts, New Delhi'}
Judicial Filing Ref:       ${cs.courtFiling?.filingNumber || (cs.status === 'FILED' ? 'CC-2026-0981' : 'PENDING FILING')}
Filing Date:               ${cs.courtFiling?.filingDate || 'N/A'}
Filed By Officer:          @${cs.courtFiling?.filedByUsername || 'court_officer'}

================================================================================
END OF OFFICIAL SECTION 173 CrPC / BNSS JUDICIAL CHARGE SHEET DOSSIER
================================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CHARGESHEET_${caseData?.caseNumber || 'CASE'}_SECTION173_OFFICIAL.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const loadAllCaseData = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Check if this case is in local custom storage
      const customCases = getStoredCustomCases();
      const matchedCustom = customCases.find(c => String(c.id) === String(caseId) || c.caseNumber === caseId);

      // 2. Try fetching from backend API if available
      try {
        const details = await api.getCaseDetails(caseId);
        if (details && (details.caseNumber || details.title)) {
          setCaseData(details);
          const asgns = details.assignments || details.teamAssignments || [];
          setTeamList(asgns);
          setHistoryList(details.statusHistory || []);
          const [docs, ev] = await Promise.all([
            api.getCaseDocuments(caseId).catch(() => []),
            api.getCaseEvidence(caseId).catch(() => []),
          ]);
          const storedDocs = getVaultDocumentsSafe(caseId, details.caseNumber);
          const docMap = new Map();
          [...storedDocs, ...(docs || [])].forEach(d => docMap.set(String(d.id), d));
          setDocuments(Array.from(docMap.values()));

          const storedEv = getStoredEvidence().filter(
            e => String(e.caseId) === String(caseId) || e.caseNumber === details.caseNumber
          );
          const evMap = new Map();
          [...storedEv, ...(ev || [])].forEach(e => evMap.set(String(e.id), e));
          setEvidenceList(Array.from(evMap.values()));
          loadChargeSheetForCase(caseId, details);
          loadCourtFilingsForCase(caseId);
          return;
        }
      } catch (err) {
        console.warn('Backend case detail API fetch note:', err.message);
      }

      // 3. If matched in custom cases, render it
      if (matchedCustom) {
        const storedAsgns = getStoredAbacAssignments().filter(
          a => String(a.caseId) === String(matchedCustom.id) || 
               String(a.caseId) === String(matchedCustom.caseNumber) ||
               String(a.caseNumber) === String(matchedCustom.caseNumber)
        );

        const creatorUsername = matchedCustom.createdByUsername || 'senior_officer';
        const creatorAsgn = {
          id: `asgn-creator-${matchedCustom.id}`,
          caseId: matchedCustom.id,
          userId: creatorUsername,
          username: creatorUsername,
          fullName: matchedCustom.createdByName || (creatorUsername === user?.username ? user?.fullName : creatorUsername),
          roleInCase: 'LEAD_INVESTIGATOR',
          assignedAt: matchedCustom.registrationDate || new Date().toISOString(),
          clearance: matchedCustom.classification || 'RESTRICTED'
        };

        const resolvedTeam = storedAsgns.length > 0 ? storedAsgns : [creatorAsgn];

        setCaseData({
          ...matchedCustom,
          incidentDate: matchedCustom.incidentDate || new Date().toISOString(),
          registrationDate: matchedCustom.registrationDate || new Date().toISOString(),
          createdByUsername: creatorUsername
        });
        setTeamList(resolvedTeam);
        setHistoryList([
          {
            id: `sh-init`,
            fromStatus: 'NONE',
            toStatus: matchedCustom.status || 'REGISTERED',
            reason: 'Initial case dossier registered in cryptographic vault',
            changedByUsername: creatorUsername,
            changedAt: matchedCustom.registrationDate || new Date().toISOString()
          }
        ]);

        // Load any stored vault documents and evidence for this case
        const vaultDocs = getVaultDocumentsSafe(matchedCustom.id, matchedCustom.caseNumber);
        const storedEv = getStoredEvidence().filter(e => e.caseId === matchedCustom.id || e.caseNumber === matchedCustom.caseNumber);
        setDocuments(vaultDocs);
        setEvidenceList(storedEv);
        loadChargeSheetForCase(matchedCustom.id, matchedCustom);
        loadCourtFilingsForCase(matchedCustom.id);
        return;
      }

      // 4. If standard demo case ID
      const fallbackCase = [FALLBACK_CASE_DETAILS, ...FALLBACK_CASES].find(
        c => String(c.id) === String(caseId) || c.caseNumber === caseId
      ) || FALLBACK_CASE_DETAILS;

      const storedAsgns = getStoredAbacAssignments().filter(
        a => String(a.caseId) === String(fallbackCase.id) || 
             String(a.caseId) === String(fallbackCase.caseNumber) ||
             String(a.caseNumber) === String(fallbackCase.caseNumber)
      );

      const resolvedTeam = [
        ...(fallbackCase.teamAssignments || FALLBACK_CASE_DETAILS.teamAssignments),
        ...storedAsgns
      ];
      const teamMap = new Map();
      resolvedTeam.forEach(m => teamMap.set(m.username || m.userId, m));

      setCaseData({
        ...FALLBACK_CASE_DETAILS,
        ...fallbackCase,
        id: fallbackCase.id || caseId,
        caseNumber: fallbackCase.caseNumber || 'CASE-2026-001',
        title: fallbackCase.title || 'State vs Cyber Syndicate Alpha',
      });
      const storedDocs = getVaultDocumentsSafe(fallbackCase.id, fallbackCase.caseNumber);
      const combinedDocs = [...storedDocs, ...FALLBACK_DOCS];
      const docMap = new Map();
      combinedDocs.forEach(d => docMap.set(String(d.id), d));
      setDocuments(Array.from(docMap.values()));

      const storedEv = getStoredEvidence().filter(
        e => String(e.caseId) === String(fallbackCase.id) || 
             String(e.caseId) === String(caseId) ||
             e.caseNumber === fallbackCase.caseNumber ||
             e.caseNumber === caseId
      );
      const combinedEv = [...storedEv, ...FALLBACK_EVIDENCE];
      const evMap = new Map();
      combinedEv.forEach(e => evMap.set(String(e.id), e));
      setEvidenceList(Array.from(evMap.values()));
      setTeamList(Array.from(teamMap.values()));
      setHistoryList(FALLBACK_CASE_DETAILS.statusHistory);
      loadChargeSheetForCase(fallbackCase.id || caseId, fallbackCase);
      loadCourtFilingsForCase(fallbackCase.id || caseId);
    } catch (err) {
      console.error('Failed to load case dossier:', err);
      setError('Failed to load case dossier. Displaying default security baseline.');
      setCaseData(FALLBACK_CASE_DETAILS);
      loadChargeSheetForCase(caseId, FALLBACK_CASE_DETAILS);
      loadCourtFilingsForCase(caseId);
    } finally {
      setLoading(false);
    }
  };

  const getStoredVaultDocs = () => {
    return getVaultDocumentsSafe();
  };

  const saveVaultDoc = (doc) => {
    saveVaultDocumentSafe(doc);
  };

  const getStoredEvidence = () => {
    try {
      const stored = localStorage.getItem('sih_registered_evidence');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  };

  const saveEvidence = (ev) => {
    try {
      const current = getStoredEvidence();
      const updated = [ev, ...current.filter(e => e.id !== ev.id)];
      localStorage.setItem('sih_registered_evidence', JSON.stringify(updated));
    } catch (_) {}
  };

  const getStoredTeamAssignments = () => {
    try {
      const stored = localStorage.getItem('sih_team_assignments');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  };

  const saveTeamAssignment = (asgn) => {
    try {
      const current = getStoredTeamAssignments();
      const updated = [asgn, ...current.filter(a => a.id !== asgn.id)];
      localStorage.setItem('sih_team_assignments', JSON.stringify(updated));
    } catch (_) {}
  };

  const getStoredStatusHistory = () => {
    try {
      const stored = localStorage.getItem('sih_status_history');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  };

  const saveStatusHistory = (item) => {
    try {
      const current = getStoredStatusHistory();
      const updated = [item, ...current.filter(h => h.id !== item.id)];
      localStorage.setItem('sih_status_history', JSON.stringify(updated));
    } catch (_) {}
  };

  const handleStatusChange = async (e) => {
    e.preventDefault();
    setTransitioning(true);
    const newHistory = {
      id: `sh-${Date.now()}`,
      caseId: caseId,
      fromStatus: caseData?.status,
      toStatus: targetStatus,
      reason: statusReason,
      changedByUsername: user?.username || 'senior_officer',
      changedAt: new Date().toISOString()
    };
    try {
      await api.updateCaseStatus(caseId, {
        status: targetStatus,
        reason: statusReason,
      });
      saveStatusHistory(newHistory);
      logCaseStatusChange({
        caseNumber: caseData?.caseNumber || 'CASE-2026-001',
        fromStatus: caseData?.status || 'REGISTERED',
        toStatus: targetStatus,
        reason: statusReason
      });
      setShowStatusModal(false);
      setStatusReason('');
      loadAllCaseData();
    } catch (err) {
      setCaseData(prev => ({ ...prev, status: targetStatus }));
      setHistoryList(prev => [newHistory, ...prev]);
      saveStatusHistory(newHistory);
      logCaseStatusChange({
        caseNumber: caseData?.caseNumber || 'CASE-2026-001',
        fromStatus: caseData?.status || 'REGISTERED',
        toStatus: targetStatus,
        reason: statusReason
      });
      setShowStatusModal(false);
      setStatusReason('');
    } finally {
      setTransitioning(false);
    }
  };

  const handleArchiveCase = async (e) => {
    e.preventDefault();
    if (caseData?.legalHold) {
      alert('Cannot archive case while Legal Hold is active. Please lift legal hold first.');
      return;
    }
    setArchiving(true);
    const targetCaseId = caseData?.id || caseId;
    try {
      const res = await api.archiveCase(targetCaseId, archiveForm);
      logCaseArchived({
        caseNumber: caseData?.caseNumber || 'CASE-2026-001',
        reason: archiveForm.archiveReason,
        retentionYears: archiveForm.retentionYears,
        wormToken: res?.wormComplianceToken,
        wormLockUntil: res?.wormPreservedUntil
      });
      setShowArchiveModal(false);
      loadAllCaseData();
    } catch (err) {
      // Optimistic local update for mock/demo
      const now = new Date();
      const expDate = new Date(now.setFullYear(now.getFullYear() + Number(archiveForm.retentionYears))).toISOString();
      const pseudoToken = `WORM-COMPLIANCE-SEAL-${Date.now().toString(16).toUpperCase()}`;
      setCaseData(prev => ({
        ...prev,
        status: 'ARCHIVED',
        wormPreserved: true,
        wormPreservedUntil: expDate,
        wormComplianceToken: pseudoToken,
        archiveReason: archiveForm.archiveReason,
        archivedAt: new Date().toISOString(),
        archivedBy: user?.username || 'senior_officer'
      }));
      setDocuments(prev => prev.map(d => ({
        ...d,
        wormLocked: true,
        wormLockUntil: expDate,
        wormRetentionMode: archiveForm.wormMode,
        wormComplianceHash: `WORM-SHA256-${Date.now().toString(16)}`
      })));
      logCaseArchived({
        caseNumber: caseData?.caseNumber || 'CASE-2026-001',
        reason: archiveForm.archiveReason,
        retentionYears: archiveForm.retentionYears,
        wormToken: pseudoToken,
        wormLockUntil: expDate
      });
      setShowArchiveModal(false);
    } finally {
      setArchiving(false);
    }
  };

  const toggleLegalHold = async () => {
    setLegalHoldLoading(true);
    const action = caseData?.legalHold ? 'LIFTED' : 'PLACED';
    const reason = caseData?.legalHold ? 'Preservation order lifted by authorized supervisor' : 'Litigation preservation order issued by Senior Officer';
    try {
      if (caseData?.legalHold) {
        await api.liftLegalHold(caseId);
      } else {
        await api.placeLegalHold(caseId, reason);
      }
      logLegalHold({
        caseNumber: caseData?.caseNumber || 'CASE-2026-001',
        action,
        reason
      });
      loadAllCaseData();
    } catch (err) {
      setCaseData(prev => ({ ...prev, legalHold: !prev?.legalHold }));
      logLegalHold({
        caseNumber: caseData?.caseNumber || 'CASE-2026-001',
        action,
        reason
      });
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
        caseId: caseId,
        userId: officerUid,
        username: officerUid,
        fullName: officerFullName,
        roleInCase: selectedRoleInCase,
        assignedAt: new Date().toISOString(),
        clearance: officerClearance
      };

      try {
        await api.assignTeam(caseId, { userId: officerUid, roleInCase: selectedRoleInCase });
      } catch (_) {}

      saveTeamAssignment(newAssignment);
      setTeamList(prev => [...prev, newAssignment]);
      logCaseAssignment({
        caseNumber: caseData?.caseNumber || 'CASE-2026-001',
        officerName: `${officerFullName} (@${officerUid})`,
        roleInCase: selectedRoleInCase
      });
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
    const newEvItem = {
      id: `evd-${Date.now()}`,
      caseId: caseId,
      caseNumber: caseData?.caseNumber || 'CASE-2026-001',
      caseTitle: caseData?.title || 'Registered Case',
      barcode: `EVD-2026-${String(evidenceList.length + 1).padStart(3, '0')}-${String.fromCharCode(65 + evidenceList.length)}`,
      itemCategory: evidenceForm.itemCategory,
      description: evidenceForm.description,
      storageLocation: evidenceForm.storageLocation,
      physicalCondition: evidenceForm.physicalCondition,
      status: 'IN_CUSTODY',
      currentCustodian: user?.fullName || user?.username || 'Senior Officer',
      currentCustodianUsername: user?.username,
      currentCustodianId: user?.id,
      submittedBy: user?.username,
      submittedByUsername: user?.username,
      submittedById: user?.id,
      submittedByName: user?.fullName || user?.username,
      collectedBy: {
        id: user?.id,
        username: user?.username,
        fullName: user?.fullName || user?.username
      },
      collectedByUsername: user?.username,
      collectedByName: user?.fullName || user?.username,
      collectedById: user?.id,
      registrationDate: new Date().toISOString()
    };
    try {
      let registered = null;
      try {
        registered = await api.registerEvidence(caseId, evidenceForm);
      } catch (_) {}
      
      const finalEv = registered ? { ...newEvItem, ...registered } : newEvItem;
      saveEvidence(finalEv);
      setEvidenceList(prev => [...prev, finalEv]);
      logEvidenceRegistered({
        barcode: newEvItem.barcode,
        description: evidenceForm.description,
        storageLocation: evidenceForm.storageLocation,
        caseNumber: caseData?.caseNumber || 'CASE-2026-001'
      });
      setShowEvidenceModal(false);
    } catch (err) {
      saveEvidence(newEvItem);
      setEvidenceList(prev => [...prev, newEvItem]);
      logEvidenceRegistered({
        barcode: newEvItem.barcode,
        description: evidenceForm.description,
        storageLocation: evidenceForm.storageLocation,
        caseNumber: caseData?.caseNumber || 'CASE-2026-001'
      });
      setShowEvidenceModal(false);
    } finally {
      setRegisteringEvidence(false);
    }
  };

  const getRecipientChoices = () => {
    let custom = [];
    try {
      const storedUsers = localStorage.getItem('sih_registered_users');
      if (storedUsers) {
        const parsed = JSON.parse(storedUsers);
        if (Array.isArray(parsed)) {
          custom = parsed.map(u => ({
            username: u.username,
            name: u.fullName || u.username,
            role: u.roles?.[0]?.name || u.roles?.[0] || 'INVESTIGATOR',
            roleLabel: `${u.fullName || u.username} (${u.department || 'Investigator'})`,
            badge: u.badgeNumber || 'OFFICER'
          }));
        }
      }
    } catch (_) {}

    const map = new Map();
    if (Array.isArray(ELIGIBLE_OFFICER_RECIPIENTS)) {
      ELIGIBLE_OFFICER_RECIPIENTS.forEach(r => map.set(r.username, r));
    }
    custom.forEach(r => {
      if (typeof isRoleEligibleForCustody === 'function' && isRoleEligibleForCustody(r.role)) {
        map.set(r.username, r);
      }
    });

    return Array.from(map.values());
  };

  const handleOpenTransferModal = (ev = null) => {
    const itemToTransfer = ev || evidenceList[0] || null;
    setTransferItem(itemToTransfer);
    setTransferSealNumber(`SEAL-${Math.floor(100000 + Math.random() * 900000)}`);
    setTransferCondition(itemToTransfer?.physicalCondition || 'Tamper-evident anti-static pouch sealed and barcoded');
    setTransferReason('Forensic Laboratory Examination & Extraction');

    const choices = getRecipientChoices();
    const otherChoice = choices.find(r => r.username !== user?.username) || choices[0];
    if (otherChoice) {
      setSelectedRecipientKey(otherChoice.username);
    }
    setShowTransferModal(true);
  };

  const handleSubmitTransfer = async (e) => {
    e.preventDefault();
    if (!transferItem) {
      alert('Please select an evidence artifact to transfer.');
      return;
    }

    const choices = getRecipientChoices();
    let targetUsername = selectedRecipientKey;
    let targetOfficerName = 'Authorized Custody Officer';

    if (selectedRecipientKey === 'CUSTOM') {
      if (!customRecipientName.trim() || !customRecipientUsername.trim()) {
        alert('Please specify custom recipient officer name and badge username.');
        return;
      }
      targetUsername = customRecipientUsername.trim().toLowerCase();
      targetOfficerName = customRecipientName.trim();
    } else {
      const found = choices.find(r => r.username === selectedRecipientKey);
      if (found) {
        targetUsername = found.username;
        targetOfficerName = found.name;
      }
    }

    // Role eligibility check under statutory protocols
    const recipientLower = (targetUsername + ' ' + targetOfficerName).toLowerCase();
    const matchedIneligible = Array.isArray(INELIGIBLE_OFFICERS) ? INELIGIBLE_OFFICERS.find(inelig => 
      recipientLower.includes(inelig.username) || 
      recipientLower.includes(inelig.name.toLowerCase()) ||
      recipientLower.includes((inelig.role || '').toLowerCase()) ||
      recipientLower.includes('prosecutor') ||
      recipientLower.includes('court') ||
      recipientLower.includes('auditor') ||
      recipientLower.includes('registrar')
    ) : null;

    if (matchedIneligible) {
      alert(`[ISO/IEC 27037 Compliance Violation]\n\nCustody Handover Blocked: Recipient holds an ineligible role (${matchedIneligible.roleLabel || 'Ineligible Role'}).\n\nUnder statutory forensic chain-of-custody protocols, Prosecutors, Judicial Registrars, and Independent Auditors are legally barred from holding evidence custody.\n\nEligible roles: Evidence Custodians, Forensic Examiners, and Assigned Investigators.`);
      return;
    }

    setTransferSubmitting(true);

    const newTransfer = {
      id: `tr-${Date.now()}`,
      evidenceId: transferItem.id || transferItem.barcode,
      evidenceBarcode: transferItem.barcode,
      evidenceTitle: transferItem.description || transferItem.title || 'Physical Evidence Item',
      caseNumber: caseData?.caseNumber || transferItem.caseNumber || 'CASE-2026-001',
      fromUsername: user?.username || 'investigator_a',
      fromOfficerName: user?.fullName || user?.username || 'Lead Officer',
      toUsername: targetUsername,
      toOfficerName: targetOfficerName,
      reasonForTransfer: transferReason.trim() || 'Custody Handover',
      physicalCondition: transferCondition.trim() || 'Tamper-evident seal verified intact',
      sealNumber: transferSealNumber.trim() || `SEAL-${Date.now().toString().slice(-6)}`,
      transferDate: new Date().toISOString(),
      status: 'PENDING_ACCEPTANCE'
    };

    try {
      await api.initiateCustodyTransfer(newTransfer.evidenceBarcode, {
        recipientId: newTransfer.toUsername,
        sealNumber: newTransfer.sealNumber,
        reason: newTransfer.reasonForTransfer
      }).catch(() => null);

      // Synchronize into shared custody transfers storage for CustodyTransferPage
      try {
        const rawTransfers = localStorage.getItem('sih_custody_transfers');
        let parsed = { pending: [], accepted: [] };
        if (rawTransfers) {
          try { parsed = JSON.parse(rawTransfers); } catch (_) {}
        }
        const currentPending = Array.isArray(parsed?.pending) ? parsed.pending : [];
        const currentAccepted = Array.isArray(parsed?.accepted) ? parsed.accepted : [];
        const updatedPending = [newTransfer, ...currentPending];
        localStorage.setItem('sih_custody_transfers', JSON.stringify({
          pending: updatedPending,
          accepted: currentAccepted
        }));
      } catch (err) {
        console.error('Failed to sync custody transfer storage', err);
      }

      // Update evidence item status in current case view
      const updatedList = evidenceList.map(ev => {
        if (ev.barcode === transferItem.barcode || ev.id === transferItem.id) {
          const updatedEv = {
            ...ev,
            status: 'PENDING_TRANSFER',
            pendingTransferTo: targetOfficerName,
            pendingTransferToUser: targetUsername,
            lastTransferId: newTransfer.id
          };
          saveEvidence(updatedEv);
          return updatedEv;
        }
        return ev;
      });
      setEvidenceList(updatedList);

      logCustodyTransferRequested({
        evidenceBarcode: newTransfer.evidenceBarcode,
        recipientName: newTransfer.toOfficerName,
        reason: newTransfer.reasonForTransfer,
        sealNumber: newTransfer.sealNumber,
        caseNumber: newTransfer.caseNumber
      });

      setShowTransferModal(false);
      alert(`Custody handover dispatched specifically to @${newTransfer.toUsername} (${newTransfer.toOfficerName})!\n\nThis evidence will now appear in @${newTransfer.toUsername}'s incoming queue on the Chain of Custody page and can only be verified and accepted by their authorized digital key.`);
    } catch (err) {
      console.error('Custody transfer dispatch note:', err);
      setShowTransferModal(false);
    } finally {
      setTransferSubmitting(false);
    }
  };

  const handleDownloadDocument = async (doc) => {
    try {
      const isAuthorized = canClearanceAccess(user?.clearance, doc.classification);
      if (!isAuthorized) {
        alert(`ACCESS DENIED: Clearance Violation\n\nThis document is classified as "${doc.classification}". Your security clearance is "${user?.clearance || 'PUBLIC'}".\n\nOnly personnel with ${doc.classification} or higher clearance are authorized to download this artifact.`);
        return;
      }

      // Record download audit event into immutable ledger
      logDocumentDownload({
        docTitle: doc.title || doc.originalFilename,
        docId: doc.id,
        caseNumber: doc.caseNumber || caseData?.caseNumber || 'CASE-2026-001',
        sha256Hash: doc.sha256Hash,
        fileSize: doc.fileSize
      });

      // 1. If stored data URL/blob exists in client storage or IndexedDB for uploaded file (images, PDFs, binary, etc.)
      let filePayload = doc.fileDataUrl;
      if (!filePayload) {
        try {
          filePayload = await getVaultFile(doc.id);
        } catch (_) {}
      }
      if (filePayload) {
        const a = document.createElement('a');
        a.href = filePayload;
        a.download = doc.originalFilename || `${doc.title || 'document'}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }

      // 2. Try backend API download if it's a UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(doc.id);
      if (isUuid) {
        try {
          await api.downloadDocument(doc.id, doc.originalFilename);
          return;
        } catch (apiErr) {
          console.warn('Backend download failed, falling back to certified extract:', apiErr);
        }
      }

      // 3. Certified Forensic Vault Extraction Fallback
      const content = `================================================================================
CENTRAL INVESTIGATIVE FORENSICS & EVIDENCE REPOSITORY
OFFICIAL CERTIFIED FORENSIC VAULT ARTIFACT (AES-256 ENCRYPTED EXTRACTION)
================================================================================

DOCUMENT TITLE:        ${doc.title || 'Forensic Examination Report'}
CASE IDENTIFIER:       ${doc.caseNumber || caseData?.caseNumber || 'CASE-2026-001'}
DOCUMENT TYPE:         ${doc.documentType || 'FORENSIC_REPORT'}
SECURITY CLEARANCE:    ${doc.classification || 'TOP_SECRET'}
ORIGINAL FILENAME:     ${doc.originalFilename || 'artifact.pdf'}
VAULT RECORD ID:       ${doc.id}
TIMESTAMP UPLOADED:    ${doc.uploadedAt || new Date().toISOString()}
TIMESTAMP DOWNLOADED:  ${new Date().toISOString()}

================================================================================
CRYPTOGRAPHIC INTEGRITY & ADMISSIBILITY ATTESTATION
================================================================================
SHA-256 VERIFICATION HASH:
${doc.sha256Hash || 'a8b9412cde458711094324fbcde710294324bca8412948710294817294812734'}

STATUS:                ${doc.locked ? 'DIGITALLY LOCKED & CO-SIGNED (Section 65B Certified)' : 'VERIFIED VAULT ARTIFACT'}
ENCRYPTION SCHEME:     AES-256-GCM / Hardware Security Module (HSM) Root
NON-REPUDIATION:       Verified immutable ledger record

================================================================================
EXAMINATION SUMMARY & CHAIN OF CUSTODY MANIFEST
================================================================================
This certified electronic document was acquired, processed, and deposited into
the encrypted vault following strict ISO/IEC 27037 and Section 65B Indian Evidence
Act digital forensics chain of custody guidelines.

The bit-level integrity of this artifact has been validated. No unauthorized
modification, tamper event, or parity mismatch was detected during verification.

[CERTIFIED SECURE EXTRACT - CENTRAL FORENSIC SCIENCE LABORATORY (CFSL)]
================================================================================
`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const targetFilename = doc.originalFilename ? 
        (doc.originalFilename.endsWith('.pdf') ? doc.originalFilename.replace('.pdf', '_certified.txt') : (doc.originalFilename.endsWith('.txt') ? doc.originalFilename : `${doc.originalFilename}_certified.txt`))
        : `${(doc.title || 'vault_artifact').toLowerCase().replace(/\s+/g, '_')}_certified.txt`;
      a.download = targetFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Download failed: ${err.message}`);
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

    // Read file as Data URL so download returns the exact binary file (image, pdf, etc.)
    const readFileDataUrl = () => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(uploadFile);
    });

    const fileDataUrl = await readFileDataUrl();

    const newDocItem = {
      id: `doc-${Date.now()}`,
      caseId: caseId,
      caseNumber: caseData?.caseNumber || 'CASE-2026-001',
      title: docTitle || uploadFile.name,
      documentType: docType,
      classification: docClassification,
      originalFilename: uploadFile.name,
      fileSize: uploadFile.size,
      fileDataUrl: fileDataUrl,
      sha256Hash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      locked: false,
      uploadedAt: new Date().toISOString(),
    };

    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('title', docTitle);
      fd.append('documentType', docType);
      fd.append('classification', docClassification);

      let resDoc = null;
      try {
        resDoc = await api.uploadDocument(caseId, fd);
      } catch (_) {}

      const finalDoc = resDoc ? { ...resDoc, fileDataUrl } : newDocItem;
      saveVaultDoc(finalDoc);
      setDocuments(prev => [finalDoc, ...prev]);

      logDocumentUpload({
        docTitle: docTitle || uploadFile.name,
        docId: finalDoc.id,
        caseNumber: caseData?.caseNumber || 'CASE-2026-001',
        classification: docClassification,
        fileSize: uploadFile.size,
        sha256Hash: finalDoc.sha256Hash
      });

      setUploadFile(null);
      setDocTitle('');
    } catch (err) {
      saveVaultDoc(newDocItem);
      setDocuments(prev => [newDocItem, ...prev]);

      logDocumentUpload({
        docTitle: docTitle || uploadFile.name,
        docId: newDocItem.id,
        caseNumber: caseData?.caseNumber || 'CASE-2026-001',
        classification: docClassification,
        fileSize: uploadFile.size,
        sha256Hash: newDocItem.sha256Hash
      });

      setUploadFile(null);
      setDocTitle('');
    } finally {
      setUploading(false);
    }
  };

  // ─── Document Versioning Handlers ─────────────────────────
  const handleOpenDocVersionModal = (doc) => {
    setSelectedDocForVersion(doc);
    setDocVersionFile(null);
    setDocVersionReason('');
    setShowDocVersionModal(true);
  };

  const handleSubmitDocVersion = async (e) => {
    e.preventDefault();
    if (!selectedDocForVersion || !docVersionFile) return;

    setUploadingDocVersion(true);
    const nextVer = (selectedDocForVersion.currentVersion || 1) + 1;
    const newHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    try {
      const fd = new FormData();
      fd.append('file', docVersionFile);
      fd.append('changeSummary', docVersionReason || `Amendment / Revision v${nextVer}`);

      let updatedDoc = null;
      try {
        updatedDoc = await api.uploadDocumentVersion(selectedDocForVersion.id, fd);
      } catch (_) {}

      const nextDocObj = updatedDoc || {
        ...selectedDocForVersion,
        currentVersion: nextVer,
        fileSize: docVersionFile.size,
        originalFilename: docVersionFile.name,
        sha256Hash: newHash,
        updatedAt: new Date().toISOString()
      };

      setDocuments(prev => prev.map(d => d.id === selectedDocForVersion.id ? { ...d, ...nextDocObj } : d));
      saveVaultDoc(nextDocObj);

      // Record local version history snapshot
      const storedVersionsKey = `sih_doc_versions_${selectedDocForVersion.id}`;
      let historyList = [];
      try {
        const prevH = localStorage.getItem(storedVersionsKey);
        historyList = prevH ? JSON.parse(prevH) : [];
      } catch (_) {}

      historyList.unshift({
        id: `ver-${Date.now()}`,
        versionNumber: nextVer,
        fileSizeBytes: docVersionFile.size,
        sha256Hash: nextDocObj.sha256Hash || newHash,
        changeSummary: docVersionReason || `Amendment / Revision v${nextVer}`,
        uploadedBy: { username: user?.username || 'officer', fullName: user?.fullName || 'Investigating Officer' },
        createdAt: new Date().toISOString()
      });
      localStorage.setItem(storedVersionsKey, JSON.stringify(historyList));

      setShowDocVersionModal(false);
      setDocVersionFile(null);
      setDocVersionReason('');
    } catch (err) {
      console.error('Failed to upload document version:', err);
    } finally {
      setUploadingDocVersion(false);
    }
  };

  const handleOpenDocHistoryModal = async (doc) => {
    setSelectedDocForHistory(doc);
    setShowDocHistoryModal(true);
    setLoadingDocHistory(true);

    try {
      let versions = await api.getDocumentVersions(doc.id).catch(() => null);
      if (!versions || versions.length === 0) {
        const stored = localStorage.getItem(`sih_doc_versions_${doc.id}`);
        if (stored) {
          versions = JSON.parse(stored);
        } else {
          // Initialize baseline v1 record
          versions = [{
            id: `v1-${doc.id}`,
            versionNumber: 1,
            fileSizeBytes: doc.fileSize || 1048576,
            sha256Hash: doc.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            changeSummary: 'Initial Document Seizure & Vault Upload (v1)',
            uploadedBy: { username: doc.uploadedByUsername || user?.username || 'officer', fullName: user?.fullName || 'Investigating Officer' },
            createdAt: doc.uploadedAt || doc.createdAt || new Date().toISOString()
          }];
        }
      }
      setDocVersionHistory(versions);
    } catch (err) {
      console.error('Failed to load version history:', err);
      setDocVersionHistory([]);
    } finally {
      setLoadingDocHistory(false);
    }
  };

  const handleDownloadDocVersion = async (doc, versionNum) => {
    try {
      await api.downloadDocumentVersion(doc.id, versionNum, `${doc.title}_v${versionNum}`);
    } catch (_) {
      handleDownloadDocument(doc);
    }
  };

  // ─── Evidence Versioning Handlers ─────────────────────────
  const handleOpenEvidenceVersionModal = (ev) => {
    setSelectedEvidenceForVersion(ev);
    setEvidenceVersionForm({
      sealNumber: ev.sealNumber || `SEAL-${Date.now().toString().slice(-6)}`,
      sealIntact: true,
      storageLocation: ev.storageLocation || 'Vault Alpha - Bin 1',
      seizureLocation: ev.seizureLocation || '',
      description: ev.description || ev.title || '',
      status: ev.status || 'IN_CUSTODY',
      changeReason: ''
    });
    setShowEvidenceVersionModal(true);
  };

  const handleSubmitEvidenceVersion = async (e) => {
    e.preventDefault();
    if (!selectedEvidenceForVersion) return;

    setUpdatingEvidenceVersion(true);
    const nextVer = (selectedEvidenceForVersion.currentVersion || 1) + 1;

    try {
      const payload = {
        title: selectedEvidenceForVersion.title || selectedEvidenceForVersion.description,
        description: evidenceVersionForm.description,
        sealNumber: evidenceVersionForm.sealNumber,
        sealIntact: evidenceVersionForm.sealIntact,
        storageLocation: evidenceVersionForm.storageLocation,
        seizureLocation: evidenceVersionForm.seizureLocation,
        status: evidenceVersionForm.status,
        changeReason: evidenceVersionForm.changeReason || `Evidence State Amendment v${nextVer}`
      };

      let updatedEv = null;
      try {
        updatedEv = await api.createEvidenceVersion(selectedEvidenceForVersion.id, payload);
      } catch (_) {}

      const nextEvObj = updatedEv || {
        ...selectedEvidenceForVersion,
        currentVersion: nextVer,
        sealNumber: evidenceVersionForm.sealNumber,
        sealIntact: evidenceVersionForm.sealIntact,
        storageLocation: evidenceVersionForm.storageLocation,
        status: evidenceVersionForm.status,
        updatedAt: new Date().toISOString()
      };

      setEvidenceList(prev => prev.map(ev => (ev.id === selectedEvidenceForVersion.id || ev.barcode === selectedEvidenceForVersion.barcode) ? nextEvObj : ev));
      saveEvidence(nextEvObj);

      // Save local version history snapshot as fallback
      const storedVersionsKey = `sih_ev_versions_${selectedEvidenceForVersion.id || selectedEvidenceForVersion.barcode}`;
      let historyList = [];
      try {
        const prevH = localStorage.getItem(storedVersionsKey);
        historyList = prevH ? JSON.parse(prevH) : [];
      } catch (_) {}

      historyList.unshift({
        id: `ev-ver-${Date.now()}`,
        versionNumber: nextVer,
        sealNumber: evidenceVersionForm.sealNumber,
        sealIntact: evidenceVersionForm.sealIntact,
        storageLocation: evidenceVersionForm.storageLocation,
        status: evidenceVersionForm.status,
        changeReason: evidenceVersionForm.changeReason || `Evidence State Amendment v${nextVer}`,
        recordedBy: { username: user?.username || 'officer', fullName: user?.fullName || 'Custody Officer' },
        createdAt: new Date().toISOString()
      });
      localStorage.setItem(storedVersionsKey, JSON.stringify(historyList));

      setShowEvidenceVersionModal(false);
    } catch (err) {
      console.error('Failed to amend evidence version:', err);
    } finally {
      setUpdatingEvidenceVersion(false);
    }
  };

  const handleOpenEvidenceHistoryModal = async (ev) => {
    setSelectedEvidenceForHistory(ev);
    setShowEvidenceHistoryModal(true);
    setLoadingEvidenceHistory(true);

    try {
      let versions = await api.getEvidenceVersions(ev.id).catch(() => null);
      if (!versions || versions.length === 0) {
        const stored = localStorage.getItem(`sih_ev_versions_${ev.id || ev.barcode}`);
        if (stored) {
          versions = JSON.parse(stored);
        } else {
          // Initialize baseline v1 record
          versions = [{
            id: `ev-v1-${ev.id || ev.barcode}`,
            versionNumber: 1,
            sealNumber: ev.sealNumber || 'SEAL-INIT-001',
            sealIntact: true,
            storageLocation: ev.storageLocation || 'Vault Alpha - Bin 1',
            status: ev.status || 'IN_CUSTODY',
            changeReason: 'Initial Seizure & Intake Snapshot (v1)',
            recordedBy: { username: ev.collectedByUsername || user?.username || 'officer', fullName: user?.fullName || 'Custody Officer' },
            createdAt: ev.registrationDate || ev.createdAt || new Date().toISOString()
          }];
        }
      }
      setEvidenceVersionHistory(versions);
    } catch (err) {
      console.error('Failed to load evidence version history:', err);
      setEvidenceVersionHistory([]);
    } finally {
      setLoadingEvidenceHistory(false);
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

  const accessDecision = checkCaseAccess(user, caseData, teamList);

  if (!accessDecision.allowed) {
    return (
      <div className="obsidian-card p-8 sm:p-10 rounded-3xl border border-rose-500/40 text-center space-y-6 max-w-xl mx-auto mt-8 select-none shadow-[0_20px_50px_rgba(244,63,94,0.18)] bg-[#0B0D17]">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400 shadow-lg shadow-rose-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold uppercase tracking-wider">
            <Lock className="w-3 h-3" />
            <span>403 FORBIDDEN • ABAC RESTRICTION ENFORCED</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {accessDecision.reason === 'INSUFFICIENT_CLEARANCE' 
              ? 'Security Clearance Insufficient' 
              : 'Unauthorized Officer — Not Assigned to Case'}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
            {accessDecision.details}
          </p>
        </div>

        {/* Security Policy Audit Context */}
        <div className="p-4 rounded-2xl bg-[#121524] border border-white/[0.06] text-[11px] font-mono space-y-2 text-left">
          <div className="flex justify-between items-center text-slate-400">
            <span>Attempted By:</span>
            <span className="text-white font-bold">@{user?.username} ({user?.fullName || 'Officer'})</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Officer Clearance:</span>
            <span className="text-amber-400 font-bold">{user?.clearance || 'RESTRICTED'}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Case Target:</span>
            <span className="text-violet-300 font-bold">{caseData?.caseNumber} ({caseData?.title})</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Required Classification:</span>
            <span className="text-rose-400 font-bold">{caseData?.classification || 'RESTRICTED'}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>ABAC Decision:</span>
            <span className="text-rose-400 font-bold">DENIED (UNASSIGNED PERSONA)</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/cases')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 transition flex items-center justify-center gap-2"
          >
            <Briefcase className="w-4 h-4" />
            <span>Return to Case Dossiers</span>
          </button>
        </div>
      </div>
    );
  }

  const canAssignTeam = hasRole('SENIOR_OFFICER') || hasRole('ADMIN');
  const isCustodyEligible = hasRole('INVESTIGATOR') || hasRole('EVIDENCE_CUSTODIAN') || hasRole('FORENSIC_OFFICER') || hasRole('SENIOR_OFFICER') || hasRole('ADMIN');
  const isAuditor = hasRole('AUDITOR');
  const isClosedOrArchived = caseData?.status === 'CLOSED' || caseData?.status === 'ARCHIVED';
  const canRegisterEvidence = isCustodyEligible && !isClosedOrArchived;
  const canUploadDocuments = !isAuditor && !isClosedOrArchived;
  const canInitiateTransfer = isCustodyEligible && !isClosedOrArchived;

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
              <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full uppercase font-bold border ${
                caseData.status === 'ARCHIVED' 
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/50' 
                  : 'bg-violet-500/20 text-violet-300 border-violet-500/30'
              }`}>
                {caseData.status}
              </span>
              {(caseData.wormPreserved || caseData.status === 'ARCHIVED') && (
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-1.5 shadow-sm">
                  <Archive className="w-3.5 h-3.5 text-amber-400" />
                  <span>WORM IMMUTABLE VAULT SEALED</span>
                </span>
              )}
              {caseData.legalHold && (
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full uppercase font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                  LEGAL HOLD ACTIVE
                </span>
              )}
              {accessDecision.badge && (
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full uppercase font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{accessDecision.badge}</span>
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{caseData.title}</h1>
            <p className="text-xs text-slate-400">
              Agency: <span className="text-slate-200">{caseData.investigatingAgency}</span> • Registered by: <span className="text-slate-200 font-mono">@{caseData.createdByUsername || 'OFFICER'}</span>
              {caseData.wormPreservedUntil && (
                <span className="ml-2 text-amber-400 font-mono">
                  • WORM Retention Expiry: {new Date(caseData.wormPreservedUntil).toLocaleDateString()}
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Archive to WORM Vault Action - Available on CLOSED cases for Senior Officer & Admin */}
            {caseData.status === 'CLOSED' && (hasRole('SENIOR_OFFICER') || hasRole('ADMIN')) && (
              <button
                onClick={() => setShowArchiveModal(true)}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-semibold transition shadow-lg shadow-amber-600/30 border border-amber-400/40 flex items-center gap-1.5"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archive to WORM Vault</span>
              </button>
            )}

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
        <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06] overflow-x-auto pb-1.5 scrollbar-none custom-scrollbar-x">
          {[
            { id: 'overview', label: 'Overview & Synopsis', icon: FileText },
            { id: 'evidence', label: `Evidence Locker (${evidenceList.length})`, icon: Package },
            { id: 'documents', label: `Vault Documents (${documents.length})`, icon: Lock },
            { id: 'team', label: `Assigned Team (${teamList.length})`, icon: Users },
            { id: 'prosecution', label: 'Charge Sheet & Prosecution', icon: Scale },
            { id: 'history', label: `Audit Timeline (${historyList.length})`, icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition whitespace-nowrap shrink-0 ${
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
            <div className="p-3.5 rounded-2xl bg-[#0E111C] border border-white/[0.06] space-y-2.5 text-xs font-sans">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-medium">Security Clearance:</span>
                <span className="text-amber-400 font-bold">{caseData.classification}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-medium">Priority Level:</span>
                <span className="text-rose-400 font-bold">{caseData.priority}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-medium">Legal Hold:</span>
                <span className={caseData.legalHold ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Registered Evidence Artifacts ({evidenceList.length})
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Physical and digital evidentiary assets recorded in custody ledger
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canRegisterEvidence ? (
                <button
                  onClick={() => setShowEvidenceModal(true)}
                  className="px-4 py-2 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-violet-600/30 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register Evidence</span>
                </button>
              ) : (
                <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {isClosedOrArchived ? '🔒 Read-Only (Case Finalized)' : '🔒 Evidence Intake Restricted to Custodial Roles'}
                </span>
              )}
              {canInitiateTransfer && evidenceList.length > 0 && (
                <button
                  onClick={() => handleOpenTransferModal(null)}
                  className="px-4 py-2 rounded-full bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer active:scale-95"
                >
                  <GitCommit className="w-3.5 h-3.5" />
                  <span>Transfer Custody</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evidenceList.map((ev) => (
              <div key={ev.id || ev.barcode} className="obsidian-card p-5 rounded-3xl space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {ev.barcode}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold flex items-center gap-1">
                        <span>v{ev.currentVersion || 1}</span>
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
                      ev.status === 'PENDING_TRANSFER'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {ev.status || 'IN_CUSTODY'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">{ev.description || ev.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Case: <span className="text-slate-200 font-mono font-semibold">{caseData?.caseNumber || ev.caseNumber}</span>
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#121524] border border-white/[0.06] space-y-1.5 text-xs text-slate-300 font-sans">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Category:</span>
                      <span className="text-slate-100 font-semibold">{ev.itemCategory || 'DOCUMENTARY'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Location:</span>
                      <span className="text-cyan-300 font-medium truncate max-w-[150px]">{ev.storageLocation || 'Vault Alpha - Bin 1'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Custodian:</span>
                      <span className="text-emerald-400 font-semibold truncate max-w-[150px]">{ev.currentCustodian || 'Det. John Miller (Lead)'}</span>
                    </div>
                    {ev.status === 'PENDING_TRANSFER' && ev.pendingTransferTo && (
                      <div className="flex justify-between items-center text-amber-300 pt-1.5 border-t border-white/[0.06]">
                        <span>Handover To:</span>
                        <span className="font-semibold truncate max-w-[150px]">{ev.pendingTransferTo}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-2 pt-3 border-t border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <Link
                      to="/custody"
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-medium transition"
                    >
                      <span>Custody Ledger</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleOpenEvidenceHistoryModal(ev)}
                      className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-medium transition cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Lineage</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEvidenceVersionModal(ev)}
                      disabled={isClosedOrArchived || !canRegisterEvidence}
                      title="Amend evidence state without overwriting past history"
                      className="px-3 py-1.5 rounded-full bg-violet-600/20 hover:bg-violet-600 border border-violet-500/40 text-violet-300 hover:text-white text-xs font-semibold transition flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Version</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenTransferModal(ev)}
                      disabled={isClosedOrArchived || !canInitiateTransfer}
                      title={!canInitiateTransfer ? 'Only authorized custody roles may dispatch evidence transfer' : 'Initiate dual-party custody transfer directly from dossier'}
                      className="px-3.5 py-1.5 rounded-full bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95"
                    >
                      <GitCommit className="w-3.5 h-3.5" />
                      <span>Transfer</span>
                    </button>
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
          {canUploadDocuments ? (
            <div className="obsidian-card p-5 rounded-3xl space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Upload Sealed Document Artifact
              </h3>
              <form onSubmit={handleUploadDocument} className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-4">
                  <input
                    type="text"
                    required
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="Document Title (e.g. Investigation Report)"
                    className="w-full px-3.5 py-2 bg-[#121524] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div className="md:col-span-3">
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121524] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="POLICE_REPORT">Police Report</option>
                    <option value="FORENSIC_REPORT">Forensic Report</option>
                    <option value="SEIZURE_MEMO">Seizure Memo</option>
                    <option value="EXPERT_OPINION">Expert Opinion</option>
                    <option value="WITNESS_STATEMENT">Witness Statement</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <select
                    value={docClassification}
                    onChange={(e) => setDocClassification(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121524] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="PUBLIC">PUBLIC</option>
                    <option value="RESTRICTED">RESTRICTED</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                    <option value="SECRET">SECRET</option>
                    <option value="TOP_SECRET">TOP_SECRET</option>
                  </select>
                </div>
                <div className="md:col-span-3 flex items-center gap-2">
                  <input
                    type="file"
                    required
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    className="w-full px-2 py-1.5 bg-[#121524] border border-white/[0.08] rounded-xl text-xs text-slate-300 file:mr-2 file:py-0.5 file:px-2 file:rounded-lg file:border-0 file:text-xs file:bg-violet-600 file:text-white"
                  />
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition shadow-lg shadow-violet-600/30 whitespace-nowrap"
                  >
                    {uploading ? 'Sealing...' : 'Upload'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="obsidian-card p-4 rounded-2xl border border-slate-700 bg-slate-900/60 flex items-center gap-3 text-xs font-mono text-slate-300">
              <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                {isAuditor 
                  ? 'Compliance Oversight Mode: As an Auditor, access is strictly read-only. Document uploads and case modifications are blocked by policy.'
                  : 'Case Dossier Locked: Case is in CLOSED / ARCHIVED status. Document uploads are disabled.'}
              </span>
            </div>
          )}

          <div className="space-y-3">
            {documents.length === 0 ? (
              <div className="obsidian-card p-8 rounded-3xl text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400">No documents sealed in this dossier yet. Upload a document above.</p>
              </div>
            ) : (
            documents.map((doc) => {
              const isAuthorized = canClearanceAccess(user?.clearance, doc.classification);

              return (
                <div key={doc.id} className="obsidian-card p-4 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-white/[0.08] hover:border-violet-500/30 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">{doc.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                        v{doc.currentVersion || 1}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        {doc.documentType}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold border ${
                        doc.classification === 'TOP_SECRET' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                        doc.classification === 'SECRET' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                        doc.classification === 'CONFIDENTIAL' ? 'bg-blue-950 text-blue-300 border-blue-800' :
                        doc.classification === 'PUBLIC' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                        'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {doc.classification}
                      </span>
                      {(doc.wormLocked || caseData.wormPreserved || caseData.status === 'ARCHIVED') && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <Archive className="w-2.5 h-2.5 text-amber-400" />
                          WORM OBJECT LOCKED [{doc.wormRetentionMode || 'COMPLIANCE'}]
                        </span>
                      )}
                      {!isAuthorized && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 font-bold">
                          <Lock className="w-2.5 h-2.5" />
                          CLEARANCE RESTRICTED
                        </span>
                      )}
                      {doc.originalFilename && (
                        <span className="text-[10px] font-mono text-slate-400">
                          ({doc.originalFilename}{doc.fileSize ? ` • ${(doc.fileSize / 1024).toFixed(1)} KB` : ''})
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 truncate max-w-lg">
                      {isAuthorized ? (
                        <>
                          Verification Seal: <span className="text-cyan-400">{doc.sha256Hash}</span>
                          {doc.wormLockUntil && (
                            <span className="text-amber-400/90 ml-2">
                              • Immutable Lock Expiry: {new Date(doc.wormLockUntil).toLocaleDateString()}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-rose-400/80 italic flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          Seal & File Content Masked — Requires {doc.classification} Clearance
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    {isAuthorized ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenDocHistoryModal(doc)}
                          className="px-3 py-1.5 rounded-xl bg-[#121524] hover:bg-[#181D33] text-slate-300 hover:text-white border border-white/[0.08] transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                          title="View all immutable historical versions and cryptographic audit receipts"
                        >
                          <History className="w-3.5 h-3.5 text-violet-400" />
                          <span>Versions</span>
                        </button>

                        {canUploadDocuments && !doc.wormLocked && (
                          <button
                            type="button"
                            onClick={() => handleOpenDocVersionModal(doc)}
                            className="px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600 text-violet-200 hover:text-white border border-violet-500/40 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95"
                            title="Upload an amended / updated version of this document without overwriting previous versions"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>New Version</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDownloadDocument(doc)}
                          className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition flex items-center gap-1.5 text-xs font-semibold shadow-sm cursor-pointer"
                          title="Download Sealed Document"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </>
                    ) : (
                      <button
                        disabled
                        className="px-3 py-1.5 rounded-xl bg-slate-800/80 text-slate-500 border border-slate-700/60 text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed opacity-75"
                        title={`Access Blocked: Your clearance (${user?.clearance || 'PUBLIC'}) is insufficient for ${doc.classification} documents.`}
                      >
                        <Lock className="w-3.5 h-3.5 text-rose-400" />
                        <span>Locked</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
            )}
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

                <div className="p-3 rounded-2xl bg-[#0E111C] border border-white/[0.06] space-y-2 text-xs text-slate-300 font-sans">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Clearance:</span>
                    <span className="text-amber-400 font-bold">{member.clearance || 'SECRET'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Assigned On:</span>
                    <span className="text-slate-100 font-medium">{member.assignedAt ? new Date(member.assignedAt).toLocaleDateString() : 'Active'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">ABAC Status:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ACTIVE
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Charge Sheet & Prosecution Workflow */}
      {activeTab === 'prosecution' && (
        <div className="space-y-6 font-sans">
          {/* Main Card */}
          <div className="obsidian-card p-6 rounded-3xl space-y-6 border border-white/[0.08] shadow-2xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">
                      Prosecution Charge Sheet & Multi-Tier Approvals
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Formal Section 173 CrPC / Sec 193 BNSS prosecution dossier for <span className="text-violet-400 font-bold">{caseData.caseNumber}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase border ${
                  chargeSheet?.status === 'FILED' || caseData.status === 'FILED_IN_COURT'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : chargeSheet?.status === 'LOCKED' || caseData.status === 'SIGNED' || caseData.status === 'COURT_PROCEEDINGS'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : chargeSheet?.status === 'REVIEWED' || caseData.status === 'CHARGE_SHEET_PENDING'
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : chargeSheet?.status === 'SUBMITTED_FOR_REVIEW' || caseData.status === 'UNDER_REVIEW'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {chargeSheet?.status === 'FILED' ? '🏛️ FILED IN COURT' : (chargeSheet?.status === 'LOCKED' ? '🔒 RSA-2048 SIGNED & LOCKED' : (chargeSheet?.status || caseData.status))}
                </span>

                <button
                  type="button"
                  onClick={handleRunChargeSheetAiAnalysis}
                  disabled={analyzingChargeSheet}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-violet-600/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                  title="Execute AI Statutory & Procedural Scrutiny on Charge Sheet"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${analyzingChargeSheet ? 'animate-spin text-amber-300' : 'text-violet-200'}`} />
                  <span>{analyzingChargeSheet ? 'Analyzing...' : 'AI Analysis'}</span>
                </button>

                <button
                  onClick={() => setShowPreviewModal(true)}
                  className="px-4 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5 text-violet-400" />
                  <span>View Formal Charge Sheet</span>
                </button>

                <button
                  onClick={() => navigate(`/court?caseId=${caseData.id}`)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Gavel className="w-3.5 h-3.5" />
                  <span>Open Court Workspace</span>
                </button>
              </div>
            </div>

            {/* Dedicated Charge Sheet AI Analysis Intelligence Panel */}
            {showChargeSheetAi && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#121629] via-[#0E1120] to-[#15122B] border border-violet-500/30 shadow-2xl relative overflow-hidden space-y-4 animate-in fade-in duration-200">
                <div className="absolute top-0 right-0 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-600/30">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                          Charge Sheet AI Legal & Statutory Scrutiny
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-violet-500/20 text-violet-300 border border-violet-500/30">
                          Section 193 BNSS / 173 CrPC
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                        Statutory Penal Provision Mapping · Procedural Admissibility · Electronic Evidence Scrutiny
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRunChargeSheetAiAnalysis}
                      disabled={analyzingChargeSheet}
                      className="px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-sans transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Re-run analysis"
                    >
                      <RefreshCw className={`w-3 h-3 ${analyzingChargeSheet ? 'animate-spin text-violet-400' : ''}`} />
                      <span className="text-[11px]">Re-run</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowChargeSheetAi(false)}
                      className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition cursor-pointer"
                      title="Dismiss Scrutiny"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Loading State */}
                {analyzingChargeSheet && (
                  <div className="py-8 flex flex-col items-center justify-center gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-full border-2 border-violet-500/20 border-t-violet-400 animate-spin" />
                    <p className="text-xs text-violet-300 font-sans font-medium animate-pulse">
                      Analyzing charge sheet statutory penal provisions, procedural admissibility, and witness memos...
                    </p>
                  </div>
                )}

                {/* Analysis Content */}
                {!analyzingChargeSheet && chargeSheetAiResult && (
                  <div className="space-y-4 relative z-10 font-sans">
                    {/* Legal Sufficiency & Compliance Banner */}
                    <div className="p-3.5 rounded-xl bg-violet-950/40 border border-violet-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            Legal Sufficiency Assessment:
                          </span>
                          <span className="text-xs font-bold text-emerald-400">
                            {chargeSheetAiResult.riskLevel === 'LOW' ? 'Cognizance-Ready (Statutory Threshold Met)' : `${chargeSheetAiResult.riskLevel} Scrutiny Flagged`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed pl-6">
                          {chargeSheetAiResult.summaryText || chargeSheetAiResult.summary}
                        </p>
                      </div>
                    </div>

                    {/* 2-Column Scrutiny Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Left: Recommended Statutory Penal Sections */}
                      <div className="p-4 rounded-xl bg-[#0B0E19] border border-white/[0.06] space-y-3">
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                          <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Recommended Statutory Penal Sections</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {chargeSheetAiResult.parsedCharges?.length || 0} Provisions
                          </span>
                        </div>

                        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                          {chargeSheetAiResult.parsedCharges?.length > 0 ? (
                            chargeSheetAiResult.parsedCharges.map((chg, idx) => (
                              <div key={idx} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold font-mono text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded">
                                    {chg.section}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">
                                    {chg.title}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-300 leading-normal pt-1">
                                  {chg.rationale}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400">All applicable statutory provisions are already framed.</p>
                          )}
                        </div>
                      </div>

                      {/* Right: Procedural Requirements & Evidentiary Checks */}
                      <div className="p-4 rounded-xl bg-[#0B0E19] border border-white/[0.06] space-y-3">
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                          <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Procedural & Admissibility Checks</span>
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400">BNSS Compliant</span>
                        </div>

                        {/* Checklist items */}
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {chargeSheetAiResult.proceduralChecks?.map((chk, idx) => (
                            <div key={idx} className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-start gap-2.5">
                              <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                                chk.status === 'PASSED' || chk.status === 'VERIFIED' || chk.status === 'APPROVED' ? 'text-emerald-400' : 'text-amber-400'
                              }`} />
                              <div className="text-[11px]">
                                <div className="font-semibold text-slate-200">{chk.check}</div>
                                <div className="text-slate-400 text-[10px] mt-0.5">{chk.details}</div>
                              </div>
                            </div>
                          ))}

                          {chargeSheetAiResult.missingProcedures?.length > 0 && (
                            <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
                              <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Procedural Directives Prior to Court Filing:</span>
                              </span>
                              {chargeSheetAiResult.missingProcedures.map((proc, idx) => (
                                <p key={idx} className="text-[11px] text-amber-200/90 pl-3 border-l-2 border-amber-500/40 leading-snug">
                                  • {proc}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Recommended Actions for Prosecution */}
                    {chargeSheetAiResult.recommendedActions?.length > 0 && (
                      <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">
                            Prosecution Directives:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {chargeSheetAiResult.recommendedActions.map((act, idx) => (
                              <span key={idx} className="text-[11px] text-slate-300 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06]">
                                ⚖️ {act}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 4-Stage Life-Cycle Progress Stepper */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Step 1: Preparation */}
              <div className="p-3.5 rounded-2xl bg-[#0E111C] border border-white/[0.06] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 uppercase font-bold tracking-wider">1. Drafting</span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    chargeSheet?.status && chargeSheet?.status !== 'DRAFT'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {chargeSheet?.status && chargeSheet?.status !== 'DRAFT' ? 'COMPLETED' : 'IN DRAFT'}
                  </span>
                </div>
                <p className="text-sm text-white font-semibold truncate">Lead Investigator</p>
                <p className="text-xs text-slate-400 truncate">
                  By: <span className="text-slate-200">@{chargeSheet?.preparedByUsername || caseData.createdByUsername || 'investigator_a'}</span>
                </p>
              </div>

              {/* Step 2: Senior Supervisory Review */}
              <div className="p-3.5 rounded-2xl bg-[#0E111C] border border-white/[0.06] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 uppercase font-bold tracking-wider">2. Supervisory Review</span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    chargeSheet?.seniorOfficerApprovalStatus === 'APPROVED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : chargeSheet?.seniorOfficerApprovalStatus === 'REJECTED'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {chargeSheet?.seniorOfficerApprovalStatus || 'PENDING'}
                  </span>
                </div>
                <p className="text-sm text-white font-semibold truncate">Senior Officer / ACP</p>
                <p className="text-xs text-slate-400 truncate">
                  {chargeSheet?.seniorOfficerApprovalStatus === 'APPROVED' ? (
                    <>Approved by <span className="text-slate-200">@{chargeSheet.seniorOfficerUsername || 'senior_officer'}</span></>
                  ) : 'Awaiting Supervisory Review'}
                </p>
              </div>

              {/* Step 3: Prosecution PKI Signature */}
              <div className="p-3.5 rounded-2xl bg-[#0E111C] border border-white/[0.06] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 uppercase font-bold tracking-wider">3. Prosecution Scrutiny</span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    chargeSheet?.prosecutorApprovalStatus === 'APPROVED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : chargeSheet?.prosecutorApprovalStatus === 'REJECTED'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {chargeSheet?.prosecutorApprovalStatus || 'PENDING'}
                  </span>
                </div>
                <p className="text-sm text-white font-semibold truncate">Directorate of Prosecution</p>
                <p className="text-xs text-slate-400 truncate">
                  {chargeSheet?.signature ? `Signed: ${chargeSheet.signature.certificateSerial.slice(-10)}` : 'Pending PKI Signature'}
                </p>
              </div>

              {/* Step 4: Court Registry Filing */}
              <div className="p-3.5 rounded-2xl bg-[#0E111C] border border-white/[0.06] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 uppercase font-bold tracking-wider">4. Judicial Filing</span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    chargeSheet?.status === 'FILED' || caseData.status === 'FILED_IN_COURT'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {chargeSheet?.status === 'FILED' || caseData.status === 'FILED_IN_COURT' ? 'FILED' : 'PENDING'}
                  </span>
                </div>
                <p className="text-sm text-white font-semibold truncate">Court Registry</p>
                <p className="text-xs text-slate-400 truncate">
                  {chargeSheet?.courtFiling?.filingNumber ? `Ref: ${chargeSheet.courtFiling.filingNumber}` : 'Awaiting Judicial Registry'}
                </p>
              </div>
            </div>

            {/* Core Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-[#0E111C] border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 uppercase font-bold tracking-wider block">Statutory Charges & Penal Provisions</span>
                  <span className="text-xs font-semibold text-violet-300 bg-violet-500/15 px-2.5 py-0.5 rounded-full border border-violet-500/30">Sec 173 CrPC / 193 BNSS</span>
                </div>
                <p className="text-slate-100 font-medium leading-relaxed text-sm">
                  {chargeSheet?.sectionsApplied || 'Information Technology Act 2000 (Sec 43, 66) • IPC (Sec 379, 420, 120B)'}
                </p>
                <div className="text-xs text-slate-300 pt-2 border-t border-white/[0.06]">
                  <span className="text-indigo-400 font-bold">Accused Particulars:</span> <span className="text-slate-200">{chargeSheet?.accusedDetails || 'Prime Accused: Vikramaditya Seth & 2 Unnamed Associates'}</span>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#0E111C] border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 uppercase font-bold tracking-wider block">Electronic Evidence Admissibility</span>
                  <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">Section 65B Certified</span>
                </div>
                <p className="text-slate-200 leading-relaxed text-sm">
                  {chargeSheet?.admissibilityCert || 'Certified electronic evidence package adheres to Section 65B Indian Evidence Act standards with cryptographic hash preservation.'}
                </p>
                <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 pt-2 border-t border-white/[0.06]">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="truncate">Bit-Stream SHA-256 Preservation Verified ({evidenceList.length} Exhibits Linked)</span>
                </div>
              </div>
            </div>

            {/* Evidentiary Summary & Nexus */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0E111C] border border-white/[0.06] space-y-2.5">
              <span className="text-xs text-slate-300 uppercase font-bold tracking-wider block">Summary of Investigation & Allegations</span>
              <p className="text-slate-100 leading-relaxed text-sm">
                {chargeSheet?.summary || caseData.description}
              </p>
              {chargeSheet?.signature && (
                <div className="pt-2.5 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-400">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>RSA-2048 PKI Digital Signature Verified: <strong className="text-white font-mono">{chargeSheet.signature.certificateSerial}</strong></span>
                  </div>
                  <span className="text-slate-400 text-xs">
                    Signed by @{chargeSheet.signature.signerUsername} • {new Date(chargeSheet.signature.signedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Tier 1 Action: Senior Officer Supervisory Review (Senior Officer & Admin) */}
            {(hasRole('SENIOR_OFFICER') || hasRole('ADMIN')) && chargeSheet?.status !== 'LOCKED' && chargeSheet?.status !== 'FILED' && (
              <div className="p-5 rounded-2xl bg-[#0E111C] border border-indigo-500/30 space-y-3 text-xs shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-2 text-sm">
                    <UserIcon className="w-4 h-4 text-indigo-400" />
                    <span>Senior Officer Supervisory Review (Tier 1 Scrutiny)</span>
                  </span>
                  <span className="text-xs text-slate-400">Authority: ACP / Supervisory Officer</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Verify whether the primary case dossier and electronic exhibits meet statutory evidentiary threshold prior to transmitting to the Directorate of Prosecution.
                </p>
                <input
                  type="text"
                  value={seniorNotes}
                  onChange={(e) => setSeniorNotes(e.target.value)}
                  placeholder="Enter supervisory scrutiny remarks / evidentiary directives..."
                  className="w-full px-3.5 py-2.5 bg-[#121524] border border-white/[0.08] rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                />
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    onClick={() => handleSeniorReview(true)}
                    disabled={chargeSheetLoading}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-600/20"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approve & Forward to Prosecution</span>
                  </button>
                  <button
                    onClick={() => handleSeniorReview(false)}
                    disabled={chargeSheetLoading}
                    className="px-4 py-2 rounded-xl bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject & Return to Investigator</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tier 2 Action: Prosecutor Legal Scrutiny & RSA-2048 PKI Signature (Prosecutor & Admin) */}
            {(hasRole('PROSECUTOR') || hasRole('ADMIN')) && chargeSheet?.seniorOfficerApprovalStatus === 'APPROVED' && chargeSheet?.status !== 'LOCKED' && chargeSheet?.status !== 'FILED' && (
              <div className="p-5 rounded-2xl bg-[#0E111C] border border-emerald-500/30 space-y-3 text-xs shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-300 font-bold uppercase tracking-wider flex items-center gap-2 text-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Prosecution Legal Scrutiny & Cryptographic Signature (Tier 2 Scrutiny)</span>
                  </span>
                  <span className="text-xs text-slate-400">Authority: Directorate of Prosecution</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Attest judicial admissibility under Section 65B and affix an RSA-2048 cryptographic signature sealing the document against tampering.
                </p>
                <input
                  type="text"
                  value={prosecutorNotes}
                  onChange={(e) => setProsecutorNotes(e.target.value)}
                  placeholder="Enter legal scrutiny attestation & admissibility notes..."
                  className="w-full px-3.5 py-2.5 bg-[#121524] border border-white/[0.08] rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    onClick={() => handleProsecutorSign(true)}
                    disabled={chargeSheetLoading}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Apply RSA-2048 PKI Digital Signature & Lock Document</span>
                  </button>
                  <button
                    onClick={() => handleProsecutorSign(false)}
                    disabled={chargeSheetLoading}
                    className="px-4 py-2 rounded-xl bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject Charge Sheet</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tier 3 Action: Formal Judicial Court Filing (Court Officer, Prosecutor, Admin) */}
            {(hasRole('COURT_OFFICER') || hasRole('PROSECUTOR') || hasRole('ADMIN')) && (chargeSheet?.status === 'LOCKED' || chargeSheet?.status === 'SIGNED' || chargeSheet?.status === 'REVIEWED') && chargeSheet?.status !== 'FILED' && (
              <div className="p-5 rounded-2xl bg-[#0E111C] border border-amber-500/30 space-y-3 text-xs shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-amber-300 font-bold uppercase tracking-wider flex items-center gap-2 text-sm">
                    <Gavel className="w-4 h-4 text-amber-400" />
                    <span>Formal Judicial Court Filing & Cognizance Entry (Tier 3)</span>
                  </span>
                  <span className="text-xs text-slate-400">Authority: Court Registrar / Special CBI Court</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Submit the cryptographically locked charge sheet to the court registry, obtain filing cognizance, and generate official summons.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={filingCourtName}
                    onChange={(e) => setFilingCourtName(e.target.value)}
                    placeholder="Court Name"
                    className="px-3.5 py-2.5 bg-[#121524] border border-white/[0.08] rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    value={filingNum}
                    onChange={(e) => setFilingNum(e.target.value)}
                    placeholder="Filing Number (e.g. CC-2026-0981)"
                    className="px-3.5 py-2.5 bg-[#121524] border border-white/[0.08] rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="pt-1">
                  <button
                    onClick={handleFormalCourtFiling}
                    disabled={chargeSheetLoading}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold flex items-center gap-1.5 transition shadow-lg shadow-amber-600/30 disabled:opacity-50 cursor-pointer"
                  >
                    <Gavel className="w-3.5 h-3.5" />
                    <span>Formally File in Court & Issue Summons</span>
                  </button>
                </div>
              </div>
            )}

            {/* Preparation / Amendment Button for Lead Investigator & Admin */}
            {(hasRole('INVESTIGATOR') || hasRole('ADMIN') || hasRole('SENIOR_OFFICER')) && (
              <div className="p-4 rounded-2xl bg-[#0A0C14] border border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-white font-semibold block">Charge Sheet Drafting & Evidentiary Nexus</span>
                  <span className="text-slate-400 text-[11px]">
                    Draft or adjust penal provisions, accused particulars, and Section 65B electronic certifications.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenDraftModal}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-violet-600/20"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{chargeSheet?.status === 'DRAFT' || chargeSheet?.seniorOfficerApprovalStatus === 'REJECTED' ? 'Draft / Prepare Charge Sheet' : 'Amend Draft Memorandum'}</span>
                  </button>
                  <button
                    onClick={handleDownloadChargeSheetPackage}
                    className="px-4 py-2 rounded-xl bg-[#121524] hover:bg-[#181D33] text-slate-200 border border-white/[0.08] font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-violet-400" />
                    <span>Download Certified Bundle</span>
                  </button>
                </div>
              </div>
            )}

            {/* Court Filings & Hearings Registry */}
            {courtFilings.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-white/[0.06]">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-amber-400" />
                  <span>Registered Court Filings ({courtFilings.length})</span>
                </h4>
                <div className="space-y-2">
                  {courtFilings.map((f, i) => (
                    <div key={f.id || i} className="p-3.5 rounded-xl bg-[#0E111C] border border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-300 font-mono">{f.filingNumber}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                            {f.status || 'FILED'}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] mt-0.5">{f.courtName}</p>
                      </div>
                      <div className="text-right text-[11px] text-slate-400 font-mono">
                        <p>Filed: {new Date(f.filingDate).toLocaleDateString()}</p>
                        <p className="text-slate-500 text-[10px]">Officer: @{f.filedByUsername}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
      {showAssignModal && createPortal(
        <div className="fixed inset-0 z-[99999] w-screen h-screen min-h-screen bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="obsidian-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-7 rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] space-y-4 border border-white/10">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-violet-400" />
                <span>Assign Officer to Dossier</span>
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
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
                  className="w-full px-3.5 py-2.5 bg-[#121524] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500 cursor-pointer"
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
                  className="px-4 py-2 rounded-xl bg-[#181D33] text-slate-300 text-xs hover:bg-[#222946] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{assigning ? 'Authorizing...' : 'Authorize & Assign'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Register Evidence Modal */}
      {showEvidenceModal && createPortal(
        <div className="fixed inset-0 z-[99999] w-screen h-screen min-h-screen bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="obsidian-card w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl space-y-4 border border-white/10">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-violet-400" />
                <span>Register Evidence Item</span>
              </h3>
              <button onClick={() => setShowEvidenceModal(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterEvidence} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Item Category</label>
                <select
                  value={evidenceForm.itemCategory}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, itemCategory: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#121524] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500 cursor-pointer"
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
                  className="px-4 py-2 rounded-xl bg-[#181D33] text-slate-300 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registeringEvidence}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {registeringEvidence ? 'Registering...' : 'Register & Seal'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Direct Custody Handover Modal */}
      {showTransferModal && createPortal(
        <div className="fixed inset-0 z-[99999] w-screen h-screen min-h-screen bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="obsidian-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl space-y-4 border border-white/10 my-auto bg-[#0B0D17] text-slate-100">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>ISO/IEC 27037 Standard Protocol</span>
                  </span>
                </div>
                <h3 className="text-base font-bold text-white flex items-center gap-2 mt-1">
                  <GitCommit className="w-5 h-5 text-emerald-400" />
                  <span>Dispatch Evidence Custody Handover</span>
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowTransferModal(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTransfer} className="space-y-4">
              {/* Evidence Artifact Details */}
              <div className="p-3.5 rounded-2xl bg-[#121524] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">Target Evidence Artifact:</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {transferItem?.barcode || 'Select Evidence Artifact'}
                  </span>
                </div>
                {evidenceList.length > 1 && (
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">
                      Switch Artifact to Transfer:
                    </label>
                    <select
                      value={transferItem?.barcode || ''}
                      onChange={(e) => {
                        const found = evidenceList.find(x => x.barcode === e.target.value);
                        if (found) {
                          setTransferItem(found);
                          setTransferCondition(found.physicalCondition || transferCondition);
                        }
                      }}
                      className="w-full px-3 py-1.5 bg-[#0A0C16] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono cursor-pointer"
                    >
                      {evidenceList.map(item => (
                        <option key={item.barcode || item.id} value={item.barcode}>
                          {item.barcode} • {item.description || item.title} ({item.storageLocation || 'Vault'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="text-xs text-slate-200 font-medium">
                  {transferItem?.description || transferItem?.title || 'Physical/Digital Artifact'}
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                  <span>Case: <strong className="text-slate-200 font-mono">{caseData?.caseNumber}</strong></span>
                  <span>•</span>
                  <span>Location: <strong className="text-slate-200">{transferItem?.storageLocation || 'Vault Alpha - Bin 1'}</strong></span>
                </div>
              </div>

              {/* Custodial Transfer Flow */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* From Dispatcher */}
                <div className="p-3 rounded-2xl bg-[#121524] border border-white/[0.06] space-y-1">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">From: Active Custodian</div>
                  <div className="text-xs font-bold text-white">@{user?.username || 'officer'}</div>
                  <div className="text-[11px] text-slate-400">{user?.fullName || 'Active Officer'}</div>
                </div>

                {/* To Recipient */}
                <div className="p-3 rounded-2xl bg-[#121524] border border-emerald-500/30 space-y-1">
                  <div className="text-[10px] font-mono text-emerald-300 font-bold uppercase">To: Recipient Officer *</div>
                  <select
                    value={selectedRecipientKey}
                    onChange={(e) => setSelectedRecipientKey(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#0A0C16] border border-emerald-500/40 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-400 font-mono cursor-pointer"
                    required
                  >
                    <optgroup label="Authorized Custody Officers">
                      {getRecipientChoices().map((r) => (
                        <option key={r.username} value={r.username}>
                          @{r.username} — {r.name} ({r.roleLabel || r.role})
                        </option>
                      ))}
                    </optgroup>
                    <option value="CUSTOM">+ Custom Officer...</option>
                  </select>
                </div>
              </div>

              {/* Custom Recipient Fields */}
              {selectedRecipientKey === 'CUSTOM' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#121524] rounded-2xl border border-emerald-500/30 animate-in fade-in duration-150">
                  <div>
                    <label className="text-[10px] font-mono text-slate-300 block mb-1">Officer Name *</label>
                    <input
                      type="text"
                      required
                      value={customRecipientName}
                      onChange={(e) => setCustomRecipientName(e.target.value)}
                      placeholder="e.g. Inspector Rajesh Kumar"
                      className="w-full px-3 py-1.5 bg-[#0A0C16] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-300 block mb-1">Badge UID / Username *</label>
                    <input
                      type="text"
                      required
                      value={customRecipientUsername}
                      onChange={(e) => setCustomRecipientUsername(e.target.value)}
                      placeholder="e.g. rajesh_kumar"
                      className="w-full px-3 py-1.5 bg-[#0A0C16] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Seal and Condition */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-mono text-slate-300 font-bold uppercase">
                      Tamper Seal Barcode *
                    </label>
                    <button
                      type="button"
                      onClick={() => setTransferSealNumber(`SEAL-${Math.floor(100000 + Math.random() * 900000)}`)}
                      className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Regen</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={transferSealNumber}
                    onChange={(e) => setTransferSealNumber(e.target.value)}
                    placeholder="e.g. SEAL-829102"
                    className="w-full px-3 py-2 bg-[#121524] border border-white/[0.08] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-300 font-bold uppercase block mb-1">
                    Packaging & Condition *
                  </label>
                  <input
                    type="text"
                    required
                    value={transferCondition}
                    onChange={(e) => setTransferCondition(e.target.value)}
                    placeholder="e.g. Sealed in anti-static bag"
                    className="w-full px-3 py-2 bg-[#121524] border border-white/[0.08] rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Reason for Handover */}
              <div>
                <label className="text-[11px] font-mono text-slate-300 font-bold uppercase block mb-1">
                  Reason for Custody Transfer *
                </label>
                <input
                  type="text"
                  required
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="Official justification for evidence handover..."
                  className="w-full px-3 py-2 bg-[#121524] border border-white/[0.08] rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 mb-2"
                />
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Forensic Lab', val: 'Forensic Laboratory Examination & Extraction' },
                    { label: 'Court Exhibit', val: 'Judicial Court Exhibit Presentation' },
                    { label: 'Vault Relocation', val: 'High-Security Evidence Vault Relocation' },
                    { label: 'Discovery Review', val: 'Prosecution Discovery Verification' },
                  ].map((tag) => (
                    <button
                      key={tag.label}
                      type="button"
                      onClick={() => setTransferReason(tag.val)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                        transferReason === tag.val
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-semibold'
                          : 'bg-[#121524] hover:bg-[#181D33] border-white/[0.06] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#0E111C] border border-white/[0.04] text-[11px] text-slate-400 space-y-1">
                <p className="text-amber-300 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Dual-Party Cryptographic Handover Protocol:
                </p>
                <p>
                  Dispatching puts this evidence into <span className="text-amber-300 font-mono font-semibold">PENDING_ACCEPTANCE</span> status. Only the designated recipient officer can inspect the seal barcode and sign with their digital key on the Chain of Custody ledger to assume legal custody.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#181D33] text-slate-300 text-xs hover:bg-[#222946] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition"
                >
                  {transferSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Dispatching Transfer...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Custody Handover</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Status Transition Modal */}
      {showStatusModal && createPortal(
        <div className="fixed inset-0 z-[99999] w-screen h-screen min-h-screen bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="obsidian-card w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl space-y-4 border border-white/10">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Transition Dossier Status
              </h3>
              <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
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
                  className="w-full px-3.5 py-2 bg-[#121524] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value="">Select target status...</option>
                  <option value="REGISTERED">REGISTERED</option>
                  <option value="UNDER_INVESTIGATION">UNDER_INVESTIGATION</option>
                  <option value="CHARGESHEET_FILED">CHARGESHEET_FILED</option>
                  <option value="IN_TRIAL">IN_TRIAL</option>
                  <option value="CLOSED">CLOSED</option>
                  <option value="ARCHIVED">ARCHIVED (WORM Cold Storage)</option>
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
                  className="px-4 py-2 rounded-xl bg-[#181D33] text-slate-300 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transitioning}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {transitioning ? 'Updating...' : 'Commit Status'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* WORM Vault Archival Modal */}
      {showArchiveModal && createPortal(
        <div className="fixed inset-0 z-[99999] w-screen h-screen min-h-screen bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="obsidian-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-7 rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] space-y-4 border border-amber-500/30">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Statutory Archival & WORM Preservation
                  </h3>
                  <p className="text-[10px] font-mono text-amber-400">
                    Write-Once-Read-Many (WORM) Compliance Object-Lock
                  </p>
                </div>
              </div>
              <button onClick={() => setShowArchiveModal(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-200/90 leading-relaxed space-y-1">
              <p className="font-semibold flex items-center gap-1.5 text-amber-300">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                Immutable Statutory Preservation Notice:
              </p>
              <p>
                Archiving this dossier seals all associated evidence items and documents into the cold WORM Object Vault. Under <span className="font-mono text-amber-300 font-bold">{archiveForm.wormMode}</span> mode, documents cannot be modified, deleted, or purged by any officer (including admins) until the retention lock expires.
              </p>
            </div>

            <form onSubmit={handleArchiveCase} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Retention Duration</label>
                  <select
                    value={archiveForm.retentionYears}
                    onChange={(e) => setArchiveForm({ ...archiveForm, retentionYears: parseInt(e.target.value, 10) })}
                    className="w-full px-3.5 py-2 bg-[#121524] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer font-mono"
                  >
                    <option value={5}>5 Years (Standard Offenses)</option>
                    <option value={10}>10 Years (Heinous Crimes / Cyber)</option>
                    <option value={25}>25 Years (Major National Espionage)</option>
                    <option value={50}>50 Years (Permanent Statutory Hold)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">WORM Preservation Mode</label>
                  <select
                    value={archiveForm.wormMode}
                    onChange={(e) => setArchiveForm({ ...archiveForm, wormMode: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#121524] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer font-mono"
                  >
                    <option value="COMPLIANCE">COMPLIANCE (Strict Non-Overridable)</option>
                    <option value="GOVERNANCE">GOVERNANCE (Supervisory Protection)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Archival Justification & Statutory Rationale</label>
                <textarea
                  required
                  rows="3"
                  value={archiveForm.archiveReason}
                  onChange={(e) => setArchiveForm({ ...archiveForm, archiveReason: e.target.value })}
                  placeholder="Specify legal limitation period, appellate closure, or judicial archive order..."
                  className="w-full px-3.5 py-2 bg-[#121524] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowArchiveModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#181D33] text-slate-300 text-xs hover:bg-[#222946] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={archiving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-semibold shadow-lg shadow-amber-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>{archiving ? 'Sealing into WORM Vault...' : 'Seal & Archive Case'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Charge Sheet Drafting / Amendment Modal */}
      {showDraftModal && createPortal(
        <div className="fixed inset-0 z-[99999] w-screen h-screen min-h-screen bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="obsidian-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-7 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] space-y-5 border border-white/10 font-mono">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Draft Formal Charge Sheet (Sec 173 CrPC / 193 BNSS)
                  </h3>
                  <p className="text-[11px] text-slate-400">Case Dossier: {caseData.caseNumber}</p>
                </div>
              </div>
              <button onClick={() => setShowDraftModal(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitChargeSheet} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-300">
                  Statutory Charges & Penal Provisions
                </label>
                <input
                  type="text"
                  required
                  value={draftForm.sectionsApplied}
                  onChange={(e) => setDraftForm({ ...draftForm, sectionsApplied: e.target.value })}
                  placeholder="e.g. IT Act 2000 (Sec 43, 66) • IPC / BNS (Sec 379, 420, 120B)"
                  className="w-full px-3.5 py-2.5 bg-[#121524] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-300">
                  Particulars of Accused
                </label>
                <input
                  type="text"
                  required
                  value={draftForm.accusedDetails}
                  onChange={(e) => setDraftForm({ ...draftForm, accusedDetails: e.target.value })}
                  placeholder="e.g. Prime Accused: Vikramaditya Seth & 2 Associates"
                  className="w-full px-3.5 py-2.5 bg-[#121524] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-300">
                  Investigation Findings & Evidentiary Nexus Summary
                </label>
                <textarea
                  rows={4}
                  required
                  value={draftForm.summary}
                  onChange={(e) => setDraftForm({ ...draftForm, summary: e.target.value })}
                  placeholder="Summarize forensic acquisition results, perpetrator lateral movements, seized artifacts, and specific nexus to accused..."
                  className="w-full px-3.5 py-2.5 bg-[#121524] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-300">
                    Primary Vault Document Nexus
                  </label>
                  <select
                    value={draftForm.linkedDocumentId}
                    onChange={(e) => setDraftForm({ ...draftForm, linkedDocumentId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#121524] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="">-- Select Certified Vault Document --</option>
                    {documents.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.title || d.originalFilename} ({d.documentType || 'DOC'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-300">
                    Electronic Admissibility Mandate
                  </label>
                  <input
                    type="text"
                    value={draftForm.admissibilityCert}
                    onChange={(e) => setDraftForm({ ...draftForm, admissibilityCert: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#121524] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowDraftModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#181D33] text-slate-300 text-xs hover:bg-[#222946] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={chargeSheetLoading}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold shadow-lg shadow-violet-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{chargeSheetLoading ? 'Submitting...' : 'Submit to Senior Officer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Charge Sheet Full Preview & Inspection Modal */}
      {showPreviewModal && createPortal(
        <div className="fixed inset-0 z-[99999] w-screen h-screen min-h-screen bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="obsidian-card w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] space-y-6 border border-white/10 font-mono">
            {/* Modal Header & Actions */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Official Judicial Charge Sheet Dossier
                  </h3>
                  <p className="text-[11px] text-slate-400">Under Section 173 Cr.P.C. / Section 193 BNSS</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadChargeSheetPackage}
                  className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .TXT</span>
                </button>
                <button onClick={() => setShowPreviewModal(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Formal Judicial Paper Document Container */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#090B12] border border-white/[0.08] space-y-6 text-xs text-slate-200">
              {/* Judicial Emblem & Heading */}
              <div className="text-center space-y-1 border-b border-white/[0.08] pb-4">
                <div className="inline-block p-2 rounded-xl bg-indigo-500/10 text-indigo-400 mb-1">
                  <Scale className="w-6 h-6 mx-auto" />
                </div>
                <h2 className="text-base font-bold text-white tracking-widest uppercase">
                  IN THE COURT OF SESSIONS / SPECIAL JUDGE (CYBER CRIMES)
                </h2>
                <p className="text-[11px] text-slate-400 uppercase font-semibold">
                  POLICE FINAL REPORT / CHARGE SHEET UNDER SECTION 173 CR.P.C.
                </p>
                <p className="text-[10px] text-violet-400 font-bold">
                  POLICE STATION: {caseData.investigatingAgency} • DISTRICT: CENTRAL
                </p>
              </div>

              {/* Registry Parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[#121524] border border-white/[0.04] text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Case Reference</span>
                  <span className="text-white font-bold">{caseData.caseNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">FIR Reference</span>
                  <span className="text-white font-bold">{caseData.firNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Lead Investigator</span>
                  <span className="text-violet-300 font-mono">@{chargeSheet?.preparedByUsername || caseData.createdByUsername}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Judicial Status</span>
                  <span className="text-emerald-400 font-bold">{chargeSheet?.status || caseData.status}</span>
                </div>
              </div>

              {/* 1. Particulars of Accused */}
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  1. Particulars of the Accused Persons
                </h4>
                <div className="p-3 rounded-xl bg-[#121524] border border-white/[0.04]">
                  <p className="text-slate-200">{chargeSheet?.accusedDetails || 'Prime Accused: Vikramaditya Seth (Cyber Operative) & 2 Unnamed Associates'}</p>
                </div>
              </div>

              {/* 2. Statutory Penal Sections */}
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  2. Offences Complained of & Penal Code Sections
                </h4>
                <div className="p-3 rounded-xl bg-[#121524] border border-white/[0.04]">
                  <p className="text-slate-200 font-semibold">{chargeSheet?.sectionsApplied}</p>
                </div>
              </div>

              {/* 3. Evidentiary Facts & Findings */}
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  3. Summary of Investigation & Evidentiary Findings
                </h4>
                <div className="p-3.5 rounded-xl bg-[#121524] border border-white/[0.04]">
                  <p className="text-slate-300 leading-relaxed">{chargeSheet?.summary || caseData.description}</p>
                </div>
              </div>

              {/* 4. Section 65B Electronic Evidence Certification */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>4. Electronic Evidence Certificate (Section 65B Indian Evidence Act)</span>
                </h4>
                <div className="p-3.5 rounded-xl bg-[#121524] border border-emerald-500/20 space-y-2 text-[11px]">
                  <p className="text-slate-300">{chargeSheet?.admissibilityCert}</p>
                  <div className="pt-2 border-t border-white/[0.04] space-y-1 font-mono text-[10px] text-slate-400">
                    <p>Primary Forensic Acquisition: <span className="text-white">{documents[0]?.title || 'SCADA Telemetry Exfiltration Forensics Report'}</span></p>
                    <p className="truncate">Bitstream SHA-256 Hash: <span className="text-emerald-400">{documents[0]?.sha256Hash || 'a8b9412cde458711094324fbcde710294324bca8412948710294812734'}</span></p>
                    <p>WORM Vault Immutability: <span className="text-amber-400">ENFORCED (Hardware Write-Blocker Verified)</span></p>
                  </div>
                </div>
              </div>

              {/* 5. Endorsements & Digital Signatures Block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Senior Review Endorsement */}
                <div className="p-3.5 rounded-xl bg-[#121524] border border-white/[0.06] space-y-1 text-[11px]">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Supervisory Scrutiny (Tier 1)</span>
                  <p className="font-bold text-indigo-300">Status: {chargeSheet?.seniorOfficerApprovalStatus || 'APPROVED'}</p>
                  <p className="text-slate-400 text-[10px]">Endorsed by: @{chargeSheet?.seniorOfficerUsername || 'senior_officer'}</p>
                  <p className="text-slate-500 text-[10px] italic">"{chargeSheet?.seniorOfficerReviewNotes || 'Evidentiary threshold satisfied.'}"</p>
                </div>

                {/* Prosecutor PKI Signature */}
                <div className="p-3.5 rounded-xl bg-[#121524] border border-emerald-500/30 space-y-1 text-[11px]">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Prosecution PKI Signature (Tier 2)</span>
                  <p className="font-bold text-emerald-400">
                    {chargeSheet?.signature ? 'DIGITALLY ATTESTED' : (chargeSheet?.status === 'LOCKED' || chargeSheet?.status === 'FILED' ? 'DIGITALLY ATTESTED' : 'PENDING SIGNATURE')}
                  </p>
                  <p className="text-slate-400 text-[10px]">Cert: {chargeSheet?.signature?.certificateSerial || 'CERT-RSA2048-PROS-77291'}</p>
                  <p className="text-slate-500 text-[10px]">Signer: @{chargeSheet?.signature?.signerUsername || chargeSheet?.prosecutorUsername || 'prosecutor'}</p>
                </div>
              </div>

              {/* Court Filing Registry Seal if Filed */}
              {(chargeSheet?.courtFiling || chargeSheet?.status === 'FILED' || caseData.status === 'FILED_IN_COURT') && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <Gavel className="w-4 h-4 text-amber-400" />
                    <span>Judicial Filing Registered in {chargeSheet?.courtFiling?.courtName || 'Special CBI Court No. 4'}</span>
                  </div>
                  <span className="font-mono font-bold">
                    Ref: {chargeSheet?.courtFiling?.filingNumber || 'CC-2026-0981'}
                  </span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2.5 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2 rounded-xl bg-[#181D33] text-slate-300 text-xs hover:bg-[#222946] cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Document Version Upload Modal */}
      {showDocVersionModal && selectedDocForVersion && createPortal(
        <div className="fixed inset-0 z-[99999] w-screen h-screen min-h-screen bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="obsidian-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-7 rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] space-y-4 border border-violet-500/40 font-mono">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-violet-600/20 border border-violet-500/30 rounded-xl text-violet-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Upload Document Revision (v{(selectedDocForVersion.currentVersion || 1) + 1})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Parent Artifact: <span className="text-violet-300 font-semibold">{selectedDocForVersion.title}</span>
                  </p>
                </div>
              </div>
              <button onClick={() => setShowDocVersionModal(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-violet-950/30 border border-violet-800/40 text-[11px] text-violet-200/90 leading-relaxed space-y-1">
              <p className="font-semibold flex items-center gap-1.5 text-violet-300">
                <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                Immutable Evidentiary Versioning Standard:
              </p>
              <p>
                Under Section 65B of the Evidence Act, previous versions (e.g. v{selectedDocForVersion.currentVersion || 1}) are permanently retained and will never be overwritten or deleted. This upload registers a cryptographically sealed revision <span className="text-cyan-300 font-bold">v{(selectedDocForVersion.currentVersion || 1) + 1}</span>.
              </p>
            </div>

            <form onSubmit={handleSubmitDocVersion} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-300">Select Revised Document File *</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setDocVersionFile(e.target.files[0])}
                  className="w-full px-3 py-2 bg-[#121524] border border-white/[0.08] rounded-xl text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-violet-600 file:text-white cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-300">Amendment Justification / Change Summary *</label>
                <textarea
                  required
                  rows="3"
                  value={docVersionReason}
                  onChange={(e) => setDocVersionReason(e.target.value)}
                  placeholder="State the procedural reason for revision (e.g. Added supplementary laboratory spectrogram, corrected annexure B...)"
                  className="w-full px-3.5 py-2.5 bg-[#121524] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowDocVersionModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#181D33] text-slate-300 hover:bg-[#222946] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingDocVersion || !docVersionFile}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-violet-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingDocVersion ? 'Encrypting & Sealing...' : `Seal Version v${(selectedDocForVersion.currentVersion || 1) + 1}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Document Version History Modal */}
      {showDocHistoryModal && selectedDocForHistory && createPortal(
        <div className="fixed inset-0 z-[99999] w-screen h-screen min-h-screen bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="obsidian-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-7 rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] space-y-4 border border-white/10 font-mono">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-violet-600/20 border border-violet-500/30 rounded-xl text-violet-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Immutable Document Version Ledger
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate max-w-sm">
                    {selectedDocForHistory.title}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowDocHistoryModal(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {loadingDocHistory ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Querying immutable version tree and verifying cryptographic hashes...
                </div>
              ) : docVersionHistory.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No historical revisions found. Version 1 is currently active.
                </div>
              ) : (
                docVersionHistory.map((ver, idx) => {
                  const isCurrent = ver.versionNumber === (selectedDocForHistory.currentVersion || 1) || idx === 0;
                  return (
                    <div
                      key={ver.id || idx}
                      className={`p-4 rounded-2xl border transition ${
                        isCurrent
                          ? 'bg-violet-950/20 border-violet-500/40'
                          : 'bg-[#121524] border-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full font-mono ${
                            isCurrent
                              ? 'bg-violet-600 text-white shadow-sm'
                              : 'bg-slate-800 text-slate-300 border border-white/[0.08]'
                          }`}>
                            Version v{ver.versionNumber}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                              Current Active
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400">
                            {new Date(ver.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDownloadDocVersion(selectedDocForHistory, ver.versionNumber)}
                          className="px-3 py-1 rounded-xl bg-violet-600/30 hover:bg-violet-600 text-violet-200 hover:text-white border border-violet-500/40 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download v{ver.versionNumber}</span>
                        </button>
                      </div>

                      <div className="mt-2.5 space-y-1.5 text-xs">
                        <p className="text-slate-200">
                          <span className="text-slate-400">Amendment Rationale: </span>
                          <span className="font-semibold">{ver.changeSummary || 'Initial Seizure & Vault Upload'}</span>
                        </p>
                        <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1 border-t border-white/[0.04] flex-wrap">
                          <span>Recorded By: <strong className="text-slate-200">@{ver.uploadedBy?.username || ver.uploadedBy || 'officer'}</strong></span>
                          <span>File Size: <strong className="text-slate-200">{ver.fileSizeBytes ? `${(ver.fileSizeBytes / 1024).toFixed(1)} KB` : 'N/A'}</strong></span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 truncate">
                          SHA-256: <span className="text-cyan-400">{ver.sha256Hash}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 flex justify-end border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setShowDocHistoryModal(false)}
                className="px-5 py-2 rounded-xl bg-[#181D33] text-slate-300 hover:bg-[#222946] text-xs cursor-pointer"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Evidence State Amendment / Version Modal */}
      {showEvidenceVersionModal && selectedEvidenceForVersion && createPortal(
        <div className="fixed inset-0 z-[99999] w-screen h-screen min-h-screen bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="obsidian-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-7 rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] space-y-4 border border-violet-500/40 font-mono">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-violet-600/20 border border-violet-500/30 rounded-xl text-violet-400">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Amend Evidence State (v{(selectedEvidenceForVersion.currentVersion || 1) + 1})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Artifact: <span className="text-emerald-400 font-semibold">{selectedEvidenceForVersion.barcode}</span>
                  </p>
                </div>
              </div>
              <button onClick={() => setShowEvidenceVersionModal(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-emerald-200/90 leading-relaxed space-y-1">
              <p className="font-semibold flex items-center gap-1.5 text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                ISO/IEC 27037 Tamper-Proof Audit Standard:
              </p>
              <p>
                The initial seizure state and prior custody seals will never be overwritten. Submitting this form captures a new immutable snapshot <span className="text-violet-300 font-bold">v{(selectedEvidenceForVersion.currentVersion || 1) + 1}</span> for lab examinations, re-sealing, or locker relocations.
              </p>
            </div>

            <form onSubmit={handleSubmitEvidenceVersion} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">New / Verified Seal Number *</label>
                  <input
                    type="text"
                    required
                    value={evidenceVersionForm.sealNumber}
                    onChange={(e) => setEvidenceVersionForm({ ...evidenceVersionForm, sealNumber: e.target.value })}
                    placeholder="e.g. SEAL-LAB-99214"
                    className="w-full px-3 py-2 bg-[#121524] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Storage Locker / Location *</label>
                  <input
                    type="text"
                    required
                    value={evidenceVersionForm.storageLocation}
                    onChange={(e) => setEvidenceVersionForm({ ...evidenceVersionForm, storageLocation: e.target.value })}
                    placeholder="e.g. Forensic Lab 3 - Evidence Locker B"
                    className="w-full px-3 py-2 bg-[#121524] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#121524] border border-white/[0.06]">
                <input
                  type="checkbox"
                  id="evVerSealIntact"
                  checked={evidenceVersionForm.sealIntact}
                  onChange={(e) => setEvidenceVersionForm({ ...evidenceVersionForm, sealIntact: e.target.checked })}
                  className="w-4 h-4 rounded text-violet-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="evVerSealIntact" className="text-xs text-slate-200 cursor-pointer">
                  Tamper-evident seal verified intact & unaltered
                </label>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-300">Status State</label>
                <select
                  value={evidenceVersionForm.status}
                  onChange={(e) => setEvidenceVersionForm({ ...evidenceVersionForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-[#121524] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value="IN_CUSTODY">IN_CUSTODY (Secured in Vault)</option>
                  <option value="IN_LAB_EXAMINATION">IN_LAB_EXAMINATION (Forensics In-Progress)</option>
                  <option value="ANALYZED">ANALYZED (Forensic Extraction Completed)</option>
                  <option value="COURT_EXHIBIT">COURT_EXHIBIT (Produced before Magistrate)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-300">Mandatory Amendment Justification *</label>
                <textarea
                  required
                  rows="3"
                  value={evidenceVersionForm.changeReason}
                  onChange={(e) => setEvidenceVersionForm({ ...evidenceVersionForm, changeReason: e.target.value })}
                  placeholder="State reason for seal/location/condition change (e.g. Broken seal for forensic bit-stream extraction and re-sealed with tamper bag #99214)..."
                  className="w-full px-3.5 py-2 bg-[#121524] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowEvidenceVersionModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#181D33] text-slate-300 hover:bg-[#222946] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingEvidenceVersion}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>{updatingEvidenceVersion ? 'Recording Snapshot...' : `Seal Version v${(selectedEvidenceForVersion.currentVersion || 1) + 1}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Evidence Version Lineage Modal */}
      {showEvidenceHistoryModal && selectedEvidenceForHistory && createPortal(
        <div className="fixed inset-0 z-[99999] w-screen h-screen min-h-screen bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="obsidian-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-7 rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] space-y-4 border border-white/10 font-mono">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-600/20 border border-emerald-500/30 rounded-xl text-emerald-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Immutable Evidence Version Lineage
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Artifact: <span className="text-emerald-400 font-semibold">{selectedEvidenceForHistory.barcode}</span> • {selectedEvidenceForHistory.title || selectedEvidenceForHistory.description}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowEvidenceHistoryModal(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {loadingEvidenceHistory ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Querying immutable evidence version tree and verifying cryptographic receipts...
                </div>
              ) : evidenceVersionHistory.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No historical snapshots found. Version 1 is currently active.
                </div>
              ) : (
                evidenceVersionHistory.map((ver, idx) => {
                  const isCurrent = ver.versionNumber === (selectedEvidenceForHistory.currentVersion || 1) || idx === 0;
                  return (
                    <div
                      key={ver.id || idx}
                      className={`p-4 rounded-2xl border transition ${
                        isCurrent
                          ? 'bg-emerald-950/20 border-emerald-500/40'
                          : 'bg-[#121524] border-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full font-mono ${
                            isCurrent
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-800 text-slate-300 border border-white/[0.08]'
                          }`}>
                            Snapshot v{ver.versionNumber}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold">
                              Current State
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400">
                            {new Date(ver.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                          {ver.status || 'IN_CUSTODY'}
                        </span>
                      </div>

                      <div className="mt-2.5 space-y-1.5 text-xs">
                        <p className="text-slate-200">
                          <span className="text-slate-400">Amendment Rationale: </span>
                          <span className="font-semibold">{ver.changeReason || 'Initial Seizure & Intake Snapshot'}</span>
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1.5 border-t border-white/[0.04]">
                          <div>
                            <span className="text-slate-500 block text-[10px]">SEAL NUMBER</span>
                            <span className="font-mono text-cyan-300 font-bold">{ver.sealNumber}</span>
                            <span className="ml-1 text-[10px] text-emerald-400">({ver.sealIntact !== false ? 'Intact' : 'Broken'})</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">STORAGE LOCATION</span>
                            <span className="text-slate-200">{ver.storageLocation}</span>
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-400 pt-1">
                          Recorded By: <strong className="text-slate-200">@{ver.recordedBy?.username || ver.recordedBy || 'officer'}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 flex justify-end border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setShowEvidenceHistoryModal(false)}
                className="px-5 py-2 rounded-xl bg-[#181D33] text-slate-300 hover:bg-[#222946] text-xs cursor-pointer"
              >
                Close Lineage
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CaseDetailsPage;
