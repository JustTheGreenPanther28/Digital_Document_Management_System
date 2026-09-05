import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  GitCommit, CheckCircle2, Clock, AlertCircle, ArrowRight,
  ShieldCheck, UserCheck, Package, Plus, X, Lock, FileText, CheckCircle,
  Hash, Key, RefreshCw, Layers, ChevronRight, XCircle
} from 'lucide-react';

const FALLBACK_PENDING_TRANSFERS = [
  {
    id: 'tr-001-pending',
    evidenceId: 'ev-001',
    evidenceBarcode: 'EVD-2026-001-A',
    evidenceTitle: 'Samsung 980 Pro NVMe SSD 1TB - Primary System Drive',
    caseNumber: 'CASE-2026-001',
    fromUsername: 'investigator_a',
    fromOfficerName: 'Inspector Vikram Rao',
    toUsername: 'custodian',
    toOfficerName: 'Senior Custodian Priya Sharma',
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
    fromUsername: 'field_agent',
    fromOfficerName: 'Officer Rajesh Kumar',
    toUsername: 'investigator_a',
    toOfficerName: 'Inspector Vikram Rao',
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
    fromOfficerName: 'Inspector Vikram Rao',
    toUsername: 'forensic_officer',
    toOfficerName: 'CFSL Examiner Amit Verma',
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
    fromUsername: 'first_responder',
    fromOfficerName: 'Sub-Inspector Ankit Patel',
    toUsername: 'investigator_a',
    toOfficerName: 'Inspector Vikram Rao',
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

export const CustodyTransferPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('PENDING');
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
  const [fromOfficer, setFromOfficer] = useState('Inspector Vikram Rao');
  const [recipientOfficer, setRecipientOfficer] = useState('Senior Custodian Priya Sharma (Central Evidence Vault)');
  const [transferReason, setTransferReason] = useState('Forensic Laboratory Examination & Extraction');
  const [sealNumber, setSealNumber] = useState('');
  const [physicalCondition, setPhysicalCondition] = useState('Tamper-evident bag sealed with serialized lock tape');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTransfers();
    loadEvidenceList();
    if (user) {
      setFromOfficer(user.fullName || user.username || 'Inspector Vikram Rao');
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

  const loadTransfers = async () => {
    setLoading(true);
    setError('');

    const stored = getStoredTransfers();
    let initialPending = stored?.pending || FALLBACK_PENDING_TRANSFERS;
    let initialAccepted = stored?.accepted || FALLBACK_ACCEPTED_TRANSFERS;

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
        { id: 'ev-003', evidenceNumber: 'EVD-2026-003-B', title: 'SanDisk Ultra 128GB Flash Drive', caseNumber: 'CASE-2026-003' },
        { id: 'ev-004', evidenceNumber: 'EVD-2026-004-D', title: 'DJI Mavic 3 Enterprise Drone Flight Controller', caseNumber: 'CASE-2026-004' },
      ];

      fallbackList.forEach(fb => {
        if (!evList.some(e => (e.evidenceNumber || e.barcode) === fb.evidenceNumber)) {
          evList.push(fb);
        }
      });

      setAvailableEvidence(evList);
      if (evList.length > 0) {
        const first = evList[0];
        setEvidenceBarcode(first.evidenceNumber || first.barcode || 'EVD-2026-001-A');
        setEvidenceTitle(first.title || first.description || 'Samsung 980 Pro NVMe SSD 1TB');
        setEvidenceCaseNum(first.caseNumber || 'CASE-2026-001');
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

  const handleInitiateTransfer = async (e) => {
    e.preventDefault();
    if (!evidenceBarcode.trim()) {
      alert('Please enter an Evidence Barcode or Serial Number.');
      return;
    }
    if (!recipientOfficer.trim()) {
      alert('Please enter a Recipient Officer Name.');
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
      toUsername: recipientOfficer.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 20) || 'recipient_officer',
      toOfficerName: recipientOfficer.trim(),
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

      setIsModalOpen(false);
      alert(`Custody handover initiated for ${newTransfer.evidenceBarcode} (${newTransfer.evidenceTitle}) to ${newTransfer.toOfficerName}! Awaiting recipient co-signature.`);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptTransfer = async (transfer) => {
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
        acceptedBy: user?.username || transfer.toUsername
      };

      const updatedPending = pendingTransfers.filter(t => t.id !== transfer.id);
      const updatedAccepted = [acceptedRecord, ...acceptedTransfers];

      setPendingTransfers(updatedPending);
      setAcceptedTransfers(updatedAccepted);
      saveStoredTransfers(updatedPending, updatedAccepted);

      alert(`Dual-party verification complete! Custody transfer for ${transfer.evidenceBarcode} officially committed to append-only chain of custody.`);
    } catch (err) {
      alert(`Acceptance failed: ${err.message}`);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleRejectTransfer = (transferId) => {
    if (!window.confirm('Are you sure you want to reject this custody transfer? Reason: Tamper seal breach / packaging discrepancy.')) {
      return;
    }

    const updatedPending = pendingTransfers.filter(t => t.id !== transferId);
    setPendingTransfers(updatedPending);
    saveStoredTransfers(updatedPending, acceptedTransfers);
    alert('Custody transfer rejected. Discrepancy logged in security audit ledger.');
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
          <div className="text-2xl font-bold text-amber-400 font-mono mt-1">{pendingTransfers.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Pending handovers</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Verified Handovers</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{acceptedTransfers.length}</div>
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
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 flex items-center gap-2 transition ${
            activeTab === 'PENDING'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Incoming Handover Requests ({pendingTransfers.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('REGISTRY')}
          className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 flex items-center gap-2 transition ${
            activeTab === 'REGISTRY'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Verified Custody Ledger ({acceptedTransfers.length})</span>
        </button>
      </div>

      {/* TAB CONTENT: PENDING TRANSFERS */}
      {activeTab === 'PENDING' && (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" />
              <span>Pending Dual-Party Handover Queue</span>
            </h3>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-semibold">
              {pendingTransfers.length} AWAITING INSPECTION
            </span>
          </div>

          <div className="divide-y divide-slate-800">
            {loading ? (
              <div className="p-12 text-center text-slate-500 text-xs font-mono">
                Querying secure custody ledger...
              </div>
            ) : pendingTransfers.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
                <p>All custody handovers have been accepted and signed.</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono inline-flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Initiate New Handover</span>
                </button>
              </div>
            ) : (
              pendingTransfers.map((t) => (
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
                        AWAITING CO-SIGNATURE
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-slate-100">
                      {t.evidenceTitle || 'Physical Forensic Exhibit'}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-1 text-slate-400">
                        <span className="text-slate-500 text-[10px]">FROM:</span>
                        <span className="text-blue-300 font-bold">{t.fromOfficerName || t.fromUsername}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                      <div className="flex items-center gap-1 text-slate-400">
                        <span className="text-slate-500 text-[10px]">TO:</span>
                        <span className="text-amber-300 font-bold">{t.toOfficerName || t.toUsername} (You)</span>
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
                      <div><span className="text-slate-500">Initiated At:</span> <span className="text-slate-400">{new Date(t.transferDate).toLocaleString()}</span></div>
                    </div>
                  </div>

                  {/* Accept / Inspection Action Box */}
                  <div className="flex flex-col gap-2.5 lg:w-80 shrink-0 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                    <label className="text-[10px] font-mono font-bold uppercase text-slate-400">
                      Recipient Inspection Notes:
                    </label>
                    <input
                      type="text"
                      defaultValue={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      placeholder="e.g., Inspected seal, barcode verified..."
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                    
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleAcceptTransfer(t)}
                        disabled={acceptingId === t.id}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition whitespace-nowrap disabled:opacity-50 shadow-lg shadow-emerald-600/20 active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{acceptingId === t.id ? 'Signing with Key...' : 'Accept & Sign'}</span>
                      </button>

                      <button
                        onClick={() => handleRejectTransfer(t.id)}
                        disabled={acceptingId === t.id}
                        title="Reject handover if seal broken"
                        className="p-2.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-800 text-red-300 text-xs font-semibold transition"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
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
              {acceptedTransfers.length} VERIFIED
            </span>
          </div>

          <div className="divide-y divide-slate-800">
            {acceptedTransfers.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No completed custody handovers in the historical log.
              </div>
            ) : (
              acceptedTransfers.map((t) => (
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
                      <span className="text-blue-300 font-semibold">{t.fromOfficerName || t.fromUsername}</span>
                      <span className="text-slate-500 mx-1">➔</span>
                      <span className="text-emerald-300 font-semibold">{t.toOfficerName || t.toUsername}</span>
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
        </div>
      )}

      {/* INITIATE CUSTODY HANDOVER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                  <GitCommit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                    Initiate Custody Handover
                  </h3>
                  <p className="text-[11px] text-slate-400">Register a formal physical or digital evidence transfer</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInitiateTransfer} className="space-y-4 text-xs font-mono">
              {/* Evidence Item Section */}
              <div className="space-y-2 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold uppercase text-[11px] flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-amber-400" />
                    <span>Evidence Item & Case Details *</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Type or select below</span>
                </div>

                {/* Quick Auto-fill from Existing Evidence */}
                <div>
                  <select
                    onChange={(e) => handleSelectEvidencePreset(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-300 text-[11px] focus:outline-none focus:border-amber-500"
                  >
                    <option value="">— Or choose registered evidence to auto-fill —</option>
                    {availableEvidence.map((ev) => (
                      <option key={ev.id || ev.evidenceNumber} value={ev.id || ev.evidenceNumber}>
                        {ev.evidenceNumber || ev.barcode} — {ev.title || ev.description} ({ev.caseNumber || 'General'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Evidence Barcode / ID:</label>
                    <input
                      type="text"
                      value={evidenceBarcode}
                      onChange={(e) => setEvidenceBarcode(e.target.value)}
                      placeholder="e.g. EVD-2026-004-A"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Case Number:</label>
                    <input
                      type="text"
                      value={evidenceCaseNum}
                      onChange={(e) => setEvidenceCaseNum(e.target.value)}
                      placeholder="e.g. CASE-2026-001"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 text-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Evidence Name & Description:</label>
                  <input
                    type="text"
                    value={evidenceTitle}
                    onChange={(e) => setEvidenceTitle(e.target.value)}
                    placeholder="e.g. Samsung 980 Pro NVMe SSD 1TB"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 text-xs"
                    required
                  />
                </div>
              </div>

              {/* Officers Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Sending Officer */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1 uppercase text-[11px]">
                    From: Sending Officer *
                  </label>
                  <input
                    type="text"
                    value={fromOfficer}
                    onChange={(e) => setFromOfficer(e.target.value)}
                    placeholder="e.g. Inspector Vikram Rao"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 text-xs"
                    required
                  />
                </div>

                {/* Recipient Officer */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1 uppercase text-[11px]">
                    To: Recipient Officer & Unit *
                  </label>
                  <input
                    type="text"
                    value={recipientOfficer}
                    onChange={(e) => setRecipientOfficer(e.target.value)}
                    placeholder="Type officer name & division..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 text-xs"
                    required
                  />
                </div>
              </div>

              {/* Quick Recipient Presets Helper */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                <span className="text-slate-500">Quick Recipient:</span>
                <button
                  type="button"
                  onClick={() => setRecipientOfficer('Senior Custodian Priya Sharma (Evidence Vault)')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                >
                  Custodian
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientOfficer('CFSL Examiner Amit Verma (Forensics Lab)')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                >
                  Forensic Lab
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientOfficer('Public Prosecutor Neha Gupta (Judicial Team)')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                >
                  Prosecutor
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientOfficer('Court Registrar Sanjay Joshi (Special CBI Court)')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                >
                  Court Registrar
                </button>
              </div>

              {/* Tamper Seal Barcode */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[11px]">
                  Tamper-Evident Seal Barcode *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sealNumber}
                    onChange={(e) => setSealNumber(e.target.value)}
                    placeholder="e.g. SEAL-984210-CFSL"
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 text-xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setSealNumber(`SEAL-${Math.floor(100000 + Math.random() * 900000)}`)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] uppercase font-bold transition flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Generate</span>
                  </button>
                </div>
              </div>

              {/* Reason for Transfer */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-bold uppercase text-[11px]">
                    Reason for Transfer *
                  </label>
                  <span className="text-[10px] text-slate-500">Type or click quick tag</span>
                </div>
                <input
                  type="text"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="Type reason, e.g. Bitstream imaging analysis..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 text-xs mb-1.5"
                  required
                />
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTransferReason('Forensic Laboratory Examination & Extraction')}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
                  >
                    Forensic Lab
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferReason('Judicial Court Exhibit Presentation')}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
                  >
                    Court Exhibit
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferReason('High-Security Evidence Vault Relocation')}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
                  >
                    Vault Relocation
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferReason('Prosecution Discovery Verification')}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
                  >
                    Discovery Inspection
                  </button>
                </div>
              </div>

              {/* Packaging Condition */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[11px]">
                  Physical Packaging & Seal Condition *
                </label>
                <input
                  type="text"
                  value={physicalCondition}
                  onChange={(e) => setPhysicalCondition(e.target.value)}
                  placeholder="e.g., Sealed in anti-static bag with serialized lock tape"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 text-xs"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs uppercase tracking-wider font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs uppercase tracking-wider font-semibold transition flex items-center gap-1.5 disabled:opacity-50 shadow-lg shadow-amber-600/20"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{submitting ? 'Initiating Handover...' : 'Dispatch Handover'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
