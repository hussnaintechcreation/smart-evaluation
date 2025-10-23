import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '../components/common/DashboardLayout';
import { Button } from '../components/common/Button';
import { getGenAIClient } from '../utils/gemini';
import { decode, decodeAudioData, blobToBase64 } from '../utils/audio';
import { Mic, StopCircle, Volume2, FileText, Bot } from 'lucide-react';
import { Modality } from '@google/genai';
import { useTheme } from '../contexts/ThemeContext';

interface AIToolsPageProps {
  userName: string;
  userRole: 'admin' | 'candidate';
  onLogout: () => void;
}

const AIToolsPage: React.FC<AIToolsPageProps> = ({ userName, userRole, onLogout }) => {
    // Transcription State
    const [isRecording, setIsRecording] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcriptionError, setTranscriptionError] = useState('');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // TTS State
    const [ttsText, setTtsText] = useState('Hello from HUSSNAIN’S TECH CREATION! I can read any text you provide.');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [ttsError, setTtsError] = useState('');
    const { theme } = useTheme();

    const handleStartRecording = async () => {
        setTranscription('');
        setTranscriptionError('');
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
                audioChunksRef.current = [];

                mediaRecorderRef.current.ondataavailable = (event) => {
                    audioChunksRef.current.push(event.data);
                };

                mediaRecorderRef.current.onstop = async () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    handleTranscription(audioBlob);
                    stream.getTracks().forEach(track => track.stop()); // Stop microphone access
                };

                mediaRecorderRef.current.start();
                setIsRecording(true);
            } catch (err) {
                console.error("Error accessing microphone:", err);
                setTranscriptionError("Microphone access denied. Please allow microphone permissions in your browser settings.");
            }
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsTranscribing(true);
        }
    };

    const handleTranscription = async (audioBlob: Blob) => {
        try {
            const base64Audio = await blobToBase64(audioBlob);
            const ai = getGenAIClient();
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    { parts: [
                        { text: "Transcribe this audio recording." },
                        { inlineData: { mimeType: 'audio/webm', data: base64Audio } }
                    ]}
                ],
            });
            setTranscription(response.text);
        } catch (error) {
            console.error("Error during transcription:", error);
            setTranscriptionError("Failed to transcribe audio. Please try again.");
        } finally {
            setIsTranscribing(false);
        }
    };

    const handleSpeak = async () => {
        if (!ttsText.trim() || isSpeaking) return;
        setTtsError('');
        setIsSpeaking(true);
        try {
            const ai = getGenAIClient();
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: ttsText }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
                    },
                },
            });

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                const audioBuffer = await decodeAudioData(
                    decode(base64Audio),
                    outputAudioContext,
                    24000,
                    1
                );
                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContext.destination);
                source.start();
                source.onended = () => setIsSpeaking(false);
            } else {
                throw new Error("No audio data received from API.");
            }
        } catch (error) {
            console.error("Error during TTS:", error);
            setTtsError("Failed to generate speech. Please try again.");
            setIsSpeaking(false);
        }
    };

    return (
        <DashboardLayout userName={userName} userRole={userRole} onLogout={onLogout} title="AI Tools">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Transcription Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className={`${theme.cardBgClass} p-6 rounded-xl border ${theme.borderColorClass} flex flex-col`}
                >
                    <h2 className={`text-xl font-bold mb-4 ${theme.textColorClass} flex items-center gap-2`}>
                        <FileText /> Speech-to-Text
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
                        Record your voice and our AI will transcribe it into text.
                    </p>
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <Button onClick={handleStartRecording} disabled={isRecording || isTranscribing} className="w-40">
                            <Mic className="mr-2" /> Start
                        </Button>
                        <Button onClick={handleStopRecording} disabled={!isRecording || isTranscribing} variant="secondary" className="w-40">
                             <StopCircle className="mr-2" /> Stop
                        </Button>
                    </div>
                     {isRecording && <p className="text-center text-cyan-500 animate-pulse font-semibold">Recording...</p>}
                    <div className="flex-1 mt-4 p-4 bg-slate-200/60 dark:bg-gray-800/60 rounded-lg min-h-[150px] text-slate-700 dark:text-gray-300">
                        {isTranscribing ? (
                            <div className="flex items-center justify-center h-full">
                                <Bot className="animate-spin text-cyan-500" style={{color: theme.gradientFromHex}} />
                                <p className={`ml-2 ${theme.textColorClass}`}>Transcribing...</p>
                            </div>
                        ) : transcription ? (
                            <p className={`${theme.textColorClass}`}>{transcription}</p>
                        ) : (
                            <p className="text-gray-500">Your transcript will appear here.</p>
                        )}
                    </div>
                    {transcriptionError && <p className="text-red-500 text-sm mt-2 text-center">{transcriptionError}</p>}
                </motion.div>

                {/* TTS Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className={`${theme.cardBgClass} p-6 rounded-xl border ${theme.borderColorClass} flex flex-col`}
                >
                    <h2 className={`text-xl font-bold mb-4 ${theme.textColorClass} flex items-center gap-2`}>
                        <Volume2 /> Text-to-Speech
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
                        Type any text and our AI will generate a natural-sounding voice.
                    </p>
                     <textarea
                        value={ttsText}
                        onChange={(e) => setTtsText(e.target.value)}
                        placeholder="Enter text to speak..."
                        className={`w-full flex-1 p-4 ${theme.isDark ? 'bg-gray-800/60 border-gray-700 text-gray-200' : 'bg-slate-200/60 border-slate-300 text-slate-800'} rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300 mb-4 min-h-[150px]`}
                        disabled={isSpeaking}
                    />
                    <Button onClick={handleSpeak} loading={isSpeaking} className="w-full">
                        <Volume2 className="mr-2"/> Generate & Play
                    </Button>
                    {ttsError && <p className="text-red-500 text-sm mt-2 text-center">{ttsError}</p>}
                </motion.div>
            </div>
        </DashboardLayout>
    );
};

export default AIToolsPage;