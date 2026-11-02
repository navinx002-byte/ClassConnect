import React from 'react';
import { LayoutDashboard, Calendar, CheckSquare, Bell, History, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

interface MobileBottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentTab, onTabChange }) => {
  const { role } = useAuth();
  const { unreadCount, setIsOpen } = useNotifications();

  const getTabs = () => {
    switch (role) {
      case 'STUDENT':
        return [
          { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
          { id: 'timetable', label: 'Timetable', icon: Calendar },
          { id: 'attendance', label: 'Attendance', icon: CheckSquare },
        ];
      case 'PROFESSOR':
        return [
          { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
          { id: 'attendance', label: 'Attendance', icon: CheckSquare },
          { id: 'reschedule', label: 'Reschedule', icon: History },
          { id: 'timetable', label: 'Timetable', icon: Calendar },
        ];
      case 'ADMIN':
        return [
          { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'timetable', label: 'Timetable', icon: Calendar },
          { id: 'changelogs', label: 'Logs', icon: History },
        ];
      default:
        return [];
    }
  };

  const tabs = getTabs();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg px-2 py-1.5 flex items-center justify-around">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
              isActive ? 'text-[#173D72] font-semibold' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px] text-[#173D72]' : 'text-gray-500'}`} />
            <span className="text-[10px] mt-0.5">{tab.label}</span>
          </button>
        );
      })}

      {/* Notifications tab with unread count */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-gray-500 hover:text-[#173D72]"
      >
        <div className="relative">
          <Bell className="w-5 h-5 text-gray-500" />
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
