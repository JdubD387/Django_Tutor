import type { LearnerState, Verification } from '../../shared/types';
import { lessons } from '../data/curriculum';

/** A knowledge activity only. This does not parse, execute, or grade Python. */
export function checkKnowledge(lessonId: string, answers: Record<string, number>): Verification {
  const lesson = lessons.find(item => item.id === lessonId);
  if (!lesson) throw new Error('This lesson does not exist.');
  const results = lesson.quiz.map(question => {
    const given = answers[question.id];
    const passed = given === question.answer;
    return { id: question.id, label: question.prompt, passed, feedback: given === undefined ? 'Choose an answer, then try again.' : `${passed ? 'Correct. ' : 'Review and retry. '}${question.explanation}` };
  });
  return { lessonId, passed: results.length > 0 && results.every(item => item.passed), kind: 'knowledge', results, checkedAt: new Date().toISOString() };
}

/** Only call runtime verification with a validated response from the trusted server. */
export function applyVerification(state: LearnerState, verification: Verification): LearnerState {
  const lesson = lessons.find(item => item.id === verification.lessonId);
  if (!lesson) throw new Error('Cannot record results for an unknown lesson.');
  const validPass = verification.passed && verification.results.length > 0 && verification.results.every(result => result.passed);
  const result = { ...verification, passed: validPass };
  const knowledgeChecks = result.kind === 'knowledge' ? { ...state.knowledgeChecks, [lesson.id]: result } : state.knowledgeChecks;
  const runtimeChecks = result.kind === 'runtime' ? { ...state.runtimeChecks, [lesson.id]: result } : state.runtimeChecks;
  const canComplete = validPass && (lesson.requiresRuntime ? result.kind === 'runtime' : result.kind === 'knowledge');
  const completedLessons = canComplete ? [...new Set([...state.completedLessons, lesson.id])] : state.completedLessons;
  return { ...state, knowledgeChecks, runtimeChecks, completedLessons };
}
