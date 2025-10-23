import React from 'react';
import { motion, Variants } from 'framer-motion';
import type { TechItem } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface TechStackCardProps {
  title: string;
  items: TechItem[];
  icon: React.ReactNode;
}

// Card container animation
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  },
};

// List container to orchestrate item animations
const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.2, // Start animating children after card starts appearing
      staggerChildren: 0.07, // Add a delay between each child animation
    },
  },
};

// Individual list item animation
const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.4, // Control speed of each item
      ease: 'easeOut',
    },
  },
};

export const TechStackCard: React.FC<TechStackCardProps> = ({ title, items, icon }) => {
  const { theme } = useTheme();

  return (
    <motion.div
      variants={cardVariants}
      className={`relative p-[1.5px] rounded-2xl overflow-hidden`}
      style={{
        background: `linear-gradient(to bottom right, ${theme.gradientFromHex}50, ${theme.gradientToHex}50)`
      }}
    >
      <div className={`${theme.cardBgClass} backdrop-blur-xl rounded-2xl p-6`}>
        <div className="flex items-center mb-4">
          {icon}
          {/* FIX: The className was a string literal instead of a template literal, preventing the theme class from being applied. */}
          <h3 className={`text-xl font-bold ml-3 ${theme.textColorClass}`}>{title}</h3>
        </div>
        <motion.ul 
            className="space-y-3"
            variants={listContainerVariants}
            initial="hidden"
            animate="visible"
        >
          {items.map((item) => (
            <motion.li key={item.name} variants={itemVariants} className="flex items-start">
              <div className="mt-1.5 flex-shrink-0">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.gradientFromHex }}></div>
              </div>
              <div className="ml-3">
                <p className="font-semibold text-slate-700 dark:text-gray-200" style={{ color: theme.textColorHex }}>{item.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </motion.div>
  );
};
