/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
// FIX: Declare THREE to inform TypeScript that it's available on the global scope, likely from a script tag.
declare const THREE: any;

import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AuthPage } from './AuthPage';
import { AdminPanel } from './AdminPanel';
import { CandidateManagement, initialCandidates } from './CandidateManagement';
import { CustomInterviewBuilder } from './CustomInterviewBuilder';
import { ThemeSettings } from './ThemeSettings';
import { CandidatePortal } from './CandidatePortal';
import { ResultsAnalytics } from './ResultsAnalytics';
import { CandidateProfile } from './CandidateProfile';
// FEAT: Import the new OrganizationSelector component
import { OrganizationSelector } from './OrganizationSelector';

// REFACTOR: The default theme is now light mode to improve readability and provide a clean, modern look.
const defaultTheme: {[key: string]: string} = {
  '--primary-bg': '#F7F9FC',
  '--secondary-bg': '#FFFFFF',
  '--card-bg': '#FFFFFF',
  '--primary-accent': '#007BFF',
  '--secondary-accent': '#6C757D',
  '--text-primary': '#212529',
  '--text-secondary': '#6C757D',
  '--border-color': '#DEE2E6',
};

const THEME_STORAGE_KEY = 'smartInterview_theme';
const CANDIDates_STORAGE_KEY = 'smartInterview_candidates';
const TEMPLATES_STORAGE_KEY = 'smartInterview_templates';

const Footer = () => (
    <footer className="app-footer">
        <div className="logo-small"></div>
        <span>Powered by HUSSNAIN'S TECH CREATION PVT LTD. (OWNER AND APP DEVELOPER)</span>
    </footer>
);

const App = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentCandidateId, setCurrentCandidateId] = useState<number | null>(null);
  const [hash, setHash] = useState(window.location.hash);
  const [theme, setThemeState] = useState(defaultTheme);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  // FEAT: State to manage the selected organization for admins
  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null);
  
  // REFACTOR: Centralized state for the entire application
  const [candidates, setCandidates] = useState(() => {
    const saved = localStorage.getItem(CANDIDates_STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialCandidates;
  });
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  
  // REFACTOR: Persist centralized state to localStorage
  useEffect(() => {
    localStorage.setItem(CANDIDates_STORAGE_KEY, JSON.stringify(candidates));
  }, [candidates]);
  
  useEffect(() => {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  }, [templates]);

  // Global Toast Notification handler
  useEffect(() => {
    if (toast.visible) {
        const timer = setTimeout(() => {
            setToast({ message: '', visible: false });
        }, 3500);
        return () => clearTimeout(timer);
    }
  }, [toast]);

  // FEAT: Add a body class when on the auth page to enforce the dark theme.
  useEffect(() => {
    if (!userRole) {
        document.body.classList.add('auth-page-active');
    } else {
        document.body.classList.remove('auth-page-active');
    }
  }, [userRole]);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
  };
  
  const showDownloadModal = () => {
    setIsModalOpen(true);
  };
  
  // Load saved theme from localStorage on initial render
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) {
        setThemeState(JSON.parse(savedTheme));
      } else {
        setThemeState(defaultTheme); // Set default if nothing is saved
      }
    } catch (e) {
      console.error("Failed to parse theme from localStorage", e);
      setThemeState(defaultTheme);
    }
  }, []);

  // 3D Background Effect
  useEffect(() => {
    // Check if THREE is available
    // FIX: Check for the global THREE object directly, which is made available by the declaration at the top of the file.
    if (typeof THREE !== 'undefined' && THREE) {
      let camera, scene, renderer, globe, animationFrameId;
      const accentColor = new THREE.Color(theme['--primary-accent']);

      const init = () => {
          const container = document.getElementById('three-bg');
          if (!container) return;
          camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
          camera.position.z = 25;

          scene = new THREE.Scene();

          renderer = new THREE.WebGLRenderer({
              canvas: container,
              alpha: true
          });
          renderer.setPixelRatio(window.devicePixelRatio);
          renderer.setSize(window.innerWidth, window.innerHeight);

          const geometry = new THREE.SphereGeometry(15, 64, 64);
          const material = new THREE.MeshBasicMaterial({
              color: accentColor,
              wireframe: true
          });

          globe = new THREE.Mesh(geometry, material);
          scene.add(globe);

          window.addEventListener('resize', onWindowResize, false);
          animate();
      }

      const onWindowResize = () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
      }

      const animate = () => {
          animationFrameId = requestAnimationFrame(animate);
          if (globe) {
            globe.rotation.x += 0.0005;
            // REFACTOR: Increased rotation speed for a more dynamic background.
            globe.rotation.y += 0.0015;
          }
          renderer.render(scene, camera);
      }

      init();
      
      return () => {
          cancelAnimationFrame(animationFrameId);
          window.removeEventListener('resize', onWindowResize);
          if(globe && scene) {
            scene.remove(globe);
            globe.geometry.dispose();
            globe.material.dispose();
          }
          if(renderer) {
            renderer.dispose();
          }
      };
    }
  }, [theme]);

  // Handle hash changes for navigation
  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Apply theme to the document root and save to localStorage
  useEffect(() => {
    for (const key in theme) {
      document.documentElement.style.setProperty(key, theme[key]);
    }
    try {
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
    } catch (e) {
        console.error("Failed to save theme to localStorage", e);
    }
  }, [theme]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
  };

  const handleLogin = (role: string, candidateId?: number) => {
    setUserRole(role);
    if (role === 'candidate') {
      setCurrentCandidateId(candidateId || null);
      window.location.hash = '#/portal';
    } else {
      // Admin will be shown the organization selector first, no hash change needed yet
    }
  };
  
  // FEAT: Handle organization selection
  const handleSelectOrganization = (orgName: string) => {
      setSelectedOrganization(orgName);
      window.location.hash = '#/dashboard';
  };

  const handleLogout = () => {
    setUserRole(null);
    setSelectedOrganization(null); // Reset organization on logout
    setCurrentCandidateId(null);
    window.location.hash = ''; // Clear hash on logout
  };
  
  const navigateTo = (path) => {
      window.location.hash = path;
  };
  
    // REFACTOR: Data manipulation handlers for centralized state
    const handleSaveTemplate = (newTemplate) => {
        setTemplates(prev => [...prev, newTemplate]);
    };

    const handleDeleteTemplate = (templateId) => {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
    };

    const handleUpdateCandidate = (updatedCandidate) => {
        setCandidates(prev => prev.map(c => c.id === updatedCandidate.id ? updatedCandidate : c));
    };

    const handleAddCandidates = (newCandidates) => {
        setCandidates(prev => [...newCandidates, ...prev]);
    };

    const handleDeleteCandidate = (candidateId) => {
        setCandidates(prev => prev.filter(c => c.id !== candidateId));
    };

  const navLinks = [
    { name: 'Dashboard', hash: '#/dashboard', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg> },
    { name: 'Candidates', hash: '#/candidates', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg> },
    { name: 'Interview Builder', hash: '#/builder', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M14.06 9.02l.92.92L5.92 19H5v-.92l9.06-9.06M17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29zm-3.6 3.19L3 17.25V21h3.75L17.81 9.94l-3.75-3.75z"/></svg> },
    { name: 'Results & Analytics', hash: '#/analytics', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg> },
    { name: 'Theme Settings', hash: '#/settings', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg> }
  ];

  const renderAdminContent = () => {
    const currentHash = hash || '#/dashboard';
    
    if (currentHash.startsWith('#/candidates/')) {
      const candidateId = parseInt(currentHash.split('/')[2], 10);
      return <CandidateProfile 
                candidateId={candidateId} 
                candidates={candidates}
                templates={templates}
                onUpdateCandidate={handleUpdateCandidate}
                navigate={navigateTo}
                // FEAT: Pass organization to profile
                organization={selectedOrganization}
             />;
    }

    switch (currentHash) {
      case '#/dashboard':
        return <AdminPanel candidates={candidates} templates={templates} />;
      case '#/candidates':
        return <CandidateManagement 
                    candidates={candidates}
                    onAddCandidates={handleAddCandidates}
                    onDeleteCandidate={handleDeleteCandidate}
                    navigate={navigateTo} 
                />;
      case '#/builder':
        return <CustomInterviewBuilder 
                    templates={templates} 
                    onSaveTemplate={handleSaveTemplate} 
                    onDeleteTemplate={handleDeleteTemplate}
                    // FEAT: Pass organization to builder
                    organization={selectedOrganization}
                />;
      case '#/analytics':
        return <ResultsAnalytics 
                    candidates={candidates}
                    onUpdateCandidate={handleUpdateCandidate}
                />;
      case '#/settings':
        return <ThemeSettings setTheme={setTheme} defaultTheme={defaultTheme} />;
      default:
        if(userRole === 'admin' && hash !== '#/dashboard') {
             window.location.hash = '#/dashboard';
        }
        return <AdminPanel candidates={candidates} templates={templates} />;
    }
  };

  if (!userRole) {
    return <AuthPage 
              onLogin={handleLogin} 
              onShowDownloadModal={showDownloadModal} 
              candidates={candidates}
              onAddCandidates={handleAddCandidates}
            />;
  }
  
  // FEAT: Show organization selector if admin is logged in but no org is selected
  if (userRole === 'admin' && !selectedOrganization) {
      return <OrganizationSelector onSelectOrganization={handleSelectOrganization} />;
  }
  
  if (userRole === 'candidate') {
    return <CandidatePortal 
              onLogout={handleLogout} 
              setTheme={setTheme} 
              currentTheme={theme} 
              onShowDownloadModal={showDownloadModal}
              candidates={candidates}
              onUpdateCandidate={handleUpdateCandidate}
              // FEAT: Pass the specific candidate ID to the portal
              candidateId={currentCandidateId}
            />;
  }

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {isModalOpen && (
            <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <h2>Download Our App</h2>
                    <p>Native desktop and mobile apps are coming soon to enhance your experience. Get notified when they launch!</p>
                    <div className="modal-actions">
                        <button className="modal-button primary" onClick={() => { alert('You will be notified!'); setIsModalOpen(false); }}>Notify Me</button>
                        <button className="modal-button" onClick={() => setIsModalOpen(false)}>Close</button>
                    </div>
                </div>
            </div>
        )}
        {userRole === 'admin' && ( // Conditionally render toggle button for admins only
            <button 
                className="sidebar-toggle" 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24" width="24"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/></svg>
            </button>
        )}
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo"></div>
                <div className="sidebar-title-wrapper">
                  <h1>{selectedOrganization || 'Smart Interview'}</h1>
                  <span className="admin-label">ADMIN</span>
                </div>
            </div>
            <nav className="sidebar-nav">
                {navLinks.map(link => (
                    // REFACTOR: Logic now supports nested accordions for future sub-menus.
                    (link as any).children ? (
                        <div key={link.name} className="nav-accordion">
                            <button
                                onClick={() => {
                                    if (isSidebarCollapsed) {
                                        setIsSidebarCollapsed(false);
                                        // Wait for sidebar to expand before opening accordion
                                        setTimeout(() => setOpenAccordion(openAccordion === link.name ? null : link.name), 300);
                                    } else {
                                        setOpenAccordion(openAccordion === link.name ? null : link.name);
                                    }
                                }}
                                className={`nav-item ${openAccordion === link.name ? 'accordion-open' : ''}`}
                                aria-expanded={openAccordion === link.name}
                                aria-controls={`submenu-${link.name}`}
                            >
                                <div className="nav-item-icon" aria-hidden="true">{link.icon}</div>
                                <span className="nav-item-label">{link.name}</span>
                                <svg className="accordion-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/></svg>
                            </button>
                            <div
                                id={`submenu-${link.name}`}
                                className={`accordion-content ${openAccordion === link.name ? 'open' : ''}`}
                            >
                                {(link as any).children.map(child => (
                                    <button
                                        key={child.name}
                                        onClick={(e) => { e.preventDefault(); navigateTo(child.hash); }}
                                        className={`nav-item nav-sub-item ${hash === child.hash ? 'active' : ''}`}
                                    >
                                       {/* Sub-items could have icons too, if defined */}
                                       {child.icon && <div className="nav-item-icon" aria-hidden="true">{child.icon}</div>}
                                       <span className="nav-item-label">{child.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <button 
                            key={link.name} 
                            onClick={(e) => { e.preventDefault(); navigateTo(link.hash); }}
                            className={`nav-item ${hash === link.hash ? 'active' : ''}`}
                        >
                            <div className="nav-item-icon" aria-hidden="true">{link.icon}</div>
                            <span className="nav-item-label">{link.name}</span>
                        </button>
                    )
                ))}
            </nav>
            <div className="sidebar-footer">
                <button className="download-app-sidebar-button" onClick={showDownloadModal}>
                   <div className="nav-item-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z"/></svg>
                   </div>
                   <span className="nav-item-label">Download App</span>
                </button>
                <button className="logout-button" onClick={handleLogout}>
                   <div className="nav-item-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
                   </div>
                   <span className="nav-item-label">Logout</span>
                </button>
            </div>
        </aside>
        <main className="main-content">
            <div className="content-wrapper">
                {renderAdminContent()}
            </div>
            <Footer />
        </main>
        {toast.visible && <div className="global-toast">{toast.message}</div>}
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);