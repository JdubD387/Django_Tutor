import 'fake-indexeddb/auto';
import { openDB, deleteDB } from 'idb';
import { beforeEach, describe, expect, it } from 'vitest';
import { DATABASE_NAME, STATE_KEY, createInitialState, loadState, saveState, validateState } from './persistence';

beforeEach(async () => { await deleteDB(DATABASE_NAME); });

describe('browser-local learning repository', () => {
  it('recovers files, answers, and progress after a save/read roundtrip', async () => {
    const state = createInitialState();
    state.files['polls/views.py'] = '# My own work\n';
    state.currentLesson = 'urls';
    state.quizAnswers.intro = {settings:1};
    state.lastSavedAt = new Date().toISOString();
    await saveState(state);
    expect(await loadState()).toEqual(state);
  });
  it('strips unknown credentials and never persists AI enablement', async () => {
    const state = {...createInitialState(), apiKey:'must-not-be-saved'};
    Object.assign(state.preferences,{aiMode:'cloud',apiKey:'must-not-be-saved'});
    await saveState(state);
    const db = await openDB(DATABASE_NAME,1);
    const raw = await db.get('state',STATE_KEY); db.close();
    expect(JSON.stringify(raw)).not.toContain('must-not-be-saved');
    expect((await loadState()).preferences.aiMode).toBe('disabled');
  });
  it('keeps invalid saved data intact and refuses to overwrite it', async () => {
    await loadState();
    const db = await openDB(DATABASE_NAME,1);
    await db.put('state',{version:99,files:{'important.py':'keep me'}},STATE_KEY); db.close();
    await expect(loadState()).rejects.toThrow('preserved');
    await expect(saveState(createInitialState())).rejects.toThrow('preserved');
    const reopened = await openDB(DATABASE_NAME,1);
    expect(await reopened.get('state',STATE_KEY)).toEqual({version:99,files:{'important.py':'keep me'}}); reopened.close();
  });
  it('rejects unsafe paths and invalid active files before writing', async () => {
    const state = createInitialState();
    state.files['../secret.py'] = 'x';
    expect(() => validateState(state)).toThrow();
    const another = createInitialState(); another.activeFile = 'missing.py';
    await expect(saveState(another)).rejects.toThrow();
  });
  it('serializes concurrent saves and preserves the latest snapshot', async () => {
    const first = createInitialState(); first.files['polls/views.py'] = '# first';
    const second = createInitialState(); second.files['polls/views.py'] = '# second';
    await Promise.all([saveState(first),saveState(second)]);
    expect((await loadState()).files['polls/views.py']).toBe('# second');
  });
});
