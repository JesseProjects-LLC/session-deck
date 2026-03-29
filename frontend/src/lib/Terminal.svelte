<script>
  import { onMount, onDestroy } from 'svelte';
  import { Terminal } from '@xterm/xterm';
  import { FitAddon } from '@xterm/addon-fit';
  import { WebLinksAddon } from '@xterm/addon-web-links';

  let { session = 'main', host = 'reliant', focused = false, zoomed = false, onSessionClick = null, onZoom = null } = $props();

  let containerEl;
  let term;
  let fitAddon;
  let ws;
  let reconnectTimer;
  let resizeTimer;
  let lastCols = 0;
  let lastRows = 0;
  let connected = $state(false);
  let connecting = $state(false);
  let error = $state(null);

  function typeClass(sessionName) {
    // This is a rough heuristic — proper type comes from the API
    if (sessionName.startsWith('gsd-')) return 'gsd';
    if (['main', 'homelab', 'onsite'].includes(sessionName)) return 'claude';
    return 'terminal';
  }

  function typeLabel(sessionName) {
    const tc = typeClass(sessionName);
    if (tc === 'claude') return 'AI';
    if (tc === 'gsd') return 'AUTO';
    return 'TERM';
  }

  function connect() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

    connecting = true;
    error = null;

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}/ws/terminal?session=${encodeURIComponent(session)}&host=${encodeURIComponent(host)}&cols=${term.cols}&rows=${term.rows}`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      connected = true;
      connecting = false;
      error = null;
      // Record initial dimensions to avoid spurious resize on first output
      lastCols = term.cols;
      lastRows = term.rows;
    };

    ws.onmessage = (event) => {
      term.write(event.data);
    };

    ws.onclose = (event) => {
      connected = false;
      connecting = false;
      if (event.code !== 1000) {
        // Abnormal close — attempt reconnect after 2s
        error = 'Disconnected';
        reconnectTimer = setTimeout(() => connect(), 2000);
      }
    };

    ws.onerror = () => {
      connected = false;
      connecting = false;
      error = 'Connection error';
    };
  }

  function disconnect() {
    clearTimeout(reconnectTimer);
    clearTimeout(resizeTimer);
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
    lastCols = cols;
    lastRows = rows;
    ws.send(JSON.stringify({ type: 'resize', cols, rows }));
  }

  onMount(() => {
    term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace",
      lineHeight: 1.2,
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

    term.open(containerEl);
    fitAddon.fit();

    // Terminal input → WebSocket
    term.onData((data) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    // Resize observer — debounced to prevent resize/redraw loops
    const resizeObserver = new ResizeObserver(() => {
      if (!fitAddon || containerEl.offsetWidth <= 0) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        fitAddon.fit();
        sendResize();
      }, 150);
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
</script>

<div class="term-pane" class:focused class:zoomed>
  <div class="pane-hdr">
    <span class="dot {typeClass(session)}"></span>
    {#if onSessionClick}
      <button class="sname clickable" onclick={(e) => { e.stopPropagation(); onSessionClick(); }} title="Click to change session">{session}</button>
    {:else}
      <span class="sname">{session}</span>
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
    <span class="tbadge {typeClass(session)}">{typeLabel(session)}</span>
    <div class="pane-actions">
      <button class="pane-act" title="Split horizontal">⊟</button>
      <button class="pane-act" title="Split vertical">⊞</button>
      <button class="pane-act" title="{zoomed ? 'Restore' : 'Zoom'}" onclick={(e) => { e.stopPropagation(); onZoom?.(); }}>{zoomed ? '⤡' : '⤢'}</button>
      <button class="pane-act" title="Close">✕</button>
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
  .term-pane.focused { border-color: #3d8bfd; }
  .term-pane.zoomed { border-color: #7fd962; }

  .pane-hdr {
    display: flex; align-items: center; gap: 6px;
    padding: 4px 10px;
    background: #151b23;
    border-bottom: 1px solid #161b22;
    font-size: 11px;
    flex-shrink: 0;
    font-family: 'DM Sans', sans-serif;
  }

  .dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .dot.claude { background: #3d8bfd; box-shadow: 0 0 6px #3d8bfd; }
  .dot.gsd { background: #c792ea; box-shadow: 0 0 6px #c792ea; }
  .dot.terminal { background: #6b7688; }

  .sname { color: #c5cdd9; font-weight: 500; font-family: 'JetBrains Mono', monospace; font-size: 11px; border: none; background: none; padding: 0; cursor: default; }
  .sname.clickable { cursor: pointer; border-bottom: 1px dashed #3d4450; }
  .sname.clickable:hover { color: #3d8bfd; border-bottom-color: #3d8bfd; }
  .hname { color: #3d4450; font-size: 10px; }
  .spacer { flex: 1; }

  .fbadge {
    font-size: 9px; padding: 1px 6px; border-radius: 3px;
    background: rgba(61,139,253,0.15); color: #3d8bfd;
    font-weight: 600; letter-spacing: 0.5px;
  }
  .conn-badge {
    font-size: 9px; padding: 1px 6px; border-radius: 3px; font-weight: 500;
  }
  .conn-badge.connected { background: rgba(127,217,98,0.1); color: #7fd962; }
  .conn-badge.connecting { background: rgba(255,180,84,0.1); color: #ffb454; }
  .conn-badge.error { background: rgba(240,113,120,0.1); color: #f07178; }

  .tbadge { font-size: 9px; padding: 1px 5px; border-radius: 3px; font-weight: 500; }
  .tbadge.claude { background: rgba(61,139,253,0.1); color: #3d8bfd; }
  .tbadge.gsd { background: rgba(199,146,234,0.1); color: #c792ea; }
  .tbadge.terminal { background: rgba(107,118,136,0.1); color: #6b7688; }

  .pane-actions { display: flex; gap: 3px; opacity: 0; transition: opacity 0.15s; }
  .term-pane:hover .pane-actions { opacity: 1; }
  .pane-act {
    width: 18px; height: 18px; border-radius: 3px; border: none;
    background: transparent; color: #3d4450; cursor: pointer;
    display: flex; align-items: center; justify-content: center; font-size: 11px;
  }
  .pane-act:hover { background: #1c2333; color: #c5cdd9; }

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
