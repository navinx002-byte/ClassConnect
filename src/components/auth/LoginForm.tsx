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
  CheckCircle2,
  UserCheck,
  ArrowLeft,
  Phone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import type { UserRole, StudentRecord } from '../../types';

export const LoginForm: React.FC = () => {
  const { login, validateStudent, registerStudentAccount } = useAuth();

  // Mode: LOGIN or STUDENT_REGISTRATION
  const [viewMode, setViewMode] = useState<'LOGIN' | 'STUDENT_REGISTER'>('LOGIN');

  // Role tab for login
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Student Registration workflow states
  const [regStep, setRegStep] = useState<1 | 2>(1); // Step 1: USN validation, Step 2: Complete profile
  const [studentIdentifier, setStudentIdentifier] = useState('');
  const [isValidatingUSN, setIsValidatingUSN] = useState(false);
  const [validatedRecord, setValidatedRecord] = useState<StudentRecord | null>(null);
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await login(email, password, selectedRole);
      if (!result.success) {
        setErrorMessage(result.error || 'Authentication failed. Please check your credentials.');
      }
    } catch {
      setErrorMessage('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Validate College-issued USN / Register No
  const handleValidateIdentifier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentIdentifier.trim()) {
      setErrorMessage('Please enter your college-issued USN, Register number, or Admission number.');
      return;
    }

    setIsValidatingUSN(true);
    setErrorMessage(null);

    try {
      const res = await validateStudent(studentIdentifier);
      if (!res.valid || !res.record) {
        setErrorMessage(res.error || 'No matching student record found in college database.');
        setValidatedRecord(null);
      } else if (res.alreadyRegistered) {
        setErrorMessage(res.error || 'This student account has already been registered. Please sign in directly.');
        setValidatedRecord(null);
      } else {
        setValidatedRecord(res.record);
        setRegStep(2);
      }
    } catch {
      setErrorMessage('Error validating student records. Please try again.');
    } finally {
      setIsValidatingUSN(false);
    }
  };

  // Step 2: Complete Registration
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatedRecord) return;

    if (!regPhone.trim()) {
      setErrorMessage('Please provide a valid contact phone number.');
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await registerStudentAccount({
        recordId: validatedRecord.recordId,
        collegeEmail: validatedRecord.collegeEmail,
        phone: regPhone.trim(),
        password: regPassword,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Registration failed.');
      }
    } catch {
      setErrorMessage('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center items-center px-4 py-8">
      {/* ClassConnect Logo & Brand Header */}
      <div className="text-center mb-6 max-w-sm w-full">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#173D72] text-white shadow-lg mb-3">
          <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
            {/* Education connection logo */}
            <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-[#173D72] tracking-tight">ClassConnect</h1>
        <p className="text-xs text-gray-500 mt-1 font-medium">College Academic & Timetable Management</p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 max-w-md w-full p-6 sm:p-8">
        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 1: ROLE-BASED LOGIN SCREEN                                */}
        {/* ============================================================== */}
        {viewMode === 'LOGIN' && (
          <div>
            {/* Role Selectors: Student, Professor, Admin */}
            <div className="flex items-center bg-[#F5F7FA] p-1 rounded-xl border border-gray-200 mb-6 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('STUDENT');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  selectedRole === 'STUDENT'
                    ? 'bg-white text-[#173D72] shadow-xs font-bold border border-gray-100'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('PROFESSOR');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  selectedRole === 'PROFESSOR'
                    ? 'bg-white text-[#173D72] shadow-xs font-bold border border-gray-100'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Professor</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('ADMIN');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  selectedRole === 'ADMIN'
                    ? 'bg-white text-[#173D72] shadow-xs font-bold border border-gray-100'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </button>
            </div>

            {/* Subheading based on selected role */}
            <div className="mb-4">
              <h2 className="text-base font-bold text-[#202938]">
                {selectedRole === 'STUDENT' && 'Student Sign In'}
                {selectedRole === 'PROFESSOR' && 'Faculty & Professor Sign In'}
                {selectedRole === 'ADMIN' && 'College Administration Sign In'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedRole === 'STUDENT' && 'Sign in with your registered college email and password.'}
                {selectedRole === 'PROFESSOR' && 'Use your official faculty email credentials issued by the college.'}
                {selectedRole === 'ADMIN' && 'Authorized personnel access only. Uses assigned college admin credentials.'}
              </p>
            </div>

            {/* Login Form */}
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
                    placeholder={
                      selectedRole === 'STUDENT'
                        ? 'e.g. student@college.edu'
                        : selectedRole === 'PROFESSOR'
                        ? 'e.g. professor@college.edu'
                        : 'e.g. admin@college.edu'
                    }
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#173D72] text-[#202938]"
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs text-[#173D72] hover:underline font-semibold"
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
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#173D72] text-[#202938]"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-gray-400 hover:text-gray-600 absolute right-3 top-2.5"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#173D72] hover:bg-blue-900 text-white font-bold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Student Registration Link */}
            {selectedRole === 'STUDENT' && (
              <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-600">
                  New Student?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('STUDENT_REGISTER');
                      setRegStep(1);
                      setErrorMessage(null);
                    }}
                    className="text-[#173D72] font-bold hover:underline"
                  >
                    Register with College USN
                  </button>
                </p>
              </div>
            )}

            {/* Notice for Admin / Professor registration */}
            {selectedRole !== 'STUDENT' && (
              <div className="mt-5 p-3 rounded-xl bg-gray-50 border border-gray-200 text-center text-[11px] text-gray-500">
                <ShieldCheck className="w-4 h-4 text-[#173D72] mx-auto mb-1" />
                <span>
                  {selectedRole === 'PROFESSOR'
                    ? 'Faculty accounts are provisioned exclusively by college administration.'
                    : 'System administrator accounts are provisioned by IT security.'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: NEW STUDENT REGISTRATION (COLLEGE-CONTROLLED VALIDATION) */}
        {/* ============================================================== */}
        {viewMode === 'STUDENT_REGISTER' && (
          <div>
            {/* Back button */}
            <button
              type="button"
              onClick={() => {
                setViewMode('LOGIN');
                setErrorMessage(null);
              }}
              className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#173D72] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </button>

            {/* STEP 1: ENTER USN / REGISTER NUMBER */}
            {regStep === 1 && (
              <div>
                <div className="mb-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-[#173D72] text-[11px] font-bold mb-2">
                    Step 1 of 2: Record Verification
                  </div>
                  <h2 className="text-base font-bold text-[#202938]">New Student Registration</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter your official college-issued USN, Register Number, or Admission Number to verify your preloaded academic record.
                  </p>
                </div>

                <form onSubmit={handleValidateIdentifier} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      College USN / Register / Admission Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={studentIdentifier}
                        onChange={(e) => setStudentIdentifier(e.target.value)}
                        placeholder="e.g. 1NN24MC002 or MCA2024-002"
                        className="w-full pl-9 pr-3 py-2.5 text-sm uppercase font-mono bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#173D72] text-[#202938]"
                      />
                      <UserCheck className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Tip: Try demo eligible USN: <code className="bg-gray-100 px-1 py-0.5 rounded text-[#173D72] font-bold">1NN24MC002</code>
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isValidatingUSN}
                    className="w-full py-2.5 px-4 bg-[#173D72] hover:bg-blue-900 text-white font-bold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isValidatingUSN ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying with College Records...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify Student Record</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 2: VERIFIED STUDENT PROFILE & ACCOUNT CREATION */}
            {regStep === 2 && validatedRecord && (
              <div>
                <div className="mb-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Identity Verified
                  </div>
                  <h2 className="text-base font-bold text-[#202938]">Complete Your Account Setup</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Your official record was verified. Set your password and phone number to activate your portal.
                  </p>
                </div>

                {/* Preloaded Official Information Card (Locked from modification) */}
                <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 mb-4 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Student Name:</span>
                    <span className="font-bold text-[#173D72]">{validatedRecord.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">USN / Register No:</span>
                    <span className="font-mono font-semibold text-gray-800">{validatedRecord.usn}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Department / Degree:</span>
                    <span className="font-semibold text-gray-800">{validatedRecord.degree}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Semester & Section:</span>
                    <span className="font-semibold text-gray-800">Semester {validatedRecord.semester} (Sec {validatedRecord.section})</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-blue-200/60">
                    <span className="text-gray-500">Authorized College Email:</span>
                    <span className="font-semibold text-[#173D72]">{validatedRecord.collegeEmail}</span>
                  </div>
                </div>

                <form onSubmit={handleCompleteRegistration} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Contact Phone Number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#173D72]"
                      />
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Create Password</label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full pl-9 pr-10 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#173D72]"
                      />
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="p-1 text-gray-400 hover:text-gray-600 absolute right-3 top-2"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#173D72]"
                      />
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRegStep(1)}
                      className="px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <span>Activate My Student Account</span>
                          <CheckCircle2 className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && <ForgotPasswordModal isOpen={showForgotModal} onClose={() => setShowForgotModal(false)} />}
    </div>
  );
};
