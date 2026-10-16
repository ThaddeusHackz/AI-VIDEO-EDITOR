---
name: opus-5-5-sol-6-1-director
description: "Director doctrine for Claude Opus 5.5 (claude-opus-5-5) and GPT-6.1 Sol (gpt-6.1-sol) driving motion graphics, 3D animation, VFX/CGI and NLE work in this repo: verified specs, effort ladders for render tasks, context budgeting, subagent shape for a multi-act reel, verification loops, cost math per deliverable, and the division of labour with Gemini 4 Argon for footage."
---

# Opus 5.5 + GPT-6.1 Sol — Director Doctrine for Motion Graphics (`opus-5-5-sol-6-1-director`)

> **Scan date:** 2026-10-16 · **Opus 5.5:** released **2026-09-22** · **GPT-6.1 Sol:** released **2026-09-29** (DevDay)
> **Rule of this skill:** the model writes **code and plans**; the repo renders. Neither model sees video — route footage understanding to Gemini 4 Argon. See §6.

---

## 1. Spec sheets (verified)

### Claude Opus 5.5

| Spec | Value |
|---|---|
| API id | **`claude-opus-5-5`** (Bedrock: `global.anthropic.claude-opus-5-5`) |
| Context | **1,000,000 tokens** |
| Max output | **128,000** synchronous · up to **300,000** via the Message Batches API (beta config) |
| Thinking | **Adaptive thinking is always on** — you control *depth* with the **`effort`** parameter, not with thinking budgets |
| Speed/cost | **~40% cheaper** than Opus 5 on typical workloads; **>30% faster** output; fewer tokens per task; cheaper cache reads |
| Position | Leads Opus-tier agentic coding, computer use and knowledge work; performs "at the level of Claude Fable 5.1 on most work" while costing less |
| Availability | Claude Pro / Max / Team / Enterprise; Claude Code; Amazon Bedrock + Claude Platform on AWS; **Higgsfield Supercomputer & Higgsfield MCP** (added 2026-09-23) |
| Family | Sonnet 5.5 and Haiku 5.5 expected to follow |

Vendor benchmarks (same table as Opus 5, Fable 5.1, GPT-6 Astra, GPT-5.6 Sol):

| Benchmark | Opus 5.5 | Fable 5.1 | Opus 5 | GPT-6 Astra | GPT-5.6 Sol |
|---|---|---|---|---|---|
| Terminal-Bench 4.0 | **66.4%** | 55.8% | 52.3% | 57.9% | 37.3% |
| FrontierCode v1.1 (Main) | **54.4%** | 50.3% | 48.0% | 53.3% | 47.5% |
| CursorBench 4.0 | **57.8%** | 51.8% | 46.6% | — | 41.7% |

Customer-reported behaviours that matter for long render jobs: **plans deliberately, coordinates subagents, uses memory across sessions, runs self-verification loops, checks its own work in creative ways, follows instructions precisely, stays in scope, explains changes in plain language.**
One anecdote worth internalising: a tester **audited and repaired a 200,000-line codebase in under three hours** (Opus 5 reportedly needed >20 hours and 2.5× the tokens), and another completed a **680,000-line migration in under a day**.

### GPT-6.1 Sol

| Spec | Value |
|---|---|
| API id | **`gpt-6.1-sol`** |
| Context | **1,050,000 tokens** (up to **922,000 input**) |
| Max output | **128,000** |
| Knowledge cutoff | **2026-04-30** |
| Reasoning | `reasoning.effort` = **low / medium (default) / high / xhigh / max** — `none` and `minimal` are **not supported** (requests migrate to `low`) |
| Modalities | **Text + image in, text out** — no audio, no video input |
| Pricing | **$2.00 / 1M in · $0.10 cached in (95% off) · $2.50 cache write · $10 / 1M out.** Above 272K input tokens: **2× input/cache, 1.5× output**; Batch and Flex are **50% off** |
| Tools (Responses API) | web search, file search, code interpreter, **hosted shell**, **apply_patch**, **computer use**, **MCP** — tool calling requires the **Responses API** (Chat Completions works, without tools) |
| Not supported | Fine-tuning; not in consumer ChatGPT Chat or free tiers |
| Availability | API, ChatGPT Work + Codex (**default model in Codex CLI 0.159.1 on launch day**), GitHub Copilot (Pro+/Max/Business/Enterprise), OpenRouter; **Higgsfield Supercomputer** (select manually — it defaults to "Orchestrator") |
| Safety telemetry | Across **49,650** matched Codex tasks: **28 severity-3+ misalignment flags (0.056%)** vs 42 for GPT-6 Sol, 27 for Astra |

Vendor vs independent numbers (both matter):

| Metric | OpenAI's claim | Independent read (Artificial Analysis, early Oct 2026) |
|---|---|---|
| DeepSWE v1.1 | **75.2%** at *high* effort, vs GPT-6 Sol's 68.8% at *max* — at ~76% lower cost per task | — |
| Intelligence Index | "near-Astra" | **52** at max effort vs Astra **53** |
| Coding Agent Index | 2.2 pts above Opus 5.5 on AutomationBench at medium effort at ~⅓ cost | 2 points **below Astra**, 3 above GPT-6 Sol; Opus 5.5 tops the index at **58** |
| Cost of a full index run | — | **$0.72** at max effort vs $3.26 (Astra) · $1.05 (GPT-6 Sol) · **$5.98 (Opus 5.5)** |
| Terminal-Bench Science 0.1 | more than doubles Sol at max effort | **$5.47**/task vs $23.21 (Opus 5.5), $23.80 (Astra) |
| Factuality | errors at low effort **11.4% → 7.7%** (~32% fewer) | within 1.9 points of Astra at every effort level |
| OSWorld 2.0 (computer use, offline) | +7 pts over Sol at max effort; within 2.1 pts of Astra at ~1/7 the cost | — |

**Also note:** GPT-6.1 **Astra** was scrapped before release over internal safety findings (per WSJ reporting); GPT-6 Sol survived in the API as `gpt-6-sol` but was superseded in 7 days. Do not build on `gpt-6-sol`.

---

## 2. Routing table: which model does which motion-graphics job

| Job | First choice | Why | Runner-up |
|---|---|---|---|
| Whole-showreel authoring (multi-act, multi-file) | **Opus 5.5** | Long-horizon self-verification, subagent delegation, stays in scope | GPT-6.1 Sol (cheaper per task) |
| GLSL / shader authoring with numeric self-checks | **Opus 5.5** | Strongest at "check its own work in creative ways" | Sol at `high` |
| Bulk mechanical refactors across the engine (`cameraRig`, `vfxShaders`, 7 modules) | **GPT-6.1 Sol at `medium`** | Cached-prefix economics (95% off) make 50-turn loops cheap | Sol at `low` |
| CI-grade patch generation with a failing test suite (`apply_patch`, hosted shell) | **GPT-6.1 Sol** | Native `apply_patch` + hosted shell + MCP | Opus 5.5 |
| Composition scaffolding from a template/registry item | **GPT-6.1 Sol at `low`** | Mechanical, high volume, cache-heavy | — |
| Debugging a render that "looks right in Studio, wrong in render" | **Opus 5.5 at high effort** | Root-cause-first behaviour | Sol at `xhigh` |
| Long-form editorial reasoning about *intent* | **Opus 5.5** | Deliberate planning, plain-language explanation | — |
| **Understanding footage (video in)** | **Neither** → **Gemini 4 Argon** | Both are text(+image)-in; Argon ingests video with audio | — |
| Realtime/interactive presenter logic | HeyGen LiveAvatar lane | See the HeyGen atlas | — |

---

## 3. Effort ladders (stop guessing)

### Claude Opus 5.5 — `effort`

| Deliverable stage | Effort | Rationale |
|---|---|---|
| Scaffolding compositions from an approved shot list | low | Deterministic, mechanical |
| Writing engine modules, wiring props/schemas | medium | Quality/price knee |
| Shader authoring, camera-choreography math, physics | high | Errors here are expensive to discover at render time |
| Debugging a nondeterministic render | highest available | Root-cause work pays for itself |

Adaptive thinking is **always on** — never try to disable reasoning; spend the `effort` knob instead.

### GPT-6.1 Sol — `reasoning.effort`

| Deliverable stage | Effort | Rationale |
|---|---|---|
| Bulk edits, caption/EDL parsing, mechanical renames | **low** | Cheapest; factuality at low effort is already 7.7% error vs Sol's 11.4% |
| Standard composition authoring, refactors | **medium** (default) | Where AutomationBench claims sit |
| Complex refactors across the engine, multi-file features | **high** | 75.2% DeepSWE figure is the high-effort number |
| Hard geometry/math/interop bugs | **xhigh / max** | Reserve for the genuinely hard 5% |

**Cost mechanic to exploit:** the 95% cached-input discount means the winning pattern is a **stable prefix** (system + doctrine + engine file listing) followed by small variable tails. Cost of a 200K-in / 20K-out turn: **≈$0.60**, or **≈$0.26** with 90% of input cached — versus $1.20 / $0.52 on Opus 5.5 and $3.00 / $1.38 on Astra. Above 272K input, rates rise (2× input/cache, 1.5× output) — so **keep the working prefix under the 272K cliff** where you can.

---

## 4. Context budgeting for a 1M-token window (both models)

A 1M window is not a licence to paste a repo. Proven allocation for an AIVE render job:

```text
  0 –  15K   system + house doctrine (motion-doctrine, seam-craft, this skill)
 15 –  45K   engine module sources actually in play (cameraRig, vfxShaders, …)
 45 –  80K   current composition + its props schema + registry block(s) used
 80 – 120K   render/QC evidence: seam-gate output, lint output, 4-shot critic notes
120 – 200K   reference material (EDL, transcript, brand constraints, REA ledger)
─────────────────────────────────────────────────────────────────────────────
   ≤250K   WORKING SET     ← stay under 272K for Sol; keep cache prefix frozen here
250K – 1M    archival/rarely-touched (paste last, expect degradation)
```

Rules:
1. **Freeze the prefix.** Anything static goes first so it caches. Never re-order the prefix between turns.
2. **Evidence over prose.** Paste `seam-gate` and `lint` output verbatim; it is cheaper and more actionable than a description of it.
3. **Budget degradation is real.** Both vendors warn that long sessions degrade as the window fills; a 1M window buys longer *useful* sessions, not infinite ones. Compact at every act boundary.
4. **Sol specifically:** keep the live prompt under 272K to avoid the 2×/1.5× rate step. Opus 5.5 has no equivalent published cliff — but do not confuse that with a licence to bloat.

---

## 5. The subagent shape for a multi-act reel

Both models delegate well (Opus 5.5 is explicitly credited for "coordinates subagents"; GPT-6.1 Sol's agentic toolset includes MCP + hosted shell + apply_patch). Use the same shape for either:

```text
DIRECTOR (Opus 5.5 @ high, or Sol @ xhigh)
│   owns: shot list, ledger.json, seam budget, final gate
├── WRITER-ACT{n}   (Sol @ medium, cached prefix)  → composition code per act
├── SHADER-SMITH    (Opus 5.5 @ high)              → GLSL / particle / godray passes
├── TYPE-SMITH      (Sol @ low)                    → kinetic type, captions, lower-thirds
├── QC-CRITIC       (Opus 5.5 @ high)              → 4-shot protocol, adversarial flaw list
└── GATE-RUNNER     (Sol @ low, tools only)        → seam-gate / lint / typecheck, paste raw output
```

Rules that keep this cheap and correct:

- **One act per subagent**, each with the *same frozen prefix* → cache hits across all of them.
- The **critic must not be the writer**. Separate sessions or separate models.
- **Gate-runner runs tools, never prose.** Raw CLI output goes back to the director untouched.
- The **director never edits files directly**; it approves diffs.
- Cap rounds: **12** for a normal act, documented escalation for hero environments (see the Gemini critic protocol).

---

## 6. The hard limitation that shapes everything

> **Neither Opus 5.5 nor GPT-6.1 Sol accepts video input.** Sol is text + image in, text out. Opus 5.5 is multimodal but documented for text/image work — no video-ingest contract.

Consequences for this repo's pipeline:

```text
FOOTAGE (video/audio)  →  Gemini 4 Argon  →  EDL, beats, palette, take flags, critique
                                              │
                                              ▼
                              Opus 5.5 / GPT-6.1 Sol  →  code, plans, patches
                                              │
                                              ▼
                              HyperFrames / Remotion  →  deterministic render
                                              │
                                              ▼
                              seam-gate + 4-shot critic  →  delivery
```

- Do **not** ask Sol or Opus 5.5 to "watch the cut". Give them the **Argon EDL**, the **REA ledger**, and a **contact-sheet image** (images *are* accepted) if you need a visual reference.
- Contact sheets are the bridge: turn footage into a single 3×4 grid image → that *is* valid image input for both models.

---

## 7. Verification loops (the discipline that makes long agent runs safe)

Borrow Opus 5.5's own reported behaviour and make it mandatory in this repo:

| Loop | What runs | Pass condition |
|---|---|---|
| Type gate | `./bin/ai-video verify` (tsc + lint) | 0 errors / 0 warnings |
| Seam gate | `node scripts/seam-gate.mjs verify --ledger … --project …` | 0 fail / 0 warn |
| Visual gate | 4-shot QC stills + adversarial critic | score ≥ 9, ≥3 named flaws fixed |
| Determinism gate | render the same 3 s twice, compare hashes | identical output |
| Scope gate | `git diff --stat` reviewed against the brief | no out-of-scope files touched |

A run that cannot pass these is not "almost done" — it is unverified. Both models respond well to being told the gates explicitly and asked to **report raw output**, not summaries.

---

## 8. Cost planning: one 30-second showreel

```text
Assumption: 5 acts, 6 s each, 1080p, ~2 QC rounds per act.

GPT-6.1 Sol path (cached prefix, medium effort)
  50 turns × (200K in, 20K out) at 90% cache
    = 50 × $0.26                                    ≈ $13.00
  + batch 5% over-cliff turns (2× input)            ≈  $2   (avoidable — keep prefix <272K)

Claude Opus 5.5 path (high effort, fewer turns)
  18 turns × (250K in, 25K out)
    = 18 × (250K×$4/1M + 25K×$20/1M) = 18 × ($1.00 + $0.50)  ≈ $27.00
  (fewer turns because it self-verifies and needs fewer retries)

Hybrid (recommended): director + shader + critic on Opus 5.5, writers/gate-runners on Sol
    ≈ $18–22  and the strongest quality profile available
```

Add the generation-side costs separately (Higgsfield / Argon / TTS / Lyria). **The render itself is free** — that is the entire economic argument for authoring in Remotion/HyperFrames instead of re-generating clips.

---

## 9. Prompt patterns that work on both

```text
PLAN-FIRST
  "Give me the shot list, the seam budget and the file list. Do not write code until I approve."

EVIDENCE-LAST
  "Here is the raw seam-gate output and the four QC stills. Fix only what it flags."

PATCH DISCIPLINE (Sol)
  "Use apply_patch. One hunk per flaw. Do not reformat untouched code."

SELF-VERIFY (Opus 5.5)
  "Before you answer, run your own check: list the three most likely failure modes of this
   camera rig at frame 120 and confirm or refute each from the code you just wrote."

SCOPE GUARD
  "Do not modify anything outside the files listed in the approved plan."

RAW OUTPUT
  "Do not summarise tool output. Paste it."
```

## 10. Divergences to expect (so you are not surprised)

| Observation | Source | Practical read |
|---|---|---|
| Opus 5.5 tops the Coding Agent Index at 58; Sol sits **below** Astra | Independent (Oct 2026) | For the hardest single task, prefer Opus 5.5 |
| Sol costs **$0.72** per full index run vs **$5.98** for Opus 5.5 | Independent | For volume/iteration, prefer Sol |
| OpenAI reports Sol **above** Opus 5.5 on AutomationBench at medium effort | Vendor | Vendor harnesses differ — measure on *your* tasks |
| Google reports Argon **above both** on DeepSWE (77.9% vs 74.2% Opus 5.5 / 74.1% Astra) | Third vendor | For code *plus* footage reasoning, Argon is the one to test first |
| Astra was scrapped pre-release on safety findings | Press (WSJ) | Do not architect around Astra |

**The honest summary:** these three frontier systems are within a few points of each other on most work, and the *harness* you put around them (doctrine, gates, budgets) now matters more than the model choice. This repo's job is to be that harness.

---

## 11. Source ledger

`anthropic.com/claude-opus-5-5` (2026-09-22) · `anthropic.com/claude/opus` · `aws.amazon.com/blogs/machine-learning/claude-opus-5-5-is-now-available-on-aws/` (2026-09-24) · `venturebeat.com` Opus 5.5 release coverage (2026-09-22) ·
`x.com/OpenAIDevs` GPT-6.1 Sol launch thread (2026-09-29) · `developersdigest.tech/blog/gpt-6-1-sol-release-guide-2026` (2026-09-29) · `aq.dev/guides/gpt-6-1-sol-for-coding-agents/` (2026-10-01) · `github.blog/changelog/2026-09-29-gpt-6-1-sol-in-github-copilot/` · `help.openai.com` release notes (2026-10-09) · `creatorstoolbox.com` Higgsfield news (Opus 5.5 → Supercomputer 2026-09-23; GPT-6.1 Sol → Supercomputer 2026-09-29).

Deep dives: [`references/model-specs.md`](references/model-specs.md) · [`references/motion-graphics-routing.md`](references/motion-graphics-routing.md) · [`references/cost-and-verification.md`](references/cost-and-verification.md)
