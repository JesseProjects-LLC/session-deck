# Session Deck — Launch Posts

## Reddit r/selfhosted

**Title:** Session Deck — a web-based tmux workspace manager with live terminals (open source)

**Body:**

I manage tmux sessions across 6+ Linux machines (LXCs, VMs, VPSs) and got tired of juggling SSH windows. So I built Session Deck — a self-hosted web app that gives you a browser-based dashboard with live terminal panes connected to your actual tmux sessions.

**What it does:**

- Live terminal panes via xterm.js — these are real tmux sessions, not emulations
- Split-tree workspace layouts with drag-to-resize and drag-to-rearrange
- Multiple workspaces (switch with keyboard 1-9)
- Multi-host support — manage tmux on any SSH-accessible machine
- Host connectivity testing — detects if tmux is installed, suggests install command per OS
- Session management — create, rename, kill tmux sessions from the browser
- First-run setup wizard walks you through importing your SSH config
- Keyboard-first design with mouse support for everything

**Stack:** Node.js, Fastify, node-pty, xterm.js, Svelte 5, SQLite. Single process, ~50MB memory.

**Install:**

```
git clone https://github.com/JesseProjects-LLC/session-deck.git
cd session-deck
npm install && npm run build && npm start
```

Open `http://your-host:7890` and the setup wizard takes it from there.

MIT licensed. GitHub: https://github.com/JesseProjects-LLC/session-deck

Happy to answer questions about the architecture or take feature requests.

---

## Reddit r/homelab

**Title:** Built a web UI for managing tmux sessions across my homelab hosts

**Body:**

Quick share — I built an open-source tool called Session Deck that lets you manage tmux sessions across multiple hosts from your browser. Each pane is a live terminal connected to a real tmux session.

I run it on an LXC and access it from any device on my LAN. It auto-discovers hosts from your SSH config, tests connectivity, and detects whether tmux is installed on each host.

Workspaces let you arrange panes however you want — I have a "homelab" workspace with 6 panes monitoring different machines, and a "dev" workspace focused on my project terminals.

GitHub: https://github.com/JesseProjects-LLC/session-deck

Node.js, self-hosted, MIT licensed. ~50MB memory footprint.

---

## Reddit r/commandline

**Title:** Session Deck — manage tmux sessions across multiple hosts from your browser

**Body:**

I use tmux on everything and SSH into multiple machines daily. Built a browser-based dashboard that connects to real tmux sessions via xterm.js and node-pty.

Key thing: these aren't web terminal emulators pretending to be tmux. They attach to your actual tmux sessions. Detach from the browser, reattach later, your session is still there.

Features: split-tree layouts, drag-and-drop pane rearrangement, multiple workspaces, multi-host session management, keyboard shortcuts for everything.

GitHub: https://github.com/JesseProjects-LLC/session-deck

---

## Hacker News — Show HN

**Title:** Show HN: Session Deck – Web-based tmux workspace manager with live terminals

**Text:**

I manage tmux sessions across 6 Linux machines and wanted a single dashboard to see them all. Session Deck is a self-hosted web app where each pane is a live terminal attached to a real tmux session via node-pty.

Split-tree layouts, drag-and-drop, multi-host via SSH, keyboard-first. Node.js + Svelte 5 + xterm.js + SQLite. ~50MB RAM, single process.

GitHub: https://github.com/JesseProjects-LLC/session-deck

---

## X/Twitter Thread

**Post 1:**
Shipped Session Deck — a web-based tmux workspace manager. 🖥️

Each pane is a LIVE terminal connected to a real tmux session. Multi-host, drag-and-drop layouts, keyboard shortcuts.

Self-hosted, open source, MIT licensed.

→ github.com/JesseProjects-LLC/session-deck

**Post 2:**
Why I built it:

I SSH into 6+ machines daily. Managing tmux sessions across all of them meant a mess of terminal windows.

Session Deck gives me one browser tab with all my sessions organized into workspaces. Switch workspace = different set of terminals instantly.

**Post 3:**
Tech stack: Node.js, Fastify, node-pty, xterm.js, Svelte 5, SQLite

~50MB memory. Setup wizard walks you through importing SSH config + testing hosts.

These aren't web terminal emulators — they attach to your actual tmux sessions.

#selfhosted #homelab #tmux #opensource

---

## Tags/keywords to use across platforms
#selfhosted #homelab #tmux #terminal #opensource #linux #ssh #webui
