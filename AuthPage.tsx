import React, { useState } from 'react';
import './AuthPage.css';

const Footer = () => (
    <footer className="app-footer">
        <div className="logo-small"></div>
        <span>Powered by HUSSNAIN'S TECH CREATION PVT LTD. (OWNER AND APP DEVELOPER)</span>
    </footer>
);


export const AuthPage = ({ onLogin, onShowDownloadModal, candidates, onAddCandidates }) => {
  const [portal, setPortal] = useState<'admin' | 'candidate' | null>(null);
  const [authView, setAuthView] = useState('login'); // 'login' or 'signup'
  // FEAT: Expanded state for detailed signup form
  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [cnic, setCnic] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handlePortalSelect = (selectedPortal: 'admin' | 'candidate') => {
    setPortal(selectedPortal);
    setAuthView('login'); // Reset to login view when switching portals
    setError(''); // Clear errors
  };

  const handleBack = () => {
    setPortal(null);
    setError('');
  };
  
  // FEAT: Format CNIC with dashes as the user types
  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove all non-digit characters
    if (value.length > 5) {
      value = `${value.slice(0, 5)}-${value.slice(5)}`;
    }
    if (value.length > 13) {
      value = `${value.slice(0, 13)}-${value.slice(13)}`;
    }
    setCnic(value.slice(0, 15)); // Enforce max length
  };


  const handleAuth = (e) => {
    e.preventDefault();
    setError('');

    if (authView === 'signup') {
      // FEAT: Detailed validation for the new signup fields
      if (portal === 'candidate') {
          if (!name || !fatherName || !gender || !dob || !cnic) {
              setError('All fields are required for signup.');
              return;
          }
          if (!/^\d{5}-\d{7}-\d{1}$/.test(cnic)) {
              setError('Please enter a valid CNIC (e.g., 12345-1234567-1).');
              return;
          }
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (candidates.some(c => c.email.toLowerCase() === email.toLowerCase())) {
        setError('An account with this email already exists.');
        return;
      }
      
      if (portal === 'candidate') {
        const maxId = candidates.length > 0 ? Math.max(...candidates.map(c => c.id)) : 0;
        const newCandidate = {
          id: maxId + 1,
          name: name.trim(),
          fatherName: fatherName.trim(),
          gender,
          dob,
          cnic,
          email: email,
          status: 'Pending',
          interviewHistory: [],
        };
        onAddCandidates([newCandidate]);
      }

      console.log(`New ${portal} signed up: ${name}, ${email}`);
      onLogin(portal!);
      return;
    }

    // Login Logic
    if (portal === 'admin') {
        const validAdminUsernames = ['admin', 'admin@example.com', 'hussnaintechcreation@gmail.com'];
        if (validAdminUsernames.includes(email) && password === '12345') { // Updated admin password
            onLogin('admin');
        } else {
            setError('Invalid username or password.');
        }
    } else { // Candidate login
        const candidate = candidates.find(c => c.email.toLowerCase() === email.toLowerCase());
        if (candidate && password === '12345') { // Updated candidate password
            onLogin('candidate', candidate.id);
        } else {
            setError('Invalid email or password. For demo, use a registered candidate email and "12345".');
        }
    }
  };

  const toggleAuthView = () => {
    setAuthView(authView === 'login' ? 'signup' : 'login');
    setError('');
    setName('');
    setFatherName('');
    setGender('');
    setDob('');
    setCnic('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  }

  const getSignupHint = () => {
      if (portal === 'admin') {
          return "Create an admin account to manage interviews, candidates, and settings.";
      }
      return "Create your candidate account to begin the interview process.";
  }

  return (
    <div className="auth-container">
      <div className={`auth-form-wrapper ${portal ? 'form-visible' : 'landing-visible'}`}>
        <div className="auth-content-container">
            <header className="auth-header">
              <div className="logo" aria-hidden="true"></div>
              <h1>Smart Interview AI</h1>
              <p>The future of recruitment is here.</p>
            </header>
            
            {!portal ? (
                <div className="landing-view">
                    <button className="portal-button" onClick={() => handlePortalSelect('admin')}>
                        Enter Admin Portal
                    </button>
                    <button className="portal-button secondary" onClick={() => handlePortalSelect('candidate')}>
                        Enter Candidate Portal
                    </button>
                    <div className="auth-divider"></div>
                    <button className="download-app-button" onClick={onShowDownloadModal}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z"/></svg>
                        Download the App
                    </button>
                </div>
            ) : (
                <div className="form-view">
                    <button onClick={handleBack} className="back-button" aria-label="Go back to portal selection">
                        &larr;
                    </button>
                    <form className="auth-form" onSubmit={handleAuth} noValidate>
                        <p className="form-hint" id="form-description">
                            {authView === 'login' 
                            ? (portal === 'admin' ? 'Log in to manage interviews.' : 'Log in to start your interview.')
                            : getSignupHint()
                            }
                        </p>
                        
                        {authView === 'signup' && (
                            <>
                              <div className="input-group">
                                  <label htmlFor="name" className="sr-only">Full Name</label>
                                  <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full Name"/>
                              </div>
                              {/* FEAT: New detailed signup fields */}
                              {portal === 'candidate' && (
                                <>
                                  <div className="input-group">
                                      <label htmlFor="fatherName" className="sr-only">Father's Name</label>
                                      <input type="text" id="fatherName" value={fatherName} onChange={(e) => setFatherName(e.target.value)} required placeholder="Father's Name" />
                                  </div>
                                  <div className="form-row">
                                    <div className="input-group">
                                        <label htmlFor="gender" className="sr-only">Gender</label>
                                        <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)} required>
                                            <option value="" disabled>Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label htmlFor="dob" className="sr-only">Date of Birth</label>
                                        <input type="date" id="dob" value={dob} onChange={(e) => setDob(e.target.value)} required title="Date of Birth" />
                                    </div>
                                  </div>
                                  <div className="input-group">
                                      <label htmlFor="cnic" className="sr-only">CNIC</label>
                                      <input type="text" id="cnic" value={cnic} onChange={handleCnicChange} required placeholder="CNIC (e.g., 12345-1234567-1)" maxLength={15} />
                                  </div>
                                </>
                              )}
                            </>
                        )}

                        <div className="input-group">
                            <label htmlFor="email" className="sr-only">{portal === 'admin' ? 'Username or Email' : 'Email'}</label>
                            <input 
                            type="text" 
                            id="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                            placeholder={portal === 'admin' ? 'Username or Email' : 'Email'}
                            autoComplete="username"
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input 
                            type="password" 
                            id="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                            placeholder="Password"
                            autoComplete={authView === 'login' ? 'current-password' : 'new-password'}
                            />
                        </div>

                        {authView === 'signup' && (
                            <div className="input-group">
                            <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
                            <input 
                                type="password" 
                                id="confirmPassword" 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required 
                                placeholder="Confirm Password"
                                autoComplete="new-password"
                            />
                            </div>
                        )}

                        {error && <div className="error-message" role="alert">{error}</div>}
                        <button type="submit" className="auth-button">
                            {authView === 'login' 
                            ? `Login to ${portal === 'admin' ? 'Admin Portal' : 'Interview'}`
                            : `Create ${portal === 'admin' ? 'Admin' : 'Candidate'} Account`
                            }
                        </button>
                    </form>

                    <p className="toggle-auth-view">
                        {authView === 'login' ? "Don't have an account?" : "Already have an account?"}
                        <button onClick={toggleAuthView}>
                            {authView === 'login' ? 'Sign Up' : 'Login'}
                        </button>
                    </p>
                </div>
            )}
        </div>
        <Footer />
      </div>
    </div>
  );
};