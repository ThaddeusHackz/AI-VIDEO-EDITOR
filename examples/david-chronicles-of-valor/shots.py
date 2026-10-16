"""Editorial source of truth. Units: centimeters, degrees, millimeters, frames at 60 fps.
These are choreography directions and camera blocking, NOT supplied mocap or character assets.
"""
FPS = 60
DURATION = 180
FRAMES = 10800
TITLE = 'VALOR: THE CHRONICLES OF DAVID'
WORKING_TITLE = 'DAVID: THE CHRONICLES OF VALOR'
ACTS = [(0,30,'I','The valley of shadows'),(30,70,'II','The rise of the three'),(70,110,'III','Acrobatic warfare'),(110,155,'IV','The apex exchanges'),(155,180,'V',"The king’s triumph")]
PHASE_EDGES = [0,48,96,144,192,240,300]
SHOTS=[]

def S(title, hero, zone, camera, lens, beats, impact=(), seam='occluded rightward handoff', speed=None, note='', action='contact', camera_mode='spring-dolly', aperture=4.0):
    n=len(SHOTS)+1
    start=(n-1)*300
    act=next(a for a in ACTS if a[0]*60<=start<a[1]*60)
    assert len(beats)==6
    SHOTS.append(dict(id=f'S{n:02d}',number=n,title=title,hero=hero,zone_cm=zone,start_frame=start,end_frame_exclusive=start+300,
        act=act[2],camera_start_cm=camera[0],camera_end_cm=camera[1],target_start_cm=camera[2],target_end_cm=camera[3],
        lens_mm=lens,aperture=aperture,beats=beats,impacts=list(impact),seam=seam,camera_mode=camera_mode,
        speed_keys=speed or [[0,1],[299,1]],note=note,action=action,seed=73100+n))

# ACT I — 00:00–00:30
S('The eye before the storm','David',[0,0,0],[[0,-42,168],[4,-50,168],[0,0,168],[2,0,168]],[135,135],[
'Eyelid tension precedes movement. Catch one reflected blade in the lower cornea; keep both pupils fixed on the captain.',
'A sweat bead gathers at the right brow. Tighten lower lids rather than scaling the eyeballs; nostrils flare offscreen.',
'The reflected opponent shifts. David moves his gaze first, then rotates his head only two degrees toward screen right.',
'He takes a shallow nasal breath; one involuntary blink closes for four output frames without cutting to black.',
'The bead breaks free and tracks through skin micro-normal detail; dust passes behind the focal plane, never over both eyes.',
'A blade crosses foreground left-to-right. Let its occlusion initiate the retreating camera, preserving David’s eyeline.'
],seam='matched lens and camera continuation',action='performance',aperture=4.0,note='No logo, no dialogue. Eye wetness and facial tension are the spectacle; avoid beauty-light smoothing.')
S('Out of the dust','David',[0,0,0],[[4,-50,168],[-180,-380,68],[2,0,168],[80,0,125]],[135,32],[
'Continue the exact eye-line from S01. Begin a controlled dolly retreat rather than an instant field-of-view jump.',
'Reveal his charcoal hair, weathered linen tunic and leather shield; chest expansion drives the cloth, not the reverse.',
'The camera drops to knee height while retreating. Keep the horizon level and David’s head in the upper third.',
'David plants his left foot; heel compression and toe spread settle before his torso commits to the counter.',
'The captain’s bronze sword enters from screen right. Establish its travel, David’s escape space and the contact line.',
'Finish the dolly with the captain looming beyond David. Dust streaks continue screen right across the cut.'
],seam='cut on captain’s rising shoulder',action='locomotion',camera_mode='dolly-zoom',note='Use coordinated lens/dolly keys, not a fake 2D scale. Shot ends at a legible geography master.')
S('The captain commits','David',[80,0,0],[[-180,-380,68],[-40,-300,83],[80,0,125],[180,0,115]],[32,40],[
'The captain loads his rear leg and opens his right shoulder. The sword lags behind the hips with visible inertia.',
'David shortens his stance and lowers his head beneath the predicted arc; the shield protects his leading side.',
'The bronze edge cuts through dust above David’s temple. Keep the blade outside the face silhouette at all times.',
'David redirects the blow with a brief oblique blade contact; a small, short-lived spark packet marks the near-metal impact.',
'Two-frame local hit-stop belongs only to the contacting limbs. David’s center of mass and cloth continue settling.',
'The captain over-rotates. David’s rear foot pushes against the ground, preparing the knee without levitating.'
],impact=[132],speed=[[0,1],[108,1],[126,0.5],[144,0.5],[174,1.2],[240,1],[299,1]],note='Bronze-on-bronze should not throw a shower of steel sparks; the brighter particles are a declared cinematic accent.')
S('The grounded flight','David',[180,0,0],[[-40,-300,83],[170,-340,104],[180,0,115],[320,0,130]],[40,36],[
'Complete the foot-driven launch established in S03; hips lead, then the chest, then the bent right knee.',
'Use a short ballistic hop, not prolonged flight. The planted captain recoils only after the chest plate receives contact.',
'Knee and armor meet at the marked impact frame. Compress the garment and plate padding; do not intersect the rib cage.',
'Hold the impact silhouette for three output frames with a 0.6-degree camera recoil; protect screen direction.',
'David lands with forefoot, heel and knee sequencing. The captain staggers into a dust curtain rather than exploding backward.',
'David turns toward two approaching silhouettes; a shoulder and shield wipe the lens to hide the next camera handoff.'
],impact=[126],action='short-hop',note='Stunt illusion only: plate contact is padded and separated in capture. No dangerous live stunt instructions are implied.')
S('Shield against iron','David',[320,0,0],[[170,-340,104],[360,-310,115],[320,0,130],[470,0,125]],[36,40],[
'Two attackers separate clearly in depth: first at David’s shield side, second farther right. Their silhouettes must not merge.',
'David steps into the first attacker’s line; his leather-faced shield has a reinforced rim, not an indestructible metal plate.',
'The rim strikes a pre-weakened helmet crest. Separate a small crest fragment; the entire skull enclosure stays intact.',
'Armor vibration and a short dirt pulse sell the hit. Keep blood limited to a faint external smear, with no exposed injury.',
'David retrieves the shield into guard instead of leaving his elbow fully extended; his gaze already tracks the second attacker.',
'The second attacker enters high. David lowers his center of mass and begins the planted pivot that drives the sweep.'
],impact=[120],note='Khopesh-inspired sword, reinforced leather shield and helmet failure are production design choices, not an archaeological reconstruction.')
S('One circle, two exits','David',[470,0,0],[[360,-310,115],[680,-350,100],[470,0,125],[680,0,105]],[40,32],[
'David plants the left foot and rotates on the ball of that foot. The shield retracts close to the ribs.',
'The sweeping leg crosses below the attacker’s center of mass. Show foot clearance, hip rotation and the falling reaction separately.',
'The attacker begins the fall after leg contact; elbows protect the silhouette. No neck-first or anatomically impossible landing.',
'David completes the 360-degree motion and returns his sword to a stable guard; loose cloth follows with a delayed, damped arc.',
'He pushes forward into a rightward tracking move; the distant spear line becomes visible beyond the dust.',
'A foreground shield fills frame. Carry the same rightward camera velocity into Josheb’s reveal; do not reverse the battlefield axis.'
],impact=[132],seam='full shield occlusion / rightward whip',camera_mode='whip-pan',note='This is a concealed edit, not a claim that a single physical camera crossed the entire battlefield.')

# ACT II — 00:30–01:10
S('Josheb and the horizon','Josheb',[1400,0,0],[[960,-420,115],[1280,-520,150],[1400,0,145],[1400,0,150]],[32,28],[
'Exit the shield occlusion at matched screen velocity; reveal Josheb with his spear grounded against an advancing formation.',
'Build the apparent army from eight hero opponents, medium-distance clustered agents and distant formation cards or instances.',
'Josheb slides his lower hand along the shaft and settles his rear heel; the spear remains heavy at both ends.',
'An arrow volley enters in three staggered clusters rather than a featureless wall; preserve readable gaps between trajectories.',
'He raises the spear to intercept the nearest staged arrows. Others miss, strike earth or lodge in background shields.',
'The camera arcs slightly around his front shoulder, but never crosses the combat line without an orienting master.'
],camera_mode='orbit-arc',action='formation',note='The 300-soldier wall is the brief’s tableau. Do not label it a literal count attributed to Josheb in every biblical account.')
S('A spear through rainless air','Josheb',[1400,0,0],[[1280,-520,150],[1530,-460,135],[1400,0,150],[1480,0,145]],[28,35],[
'The first spear rotation begins at the hips and hands; maintain shaft length and grip continuity through motion blur.',
'Two close arrows glance away from the reinforced shaft. Use pre-authored contacts, not an unreliable all-projectile solver.',
'One splintered arrow tumbles past the camera. Arrow pieces inherit measured contact velocity and gravity.',
'Josheb brakes the rotation through his stance; the spear tip overshoots slightly, then damps into a forward line.',
'The nearest enemy recoils from the approaching tip. Background ranks continue pressing, never freeze as a painted crowd.',
'The camera lowers and advances with the spear point, setting up the first thrust as a single readable action.'
],impact=[96,168],camera_mode='orbit-arc',note='Deflecting a staged volley is intentionally legendary. It is not presented as ordinary historical combat.')
S('The line gives way','Josheb',[1500,0,0],[[1530,-460,135],[1780,-410,90],[1480,0,145],[1690,0,120]],[35,35],[
'Josheb delivers one committed thrust toward a shield opening; sell the shield reaction and his recovered stance, not penetration detail.',
'He retracts the tip along the same path, changes grip and drives the butt end across a second attacker’s guard.',
'A low sweep catches a third shield edge. Opponents lose formation in sequence, never all launch on the same frame.',
'He vaults over a fallen shield using a short planted spear assist; no unsupported pole bend or endless hang time.',
'Land through the ankles and knees, then draw the spear back. The front rank parts while the wider formation remains intact.',
'A spear shaft crosses lens as Eleazar’s strapped sword enters the same screen quadrant, matching the directional line.'
],impact=[90,174,228],seam='shaft-to-sword match cut',action='spear-combination',note='Three clear actions beat an unreadable flurry. Reserve the widest motion blur for the shaft, not faces.')
S('Eleazar’s exhausted hand','Eleazar',[2600,0,0],[[2350,-220,118],[2460,-350,140],[2600,0,115],[2600,0,140]],[70,45],[
'Begin on a trembling hand with a leather safety binding around the hilt; skin folds compress against the strap.',
'His fingers resist opening; transfer the fatigue into forearm tendons, breath and a small shoulder droop.',
'Reveal a short offhand parrying blade, explicitly distinguishing it from a second identical longsword.',
'An enemy strike approaches from screen right. Eleazar’s eyes acquire the blade before his torso turns.',
'He braces with the bound sword while the offhand blade guides the opponent’s weapon off the centerline.',
'Allow one breath between exchanges. Camera pulls enough to show both feet and both weapons before acceleration.'
],impact=[222],action='performance',note='Leather binding and offhand weapon are dramatization. They must not be mistaken for an exact quotation of the source story.')
S('The two defensive lines','Eleazar',[2600,0,0],[[2460,-350,140],[2690,-390,125],[2600,0,140],[2730,0,125]],[45,40],[
'Opponent A attacks high while opponent B remains outside striking distance; never choreograph overlapping unreadable hits.',
'The offhand blade redirects A’s weapon; the bound sword answers with a short counter against a shield or armored guard.',
'The hips recover before opponent B advances. Eleazar keeps his knees soft and his feet connected to uneven ground.',
'A second parry compresses the right shoulder. Small spark bursts extinguish immediately and do not become neon trails.',
'Eleazar turns the borrowed momentum into a diagonal recovery, exposing his exhaustion through a delayed exhale.',
'Track laterally with him while a fallen spear in foreground establishes the route for his evasive hop.'
],impact=[108,204],note='Dual-wielding is asymmetric: one fatigue-bound primary blade, one shorter defensive blade; maintain handedness in every generated shot.')
S('Exhaustion is not defeat','Eleazar',[2730,0,0],[[2690,-390,125],[2940,-400,130],[2730,0,125],[2910,0,130]],[40,35],[
'Eleazar steps onto a low stone and converts the step into a compact lateral hop over the sweeping weapon.',
'The hop follows a ballistic arc. Cloth and foot contacts make its small height feel athletic rather than weightless.',
'He lands and lets the offhand blade close the exposed line before committing his bound sword.',
'One counter breaks the attacker’s posture; use an armor scrape and controlled recoil rather than explicit wound detail.',
'He drops his weight into a breath, still upright. The battalion remains a threatening perimeter, not a synchronized dance troupe.',
'Follow a kicked clod screen right into the lentil field, allowing a brief dust occlusion to hide the transfer to Shammah.'
],impact=[174],action='short-hop',seam='rightward clod / dust wipe',note='His apparent speed comes from economical motion and camera proximity, not physically impossible acceleration.')
S('Shammah holds the field','Shammah',[3800,0,0],[[3420,-410,120],[3650,-370,83],[3800,0,140],[3830,0,110]],[35,32],[
'Clear the dust onto a field of crushed lentils; green stems and pale soil distinguish this zone from the road.',
'Shammah widens his stance and compresses the topsoil. Footprints remain in the same locations on later views.',
'He raises a heavy, production-designed two-handed sword; hips and shoulder girdle support the mass before the hands accelerate.',
'The nearest enemy commits behind a wooden shield. The shield’s pre-fractured construction is established in silhouette.',
'Shammah arrests a probing blow with the strong of his blade, keeping both hands and elbows anatomically plausible.',
'He shifts weight into the forward leg. The camera stays low enough to read ground purchase but not hide the target.'
],impact=[222],action='heavy-stance',note='A medieval-sized two-handed broadsword is an intentional fantasy departure. Keep its design bronze/early-iron inspired rather than European plate-era.')
S('The field remains his','Shammah',[3830,0,0],[[3650,-370,83],[4080,-430,120],[3830,0,110],[4020,0,125]],[32,32],[
'Commit one diagonal strike into the shield. Wood fibers, binding strips and the wearer’s backward step supply the damage story.',
'The shield breaks into a handful of large, readable pieces plus fine splinters; prevent debris from clipping through the face.',
'Shammah carries the sword’s momentum into a low recovery, not an instant reversed overhead swing.',
'A second opponent loses ground after a shorter follow-up; the field opens through sequential retreats rather than a radial blast.',
'He settles both feet into the deformed soil. The crop lies flattened along his actual path.',
'A camera whip follows an escaping enemy toward the broken chariot, revealing David already accelerating toward it.'
],impact=[78,192],action='heavy-combination',camera_mode='whip-pan',seam='rightward shield-debris wipe',note='“Clearing the field” means a local lane and retreating attackers, not a literal single swing that empties the entire landscape.')

# ACT III — 01:10–01:50
S('The chariot becomes a ramp','David',[5000,-250,0],[[4550,-710,110],[4870,-620,150],[4930,-250,130],[5110,-250,170]],[32,28],[
'David returns with his original sword and shield, now carrying the dust and dents accumulated in Act I.',
'He takes three grounded approach strides; root speed follows the footfalls instead of skating over the ground.',
'The near foot meets the tilted chariot plank. Its flex is small, damped and supported by broken axle geometry.',
'The next step raises his center of mass. The shield is clipped to its carry loop, freeing the sling hand.',
'His final push occurs at the ramp edge. Cloth pulls downward as the body leaves the surface.',
'The camera cranes with the launch, keeping the landing area visible beyond him rather than losing geography in sky.'
],action='ramp-run',camera_mode='crane-up',note='Sling pouch already has a stone secured in the carry fold; “chambering” in the next shot is a stylized reveal of that preparation.')
S('Stone and silence','David',[5110,-250,0],[[4870,-620,150],[5120,-590,235],[5110,-250,170],[5230,-250,235]],[28,50],[
'Enter controlled slow motion as David reaches the upper part of his jump; the camera retains its own smoothly moving clock.',
'He reveals the prepared sling stone with the free hand. Show one clean loading/release preparation, not a tangled multi-step trick.',
'The sling rotates in a readable plane. Respect cord length, finger attachment and the clearance from his face.',
'Release the stone on the marked frame. A brief refractive trace follows its trajectory without a luminous arcade ribbon.',
'Cut attention to the distant archer’s bow as a pre-authored hit breaks the bow limb and loosens the string; no injury close-up.',
'Keep the stone’s route legible in depth. Return to David’s airborne silhouette as a javelin enters the opposite depth layer.'
],impact=[168,228],speed=[[0,0.28],[72,0.16],[162,0.12],[192,0.65],[252,1],[299,1]],action='airborne-sling',camera_mode='bullet-time',note='“Hypersonic” is a subjective sound/VFX exaggeration, not a physical speed specification for a historical sling.')
S('The javelin passes','David',[5230,-250,0],[[5120,-590,235],[5390,-610,145],[5230,-250,235],[5450,-250,135]],[50,35],[
'The javelin’s line is revealed before the dodge. It passes beside David, not directly through an invisible body volume.',
'David rotates his torso and tucks his free shoulder to narrow the silhouette; preserve the existing ballistic center-of-mass arc.',
'The missile clears the tunic by a small but visible distance. One displaced cloth fold sells proximity without a new wound.',
'Acceleration returns toward real time. Boots descend toward a previously established landing patch.',
'David extends for contact, then begins bending knees before the ground reaches him; hands prepare a grounded recovery.',
'End just before the landing compression, with the same trajectory and screen direction continuing into S18.'
],speed=[[0,0.45],[90,0.28],[150,0.55],[210,1.15],[270,1],[299,1]],action='airborne-descent',seam='match on descending boots',note='Midair rotation changes orientation, not the center-of-mass trajectory. Do not create a second unsupported jump.')
S('Earth takes the weight','David',[5450,-250,0],[[5390,-610,145],[5540,-540,70],[5450,-250,135],[5540,-250,90]],[35,32],[
'Boots meet the landing patch. The contact frame precedes the widest dust ring; heels and knees absorb the drop in sequence.',
'A stylized ground-pressure pulse travels through dirt and loose stones. Nearby enemies stumble from startle and unstable footing.',
'Three staggered reactions occur at different depths. No enemy flies like a ragdoll from a physically weak human landing.',
'David’s sword slips to a low ledge or broken timber within the same ground-level fight area; establish its exact resting position.',
'He rises with empty dominant hand and a protective offhand guard. Camera comes in to chest height, keeping the loose sword in background.',
'The nearest opponent closes; David shifts to close-quarters grappling, with the audience still aware of the recoverable weapon.'
],impact=[36],action='landing',note='The shockwave is an explicit legend-mode VFX accent. The sword does not remain falling for the next twenty seconds.')
S('Borrowed momentum','David',[5540,-250,0],[[5540,-540,70],[5730,-580,130],[5540,-250,90],[5700,-250,125]],[32,40],[
'An opponent reaches into the clinch. David changes level while keeping his feet visible and his spine within a plausible range.',
'He establishes the staged hip-turn silhouette. The partner’s center of mass moves over the support point as a coordinated stunt action.',
'The opponent rotates into a controlled fall with readable hip contact and protected head clearance; no snapping joint close-up.',
'David follows the motion into a low stable stance, then releases the partner rather than dragging a dead-weight body.',
'A second attacker meets a short elbow strike against armor padding; a metallic rattle and torso recoil replace explicit injury.',
'David recovers his hand to guard. His eyes find the next threat before the camera transfers focus.'
],impact=[144,240],action='grappling',note='Name the influence in production notes, not as a tutorial: staged Greco-Roman/Pankration-like clinch with a judo-inspired film silhouette.')
S('The disarm in fragments','David',[5700,-250,0],[[5730,-580,130],[5900,-530,125],[5700,-250,125],[5880,-250,130]],[40,45],[
'The dagger attacker enters from the established right-hand lane; a separate arm silhouette keeps weapon ownership clear.',
'David redirects the staged attacking arm outside the head silhouette. The prop contact is camera-cheated and performer-safe.',
'The dagger leaves the opponent’s hand on a short, visible toss; it does not change design, scale or handedness midair.',
'David catches the inert training-prop equivalent by the grip in capture; the final blade is added with controlled animation.',
'He rotates out of the clinch with the dagger low. Recover breathing and foot support before accelerating toward the ruin.',
'A retreating enemy clips the timber holding David’s original sword. The sword tips from its rest into a short, newly initiated fall.'
],impact=[144],action='disarm',seam='match on newly falling sword',note='This resolves the brief’s sword continuity: it rested during the grapple and only now falls into the next shot.')
S('Two blades, one line','David',[5880,-250,0],[[5900,-530,125],[6090,-560,135],[5880,-250,130],[6080,-250,130]],[45,35],[
'Continue the short fall of the original sword from S20. Keep its curved silhouette and worn grip consistent.',
'David catches it by the grip; the offhand dagger remains below his waist and never magically switches hands.',
'He sets a compact asymmetric dual-blade stance. Show a brief stable silhouette before the vanguard enters.',
'The first of five elite soldiers advances with a heavy axe while the other four hold distinct depth positions.',
'David slips beneath the first arc and answers the weapon line, not a graphic neck or torso wound.',
'The first guard yields space. David advances toward the stone ruin, preserving his rightward objective.'
],impact=[216],action='dual-blade',note='The gauntlet contains five distinct opponents across S21–S22, not five simultaneous attackers occupying the same space.')
S('The ruin redirects the fight','David',[6080,-250,0],[[6090,-560,135],[6370,-650,155],[6080,-250,130],[6380,-250,135]],[35,28],[
'Opponents two and three attack in sequence. David uses short parries and footwork while their axe heads retain heavy momentum.',
'One foot plants on a low, angled ruin face for a brief redirect; this is a supported wall-step, not a horizontal running superpower.',
'His body returns along a gravity-consistent path. The camera reveals the landing before the next blade exchange.',
'A vertical counter parts the fourth soldier’s shield guard; use cloth and armor reaction rather than graphic injury.',
'The fifth soldier withdraws from the closing blade line. David finishes the sequence facing the incoming weather front.',
'Wind sends the last dust sheet across the ruin. Cut into that moving veil as the desert light begins to collapse.'
],impact=[72,150,222],action='wall-step',camera_mode='tracking-arc',seam='rightward dust veil / weather bridge',note='No full “battlefield clear” claim: the five local opponents lose the lane while the wider conflict continues.')

# ACT IV — 01:50–02:35
S('The sky changes its mind','David',[6500,0,0],[[6120,-720,150],[6410,-780,205],[6500,0,140],[6600,0,150]],[28,32],[
'Cloud shadow advances across the terrain before the sky darkens; avoid an instantaneous exposure toggle.',
'The sun key drops while skylight cools. David’s warm skin and brown leather remain distinguishable in the new grade.',
'Wind drives loose fabric and dust in the established direction; the storm does not reverse every particle at once.',
'The first large drops strike shoulders and dry ground. Dust suppresses gradually rather than vanishing on one frame.',
'Distant lightning illuminates the cloud volume from within; thunder arrives after a deliberate audible delay.',
'Rain density increases toward the foreground. Lens droplets occupy corners only and do not hide eyes or weapon contacts.'
],impact=[],action='weather',camera_mode='crane-up',note='Use keyed weather curves and cached simulation. A lighting change cannot physically create terrain puddles instantaneously.')
S('Armor remembers water','David',[6600,0,0],[[6410,-780,205],[6510,-430,118],[6600,0,150],[6650,0,115]],[32,65],[
'Track toward a shoulder and blade detail while maintaining a partial face silhouette for orientation.',
'Rain beads merge on the metal, then follow gravity and local surface flow; do not spawn random disconnected white dots.',
'Wetness lowers broad roughness selectively; preserve scratches, grime and dry seams under protected leather.',
'Water falls from the blade tip into forming puddles. Ripples originate at contact positions and decay with scale.',
'A restrained steam wisp appears only where production chooses a recently heated surface; no boiling rain on ordinary cold weapons.',
'Focus returns to David’s eye-line. The champion’s mass emerges through the rain beyond the same shoulder.'
],action='material-detail',aperture=5.6,note='Wetness is a material state, not a full-screen gloss filter. Reflections and film grain must not erase micro-surface scale.')
S('The champion takes the lane','David',[6800,0,0],[[6510,-430,118],[6650,-330,145],[6650,0,115],[7000,0,155]],[65,40],[
'Pull from blade detail to an orienting two-shot. The champion is larger, but still proportioned as a human combatant.',
'David secures or drops the offhand dagger visibly into mud; the final duel uses his original primary blade and a readable free hand.',
'The champion’s first step displaces mud and water from an actual footprint mask; neighboring puddles respond with localized ripples.',
'David shifts to the left third in over-the-shoulder framing, leaving headroom for the champion’s weapon arc.',
'They test range without contact. Rain runs through faces, but the eyes and shoulders remain readable.',
'The champion loads the first heavy strike. Cut on shoulder rotation into the tighter duel view.'
],action='duel-establish',seam='cut on loaded shoulder',note='Weapon inventory is explicit: the dagger does not disappear, and the damaged shield remains clipped behind David.')
S('The first heavy exchange','David',[7000,0,0],[[6650,-330,145],[6830,-310,150],[7000,0,155],[7130,0,150]],[40,40],[
'Over David’s near shoulder, the champion’s weapon begins a high diagonal arc; retain a sliver of sky behind the blade.',
'David displaces his head by a small lateral amount while the pelvis and feet support the movement.',
'The blade misses outside the shoulder silhouette. Spray follows the moving weapon, not a glowing decorative ribbon.',
'David’s short counter meets armor or weapon guard. A two-frame local hit-stop and brief low-frequency impact emphasize mass.',
'The champion resets by dragging the heavy weapon through a recovery path; he cannot reverse direction without time.',
'David exhales, compresses the lead knee and reads the next shoulder cue. Keep the camera on the same side of the line.'
],impact=[180],action='duel-defense',note='Micro-dodges remain centimeter-scale, not sudden whole-body teleports. Preserve cloth and rain motion during localized hit-stop.')
S('Left, low, through','David',[7130,0,0],[[6830,-310,150],[7010,-350,135],[7130,0,150],[7240,0,140]],[40,45],[
'The champion attacks on the opposite diagonal; David’s eyes move before the neck and torso follow.',
'David ducks under the projected path with his back neutral and legs doing the lowering.',
'A second strike arrives only after the champion transfers weight. The shield strap pulls against David’s wet tunic as he turns.',
'David weaves through the recovery gap and meets the next blow with a short, braced parry.',
'Contact sheds water and a few dark metal flakes. Do not show blades bending like rubber.',
'David returns to grounded guard; mud dragged by his heel continues the rightward direction across the next cut.'
],impact=[204],action='duel-defense',note='The “blur of steel” is readable at 60 fps: shoulders, hips and blade tips must not smear into one temporal reconstruction artifact.')
S('A breath before the edge','David',[7240,0,0],[[7010,-350,135],[7110,-300,142],[7240,0,140],[7310,0,145]],[45,50],[
'The champion closes with one short feint; David does not take the bait, making intelligence visible through restraint.',
'A near miss moves past the lens without touching it. Perspective exaggeration replaces excessive camera shake.',
'David catches one real contact and rides the pressure down through his stance; the sword’s existing edge nick becomes visible.',
'Both bodies recover. Music thins and the rain bed becomes temporarily dominant.',
'Hold a half-second dramatic comma while the champion raises the final overhead strike; both remain visibly breathing.',
'The overhead weapon begins its committed fall. Match this movement into the macro-speed-ramp sequence.'
],impact=[126],speed=[[0,1],[180,1],[228,0.45],[270,0.65],[299,0.8]],seam='matched descending blade',action='duel-reset',note='The comma is not a dead still: breath, rain and tightening tendons sustain intent without decorative idle motion.')
S('Where two edges meet','David',[7310,0,0],[[7110,-300,142],[7220,-180,150],[7310,0,145],[7390,0,150]],[50,85],[
'The overhead strike follows its established path. David braces obliquely with the strong of his blade.',
'Begin the ultra-slow ramp before contact so the audience can read both edges approaching.',
'The blade contact frame is exact: deform only a tiny elastic amount, then show surface nicks and water displacement.',
'Use a three-frame localized pose hold while rain, sparks and the independently clocked camera continue moving.',
'Camera pushes toward the contact, keeping an unmistakable gap between the two hands and all sharp edges.',
'The champion’s weapon slides off line. David’s hips begin lowering before the camera reveals the opening.'
],impact=[132],speed=[[0,0.8],[60,0.25],[114,0.08],[180,0.08],[252,0.18],[299,0.3]],camera_mode='push-to-glass',action='climax-contact',aperture=5.6,note='Stress marks are authored normal/displacement masks on existing nicks, not a claim that healthy steel visibly cracks under every ordinary parry.')
S('Inside the storm','David',[7390,0,0],[[7220,-180,150],[7350,-250,80],[7390,0,150],[7470,0,95]],[85,50],[
'Macro water droplets ricochet from the crossed blades; preserve scale, specular shape and gravity across the speed ramp.',
'Fracture masks reveal one pre-weakened shoulder-armor fastening. Keep it distinct from the blade’s own small edge damage.',
'David drops under the champion’s guard along a grounded sliding step. The free hand balances without touching the blade.',
'He advances beneath the displaced weapon while hips remain low and feet maintain contact with the mud.',
'The camera descends with him but avoids rolling the horizon; the champion’s vulnerable shoulder remains in the upper-right frame.',
'David’s forward foot plants. His rising strike begins with the leg drive, then hips, torso and weapon arm.'
],speed=[[0,0.3],[72,0.12],[144,0.18],[204,0.45],[264,0.8],[299,1]],action='low-slide',camera_mode='low-tracking',note='Record cloth and water in the same retimed action clock, except deliberate foreground rain and camera particles assigned to output time.')
S('The shoulder of the giant','David',[7470,0,0],[[7350,-250,80],[7580,-420,145],[7470,0,95],[7620,0,135]],[50,35],[
'The planted leg extends and drives David upward. The sword follows a concise vertical line toward the pre-weakened armor seam.',
'Contact releases the shoulder pauldron fastener. Break the armor into authored exterior fragments without exposing tissue.',
'A concentrated spark flash and water burst mark the peak; hold silhouette readability and avoid a full white frame.',
'The champion recoils to one knee and drops the heavy weapon. His defeat is clear without a graphic fatal finishing blow.',
'David stops his sword’s momentum into a controlled guard and regains his breath; do not freeze him as a victory statue.',
'Camera follows falling armor into the mud, allowing a low foreground occlusion to begin the ascent into the aftermath.'
],impact=[96],speed=[[0,1],[72,0.6],[96,0.22],[138,0.4],[192,1.15],[264,1],[299,1]],action='finishing-exchange',seam='falling pauldron / mud occlusion',note='Use a keyed Geometry Collection cache for the armor burst. Never rely on a fresh random destruction solve for the hero take.')

# ACT V — 02:35–03:00
S('The ground remembers','David',[7800,180,0],[[7580,-420,35],[7790,-610,170],[7800,180,100],[7900,220,145]],[35,32],[
'Begin near a fallen armor fragment in mud; a ripple carries the impact into a quieter scene.',
'The camera rises out of the puddle reflection without a visible lens teleport or impossible clipping through terrain.',
'Retreating soldiers cross the mist in staggered groups. They remain grounded and do not dissolve into particle clouds.',
'David enters the center-left foreground on the hill approach, carrying all persistent armor, dirt and costume states.',
'His chest heaves with asymmetric breaths. The tunic follows rib and abdominal movement rather than a uniform torso scale.',
'The camera clears the low ridge and discovers the three companions in distant depth, supporting David rather than stealing focus.'
],action='aftermath',camera_mode='crane-up',note='Breathing is a performance curve driving a correct rig, not a simulation of actual internal lung mechanics.')
S('Four survivors, one horizon','David',[8000,300,0],[[7790,-610,170],[7940,-900,290],[7900,220,145],[8070,320,145]],[32,40],[
'David reaches the crest and stops through two decelerating steps; his boots sink slightly into the wet ground.',
'Josheb’s spear, Eleazar’s bound hand and Shammah’s heavy blade read as distant identifying silhouettes.',
'The champion remains behind and below frame, defeated but not the subject of a graphic aftermath shot.',
'David’s shoulders release tension one at a time; keep his gaze forward rather than at the audience.',
'The rain begins to thin. First light opens behind the clouds, but the landscape remains predominantly cool.',
'Hold the composition long enough to feel the cost of the encounter, then begin the final camera retreat.'
],action='performance',camera_mode='crane-up',note='No spoken boast. The emotional resolve is exhaustion, solidarity and survival rather than celebratory cruelty.')
S('Gold through the clouds','David',[8070,320,0],[[7940,-900,290],[8180,-1250,420],[8070,320,145],[8120,340,130]],[40,45],[
'A narrow cloud break introduces warm backlight while the sky remains storm-dark beyond it.',
'God-rays become visible through the existing moist haze; preserve detail in bright cloud edges.',
'David lowers the sword point to the ground. His wrist and elbow align before he commits body weight.',
'The sword enters a soft patch of mud rather than solid stone; resistance and a small clod displacement sell the action.',
'He leans onto the hilt only after the blade is seated. Spine and shoulders show relief, not collapse.',
'The camera begins a faster retreat, holding David as a small but readable anchor within the widening landscape.'
],impact=[180],action='sword-plant',camera_mode='inverse-zoom-through',note='Wet surfaces brighten through directional reflections, not by changing every metal material to yellow.')
S('The wilderness holds the story','David',[8120,340,0],[[8180,-1250,420],[9300,-3400,1250],[8120,340,130],[8350,500,180]],[45,32],[
'Continue the retreat with matching scale-velocity sign: David gets smaller on both sides of the edit.',
'Reveal terraces, broken road, the ruined chariot route and the lentil field as one coherent geography.',
'Rays traverse the valley without sweeping arbitrarily across the sun direction; the warm opening widens naturally.',
'Enemy movement recedes into mist. The three companions remain legible only as a connected group on the ridge.',
'Create a clean area of low-detail dark cloud for the upcoming title; do not place lettering on David’s face or sword.',
'Drift into a restrained, nearly settled wide frame. Music resolves while wind and a final breath carry into the title.'
],action='landscape',camera_mode='inverse-zoom-through',seam='wide landscape plate continues under title',note='The pullback is camera movement plus lens design, not a cropped still stretched to simulate a landscape.')
S('A name cut into bronze','Title',[8350,500,0],[[9300,-3400,1250],[9540,-3700,1340],[8350,500,180],[8350,500,180]],[32,32],[
'Keep the wide landscape plate. Introduce the first low-intensity metallic grazing highlight along chiseled letter bevels.',
'The word VALOR resolves through a restrained embossed reveal; no exploding shards, neon outline or generic gradient fill.',
'The smaller line THE CHRONICLES OF DAVID appears beneath it, fully readable and held on a stable baseline.',
'Hold the complete lockup against the darkened cloud region. Patinated bronze catches warm edge light without clipping.',
'Begin a smooth, controlled fade of plate, type and score. Preserve enough hold time for the full title to be read.',
'Reach full black for the final twelve frames. The last audible tail ends before frame 10800; no accidental extra frame.'
],action='title',camera_mode='settled-wide',seam='terminal fade to black / no outgoing cut',note='Onscreen lockup is exactly VALOR: THE CHRONICLES OF DAVID. The alternate brief title remains a working/project name only.')

assert len(SHOTS)==36
