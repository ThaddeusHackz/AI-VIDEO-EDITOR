import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
export function sourceHash(){const h=createHash('sha256');for(const f of ['film.mjs','geometry.mjs','actors.mjs','plan.json','audio.mjs','render.mjs','encoder.mjs'])h.update(readFileSync(new URL(f,import.meta.url)));return h.digest('hex');}
