import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { TimetableGrid } from '../timetable/TimetableGrid';
import { MarkAttendanceModal } from './MarkAttendanceModal';
import { RescheduleClassModal } from './RescheduleClassModal';
import { ClassStatusModal } from './ClassStatusModal';
import { ProfessorAnnouncementsModal } from './ProfessorAnnouncementsModal';
import {
  Clock,
  MapPin,
  CheckSquare,
  History,
  Calendar,
  BookOpen,
  Users,
  Megaphone,
  PlusCircle,
  ArrowLeft,
  Lock,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import type { ClassSession } from '../../types';

interface ProfessorDashboardProps {
  activeTab: string;
  onNavigate?: (tab: string) => void;
}

export const ProfessorDashboard: React.FC<ProfessorDashboardProps> = ({ activeTab, onNavigate }) => {
  const { currentUser, logout, changePassword } = useAuth();
  const professorId = currentUser?.userId || 'user_prof_sharma';

  const navigateTo = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  const [, setRefreshTrigger] = useState(0);
  const [selectedSessionForAttendance, setSelectedSessionForAttendance] = useState<string | null>(null);
  const [sessionToReschedule, setSessionToReschedule] = useState<ClassSession | null>(null);
  const [sessionToChangeStatus, setSessionToChangeStatus] = useState<ClassSession | null>(null);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);

  // Queries
  const allSessions = dataService.getSessions();
  const professorSessions = allSessions.filter((s) => s.professorId === professorId);
  const todaySessions = dataService.getTodaySessions().filter((s) => s.professorId === professorId);
  const assignedSubjects = dataService.getSubjects().filter((s) => s.professorId === professorId);
  const announcements = dataService.getAnnouncements().filter((a) => a.professorId === professorId);
  const departments = dataService.getDepartments();

  const dept = departments.find((d) => d.departmentId === currentUser?.departmentId);

  const reloadData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const getStatusBadge = (status: 'ON' | 'CANCELLED' | 'POSTPONED') => {
    switch (status) {
      case 'ON':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
            ON
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800">
            CANCELLED
          </span>
        );
      case 'POSTPONED':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
            POSTPONED
          </span>
        );
    }
  };

  // Classes Tab
  if (activeTab === 'classes') {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigateTo('dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#173D72] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Faculty Dashboard
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#173D72]">Today's Scheduled Lectures</h1>
            <p className="text-xs text-gray-500 mt-1">
              Your lectures for today with quick attendance and instant rescheduling options
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-[#173D72] border border-blue-200">
            {todaySessions.length} sessions assigned
          </span>
        </div>

        <div className="space-y-3.5">
          {todaySessions.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-xs text-gray-400">
              No classes scheduled for you today.
            </div>
          ) : (
            todaySessions.map((session) => {
              const sub = dataService.getSubjectById(session.subjectId);
              return (
                <div
                  key={session.sessionId}
                  className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-gray-900">{sub?.name}</h3>
                      <span className="text-xs text-gray-500 font-mono">({sub?.code})</span>
                      {getStatusBadge(session.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mt-2 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#173D72]" /> {session.startTime} - {session.endTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" /> {session.room}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setSelectedSessionForAttendance(session.sessionId)}
                      className="px-3.5 py-1.5 font-bold text-xs bg-[#173D72] text-white hover:bg-blue-900 rounded-lg flex items-center gap-1.5"
                    >
                      <CheckSquare className="w-3.5 h-3.5" /> Mark Attendance
                    </button>
                    <button
                      onClick={() => setSessionToReschedule(session)}
                      className="px-3 py-1.5 font-bold text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg flex items-center gap-1"
                    >
                      <History className="w-3.5 h-3.5" /> Reschedule
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // Profile Tab
  if (activeTab === 'profile') {
    const handleProfChangePassword = async (e: React.FormEvent) => {
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
          setPassSuccess('Password updated successfully!');
          setCurrentPass('');
          setNewPass('');
          setConfirmPass('');
        } else {
          setPassError('Current password is incorrect');
        }
      } catch {
        setPassError('Failed to change password. Verify your current password.');
      }
    };

    return (
      <div className="space-y-6">
        <button
          onClick={() => navigateTo('dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#173D72] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Faculty Dashboard
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-[#173D72] text-white flex items-center justify-center text-2xl font-bold shadow-md">
              {currentUser?.name?.charAt(0) || 'P'}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-extrabold text-[#173D72]">{currentUser?.name}</h2>
              <div className="text-xs font-semibold text-gray-500 font-mono mt-0.5">
                Faculty ID: {currentUser?.userId}
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full mt-2 font-medium border border-blue-200">
                <ShieldCheck className="w-3.5 h-3.5" /> Department Faculty Member
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Faculty Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-[#F5F7FA] rounded-lg border border-gray-200">
              <span className="text-gray-400 font-bold uppercase text-[10px]">Department</span>
              <p className="font-bold text-gray-800 mt-0.5">Department of Computer Applications (MCA)</p>
            </div>
            <div className="p-3 bg-[#F5F7FA] rounded-lg border border-gray-200">
              <span className="text-gray-400 font-bold uppercase text-[10px]">Official College Email</span>
              <p className="font-bold text-gray-800 mt-0.5 font-mono">{currentUser?.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-[#173D72]" /> Change Password
          </h3>
          {passError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-bold text-red-700">{passError}</div>}
          {passSuccess && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800">{passSuccess}</div>}

          <form onSubmit={handleProfChangePassword} className="space-y-3 text-xs">
            <div>
              <label className="block text-gray-600 font-bold mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#173D72] focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-600 font-bold mb-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#173D72] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-600 font-bold mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#173D72] focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              className="bg-[#173D72] text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-900 transition-colors"
            >
              Update Password
            </button>
          </form>
        </div>

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

  // Timetable view
  if (activeTab === 'timetable') {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigateTo('dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#173D72] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Faculty Dashboard
        </button>

        <div>
          <h1 className="text-xl font-bold text-[#173D72]">Faculty Timetable Matrix</h1>
          <p className="text-xs text-gray-500 mt-1">
            Department of Computer Applications • MCA Odd Semester 2026 - 2027 (Sec A)
          </p>
        </div>

        <TimetableGrid
          onSlotClick={(slot) => {
            if (slot.professorId === professorId) {
              const session = professorSessions.find((s) => s.dayOfWeek === slot.dayOfWeek);
              if (session) setSessionToReschedule(session);
            }
          }}
        />
      </div>
    );
  }

  // Reschedule tab
  if (activeTab === 'reschedule') {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigateTo('dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#173D72] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Faculty Dashboard
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#173D72]">Instant Rescheduling Hub</h1>
            <p className="text-xs text-gray-500 mt-1">
              Policy: instant-log. Reschedule your lectures instantly without waiting for admin approval.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <h2 className="text-sm font-bold text-[#202938] mb-3">Your Upcoming Assigned Sessions</h2>
          <div className="divide-y divide-gray-100">
            {professorSessions.map((session) => {
              const sub = dataService.getSubjectById(session.subjectId);
              return (
                <div key={session.sessionId} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-[#202938]">{sub?.name}</div>
                    <div className="text-gray-500 font-mono mt-0.5">
                      {session.date} • {session.startTime} - {session.endTime} • {session.room}
                    </div>
                    {session.rescheduleReason && (
                      <div className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded mt-1 text-[11px] font-medium">
                        Last change: {session.rescheduleReason} (v{session.version})
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSessionToReschedule(session)}
                    className="px-3.5 py-1.5 font-bold bg-[#173D72] text-white hover:bg-blue-900 rounded-lg shrink-0 flex items-center gap-1.5"
                  >
                    <History className="w-3.5 h-3.5" /> Reschedule Session
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {sessionToReschedule && (
          <RescheduleClassModal
            isOpen={Boolean(sessionToReschedule)}
            onClose={() => setSessionToReschedule(null)}
            professorId={professorId}
            session={sessionToReschedule}
            onSuccess={reloadData}
          />
        )}
      </div>
    );
  }

  // Attendance tab
  if (activeTab === 'attendance') {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigateTo('dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#173D72] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Faculty Dashboard
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#173D72]">Submit Class Attendance</h1>
            <p className="text-xs text-gray-500 mt-1">
              Select one of your assigned subject sessions to take or modify attendance.
            </p>
          </div>
          <button
            onClick={() => setSelectedSessionForAttendance(professorSessions[0]?.sessionId || '')}
            className="px-4 py-2 font-bold text-xs bg-[#173D72] text-white hover:bg-blue-900 rounded-lg flex items-center gap-2"
          >
            <CheckSquare className="w-4 h-4" /> Open Attendance Sheet
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <h2 className="text-sm font-bold text-[#202938] mb-3">Today & Recent Assigned Sessions</h2>
          <div className="space-y-3">
            {professorSessions.slice(0, 6).map((session) => {
              const sub = dataService.getSubjectById(session.subjectId);
              const records = dataService.getAttendanceForSession(session.sessionId);
              const presents = records.filter((r) => r.status === 'PRESENT').length;
              const absents = records.filter((r) => r.status === 'ABSENT').length;

              return (
                <div
                  key={session.sessionId}
                  className="p-3.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-[#173D72] text-sm">{sub?.name}</span>
                    <div className="text-gray-500 mt-0.5 font-mono">
                      {session.date} • {session.startTime} - {session.endTime} • {session.room}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1">
                      Attendance: <strong>{records.length} records</strong> ({presents} present, {absents} absent)
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedSessionForAttendance(session.sessionId)}
                    className="px-3.5 py-1.5 font-bold bg-[#173D72] text-white hover:bg-blue-900 rounded-lg shrink-0 flex items-center gap-1.5"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>{records.length > 0 ? 'Edit Attendance' : 'Mark Attendance'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {selectedSessionForAttendance && (
          <MarkAttendanceModal
            isOpen={Boolean(selectedSessionForAttendance)}
            onClose={() => setSelectedSessionForAttendance(null)}
            professorId={professorId}
            preselectedSessionId={selectedSessionForAttendance}
            onSuccess={reloadData}
          />
        )}
      </div>
    );
  }

  // Announcements tab
  if (activeTab === 'announcements') {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigateTo('dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#173D72] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Faculty Dashboard
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#173D72]">Manage Announcements</h1>
            <p className="text-xs text-gray-500 mt-1">
              Broadcast notices directly to students enrolled in your subjects.
            </p>
          </div>
          <button
            onClick={() => setIsAnnouncementModalOpen(true)}
            className="px-4 py-2 font-bold text-xs bg-[#173D72] text-white hover:bg-blue-900 rounded-lg flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> New Announcement
          </button>
        </div>

        <div className="space-y-3">
          {announcements.map((ann) => (
            <div key={ann.announcementId} className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs text-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-bold text-[#173D72] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {ann.subjectName}
                  </span>
                  <h3 className="text-sm font-bold text-[#202938] mt-1.5">{ann.title}</h3>
                </div>
                <span className="text-gray-400">
                  {new Date(ann.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed mt-2">{ann.message}</p>
            </div>
          ))}
        </div>

        <ProfessorAnnouncementsModal
          isOpen={isAnnouncementModalOpen}
          onClose={() => setIsAnnouncementModalOpen(false)}
          professorId={professorId}
          onSuccess={reloadData}
        />
      </div>
    );
  }

  // --- DEFAULT DASHBOARD OVERVIEW ---
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-[#173D72] uppercase tracking-wider">
            Faculty Portal
          </span>
          <h1 className="text-xl font-bold text-[#202938] mt-0.5">
            Welcome, {currentUser?.name}!
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Department: <strong>{dept?.name || 'Academic Faculty'}</strong> • Fall 2026
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAnnouncementModalOpen(true)}
            className="px-3 py-2 text-xs font-bold text-[#173D72] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1.5"
          >
            <Megaphone className="w-3.5 h-3.5" /> Post Announcement
          </button>
        </div>
      </div>

      {/* Assigned Subjects Overview (Professors can see ONLY subjects assigned to them) */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#173D72]" />
            <h2 className="text-base font-bold text-[#202938]">Your Assigned Subjects</h2>
          </div>
          <span className="text-xs text-gray-500">
            {assignedSubjects.length} subjects authorized
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {assignedSubjects.map((sub) => {
            const enrolledStudents = dataService.getEnrolledStudentsForSubject(sub.subjectId);
            return (
              <div
                key={sub.subjectId}
                className="p-3.5 rounded-lg border border-blue-100 bg-blue-50/40 text-xs"
              >
                <div className="font-bold text-[#173D72] text-sm">{sub.name}</div>
                <div className="text-gray-500 font-mono mt-0.5">{sub.code} • {sub.defaultRoom}</div>
                <div className="mt-2 pt-2 border-t border-blue-200/60 flex items-center justify-between text-[11px] text-gray-600">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-700" />
                    <strong>{enrolledStudents.length}</strong> Enrolled Students
                  </span>
                  <span className="font-semibold text-emerald-700">Authorized</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Assigned Classes with Instant Actions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#173D72]" />
            <h2 className="text-base font-bold text-[#202938]">Today's Assigned Classes (Monday, Nov 2)</h2>
          </div>
          <span className="text-xs text-gray-500 font-medium">
            {todaySessions.length} sessions today
          </span>
        </div>

        {todaySessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            <p className="text-sm font-medium">No classes assigned for you today.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todaySessions.map((session) => {
              const sub = dataService.getSubjectById(session.subjectId);

              return (
                <div
                  key={session.sessionId}
                  className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs hover:border-gray-300 transition-all flex flex-col justify-between"
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
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{session.startTime} - {session.endTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{session.room}</span>
                      </div>
                    </div>
                  </div>

                  {/* Instant Action Toolbar */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setSelectedSessionForAttendance(session.sessionId)}
                      className="px-3 py-1.5 text-xs font-bold bg-[#173D72] hover:bg-blue-900 text-white rounded-md flex items-center gap-1.5 shadow-2xs"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Mark Attendance</span>
                    </button>

                    <button
                      onClick={() => setSessionToReschedule(session)}
                      className="px-3 py-1.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-md flex items-center gap-1.5"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Reschedule (instant-log)</span>
                    </button>

                    <button
                      onClick={() => setSessionToChangeStatus(session)}
                      className="px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 border border-gray-300 rounded-md"
                    >
                      Status
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedSessionForAttendance && (
        <MarkAttendanceModal
          isOpen={Boolean(selectedSessionForAttendance)}
          onClose={() => setSelectedSessionForAttendance(null)}
          professorId={professorId}
          preselectedSessionId={selectedSessionForAttendance}
          onSuccess={reloadData}
        />
      )}

      {sessionToReschedule && (
        <RescheduleClassModal
          isOpen={Boolean(sessionToReschedule)}
          onClose={() => setSessionToReschedule(null)}
          professorId={professorId}
          session={sessionToReschedule}
          onSuccess={reloadData}
        />
      )}

      {sessionToChangeStatus && (
        <ClassStatusModal
          isOpen={Boolean(sessionToChangeStatus)}
          onClose={() => setSessionToChangeStatus(null)}
          professorId={professorId}
          session={sessionToChangeStatus}
          onSuccess={reloadData}
        />
      )}

      <ProfessorAnnouncementsModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
        professorId={professorId}
        onSuccess={reloadData}
      />
    </div>
  );
};
