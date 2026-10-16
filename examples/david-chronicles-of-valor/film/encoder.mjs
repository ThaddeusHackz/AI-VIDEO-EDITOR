import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
export function ffmpegPath(){
  if(process.env.FFMPEG)return process.env.FFMPEG;
  const python=fileURLToPath(new URL('.venv/bin/python',import.meta.url));
  if(existsSync(python)){
    const result=spawnSync(python,['-c','import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())'],{encoding:'utf8'});
    if(result.status===0)return result.stdout.trim();
  }
  return 'ffmpeg';
}
