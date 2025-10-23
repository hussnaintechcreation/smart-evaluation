import React from 'react';
import { motion, Variants } from 'framer-motion';
import { ThumbsUp, Lightbulb, X } from 'lucide-react';
import type { AIAnalysisData } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface AIAnalysisPanelProps {
  analysis: AIAnalysisData | null;
  isAnalyzing: boolean;
  onClose: () => void;
}

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 50 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: 'spring', damping: 25, stiffness: 300, duration: 0.3 }
  },
  exit: { opacity: 0, scale: 0.9, y: 50 },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
};

const SkeletonLoader: React.FC = () => {
  const { theme } = useTheme();
  return (
    <div className="animate-pulse space-y-6">
        <div>
            <div className={`h-4 ${theme.isDark ? 'bg-gray-700/50' : 'bg-slate-200'} rounded w-1/4 mb-4`}></div>
            <div className={`h-3 ${theme.isDark ? 'bg-gray-700/50' : 'bg-slate-200'} rounded w-full mb-2`}></div>
            <div className={`h-3 ${theme.isDark ? 'bg-gray-700/50' : 'bg-slate-200'} rounded w-full mb-2`}></div>
            <div className={`h-3 ${theme.isDark ? 'bg-gray-700/50' : 'bg-slate-200'} rounded w-3/4`}></div>
        </div>
        <hr className="border-t-0 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent h-[1px] my-4" />
        <div>
            <div className={`h-4 ${theme.isDark ? 'bg-gray-700/50' : 'bg-slate-200'} rounded w-1/3 mb-4`}></div>
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 ${theme.isDark ? 'bg-gray-700/50' : 'bg-slate-200'} rounded-full`}></div>
                    <div className={`h-3 ${theme.isDark ? 'bg-gray-700/50' : 'bg-slate-200'} rounded w-5/6`}></div>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 ${theme.isDark ? 'bg-gray-700/50' : 'bg-slate-200'} rounded-full`}></div>
                    <div className={`h-3 ${theme.isDark ? 'bg-gray-700/50' : 'bg-slate-200'} rounded w-full`}></div>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 ${theme.isDark ? 'bg-gray-700/50' : 'bg-slate-200'} rounded-full`}></div>
                    <div className={`h-3 ${theme.isDark ? 'bg-gray-700/50' : 'bg-slate-200'} rounded w-4/6`}></div>
                </div>
            </div>
        </div>
        <hr className="border-t-0 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent h-[1px] my-4" />
        <div>
            <div className={`h-4 ${theme.isDark ? 'bg-gray-700/50' : 'bg-slate-200'} rounded w-1/3 mb-4`}></div>
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 ${theme.isDark ? 'bg-gray-700/50' : 'bg-slate-200'} rounded-full`}></div>
                    <div className={`h-3 ${theme.isDark ? 'bg-gray-700/50' : 'bg-slate-200'} rounded w-5/6`}></div>
                </div>
                 <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 ${theme.isDark ? 'bg-gray-700/50' : 'bg-slate-200'} rounded-full`}></div>
                    <div className={`h-3 ${theme.isDark ? 'bg-gray-700/50' : 'bg-slate-200'} rounded w-4/6`}></div>
                </div>
            </div>
        </div>
    </div>
)};

export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ analysis, isAnalyzing, onClose }) => {
  const { theme } = useTheme();

  return (
    <motion.div
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        variants={panelVariants}
        className={`relative w-full max-w-2xl ${theme.cardBgClass} backdrop-blur-xl border ${theme.borderColorClass} rounded-2xl shadow-2xl shadow-cyan-500/10 p-8`}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
            onClick={onClose} 
            disabled={isAnalyzing}
            className={`absolute top-4 right-4 text-gray-500 hover:${theme.isDark ? 'text-white' : 'text-slate-900'} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            <X size={24} />
        </button>

        <h2 className="text-3xl font-bold gradient-text mb-6 text-center">
            {isAnalyzing ? "Analyzing Interview" : "AI Interview Analysis"}
        </h2>
        
        {isAnalyzing ? (
            <SkeletonLoader />
        ) : analysis ? (
            <div className="space-y-4">
              <div className="text-center mb-4">
                  <h3 className={`text-lg font-semibold ${theme.textColorClass}`}>Overall Score</h3>
                  <p className="text-5xl font-bold gradient-text my-2">{analysis.overallScore} <span className="text-2xl">/ 10</span></p>
                  <p className="text-slate-600 dark:text-gray-400 italic">"{analysis.overallFeedback}"</p>
              </div>
              
              <hr className="border-t-0 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent h-[1px] my-4" />

              <div>
                <h3 className={`text-lg font-semibold ${theme.textColorClass} mb-2`}>Summary</h3>
                <p className={`text-slate-700 dark:text-gray-300 leading-relaxed`}>{analysis.summary}</p>
              </div>
              
              <hr className="border-t-0 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent h-[1px] my-4" />

              <div>
                <h3 className={`font-semibold ${theme.textColorClass} flex items-center mb-3`}>
                  <ThumbsUp className={`text-cyan-500 dark:text-cyan-400 mr-2`} style={{color: theme.gradientFromHex}} size={20} />
                  Key Strengths
                </h3>
                <motion.ul 
                    className="space-y-1"
                    initial="hidden"
                    animate="visible"
                    transition={{ staggerChildren: 0.1 }}
                >
                  {analysis.strengths.map((strength, index) => (
                    <motion.li key={index} variants={itemVariants} className={`flex items-start p-2 -m-2 rounded-lg transition-colors duration-200 ${theme.isDark ? 'hover:bg-cyan-500/10' : 'hover:bg-cyan-500/5'}`}>
                        <div className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full" style={{backgroundColor: theme.gradientFromHex}}></div>
                        <span className={`text-slate-700 dark:text-gray-300`}>{strength}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              </div>

              <hr className="border-t-0 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent h-[1px] my-4" />

              <div>
                <h3 className={`font-semibold ${theme.textColorClass} flex items-center mb-3`}>
                  <Lightbulb className={`text-yellow-500 dark:text-yellow-400 mr-2`} style={{color: theme.gradientToHex}} size={20} />
                  Areas for Improvement
                </h3>
                <motion.ul 
                    className="space-y-1"
                    initial="hidden"
                    animate="visible"
                    transition={{ staggerChildren: 0.1, delay: 0.3 }}
                >
                  {analysis.improvements.map((improvement, index) => (
                    <motion.li key={index} variants={itemVariants} className={`flex items-start p-2 -m-2 rounded-lg transition-colors duration-200 ${theme.isDark ? 'hover:bg-yellow-500/10' : 'hover:bg-yellow-500/5'}`}>
                        <div className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full" style={{backgroundColor: theme.gradientToHex}}></div>
                        <span className={`text-slate-700 dark:text-gray-300`}>{improvement}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              </div>
            </div>
        ) : null}

      </motion.div>
    </motion.div>
  );
};