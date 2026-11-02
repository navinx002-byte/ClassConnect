import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { dataService } from '../../services/dataService';
import type { ClassSession, ClassStatus } from '../../types';
import { useNotifications } from '../../context/NotificationContext';

interface ClassStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  professorId: string;
  session: ClassSession;
  onSuccess?: () => void;
}

export const ClassStatusModal: React.FC<ClassStatusModalProps> = ({
  isOpen,
  onClose,
  professorId,
  session,
  onSuccess,
}) => {
  const { refreshNotifications } = useNotifications();
  const subject = dataService.getSubjectById(session.subjectId);

  const [status, setStatus] = useState<ClassStatus>(session.status);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      dataService.updateClassStatus(professorId, session.sessionId, status, reason);
      setMessage({
        type: 'success',
        text: `Class status updated to ${status}. Affected students and admin have been notified.`,
      });
      refreshNotifications();

      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200">
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <h3 className="text-base font-bold text-[#173D72]">Update Class Status</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-3 p-3 bg-gray-50 rounded-lg text-xs">
          <div className="font-bold text-gray-800">{subject?.name}</div>
          <div className="text-gray-500 font-mono mt-0.5">
            {session.date} • {session.startTime} - {session.endTime} ({session.room})
          </div>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-xs flex items-start gap-2 mb-3 ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1.5">Select Status</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('ON')}
                className={`py-2 px-3 rounded-lg font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                  status === 'ON'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>ON</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('POSTPONED')}
                className={`py-2 px-3 rounded-lg font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                  status === 'POSTPONED'
                    ? 'bg-amber-100 text-amber-800 border-amber-300 ring-2 ring-amber-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>POSTPONED</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('CANCELLED')}
                className={`py-2 px-3 rounded-lg font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                  status === 'CANCELLED'
                    ? 'bg-red-100 text-red-800 border-red-300 ring-2 ring-red-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <XCircle className="w-3.5 h-3.5 text-red-600" />
                <span>CANCELLED</span>
              </button>
            </div>
          </div>

          {(status === 'CANCELLED' || status === 'POSTPONED') && (
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Reason / Note for Students
              </label>
              <textarea
                required
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Health leave or symposium conflict"
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#173D72]"
              />
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 font-bold bg-[#173D72] hover:bg-blue-900 text-white rounded-lg shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating...
                </>
              ) : (
                'Save Status'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
