import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { LoaderCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

// FIX: Changed the 'ButtonProps' interface to a type intersection ('&').
// This correctly merges custom props with all standard button attributes from
// framer-motion's 'HTMLMotionProps', resolving errors for props like 'type',
// 'onClick', and 'className'.
type ButtonProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
} & HTMLMotionProps<'button'>;

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md',
  loading = false,
  ...props 
}) => {
  const { theme } = useTheme();

  const baseStyles = 'font-semibold rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center';
  
  const variantStyles = {
    primary: `text-white bg-gradient-to-r from-[${theme.gradientFromHex}] to-[${theme.gradientToHex}] hover:from-[${theme.gradientFromHex}E0] hover:to-[${theme.gradientToHex}E0] focus:ring-cyan-500 disabled:opacity-75 disabled:cursor-not-allowed`,
    secondary: `text-slate-700 dark:text-gray-300 ${theme.isDark ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700' : 'bg-slate-200 border-slate-300 hover:bg-slate-300'} focus:ring-slate-500 dark:focus:ring-gray-500 disabled:opacity-75 disabled:cursor-not-allowed`,
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs h-[32px]',
    md: 'px-5 py-2.5 text-sm h-[42px]',
    lg: 'px-8 py-3 text-base h-[50px]',
  };

  return (
    <motion.button
      whileHover={!loading ? { scale: 1.05 } : {}}
      whileTap={!loading ? { scale: 0.95 } : {}}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      // FIX: Cast style object to React.CSSProperties to allow for custom properties
      // like '--tw-gradient-from', which are not in Framer Motion's MotionStyle type.
      style={variant === 'primary' ? {
        background: `linear-gradient(to right, ${theme.gradientFromHex}, ${theme.gradientToHex})`,
        // Also apply hover styles with alpha for interactive background
        '--tw-gradient-from': theme.gradientFromHex,
        '--tw-gradient-to': theme.gradientToHex,
      } as React.CSSProperties : {}}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <LoaderCircle className="animate-spin" size={size === 'lg' ? 24 : 20} />
      ) : (
        children
      )}
    </motion.button>
  );
};