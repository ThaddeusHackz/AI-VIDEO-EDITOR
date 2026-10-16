---
name: forensic-scan-protocol
description: "The reusable methodology behind this repo's tool scans: how to enumerate EVERY capability and lesser-documented feature of an AI video/animation platform, model or GitHub org — evidence tiers, probe checklist, hidden-surface detection (auth-gated tools, billing footnotes, plan-gated parallelism), and how to publish the findings as a reproducible atlas."
---

# Forensic Scan Protocol — how to take a tool apart completely (`forensic-scan-protocol`)

> **Purpose.** The atlases in this repo (`gemini-4-argon-forensic-atlas`, `higgsfield-forensic-atlas`, `heygen-github-forensic-atlas`, `remotion-github-forensic-atlas`) were produced with this method. Use it on the next tool instead of starting from a blank page.
> **Definition of "forensic" here:** *the documented surface, plus the surface that only shows up under load* — auth-gated tool lists, footnotes that invert marketing claims, plan-gated limits, deprecations, and behaviours that contradict the headline.

---

## 1. Evidence tiers (label every claim)

| Tier | Meaning | Example from this repo's scans |
|---|---|---|
| **A — Primary spec** | Vendor API/docs page with fields and limits | Argon's capability matrix (`Max output 1,048,576 with long decode`) |
| **B — Vendor prose** | Vendor blog/announcement, no tables | Genjutsu's "Motion Transfer / Object Swap" description |
| **C — Vendor demo** | Video/demo with **no cost, timing or eval** | The Blender pagoda; the Pixel CAD exploded view |
| **D — Independent test** | A third party ran it and published numbers | Sol's Artificial Analysis indices; the $47 Plus verdict |
| **E — Practitioner report** | Forum/thread experience, unverified | Reddit notes on Genjutsu behaving like tracking+roto+inpainting |
| **X — Rejected** | Bypass instructions, unverifiable hearsay | See §6 |

**Rule:** every line in an atlas carries a tier. Never let a C-tier demo become an A-tier fact in the summary table.

## 2. The probe checklist (27 probes)

### Identity & versioning
1. Exact model/repo **id strings** (`gemini-4-argon`, `gpt-6.1-sol`, `claude-opus-5-5`, `higgsfield/genjutsu/motion-transfer/v1.0`).
2. Announce date vs GA date vs latest release tag.
3. Version cadence (e.g. HyperFrames ships **daily**; Remotion on a patch train **4.0.534 → 4.0.536** in 9 days).
4. Predecessor/successor lineage and **deprecations** (GPT-6 Sol superseded in 7 days; Sora removed from the Higgsfield MCP roster).
5. Sibling models in the same family not yet released (Sonnet 5.5 / Haiku 5.5).

### Capability surface
6. Modalities **in** and **out** separately (Argon: video in, text out only).
7. Token/context limits — and whether input and output **share** one window.
8. Max **single** output ("long decode up to 1M") vs synchronous default (65,536).
9. Reasoning controls and their **hard failure modes** (`thinking_level=MINIMAL` → HTTP 400).
10. Parameters that are **silently ignored** (temperature/top_p/top_k on Argon).
11. Caching model: implicit vs explicit (Argon: implicit only).
12. Tools available **only through one API surface** (Sol: tool calling requires Responses API).

### Media limits (the ones that kill projects)
13. Max video length **with** vs **without** audio (45 vs 60 min on Argon).
14. Files per prompt (10 on Argon; up to 50 references in Cinema Studio 4.0).
15. MIME allowlist — the surprise exclusions matter more than inclusions.
16. Output ladder and price scaling (Genjutsu 480p/720p/1080p; $0.159 → $0.816/s).

### Billing & access
17. Price per unit **and** the unit (per second, per image, per generation).
18. Cache discounts and **rate cliffs** (Sol: 2×/1.5× above 272K input).
19. Batch/flex discounts (50% off).
20. **Footnotes that invert the marketing** — e.g. "unlimited models are not available on MCP, CLI, Canvas or Supercomputer".
21. Plan-gated throughput (Supercomputer: 10/3/1 parallel chats by tier).
22. Whether an integration needs an **API key** (CLI path) or **OAuth** (MCP path), and the detection priority between them.

### Integration & agent surfaces
23. Enumerate `tools/list` **after** auth — never trust a documented tool name (the docs' own `higgsfiled/` typo proves why).
24. Plugin surfaces and what they can actually reach (AE plugin touching compositions/layers/keyframes/effects/scripts is a different class from "exports an image").
25. Host support matrix (Claude Code / Codex / Cursor / Kimi / portable).

### Governance
26. Consent, likeness, licensing and safety gates — and the vendor's own instruction about them (Katana: use an edit you own or have permission for).
27. Published safety telemetry where it exists (Sol: 28 severity-3+ flags across 49,650 Codex tasks).

## 3. Hidden-surface hunting (the actual skill)

Hidden features rarely hide in code; they hide in **structural asymmetry**:

| Hunt for | Because | Found this way |
|---|---|---|
| **Footnotes** on pricing pages | They reverse the headline | Unlimited plans not applying off-site |
| **401 responses** | Prove an endpoint exists but is gated | The Higgsfield MCP endpoint and its missing tool list |
| **Changelogs dated after the blog** | Ship date ≠ announcement date | 3D Jutsu, Explainer, Higgsfield Apps, AE-in-Supercomputer timeline |
| **Model lists with oddities** | Retired models, renamed fields, typos | Sora removal; the `higgsfiled/` namespace typo |
| **"New:" badges in nav menus** | Entire products absent from docs | Popcorn, Fashion Factory, Photodump Studio, Reference Extension |
| **Repository trees, not READMEs** | Ship-support truth | heygen-com/skills: four install paths, three plugin manifests, release-please |
| **Non-headline repos in an org** | The research/roadmap layer | TransVLM and TAVR (SIGGRAPH Asia 2026) |
| **"How do I choose" help pages** | Reveal the intended routing and the gaps | MCP vs CLI vs Canvas vs Supercomputer decision tables |
| **Order-of-magnitude promises without numbers** | Where the risk lives | The pagoda demo: no cost, timing or eval |

## 4. Testing a claim before you publish it

```text
DETERMINISM LOOP   run twice, compare outputs (EDL, frames, hashes)
COUNTER-EXAMPLE    feed the tool the case that should fail; see if it says so
CRITIC HONESTY     ask for a flaw list; a tool that never finds flaws is not inspecting
ROUND ACCOUNTING   require loop counts, not adjectives
BOUNDARY TEST      hit the documented ceiling (45 min / 10 files / 30 s) and record behaviour
COST REPLAY        reproduce the vendor's best case with real billing attached
```

## 5. Publishing anatomy (what every atlas in this repo contains)

```text
1. Verdict up front           one paragraph someone can act on
2. Map / taxonomy             the whole product tree, including rarely-listed surfaces
3. Verified spec table        tier-labelled
4. Hidden surface             footnotes, gates, deprecations, typos
5. Integration recipes        how it lands in THIS repo, with commands
6. Limits & failure modes     what breaks, and the counter-move
7. Ethics/consent where people are involved
8. Source ledger              dated, per-claim provenance
9. References/               deep dives: one file per major subsystem
```

## 6. Ethics line (non-negotiable, and it is part of the method)

- **Never publish bypass instructions** — not for identity/biometric filters, DRM, paywalls, or licensing gates. Document that a gate exists and stop there.
- **Never upload a public figure or an unconsented person** to a platform during research.
- **Respect reference-edit licensing** (Katana's own instruction) and record permissions.
- **Label vendor demos** as C-tier; do not launder marketing into fact.
- **Publish limits earlier than capabilities** — the limits are the useful part.

## 7. Reusable scan brief (paste into any agent)

```text
Run a forensic scan of <TOOL>. Deliver:
  1. verdict-up-front paragraph
  2. full taxonomy of surfaces, including ones absent from the marketing page
  3. verified spec table with an evidence tier per row (A/B/C/D/E)
  4. hidden surface: pricing footnotes, auth gates, plan limits, retired models, doc errors
  5. integration recipes into this repo with copy-paste commands
  6. limits and failure modes with counter-moves
  7. source ledger with dates
Constraints: no bypass instructions; label vendor demos as such; publish limits first.
```

## 8. References

[`references/probe-checklist.md`](references/probe-checklist.md) — the 27 probes as a printable checklist with what each one has caught historically.
