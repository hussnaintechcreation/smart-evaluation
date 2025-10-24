/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import './ResultsAnalytics.css';

interface Evaluation {
    clarity: number;
    relevance: number;
    technicalAccuracy: number;
    completeness: number;
    overallScore: number;
    summary: string;
    strengths: string[];
    areasForImprovement: string[];
}

// FIX: Define the ScoreIndicator component
interface ScoreIndicatorProps {
    label: string;
    score: number;
}

const ScoreIndicator = ({ label, score }: ScoreIndicatorProps) => {
    // Determine color class based on score for visual feedback
    let scoreClass = '';
    if (score >= 8) {
        scoreClass = 'score-high';
    } else if (score >= 5) {
        scoreClass = 'score-medium';
    } else {
        scoreClass = 'score-low';
    }

    return (
        <div className="score-indicator" role="meter" aria-valuenow={score} aria-valuemin={1} aria-valuemax={10} aria-label={`${label} score: ${score} out of 10`}>
            <span className="score-label">{label}:</span>
            <span className={`score-value ${scoreClass}`}>{score}/10</span>
        </div>
    );
};

export const ResultsAnalytics = ({ candidates, onUpdateCandidate }) => {
    const [candidatesAwaitingReview, setCandidatesAwaitingReview] = useState([]);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    // New state for video analysis
    const [videoAnalysisResult, setVideoAnalysisResult] = useState<any | null>(null);
    const [isVideoAnalyzing, setIsVideoAnalyzing] = useState(false);
    const [videoAnalysisError, setVideoAnalysisError] = useState('');


    useEffect(() => {
        const awaitingReview = candidates.filter(c => c.status === 'Awaiting Review');
        setCandidatesAwaitingReview(awaitingReview);
        if (!selectedCandidate || !awaitingReview.find(c => c.id === selectedCandidate.id)) {
            setSelectedCandidate(awaitingReview.length > 0 ? awaitingReview[0] : null);
        }
    }, [candidates, selectedCandidate]);
    
    // Reset evaluation and video analysis when candidate changes
    useEffect(() => {
        setEvaluation(null);
        setError('');
        setVideoAnalysisResult(null);
        setVideoAnalysisError('');
    }, [selectedCandidate]);


    const handleApprove = () => {
        if (!selectedCandidate || !evaluation) return;
        
        const latestInterview = selectedCandidate.interviewHistory.find(h => h.score === null);
        
        const updatedCandidate = {
            ...selectedCandidate,
            status: 'Approved',
            interviewHistory: selectedCandidate.interviewHistory.map(h => 
                h.id === latestInterview.id ? { ...h, score: evaluation.overallScore } : h
            ),
        };
        onUpdateCandidate(updatedCandidate);
    };

    const handleEvaluate = async () => {
        if (!selectedCandidate) return;

        setIsLoading(true);
        setError('');
        setEvaluation(null);

        const latestInterview = selectedCandidate.interviewHistory.find(h => h.score === null);
        if (!latestInterview || !latestInterview.interviewLog || latestInterview.interviewLog.length === 0) {
            setError("No valid interview transcript found to evaluate for this candidate.");
            setIsLoading(false);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const transcript = latestInterview.interviewLog[0].answer; // Assuming conversational log is in one 'answer' field

            const prompt = `
                **Task:** Evaluate the following interview transcript for a '${latestInterview.jobTitle}' role and provide both a quantitative and qualitative analysis.

                **Transcript:**
                ---
                ${transcript}
                ---

                **Evaluation Instructions:**
                Your response MUST be in the specified JSON format.
                1.  **Quantitative Scoring (Scale of 1-10):** Assess Clarity, Relevance, Technical Accuracy, and Completeness for the candidate's answers.
                2.  **Overall Score:** Calculate a weighted score out of 100 using this formula: (Technical Accuracy * 4) + (Completeness * 3) + (Relevance * 2) + (Clarity * 1).
                3.  **Qualitative Analysis:** Write a professional summary, and list 2-3 key strengths and 2-3 areas for improvement, referencing specific examples from the transcript.
            `;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    systemInstruction: "You are a senior technical hiring manager AI. Evaluate interview transcripts and provide scores and a detailed analysis in a structured JSON format.",
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            clarity: { type: Type.INTEGER, description: "Score for clarity (1-10)." },
                            relevance: { type: Type.INTEGER, description: "Score for relevance (1-10)." },
                            technicalAccuracy: { type: Type.INTEGER, description: "Score for technical accuracy (1-10)." },
                            completeness: { type: Type.INTEGER, description: "Score for completeness (1-10)." },
                            overallScore: { type: Type.INTEGER, description: "A final weighted score out of 100." },
                            summary: { type: Type.STRING, description: "A brief overall summary of the candidate's performance." },
                            strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of the candidate's key strengths." },
                            areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of potential areas for improvement." }
                        },
                        required: ["clarity", "relevance", "technicalAccuracy", "completeness", "overallScore", "summary", "strengths", "areasForImprovement"]
                    }
                }
            });
            
            const jsonStr = response.text.trim();
            const result = JSON.parse(jsonStr);
            setEvaluation(result);

        } catch (e) {
            console.error(e);
            setError('Failed to get AI evaluation. The model may be overloaded. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualScoreChange = (logId: string, newScore: number | null) => {
        if (!selectedCandidate) return;

        const updatedInterviewHistory = selectedCandidate.interviewHistory.map(interview => {
            const latestInterview = interview.score === null; // The interview awaiting review
            if (latestInterview) {
                return {
                    ...interview,
                    interviewLog: interview.interviewLog.map(log =>
                        log.id === logId ? { ...log, manualScore: newScore } : log
                    )
                };
            }
            return interview;
        });

        const updatedCandidate = {
            ...selectedCandidate,
            interviewHistory: updatedInterviewHistory
        };
        onUpdateCandidate(updatedCandidate); // Persist change to global state
        setSelectedCandidate(updatedCandidate); // Update local state for immediate re-render
    };

    const handleAnalyzeVideo = async (videoData: string, videoMimeType: string, jobTitle: string) => {
        if (!videoData || !videoMimeType) {
            setVideoAnalysisError("No video data available for analysis.");
            return;
        }

        setIsVideoAnalyzing(true);
        setVideoAnalysisError('');
        setVideoAnalysisResult(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const promptText = `
                Analyze the provided interview video for the role of "${jobTitle}".
                Provide a structured JSON output that includes:
                1.  "videoSummary": A concise summary of the candidate's overall message and responses.
                2.  "communicationStyle": Observations on their non-verbal communication, confidence, clarity, and engagement.
                3.  "keyInsights": Any significant points, strengths, or areas for further inquiry identified from the video.
                Ensure the analysis is professional and objective.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro', // Using Pro as requested for complex video tasks
                contents: [
                    { text: promptText },
                    { inlineData: { mimeType: videoMimeType, data: videoData.split(',')[1] } } // Split 'data:mime/type;base64,' prefix
                ],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            videoSummary: { type: Type.STRING, description: "A concise summary of the candidate's overall message and responses." },
                            communicationStyle: { type: Type.STRING, description: "Observations on their non-verbal communication, confidence, clarity, and engagement." },
                            keyInsights: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Any significant points, strengths, or areas for further inquiry identified from the video." }
                        },
                        required: ["videoSummary", "communicationStyle", "keyInsights"]
                    },
                    thinkingConfig: { thinkingBudget: 10000 } // Provide a decent thinking budget for video analysis
                },
            });

            const jsonStr = response.text.trim();
            const result = JSON.parse(jsonStr);
            setVideoAnalysisResult(result);

        } catch (e) {
            console.error("Gemini Video Analysis Error:", e);
            setVideoAnalysisError('Failed to analyze video. Ensure the API key is valid. The video data might be too large or the model busy, please try again.');
        } finally {
            setIsVideoAnalyzing(false);
        }
    };
    
    const AGGREGATE_DATA = {
        totalInterviews: candidates.reduce((sum, c) => sum + c.interviewHistory.length, 0),
        pendingReview: candidates.filter(c => c.status === 'Awaiting Review').length,
        approved: candidates.filter(c => c.status === 'Approved').length,
        averageScore: (() => {
            const scores = candidates
                .flatMap(c => c.interviewHistory)
                .map(h => h.score)
                .filter(s => s !== null);
            if (scores.length === 0) return 0;
            return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        })(),
    };


    return (
        <div className="results-analytics-panel">
            <header className="page-header">
                <h2>Results & Analytics</h2>
                <p>Review candidate interviews and leverage AI for detailed performance evaluation.</p>
            </header>

            <section className="analytics-summary-section">
                <h3>Platform Analytics</h3>
                <div className="stats-grid">
                    <div className="stat-card">
                        <h4>Total Interviews</h4>
                        <p>{AGGREGATE_DATA.totalInterviews}</p>
                    </div>
                    <div className="stat-card">
                        <h4>Average Score</h4>
                        <p>{AGGREGATE_DATA.averageScore}%</p>
                    </div>
                    <div className="stat-card">
                        <h4>Pending Review</h4>
                        <p>{AGGREGATE_DATA.pendingReview}</p>
                    </div>
                    <div className="stat-card">
                        <h4>Approved Candidates</h4>
                        <p>{AGGREGATE_DATA.approved}</p>
                    </div>
                </div>
            </section>

            <section className="ra-section">
                <h3>Candidate Review Pipeline</h3>
                <div className="results-layout">
                    <aside className="candidate-list-sidebar">
                        <h3>Awaiting Review ({candidatesAwaitingReview.length})</h3>
                        {candidatesAwaitingReview.length > 0 ? (
                            <div role="radiogroup" aria-label="Select a candidate to review">
                                {candidatesAwaitingReview.map(candidate => (
                                    <button
                                        key={candidate.id}
                                        role="radio"
                                        aria-checked={selectedCandidate?.id === candidate.id}
                                        className={`candidate-entry ${selectedCandidate?.id === candidate.id ? 'active' : ''}`}
                                        onClick={() => setSelectedCandidate(candidate)}
                                    >
                                        {candidate.email}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="no-candidates-message">No candidates are currently awaiting review.</p>
                        )}
                    </aside>

                    <main className="evaluation-content">
                        {selectedCandidate ? (
                            <>
                                <div className="evaluation-header">
                                    <h3>{selectedCandidate.email}</h3>
                                     <button 
                                        className="approve-button"
                                        onClick={handleApprove}
                                        disabled={!evaluation}
                                        aria-label={!evaluation ? "Evaluate first to enable approval" : `Approve ${selectedCandidate.email}`}
                                    >
                                        Approve Candidate
                                    </button>
                                </div>
                                <div className="interview-log-container">
                                    {selectedCandidate.interviewHistory.find(h => h.score === null)?.interviewLog.map((log, index) => (
                                        <div key={log.id} className="qa-card"> {/* Using log.id as key */}
                                            <div className="question-section">
                                                <strong>{log.question}:</strong>
                                            </div>
                                            <div className="answer-video-container">
                                                <div className="answer-section">
                                                    <strong>Full Transcript:</strong>
                                                    <p className="full-transcript">{log.answer}</p>
                                                </div>
                                                {(log.videoUrl || log.videoData) && (
                                                    <div className="video-playback-container">
                                                        <strong>Recorded Video:</strong>
                                                        {log.videoUrl ? (
                                                            <video
                                                                src={log.videoUrl}
                                                                controls
                                                                className="video-player"
                                                                title={`Video response for question ${index + 1}`}
                                                            >
                                                                Your browser does not support the video tag.
                                                            </video>
                                                        ) : (
                                                            <p className="no-video-message">Video not available for local playback (only Base64 data stored).</p>
                                                        )}
                                                        <button
                                                            className="analyze-video-button"
                                                            onClick={() => handleAnalyzeVideo(log.videoData, log.videoMimeType, selectedCandidate.interviewHistory.find(h => h.score === null)?.jobTitle || 'Interview')}
                                                            disabled={isVideoAnalyzing || !log.videoData}
                                                            aria-label={!log.videoData ? "No video data to analyze" : (isVideoAnalyzing ? "Analyzing video..." : "Analyze Video with Gemini Pro")}
                                                        >
                                                            {isVideoAnalyzing ? <span className="spinner"></span> : 'Analyze Video with Gemini Pro'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            {/* NEW: Manual Score Input */}
                                            <div className="manual-score-section">
                                                <label htmlFor={`manual-score-${log.id}`}>Manual Score (0-100):</label>
                                                <input
                                                    type="number"
                                                    id={`manual-score-${log.id}`}
                                                    min="0"
                                                    max="100"
                                                    value={log.manualScore ?? ''}
                                                    onChange={(e) => {
                                                        const score = e.target.value === '' ? null : parseInt(e.target.value, 10);
                                                        handleManualScoreChange(log.id, score);
                                                    }}
                                                    placeholder="N/A"
                                                    aria-label={`Manual score for question: ${log.question}`}
                                                />
                                            </div>
                                            {videoAnalysisError && (
                                                <div className="error-message video-analysis-error" role="alert">{videoAnalysisError}</div>
                                            )}
                                            {isVideoAnalyzing && !videoAnalysisResult && (
                                                <div className="spinner-container video-analysis-spinner">
                                                    <div className="spinner-big"></div>
                                                    <p>Gemini Pro is analyzing the video. This may take a moment...</p>
                                                </div>
                                            )}
                                            {videoAnalysisResult && (
                                                <div className="video-analysis-results">
                                                    <h4>Gemini Pro Video Analysis</h4>
                                                    <div className="analysis-section">
                                                        <h3>Video Summary</h3>
                                                        <p>{videoAnalysisResult.videoSummary}</p>
                                                    </div>
                                                    <div className="analysis-section">
                                                        <h3>Communication Style</h3>
                                                        <p>{videoAnalysisResult.communicationStyle}</p>
                                                    </div>
                                                    <div className="analysis-section">
                                                        <h3>Key Insights</h3>
                                                        <ul>
                                                            {videoAnalysisResult.keyInsights.map((insight, i) => (
                                                                <li key={i}>{insight}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="evaluation-section">
                                    <button onClick={handleEvaluate} disabled={isLoading} className="evaluate-button">
                                        {isLoading && <span className="spinner"></span>}
                                        {isLoading ? 'Evaluating...' : 'Run AI Evaluation'}
                                    </button>
                                    <div aria-live="polite" aria-busy={isLoading}>
                                        {error && <div className="error-message" role="alert">{error}</div>}
                                        {evaluation && (
                                            <div className="evaluation-results">
                                                <h4>AI Performance Analysis</h4>
                                                
                                                <div className="analysis-section">
                                                    <h3>Overall Summary</h3>
                                                    <p>{evaluation.summary}</p>
                                                </div>

                                                <div className="analysis-section">
                                                    <h3 className="strengths-header">
                                                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></svg>
                                                        Key Strengths
                                                    </h3>
                                                    <ul>
                                                        {evaluation.strengths.map((strength, i) => (
                                                            <li key={i} className="strength-item">{strength}</li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div className="analysis-section">
                                                    <h3 className="improvements-header">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"></path></svg>
                                                        Areas for Improvement
                                                    </h3>
                                                     <ul>
                                                        {evaluation.areasForImprovement.map((area, i) => (
                                                            <li key={i} className="improvement-item">{area}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                
                                                <div className="scores-section">
                                                    <h4>Quantitative Scores</h4>
                                                    <div className="scores-grid">
                                                        <ScoreIndicator label="Clarity" score={evaluation.clarity} />
                                                        <ScoreIndicator label="Relevance" score={evaluation.relevance} />
                                                        <ScoreIndicator label="Technical Accuracy" score={evaluation.technicalAccuracy} />
                                                        <ScoreIndicator label="Completeness" score={evaluation.completeness} />
                                                    </div>
                                                    <div className="overall-score-container" role="meter" aria-valuenow={evaluation.overallScore} aria-valuemin={0} aria-valuemax={100} aria-label={`Overall Score: ${evaluation.overallScore} out of 100`}>
                                                        Overall Score:
                                                        <span className="overall-score-value">{evaluation.overallScore}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="no-candidate-selected">
                                <p>Select a candidate from the left to view their interview results.</p>
                            </div>
                        )}
                    </main>
                </div>
            </section>
        </div>
    );
};