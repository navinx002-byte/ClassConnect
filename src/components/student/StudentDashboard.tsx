import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
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
} from 'lucide-react';

interface StudentDashboardProps {
  activeTab: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ activeTab }) => {
  const { currentUser } = useAuth();
  const studentId = currentUser?.userId || 'user_student_01';

  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');

  // Load summary and sessions
  const attendanceSummary = dataService.getAttendanceSummaryForStudent(studentId);
  const todaySessions = dataService.getTodaySessions();
  const allSessions = dataService.getSessions();
  const subjects = dataService.getSubjects();
  const users = dataService.getUsers();
  const announcements = dataService.getAnnouncements();
  const attendanceRecords = dataService.getAttendanceRecords().filter((r) => r.studentId === studentId);

  const getSubject = (id: string) => subjects.find((s) => s.subjectId === id);
  const getProfessor = (id: string) => users.find((u) => u.userId === id);

  const getStatusBadge = (status: 'ON' | 'CANCELLED' | 'POSTPONED') => {
    switch (status) {
      case 'ON':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> ON
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-red-600" /> CANCELLED
          </span>
        );
      case 'POSTPONED':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> POSTPONED
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

  // If viewing timetable tab
  if (activeTab === 'timetable') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[#173D72]">My Weekly Timetable</h1>
          <p className="text-xs text-gray-500 mt-1">
            Department of Computer Applications • MCA Semester I (Section A)
          </p>
        </div>

        <TimetableGrid />
      </div>
    );
  }

  // If viewing announcements tab
  if (activeTab === 'announcements') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[#173D72]">Faculty Announcements</h1>
          <p className="text-xs text-gray-500 mt-1">
            Important updates from professors regarding coursework, exams, and rescheduling.
          </p>
        </div>

        <div className="space-y-4">
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

  // If viewing attendance history tab
  if (activeTab === 'attendance') {
    const filteredRecords = attendanceRecords.filter((r) =>
      selectedSubjectFilter === 'ALL' ? true : r.subjectId === selectedSubjectFilter
    );

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#173D72]">Attendance Log & Absence History</h1>
            <p className="text-xs text-gray-500 mt-1">
              Detailed session-by-session records for Semester 5
            </p>
          </div>

          {/* Filter dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="text-xs bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#173D72]"
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

        {/* Records table */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7FA] border-b border-gray-200 text-gray-600 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-bold">Date & Time</th>
                  <th className="py-3 px-4 font-bold">Subject</th>
                  <th className="py-3 px-4 font-bold">Professor</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      No attendance records found for this filter.
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
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              PRESENT
                            </span>
                          )}
                          {r.status === 'ABSENT' && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                              ABSENT
                            </span>
                          )}
                          {r.status === 'LATE' && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                              LATE
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

  // --- DEFAULT HOME VIEW (Dashboard) ---
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-[#173D72] uppercase tracking-wider">
            Student Portal
          </span>
          <h1 className="text-xl font-bold text-[#202938] mt-0.5">
            Welcome back, {currentUser?.name}!
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Roll No: <strong>{currentUser?.rollNumber}</strong> • Semester 5 • Computer Science & Engineering
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#F5F7FA] px-3.5 py-2 rounded-lg border border-gray-200 text-xs">
          <Calendar className="w-4 h-4 text-[#173D72]" />
          <div>
            <div className="font-semibold text-gray-800">Monday, November 2, 2026</div>
            <div className="text-[11px] text-gray-500">College Academic Day 42</div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* FIRST SECTION: TODAY'S CLASSES                                 */}
      {/* ============================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#173D72]" />
            <h2 className="text-base font-bold text-[#202938]">Today's Scheduled Classes</h2>
          </div>
          <span className="text-xs text-gray-500 font-medium">
            {todaySessions.length} sessions scheduled
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {todaySessions.map((session) => {
            const sub = getSubject(session.subjectId);
            const prof = getProfessor(session.professorId);

            return (
              <div
                key={session.sessionId}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs hover:border-gray-300 transition-all flex flex-col justify-between"
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
      {/* SECOND SECTION DIRECTLY BELOW: MY ATTENDANCE                   */}
      {/* ============================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#173D72]" />
              <h2 className="text-base font-bold text-[#202938]">MY ATTENDANCE</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Calculated from held finalized class sessions (Upcoming & cancelled excluded)
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> ≥ 75% Good
            </span>
            <span className="flex items-center gap-1 text-amber-700 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> 65-74% Warning
            </span>
            <span className="flex items-center gap-1 text-red-700 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> &lt; 65% Critical
            </span>
          </div>
        </div>

        {/* Overall Attendance Banner Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Overall Attendance Summary
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
                {attendanceSummary.totalHeld > 0
                  ? `Total recorded absences: ${attendanceSummary.totalAbsences} classes. Formula: (Attended Sessions / Finalized Sessions Held) × 100.`
                  : 'Attendance percentages will update automatically as professors mark your sessions.'}
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
                    <span>Eligible for Final Examinations</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Attendance Alert: Below Threshold</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Master Progress Bar */}
          <div className="w-full bg-gray-100 rounded-full h-3 mt-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                getPercentageColorClasses(attendanceSummary.statusColor).bg
              }`}
              style={{ width: `${Math.min(100, attendanceSummary.percentage)}%` }}
            />
          </div>
        </div>

        {/* Individual Subject Attendance Cards */}
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

                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-2 mt-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${colors.bg}`}
                    style={{ width: `${Math.min(100, sub.percentage)}%` }}
                  />
                </div>

                {/* Consecutive classes needed / status callout */}
                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    Absences: <strong>{sub.absences}</strong>
                  </span>

                  {sub.consecutiveNeeded > 0 ? (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      Need {sub.consecutiveNeeded} consecutive classes to reach 75%
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
};
