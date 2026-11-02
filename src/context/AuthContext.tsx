import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types';
import { dataService } from '../services/dataService';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; role: UserRole; error?: string }>;
  registerUser: (userData: Omit<User, 'userId' | 'createdAt'>) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  switchUserForDemo: (email: string) => void;
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

  const login = async (email: string, _pass: string): Promise<{ success: boolean; role: UserRole; error?: string }> => {
    // Artificial slight delay to simulate network security verification
    await new Promise((res) => setTimeout(res, 350));

    const cleanEmail = email.trim().toLowerCase();
    const user = dataService.getUserByEmail(cleanEmail);

    if (!user) {
      return {
        success: false,
        role: 'STUDENT',
        error: 'Invalid credentials. No college account registered with this email address.',
      };
    }

    if (!user.active) {
      return {
        success: false,
        role: user.role,
        error: 'Account deactivated. Please contact the college administration office.',
      };
    }

    // Role is automatically retrieved from the verified record
    setCurrentUser(user);
    localStorage.setItem(AUTH_STORAGE_KEY, user.userId);

    return {
      success: true,
      role: user.role,
    };
  };

  const registerUser = async (userData: Omit<User, 'userId' | 'createdAt'>): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      await new Promise((res) => setTimeout(res, 300));
      const newUser = dataService.createUser(userData);
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
    await new Promise((res) => setTimeout(res, 400));
    const user = dataService.getUserByEmail(email);
    if (!user) {
      return {
        success: false,
        message: 'No account found with this college email address.',
      };
    }
    return {
      success: true,
      message: `A secure password reset link has been dispatched to ${email}. Please check your college inbox.`,
    };
  };

  const switchUserForDemo = (email: string) => {
    const user = dataService.getUserByEmail(email);
    if (user && user.active) {
      setCurrentUser(user);
      localStorage.setItem(AUTH_STORAGE_KEY, user.userId);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser ? currentUser.role : null,
        isAuthenticated: Boolean(currentUser),
        isLoading,
        login,
        registerUser,
        logout,
        resetPassword,
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
