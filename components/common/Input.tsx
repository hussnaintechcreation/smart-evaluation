import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input: React.FC<InputProps> = (props) => {
  const { theme } = useTheme();
  return (
    <input
      {...props}
      className={`w-full px-4 py-3 ${theme.isDark ? 'bg-gray-800/50 border-gray-700 text-gray-200' : 'bg-slate-200 border-slate-300 text-slate-800'} rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300`}
    />
  );
};