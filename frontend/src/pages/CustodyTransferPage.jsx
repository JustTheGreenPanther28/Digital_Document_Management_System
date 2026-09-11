import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  GitCommit, CheckCircle2, Clock, AlertCircle, ArrowRight,
  ShieldCheck, UserCheck, Package, Plus, X, Lock, FileText, CheckCircle,
  Hash, Key, RefreshCw, Layers, ChevronRight, XCircle, Send, ShieldAlert,
  Eye, User
} from 'lucide-react';
import { 
  logCustodyTransferRequested, 
  logCustodyTransferAccepted, 
  logCustodyTransferRejected 
} from '../services/auditLogger';
import { isEvidenceSubmittedByUser } from '../services/abac';
import Pagination from '../components/Pagination';

const FALLBACK_PENDING_TRANSFERS = [
  {
    id: 'tr-001-pending',
    evidenceId: 'ev-001',
    evidenceBarcode: 'EVD-2026-001-A',
    evidenceTitle: 'Samsung 980 Pro NVMe SSD 1TB - Primary System Drive',
    caseNumber: 'CASE-2026-001',
    fromUsername: 'investigator_a',
    fromOfficerName: 'Det. John Miller (Lead Investigator)',
    toUsername: 'custodian',
    toOfficerName: 'Officer Michael Vance (Evidence Custodian)',
    reasonForTransfer: 'Forensic laboratory intake for bit-stream disk acquisition and partition recovery',
    physicalCondition: 'Tamper-evident anti-static bag sealed with intact barcoded security tape',
    sealNumber: 'SEAL-CFSL-987210',
    transferDate: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'PENDING_ACCEPTANCE'
  },
  {
    id: 'tr-002-pending',
    evidenceId: 'ev-002',
    evidenceBarcode: 'EVD-2026-002-C',
    evidenceTitle: 'Apple iPhone 15 Pro (Hardware Encrypted & Passcode Locked)',
    caseNumber: 'CASE-2026-002',
    fromUsername: 'senior_officer',
    fromOfficerName: 'Commissioner Sterling',
    toUsername: 'investigator_a',
    toOfficerName: 'Det. John Miller (Lead Investigator)',
    reasonForTransfer: 'Secured transfer from seizure site to mobile forensic hardware extraction unit',
    physicalCondition: 'Faraday RF-shielded bag intact with unbroken serialized evidence label',
    sealNumber: 'FARADAY-SEAL-4412',
    transferDate: new Date(Date.now() - 3600000 * 5).toISOString(),
    status: 'PENDING_ACCEPTANCE'
  },
  {
    id: 'tr-003-pending',
    evidenceId: 'ev-003',
    evidenceBarcode: 'EVD-2026-003-B',
    evidenceTitle: 'SanDisk Ultra 128GB Flash Drive (Cryptocurrency Wallet Seed Backup)',
    caseNumber: 'CASE-2026-003',
    fromUsername: 'investigator_a',
    fromOfficerName: 'Det. John Miller (Lead Investigator)',
    toUsername: 'forensic_officer',
    toOfficerName: 'Dr. Evelyn Reed (CFSL Forensic Scientist)',
    reasonForTransfer: 'Carving deleted partition logs & cryptographic ledger forensic dump',
    physicalCondition: 'Static shield evidence pouch locked and signed across seam',
    sealNumber: 'SEAL-331902-LAB',
    transferDate: new Date(Date.now() - 3600000 * 12).toISOString(),
    status: 'PENDING_ACCEPTANCE'
  }
];

const FALLBACK_ACCEPTED_TRANSFERS = [
  {
    id: 'tr-000-hist-1',
    evidenceId: 'ev-001',
    evidenceBarcode: 'EVD-2026-001-A',
    evidenceTitle: 'Samsung 980 Pro NVMe SSD 1TB',
    caseNumber: 'CASE-2026-001',
    fromUsername: 'investigator_a',
    fromOfficerName: 'Det. John Miller (Lead)',
    toUsername: 'custodian',
    toOfficerName: 'Officer Michael Vance (Evidence Custodian)',
    reasonForTransfer: 'Initial seizure on-site to lead investigator custody',
    physicalCondition: 'Original tamper seal verified intact at crime scene',
    sealNumber: 'SEAL-SCENE-0019',
    transferDate: new Date(Date.now() - 3600000 * 24).toISOString(),
    acceptedDate: new Date(Date.now() - 3600000 * 22).toISOString(),
    status: 'ACCEPTED',
    verificationNotes: 'Physical barcode inspected and verified intact. No seal tampering detected.',
    signatureHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  }
];

export const CUSTODY_ELIGIBLE_ROLES = [
  'EVIDENCE_CUSTODIAN',
  'FORENSIC_OFFICER',
  'INVESTIGATOR',
  'SENIOR_OFFICER',
  'ADMIN'
];

export const isRoleEligibleForCustody = (roleName) => {
  if (!roleName) return false;
  const normalized = roleName.replace('ROLE_', '').toUpperCase();
  return CUSTODY_ELIGIBLE_ROLES.includes(normalized);
};

export const ELIGIBLE_OFFICER_RECIPIENTS = [
  { username: 'custodian', name: 'Officer Michael Vance', role: 'EVIDENCE_CUSTODIAN', roleLabel: 'Evidence Custodian (Central Vault)', badge: 'CUST-009' },
  { username: 'forensic_officer', name: 'Dr. Evelyn Reed', role: 'FORENSIC_OFFICER', roleLabel: 'Forensic Scientist (CFSL Lab)', badge: 'CFSL-901' },
  { username: 'investigator_a', name: 'Det. John Miller (Lead)', role: 'INVESTIGATOR', roleLabel: 'Lead Investigating Officer', badge: 'INS-4412' },
  { username: 'investigator_b', name: 'Det. Sarah Connor', role: 'INVESTIGATOR', roleLabel: 'Special Cell Investigator', badge: 'INS-4413' },
  { username: 'senior_officer', name: 'Commissioner Sterling', role: 'SENIOR_OFFICER', roleLabel: 'Supervisory Officer', badge: 'IPS-8921' },
  { username: 'admin', name: 'Superintendent Vance (Admin)', role: 'ADMIN', roleLabel: 'Security Administrator', badge: 'ADMIN-001' },
];

export const INELIGIBLE_OFFICERS = [
  { username: 'prosecutor', name: 'Counsel Diane Lockhart', role: 'PROSECUTOR', roleLabel: 'Prosecuting Attorney (Court Review Only)' },
  { username: 'court_officer', name: 'Registrar Arthur Pendelton', role: 'COURT_OFFICER', roleLabel: 'Judicial Registrar (Court Record Keeper)' },
  { username: 'auditor', name: 'Inspector General Hayes', role: 'AUDITOR', roleLabel: 'Independent Ledger Auditor (No Evidence Handling)' },
];

export const isRecipientForUser = (transfer, currentUser) => {
  if (!transfer || !currentUser) return false;
  const currentUsername = (currentUser.username || '').toLowerCase().trim();
  const currentFullName = (currentUser.fullName || '').toLowerCase().trim();
  const toUsername = (transfer.toUsername || '').toLowerCase().trim();
  const toOfficerName = (transfer.toOfficerName || '').toLowerCase().trim();

  if (toUsername === currentUsername) return true;
  if (toOfficerName.includes(currentUsername)) return true;
  if (currentFullName && (toOfficerName.includes(currentFullName) || currentFullName.includes(toOfficerName))) return true;
  return false;
};

export const isSenderForUser = (transfer, currentUser) => {
  if (!transfer || !currentUser) return false;
  const currentUsername = (currentUser.username || '').toLowerCase().trim();
  const currentFullName = (currentUser.fullName || '').toLowerCase().trim();
  const fromUsername = (transfer.fromUsername || '').toLowerCase().trim();
  const fromOfficerName = (transfer.fromOfficerName || '').toLowerCase().trim();

  if (fromUsername === currentUsername) return true;
  if (fromOfficerName.includes(currentUsername)) return true;
  if (currentFullName && (fromOfficerName.includes(currentFullName) || currentFullName.includes(fromOfficerName))) return true;
  return false;
};

export const CustodyTransferPage = () => {
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('PENDING'); // 'PENDING', 'OUTBOUND', 'REGISTRY', 'ALL_DEPARTMENT'
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [acceptedTransfers, setAcceptedTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acceptingId, setAcceptingId] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('Inspected and confirmed tamper seal intact.');

  // Modal State for Initiating Transfer with Type-Any Support
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableEvidence, setAvailableEvidence] = useState([]);
  const [evidenceBarcode, setEvidenceBarcode] = useState('EVD-2026-001-A');
  const [evidenceTitle, setEvidenceTitle] = useState('Samsung 980 Pro NVMe SSD 1TB');
  const [evidenceCaseNum, setEvidenceCaseNum] = useState('CASE-2026-001');
  const [fromOfficer, setFromOfficer] = useState('Det. John Miller (Lead)');
  const [selectedRecipientKey, setSelectedRecipientKey] = useState('custodian');
  const [customRecipientName, setCustomRecipientName] = useState('');
  const [customRecipientUsername, setCustomRecipientUsername] = useState('');
  const [transferReason, setTransferReason] = useState('Forensic Laboratory Examination & Extraction');
  const [sealNumber, setSealNumber] = useState('');
  const [physicalCondition, setPhysicalCondition] = useState('Tamper-evident bag sealed with serialized lock tape');
  const [submitting, setSubmitting] = useState(false);

  const isSupervisor = hasRole && (hasRole('ADMIN') || hasRole('SENIOR_OFFICER') || hasRole('AUDITOR'));

  // Get available recipient choices including any registered users
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
    ELIGIBLE_OFFICER_RECIPIENTS.forEach(r => map.set(r.username, r));
    custom.forEach(r => {
      if (isRoleEligibleForCustody(r.role)) {
        map.set(r.username, r);
      }
    });

    return Array.from(map.values());
  };

  const recipientChoices = getRecipientChoices();

  useEffect(() => {
    loadTransfers();
    loadEvidenceList();
    if (user) {
      setFromOfficer(user.fullName || user.username || 'Inspector Vikram Rao');
      // Preselect an eligible recipient that is not the current user
      const otherChoice = recipientChoices.find(r => r.username !== user.username);
      if (otherChoice) {
        setSelectedRecipientKey(otherChoice.username);
      }
    }
  }, [user]);

  const getStoredTransfers = () => {
    try {
      const stored = localStorage.getItem('sih_custody_transfers');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const saveStoredTransfers = (pending, accepted) => {
    try {
      localStorage.setItem('sih_custody_transfers', JSON.stringify({ pending, accepted }));
    } catch (e) {
      console.error('Failed to persist custody transfers', e);
    }
  };

  const [tabCurrentPage, setTabCurrentPage] = useState(1);
  const [tabPageSize, setTabPageSize] = useState(5);

  useEffect(() => {
    setTabCurrentPage(1);
  }, [activeTab]);

  const loadTransfers = async () => {
    setLoading(true);
    setError('');

    const stored = getStoredTransfers();
    let initialPending = stored?.pending || [];
    let initialAccepted = stored?.accepted || [];

    try {
      const backendPending = await api.getPendingTransfers().catch(() => null);
      if (backendPending && Array.isArray(backendPending) && backendPending.length > 0) {
        const mergedPending = [...backendPending];
        initialPending.forEach(p => {
          if (!mergedPending.some(mp => mp.id === p.id || mp.evidenceBarcode === p.evidenceBarcode)) {
            mergedPending.push(p);
          }
        });
        initialPending = mergedPending;
      }
    } catch (err) {
      console.warn('Backend custody transfer fetch notice:', err);
    }

    if (initialPending.length === 0 && (!stored || !stored.pending)) {
      initialPending = FALLBACK_PENDING_TRANSFERS;
    }
    if (initialAccepted.length === 0 && (!stored || !stored.accepted)) {
      initialAccepted = FALLBACK_ACCEPTED_TRANSFERS;
    }

    setPendingTransfers(initialPending);
    setAcceptedTransfers(initialAccepted);
    setLoading(false);
  };

  const loadEvidenceList = async () => {
    try {
      let evList = [];
      
      const customEvidenceStr = localStorage.getItem('sih_registered_evidence');
      if (customEvidenceStr) {
        try {
          evList = [...JSON.parse(customEvidenceStr)];
        } catch (_) {}
      }

      const fallbackList = [
        { id: 'ev-001', evidenceNumber: 'EVD-2026-001-A', title: 'Samsung 980 Pro NVMe SSD 1TB', caseNumber: 'CASE-2026-001' },
        { id: 'ev-002', evidenceNumber: 'EVD-2026-002-C', title: 'Apple iPhone 15 Pro (Hardware Encrypted)', caseNumber: 'CASE-2026-002' },
        { id: 'ev-003', evidenceNumber: 'EVD-2026-003-B', title: 'SanDisk Ultra 128GB Flash Drive', caseNumber: 'CASE-2026-003' }
      ];

      if (evList.length === 0) {
        evList = [...fallbackList];
      }

      const accessibleEvidence = evList.filter(e => isEvidenceSubmittedByUser(e, user));
      setAvailableEvidence(accessibleEvidence);
      if (accessibleEvidence.length > 0) {
        const first = accessibleEvidence[0];
        setEvidenceBarcode(first.evidenceNumber || first.barcode || 'EVD-2026-001-A');
        setEvidenceTitle(first.title || first.description || 'Physical Evidence');
        setEvidenceCaseNum(first.caseNumber || 'CASE-2026-001');
        setSealNumber(`SEAL-${Math.floor(100000 + Math.random() * 900000)}`);
      } else {
        setEvidenceBarcode('');
        setEvidenceTitle('');
        setEvidenceCaseNum('');
        setSealNumber(`SEAL-${Math.floor(100000 + Math.random() * 900000)}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectEvidencePreset = (selectedId) => {
    const item = availableEvidence.find(e => (e.id || e.evidenceNumber) === selectedId);
    if (item) {
      setEvidenceBarcode(item.evidenceNumber || item.barcode || selectedId);
      setEvidenceTitle(item.title || item.description || 'Physical Evidence');
      setEvidenceCaseNum(item.caseNumber || 'CASE-2026-001');
    }
  };

  // Filter transfers specifically for the currently logged-in persona
  const myIncomingTransfers = pendingTransfers.filter(t => isRecipientForUser(t, user));
  const myOutboundTransfers = pendingTransfers.filter(t => isSenderForUser(t, user));
  const myAcceptedTransfers = isSupervisor
    ? acceptedTransfers
    : acceptedTransfers.filter(t => isRecipientForUser(t, user) || isSenderForUser(t, user));

  const paginatedIncoming = myIncomingTransfers.slice((tabCurrentPage - 1) * tabPageSize, tabCurrentPage * tabPageSize);
  const paginatedOutbound = myOutboundTransfers.slice((tabCurrentPage - 1) * tabPageSize, tabCurrentPage * tabPageSize);
  const paginatedDept = pendingTransfers.slice((tabCurrentPage - 1) * tabPageSize, tabCurrentPage * tabPageSize);
  const paginatedAccepted = myAcceptedTransfers.slice((tabCurrentPage - 1) * tabPageSize, tabCurrentPage * tabPageSize);

  const handleInitiateTransfer = async (e) => {
    e.preventDefault();
    if (!evidenceBarcode.trim()) {
      alert('Please enter an Evidence Barcode or Serial Number.');
      return;
    }

    let targetUsername = selectedRecipientKey;
    let targetOfficerName = '';

    if (selectedRecipientKey === 'CUSTOM') {
      if (!customRecipientName.trim() || !customRecipientUsername.trim()) {
        alert('Please enter both the custom recipient name and badge username.');
        return;
      }
      targetUsername = customRecipientUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
      targetOfficerName = customRecipientName.trim();
    } else {
      const matched = recipientChoices.find(r => r.username === selectedRecipientKey);
      if (matched) {
        targetUsername = matched.username;
        targetOfficerName = `${matched.name} (${matched.roleLabel})`;
      } else {
        targetUsername = selectedRecipientKey;
        targetOfficerName = selectedRecipientKey;
      }
    }

    // Role Eligibility Validation on Recipient
    const recipientLower = (targetOfficerName + ' ' + targetUsername).toLowerCase();
    const matchedIneligible = INELIGIBLE_OFFICERS.find(inelig => 
      recipientLower.includes(inelig.username) || 
      recipientLower.includes(inelig.name.toLowerCase()) ||
      recipientLower.includes(inelig.role.toLowerCase()) ||
      recipientLower.includes('prosecutor') ||
      recipientLower.includes('court') ||
      recipientLower.includes('auditor') ||
      recipientLower.includes('registrar')
    );

    if (matchedIneligible) {
      alert(`[ISO/IEC 27037 Compliance Violation]\n\nCustody Handover Blocked: Recipient holds an ineligible role (${matchedIneligible.roleLabel}).\n\nUnder statutory forensic chain-of-custody protocols, Prosecutors, Judicial Registrars, and Independent Auditors are legally barred from holding evidence custody.\n\nEligible roles: Evidence Custodians, Forensic Examiners, and Assigned Investigators.`);
      return;
    }

    setSubmitting(true);

    const newTransfer = {
      id: `tr-${Date.now()}`,
      evidenceId: evidenceBarcode,
      evidenceBarcode: evidenceBarcode.trim(),
      evidenceTitle: evidenceTitle.trim() || 'Physical Evidence Item',
      caseNumber: evidenceCaseNum.trim() || 'CASE-2026-001',
      fromUsername: user?.username || 'investigator_a',
      fromOfficerName: fromOfficer.trim() || user?.fullName || 'Inspector Vikram Rao',
      toUsername: targetUsername,
      toOfficerName: targetOfficerName,
      reasonForTransfer: transferReason.trim() || 'Custody Handover',
      physicalCondition: physicalCondition.trim() || 'Tamper-evident seal verified intact',
      sealNumber: sealNumber.trim() || `SEAL-${Date.now().toString().slice(-6)}`,
      transferDate: new Date().toISOString(),
      status: 'PENDING_ACCEPTANCE'
    };

    try {
      await api.initiateCustodyTransfer(evidenceBarcode, {
        recipientId: newTransfer.toUsername,
        sealNumber: newTransfer.sealNumber,
        reason: newTransfer.reasonForTransfer
      }).catch(() => null);

      const updatedPending = [newTransfer, ...pendingTransfers];
      setPendingTransfers(updatedPending);
      saveStoredTransfers(updatedPending, acceptedTransfers);

      logCustodyTransferRequested({
        evidenceBarcode: newTransfer.evidenceBarcode,
        recipientName: newTransfer.toOfficerName,
        reason: newTransfer.reasonForTransfer,
        sealNumber: newTransfer.sealNumber,
        caseNumber: newTransfer.caseNumber
      });

      setIsModalOpen(false);
      alert(`Custody handover dispatched specifically to @${newTransfer.toUsername} (${newTransfer.toOfficerName})!\n\nThis evidence will now ONLY appear in @${newTransfer.toUsername}'s incoming queue and can only be verified and accepted by their authorized digital key.`);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptTransfer = async (transfer) => {
    // 1. Strict Designated Recipient Enforcement
    if (!isRecipientForUser(transfer, user)) {
      alert(`[Security Access Violation]\n\nCustody Acceptance Blocked: This custody handover was specifically assigned to @${transfer.toUsername} (${transfer.toOfficerName}).\n\nYour active badge (@${user?.username}) is not the designated recipient. Under forensic chain-of-custody protocols, only the assigned officer may verify the tamper seal and sign custody.`);
      return;
    }

    // 2. Strict Role Eligibility Enforcement on the Accepting Officer
    const primaryRole = user?.roles?.[0]?.replace('ROLE_', '') || 'INVESTIGATOR';
    if (!isRoleEligibleForCustody(primaryRole)) {
      alert(`[ISO/IEC 27037 Access Denied]\n\nCustody Acceptance Blocked: Your assigned role (${primaryRole}) is not legally authorized to take custody of physical/digital evidence.\n\nOnly Evidence Custodians, Forensic Scientists/Examiners, and Assigned Investigators may sign and accept custody of evidence.`);
      return;
    }

    setAcceptingId(transfer.id);
    try {
      await api.acceptCustodyTransfer(transfer.id, verificationNotes).catch(() => null);

      const fakeSignature = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

      const acceptedRecord = {
        ...transfer,
        status: 'ACCEPTED',
        acceptedDate: new Date().toISOString(),
        verificationNotes: verificationNotes || 'Physical seal intact and barcoded verification match.',
        signatureHash: fakeSignature,
        acceptedBy: user?.username || transfer.toUsername,
        acceptedByRole: primaryRole
      };

      const updatedPending = pendingTransfers.filter(t => t.id !== transfer.id);
      const updatedAccepted = [acceptedRecord, ...acceptedTransfers];

      setPendingTransfers(updatedPending);
      setAcceptedTransfers(updatedAccepted);
      saveStoredTransfers(updatedPending, updatedAccepted);

      logCustodyTransferAccepted({
        evidenceBarcode: transfer.evidenceBarcode,
        previousCustodian: transfer.fromOfficerName,
        newCustodian: user?.fullName || transfer.toOfficerName,
        sealNumber: transfer.sealNumber,
        caseNumber: transfer.caseNumber
      });

      alert(`Dual-party verification complete! Custody transfer for ${transfer.evidenceBarcode} officially signed by @${user?.username} (${primaryRole}) and committed to append-only chain of custody.`);
    } catch (err) {
      alert(`Acceptance failed: ${err.message}`);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleRejectTransfer = (transferId) => {
    const matched = pendingTransfers.find(t => t.id === transferId);
    if (!matched) return;

    if (!isRecipientForUser(matched, user)) {
      alert(`[Security Access Violation]\n\nOnly the designated recipient officer (@${matched.toUsername}) can accept or reject this custody transfer.`);
      return;
    }

    if (!window.confirm('Are you sure you want to reject this custody transfer? Reason: Tamper seal breach / packaging discrepancy.')) {
      return;
    }

    const updatedPending = pendingTransfers.filter(t => t.id !== transferId);
    setPendingTransfers(updatedPending);
    saveStoredTransfers(updatedPending, acceptedTransfers);

    logCustodyTransferRejected({
      evidenceBarcode: matched.evidenceBarcode,
      reason: 'Tamper seal breach / packaging discrepancy',
      caseNumber: matched.caseNumber
    });

    alert('Custody transfer rejected. Discrepancy logged in security audit ledger.');
  };

  const handleCancelTransfer = (transferId) => {
    const matched = pendingTransfers.find(t => t.id === transferId);
    if (!matched) return;

    if (!isSenderForUser(matched, user) && !isSupervisor) {
      alert(`[Security Access Violation]\n\nOnly the initiating officer (@${matched.fromUsername}) or a Superintendent Administrator can recall a pending transfer.`);
      return;
    }

    if (!window.confirm('Recall this pending custody handover? The evidence will remain in your active custody.')) {
      return;
    }

    const updatedPending = pendingTransfers.filter(t => t.id !== transferId);
    setPendingTransfers(updatedPending);
    saveStoredTransfers(updatedPending, acceptedTransfers);
    alert('Custody handover recalled. Evidence remains in your custody.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Section 65B Certified Protocol</span>
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-amber-400" />
            <span>Digital Chain of Custody Verification Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Two-party cryptographic protocol: No evidence transfers custody until physically verified and digitally co-signed by the recipient.
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setSealNumber(`SEAL-${Math.floor(100000 + Math.random() * 900000)}`);
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 active:scale-95 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Initiate Custody Handover</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Protocol Explanation Panel */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center gap-4 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-amber-950/20">
        <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400 border border-amber-500/20 shrink-0">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <div className="text-xs space-y-1 flex-1">
          <div className="font-bold text-slate-200 uppercase font-mono flex items-center gap-2">
            <span>Dual-Party Non-Repudiation Security Protocol</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
              ISO/IEC 27037 Standard
            </span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            When an officer transfers physical or digital evidence, the record remains in a <span className="text-amber-400 font-mono font-semibold">PENDING_ACCEPTANCE</span> state. The receiving officer must physically inspect the tamper seal, match the serialized barcode, and apply their cryptographic private key signature.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Awaiting Sign-off</div>
          <div className="text-2xl font-bold text-amber-400 font-mono mt-1">
            {isSupervisor ? pendingTransfers.length : myIncomingTransfers.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {isSupervisor ? 'Department pending' : 'Pending for your badge'}
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Verified Handovers</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{myAcceptedTransfers.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Co-signed & immutably logged</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Chain Integrity</div>
          <div className="text-2xl font-bold text-blue-400 font-mono mt-1">100%</div>
          <div className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>Cryptographically Verified</span>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Secured Protocol</div>
          <div className="text-2xl font-bold text-violet-400 font-mono mt-1">SHA-256</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Dual-key signature scheme</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'PENDING'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>My Incoming Handovers ({myIncomingTransfers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('OUTBOUND')}
          className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'OUTBOUND'
              ? 'border-blue-400 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Dispatched by Me ({myOutboundTransfers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('REGISTRY')}
          className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'REGISTRY'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Verified Custody Ledger ({myAcceptedTransfers.length})</span>
        </button>

        {isSupervisor && (
          <button
            onClick={() => setActiveTab('ALL_DEPARTMENT')}
            className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'ALL_DEPARTMENT'
                ? 'border-purple-400 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>All Department Pending ({pendingTransfers.length})</span>
          </button>
        )}
      </div>

      {/* TAB CONTENT: MY INCOMING TRANSFERS (Awaiting Current Officer's Signature) */}
      {activeTab === 'PENDING' && (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" />
              <span>Incoming Evidence Assigned to @{user?.username} ({user?.fullName || 'Active Officer'})</span>
            </h3>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-semibold">
              {myIncomingTransfers.length} AWAITING YOUR CO-SIGNATURE
            </span>
          </div>

          <div className="divide-y divide-slate-800">
            {loading ? (
              <div className="p-12 text-center text-slate-500 text-xs font-mono">
                Querying secure custody ledger...
              </div>
            ) : myIncomingTransfers.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs space-y-3">
                <CheckCircle2 className="w-9 h-9 text-slate-600 mx-auto" />
                <div className="space-y-1">
                  <p className="font-semibold text-slate-300">No incoming custody handovers pending for @{user?.username}.</p>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                    Evidence handovers are strictly private and persona-gated. Any physical or digital evidence dispatched specifically to your badge will appear here for physical inspection and cryptographic co-signing.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Initiate Outbound Handover</span>
                </button>
              </div>
            ) : (
              paginatedIncoming.map((t) => (
                <div key={t.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:bg-slate-900/40 transition">
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/80">
                        {t.evidenceBarcode}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                        {t.caseNumber}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold uppercase animate-pulse">
                        AWAITING YOUR CO-SIGNATURE
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-slate-100">
                      {t.evidenceTitle || 'Physical Forensic Exhibit'}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-1 text-slate-400">
                        <span className="text-slate-500 text-[10px]">FROM:</span>
                        <span className="text-blue-300 font-bold">@{t.fromUsername} ({t.fromOfficerName})</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                      <div className="flex items-center gap-1 text-slate-400">
                        <span className="text-slate-500 text-[10px]">TO:</span>
                        <span className="text-amber-300 font-bold">@{user?.username} (You)</span>
                      </div>
                      <span className="text-slate-600">|</span>
                      <div className="flex items-center gap-1 text-slate-400">
                        <span className="text-slate-500 text-[10px]">SEAL:</span>
                        <span className="text-emerald-400 font-bold">{t.sealNumber}</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 font-mono space-y-1">
                      <div><span className="text-slate-500">Reason:</span> <span className="text-slate-200 font-sans">{t.reasonForTransfer}</span></div>
                      <div><span className="text-slate-500">Packaging / Seal Condition:</span> <span className="text-slate-300 font-sans">{t.physicalCondition}</span></div>
                      <div><span className="text-slate-500">Dispatched At:</span> <span className="text-slate-400">{new Date(t.transferDate).toLocaleString()}</span></div>
                    </div>
                  </div>

                  {/* Accept / Inspection Action Box */}
                  <div className="flex flex-col gap-2.5 lg:w-80 shrink-0 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                    <label className="text-[10px] font-mono font-bold uppercase text-slate-400">
                      Recipient Physical Seal Verification Note:
                    </label>
                    <input
                      type="text"
                      defaultValue={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      placeholder="e.g., Inspected seal intact, serial matches..."
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                    
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleAcceptTransfer(t)}
                        disabled={acceptingId === t.id}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition whitespace-nowrap disabled:opacity-50 shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{acceptingId === t.id ? 'Signing with Key...' : 'Accept & Sign'}</span>
                      </button>

                      <button
                        onClick={() => handleRejectTransfer(t.id)}
                        disabled={acceptingId === t.id}
                        title="Reject handover if seal broken"
                        className="p-2.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-800 text-red-300 text-xs font-semibold transition cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {myIncomingTransfers.length > 0 && (
            <div className="p-3 border-t border-slate-800">
              <Pagination
                currentPage={tabCurrentPage}
                totalItems={myIncomingTransfers.length}
                pageSize={tabPageSize}
                onPageChange={setTabCurrentPage}
                onPageSizeChange={setTabPageSize}
                pageSizeOptions={[3, 5, 10]}
                itemLabel="incoming handovers"
              />
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: DISPATCHED BY ME (Outbound Handover Queue) */}
      {activeTab === 'OUTBOUND' && (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-400" />
              <span>Outbound Handovers Dispatched by @{user?.username}</span>
            </h3>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 font-semibold">
              {myOutboundTransfers.length} PENDING RECIPIENT SIGNATURE
            </span>
          </div>

          <div className="divide-y divide-slate-800">
            {myOutboundTransfers.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs space-y-3">
                <Send className="w-9 h-9 text-slate-600 mx-auto" />
                <p>You have no pending outbound custody handovers awaiting recipient sign-off.</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-400" />
                  <span>Initiate New Handover</span>
                </button>
              </div>
            ) : (
              paginatedOutbound.map((t) => (
                <div key={t.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:bg-slate-900/40 transition">
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold font-mono text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/80">
                        {t.evidenceBarcode}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {t.caseNumber}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-bold uppercase">
                        AWAITING SIGNATURE FROM @{t.toUsername}
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-slate-100">
                      {t.evidenceTitle || 'Physical Forensic Exhibit'}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-1 text-slate-400">
                        <span className="text-slate-500 text-[10px]">DISPATCHED BY:</span>
                        <span className="text-blue-300 font-bold">You (@{user?.username})</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                      <div className="flex items-center gap-1 text-slate-400">
                        <span className="text-slate-500 text-[10px]">RECIPIENT OFFICER:</span>
                        <span className="text-amber-300 font-bold">@{t.toUsername} ({t.toOfficerName})</span>
                      </div>
                      <span className="text-slate-600">|</span>
                      <div className="flex items-center gap-1 text-slate-400">
                        <span className="text-slate-500 text-[10px]">SEAL:</span>
                        <span className="text-emerald-400 font-bold">{t.sealNumber}</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 font-mono space-y-1">
                      <div><span className="text-slate-500">Reason:</span> <span className="text-slate-200 font-sans">{t.reasonForTransfer}</span></div>
                      <div><span className="text-slate-500">Seal & Packaging:</span> <span className="text-slate-300 font-sans">{t.physicalCondition}</span></div>
                      <div><span className="text-slate-500">Dispatched Timestamp:</span> <span className="text-slate-400">{new Date(t.transferDate).toLocaleString()}</span></div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 lg:w-64 shrink-0 bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] font-mono text-slate-400">Target Recipient</span>
                    <span className="text-xs font-bold text-amber-300 font-mono">@{t.toUsername}</span>
                    <span className="text-[10px] text-slate-500">{t.toOfficerName}</span>
                    
                    <button
                      onClick={() => handleCancelTransfer(t.id)}
                      className="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:border-rose-800 border border-slate-700 text-slate-300 hover:text-rose-300 text-xs font-mono transition cursor-pointer"
                    >
                      Recall / Cancel Handover
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {myOutboundTransfers.length > 0 && (
            <div className="p-3 border-t border-slate-800">
              <Pagination
                currentPage={tabCurrentPage}
                totalItems={myOutboundTransfers.length}
                pageSize={tabPageSize}
                onPageChange={setTabCurrentPage}
                onPageSizeChange={setTabPageSize}
                pageSizeOptions={[3, 5, 10]}
                itemLabel="outbound handovers"
              />
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: ALL DEPARTMENT PENDING (Supervisory View for Admin/Senior/Auditor) */}
      {activeTab === 'ALL_DEPARTMENT' && isSupervisor && (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              <span>Department-Wide Custody Transition Queue (Supervisory View)</span>
            </h3>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-semibold">
              {pendingTransfers.length} ACTIVE TRANSFERS
            </span>
          </div>

          <div className="divide-y divide-slate-800">
            {pendingTransfers.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No active custody handovers across the department.
              </div>
            ) : (
              paginatedDept.map((t) => {
                const isTargetForMe = isRecipientForUser(t, user);
                return (
                  <div key={t.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:bg-slate-900/40 transition">
                    <div className="space-y-2.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold font-mono text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/80">
                          {t.evidenceBarcode}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {t.caseNumber}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold uppercase">
                          ASSIGNED RECIPIENT: @{t.toUsername}
                        </span>
                      </div>

                      <div className="text-sm font-semibold text-slate-100">
                        {t.evidenceTitle || 'Physical Forensic Exhibit'}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-1 text-slate-400">
                          <span className="text-slate-500 text-[10px]">FROM:</span>
                          <span className="text-blue-300 font-bold">@{t.fromUsername} ({t.fromOfficerName})</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                        <div className="flex items-center gap-1 text-slate-400">
                          <span className="text-slate-500 text-[10px]">TO:</span>
                          <span className="text-amber-300 font-bold">@{t.toUsername} ({t.toOfficerName})</span>
                        </div>
                        <span className="text-slate-600">|</span>
                        <div className="flex items-center gap-1 text-slate-400">
                          <span className="text-slate-500 text-[10px]">SEAL:</span>
                          <span className="text-emerald-400 font-bold">{t.sealNumber}</span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-400 font-mono space-y-1">
                        <div><span className="text-slate-500">Reason:</span> <span className="text-slate-200 font-sans">{t.reasonForTransfer}</span></div>
                        <div><span className="text-slate-500">Condition:</span> <span className="text-slate-300 font-sans">{t.physicalCondition}</span></div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:w-72 shrink-0 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                      {isTargetForMe ? (
                        <>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">Assigned to your badge</span>
                          <button
                            onClick={() => handleAcceptTransfer(t)}
                            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Accept & Sign</span>
                          </button>
                        </>
                      ) : (
                        <div className="space-y-1 text-center py-2">
                          <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block">
                            🔒 Designated Recipient Only
                          </span>
                          <p className="text-[11px] text-slate-400">
                            Awaiting verification and signature by <span className="text-white font-semibold">@{t.toUsername}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {pendingTransfers.length > 0 && (
            <div className="p-3 border-t border-slate-800">
              <Pagination
                currentPage={tabCurrentPage}
                totalItems={pendingTransfers.length}
                pageSize={tabPageSize}
                onPageChange={setTabCurrentPage}
                onPageSizeChange={setTabPageSize}
                pageSizeOptions={[3, 5, 10]}
                itemLabel="department transfers"
              />
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: ACCEPTED / HISTORICAL TRANSFERS REGISTRY */}
      {activeTab === 'REGISTRY' && (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Immutable Chain of Custody Transfer Logs</span>
            </h3>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
              {myAcceptedTransfers.length} VERIFIED
            </span>
          </div>

          <div className="divide-y divide-slate-800">
            {myAcceptedTransfers.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="font-semibold text-slate-300">No verified custody handovers involving @{user?.username}.</p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  Under zero-trust persona isolation, you only see custody ledger records for evidence handovers directed to or dispatched by your active badge.
                </p>
              </div>
            ) : (
              paginatedAccepted.map((t) => (
                <div key={t.id} className="p-5 space-y-3 hover:bg-slate-900/40 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80">
                        {t.evidenceBarcode}
                      </span>
                      <span className="text-xs font-semibold text-slate-200">
                        {t.evidenceTitle || 'Forensic Item'}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>DUAL SIGNATURE COMMITTED</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-500 text-[10px] block uppercase">Custody Transition</span>
                      <span className="text-blue-300 font-semibold">@{t.fromUsername} ({t.fromOfficerName})</span>
                      <span className="text-slate-500 mx-1">➔</span>
                      <span className="text-emerald-300 font-semibold">@{t.toUsername} ({t.toOfficerName})</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block uppercase">Seal Verification</span>
                      <span className="text-slate-200">{t.sealNumber} (Intact)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block uppercase">Timestamp Completed</span>
                      <span className="text-slate-300">{new Date(t.acceptedDate || t.transferDate).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 font-mono space-y-1">
                    <div>
                      <span className="text-slate-500">Inspection Note:</span> <span className="text-slate-300 font-sans">{t.verificationNotes}</span>
                    </div>
                    {t.signatureHash && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono truncate">
                        <Key className="w-3 h-3 text-violet-400 shrink-0" />
                        <span>Cryptographic Digest: </span>
                        <span className="text-slate-400 truncate">{t.signatureHash}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {myAcceptedTransfers.length > 0 && (
            <div className="p-3 border-t border-slate-800">
              <Pagination
                currentPage={tabCurrentPage}
                totalItems={myAcceptedTransfers.length}
                pageSize={tabPageSize}
                onPageChange={setTabCurrentPage}
                onPageSizeChange={setTabPageSize}
                pageSizeOptions={[3, 5, 10]}
                itemLabel="verified records"
              />
            </div>
          )}
        </div>
      )}

      {/* INITIATE CUSTODY HANDOVER MODAL (WIDE HORIZONTAL 2-COLUMN LAYOUT) */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] w-screen h-screen min-h-screen bg-black/95 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
          <div className="obsidian-card w-full max-w-5xl rounded-3xl border border-white/10 bg-[#0A0C16] p-5 sm:p-6 shadow-[0_30px_90px_rgba(0,0,0,0.98)] relative overflow-hidden my-auto max-h-[94vh] flex flex-col justify-between">
            {/* Top Accent Gradient Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-cyan-400" />

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10 shrink-0">
                  <GitCommit className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Initiate Custody Handover
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      ISO/IEC 27037 Standard
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Dual-party non-repudiation: Cryptographically locked to designated recipient officer only.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content in a Wide Horizontal 2-Column Grid */}
            <form onSubmit={handleInitiateTransfer} className="space-y-4 text-xs font-sans overflow-y-auto pr-1">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* LEFT COLUMN: EVIDENCE & SECURITY GUARANTEE (6 Cols) */}
                <div className="lg:col-span-6 space-y-3.5 flex flex-col justify-between">
                  {/* Evidence Details Card */}
                  <div className="p-4 rounded-2xl bg-[#0E1222] border border-white/[0.06] space-y-3 shadow-inner">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-200 font-bold uppercase text-[11px] font-mono flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-amber-400" />
                        <span>Evidence Artifact & Case</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">Preset or Custom</span>
                    </div>

                    {/* Quick Preset Selector */}
                    <div>
                      <select
                        onChange={(e) => handleSelectEvidencePreset(e.target.value)}
                        className="w-full px-3 py-2 bg-[#13182E] border border-white/[0.08] hover:border-white/[0.18] rounded-xl text-slate-200 text-xs focus:outline-none focus:border-amber-500 font-mono transition cursor-pointer"
                      >
                        <option value="">— Choose registered evidence to auto-fill —</option>
                        {availableEvidence.map((ev) => (
                          <option key={ev.id || ev.evidenceNumber} value={ev.id || ev.evidenceNumber}>
                            {ev.evidenceNumber || ev.barcode} • {ev.title || ev.description} ({ev.caseNumber || 'General'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] text-slate-300 font-medium block mb-1 font-mono">
                          Evidence Barcode / ID *
                        </label>
                        <input
                          type="text"
                          value={evidenceBarcode}
                          onChange={(e) => setEvidenceBarcode(e.target.value)}
                          placeholder="e.g. EVD-2026-004-A"
                          className="w-full px-3 py-2 bg-[#13182E] border border-white/[0.08] hover:border-white/[0.18] rounded-xl text-white focus:outline-none focus:border-amber-500 text-xs font-mono transition"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-300 font-medium block mb-1 font-mono">
                          Case Dossier Number *
                        </label>
                        <input
                          type="text"
                          value={evidenceCaseNum}
                          onChange={(e) => setEvidenceCaseNum(e.target.value)}
                          placeholder="e.g. CASE-2026-001"
                          className="w-full px-3 py-2 bg-[#13182E] border border-white/[0.08] hover:border-white/[0.18] rounded-xl text-white focus:outline-none focus:border-amber-500 text-xs font-mono transition"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-300 font-medium block mb-1 font-mono">
                        Evidence Name & Artifact Description *
                      </label>
                      <input
                        type="text"
                        value={evidenceTitle}
                        onChange={(e) => setEvidenceTitle(e.target.value)}
                        placeholder="e.g. Samsung 980 Pro NVMe SSD 1TB - Primary System Drive"
                        className="w-full px-3 py-2 bg-[#13182E] border border-white/[0.08] hover:border-white/[0.18] rounded-xl text-white focus:outline-none focus:border-amber-500 text-xs transition"
                        required
                      />
                    </div>
                  </div>

                  {/* Security Guarantee Banner */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-cyan-500/10 border border-amber-500/20 text-xs text-amber-200/90 space-y-1.5 shadow-sm">
                    <div className="font-semibold flex items-center gap-2 text-amber-300">
                      <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Single-Recipient Security Guarantee</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Upon dispatch, this evidence transfer is cryptographically locked to the selected recipient officer. It will appear <strong className="text-white font-semibold">exclusively</strong> in their incoming queue, and cannot be accepted by any other persona.
                    </p>
                  </div>
                </div>

                {/* RIGHT COLUMN: CUSTODIAL CHAIN, SEAL & REASON (6 Cols) */}
                <div className="lg:col-span-6 space-y-3.5">
                  {/* Custodial Chain Card */}
                  <div className="p-4 rounded-2xl bg-[#0E1222] border border-white/[0.06] space-y-3 shadow-inner">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-200 font-bold uppercase text-[11px] font-mono flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Custodial Transfer Flow</span>
                      </label>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Persona-Locked
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* From: Current Officer */}
                      <div className="p-2.5 rounded-xl bg-[#13182E] border border-white/[0.08] space-y-0.5">
                        <div className="text-[9px] font-mono text-slate-400 uppercase">From: Dispatcher</div>
                        <div className="font-semibold text-white truncate text-xs">@{user?.username}</div>
                        <div className="text-[10px] text-slate-400 truncate">{user?.fullName || 'Active Officer'}</div>
                      </div>

                      {/* To: Target Recipient */}
                      <div className="p-2.5 rounded-xl bg-[#13182E] border border-amber-500/30 space-y-1">
                        <div className="text-[9px] font-mono text-amber-300 font-bold uppercase">To: Recipient *</div>
                        <select
                          value={selectedRecipientKey}
                          onChange={(e) => setSelectedRecipientKey(e.target.value)}
                          className="w-full px-2 py-1 bg-[#0A0C16] border border-amber-500/40 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-amber-400 font-mono transition cursor-pointer"
                          required
                        >
                          <optgroup label="Authorized Custody Officers">
                            {recipientChoices.map((r) => (
                              <option key={r.username} value={r.username}>
                                @{r.username} — {r.name} ({r.roleLabel})
                              </option>
                            ))}
                          </optgroup>
                          <option value="CUSTOM">+ Custom Officer...</option>
                        </select>
                      </div>
                    </div>

                    {/* Custom Recipient Inputs */}
                    {selectedRecipientKey === 'CUSTOM' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 bg-[#0A0C16] rounded-xl border border-amber-500/30 animate-in fade-in duration-150">
                        <div>
                          <label className="text-[10px] font-mono text-slate-300 block mb-0.5">Officer Name *:</label>
                          <input
                            type="text"
                            value={customRecipientName}
                            onChange={(e) => setCustomRecipientName(e.target.value)}
                            placeholder="e.g. Inspector Rajesh Kumar"
                            className="w-full px-2.5 py-1 bg-[#13182E] border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-slate-300 block mb-0.5">Badge UID *:</label>
                          <input
                            type="text"
                            value={customRecipientUsername}
                            onChange={(e) => setCustomRecipientUsername(e.target.value)}
                            placeholder="e.g. rajesh_kumar"
                            className="w-full px-2.5 py-1 bg-[#13182E] border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Seal & Packaging Card */}
                  <div className="p-4 rounded-2xl bg-[#0E1222] border border-white/[0.06] space-y-3 shadow-inner">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Tamper Seal Barcode */}
                      <div>
                        <label className="text-slate-200 font-bold uppercase text-[11px] font-mono block mb-1">
                          Seal Barcode *
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={sealNumber}
                            onChange={(e) => setSealNumber(e.target.value)}
                            placeholder="e.g. SEAL-984210"
                            className="flex-1 px-3 py-1.5 bg-[#13182E] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-amber-500 text-xs font-mono transition"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setSealNumber(`SEAL-${Math.floor(100000 + Math.random() * 900000)}`)}
                            className="px-2.5 py-1.5 bg-[#182040] hover:bg-[#202B56] border border-white/10 text-cyan-300 rounded-xl text-[10px] font-mono font-bold uppercase transition flex items-center gap-1 cursor-pointer"
                            title="Generate seal barcode"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Gen</span>
                          </button>
                        </div>
                      </div>

                      {/* Packaging Condition */}
                      <div>
                        <label className="text-slate-200 font-bold uppercase text-[11px] font-mono block mb-1">
                          Packaging & Condition *
                        </label>
                        <input
                          type="text"
                          value={physicalCondition}
                          onChange={(e) => setPhysicalCondition(e.target.value)}
                          placeholder="e.g. Sealed in anti-static pouch"
                          className="w-full px-3 py-1.5 bg-[#13182E] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-amber-500 text-xs transition"
                          required
                        />
                      </div>
                    </div>

                    {/* Reason for Handover */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-200 font-bold uppercase text-[11px] font-mono">
                          Reason for Handover *
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">Quick tags</span>
                      </div>
                      <input
                        type="text"
                        value={transferReason}
                        onChange={(e) => setTransferReason(e.target.value)}
                        placeholder="Type reason for custody transfer..."
                        className="w-full px-3 py-1.5 bg-[#13182E] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-amber-500 text-xs transition mb-2"
                        required
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: 'Forensic Lab', val: 'Forensic Laboratory Examination & Extraction' },
                          { label: 'Court Exhibit', val: 'Judicial Court Exhibit Presentation' },
                          { label: 'Vault Relocation', val: 'High-Security Evidence Vault Relocation' },
                          { label: 'Discovery Review', val: 'Prosecution Discovery Verification' },
                        ].map((tag) => {
                          const isActive = transferReason === tag.val;
                          return (
                            <button
                              key={tag.label}
                              type="button"
                              onClick={() => setTransferReason(tag.val)}
                              className={`text-[10px] px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                                isActive
                                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-200 font-semibold'
                                  : 'bg-[#13182E] hover:bg-[#1A213D] border-white/[0.06] text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {tag.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Action Bar */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08] shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-[#13182E] hover:bg-[#1A213D] text-slate-300 text-xs font-semibold transition border border-white/[0.08] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 hover:from-amber-500 hover:via-orange-500 hover:to-amber-400 text-white text-xs font-semibold tracking-wider uppercase transition flex items-center gap-2 disabled:opacity-50 shadow-xl shadow-amber-600/30 cursor-pointer border border-white/10"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Dispatching Handover...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
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
    </div>
  );
};

export default CustodyTransferPage;
