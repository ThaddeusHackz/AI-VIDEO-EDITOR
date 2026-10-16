import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {out} from './render.mjs';
import {ffmpegPath} from './encoder.mjs';
import {sourceHash} from './fingerprint.mjs';
export function verify(){
 const path=process.argv[2]||join(out,'david-chronicles-of-valor-stylized-4k60.mp4');
 const probe=spawnSync(process.env.FFPROBE||'ffprobe',['-v','error','-threads','2','-count_frames','-show_streams','-show_format','-of','json',path],{encoding:'utf8',maxBuffer:8*1024*1024});
 if(probe.status!==0)throw new Error(probe.stderr||'ffprobe failed');
 const data=JSON.parse(probe.stdout),v=data.streams.find(s=>s.codec_type==='video'),a=data.streams.find(s=>s.codec_type==='audio'),qa=JSON.parse(readFileSync(join(out,'qa-report.json'),'utf8'));
 const assertions={width:v?.width===3840,height:v?.height===2160,fps:v?.r_frame_rate==='60/1'&&v?.avg_frame_rate==='60/1',frames:Number(v?.nb_read_frames)===10800,
  videoDuration:Math.abs(Number(v?.duration)-180)<1e-6,containerDuration:Math.abs(Number(data.format.duration)-180)<.025,
  audio:a?.codec_name==='aac'&&a.channels===2&&Number(a.sample_rate)===48000&&Math.abs(Number(a.duration)-180)<.05,
  codec:v?.codec_name==='h264'&&v.pix_fmt==='yuv420p',uploadLimit:statSync(path).size<100*1024*1024,
  currentSourceQA:qa.passed&&qa.sourceHash===sourceHash()};
 console.log('Container checks:',assertions);
 const decoded=spawnSync(ffmpegPath(),['-v','error','-xerror','-threads','2','-i',path,'-map','0:v','-map','0:a','-f','null','-'],{encoding:'utf8',maxBuffer:8*1024*1024});
 assertions.fullDecode=decoded.status===0&&!decoded.stderr.trim();
 const ending=spawnSync(ffmpegPath(),['-v','error','-threads','2','-ss','179.9','-i',path,'-frames:v','1','-vf','scale=160:90','-pix_fmt','rgb24','-f','rawvideo','pipe:1'],{maxBuffer:1024*1024});
 assertions.encodedFinalBlack=ending.status===0&&ending.stdout.length===160*90*3&&ending.stdout.every(v=>v<=2);
 const manifests=[];for(let f=0;f<10800;f+=300){const m=JSON.parse(readFileSync(join(out,'chunks-4k',`${String(f).padStart(5,'0')}.mp4.json`),'utf8'));manifests.push(m);}
 assertions.chunkCoverage=manifests.every((m,i)=>m.start===i*300&&m.end===(i+1)*300&&m.width===3840&&m.height===2160&&m.hash===sourceHash());
 const reused=manifests.filter(m=>m.reusedFromHash);if(reused.length){const audit=JSON.parse(readFileSync(new URL('cache-reuse-audit.json',import.meta.url),'utf8'));assertions.scopedCacheReuse=audit.passed&&audit.newHash===sourceHash()&&audit.statesCompared===64800&&audit.changedStates===1200&&audit.unchangedStateHashBefore===audit.unchangedStateHashAfter&&reused.every(m=>m.reusedFromHash===audit.oldHash&&audit.preservedChunkStarts.includes(m.start)&&!audit.invalidatedChunkStarts.includes(m.start));}
 const bytes=readFileSync(path);let offset=0,moov=-1,mdat=-1;
 while(offset+8<=bytes.length){let size=bytes.readUInt32BE(offset);const type=bytes.toString('ascii',offset+4,offset+8);if(size===1){size=Number(bytes.readBigUInt64BE(offset+8));}if(type==='moov')moov=offset;if(type==='mdat')mdat=offset;if(size<8)break;offset+=size;}
 assertions.fastStart=moov>=0&&mdat>moov;
 const report={passed:Object.values(assertions).every(Boolean),assertions,file:path,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),sourceHash:sourceHash(),streams:data.streams,format:data.format,decodeErrors:decoded.stderr,qaSamples:qa.sampleCount,style:'User-approved faceted low-poly 3D; procedural animation and synthesized audio. Not photorealistic, Unreal, MetaHuman or mocap.'};
 writeFileSync(join(out,'delivery-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,assertions,bytes:report.bytes,sha256:report.sha256},null,2));if(!report.passed)process.exitCode=1;return report;
}
if(process.argv[1]===fileURLToPath(import.meta.url))verify();
