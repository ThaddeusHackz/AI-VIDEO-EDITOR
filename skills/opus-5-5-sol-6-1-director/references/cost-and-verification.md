# Cost & verification — running frontier models on a render budget

## 1. Price sheet (per 1M tokens, scan date 2026-10-16)

| Model | Input | Cached input | Cache write | Output |
|---|---|---|---|---|
| **GPT-6.1 Sol** | $2.00 | **$0.10** (−95%) | $2.50 | $10.00 |
| GPT-6 Sol | $2.00 | $0.20 | — | $10.00 |
| GPT-6 Astra | $10.00 | $1.00 | $12.50 | $50.00 |
| Claude Sonnet 5.5 | $2.00 | $0.20 | $2.50 | $10.00 |
| **Claude Opus 5.5** | $4.00 | $0.20 | $5.00 | $20.00 |
| Gemini 4 Argon (intro) | $2.00 | implicit only | — | $10.00 |

Sol modifiers: above **272K input tokens** → **2× input/cache, 1.5× output**; **Batch & Flex = 50% off**.

## 2. Cost of one agent turn (200K in / 20K out)

| Model | Cold | 90% cached |
|---|---|---|
| GPT-6.1 Sol | **$0.60** | **$0.26** |
| Claude Opus 5.5 | $1.20 | $0.52 |
| GPT-6 Astra | $3.00 | $1.38 |

**The 95% cache discount is the single biggest lever available to this repo.** A 50-turn iteration loop on Sol at 90% cache costs ~$13; the same loop cold costs ~$30 and on Astra ~$150.

## 3. Journal — cost per deliverable archetype (modelled)

| Deliverable | Cold path | Cached path | Notes |
|---|---|---|---|
| 15 s social cut (3 acts) | $6–8 | **$3–4** | Mostly mechanical; Sol @ low/medium |
| 30 s showreel, 5 acts, 2 QC rounds | $26 | **$13** | Hybrid director/writer split saves further |
| 60 s hero film with shader work | $48 | **$22–26** | Opus 5.5 on shader + critic only |
| 3 min explainer (captions + data) | $40 | **$18** | Long, cache-heavy, low effort |
| 4K master re-render after a note | **$0** | **$0** | Code re-render — the reason to author in-repo |
| Full engine refactor (7 modules) | $60 | **$25** | Sol @ high with a frozen prefix |

Compare: regenerating a 60-second film with a video model at ~$0.20/s costs **$12 per take** and is *not reproducible*. The model spend above buys the version that **is**.

## 4. The verification ladder (run in this order, always)

```bash
# 1. Type + lint gate
./bin/ai-video verify

# 2. Registry integrity (if registry/ touched)
node scripts/validate-registry.mjs

# 3. Seam gate (if any cut/seam changed)
node scripts/seam-gate.mjs verify \
  --ledger examples/ultrahigh-3d-vfx-showreel/ledger.json \
  --project examples/ultrahigh-3d-vfx-showreel

# 4. Composition inventory (must list all 10)
cd remotion && npx remotion compositions src/index.ts

# 5. Visual gate — 4-shot critic protocol
npx remotion still src/index.ts Cinematic3D-Showcase out/qc/01-wide.png  --frame=120
npx remotion still src/index.ts Cinematic3D-Showcase out/qc/02-close.png --frame=138
npx remotion still src/index.ts Cinematic3D-Showcase out/qc/03-low.png   --frame=150
npx remotion still src/index.ts Cinematic3D-Showcase out/qc/04-wire.png  --frame=120

# 6. Determinism gate — render 3 s twice, compare
npx remotion render src/index.ts Cinematic3D-Showcase out/det-a.mp4 --frames=0-89
npx remotion render src/index.ts Cinematic3D-Showcase out/det-b.mp4 --frames=0-89
shasum -a 256 out/det-a.mp4 out/det-b.mp4        # hashes must match

# 7. Scope gate
git diff --stat        # every file must be in the approved plan
```

### Pass conditions

| Gate | Pass |
|---|---|
| Type + lint | 0 errors / 0 warnings |
| Registry | validator exits 0 |
| Seam gate | 0 fail / 0 warn |
| Compositions | exactly the 10 registered comps |
| Visual | critic score ≥ 9 **and** ≥3 named flaws addressed |
| Determinism | identical SHA-256 |
| Scope | no file outside the plan |

## 5. When to spend on `max`/`high` effort

| Spend | Do not spend |
|---|---|
| A bug you cannot reproduce | Boilerplate composition scaffolding |
| Shader math that renders wrong only on some frames | Renaming props |
| Determinism failures | Adding a caption tier |
| A 5-act structure decision | Formatting/comment updates |
| Anything the critic cannot describe in words | Caption transcription |

## 6. Budget guardrails for agents (copy into the brief)

```text
BUDGET:      $X for this deliverable (report cumulative token cost every 10 turns)
ROUND CAP:   12 rounds per act; escalate only with a written reason
PREFIX:      frozen; <272K tokens (Sol rate cliff)
EVIDENCE:    raw gate output only, pasted verbatim
ESCALATION:  stop and ask if a gate fails twice for the same reason
```

## 7. The economics argument (for clients)

```text
Generative take        $0.15–$0.45 per second of output,  non-reproducible
Authored in-repo       $0 per re-render,                  deterministic, versionable
Model tokens (authoring) $13–$26 per 30-second showreel   one-time per version
─────────────────────────────────────────────────────────────────────────────
At 3 revisions, the authored path is already cheaper — and the 4th is free.
```
