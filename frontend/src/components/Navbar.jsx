import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
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
  Radio
} from 'lucide-react';

export const Navbar = () => {
  const { user, quickSwitch, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
      if (e.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
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

      {/* 1. Left Brand Identity */}
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="flex items-center gap-2.5 group focus:outline-none">
          {/* Glowing Biometric Cyber Badge */}
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-[#0D1020] border border-violet-500/40 flex items-center justify-center shadow-lg shadow-violet-600/30 group-hover:scale-105 group-hover:border-violet-400/70 transition duration-200 overflow-hidden">
              <img 
                src="/forsic-icon.png" 
                alt="FORSIC" 
                className="w-full h-full object-cover scale-110"
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 border-2 border-[#08090E] shadow-sm animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-wider bg-gradient-to-r from-white via-slate-100 to-violet-300 bg-clip-text text-transparent font-mono">
                FORSIC
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider bg-violet-500/15 text-violet-300 border border-violet-500/30">
                <Radio className="w-2 h-2 text-violet-400 animate-pulse" />
                Zero-Trust Vault
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden md:block">
              Forensic Evidence Core & Case Management Platform
            </p>
          </div>
        </Link>
      </div>

      {/* 2. Center Search Command Bar */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
      </div>

      {/* 3. Right Action Buttons & Officer Profile Dropdown */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Register Case Action Pill */}
        <Link
          to="/cases"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-violet-600/30 border border-violet-400/30 group"
        >
          <FolderPlus className="w-3.5 h-3.5 text-violet-200 group-hover:scale-110 transition" />
          <span className="hidden sm:inline-block">New Dossier</span>
          <Lock className="w-2.5 h-2.5 text-violet-300 ml-0.5" />
        </Link>

        {/* Threat Alert Notification Bell */}
        <Link
          to="/security-alerts"
          className="relative w-9 h-9 rounded-full bg-[#141829] hover:bg-[#1A2035] border border-white/[0.08] hover:border-violet-500/40 text-slate-300 hover:text-white flex items-center justify-center transition group shadow-sm flex-shrink-0"
          title="Threat Intelligence & Security Alerts"
        >
          <Bell className="w-4 h-4 text-slate-400 group-hover:text-violet-300 transition" />
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-violet-600 border-2 border-[#08090E] text-[9px] font-mono font-black text-white shadow-md shadow-violet-900/60">
            2
          </span>
        </Link>

        {/* Officer Profile & Persona Switcher Capsule (Anchored on the RIGHT) */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-[#141829] hover:bg-[#1A2035] border border-white/[0.08] hover:border-violet-500/40 transition duration-200 group shadow-lg"
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
              <span className="text-xs font-semibold text-slate-200 hidden lg:inline-block max-w-[110px] truncate ml-0.5">
                {user?.fullName || user?.username}
              </span>
            </div>

            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-violet-400' : ''}`} />
          </button>

          {/* Solid Opaque Interactive Fast Persona / Role Switcher Popover */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-84 sm:w-96 bg-[#0C0E1A] border border-white/[0.12] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] p-4 z-50 divide-y divide-white/[0.07] animate-in fade-in slide-in-from-top-2 duration-150">
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

              {/* Fast Role / Persona Switcher Section */}
              <div className="py-3">
                <div className="flex items-center justify-between px-1 mb-2">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Instant Persona Switcher
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">ABAC Tester</span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {DEMO_ACCOUNTS.map((acc) => {
                    const isSelected = user?.username === acc.username;
                    return (
                      <button
                        key={acc.username}
                        onClick={() => {
                          quickSwitch(acc.username);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-2xl text-xs transition flex items-center justify-between border ${
                          isSelected
                            ? 'bg-violet-600/20 border-violet-500/70 text-violet-100 shadow-md shadow-violet-950/40 ring-1 ring-violet-500/40'
                            : 'bg-[#121524] hover:bg-[#181D33] border-white/[0.05] text-slate-300 hover:border-white/[0.1]'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200 truncate">{acc.name}</span>
                            {isSelected && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">{acc.desc}</div>
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
    </header>
  );
};

export default Navbar;
