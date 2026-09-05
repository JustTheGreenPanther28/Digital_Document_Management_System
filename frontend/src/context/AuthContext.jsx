import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken, clearAuthToken, getStoredUser, setStoredUser, clearStoredUser } from '../services/api';

const AuthContext = createContext(null);

export const DEMO_ACCOUNTS = [
  { username: 'admin', role: 'ADMIN', clearance: 'TOP_SECRET', name: 'Superintendent Vance (Admin)', desc: 'System administrator & security auditor' },
  { username: 'senior_officer', role: 'SENIOR_OFFICER', clearance: 'TOP_SECRET', name: 'Commissioner Sterling', desc: 'Case authorizer & supervisory team assigner' },
  { username: 'investigator_a', role: 'INVESTIGATOR', clearance: 'SECRET', name: 'Det. John Miller (Lead)', desc: 'Assigned Lead Investigator on CASE-2026-001' },
  { username: 'investigator_b', role: 'INVESTIGATOR', clearance: 'CONFIDENTIAL', name: 'Det. Sarah Connor', desc: 'Investigator without assignment to Case 1 (Tests ABAC)' },
  { username: 'custodian', role: 'EVIDENCE_CUSTODIAN', clearance: 'CONFIDENTIAL', name: 'Officer Michael Vance', desc: 'Physical evidence locker & chain of custody manager' },
  { username: 'forensic_officer', role: 'FORENSIC_OFFICER', clearance: 'SECRET', name: 'Dr. Evelyn Reed', desc: 'Forensic scientist & digital artifact analyst' },
  { username: 'prosecutor', role: 'PROSECUTOR', clearance: 'SECRET', name: 'Counsel Diane Lockhart', desc: 'Prosecuting attorney & trial preparation bundle manager' },
  { username: 'court_officer', role: 'COURT_OFFICER', clearance: 'CONFIDENTIAL', name: 'Registrar Arthur Pendelton', desc: 'Judicial record keeper & certified court officer' },
  { username: 'auditor', role: 'AUDITOR', clearance: 'TOP_SECRET', name: 'Inspector General Hayes', desc: 'Cryptographic ledger auditor & tamper detection officer' },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getAuthToken());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(username, password);
      if (res.mfaRequired) {
        return {
          mfaRequired: true,
          mfaSessionToken: res.mfaSessionToken,
          message: res.message,
        };
      }
      handleLoginSuccess(res);
      return { success: true };
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyMfa = async (mfaSessionToken, totpCode) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.verifyTotp(mfaSessionToken, totpCode);
      handleLoginSuccess(res);
      return { success: true };
    } catch (err) {
      setError(err.message || 'MFA Verification failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (data) => {
    const userData = {
      id: data.userId,
      username: data.username,
      fullName: data.fullName,
      roles: data.roles || [],
      clearance: data.clearance,
      departmentalId: data.departmentalId,
    };
    setAuthToken(data.accessToken);
    setStoredUser(userData);
    setToken(data.accessToken);
    setUser(userData);
  };

  const quickSwitch = async (username) => {
    setLoading(true);
    try {
      const res = await api.demoLogin(username);
      if (res.accessToken) {
        handleLoginSuccess(res);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Quick switch failed:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // Ignore logout errors
    }
    clearAuthToken();
    clearStoredUser();
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const hasRole = (role) => {
    return user?.roles?.includes(role) || user?.roles?.includes('ROLE_' + role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        error,
        login,
        verifyMfa,
        quickSwitch,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
