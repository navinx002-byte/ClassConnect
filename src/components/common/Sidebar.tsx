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
  GraduationCap,
  FileText,
  LifeBuoy,
  User,
  Clock,
  Award,
  FolderOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { dataService } from '../../services/dataService';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const { role, currentUser } = useAuth();
  const { unreadCount, setIsOpen } = useNotifications();
  const settings = dataService.getSettings();

  const getNavLinks = () => {
    switch (role) {
      case 'STUDENT':
        return [
          { id: 'dashboard', label: 'Home Dashboard', icon: LayoutDashboard },
          { id: 'today-classes', label: 'Today\'s Classes', icon: Clock },
          { id: 'weekly-timetable', label: 'Weekly Timetable', icon: Calendar },
          { id: 'attendance', label: 'Attendance', icon: CheckSquare },
          { id: 'class-schedule', label: 'Class Schedule', icon: ClipboardList },
          { id: 'academic', label: 'Academic & Semester', icon: Award },
          { id: 'documents', label: 'Old Question Papers', icon: FileText },
          { id: 'study-materials', label: 'Study Materials', icon: FolderOpen },
          { id: 'announcements', label: 'Announcements', icon: Megaphone },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'help', label: 'I Need Help', icon: LifeBuoy },
          { id: 'profile', label: 'My Profile', icon: User },
        ];
      case 'PROFESSOR':
        return [
          { id: 'dashboard', label: 'Faculty Dashboard', icon: LayoutDashboard },
          { id: 'classes', label: 'Today\'s Classes', icon: Clock },
          { id: 'attendance', label: 'Mark Attendance', icon: CheckSquare },
          { id: 'reschedule', label: 'Instant Reschedule', icon: History },
          { id: 'announcements', label: 'Post Announcement', icon: Megaphone },
          { id: 'timetable', label: 'Timetable Grid', icon: Calendar },
          { id: 'profile', label: 'Faculty Profile', icon: User },
        ];
      case 'ADMIN':
        return [
          { id: 'dashboard', label: 'Admin Overview', icon: LayoutDashboard },
          { id: 'users', label: 'User Directory', icon: Users },
          { id: 'preloaded-students', label: 'Eligible Student Records', icon: GraduationCap },
          { id: 'subjects', label: 'Subjects & Faculty', icon: BookOpen },
          { id: 'timetable', label: 'Permanent Timetable', icon: Calendar },
          { id: 'admin-documents', label: 'Upload Question Papers', icon: FileText },
          { id: 'attendance', label: 'Attendance Audit', icon: CheckSquare },
          { id: 'changelogs', label: 'Reschedule Logs', icon: History },
          { id: 'support-tickets', label: 'Student Help Tickets', icon: LifeBuoy },
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
      <div className="mb-4 p-3 bg-[#F5F7FA] rounded-xl border border-gray-200">
        <div className="text-xs font-bold text-[#173D72] flex items-center gap-1.5 uppercase tracking-wider">
          <GraduationCap className="w-4 h-4" /> {settings.collegeName}
        </div>
        <p className="text-xs text-gray-800 mt-1 font-bold truncate">{currentUser?.name}</p>
        <span className="text-[11px] text-gray-500 font-mono">
          {currentUser?.role === 'STUDENT'
            ? currentUser.usn || currentUser.rollNumber || 'Student'
            : currentUser?.email}
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
          Navigation
        </div>
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentTab === item.id ||
            (item.id === 'attendance' &&
              (currentTab === 'attendance-datewise' || currentTab === 'attendance-summary'));

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                isActive
                  ? 'bg-[#173D72] text-white shadow-xs font-bold'
                  : 'text-[#202938] hover:bg-gray-100 hover:text-[#173D72]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Notifications Drawer Button in Sidebar */}
      <div className="pt-3 border-t border-gray-200 mt-2">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-[#173D72] hover:bg-blue-50 transition-colors border border-blue-100"
        >
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#173D72]" />
            <span>Notification Drawer</span>
          </div>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EF4444] text-white">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};
