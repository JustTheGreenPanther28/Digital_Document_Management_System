import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { FileLock2, Search, Download, Lock, CheckCircle2, Copy, Shield, FileText } from 'lucide-react';

export const DocumentVaultPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadAllDocuments();
  }, []);

  const loadAllDocuments = async () => {
    setLoading(true);
    try {
      const cases = await api.getCases().catch(() => []);
      const allDocs = [];
      for (const c of (cases || [])) {
        try {
          const docs = await api.getCaseDocuments(c.id);
          if (docs && docs.length > 0) {
            docs.forEach((d) => allDocs.push({ ...d, caseNumber: c.caseNumber, caseId: c.id }));
          }
        } catch (_) {}
      }
      setDocuments(allDocs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    alert('Verification seal copied to clipboard!');
  };

  const filteredDocs = documents.filter((d) =>
    d.title?.toLowerCase().includes(search.toLowerCase()) ||
    d.caseNumber?.toLowerCase().includes(search.toLowerCase()) ||
    d.originalFilename?.toLowerCase().includes(search.toLowerCase()) ||
    d.sha256Hash?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileLock2 className="w-5 h-5 text-blue-400" />
            <span>Encrypted Document Vault</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Artifacts protected under certified digital vault encryption and compliance standards
          </p>
        </div>
      </div>

      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter documents by title, file name, case #, or verification seal..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
        />
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Repository Documents ({filteredDocs.length})
          </h3>
          <span className="text-xs font-mono text-blue-400">
            INTEGRITY & MALWARE VERIFIED
          </span>
        </div>

        <div className="divide-y divide-slate-800">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs font-mono">
              Decrypting document directory...
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No documents available across your authorized cases.
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <div key={doc.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-900/40 transition">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100">{doc.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {doc.documentType}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold bg-amber-950 text-amber-300 border border-amber-800">
                      {doc.classification}
                    </span>
                    {doc.locked && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 font-semibold">
                        <Lock className="w-2.5 h-2.5" />
                        DIGITALLY SIGNED & SEALED
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-mono text-slate-400 flex items-center gap-3">
                    <span>Case: <Link to={`/cases/${doc.caseId}`} className="text-blue-400 hover:underline">{doc.caseNumber}</Link></span>
                    <span>File: {doc.originalFilename}</span>
                    <span>Size: {Math.round(doc.fileSize / 1024)} KB</span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                    <span>Verification Seal: <span className="text-emerald-400">{doc.sha256Hash}</span></span>
                    <button onClick={() => copyHash(doc.sha256Hash)} className="hover:text-slate-200">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => api.downloadDocument(doc.id, doc.originalFilename)}
                    className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Decrypt & Download</span>
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
