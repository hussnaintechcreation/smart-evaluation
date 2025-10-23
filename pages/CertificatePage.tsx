import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import { QRCodeCanvas } from 'qrcode.react';
import { SmartEvaluationIcon } from '../components/common/SmartEvaluationIcon';
import { BrandFooter } from '../components/common/BrandFooter';
import { Button } from '../components/common/Button';
import { Download, LoaderCircle } from 'lucide-react';
import type { Interview, InterviewResult } from '../types';
import { useTheme } from '../contexts/ThemeContext';

const CertificatePage: React.FC = () => {
  const { interviewId } = useParams();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);
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
        setResult(JSON.parse(savedResult));
      }
    } catch (e) {
      console.error("Failed to load certificate data from localStorage", e);
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  const handleDownload = () => {
    if (!certificateRef.current) return;
    setIsDownloading(true);

    const element = certificateRef.current;
    const opt = {
      margin: 0,
      filename: `Certificate_${result?.candidateName}_${interview?.title}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: null }, // use backgroundColor: null for transparent bg
      jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' },
    };

    html2pdf().from(element).set(opt).save().then(() => {
        setIsDownloading(false);
    });
  };

  if (loading) {
    return <div className={`flex items-center justify-center min-h-screen ${theme.primaryBgClass} ${theme.textColorClass}`}><LoaderCircle className="animate-spin" /></div>;
  }

  if (!interview || !result || result.status !== 'approved') {
    return (
        <div className={`flex flex-col items-center justify-center min-h-screen ${theme.primaryBgClass} ${theme.textColorClass} p-4`}>
            <h1 className="text-2xl font-bold text-red-500">Certificate Not Available</h1>
            <p className="text-gray-400 mt-2">This certificate is either not found or has not been approved yet.</p>
        </div>
    );
  }
  
  const qrCodeValue = window.location.href;

  return (
    <div className={`${theme.primaryBgClass} min-h-screen flex flex-col items-center justify-center p-4`}>
      <div 
        ref={certificateRef} 
        className={`w-[11in] h-[8.5in] p-8 ${theme.isDark ? 'bg-gray-900' : 'bg-slate-50'} ${theme.textColorClass} shadow-2xl flex flex-col relative overflow-hidden`}
      >
        {/* Background pattern */}
        <div className={`absolute inset-0 z-0 opacity-5 ${theme.isDark ? '[&>svg]:fill-white/10' : '[&>svg]:fill-black/10'}`}>
            <svg width="100%" height="100%"><defs><pattern id="p" width="100" height="100" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M50 0 v100 M0 50 h100" stroke="currentColor" strokeWidth="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#p)"/></svg>
        </div>

        {/* Decorative Border */}
        <div className="absolute inset-2 border-2 border-cyan-500/50 z-10" style={{borderColor: `${theme.gradientFromHex}50`}}></div>
        <div className="absolute inset-3 border border-blue-500/30 z-10" style={{borderColor: `${theme.gradientToHex}30`}}></div>
        
        <div className="relative z-20 flex flex-col h-full">
            <header className="text-center">
                <SmartEvaluationIcon />
                <h1 className="text-4xl font-bold mt-4 gradient-text">Certificate of Achievement</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">This certificate is proudly presented to</p>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center text-center my-8">
                <h2 className="text-6xl font-bold">{result.candidateName}</h2>
                <hr className="w-24 h-0.5 my-6 bg-cyan-400 border-none" style={{backgroundColor: theme.gradientFromHex}} />
                <p className="text-lg max-w-3xl text-gray-600 dark:text-gray-300">
                    For successfully completing the AI-powered technical interview for the position of
                </p>
                <p className="text-2xl font-semibold mt-2">{interview.title}</p>
                <p className="text-3xl font-bold mt-8">Overall Score: <span className="gradient-text">{result.analysis.overallScore} / 10</span></p>
                <p className="text-base mt-2 text-gray-500 dark:text-gray-400 italic max-w-3xl">"{result.analysis.overallFeedback}"</p>
            </main>

            <footer className="flex justify-between items-end">
                <div className="text-left">
                    <p className="font-bold">Date of Completion</p>
                    <p className="text-gray-500 dark:text-gray-400">{new Date().toLocaleDateString()}</p>
                </div>
                
                <div className="text-center">
                   <BrandFooter />
                </div>

                <div className="text-right">
                    <QRCodeCanvas value={qrCodeValue} size={80} bgColor={"transparent"} fgColor={theme.qrCodeFgColor} />
                    <p className="text-xs text-gray-400 mt-1">Scan to Verify</p>
                </div>
            </footer>
        </div>
      </div>
      <Button onClick={handleDownload} loading={isDownloading} className="mt-8">
        <Download className="mr-2" size={16} /> Download as PDF
      </Button>
    </div>
  );
};

export default CertificatePage;