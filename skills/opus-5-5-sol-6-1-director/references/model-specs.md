# Model spec appendix — Opus 5.5 · GPT-6.1 Sol (and the surrounding field)

Verbatim spec tables, scan date **2026-10-16**. Everything here is a copy of a published source; interpretations live in the parent skill.

## 1. Claude Opus 5.5

```text
Release date       2026-09-22
API model id       claude-opus-5-5
Bedrock id         global.anthropic.claude-opus-5-5
Context window     1,000,000 tokens
Max output         128,000 synchronous
                   300,000 via Message Batches API (beta configuration)
Reasoning          Adaptive thinking ALWAYS ON
                   depth controlled by the `effort` parameter
                   (thinking-budget switches no longer apply)
Output speed       >30% faster than Opus 5
Cost               ~40% cheaper than Opus 5 on typical workloads
                   (fewer tokens per task + lower per-token price + cheaper cache reads)
Cache              Cache reads materially cheaper than Opus 5
Security           action classifier screens every action before it runs
                   open-source sandbox that security teams can audit
                   code review that catches vulnerabilities before merge
Family             Sonnet 5.5 and Haiku 5.5 expected
Predecessors       Opus 5 (2026-07-24), Claude Fable 5.1, Claude Mythos 5.1
```

Benchmarks (vendor table):

| Benchmark | Opus 5.5 | Fable 5.1 | Opus 5 | GPT-6 Astra | GPT-5.6 Sol |
|---|---|---|---|---|---|
| Terminal-Bench 4.0 | 66.4% | 55.8% | 52.3% | 57.9% | 37.3% |
| FrontierCode v1.1 (Main) | 54.4% | 50.3% | 48.0% | 53.3% | 47.5% |
| CursorBench 4.0 | 57.8% | 51.8% | 46.6% | — | 41.7% |

Reported behaviour (vendor customer quotes + testing):
- "matches Opus 5's quality in about half the turns, time and output tokens" → 40–50% workload cost cut
- "solved more terminal tasks than Opus 5 in fewer than half the steps" (VS Code)
- "used among the fewest tokens and steps we measured" (GitHub Copilot CLI + VS Code)
- "delegates to subagents far more effectively and checks its own work in creative ways. Self-verification loops feel easier to set up."
- Root-cause-first: "finds the root cause before changing anything, checks its work as it goes, explains changes in plain language"
- 680,000-line migration completed in under a day (tester); 200,000-line audit + repair in under 3 hours (tester)

Availability: Claude Pro/Max/Team/Enterprise · Claude Code · Amazon Bedrock · Claude Platform on AWS · **Higgsfield Supercomputer + Higgsfield MCP (2026-09-23)**.

## 2. GPT-6.1 Sol

```text
Release date       2026-09-29 (DevDay 2026)
API model id       gpt-6.1-sol
Context window     1,050,000 tokens (up to 922,000 usable as input)
Max output         128,000 tokens
Knowledge cutoff   2026-04-30
Modalities         text + image input  →  text output
Reasoning effort   low · medium (default) · high · xhigh · max
                   none and minimal NOT supported (requests migrate to low)
Sampling           when reasoning is enabled, remove temperature/top_p
Tools              web search · file search · code interpreter · hosted shell ·
                   apply_patch · computer use · MCP  (via the Responses API)
                   Chat Completions supported WITHOUT tool calling
Fine-tuning        not supported
Pricing            $2.00 in · $0.10 cached in (95% discount) · $2.50 cache write · $10.00 out
                   above 272K input tokens: 2x input/cache, 1.5x output
                   Batch and Flex: 50% off
Availability       API · ChatGPT Work · Codex (default in CLI 0.159.1) ·
                   GitHub Copilot (Pro+/Max/Business/Enterprise) · OpenRouter
                   NOT in consumer ChatGPT Chat or free tiers
Predecessor        GPT-6 Sol (2026-09-22) — superseded in 7 days; id still answers as gpt-6-sol
Scrapped sibling   GPT-6.1 Astra — cancelled before release over internal safety findings
```

Vendor benchmarks / claims:

| Evaluation | OpenAI reports |
|---|---|
| DeepSWE v1.1 (long-horizon SWE) | 75.2% at **high** effort (vs Sol's best 68.8% at **max**) at ~76% lower cost per task |
| GDP.pdf (professional documents) | Above Opus 5.5 with fallbacks at under half the cost; approaches Astra at ~1/5 cost |
| AutomationBench 1.0.6 (47-tool workflows) | 31.7% at medium effort — 2.2 pts above Opus 5.5 at ~1/3 cost; 4.8 pts above Sol |
| OSWorld 2.0 offline (computer use) | +7 pts over Sol at max effort; within 2.1 pts of Astra at ~1/7 cost |
| Terminal-Bench Science 0.1 | >2× Sol at max effort; **$5.47/task** vs $23.21 (Opus 5.5) and $23.80 (Astra) |
| Factuality (error-flagged prompts) | errors at low effort **11.4% → 7.7%** (−32%); within 1.9 pts of Astra at every level |
| Internal agent simulation | 49,650 matched Codex tasks → **28** severity-3+ flags (0.056%) vs 42 (Sol), 27 (Astra) |

Independent read (Artificial Analysis, early Oct 2026): Intelligence Index **52** at max effort vs Astra 53; Coding Agent Index **2 below Astra**, 3 above GPT-6 Sol; cost of a full index run **$0.72** at max effort vs $3.26 Astra · $1.05 GPT-6 Sol · **$5.98 Opus 5.5** (which tops that index at 58).

Reliability behaviours OpenAI calls out: more upfront about limitations, **better at flagging broken tools** (a stuck search tool is reported rather than worked around), and more reliable at **honouring explicit restrictions** during a task.

## 3. The wider field as of the scan date

| Model | Vendor | Notes relevant here |
|---|---|---|
| **Gemini 4 Argon** | Google | 1,048,576 unified ctx, 1M output via long decode, **video+audio input**, LVBench 91.7%, DeepSWE 77.9% — the only one of the three that ingests footage (`gemini-4-argon-forensic-atlas`) |
| **GPT-6 Astra** | OpenAI | $10/$50 tier, still the science leader (Terminal-Bench Science 68.1%); **scrapped/held** in 6.1 form |
| **Claude Fable 5.1** | Anthropic | Opus 5.5 performs "at the level of Fable 5.1 on most work" for less |
| **Claude Sonnet 5.5 / Haiku 5.5** | Anthropic | Announced as next in the 5.5 family; Sonnet 5.5 already at $2/$10 |
| **GPT-6 Luna** | OpenAI | Free/Go tier; also powers the Decisions API |
| **Gemini 3.8 TTS · Lyria 3.5 · Gemini Omni Flash · Nano Banana (Pro)** | Google | The audio/image siblings that Argon orchestrates |
| **Seedance 2.5 · Kling 3.0 · Wan 3.0 · Veo · Soul 2.0** | various | Generation lanes behind Higgsfield (see the Higgsfield atlas) |

## 4. Model-selection cheat line

```text
Footage in?                     → Gemini 4 Argon
Hardest single engineering task → Claude Opus 5.5
Highest volume / best $ per task→ GPT-6.1 Sol (medium, cached prefix)
Long document / PDF workflows   → GPT-6.1 Sol (or Opus 5.5 for prose quality)
Computer-use / browser drive    → both support it (Sol has OSWorld numbers; Argon has preview computer use)
Realtime avatar presenter        → HeyGen LiveAvatar
```
