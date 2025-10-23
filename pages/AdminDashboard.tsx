import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Users, FileText, ClipboardList, Trash2, Plus, X, Pencil, Eye, Clock } from 'lucide-react';
import { DashboardLayout } from '../components/common/DashboardLayout';
import type { Interview, InterviewResult } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface AdminDashboardProps {
  userName: string;
  userRole: 'admin' | 'candidate';
  onLogout: () => void;
}

type StatCardColor = 'cyan' | 'blue' | 'purple' | 'yellow';

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string;
    color: StatCardColor;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, color }) => {
    const { theme } = useTheme();

    const colorClasses: Record<StatCardColor, { bg: string, text: string }> = {
        cyan: { bg: `bg-cyan-500/20`, text: `text-cyan-500 dark:text-cyan-400` },
        blue: { bg: `bg-blue-500/20`, text: `text-blue-500 dark:text-blue-400` },
        purple: { bg: `bg-purple-500/20`, text: `text-purple-500 dark:text-purple-400` },
        yellow: { bg: `bg-yellow-500/20`, text: `text-yellow-500 dark:text-yellow-400` },
    };
    const selectedColor = colorClasses[color] || colorClasses.cyan;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${theme.cardBgClass} p-6 rounded-xl border ${theme.borderColorClass}`}
        >
            <div className="flex items-center">
                <div className={`p-3 rounded-lg ${selectedColor.bg} ${selectedColor.text}`}>
                    {icon}
                </div>
                <div className="ml-4">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
                    <p className={`text-2xl font-bold ${theme.textColorClass}`}>{value}</p>
                </div>
            </div>
        </motion.div>
    );
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ userName, userRole, onLogout }) => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [interviewResults, setInterviewResults] = useState<Record<number, InterviewResult>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  
  // Form state
  const [newInterviewTitle, setNewInterviewTitle] = useState('');
  const [newInterviewQuestions, setNewInterviewQuestions] = useState('');
  const { theme } = useTheme();

  // Load interviews and check for completed results on mount
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
                // FIX: JSON.parse returns `unknown` by default in strict mode. The result must be cast to the expected type `InterviewResult` to prevent type errors when accessing its properties later.
                results[interview.id] = JSON.parse(resultData) as InterviewResult;
            }
        });
        setInterviewResults(results);
      }
    } catch (e) {
      console.error("Failed to load data from localStorage", e);
    }
  }, []);

  // Save interviews to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('htc-interviews', JSON.stringify(interviews));
    } catch (e) {
      console.error("Failed to save interviews to localStorage", e);
    }
  }, [interviews]);

  const stats = useMemo(() => {
    // FIX: Explicitly cast Object.values to InterviewResult[] to ensure correct typing.
    const approvedCount = (Object.values(interviewResults) as InterviewResult[]).filter(r => r.status === 'approved').length;
    const pendingCount = (Object.values(interviewResults) as InterviewResult[]).filter(r => r.status === 'pending').length;
    return { approvedCount, pendingCount };
  }, [interviewResults]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingInterview(null);
    setNewInterviewTitle('');
    setNewInterviewQuestions('');
  };

  const handleStartEdit = (interview: Interview) => {
    setEditingInterview(interview);
    setNewInterviewTitle(interview.title);
    setNewInterviewQuestions(interview.questions.join('\n'));
    setIsModalOpen(true);
  };

  const handleSaveInterview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInterviewTitle.trim() || !newInterviewQuestions.trim()) return;

    const questionsArray = newInterviewQuestions.split('\n').filter(q => q.trim() !== '');

    if (editingInterview) {
      // Update existing interview
      setInterviews(prev => prev.map(iv =>
        iv.id === editingInterview.id
          ? { ...iv, title: newInterviewTitle, questions: questionsArray }
          : iv
      ));
    } else {
      // Create new interview
      const newInterview: Interview = {
        id: Date.now(),
        title: newInterviewTitle,
        questions: questionsArray,
      };
      setInterviews(prev => [...prev, newInterview]);
    }

    handleCloseModal();
  };

  const handleDeleteInterview = (id: number) => {
    if (window.confirm('Are you sure you want to delete this interview? This will also remove any completed results. This action cannot be undone.')) {
        setInterviews(interviews.filter(interview => interview.id !== id));
        localStorage.removeItem(`htc-interview-result-${id}`);
        setInterviewResults(prev => {
            const newResults = { ...prev };
            delete newResults[id];
            return newResults;
        });
    }
  };

  return (
    <DashboardLayout userName={userName} userRole={userRole} onLogout={onLogout} title="Admin Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<Users />} title="Total Candidates" value="1,245" color="cyan" />
        <StatCard icon={<FileText />} title="Approved Results" value={stats.approvedCount.toString()} color="blue" />
        <StatCard icon={<Clock />} title="Pending Review" value={stats.pendingCount.toString()} color="yellow" />
        <StatCard icon={<ClipboardList />} title="Active Interviews" value={interviews.length.toString()} color="purple" />
      </div>

      <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`${theme.cardBgClass} p-6 rounded-xl border ${theme.borderColorClass}`}
        >
            <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-bold ${theme.textColorClass}`}>Interview Management</h2>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} className="mr-2"/> Create Interview
                </Button>
            </div>
            
            <div className="space-y-3">
                {interviews.length > 0 ? interviews.map(interview => {
                    const result = interviewResults[interview.id];
                    return (
                        <div key={interview.id} className={`${theme.isDark ? 'bg-gray-800/60' : 'bg-slate-200/60'} p-3 rounded-lg flex items-center justify-between group`}>
                            <div>
                                <p className={`font-semibold ${theme.textColorClass}`}>{interview.title}</p>
                                <p className="text-sm text-gray-500">{interview.questions.length} questions
                                {result?.status === 'approved' && <span className={`font-bold ${theme.isDark ? 'text-cyan-400' : 'text-cyan-600'} ml-2`}>• Approved</span>}
                                {result?.status === 'pending' && <span className={`font-bold ${theme.isDark ? 'text-yellow-400' : 'text-yellow-600'} ml-2`}>• Pending Review</span>}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {result?.status === 'approved' ? (
                                    <Link to={`/admin/interview-result/${interview.id}`}>
                                        <Button size="sm" variant="secondary">
                                            <Eye size={16} className="mr-2" /> View Result
                                        </Button>
                                    </Link>
                                ) : result?.status === 'pending' ? (
                                    <Link to={`/admin/interview-result/${interview.id}`}>
                                        <Button size="sm">
                                            <Clock size={16} className="mr-2" /> Review
                                        </Button>
                                    </Link>
                                ) : (
                                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleStartEdit(interview)}
                                            className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                                            aria-label="Edit interview"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteInterview(interview.id)}
                                            className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                                            aria-label="Delete interview"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                }) : (
                    <p className="text-center py-4 text-gray-500">No interviews created yet.</p>
                )}
            </div>
        </motion.div>

        <AnimatePresence>
            {isModalOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
                    onClick={handleCloseModal}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className={`relative w-full max-w-lg ${theme.cardBgClass} backdrop-blur-xl border ${theme.borderColorClass} rounded-2xl shadow-2xl p-6`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-xl font-bold mb-4 gradient-text">
                            {editingInterview ? 'Edit Interview' : 'Create New Interview'}
                        </h3>
                        <form onSubmit={handleSaveInterview}>
                            <div className="mb-4">
                                <label htmlFor="interview-title" className={`block text-sm font-medium ${theme.textColorClass} mb-1`}>Title</label>
                                <input
                                    id="interview-title"
                                    type="text"
                                    value={newInterviewTitle}
                                    onChange={(e) => setNewInterviewTitle(e.target.value)}
                                    placeholder="e.g., Senior Frontend Developer"
                                    className={`w-full px-4 py-2 ${theme.isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-slate-200 border-slate-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                                    required
                                />
                            </div>
                             <div className="mb-6">
                                <label htmlFor="interview-questions" className={`block text-sm font-medium ${theme.textColorClass} mb-1`}>Questions (one per line)</label>
                                <textarea
                                    id="interview-questions"
                                    value={newInterviewQuestions}
                                    onChange={(e) => setNewInterviewQuestions(e.target.value)}
                                    placeholder="What is your experience with React?&#10;Describe a challenging project you worked on."
                                    className={`w-full px-4 py-2 ${theme.isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-slate-200 border-slate-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 h-40`}
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                                <Button type="submit">{editingInterview ? 'Save Changes' : 'Create Interview'}</Button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    </DashboardLayout>
  );
};

export default AdminDashboard;