#!/usr/bin/env python3
"""Typeset the production bible and all 36 shot sheets. No network or image assets."""
import json, re
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, KeepTogether, KeepInFrame, Flowable
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor, Color, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader
from shots import SHOTS, ACTS, PHASE_EDGES, TITLE
from pipeline import ROOT,OUT,environment,timecode,prompts
W,H=A4;M=40;CW=W-2*M
INK=HexColor('#1A2326');GOLD=HexColor('#A77B38');PAPER=HexColor('#FCFAF5');MUTED=HexColor('#536166');LINE=HexColor('#DAD6CB')
fontdir=Path('/usr/share/fonts/truetype/dejavu')
if (fontdir/'DejaVuSans.ttf').exists():
    for name,file in [('Body','DejaVuSans.ttf'),('BodyBold','DejaVuSans-Bold.ttf'),('Display','DejaVuSerif.ttf'),('DisplayBold','DejaVuSerif-Bold.ttf'),('Code','DejaVuSansMono.ttf')]:pdfmetrics.registerFont(TTFont(name,str(fontdir/file)))
    pdfmetrics.registerFontFamily('Body',normal='Body',bold='BodyBold',italic='Body',boldItalic='BodyBold')
else:
    for name,base in [('Body','Helvetica'),('BodyBold','Helvetica-Bold'),('Display','Times-Roman'),('DisplayBold','Times-Bold'),('Code','Courier')]:pdfmetrics.registerFont(pdfmetrics.Font(name,base,'WinAnsiEncoding'))
    pdfmetrics.registerFontFamily('Body',normal='Body',bold='BodyBold',italic='Body',boldItalic='BodyBold')
ST={
 'body':ParagraphStyle('body',fontName='Body',fontSize=9,leading=13.5,textColor=INK,spaceAfter=8),
 'small':ParagraphStyle('small',fontName='Body',fontSize=8,leading=11.5,textColor=MUTED,spaceAfter=6),
 'label':ParagraphStyle('label',fontName='Code',fontSize=8,leading=12,textColor=GOLD,spaceAfter=7),
 'h1':ParagraphStyle('h1',fontName='DisplayBold',fontSize=25,leading=31,textColor=INK,spaceBefore=10,spaceAfter=14,keepWithNext=True),
 'h2':ParagraphStyle('h2',fontName='BodyBold',fontSize=14,leading=19,textColor=INK,spaceBefore=16,spaceAfter=10,keepWithNext=True),
 'shot':ParagraphStyle('shot',fontName='DisplayBold',fontSize=23,leading=28,textColor=INK,spaceAfter=8),
 'phase':ParagraphStyle('phase',fontName='Body',fontSize=8.5,leading=12,textColor=INK),
 'mono':ParagraphStyle('mono',fontName='Code',fontSize=7.2,leading=10,textColor=MUTED),
 'prompt':ParagraphStyle('prompt',fontName='Body',fontSize=8.2,leading=11.8,textColor=INK,spaceAfter=7),
}
def markup(s):
    s=escape(s)
    s=re.sub(r'\*\*(.+?)\*\*',r'<b>\1</b>',s)
    s=re.sub(r'`([^`]+)`',r'<font name="Code" size="8">\1</font>',s)
    return s

def P(s,style='body'):return Paragraph(markup(s),ST[style])

class Atlas(Flowable):
    def __init__(self):super().__init__();self.width=CW;self.height=125
    def draw(self):
        c=self.canv;c.setFillColor(HexColor('#EFF0E9'));c.roundRect(0,0,CW,125,5,fill=1,stroke=0)
        c.setStrokeColor(GOLD);c.setLineWidth(1.5);c.line(24,68,CW-24,68)
        names=['Ambush','The Three','Chariot','Ruin','Champion','Ridge']
        for i,name in enumerate(names):
            x=25+i*(CW-50)/5;c.setFillColor(INK);c.circle(x,68,3,fill=1,stroke=0);c.setFont('Body',7);c.drawCentredString(x,86,name)
            c.setStrokeColor(MUTED);c.line(x,62,x-10,28);c.setFillColor(GOLD);c.circle(x-10,28,2.5,fill=1,stroke=0)
        c.setFillColor(MUTED);c.setFont('Code',7);c.drawString(18,108,'BLOCKING ATLAS / NOT FINAL TERRAIN');c.drawString(18,10,'Cameras below axis (-Y)   |   Story travels +X / screen right   |   Z up')

class Cover(Flowable):
    def __init__(self):super().__init__();self.width=CW;self.height=H-110
    def draw(self):
        c=self.canv
        c.setFillColor(HexColor('#101719'));c.rect(-M-20,-100,W+100,H+200,fill=1,stroke=0)
        c.setStrokeColor(GOLD);c.setLineWidth(.7);c.line(0,self.height-22,CW,self.height-22)
        c.setFillColor(HexColor('#CBA76D'));c.setFont('Code',9);c.drawString(0,self.height-5,'DIRECTOR’S PRODUCTION BLUEPRINT  /  01')
        c.setFillColor(PAPER);c.setFont('DisplayBold',72);c.drawString(-3,self.height-144,'DAVID')
        c.setFont('Body',15);c.drawString(2,self.height-184,'THE CHRONICLES OF VALOR')
        c.setFillColor(HexColor('#BAC2BD'));c.setFont('Body',10)
        for i,line in enumerate(['A grounded legend. A violent sky.','Four men whose resolve changes the field.']):c.drawString(2,self.height-230-i*17,line)
        y=self.height-324;c.setStrokeColor(HexColor('#3C4646'));c.line(0,y,CW,y)
        for x,label,value in [(0,'DURATION','180 seconds'),(180,'TIMELINE','10,800 frames'),(360,'MASTER','4K / 60 fps')]:
            c.setFillColor(HexColor('#CBA76D'));c.setFont('Code',8);c.drawString(x,y-26,label);c.setFillColor(PAPER);c.setFont('BodyBold',13);c.drawString(x,y-49,value)
        c.setFont('Body',10);c.setFillColor(HexColor('#BAC2BD'))
        for i,line in enumerate(['36 directed shots · 216 choreography phases','Lighting, weather, VFX, generator prompts and Unreal camera code','Final onscreen title: VALOR: THE CHRONICLES OF DAVID']):c.drawString(0,y-100-i*20,line)
        base=115
        lengths=[30,40,40,45,25];labels=['I / AMBUSH','II / THE THREE','III / WARFARE','IV / STORM','V / TRIUMPH'];x=0
        for duration,label in zip(lengths,labels):
            width=CW*duration/180;c.setFillColor(HexColor('#A77B38'));c.rect(x,base,width-3,3,fill=1,stroke=0);c.setFont('Code',6.5);c.setFillColor(PAPER);c.drawString(x,base-19,label);x+=width
        c.setFillColor(HexColor('#BAC2BD'));c.setFont('Body',8)
        c.drawString(0,44,'Planning package, not a rendered film or supplied MetaHuman/mocap asset collection.')
        c.drawString(0,28,'UE 5.5 camera importer: syntax and mock-contract tested; not executed in Unreal.')
        c.setFillColor(HexColor('#CBA76D'));c.setFont('Code',8);c.drawString(0,2,'AI VIDEO EDITOR  /  15 OCTOBER 2026')

def page(c,doc):
    if doc.page==1:return
    c.saveState();c.setFillColor(PAPER);c.rect(0,0,W,H,fill=1,stroke=0)
    c.setFillColor(MUTED);c.setFont('Code',7);c.drawString(M,H-26,'DAVID / PRODUCTION BIBLE');c.drawRightString(W-M,H-26,'180s · 60fps · 10,800f')
    c.setStrokeColor(LINE);c.line(M,H-34,W-M,H-34);c.line(M,34,W-M,34)
    c.setFont('Body',7);c.drawString(M,22,'Original cinematic planning • Blueprint, not finished footage');c.drawRightString(W-M,22,f'{doc.page:02d}')
    c.restoreState()

def build():
    OUT.mkdir(exist_ok=True);path=OUT/'DAVID-Production-Blueprint.pdf'
    doc=SimpleDocTemplate(str(path),pagesize=A4,rightMargin=M,leftMargin=M,topMargin=48,bottomMargin=45,title='DAVID — The Chronicles of Valor: Production Blueprint',author='AI Video Editor / Cinematic Production Planning')
    flow=[Cover(),PageBreak(),P('How to use this package','h1'),P('Read the bible, stage the shots, then evaluate every frame.','h2'),
      P('This PDF contains the directing bible and all 36 shot sheets with six precise frame-range phases each. The companion ZIP adds the exhaustive 10,800-row frame table, paste-ready generator payloads, camera/lighting data, Unreal import code, tests and a seekable nonphotoreal planning viewer.'),
      P('The target is a photorealistic, cinematic 180-second film. The delivered artifact here is its complete production blueprint. Hero meshes, licensed facial rigs, finished mocap, character collisions and production simulations still require a real animation/Unreal pipeline.'),Atlas(),Spacer(1,14)]
    table=[[P('ACT','label'),P('TIME / FRAMES','label'),P('DRAMATIC FUNCTION','label')]]
    for a,b,roman,name in ACTS:table.append([P(roman,'small'),P(f'{a:03d}–{b:03d}s / {a*60:05d}–{b*60-1:05d}','mono'),P(name.title(),'small')])
    tb=Table(table,colWidths=[42,190,CW-232]);tb.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LINEBELOW',(0,0),(-1,0),.5,GOLD),('BOTTOMPADDING',(0,0),(-1,-1),9)]));flow.extend([tb,Spacer(1,10),P('Frame 10800 is an exclusive endpoint. The delivered image sequence ends at frame 10799. All timecodes use 60 fps non-drop-frame. Exact cue samples use frame × 800 at 48 kHz.','small'),PageBreak()])
    # Continuous bible pages; headings cannot be stranded at page bottoms.
    text=(ROOT/'production_notes.md').read_text(encoding='utf8')
    for block in text.split('\n\n'):
        block=block.strip()
        if not block:continue
        if block.startswith('## '):flow.append(P(block[3:],'h2'))
        elif block.startswith('# '):flow.append(P(block[2:],'h1'))
        else:flow.append(P(block))
    flow.append(PageBreak())
    for s,prompt in zip(SHOTS,prompts()):
        contents=[P(f'{s["id"]} / ACT {s["act"]} / {s["hero"].upper()}','label'),P(s['title'],'shot'),
          P(f'{timecode(s["start_frame"])} → {timecode(s["end_frame_exclusive"])}  |  Frames {s["start_frame"]:05d}–{s["end_frame_exclusive"]-1:05d}  |  End exclusive','mono'),Spacer(1,7),
          P(f'**CAMERA** {s["camera_mode"]} · {s["lens_mm"][0]}→{s["lens_mm"][1]} mm · f/{s["aperture"]}. Position cm: {s["camera_start_cm"]} → {s["camera_end_cm"]}. Look-at cm: {s["target_start_cm"]} → {s["target_end_cm"]}.','small')]
        a=environment(s['start_frame']/60);b=environment((s['end_frame_exclusive']-1)/60)
        contents.append(P(f'**LIGHT / WEATHER** {a["sun_lux"]:,.0f}→{b["sun_lux"]:,.0f} lux; {a["sun_kelvin"]:.0f}→{b["sun_kelvin"]:.0f} K; rain {a["rain_mm_h"]:.1f}→{b["rain_mm_h"]:.1f} mm/h; wetness {a["wetness"]:.2f}→{b["wetness"]:.2f}.','small'))
        cells=[]
        for i,direction in enumerate(s['beats']):
            f=s['start_frame']+PHASE_EDGES[i];end=s['start_frame']+PHASE_EDGES[i+1]-1
            cells.append([P(f'{f:05d}–{end:05d}\n{timecode(f)}','mono'),P(direction,'phase')])
        t=Table(cells,colWidths=[88,CW-88]);t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('BACKGROUND',(0,0),(0,-1),HexColor('#F0EDE3')),('LINEBELOW',(0,0),(-1,-1),.35,LINE),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6)]));contents.extend([t,Spacer(1,8)])
        contacts=[s['start_frame']+v for v in s['impacts']]
        contents.extend([P(f'**CONTACT FRAMES** {contacts or "None"}. **ACTION SPEED** Local [frame, multiplier]: {s["speed_keys"]}.','small'),
          P(f'**HANDOFF** {s["seam"]}. **PRODUCTION NOTE** {s["note"]}','small'),P('PASTE-READY VISUAL PROMPT','label'),P(prompt['prompt'],'prompt'),
          P('Apply the global avoidance/identity rules in the bible. Full negative guidance, first/last-frame anchors and provider caveats are included in generator_prompts.json.','small')])
        # Keep each shot on one page; mild adaptive typography scaling avoids cropped instructions.
        flow.append(KeepInFrame(CW,H-101,contents,mode='shrink'))
        if s is not SHOTS[-1]:flow.append(PageBreak())
    doc.build(flow,onFirstPage=page,onLaterPages=page)
    reader=PdfReader(str(path));texts=[p.extract_text() or '' for p in reader.pages]
    missing=[s['id'] for s in SHOTS if not any(f'{s["id"]} / ACT' in t for t in texts)]
    report=dict(pages=len(reader.pages),shot_sheets_found=36-len(missing),missing_shots=missing,all_pages_have_text=all(len(t)>30 for t in texts),
                note='Text extraction/coverage checks; representative pages are visually inspected separately.')
    (OUT/'pdf-validation.json').write_text(json.dumps(report,indent=2))
    if missing or not report['all_pages_have_text']:raise RuntimeError(report)
    print(f'Built {path.name}: {len(reader.pages)} pages; 36/36 shot sheets; {path.stat().st_size:,} bytes')

if __name__=='__main__':build()
