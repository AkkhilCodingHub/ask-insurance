export interface ExamQuestion {
  id: number;
  chapter: string;
  question: string;
  options: [string, string, string, string];
}

export interface ExamSession {
  attemptId: string;
  candidateName: string;
  candidatePhone: string;
  candidateEmail: string;
  durationMinutes: number;
  totalQuestions: number;
  passingScore: number;
  questions: ExamQuestion[];
}

let activeSession: ExamSession | null = null;
let lastResults: any = null;

export const examStore = {
  setSession: (session: ExamSession) => {
    activeSession = session;
  },
  getSession: () => activeSession,
  clearSession: () => {
    activeSession = null;
  },
  setResults: (res: any) => {
    lastResults = res;
  },
  getResults: () => lastResults,
  clearResults: () => {
    lastResults = null;
  },
};
