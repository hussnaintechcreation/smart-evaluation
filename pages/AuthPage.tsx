import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { formatCNIC, validateCNIC } from '../utils/cnic';
import { Hero3D } from '../components/Hero3D';
import { SmartEvaluationIcon } from '../components/common/SmartEvaluationIcon';
import { BrandFooter } from '../components/common/BrandFooter';
import { useTheme } from '../contexts/ThemeContext';


interface AuthPageProps {
  onAuth: (role: 'admin' | 'candidate', name: string) => void;
  onDemoLogin: () => void;
}

type AuthMode = 'login' | 'signup';
type LoginRole = 'candidate' | 'admin';

const AuthPage: React.FC<AuthPageProps> = ({ onAuth, onDemoLogin }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loginRole, setLoginRole] = useState<LoginRole>('candidate');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [cnic, setCnic] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();

  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNIC(e.target.value);
    setCnic(formatted);
  };

  const clearFormState = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setCnic('');
    setError('');
  }

  const handleModeChange = (newMode: AuthMode) => {
    clearFormState();
    setMode(newMode);
  };

  const handleLoginRoleChange = (newRole: LoginRole) => {
    clearFormState();
    setLoginRole(newRole);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      if (mode === 'signup') {
        if (!validateCNIC(cnic)) {
          setError('Invalid CNIC format. Please use #####-#######-#.');
          setIsLoading(false);
          return;
        }
        if (!fullName || !email || !password) {
          setError('Please fill in all required fields.');
          setIsLoading(false);
          return;
        }
        console.log('Signing up user:', { fullName, email, cnic });
        onAuth('candidate', fullName);
      } else { // Login mode
        if (loginRole === 'admin' && email.toLowerCase() === 'admin@htc.com' && password === 'admin123') {
          onAuth('admin', 'HUSSNAIN');
        } else if (loginRole === 'candidate' && email.toLowerCase() === 'candidate@htc.com' && password === 'candidate123') {
          onAuth('candidate', 'HUSSNAIN');
        } else {
            setError('Invalid email or password.');
            setIsLoading(false);
        }
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4">
      <div className="absolute inset-0 z-0">
          <Hero3D />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        <div className={`p-8 ${theme.cardBgClass} backdrop-blur-xl border ${theme.borderColorClass} rounded-2xl shadow-2xl shadow-cyan-500/10`}>
            <div className="text-center mb-8">
              <SmartEvaluationIcon />
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Welcome to the future of interviewing.
              </p>
            </div>

            <div className={`flex justify-center mb-8 bg-slate-200 dark:bg-gray-800/50 p-1 rounded-lg`}>
              <button
                onClick={() => handleModeChange('login')}
                className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${
                  mode === 'login' ? `bg-cyan-600 text-white` : `text-gray-500 dark:text-gray-400 hover:bg-slate-300 dark:hover:bg-gray-700/50`
                }`}
                style={mode === 'login' ? { background: `linear-gradient(to right, ${theme.gradientFromHex}, ${theme.gradientToHex})` } : {}}
              >
                Login
              </button>
              <button
                onClick={() => handleModeChange('signup')}
                className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${
                  mode === 'signup' ? `bg-cyan-600 text-white` : `text-gray-500 dark:text-gray-400 hover:bg-slate-300 dark:hover:bg-gray-700/50`
                }`}
                style={mode === 'signup' ? { background: `linear-gradient(to right, ${theme.gradientFromHex}, ${theme.gradientToHex})` } : {}}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  {mode === 'login' ? (
                    <div className="space-y-4">
                        <div className="flex justify-center mb-4 bg-slate-200/50 dark:bg-gray-800/30 p-1 rounded-lg text-xs">
                          <button
                            type="button"
                            onClick={() => handleLoginRoleChange('candidate')}
                            className={`w-1/2 py-1.5 font-semibold rounded-md transition-colors ${
                              loginRole === 'candidate' ? `bg-cyan-600/50 text-white` : `text-gray-500 dark:text-gray-400`
                            }`}
                            style={loginRole === 'candidate' ? { backgroundColor: `${theme.gradientFromHex}50` } : {}}
                          >
                            Candidate Login
                          </button>
                          <button
                           type="button"
                           onClick={() => handleLoginRoleChange('admin')}
                           className={`w-1/2 py-1.5 font-semibold rounded-md transition-colors ${
                              loginRole === 'admin' ? `bg-purple-600/50 text-white` : `text-gray-500 dark:text-gray-400`
                            }`}
                             style={loginRole === 'admin' ? { backgroundColor: `purple` } : {}} // Using a hardcoded purple for admin for distinction.
                          >
                            Admin Login
                          </button>
                        </div>
                      <Input
                        id="email-login"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      <Input
                        id="password-login"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Input
                        id="fullName-signup"
                        type="text"
                        placeholder="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                      <Input
                        id="email-signup"
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                       <Input
                        id="password-signup"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Input
                        id="cnic-signup"
                        type="text"
                        placeholder="CNIC (#####-#######-#)"
                        value={cnic}
                        onChange={handleCnicChange}
                        maxLength={15}
                        required
                      />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
              
              {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}

              <div className="mt-8">
                <Button type="submit" className="w-full" loading={isLoading}>
                  {mode === 'login' ? `Login as ${loginRole}` : 'Create Account'}
                </Button>
                {mode === 'login' && loginRole === 'candidate' && (
                  <Button type="button" onClick={onDemoLogin} className="w-full mt-3" variant="secondary">
                    Login with Demo
                  </Button>
                )}
              </div>
            </form>
        </div>
        <BrandFooter />
      </motion.div>
    </div>
  );
};

export default AuthPage;