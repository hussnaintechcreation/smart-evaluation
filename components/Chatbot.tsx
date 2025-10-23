import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { MessageSquare, Send, X, Bot } from 'lucide-react';
import { techStackData } from '../constants';
import { getGenAIClient } from '../utils/gemini';
import { useTheme } from '../contexts/ThemeContext';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

const systemInstruction = `You are a helpful AI assistant for HUSSNAIN’S TECH CREATION PVT LTD. Your purpose is to answer questions about the company's project, its architecture, and the technologies used. Be concise and helpful. Here is the tech stack data for context: ${JSON.stringify(techStackData)}`;

const fabVariants: Variants = {
    hidden: { scale: 0, rotate: -45 },
    visible: { scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 260, damping: 20 }},
};

const chatWindowVariants: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' }},
    exit: { opacity: 0, y: 30, scale: 0.95, transition: { duration: 0.2, ease: 'easeIn' }},
};

export const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const { theme } = useTheme();

    useEffect(() => {
        try {
            const storedMessages = localStorage.getItem('htc-chat-history');
            if (storedMessages) {
                setMessages(JSON.parse(storedMessages));
            } else {
                setMessages([
                    { id: Date.now(), text: "Welcome! I'm the HTC AI Assistant. Feel free to ask me anything about this project, its architecture, or the technologies we're using.", sender: 'bot' }
                ]);
            }
        } catch (error) {
            console.error("Failed to parse chat history from localStorage", error);
            setMessages([
                { id: Date.now(), text: "Welcome! I'm the HTC AI Assistant. Feel free to ask me anything about this project, its architecture, or the technologies we're using.", sender: 'bot' }
            ]);
        }
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            try {
                localStorage.setItem('htc-chat-history', JSON.stringify(messages));
            } catch (error) {
                console.error("Failed to save chat history to localStorage", error);
            }
        }
    }, [messages]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = { id: Date.now(), text: inputValue, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const ai = getGenAIClient();
            // We pass a subset of the history to keep the payload reasonable
            const conversationHistory = messages.slice(-6).map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    ...conversationHistory,
                    { role: 'user', parts: [{ text: inputValue }] }
                ],
                config: { systemInstruction: systemInstruction }
            });

            const botMessage: Message = { id: Date.now() + 1, text: response.text, sender: 'bot' };
            setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            console.error("Error calling Gemini API:", error);
            const errorMessage: Message = {
                id: Date.now() + 1,
                text: "Sorry, I'm having trouble connecting right now. Please try again later.",
                sender: 'bot',
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <>
            <motion.button
                variants={fabVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-40 w-16 h-16 bg-gradient-to-r text-white rounded-full shadow-lg shadow-cyan-500/30 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-gray-900 focus:ring-cyan-400"
                aria-label="Toggle Chat"
                style={{ background: `linear-gradient(to right, ${theme.gradientFromHex}, ${theme.gradientToHex})` }}
            >
                <AnimatePresence>
                    {isOpen ? <X size={30} /> : <MessageSquare size={30} />}
                </AnimatePresence>
            </motion.button>
            
            <AnimatePresence>
            {isOpen && (
                <motion.div
                    variants={chatWindowVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className={`fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] max-w-sm h-[60vh] max-h-[500px] ${theme.cardBgClass} backdrop-blur-xl border ${theme.borderColorClass} rounded-2xl shadow-2xl shadow-cyan-500/10 flex flex-col`}
                >
                    <header className={`flex items-center justify-between p-4 border-b ${theme.isDark ? 'border-gray-700/50' : 'border-slate-200'}`}>
                        <h3 className="font-bold text-lg gradient-text">HTC AI Assistant</h3>
                        <button onClick={() => setIsOpen(false)} className={`text-gray-500 hover:${theme.isDark ? 'text-white' : 'text-slate-900'} transition-colors`}>
                            <X size={20} />
                        </button>
                    </header>
                    <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'bot' && <div className={`w-8 h-8 flex-shrink-0 ${theme.isDark ? 'bg-gray-700' : 'bg-slate-200'} rounded-full flex items-center justify-center`}><Bot className={`text-cyan-500 dark:text-cyan-400`} style={{color: theme.gradientFromHex}} size={20}/></div>}
                                <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${msg.sender === 'user' ? `bg-blue-600 text-white rounded-br-none` : `${theme.isDark ? 'bg-gray-700 text-gray-200' : 'bg-slate-200 text-slate-800'} rounded-bl-none`}`}
                                  style={msg.sender === 'user' ? { background: theme.gradientToHex } : {}}
                                >
                                    <p className="text-sm break-words">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                             <div className="flex items-end gap-2 justify-start">
                                <div className={`w-8 h-8 flex-shrink-0 ${theme.isDark ? 'bg-gray-700' : 'bg-slate-200'} rounded-full flex items-center justify-center`}><Bot className={`text-cyan-400`} style={{color: theme.gradientFromHex}} size={20}/></div>
                                <div className={`px-4 py-3 rounded-2xl ${theme.isDark ? 'bg-gray-700' : 'bg-slate-200'} rounded-bl-none`}>
                                    <div className="flex items-center space-x-1">
                                        <motion.div className="w-2 h-2 rounded-full" style={{backgroundColor: theme.gradientFromHex}} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}/>
                                        <motion.div className="w-2 h-2 rounded-full" style={{backgroundColor: theme.gradientFromHex}} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, delay: 0.1, repeat: Infinity, ease: "easeInOut" }}/>
                                        <motion.div className="w-2 h-2 rounded-full" style={{backgroundColor: theme.gradientFromHex}} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, delay: 0.2, repeat: Infinity, ease: "easeInOut" }}/>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSendMessage} className={`p-4 border-t ${theme.isDark ? 'border-gray-700/50' : 'border-slate-200'}`}>
                        <div className={`flex items-center ${theme.isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-slate-200/50 border-slate-300'} rounded-lg focus-within:ring-2 focus-within:ring-cyan-500 transition-all`}>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Ask a question..."
                                className={`w-full px-4 py-2 bg-transparent ${theme.textColorClass} placeholder-gray-500 focus:outline-none`}
                                disabled={isLoading}
                            />
                            <button type="submit" className={`p-3 text-gray-500 dark:text-gray-400 hover:text-cyan-400 disabled:text-gray-400 dark:disabled:text-gray-600 transition-colors`} disabled={isLoading}
                            style={{color: theme.gradientFromHex}}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}
            </AnimatePresence>
        </>
    );
};