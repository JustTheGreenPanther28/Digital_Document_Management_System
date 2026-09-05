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

const ProtectedLayout = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

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

  return (
    <div className="min-h-screen bg-[#08090E] flex flex-col text-slate-100 selection:bg-violet-600 selection:text-white">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-5 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
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
              <ProtectedLayout>
                <EvidenceLockerPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedLayout>
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
              <ProtectedLayout>
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
              <ProtectedLayout>
                <UsersAdminPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <ProtectedLayout>
                <RolesAdminPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/security-alerts"
            element={
              <ProtectedLayout>
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
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
