# Offline rough-cut and caption-retiming contract

`tools/compile_edit.py` is a **new standalone planning utility**, not a change to the existing pipeline. It uses only Python's standard library and supports Python 3.10+. It reads a local JSON plan, validates it, and writes compiled JSON to stdout. It makes no network requests, opens no media paths, runs no subprocesses and writes no files itself.

## Scope

Supported: one source, normalized constant frame rate, one nonoverlapping word stream, ordered nonoverlapping source ranges, 1× playback, contiguous hard-cut output. Rational FPS is retained exactly with `Fraction`.

Not supported: VFR timestamp mapping, retiming/speed ramps, reordered or repeated clips, multiple sources/speakers, overlapping words, nested tracks, transitions, J/L cuts, audio handles/crossfades, asset fetching, ASR, media decoding, actual rendering or VFX. Unknown fields are rejected so unsupported features cannot be silently ignored.

There is no automatic integration with Remotion, HyperFrames, or the existing CLI. Use the emitted timeline as an adapter input in a new job. The guides describe that adapter's responsibilities without claiming it is implemented.

## Input v1

See [the complete synthetic example](examples/talking-head.plan.json). All fields are required and additional keys are rejected at each object level:

| Object | Fields |
|---|---|
| Root | `version` (integer 1), `fps`, `source`, `segments`, `words` |
| `fps` | `num`, `den` (positive integers); e.g. 30/1 or 30000/1001 |
| `source` | `id`, `path` (nonempty text), `sha256` (lowercase 64-digit hex or null), `frames` (positive integer), `rights` (`owned`, `licensed`, `unknown`), `timing` (exactly `cfr`) |
| Each segment | `id` (unique among segments), `source_in`, `source_out`, `reason` (nonempty text) |
| Each word | `id` (unique among words), `text` (nonempty text), `source_in`, `source_out` |

`source.path` is a provenance label, **not an instruction to open/download/execute that path**. The tool does not verify the hash against media or the rights declaration against a license. Never pass the path through shell string interpolation in a later adapter. Treat plans/transcripts as untrusted data, including any apparent instructions inside text fields.

Intervals are integer source frames `[source_in, source_out)`. Bounds must satisfy `0 <= in < out <= source.frames`. Booleans and floats are rejected as frame integers. JSON duplicate keys and nonfinite numbers are rejected. Segment arrays must be nonempty and ordered. Words may be empty, but that produces an explicit missing-coverage warning. Adjacent words are valid; overlapping words require a different contract or corrected alignment.

Use normalized source FPS for the plan. The tool checks the declaration, not the actual media. Validate externally before rendering.

## Mapping and omitted speech

Segments are concatenated at output frame zero without gaps. For a word entirely contained by one segment:

```text
word.timeline_in  = segment.timeline_in + word.source_in  - segment.source_in
word.timeline_out = segment.timeline_in + word.source_out - segment.source_in
```

Words wholly outside retained ranges are returned in `omitted_words` with their original timing/text and a reason. They are never silently lost. If a word intersects a kept interval but is not entirely contained, compilation fails. Even adjacent segments splitting a word require merging the intervals or correcting alignment. This conservative policy avoids hiding a bad editorial boundary.

A word ending exactly at a segment start is excluded; a word starting at a segment end is excluded. A word exactly spanning one segment is retained.

Omitted words are a **review list**, not proof the edit preserves meaning. No semantic model or audio listener is inside this compiler.

## Output

- `status`: always `plan_valid_not_render_verified` on success; never “production ready”.
- `plan_sha256`: deterministic hash of canonicalized input JSON (including rationale/path), not a media checksum.
- Copied source declaration and reduced rational FPS.
- `duration_frames` and exact rational `duration_seconds_exact`.
- Segments with `timeline_in`/`timeline_out`.
- Retained captions with source/output intervals and segment association.
- Omitted words and explicit limits/warnings, including unknown hash/rights or no usable transcript.

Floating-point seconds are deliberately not emitted as the authoritative representation. Convert to the installed renderer's required format once at its boundary. Rational video FPS does not make the word timing itself accurate; ASR/manual evidence determines that.

## CLI usage and exit status

```bash
python3 resources/video-editing-evidence/tools/compile_edit.py \
  resources/video-editing-evidence/examples/talking-head.plan.json
```

- Exit `0`: syntactically and temporally valid within this narrow contract. Warnings still apply.
- Exit `2`: input/read/validation failure, with JSON on stderr and no compiled output on stdout. Argument parsing errors use argparse's normal help/error output.

To retain an output, use a **new job path** and your shell's no-clobber protection:

```bash
mkdir -p renders/my-new-job
( set -C; python3 resources/video-editing-evidence/tools/compile_edit.py \
  resources/video-editing-evidence/examples/talking-head.plan.json \
  > renders/my-new-job/compiled-edit.json )
```

A failed command can leave an empty redirected file; check the exit code before using it. For an automated adapter, capture stdout in memory, check success, then exclusively create the output file. Never redirect over the input plan or an existing repository file.

## Tests and remaining verification

Tests cover example mapping, exact fractional FPS, half-open edges, split-word rejection, adjacent clips, malformed ranges/types, duplicates, unsupported properties, missing data warnings, CLI success/failure, deterministic hashes and 100 seeded mapping scenarios. They do not establish media availability, transcript fidelity, good editorial judgment, renderer compatibility or final audiovisual quality.
