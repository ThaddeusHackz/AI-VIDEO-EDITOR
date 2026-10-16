#!/usr/bin/env python3
"""Local read-only planning viewer; binds all interfaces for Arena preview."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
import argparse
ROOT=Path(__file__).resolve().parent
ALLOWED={'/review.html','/out/shots.json','/out/review_data.json','/vendor/gsap.min.js','/out/DAVID-Production-Blueprint.pdf','/out/DAVID-Complete-Production-Package.zip'}
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
    def do_GET(self):
        path=urlparse(self.path).path
        if path=='/':self.path='/review.html';path=self.path
        if path not in ALLOWED:return self.send_error(404)
        super().do_GET()
    def do_HEAD(self):
        path=urlparse(self.path).path
        if path=='/':self.path='/review.html';path=self.path
        if path not in ALLOWED:return self.send_error(404)
        super().do_HEAD()
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=3001);args=parser.parse_args()
    print(f'David planning viewer on 0.0.0.0:{args.port}',flush=True)
    ThreadingHTTPServer(('0.0.0.0',args.port),Handler).serve_forever()
