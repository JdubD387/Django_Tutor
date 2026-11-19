export type ProjectFiles = Record<string, string>;
export type AiMode = 'disabled' | 'local' | 'cloud';
export interface Preferences { theme: 'light' | 'dark'; fontSize: number; wordWrap: boolean; aiMode: AiMode; model: string; localEndpoint: string; }
export interface QuizQuestion { id: string; prompt: string; options: string[]; answer: number; explanation: string; }
export interface Lesson { id: string; number: number; title: string; subtitle: string; duration: number; objectives: string[]; sections: { title: string; body: string; code?: string }[]; docs: { title: string; url: string }[]; file: string; exercise: { title: string; instructions: string[]; requirements: string[] }; hints: string[]; quiz: QuizQuestion[]; requiresRuntime: boolean; }
export interface CheckResult { id: string; label: string; passed: boolean; feedback: string; }
export interface Verification { lessonId: string; passed: boolean; kind: 'knowledge' | 'runtime'; results: CheckResult[]; checkedAt: string; }
export interface LearnerState { version: 1; files: ProjectFiles; activeFile: string; openFiles: string[]; currentLesson: string; completedLessons: string[]; knowledgeChecks: Record<string, Verification>; runtimeChecks: Record<string, Verification>; quizAnswers: Record<string, Record<string, number>>; preferences: Preferences; lastSavedAt: string | null; lastProject: string; }
export type RuntimeAction = 'start' | 'stop' | 'restart' | 'test' | 'migrate' | 'check';
export interface RuntimeStatus { available: boolean; status: 'unavailable' | 'stopped' | 'running' | 'error'; message: string; previewUrl?: string; }
export interface RuntimeResult extends RuntimeStatus { output: string; verification?: Verification; }
