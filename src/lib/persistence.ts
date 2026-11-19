import { openDB } from 'idb';
import { z } from 'zod';
import type { LearnerState } from '../../shared/types';
import { lessons, starterFiles } from '../data/curriculum';

export const DATABASE_NAME = 'django-tutor';
export const STATE_KEY = 'learner-state';
const knownLesson = z.string().refine(id => lessons.some(lesson => lesson.id === id), 'Unknown lesson');
const safePath = z.string().min(1).max(180).refine(path => /^[a-zA-Z0-9_./-]+$/.test(path) && !path.startsWith('/') && !path.split('/').some(part => !part || part === '.' || part === '..') && !['__proto__', 'constructor', 'prototype'].includes(path), 'Unsafe project path');
const checkResult = z.object({id:z.string(), label:z.string(), passed:z.boolean(), feedback:z.string()});
const verification = z.object({lessonId:knownLesson, passed:z.boolean(), kind:z.enum(['knowledge','runtime']), results:z.array(checkResult).max(40), checkedAt:z.iso.datetime()});
const preferences = z.object({theme:z.enum(['light','dark']),fontSize:z.number().int().min(12).max(24),wordWrap:z.boolean(),aiMode:z.enum(['disabled','local','cloud']),model:z.string().max(120),localEndpoint:z.string().max(300)});
const stateSchema = z.object({
  version:z.literal(1), files:z.record(safePath,z.string().max(100_000)).refine(files => Object.keys(files).length > 0 && Object.keys(files).length <= 80 && Object.values(files).reduce((size, text) => size + text.length, 0) <= 500_000,'Project storage limit exceeded'),
  activeFile:safePath, openFiles:z.array(safePath).min(1).max(80), currentLesson:knownLesson,
  completedLessons:z.array(knownLesson).max(lessons.length), knowledgeChecks:z.record(knownLesson,verification),runtimeChecks:z.record(knownLesson,verification),
  quizAnswers:z.record(knownLesson,z.record(z.string(),z.number().int().min(0).max(20))),
  preferences, lastSavedAt:z.iso.datetime().nullable(),lastProject:z.string().max(120),
}).superRefine((state,context) => {
  if (!(state.activeFile in state.files) || state.openFiles.some(path => !(path in state.files))) context.addIssue({code:'custom',message:'An open file is missing from this saved project.'});
  for (const [id,result] of Object.entries(state.knowledgeChecks)) if (id !== result.lessonId || result.kind !== 'knowledge') context.addIssue({code:'custom',message:'Invalid knowledge-check record.'});
  for (const [id,result] of Object.entries(state.runtimeChecks)) if (id !== result.lessonId || result.kind !== 'runtime') context.addIssue({code:'custom',message:'Invalid runtime-check record.'});
});

export class StorageError extends Error {
  constructor(message: string) { super(message); this.name = 'StorageError'; }
}

export function createInitialState(): LearnerState {
  return {version:1,files:{...starterFiles},activeFile:'manage.py',openFiles:['manage.py'],currentLesson:'intro',completedLessons:[],knowledgeChecks:{},runtimeChecks:{},quizAnswers:{},preferences:{theme:'light',fontSize:14,wordWrap:true,aiMode:'disabled',model:'gemini-3.8-flash',localEndpoint:'http://localhost:11434'},lastSavedAt:null,lastProject:'Community Polls'};
}

/** Whitelist fields; never persist credentials or enabled AI authorization. */
export function validateState(value: unknown): LearnerState {
  const parsed = stateSchema.safeParse(value);
  if (!parsed.success) throw new StorageError('Saved learning data is invalid or from an unsupported version. It has been preserved; do not reset it unless you have a backup.');
  return {...parsed.data,preferences:{...parsed.data.preferences,aiMode:'disabled'}};
}

async function database() {
  if (!globalThis.indexedDB) throw new StorageError('Browser storage is unavailable. Your changes are only in this tab; keep it open and copy important work before leaving.');
  return openDB(DATABASE_NAME,1,{upgrade(db){ if (!db.objectStoreNames.contains('state')) db.createObjectStore('state'); }});
}

export async function loadState(): Promise<LearnerState> {
  try {
    const db = await database();
    try { const value:unknown = await db.get('state',STATE_KEY); return value === undefined ? createInitialState() : validateState(value); }
    finally { db.close(); }
  } catch (error) {
    if (error instanceof StorageError) throw error;
    throw new StorageError('Could not read browser storage. Existing data has not been replaced. Keep this tab open and check browser storage permissions.');
  }
}

let saveQueue: Promise<void> = Promise.resolve();
export function saveState(state: LearnerState): Promise<void> {
  // Validate and snapshot immediately, before a caller can modify its object.
  let snapshot: LearnerState;
  try { snapshot = validateState(state); } catch (error) { return Promise.reject(error); }
  const save = async () => {
    try {
      const db = await database();
      try {
        const tx = db.transaction('state','readwrite');
        const previous:unknown = await tx.store.get(STATE_KEY);
        // Preserve corrupt/unknown versions instead of silently overwriting them.
        if (previous !== undefined) validateState(previous);
        await tx.store.put(snapshot,STATE_KEY);
        await tx.done;
      } finally { db.close(); }
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError('Could not save your work. It remains in this tab. Browser storage may be full or blocked; copy important code before leaving.');
    }
  };
  const pending = saveQueue.then(save,save);
  saveQueue = pending.catch(() => undefined);
  return pending;
}
