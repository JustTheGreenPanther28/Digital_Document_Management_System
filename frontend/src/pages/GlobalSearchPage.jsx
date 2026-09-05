import React, { useState } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { Search, Briefcase, Package, FileText, ArrowRight, Shield } from 'lucide-react';

export const GlobalSearchPage = () => {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    try {
      const res = await api.search(query, typeFilter);
      setResults(res);
    } catch (err) {
      alert(`Search failed: ${err.message}`);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-400" />
          <span>Unified Case & Evidence Intelligence Search</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Federated search across case numbers, FIR records, evidence barcodes, and metadata (governed by your clearance)
        </p>
      </div>

      <form onSubmit={handleSearch} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by FIR number, case title, barcode (e.g. BAR-), or keyword..."
              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 font-mono w-full sm:w-auto"
          >
            <option value="ALL">ALL DOMAINS</option>
            <option value="CASES">CASES ONLY</option>
            <option value="EVIDENCE">EVIDENCE ONLY</option>
          </select>

          <button
            type="submit"
            disabled={searching}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold uppercase tracking-wider transition shadow-lg shadow-blue-600/30 whitespace-nowrap disabled:opacity-50"
          >
            {searching ? 'Querying...' : 'Execute Search'}
          </button>
        </div>
      </form>

      {/* Search Results Display */}
      {results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Query Results for: <span className="text-blue-400">"{query}"</span></span>
            <span>
              {(results.cases?.length || 0) + (results.evidence?.length || 0)} matches found
            </span>
          </div>

          {/* Cases Results */}
          {results.cases && results.cases.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-400" />
                Matching Case Records ({results.cases.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.cases.map((c) => (
                  <Link
                    key={c.id}
                    to={`/cases/${c.id}`}
                    className="glass-panel p-4 rounded-xl border border-slate-800 hover:border-blue-500/50 transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-blue-400 group-hover:text-blue-300">
                          {c.caseNumber}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 rounded bg-slate-800 text-slate-400">
                          FIR: {c.firNumber}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-200 mt-1">{c.title}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Evidence Results */}
          {results.evidence && results.evidence.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                Matching Evidence Artifacts ({results.evidence.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.evidence.map((ev) => (
                  <div
                    key={ev.id}
                    className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-emerald-400">
                        {ev.barcode}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 rounded bg-slate-800 text-slate-400">
                        {ev.itemCategory}
                      </span>
                    </div>
                    <div className="text-xs text-slate-200">{ev.description}</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      Locker: {ev.storageLocation} • Custodian: @{ev.currentCustodianUsername}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!results.cases || results.cases.length === 0) && (!results.evidence || results.evidence.length === 0) && (
            <div className="p-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
              No cases or evidence matched your query within your authorization boundary.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
