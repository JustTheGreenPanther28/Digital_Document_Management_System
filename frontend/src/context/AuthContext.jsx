import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken, clearAuthToken, getStoredUser, setStoredUser, clearStoredUser } from '../services/api';

const AuthContext = createContext(null);

export const DEMO_ACCOUNTS = [
  { username: 'admin', role: 'ADMIN', clearance: 'TOP_SECRET', name: 'Superintendent Vance (Admin)', desc: 'System administrator & security auditor', password: 'Password@2026!' },
  { username: 'senior_officer', role: 'SENIOR_OFFICER', clearance: 'TOP_SECRET', name: 'Commissioner Sterling', desc: 'Case authorizer & supervisory team assigner', password: 'Password@2026!' },
  { username: 'investigator_a', role: 'INVESTIGATOR', clearance: 'SECRET', name: 'Det. John Miller (Lead)', desc: 'Assigned Lead Investigator on CASE-2026-001', password: 'Password@2026!' },
  { username: 'investigator_b', role: 'INVESTIGATOR', clearance: 'CONFIDENTIAL', name: 'Det. Sarah Connor', desc: 'Investigator without assignment to Case 1 (Tests ABAC)', password: 'Password@2026!' },
  { username: 'custodian', role: 'EVIDENCE_CUSTODIAN', clearance: 'CONFIDENTIAL', name: 'Officer Michael Vance', desc: 'Physical evidence locker & chain of custody manager', password: 'Password@2026!' },
  { username: 'forensic_officer', role: 'FORENSIC_OFFICER', clearance: 'SECRET', name: 'Dr. Evelyn Reed', desc: 'Forensic scientist & digital artifact analyst', password: 'Password@2026!' },
  { username: 'prosecutor', role: 'PROSECUTOR', clearance: 'SECRET', name: 'Counsel Diane Lockhart', desc: 'Prosecuting attorney & trial preparation bundle manager', password: 'Password@2026!' },
  { username: 'court_officer', role: 'COURT_OFFICER', clearance: 'PUBLIC', name: 'Registrar Arthur Pendelton', desc: 'Judicial record keeper & public court officer (Public Dossiers Only)', password: 'Password@2026!' },
  { username: 'auditor', role: 'AUDITOR', clearance: 'TOP_SECRET', name: 'Inspector General Hayes', desc: 'Cryptographic ledger auditor & tamper detection officer', password: 'Password@2026!' },
];

export const clearAllAccountLocks = () => {
  try {
    localStorage.removeItem('sih_locked_usernames');
    const customUsers = JSON.parse(localStorage.getItem('sih_registered_users') || '[]');
    if (Array.isArray(customUsers)) {
      const reset = customUsers.map(u => ({ ...u, accountLocked: false, enabled: true }));
      localStorage.setItem('sih_registered_users', JSON.stringify(reset));
    }
  } catch (_) {}
};

export const isUserLocked = (username) => {
  if (!username) return false;
  const clean = username.trim().toLowerCase();

  // Root administrator and senior officers can NEVER be locked
  if (clean === 'admin' || clean === 'senior_officer') return false;

  try {
    const customUsers = JSON.parse(localStorage.getItem('sih_registered_users') || '[]');
    if (Array.isArray(customUsers)) {
      const match = customUsers.find(u => (u?.username || '').toLowerCase() === clean);
      if (match && (match.accountLocked === true || match.enabled === false)) {
        return true;
      }
    }
  } catch (_) {}

  return false;
};

export const setUserLockState = (username, locked) => {
  if (!username) return;
  const clean = username.trim().toLowerCase();
  if (clean === 'admin' || clean === 'senior_officer') return;

  try {
    const customUsers = JSON.parse(localStorage.getItem('sih_registered_users') || '[]');
    if (Array.isArray(customUsers)) {
      const updated = customUsers.map(u => {
        if ((u?.username || '').toLowerCase() === clean) {
          return { ...u, accountLocked: !!locked };
        }
        return u;
      });
      localStorage.setItem('sih_registered_users', JSON.stringify(updated));
    }
  } catch (_) {}
};

export const getStoredCustomUsers = () => {
  try {
    const stored = localStorage.getItem('sih_registered_users');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const getAvailableAccounts = () => {
  const customUsers = getStoredCustomUsers().map(u => ({
    username: u.username,
    role: Array.isArray(u.roles) ? (typeof u.roles[0] === 'object' ? u.roles[0].name : u.roles[0]) : 'ADMIN',
    clearance: u.securityClearance || 'TOP_SECRET',
    name: u.fullName || u.username,
    desc: `${u.department || 'Registered Officer'} (Custom Registered)`,
    isLocked: isUserLocked(u.username)
  }));

  const map = new Map();
  DEMO_ACCOUNTS.forEach(a => map.set(a.username, { ...a, isLocked: isUserLocked(a.username) }));
  customUsers.forEach(u => map.set(u.username, u));
  return Array.from(map.values());
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getAuthToken());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Purge any stale locked usernames on initial load
    clearAllAccountLocks();
    setUserLockState('admin', false);
    setUserLockState('senior_officer', false);
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const cleanUser = (username || '').trim();
      const cleanPass = (password || '').trim();

      // 1. Try Backend API first if reachable
      try {
        const res = await api.login(cleanUser, cleanPass);
        if (res && res.accessToken) {
          setUserLockState(cleanUser, false);
          handleLoginSuccess(res);
          return { success: true };
        }
      } catch (apiErr) {
        const msg = (apiErr.message || '').toLowerCase();
        if (msg.includes('locked') || msg.includes('disabled') || msg.includes('suspended') || msg.includes('consecutive') || msg.includes('wait') || msg.includes('failed attempts')) {
          setUserLockState(cleanUser, true);
          throw apiErr;
        }
        console.warn('Backend authentication note, applying vault credentials:', apiErr.message);
      }

      // 2. Client / Standalone Authentication validation
      const allAccs = getAvailableAccounts();
      const matched = allAccs.find(a => a.username?.toLowerCase() === cleanUser.toLowerCase());

      const isValidPassword = (matched && matched.password && matched.password === cleanPass);

      if (matched && isValidPassword) {
        // Valid credentials unlock any client-side lock state
        setUserLockState(cleanUser, false);
        const tokenToUse = 'sih-token-' + Date.now();

        const localUser = {
          id: 'usr-' + matched.username,
          username: matched.username,
          fullName: matched.name,
          roles: [matched.role],
          clearance: matched.clearance,
          departmentalId: matched.username.toUpperCase() + '-001',
        };
        handleLoginSuccess({
          userId: localUser.id,
          username: localUser.username,
          fullName: localUser.fullName,
          roles: localUser.roles,
          clearance: localUser.clearance,
          departmentalId: localUser.departmentalId,
          accessToken: tokenToUse,
        });
        return { success: true };
      }

      throw new Error('Invalid username or password. Please verify your credentials.');
    } catch (err) {
      setError(err.message || 'Authentication failed.');
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
    // When performing administrative quick switch, automatically ensure account is unlocked
    setUserLockState(username, false);

    setLoading(true);
    try {
      const allAccs = getAvailableAccounts();
      const matched = allAccs.find(a => a.username === username);
      const pass = matched?.password || 'Password@2026!';
      const res = await login(username, pass);
      return res?.success === true;
    } catch (err) {
      setError(err.message || 'Authentication failed');
      alert(err.message || 'Authentication failed: Account locked or invalid credentials.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (targetUsername = null) => {
    try {
      await api.logout();
    } catch (e) {
      // Ignore logout errors
    }
    clearAuthToken();
    clearStoredUser();
    setToken(null);
    setUser(null);
    if (targetUsername) {
      window.location.href = `/login?username=${encodeURIComponent(targetUsername)}`;
    } else {
      window.location.href = '/login';
    }
  };

  const hasRole = (role) => {
    if (!user) return false;
    const cleanRole = (role || '').replace(/^ROLE_/, '').toUpperCase();
    const userRoles = Array.isArray(user?.roles) 
      ? user.roles 
      : (user?.role ? [user.role] : []);
    const normalized = userRoles.map(r => (typeof r === 'string' ? r : r?.name || '').replace(/^ROLE_/, '').toUpperCase());
    if (normalized.includes(cleanRole)) return true;
    if (cleanRole === 'ADMIN' && (user?.username === 'admin' || normalized.includes('ADMIN') || user?.role === 'ADMIN')) return true;
    if (cleanRole === 'SENIOR_OFFICER' && (user?.username === 'senior_officer' || normalized.includes('SENIOR_OFFICER') || user?.role === 'SENIOR_OFFICER')) return true;
    return false;
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
        clearAllAccountLocks,
        setUserLockState,
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
