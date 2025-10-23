import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Hero3D } from '../components/Hero3D';
import { Button } from '../components/common/Button';
import { BrandFooter } from '../components/common/BrandFooter';
import { TechStackCard } from '../components/TechStackCard';
import { techStackData } from '../constants';
import { Layers, Server, BrainCircuit, Zap, ShieldCheck, Milestone, Waypoints } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

// FIX: Explicitly type the variants object with the 'Variants' type from Framer Motion.
// This helps TypeScript correctly interpret the 'ease' property's cubic-bezier array,
// resolving the type error.
const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.6, 0.05, -0.01, 0.9],
      staggerChildren: 0.2
    }
  }
};

const getIconForTitle = (title: string) => {
    switch (title) {
        case 'Frontend': return <Layers className="w-6 h-6 gradient-text" />;
        case 'Backend': return <Server className="w-6 h-6 gradient-text" />;
        case 'AI Layer': return <BrainCircuit className="w-6 h-6 gradient-text" />;
        case 'Realtime': return <Zap className="w-6 h-6 gradient-text" />;
        case 'Infrastructure': return <Waypoints className="w-6 h-6 gradient-text" />;
        case 'Security & Testing': return <ShieldCheck className="w-6 h-6 gradient-text" />;
        case 'Roadmap': return <Milestone className="w-6 h-6 gradient-text" />;
        default: return <Layers className="w-6 h-6 gradient-text" />;
    }
};

const HomePage: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className={`w-full overflow-x-hidden ${theme.primaryBgClass}`}>
      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center text-center p-4">
        <div className="absolute inset-0 z-0">
          <Hero3D interactive={true} />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="relative z-10"
        >
          <h1 className="text-5xl md:text-7xl font-bold gradient-text">
            Smart Evaluation
          </h1>
          <p className={`mt-4 text-lg md:text-xl max-w-2xl mx-auto ${theme.textColorClass} opacity-80`}>
            A next-generation project by HUSSNAIN’S TECH CREATION PVT LTD, showcased with a futuristic, 3D interactive web page.
          </p>
          <Link to="/login">
            <Button size="lg" className="mt-8">
              Get Started
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20 px-4">
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-6xl mx-auto"
        >
          <motion.h2 variants={sectionVariants} className="text-4xl font-bold text-center mb-12 gradient-text">
            Core Technology Stack
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {techStackData.map((category) => (
              <TechStackCard
                key={category.title}
                title={category.title}
                items={category.items}
                icon={getIconForTitle(category.title)}
              />
            ))}
          </div>
        </motion.div>
      </section>
      
      <footer className="text-center py-8">
        <BrandFooter />
      </footer>
    </div>
  );
};

export default HomePage;