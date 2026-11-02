import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Users, Loader2 } from 'lucide-react';
import { dataService } from '../../services/dataService';
import type { AttendanceStatus } from '../../types';
import { useNotifications } from '../../context/NotificationContext';

interface MarkAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  professorId: string;
  preselectedSessionId?: string;
  onSuccess?: () => void;
}

export const MarkAttendanceModal: React.FC<MarkAttendanceModalProps> = ({
  isOpen,
  onClose,
  professorId,
  preselectedSessionId,
  onSuccess,
}) => {
  const { refreshNotifications } = useNotifications();
  const [selectedSessionId, setSelectedSessionId] = useState<string>(preselectedSessionId || '');
  const [attendances, setAttendances] = useState<Record<string, AttendanceStatus>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const professor = dataService.getUserById(professorId);
  const allSessions = dataService.getSessions();
  const subjects = dataService.getSubjects();

  // Sessions assigned to this professor
  const professorSessions = allSessions.filter((s) => s.professorId === professorId);

  useEffect(() => {
    if (preselectedSessionId) {
      setSelectedSessionId(preselectedSessionId);
    } else if (professorSessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(professorSessions[0].sessionId);
    }
  }, [preselectedSessionId, professorSessions, selectedSessionId]);

  const currentSession = allSessions.find((s) => s.sessionId === selectedSessionId);
  const enrolledStudents = currentSession
    ? dataService.getEnrolledStudentsForSubject(currentSession.subjectId)
    : [];

  // Initialize student statuses (existing records or default to PRESENT)
  useEffect(() => {
    if (currentSession) {
      const existingRecords = dataService.getAttendanceForSession(currentSession.sessionId);
      const initial: Record<string, AttendanceStatus> = {};

      enrolledStudents.forEach((student) => {
        const found = existingRecords.find((r) => r.studentId === student.userId);
        initial[student.userId] = found ? found.status : 'PRESENT';
      });

      setAttendances(initial);
      setError(null);
      setSuccessMessage(null);
    }
  }, [selectedSessionId]);

  if (!isOpen) return null;

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendances((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, AttendanceStatus> = {};
    enrolledStudents.forEach((s) => {
      updated[s.userId] = 'PRESENT';
    });
    setAttendances(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSession) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const studentList = Object.entries(attendances).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      // STRICT PERMISSION CHECK ENFORCED IN SERVICE LAYER
      const result = dataService.markAttendance(professorId, currentSession.sessionId, studentList);

      setSuccessMessage(
        `Attendance successfully submitted for ${result.count} students. Any absent students have been dispatched immediate alert notifications.`
      );
      refreshNotifications();

      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-[#F5F7FA] rounded-t-xl">
          <div>
            <h3 className="text-base font-bold text-[#173D72] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#173D72]" />
              Mark Class Attendance
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Instructor: <strong>{professor?.name}</strong> • Subject Assignment Guard Active
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Session Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Select Assigned Class Session
            </label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full text-xs bg-white border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#173D72]"
            >
              {professorSessions.map((s) => {
                const sub = subjects.find((sub) => sub.subjectId === s.subjectId);
                return (
                  <option key={s.sessionId} value={s.sessionId}>
                    {sub?.name} ({s.date} • {s.startTime} - {s.endTime} • {s.room})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Student List Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700">
                Enrolled Students ({enrolledStudents.length})
              </span>
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="text-xs text-[#173D72] hover:underline font-bold"
              >
                Mark All Present
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {enrolledStudents.map((student) => {
                const currentStatus = attendances[student.userId] || 'PRESENT';

                return (
                  <div
                    key={student.userId}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-gray-50 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-gray-900">{student.name}</div>
                      <div className="text-[11px] text-gray-500 font-mono">
                        {student.rollNumber} • {student.email}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.userId, 'PRESENT')}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                          currentStatus === 'PRESENT'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.userId, 'LATE')}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                          currentStatus === 'LATE'
                            ? 'bg-amber-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Late
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.userId, 'ABSENT')}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                          currentStatus === 'ABSENT'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Absent
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-[#F5F7FA] flex items-center justify-between rounded-b-xl">
          <span className="text-xs text-gray-500">
            Attendance linked to actual dated session • Version controlled
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-bold bg-[#173D72] hover:bg-blue-900 text-white rounded-md shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                </>
              ) : (
                'Finalize Attendance'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
