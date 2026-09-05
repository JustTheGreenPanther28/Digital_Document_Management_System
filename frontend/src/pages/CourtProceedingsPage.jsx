import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { Scale, FileText, Download, Plus, CheckCircle2, Calendar, Gavel } from 'lucide-react';

export const CourtProceedingsPage = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [bundleData, setBundleData] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    setLoading(true);
    try {
      const data = await api.getCases().catch(() => []);
      setCases(data || []);
      if (data && data.length > 0) {
        setSelectedCaseId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBundle = async () => {
    if (!selectedCaseId) return;
    setGenerating(true);
    try {
      const res = await api.getPreTrialBundle(selectedCaseId);
      setBundleData(res);
    } catch (err) {
      alert(`Failed to prepare pre-trial bundle: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-400" />
            <span>Prosecution Discovery & Court Proceedings</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Judicial exhibit certification, Section 65B forensic admissibility bundles, and hearing registries
          </p>
        </div>
      </div>

      {/* Discovery Bundle Generator */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <Gavel className="w-4 h-4 text-indigo-400" />
          Compile Certified Judicial Discovery Package
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Aggregates all locked and signed artifacts, chain-of-custody transfer logs, and physical evidence items into a certified forensic dossier for the Court.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono flex-1 focus:outline-none focus:border-blue-500"
          >
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.caseNumber} — {c.title} ({c.status})
              </option>
            ))}
          </select>

          <button
            onClick={handleGenerateBundle}
            disabled={generating || !selectedCaseId}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-600/20 whitespace-nowrap"
          >
            <Scale className="w-4 h-4" />
            <span>{generating ? 'Compiling Package...' : 'Compile Judicial Bundle'}</span>
          </button>
        </div>

        {bundleData && (
          <div className="mt-4 p-5 rounded-xl bg-indigo-950/40 border border-indigo-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-200 uppercase font-mono">
                Certified Legal Bundle Compiled: {bundleData.caseNumber}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                FORENSICALLY ADMISSIBLE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs text-slate-300">
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">Certified Documents</span>
                <div className="text-sm font-bold text-slate-100 mt-1">
                  {bundleData.evidenceDocuments?.length || 0} Artifacts
                </div>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">Physical Evidence Items</span>
                <div className="text-sm font-bold text-slate-100 mt-1">
                  {bundleData.physicalEvidence?.length || 0} Exhibits
                </div>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">Custody Signatures</span>
                <div className="text-sm font-bold text-emerald-400 mt-1">
                  {bundleData.custodyTransferLog?.length || 0} Dual-Signed
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => alert(`Official Prosecution Discovery Package for ${bundleData.caseNumber} verified and ready for judicial submission.`)}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Certify For Submission</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
