# inspect_timeline

The existing inspector MCP server exposes `inspect_timeline` beside `inspect_components`.
Both share one browser, page, source fingerprint and generation. This query does not seek,
render images or alter authored files. The original component tool and its time/seek semantics
are unchanged.

Inputs: optional `component` (`{selector}`, `{hfId}` or `{ref}`, identical target resolution),
and at most one of `at`, `range: [start,end]`, `boundary`. All times are **global seconds**.
Selectors must match exactly one element; ambiguity returns candidates. Omit component to
inspect all registered HF timelines. Omit time for observed schedule overview.
`at` uses start-inclusive/end-exclusive intervals; `range` uses half-open intersection and
preserves full event times. `boundary` separately labels `crosses`, `starts`, `ends`, and
zero-duration `instant`, with a 1e-7-second endpoint tolerance.

Results are short text grouped by component, containing event time, target, properties and
source locations. `generation` and `offset` provide 60-group continuation. Refs expire on source
changes/page disposal. Component inspection can retrieve complete source blocks from those refs.
Overlapping targets/properties are reported as facts, never diagnosed as errors.

HF's existing timing resolver handles explicit HF item windows. GSAP parent-chain intervals
expand repeat/yoyo/timeScale, including repeatDelay. Stagger/internal timeline intervals are expanded per target, so gaps are not reported as active. Root HF timelines
are normally paused and use the player's global clock. No extra host offset is added to the
auto-nested GSAP parent chain.

Coverage: only currently registered DOM-target GSAP animations and explicit HF items. Callbacks,
object tweens, unexecuted paths and non-GSAP animation systems are not inspected. Scheduled
activity does not imply visibility inside a scene. Infinite/>1000 repeats, zero-speed/paused
nested animations and expansion limits report incomplete coverage, not a guessed answer.

## CLI

Existing unfiltered `hyperframes timeline` stays unchanged. Runtime queries use the existing
service specified by `HF_INSPECT_URL` (must belong to the same project):

```
cd PROJECT
hyperframes timeline --component '#title' --boundary 7.9
hyperframes timeline --range 7,8
hyperframes timeline --component '{"hfId":"title-hf"}' --at 7.9
```

The CLI does not start a new browser. Start the existing inspector service once through the
harness or `bun packages/inspector/src/server.ts PROJECT`; use its returned local URL.
