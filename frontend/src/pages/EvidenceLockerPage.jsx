import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { Package, Search, GitCommit, ArrowRight, ShieldCheck, Tag, MapPin, ArrowUpRight } from 'lucide-react';

export const EvidenceLockerPage = () => {
  const [cases, setCases] = useState([]);
  const [evidenceItems, setEvidenceItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    loadAllEvidence();
  }, []);

  const loadAllEvidence = async () => {
    setLoading(true);
    try {
      const allCases = await api.getCases().catch(() => []);
      setCases(allCases || []);

      const items = [];
      for (const c of (allCases || [])) {
        try {
          const ev = await api.getCaseEvidence(c.id);
          if (ev && ev.length > 0) {
            ev.forEach((item) => {
              items.push({ ...item, caseNumber: c.caseNumber, caseTitle: c.title });
            });
          }
        } catch (_) {}
      }
      setEvidenceItems(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = evidenceItems.filter((i) => {
    const matchesSearch = 
      i.barcode?.toLowerCase().includes(search.toLowerCase()) ||
      i.description?.toLowerCase().includes(search.toLowerCase()) ||
      i.caseNumber?.toLowerCase().includes(search.toLowerCase()) ||
      i.storageLocation?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || i.itemCategory === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Chain of Custody Registered
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Package className="w-6 h-6 text-emerald-400" />
            <span>Central Evidence Locker</span>
          </h1>
        </div>
      </div>

      <div className="obsidian-card p-3 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-84">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by barcode, item, case #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#121524] border border-white/[0.08] hover:border-white/[0.15] focus:border-emerald-500 rounded-full text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['ALL', 'DIGITAL_DEVICE', 'PHYSICAL_WEAPON', 'BIOLOGICAL', 'DOCUMENTARY', 'NARCOTICS'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-semibold'
                  : 'bg-[#121524] text-slate-400 hover:bg-[#181D33] hover:text-slate-200'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-500 text-xs font-mono">
            Loading evidence catalog across authorized case repositories...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 text-xs border border-dashed border-white/[0.08] rounded-3xl obsidian-card">
            No physical or digital evidence artifacts registered matching this filter.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="obsidian-card p-5 rounded-3xl transition group flex flex-col justify-between hover:scale-[1.01]"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {item.barcode}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-semibold">
                    {item.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-200 transition">
                    {item.description}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Case: <span className="text-slate-200 font-mono font-semibold">{item.caseNumber}</span>
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-[#121524] border border-white/[0.04] space-y-1 text-[11px] text-slate-400 font-mono">
                  <div className="flex justify-between items-center">
                    <span>Category:</span>
                    <span className="text-slate-200 font-bold">{item.itemCategory}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Location:</span>
                    <span className="text-cyan-300 truncate max-w-[150px]">{item.storageLocation || 'Vault 01'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Custody:</span>
                    <span className="text-emerald-400 font-bold">{item.currentCustodian || 'Vault Officer'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <Link
                  to={`/cases/${item.caseId || 1}`}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-medium transition"
                >
                  <span>View Case File</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  to="/custody"
                  className="px-3 py-1.5 rounded-full bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <GitCommit className="w-3.5 h-3.5" />
                  <span>Transfer</span>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EvidenceLockerPage;
