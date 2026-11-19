import { useEffect, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { EditorView } from '@codemirror/view';
import { oneDark } from '@codemirror/theme-one-dark';
import { BookOpen, Check, CheckCircle2, ChevronDown, Code2, FileCode2, FolderOpen, Info, Play, RotateCcw, Save, Square, Terminal, X } from 'lucide-react';
import type { LearnerState, Lesson, RuntimeAction, RuntimeResult, RuntimeStatus, Verification } from '../../shared/types';
import { lessons } from '../data/curriculum';
import { applyVerification, checkKnowledge } from '../lib/verification';

interface Props { state:LearnerState; update:(fn:(s:LearnerState)=>LearnerState)=>void; onSave:()=>Promise<void>; saveStatus:string; runtime:RuntimeStatus; run:(action:RuntimeAction,lessonId:string)=>Promise<RuntimeResult>; }
const commands:Record<RuntimeAction,string>={start:'python manage.py runserver',stop:'Stop the isolated Django server',restart:'Restart the isolated Django server',test:'python manage.py test',migrate:'python manage.py makemigrations polls; python manage.py migrate',check:'Run trusted lesson checks'};

function Feedback({verification}:{verification:Verification}) {
  return <div className="feedback" role="status"><div className={`feedback-title ${verification.passed?'success':'warning'}`}><CheckCircle2 size={17}/>{verification.passed?'Knowledge check passed':'A little more to explore'}</div>{verification.results.map(result=><div className="check-result" key={result.id}><span className={result.passed?'success':'warning'}>{result.passed?<Check size={16}/>:<Info size={16}/>}</span><div><strong>{result.label}</strong><p>{result.feedback}</p></div></div>)}</div>;
}

function LessonContent({lesson,state,update}:{lesson:Lesson;state:LearnerState;update:Props['update']}) {
  const [tab,setTab]=useState<'learn'|'exercise'>('learn');
  const answers=state.quizAnswers[lesson.id]??{};
  const verification=state.knowledgeChecks[lesson.id];
  const check=()=>update(s=>applyVerification(s,checkKnowledge(lesson.id,s.quizAnswers[lesson.id]??{})));
  useEffect(()=>setTab('learn'),[lesson.id]);
  return <section className="lesson-pane" aria-label="Lesson instructions">
    <div className="lesson-pane-top"><span className="eyebrow">LESSON {String(lesson.number).padStart(2,'0')}</span><span className="tiny-text">{lesson.duration} min</span></div>
    <h2>{lesson.title}</h2><p className="muted">{lesson.subtitle}</p>
    <div className="segment-tabs"><button className={tab==='learn'?'active':''} onClick={()=>setTab('learn')}><BookOpen size={16}/> Learn</button><button className={tab==='exercise'?'active':''} onClick={()=>setTab('exercise')}><Code2 size={16}/> Practice</button></div>
    {tab==='learn'?<><div className="objectives"><h3>By the end of this lesson</h3>{lesson.objectives.map(item=><p key={item}><CheckCircle2 size={15}/>{item}</p>)}</div>{lesson.sections.map(section=><article className="lesson-section" key={section.title}><h3>{section.title}</h3><p>{section.body}</p>{section.code&&<pre><code>{section.code}</code></pre>}</article>)}<div className="docs-links"><h3>Go to the source</h3>{lesson.docs.map(doc=><a href={doc.url} key={doc.url} target="_blank" rel="noreferrer">{doc.title}<BookOpen size={14}/></a>)}</div><button className="button primary full" onClick={()=>setTab('exercise')}>Try the activity</button></>:<>
    <h3>{lesson.exercise.title}</h3><ol className="instructions">{lesson.exercise.instructions.map(item=><li key={item}>{item}</li>)}</ol>
    <div className="requirements"><h4>What you’re working toward</h4>{lesson.exercise.requirements.map(item=><p key={item}><span className="empty-check"/>{item}</p>)}</div>
    <details className="hint-box"><summary>Need a nudge?<ChevronDown size={16}/></summary>{lesson.hints.map((hint,i)=><p key={hint}><strong>Hint {i+1}.</strong> {hint}</p>)}</details>
    <div className="quiz"><h3>Check your understanding</h3><p className="muted small-text">This checks your knowledge. It does not run Python or verify your code.</p>{lesson.quiz.map((question,i)=><fieldset key={question.id}><legend>{i+1}. {question.prompt}</legend>{question.options.map((option,index)=><label className={`radio-option ${answers[question.id]===index?'selected':''}`} key={option}><input type="radio" name={`${lesson.id}-${question.id}`} checked={answers[question.id]===index} onChange={()=>update(s=>({...s,quizAnswers:{...s.quizAnswers,[lesson.id]:{...s.quizAnswers[lesson.id],[question.id]:index}}}))}/><span>{option}</span></label>)}</fieldset>)}<button className="button primary full" onClick={check}><CheckCircle2 size={17}/>Check my understanding</button></div>
    {verification&&<Feedback verification={verification}/>}
    {lesson.requiresRuntime&&<div className="inline-notice"><Info size={17}/><p>Passing the knowledge check records your understanding. Completing this lesson also requires real Django code checks through an isolated runtime.</p></div>}
    </>}
  </section>;
}

export default function Workspace({state,update,onSave,saveStatus,runtime,run}:Props) {
  const lesson=lessons.find(item=>item.id===state.currentLesson)??lessons[0];
  const [panel,setPanel]=useState<'output'|'preview'|'results'>('output');
  const [output,setOutput]=useState('No commands have been run. Your editor and lessons work without a connected runtime.');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [showFiles,setShowFiles]=useState(true);
  const [showLesson,setShowLesson]=useState(true);
  const [preview,setPreview]=useState<string|undefined>(runtime.previewUrl);
  const runtimeVerification=state.runtimeChecks[lesson.id];
  const openFile=(path:string)=>update(s=>({...s,activeFile:path,openFiles:s.openFiles.includes(path)?s.openFiles:[...s.openFiles,path]}));
  const closeFile=(path:string)=>update(s=>{const remaining=s.openFiles.filter(p=>p!==path);return {...s,openFiles:remaining.length?remaining:[path],activeFile:s.activeFile===path?(remaining[remaining.length-1]??path):s.activeFile};});
  const execute=async(action:RuntimeAction)=>{setBusy(true);setError('');setPanel(action==='check'?'results':'output');try{const result=await run(action,lesson.id);setOutput(result.output||result.message);setPreview(result.previewUrl);if(result.verification){update(s=>applyVerification(s,result.verification!));}if(action==='start'&&result.previewUrl)setPanel('preview');}catch(err){setError(err instanceof Error?err.message:'The runtime could not be reached. Your work is still here.');}finally{setBusy(false);}};
  useEffect(()=>setPreview(runtime.previewUrl),[runtime.previewUrl]);
  const activeFile=state.activeFile;
  return <div className="workspace-page">
    <div className="workspace-heading"><div><span className="eyebrow">YOUR LEARNING WORKSPACE</span><h1>Build your first Django app</h1></div><div className="workspace-top-actions"><button className="button secondary" onClick={()=>setShowLesson(v=>!v)}>{showLesson?'Hide lesson':'Show lesson'}</button><button className="button primary" onClick={()=>void onSave()}><Save size={16}/>Save project</button></div></div>
    <div className="workspace-lesson-picker"><label htmlFor="lesson-select">Current lesson</label><select id="lesson-select" value={lesson.id} onChange={e=>{const next=lessons.find(l=>l.id===e.target.value)!;update(s=>({...s,currentLesson:next.id,activeFile:next.file,openFiles:s.openFiles.includes(next.file)?s.openFiles:[...s.openFiles,next.file]}));}}>{lessons.map(l=><option key={l.id} value={l.id}>{String(l.number).padStart(2,'0')} · {l.title}{state.completedLessons.includes(l.id)?' · Complete':''}</option>)}</select><span className="small-text muted">One project. Everything you write stays with you.</span></div>
    <div className={`workspace-grid ${showLesson?'':'lesson-hidden'}`}>
      {showLesson&&<LessonContent lesson={lesson} state={state} update={update}/>}
      <section className="development-pane" aria-label="Code workspace"><div className="project-bar"><span><FolderOpen size={16}/> my-first-poll</span><span className="save-indicator" role="status">{saveStatus}</span></div>
      <div className={`editor-layout ${showFiles?'':'files-hidden'}`}><aside className="file-explorer" aria-label="Project files"><div className="explorer-heading">EXPLORER<button aria-label="Collapse file explorer" onClick={()=>setShowFiles(false)}><X size={14}/></button></div><div className="root-folder"><FolderOpen size={15}/> my-first-poll</div>{Object.keys(state.files).sort().map(path=><button key={path} title={path} className={`file-item ${activeFile===path?'selected':''}`} onClick={()=>openFile(path)}><FileCode2 size={14}/><span>{path}</span></button>)}</aside>
      <div className="editor-container"><div className="file-tabs">{!showFiles&&<button className="file-toggle" onClick={()=>setShowFiles(true)} aria-label="Show file explorer"><FolderOpen size={16}/></button>}{state.openFiles.map(path=><div key={path} className={`file-tab ${path===activeFile?'active':''}`}><button onClick={()=>openFile(path)}><FileCode2 size={14}/>{path.split('/').pop()}</button><button onClick={()=>closeFile(path)} aria-label={`Close ${path}`}><X size={12}/></button></div>)}</div><div className="file-breadcrumb">my-first-poll <span>/</span> {activeFile}</div>{state.openFiles.map(path=><div key={path} hidden={path!==activeFile}><CodeMirror value={state.files[path]??''} height="410px" extensions={[path.endsWith('.html')?html():python(),...(state.preferences.wordWrap?[EditorView.lineWrapping]:[])]} theme={state.preferences.theme==='dark'?oneDark:'light'} basicSetup={{lineNumbers:true,foldGutter:true,highlightActiveLine:true,autocompletion:true,tabSize:4}} style={{fontSize:`${state.preferences.fontSize}px`}} onChange={value=>update(s=>({...s,files:{...s.files,[path]:value}}))} aria-label={`Code editor for ${path}`}/></div>)}<div className="editor-status"><span>{activeFile.endsWith('.html')?'Django HTML':'Python'}</span><span>Spaces: 4 <span className="status-divider">UTF-8</span></span></div></div></div>
      <div className="runtime-toolbar"><button className="button primary compact" title={commands.start} disabled={!runtime.available||busy} onClick={()=>void execute('start')}><Play size={14}/>Run project</button><button className="icon-button" title={commands.stop} aria-label="Stop project" disabled={!runtime.available||busy} onClick={()=>void execute('stop')}><Square size={14}/></button><button className="icon-button" title={commands.restart} aria-label="Restart project" disabled={!runtime.available||busy} onClick={()=>void execute('restart')}><RotateCcw size={15}/></button><button className="button subtle compact" title={commands.test} disabled={!runtime.available||busy} onClick={()=>void execute('test')}>Run tests</button><button className="button subtle compact" title={commands.migrate} disabled={!runtime.available||busy} onClick={()=>void execute('migrate')}>Migrate</button><button className="button secondary compact" title={commands.check} disabled={!runtime.available||busy} onClick={()=>void execute('check')}>Check code</button></div>
      <div className="output-tabs"><button className={panel==='output'?'active':''} onClick={()=>setPanel('output')}><Terminal size={15}/>Console</button><button className={panel==='preview'?'active':''} onClick={()=>setPanel('preview')}>Website preview</button><button className={panel==='results'?'active':''} onClick={()=>setPanel('results')}>Code checks</button><span className={`runtime-state ${runtime.available?'success':''}`}>{busy?'Working…':runtime.available?runtime.status:'Runtime not connected'}</span></div>
      <div className="output-panel" aria-live="polite">{error&&<div className="error-banner">{error}</div>}{!runtime.available&&<div className="runtime-notice"><div className="notice-icon"><Terminal size={20}/></div><div><strong>A place for your Django app to run</strong><p>{runtime.message}</p><p>Your files, knowledge checks, and progress work now. Python execution and website preview need a separate isolated service. See <code>docs/RUNTIME.md</code> in this project for setup.</p></div></div>}{panel==='output'&&<><pre className="console-output">{output}</pre><details className="command-help"><summary>What do these controls do?</summary><dl>{Object.entries(commands).map(([action,command])=><div key={action}><dt>{action}</dt><dd><code>{command}</code></dd></div>)}</dl><p>Only these approved actions are available. There is no unrestricted shell.</p></details></>}{panel==='preview'&&(preview?<iframe title="Isolated Django application preview" src={preview} sandbox="allow-scripts allow-forms" referrerPolicy="no-referrer"/>:<div className="preview-empty"><Code2 size={26}/><h3>Your app will appear here</h3><p>Start a connected Django runtime to see its actual response.</p></div>)}{panel==='results'&&(runtimeVerification?<div className="runtime-results"><strong>{runtimeVerification.passed?'Code requirements passed':'Some code requirements need attention'}</strong>{runtimeVerification.results.map(result=><div className="check-result" key={result.id}><span className={result.passed?'success':'warning'}>{result.passed?<Check size={16}/>:<Info size={16}/>}</span><div><strong>{result.label}</strong><p>{result.feedback}</p></div></div>)}</div>:<div className="preview-empty"><CheckCircle2 size={25}/><h3>No Django code checks yet</h3><p>Knowledge checks live in Practice. Code checks only appear after trusted tests actually run.</p></div>)}</div>
      </section>
    </div>
    <div className="debugging-bar"><Info size={18}/><div><strong>Stuck? Start with the error.</strong><span> A 404 often means a URL is missing. TemplateDoesNotExist points to a template path. An unapplied migration means your database needs updating.</span></div><a href="https://docs.djangoproject.com/en/5.2/intro/tutorial01/" target="_blank" rel="noreferrer">Django docs</a></div>
  </div>;
}
