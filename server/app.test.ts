import { describe,it,expect,vi } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { RuntimeAdapter } from './runtime.js';

const local = (app:ReturnType<typeof createApp>) => request.agent(app);
const fixture = {'manage.py':'# learner starter','polls/views.py':'# write a view'};
const config={mode:'cloud',provider:'gemini',model:'gemini-3.8-flash',apiKey:'test_user_private_key'};
describe('application security and unavailable runtime',()=>{
  it('provides a real session and an honest runtime unavailable state',async()=>{
    const fetch=vi.fn();const app=createApp({request:fetch});const agent=local(app);
    const session=await agent.get('/api/session').expect(200);
    expect(session.body.csrfToken).toHaveLength(64);
    expect(session.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(session.headers['set-cookie'][0]).toContain('SameSite=Strict');
    const status=await agent.get('/api/runtime/status').expect(200);
    expect(status.body).toMatchObject({available:false,status:'unavailable'});
    const action=await agent.post('/api/runtime/action').set('X-CSRF-Token',session.body.csrfToken).send({action:'check',files:fixture,lessonId:'urls-views'}).expect(200);
    expect(action.body.output).toBe('');expect(action.body.verification).toBeUndefined();expect(fetch).not.toHaveBeenCalled();
  });
  it('requires CSRF and rejects cross origin requests',async()=>{
    const app=createApp();const agent=local(app);const session=await agent.get('/api/session');
    await agent.post('/api/ai/config').send(config).expect(403);
    await agent.post('/api/ai/config').set('X-CSRF-Token',session.body.csrfToken).set('Origin','https://attacker.example').send(config).expect(403);
    await agent.get('/api/ai/status').set('Sec-Fetch-Site','cross-site').expect(403);
    await agent.get('/api/health').set('Host','attacker.example').expect(403);
  });
  it('rejects commands, path traversal, oversized projects, and invalid JSON safely',async()=>{
    const app=createApp();const agent=local(app);const session=await agent.get('/api/session');const csrf=session.body.csrfToken;
    for(const body of [{action:'shell',files:fixture},{action:'start',files:{'../secrets.py':'x'}},{action:'start',files:{'polls\\views.py':'x'}},{action:'start',files:{'views.py':'x'.repeat(65_537)}},{action:'check',files:fixture}]) await agent.post('/api/runtime/action').set('X-CSRF-Token',csrf).send(body).expect(400);
    await agent.post('/api/runtime/action').set('X-CSRF-Token',csrf).set('Content-Type','application/json').send('{bad').expect(400);
    const oversized=await agent.post('/api/runtime/action').set('X-CSRF-Token',csrf).send({x:'x'.repeat(360_000)}).expect(413);
    expect(oversized.body.error).not.toContain('stack');
  });
  it('expires session credentials and leaves other sessions isolated',async()=>{
    let timestamp=1000;const app=createApp({now:()=>timestamp});const a=local(app),b=local(app);
    const session=await a.get('/api/session');await a.post('/api/ai/config').set('X-CSRF-Token',session.body.csrfToken).send(config).expect(200);
    expect((await a.get('/api/ai/status')).body.enabled).toBe(true);
    expect((await b.get('/api/ai/status')).body.enabled).toBe(false);
    timestamp+=31*60_000;
    expect((await a.get('/api/ai/status')).body.enabled).toBe(false);
    await a.post('/api/ai/config').set('X-CSRF-Token',session.body.csrfToken).send(config).expect(403);
  });
});
describe('optional cloud AI',()=>{
  it('makes no provider request while disabled and does not use environment credentials',async()=>{
    const fetch=vi.fn();const app=createApp({request:fetch});const agent=local(app);const session=await agent.get('/api/session');
    expect((await agent.get('/api/ai/status')).body.mode).toBe('disabled');
    await agent.post('/api/ai/message').set('X-CSRF-Token',session.body.csrfToken).send({message:'Explain views'}).expect(403);
    await agent.post('/api/ai/test').set('X-CSRF-Token',session.body.csrfToken).send({}).expect(403);
    await agent.get('/api/ai/models').expect(403);expect(fetch).not.toHaveBeenCalled();
  });
  it('requires a personal key, never connects to local endpoints, and clears on reload',async()=>{
    const fetch=vi.fn();const app=createApp({request:fetch});const agent=local(app);const session=await agent.get('/api/session');const csrf=session.body.csrfToken;
    await agent.post('/api/ai/config').set('X-CSRF-Token',csrf).send({mode:'cloud',provider:'gemini',model:config.model}).expect(400);
    const enabled=await agent.post('/api/ai/config').set('X-CSRF-Token',csrf).send(config).expect(200);
    expect(JSON.stringify(enabled.body)).not.toContain(config.apiKey);expect(fetch).not.toHaveBeenCalled();
    await agent.get('/api/session').expect(200);expect((await agent.get('/api/ai/status')).body.enabled).toBe(false);
    await agent.post('/api/ai/config').set('X-CSRF-Token',csrf).send({mode:'local'}).expect(503);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('tests metadata separately from generation and sends only authorized context',async()=>{
    const fetch=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({name:`models/${config.model}`,supportedGenerationMethods:['generateContent']}))).mockResolvedValueOnce(new Response(JSON.stringify({candidates:[{content:{parts:[{text:'A view handles a request.'}]}}]})));
    const app=createApp({request:fetch});const agent=local(app);const session=await agent.get('/api/session');const csrf=session.body.csrfToken;
    await agent.post('/api/ai/config').set('X-CSRF-Token',csrf).send(config);
    expect((await agent.post('/api/ai/test').set('X-CSRF-Token',csrf).send({}).expect(200)).body.ok).toBe(true);
    expect(fetch.mock.calls[0][0]).toBe(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}`);
    expect(fetch.mock.calls[0][1].method).toBe('GET');
    const answer=await agent.post('/api/ai/message').set('X-CSRF-Token',csrf).send({message:'Explain views',lessonId:'urls'}).expect(200);
    expect(answer.body.text).toBe('A view handles a request.');
    const sent=JSON.parse(fetch.mock.calls[1][1].body);expect(sent.contents[0].parts[0].text).not.toContain('<project-file>');
    expect(fetch.mock.calls[1][1].headers['x-goog-api-key']).toBe(config.apiKey);
  });
  it('contains provider failures and never echoes provider secrets',async()=>{
    const fetch=vi.fn().mockResolvedValue(new Response(JSON.stringify({error:{message:config.apiKey}}),{status:403}));
    const app=createApp({request:fetch});const agent=local(app);const session=await agent.get('/api/session');const csrf=session.body.csrfToken;
    await agent.post('/api/ai/config').set('X-CSRF-Token',csrf).send(config);
    const failure=await agent.post('/api/ai/test').set('X-CSRF-Token',csrf).send({}).expect(403);expect(JSON.stringify(failure.body)).not.toContain(config.apiKey);
    expect((await agent.get('/api/runtime/status')).body.status).toBe('unavailable');
    await agent.post('/api/ai/config').set('X-CSRF-Token',csrf).send({mode:'disabled'}).expect(200);
    expect((await agent.get('/api/ai/status')).body.enabled).toBe(false);
  });
});
describe('external runtime contract (mocked, not Django execution)',()=>{
  const runtime={serviceUrl:'https://runner.example',token:'runner_secret',previewOrigin:'https://preview.example',appOrigin:'https://tutor.example'};
  it('isolates runtime sessions and uses fixed service address with allowlisted actions',async()=>{
    const fetch=vi.fn().mockImplementation(async()=>new Response(JSON.stringify({available:true,status:'stopped',message:'Stopped',output:''})));
    const app=createApp({runtime,appOrigin:runtime.appOrigin,request:fetch});const a=local(app),b=local(app);const sa=await a.get('/api/session'),sb=await b.get('/api/session');
    await a.post('/api/runtime/action').set('Cookie',sa.headers['set-cookie'][0].split(';')[0]).set('X-CSRF-Token',sa.body.csrfToken).send({action:'migrate',files:fixture}).expect(200);
    await b.post('/api/runtime/action').set('Cookie',sb.headers['set-cookie'][0].split(';')[0]).set('X-CSRF-Token',sb.body.csrfToken).send({action:'start',files:fixture}).expect(200);
    expect(fetch.mock.calls[0][0].origin).toBe('https://runner.example');
    expect(fetch.mock.calls[0][0].pathname).not.toBe(fetch.mock.calls[1][0].pathname);
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({action:'migrate',files:fixture});
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer runner_secret');
  });
  it('rejects unsafe preview locations and inconsistent verification',async()=>{
    const fetch=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({available:true,status:'running',message:'Running',previewUrl:'https://attacker.example',output:''}))).mockResolvedValueOnce(new Response(JSON.stringify({available:true,status:'stopped',message:'Checked',output:'',verification:{lessonId:'other',kind:'runtime',passed:true,results:[{id:'x',label:'x',passed:false,feedback:'failed'}],checkedAt:new Date().toISOString()}})));
    const app=createApp({runtime,appOrigin:runtime.appOrigin,request:fetch});const agent=local(app);const session=await agent.get('/api/session');
    const cookie=session.headers['set-cookie'][0].split(';')[0];
    const result=await agent.post('/api/runtime/action').set('Cookie',cookie).set('X-CSRF-Token',session.body.csrfToken).send({action:'start',files:fixture}).expect(200);
    expect(result.body.status).toBe('error');expect(result.body.previewUrl).toBeUndefined();
    const checked=await agent.post('/api/runtime/action').set('Cookie',cookie).set('X-CSRF-Token',session.body.csrfToken).send({action:'check',files:fixture,lessonId:'urls-views'}).expect(200);
    expect(checked.body.status).toBe('error');expect(checked.body.verification).toBeUndefined();
  });
  it('requires separately configured HTTPS preview and service origins',()=>{
    expect(()=>new RuntimeAdapter({...runtime,previewOrigin:'https://runner.example'})).toThrow();
    expect(()=>new RuntimeAdapter({...runtime,serviceUrl:'http://runner.example'})).toThrow();
    expect(()=>new RuntimeAdapter({...runtime,previewOrigin:'https://preview.example/path'})).toThrow();
  });
  it('normalizes effective app origins and rejects same-origin previews or non-origin app configuration',()=>{
    for(const appOrigin of ['https://tutor.example/','https://TUTOR.example','https://tutor.example:443/']) {
      expect(()=>new RuntimeAdapter({...runtime,appOrigin,previewOrigin:'https://tutor.example'})).toThrow();
    }
    for(const appOrigin of ['https://tutor.example/lesson','https://tutor.example/?x=1','https://tutor.example/#lesson','https://user:pass@tutor.example','http://tutor.example']) {
      expect(()=>new RuntimeAdapter({...runtime,appOrigin})).toThrow();
    }
    expect(()=>new RuntimeAdapter({...runtime,appOrigin:'https://tutor.example/'})).not.toThrow();
  });
  it('does not accept passing verification when the runtime is unavailable',async()=>{
    const fetch=vi.fn().mockResolvedValue(new Response(JSON.stringify({available:false,status:'unavailable',message:'Unavailable',output:'',verification:{lessonId:'urls',kind:'runtime',passed:true,results:[{id:'response',label:'Response',passed:true,feedback:'OK'}],checkedAt:new Date().toISOString()}})));
    const app=createApp({runtime,appOrigin:runtime.appOrigin,request:fetch});const agent=local(app);const session=await agent.get('/api/session');
    const result=await agent.post('/api/runtime/action').set('Cookie',session.headers['set-cookie'][0].split(';')[0]).set('X-CSRF-Token',session.body.csrfToken).send({action:'check',files:fixture,lessonId:'urls'}).expect(200);
    expect(result.body.status).toBe('error');expect(result.body.verification).toBeUndefined();
  });
});
