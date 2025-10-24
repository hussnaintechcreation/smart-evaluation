import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import './CandidateProfile.css';

const NOTES_STORAGE_PREFIX = 'smartInterview_profile_';

export const CandidateProfile = ({ candidateId, candidates, templates, onUpdateCandidate, navigate, organization }) => {
    const [candidate, setCandidate] = useState(null);
    const [editableName, setEditableName] = useState('');
    const [notes, setNotes] = useState('');
    const [rating, setRating] = useState(0);
    const [saveState, setSaveState] = useState('idle'); // 'idle', 'saving', 'saved'
    const notesEditorRef = useRef<HTMLDivElement>(null);
    const [analysis, setAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [expandedInterviewId, setExpandedInterviewId] = useState<string | null>(null);

    useEffect(() => {
        const foundCandidate = candidates.find(c => c.id === candidateId);
        if (foundCandidate) {
            setCandidate(foundCandidate);
            setEditableName(foundCandidate.name);
            const savedProfile = localStorage.getItem(`${NOTES_STORAGE_PREFIX}${candidateId}`);
            if (savedProfile) {
                const { notes: savedNotes, rating: savedRating } = JSON.parse(savedProfile);
                setNotes(savedNotes || '');
                setRating(savedRating || 0);
            } else {
                setNotes('');
                setRating(0);
            }
            setAnalysis(null);
            setIsAnalyzing(false);
            setAnalysisError('');
            setSelectedTemplateId('');
            setExpandedInterviewId(null); // Collapse on candidate change
        } else {
            setCandidate(null);
        }
    }, [candidateId, candidates]);
    
    useEffect(() => {
        if (notesEditorRef.current && notesEditorRef.current.innerHTML !== notes) {
            notesEditorRef.current.innerHTML = notes;
        }
    }, [notes, candidateId]);


    const handleSave = () => {
        setSaveState('saving');
        const profileData = JSON.stringify({ notes, rating });
        
        setTimeout(() => {
            localStorage.setItem(`${NOTES_STORAGE_PREFIX}${candidateId}`, profileData);
            setSaveState('saved');
            setTimeout(() => setSaveState('idle'), 2000);
        }, 500);
    };
    
    const getStatusClass = (status) => `status-${status.toLowerCase().replace(/ /g, '')}`;

    const applyFormat = (command: string) => {
        document.execCommand(command, false, undefined);
        if (notesEditorRef.current) setNotes(notesEditorRef.current.innerHTML);
        notesEditorRef.current?.focus();
    };
    
    const handleAssignInterview = () => {
        if (!selectedTemplateId) {
            alert("Please select an interview template to assign.");
            return;
        }
        const template = templates.find(t => t.id === parseInt(selectedTemplateId));
        if (!template) {
            alert("Selected template not found.");
            return;
        }

        const newInterviewEntry = {
            id: `int-${Date.now()}`,
            role: template.jobTitle,
            date: new Date().toISOString().slice(0, 10),
            score: null,
            interviewLog: [],
            // FEAT: Assign the current organization's name to the interview
            company: organization,
            ...template 
        };
        
        const updatedCandidate = {
            ...candidate,
            status: 'Pending',
            interviewHistory: [newInterviewEntry, ...candidate.interviewHistory]
        };
        onUpdateCandidate(updatedCandidate);
        alert(`Interview "${template.jobTitle}" from ${organization} assigned to ${candidate.name}.`);
    };


    const handleGenerateAnalysis = async () => {
        const latestInterview = candidate?.interviewHistory?.find(h => h.interviewLog && h.interviewLog.length > 0);

        if (!latestInterview || !latestInterview.interviewLog) {
            setAnalysisError("No interview transcript found for this candidate to analyze.");
            return;
        }

        setIsAnalyzing(true);
        setAnalysisError('');
        setAnalysis(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const transcript = latestInterview.interviewLog[0].answer; // Full transcript is in the first log's answer

            const prompt = `
                Analyze the following interview transcript for the role of "${latestInterview.role}". Provide a constructive, professional analysis suitable for a hiring manager's review.

                Transcript:
                ${transcript}

                Your response MUST be in the specified JSON format.
            `;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    systemInstruction: "You are an expert technical recruiter AI.",
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            summary: { type: Type.STRING },
                            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                            areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["summary", "strengths", "areasForImprovement"]
                    }
                }
            });
            
            const result = JSON.parse(response.text.trim());
            setAnalysis(result);

        } catch (e) {
            console.error("AI Analysis Error:", e);
            setAnalysisError("Failed to generate analysis. The model might be busy. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditableName(e.target.value);
    };

    const handleNameBlur = () => {
        const trimmedName = editableName.trim();
        if (candidate && candidate.name !== trimmedName && trimmedName !== '') {
            onUpdateCandidate({ ...candidate, name: trimmedName });
        } else if (candidate) {
            // Revert to original name if input is cleared
            setEditableName(candidate.name);
        }
    };


    if (!candidate) {
        return (
            <div className="candidate-profile-panel">
                <header className="page-header">
                    <h2>Candidate Not Found</h2>
                    <p>The selected candidate could not be found. They may have been removed.</p>
                    <button className="back-link" onClick={() => navigate('#/candidates')}>
                        ← Back to All Candidates
                    </button>
                </header>
            </div>
        );
    }
    
    const canAnalyze = candidate?.interviewHistory?.some(h => h.interviewLog && h.interviewLog.length > 0);
    // FEAT: Filter templates to only show those belonging to the current organization
    const availableTemplates = templates.filter(t => t.organization === organization);


    return (
        <div className="candidate-profile-panel">
            <header className="profile-page-header">
                <button className="back-to-list-button" onClick={() => navigate('#/candidates')}>
                    &larr; Back to All Candidates
                </button>
                <div className="profile-header-content">
                    <div>
                        <input
                            type="text"
                            className="editable-header-name"
                            value={editableName}
                            onChange={handleNameChange}
                            onBlur={handleNameBlur}
                            aria-label="Candidate Name (editable)"
                        />
                        <p>{candidate.email}</p>
                    </div>
                    <div className={`status-badge-large ${getStatusClass(candidate.status)}`}>
                        {candidate.status}
                    </div>
                </div>
            </header>

            <div className="profile-layout">
                <div className="profile-main-content">
                     {/* FEAT: Assign Interview Section */}
                    <section className="profile-section assign-interview-section">
                        <h3>Assign New Interview from {organization}</h3>
                        {availableTemplates.length > 0 ? (
                            <div className="assign-controls">
                                <select 
                                    value={selectedTemplateId} 
                                    onChange={e => setSelectedTemplateId(e.target.value)}
                                    className="template-select"
                                >
                                    <option value="" disabled>Select an interview template...</option>
                                    {availableTemplates.map(template => (
                                        <option key={template.id} value={template.id}>
                                            {template.jobTitle}
                                        </option>
                                    ))}
                                </select>
                                <button 
                                    onClick={handleAssignInterview} 
                                    disabled={!selectedTemplateId}
                                    className="assign-button"
                                >
                                    Assign Interview
                                </button>
                            </div>
                        ) : (
                            <p className="no-templates-message">
                                No interview templates found for {organization}. 
                                <a href="#/builder" onClick={(e) => { e.preventDefault(); navigate('#/builder'); }}>Create one in the builder.</a>
                            </p>
                        )}
                    </section>
                
                    {/* New Section for Candidate Details */}
                    <section className="profile-section candidate-details-section">
                        <h3>Candidate Information</h3>
                        <div className="details-grid">
                            <div className="detail-row">
                                <span className="detail-label">Father's Name:</span>
                                <span>{candidate.fatherName || 'N/A'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Gender:</span>
                                <span>{candidate.gender || 'N/A'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Date of Birth:</span>
                                <span>{candidate.dob || 'N/A'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">CNIC:</span>
                                <span>{candidate.cnic || 'N/A'}</span>
                            </div>
                        </div>
                    </section>

                    <section className="profile-section" aria-labelledby="notes-heading">
                        <h3 id="notes-heading">Private Notes</h3>
                        <div className="notes-editor-container" tabIndex={-1}>
                             <div className="notes-toolbar" role="toolbar">
                                <button type="button" onClick={() => applyFormat('bold')} aria-label="Bold"><b>B</b></button>
                                <button type="button" onClick={() => applyFormat('italic')} aria-label="Italic"><i>I</i></button>
                                <button type="button" onClick={() => applyFormat('underline')} aria-label="Underline"><u>U</u></button>
                             </div>
                            <div
                                ref={notesEditorRef}
                                className="notes-editor"
                                contentEditable="true"
                                onInput={(e) => setNotes(e.currentTarget.innerHTML)}
                                aria-labelledby="notes-heading"
                                role="textbox"
                            ></div>
                        </div>
                    </section>
                    <section className="profile-section" aria-labelledby="history-heading">
                        <h3 id="history-heading">Interview History</h3>
                        <div className="interview-history-list">
                            {candidate.interviewHistory.length > 0 ? (
                                candidate.interviewHistory.map(interview => (
                                    <div key={interview.id} className={`history-item-wrapper ${expandedInterviewId === interview.id ? 'expanded' : ''}`}>
                                        <button
                                            className="history-item"
                                            onClick={() => setExpandedInterviewId(expandedInterviewId === interview.id ? null : interview.id)}
                                            aria-expanded={expandedInterviewId === interview.id}
                                            aria-controls={`transcript-${interview.id}`}
                                        >
                                            <div className="history-item-summary"> {/* New container for collapsed view */}
                                                <h4 className="history-item-role">{interview.role}</h4>
                                                <div className="history-item-score">
                                                    {interview.score !== null ? (
                                                        <span className="actual-score">{interview.score}%</span>
                                                    ) : (
                                                        <span className="pending-score">
                                                           {candidate.status === 'Awaiting Review' ? 'Awaiting Review' : 'Pending'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={`expand-icon ${expandedInterviewId === interview.id ? 'expanded' : ''}`} aria-hidden="true">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/></svg>
                                            </span>
                                        </button>
                                        {expandedInterviewId === interview.id && (
                                            <div className="history-item-expanded-content" id={`transcript-${interview.id}`} role="region">
                                                <div className="expanded-details">
                                                    <p><span className="detail-label">Company:</span> {interview.company}</p>
                                                    <p><span className="detail-label">Date:</span> {interview.date}</p>
                                                    <p><span className="detail-label">Role:</span> {interview.role}</p>
                                                </div>
                                                {interview.interviewLog && interview.interviewLog.length > 0 ? (
                                                    (interview.interviewLog[0].question === "Full Conversational Interview" && interview.interviewLog.length === 1) ? (
                                                        <div className="transcript-log conversational">
                                                            <h5>Full Transcript</h5>
                                                            <p>{interview.interviewLog[0].answer}</p>
                                                        </div>
                                                    ) : (
                                                        interview.interviewLog.map((log, index) => (
                                                            <div key={index} className="transcript-log qa-pair">
                                                                <h5>Question {index + 1}</h5>
                                                                <p className="transcript-question">{log.question}</p>
                                                                <h5>Answer</h5>
                                                                <p className="transcript-answer">{log.answer}</p>
                                                            </div>
                                                        ))
                                                    )
                                                ) : (
                                                    <p className="no-transcript">No transcript available for this interview.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="no-history">No interview history for this candidate.</p>
                            )}
                        </div>
                    </section>
                    <section className="profile-section ai-analysis-section" aria-labelledby="analysis-heading">
                        <h3 id="analysis-heading">AI-Powered Performance Analysis</h3>
                        <p className="analysis-description">
                            Leverage Gemini to analyze the candidate's latest interview transcript and generate a detailed performance report.
                        </p>
                        <button onClick={handleGenerateAnalysis} disabled={isAnalyzing || !canAnalyze} className="generate-analysis-button">
                            {isAnalyzing && <span className="spinner"></span>}
                            {isAnalyzing ? 'Analyzing...' : 'Generate AI Analysis'}
                        </button>
                         {!canAnalyze && <p className="analysis-error-message">No interview transcript available to analyze.</p>}
                        
                        <div className="analysis-results-container">
                            {isAnalyzing && (
                                <div className="spinner-container">
                                    <div className="spinner-big"></div>
                                    <p>Gemini is analyzing the interview...</p>
                                </div>
                            )}
                            {analysisError && <div className="error-message">{analysisError}</div>}
                            {analysis && !isAnalyzing && (
                                <div className="analysis-content">
                                    <div className="analysis-section">
                                        <h4>Overall Summary</h4>
                                        <p>{analysis.summary}</p>
                                    </div>
                                    <div className="analysis-section">
                                        <h4 className="strengths-header">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></svg>
                                            Key Strengths
                                        </h4>
                                        <ul>
                                            {analysis.strengths.map((strength, i) => (
                                                <li key={i} className="strength-item">{strength}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="analysis-section">
                                        <h4 className="improvements-header">
                                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"></path></svg>
                                            Areas for Improvement
                                        </h4>
                                        <ul>
                                            {analysis.areasForImprovement.map((area, i) => (
                                                <li key={i} className="improvement-item">{area}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
                <aside className="profile-sidebar">
                    <section className="profile-section">
                        <h3 id="rating-heading">Overall Rating</h3>
                         <div 
                            className="star-rating" 
                            role="radiogroup"
                            aria-labelledby="rating-heading"
                        >
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    role="radio"
                                    aria-checked={star === rating}
                                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                                    className={`star-button ${star <= rating ? 'filled' : ''}`}
                                    onClick={() => setRating(star)}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    </section>
                    <button 
                        className={`save-button ${saveState === 'saved' ? 'saved' : ''}`} 
                        onClick={handleSave}
                        disabled={saveState !== 'idle'}
                    >
                        {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved ✓' : 'Save Notes & Rating'}
                    </button>
                </aside>
            </div>
        </div>
    );
};