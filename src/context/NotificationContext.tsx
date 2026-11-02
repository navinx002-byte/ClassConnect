import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { NotificationItem } from '../types';
import { dataService } from '../services/dataService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isOpen: boolean;
  activeToast: NotificationItem | null;
  pushPermission: NotificationPermission;
  isPushSupported: boolean;
  setIsOpen: (open: boolean) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => void;
  dismissToast: () => void;
  requestPushPermission: () => Promise<boolean>;
  triggerPhoneNotification: (title: string, body: string) => void;
  testPhoneNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const isPushSupported = typeof window !== 'undefined' && 'Notification' in window;

  const triggerPhoneNotification = useCallback((title: string, body: string) => {
    // 1. Native Web/Mobile Push Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        });
      } catch (err) {
        console.warn('System push error:', err);
      }
    }

    // 2. Mobile Device Vibration
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {
        // ignore vibration permission blocks
      }
    }

    // 3. Audio Chime
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // Audio autoplay policy
    }
  }, []);

  const requestPushPermission = async (): Promise<boolean> => {
    if (!isPushSupported) return false;
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission === 'granted') {
        triggerPhoneNotification(
          '🔔 Phone Notifications Activated!',
          'ClassConnect notifications are now enabled. You will receive real-time alerts for timetables and class updates.'
        );
        return true;
      }
      return false;
    } catch (e) {
      console.error('Push request error:', e);
      return false;
    }
  };

  const testPhoneNotification = () => {
    if (pushPermission !== 'granted') {
      requestPushPermission();
    } else {
      triggerPhoneNotification(
        '📱 ClassConnect Alert',
        'MCA Sem 1: Advanced Operating Systems (AOS) starts in 10 minutes in Room 301.'
      );
    }
  };

  const refreshNotifications = useCallback(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }
    const items = dataService.getNotifications(currentUser.userId);
    setNotifications(items);
  }, [currentUser]);

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 5000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const markAsRead = (id: string) => {
    dataService.markNotificationAsRead(id);
    refreshNotifications();
  };

  const markAllAsRead = () => {
    if (currentUser) {
      dataService.markAllNotificationsAsRead(currentUser.userId);
      refreshNotifications();
    }
  };

  const dismissToast = () => {
    setActiveToast(null);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isOpen,
        activeToast,
        pushPermission,
        isPushSupported,
        setIsOpen,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
        dismissToast,
        requestPushPermission,
        triggerPhoneNotification,
        testPhoneNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
