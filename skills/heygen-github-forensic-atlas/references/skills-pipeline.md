# heygen-com/skills — the v3 Video Agent pipeline, deconstructed

★488 · 82 forks · created 2026-01-22 · topics: `agent-skills`, `ai-agent`, `avatar-video`, `claude-code`, `heygen`, `openclaw`, `skill`, `video`.

## 1. Repo layout (root, as enumerated)

```text
.app.json  .claude-plugin/  .clawhubignore  .codex-plugin/  .cursor-plugin/  .github/
.gitignore  .mcp.json  .release-please-manifest.json  CHANGELOG.md  CLAUDE.md  CODEOWNERS
CONTRIBUTING.md  INSTALL.md  INSTALL_FOR_AGENTS.md  LICENSE  README.md  VERSION
assets/  heygen-avatar/  heygen-translate/  heygen-video/  mcp.json  platforms/  setup/
```

Observations that matter:

- **Multi-agent host support is first-class:** `.claude-plugin/`, `.codex-plugin/`, `.cursor-plugin/` — the same skill bundle ships plugin manifests for three agent hosts. This repo mirrors that idea with `.claude/`, `.codex/`, `.cursor-plugin/` and `.agents/` directories.
- **Dual MCP descriptors:** both `.mcp.json` and `mcp.json`.
- **`release-please`** for versioned releases (`.release-please-manifest.json`, `release-please-config.json`) → the skill bundle is versioned like software, not like docs.
- **`platforms/nanoclaw`** — a host-specific integration folder.
- **`setup/`** — an executable onboarding path (not just prose).

## 2. The three skills

| Skill | Bundle | Job |
|---|---|---|
| `heygen-avatar` | `SKILL.md` + `references/` | Establish identity → build the avatar |
| `heygen-video` | `SKILL.md` + `references/` + `scripts/` | Generate the video and deliver a share link |
| `heygen-translate` | `SKILL.md` + `references/` | Localise the result |

The README's canonical one-shot prompt shows the intended UX:

```text
"Bring yourself to life — create your own avatar and make a 30-second intro video of yourself.
 Use heygen-avatar and heygen-video, ask me anything before you start."
→ reads your agent's identity files → asks only what's missing → builds the agent's avatar
→ picks the best style → generates the video → delivers the share link
```

**Design lesson worth copying:** the skill asks **only for what is missing**, reads identity files that already exist, and *ends with a deliverable plus a share link* — not with a file path.

## 3. Four install paths (choose by host)

| Path | Command | Hosts |
|---|---|---|
| `gh skill install` | `gh skill install heygen-com/skills heygen-avatar` | Claude Code, Cursor, Codex, Gemini CLI, Copilot, Junie, Goose, OpenHands, Amp, Cline, OpenCode, Warp (agentskills.io) |
| ClawHub | `clawhub install heygen-skills` | ClawHub hosts |
| OpenClaw plugin | `openclaw plugins install clawhub:@heygen/openclaw-plugin-heygen` | OpenClaw (bundles MCP) |
| Git clone | `git clone --single-branch --depth 1 …/skills.git <install-path>/heygen-skills` | Anything (auto-discovery at `heygen-avatar/SKILL.md` etc.) |

Legacy install paths documented: Claude Code `~/.claude/skills/heygen-skills`, OpenClaw `~/.openclaw/workspace/skills/heygen-skills`.

## 4. Transport detection (the credential rule)

```text
1. If HEYGEN_API_KEY is set        → use the CLI (single static binary)
2. Else if MCP tools are present   → use MCP (OAuth: https://mcp.heygen.com/mcp/v1/)
3. Else                            → ask the user for the missing piece
```

```bash
curl -fsSL https://static.heygen.ai/cli/install.sh | bash
export HEYGEN_API_KEY=<key>          # app.heygen.com/api → Settings → API
heygen --version && heygen auth status
```

MCP registration:

```bash
claude mcp add --transport http heygen https://mcp.heygen.com/mcp/v1/
```

```json
{ "mcp": { "servers": { "heygen": { "url": "https://mcp.heygen.com/mcp/v1/" } } } }
```

## 5. How to use this lane inside THE-AI-VIDEO-EDITOR

```text
Need                                 Use
─────────────────────────────────────────────────────────────────────────────
A presenter / spokesperson video      heygen-video (+ heygen-avatar first run)
A localised cut in another language  heygen-translate
A machine identity ("the agent")      heygen-avatar — build the face of the studio
Realtime/interactive presenter        LiveAvatar cluster (web-sdk / livekit starter)
Terminal / CI generation              heygen-cli
```

Fitting it into this repo's pipeline:

1. Generate the talking-head plate with the HeyGen lane.
2. Land it in the repo as a **plate**, not a finished piece: add lower-thirds (`nleTrackEngine.tsx`), captions (Drop/Rail/Embed), LUT grade and a `-16 LUFS` mix.
3. If the cut is driven by a HyperFrames composition, re-stamp seams and run the seam gate so the HeyGen plate cuts cleanly against CG.

## 6. Sources

`api.github.com/repos/heygen-com/skills` + `/readme` + contents enumeration (2026-10-16);
`heygen-com/skills` README install matrix; `heygen-com/heygen-cli` repo metadata.
