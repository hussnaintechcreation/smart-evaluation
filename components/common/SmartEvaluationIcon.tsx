import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface SmartEvaluationIconProps {
  iconOnly?: boolean;
}

export const SmartEvaluationIcon: React.FC<SmartEvaluationIconProps> = ({ iconOnly = false }) => {
  const { theme } = useTheme();

  return (
    <div className="flex items-center justify-center gap-2">
      <svg viewBox="0 0 44 50" xmlns="http://www.w3.org/2000/svg" className={iconOnly ? "h-10 w-10" : "h-12 w-12"}>
        <defs>
          <linearGradient id={`grad-se-logo-icon-${theme.name}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: theme.gradientFromHex }} />
            <stop offset="100%" style={{ stopColor: theme.gradientToHex }} />
          </linearGradient>
        </defs>
        <g transform="translate(0, 5) scale(0.9)">
          <path d="M 22,5 
                   C 12,5 8,18 12,28 
                     4,28 4,40 12,44
                     12,52 20,52 22,44
                     
                     M 22,5
                     C 32,5 36,18 32,28
                     40,28 40,40 32,44
                     32,52 24,52 22,44"
                fill="none" stroke={`url(#grad-se-logo-icon-${theme.name})`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M 16 28 L 21 34 L 30 22" fill="none" stroke={`url(#grad-se-logo-icon-${theme.name})`} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      </svg>
      {!iconOnly && (
        <span className="text-2xl font-semibold gradient-text">
          Smart Evaluation
        </span>
      )}
    </div>
  );
};