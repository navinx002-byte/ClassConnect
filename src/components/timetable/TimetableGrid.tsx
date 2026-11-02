import React, { useState } from 'react';
import type { DayOfWeek, TimetableSlot } from '../../types';
import { dataService } from '../../services/dataService';
import { Clock, MapPin, User as UserIcon, Calendar, Coffee, Utensils } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TimetableGridProps {
  onSlotClick?: (slot: TimetableSlot) => void;
  showAdminControls?: boolean;
}

const DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const PERIOD_CONFIG: { period: number; label: string; time: string }[] = [
  { period: 1, label: 'Period 1', time: '09:00 - 09:55' },
  { period: 2, label: 'Period 2', time: '09:55 - 10:50' },
  // Short break at 10:50 - 11:00
  { period: 3, label: 'Period 3', time: '11:00 - 11:55' },
  { period: 4, label: 'Period 4', time: '11:55 - 12:50' },
  // Lunch break at 12:50 - 01:25
  { period: 5, label: 'Period 5', time: '01:25 - 02:20' },
  { period: 6, label: 'Period 6', time: '02:20 - 03:15' },
  { period: 7, label: 'Period 7', time: '03:15 - 04:10' },
];

export const TimetableGrid: React.FC<TimetableGridProps> = ({ onSlotClick }) => {
  const { role, currentUser } = useAuth();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('MONDAY');
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('weekly');

  const timetables = dataService.getTimetables();
  const timetable = timetables[0];
  const subjects = dataService.getSubjects();
  const users = dataService.getUsers();

  const getSubject = (id: string) => subjects.find((s) => s.subjectId === id);
  const getProfessor = (id: string) => users.find((u) => u.userId === id);

  // Helper to find slot for a specific day and period
  const getSlot = (day: DayOfWeek, period: number): TimetableSlot | undefined => {
    return timetable?.weeklySchedule.find((s) => s.dayOfWeek === day && s.periodNumber === period);
  };

  // Day slots for daily view
  const daySlots = timetable?.weeklySchedule
    .filter((s) => s.dayOfWeek === selectedDay)
    .sort((a, b) => a.periodNumber - b.periodNumber) || [];

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
      {/* Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-gray-200 bg-[#F5F7FA] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#173D72]" />
            <h2 className="text-base font-bold text-[#202938]">
              Department of Computer Applications — MCA Academic Timetable
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-[#173D72] font-semibold">
              Semester I • Section A
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Odd Semester Academic Year 2026 - 2027 • Weekly Matrix (Monday to Saturday)
          </p>
        </div>

        {/* View Switcher (Weekly vs Daily) */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-2xs">
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              viewMode === 'weekly'
                ? 'bg-[#173D72] text-white shadow-2xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Weekly Grid
          </button>
          <button
            onClick={() => setViewMode('daily')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              viewMode === 'daily'
                ? 'bg-[#173D72] text-white shadow-2xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Day-by-Day View
          </button>
        </div>
      </div>

      {/* Daily View with Day Selector Tabs */}
      {viewMode === 'daily' && (
        <div className="p-4 sm:p-6">
          {/* Day Selector Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 border-b border-gray-100">
            {DAYS.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  selectedDay === day
                    ? 'bg-[#173D72] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Slots list for selected day */}
          <div className="space-y-3">
            {daySlots.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <p className="text-sm">No scheduled periods for {selectedDay}</p>
              </div>
            ) : (
              daySlots.map((slot) => {
                const sub = getSubject(slot.subjectId);
                const prof = getProfessor(slot.professorId);
                const isMyClass = role === 'PROFESSOR' && currentUser?.userId === slot.professorId;

                return (
                  <div
                    key={slot.id}
                    onClick={() => onSlotClick && onSlotClick(slot)}
                    className={`p-4 rounded-xl border transition-all ${
                      isMyClass
                        ? 'border-blue-300 bg-blue-50/40 shadow-xs'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    } ${onSlotClick ? 'cursor-pointer' : ''}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-[#173D72] text-white flex items-center justify-center font-bold text-xs">
                          P{slot.periodNumber}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-[#202938]">
                            {sub?.name || 'Class Session'}
                          </h4>
                          <span className="text-xs text-gray-500 font-mono">{sub?.code}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1 font-medium bg-gray-100 px-2 py-1 rounded-md">
                          <Clock className="w-3.5 h-3.5 text-gray-500" />
                          {slot.startTime} - {slot.endTime}
                        </span>
                        <span className="flex items-center gap-1 font-medium bg-gray-100 px-2 py-1 rounded-md">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {slot.room}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                        <span>Instructor: <strong>{prof?.name || 'Assigned Faculty'}</strong></span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        Active Period
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Weekly View: Direct Matrix of Boxes */}
      {viewMode === 'weekly' && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left text-xs">
            <thead>
              <tr className="bg-[#173D72] text-white">
                <th className="py-3 px-3 font-bold uppercase text-[11px] w-28 text-center border-r border-blue-900">
                  Day / Period
                </th>
                {PERIOD_CONFIG.map((p, idx) => (
                  <React.Fragment key={p.period}>
                    <th className="py-2.5 px-2 font-bold uppercase text-[11px] text-center border-r border-blue-900 last:border-r-0">
                      <div className="font-extrabold">{p.label}</div>
                      <div className="text-[10px] text-blue-200 font-mono font-normal">{p.time}</div>
                    </th>
                    {/* Short Break Column */}
                    {idx === 1 && (
                      <th className="py-2.5 px-1 bg-amber-600 text-white font-bold text-[10px] text-center w-14 border-r border-blue-900 uppercase tracking-tighter">
                        <div className="flex flex-col items-center justify-center">
                          <Coffee className="w-3.5 h-3.5 mb-0.5" />
                          <span>Break</span>
                          <span className="text-[8px] font-mono">10:50</span>
                        </div>
                      </th>
                    )}
                    {/* Lunch Break Column */}
                    {idx === 3 && (
                      <th className="py-2.5 px-1 bg-emerald-700 text-white font-bold text-[10px] text-center w-16 border-r border-blue-900 uppercase tracking-tighter">
                        <div className="flex flex-col items-center justify-center">
                          <Utensils className="w-3.5 h-3.5 mb-0.5" />
                          <span>Lunch</span>
                          <span className="text-[8px] font-mono">12:50</span>
                        </div>
                      </th>
                    )}
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {DAYS.map((day) => (
                <tr key={day} className="hover:bg-blue-50/20 transition-colors">
                  {/* Day Label */}
                  <td className="py-3 px-3 font-bold text-[#173D72] bg-gray-50/90 border-r border-gray-200 text-center whitespace-nowrap">
                    {day}
                  </td>

                  {/* Period Boxes */}
                  {PERIOD_CONFIG.map((p, idx) => {
                    const slot = getSlot(day, p.period);
                    const sub = slot ? getSubject(slot.subjectId) : null;
                    const isMyClass = role === 'PROFESSOR' && currentUser?.userId === slot?.professorId;

                    return (
                      <React.Fragment key={p.period}>
                        <td
                          onClick={() => slot && onSlotClick && onSlotClick(slot)}
                          className={`py-2 px-1.5 border-r border-gray-200 transition-colors ${
                            slot && onSlotClick ? 'cursor-pointer hover:bg-blue-50/60' : ''
                          }`}
                        >
                          {slot ? (
                            <div
                              className={`p-2.5 rounded-lg border text-left h-full min-h-[68px] flex flex-col justify-between ${
                                isMyClass
                                  ? 'bg-blue-50 border-blue-300 shadow-2xs'
                                  : 'bg-white border-gray-200 shadow-2xs hover:border-[#173D72]'
                              }`}
                            >
                              <div>
                                <div className="font-extrabold text-xs text-[#173D72] leading-tight">
                                  {sub?.code || 'CLASS'}
                                </div>
                                <div className="text-[10px] text-gray-700 font-medium line-clamp-1 mt-0.5">
                                  {sub?.name?.split('(')[0] || 'Subject'}
                                </div>
                              </div>
                              <div className="mt-1.5 pt-1 border-t border-gray-100 flex items-center justify-between text-[9px] text-gray-500">
                                <span className="truncate max-w-[80px] text-gray-700 font-medium">
                                  {slot.room.split('(')[0]}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="p-2 text-center text-gray-400 text-[10px] italic">
                              Free
                            </div>
                          )}
                        </td>

                        {/* Short break column */}
                        {idx === 1 && (
                          <td className="bg-amber-50/70 border-r border-gray-200 text-center text-[11px] font-bold text-amber-800 px-1">
                            ☕
                          </td>
                        )}

                        {/* Lunch break column */}
                        {idx === 3 && (
                          <td className="bg-emerald-50/70 border-r border-gray-200 text-center text-[11px] font-bold text-emerald-800 px-1">
                            🍽️
                          </td>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
