import csv, json, math, sys, tempfile, types, unittest
from pathlib import Path
from unittest.mock import patch
import pipeline as p
import unreal_import as importer
from shots import SHOTS, ACTS, PHASE_EDGES

# This mock verifies our API CALL CONTRACT, not compatibility with a live UE build.
def mock_unreal(existing=False):
    state=types.SimpleNamespace(actors=[],sequences=[],keys=0,cuts=[],saved=False,deleted=[],logs=[])
    class Struct:
        def __init__(self):self.props={}
        def set_editor_property(self,k,v):self.props[k]=v
    class Component(Struct):
        def get_editor_property(self,k):return self.props.setdefault(k,Struct())
        def set_mobility(self,v):self.mobility=v
    class Actor:
        def __init__(self):self.component=Component()
        def set_actor_label(self,label):self.label=label
        def get_cine_camera_component(self):return self.component
        def get_component_by_class(self,kind):return self.component
    class Actors:
        def spawn_actor_from_class(self,*args):a=Actor();state.actors.append(a);return a
        def destroy_actor(self,a):state.actors.remove(a)
    class Channel:
        def add_key(self,frame,value,**kwargs):
            assert kwargs['time_unit']=='display';assert kwargs['interpolation']=='linear';assert 0<=frame<10800;assert math.isfinite(value);state.keys+=1
    class Section:
        def __init__(self,kind):self.kind=kind;self.channels=[Channel() for _ in range(9 if kind=='transform' else 1 if kind=='float' else 0)]
        def set_range(self,a,b):self.range=(a,b)
        def get_all_channels(self):return self.channels
        def set_camera_binding_id(self,b):state.cuts.append(self.range)
    class Track:
        def __init__(self,kind):self.kind=kind
        def set_property_name_and_path(self,n,p):self.property=p
        def add_section(self):return Section(self.kind)
    class Binding:
        def __init__(self,i):self.i=i
        def get_id(self):return self.i
        def add_track(self,kind):return Track(kind)
        def set_parent(self,p):self.parent=p
    class Sequence:
        def __init__(self):self.bindings=[]
        def set_display_rate(self,r):self.rate=r
        def set_playback_start(self,v):self.start=v
        def set_playback_end(self,v):self.end=v
        def add_master_track(self,kind):return Track(kind)
        def add_possessable(self,obj):b=Binding(len(self.bindings));self.bindings.append(b);return b
    class Assets:
        @staticmethod
        def does_asset_exist(path):return existing
        @staticmethod
        def make_directory(path):pass
        @staticmethod
        def save_loaded_asset(s):state.saved=True
        @staticmethod
        def delete_asset(path):state.deleted.append(path)
    class Tools:
        def create_asset(self,*args):s=Sequence();state.sequences.append(s);return s
    ue=types.SimpleNamespace(EditorActorSubsystem='actors',LevelSequenceFactoryNew=lambda:None,MovieScene3DTransformTrack='transform',MovieSceneFloatTrack='float',MovieSceneCameraCutTrack='cut',MovieSceneObjectBindingID=Struct,
      SequenceTimeUnit=types.SimpleNamespace(DISPLAY_RATE='display'),MovieSceneKeyInterpolation=types.SimpleNamespace(LINEAR='linear'),CineCameraActor='camera',DirectionalLight='sun',DirectionalLightComponent='light',
      MovieSceneSequenceExtensions=types.SimpleNamespace(set_tick_resolution=lambda seq,r:setattr(seq,'ticks',r)),EditorAssetLibrary=Assets,
      get_editor_subsystem=lambda _:Actors(),AssetToolsHelpers=types.SimpleNamespace(get_asset_tools=lambda:Tools()),LevelSequence='sequence',FrameRate=lambda a,b:(a,b),FrameNumber=lambda n:n,
      Vector=lambda *v:v,Rotator=lambda *v:v,CameraFocusMethod=types.SimpleNamespace(MANUAL='manual'),ComponentMobility=types.SimpleNamespace(MOVABLE='movable'),log=state.logs.append)
    return ue,state

class PlanningTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rows=p.build_frames();cls.temp=tempfile.TemporaryDirectory();cls.csv=Path(cls.temp.name)/'frames.csv'
        with cls.csv.open('w',newline='',encoding='utf8') as f:w=csv.DictWriter(f,fieldnames=cls.rows[0]);w.writeheader();w.writerows(cls.rows)
    @classmethod
    def tearDownClass(cls):cls.temp.cleanup()
    def test_frame_coverage(self):self.assertEqual([r['frame'] for r in self.rows],list(range(10800)))
    def test_shot_coverage(self):
        self.assertEqual(len(SHOTS),36)
        for i,s in enumerate(SHOTS):self.assertEqual((s['start_frame'],s['end_frame_exclusive']),(i*300,(i+1)*300))
    def test_act_boundaries(self):self.assertEqual([(a[0],a[1]) for a in ACTS],[(0,30),(30,70),(70,110),(110,155),(155,180)])
    def test_choreography_phases_cover_all_frames(self):
        self.assertEqual(len(SHOTS)*6,216)
        for r in self.rows:self.assertTrue(0<=r['phase_index']<6 and r['direction'])
    def test_finite_numeric_channels(self):
        for r in self.rows:
            for k,v in r.items():
                if isinstance(v,(int,float)):self.assertTrue(math.isfinite(v),(r['frame'],k))
    def test_action_and_pose_clocks(self):
        for a,b in zip(self.rows,self.rows[1:]):
            self.assertGreaterEqual(b['action_source_s'],a['action_source_s'])
            self.assertGreaterEqual(b['pose_source_s'],a['pose_source_s'])
            if a['pose_hold']:self.assertEqual(b['pose_source_s'],a['pose_source_s'])
        self.assertTrue(all(.079<=r['action_speed']<=1.201 for r in self.rows))
    def test_exact_camera_endpoints(self):
        for s in SHOTS:
            for local,expected in [(0,s['camera_start_cm']),(299,s['camera_end_cm'])]:
                cam=p.camera(s,local)
                for k,v in zip(['cam_x_cm','cam_y_cm','cam_z_cm'],expected):self.assertAlmostEqual(cam[k],v,places=6)
    def test_optics(self):
        for r in self.rows:self.assertTrue(18<=r['focal_mm']<=150 and r['focus_cm']>20 and 2<=r['aperture']<=8)
    def test_event_samples_and_pose_holds(self):
        for e in p.events():self.assertEqual(e['sample'],e['frame']*800);self.assertLess(e['frame'],10800)
        for r in self.rows:self.assertEqual(r['audio_sample'],r['frame']*800)
    def test_black_tail_and_title(self):
        self.assertTrue(all(r['plate_opacity']==0 and r['title_opacity']==0 for r in self.rows[-12:]))
        self.assertEqual(self.rows[10620]['title_subtitle_reveal'],1)
        self.assertEqual(self.rows[10499]['title_opacity'],0)
        self.assertEqual(p.TITLE,'VALOR: THE CHRONICLES OF DAVID')
    def test_wetness_persists(self):
        self.assertEqual(p.environment(175)['rain_mm_h'],0);self.assertGreater(p.environment(179)['wetness'],.8)
    def test_ballistics_in_physical_source_time(self):
        for t in [75,76.3,77.8,80,82.4,85.6]:
            r=p.flight_state(t);tau=r['flight_source_s']
            self.assertAlmostEqual(r['flight_root_z_cm'],max(0,140+240*tau-.5*981*tau*tau),places=8)
        self.assertAlmostEqual(p.flight_state(85.6)['flight_root_z_cm'],0,places=6)
    def test_generation_prompts(self):
        prompts=p.prompts();self.assertEqual(len(prompts),36)
        for r in prompts:self.assertTrue(r['first_frame_anchor'] and r['last_frame_anchor'] and r['negative_guidance']);self.assertEqual(r['duration_seconds'],5)
    def test_frame_evaluation_is_repeatable(self):
        self.assertEqual(p.camera(SHOTS[15],173),p.camera(SHOTS[15],173));self.assertEqual(p.environment(117.2),p.environment(117.2))
    def test_unreal_import_api_contract(self):
        ue,state=mock_unreal()
        with patch.dict(sys.modules,{'unreal':ue}):seq=importer.import_sequence(self.csv)
        self.assertEqual(seq.rate,(60,1));self.assertEqual(seq.ticks,(60000,1));self.assertEqual((seq.start,seq.end),(0,10800))
        self.assertEqual(len(state.actors),37);self.assertEqual(state.cuts,[(i*300,(i+1)*300) for i in range(36)])
        self.assertGreater(state.keys,100000);self.assertTrue(state.saved)
    def test_unreal_never_overwrites_existing_sequence(self):
        ue,state=mock_unreal(existing=True)
        with patch.dict(sys.modules,{'unreal':ue}):
            with self.assertRaisesRegex(RuntimeError,'Refusing to overwrite'):importer.import_sequence(self.csv)
        self.assertFalse(state.actors);self.assertFalse(state.deleted)

if __name__=='__main__':
    suite=unittest.defaultTestLoader.loadTestsFromTestCase(PlanningTests)
    result=unittest.TextTestRunner(verbosity=2).run(suite)
    p.OUT.mkdir(exist_ok=True)
    (p.OUT/'validation.json').write_text(json.dumps(dict(passed=result.wasSuccessful(),tests=result.testsRun,failures=len(result.failures),errors=len(result.errors),frames=10800,shots=36,phases=216,
      scope='Planning data, exact frame/sample coverage, optical/channel sanity and a mocked Unreal Python call contract. Not a live UE execution, PS5 performance benchmark, completed animation collision pass or rendered photorealistic film.'),indent=2))
    sys.exit(0 if result.wasSuccessful() else 1)
