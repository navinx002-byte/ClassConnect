import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, AlertCircle, CheckCircle2, History, Loader2, ArrowRight } from 'lucide-react';
import { dataService } from '../../services/dataService';
import type { ClassSession } from '../../types';
import { useNotifications } from '../../context/NotificationContext';

interface RescheduleClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  professorId: string;
  session: ClassSession;
  onSuccess?: () => void;
}

export const RescheduleClassModal: React.FC<RescheduleClassModalProps> = ({
  isOpen,
  onClose,
  professorId,
  session,
  onSuccess,
}) => {
  const { refreshNotifications } = useNotifications();
  const subject = dataService.getSubjectById(session.subjectId);

  const [newDate, setNewDate] = useState(session.date);
  const [newStartTime, setNewStartTime] = useState(session.startTime);
  const [newEndTime, setNewEndTime] = useState(session.endTime);
  const [newRoom, setNewRoom] = useState(session.room);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A mandatory reason is required for institutional audit logging.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Execute the mandatory instant-log policy via dataService
      dataService.rescheduleSession(
        professorId,
        session.sessionId,
        newDate,
        newStartTime,
        newEndTime,
        newRoom,
        reason
      );

      setSuccess(true);
      refreshNotifications();

      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-[#173D72]" />
              <h3 className="text-base font-bold text-[#173D72]">Instant Class Rescheduling</h3>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">
              Policy: instant-log • No Admin Approval Required
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Session Snapshot */}
        <div className="mt-4 p-3 rounded-lg bg-[#F5F7FA] border border-gray-200 text-xs">
          <div className="font-bold text-[#202938] mb-1">{subject?.name}</div>
          <div className="grid grid-cols-3 gap-2 text-gray-600 font-medium">
            <span>Date: {session.date}</span>
            <span>Time: {session.startTime} - {session.endTime}</span>
            <span>Room: {session.room}</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-1 font-mono">
            Current Session Version: v{session.version}
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Rescheduling applied instantly! Session updated to version {session.version + 1}. Audit record generated and notifications sent to students, professor, and admin.
            </span>
          </div>
        )}

        {/* Reschedule Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">New Class Date</label>
            <div className="relative">
              <input
                type="date"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#173D72]"
              />
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Start Time</label>
              <div className="relative">
                <input
                  type="time"
                  required
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#173D72]"
                />
                <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">End Time</label>
              <div className="relative">
                <input
                  type="time"
                  required
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#173D72]"
                />
                <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Classroom / Lecture Hall</label>
            <div className="relative">
              <input
                type="text"
                required
                value={newRoom}
                onChange={(e) => setNewRoom(e.target.value)}
                placeholder="e.g. Auditorium B or Room 305"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#173D72]"
              />
              <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Reason for Rescheduling (Mandatory Audit Log)
            </label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Rescheduled due to department accreditation meeting or special guest lecture"
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#173D72]"
            />
          </div>

          <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">
              Permanent timetable remains unaffected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 font-bold bg-[#173D72] hover:bg-blue-900 text-white rounded-lg shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Applying change...
                  </>
                ) : (
                  <>
                    <span>Execute Reschedule</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
