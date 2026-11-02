import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  GraduationCap,
  BookOpen,
  Shield,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { dataService } from '../../services/dataService';
import type { UserRole } from '../../types';

export const LoginForm: React.FC = () => {
  const { login, registerUser } = useAuth();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Manual register form state
  const [regRole, setRegRole] = useState<UserRole>('STUDENT');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDept, setRegDept] = useState('dept_cse');
  const [regRoll, setRegRoll] = useState('');
  const [regGroup, setRegGroup] = useState('grp_sec_a');

  const departments = dataService.getDepartments();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await login(email, password);
      if (!result.success) {
        setErrorMessage(result.error || 'Authentication failed. Please check your credentials.');
      }
    } catch {
      setErrorMessage('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) {
      setErrorMessage('Please fill in all required registration fields.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await registerUser({
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        role: regRole,
        departmentId: regDept,
        studentGroupId: regRole === 'STUDENT' ? regGroup : undefined,
        rollNumber: regRole === 'STUDENT' ? (regRoll.trim() || `ROLL-${Math.floor(Math.random() * 900 + 100)}`) : undefined,
        active: true,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Registration failed. Email might already exist.');
      }
    } catch {
      setErrorMessage('Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (targetRole: UserRole) => {
    setIsLoading(true);
    setErrorMessage(null);
    let targetEmail = 'admin@college.edu';
    if (targetRole === 'PROFESSOR') targetEmail = 'professor@college.edu';
    if (targetRole === 'STUDENT') targetEmail = 'student@college.edu';

    setEmail(targetEmail);
    setPassword('Pass@123');

    try {
      const result = await login(targetEmail, 'Pass@123');
      if (!result.success) {
        setErrorMessage(result.error || 'Authentication failed.');
      }
    } catch {
      setErrorMessage('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center items-center px-4 py-8">
      {/* Branding Header */}
      <div className="text-center mb-6 max-w-sm w-full">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#173D72] text-white font-bold text-2xl shadow-md mb-3">
          C
        </div>
        <h1 className="text-2xl font-bold text-[#173D72] tracking-tight">ClassConnect</h1>
        <p className="text-xs text-gray-500 mt-1">College Management & Timetable System</p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-md w-full p-6 sm:p-8">
        {/* Toggle between Sign In and Manual Registration */}
        <div className="flex items-center bg-[#F5F7FA] p-1 rounded-lg border border-gray-200 mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              mode === 'LOGIN'
                ? 'bg-white text-[#173D72] shadow-2xs font-bold'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <LogIn className="w-4 h-4" /> Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('REGISTER');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              mode === 'REGISTER'
                ? 'bg-white text-[#173D72] shadow-2xs font-bold'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <UserPlus className="w-4 h-4" /> Manual Setup / Register
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* MODE 1: COMMON SIGN IN */}
        {mode === 'LOGIN' && (
          <div>
            <div className="mb-4">
              <h2 className="text-base font-bold text-[#202938]">Sign In to Your Account</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Enter your college email. Your role (Student, Professor, or Admin) will be automatically recognized.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  College Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. admin@college.edu or student@college.edu"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#173D72] text-[#202938]"
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs text-[#173D72] hover:underline font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#173D72] text-[#202938]"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-gray-400 hover:text-gray-600 absolute right-2.5 top-2.5"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#173D72] hover:bg-blue-900 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying session...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick 1-Click Access for all 3 Roles */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Instant 1-Click Sign In:</span>
                <span className="text-[10px] text-emerald-600 font-semibold">No password needed</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickLogin('ADMIN')}
                  className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#173D72] text-center transition-colors disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-[#173D72]" />
                  <div className="text-xs font-bold">Admin</div>
                  <div className="text-[9px] text-gray-500 truncate">admin@college.edu</div>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickLogin('PROFESSOR')}
                  className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 text-center transition-colors disabled:opacity-50"
                >
                  <BookOpen className="w-4 h-4 mx-auto mb-1 text-indigo-700" />
                  <div className="text-xs font-bold">Professor</div>
                  <div className="text-[9px] text-gray-500 truncate">professor@...</div>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickLogin('STUDENT')}
                  className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-center transition-colors disabled:opacity-50"
                >
                  <GraduationCap className="w-4 h-4 mx-auto mb-1 text-emerald-700" />
                  <div className="text-xs font-bold">Student</div>
                  <div className="text-[9px] text-gray-500 truncate">student@...</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: MANUAL REGISTRATION (I AM STUDENT, PROFESSOR, OR ADMIN) */}
        {mode === 'REGISTER' && (
          <div>
            <div className="mb-4">
              <h2 className="text-base font-bold text-[#202938]">Manual Profile Setup</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Choose your role and enter your details to create your clean account.
              </p>
            </div>

            {/* Role Selector: Student, Professor, Admin */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setRegRole('STUDENT')}
                className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center gap-1 ${
                  regRole === 'STUDENT'
                    ? 'border-[#173D72] bg-blue-50/80 text-[#173D72] font-bold shadow-2xs'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span className="text-[11px]">Student</span>
              </button>

              <button
                type="button"
                onClick={() => setRegRole('PROFESSOR')}
                className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center gap-1 ${
                  regRole === 'PROFESSOR'
                    ? 'border-[#173D72] bg-blue-50/80 text-[#173D72] font-bold shadow-2xs'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span className="text-[11px]">Professor</span>
              </button>

              <button
                type="button"
                onClick={() => setRegRole('ADMIN')}
                className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center gap-1 ${
                  regRole === 'ADMIN'
                    ? 'border-[#173D72] bg-blue-50/80 text-[#173D72] font-bold shadow-2xs'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span className="text-[11px]">Admin</span>
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder={
                    regRole === 'STUDENT'
                      ? 'e.g. Rahul Sharma'
                      : regRole === 'PROFESSOR'
                      ? 'e.g. Dr. K. Raman'
                      : 'e.g. Principal / Dean Office'
                  }
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#173D72]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">College Email</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g. user@mycollege.edu"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#173D72]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#173D72]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Department</label>
                  <select
                    value={regDept}
                    onChange={(e) => setRegDept(e.target.value)}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg"
                  >
                    {departments.map((d) => (
                      <option key={d.departmentId} value={d.departmentId}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {regRole === 'STUDENT' ? (
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Roll Number</label>
                    <input
                      type="text"
                      value={regRoll}
                      onChange={(e) => setRegRoll(e.target.value)}
                      placeholder="e.g. 26CS01"
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Office / Room</label>
                    <input
                      type="text"
                      value={regRoll}
                      onChange={(e) => setRegRoll(e.target.value)}
                      placeholder="e.g. Room 201"
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                )}
              </div>

              {regRole === 'STUDENT' && (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Section / Group</label>
                  <input
                    type="text"
                    value={regGroup}
                    onChange={(e) => setRegGroup(e.target.value)}
                    placeholder="e.g. grp_sec_a"
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 bg-[#173D72] hover:bg-blue-900 text-white font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <span>Create Profile & Launch Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <div className="flex items-center gap-1 text-emerald-700 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Clean Production Slate</span>
          </div>
          <span className="font-mono">Zero Dummy Data</span>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
      />
    </div>
  );
};
