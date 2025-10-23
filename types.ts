export interface AIAnalysisData {
  summary: string;
  strengths: string[];
  improvements: string[];
  overallScore: number;
  overallFeedback: string;
}

export interface TechItem {
  name: string;
  description: string;
}

export interface TechCategory {
  title: string;
  items: TechItem[];
}

export interface Interview {
  id: number;
  title: string;
  questions: string[];
}

export interface RecordedAnswer {
  transcript: string;
  videoBase64: string;
}

export type InterviewStatus = 'pending' | 'approved';

export interface InterviewResult {
  interviewId: number;
  candidateName: string;
  analysis: AIAnalysisData;
  answers: Record<number, RecordedAnswer>;
  status: InterviewStatus;
}

export type ThemeName = 'dark-blue' | 'light-slate' | 'cyber-purple';
