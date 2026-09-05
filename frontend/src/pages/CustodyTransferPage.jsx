import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { GitCommit, CheckCircle2, Clock, AlertCircle, ArrowRight, ShieldCheck, UserCheck, Package } from 'lucide-react';

export const CustodyTransferPage = () => {
  const { user } = useAuth();
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acceptingId, setAcceptingId] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('Inspected and confirmed seal intact.');

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    setLoading(true);
    try {
      const data = await api.getPendingTransfers();
      setPendingTransfers(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch pending custody transfers');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTransfer = async (transferId) => {
    setAcceptingId(transferId);
    try {
      await api.acceptCustodyTransfer(transferId, verificationNotes);
      alert('Custody transfer accepted! Cryptographic dual signatures recorded in append-only chain of custody.');
      loadPending();
    } catch (err) {
      alert(`Acceptance failed: ${err.message}`);
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-amber-400" />
            <span>Digital Chain of Custody Verification Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Two-party cryptographic protocol: No evidence transfers custody until explicitly verified by the receiver
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Protocol Explanation */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center gap-4">
        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="text-xs space-y-1">
          <div className="font-bold text-slate-200 uppercase font-mono">Dual-Party Protocol Verification</div>
          <p className="text-slate-400 leading-relaxed">
            When Officer A transfers evidence to Officer B, the record enters a <span className="text-amber-400 font-mono">PENDING_ACCEPTANCE</span> state. Officer B must physically inspect the seal, verify barcode match, and sign with their digital identity. This prevents unilateral transfers and repudiation.
          </p>
        </div>
      </div>

      {/* Pending Transfers List */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Incoming Custody Handover Requests
          </h3>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-semibold">
            {pendingTransfers.length} PENDING
          </span>
        </div>

        <div className="divide-y divide-slate-800">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs font-mono">
              Checking custody registry...
            </div>
          ) : pendingTransfers.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No pending custody handovers awaiting your physical verification and signature.
            </div>
          ) : (
            pendingTransfers.map((t) => (
              <div key={t.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-emerald-400">
                      BARCODE: {t.evidenceBarcode || t.evidenceId}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold uppercase">
                      AWAITING ACCEPTANCE
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                    <span className="text-blue-400 font-bold">{t.fromUsername}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-amber-400 font-bold">{t.toUsername} (You)</span>
                  </div>

                  <div className="text-xs text-slate-400 font-mono space-y-0.5">
                    <div>Reason: <span className="text-slate-200 font-sans">{t.reasonForTransfer}</span></div>
                    <div>Recorded Handover Condition: <span className="text-slate-200 font-sans">{t.physicalCondition}</span></div>
                    <div>Initiated: <span className="text-slate-300">{new Date(t.transferDate).toLocaleString()}</span></div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Inspection note..."
                    className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                  />
                  <button
                    onClick={() => handleAcceptTransfer(t.id)}
                    disabled={acceptingId === t.id}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition whitespace-nowrap disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{acceptingId === t.id ? 'Signing...' : 'Accept & Sign Custody'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
