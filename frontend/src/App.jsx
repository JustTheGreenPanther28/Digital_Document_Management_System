import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CasesListPage } from './pages/CasesListPage';
import { CaseDetailsPage } from './pages/CaseDetailsPage';
import { CustodyTransferPage } from './pages/CustodyTransferPage';
import { AuditLedgerPage } from './pages/AuditLedgerPage';
import { EvidenceLockerPage } from './pages/EvidenceLockerPage';
import { DocumentVaultPage } from './pages/DocumentVaultPage';
import { CourtProceedingsPage } from './pages/CourtProceedingsPage';
import { GlobalSearchPage } from './pages/GlobalSearchPage';
import { UsersAdminPage } from './pages/UsersAdminPage';
import { RolesAdminPage } from './pages/RolesAdminPage';
import { SecurityAlertsPage } from './pages/SecurityAlertsPage';
import { RetentionDisposalPage } from './pages/RetentionDisposalPage';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-3xl bg-[#121524] border border-rose-500/30 text-center space-y-4 max-w-xl mx-auto my-12">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 font-bold text-lg">
            !
          </div>
          <h2 className="text-base font-bold text-white">Something went wrong rendering this view</h2>
          <p className="text-xs text-slate-400 font-mono">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition cursor-pointer"
          >
            Reload View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

import { 
  ShieldAlert, 
  Lock, 
  Briefcase 
} from 'lucide-react';

const AccessDeniedView = ({ user, allowedRoles, pageTitle }) => {
  return (
    <div className="obsidian-card p-8 sm:p-10 rounded-3xl border border-rose-500/40 text-center space-y-6 max-w-xl mx-auto my-12 select-none shadow-[0_20px_50px_rgba(244,63,94,0.18)] bg-[#0B0D17]">
      <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400 shadow-lg shadow-rose-500/20">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold uppercase tracking-wider">
          <Lock className="w-3 h-3" />
          <span>403 FORBIDDEN • PRIVILEGE RESTRICTION</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Access Denied: High-Level Clearance Required
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
          Under Section 65B of the Indian Evidence Act and ISO/IEC 27037 RBAC compliance protocols, access to this restricted area {pageTitle ? `(${pageTitle})` : ''} is restricted. Your current persona lacks authorization.
        </p>
      </div>

      {/* Security Policy Context */}
      <div className="p-4 rounded-2xl bg-[#121524] border border-white/[0.06] text-[11px] font-mono space-y-2 text-left">
        <div className="flex justify-between items-center text-slate-400">
          <span>Active Persona:</span>
          <span className="text-white font-bold">@{user?.username} ({user?.fullName || 'Officer'})</span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>Assigned Roles:</span>
          <span className="text-amber-400 font-bold">{user?.roles?.join(', ') || 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>Required Authority:</span>
          <span className="text-cyan-400 font-bold">{allowedRoles?.join(' | ') || 'AUTHORIZED PERSONA ONLY'}</span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>Security Policy Decision:</span>
          <span className="text-rose-400 font-bold">ACCESS BLOCKED (UNAUTHORIZED PERSONA)</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={() => { window.location.href = '/dashboard'; }}
          className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Briefcase className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
};

const ProtectedLayout = ({ children, allowedRoles, pageTitle }) => {
  const { user, isAuthenticated, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs font-mono text-slate-500">
        Authenticating session against security vault...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isAuthorized = !allowedRoles || allowedRoles.some(role => hasRole(role));

  return (
    <div className="min-h-screen bg-[#08090E] flex flex-col text-slate-100 selection:bg-violet-600 selection:text-white">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-5 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          <ErrorBoundary>
            {isAuthorized ? (
              children
            ) : (
              <AccessDeniedView user={user} allowedRoles={allowedRoles} pageTitle={pageTitle} />
            )}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

const RootRedirect = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

const PublicLoginRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />;
};

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<PublicLoginRoute />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedLayout>
                <DashboardPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/cases"
            element={
              <ProtectedLayout>
                <CasesListPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/cases/:caseId"
            element={
              <ProtectedLayout>
                <CaseDetailsPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/custody"
            element={
              <ProtectedLayout>
                <CustodyTransferPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/evidence"
            element={
              <ProtectedLayout 
                allowedRoles={['ADMIN', 'SENIOR_OFFICER']} 
                pageTitle="Central Evidence Locker"
              >
                <EvidenceLockerPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedLayout 
                allowedRoles={['ADMIN', 'SENIOR_OFFICER']} 
                pageTitle="Central Document Vault"
              >
                <DocumentVaultPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/court"
            element={
              <ProtectedLayout>
                <CourtProceedingsPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/audit"
            element={
              <ProtectedLayout 
                allowedRoles={['AUDITOR', 'ADMIN', 'SENIOR_OFFICER']} 
                pageTitle="Audit & Custody Ledger"
              >
                <AuditLedgerPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedLayout>
                <GlobalSearchPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedLayout 
                allowedRoles={['ADMIN', 'SENIOR_OFFICER']} 
                pageTitle="User Directory & Staff Management"
              >
                <UsersAdminPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <ProtectedLayout 
                allowedRoles={['ADMIN']} 
                pageTitle="RBAC & Permission Matrix"
              >
                <RolesAdminPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/security-alerts"
            element={
              <ProtectedLayout 
                allowedRoles={['ADMIN', 'AUDITOR', 'SENIOR_OFFICER']} 
                pageTitle="Threat Intelligence & Security Alerts"
              >
                <SecurityAlertsPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/retention-disposal"
            element={
              <ProtectedLayout>
                <RetentionDisposalPage />
              </ProtectedLayout>
            }
          />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
