/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef, useCallback } from 'react';
// FIX: LiveSession is not an exported member of @google/genai. It has been removed from the import and is now defined locally as an interface.
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import './InterviewScreen.css';

// FIX: The `Blob` type is not exported by the `@google/genai` library. It must be defined locally as an interface.
interface Blob {
  data: string;
  mimeType: string;
}

// FIX: The `LiveSession` type is not exported by the `@google/genai` library. It must be defined locally as an interface.
interface LiveSession {
  close: () => void;
  sendRealtimeInput: (input: { media: Blob }) => void;
}

// Proposed type for an item in interviewHistory[x].interviewLog
interface InterviewLogEntry {
  id: string; // New: Unique ID for the log entry
  question: string;
  answer: string;
  videoData?: string; // Base64 encoded video
  videoMimeType?: string;
  videoUrl?: string; // Local URL for playback
  manualScore?: number | null; // New: Manual score given by interviewer (0-100)
}

// Base64 encoding/decoding helpers for audio data
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// Helper to convert Blob to Base64
const blobToBase64 = (blob: globalThis.Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (reader.result) {
                resolve(reader.result as string);
            } else {
                reject(new Error("Failed to read blob as Base64"));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

// REFACTOR: Function to dynamically generate the system instruction
const createSystemInstruction = (details) => {
    return `You are a friendly and professional interviewer for a "${details.jobTitle}" position. 
    The job description is: "${details.jobDescription}".
    Start with a short greeting, then ask around 5 questions covering these categories: ${details.categories.join(', ')}. 
    Keep your questions concise. After the last question, thank the candidate and say 'The interview is now complete.' to clearly signal the end.`;
};


export const InterviewScreen = ({ onComplete, interviewDetails }) => {
    const [interviewState, setInterviewState] = useState<'idle' | 'in_progress' | 'review'>('idle');
    const [transcript, setTranscript] = useState<{ speaker: 'model' | 'user'; text: string; isFinal: boolean }[]>([]);
    const [error, setError] = useState('');
    const [aiFeedback, setAiFeedback] = useState<{ encouragement: string; suggestion: string } | null>(null);
    const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
    const [remainingTime, setRemainingTime] = useState(interviewDetails.timer);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    // FEAT: State to trigger feedback animation
    const [animateFeedback, setAnimateFeedback] = useState(false);
    
    // Media and API refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<globalThis.Blob[]>([]);
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const sources = useRef(new Set<AudioBufferSourceNode>()).current;
    const nextStartTime = useRef(0);
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    
    // Refs for managing transcription updates
    const currentInputTranscription = useRef('');
    const currentOutputTranscription = useRef('');

    useEffect(() => {
        // Scroll to the latest message
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    // Timer countdown logic
    useEffect(() => {
        if (!isTimerRunning || remainingTime <= 0) {
            return;
        }

        const intervalId = setInterval(() => {
            setRemainingTime(prev => prev - 1);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [isTimerRunning, remainingTime]);

    const setupMedia = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            streamRef.current = stream;
        } catch (err) {
            console.error("Media access error:", err);
            setError("Camera and Microphone access is required. Please enable permissions and refresh the page.");
        }
    };

    useEffect(() => {
        setupMedia();
        return () => {
            streamRef.current?.getTracks().forEach(track => track.stop());
            sessionPromiseRef.current?.then(session => session.close());
        };
    }, []);

    const generateFeedback = async (answer: string) => {
        if (!answer.trim()) return;

        setIsFeedbackLoading(true);
        setAnimateFeedback(false); // Reset animation state
        setAiFeedback(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `The candidate just gave this answer in a job interview: "${answer}". Provide one brief, encouraging comment and one constructive suggestion for improvement. Keep the tone friendly and supportive, like a coach.`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            encouragement: { type: Type.STRING, description: "A short, positive and encouraging comment about the answer." },
                            suggestion: { type: Type.STRING, description: "A brief, constructive tip for how the candidate could improve their next answer." }
                        },
                        required: ["encouragement", "suggestion"]
                    }
                }
            });

            const jsonStr = response.text.trim();
            const result = JSON.parse(jsonStr);
            setAiFeedback(result);
            setAnimateFeedback(true); // Trigger animation on new feedback

        } catch (e) {
            console.error("Failed to generate real-time feedback:", e);
        } finally {
            setIsFeedbackLoading(false);
        }
    };


    const startInterview = async () => {
        if (!streamRef.current) {
            setError("Media stream is not available. Please check permissions.");
            return;
        }
        setInterviewState('in_progress');
        setTranscript([]);
        recordedChunksRef.current = [];
        setRemainingTime(interviewDetails.timer);
        setIsTimerRunning(true);
        setAnimateFeedback(false); // Reset animation at interview start


        // Start video recording
        mediaRecorderRef.current = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunksRef.current.push(event.data);
            }
        };
        mediaRecorderRef.current.start();
        
        // Setup audio contexts
        const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const outputNode = outputAudioContextRef.current.createGain();

        const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

        sessionPromiseRef.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    const source = inputAudioContext.createMediaStreamSource(streamRef.current!);
                    const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        sessionPromiseRef.current?.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputAudioContext.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    // Handle Transcription
                    if (message.serverContent?.inputTranscription) {
                        const { text } = message.serverContent.inputTranscription;
                        currentInputTranscription.current += text;
                        setTranscript(prev => {
                            const last = prev[prev.length - 1];
                            if (last?.speaker === 'user' && !last.isFinal) {
                                return [...prev.slice(0, -1), { speaker: 'user', text: currentInputTranscription.current, isFinal: false }];
                            }
                            return [...prev, { speaker: 'user', text: currentInputTranscription.current, isFinal: false }];
                        });
                    }
                    if (message.serverContent?.outputTranscription) {
                        const { text } = message.serverContent.outputTranscription;
                        currentOutputTranscription.current += text;
                         setTranscript(prev => {
                            const last = prev[prev.length - 1];
                            if (last?.speaker === 'model' && !last.isFinal) {
                                return [...prev.slice(0, -1), { speaker: 'model', text: currentOutputTranscription.current, isFinal: false }];
                            }
                            return [...prev, { speaker: 'model', text: currentOutputTranscription.current, isFinal: false }];
                        });
                    }
                    if (message.serverContent?.turnComplete) {
                        const finalInput = currentInputTranscription.current;
                        setTranscript(prev => prev.map(t => ({...t, isFinal: true})));
                        
                        if(finalInput) {
                            generateFeedback(finalInput);
                        }
                        
                        currentInputTranscription.current = '';
                        currentOutputTranscription.current = '';
                        setRemainingTime(interviewDetails.timer); // Reset timer for the next question
                    }
                    
                    if (currentOutputTranscription.current.includes("The interview is now complete.")) {
                        setIsTimerRunning(false);
                    }

                    // Handle Audio
                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                    if (base64Audio) {
                        nextStartTime.current = Math.max(nextStartTime.current, outputAudioContextRef.current!.currentTime);
                        const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current!, 24000, 1);
                        const source = outputAudioContextRef.current!.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputNode);
                        source.addEventListener('ended', () => { sources.delete(source); });
                        source.start(nextStartTime.current);
                        nextStartTime.current += audioBuffer.duration;
                        sources.add(source);
                    }
                },
                onerror: (e: ErrorEvent) => setError(`An error occurred: ${e.message}`),
                onclose: () => console.log('Session closed.'),
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                systemInstruction: createSystemInstruction(interviewDetails),
                inputAudioTranscription: {},
                outputAudioTranscription: {},
            },
        });
    };

    const stopInterview = () => {
        setIsTimerRunning(false);
        sessionPromiseRef.current?.then(session => session.close());
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.onstop = () => {
                setInterviewState('review');
            };
            mediaRecorderRef.current.stop();
        } else {
            setInterviewState('review');
        }
    };
    
    const handleSubmitInterview = async () => { // Made async to await blobToBase64
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const videoBase64 = await blobToBase64(blob); // Convert to Base64
        
        // The URL.createObjectURL(blob) is still good for local playback in the review screen
        const localVideoUrl = URL.createObjectURL(blob); 

        // FEAT: Add unique ID and manualScore to the interview log entry
        const interviewLog: InterviewLogEntry[] = [{
            id: `log-${Date.now()}`, // Unique ID for the full conversational log
            question: "Full Conversational Interview",
            answer: transcript.map(t => `${t.speaker === 'user' ? 'Candidate' : 'Interviewer'}: ${t.text}`).join('\n\n'),
            videoData: videoBase64, // Store Base64 data
            videoMimeType: 'video/webm', // Store MIME type
            videoUrl: localVideoUrl, // Keep for local playback in review
            manualScore: null, // Initialize manual score
        }];
        onComplete(interviewLog);
    };

    const TimerCircle = () => {
        const radius = 45;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (remainingTime / interviewDetails.timer) * circumference;
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
    
        let strokeColorClass = 'timer-path-high';
        const percentage = (remainingTime / interviewDetails.timer);
        if (percentage < 0.5) strokeColorClass = 'timer-path-medium';
        if (percentage < 0.2) strokeColorClass = 'timer-path-low';
        if (remainingTime <= 0) strokeColorClass = 'timer-path-zero';
    
        return (
            <div className="timer-container">
                <svg className="timer-svg" viewBox="0 0 100 100">
                    <g className="timer-circle">
                        <circle className="timer-path-elapsed" r={radius} cx="50" cy="50" />
                        <path
                            className={`timer-path-remaining ${strokeColorClass}`}
                            strokeDasharray={`${circumference} ${circumference}`}
                            style={{ strokeDashoffset: offset }}
                            d={`
                                M 50, 50
                                m -${radius}, 0
                                a ${radius},${radius} 0 1,0 ${radius * 2},0
                                a ${radius},${radius} 0 1,0 -${radius * 2},0
                            `}
                        />
                    </g>
                </svg>
                <div className="timer-label" aria-live="polite" aria-atomic="true">
                    {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                </div>
            </div>
        );
    };


    if (error) {
        return (
            <div className="interview-screen-container centered-error">
                <div className="error-display">
                    <h3>An Error Occurred</h3>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (interviewState === 'review') {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        return (
            <div className="interview-review-container">
                 <header className="page-header">
                    <h2>Review Your Interview</h2>
                    <p>Please review your full interview video and the transcript before submitting.</p>
                </header>
                <div className="review-content-grid">
                    <div className="review-video-section">
                        <h3>Full Interview Recording</h3>
                        <video controls src={url} className="review-video-player" title="Full interview recording"></video>
                    </div>
                    <div className="review-transcript-section">
                        <h3>Full Transcript</h3>
                        <div className="transcript-box review-transcript">
                             {transcript.map((msg, index) => (
                                <div key={index} className={`message ${msg.speaker}`}>
                                    <strong>{msg.speaker === 'model' ? 'Interviewer' : 'You'}:</strong> {msg.text}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <button onClick={handleSubmitInterview} className="submit-interview-button">
                    Submit Interview
                </button>
            </div>
        );
    }
    
    return (
        <div className="interview-screen-container">
            <div className="interview-layout-grid">
                <div className="left-panel">
                    <div className="video-preview-container">
                        <video ref={videoRef} className="video-preview" autoPlay muted playsInline></video>
                         {interviewState === 'in_progress' && (
                            <>
                                <div className="recording-indicator">LIVE</div>
                                <TimerCircle />
                            </>
                         )}
                    </div>
                    <div className="interview-controls">
                        {interviewState === 'idle' && (
                            <button className="control-button start" onClick={startInterview}>Start Interview</button>
                        )}
                        {interviewState === 'in_progress' && (
                            <button className="control-button stop" onClick={stopInterview}>End Interview</button>
                        )}
                    </div>
                     <div className="ai-coach-panel">
                        <h3>AI Coach</h3>
                        <div className="coach-content">
                            {isFeedbackLoading ? (
                                <div className="coach-spinner-container">
                                    <div className="spinner"></div>
                                    <span>Analyzing...</span>
                                </div>
                            ) : aiFeedback ? (
                                <>
                                    <div className={`feedback-item encouragement ${animateFeedback ? 'fade-in-up' : ''}`}>
                                        <span className="feedback-icon" aria-label="Encouragement">👍</span>
                                        <p>{aiFeedback.encouragement}</p>
                                    </div>
                                    <div className={`feedback-item suggestion ${animateFeedback ? 'fade-in-up' : ''}`}>
                                         <span className="feedback-icon" aria-label="Suggestion">💡</span>
                                        <p>{aiFeedback.suggestion}</p>
                                    </div>
                                </>
                            ) : (
                                <p className="coach-placeholder">Feedback will appear here after you answer.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="transcript-container live">
                    <h3>Live Conversation</h3>
                    <div className="transcript-box live-transcript">
                        {transcript.length === 0 ? (
                             <span className="placeholder-text">The conversation will appear here...</span>
                        ) : (
                            transcript.map((msg, index) => (
                                <div key={index} className={`message ${msg.speaker} ${msg.isFinal ? '' : 'interim'}`}>
                                    <strong>{msg.speaker === 'model' ? 'Interviewer' : 'You'}:</strong> {msg.text}
                                </div>
                            ))
                        )}
                         <div ref={transcriptEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
};