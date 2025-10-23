

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, Bot, AlertTriangle, Clock, Play, StopCircle, Maximize, Minimize, X, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { getGenAIClient } from '../utils/gemini';
import type { Interview, InterviewResult, RecordedAnswer, AIAnalysisData } from '../types';
import { LiveServerMessage, Modality, Type } from '@google/genai';
import { Button } from '../components/common/Button';
import { AIAnalysisPanel } from '../components/AIAnalysisPanel';
import { SmartEvaluationIcon } from '../components/common/SmartEvaluationIcon';
import { encode, blobToBase64, decode } from '../utils/audio';
import { InstructionModal } from '../components/common/InstructionModal';
import { useTheme } from '../contexts/ThemeContext';

// Define the structure for the blob sent to Gemini API
interface GeminiBlob {
  data: string;
  mimeType: string;
}

// A minimal layout for the focused interview experience
const InterviewLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { theme } = useTheme();
    return (
        <div className={`min-h-screen ${theme.primaryBgClass} ${theme.textColorClass} flex flex-col items-center p-4 md:p-8`}>
            <header className="w-full max-w-5xl mb-6">
                <SmartEvaluationIcon />
            </header>
            <main className="w-full max-w-5xl flex-1">{children}</main>
        </div>
    );
};

const QUESTION_TIME_LIMIT = 180; // 3 minutes

const InterviewPage: React.FC = () => {
    const { interviewId } = useParams();
    const navigate = useNavigate();
    
    // Core state
    const [interview, setInterview] = useState<Interview | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [videoRecordings, setVideoRecordings] = useState<Record<number, Blob>>({});
    const [transcriptChunks, setTranscriptChunks] = useState<string[]>([]); // For animating live transcript
    
    // UI/Control State
    const [isListening, setIsListening] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AIAnalysisData | null>(null);
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isInstructionModalOpen, setIsInstructionModalOpen] = useState(false);
    const [showFinishedScreen, setShowFinishedScreen] = useState(false);
    const [user, setUser] = useState<{name: string} | null>(null);
    const { theme } = useTheme();


    // Media and API Refs
    const liveVideoRef = useRef<HTMLVideoElement>(null);
    const playbackVideoRef = useRef<HTMLVideoElement>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedVideoChunks = useRef<Blob[]>([]);
    const timerIntervalRef = useRef<number | null>(null);
    const currentTranscriptionRef = useRef<string>(''); // Holds full transcript for current question

    // Initialization: Load interview data and any saved progress from localStorage
    useEffect(() => {
        try {
            const savedUser = localStorage.getItem('htc-user');
            if (savedUser) setUser(JSON.parse(savedUser));
            
            const savedInterviews = localStorage.getItem('htc-interviews');
            const interviews: Interview[] = savedInterviews ? JSON.parse(savedInterviews) : [];
            const currentInterview = interviews.find(i => i.id.toString() === interviewId);
            if (currentInterview) {
                setInterview(currentInterview);
                const instructionsSeen = localStorage.getItem(`htc-instructions-seen-${interviewId}`);
                if (!instructionsSeen) {
                    setIsInstructionModalOpen(true);
                }
                // Check for saved progress
                const savedProgress = localStorage.getItem(`htc-interview-progress-${interviewId}`);
                if (savedProgress) {
                    const { qIndex, savedAnswers, savedVideoRecordings } = JSON.parse(savedProgress);
                    setCurrentQuestionIndex(qIndex);
                    setAnswers(savedAnswers);
                    
                    // Load video recordings by converting base64 back to Blobs
                    if (savedVideoRecordings) {
                        const loadedVideoRecordings: Record<number, Blob> = {};
                        Object.keys(savedVideoRecordings).forEach(key => {
                            const base64String = savedVideoRecordings[key];
                            if (base64String) {
                                const mimeType = 'video/webm'; // Assuming constant mimeType
                                const decodedBytes = decode(base64String);
                                loadedVideoRecordings[key] = new Blob([decodedBytes], { type: mimeType });
                            }
                        });
                        setVideoRecordings(loadedVideoRecordings);
                    }
                }
            } else {
                setError("Interview not found.");
            }
        } catch (e) {
            setError("Failed to load interview. The data may be corrupted.");
            console.error(e);
        }
    }, [interviewId]);

    // Progress saving: Save current state to localStorage whenever it changes
    useEffect(() => {
        if (!interview) return;

        const saveProgress = async () => {
            // Asynchronously convert all video blobs to base64
            const savedVideoRecordings: Record<number, string> = {};
            const videoPromises = Object.keys(videoRecordings).map(async (key) => {
                const numericKey = parseInt(key, 10);
                const blob = videoRecordings[numericKey];
                if (blob) {
                    savedVideoRecordings[numericKey] = await blobToBase64(blob);
                }
            });
    
            await Promise.all(videoPromises);
    
            const progress = {
                qIndex: currentQuestionIndex,
                savedAnswers: answers,
                savedVideoRecordings,
            };
            
            try {
                localStorage.setItem(`htc-interview-progress-${interview.id}`, JSON.stringify(progress));
            } catch (e) {
                console.error("Failed to save progress to localStorage. It might be full.", e);
                setError("Could not save interview progress. Your browser storage might be full.");
            }
        };
    
        saveProgress();

    }, [currentQuestionIndex, answers, videoRecordings, interview]);

    // Timer logic
    useEffect(() => {
        if (isTimerActive) {
            timerIntervalRef.current = window.setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        handleStopListening(); // Automatically stop when timer hits 0
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
        }
        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [isTimerActive]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };
    
    const startDevices = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            if (liveVideoRef.current) {
                liveVideoRef.current.srcObject = stream;
                liveVideoRef.current.play(); // Start playing stream in local video element
            }
            return stream;
        } catch (err) {
            setError("Microphone/Camera access denied. Please allow permissions in your browser settings.");
            console.error(err);
            return null;
        }
    };
    
    const handleStartListening = async () => {
        setError('');
        const stream = await startDevices();
        if (!stream) return;
        
        // Start Video Recording
        recordedVideoChunks.current = [];
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });
        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) recordedVideoChunks.current.push(event.data);
        };
        mediaRecorderRef.current.start();
        
        // Start Gemini Live Transcription
        const ai = getGenAIClient();
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        
        sessionPromiseRef.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    mediaStreamSourceRef.current = inputAudioContextRef.current!.createMediaStreamSource(stream);
                    scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                    
                    scriptProcessorRef.current.onaudioprocess = (event) => {
                        const inputData = event.inputBuffer.getChannelData(0);
                        const l = inputData.length;
                        const int16 = new Int16Array(l);
                        for (let i = 0; i < l; i++) {
                            int16[i] = inputData[i] * 32768;
                        }
                        const pcmBlob: GeminiBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
                        
                        sessionPromiseRef.current?.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
                    };
                    
                    mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                    scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                },
                onmessage: (message: LiveServerMessage) => {
                    const newChunk = message.serverContent?.inputTranscription?.text;
                    if (newChunk) {
                        setTranscriptChunks(prev => [...prev, newChunk]); // For animating current chunk
                        currentTranscriptionRef.current += newChunk; // Update the full transcript for current question
                        
                        // Update the 'answers' state with the growing transcript for persistence
                        setAnswers(prev => ({
                            ...prev,
                            [currentQuestionIndex]: currentTranscriptionRef.current
                        }));
                    }
                },
                onerror: (e: ErrorEvent) => {
                    setError("Real-time connection error. Please stop and try answering again.");
                    console.error('Gemini Live error:', e);
                    handleStopListening(); // Attempt to clean up resources
                },
                onclose: (e: CloseEvent) => { /* console.log('closed'); */ }
            },
            config: { inputAudioTranscription: {} }
        });
        
        setIsListening(true);
        setIsTimerActive(true);
        setTimeLeft(QUESTION_TIME_LIMIT);
        currentTranscriptionRef.current = answers[currentQuestionIndex] || ''; // Reset or load existing transcript for current question
        setTranscriptChunks([]); // Clear animated chunks
    };
    
    const handleStopListening = async () => {
        if (!isListening) return; // Prevent multiple stops

        setIsListening(false);
        setIsTimerActive(false);

        // Stop video recording
        mediaRecorderRef.current?.stop();
        const videoBlob = new Blob(recordedVideoChunks.current, { type: 'video/webm' });
        setVideoRecordings(prev => ({ ...prev, [currentQuestionIndex]: videoBlob }));

        // Stop Gemini Live
        if (mediaStreamSourceRef.current && scriptProcessorRef.current) {
            mediaStreamSourceRef.current.disconnect();
            scriptProcessorRef.current.disconnect();
        }
        inputAudioContextRef.current?.close();
        sessionPromiseRef.current?.then(session => session.close()).catch(e => console.error("Error closing Gemini Live session", e));

        // Stop media stream tracks
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        if (liveVideoRef.current) liveVideoRef.current.srcObject = null;
    };

    const analyzeInterview = async () => {
        setIsAnalyzing(true);
        setError('');
        const recordedAnswers: Record<number, RecordedAnswer> = {};

        try {
            // Ensure any ongoing recording is stopped
            if (isListening) await handleStopListening();

            for (const indexStr of Object.keys(answers)) {
                const index = parseInt(indexStr, 10);
                const videoBlob = videoRecordings[index];
                let videoBase64 = '';
                if (videoBlob) {
                  videoBase64 = `data:video/webm;base64,${await blobToBase64(videoBlob)}`;
                }
                recordedAnswers[index] = {
                    transcript: answers[index] || '',
                    videoBase64: videoBase64,
                };
            }
        
            const ai = getGenAIClient();
            const analysisPrompt = `
                Analyze the following interview for a "${interview?.title}" position. The candidate's answers are provided as transcripts.
                It is crucial that your response is a single, valid JSON object that strictly adheres to the following schema, with no additional text or explanations before or after the JSON object:
                {
                    "summary": "A concise overall summary of the candidate's performance.",
                    "strengths": ["A list of key strengths, like 'Clear communication', 'Strong technical knowledge in X', etc."],
                    "improvements": ["A list of areas where the candidate could improve, like 'Could provide more specific examples', etc."],
                    "overallScore": A numerical score from 1 to 10 evaluating the overall performance,
                    "overallFeedback": "A brief paragraph justifying the score and providing final thoughts."
                }
                
                Interview Questions and Answers:
                ${interview?.questions.map((q, i) => `Question ${i+1}: ${q}\nAnswer: ${answers[i] || '(No answer provided)'}`).join('\n\n')}
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: analysisPrompt,
                config: { responseMimeType: 'application/json' }
            });
            
            let resultData: AIAnalysisData;
            try {
                resultData = JSON.parse(response.text) as AIAnalysisData;
            } catch (parseError) {
                console.error("Failed to parse AI response as JSON:", response.text, parseError);
                throw new Error("AI returned a malformed analysis. Please try submitting again.");
            }

            setAnalysisResult(resultData);
            
            if (user && interview) {
                const finalResult: InterviewResult = {
                    interviewId: interview.id,
                    candidateName: user.name,
                    analysis: resultData,
                    answers: recordedAnswers,
                    status: 'pending', // Default status for admin review
                };
                localStorage.setItem(`htc-interview-result-${interview.id}`, JSON.stringify(finalResult));
                localStorage.removeItem(`htc-interview-progress-${interview.id}`); // Clean up progress
                localStorage.removeItem(`htc-instructions-seen-${interview.id}`); // Clean up instructions flag
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during analysis. Your browser's local storage might be full or the API failed.";
            setError(errorMessage);
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const handleFinishInterview = async () => {
        await analyzeInterview();
        if (!error) {
             setShowFinishedScreen(true);
        }
    };

    const handleInstructionModalClose = () => {
        setIsInstructionModalOpen(false);
        if (interviewId) {
            localStorage.setItem(`htc-instructions-seen-${interviewId}`, 'true');
        }
    };

    const handleNextQuestion = () => {
      // Ensure current answer is saved
      if (isListening) handleStopListening();
      // Reset timer and go to next question
      setTimeLeft(QUESTION_TIME_LIMIT);
      currentTranscriptionRef.current = answers[currentQuestionIndex + 1] || ''; // Load next question's existing transcript
      setTranscriptChunks([]);
      setCurrentQuestionIndex(p => p + 1);
    };

    const handlePreviousQuestion = () => {
      // Ensure current answer is saved
      if (isListening) handleStopListening();
      // Reset timer and go to previous question
      setTimeLeft(QUESTION_TIME_LIMIT);
      currentTranscriptionRef.current = answers[currentQuestionIndex - 1] || ''; // Load prev question's existing transcript
      setTranscriptChunks([]);
      setCurrentQuestionIndex(p => p - 1);
    };


    if (!interview && !error) {
        return <InterviewLayout><div>Loading interview...</div></InterviewLayout>;
    }
    
    if (showFinishedScreen) {
        return (
            <InterviewLayout>
                <div className="text-center flex flex-col items-center justify-center h-full">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                        <Check size={80} className={`text-cyan-400 p-4 rounded-full`} style={{backgroundColor: `${theme.gradientFromHex}1A`}} />
                    </motion.div>
                    <h2 className="text-3xl font-bold mt-6">Interview Complete!</h2>
                    <p className="text-gray-400 mt-2 max-w-md">
                        Thank you for your time. Your answers have been submitted for analysis. 
                        You will be notified once the review process is complete.
                    </p>
                    <Button onClick={() => navigate('/candidate')} className="mt-8">
                        Back to Dashboard <ArrowRight className="ml-2" size={16}/>
                    </Button>
                </div>
            </InterviewLayout>
        );
    }
    
    const currentQuestion = interview?.questions[currentQuestionIndex];
    const isLastQuestion = interview ? currentQuestionIndex === interview.questions.length - 1 : false;
    const isFirstQuestion = currentQuestionIndex === 0;

    return (
        <InterviewLayout>
            <AnimatePresence>
                {isInstructionModalOpen && <InstructionModal onClose={handleInstructionModalClose} />}
            </AnimatePresence>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Panel: Video & Controls */}
                <div className="flex flex-col">
                    <div ref={videoContainerRef} className={`relative w-full aspect-video rounded-xl bg-black border-2 transition-all duration-300 ${isListening ? 'border-red-500' : theme.borderColorClass}`}>
                        <video ref={liveVideoRef} autoPlay muted playsInline className={`w-full h-full object-cover rounded-xl transition-opacity ${isPlaying ? 'opacity-0' : 'opacity-100'}`}></video>
                        <video ref={playbackVideoRef} className={`absolute inset-0 w-full h-full object-cover rounded-xl transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-0'}`} onEnded={() => setIsPlaying(false)}></video>
                        <div className="absolute top-3 right-3 flex items-center gap-2">
                           <div className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 transition-colors ${timeLeft < 30 ? 'bg-red-500/80 text-white animate-pulse' : 'bg-black/50'}`}>
                               <Clock size={16} /> {formatTime(timeLeft)}
                           </div>
                           <button onClick={() => {
                                if (document.fullscreenElement) document.exitFullscreen();
                                else videoContainerRef.current?.requestFullscreen();
                                setIsFullscreen(!isFullscreen);
                           }} className="p-2 rounded-full bg-black/50 hover:bg-black/80">
                               {isFullscreen ? <Minimize size={16}/> : <Maximize size={16} />}
                           </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-4">
                        <Button onClick={handleStartListening} disabled={isListening} className="w-40">
                            <Mic className="mr-2" /> Answer
                        </Button>
                        <Button onClick={handleStopListening} disabled={!isListening} variant="secondary" className="w-40">
                            <StopCircle className="mr-2" /> Stop
                        </Button>
                         {videoRecordings[currentQuestionIndex] && (
                            <Button
                                onClick={() => {
                                    if (playbackVideoRef.current) {
                                        playbackVideoRef.current.src = URL.createObjectURL(videoRecordings[currentQuestionIndex]);
                                        playbackVideoRef.current.play();
                                        setIsPlaying(true);
                                    }
                                }}
                                disabled={isListening || isPlaying}
                                variant="secondary"
                            >
                                <Play size={16} />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Right Panel: Question & Transcript */}
                <div className={`${theme.isDark ? 'bg-gray-800/50' : 'bg-slate-200/50'} p-6 rounded-xl flex flex-col h-[70vh]`}>
                     <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold gradient-text">Question {currentQuestionIndex + 1} of {interview?.questions.length}</h2>
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="secondary" onClick={handlePreviousQuestion} disabled={isFirstQuestion}><ArrowLeft size={16}/></Button>
                            <Button size="sm" variant="secondary" onClick={handleNextQuestion} disabled={isLastQuestion}> <ArrowRight size={16}/></Button>
                        </div>
                    </div>
                    <p className="mb-4 text-lg">{currentQuestion}</p>
                    <div className={`${theme.isDark ? 'bg-black/30' : 'bg-white/30'} rounded-lg p-4 flex-1 overflow-y-auto ${theme.textColorClass}`}>
                        {transcriptChunks.length > 0 ? (
                            transcriptChunks.map((chunk, i) => (
                                <motion.span key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                                    {chunk}
                                </motion.span>
                            ))
                        ) : (
                            <p className="text-gray-400">{answers[currentQuestionIndex] || "Your transcript will appear here..."}</p>
                        )}
                    </div>
                    {error && (
                        <div className="mt-4 p-3 bg-red-500/20 text-red-400 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}
                    {isLastQuestion && (
                        <Button onClick={handleFinishInterview} className="w-full mt-4" loading={isAnalyzing}>
                           Finish & Submit Interview
                        </Button>
                    )}
                </div>
            </div>
        </InterviewLayout>
    );
};

export default InterviewPage;