

import React, { useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import AdminDashboard from './pages/AdminDashboard';
import CandidateDashboard from './pages/CandidateDashboard';
import AIToolsPage from './pages/AIToolsPage';
import InterviewPage from './pages/InterviewPage';
import InterviewResultPage from './pages/InterviewResultPage';
import CertificatePage from './pages/CertificatePage';
import { Chatbot } from './components/Chatbot';
import { ConfirmationModal } from './components/common/ConfirmationModal';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { mockInterviews, mockInterviewResult } from './utils/mockData'; // Import mock data

const AppContent: React.FC = () => {
  const [user, setUser] = useState<{ role: 'admin' | 'candidate'; name: string } | null>(() => {
    try {
        const savedUser = localStorage.getItem('htc-user');
        // FIX: The `JSON.parse` return type is `any`, which can lead to type mismatches.
        // Explicitly cast the parsed object to the expected user type to resolve the error.
        return savedUser ? (JSON.parse(savedUser) as { role: 'admin' | 'candidate'; name: string }) : null;
    } catch (e) {
        return null;
    }
  });
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleLogin = (role: 'admin' | 'candidate', name: string) => {
    const userData = { role, name };
    setUser(userData);
    localStorage.setItem('htc-user', JSON.stringify(userData));
    navigate(role === 'admin' ? '/admin' : '/candidate');
  };

  const handleDemoLogin = () => {
    // Simulate a candidate logging in
    // FIX: Use 'as const' to infer the literal type 'candidate' for the role property,
    // ensuring it's assignable to the user state's 'admin' | 'candidate' union type.
    const demoUser = { role: 'candidate' as const, name: 'Demo Candidate' };
    setUser(demoUser);
    localStorage.setItem('htc-user', JSON.stringify(demoUser));

    // Pre-populate mock data for the demo candidate
    try {
        localStorage.setItem('htc-interviews', JSON.stringify(mockInterviews));
        localStorage.setItem(`htc-interview-result-${mockInterviewResult.interviewId}`, JSON.stringify(mockInterviewResult));
        // Clear any old progress for the demo interview if it exists, so instruction modal shows up
        localStorage.removeItem(`htc-interview-progress-${mockInterviewResult.interviewId}`);
        localStorage.removeItem(`htc-instructions-seen-${mockInterviewResult.interviewId}`);
    } catch (e) {
        console.error("Failed to pre-populate demo data to localStorage", e);
    }

    navigate('/candidate');
  };

  const handleLogoutRequest = () => {
    setIsLogoutModalOpen(true);
  };
  
  const handleConfirmLogout = () => {
      setUser(null);
      localStorage.removeItem('htc-user');
      localStorage.removeItem('htc-chat-history'); // Clear chat history on logout
      setIsLogoutModalOpen(false);
      // Use { replace: true } to prevent back navigation to protected routes after logout
      navigate('/', { replace: true });
  };

  return (
    <div className={`min-h-screen ${theme.primaryBgClass} ${theme.textColorClass} overflow-x-hidden transition-colors duration-300`}>
       <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>
      <main className="relative z-10">
        <Routes>
          <Route 
            path="/" 
            element={!user ? <HomePage /> : <Navigate to={user.role === 'admin' ? '/admin' : '/candidate'} replace />} 
          />
          <Route 
            path="/login" 
            element={!user ? <AuthPage onAuth={handleLogin} onDemoLogin={handleDemoLogin} /> : <Navigate to={user.role === 'admin' ? '/admin' : '/candidate'} replace />} 
          />
          <Route 
            path="/admin" 
            element={
              user && user.role === 'admin' 
                ? <AdminDashboard userName={user.name} userRole={user.role} onLogout={handleLogoutRequest} /> 
                : <Navigate to="/login" replace />
            } 
          />
           <Route
            path="/admin/interview-result/:interviewId"
            element={
              user && user.role === 'admin'
                ? <InterviewResultPage userName={user.name} userRole={user.role} onLogout={handleLogoutRequest} />
                : <Navigate to="/login" replace />
            }
          />
          <Route 
            path="/candidate" 
            element={
              user && user.role === 'candidate' 
                ? <CandidateDashboard userName={user.name} userRole={user.role} onLogout={handleLogoutRequest} /> 
                : <Navigate to="/login" replace />
            } 
          />
          <Route
            path="/candidate/interview-result/:interviewId"
            element={
              user && user.role === 'candidate'
                ? <InterviewResultPage userName={user.name} userRole={user.role} onLogout={handleLogoutRequest} />
                : <Navigate to="/login" replace />
            }
          />
           <Route
            path="/ai-tools"
            element={
                user
                ? <AIToolsPage userName={user.name} userRole={user.role} onLogout={handleLogoutRequest} />
                : <Navigate to="/login" replace />
            }
          />
           <Route
            path="/interview/:interviewId"
            element={
                user && user.role === 'candidate'
                ? <InterviewPage />
                : <Navigate to="/login" replace />
            }
          />
           <Route
            path="/certificate/:interviewId"
            element={<CertificatePage />}
          />
          <Route 
            path="*" 
            element={<Navigate to="/" replace />} 
          />
        </Routes>
      </main>
      <Chatbot />
      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out of your account?"
      />
    </div>
  );
};

const App: React.FC = () => (
    <ThemeProvider>
        <AppContent />
    </ThemeProvider>
);

export default App;