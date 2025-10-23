import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User, List } from 'lucide-react';
import { DashboardLayout } from '../components/common/DashboardLayout';
import type { Interview, InterviewResult } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface CandidateDashboardProps {
  userName: string;
  userRole: 'admin' | 'candidate';
  onLogout: () => void;
}

interface DashboardCardProps {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ icon, title, children }) => {
    const { theme } = useTheme();
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${theme.cardBgClass} p-6 rounded-xl border ${theme.borderColorClass} w-full`}
        >
            <div className="flex items-center mb-4">
                <div className={`p-2 rounded-lg bg-cyan-500/20`} style={{ color: theme.gradientFromHex }}>
                    {icon}
                </div>
                <h2 className={`text-xl font-bold ml-3 ${theme.textColorClass}`}>{title}</h2>
            </div>
            <div>{children}</div>
        </motion.div>
    );
};

const CandidateDashboard: React.FC<CandidateDashboardProps> = ({ userName, userRole, onLogout }) => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [interviewResults, setInterviewResults] = useState<Record<number, InterviewResult>>({});
  const { theme } = useTheme();

  useEffect(() => {
    try {
      const savedInterviews = localStorage.getItem('htc-interviews');
      if (savedInterviews) {
        const parsedInterviews: Interview[] = JSON.parse(savedInterviews);
        setInterviews(parsedInterviews);
        
        const results: Record<number, InterviewResult> = {};
        parsedInterviews.forEach(interview => {
            const resultData = localStorage.getItem(`htc-interview-result-${interview.id}`);
            if (resultData) {
                results[interview.id] = JSON.parse(resultData);
            }
        });
        setInterviewResults(results);
      }
    } catch (e) {
      console.error("Failed to load interviews from localStorage", e);
    }
  }, []);
    
  return (
    <DashboardLayout userName={userName} userRole={userRole} onLogout={onLogout} title="Candidate Portal">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <DashboardCard icon={<User />} title="My Profile">
            <div className={`space-y-3 ${theme.textColorClass}`}>
                <p><strong>Full Name:</strong> {userName}</p>
                <p><strong>Email:</strong> candidate@htc.com</p>
                <p><strong>Gender:</strong> Male</p>
                <p><strong>Date of Birth:</strong> 1995-08-15</p>
                <p><strong>CNIC:</strong> 12345-6789012-3</p>
                <button className={`text-sm ${theme.isDark ? 'text-cyan-400' : 'text-cyan-600'} hover:underline mt-2`}>Edit Profile</button>
            </div>
        </DashboardCard>

        <DashboardCard icon={<List />} title="My Interviews">
            <div className="space-y-4">
                {interviews.length > 0 ? interviews.map(interview => {
                    const result = interviewResults[interview.id];
                    return (
                        <div key={interview.id} className={`${theme.isDark ? 'bg-gray-800/60' : 'bg-slate-200/60'} p-4 rounded-lg flex items-center justify-between`}>
                            <div>
                                <p className={`font-semibold ${theme.textColorClass}`}>{interview.title}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{interview.questions.length} questions</p>
                            </div>
                            {result ? (
                                result.status === 'approved' ? (
                                    <Link 
                                        to={`/candidate/interview-result/${interview.id}`} 
                                        className="px-4 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors"
                                    >
                                        View Result
                                    </Link>
                                ) : (
                                    <span className={`px-4 py-2 text-sm font-semibold ${theme.isDark ? 'text-yellow-100 bg-yellow-500/50' : 'text-yellow-800 bg-yellow-200'} rounded-lg`}>
                                        Pending Review
                                    </span>
                                )
                            ) : (
                                <Link 
                                    to={`/interview/${interview.id}`} 
                                    className="px-4 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors"
                                >
                                    Start Interview
                                </Link>
                            )}
                        </div>
                    );
                }) : (
                    <p className="text-center py-4 text-gray-500">No interviews are available at this time.</p>
                )}
            </div>
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
};

export default CandidateDashboard;