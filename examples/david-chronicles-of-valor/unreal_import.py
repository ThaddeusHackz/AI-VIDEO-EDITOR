"""UE 5.5 Python Editor camera/sun importer. No hero assets or simulations are fabricated.
Execute this file from Tools > Execute Python Script in a version-controlled working level.
Outside UE: python unreal_import.py --validate-only
"""
from __future__ import annotations
import csv, math, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent
CSV=ROOT/'out'/'frames.csv'
ASSET_PATH='/Game/Cinematics/DavidValor'
ASSET_NAME='LS_David_Valor_180s_v001'

FLOAT_FIELDS=['cam_x_cm','cam_y_cm','cam_z_cm','roll_deg','pitch_deg','yaw_deg','focal_mm','aperture','focus_cm','sun_lux_with_lightning','sun_kelvin']
def load_rows(path=CSV):
    with Path(path).open(newline='',encoding='utf8') as f:rows=list(csv.DictReader(f))
    if len(rows)!=10800:raise ValueError('Expected exactly 10,800 rows; generate the package first.')
    for i,r in enumerate(rows):
        if int(r['frame'])!=i:raise ValueError(f'Frame gap or duplicate at row {i}')
        for k in FLOAT_FIELDS:
            r[k]=float(r[k])
            if not math.isfinite(r[k]):raise ValueError(f'Nonfinite {k} at frame {i}')
        if r['focus_cm']<=0 or r['focal_mm']<=0:raise ValueError('Invalid optical values')
        r['frame']=i
    return rows

def import_sequence(csv_path=CSV,asset_path=ASSET_PATH,asset_name=ASSET_NAME):
    import unreal as ue
    rows=load_rows(csv_path)
    required=['EditorActorSubsystem','LevelSequenceFactoryNew','MovieScene3DTransformTrack','MovieSceneFloatTrack',
              'MovieSceneCameraCutTrack','MovieSceneObjectBindingID','SequenceTimeUnit','MovieSceneKeyInterpolation',
              'CineCameraActor','DirectionalLight','DirectionalLightComponent','MovieSceneSequenceExtensions']
    missing=[name for name in required if not hasattr(ue,name)]
    if missing:raise RuntimeError('Enable Python Editor Script and Sequencer Scripting; missing UE APIs: '+', '.join(missing))
    destination=f'{asset_path}/{asset_name}'
    if ue.EditorAssetLibrary.does_asset_exist(destination):
        raise RuntimeError(f'Refusing to overwrite {destination}. Choose a new versioned asset_name.')
    actors=ue.get_editor_subsystem(ue.EditorActorSubsystem)
    created=[];sequence=None
    def channels(section):
        return section.get_all_channels() if hasattr(section,'get_all_channels') else ue.MovieSceneSectionExtensions.get_all_channels(section)
    def key(channel,frame,value):
        channel.add_key(ue.FrameNumber(frame),float(value),time_unit=ue.SequenceTimeUnit.DISPLAY_RATE,interpolation=ue.MovieSceneKeyInterpolation.LINEAR)
    def float_track(binding,property_name,property_path,frame_rows,column,start,end):
        track=binding.add_track(ue.MovieSceneFloatTrack)
        track.set_property_name_and_path(property_name,property_path)
        section=track.add_section();section.set_range(start,end)
        ch=channels(section)
        if len(ch)!=1:raise RuntimeError(f'Unexpected channel layout for {property_path}: {len(ch)}')
        for r in frame_rows:key(ch[0],r['frame'],r[column])
    try:
        ue.EditorAssetLibrary.make_directory(asset_path)
        sequence=ue.AssetToolsHelpers.get_asset_tools().create_asset(asset_name,asset_path,ue.LevelSequence,ue.LevelSequenceFactoryNew())
        if sequence is None:raise RuntimeError('Level Sequence creation failed')
        sequence.set_display_rate(ue.FrameRate(60,1))
        ue.MovieSceneSequenceExtensions.set_tick_resolution(sequence,ue.FrameRate(60000,1))
        sequence.set_playback_start(0);sequence.set_playback_end(10800)
        cut_track=sequence.add_master_track(ue.MovieSceneCameraCutTrack) if hasattr(sequence,'add_master_track') else sequence.add_track(ue.MovieSceneCameraCutTrack)
        for i in range(36):
            shot_rows=rows[i*300:(i+1)*300];start=i*300;end=start+300
            actor=actors.spawn_actor_from_class(ue.CineCameraActor,ue.Vector(0,0,0),ue.Rotator(0,0,0))
            if actor is None:raise RuntimeError(f'Camera spawn failed at S{i+1:02}')
            created.append(actor);actor.set_actor_label(f'DAVID_PLAN_{asset_name}_S{i+1:02}')
            component=actor.get_cine_camera_component()
            filmback=component.get_editor_property('filmback');filmback.set_editor_property('sensor_width',36.0);filmback.set_editor_property('sensor_height',20.25);component.set_editor_property('filmback',filmback)
            focus=component.get_editor_property('focus_settings');focus.set_editor_property('focus_method',ue.CameraFocusMethod.MANUAL);component.set_editor_property('focus_settings',focus)
            # Avoid the default lens preset clamping 135 mm / close focus in the ECU.
            lens=component.get_editor_property('lens_settings');lens.set_editor_property('min_focal_length',18.0);lens.set_editor_property('max_focal_length',150.0);lens.set_editor_property('minimum_focus_distance',20.0);component.set_editor_property('lens_settings',lens)
            binding=sequence.add_possessable(actor)
            transform=binding.add_track(ue.MovieScene3DTransformTrack);section=transform.add_section();section.set_range(start,end);ch=channels(section)
            if len(ch)!=9:raise RuntimeError(f'Expected 9 transform channels, got {len(ch)}. Verify UE 5.5 channel order.')
            # UE transform channels: XYZ location, XYZ Euler rotation (roll,pitch,yaw), XYZ scale.
            for r in shot_rows:
                for c,col in zip(ch[:6],['cam_x_cm','cam_y_cm','cam_z_cm','roll_deg','pitch_deg','yaw_deg']):key(c,r['frame'],r[col])
            for c in ch[6:]:key(c,start,1.0)
            cb=sequence.add_possessable(component)
            if hasattr(cb,'set_parent'):cb.set_parent(binding)
            float_track(cb,'CurrentFocalLength','CurrentFocalLength',shot_rows,'focal_mm',start,end)
            float_track(cb,'CurrentAperture','CurrentAperture',shot_rows,'aperture',start,end)
            float_track(cb,'ManualFocusDistance','FocusSettings.ManualFocusDistance',shot_rows,'focus_cm',start,end)
            cut=cut_track.add_section();cut.set_range(start,end)
            bid=ue.MovieSceneObjectBindingID();bid.set_editor_property('guid',binding.get_id());cut.set_camera_binding_id(bid)
        sun=actors.spawn_actor_from_class(ue.DirectionalLight,ue.Vector(0,0,5000),ue.Rotator(-35,-25,0))
        if sun is None:raise RuntimeError('Directional light spawn failed')
        created.append(sun);sun.set_actor_label('DAVID_PLAN_'+asset_name+'_Sun')
        light=sun.get_component_by_class(ue.DirectionalLightComponent)
        light.set_mobility(ue.ComponentMobility.MOVABLE);light.set_editor_property('use_temperature',True)
        sb=sequence.add_possessable(sun)
        lb=sequence.add_possessable(light)
        if hasattr(lb,'set_parent'):lb.set_parent(sb)
        float_track(lb,'Intensity','Intensity',rows,'sun_lux_with_lightning',0,10800)
        float_track(lb,'Temperature','Temperature',rows,'sun_kelvin',0,10800)
        ue.EditorAssetLibrary.save_loaded_asset(sequence)
        ue.log(f'Created {destination}: 36 cameras, 10800 display frames, keyed sun. Save this LEVEL manually. Characters, caches and custom weather remain integration work.')
        return sequence
    except Exception:
        # Only objects created by THIS invocation are removed; existing project assets are never touched.
        for actor in reversed(created):actors.destroy_actor(actor)
        if sequence is not None:ue.EditorAssetLibrary.delete_asset(destination)
        raise

if __name__=='__main__':
    if '--validate-only' in sys.argv:
        print(f'Validated {len(load_rows())} frame rows. Unreal was not imported or executed.')
    else:import_sequence()
