<script>
  import { onMount, onDestroy } from 'svelte';
  import { Terminal } from '@xterm/xterm';
  import { FitAddon } from '@xterm/addon-fit';
  import { WebLinksAddon } from '@xterm/addon-web-links';
  import { ClipboardAddon } from '@xterm/addon-clipboard';
  import { Unicode11Addon } from '@xterm/addon-unicode11';

  let { session = 'main', host = 'reliant', focused = false, zoomed = false, sessionType = 'terminal', sessionTypeColor = '#6b7688', sessionTypeLabel = 'TERM', sessionContext = null, paneTitle = null, onSessionClick = null, onZoom = null, onSplit = null, onClose = null, onDragStart = null, onContextMenu = null } = $props();

  let containerEl;
  let term;
  let fitAddon;
  let ws;
  let reconnectTimer;
  let resizeTimer;
  let lastCols = 0;
  let lastRows = 0;
  let lastResizeTime = 0;
  let suppressResize = false;
  let suppressTimer;
  let prevSession = $state(session);
  let prevHost = $state(host);
  let connected = $state(false);
  let connecting = $state(false);
  let error = $state(null);

  function connect() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

    connecting = true;
    error = null;

    // Fetch a short-lived WS auth token, then connect
    fetch('/api/ws-token').then(r => r.json()).then(({ token }) => {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${proto}//${window.location.host}/ws/terminal?session=${encodeURIComponent(session)}&host=${encodeURIComponent(host)}&cols=${term.cols}&rows=${term.rows}&token=${encodeURIComponent(token)}`;

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        connected = true;
        connecting = false;
        error = null;
        lastCols = term.cols;
        lastRows = term.rows;
      };

      ws.onmessage = (event) => {
        suppressResize = true;
        term.write(event.data);
        clearTimeout(suppressTimer);
        suppressTimer = setTimeout(() => { suppressResize = false; }, 200);
      };

      ws.onclose = (event) => {
        connected = false;
        connecting = false;
        if (event.code !== 1000) {
          error = 'Disconnected';
          reconnectTimer = setTimeout(() => connect(), 2000);
        }
      };

      ws.onerror = () => {
        connected = false;
        connecting = false;
        error = 'Connection error';
      };
    }).catch(() => {
      connecting = false;
      error = 'Auth failed';
    });
  }

  function disconnect() {
    clearTimeout(reconnectTimer);
    clearTimeout(resizeTimer);
    clearTimeout(suppressTimer);
    if (ws) {
      ws.onclose = null; // Prevent reconnect on intentional close
      ws.close(1000, 'Client disconnect');
      ws = null;
    }
    connected = false;
    connecting = false;
  }

  function sendResize() {
    if (!ws || ws.readyState !== WebSocket.OPEN || !term) return;
    const cols = term.cols;
    const rows = term.rows;
    // Only send if dimensions actually changed
    if (cols === lastCols && rows === lastRows) return;
    // Rate limit: max 1 resize per second
    const now = Date.now();
    if (now - lastResizeTime < 1000) return;
    lastResizeTime = now;
    lastCols = cols;
    lastRows = rows;
    ws.send(JSON.stringify({ type: 'resize', cols, rows }));
  }

  onMount(() => {
    term = new Terminal({
      allowProposedApi: true,
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace",
      lineHeight: 1.2,
      rightClickSelectsWord: true,
      theme: {
        background: '#0b0e11',
        foreground: '#c5cdd9',
        cursor: '#7fd962',
        selectionBackground: 'rgba(61, 139, 253, 0.3)',
        black: '#0a0e14',
        red: '#f07178',
        green: '#7fd962',
        yellow: '#ffb454',
        blue: '#3d8bfd',
        magenta: '#c792ea',
        cyan: '#56d4dd',
        white: '#c5cdd9',
        brightBlack: '#3d4450',
        brightRed: '#f07178',
        brightGreen: '#7fd962',
        brightYellow: '#ffb454',
        brightBlue: '#3d8bfd',
        brightMagenta: '#c792ea',
        brightCyan: '#56d4dd',
        brightWhite: '#ffffff',
      },
    });

    fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());
    term.loadAddon(new ClipboardAddon());

    const unicode11 = new Unicode11Addon();
    term.loadAddon(unicode11);
    term.unicode.activeVersion = '11';

    term.open(containerEl);
    fitAddon.fit();

    // Clipboard handling
    term.attachCustomKeyEventHandler((ev) => {
      // Ctrl+C — copy if text is selected, otherwise send SIGINT to terminal
      if (ev.ctrlKey && !ev.shiftKey && ev.key === 'c' && ev.type === 'keydown') {
        if (term.hasSelection()) {
          navigator.clipboard.writeText(term.getSelection()).catch(() => {});
          term.clearSelection();
          return false; // prevent terminal from getting Ctrl+C
        }
        return true; // no selection — let SIGINT through
      }
      // Ctrl+V — paste from clipboard
      if (ev.ctrlKey && !ev.shiftKey && ev.key === 'v' && ev.type === 'keydown') {
        navigator.clipboard.readText().then(text => {
          if (text && ws && ws.readyState === WebSocket.OPEN) {
            ws.send('\x1b[200~' + text + '\x1b[201~');
          }
        }).catch(() => {});
        return false;
      }
      return true;
    });

    // Terminal input → WebSocket
    term.onData((data) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    // Resize observer — debounced + suppressed during output to prevent resize/redraw loops
    const resizeObserver = new ResizeObserver(() => {
      if (!fitAddon || !containerEl) return;
      // Skip if container is too small (causes oscillation) or output is streaming
      if (containerEl.offsetWidth < 80 || containerEl.offsetHeight < 40) return;
      if (suppressResize) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (suppressResize) return; // Re-check after debounce
        try {
          fitAddon.fit();
        } catch { return; }
        sendResize();
      }, 250);
    });
    resizeObserver.observe(containerEl);

    // Connect
    connect();

    return () => {
      resizeObserver.disconnect();
    };
  });

  onDestroy(() => {
    disconnect();
    if (term) {
      term.dispose();
    }
  });

  // Reconnect when session or host changes without remounting
  $effect(() => {
    if (term && (session !== prevSession || host !== prevHost)) {
      prevSession = session;
      prevHost = host;
      disconnect();
      term.clear();
      term.reset();
      connect();
    }
  });
</script>

<div class="term-pane" class:focused class:zoomed>
  <div
    class="pane-hdr"
    draggable="true"
    ondragstart={(e) => {
      e.dataTransfer.setData('text/plain', session);
      e.dataTransfer.effectAllowed = 'move';
      onDragStart?.(session, host);
    }}
    oncontextmenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onContextMenu?.(e);
    }}
  >    <span class="dot" style="background:{sessionTypeColor};box-shadow:0 0 6px {sessionTypeColor}"></span>
    {#if onSessionClick}
      <button class="sname clickable" onclick={(e) => { e.stopPropagation(); onSessionClick(); }} title="Click to change session">{paneTitle || session}</button>
    {:else}
      <span class="sname">{paneTitle || session}</span>
    {/if}
    {#if sessionContext && !paneTitle}
      <span class="ctx-name">{sessionContext}</span>
    {/if}
    <span class="hname">{host}</span>
    <span class="spacer"></span>
    {#if focused}
      <span class="fbadge">FOCUSED</span>
    {/if}
    {#if connecting}
      <span class="conn-badge connecting">CONNECTING</span>
    {:else if connected}
      <span class="conn-badge connected">LIVE</span>
    {:else if error}
      <span class="conn-badge error">{error}</span>
    {/if}
    <span class="tbadge" style="background:{sessionTypeColor}20;color:{sessionTypeColor}">{sessionTypeLabel}</span>
    <div class="pane-actions">
      <button class="pane-act split-btn" title="Split left | right" onclick={(e) => { e.stopPropagation(); onSplit?.('h'); }}>
        <span class="split-icon-h"></span>
      </button>
      <button class="pane-act split-btn" title="Split top / bottom" onclick={(e) => { e.stopPropagation(); onSplit?.('v'); }}>
        <span class="split-icon-v"></span>
      </button>
      <button class="pane-act zoom-btn" title="{zoomed ? 'Restore' : 'Zoom'}" onclick={(e) => { e.stopPropagation(); onZoom?.(); }}>
        <span class="zoom-icon" class:restore={zoomed}></span>
      </button>
      <button class="pane-act close-act" title="Close pane" onclick={(e) => { e.stopPropagation(); onClose?.(); }}>
        <span class="close-icon"></span>
      </button>
    </div>
  </div>
  <div class="term-container" bind:this={containerEl}></div>
</div>

<style>
  .term-pane {
    background: #0b0e11;
    border: 1px solid #161b22;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    width: 100%;
    height: 100%;
    transition: border-color 0.15s;
  }
  .term-pane:hover { border-color: #1e2530; }
  .term-pane.focused { border-color: var(--accent, #F97316); }
  .term-pane.zoomed { border-color: var(--success, #7fd962); }

  .pane-hdr {
    display: flex; align-items: center; gap: 6px;
    padding: 4px 10px;
    background: #151b23;
    border-bottom: 1px solid #161b22;
    font-size: 11px;
    flex-shrink: 0;
    font-family: 'DM Sans', sans-serif;
    cursor: grab;
  }
  .pane-hdr:active { cursor: grabbing; }

  .dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

  .sname { color: #c5cdd9; font-weight: 500; font-family: 'JetBrains Mono', monospace; font-size: 11px; border: none; background: none; padding: 0; cursor: default; }
  .sname.clickable { cursor: pointer; border-bottom: 1px dashed #3d4450; }
  .sname.clickable:hover { color: var(--accent, #F97316); border-bottom-color: var(--accent, #F97316); }
  .hname { color: #3d4450; font-size: 10px; }
  .ctx-name {
    color: #3d4450; font-size: 9px; font-family: 'JetBrains Mono', monospace;
    opacity: 0.7; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .spacer { flex: 1; }

  .fbadge {
    font-size: 9px; padding: 1px 6px; border-radius: 3px;
    background: var(--accent-bg-strong, rgba(249,115,22,0.15)); color: var(--accent, #F97316);
    font-weight: 600; letter-spacing: 0.5px;
  }
  .conn-badge {
    font-size: 9px; padding: 1px 6px; border-radius: 3px; font-weight: 500;
  }
  .conn-badge.connected { background: rgba(127,217,98,0.1); color: #7fd962; }
  .conn-badge.connecting { background: rgba(255,180,84,0.1); color: #ffb454; }
  .conn-badge.error { background: rgba(240,113,120,0.1); color: #f07178; }

  .tbadge { font-size: 9px; padding: 1px 5px; border-radius: 3px; font-weight: 500; }

  .pane-actions { display: flex; gap: 3px; opacity: 0; transition: opacity 0.15s; }
  .term-pane:hover .pane-actions { opacity: 1; }
  .pane-act {
    width: 18px; height: 18px; border-radius: 3px; border: none;
    background: transparent; color: #3d4450; cursor: pointer;
    display: flex; align-items: center; justify-content: center; font-size: 11px;
  }
  .pane-act:hover { background: #1c2333; color: #c5cdd9; }
  .pane-act.close-act:hover { background: rgba(240,113,120,0.15); color: #f07178; }

  /* Split icons — CSS boxes, no font dependency */
  .split-btn { padding: 2px; }
  .split-icon-h, .split-icon-v {
    display: flex; width: 14px; height: 10px;
    border: 1px solid currentColor; border-radius: 1px;
    overflow: hidden; gap: 2px; background: currentColor;
  }
  /* Horizontal split: left | right — vertical divider (gap = bright line) */
  .split-icon-h::before, .split-icon-h::after {
    content: ''; flex: 1; border-radius: 0;
  }
  .split-icon-h::before { background: #0b0e11; opacity: 0.6; }
  .split-icon-h::after { background: #0b0e11; opacity: 0.85; }
  /* Vertical split: top / bottom — horizontal divider (gap = bright line) */
  .split-icon-v { flex-direction: column; }
  .split-icon-v::before, .split-icon-v::after {
    content: ''; flex: 1; border-radius: 0;
  }
  .split-icon-v::before { background: #0b0e11; opacity: 0.6; }
  .split-icon-v::after { background: #0b0e11; opacity: 0.85; }

  /* Zoom icon — CSS expand arrows */
  .zoom-btn { padding: 2px; }
  .zoom-icon {
    display: block; width: 12px; height: 12px; position: relative;
    border: 1px solid currentColor; border-radius: 1px;
  }
  .zoom-icon::after {
    content: ''; position: absolute; top: 1px; right: 1px;
    width: 5px; height: 5px; border-top: 1.5px solid currentColor;
    border-right: 1.5px solid currentColor;
  }
  .zoom-icon.restore::after {
    top: auto; right: auto; bottom: 1px; left: 1px;
    border-top: none; border-right: none;
    border-bottom: 1.5px solid currentColor;
    border-left: 1.5px solid currentColor;
  }

  /* Close icon — CSS X */
  .close-icon {
    display: block; width: 10px; height: 10px; position: relative;
  }
  .close-icon::before, .close-icon::after {
    content: ''; position: absolute; top: 50%; left: 50%;
    width: 10px; height: 1.5px; background: currentColor;
  }
  .close-icon::before { transform: translate(-50%, -50%) rotate(45deg); }
  .close-icon::after { transform: translate(-50%, -50%) rotate(-45deg); }

  .term-container {
    flex: 1;
    padding: 4px;
    overflow: hidden;
  }

  /* xterm.js base styles */
  .term-container :global(.xterm) {
    height: 100%;
  }
  .term-container :global(.xterm-viewport) {
    overflow-y: auto !important;
  }
</style>
