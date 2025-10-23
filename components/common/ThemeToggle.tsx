import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, ChevronDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import type { ThemeName } from '../../types'; // Import ThemeName type

export const ThemeSelector: React.FC = () => {
    const { themeName, setThemeName, theme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    const availableThemes: ThemeName[] = ['dark-blue', 'light-slate', 'cyber-purple'];

    const getThemeDisplayName = (name: ThemeName) => {
        switch (name) {
            case 'dark-blue': return 'Dark Blue';
            case 'light-slate': return 'Light Slate';
            case 'cyber-purple': return 'Cyber Purple';
            default: return name;
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-10 h-10 flex items-center justify-center ${theme.isDark ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'} rounded-lg transition-colors`}
                aria-label="Select theme"
            >
                <Palette size={20} />
                <ChevronDown size={16} className={`ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className={`absolute right-0 mt-2 w-40 ${theme.cardBgClass} border ${theme.borderColorClass} rounded-lg shadow-xl overflow-hidden z-50`}
                    >
                        {availableThemes.map((name) => (
                            <button
                                key={name}
                                onClick={() => {
                                    setThemeName(name);
                                    setIsOpen(false);
                                }}
                                className={`block w-full text-left px-4 py-2 text-sm ${theme.textColorClass} hover:${theme.isDark ? 'bg-gray-700' : 'bg-slate-200'} transition-colors ${themeName === name ? 'font-semibold' : ''}`}
                            >
                                {getThemeDisplayName(name)}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};