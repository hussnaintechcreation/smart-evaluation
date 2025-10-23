import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export const BrandFooter: React.FC = () => {
  const { theme } = useTheme();
  return (
    <div className={`mt-8 text-center text-xs ${theme.textColorClass}`}>
      <p>© {new Date().getFullYear()} Smart Evaluation Project.</p>
      <p className="font-semibold">Powered by HUSSNAIN’S TECH CREATION PVT LTD.</p>
    </div>
  );
};