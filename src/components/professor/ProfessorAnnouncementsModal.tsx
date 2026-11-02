import React, { useState } from 'react';
import { X, Megaphone, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { useNotifications } from '../../context/NotificationContext';

interface ProfessorAnnouncementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  professorId: string;
  onSuccess?: () => void;
}

export const ProfessorAnnouncementsModal: React.FC<ProfessorAnnouncementsModalProps> = ({
  isOpen,
  onClose,
  professorId,
  onSuccess,
}) => {
  const { refreshNotifications } = useNotifications();
  const subjects = dataService.getSubjects().filter((s) => s.professorId === professorId);

  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.subjectId || '');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || !selectedSubjectId) return;

    setIsSubmitting(true);
    setAlert(null);

    try {
      dataService.createAnnouncement(professorId, selectedSubjectId, title, message);
      setAlert({
        type: 'success',
        text: 'Announcement successfully published! Enrolled students have been notified via in-app & push alerts.',
      });
      refreshNotifications();

      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1300);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setAlert({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-gray-200">
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#173D72]" />
            <h3 className="text-base font-bold text-[#173D72]">Create Subject Announcement</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {alert && (
          <div
            className={`my-3 p-3 rounded-lg text-xs flex items-start gap-2 ${
              alert.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <span>{alert.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Target Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#173D72]"
            >
              {subjects.map((sub) => (
                <option key={sub.subjectId} value={sub.subjectId}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Announcement Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Reading material for next lecture"
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#173D72]"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Detailed Message</label>
            <textarea
              required
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write the full update for your students..."
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#173D72]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
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
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Publishing...
                </>
              ) : (
                'Publish & Notify Students'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
