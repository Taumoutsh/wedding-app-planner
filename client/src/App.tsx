import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './i18n/LanguageProvider';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { AdminPage } from './components/AdminPage';

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  const [view, setView] = useState<'dashboard' | 'admin'>('dashboard');

  if (!isAuthenticated) return <LoginForm />;

  // Only admins can reach the admin page (also enforced server-side).
  if (view === 'admin' && user?.isAdmin) {
    return <AdminPage onBack={() => setView('dashboard')} />;
  }

  return <Dashboard onOpenAdmin={() => setView('admin')} />;
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
