import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './i18n/LanguageProvider';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';

function AppContent() {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <Dashboard /> : <LoginForm />;
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
