import React, { useState } from 'react';
import { X, CheckCheck, Clock, AlertTriangle, Calendar, Megaphone, Bell, CheckCircle2, Smartphone } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import type { NotificationType } from '../../types';

export const NotificationDrawer: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isOpen,
    setIsOpen,
    markAsRead,
    markAllAsRead,
    pushPermission,
    requestPushPermission,
    testPhoneNotification
  } = useNotifications();
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'REMINDERS' | 'ABSENCES' | 'CHANGES'>('ALL');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'UNREAD') return !item.read;
    if (filter === 'REMINDERS') return item.type === 'CLASS_REMINDER';
    if (filter === 'ABSENCES') return item.type === 'STUDENT_MARKED_ABSENT';
    if (filter === 'CHANGES') {
      return (
        item.type === 'CLASS_RESCHEDULED' ||
        item.type === 'CLASSROOM_CHANGED' ||
        item.type === 'CLASS_CANCELLED' ||
        item.type === 'CLASS_POSTPONED'
      );
    }
    return true;
  });

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'CLASS_REMINDER':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'STUDENT_MARKED_ABSENT':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'CLASS_RESCHEDULED':
      case 'CLASSROOM_CHANGED':
      case 'CLASS_POSTPONED':
        return <Calendar className="w-4 h-4 text-amber-600" />;
      case 'CLASS_CANCELLED':
        return <X className="w-4 h-4 text-red-600" />;
      case 'PROFESSOR_ANNOUNCEMENT':
        return <Megaphone className="w-4 h-4 text-indigo-600" />;
      default:
        return <Bell className="w-4 h-4 text-[#173D72]" />;
    }
  };

  const getBorderColor = (type: NotificationType) => {
    switch (type) {
      case 'STUDENT_MARKED_ABSENT':
        return 'border-l-4 border-l-red-500';
      case 'CLASS_REMINDER':
        return 'border-l-4 border-l-blue-500';
      case 'CLASS_RESCHEDULED':
        return 'border-l-4 border-l-amber-500';
      case 'CLASS_CANCELLED':
        return 'border-l-4 border-l-red-400';
      default:
        return 'border-l-4 border-l-[#173D72]';
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-[#F5F7FA]">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#173D72]" />
            <h2 className="text-base font-bold text-[#202938]">Notification Center</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-[#EF4444] text-white rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real Phone & Device Push Notifications Bar */}
        <div className="px-4 py-2.5 bg-blue-50/90 border-b border-blue-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#173D72] shrink-0" />
            <div>
              <div className="text-xs font-bold text-[#173D72] flex items-center gap-1.5">
                <span>Phone Push Notifications</span>
                {pushPermission === 'granted' && (
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                    Active
                  </span>
                )}
              </div>
              <div className="text-[10px] text-gray-600">
                {pushPermission === 'granted'
                  ? 'Real phone alerts enabled'
                  : 'Tap below to receive alerts on your phone screen'}
              </div>
            </div>
          </div>

          <div className="shrink-0">
            {pushPermission === 'granted' ? (
              <button
                type="button"
                onClick={testPhoneNotification}
                className="px-2.5 py-1 text-[11px] font-bold bg-[#173D72] hover:bg-blue-900 text-white rounded-md shadow-2xs"
              >
                Test Phone Alert
              </button>
            ) : (
              <button
                type="button"
                onClick={requestPushPermission}
                className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-2xs"
              >
                Enable on Phone
              </button>
            )}
          </div>
        </div>

        {/* Action Bar & Filter Chips */}
        <div className="px-4 py-2 border-b border-gray-200 bg-white flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Filter by category:</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-medium text-[#173D72] hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {(['ALL', 'UNREAD', 'REMINDERS', 'ABSENCES', 'CHANGES'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                  filter === tab
                    ? 'bg-[#173D72] text-white font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab === 'ALL'
                  ? 'All'
                  : tab === 'UNREAD'
                  ? `Unread (${unreadCount})`
                  : tab === 'REMINDERS'
                  ? 'Reminders (10m)'
                  : tab === 'ABSENCES'
                  ? 'Absence Alerts'
                  : 'Class Changes'}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-medium">No notifications in this view</p>
              <p className="text-xs text-gray-400 mt-1">You are all caught up!</p>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.notificationId}
                onClick={() => !item.read && markAsRead(item.notificationId)}
                className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                  getBorderColor(item.type)
                } ${item.read ? 'bg-white border-gray-200 opacity-80' : 'bg-blue-50/40 border-blue-200 shadow-xs'}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-white border border-gray-200 shadow-2xs">
                      {getIcon(item.type)}
                    </div>
                    <span className="font-semibold text-xs text-[#202938]">{item.title}</span>
                  </div>
                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-[#173D72] shrink-0 mt-1" />
                  )}
                </div>
                <p className="text-xs text-gray-700 leading-relaxed pl-7">{item.message}</p>
                <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2 pl-7">
                  <span>{formatTimestamp(item.createdAt)}</span>
                  <span className="text-[10px] uppercase tracking-wider text-gray-400">
                    {item.deliveryStatus}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 bg-[#F5F7FA] border-t border-gray-200 text-center text-xs text-gray-500">
          Realtime delivery via Firebase Cloud Messaging & In-App Sync
        </div>
      </div>
    </div>
  );
};
