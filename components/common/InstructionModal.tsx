import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { X, Mic, StopCircle, Play, ArrowRight, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface InstructionModalProps {
  onClose: () => void;
}

const InstructionItem: React.FC<{ icon: React.ReactNode; title: string; description: string; }> = ({ icon, title, description }) => {
    const { theme } = useTheme();
    return (
        <li className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center" style={{ color: theme.gradientFromHex }}>
                {icon}
            </div>
            <div>
                <h4 className={`font-semibold ${theme.textColorClass}`}>{title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
        </li>
    );
};

export const InstructionModal: React.FC<InstructionModalProps> = ({ onClose }) => {
  const { theme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className={`relative w-full max-w-lg ${theme.cardBgClass} backdrop-blur-xl border ${theme.borderColorClass} rounded-2xl shadow-2xl p-8`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
            onClick={onClose}
            className={`absolute top-4 right-4 text-gray-500 hover:${theme.isDark ? 'text-white' : 'text-slate-900'} transition-colors`}
            aria-label="Close instructions"
        >
            <X size={24} />
        </button>

        <h3 className="text-2xl font-bold gradient-text mb-6 text-center">
            Interview Instructions
        </h3>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
            Welcome! Please follow these steps for a successful interview.
        </p>
        
        <ul className="space-y-6">
            <InstructionItem
                icon={<Mic size={20} />}
                title="Start Answering"
                description="Click the 'Answer' button to start your camera and microphone. The timer for the current question will begin."
            />
             <InstructionItem
                icon={<StopCircle size={20} />}
                title="Stop Recording"
                description="When you've finished your answer, click the 'Stop' button. You can do this at any time, or it will stop automatically when time runs out."
            />
             <InstructionItem
                icon={<Play size={20} />}
                title="Review Your Answer"
                description="After stopping, you can use the 'Play' button to review your recorded video and audio for the current question."
            />
             <InstructionItem
                icon={<div className="flex items-center gap-1"><ArrowLeft size={16} /><ArrowRight size={16}/></div>}
                title="Navigate Questions"
                description="Use the arrow buttons to move between questions. Your progress is saved automatically. You must stop recording before changing questions."
            />
        </ul>
        
        <div className="mt-8 text-center">
            <Button onClick={onClose}>Got it, Let's Start!</Button>
        </div>

      </motion.div>
    </motion.div>
  );
};
