import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { dataService } from '../../services/dataService';
import { TimetableGrid } from '../timetable/TimetableGrid';
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  History,
  Bell,
  PlusCircle,
  CheckCircle2,
  XCircle,
  UploadCloud,
  Search,
  Filter,
} from 'lucide-react';
import type { TimetableSlot, DayOfWeek } from '../../types';

interface AdminDashboardProps {
  activeTab: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab }) => {
  const { currentUser } = useAuth();
  const { triggerPhoneNotification } = useNotifications();
  const [, setRefreshTrigger] = useState(0);

  // Search & filter states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [attendanceSubjectFilter, setAttendanceSubjectFilter] = useState<string>('ALL');

  // New User Form State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'STUDENT' | 'PROFESSOR'>('STUDENT');
  const [newUserDept, setNewUserDept] = useState('dept_cse');
  const [newUserRoll, setNewUserRoll] = useState('');

  // New Subject Form State
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newSubjectProf, setNewSubjectProf] = useState('');
  const [newSubjectRoom, setNewSubjectRoom] = useState('');

  // Edit Timetable Slot State
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);

  // File upload state for timetable
  const [timetableUploadError, setTimetableUploadError] = useState<string | null>(null);
  const [timetableUploadSuccess, setTimetableUploadSuccess] = useState<string | null>(null);
  const [isAddSlotModalOpen, setIsAddSlotModalOpen] = useState(false);
  const [newSlotDay, setNewSlotDay] = useState<DayOfWeek>('MONDAY');
  const [newSlotPeriod, setNewSlotPeriod] = useState(1);
  const [newSlotStart, setNewSlotStart] = useState('09:00');
  const [newSlotEnd, setNewSlotEnd] = useState('10:00');
  const [newSlotSubject, setNewSlotSubject] = useState('');
  const [newSlotRoom, setNewSlotRoom] = useState('');

  // Handle Manual Add Slot
  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newSlotSubject) return;

    const sub = subjects.find((s) => s.subjectId === newSlotSubject);
    dataService.addTimetableSlot(currentUser.userId, activeTimetable.timetableId, {
      dayOfWeek: newSlotDay,
      periodNumber: Number(newSlotPeriod),
      startTime: newSlotStart,
      endTime: newSlotEnd,
      subjectId: newSlotSubject,
      professorId: sub?.professorId || professors[0]?.userId || '',
      room: newSlotRoom || sub?.defaultRoom || 'Room 101',
    });

    setIsAddSlotModalOpen(false);
    reload();
  };

  // Handle Timetable Document / File Upload from Windows File Explorer (PDF, Excel, Images, CSV, etc.)
  const handleTimetableFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setTimetableUploadError(null);
    setTimetableUploadSuccess(null);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const formattedSize = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`;

    // 1. Read file as Data URL so it can be previewed/downloaded directly
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const dataUrl = event.target?.result as string;

        // Save uploaded document in college documents
        dataService.saveTimetableDocument({
          originalName: file.name,
          fileType: ext.toUpperCase(),
          fileDataUrl: dataUrl,
          fileSizeFormatted: formattedSize,
        });

        // 2. If it's a JSON file, also parse timetable slots
        if (ext === 'json') {
          try {
            // Re-read text to parse JSON slots
            const textContent = atob(dataUrl.split(',')[1] || '');
            const parsed = JSON.parse(textContent);
            const slotsArray = Array.isArray(parsed) ? parsed : parsed.weeklySchedule || parsed.slots;
            if (Array.isArray(slotsArray) && slotsArray.length > 0) {
              dataService.importTimetableSlots(currentUser.userId, activeTimetable.timetableId, slotsArray);
            }
          } catch {
            // Ignore parse errors if pure document
          }
        }

        setTimetableUploadSuccess(`Official timetable document "${file.name}" (${formattedSize}) uploaded successfully! Available to students and faculty.`);
        reload();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setTimetableUploadError(`File upload error: ${msg}`);
      }
    };

    reader.readAsDataURL(file);
    // Reset file input value so user can upload again
    e.target.value = '';
  };

  // Database Full Export
  const handleExportDatabase = () => {
    const jsonStr = dataService.exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `classconnect-database-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Database Full Import
  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const res = dataService.importDatabaseJSON(text);
      if (res.success) {
        alert('Database imported successfully!');
        window.location.reload();
      } else {
        alert(res.message);
      }
    };
    reader.readAsText(file);
  };

  // Settings State
  const collegeSettings = dataService.getSettings();
  const [minThreshold, setMinThreshold] = useState(collegeSettings.minAttendanceThreshold);
  const [warningThreshold, setWarningThreshold] = useState(collegeSettings.warningAttendanceThreshold);
  const [timezone, setTimezone] = useState(collegeSettings.timezone);

  // Data queries
  const users = dataService.getUsers();
  const subjects = dataService.getSubjects();
  const departments = dataService.getDepartments();
  const changeLogs = dataService.getChangeLogs();
  const todaySessions = dataService.getTodaySessions();
  const attendanceRecords = dataService.getAttendanceRecords();
  const allNotifications = dataService.getAllNotificationsForAdmin();
  const timetables = dataService.getTimetables();
  const activeTimetable = timetables[0];

  const students = users.filter((u) => u.role === 'STUDENT');
  const professors = users.filter((u) => u.role === 'PROFESSOR');

  const reload = () => setRefreshTrigger((p) => p + 1);

  // Handle User Toggle Active
  const handleToggleActive = (userId: string, current: boolean) => {
    dataService.updateUser(userId, { active: !current });
    reload();
  };

  // Handle Add User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    dataService.createUser({
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      departmentId: newUserDept,
      studentGroupId: newUserRole === 'STUDENT' ? 'grp_cse_5a' : undefined,
      rollNumber: newUserRole === 'STUDENT' ? newUserRoll || `CSE-2026-${Math.floor(Math.random() * 80 + 20)}` : undefined,
      active: true,
    });

    setIsAddUserOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserRoll('');
    reload();
  };

  // Handle Create Subject
  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim() || !newSubjectCode.trim()) return;

    dataService.createSubject({
      name: newSubjectName,
      code: newSubjectCode,
      departmentId: 'dept_cse',
      professorId: newSubjectProf || professors[0]?.userId || '',
      defaultRoom: newSubjectRoom || 'Room 301',
    });

    setIsAddSubjectOpen(false);
    setNewSubjectName('');
    setNewSubjectCode('');
    setNewSubjectRoom('');
    reload();
  };

  // Handle Publish Timetable
  const handlePublishTimetable = () => {
    if (!currentUser) return;
    const newVersion = (activeTimetable.version || 1) + 1;
    dataService.publishPermanentTimetable(currentUser.userId, activeTimetable.timetableId);

    // Automatically generate real class sessions for students & professors
    dataService.generateWeeklySessionsFromTimetable();

    // Trigger Phone Push Notification
    triggerPhoneNotification(
      `📅 MCA Timetable Published (Version ${newVersion})`,
      'The Department of Computer Applications MCA timetable is now active. Enrolled students and faculty have been notified.'
    );

    setTimetableUploadSuccess(
      `Timetable Published to Version ${newVersion}! Sessions generated and notifications broadcasted to student & faculty devices.`
    );
    reload();
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    dataService.updateSettings({
      minAttendanceThreshold: Number(minThreshold),
      warningAttendanceThreshold: Number(warningThreshold),
      timezone,
    });
    alert('College system settings updated successfully.');
    reload();
  };

  // Save Timetable Slot
  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !editingSlot) return;

    dataService.updateTimetableSlot(
      currentUser.userId,
      activeTimetable.timetableId,
      editingSlot.id,
      editingSlot
    );
    setEditingSlot(null);
    reload();
  };

  // ==========================================
  // TAB 1: USERS DIRECTORY
  // ==========================================
  if (activeTab === 'users') {
    const filteredUsers = users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.rollNumber && u.rollNumber.toLowerCase().includes(userSearch.toLowerCase()));
      const matchRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
      return matchSearch && matchRole;
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#173D72]">College User Directory</h1>
            <p className="text-xs text-gray-500 mt-1">
              Manage student enrollments, faculty appointments, and active account credentials.
            </p>
          </div>
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="px-4 py-2 text-xs font-bold bg-[#173D72] text-white hover:bg-blue-900 rounded-lg flex items-center gap-2 shadow-xs"
          >
            <PlusCircle className="w-4 h-4" /> Add User Account
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by name, email, or roll number..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#173D72]"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto text-xs">
            <span className="text-gray-500 text-xs whitespace-nowrap">Role:</span>
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-2.5 py-2 text-xs bg-white"
            >
              <option value="ALL">All Roles ({users.length})</option>
              <option value="STUDENT">Students ({students.length})</option>
              <option value="PROFESSOR">Professors ({professors.length})</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7FA] border-b border-gray-200 text-gray-600 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-bold">User</th>
                  <th className="py-3 px-4 font-bold">Role</th>
                  <th className="py-3 px-4 font-bold">Department / Group</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((u) => {
                  const dept = departments.find((d) => d.departmentId === u.departmentId);

                  return (
                    <tr key={u.userId} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#202938]">{u.name}</div>
                        <div className="text-[11px] text-gray-500 font-mono">{u.email}</div>
                        {u.rollNumber && (
                          <div className="text-[10px] text-gray-400 font-mono">{u.rollNumber}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === 'ADMIN'
                              ? 'bg-red-100 text-red-800'
                              : u.role === 'PROFESSOR'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <div>{dept?.name || 'General'}</div>
                        {u.studentGroupId && (
                          <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">
                            {u.studentGroupId}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {u.active ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-800 flex items-center gap-1 w-max">
                            <XCircle className="w-3 h-3 text-red-600" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleActive(u.userId, u.active)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors ${
                            u.active
                              ? 'border-red-300 text-red-700 hover:bg-red-50'
                              : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {u.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add User Modal */}
        {isAddUserOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <h3 className="text-base font-bold text-[#173D72]">Create College Account</h3>
                <button
                  onClick={() => setIsAddUserOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="mt-4 space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="e.g. Divya Sharma"
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">College Email</label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="e.g. divya.s@classconnect.edu"
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Role</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as 'STUDENT' | 'PROFESSOR')}
                      className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="STUDENT">STUDENT</option>
                      <option value="PROFESSOR">PROFESSOR</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Department</label>
                    <select
                      value={newUserDept}
                      onChange={(e) => setNewUserDept(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                    >
                      {departments.map((d) => (
                        <option key={d.departmentId} value={d.departmentId}>
                          {d.code} - {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {newUserRole === 'STUDENT' && (
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Roll Number</label>
                    <input
                      type="text"
                      value={newUserRoll}
                      onChange={(e) => setNewUserRoll(e.target.value)}
                      placeholder="e.g. CSE-2026-30"
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                )}

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsAddUserOpen(false)}
                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 font-bold bg-[#173D72] text-white hover:bg-blue-900 rounded-lg"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // TAB 2: SUBJECTS & PROFESSOR ASSIGNMENTS
  // ==========================================
  if (activeTab === 'subjects') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#173D72]">Subject & Professor Allocations</h1>
            <p className="text-xs text-gray-500 mt-1">
              Configure course offerings, faculty assignments, and designated lecture rooms.
            </p>
          </div>
          <button
            onClick={() => setIsAddSubjectOpen(true)}
            className="px-4 py-2 text-xs font-bold bg-[#173D72] text-white hover:bg-blue-900 rounded-lg flex items-center gap-2 shadow-xs"
          >
            <PlusCircle className="w-4 h-4" /> Add Subject
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map((sub) => {
            const prof = users.find((u) => u.userId === sub.professorId);
            const dept = departments.find((d) => d.departmentId === sub.departmentId);
            const enrolled = dataService.getEnrolledStudentsForSubject(sub.subjectId);

            return (
              <div
                key={sub.subjectId}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-[#202938]">{sub.name}</h3>
                      <span className="text-xs font-mono text-[#173D72] font-semibold">
                        {sub.code} • {dept?.name}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                      {sub.defaultRoom}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-2 text-xs text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>Assigned Professor:</span>
                      <strong className="text-gray-900">{prof?.name || 'Unassigned'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Enrolled Students:</span>
                      <strong>{enrolled.length} active students</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span className="font-mono text-[11px]">ID: {sub.subjectId}</span>
                  <span className="text-emerald-700 font-semibold">Live in Curriculum</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Subject Modal */}
        {isAddSubjectOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <h3 className="text-base font-bold text-[#173D72]">Create New Subject</h3>
                <button
                  onClick={() => setIsAddSubjectOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubject} className="mt-4 space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Subject Title</label>
                  <input
                    type="text"
                    required
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="e.g. Operating Systems & Architecture"
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Course Code</label>
                    <input
                      type="text"
                      required
                      value={newSubjectCode}
                      onChange={(e) => setNewSubjectCode(e.target.value)}
                      placeholder="e.g. CS-306"
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Classroom</label>
                    <input
                      type="text"
                      value={newSubjectRoom}
                      onChange={(e) => setNewSubjectRoom(e.target.value)}
                      placeholder="e.g. Room 303"
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Assigned Faculty</label>
                  <select
                    value={newSubjectProf}
                    onChange={(e) => setNewSubjectProf(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                  >
                    {professors.map((p) => (
                      <option key={p.userId} value={p.userId}>
                        {p.name} ({p.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsAddSubjectOpen(false)}
                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 font-bold bg-[#173D72] text-white hover:bg-blue-900 rounded-lg"
                  >
                    Save Subject
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // TAB 3: PERMANENT TIMETABLE MANAGER
  // ==========================================
  if (activeTab === 'timetable') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#173D72]">Department of Computer Applications (MCA) — Timetable Manager</h1>
            <p className="text-xs text-gray-500 mt-1">
              Upload your official college timetable document (Photo, PDF, Excel) or manage slots. Click <strong>"Publish Timetable"</strong> to activate classes and notify student phones.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <label className="cursor-pointer px-3.5 py-2 text-xs font-bold bg-[#173D72] hover:bg-blue-900 text-white rounded-lg flex items-center gap-1.5 shadow-xs">
              <UploadCloud className="w-4 h-4" />
              <span>Upload Timetable File (Photo / PDF / Excel)</span>
              <input
                type="file"
                accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.docx"
                onChange={handleTimetableFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={() => setIsAddSlotModalOpen(true)}
              className="px-3 py-2 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-[#173D72] border border-blue-200 rounded-lg flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" /> Add Period Slot
            </button>

            <button
              onClick={handlePublishTimetable}
              className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 shadow-xs"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Publish Timetable</span>
            </button>
          </div>
        </div>

        {timetableUploadSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{timetableUploadSuccess}</span>
          </div>
        )}

        {timetableUploadError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <span>{timetableUploadError}</span>
          </div>
        )}

        <TimetableGrid
          showAdminControls={true}
          onSlotClick={(slot) => setEditingSlot({ ...slot })}
        />

        {/* Modal: Add Slot Manually */}
        {isAddSlotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <h3 className="text-base font-bold text-[#173D72]">Add New Timetable Period</h3>
                <button
                  onClick={() => setIsAddSlotModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSlot} className="mt-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Working Day</label>
                    <select
                      value={newSlotDay}
                      onChange={(e) => setNewSlotDay(e.target.value as DayOfWeek)}
                      className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                    >
                      {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Period Number</label>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={newSlotPeriod}
                      onChange={(e) => setNewSlotPeriod(Number(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={newSlotStart}
                      onChange={(e) => setNewSlotStart(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={newSlotEnd}
                      onChange={(e) => setNewSlotEnd(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Subject</label>
                  {subjects.length === 0 ? (
                    <div className="text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                      No subjects created yet! Please create a subject in the "Subjects & Faculty" tab first.
                    </div>
                  ) : (
                    <select
                      value={newSlotSubject}
                      onChange={(e) => setNewSlotSubject(e.target.value)}
                      required
                      className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="">-- Choose Subject --</option>
                      {subjects.map((s) => (
                        <option key={s.subjectId} value={s.subjectId}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Room / Hall</label>
                  <input
                    type="text"
                    value={newSlotRoom}
                    onChange={(e) => setNewSlotRoom(e.target.value)}
                    placeholder="e.g. Room 301 or Lab 2"
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsAddSlotModalOpen(false)}
                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={subjects.length === 0}
                    className="px-4 py-2 font-bold bg-[#173D72] text-white hover:bg-blue-900 rounded-lg disabled:opacity-50"
                  >
                    Add Period to Timetable
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Slot Modal */}
        {editingSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <h3 className="text-base font-bold text-[#173D72]">
                  Edit Slot: {editingSlot.dayOfWeek} (Period {editingSlot.periodNumber})
                </h3>
                <button
                  onClick={() => setEditingSlot(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSlot} className="mt-4 space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Subject</label>
                  <select
                    value={editingSlot.subjectId}
                    onChange={(e) => {
                      const selectedSub = subjects.find((s) => s.subjectId === e.target.value);
                      setEditingSlot({
                        ...editingSlot,
                        subjectId: e.target.value,
                        professorId: selectedSub?.professorId || editingSlot.professorId,
                        room: selectedSub?.defaultRoom || editingSlot.room,
                      });
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                  >
                    {subjects.map((s) => (
                      <option key={s.subjectId} value={s.subjectId}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={editingSlot.startTime}
                      onChange={(e) => setEditingSlot({ ...editingSlot, startTime: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={editingSlot.endTime}
                      onChange={(e) => setEditingSlot({ ...editingSlot, endTime: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Assigned Classroom</label>
                  <input
                    type="text"
                    value={editingSlot.room}
                    onChange={(e) => setEditingSlot({ ...editingSlot, room: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setEditingSlot(null)}
                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 font-bold bg-[#173D72] text-white hover:bg-blue-900 rounded-lg"
                  >
                    Save Slot Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // TAB 4: PROFESSOR CHANGE MONITORING (AUDIT LOGS)
  // ==========================================
  if (activeTab === 'changelogs') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[#173D72]">Professor Change Monitoring (Audit Trail)</h1>
          <p className="text-xs text-gray-500 mt-1">
            Immutable log of all instant-log rescheduling actions executed by professors.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7FA] border-b border-gray-200 text-gray-600 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-bold">Professor & Subject</th>
                  <th className="py-3 px-4 font-bold">Old Schedule & Venue</th>
                  <th className="py-3 px-4 font-bold">New Schedule & Venue</th>
                  <th className="py-3 px-4 font-bold">Mandatory Reason</th>
                  <th className="py-3 px-4 font-bold">Timestamp & Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {changeLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      No professor rescheduling logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  changeLogs.map((log) => (
                    <tr key={log.changeId} className="hover:bg-gray-50/50">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#202938]">{log.professorName}</div>
                        <div className="text-[11px] text-[#173D72] font-semibold">{log.subjectName}</div>
                        <span className="text-[10px] text-gray-400 font-mono">v{log.sessionVersion}</span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        <div className="line-through text-red-700 font-mono">{log.oldDate}</div>
                        <div className="text-gray-500 font-mono">{log.oldTime}</div>
                        <div className="text-[11px] text-gray-500">{log.oldRoom}</div>
                      </td>
                      <td className="py-3.5 px-4 text-emerald-800 font-semibold">
                        <div className="font-mono text-emerald-700">{log.newDate}</div>
                        <div className="font-mono">{log.newTime}</div>
                        <div className="text-[11px] text-emerald-800">{log.newRoom}</div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-700 max-w-xs leading-relaxed">
                        {log.reason}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-[11px] text-gray-500">
                          {new Date(log.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {log.notificationDeliveryStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // TAB 5: ATTENDANCE OVERVIEW
  // ==========================================
  if (activeTab === 'attendance') {
    const filteredSubjects = subjects.filter((s) =>
      attendanceSubjectFilter === 'ALL' ? true : s.subjectId === attendanceSubjectFilter
    );

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#173D72]">College Attendance Audit & Analytics</h1>
            <p className="text-xs text-gray-500 mt-1">
              Review attendance records across all students, professors, and subject offerings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={attendanceSubjectFilter}
              onChange={(e) => setAttendanceSubjectFilter(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
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

        {/* Subject-Wise Attendance Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSubjects.map((sub) => {
            const prof = users.find((u) => u.userId === sub.professorId);
            const subRecords = attendanceRecords.filter((r) => r.subjectId === sub.subjectId);
            const presents = subRecords.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
            const absents = subRecords.filter((r) => r.status === 'ABSENT').length;
            const total = subRecords.length;
            const pct = total > 0 ? Math.round((presents / total) * 100) : 100;

            return (
              <div key={sub.subjectId} className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#202938]">{sub.name}</h3>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">
                      {sub.code} • Prof: {prof?.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-[#173D72]">{pct}%</span>
                    <div className="text-[11px] text-gray-500 font-semibold">Average Attendance</div>
                  </div>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-2.5 mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      pct >= collegeSettings.minAttendanceThreshold
                        ? 'bg-emerald-500'
                        : pct >= collegeSettings.warningAttendanceThreshold
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                  <span>Presents: <strong>{presents}</strong></span>
                  <span>Absences: <strong>{absents}</strong></span>
                  <span>Total Marked: <strong>{total}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================
  // TAB 6: SETTINGS
  // ==========================================
  if (activeTab === 'settings') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[#173D72]">College Institutional Settings</h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure institutional attendance policy parameters, college timezone, and reminder defaults.
          </p>
        </div>

        <form onSubmit={handleSaveSettings} className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs max-w-xl space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Minimum Attendance Threshold (Eligible for Exams)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="50"
                max="95"
                value={minThreshold}
                onChange={(e) => setMinThreshold(Number(e.target.value))}
                className="w-28 p-2 border border-gray-300 rounded-lg text-sm font-bold text-[#173D72]"
              />
              <span className="text-gray-500">% (Standard: 75%)</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Warning Attendance Threshold (Alert State)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="40"
                max="85"
                value={warningThreshold}
                onChange={(e) => setWarningThreshold(Number(e.target.value))}
                className="w-28 p-2 border border-gray-300 rounded-lg text-sm font-bold text-amber-700"
              />
              <span className="text-gray-500">% (Standard: 65%)</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">College Timezone</label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg font-mono"
            />
            <span className="text-[11px] text-gray-400">Default: Asia/Kolkata</span>
          </div>

          <div className="pt-3 border-t border-gray-200 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 font-bold bg-[#173D72] text-white hover:bg-blue-900 rounded-lg shadow-xs"
            >
              Save Configuration
            </button>
          </div>
        </form>

        {/* Database & Cloud Storage Center */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs max-w-xl space-y-4 text-xs">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-[#173D72] flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-[#173D72]" />
              Database & Cloud Storage Center
            </h2>
            <p className="text-gray-500 text-[11px] mt-0.5">
              Manage where and how your college data is stored and backed up.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Browser Local Storage (Active)
              </div>
              <p className="text-[11px] text-emerald-700 mt-1">
                All departments, users, timetables, and attendance are currently persisted locally on this device. Data remains intact even after closing the browser or restarting.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900">
              <div className="font-bold flex items-center gap-1.5">
                <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                Google Cloud Firestore (Cloud Sync Ready)
              </div>
              <p className="text-[11px] text-blue-700 mt-1">
                To sync all data directly to Google Cloud Firestore across multiple devices and mobile phones, add your Firebase keys in the <code>.env</code> file.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportDatabase}
              className="px-3.5 py-2 font-bold text-xs bg-[#173D72] text-white hover:bg-blue-900 rounded-lg flex items-center gap-1.5 shadow-2xs"
            >
              <UploadCloud className="w-3.5 h-3.5" /> Download Database Backup (.JSON)
            </button>

            <label className="cursor-pointer px-3.5 py-2 font-bold text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg flex items-center gap-1.5">
              <span>Restore from JSON File</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportDatabase}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // DEFAULT TAB: OVERVIEW
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-red-700 uppercase tracking-wider">
            Administrative Control Panel
          </span>
          <h1 className="text-xl font-bold text-[#202938] mt-0.5">
            Welcome, {currentUser?.name}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Institutional Dean & Head of Administration • Apex Institute of Technology
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePublishTimetable}
            className="px-3.5 py-2 text-xs font-bold bg-[#173D72] hover:bg-blue-900 text-white rounded-lg flex items-center gap-1.5 shadow-2xs"
          >
            <UploadCloud className="w-3.5 h-3.5" /> Publish Timetable
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total Students */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Total Students</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#173D72] mt-2">{students.length}</div>
          <span className="text-[11px] text-gray-500">Active enrollments</span>
        </div>

        {/* Total Professors */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Professors</span>
            <div className="p-2 bg-blue-50 text-[#173D72] rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#173D72] mt-2">{professors.length}</div>
          <span className="text-[11px] text-gray-500">Across 4 departments</span>
        </div>

        {/* Subjects & Departments */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Subjects</span>
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#173D72] mt-2">{subjects.length}</div>
          <span className="text-[11px] text-gray-500">{departments.length} departments</span>
        </div>

        {/* Today's Classes */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Today's Sessions</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#173D72] mt-2">{todaySessions.length}</div>
          <span className="text-[11px] text-gray-500">Monday, Nov 2</span>
        </div>
      </div>

      {/* Split Row: Recent Reschedule Events & Notifications Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Professor Rescheduling History */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-[#173D72]" />
              <h2 className="text-base font-bold text-[#202938]">Professor Rescheduling History</h2>
            </div>
            <span className="text-xs font-mono text-gray-500">{changeLogs.length} events</span>
          </div>

          <div className="space-y-3">
            {changeLogs.slice(0, 3).map((log) => (
              <div key={log.changeId} className="p-3 rounded-lg border border-gray-200 bg-gray-50/50 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-gray-900">{log.professorName}</strong>
                  <span className="text-[10px] text-gray-400 font-mono">v{log.sessionVersion}</span>
                </div>
                <div className="text-[#173D72] font-semibold mt-0.5">{log.subjectName}</div>
                <div className="mt-1 flex items-center gap-2 text-gray-600 font-mono text-[11px]">
                  <span className="line-through text-red-600">{log.oldDate} {log.oldTime}</span>
                  <span>→</span>
                  <span className="text-emerald-700 font-bold">{log.newDate} {log.newTime}</span>
                </div>
                <div className="text-gray-500 italic mt-1 text-[11px]">"{log.reason}"</div>
              </div>
            ))}
          </div>
        </div>

        {/* Notification Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#173D72]" />
              <h2 className="text-base font-bold text-[#202938]">Campus Notification Dispatch</h2>
            </div>
            <span className="text-xs font-mono text-gray-500">{allNotifications.length} items</span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {allNotifications.slice(0, 5).map((n) => (
              <div key={n.notificationId} className="p-2.5 rounded-lg border border-gray-100 bg-white text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#173D72]">{n.title}</span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-gray-600 text-[11px] mt-0.5">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
