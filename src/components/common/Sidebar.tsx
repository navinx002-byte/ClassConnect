import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Megaphone,
  Users,
  BookOpen,
  ClipboardList,
  History,
  Settings,
  Bell,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const { role, currentUser } = useAuth();
  const { unreadCount, setIsOpen } = useNotifications();

  const getNavLinks = () => {
    switch (role) {
      case 'STUDENT':
        return [
          { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
          { id: 'timetable', label: 'Weekly Timetable', icon: Calendar },
          { id: 'attendance', label: 'Attendance History', icon: CheckSquare },
          { id: 'announcements', label: 'Announcements', icon: Megaphone },
        ];
      case 'PROFESSOR':
        return [
          { id: 'dashboard', label: 'Faculty Dashboard', icon: LayoutDashboard },
          { id: 'classes', label: 'Today\'s Classes', icon: Calendar },
          { id: 'attendance', label: 'Mark Attendance', icon: CheckSquare },
          { id: 'reschedule', label: 'Instant Reschedule', icon: History },
          { id: 'announcements', label: 'Post Announcement', icon: Megaphone },
          { id: 'timetable', label: 'Timetable Grid', icon: ClipboardList },
        ];
      case 'ADMIN':
        return [
          { id: 'dashboard', label: 'Admin Overview', icon: LayoutDashboard },
          { id: 'users', label: 'User Directory', icon: Users },
          { id: 'subjects', label: 'Subjects & Faculty', icon: BookOpen },
          { id: 'timetable', label: 'Permanent Timetable', icon: Calendar },
          { id: 'attendance', label: 'Attendance Audit', icon: CheckSquare },
          { id: 'changelogs', label: 'Reschedule Logs', icon: History },
          { id: 'settings', label: 'College Settings', icon: Settings },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-61px)] shrink-0 p-4">
      {/* College Info Card */}
      <div className="mb-6 p-3 bg-[#F5F7FA] rounded-lg border border-gray-200">
        <div className="text-xs font-semibold text-[#173D72] flex items-center gap-1.5 uppercase tracking-wider">
          <GraduationCap className="w-4 h-4" /> Apex Institute
        </div>
        <p className="text-xs text-gray-600 mt-1 font-medium">{currentUser?.name}</p>
        <span className="text-[11px] text-gray-500 font-mono">
          {currentUser?.role === 'STUDENT' ? currentUser.rollNumber : currentUser?.email}
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1">
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
          Navigation
        </div>
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                isActive
                  ? 'bg-[#173D72] text-white shadow-2xs font-semibold'
                  : 'text-[#202938] hover:bg-gray-100 hover:text-[#173D72]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Notifications Drawer Button in Sidebar */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-[#173D72] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 text-gray-500" />
            <span>Notifications</span>
          </div>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-[#EF4444] text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};
