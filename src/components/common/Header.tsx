import React from 'react';
import { Bell, LogOut, Shield, GraduationCap, BookOpen, FlaskConical, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { dataService } from '../../services/dataService';

interface HeaderProps {
  onOpenDemoTester?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDemoTester }) => {
  const { currentUser, role, logout } = useAuth();
  const { unreadCount, setIsOpen } = useNotifications();

  const settings = dataService.getSettings();

  const handleResetData = () => {
    if (confirm('Reset college database to completely clean slate (removes all timetable slots, sessions, and attendance)?')) {
      dataService.resetAllData();
      window.location.reload();
    }
  };

  const getRoleBadge = () => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <Shield className="w-3.5 h-3.5" /> Admin
          </span>
        );
      case 'PROFESSOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <BookOpen className="w-3.5 h-3.5" /> Professor
          </span>
        );
      case 'STUDENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <GraduationCap className="w-3.5 h-3.5" /> Student
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-xs">
      {/* Brand & College */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#173D72] flex items-center justify-center text-white font-bold text-lg shadow-sm">
          C
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-[#173D72] tracking-tight">ClassConnect</span>
            {getRoleBadge()}
          </div>
          <p className="text-xs text-gray-500 hidden sm:block">{settings.collegeName} • {settings.currentSemester}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Interactive Demo Test Suite Button */}
        {onOpenDemoTester && (
          <button
            onClick={onOpenDemoTester}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#173D72] bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
            title="Open Demo Tests Guide & Runner"
          >
            <FlaskConical className="w-3.5 h-3.5 text-[#173D72]" />
            <span className="hidden md:inline">Demo Test Guide</span>
            <span className="md:hidden">Tests</span>
          </button>
        )}

        {/* Reset Demo Data Button */}
        <button
          onClick={handleResetData}
          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          title="Reset demo data to default state"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Notification Bell */}
        <button
          onClick={() => setIsOpen(true)}
          className="relative p-2 text-gray-600 hover:text-[#173D72] hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Open notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center min-w-4.5 h-4.5 px-1 text-[10px] font-bold text-white bg-[#EF4444] rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Info & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="hidden sm:block text-right">
            <div className="text-xs font-semibold text-[#202938] leading-tight">{currentUser?.name}</div>
            <div className="text-[11px] text-gray-500 truncate max-w-[140px]">{currentUser?.email}</div>
          </div>
          <button
            onClick={logout}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Sign out of ClassConnect"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
