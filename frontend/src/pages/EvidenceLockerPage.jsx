import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { Package, Search, GitCommit, ArrowRight, ShieldCheck, Tag, MapPin, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { canClearanceAccess, isEvidenceSubmittedByUser } from '../services/abac';
import Pagination from '../components/Pagination';

const CASE_CLASSIFICATIONS = {
  '1': 'SECRET',
  'CASE-2026-001': 'SECRET',
  '2': 'SECRET',
  'CASE-2026-002': 'SECRET',
  '3': 'CONFIDENTIAL',
  'CASE-2026-003': 'CONFIDENTIAL',
  '4': 'PUBLIC',
  'CASE-2026-004': 'PUBLIC'
};

const FALLBACK_EVIDENCE_ITEMS = [
  {
    id: 'evd-1',
    barcode: 'EVD-2026-001-A',
    caseId: '1',
    caseNumber: 'CASE-2026-001',
    classification: 'SECRET',
    itemCategory: 'DIGITAL_DEVICE',
    description: 'Encrypted NVMe SSD containing exfiltrated server memory dumps and telemetry logs.',
    storageLocation: 'Vault 01 - Compartment 4B',
    status: 'IN_CUSTODY',
    currentCustodian: 'Officer Michael Vance',
  },
  {
    id: 'evd-2',
    barcode: 'EVD-2026-001-B',
    caseId: '1',
    caseNumber: 'CASE-2026-001',
    classification: 'SECRET',
    itemCategory: 'DIGITAL_DEVICE',
    description: 'Compromised SCADA Gateway hardware controller extracted from power station.',
    storageLocation: 'Vault 01 - Shelf C',
    status: 'IN_FORENSIC_ANALYSIS',
    currentCustodian: 'Dr. Evelyn Reed',
  },
  {
    id: 'evd-3',
    barcode: 'EVD-2026-002-A',
    caseId: '2',
    caseNumber: 'CASE-2026-002',
    classification: 'SECRET',
    itemCategory: 'DIGITAL_DEVICE',
    description: 'SanDisk Extreme 1TB Flash Drive with private key transaction signatures.',
    storageLocation: 'Vault 02 - Bin 9',
    status: 'IN_CUSTODY',
    currentCustodian: 'Officer Michael Vance',
  },
  {
    id: 'evd-4',
    barcode: 'EVD-2026-003-A',
    caseId: '3',
    caseNumber: 'CASE-2026-003',
    classification: 'CONFIDENTIAL',
    itemCategory: 'DOCUMENTARY',
    description: 'Physical ledger & handwritten encryption key passphrases seized on site.',
    storageLocation: 'Vault 03 - Lockbox 12',
    status: 'IN_CUSTODY',
    currentCustodian: 'Dr. Evelyn Reed',
  },
  {
    id: 'evd-5',
    barcode: 'EVD-2026-004-A',
    caseId: '4',
    caseNumber: 'CASE-2026-004',
    classification: 'PUBLIC',
    itemCategory: 'DOCUMENTARY',
    description: 'Certified Municipal Automated Transit Log Archive & Fare Receipts.',
    storageLocation: 'Public Archives - Locker 08',
    status: 'IN_CUSTODY',
    currentCustodian: 'Registrar Arthur Pendelton',
  }
];

export const EvidenceLockerPage = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [evidenceItems, setEvidenceItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  useEffect(() => {
    loadAllEvidence();
  }, []);

  const getStoredEvidence = () => {
    try {
      const stored = localStorage.getItem('sih_registered_evidence');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  };

  const loadAllEvidence = async () => {
    setLoading(true);
    const customEvidence = getStoredEvidence();
    try {
      const allCases = await api.getCases().catch(() => []);
      setCases(allCases || []);

      const items = [...customEvidence];
      for (const c of (allCases || [])) {
        try {
          const ev = await api.getCaseEvidence(c.id);
          if (ev && ev.length > 0) {
            ev.forEach((item) => {
              items.push({ ...item, caseNumber: c.caseNumber, caseTitle: c.title, caseId: c.id });
            });
          }
        } catch (_) {}
      }

      // Only provide default demonstration fallbacks if database and local repository are empty
      if (items.length === 0) {
        FALLBACK_EVIDENCE_ITEMS.forEach(fb => {
          items.push(fb);
        });
      }

      // De-duplicate by barcode/id
      const map = new Map();
      items.forEach(i => map.set(i.id || i.barcode, i));
      setEvidenceItems(Array.from(map.values()));
    } catch (err) {
      console.error(err);
      const fallbackMap = new Map();
      const fallbackPool = customEvidence.length > 0 ? customEvidence : FALLBACK_EVIDENCE_ITEMS;
      fallbackPool.forEach(i => fallbackMap.set(i.id || i.barcode, i));
      setEvidenceItems(Array.from(fallbackMap.values()));
    } finally {
      setLoading(false);
    }
  };

  // Mandatory Access Control (MAC) + Person-Level Submission Check (ABAC):
  // Strictly filter out evidence exceeding clearance OR not submitted by current user (unless ADMIN)
  const clearedItems = evidenceItems.filter((i) => {
    const itemClassification = i.classification || CASE_CLASSIFICATIONS[i.caseId] || CASE_CLASSIFICATIONS[i.caseNumber] || 'RESTRICTED';
    const hasClearance = canClearanceAccess(user?.clearance, itemClassification);
    const isOwnerOrCustodian = isEvidenceSubmittedByUser(i, user);
    return hasClearance && isOwnerOrCustodian;
  });

  const filteredItems = clearedItems.filter((i) => {
    const matchesSearch = 
      i.barcode?.toLowerCase().includes(search.toLowerCase()) ||
      i.description?.toLowerCase().includes(search.toLowerCase()) ||
      i.caseNumber?.toLowerCase().includes(search.toLowerCase()) ||
      i.storageLocation?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || i.itemCategory === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Reset pagination when search or category filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory]);

  const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const isAdmin = (user?.roles || []).some(r => r === 'ADMIN' || r === 'ROLE_ADMIN') || user?.username === 'admin';

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Chain of Custody Registered
            </span>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              {isAdmin ? 'System-Wide Admin Audit View' : `Personal Evidence Vault (@${user?.username || 'user'})`}
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

      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs font-mono">
          Loading evidence catalog across authorized case repositories...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs border border-dashed border-white/[0.08] rounded-3xl obsidian-card">
          No physical or digital evidence artifacts registered matching this filter.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedItems.map((item) => (
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
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredItems.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[6, 12, 24]}
            itemLabel="evidence artifacts"
          />
        </div>
      )}
    </div>
  );
};

export default EvidenceLockerPage;
