import { describe, expect, it } from 'vitest';
import { lessons } from '../data/curriculum';
import { createInitialState } from './persistence';
import { applyVerification, checkKnowledge } from './verification';

describe('deterministic knowledge activities', () => {
  it('gives meaningful feedback for unanswered and wrong responses, and accepts a correction', () => {
    expect(checkKnowledge('intro',{}).results.every(result => !result.passed && result.feedback.includes('Choose'))).toBe(true);
    const lesson = lessons[0];
    const wrong = Object.fromEntries(lesson.quiz.map(question => [question.id,(question.answer+1)%question.options.length]));
    expect(checkKnowledge('intro',wrong).passed).toBe(false);
    const right = Object.fromEntries(lesson.quiz.map(question => [question.id,question.answer]));
    const result = checkKnowledge('intro',right);
    expect(result.passed).toBe(true);
    expect(applyVerification(createInitialState(),result).completedLessons).toEqual(['intro']);
  });
  it('never completes a programming lesson from a knowledge check', () => {
    const lesson = lessons[1];
    const result = checkKnowledge(lesson.id,Object.fromEntries(lesson.quiz.map(question => [question.id,question.answer])));
    const state = applyVerification(createInitialState(),result);
    expect(result.passed).toBe(true);
    expect(state.completedLessons).toEqual([]);
    expect(state.runtimeChecks).toEqual({});
  });
  it('records trusted behavioral results separately and does not duplicate completion on retry', () => {
    const result = {lessonId:'urls',kind:'runtime' as const,passed:true,results:[{id:'response',label:'Response',passed:true,feedback:'HTTP 200'}],checkedAt:new Date().toISOString()};
    const state = applyVerification(applyVerification(createInitialState(),result),result);
    expect(state.completedLessons).toEqual(['urls']);
    expect(state.runtimeChecks.urls).toEqual(result);
  });
  it('does not accept contradictory or empty passing results', () => {
    const result = {lessonId:'urls',kind:'runtime' as const,passed:true,results:[],checkedAt:new Date().toISOString()};
    expect(applyVerification(createInitialState(),result).completedLessons).toEqual([]);
    expect(() => checkKnowledge('unknown',{})).toThrow('does not exist');
  });
});
