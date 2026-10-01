import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';

const AuthPage = lazy(() => import('./pages/AuthPage.jsx'));
const PasswordRecoveryPage = lazy(() => import('./pages/PasswordRecoveryPage.jsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
const TasksPage = lazy(() => import('./pages/TasksPage.jsx'));
const CalendarPage = lazy(() => import('./pages/CalendarPage.jsx'));
const HabitsPage = lazy(() => import('./pages/HabitsPage.jsx'));
const PomodoroPage = lazy(() => import('./pages/PomodoroPage.jsx'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage.jsx'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage.jsx'));
const AssistantPage = lazy(() => import('./pages/AssistantPage.jsx'));
const HelpPage = lazy(() => import('./pages/HelpPage.jsx'));

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/forgot-password" element={<PasswordRecoveryPage mode="forgot" />} />
        <Route path="/reset-password" element={<PasswordRecoveryPage mode="reset" />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="habits" element={<HabitsPage />} />
            <Route path="pomodoro" element={<PomodoroPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="assistant" element={<AssistantPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
