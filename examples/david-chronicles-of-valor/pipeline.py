#!/usr/bin/env python3
"""Build a complete, deterministic directing/rigging handoff; no AI or UE runtime required."""
from __future__ import annotations
import argparse, csv, hashlib, json, math, shutil, zipfile
from pathlib import Path
from shots import FPS, DURATION, FRAMES, TITLE, WORKING_TITLE, ACTS, PHASE_EDGES, SHOTS
ROOT=Path(__file__).resolve().parent
OUT=ROOT/'out'

IDENTITIES={
'David':'DAVID_A: same adult Levantine face, compact athletic build, charcoal curls, short dark beard, ochre linen with faded indigo hem; original right-hand curved short sword and identifiable chipped leather shield. Preserve cumulative dust, dents, rain and mud.',
'Josheb':'JOSHEB_A: same adult face and tall grounded silhouette, terracotta shoulder cloth, ash spear with dark bindings and heavy butt. No costume or spear-length changes.',
'Eleazar':'ELEAZAR_A: same lean adult face and exhausted shoulders, weathered neutral tunic, primary sword leather-bound to the right hand, shorter offhand parrying blade. No weapon swaps.',
'Shammah':'SHAMMAH_A: same broad adult face and rooted silhouette, deep brown wrap, production-designed heavy two-handed sword. Do not turn the weapon into a glowing fantasy greatsword.',
'Title':'Continue the approved wide Judean landscape and the same small surviving figures. Generate a clean text-free plate; the exact final title is added deterministically in engine/compositing.'}
NEGATIVE='Avoid identity drift, extra limbs or fingers, sliding feet, weightless floating, changing sword length, swapped hands, intersecting blades and faces, rubber metal, duplicated soldiers near camera, modern clothes, medieval European plate armor, HUDs, arcade glow, random camera reversals, unreadable cuts, graphic exposed injury, and model-generated lettering.'

# (seconds, sun lux, kelvin, exposure EV100, fog density, rain mm/h, wetness, mud, wind m/s)
LIGHT_KEYS=[(0,100000,5600,14.5,.014,0,0,0,3),(30,95000,5500,14.4,.019,0,0,.02,3.8),
(70,96000,5550,14.4,.018,0,0,.02,4.5),(110,95000,5600,14.3,.019,0,0,.03,5),
(115,28000,6100,12.2,.028,2,.02,.05,7),(120,9000,6800,10.8,.045,22,.25,.18,10),
(125,4000,7200,10.2,.055,40,.62,.45,11),(140,4200,7100,10.2,.052,40,.90,.83,10),
(155,4500,7000,10.3,.050,34,.95,.90,8),(165,10000,6100,11.2,.042,9,.94,.90,6),
(170,28000,4800,12.8,.030,3,.90,.88,4.5),(175,48000,4500,13.5,.025,0,.86,.85,3.5),
(180,48000,4500,13.5,.025,0,.84,.85,3)]

def clamp(x,a=0.,b=1.):return max(a,min(b,x))
def smooth(x):x=clamp(x);return x*x*x*(x*(x*6-15)+10)
def spring_step(t,omega=1.35):return 0. if t<=0 else 1-(1+omega*t)*math.exp(-omega*t)
def lerp(a,b,p):return a+(b-a)*p
def timecode(frame):
    seconds,ff=divmod(frame,FPS);minutes,ss=divmod(seconds,60);hours,mm=divmod(minutes,60)
    return f'{hours:02}:{mm:02}:{ss:02}:{ff:02}'
def interpolate_keys(keys,x):
    if x<=keys[0][0]:return keys[0][1:]
    if x>=keys[-1][0]:return keys[-1][1:]
    for a,b in zip(keys,keys[1:]):
        if a[0]<=x<=b[0]:
            p=smooth((x-a[0])/(b[0]-a[0]));return [lerp(v,w,p) for v,w in zip(a[1:],b[1:])]
    raise AssertionError('unreachable key interval')
def environment(t):
    vals=interpolate_keys(LIGHT_KEYS,t)
    return dict(zip(['sun_lux','sun_kelvin','exposure_ev100','fog_density','rain_mm_h','wetness','mud_response','wind_m_s'],vals))
def camera(shot,local_frame):
    # Normalize to hit the exact last output-frame pose, without overshooting close focus.
    dur=299/FPS; t=local_frame/FPS
    p=spring_step(t)/spring_step(dur)
    a=shot['camera_start_cm'];b=shot['camera_end_cm']
    pos=[lerp(v,w,p) for v,w in zip(a,b)]
    target=[lerp(v,w,p) for v,w in zip(shot['target_start_cm'],shot['target_end_cm'])]
    if shot['camera_mode'] in ('orbit-arc','tracking-arc'):
        # An explicit lateral arc, not an idle orbit. Endpoints remain unchanged.
        pos[1]-=100*math.sin(math.pi*p)
    d=[target[i]-pos[i] for i in range(3)];dist=math.sqrt(sum(v*v for v in d))
    yaw=math.degrees(math.atan2(d[1],d[0]));pitch=math.degrees(math.atan2(d[2],math.hypot(d[0],d[1])))
    recoil=0.
    for f in shot['impacts']:
        age=(local_frame-f)/FPS
        if 0<=age<.6:recoil+=.65*math.exp(-age*9)*math.sin(age*34)
    return dict(cam_x_cm=pos[0],cam_y_cm=pos[1],cam_z_cm=pos[2],target_x_cm=target[0],target_y_cm=target[1],target_z_cm=target[2],
        roll_deg=recoil*.35,pitch_deg=pitch+recoil,yaw_deg=yaw,focal_mm=lerp(*shot['lens_mm'],p),aperture=shot['aperture'],focus_cm=dist)

def events():
    out=[]
    for shot in SHOTS:
        for i,local in enumerate(shot['impacts']):
            kind='sling_release' if shot['id']=='S16' and i==0 else 'contact'
            if shot['id']=='S16' and i==1:kind='bow_fracture'
            if shot['id']=='S31':kind='pauldron_fracture'
            if shot['id']=='S34':kind='sword_ground_contact'
            f=shot['start_frame']+local
            out.append(dict(id=f'{shot["id"]}_{kind}_{i+1}',shot=shot['id'],frame=f,sample=f*800,kind=kind,
                pose_hold_frames=0 if kind=='sling_release' else (3 if shot['id'] in ('S04','S29','S31') else 2),seed=shot['seed']+i,
                instruction='Localized pose hold only; camera/weather remain on their assigned clocks. No live unseeded destruction.'))
    for sec,kind in [(116,'lightning'),(118.5,'thunder'),(123,'lightning'),(125.5,'thunder'),(175,'title_start'),(179.8,'full_black')]:
        f=round(sec*FPS);out.append(dict(id=f'{kind}_{f}',shot=f'S{f//300+1:02}',frame=f,sample=f*800,kind=kind,pose_hold_frames=0,seed=981+f,instruction='Output-clock cue; schedule at the exact frame/sample.'))
    return sorted(out,key=lambda e:(e['frame'],e['id']))

def title_state(frame):
    main=smooth((frame-10500)/59)
    subtitle=smooth((frame-10548)/71)
    fade=1-smooth((frame-10716)/72)
    if frame>=10788:fade=0.
    return dict(title_main_reveal=main if frame>=10500 else 0.,title_subtitle_reveal=subtitle if frame>=10548 else 0.,
                plate_opacity=fade if frame>=10716 else 1.,title_opacity=fade if frame>=10500 else 0.)

def flight_state(t):
    # Explicit source-time physics; long output airtime does NOT imply low gravity.
    if not 75<=t<=85.6:return dict(flight_active=0,flight_source_s=0.,flight_root_z_cm=0.)
    h,v,g=140.,240.,981.
    total=(v+math.sqrt(v*v+2*g*h))/g
    tau=interpolate_keys([(75,0),(77.8,v/g),(80,.42),(85.6,total)],t)[0]
    return dict(flight_active=1,flight_source_s=tau,flight_root_z_cm=max(0,h+v*tau-.5*g*tau*tau))

def build_frames():
    ev=events();byframe={}
    for e in ev:byframe.setdefault(e['frame'],[]).append(e)
    holding=set()
    for e in ev:
        for f in range(e['frame'],e['frame']+e['pose_hold_frames']):holding.add(f)
    action_global=0.;pose_global=0.;local_action=0.;local_pose=0.
    rows=[]
    for f in range(FRAMES):
        shot=SHOTS[f//300];local=f%300
        if local==0:local_action=0.;local_pose=0.
        phase=next(i for i in range(6) if PHASE_EDGES[i]<=local<PHASE_EDGES[i+1])
        speed=interpolate_keys(shot['speed_keys'],local)[0]
        r=dict(frame=f,timecode=timecode(f),time_s=f/FPS,shot=shot['id'],act=shot['act'],hero=shot['hero'],shot_frame=local,
          phase_index=phase,phase_progress=(local-PHASE_EDGES[phase])/(PHASE_EDGES[phase+1]-PHASE_EDGES[phase]),direction=shot['beats'][phase],
          camera_mode=shot['camera_mode'],action_speed=speed,action_source_s=action_global,pose_source_s=pose_global,
          shot_action_source_s=local_action,shot_pose_source_s=local_pose,pose_hold=int(f in holding),
          blocking_anchor_x_cm=shot['zone_cm'][0],blocking_anchor_y_cm=shot['zone_cm'][1],blocking_anchor_z_cm=shot['zone_cm'][2],
          breath_rib_cm=(.55+.4*(f>=6600))*(.5-.5*math.cos(2*math.pi*(f/FPS)/2.7)),
          camera_cut=int(local==0),seed=shot['seed'],audio_sample=f*800,cues=';'.join(e['id'] for e in byframe.get(f,[])))
        r.update(camera(shot,local));r.update(environment(f/FPS));r.update(flight_state(f/FPS));r.update(title_state(f))
        r['lightning_gain']=sum(max(0,1-abs(f-h)/3) for h in [6960,7380])
        r['sun_lux_with_lightning']=r['sun_lux']*(1+1.2*r['lightning_gain'])
        r={k:round(v,7) if isinstance(v,float) else v for k,v in r.items()}
        rows.append(r)
        delta=speed/FPS;action_global+=delta;local_action+=delta
        if f not in holding:pose_global+=delta;local_pose+=delta
    return rows

def prompts():
    result=[]
    for s in SHOTS:
        opening=s['beats'][0];closing=s['beats'][-1]
        visual=('Original gritty ancient Judean legend, photorealistic material intent, physically grounded adult performers, natural skin and eye response, detailed linen/leather/bronze, restrained motion blur. '+IDENTITIES[s['hero']])
        action=' '.join(s['beats'])
        if s['hero']=='Title':
            action='Continue the approved wide landscape with the exhausted survivors small on the ridge. Keep the dark cloud region visually quiet for a later title overlay. Maintain wet terrain and receding mist. Do not generate letters, logos, overlays or a baked fade; the final typography and exact black endpoint will be composited separately.'
        weather='Harsh warm desert sun and wind-driven dust.' if s['start_frame']<6600 else 'Progressively building storm, accumulated wetness and persistent mud; follow the weather reference.' if s['start_frame']<9900 else 'Storm opening to warm rays, cool wet shadows and lingering mist.'
        camera_text=f'{s["camera_mode"]}; {s["lens_mm"][0]} to {s["lens_mm"][1]} mm full-frame lens intent, f/{s["aperture"]}, manually controlled focus. Maintain established screen-right travel and negative-Y camera side.'
        result.append(dict(shot=s['id'],duration_seconds=5,editorial_fps=60,output_frames=[s['start_frame'],s['end_frame_exclusive']],
          prompt=f'{visual} {weather} {camera_text} Action: {action}',negative_guidance=NEGATIVE,
          first_frame_anchor=opening,last_frame_anchor=closing,continuity_note=s['note'],handoff=s['seam'],
          provider_notes='Adapt to available Sora/Runway controls. This JSON is a production schema, not a claimed vendor API. Exact frame rate, resolution, identity and choreography are not guaranteed by a prompt.'))
    return result

def write_json(path,data):path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def markdown():
    out=(ROOT/'production_notes.md').read_text()+'\n\n# Shot-by-shot directing script\n\n'
    for s,p in zip(SHOTS,prompts()):
        out+=f'## {s["id"]} — {s["title"]}\n\n'
        out+=f'**Act {s["act"]} / {s["hero"]} / {timecode(s["start_frame"])}–{timecode(s["end_frame_exclusive"])} (end exclusive). Frames {s["start_frame"]}–{s["end_frame_exclusive"]-1}.**\n\n'
        out+=f'Camera: {s["camera_mode"]}; lens {s["lens_mm"]} mm, f/{s["aperture"]}. Start/end position (cm): {s["camera_start_cm"]} → {s["camera_end_cm"]}. Look-at: {s["target_start_cm"]} → {s["target_end_cm"]}.\n\n'
        for i,b in enumerate(s['beats']):
            a=s['start_frame']+PHASE_EDGES[i];z=s['start_frame']+PHASE_EDGES[i+1]-1
            out+=f'- **Frames {a:05d}–{z:05d} / {timecode(a)}:** {b}\n'
        contacts=[s['start_frame']+v for v in s['impacts']]
        out+=f'\n**Exact contacts/cues:** {contacts or "None; sustained performance/weather."} **Action-speed keys (local output frame, multiplier):** {s["speed_keys"]}.\n\n'
        env0=environment(s['start_frame']/60);env1=environment((s['end_frame_exclusive']-1)/60)
        out+=f'**Light/weather:** sun {env0["sun_lux"]:.0f}→{env1["sun_lux"]:.0f} lux; key {env0["sun_kelvin"]:.0f}→{env1["sun_kelvin"]:.0f} K; rain {env0["rain_mm_h"]:.1f}→{env1["rain_mm_h"]:.1f} mm/h; wetness {env0["wetness"]:.2f}→{env1["wetness"]:.2f}.\n\n'
        out+=f'**Continuity handoff:** {s["seam"]}. **Production note:** {s["note"]}\n\n'
        out+=f'### Generator prompt — {s["id"]}\n\n{p["prompt"]}\n\n**Avoid:** {p["negative_guidance"]}\n\n'
    return out

def generate():
    OUT.mkdir(exist_ok=True)
    rows=build_frames();write_json(OUT/'shots.json',SHOTS);write_json(OUT/'events.json',events());write_json(OUT/'generator_prompts.json',prompts())
    write_json(OUT/'lighting_keyframes.json',dict(units='seconds, lux, kelvin, EV100, unitless density, mm/h, wetness 0–1, mud 0–1, wind m/s',keys=LIGHT_KEYS))
    with (OUT/'frames.csv').open('w',newline='',encoding='utf8') as f:
        writer=csv.DictWriter(f,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
    with (OUT/'frames.jsonl').open('w',encoding='utf8') as f:
        for r in rows:f.write(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n')
    (OUT/'DAVID-Production-Blueprint.md').write_text(markdown(),encoding='utf8')
    # Compact review samples; the viewer uses the full frame table, not these for rigging.
    keys=['frame','cam_x_cm','cam_y_cm','cam_z_cm','target_x_cm','target_y_cm','target_z_cm','rain_mm_h','wetness','sun_lux','action_speed','pose_hold','plate_opacity']
    write_json(OUT/'review_data.json',dict(keys=keys,frames=[[r[k] for k in keys] for r in rows]))
    ledger=[]
    for a,b in zip(SHOTS,SHOTS[1:]):
        ledger.append(dict(cut_frame=b['start_frame'],from_shot=a['id'],to_shot=b['id'],outgoing_screen_direction='+X / right',incoming_screen_direction='+X / right',handoff=a['seam'],
          camera_position_jump_cm=round(math.dist(a['camera_end_cm'],b['camera_start_cm']),3),
          lens_jump_mm=b['lens_mm'][0]-a['lens_mm'][1],requires_rendered_seam_review=True))
    write_json(OUT/'continuity_ledger.json',ledger)
    write_json(OUT/'manifest.json',dict(working_title=WORKING_TITLE,onscreen_title=TITLE,fps=FPS,width=3840,height=2160,duration_seconds=DURATION,
      first_frame=0,last_frame_inclusive=10799,end_frame_exclusive=10800,audio_hz=48000,audio_samples=8640000,shot_count=36,phase_count=216,
      status='Production blueprint and camera/lighting planning data. Not a rendered Unreal film.',
      coordinate_system='UE centimeters, Z up; narrative +X, primary camera side -Y',files={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in OUT.iterdir() if p.is_file() and p.name not in ('manifest.json',) and p.suffix in ('.csv','.jsonl','.json','.md')}))
    print(f'Generated {len(rows)} frame rows, {len(SHOTS)} shots, {len(events())} events into {OUT}')

def archive():
    target=OUT/'DAVID-Complete-Production-Package.zip'
    names=['shots.py','pipeline.py','unreal_import.py','test_pipeline.py','production_notes.md','README.md','requirements.txt','rig_contract.json','review.html','serve.py','build_pdf.py']
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for name in names:z.write(ROOT/name,name)
        for p in sorted(OUT.iterdir()):
            if p.is_file() and p.suffix in ('.pdf','.json','.jsonl','.csv','.md'):z.write(p,'out/'+p.name)
        vendor=ROOT/'vendor/gsap.min.js'
        z.write(vendor.resolve(),'vendor/gsap.min.js')
    print(f'Packaged {target.name}: {target.stat().st_size:,} bytes')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('command',choices=['generate','package'],nargs='?',default='generate');args=parser.parse_args()
    generate() if args.command=='generate' else archive()
