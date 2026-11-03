import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole, StudentRecord } from '../types';
import { dataService } from '../services/dataService';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string, targetRole?: UserRole) => Promise<{ success: boolean; role: UserRole; error?: string }>;
  validateStudent: (identifier: string) => Promise<{ valid: boolean; record?: StudentRecord; alreadyRegistered?: boolean; error?: string }>;
  registerStudentAccount: (params: { recordId: string; collegeEmail: string; phone: string; password?: string }) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  changePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;
  updateProfile: (updates: Partial<User>) => Promise<User>;
  switchUserForDemo: (email: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'classconnect_auth_session_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session on initial load
  useEffect(() => {
    try {
      const savedUserId = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedUserId) {
        const user = dataService.getUserById(savedUserId);
        if (user && user.active) {
          setCurrentUser(user);
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error('Session restore failed:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (
    email: string,
    _pass: string,
    targetRole?: UserRole
  ): Promise<{ success: boolean; role: UserRole; error?: string }> => {
    await new Promise((res) => setTimeout(res, 250));

    const cleanEmail = email.trim().toLowerCase();
    const user = dataService.getUserByEmail(cleanEmail);

    if (!user) {
      return {
        success: false,
        role: 'STUDENT',
        error: 'Invalid college email or password. Please verify your credentials or contact administration.',
      };
    }

    if (!user.active) {
      return {
        success: false,
        role: user.role,
        error: 'Account deactivated. Please contact the college administration office.',
      };
    }

    // Role verification: If student tries logging in on professor tab or vice versa
    if (targetRole && user.role !== targetRole) {
      return {
        success: false,
        role: user.role,
        error: `Access Denied: This account is authorized as a ${user.role}. Please select the ${user.role} login tab.`,
      };
    }

    // Save session
    setCurrentUser(user);
    localStorage.setItem(AUTH_STORAGE_KEY, user.userId);

    return {
      success: true,
      role: user.role,
    };
  };

  const validateStudent = async (identifier: string) => {
    await new Promise((res) => setTimeout(res, 300));
    return dataService.validateStudentRecord(identifier);
  };

  const registerStudentAccount = async (params: {
    recordId: string;
    collegeEmail: string;
    phone: string;
    password?: string;
  }): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      await new Promise((res) => setTimeout(res, 400));
      const newUser = dataService.completeStudentRegistration(params);
      setCurrentUser(newUser);
      localStorage.setItem(AUTH_STORAGE_KEY, newUser.userId);
      return { success: true, user: newUser };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    await new Promise((res) => setTimeout(res, 350));
    const user = dataService.getUserByEmail(email);
    if (!user) {
      return {
        success: false,
        message: 'No registered college account found with this email address.',
      };
    }
    return {
      success: true,
      message: `A secure password reset link has been dispatched to ${email}. Please check your college inbox.`,
    };
  };

  const changePassword = async (oldPass: string, newPass: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) throw new Error('Not authenticated');
    await new Promise((res) => setTimeout(res, 300));
    return dataService.changePassword(currentUser.userId, oldPass, newPass);
  };

  const updateProfile = async (updates: Partial<User>): Promise<User> => {
    if (!currentUser) throw new Error('Not authenticated');
    const updated = dataService.updateUserProfile(currentUser.userId, updates);
    setCurrentUser(updated);
    return updated;
  };

  const switchUserForDemo = (email: string): boolean => {
    const user = dataService.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(AUTH_STORAGE_KEY, user.userId);
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser ? currentUser.role : null,
        isAuthenticated: Boolean(currentUser),
        isLoading,
        login,
        validateStudent,
        registerStudentAccount,
        logout,
        resetPassword,
        changePassword,
        updateProfile,
        switchUserForDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
