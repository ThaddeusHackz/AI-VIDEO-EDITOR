# The 27 probes — printable checklist

Each probe lists **what to look for** and **what it has actually caught** in this repo's scans.

## A. Identity & versioning

| # | Probe | Caught |
|---|---|---|
| 1 | Exact id strings, including namespaced model paths | `gpt-6.1-sol` vs legacy `gpt-6-sol`; `higgsfield/genjutsu/motion-transfer/v1.0` |
| 2 | Announce vs GA vs latest tag | Argon announced 09-30, GA 10-13; HyperFrames v0.8.164 on scan day |
| 3 | Release cadence | Remotion patch train 4.0.534 → 4.0.536 in 9 days (repo pins 534) |
| 4 | Deprecations & retired models | GPT-6 Sol superseded in 7 days; **Sora removed** from the Higgsfield MCP roster |
| 5 | Unreleased siblings | Sonnet 5.5 / Haiku 5.5 signalled but not shipped |

## B. Capability surface

| # | Probe | Caught |
|---|---|---|
| 6 | Modalities in **and** out, separately | Argon: video/audio in, **text out only**; Sol: text+image in, text out |
| 7 | Shared vs separate context budgets | Argon: input + thinking + output share **one** 1,048,576 window |
| 8 | Synchronous default vs maximum | Argon 65,536 default vs 1,048,576 with long decode |
| 9 | Reasoning controls **and their hard errors** | `thinking_level=MINIMAL` / `thinking_budget` → **HTTP 400** |
| 10 | Silently ignored parameters | Argon ignores temperature/top_p/top_k (no error raised) |
| 11 | Caching model | Argon: implicit only — no cache breakpoint pinning |
| 12 | Surface-only tools | Sol: tool calling requires the **Responses API**, not Chat Completions |

## C. Media limits

| # | Probe | Caught |
|---|---|---|
| 13 | Length ceilings with vs without audio | Argon ≈45 min with audio, ≈60 min silent |
| 14 | Files per prompt / references per generation | 10 videos per prompt; Cinema Studio 4.0 up to 50 references |
| 15 | MIME allowlist oddities | Argon accepts `video/x-flv`, `video/wmv`, `video/3gpp` |
| 16 | Output ladder and price scaling | Genjutsu 480p/720p/1080p at $0.159 → $0.816/s |

## D. Billing & access

| # | Probe | Caught |
|---|---|---|
| 17 | Price **per unit**, not per month | Cinema Studio $0.2057/s; Soul 2 $0.0032/image |
| 18 | Cache discounts and **rate cliffs** | Sol: 2× input/cache, 1.5× output above 272K input |
| 19 | Batch/flex discounts | Sol: Batch & Flex 50% off |
| 20 | **Footnotes that invert the headline** | Unlimited models/free generations exist **only** on higgsfield.ai — not MCP/CLI/Canvas/Supercomputer |
| 21 | Plan-gated throughput | Supercomputer: 10 / 3 / 1 parallel chats (Ultra / Plus / Starter) |
| 22 | Auth model per integration | API key ⇒ CLI; no key ⇒ MCP (both HeyGen and Higgsfield follow this rule) |

## E. Integration & agent surfaces

| # | Probe | Caught |
|---|---|---|
| 23 | Enumerate the tool list **after** auth | Higgsfield's MCP is 401-gated with **no published tool list**; the docs' own namespace contains a typo (`higgsfiled/`) |
| 24 | What a plugin can actually reach | The AE plugin touches compositions, layers, keyframes, effects and scripts — a different class from "exports a PNG" |
| 25 | Host support matrix | heygen-com/skills ships `.claude-plugin/`, `.codex-plugin/`, `.cursor-plugin/` and 4 install paths |

## F. Governance

| # | Probe | Caught |
|---|---|---|
| 26 | Consent/likeness/licence gates and the vendor's instruction about them | Katana: use a reference edit you own or have permission to use; 18+ requirement; biometric screening |
| 27 | Published safety telemetry | Sol: 28 severity-3+ flags across 49,650 matched Codex tasks (0.056%) vs 42 (GPT-6 Sol), 27 (Astra) |

## Scoring your scan

```text
A complete scan touches all 27 probes and labels every finding A–E.
A scan that reaches only 1–16 is a feature list, not a forensic scan.
Red flags that the scan is incomplete:
   - no billing footnotes found            (probes 18–20)
   - no failure modes listed               (probe 9–12)
   - every claim is vendor prose           (no D/E tier evidence)
   - no deprecations found                 (probe 4 rarely comes back empty on a mature tool)
```

## Output template

```markdown
## Verdict
## 1. Taxonomy (incl. rarely-listed surfaces)
## 2. Verified specs (tier-labelled)
## 3. Hidden surface
## 4. Integration recipes into this repo
## 5. Limits & failure modes
## 6. Ethics/consent
## 7. Source ledger (dated)
## 8. Deep dives (references/)
```
