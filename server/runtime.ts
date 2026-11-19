import { z } from 'zod';
import type { RuntimeAction, RuntimeResult, RuntimeStatus } from '../shared/types.js';
import { readJson, ServiceError } from './http.js';

export const projectPath = z.string().max(180).regex(/^(?!\/)(?!.*(?:^|\/)\.\.?\/)(?!.*\\)[a-zA-Z0-9_./-]+\.(?:py|html|css|js|json|txt|md)$/)
  .refine(path => path.split('/').every(part => part !== '..' && part !== '.' && part.length > 0), 'Invalid project path');
export const filesSchema = z.record(projectPath, z.string().max(65_536)).refine(files => Object.keys(files).length > 0 && Object.keys(files).length <= 40 && Object.entries(files).reduce((size,[path,content]) => size + Buffer.byteLength(path + content),0) <= 262_144, 'Project is too large');
export const actionSchema = z.object({action:z.enum(['start','stop','restart','test','migrate','check']), files:filesSchema, lessonId:z.string().regex(/^[a-z0-9-]{1,64}$/).optional()}).strict();
const checkSchema = z.object({id:z.string().max(100),label:z.string().max(300),passed:z.boolean(),feedback:z.string().max(2000)}).strict();
const verificationSchema = z.object({lessonId:z.string().max(64),passed:z.boolean(),kind:z.literal('runtime'),results:z.array(checkSchema).min(1).max(30),checkedAt:z.iso.datetime()}).strict();
const resultSchema = z.object({available:z.boolean(),status:z.enum(['unavailable','stopped','running','error']),message:z.string().max(2000),previewUrl:z.string().max(2048).optional(),output:z.string().max(200_000).default(''),verification:verificationSchema.optional()}).strict();
export interface RuntimeConfig { serviceUrl?: string; token?: string; previewOrigin?: string; appOrigin?: string; }
export const unavailable: RuntimeStatus = {available:false,status:'unavailable',message:'Django runtime is not connected. You can edit, save, and complete knowledge activities. Running Django and verifying code require an isolated execution service.'};

export class RuntimeAdapter {
  private base?: URL;
  private preview?: string;
  private token?: string;
  constructor(config: RuntimeConfig, private request: typeof fetch = fetch) {
    if (!config.serviceUrl && !config.token && !config.previewOrigin) return;
    if (!config.serviceUrl || !config.token || !config.previewOrigin || !config.appOrigin) throw new Error('Runtime configuration requires service URL, service token, preview origin, and APP_ORIGIN together.');
    const base = new URL(config.serviceUrl);
    const preview = new URL(config.previewOrigin);
    const app = new URL(config.appOrigin);
    if (app.protocol !== 'https:' || app.username || app.password || app.pathname !== '/' || app.search || app.hash || base.protocol !== 'https:' || base.username || base.password || base.search || base.hash || preview.protocol !== 'https:' || preview.username || preview.password || preview.pathname !== '/' || preview.search || preview.hash || preview.origin === app.origin || preview.origin === base.origin) throw new Error('Runtime requires HTTPS service, a credential-free APP_ORIGIN, and a separate, credential-free preview origin.');
    this.base = base;
    this.preview = preview.origin;
    this.token = config.token;
  }
  get previewOrigin() { return this.preview; }
  private async call(sessionId:string, action?:RuntimeAction, files?:Record<string,string>, lessonId?:string):Promise<RuntimeResult> {
    if (!this.base) return {...unavailable,output:''};
    const url = new URL(this.base.toString().replace(/\/$/,'') + `/v1/sessions/${sessionId}${action ? '/actions' : ''}`);
    try {
      const response = await this.request(url, {method:action?'POST':'GET',redirect:'error',signal:AbortSignal.timeout(action ? 25_000 : 8_000),headers:{Authorization:`Bearer ${this.token}`,'Content-Type':'application/json'},...(action?{body:JSON.stringify({action,files,lessonId})}:{})});
      const parsed = resultSchema.safeParse(await readJson(response));
      if (!parsed.success) throw new ServiceError(502,'The runtime returned an invalid response.');
      const result = parsed.data;
      if (result.previewUrl) {
        const preview = new URL(result.previewUrl);
        if (preview.origin !== this.preview || preview.username || preview.password || preview.protocol !== 'https:') throw new ServiceError(502,'The runtime returned an untrusted preview address.');
      }
      if (result.status === 'running' && (!result.available || !result.previewUrl)) throw new ServiceError(502,'The runtime did not provide a running preview.');
      if (result.verification && (action !== 'check' || !result.available || !['running','stopped'].includes(result.status) || result.verification.lessonId !== lessonId || result.verification.passed !== result.verification.results.every(check => check.passed))) throw new ServiceError(502,'The runtime returned inconsistent verification results.');
      // Never return the administrator's token even if a misconfigured service echoes it.
      const safe = JSON.stringify(result).split(this.token!).join('[redacted]');
      return JSON.parse(safe) as RuntimeResult;
    } catch (error) {
      const message = error instanceof ServiceError ? error.message : 'The isolated runtime could not be reached. Your saved files are unaffected.';
      return {available:false,status:'error',message,output:''};
    }
  }
  status(sessionId:string):Promise<RuntimeStatus> { return this.call(sessionId); }
  action(sessionId:string, input:z.infer<typeof actionSchema>) { return this.call(sessionId,input.action,input.files,input.lessonId); }
}
