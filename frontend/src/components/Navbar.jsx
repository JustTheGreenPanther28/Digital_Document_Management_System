import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, getAvailableAccounts, isUserLocked } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Shield,
  ShieldAlert,
  Lock,
  Search,
  ChevronDown,
  LogOut,
  Command,
  UserCheck,
  CheckCircle2,
  Bell,
  Settings,
  FolderPlus,
  LayoutDashboard,
  FileCode2,
  X,
  Radio,
  Briefcase,
  Package,
  FileText,
  ArrowRight,
  Sparkles,
  ArrowUpRight,
  Menu,
  Sun,
  Moon
} from 'lucide-react';

export const Navbar = ({ onToggleMobileMenu = () => {}, isMobileMenuOpen = false }) => {
  const { user, quickSwitch, logout, hasRole, hasPermission } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const dropdownRef = useRef(null);

  const canViewAlerts = hasPermission ? (hasPermission('AUDIT_VERIFY_LEDGER') || hasRole('ADMIN') || hasRole('AUDITOR') || hasRole('SENIOR_OFFICER')) : (hasRole('ADMIN') || hasRole('AUDITOR') || hasRole('SENIOR_OFFICER'));
  const canCreateCase = hasPermission ? hasPermission('CASE_CREATE') : (hasRole('ADMIN') || hasRole('SENIOR_OFFICER') || hasRole('INVESTIGATOR'));

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          setSearchFocused(true);
        }
      }
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setSearchFocused(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener for dropdowns & search
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Compute fast instant matches for navbar search popover
  const getQuickMatches = () => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();

    const safeGet = (key) => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch {
        return [];
      }
    };

    const customCases = safeGet('sih_registered_cases');
    const customEvidence = safeGet('sih_registered_evidence');
    const customDocs = safeGet('sih_vault_documents');

    const baseCases = [
      { id: '1', caseNumber: 'CASE-2026-001', title: 'State vs Cyber Syndicate Alpha (Critical Cyber Breach)' },
      { id: '2', caseNumber: 'CASE-2026-002', title: 'Financial Securities Manipulation & Ledger Tamper' },
      { id: '3', caseNumber: 'CASE-2026-003', title: 'Confidential Document Exfiltration & Trade Secrets' },
      ...customCases
    ];

    const baseEvidence = [
      { id: 'evd-1', barcode: 'EVD-2026-001-A', description: 'Encrypted NVMe SSD' },
      { id: 'evd-2', barcode: 'EVD-2026-001-B', description: 'SCADA Gateway Controller' },
      ...customEvidence
    ];

    const baseDocs = [
      { id: 'doc-1', title: 'SCADA Telemetry Exfiltration Forensics Report' },
      { id: 'doc-2', title: 'Preliminary FIR & Seizure Memo' },
      ...customDocs
    ];

    const canReadCase = hasPermission ? hasPermission('CASE_READ') : true;

    const matchedCases = !canReadCase ? [] : baseCases
      .filter(c => c.caseNumber?.toLowerCase().includes(q) || c.title?.toLowerCase().includes(q) || c.firNumber?.toLowerCase().includes(q))
      .slice(0, 3)
      .map(c => ({ type: 'CASE', title: c.caseNumber, subtitle: c.title, link: `/cases/${c.id}` }));

    const matchedEv = baseEvidence
      .filter(e => e.barcode?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q))
      .slice(0, 2)
      .map(e => ({ 
        type: 'EVIDENCE', 
        title: e.barcode, 
        subtitle: e.description, 
        link: (hasRole('ADMIN') || hasRole('SENIOR_OFFICER')) ? '/evidence' : (e.caseId ? `/cases/${e.caseId}` : '/cases')
      }));

    const matchedDocs = baseDocs
      .filter(d => d.title?.toLowerCase().includes(q) || d.originalFilename?.toLowerCase().includes(q))
      .slice(0, 2)
      .map(d => ({ 
        type: 'DOCUMENT', 
        title: d.title, 
        subtitle: 'Vault Document', 
        link: (hasRole('ADMIN') || hasRole('SENIOR_OFFICER')) ? '/documents' : (d.caseId ? `/cases/${d.caseId}` : '/cases')
      }));

    return [...matchedCases, ...matchedEv, ...matchedDocs];
  };

  const quickMatches = getQuickMatches();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchFocused(false);
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/search');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role?.replace('ROLE_', '')) {
      case 'ADMIN':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'SENIOR_OFFICER':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'INVESTIGATOR':
        return 'bg-violet-500/20 text-violet-300 border-violet-500/40';
      case 'EVIDENCE_CUSTODIAN':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'FORENSIC_OFFICER':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'PROSECUTOR':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'AUDITOR':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const primaryRole = user?.roles?.[0]?.replace('ROLE_', '') || 'USER';

  return (
    <header className="h-14 border-b border-white/[0.07] bg-[#08090E]/95 backdrop-blur-xl px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40 select-none relative">
      {/* Top subtle cyber glow hairline to define the top edge cleanly */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/30 to-transparent pointer-events-none" />

      {/* 1. Left Brand Identity & Mobile Hamburger Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="p-2 -ml-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-[#141829] border border-transparent hover:border-white/[0.08] transition md:hidden focus:outline-none cursor-pointer"
          aria-label="Toggle navigation drawer"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5 text-violet-400" /> : <Menu className="w-5 h-5" />}
        </button>

        <Link to="/dashboard" className="flex items-center gap-2 sm:gap-2.5 group focus:outline-none">
          {/* Glowing Biometric Cyber Badge */}
          <div className="relative">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0D1020] border border-violet-500/40 p-1 flex items-center justify-center shadow-lg shadow-violet-600/30 group-hover:scale-105 group-hover:border-violet-400/70 transition duration-200 overflow-hidden">
              <img 
                src="/logo-icon.png" 
                alt="NDCMS" 
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 border-2 border-[#08090E] shadow-sm animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-wider bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent font-mono">
                NDCMS
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider bg-violet-500/15 text-violet-300 border border-violet-500/30">
                <Radio className="w-2 h-2 text-cyan-400 animate-pulse" />
                Zero-Trust Vault
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden lg:block">
              National Digital Case & Evidence Management Platform
            </p>
          </div>
        </Link>
      </div>

      {/* 2. Center Search Command Bar */}
      <div ref={searchContainerRef} className="flex-1 max-w-xs md:max-w-xs lg:max-w-sm xl:max-w-md mx-2 sm:mx-3 hidden md:block relative">
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchFocused(true);
              }}
              placeholder="Search case ID, evidence, suspect, FIR, custody trail... (Ctrl+K)"
              className="w-full bg-[#121524] hover:bg-[#161B2E] focus:bg-[#181E33] border border-white/[0.08] hover:border-white/[0.15] focus:border-violet-500/50 rounded-full pl-10 pr-12 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition shadow-inner"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="absolute right-3 text-[10px] font-mono text-slate-500 bg-[#1A2035] px-1.5 py-0.5 rounded-full border border-white/[0.05]">
                ⌘K
              </span>
            )}
          </div>
        </form>

        {/* Instant Live Quick Results Dropdown */}
        {searchFocused && searchQuery.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#0C0E1A] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in duration-100 space-y-1">
            <div className="px-2.5 py-1 text-[10px] font-mono uppercase text-slate-400 font-bold flex items-center justify-between border-b border-white/[0.06] pb-1.5 mb-1">
              <span>Quick Matches</span>
              <span className="text-violet-400">{quickMatches.length} found</span>
            </div>

            {quickMatches.length > 0 ? (
              quickMatches.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSearchFocused(false);
                    navigate(item.link);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#161B2E] transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {item.type === 'CASE' && <Briefcase className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />}
                    {item.type === 'EVIDENCE' && <Package className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                    {item.type === 'DOCUMENT' && <FileText className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-violet-300 flex-shrink-0" />
                </button>
              ))
            ) : (
              <div className="p-3 text-center text-xs text-slate-400">
                Press Enter to run cross-domain query for <span className="text-violet-300 font-bold">"{searchQuery}"</span>
              </div>
            )}

            <div className="pt-1.5 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="w-full px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search all records in Intelligence Search (Enter ↵)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Right Action Buttons & Officer Profile Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Search Trigger Button */}
        <button
          type="button"
          onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          className="w-8 h-8 rounded-full bg-[#141829] hover:bg-[#1A2035] border border-white/[0.08] text-slate-300 hover:text-white flex items-center justify-center transition md:hidden cursor-pointer"
          aria-label="Toggle mobile search bar"
        >
          <Search className="w-4 h-4 text-slate-400" />
        </button>

        {/* Register Case Action Pill (Only for Senior Officers, Investigators, Admins) */}
        {canCreateCase && (
          <button
            type="button"
            onClick={() => {
              navigate('/cases?new=true', { state: { openModal: true } });
              window.dispatchEvent(new CustomEvent('open-new-dossier-modal'));
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-violet-600/30 border border-violet-400/30 group cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5 text-violet-200 group-hover:scale-110 transition" />
            <span className="hidden sm:inline-block">New Dossier</span>
            <Lock className="w-2.5 h-2.5 text-violet-300 ml-0.5 hidden sm:inline-block" />
          </button>
        )}

        {/* Multilingual Legal AI Guide Button (Saarthi) */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-nyayasahayak-guide'))}
          className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full bg-gradient-to-r from-cyan-600/20 via-violet-600/25 to-indigo-600/25 hover:from-cyan-500/35 hover:to-violet-500/35 border border-cyan-400/40 hover:border-cyan-300 text-cyan-200 hover:text-white font-semibold text-xs transition shadow-md shadow-cyan-950/30 group cursor-pointer"
          title="Saarthi: Multilingual User Guidance & Workflow Assistant (10 Indian Languages)"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse group-hover:rotate-12 transition" />
          <span className="hidden sm:inline-block font-bold">Saarthi</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
            🇮🇳 सारथी
          </span>
        </button>

        {/* Day / Night Mode Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Day Mode' : 'Switch to Night Mode'}
          className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#141829] hover:bg-[#1A2035] border border-white/[0.08] hover:border-amber-400/40 text-slate-300 hover:text-amber-300 flex items-center justify-center transition group shadow-sm flex-shrink-0 cursor-pointer"
        >
          {isDark
            ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 group-hover:scale-110 transition" />
            : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400 group-hover:scale-110 transition" />
          }
        </button>

        {/* Threat Alert Notification Bell - Only shown to Admin, Auditor, Senior Officer */}
        {canViewAlerts && (
          <Link
            to="/security-alerts"
            className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#141829] hover:bg-[#1A2035] border border-white/[0.08] hover:border-violet-500/40 text-slate-300 hover:text-white flex items-center justify-center transition group shadow-sm flex-shrink-0"
            title="Threat Intelligence & Security Alerts"
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-violet-300 transition" />
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-violet-600 border-2 border-[#08090E] text-[9px] font-mono font-black text-white shadow-md shadow-violet-900/60">
              2
            </span>
          </Link>
        )}

        {/* Officer Profile & Persona Switcher Capsule (Anchored on the RIGHT) */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full bg-[#141829] hover:bg-[#1A2035] border border-white/[0.08] hover:border-violet-500/40 transition duration-200 group shadow-lg cursor-pointer"
          >
            {/* Avatar */}
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-white/20">
              {user?.username?.charAt(0).toUpperCase() || 'O'}
            </div>

            {/* Handle & Name */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
                @{user?.username}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30">
                {user?.clearance || 'PRO'}
              </span>
              <span className="text-xs font-semibold text-slate-200 hidden lg:inline-block max-w-[80px] xl:max-w-[110px] truncate ml-0.5">
                {user?.fullName || user?.username}
              </span>
            </div>

            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-violet-400' : ''}`} />
          </button>

          {/* Solid Opaque Interactive Fast Persona / Role Switcher Popover */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-[calc(100vw-1.5rem)] max-w-sm bg-[#0C0E1A] border border-white/[0.12] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] p-4 z-50 divide-y divide-white/[0.07] animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Profile Card Header */}
              <div className="pb-3 px-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                      AUTHENTICATED SESSION
                    </span>
                  </div>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-wider font-bold ${getRoleBadgeColor(primaryRole)}`}>
                    {primaryRole}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white font-bold font-mono text-sm shadow-md border border-violet-400/40">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">
                      {user?.fullName || user?.username}
                    </h4>
                    <p className="text-xs text-slate-400 truncate font-mono">
                      UID: @{user?.username} • {user?.clearance || 'RESTRICTED'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Switch Officer / Re-Authenticate Section */}
              <div className="py-3">
                <div className="flex items-center justify-between px-1 mb-2">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Switch Officer Account
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Re-Authenticate</span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {getAvailableAccounts().map((acc) => {
                    const isSelected = user?.username === acc.username;
                    const locked = isUserLocked ? isUserLocked(acc.username) : acc.isLocked;
                    return (
                      <button
                        key={acc.username}
                        disabled={locked}
                        onClick={() => {
                          if (locked) {
                            alert(`Account @${acc.username} is locked due to consecutive failed attempts or admin policy. Access is suspended.`);
                            return;
                          }
                          setDropdownOpen(false);
                          logout(acc.username);
                        }}
                        className={`w-full text-left p-2.5 rounded-2xl text-xs transition flex items-center justify-between border ${
                          locked
                            ? 'bg-rose-950/20 border-rose-900/40 text-slate-400 opacity-60 cursor-not-allowed'
                            : isSelected
                            ? 'bg-violet-600/20 border-violet-500/70 text-violet-100 shadow-md shadow-violet-950/40 ring-1 ring-violet-500/40'
                            : 'bg-[#121524] hover:bg-[#181D33] border-white/[0.05] text-slate-300 hover:border-white/[0.1]'
                        }`}
                        title={locked ? `Account @${acc.username} is locked` : `Authenticate as ${acc.name}`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold truncate ${locked ? 'text-rose-300/80 line-through' : 'text-slate-200'}`}>
                              {acc.name}
                            </span>
                            {isSelected && !locked && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                            )}
                            {locked && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-950/80 text-rose-300 border border-rose-800">
                                <Lock className="w-2.5 h-2.5" /> LOCKED
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {locked ? 'Access Suspended' : `Switch session to @${acc.username}`}
                          </div>
                        </div>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border flex-shrink-0 font-bold ${getRoleBadgeColor(acc.role)}`}>
                          {acc.role}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Navigation Links */}
              <div className="py-2.5 grid grid-cols-2 gap-2">
                <Link
                  to="/dashboard"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-[#181D33] transition"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-violet-400" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/audit"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-[#181D33] transition"
                >
                  <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Audit Ledger</span>
                </Link>
              </div>

              {/* Sign Out Footer */}
              <div className="pt-2.5">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-2xl text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 transition shadow-sm"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Sign Out Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Expandable Search Bar */}
      {mobileSearchOpen && (
        <div className="absolute top-14 left-0 right-0 p-3 bg-[#0C0E1A] border-b border-white/[0.1] shadow-2xl md:hidden animate-in slide-in-from-top duration-150 z-30">
          <form onSubmit={(e) => { handleSearchSubmit(e); setMobileSearchOpen(false); }} className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              autoFocus
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cases, evidence, FIR, hash..."
              className="w-full bg-[#141829] border border-white/[0.12] focus:border-violet-500 rounded-xl pl-9 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>
      )}
    </header>
  );
};

export default Navbar;
