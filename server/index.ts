import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import { createApp } from './app.js';

const production = process.env.NODE_ENV === 'production' || fileURLToPath(import.meta.url).replaceAll('\\','/').includes('/dist/server/');
if(production) process.env.NODE_ENV='production';
const app = createApp({appOrigin:process.env.APP_ORIGIN,runtime:{serviceUrl:process.env.RUNTIME_SERVICE_URL,token:process.env.RUNTIME_SERVICE_TOKEN,previewOrigin:process.env.RUNTIME_PREVIEW_ORIGIN}});
const port = Number(process.env.PORT ?? 3000);
if(!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid port number.');
const host = process.env.HOST ?? '127.0.0.1';
const server=http.createServer(app);
let closeDevelopment: (()=>Promise<void>) | undefined;
if(production) {
  const client = path.resolve('dist/client');
  app.use(express.static(client));
  app.get('/{*path}',(_req,res)=>res.sendFile(path.join(client,'index.html')));
} else {
  const {createServer}=await import('vite');
  const vite=await createServer({server:{middlewareMode:true,hmr:{server}},appType:'spa'});
  closeDevelopment=()=>vite.close();
  app.use(vite.middlewares);
}
server.listen(port,host,()=>console.log(`Django Tutor: http://${host}:${port}`));
server.on('error',()=>{console.error('Could not start Django Tutor. Check HOST/PORT and whether the port is already in use.');process.exitCode=1;});
for(const signal of ['SIGINT','SIGTERM'] as const) process.once(signal,()=>{void (async()=>{await closeDevelopment?.();server.closeAllConnections();server.close(()=>process.exit(0));})();});
