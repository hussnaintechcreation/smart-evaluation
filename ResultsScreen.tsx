/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import './ResultsScreen.css';

interface Analysis {
    summary: string;
    strengths: string[];
    areasForImprovement: string[];
}

export const ResultsScreen = ({ interviewLog }) => {
    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!interviewLog || interviewLog.length === 0) {
            setError("No interview data was provided to generate a report.");
            setIsLoading(false);
            return;
        }

        const generateAnalysis = async () => {
            setIsLoading(true);
            setError('');
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

                const transcript = interviewLog.map((item, index) => 
                    `Question ${index + 1}: ${item.question}\nAnswer ${index + 1}: ${item.answer}`
                ).join('\n\n');

                const prompt = `
                    Based on the following interview transcript for a 'Senior Frontend Developer' role, provide a concise performance analysis.
                    The analysis should be constructive and professional, suitable for a hiring manager's review.
                    
                    Transcript:
                    ${transcript}

                    Provide your analysis in a structured JSON format.
                `;
                
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: prompt,
                    config: {
                        systemInstruction: "You are an expert technical recruiter AI. Your task is to analyze an interview transcript and provide a summary, key strengths, and areas for improvement.",
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                summary: { type: Type.STRING, description: "A brief overall summary of the candidate's performance." },
                                strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of the candidate's key strengths." },
                                areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of potential areas for improvement or further discussion." }
                            },
                            required: ["summary", "strengths", "areasForImprovement"]
                        }
                    }
                });

                const jsonStr = response.text.trim();
                const result = JSON.parse(jsonStr);
                setAnalysis(result);

            } catch (e) {
                console.error(e);
                setError('Failed to generate performance analysis. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        generateAnalysis();
    }, [interviewLog]);

    const handleDownload = () => {
        alert("Certificate download functionality coming soon!");
    }
    
    const candidateName = "Valued Candidate"; // Name could be passed in later
    const certificateId = `SI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const qrText = `Certificate ID: ${certificateId}\nCandidate: ${candidateName}\nVerified by Smart Interview AI`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrText)}`;


    return (
        <div className="results-screen-container">
            <div className="certificate-wrapper">
                <div className="certificate">
                    <div className="cert-border-top"></div>
                    <div className="cert-border-right"></div>
                    <div className="cert-border-bottom"></div>
                    <div className="cert-border-left"></div>
                    <div className="cert-content">
                        <div className="cert-header">
                            <div className="logo-small"></div>
                            <h1>Smart Interview AI</h1>
                            <h2>Certificate of Completion</h2>
                        </div>
                        <div className="cert-body">
                            <p className="cert-intro">This is to certify that</p>
                            <h3 className="cert-name">{candidateName}</h3>
                            <p className="cert-details">
                                has successfully completed the AI-powered screening interview for the role of <strong>Senior Frontend Developer</strong>.
                            </p>
                            <p className="cert-date">Issued on: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <div className="cert-footer">
                            <div className="cert-verification">
                                <img src={qrCodeUrl} alt="Certificate Verification QR Code" className="qr-code" />
                                <div className="verification-text">
                                    <span>Verifiable Certificate</span>
                                    <span>ID: {certificateId}</span>
                                </div>
                            </div>
                            <div className="cert-seal">
                                <div className="seal-text">Official Seal</div>
                            </div>
                        </div>
                    </div>
                </div>
                <button onClick={handleDownload} className="download-cert-button">Download Certificate</button>
            </div>

            <div className="analysis-wrapper">
                <h2>AI Performance Analysis</h2>
                {isLoading && (
                    <div className="spinner-container">
                        <div className="spinner-big"></div>
                        <p>Analyzing interview...</p>
                    </div>
                )}
                {error && <div className="error-message">{error}</div>}
                {analysis && !isLoading && (
                    <div className="analysis-content">
                        <div className="analysis-section">
                            <h3>Overall Summary</h3>
                            <p>{analysis.summary}</p>
                        </div>
                        <div className="analysis-section">
                            <h3>
                               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></svg>
                                Key Strengths
                            </h3>
                            <ul>
                                {analysis.strengths.map((strength, i) => (
                                    <li key={i}>{strength}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="analysis-section">
                            <h3>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"></path></svg>
                                Areas for Improvement
                            </h3>
                             <ul>
                                {analysis.areasForImprovement.map((area, i) => (
                                    <li key={i}>{area}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};