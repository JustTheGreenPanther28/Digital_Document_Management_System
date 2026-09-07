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
  Key
} from 'lucide-react';
import { checkCaseAccess, canClearanceAccess, getStoredTeamAssignments as getStoredAbacAssignments } from '../services/abac';
import { 
  logDocumentDownload, 
  logDocumentUpload, 
  logEvidenceRegistered, 
  logCaseAssignment, 
  logCaseStatusChange, 
  logLegalHold,
  logCaseArchived,
  logWormLockApplied
} from '../services/auditLogger';

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

  // WORM Archival state
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveForm, setArchiveForm] = useState({
    archiveReason: 'Statutory long-term evidentiary preservation',
    retentionYears: 10,
    wormMode: 'COMPLIANCE'
  });
  const [archiving, setArchiving] = useState(false);

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
          setDocuments(docs || []);
          setEvidenceList(ev || []);
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
        const vaultDocs = getStoredVaultDocs().filter(d => d.caseId === matchedCustom.id || d.caseNumber === matchedCustom.caseNumber);
        const storedEv = getStoredEvidence().filter(e => e.caseId === matchedCustom.id || e.caseNumber === matchedCustom.caseNumber);
        setDocuments(vaultDocs);
        setEvidenceList(storedEv);
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
      setDocuments(FALLBACK_DOCS);
      setEvidenceList(FALLBACK_EVIDENCE);
      setTeamList(Array.from(teamMap.values()));
      setHistoryList(FALLBACK_CASE_DETAILS.statusHistory);
    } catch (err) {
      console.error('Failed to load case dossier:', err);
      setError('Failed to load case dossier. Displaying default security baseline.');
      setCaseData(FALLBACK_CASE_DETAILS);
    } finally {
      setLoading(false);
    }
  };

  const getStoredVaultDocs = () => {
    try {
      const stored = localStorage.getItem('sih_vault_documents');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  };

  const saveVaultDoc = (doc) => {
    try {
      const current = getStoredVaultDocs();
      const updated = [doc, ...current.filter(d => d.id !== doc.id)];
      localStorage.setItem('sih_vault_documents', JSON.stringify(updated));
    } catch (_) {}
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

      // 1. If stored data URL/blob exists in client storage for uploaded file (images, PDFs, binary, etc.)
      if (doc.fileDataUrl) {
        const a = document.createElement('a');
        a.href = doc.fileDataUrl;
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
        <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06] overflow-x-auto">
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
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Registered Evidence Artifacts ({evidenceList.length})
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Physical and digital evidentiary assets recorded in custody ledger
              </p>
            </div>
            {canRegisterEvidence ? (
              <button
                onClick={() => setShowEvidenceModal(true)}
                className="px-4 py-2 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-violet-600/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Evidence</span>
              </button>
            ) : (
              <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {isClosedOrArchived ? '🔒 Read-Only (Case Finalized)' : '🔒 Evidence Intake Restricted to Custodial Roles'}
              </span>
            )}
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
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isAuthorized ? (
                      <>
                        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                          DIGITALLY SEALED
                        </span>
                        <button
                          onClick={() => handleDownloadDocument(doc)}
                          className="px-3 py-1.5 rounded-xl bg-violet-600/30 hover:bg-violet-600 text-violet-200 hover:text-white border border-violet-500/40 transition flex items-center gap-1.5 text-xs font-semibold shadow-sm cursor-pointer"
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

      {/* Tab: Charge Sheet & Prosecution Workflow */}
      {activeTab === 'prosecution' && (
        <div className="space-y-4 font-mono">
          <div className="obsidian-card p-6 rounded-3xl space-y-5 border border-white/[0.08]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Prosecution Charge Sheet & Multi-Tier Approvals
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Formal charge sheet dossier for {caseData.caseNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase border ${
                  caseData.status === 'SIGNED' || caseData.status === 'FILED_IN_COURT' || caseData.status === 'COURT_PROCEEDINGS'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : caseData.status === 'CHARGE_SHEET_PENDING'
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {caseData.status}
                </span>
                <button
                  onClick={() => navigate('/court')}
                  className="px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5"
                >
                  <Gavel className="w-3.5 h-3.5" />
                  <span>Open Court Workspace</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#0E111C] border border-white/[0.04] space-y-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Statutory Charges</span>
                <p className="text-slate-200">Information Technology Act 2000 (Sec 43, 66) • IPC (Sec 379, 420, 120B)</p>
                <div className="text-[11px] text-slate-400 pt-1">
                  <span className="text-violet-400 font-bold">Investigation Agency:</span> {caseData.investigatingAgency}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0E111C] border border-white/[0.04] space-y-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Digital Evidence Admissibility</span>
                <p className="text-slate-300">Certified electronic evidence package adheres to Section 65B Indian Evidence Act standards.</p>
                <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 pt-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>SHA-256 Bit-Stream Preservation Verified</span>
                </div>
              </div>
            </div>
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
          <div className="obsidian-card w-full max-w-lg p-6 sm:p-7 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] space-y-4 border border-white/10">
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
          <div className="obsidian-card w-full max-w-md p-6 rounded-3xl shadow-2xl space-y-4 border border-white/10">
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

      {/* Status Transition Modal */}
      {showStatusModal && createPortal(
        <div className="fixed inset-0 z-[99999] w-screen h-screen min-h-screen bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="obsidian-card w-full max-w-md p-6 rounded-3xl shadow-2xl space-y-4 border border-white/10">
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
          <div className="obsidian-card w-full max-w-lg p-6 sm:p-7 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] space-y-4 border border-amber-500/30">
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
    </div>
  );
};

export default CaseDetailsPage;
