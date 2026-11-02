import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { LoginForm } from './components/auth/LoginForm';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { DemoTestRunnerModal } from './components/common/DemoTestRunnerModal';
import { StudentDashboard } from './components/student/StudentDashboard';
import { ProfessorDashboard } from './components/professor/ProfessorDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { dataService } from './services/dataService';

const MainApp: React.FC = () => {
  const { isAuthenticated, role, currentUser, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isDemoTesterOpen, setIsDemoTesterOpen] = useState<boolean>(false);

  // Reset tab to 'dashboard' when role changes
  useEffect(() => {
    setCurrentTab('dashboard');
  }, [role]);

  // Automated 10-minute class reminder simulation interval
  useEffect(() => {
    if (!isAuthenticated) return;

    const timer = setInterval(() => {
      // Find today's sessions and see if any need a reminder check
      const todaySessions = dataService.getTodaySessions();
      if (todaySessions.length > 0) {
        // Process scheduled reminder
        const jobs = dataService.getReminderJobs();
        const pending = jobs.filter((j) => j.status === 'SCHEDULED');
        if (pending.length > 0) {
          const target = pending[0];
          target.status = 'EXECUTED';
        }
      }
    }, 15000);

    return () => clearInterval(timer);
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#173D72] animate-pulse flex items-center justify-center text-white font-bold text-lg">
            C
          </div>
          <span className="text-xs font-semibold text-gray-500">Initializing ClassConnect...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return <LoginForm />;
  }

  const renderDashboard = () => {
    switch (role) {
      case 'STUDENT':
        return <StudentDashboard activeTab={currentTab} />;
      case 'PROFESSOR':
        return <ProfessorDashboard activeTab={currentTab} />;
      case 'ADMIN':
        return <AdminDashboard activeTab={currentTab} />;
      default:
        return (
          <div className="p-8 text-center text-gray-500">
            Unassigned role. Please contact system administrator.
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col text-[#202938]">
      {/* Top Navigation Bar */}
      <Header onOpenDemoTester={() => setIsDemoTesterOpen(true)} />

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 max-w-7xl mx-auto w-full">
          {renderDashboard()}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* Slide-over Notification Center */}
      <NotificationDrawer />

      {/* Interactive Demo Test Suite Runner */}
      <DemoTestRunnerModal
        isOpen={isDemoTesterOpen}
        onClose={() => setIsDemoTesterOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainApp />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
