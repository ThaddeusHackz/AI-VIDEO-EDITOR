# Real talking-head footage → finished editorial video

This is a recommended production procedure, **not a description of the unviewed YouTube videos**. Reuse the existing [talking-head skill](../../skills/talking-head-recut/SKILL.md) and [caption skill](../../skills/captions-overlay/SKILL.md) for composition details. Do not treat the NLE showcase's generated cards as actual A-roll.

## Gate 0 — Intake and a reproducible media clock

Create a new job folder outside tracked source or under ignored `renders/`. Preserve originals. Keep source, proxies, audio, masks, graphics and exports separate. Log:

- Source filename, SHA-256, ownership/license basis, consent/privacy constraints.
- Container duration **and stream durations**, first timestamps, video dimensions, sample aspect ratio, rotation, `r_frame_rate`, `avg_frame_rate`, timebase and frame count when known.
- Audio channels/layout, sample rate, codec and sync offset.
- Color primaries, transfer, matrix and range; missing fields remain unknown. HDR cannot be made safe merely by labelling it Rec.709.
- Project aspect ratio, target FPS, intended destination and review criteria.

When FFmpeg/ffprobe are available, use commands like these in the **job folder**, with your own source paths. These examples were not executed in this session:

```bash
# Do not overwrite prior evidence accidentally.
sha256sum source.mp4
ffprobe -v error -show_format -show_streams -of json source.mp4
ffmpeg -n -i source.mp4 -map 0:a:0 -vn -ac 1 -ar 16000 -c:a pcm_s16le asr.wav
```

No audio stream? Record that fact; do not fabricate speech or an ASR result. `avg_frame_rate != r_frame_rate` is a warning sign, not a conclusive VFR test. Inspect actual timestamps when necessary. For VFR, preserve PTS or make an explicitly chosen CFR working copy and align the transcript to that copy. The added compiler accepts only **one normalized CFR timebase**, including rational rates such as 30000/1001.

Do not upload private recordings to ASR/model services without authorization. Local ASR may still require model weights, dependencies and GPU/CPU resources not present here.

## Gate 1 — Transcript and editorial intent

1. Generate a word-timed transcript with a selected available ASR provider; record provider/version, language and input hash. Word times are estimates.
2. Listen and correct wording and boundaries. Preserve negation, qualifying language and the causal order of the speaker's claims.
3. Write a one-sentence viewer takeaway. Identify the hook, explanation, evidence, payoff and optional call to action.
4. Mark keep/remove ranges with reasons. Remove repeated takes or distracting gaps only after listening. Do not mechanically remove all breaths or shorten every silence.
5. Retain handles around cuts for audio repairs; distinguish media that is retained but covered by B-roll from media actually removed.

A caption `drop` setting only hides text. It does **not** remove the spoken word from the source audio. Conversely, cutting audio means caption timing must change. Maintain a faithful accessibility subtitle track even if decorative typography omits filler words.

## Gate 2 — Paper edit and source-to-timeline mapping

For each retained source interval `[a,b)` placed at output frame `T`:

```text
output duration = b - a
output frame for source frame s = T + (s - a), for a <= s < b
next interval begins at T + (b - a)
```

Use integer frames for picture and rational FPS for seconds. Preserve audio precision with samples/PTS in the renderer; do not repeatedly round timestamps through milliseconds. Transcript seconds need one documented quantization policy (for example floor start / ceil end); review overlaps introduced by quantization rather than silently clamping words away.

Use [EDIT_PLAN.md](EDIT_PLAN.md) and `tools/compile_edit.py` to validate a **single-source, 1×, ordered, hard-cut** edit. It returns an ordered timeline, retimed words, omissions and explicit warnings. Never feed the original transcript to the shortened video.

The compiler intentionally rejects partially retained words. For continuous adjacent ranges, merge them if the boundary falls inside a word. For more complex edits, define a new versioned contract rather than hiding unsupported speed ramps or multiple speakers in extra fields.

## Gate 3 — Media-backed picture assembly

Choose **one primary renderer**. Do not switch engines merely to use more tools.

### Remotion implementation contract (to be implemented in a new job)

- Sequence each segment from `timeline_in` for `timeline_out - timeline_in` frames.
- Load an actual local media asset, trim to `[source_in, source_out)`, and preserve its dialogue once. Verify the installed Remotion media API; trim prop names differ across APIs/versions.
- Keep transcript/graphic cue times in global output frames. Inside a nested `Sequence`, `useCurrentFrame()` is local; either offset back to global or explicitly transform cues to local frames, never both.
- For full-frame B-roll, keep approved dialogue underneath. If using a separate audio stem, mute the duplicate source-video audio.
- `CaptionRailOverlay` expects seconds; adapt `timeline_in / fps` and `timeline_out / fps` deliberately. Its existing display rules and inclusive timing comparisons need boundary review; the new plan itself uses half-open intervals.
- Keep media readiness and font readiness in the render lifecycle. Use frame-derived transforms, not CSS live-clock transitions.

### HyperFrames implementation contract (to be implemented in a new job)

- Follow the installed skill's timed-media and registered paused-timeline contracts.
- Import the already approved rough-cut media or implement explicit trimmed clips if that version supports them. Do not assume a JSON edit plan is natively accepted.
- Keep the voice track as the timing authority. Import retimed graphic/caption cues.
- Use timed wrappers for layout changes and check clipping, aspect ratio and readable safe areas.

For J/L cuts, separate picture intervals from audio intervals. An audio crossfade must consume real source handles, not duplicate phonemes. This simple compiler cannot represent split edits, dissolves or audio handles; handle them in an explicitly richer timeline and revalidate total duration.

## Gate 4 — Graphics that explain the speaker

Build a storyboard with output-frame in/out, **verbatim spoken trigger**, purpose, element, placement, motion and asset reference. Use the words to motivate motion; do not add a random flourish every two seconds.

| Need | Appropriate treatment | Proof before final render |
|---|---|---|
| Introduce speaker | One restrained lower-third | Name/title verified; doesn't hide hands or captions |
| Explain a number | Single large number + units/source | Matches spoken value; arithmetic and units checked |
| Describe a process | Staged diagram keyed to phrases | Order matches explanation; phone-size readability |
| Hide a jump cut | Relevant licensed B-roll or deliberate punch-in | Continuous meaning/audio; no false implied evidence |
| Emphasize a phrase | Limited kinetic words | No fabricated quote; readable dwell |
| Put text behind the person | Background plate + type + subject matte | Stable edges, hair, hands, transparency and occlusion |
| Show a product in 3D | Tracked or clearly illustrative model insert | Scale/lighting plausible; model license cleared |

A CSS overlay behind an opaque full-frame video is invisible; placing it above the video is not subject occlusion. Use a real matte/rotoscope or avoid the effect. Review crop paths manually for vertical delivery; scaling landscape footage to fill 9:16 can cut off a face or demonstrative gesture.

Design typography for the actual output and platform UI. Rough safe margins are not universal guarantees. Keep a readable caption style for dense passages instead of making every word explode. Avoid rapid full-screen high-contrast flashes.

## Gate 5 — Audio, color and compositing

- Edit dialogue first; listen around every splice. Use room tone and short, justified crossfades where appropriate. Check phase and channel mapping.
- Add noise reduction conservatively, then EQ/compression only as needed. Aggressive denoising can produce metallic consonants.
- Set music relative to intelligibility, not a universal ducking number. Automate gain on the **actual audio bus**; confirm attack/release by listening.
- Use a documented delivery loudness target. For example, a chosen online stereo mix might target roughly −16 LUFS integrated and ≤ −1 dBTP, but platform/client requirements take precedence. Measure the final mix and remeasure the encoded file; a meter animation proves nothing.
- Normalize exposure and white balance before the look. Apply actual LUTs/color transforms only with known input/output spaces. Scope the footage grade separately from brand graphics unless intended otherwise.
- Match overlay sharpness, blur and grain to the plate when realism matters. Keep titles legible rather than indiscriminately grading the whole canvas.

## Gate 6 — Acceptance and delivery

1. Inspect first/last frame, all cuts at −1/0/+1 frame, caption boundaries, densest typography and hero effects.
2. Render the same sampled frames in different orders to test deterministic seeking; compare under a fixed renderer/font/GPU environment.
3. Watch **and listen to the full encoded export**, including fades and tail. Inspect lip sync at beginning, middle and end. Check every edited claim against retained source context.
4. Once tools are available:

   ```bash
   ffprobe -v error -show_format -show_streams -of json final.mp4
   ffmpeg -nostdin -v error -xerror -i final.mp4 -map 0:v:0 -map '0:a?' -f null -
   ffmpeg -nostdin -hide_banner -i final.mp4 -vn -af ebur128=peak=true -f null -
   ```

   Full decoding detects media errors, not bad storytelling, consent problems or visual defects. Loudness analysis requires an audio stream.
5. Deliver MP4, project/source references, caption sidecar, asset/license manifest, edit plan, tool versions and QA notes. Label missing verification as blocked, not passed.

No final render or listening check has been performed by this resource pack.
