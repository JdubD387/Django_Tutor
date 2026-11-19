import crypto from 'node:crypto';
import express from 'express';
import type { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { aiConfigSchema, GeminiAdapter, messageSchema, type CloudCredential } from './ai.js';
import { RuntimeAdapter, actionSchema, type RuntimeConfig } from './runtime.js';
import { ServiceError } from './http.js';

interface Session { id:string; csrf:string; created:number; touched:number; cloud?:CloudCredential; }
export interface AppOptions { runtime?:RuntimeConfig; appOrigin?:string; request?:typeof fetch; now?:()=>number; }
export function createApp(options:AppOptions = {}):Express {
  const app = express();
  app.disable('x-powered-by');
  const sessions = new Map<string,Session>();
  const now = options.now ?? Date.now;
  const runtime = new RuntimeAdapter({...options.runtime,appOrigin:options.appOrigin},options.request);
  const ai = new GeminiAdapter(options.request);
  const origin = options.appOrigin ? new URL(options.appOrigin).origin : undefined;
  const secure = origin?.startsWith('https:') ?? false;
  app.use(helmet({contentSecurityPolicy:{directives:{'default-src':["'self'"],'script-src':["'self'",...(process.env.NODE_ENV !== 'production'?["'unsafe-inline'"]:[])],'style-src':["'self'","'unsafe-inline'"],'connect-src':["'self'",...(process.env.NODE_ENV !== 'production'?['ws://localhost:*','ws://127.0.0.1:*']:[])],'img-src':["'self'",'data:'],'font-src':["'self'"],'frame-src':runtime.previewOrigin?[runtime.previewOrigin]:["'none'"],'object-src':["'none'"],'base-uri':["'self'"],'form-action':["'self'"],'upgrade-insecure-requests':null}}}));
  app.use('/api',(req,res,next)=>{res.set('Cache-Control','no-store'); next();});
  app.use('/api',rateLimit({windowMs:60_000,limit:150,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'Too many requests. Please wait a minute and try again.'}}));
  app.use('/api',(req:Request,res:Response,next:NextFunction)=>{
    // Local development is loopback-only. Hosted deployments must pin APP_ORIGIN.
    const host = req.get('host') ?? '';
    if (!origin && !/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host)) { res.status(403).json({error:'Set APP_ORIGIN before serving this application on a hosted domain.'}); return; }
    const expected = origin ?? `http://${host}`;
    if ((req.get('origin') && req.get('origin') !== expected) || req.get('sec-fetch-site') === 'cross-site') {res.status(403).json({error:'Cross-origin API requests are not allowed.'});return;}
    const timestamp = now();
    for (const [key,value] of sessions) if (timestamp-value.touched > 30*60_000 || timestamp-value.created > 8*60*60_000) sessions.delete(key);
    const cookie = req.get('cookie')?.split(';').map(part=>part.trim()).find(part=>part.startsWith('djt_session='))?.slice('djt_session='.length);
    let session = cookie && /^[a-f0-9]{64}$/.test(cookie) ? sessions.get(cookie) : undefined;
    if (!session) {
      if (sessions.size >= 500) {res.status(503).json({error:'Too many active sessions. Please try again later.'});return;}
      session = {id:crypto.randomUUID(),csrf:crypto.randomBytes(32).toString('hex'),created:timestamp,touched:timestamp};
      const token = crypto.randomBytes(32).toString('hex');
      sessions.set(token,session);
      res.cookie('djt_session',token,{httpOnly:true,sameSite:'strict',secure,path:'/api',maxAge:30*60_000});
    }
    session.touched = timestamp;
    res.locals.session = session;
    if (!['GET','HEAD','OPTIONS'].includes(req.method) && req.get('x-csrf-token') !== session.csrf) {res.status(403).json({error:'This session changed or expired. Refresh the page and try again.'});return;}
    next();
  });
  app.use('/api',express.json({limit:'350kb',strict:true}));
  const getSession = (res:Response) => res.locals.session as Session;
  app.get('/api/health',(_req,res)=>res.json({ok:true}));
  app.get('/api/session',(_req,res)=>{const session=getSession(res);delete session.cloud;res.json({csrfToken:session.csrf});});
  app.get('/api/runtime/status',async(_req,res)=>res.json(await runtime.status(getSession(res).id)));
  app.post('/api/runtime/action',async(req,res)=>{
    const input=actionSchema.parse(req.body);
    if(input.action==='check' && !input.lessonId) throw new ServiceError(400,'Choose a lesson before checking your work.');
    res.json(await runtime.action(getSession(res).id,input));
  });
  app.get('/api/ai/status',(_req,res)=>res.json({enabled:!!getSession(res).cloud,mode:getSession(res).cloud?'cloud':'disabled',message:getSession(res).cloud?'Cloud AI is enabled for this session. Questions may incur provider charges.':'AI is disabled. No model requests are made.'}));
  app.post('/api/ai/config',(req,res)=>{
    const config=aiConfigSchema.parse(req.body);
    const session=getSession(res);
    delete session.cloud;
    if(config.mode==='local') {res.status(503).json({enabled:false,mode:'disabled',error:'Local AI is unavailable. An authenticated local companion has not been implemented. Do not expose Ollama publicly or weaken browser security.'});return;}
    if(config.mode==='cloud') session.cloud={model:config.model,apiKey:config.apiKey};
    res.json({enabled:!!session.cloud,mode:session.cloud?'cloud':'disabled',message:session.cloud?'Cloud AI enabled for this session only. No provider request has been sent.':'AI disabled and session credentials cleared.'});
  });
  const requireCloud=(res:Response) => {const cloud=getSession(res).cloud;if(!cloud)throw new ServiceError(403,'AI is disabled. Explicitly enable a cloud connection with your own key first.');return cloud;};
  const aiLimiter=rateLimit({windowMs:60_000,limit:12,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'AI request limit reached. Wait a minute before retrying.'}});
  app.get('/api/ai/models',aiLimiter,async(_req,res)=>res.json(await ai.models(requireCloud(res))));
  app.post('/api/ai/test',aiLimiter,async(_req,res)=>res.json(await ai.test(requireCloud(res))));
  app.post('/api/ai/message',aiLimiter,async(req,res)=>{const credential=requireCloud(res);res.json(await ai.message(credential,messageSchema.parse(req.body)));});
  app.use('/api',(_req,res)=>res.status(404).json({error:'API route not found.'}));
  app.use((error:unknown,_req:Request,res:Response,_next:NextFunction)=>{
    if(error instanceof z.ZodError) {res.status(400).json({error:'Some request fields are invalid. Check the input and try again.'});return;}
    if(error instanceof ServiceError) {res.status(error.status).json({error:error.message});return;}
    const status = (error as {status?:number})?.status;
    if(status===413){res.status(413).json({error:'This request is too large. Reduce the project or message size.'});return;}
    if(status===400){res.status(400).json({error:'The request body must contain valid JSON.'});return;}
    res.status(500).json({error:'The request could not be completed. Your saved browser data is unaffected.'});
  });
  return app;
}
