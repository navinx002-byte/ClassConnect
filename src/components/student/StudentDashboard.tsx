import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { dataService } from '../../services/dataService';
import { TimetableGrid } from '../timetable/TimetableGrid';
import {
  Clock,
  MapPin,
  User as UserIcon,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  Filter,
  ArrowLeft,
  FileText,
  FolderOpen,
  Megaphone,
  Award,
  ClipboardList,
  CheckSquare,
  Download,
  Search,
  Send,
  Lock,
  LogOut,
  Bell,
  LifeBuoy,
  Phone,
  Mail,
  ShieldCheck,
} from 'lucide-react';

interface StudentDashboardProps {
  activeTab: string;
  onNavigate?: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ activeTab, onNavigate }) => {
  const { currentUser, logout, changePassword } = useAuth();
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const studentId = currentUser?.userId || 'user_student_01';

  // Navigation handler
  const navigateTo = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  // State for Date-wise Attendance filter
  const [datewiseFrom, setDatewiseFrom] = useState('2026-10-01');
  const [datewiseTo, setDatewiseTo] = useState('2026-11-03');
  const [datewiseSubject, setDatewiseSubject] = useState('ALL');

  // State for Question Papers filter
  const [qpDepartment, setQpDepartment] = useState('dept_mca');
  const [qpSemester, setQpSemester] = useState('1');
  const [qpAcademicYear, setQpAcademicYear] = useState('2026-2027');
  const [qpSubject, setQpSubject] = useState('ALL');
  const [qpSearch, setQpSearch] = useState('');

  // State for Study Materials filter
  const [matSubjectFilter, setMatSubjectFilter] = useState('ALL');

  // State for Support Request (I Need Help)
  const [ticketCategory, setTicketCategory] = useState<'ACADEMIC' | 'ATTENDANCE_CORRECTION' | 'EXAMINATION' | 'FEE_PAYMENT' | 'TECHNICAL' | 'OTHER'>('ATTENDANCE_CORRECTION');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);

  // State for Change Password
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  // Loaded data
  const attendanceSummary = dataService.getAttendanceSummaryForStudent(studentId);
  const todaySessions = dataService.getTodaySessions();
  const allSessions = dataService.getSessions();
  const subjects = dataService.getSubjects();
  const users = dataService.getUsers();
  const announcements = dataService.getAnnouncements();
  const attendanceRecords = dataService.getAttendanceRecords().filter((r) => r.studentId === studentId);
  const questionPapers = dataService.getQuestionPapers();
  const studyMaterials = dataService.getStudyMaterials();
  const supportTickets = dataService.getSupportRequests(studentId);
  const collegeSettings = dataService.getSettings();

  const getSubject = (id: string) => subjects.find((s) => s.subjectId === id);
  const getProfessor = (id: string) => users.find((u) => u.userId === id);

  const getStatusBadge = (status: 'ON' | 'CANCELLED' | 'POSTPONED') => {
    switch (status) {
      case 'ON':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-600" /> ON
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 flex items-center gap-1">
            <XCircle className="w-3 h-3 text-red-600" /> CANCELLED
          </span>
        );
      case 'POSTPONED':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> POSTPONED
          </span>
        );
    }
  };

  const getPercentageColorClasses = (color: 'green' | 'yellow' | 'red') => {
    switch (color) {
      case 'green':
        return {
          bg: 'bg-emerald-500',
          text: 'text-emerald-700',
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
      case 'yellow':
        return {
          bg: 'bg-amber-500',
          text: 'text-amber-700',
          badge: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'red':
        return {
          bg: 'bg-red-500',
          text: 'text-red-700',
          badge: 'bg-red-50 text-red-800 border-red-200',
        };
    }
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    dataService.createSupportRequest({
      studentId: currentUser?.userId || 'user_student_01',
      category: ticketCategory,
      subject: ticketSubject.trim(),
      message: ticketMessage.trim(),
    });

    setTicketSubject('');
    setTicketMessage('');
    setTicketSuccess('Your request has been submitted to College Support. You will receive an update here.');
    setTimeout(() => setTicketSuccess(null), 5000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPass.length < 6) {
      setPassError('Password must be at least 6 characters long');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('New passwords do not match');
      return;
    }

    try {
      const success = await changePassword(currentPass, newPass);
      if (success) {
        setPassSuccess('Password successfully updated!');
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
      } else {
        setPassError('Current password is incorrect');
      }
    } catch {
      setPassError('Failed to change password. Please verify current password.');
    }
  };

  // =========================================================================
  // SUB-PAGE: TODAY'S CLASSES
  // =========================================================================
  if (activeTab === 'today-classes') {
    return (
      <div className="space-y-5">
        <button
          onClick={() => navigateTo('dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#173D72] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-[#173D72]">Today's Classes</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Scheduled academic sessions for today with live status and classroom info
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-[#173D72] border border-blue-200">
            {todaySessions.length} classes scheduled
          </span>
        </div>

        {todaySessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Clock className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-gray-800">No Classes Scheduled Today</h3>
            <p className="text-xs text-gray-500 mt-1">Check your weekly timetable for the upcoming schedule.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {todaySessions.map((session) => {
              const sub = getSubject(session.subjectId);
              const prof = getProfessor(session.professorId);

              return (
                <div
                  key={session.sessionId}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs hover:border-[#173D72]/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-[#202938]">{sub?.name}</h3>
                        <span className="text-xs text-gray-500 font-mono">{sub?.code}</span>
                      </div>
                      {getStatusBadge(session.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-[#173D72]" />
                        <span>{session.startTime} - {session.endTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{session.room}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                      <span>Prof: <strong>{prof?.name || 'Faculty'}</strong></span>
                    </div>
                    {session.version > 1 && (
                      <span className="text-[10px] bg-blue-50 text-[#173D72] px-2 py-0.5 rounded font-medium">
                        Rescheduled (v{session.version})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // SUB-PAGE: WEEKLY TIMETABLE
  // =========================================================================
  if (activeTab === 'weekly-timetable') {
    return (
      <div className="space-y-5">
        <button
          onClick={() => navigateTo('dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#173D72] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div>
          <h1 className="text-xl font-bold text-[#173D72]">Weekly Timetable</h1>
          <p className="text-xs text-gray-500 mt-1">
            Department of Computer Applications • MCA Odd Semester 2026 - 2027 (Section A)
          </p>
        </div>

        <TimetableGrid />
      </div>
    );
  }

  // =========================================================================
  // SUB-PAGE: ATTENDANCE HUB (Option A: Date-wise | Option B: Summary)
  // =========================================================================
  if (activeTab === 'attendance') {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigateTo('dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#173D72] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div>
          <h1 className="text-xl font-bold text-[#173D72]">Attendance Portal</h1>
          <p className="text-xs text-gray-500 mt-1">
            Track your semester attendance records, subject-wise percentages, and absence logs
          </p>
        </div>

        {/* 2 Dedicated Hub Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Option A: Date-wise Attendance Card */}
          <div
            onClick={() => navigateTo('attendance-datewise')}
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs hover:border-[#173D72] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#173D72] flex items-center justify-center mb-3">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#173D72]">A. Date-wise Attendance</h3>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                Filter attendance records across custom date ranges and specific subjects. View session-by-session status (Present / Absent / Late) and professor sign-off.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#173D72]">
              <span>Open Date-wise Log →</span>
              <span className="text-[11px] text-gray-400 font-normal">Filtered View</span>
            </div>
          </div>

          {/* Option B: Attendance Summary Card */}
          <div
            onClick={() => navigateTo('attendance-summary')}
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs hover:border-[#173D72] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                <CheckSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#173D72]">B. Attendance Summary</h3>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                Check overall percentage, subject-by-subject attendance statistics, classes conducted vs. attended, and minimum 75% examination eligibility alerts.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#173D72]">
              <span>Open Attendance Summary →</span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Current: {attendanceSummary.percentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Quick Summary Glance Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Semester 1 Attendance Snapshot
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-2xl font-extrabold text-[#173D72]">
                {attendanceSummary.percentage}% Overall Attendance
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {attendanceSummary.totalAttended} attended out of {attendanceSummary.totalHeld} eligible finalized classes
              </p>
            </div>
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${
                getPercentageColorClasses(attendanceSummary.statusColor).badge
              }`}
            >
              {attendanceSummary.statusColor === 'green' ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Eligible for Final Exam</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Warning: Below 75% Requirement</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SUB-PAGE: DATE-WISE ATTENDANCE
  // =========================================================================
  if (activeTab === 'attendance-datewise') {
    const filteredRecords = attendanceRecords.filter((r) => {
      const matchSubject = datewiseSubject === 'ALL' || r.subjectId === datewiseSubject;
      const session = allSessions.find((s) => s.sessionId === r.sessionId);
      if (!session) return matchSubject;
      const sessionDate = session.date;
      const inDateRange = (!datewiseFrom || sessionDate >= datewiseFrom) && (!datewiseTo || sessionDate <= datewiseTo);
      return matchSubject && inDateRange;
    });

    return (
      <div className="space-y-5">
        <button
          onClick={() => navigateTo('attendance')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#173D72] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Attendance Hub
        </button>

        <div>
          <h1 className="text-xl font-bold text-[#173D72]">Date-wise Attendance Records</h1>
          <p className="text-xs text-gray-500 mt-1">
            Filter and inspect session-by-session student presence records
          </p>
        </div>

        {/* Filter Form Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">From Date</label>
              <input
                type="date"
                value={datewiseFrom}
                onChange={(e) => setDatewiseFrom(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#173D72] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">To Date</label>
              <input
                type="date"
                value={datewiseTo}
                onChange={(e) => setDatewiseTo(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#173D72] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Subject</label>
              <select
                value={datewiseSubject}
                onChange={(e) => setDatewiseSubject(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#173D72] focus:outline-none bg-white"
              >
                <option value="ALL">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.subjectId} value={s.subjectId}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <button
                type="button"
                className="w-full bg-[#173D72] text-white text-xs font-bold py-2 px-4 rounded-lg hover:bg-[#122e56] transition-colors flex items-center justify-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5" /> Apply Filter
              </button>
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7FA] border-b border-gray-200 text-gray-600 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-bold">Date & Time</th>
                  <th className="py-3 px-4 font-bold">Subject</th>
                  <th className="py-3 px-4 font-bold">Professor</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Recorded At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      No attendance records found for the selected dates and subject.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => {
                    const session = allSessions.find((s) => s.sessionId === r.sessionId);
                    const sub = getSubject(r.subjectId);
                    const prof = getProfessor(r.professorId);

                    return (
                      <tr key={r.attendanceId} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-medium text-gray-800">
                          <div>{session?.date || 'Dated Session'}</div>
                          <div className="text-[11px] text-gray-500 font-mono">
                            {session ? `${session.startTime} - ${session.endTime}` : ''}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#173D72]">
                          {sub?.name || r.subjectId}
                          <div className="text-[10px] text-gray-500 font-mono">{sub?.code}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{prof?.name || 'Faculty'}</td>
                        <td className="py-3 px-4">
                          {r.status === 'PRESENT' && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-emerald-600" /> PRESENT
                            </span>
                          )}
                          {r.status === 'ABSENT' && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 inline-flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-red-600" /> ABSENT
                            </span>
                          )}
                          {r.status === 'LATE' && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600" /> LATE
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[11px] text-gray-400 font-mono">
                          {new Date(r.markedAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SUB-PAGE: ATTENDANCE SUMMARY
  // =========================================================================
  if (activeTab === 'attendance-summary') {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigateTo('attendance')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#173D72] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Attendance Hub
        </button>

        <div>
          <h1 className="text-xl font-bold text-[#173D72]">Attendance Summary</h1>
          <p className="text-xs text-gray-500 mt-1">
            Official cumulative percentages, held sessions, and threshold warnings
          </p>
        </div>

        {/* Master Summary Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Overall Attendance Percentage
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl font-extrabold text-[#173D72]">
                  {attendanceSummary.totalHeld > 0 ? `${attendanceSummary.percentage}%` : 'N/A'}
                </span>
                <span className="text-sm font-semibold text-gray-600">
                  {attendanceSummary.totalHeld > 0
                    ? `(${attendanceSummary.totalAttended} attended / ${attendanceSummary.totalHeld} held sessions)`
                    : '(No classes held yet)'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Calculation: (Present eligible finalized sessions / Total eligible sessions held) × 100.
                Total absences: <strong>{attendanceSummary.totalAbsences}</strong> classes.
              </p>
            </div>

            <div className="sm:text-right">
              <div
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold border ${
                  getPercentageColorClasses(attendanceSummary.statusColor).badge
                }`}
              >
                {attendanceSummary.statusColor === 'green' ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Examination Eligible</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Attendance Alert: Below 75% Threshold</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-3 mt-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                getPercentageColorClasses(attendanceSummary.statusColor).bg
              }`}
              style={{ width: `${Math.min(100, attendanceSummary.percentage)}%` }}
            />
          </div>
        </div>

        {/* Subject Cards */}
        <div>
          <h2 className="text-sm font-bold text-[#173D72] mb-3">Subject-wise Attendance Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {attendanceSummary.subjects.map((sub) => {
              const colors = getPercentageColorClasses(sub.statusColor);

              return (
                <div
                  key={sub.subjectId}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs hover:border-gray-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <h3 className="text-sm font-bold text-[#202938]">{sub.subjectName}</h3>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">
                        {sub.subjectCode} • Prof. {sub.professorName}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold text-[#173D72]">
                        {sub.percentage}%
                      </span>
                      <div className="text-[11px] font-semibold text-gray-500">
                        ({sub.attended}/{sub.totalHeld})
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-100 rounded-full h-2 mt-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors.bg}`}
                      style={{ width: `${Math.min(100, sub.percentage)}%` }}
                    />
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      Absences: <strong>{sub.absences}</strong>
                    </span>

                    {sub.consecutiveNeeded > 0 ? (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Need {sub.consecutiveNeeded} consecutive classes for 75%
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-600" /> Above 75% threshold
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SUB-PAGE: CLASS SCHEDULE
  // =========================================================================
  if (activeTab === 'class-schedule') {
    return (
      <div className="space-y-5">
        <button
          onClick={() => navigateTo('dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#173D72] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div>
          <h1 className="text-xl font-bold text-[#173D72]">Dated Class Schedule</h1>
          <p className="text-xs text-gray-500 mt-1">
            Complete schedule of dated sessions and current status for MCA Semester 1
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7FA] border-b border-gray-200 text-gray-600 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-bold">Date & Time</th>
                  <th className="py-3 px-4 font-bold">Subject</th>
                  <th className="py-3 px-4 font-bold">Room</th>
                  <th className="py-3 px-4 font-bold">Professor</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allSessions.map((session) => {
                  const sub = getSubject(session.subjectId);
                  const prof = getProfessor(session.professorId);

                  return (
                    <tr key={session.sessionId} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-medium text-gray-800">
                        <div>{session.date}</div>
                        <div className="text-[11px] text-gray-500 font-mono">
                          {session.startTime} - {session.endTime}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#173D72]">
                        {sub?.name || session.subjectId}
                        <div className="text-[10px] text-gray-500 font-mono">{sub?.code}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{session.room}</td>
                      <td className="py-3 px-4 text-gray-600">{prof?.name || 'Faculty'}</td>
                      <td className="py-3 px-4">{getStatusBadge(session.status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SUB-PAGE: ACADEMIC & SEMESTER INFORMATION
  // =========================================================================
  if (activeTab === 'academic') {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigateTo('dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#173D72] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div>
          <h1 className="text-xl font-bold text-[#173D72]">Academic & Semester Information</h1>
          <p className="text-xs text-gray-500 mt-1">
            Program curriculum, enrolled course credits, and university regulations
          </p>
        </div>

        {/* Academic Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-gray-400 font-bold uppercase text-[10px]">Programme</span>
              <p className="font-bold text-[#173D72] text-sm mt-0.5">Master of Computer Applications (MCA)</p>
            </div>
            <div>
              <span className="text-gray-400 font-bold uppercase text-[10px]">Current Semester</span>
              <p className="font-bold text-gray-800 text-sm mt-0.5">Semester I (Section A)</p>
            </div>
            <div>
              <span className="text-gray-400 font-bold uppercase text-[10px]">Academic Year</span>
              <p className="font-bold text-gray-800 text-sm mt-0.5">2026 - 2027</p>
            </div>
            <div>
              <span className="text-gray-400 font-bold uppercase text-[10px]">Total Credits</span>
              <p className="font-bold text-gray-800 text-sm mt-0.5">24 Credits</p>
            </div>
          </div>
        </div>

        {/* Enrolled Subjects */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-[#F5F7FA] border-b border-gray-200">
            <h2 className="text-sm font-bold text-[#173D72]">Enrolled Subjects (MCA Semester 1)</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {subjects.map((sub) => {
              const prof = getProfessor(sub.professorId);
              return (
                <div key={sub.subjectId} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm">{sub.name}</h3>
                    <span className="text-gray-500 font-mono text-[11px]">
                      Code: {sub.code} • Faculty: {prof?.name || 'Assigned Professor'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-md bg-blue-50 text-[#173D72] font-bold text-xs border border-blue-200">
                      {sub.credits} Credits
                    </span>
                    <div className="text-[11px] text-gray-400 mt-1">Room: {sub.defaultRoom}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Passing & Attendance Criteria */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs text-xs space-y-3">
          <h2 className="text-sm font-bold text-[#173D72] flex items-center gap-2">
            <Award className="w-4 h-4 text-[#173D72]" /> Passing Criteria & University Examination Rules
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-gray-700 leading-relaxed">
            <li>
              <strong>Mandatory 75% Attendance:</strong> Students must maintain a minimum of 75% attendance in each subject to be eligible to appear for the Semester End Examination (SEE).
            </li>
            <li>
              <strong>Continuous Internal Evaluation (CIE):</strong> Minimum 40% aggregate marks required in CIE (Internal Assessments, Quizzes, Assignments, and Lab Evaluations).
            </li>
            <li>
              <strong>Condonation:</strong> Shortage of attendance between 65% and 74% may be condoned by the Academic Council on valid medical grounds with official proof.
            </li>
          </ul>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SUB-PAGE: DOCUMENTS & OLD QUESTION PAPERS (4-Level Filter)
  // =========================================================================
  if (activeTab === 'documents') {
    const filteredPapers = questionPapers.filter((qp) => {
      const matchDept = !qpDepartment || qp.departmentId === qpDepartment;
      const matchSem = !qpSemester || String(qp.semester) === String(qpSemester);
      const matchYear = !qpAcademicYear || qp.academicYear === qpAcademicYear;
      const matchSubject = qpSubject === 'ALL' || qp.subjectId === qpSubject;
      const matchSearch =
        !qpSearch.trim() ||
        qp.title.toLowerCase().includes(qpSearch.toLowerCase()) ||
        qp.subjectName.toLowerCase().includes(qpSearch.toLowerCase()) ||
        qp.subjectCode.toLowerCase().includes(qpSearch.toLowerCase());
      return matchDept && matchSem && matchYear && matchSubject && matchSearch;
    });

    return (
      <div className="space-y-5">
        <button
          onClick={() => navigateTo('dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#173D72] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div>
          <h1 className="text-xl font-bold text-[#173D72]">Documents & Old Question Papers</h1>
          <p className="text-xs text-gray-500 mt-1">
            Access previous semester exam question papers authorized by the Department
          </p>
        </div>

        {/* 4-Level Filter */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-3">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Filter Previous Exam Papers
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* 1. Department */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                1. Department
              </label>
              <select
                value={qpDepartment}
                onChange={(e) => setQpDepartment(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#173D72] focus:outline-none"
              >
                <option value="dept_mca">Computer Applications (MCA)</option>
                <option value="dept_cse">Computer Science (CSE)</option>
                <option value="dept_ise">Information Science (ISE)</option>
              </select>
            </div>

            {/* 2. Semester */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                2. Semester
              </label>
              <select
                value={qpSemester}
                onChange={(e) => setQpSemester(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#173D72] focus:outline-none"
              >
                <option value="1">Semester 1 (Odd)</option>
                <option value="2">Semester 2 (Even)</option>
                <option value="3">Semester 3 (Odd)</option>
                <option value="4">Semester 4 (Even)</option>
              </select>
            </div>

            {/* 3. Academic Year */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                3. Academic Year
              </label>
              <select
                value={qpAcademicYear}
                onChange={(e) => setQpAcademicYear(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#173D72] focus:outline-none"
              >
                <option value="2026-2027">2026 - 2027</option>
                <option value="2025-2026">2025 - 2026</option>
                <option value="2024-2025">2024 - 2025</option>
              </select>
            </div>

            {/* 4. Subject */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                4. Subject
              </label>
              <select
                value={qpSubject}
                onChange={(e) => setQpSubject(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#173D72] focus:outline-none"
              >
                <option value="ALL">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.subjectId} value={s.subjectId}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by paper title or subject code..."
              value={qpSearch}
              onChange={(e) => setQpSearch(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-[#173D72] focus:outline-none"
            />
          </div>
        </div>

        {/* Papers List */}
        <div className="space-y-3">
          {filteredPapers.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-gray-800">No Question Papers Found</h3>
              <p className="text-xs text-gray-500 mt-1">
                No past examination papers match your current filter selections.
              </p>
            </div>
          ) : (
            filteredPapers.map((paper) => (
              <div
                key={paper.paperId}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs hover:border-[#173D72]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#173D72] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#202938]">{paper.title}</h3>
                    <div className="text-xs text-gray-500 mt-0.5 font-mono">
                      {paper.subjectName} ({paper.subjectCode}) • Year: {paper.academicYear} • Sem: {paper.semester}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">
                      File: {paper.fileName} • {paper.fileSize}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <a
                    href={paper.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#173D72] text-white hover:bg-[#122e56] transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // SUB-PAGE: STUDY MATERIALS
  // =========================================================================
  if (activeTab === 'study-materials') {
    const filteredMaterials = studyMaterials.filter((m) =>
      matSubjectFilter === 'ALL' ? true : m.subjectId === matSubjectFilter
    );

    return (
      <div className="space-y-5">
        <button
          onClick={() => navigateTo('dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#173D72] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-[#173D72]">Study Materials & Lecture Notes</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Course modules, presentations, lab manuals, and syllabus copies
            </p>
          </div>

          <select
            value={matSubjectFilter}
            onChange={(e) => setMatSubjectFilter(e.target.value)}
            className="text-xs bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-[#173D72] focus:outline-none"
          >
            <option value="ALL">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.subjectId} value={s.subjectId}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {filteredMaterials.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <FolderOpen className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-gray-800">No Study Materials Available</h3>
              <p className="text-xs text-gray-500 mt-1">Check back later when professors upload notes.</p>
            </div>
          ) : (
            filteredMaterials.map((mat) => (
              <div
                key={mat.materialId}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs hover:border-[#173D72]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#202938]">{mat.title}</h3>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {mat.subjectName} • Uploaded by {mat.uploadedBy}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">
                      {mat.fileSize} • {new Date(mat.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <a
                  href={mat.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#173D72] text-white hover:bg-[#122e56] transition-colors self-end sm:self-center"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // SUB-PAGE: FACULTY ANNOUNCEMENTS
  // =========================================================================
  if (activeTab === 'announcements') {
    return (
      <div className="space-y-5">
        <button
          onClick={() => navigateTo('dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#173D72] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div>
          <h1 className="text-xl font-bold text-[#173D72]">Faculty Announcements</h1>
          <p className="text-xs text-gray-500 mt-1">
            Official department notices, rescheduling advisories, and assignment submissions
          </p>
        </div>

        <div className="space-y-3.5">
          {announcements.map((ann) => (
            <div key={ann.announcementId} className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="text-xs font-bold text-[#173D72] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {ann.subjectName}
                  </span>
                  <h3 className="text-sm font-bold text-[#202938] mt-1.5">{ann.title}</h3>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(ann.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed mt-2">{ann.message}</p>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs text-gray-500">
                <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                <span>Posted by: <strong>{ann.professorName}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // =========================================================================
  // SUB-PAGE: NOTIFICATIONS (Mobile Bottom Nav #2)
  // =========================================================================
  if (activeTab === 'notifications') {
    return (
      <div className="space-y-5">
        <button
          onClick={() => navigateTo('dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#173D72] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#173D72]">Notifications & Alerts</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Class reminders, rescheduling notices, and attendance alerts
            </p>
          </div>

          <button
            onClick={markAllAsRead}
            className="text-xs font-bold text-[#173D72] hover:underline"
          >
            Mark all read
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Bell className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-gray-800">No Notifications</h3>
            <p className="text-xs text-gray-500 mt-1">You are all caught up with your classes and timetable.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const nid = n.notificationId || n.id || '';
              const timeStr = n.createdAt || n.timestamp || new Date().toISOString();
              return (
                <div
                  key={nid}
                  onClick={() => markAsRead(nid)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    n.read
                      ? 'bg-white border-gray-200 opacity-80'
                      : 'bg-blue-50/40 border-blue-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-[#173D72] mt-1.5 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">{n.title}</h4>
                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{n.message || n.body}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono whitespace-nowrap">
                      {new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // SUB-PAGE: I NEED HELP (Mobile Bottom Nav #3)
  // =========================================================================
  if (activeTab === 'help') {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigateTo('dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#173D72] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div>
          <h1 className="text-xl font-bold text-[#173D72]">I Need Help</h1>
          <p className="text-xs text-gray-500 mt-1">
            Submit a direct support ticket to the Department and College Administration
          </p>
        </div>

        {ticketSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            {ticketSuccess}
          </div>
        )}

        {/* Ticket Form */}
        <form onSubmit={handleSupportSubmit} className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#173D72] flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-[#173D72]" /> Submit New Support Request
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                Category
              </label>
              <select
                value={ticketCategory}
                onChange={(e) => setTicketCategory(e.target.value as any)}
                className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#173D72] focus:outline-none"
              >
                <option value="ATTENDANCE_CORRECTION">Attendance Correction</option>
                <option value="ACADEMIC">Academic / Coursework Issue</option>
                <option value="EXAMINATION">Examination Issue</option>
                <option value="TECHNICAL">Portal / Technical Problem</option>
                <option value="OTHER">Other Assistance</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                Subject
              </label>
              <input
                type="text"
                placeholder="e.g. Attendance missing for AOS Lab on Monday"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                required
                className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#173D72] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
              Description / Details
            </label>
            <textarea
              rows={4}
              placeholder="Provide complete details including dates, subject codes, or error messages so the administrator can resolve your request."
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              required
              className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#173D72] focus:outline-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-[#173D72] text-white text-xs font-bold py-2.5 px-5 rounded-lg hover:bg-[#122e56] transition-colors flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" /> Submit Request
            </button>
          </div>
        </form>

        {/* Previous Support Tickets */}
        <div>
          <h2 className="text-sm font-bold text-[#173D72] mb-3">Your Support Tickets & Status</h2>
          {supportTickets.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-xs text-gray-400">
              No previous support requests found.
            </div>
          ) : (
            <div className="space-y-3">
              {supportTickets.map((st) => (
                <div key={st.requestId} className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <span className="text-[10px] font-bold uppercase bg-blue-50 text-[#173D72] px-2 py-0.5 rounded border border-blue-100">
                        {st.category}
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 mt-1">{st.subject}</h4>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        st.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : st.status === 'IN_PROGRESS'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {st.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{st.message}</p>

                  {st.adminResponse && (
                    <div className="mt-3 p-3 bg-[#F5F7FA] rounded-lg border border-gray-200 text-xs">
                      <span className="font-bold text-[#173D72]">College Response:</span>
                      <p className="text-gray-700 mt-0.5">{st.adminResponse}</p>
                    </div>
                  )}

                  <div className="mt-2.5 text-[10px] text-gray-400 font-mono">
                    Submitted on: {new Date(st.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // SUB-PAGE: PROFILE (Mobile Bottom Nav #4)
  // =========================================================================
  if (activeTab === 'profile') {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigateTo('dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#173D72] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-[#173D72] text-white flex items-center justify-center text-2xl font-bold shadow-md">
              {currentUser?.name?.charAt(0) || 'S'}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-extrabold text-[#173D72]">{currentUser?.name}</h2>
              <div className="text-xs font-semibold text-gray-500 font-mono mt-0.5">
                USN: {currentUser?.usn || currentUser?.rollNumber}
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full mt-2 font-medium border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Official Student Profile
              </div>
            </div>
          </div>
        </div>

        {/* Official Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Official Academic Record
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-[#F5F7FA] rounded-lg border border-gray-200">
              <span className="text-gray-400 font-bold uppercase text-[10px]">Institution</span>
              <p className="font-bold text-gray-800 mt-0.5">{collegeSettings.collegeName}</p>
            </div>
            <div className="p-3 bg-[#F5F7FA] rounded-lg border border-gray-200">
              <span className="text-gray-400 font-bold uppercase text-[10px]">Degree / Programme</span>
              <p className="font-bold text-gray-800 mt-0.5">{currentUser?.degree || 'MCA'}</p>
            </div>
            <div className="p-3 bg-[#F5F7FA] rounded-lg border border-gray-200">
              <span className="text-gray-400 font-bold uppercase text-[10px]">Department</span>
              <p className="font-bold text-gray-800 mt-0.5">Department of Computer Applications</p>
            </div>
            <div className="p-3 bg-[#F5F7FA] rounded-lg border border-gray-200">
              <span className="text-gray-400 font-bold uppercase text-[10px]">Semester & Section</span>
              <p className="font-bold text-gray-800 mt-0.5">Semester {currentUser?.semester || 1} (Sec A)</p>
            </div>
            <div className="p-3 bg-[#F5F7FA] rounded-lg border border-gray-200">
              <span className="text-gray-400 font-bold uppercase text-[10px] flex items-center gap-1">
                <Mail className="w-3 h-3" /> Official College Email
              </span>
              <p className="font-bold text-gray-800 mt-0.5 font-mono">{currentUser?.email}</p>
            </div>
            <div className="p-3 bg-[#F5F7FA] rounded-lg border border-gray-200">
              <span className="text-gray-400 font-bold uppercase text-[10px] flex items-center gap-1">
                <Phone className="w-3 h-3" /> Verified Mobile Phone
              </span>
              <p className="font-bold text-gray-800 mt-0.5 font-mono">{currentUser?.phone || '+91 9876543210'}</p>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-[#173D72]" /> Change Password
          </h3>

          {passError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-bold text-red-700">
              {passError}
            </div>
          )}
          {passSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800">
              {passSuccess}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                required
                className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#173D72] focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  required
                  placeholder="Min 6 characters"
                  className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#173D72] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  required
                  placeholder="Re-enter password"
                  className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#173D72] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-[#173D72] text-white text-xs font-bold py-2 px-4 rounded-lg hover:bg-[#122e56] transition-colors"
            >
              Update Password
            </button>
          </form>
        </div>

        {/* Logout */}
        <div className="flex justify-end">
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-300 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out of ClassConnect
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // DEFAULT VIEW: HOME DASHBOARD (Uniclare-pattern Connected Cards)
  // =========================================================================
  const homeFeatureCards = [
    {
      id: 'today-classes',
      title: "Today's Classes",
      desc: `${todaySessions.length} sessions scheduled today`,
      icon: Clock,
      color: 'bg-blue-50 text-[#173D72]',
    },
    {
      id: 'weekly-timetable',
      title: 'Weekly Timetable',
      desc: 'Mon - Sat period matrix & schedule',
      icon: Calendar,
      color: 'bg-indigo-50 text-indigo-700',
    },
    {
      id: 'attendance',
      title: 'Attendance',
      desc: `${attendanceSummary.percentage}% overall • Date-wise & Summary`,
      icon: CheckSquare,
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      id: 'class-schedule',
      title: 'Class Schedule',
      desc: 'Dated sessions and status logs',
      icon: ClipboardList,
      color: 'bg-cyan-50 text-cyan-700',
    },
    {
      id: 'academic',
      title: 'Academic & Semester',
      desc: 'MCA Sem 1 • 24 credits • Passing rules',
      icon: Award,
      color: 'bg-amber-50 text-amber-700',
    },
    {
      id: 'documents',
      title: 'Old Question Papers',
      desc: '4-level filter: Dept, Sem, Year, Subject',
      icon: FileText,
      color: 'bg-rose-50 text-rose-700',
    },
    {
      id: 'study-materials',
      title: 'Study Materials',
      desc: 'Lecture notes, presentations & slides',
      icon: FolderOpen,
      color: 'bg-purple-50 text-purple-700',
    },
    {
      id: 'announcements',
      title: 'Announcements',
      desc: `${announcements.length} faculty advisories & updates`,
      icon: Megaphone,
      color: 'bg-sky-50 text-sky-700',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Student Welcome Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-[#173D72] uppercase tracking-wider">
            Student Portal • {collegeSettings.collegeName}
          </span>
          <h1 className="text-xl font-bold text-[#202938] mt-0.5">
            Welcome back, {currentUser?.name}!
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            USN: <strong>{currentUser?.usn || currentUser?.rollNumber}</strong> • {currentUser?.degree || 'MCA'} Semester {currentUser?.semester || 1} (Sec A) • Dept of Computer Applications
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#F5F7FA] px-3.5 py-2 rounded-lg border border-gray-200 text-xs">
          <Calendar className="w-4 h-4 text-[#173D72]" />
          <div>
            <div className="font-semibold text-gray-800">Academic Year 2026 - 2027</div>
            <div className="text-[11px] text-gray-500">Odd Semester • Section A</div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* CONNECTED NAVIGATION CARDS (Uniclare Navigation Model)         */}
      {/* ============================================================== */}
      <div>
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
          Academic Features & Navigation
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {homeFeatureCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => navigateTo(card.id)}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs hover:border-[#173D72] hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className={`w-9 h-9 rounded-lg ${card.color} flex items-center justify-center mb-2.5 transition-transform group-hover:scale-105`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#202938] group-hover:text-[#173D72] transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-tight">
                    {card.desc}
                  </p>
                </div>
                <div className="mt-3 text-[10px] font-bold text-[#173D72] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Open →
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* LIVE TODAY'S CLASSES PREVIEW                                   */}
      {/* ============================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#173D72]" />
            <h2 className="text-sm font-bold text-[#202938]">Today's Scheduled Classes</h2>
          </div>
          <button
            onClick={() => navigateTo('today-classes')}
            className="text-xs font-bold text-[#173D72] hover:underline"
          >
            View All ({todaySessions.length}) →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {todaySessions.map((session) => {
            const sub = getSubject(session.subjectId);
            const prof = getProfessor(session.professorId);

            return (
              <div
                key={session.sessionId}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-[#202938]">{sub?.name}</h3>
                      <span className="text-xs text-gray-500 font-mono">{sub?.code}</span>
                    </div>
                    {getStatusBadge(session.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-[#173D72]" />
                      <span>{session.startTime} - {session.endTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{session.room}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                    <span>Prof: <strong>{prof?.name || 'Faculty'}</strong></span>
                  </div>
                  {session.version > 1 && (
                    <span className="text-[10px] bg-blue-50 text-[#173D72] px-2 py-0.5 rounded font-medium">
                      Rescheduled (v{session.version})
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* LIVE ATTENDANCE SNAPSHOT                                       */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#173D72]" />
              <h2 className="text-sm font-bold text-[#202938]">MY ATTENDANCE SNAPSHOT</h2>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-[#173D72]">
                {attendanceSummary.percentage}%
              </span>
              <span className="text-xs text-gray-500 font-semibold">
                ({attendanceSummary.totalAttended} attended / {attendanceSummary.totalHeld} held sessions)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateTo('attendance')}
              className="text-xs font-bold text-[#173D72] hover:underline"
            >
              Open Attendance Hub →
            </button>
          </div>
        </div>

        <div className="w-full bg-gray-100 rounded-full h-2.5 mt-3 overflow-hidden">
          <div
            className={`h-full rounded-full ${
              getPercentageColorClasses(attendanceSummary.statusColor).bg
            }`}
            style={{ width: `${Math.min(100, attendanceSummary.percentage)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
