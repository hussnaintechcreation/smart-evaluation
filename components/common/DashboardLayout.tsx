import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { Shield, User, Bot } from 'lucide-react';
import { SmartEvaluationIcon } from './SmartEvaluationIcon';
import { ThemeSelector } from './ThemeToggle'; // Changed from ThemeToggle to ThemeSelector
import { useTheme } from '../../contexts/ThemeContext';

interface DashboardLayoutProps {
  userName: string;
  userRole: 'admin' | 'candidate';
  onLogout: () => void;
  title: string;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ userName, userRole, onLogout, title, children }) => {
  const { theme } = useTheme();

  const roleConfig = {
    admin: { icon: <Shield size={12} />, color: `${theme.isDark ? 'text-purple-100 bg-purple-500/50' : 'text-purple-800 bg-purple-200'}` },
    candidate: { icon: <User size={12} />, color: `${theme.isDark ? 'text-cyan-100 bg-cyan-500/50' : 'text-cyan-800 bg-cyan-200'}` },
  };
  const currentRole = roleConfig[userRole];

  return (
    <div className="p-4 md:p-8">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
              <SmartEvaluationIcon iconOnly />
              <h1 className={`text-3xl font-bold ${theme.textColorClass}`}>{title}</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
            <span>Welcome back, {userName}</span>
            <span className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full capitalize ${currentRole.color}`}>
              {currentRole.icon}
              {userRole}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
            <ThemeSelector /> {/* Changed to ThemeSelector */}
            <Link to="/ai-tools">
                <Button variant="secondary">
                    <Bot size={16} className="mr-2"/> AI Tools
                </Button>
            </Link>
            <Button onClick={onLogout} variant="secondary">Logout</Button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
};