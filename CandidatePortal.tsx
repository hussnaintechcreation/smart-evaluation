import React, { useState, useEffect, useRef, useCallback } from 'react';
import './CandidatePortal.css';
import { InterviewScreen } from './InterviewScreen';
import { ResultsScreen } from './ResultsScreen';

const themes = [
    {
        name: 'Smart Interview (Default)',
        id: 'default',
        colors: {
            '--primary-bg': '#0D1117',
            '--secondary-bg': '#161B22',
            '--card-bg': '#1E242C',
            '--primary-accent': '#A78BFA',
            '--secondary-accent': '#8B949E',
            '--text-primary': '#F0F6FC',
            '--text-secondary': '#C9D1D9',
            '--border-color': '#30363D',
        }
    },
    {
        name: 'Candid.ai (Light)',
        id: 'candid',
        colors: {
            '--primary-bg': '#F7F9FC',
            '--secondary-bg': '#FFFFFF',
            '--card-bg': '#FFFFFF',
            '--primary-accent': '#007BFF',
            '--secondary-accent': '#6C757D',
            '--text-primary': '#212529',
            '--text-secondary': '#6C757D',
            '--border-color': '#DEE2E6',
        }
    }
];

const StatusIcon = ({ status }: { status: 'ok' | 'pending' }) => {
    if (status === 'ok') {
        return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>;
    }
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>;
};

const Footer = () => (
    <footer className="app-footer">
        <div className="logo-small"></div>
        <span>Powered by HUSSNAIN'S TECH CREATION PVT LTD. (OWNER AND APP DEVELOPER)</span>
    </footer>
);

// FIX: Add `candidateId` to the component's props to fix the TypeScript error.
export const CandidatePortal = ({ onLogout, setTheme, currentTheme, onShowDownloadModal, candidates, onUpdateCandidate, candidateId }) => {
    const [pageState, setPageState] = useState('dashboard'); // 'dashboard', 'interview', 'completed'
    const [systemCheck, setSystemCheck] = useState({ camera: false, mic: false });
    const [error, setError] = useState('');
    const [completedInterviewLog, setCompletedInterviewLog] = useState(null);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    
    // FIX: Use the `candidateId` prop to find the correct candidate instead of relying on status.
    const currentCandidate = candidates.find(c => c.id === candidateId);
    const assignedInterview = currentCandidate?.interviewHistory.find(h => h.score === null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const visualizerRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameIdRef = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Effect to start system check on mount
    useEffect(() => {
        if (pageState === 'dashboard') {
            setupMedia();
        }
        return () => {
            cleanupMedia();
        };
    }, [pageState]);

    const drawVisualizer = useCallback((analyser: AnalyserNode, dataArray: Uint8Array) => {
        if (!visualizerRef.current) return;
        
        const canvas = visualizerRef.current;
        const canvasCtx = canvas.getContext('2d');
        analyser.getByteFrequencyData(dataArray);
    
        if (canvasCtx) {
            const WIDTH = canvas.width;
            const HEIGHT = canvas.height;
            canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
            
            const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
            const barWidth = (average / 255) * WIDTH;

            const gradient = canvasCtx.createLinearGradient(0, 0, WIDTH, 0);
            gradient.addColorStop(0, '#66bb6a');
            gradient.addColorStop(0.7, '#ffc107');
            gradient.addColorStop(1, '#e57373');
            
            canvasCtx.fillStyle = gradient;
            canvasCtx.fillRect(0, 0, barWidth, HEIGHT);
        }
        animationFrameIdRef.current = requestAnimationFrame(() => drawVisualizer(analyser, dataArray));
    }, []);

    const setupMedia = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    setSystemCheck(prev => ({ ...prev, camera: true }));
                };
            }

            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            const analyser = audioContextRef.current.createAnalyser();
            analyser.fftSize = 32;
            source.connect(analyser);
            
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            setSystemCheck(prev => ({ ...prev, mic: true }));
            
            animationFrameIdRef.current = requestAnimationFrame(() => drawVisualizer(analyser, dataArray));

        } catch (err) {
            console.error("Media access error:", err);
            setError("Camera and Microphone access is required. Please enable permissions in your browser settings and refresh the page.");
        }
    };
    
    const cleanupMedia = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
    };

    const handleStartInterview = () => {
        if (systemCheck.camera && systemCheck.mic) {
            cleanupMedia();
            setPageState('interview');
        } else {
            setError("Please ensure your camera and microphone are working and permissions are granted.");
        }
    };

    const handleInterviewComplete = (log) => {
        // REFACTOR: Update the central state with the completed interview
        const updatedCandidate = {
            ...currentCandidate,
            status: 'Awaiting Review',
            interviewHistory: currentCandidate.interviewHistory.map(h => 
                h.id === assignedInterview.id ? { ...h, interviewLog: log } : h
            )
        };
        onUpdateCandidate(updatedCandidate);
        setCompletedInterviewLog(log);
        setPageState('completed');
    };

    const handleLogoutClick = () => {
        setIsLogoutModalOpen(true);
    };

    const handleConfirmLogout = () => {
        setIsLogoutModalOpen(false);
        onLogout();
    };

    const renderContent = () => {
        switch (pageState) {
            case 'interview':
                return <InterviewScreen 
                            onComplete={handleInterviewComplete} 
                            interviewDetails={assignedInterview}
                        />;
            case 'completed':
                return <ResultsScreen interviewLog={completedInterviewLog} />;
            case 'dashboard':
            default:
                const isSystemCheckOk = systemCheck.camera && systemCheck.mic;
                return (
                    <div className="candidate-dashboard">
                        <header className="dashboard-header">
                            <h1>Interview Dashboard</h1>
                            <p>Welcome, {currentCandidate?.name || 'Candidate'}! Please review the details and check your system before you begin.</p>
                        </header>

                        {error && <div className="error-display full-width" role="alert">{error}</div>}

                        {currentCandidate ? (
                             <div className="dashboard-grid">
                                {assignedInterview &&
                                    <div className="dashboard-panel overview-panel">
                                        <h3>Next Interview</h3>
                                        <div className="overview-item">
                                            <span>Role</span>
                                            <p>{assignedInterview.jobTitle}</p>
                                        </div>
                                        <div className="overview-item">
                                            <span>Number of Questions</span>
                                            <p>~5</p>
                                        </div>
                                        <div className="overview-item">
                                            <span>Time per Question</span>
                                            <p>{assignedInterview.timer} seconds</p>
                                        </div>
                                        <p className="overview-advice">
                                            Find a quiet space and ensure a stable internet connection for the best experience. Good luck!
                                        </p>
                                    </div>
                                }
                                <div className="dashboard-panel system-check-panel">
                                    <h3>System Check</h3>
                                    <div className="system-check-item">
                                        <video ref={videoRef} className="system-check-video" autoPlay muted playsInline></video>
                                        <div className={`status-indicator ${systemCheck.camera ? 'ok' : 'pending'}`}>
                                            <StatusIcon status={systemCheck.camera ? 'ok' : 'pending'} /> Camera
                                        </div>
                                    </div>
                                    <div className="system-check-item">
                                        <canvas ref={visualizerRef} className="mic-visualizer"></canvas>
                                        <div className={`status-indicator ${systemCheck.mic ? 'ok' : 'pending'}`}>
                                            <StatusIcon status={systemCheck.mic ? 'ok' : 'pending'} /> Microphone
                                        </div>
                                    </div>
                                </div>
                                <div className="dashboard-panel interview-history-panel">
                                    <h3>My Interview History</h3>
                                    <div className="interview-history-list">
                                        {currentCandidate.interviewHistory.length > 0 ? (
                                            currentCandidate.interviewHistory.map(interview => {
                                                const isCompleted = interview.score !== null;
                                                const statusText = isCompleted 
                                                    ? `Completed: ${interview.score}%` 
                                                    : interview.id === assignedInterview?.id ? 'Ready to Start' : 'Pending';
                                                
                                                let statusClass = 'pending';
                                                if (isCompleted) statusClass = 'completed';
                                                if (currentCandidate.status === 'Awaiting Review' && !isCompleted) statusClass = 'review';


                                                return (
                                                    <div key={interview.id} className={`history-entry ${statusClass}`}>
                                                        <div className="history-info">
                                                            <h4>{interview.role || interview.jobTitle}</h4>
                                                            <span>{interview.date}</span>
                                                        </div>
                                                        <div className={`history-status status-${statusClass}`}>
                                                            {statusText}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="no-history-message">You have no interview history yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="dashboard-panel no-interview-panel">
                                <h3>No Interview Assigned</h3>
                                <p>There are currently no interviews assigned to you. Please check back later or contact the recruiter.</p>
                            </div>
                        )}
                        
                        {assignedInterview && (
                            <div className="start-interview-container">
                                <button 
                                    className="start-interview-button" 
                                    onClick={handleStartInterview}
                                    disabled={!isSystemCheckOk}
                                >
                                    {isSystemCheckOk ? 'Begin Interview' : 'System Check in Progress...'}
                                </button>
                                {!isSystemCheckOk && !error && <p className="system-check-wait-text">Please allow camera and microphone access to continue.</p>}
                            </div>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="candidate-portal-container">
            {isLogoutModalOpen && (
                <div className="modal-overlay" onClick={() => setIsLogoutModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Confirm Logout</h2>
                        <p>Are you sure you want to log out of your candidate portal?</p>
                        <div className="modal-actions">
                            <button className="modal-button primary" onClick={handleConfirmLogout}>Yes, Log Out</button>
                            <button className="modal-button" onClick={() => setIsLogoutModalOpen(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
            <header className="candidate-header">
                <div className="candidate-brand">
                    <div className="logo" aria-hidden="true"></div>
                    <h2>Smart Interview</h2>
                </div>
                {pageState === 'dashboard' && (
                     <div className="candidate-header-actions">
                        <div className="theme-toggle-portal" role="group" aria-label="Theme selection">
                            {themes.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTheme(t.colors)}
                                    className={JSON.stringify(currentTheme) === JSON.stringify(t.colors) ? 'active' : ''}
                                    aria-pressed={JSON.stringify(currentTheme) === JSON.stringify(t.colors)}
                                    aria-label={`Switch to ${t.name} theme`}
                                    title={`Switch to ${t.name} theme`}
                                >
                                    {t.id === 'default' ? 
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M11.1 12.08c-2.33-4.51-.5-8.48.53-10.07-1.26.13-2.5.53-3.62 1.25-1.45.92-2.5 2.24-3.22 3.84-.73 1.6-1.02 3.32-.82 5.06.2 1.75.85 3.4 1.84 4.8.98 1.4 2.28 2.53 3.8 3.25.58.27 1.18.48 1.79.62-.18-.94-.3-1.9-.3-2.91-.01-.96.08-1.92.23-2.86.15-.94.38-1.86.64-2.75.27-.9.59-1.78.94-2.62z"/></svg> :
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.03-.17.06-.33.1-.5H2v1zm2.59-2.09L3.17 9.5l1.42-1.42 1.42 1.42-1.42 1.42zM12 3c-.04 0-.08.01-.12.01L12 5V3zm7.41 6.91l-1.42-1.42 1.42-1.42 1.42 1.42-1.42 1.42zM20 12.5h2c-.04-.17-.07-.33-.1-.5H20v1zM17.99 15.5l1.42 1.42-1.42 1.42-1.42-1.42 1.42-1.42zM12 21c.04 0 .08-.01.12-.01L12 19v2zM4.59 15.5l1.42 1.42-1.42 1.42-1.42-1.42 1.42-1.42z"/></svg>
                                    }
                                </button>
                            ))}
                        </div>
                        <button onClick={onShowDownloadModal} className="candidate-download-button">Download App</button>
                        <button onClick={handleLogoutClick} className="candidate-logout-button">Logout</button>
                    </div>
                )}
            </header>
            <main className="candidate-main">
                {renderContent()}
            </main>
            <Footer />
        </div>
    );
};