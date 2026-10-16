#!/usr/bin/env bash
# provision-renderer.sh — assemble the software-WebGL render stack used by the DAVID cinema
# build. Everything comes from the allow-listed package hosts; nothing is committed to the repo.
#
#  1. Chromium (headless shell, 153.x) + its ANGLE/SwiftShader libs ....... npm @sparticuz/chromium
#  2. libnss3 / libnssutil3 (with the NSS_3.30 symbol version tags) ...... npm chrome-aws-lambda
#     (AWS Lambda layer payload, the build Chromium links against)
#  3. libnspr4 / libplc4 / libplds4 ..................................... npm @achingbrain/nss
#  4. ffmpeg (static, libx264) ........................................... pypi imageio-ffmpeg
#
# Result: ~/.cache/chromium-libs/{aws,lib} + ~/.cache/venv/bin/python -m imageio_ffmpeg
set -euo pipefail
CACHE="${AI_VIDEO_CACHE:-/home/user/.cache}"
PROV="$CACHE/prov"
LIBS="$CACHE/chromium-libs"
mkdir -p "$PROV" "$LIBS/aws" "$LIBS/lib"
cd "$PROV"

echo "== 1/4 NSS shared libraries (AWS Lambda layer payload)"
if [ ! -s aws.tar ]; then
  [ -f package/bin/aws.tar.br ] || { npm pack chrome-aws-lambda --silent >/dev/null; tar xzf chrome-aws-lambda-*.tgz; }
  node -e "const fs=require('fs'),z=require('zlib');fs.writeFileSync('aws.tar',z.brotliDecompressSync(fs.readFileSync('package/bin/aws.tar.br')))"
fi
if [ ! -s "$LIBS/aws/libnss3.so" ]; then
  tar xf aws.tar -C "$LIBS/aws" --no-same-owner --wildcards 'lib/*'
  mv "$LIBS"/aws/lib/* "$LIBS/aws/"; rmdir "$LIBS"/aws/lib 2>/dev/null || true
fi

echo "== 2/4 NSPR shared libraries (@achingbrain/nss)"
if [ ! -s "$LIBS/lib/libnspr4.so" ]; then
  npm pack @achingbrain/nss --silent >/dev/null
  mkdir -p nssx && tar xzf achingbrain-nss-*.tgz -C nssx
  cp nssx/package/linux/libnspr4.so nssx/package/linux/libplc4.so nssx/package/linux/libplds4.so "$LIBS/lib/"
fi

echo "== 3/4 Chromium + SwiftShader (@sparticuz/chromium)"
node -e "
const c=require('@sparticuz/chromium'); const m=c.default??c;
m.executablePath().then(p=>console.log('browser:',p)).catch(e=>{console.error(e);process.exit(1)});
" 2>/dev/null || node -e "
const c=require('/home/user/AI-VIDEO-EDITOR/examples/david-chronicles-of-valor/cinema/node_modules/@sparticuz/chromium');
const m=c.default??c; m.executablePath().then(p=>console.log('browser:',p));
"

echo "== 4/4 ffmpeg (static, libx264) via imageio-ffmpeg"
[ -x "$CACHE/venv/bin/python" ] || python3 -m venv "$CACHE/venv"
"$CACHE/venv/bin/pip" install -q --no-cache-dir imageio-ffmpeg
FF=$("$CACHE/venv/bin/python" -c "import imageio_ffmpeg as f;print(f.get_ffmpeg_exe())")
ln -sf "$FF" "$CACHE/ffmpeg"
echo "ffmpeg: $FF"

echo "== smoke check"
LD_LIBRARY_PATH="$LIBS/aws:$LIBS/lib:/tmp" /tmp/chromium --version
echo "renderer provisioned."
