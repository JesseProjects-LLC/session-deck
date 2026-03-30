# Session Deck — Launch Posting Plan

## Schedule Overview

| Day | Platform | Type | Restrictions |
|-----|----------|------|-------------|
| **Mon Mar 31 / Tue Apr 1** | LinkedIn | Personal post | None — post anytime |
| **Mon Mar 31 / Tue Apr 1** | X/Twitter | Thread | None — post anytime |
| **Mon Mar 31 / Tue Apr 1** | r/SideProject | Post | Self-promo welcome |
| **Mon Mar 31 / Tue Apr 1** | r/commandline | Post | Check flair requirements |
| **Wed Apr 2** | Hacker News (Show HN) | Link submission | Tue-Thu 9am-12pm ET best. **MUST be hand-written, NO LLM text.** |
| **Fri Apr 4** | r/selfhosted | Post | Self-promotion only on Fridays (if that rule exists — verify before posting) |
| **Fri Apr 4** | r/homelab | Post | Check rules day-of |
| **Following week** | r/linux | Post | Spread out from other posts |
| **Following week** | Awesome Selfhosted | GitHub PR | Submit PR to add to the list |
| **When ready** | Dev.to | Blog post | "How I built" style article |

---

## Platform-Specific Rules & Notes

### Hacker News (Show HN)
**⚠️ CRITICAL: Write the post BY HAND. Do not use any AI-generated text — not even for editing. The community actively flags LLM-sounding text and it will tank your post.**

Rules:
- Title format: `Show HN: Session Deck – Web-based tmux workspace manager`
- Link to the GitHub repo URL (not a blog post or landing page)
- Add a comment with your personal backstory — why you built it, what's different
- Use factual, direct language. No marketing speak. Talk like an engineer.
- Don't have friends/family boost with comments
- Best time: Tuesday-Thursday, 9am-12pm Eastern
- Be ready to engage with comments immediately for 2-3 hours after posting

Your backstory bullets (rewrite in YOUR voice):
- You manage tmux sessions across 6+ machines (LXCs, VMs, VPSs)
- Got tired of juggling SSH windows and terminal tabs
- WezTerm/kitty don't solve the multi-host problem
- Built this as a browser dashboard that attaches to real tmux sessions
- Each pane is a live terminal, not a simulation
- Stack: Node.js, Fastify, xterm.js, Svelte 5, SQLite
- Open source, MIT licensed

### Reddit — General Rules
- Be transparent: "I built this" / "my project"
- Don't post to multiple subreddits on the same day
- Engage with every comment
- No asking for upvotes
- AI disclosure: some subreddits require disclosure if AI was used in development. Be upfront that Claude was used as a development tool if asked.

### r/selfhosted (Friday)
- Likely has "Self-Promotion Saturday" or similar weekly thread — check sidebar day-of
- This is your BEST audience — homelab people who self-host everything
- Lead with the problem (managing tmux across multiple hosts)
- Include: GitHub link, screenshot, 3-4 key features, tech stack
- Mention: MIT licensed, single Node.js process, ~50MB RAM, systemd support
- Flair: probably needs [Project Share] or similar

### r/SideProject (Anytime)
- Self-promotion explicitly welcome
- 503K members, very active
- Shorter post OK — focus on what it does + screenshot + link

### r/commandline (Anytime)
- Terminal power users — they'll appreciate the tmux angle
- Lead with: "I use tmux on everything and SSH into multiple machines daily"
- Focus on the technical approach (xterm.js → node-pty → tmux attach)

### r/homelab (Friday, with r/selfhosted)
- Similar audience to r/selfhosted but more hardware-focused
- Shorter post, reference the r/selfhosted post if it got traction
- Mention your actual homelab setup (Proxmox, LXCs, VMs, QNAP)

### LinkedIn (Anytime)
- Professional tone, more about the journey
- "I just open-sourced Session Deck..."
- Mention the tech stack, the problem it solves
- Good place to mention AI-assisted development if you want
- Include hero screenshot + GitHub link

### X/Twitter (Anytime)
- Thread format: 3-4 tweets
- Tweet 1: What it is + hero screenshot/GIF
- Tweet 2: Why you built it
- Tweet 3: Tech stack + key features
- Tweet 4: GitHub link + call for feedback
- Tags: #selfhosted #homelab #tmux #opensource #webdev

---

## Post Drafts

### LinkedIn

> I just open-sourced Session Deck — a web-based tmux workspace manager I built to solve my own daily frustration.
>
> I manage tmux sessions across 6+ Linux machines (LXCs on Proxmox, Docker VMs, VPS hosts). Every day meant juggling SSH connections and terminal windows just to check on running processes. No existing tool let me see all my sessions in one place.
>
> Session Deck is a browser dashboard where each pane is a live terminal connected to a real tmux session. Drag-and-drop layouts, multi-host management, keyboard shortcuts, and a command palette. One browser tab replaces dozens of terminal windows.
>
> Built with Node.js, Svelte 5, xterm.js, and SQLite. Supports SSO via Microsoft Entra ID. MIT licensed.
>
> GitHub: https://github.com/JesseProjects-LLC/session-deck
>
> [attach hero screenshot]

### X/Twitter Thread

**Tweet 1:**
Just shipped Session Deck — a web-based tmux workspace manager 🖥️

Each pane is a LIVE terminal connected to a real tmux session. Multi-host, drag-and-drop layouts, keyboard shortcuts.

Self-hosted, open source, MIT.

[attach hero screenshot or workspace-switching GIF]

**Tweet 2:**
Why I built it:

I SSH into 6+ machines daily. Managing tmux sessions meant a mess of terminal windows.

Session Deck = one browser tab, all my sessions, organized into workspaces.

**Tweet 3:**
Stack: Node.js, Fastify, node-pty, xterm.js, Svelte 5, SQLite

~50MB memory. SSO via Entra ID. First-run wizard. Command palette (Ctrl+K). Process-aware theming.

**Tweet 4:**
→ github.com/JesseProjects-LLC/session-deck

Looking for feedback from other tmux users. What would make this useful for your workflow?

#selfhosted #homelab #tmux #opensource

### r/SideProject

**Title:** Session Deck — web-based tmux workspace manager with live terminal panes (open source)

**Body:**
I built Session Deck because I manage tmux sessions across 6+ Linux machines and got tired of juggling SSH windows.

It's a self-hosted web app where each pane is a live terminal connected to a real tmux session — not an emulation. You can type, see output, and manage sessions from any browser.

Key features:
- Split-tree workspace layouts with drag-to-resize and drag-to-rearrange
- Multi-host tmux management via SSH
- Host connectivity testing (detects if tmux is installed, shows install command)
- Command palette (Ctrl+K)
- SSO auth (Entra ID) + basic auth
- First-run setup wizard
- Accent color theming + per-process-type colors

Stack: Node.js, Fastify, node-pty, xterm.js, Svelte 5, SQLite. ~50MB RAM.

GitHub: https://github.com/JesseProjects-LLC/session-deck

MIT licensed. Feedback welcome!

[attach hero screenshot]

### r/commandline

**Title:** Session Deck — manage tmux sessions across multiple hosts from your browser

**Body:**
I use tmux on everything and SSH into multiple machines daily. Built a browser dashboard that attaches to your actual tmux sessions via xterm.js and node-pty.

Key distinction: these aren't web terminal emulators. They attach to real tmux sessions. Detach from the browser, come back later, session is still there.

Features: split-tree layouts, drag-and-drop rearrangement, multi-host via SSH, command palette, process-type detection (shows different colors for vim, htop, python, node, etc.)

GitHub: https://github.com/JesseProjects-LLC/session-deck

### r/selfhosted (Friday)

**Title:** Session Deck — a self-hosted web UI for managing tmux sessions across multiple hosts (open source)

**Body:**
I run tmux on a bunch of machines — LXCs on Proxmox, Docker VMs, VPS hosts, a QNAP NAS. Every day I was juggling SSH connections just to check on sessions. Wrote Session Deck to give myself a single browser dashboard.

What it does:
- Live terminal panes via xterm.js connected to real tmux sessions
- Split-tree workspace layouts — drag-to-resize, drag-to-rearrange
- Multi-host management — configure SSH hosts, test connectivity, detect tmux
- Session CRUD — create, rename, kill sessions from the browser
- Command palette (Ctrl+K) for quick access to everything
- SSO auth (Microsoft Entra ID / any OIDC provider) + basic auth + trusted network bypass
- First-run setup wizard imports your ~/.ssh/config

Stack: Node.js, Fastify, xterm.js, Svelte 5, SQLite. Single process, ~50MB RAM. Runs as a systemd service.

Install:
```
git clone https://github.com/JesseProjects-LLC/session-deck.git
cd session-deck && npm install && npm run build && npm start
```

MIT licensed. Roadmap on GitHub includes workspace templates, session recording, mobile view, and a plugin system.

Happy to answer questions. Feedback and feature requests welcome.

[attach hero-4x3 screenshot showing 12-pane layout]

### Hacker News (Show HN) — NOTES ONLY, YOU MUST REWRITE

**Title:** `Show HN: Session Deck – Web-based tmux workspace manager with live terminals`

**URL:** `https://github.com/JesseProjects-LLC/session-deck`

**Your follow-up comment (write this yourself, in your own words, covering these points):**
- What it is: browser dashboard, each pane is a live tmux session
- Why you built it: manage tmux across 6+ machines, tired of terminal window mess
- How it works technically: xterm.js + node-pty spawns `tmux attach`, WebSocket for I/O
- What's different from existing tools: not a web terminal emulator, attaches to REAL tmux sessions. tmux persistence means you can close the browser and come back.
- Stack: Node.js, Fastify, xterm.js, Svelte 5, SQLite
- Open source, MIT licensed
- What you'd like feedback on

---

## Calendar Events to Create

1. **Mon Mar 31 or Tue Apr 1, morning:** Post to LinkedIn, X/Twitter, r/SideProject, r/commandline
2. **Wed Apr 2, ~9am ET:** Post Show HN (hand-written!)
3. **Fri Apr 4, morning:** Post to r/selfhosted, r/homelab
4. **Week of Apr 7:** Post to r/linux, submit PR to awesome-selfhosted
