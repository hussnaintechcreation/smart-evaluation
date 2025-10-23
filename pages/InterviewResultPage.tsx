import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardLayout } from '../components/common/DashboardLayout';
import type { Interview, InterviewResult } from '../types';
import { AIAnalysisPanel } from '../components/AIAnalysisPanel';
import { ArrowLeft, MessageSquare, Video, CheckCircle, Download } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useTheme } from '../contexts/ThemeContext';

interface InterviewResultPageProps {
  userName: string;
  userRole: 'admin' | 'candidate';
  onLogout: () => void;
}

const InterviewResultPage: React.FC<InterviewResultPageProps> = ({ userName, userRole, onLogout }) => {
  const { interviewId } = useParams();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    try {
      const savedInterviews = localStorage.getItem('htc-interviews');
      if (savedInterviews) {
        const interviews: Interview[] = JSON.parse(savedInterviews);
        const currentInterview = interviews.find(i => i.id.toString() === interviewId);
        setInterview(currentInterview || null);
      }

      const savedResult = localStorage.getItem(`htc-interview-result-${interviewId}`);
      if (savedResult) {
        const parsedResult = JSON.parse(savedResult);
        setResult(parsedResult);
        setIsApproved(parsedResult.status === 'approved');
      }
    } catch (e) {
      console.error("Failed to load interview data from localStorage", e);
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  const handleApprove = () => {
    if (result) {
        const updatedResult = { ...result, status: 'approved' as const };
        localStorage.setItem(`htc-interview-result-${interviewId}`, JSON.stringify(updatedResult));
        setResult(updatedResult);
        setIsApproved(true);
    }
  };

  if (loading) {
    return <DashboardLayout userName={userName} userRole={userRole} onLogout={onLogout} title="Loading Results..."><div>Loading...</div></DashboardLayout>;
  }

  if (!interview || !result) {
    return (
      <DashboardLayout userName={userName} userRole={userRole} onLogout={onLogout} title="Error">
        <div className="text-center">
          <p className="text-xl text-red-500">Interview results not found.</p>
          <Link to={userRole === 'admin' ? '/admin' : '/candidate'}>
            <Button className="mt-4">
              <ArrowLeft className="mr-2" size={16} /> Back to Dashboard
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // Candidate access check
  if (userRole === 'candidate' && result.status !== 'approved') {
     return (
      <DashboardLayout userName={userName} userRole={userRole} onLogout={onLogout} title="Result Pending">
        <div className="text-center">
          <p className="text-xl">Your interview result is currently under review.</p>
           <p className="text-gray-400">Please check back later.</p>
          <Link to="/candidate">
            <Button className="mt-4">
              <ArrowLeft className="mr-2" size={16} /> Back to Dashboard
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userName={userName} userRole={userRole} onLogout={onLogout} title={`Results: ${interview.title}`}>
        <div className="mb-6 flex justify-between items-center">
            <Link to={userRole === 'admin' ? '/admin' : '/candidate'}>
                <Button variant="secondary">
                <ArrowLeft className="mr-2" size={16} /> Back to Dashboard
                </Button>
            </Link>
            {userRole === 'candidate' && isApproved && (
                 <Link to={`/certificate/${interview.id}`} target="_blank">
                    <Button>
                        <Download className="mr-2" size={16} /> Download Certificate
                    </Button>
                </Link>
            )}
        </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="sticky top-8"
          >
            <AIAnalysisPanel analysis={result.analysis} isAnalyzing={false} onClose={() => {}} />
            {userRole === 'admin' && !isApproved && (
                <Button onClick={handleApprove} className="w-full mt-4">
                    <CheckCircle className="mr-2" size={16} /> Approve Result
                </Button>
            )}
          </motion.div>
        </div>
        <div className="lg:col-span-2 space-y-6">
            {interview.questions.map((question, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`${theme.cardBgClass} p-6 rounded-xl border ${theme.borderColorClass}`}
                >
                    <p className={`text-sm text-cyan-500 dark:text-cyan-400 font-semibold`} style={{color: theme.gradientFromHex}}>Question {index + 1}</p>
                    <h3 className={`font-bold text-lg mb-4 ${theme.textColorClass}`}>{question}</h3>
                    
                    {result.answers[index] ? (
                        <div className="space-y-4">
                            <div>
                                <h4 className={`flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2`}>
                                    <Video size={16} /> Candidate's Video Response
                                </h4>
                                <video
                                    controls
                                    src={result.answers[index].videoBase64}
                                    className="w-full rounded-lg bg-black"
                                />
                            </div>
                             <div>
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                                    <MessageSquare size={16} /> AI Transcript
                                </h4>
                                <div className={`p-3 ${theme.isDark ? 'bg-gray-800/60' : 'bg-slate-200/60'} rounded-lg`}>
                                    <p className={`${theme.textColorClass} whitespace-pre-wrap`}>{result.answers[index].transcript}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">No answer recorded for this question.</p>
                    )}
                </motion.div>
            ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InterviewResultPage;