import React from 'react';
import { Home, Bell, LifeBuoy, User, Calendar, CheckSquare, History, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

interface MobileBottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentTab, onTabChange }) => {
  const { role } = useAuth();
  const { unreadCount, setIsOpen } = useNotifications();

  if (role === 'STUDENT') {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg px-2 py-1.5 flex items-center justify-around">
        {/* 1. Home */}
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
            currentTab === 'dashboard' ||
            currentTab === 'today-classes' ||
            currentTab === 'weekly-timetable' ||
            currentTab === 'attendance' ||
            currentTab === 'attendance-datewise' ||
            currentTab === 'attendance-summary' ||
            currentTab === 'class-schedule' ||
            currentTab === 'academic' ||
            currentTab === 'documents' ||
            currentTab === 'study-materials' ||
            currentTab === 'announcements'
              ? 'text-[#173D72] font-bold'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        {/* 2. Notifications */}
        <button
          onClick={() => onTabChange('notifications')}
          className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
            currentTab === 'notifications' ? 'text-[#173D72] font-bold' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-bold text-white bg-[#EF4444] rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5">Notifications</span>
        </button>

        {/* 3. I Need Help */}
        <button
          onClick={() => onTabChange('help')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
            currentTab === 'help' ? 'text-[#173D72] font-bold' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <LifeBuoy className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">I Need Help</span>
        </button>

        {/* 4. Profile */}
        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
            currentTab === 'profile' ? 'text-[#173D72] font-bold' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Profile</span>
        </button>
      </nav>
    );
  }

  // Professor Mobile Nav
  if (role === 'PROFESSOR') {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
            currentTab === 'dashboard' ? 'text-[#173D72] font-bold' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Classes</span>
        </button>

        <button
          onClick={() => onTabChange('attendance')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
            currentTab === 'attendance' ? 'text-[#173D72] font-bold' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Attendance</span>
        </button>

        <button
          onClick={() => onTabChange('reschedule')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
            currentTab === 'reschedule' ? 'text-[#173D72] font-bold' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Reschedule</span>
        </button>

        <button
          onClick={() => onTabChange('timetable')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
            currentTab === 'timetable' ? 'text-[#173D72] font-bold' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Timetable</span>
        </button>

        <button
          onClick={() => setIsOpen(true)}
          className="relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-gray-500 hover:text-[#173D72]"
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-bold text-white bg-[#EF4444] rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5">Alerts</span>
        </button>
      </nav>
    );
  }

  // Admin Mobile Nav
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg px-2 py-1.5 flex items-center justify-around">
      <button
        onClick={() => onTabChange('dashboard')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
          currentTab === 'dashboard' ? 'text-[#173D72] font-bold' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Overview</span>
      </button>

      <button
        onClick={() => onTabChange('users')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
          currentTab === 'users' ? 'text-[#173D72] font-bold' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <Users className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Users</span>
      </button>

      <button
        onClick={() => onTabChange('timetable')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
          currentTab === 'timetable' ? 'text-[#173D72] font-bold' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <Calendar className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Timetable</span>
      </button>

      <button
        onClick={() => onTabChange('changelogs')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
          currentTab === 'changelogs' ? 'text-[#173D72] font-bold' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <History className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Logs</span>
      </button>

      <button
        onClick={() => setIsOpen(true)}
        className="relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-gray-500 hover:text-[#173D72]"
      >
        <div className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-bold text-white bg-[#EF4444] rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5">Alerts</span>
      </button>
    </nav>
  );
};
