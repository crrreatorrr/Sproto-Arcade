#!/usr/bin/env node
// Rewrites every local <script src="file?v=..."> key in index.html and legacy.html to the first 12
// hex of the file's sha256, the rule runtime/fixtures/crash-guard.test.js enforces.
//   node tools/refresh-script-keys.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const page of ['index.html','legacy.html']){
  const file=path.join(root,page),html=fs.readFileSync(file,'utf8');
  const next=html.replace(/src="([^"?]+)\?v=([0-9a-f]+)"/g,(all,src)=>{
    const local=path.join(root,src);
    if(!fs.existsSync(local))return all;
    return `src="${src}?v=${crypto.createHash('sha256').update(fs.readFileSync(local)).digest('hex').slice(0,12)}"`;
  });
  if(next!==html){fs.writeFileSync(file,next);console.log('updated '+page);}
}
