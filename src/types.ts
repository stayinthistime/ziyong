// Define the structure of the AI analysis response
export interface AnalysisResponse {
  mistakeDiagnosis: string;
  coreConcept: string;
  stepByStepSolution: string[];
  practiceQuestion: {
    question: string;
    answer: string;
    explanation: string;
  };
}

// Navigation tabs
export const ActiveTab = {
  ANALYZE: 'ANALYZE',
  VOCABULARY: 'VOCABULARY',
  HISTORY: 'HISTORY',
  PROFILE: 'PROFILE',
} as const;

export type ActiveTab = (typeof ActiveTab)[keyof typeof ActiveTab];

export const Status = {
  IDLE: 'IDLE',
  LOADING: 'LOADING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
} as const;

export type Status = (typeof Status)[keyof typeof Status];

// Subject definitions
export type Subject = 'MATH' | 'PHYSICS' | 'CHEMISTRY' | 'BIOLOGY' | 'ENGLISH';

export const SUBJECT_LABELS: Record<Subject, string> = {
  MATH: '数学',
  PHYSICS: '物理',
  CHEMISTRY: '化学',
  BIOLOGY: '生物',
  ENGLISH: '英语',
};

export interface HistoryItem {
  id: string;
  timestamp: number;
  subject: Subject;
  originalProblem: string;
  originalImage?: string | null;
  result: AnalysisResponse;
}

// Vocabulary types
export interface VocabularyItem {
  word: string;
  pronunciation: string;
  definition: string;
  example: string;
}

export interface VocabularyResponse {
  topic: string;
  words: VocabularyItem[];
}