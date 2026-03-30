<script>
  import { onMount, onDestroy } from 'svelte';
  import SplitPane from './lib/SplitPane.svelte';
  import Terminal from './lib/Terminal.svelte';
  import { countPanes, presets, leaf, removePane, splitPaneAt, getSessionNames, movePane } from './lib/stores/layout.js';
  import {
    loadWorkspaces, getWorkspaces, getActiveId, getActiveWorkspace,
    setActive, updateLayout, subscribe, updatePaneSession,
    createWorkspace, deleteWorkspace, renameWorkspace, duplicateWorkspace,
  } from './lib/stores/workspaces.js';

  let sessions = $state([]);
  let workspaces = $state([]);
  let activeId = $state(null);
  let activeLayout = $state(null);
  let focusedId = $state(null);
  let loading = $state(true);
  let showSessionPicker = $state(null);
  let showPropsPanel = $state(false);
  let zoomedPane = $state(null); // { id, session, host } when a pane is zoomed

  // Workspace management modals
  let showNewWsModal = $state(false);
  let newWsName = $state('');
  let newWsPreset = $state('quad');
  let showRenameModal = $state(null);
  let renameValue = $state('');
  let showDeleteConfirm = $state(null);
  let contextMenu = $state(null);
  let paneMenu = $state(null);

  // Toast notifications
  let toasts = $state([]);
  let toastId = 0;

  function toast(message, type = 'info') {
    const id = ++toastId;
    toasts = [...toasts, { id, message, type }];
    setTimeout(() => { toasts = toasts.filter(t => t.id !== id); }, 3000);
  }

  subscribe(({ workspaces: ws, activeId: id }) => {
    workspaces = ws;
    activeId = id;
    const active = ws.find(w => w.id === id);
    activeLayout = active?.layout || null;
  });

  // Derive focused session info from focusedId
  function getFocusedSession() {
    if (!focusedId) return null;
    // focusedId format: "host:session"
    const [host, ...rest] = focusedId.split(':');
    const sessionName = rest.join(':');
    if (!sessionName || sessionName.startsWith('split-')) return null;
    return sessions.find(s => s.name === sessionName) || { name: sessionName, host, type: 'terminal' };
  }

  function getFocusedHost() {
    if (!focusedId) return null;
    return focusedId.split(':')[0] || 'reliant';
  }

  function formatTimestamp(ts) {
    if (!ts) return '--';
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function typeLabel(type) {
    if (type === 'claude-code') return 'Claude Code';
    if (type === 'gsd') return 'GSD Auto';
    return 'Terminal';
  }

  let refreshTimer;

  async function loadSessions() {
    try {
      // Load local sessions first (fast), then remote hosts in background
      const localRes = await fetch('/api/sessions/reliant');
      const localData = await localRes.json();
      sessions = (localData.sessions || []).map(s => ({ ...s, host: 'reliant' }));

      // Then fetch all hosts (including remote) in background
      const hostsRes = await fetch('/api/hosts');
      const hostsData = await hostsRes.json();
      const remoteHosts = (hostsData.hosts || []).filter(h => !h.isLocal);

      if (remoteHosts.length > 0) {
        Promise.allSettled(
          remoteHosts.map(async (h) => {
            try {
              const res = await fetch(`/api/sessions/${h.name}`);
              if (!res.ok) return [];
              const data = await res.json();
              return (data.sessions || []).map(s => ({ ...s, host: h.name }));
            } catch { return []; }
          })
        ).then(results => {
          const remoteSessions = results
            .filter(r => r.status === 'fulfilled')
            .flatMap(r => r.value);
          if (remoteSessions.length > 0) {
            sessions = [...sessions, ...remoteSessions];
          }
        });
      }
    } catch (e) {
      console.error('Failed to load sessions:', e);
    }
  }

  async function init() {
    await loadSessions();
    await loadWorkspaces();
    loading = false;
    // Auto-refresh sessions every 30s
    refreshTimer = setInterval(loadSessions, 30000);
  }

  function switchWorkspace(id) {
    focusedId = null;
    zoomedPane = null;
    showSessionPicker = null;
    contextMenu = null;
    setActive(id);
  }

  function handleFocus(id) { focusedId = id; }

  function handleZoom(id, session, host) {
    if (zoomedPane && zoomedPane.id === id) {
      zoomedPane = null; // Unzoom
    } else {
      zoomedPane = { id, session, host };
      focusedId = id;
    }
  }

  function handleLayoutChange() {
    if (activeId && activeLayout) updateLayout(activeId, activeLayout);
  }

  function handleSplitPane(path, direction) {
    if (!activeLayout || !activeId) return;
    // Pick the first unassigned session, or default to 'main'
    const usedSessions = getSessionNames(activeLayout);
    const availableSession = sessions.find(s => !usedSessions.includes(s.name))?.name || 'main';
    const newLayout = splitPaneAt(activeLayout, path, direction, availableSession, 'reliant');
    if (newLayout) {
      activeLayout = newLayout;
      // Force re-render
      const tmp = activeId;
      activeId = null;
      setTimeout(() => {
        activeId = tmp;
        updateLayout(tmp, newLayout);
      }, 50);
      toast(`Split pane ${direction === 'h' ? 'horizontally' : 'vertically'}`, 'info');
    }
  }

  function handleClosePane(path) {
    if (!activeLayout || !activeId) return;
    if (countPanes(activeLayout) <= 1) {
      toast("Can't close the last pane", 'error');
      return;
    }
    const newLayout = removePane(activeLayout, path);
    if (newLayout) {
      activeLayout = newLayout;
      focusedId = null;
      zoomedPane = null;
      const tmp = activeId;
      activeId = null;
      setTimeout(() => {
        activeId = tmp;
        updateLayout(tmp, newLayout);
      }, 50);
      toast('Pane closed', 'info');
    }
  }

  function handlePaneDrop(sourceSession, targetSession, position) {
    if (!activeLayout || !activeId) return;
    const newLayout = movePane(activeLayout, sourceSession, targetSession, position);
    if (newLayout) {
      activeLayout = newLayout;
      focusedId = null;
      zoomedPane = null;
      const tmp = activeId;
      activeId = null;
      setTimeout(() => {
        activeId = tmp;
        updateLayout(tmp, newLayout);
      }, 50);
      toast(`Moved ${sourceSession} ${position} of ${targetSession}`, 'info');
    }
  }
  function openSessionPicker(path, currentSession) {
    showSessionPicker = { path, currentSession };
  }

  function assignSession(session) {
    if (showSessionPicker && activeId) {
      updatePaneSession(activeId, showSessionPicker.path, session.name, session.host || 'reliant');
      showSessionPicker = null;
      // No need to cycle activeId — Terminal.svelte reacts to prop changes
    }
  }

  function closeSessionPicker() { showSessionPicker = null; }

  // Context menu
  function openContextMenu(e, wsId) {
    e.preventDefault();
    contextMenu = { id: wsId, x: e.clientX, y: e.clientY };
  }

  function openNewWsModal() {
    newWsName = '';
    newWsPreset = 'quad';
    showNewWsModal = true;
    contextMenu = null;
  }

  async function handleCreateWorkspace() {
    if (!newWsName.trim()) return;
    const sessionNames = sessions.map(s => s.name);
    const layouts = presets(sessionNames.length ? sessionNames : ['main', 'homelab', 'onsite', 'business']);
    const layout = layouts[newWsPreset] || layouts.quad;
    try {
      await createWorkspace(newWsName.trim(), layout);
      showNewWsModal = false;
      toast(`Created workspace "${newWsName.trim()}"`, 'success');
    } catch (e) {
      toast(e.message || 'Failed to create workspace', 'error');
    }
  }

  function openRename(id) {
    const ws = workspaces.find(w => w.id === id);
    renameValue = ws?.name || '';
    showRenameModal = id;
    contextMenu = null;
  }

  async function handleRename() {
    if (!renameValue.trim() || !showRenameModal) return;
    try {
      await renameWorkspace(showRenameModal, renameValue.trim());
      toast(`Renamed to "${renameValue.trim()}"`, 'success');
      showRenameModal = null;
    } catch (e) {
      toast(e.message || 'Failed to rename', 'error');
    }
  }

  async function handleDuplicate(id) {
    contextMenu = null;
    try {
      await duplicateWorkspace(id);
      const ws = workspaces.find(w => w.id === id);
      toast(`Duplicated "${ws?.name || 'workspace'}"`, 'success');
    } catch (e) {
      toast(e.message || 'Failed to duplicate', 'error');
    }
  }

  function openDeleteConfirm(id) {
    showDeleteConfirm = id;
    contextMenu = null;
  }

  async function handleDelete() {
    if (!showDeleteConfirm) return;
    const ws = workspaces.find(w => w.id === showDeleteConfirm);
    try {
      await deleteWorkspace(showDeleteConfirm);
      toast(`Deleted "${ws?.name || 'workspace'}"`, 'success');
      showDeleteConfirm = null;
    } catch (e) {
      toast(e.message || 'Failed to delete', 'error');
    }
  }

  function typeClass(type) {
    if (type === 'claude-code') return 'claude';
    if (type === 'gsd') return 'gsd';
    return 'terminal';
  }

  function activeName() {
    return workspaces.find(w => w.id === activeId)?.name || '';
  }

  function handleWindowClick() { contextMenu = null; paneMenu = null; }

  function handlePaneContextMenu(e, path, session, host) {
    paneMenu = { x: e.clientX, y: e.clientY, path, session, host };
  }

  function getWorkspacesContaining(sessionName) {
    return workspaces.filter(ws => {
      const names = getSessionNames(ws.layout);
      return names.includes(sessionName);
    });
  }

  function nodeIdFromPane(pm) {
    return `${pm.host}:${pm.session}`;
  }

  // Keyboard shortcuts
  function handleKeydown(e) {
    // Don't handle when typing in inputs or modals are open
    const tag = e.target?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (showNewWsModal || showRenameModal || showDeleteConfirm || showSessionPicker) return;

    // 1-9 to switch workspaces
    if (e.key >= '1' && e.key <= '9' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const idx = parseInt(e.key) - 1;
      if (idx < workspaces.length) {
        e.preventDefault();
        switchWorkspace(workspaces[idx].id);
      }
      return;
    }

    // Shift+1-9 to focus pane by index
    if (e.shiftKey && e.key >= '!' && e.key <= '(' && !e.ctrlKey && !e.metaKey) {
      // Shift+1 = '!', Shift+2 = '@', etc — map back to index
      const shiftDigitMap = { '!': 0, '@': 1, '#': 2, '$': 3, '%': 4, '^': 5, '&': 6, '*': 7, '(': 8 };
      const idx = shiftDigitMap[e.key];
      if (idx !== undefined && activeLayout) {
        const sessions = getSessionNames(activeLayout);
        if (idx < sessions.length) {
          e.preventDefault();
          const sessionName = sessions[idx];
          focusedId = `reliant:${sessionName}`;
        }
      }
      return;
    }

    // N to create new workspace
    if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      openNewWsModal();
      return;
    }

    // Ctrl+Shift+F to zoom/unzoom focused pane
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
      e.preventDefault();
      if (zoomedPane) {
        zoomedPane = null;
      } else if (focusedId) {
        const [host, ...rest] = focusedId.split(':');
        const sessionName = rest.join(':');
        if (sessionName && !sessionName.startsWith('split-')) {
          handleZoom(focusedId, sessionName, host);
        }
      }
      return;
    }

    // I to toggle properties panel
    if (e.key === 'i' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      showPropsPanel = !showPropsPanel;
      return;
    }

    // Escape to close panels/menus/unzoom
    if (e.key === 'Escape') {
      if (zoomedPane) { zoomedPane = null; return; }
      contextMenu = null;
      paneMenu = null;
      return;
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown);
    clearInterval(refreshTimer);
  });

  $effect(() => { init(); });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="app" onclick={handleWindowClick}>
  <nav class="topnav">
    <span class="logo">SESSION DECK</span>
    <span class="sep"></span>
    <div class="ws-tabs">
      {#each workspaces as ws, i}
        <button
          class="wt"
          class:active={ws.id === activeId}
          onclick={() => switchWorkspace(ws.id)}
          oncontextmenu={(e) => openContextMenu(e, ws.id)}
          title="{ws.description || ws.name} ({i + 1})"
        >
          <span class="ws-num">{i + 1}</span>
          {ws.name}
          <span class="cnt">{countPanes(ws.layout)}</span>
        </button>
      {/each}
      <button class="wt add-btn" onclick={openNewWsModal} title="New workspace (N)">+</button>
    </div>
    <span class="spacer"></span>
    {#if zoomedPane}
      <span class="pane-count zoom-indicator">ZOOM: {zoomedPane.session}</span>
    {:else if activeLayout}
      <span class="pane-count">{countPanes(activeLayout)} panes</span>
    {/if}
    <button
      class="topnav-btn"
      class:active={showPropsPanel}
      onclick={() => showPropsPanel = !showPropsPanel}
      title="Properties panel (I)"
    >{showPropsPanel ? 'I' : 'I'}</button>
  </nav>

  <div class="main-row">
    <main class="content">
      {#if loading}
        <div class="center-msg">Loading workspaces...</div>
      {:else if zoomedPane && activeId}
        <div class="zoomed-container">
          <Terminal
            session={zoomedPane.session}
            host={zoomedPane.host}
            focused={true}
            zoomed={true}
            onZoom={() => { zoomedPane = null; }}
            onSessionClick={() => openSessionPicker([], zoomedPane.session)}
            onContextMenu={(e) => handlePaneContextMenu(e, [], zoomedPane.session, zoomedPane.host)}
          />
        </div>
      {:else if activeLayout && activeId}
        {#key activeId}
          <SplitPane
            node={activeLayout}
            {focusedId}
            zoomedId={null}
            onFocus={handleFocus}
            onLayoutChange={handleLayoutChange}
            onSessionPick={openSessionPicker}
            onZoom={handleZoom}
            onSplit={handleSplitPane}
            onClose={handleClosePane}
            onDrop={handlePaneDrop}
            onPaneContextMenu={handlePaneContextMenu}
          />
        {/key}
      {:else}
        <div class="center-msg">No workspaces configured</div>
      {/if}
    </main>

    <!-- Properties panel -->
    {#if showPropsPanel}
      <aside class="props-panel">
        <div class="props-hdr">
          <span class="props-title">Properties</span>
          <button class="picker-close" onclick={() => showPropsPanel = false}>&times;</button>
        </div>
        {#if focusedId && getFocusedSession()}
          {@const session = getFocusedSession()}
          {@const host = getFocusedHost()}
          <div class="props-body">
            <div class="prop-section">
              <div class="prop-session-name">
                <span class="dot {typeClass(session.type)}"></span>
                {session.name}
              </div>
              <span class="prop-type-badge {typeClass(session.type)}">{typeLabel(session.type)}</span>
            </div>

            <div class="prop-divider"></div>

            <div class="prop-section">
              <div class="prop-row">
                <span class="prop-label">Host</span>
                <span class="prop-value">{host}</span>
              </div>
              <div class="prop-row">
                <span class="prop-label">Status</span>
                <span class="prop-value">
                  {#if session.attached}
                    <span class="prop-badge attached">active</span>
                  {:else}
                    <span class="prop-badge detached">detached</span>
                  {/if}
                </span>
              </div>
              <div class="prop-row">
                <span class="prop-label">Created</span>
                <span class="prop-value">{formatTimestamp(session.created)}</span>
              </div>
            </div>

            <div class="prop-divider"></div>

            <div class="prop-section">
              <span class="prop-section-title">Used in workspaces</span>
              {#each getWorkspacesContaining(session.name) as ws}
                <button
                  class="prop-ws-link"
                  class:current={ws.id === activeId}
                  onclick={() => { switchWorkspace(ws.id); showPropsPanel = false; }}
                  title="Switch to {ws.name}"
                >
                  {ws.name}
                  {#if ws.id === activeId}<span class="prop-current-tag">current</span>{/if}
                </button>
              {:else}
                <span class="prop-value dim">Not in any workspace</span>
              {/each}
            </div>


            <div class="prop-divider"></div>

            <div class="prop-section">
              <span class="prop-section-title">Current workspace</span>
              <div class="prop-row">
                <span class="prop-label">Name</span>
                <span class="prop-value">{activeName()}</span>
              </div>
              <div class="prop-row">
                <span class="prop-label">Panes</span>
                <span class="prop-value">{activeLayout ? countPanes(activeLayout) : 0}</span>
              </div>
            </div>
          </div>
        {:else}
          <div class="props-empty">
            <span class="props-empty-icon"></span>
            <span>Click a pane to see details</span>
          </div>
        {/if}
      </aside>
    {/if}
  </div>

  <!-- Workspace context menu -->
  {#if contextMenu}
    <div class="ctx-menu" style="left:{contextMenu.x}px;top:{contextMenu.y}px">
      <button class="ctx-item" onclick={() => openRename(contextMenu.id)}>Rename</button>
      <button class="ctx-item" onclick={() => handleDuplicate(contextMenu.id)}>Duplicate</button>
      <div class="ctx-sep"></div>
      <button class="ctx-item danger" onclick={() => openDeleteConfirm(contextMenu.id)}>Delete</button>
    </div>
  {/if}

  <!-- Pane context menu -->
  {#if paneMenu}
    <div class="ctx-menu" style="left:{paneMenu.x}px;top:{paneMenu.y}px">
      <button class="ctx-item" onclick={() => { openSessionPicker(paneMenu.path, paneMenu.session); paneMenu = null; }}>Change Session</button>
      <div class="ctx-sep"></div>
      <button class="ctx-item" onclick={() => { handleSplitPane(paneMenu.path, 'h'); paneMenu = null; }}>Split Left/Right</button>
      <button class="ctx-item" onclick={() => { handleSplitPane(paneMenu.path, 'v'); paneMenu = null; }}>Split Top/Bottom</button>
      <div class="ctx-sep"></div>
      <button class="ctx-item" onclick={() => { handleZoom(nodeIdFromPane(paneMenu), paneMenu.session, paneMenu.host); paneMenu = null; }}>{zoomedPane ? 'Restore' : 'Zoom'}</button>
      <button class="ctx-item danger" onclick={() => { handleClosePane(paneMenu.path); paneMenu = null; }}>Close Pane</button>
    </div>
  {/if}

  <!-- Session picker overlay -->
  {#if showSessionPicker}
    <div class="picker-overlay" role="dialog" onclick={closeSessionPicker}>
      <div class="picker" onclick={(e) => e.stopPropagation()}>
        <div class="picker-hdr">
          <span>Assign Session to Pane</span>
          <button class="picker-close" onclick={closeSessionPicker}>&times;</button>
        </div>
        <div class="picker-body">
          {#each sessions as s}
            <button
              class="picker-item"
              class:current={s.name === showSessionPicker.currentSession}
              onclick={() => assignSession(s)}
            >
              <span class="dot {typeClass(s.type)}"></span>
              <span class="picker-name">{s.name}</span>
              <span class="picker-host">{s.host || 'reliant'}</span>
              {#if s.name === showSessionPicker.currentSession}
                <span class="picker-current">current</span>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <!-- New workspace modal -->
  {#if showNewWsModal}
    <div class="picker-overlay" role="dialog" onclick={() => showNewWsModal = false}>
      <div class="picker" style="width:360px" onclick={(e) => e.stopPropagation()}>
        <div class="picker-hdr">
          <span>New Workspace</span>
          <button class="picker-close" onclick={() => showNewWsModal = false}>&times;</button>
        </div>
        <div class="modal-body">
          <label class="field-label">Name</label>
          <input
            class="field-input"
            type="text"
            bind:value={newWsName}
            placeholder="my-workspace"
            onkeydown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
          />
          <label class="field-label">Layout preset</label>
          <div class="preset-grid">
            {#each ['dual', 'claude-focus', 'quad', 'infra', 'deck', 'mixed'] as p}
              <button
                class="preset-btn"
                class:active={newWsPreset === p}
                onclick={() => newWsPreset = p}
              >{p}</button>
            {/each}
          </div>
          <button class="action-btn" onclick={handleCreateWorkspace} disabled={!newWsName.trim()}>Create</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Rename modal -->
  {#if showRenameModal}
    <div class="picker-overlay" role="dialog" onclick={() => showRenameModal = null}>
      <div class="picker" style="width:320px" onclick={(e) => e.stopPropagation()}>
        <div class="picker-hdr">
          <span>Rename Workspace</span>
          <button class="picker-close" onclick={() => showRenameModal = null}>&times;</button>
        </div>
        <div class="modal-body">
          <input class="field-input" type="text" bind:value={renameValue}
            onkeydown={(e) => e.key === 'Enter' && handleRename()} />
          <button class="action-btn" onclick={handleRename} disabled={!renameValue.trim()}>Rename</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Delete confirmation -->
  {#if showDeleteConfirm}
    <div class="picker-overlay" role="dialog" onclick={() => showDeleteConfirm = null}>
      <div class="picker" style="width:320px" onclick={(e) => e.stopPropagation()}>
        <div class="picker-hdr">
          <span>Delete Workspace</span>
          <button class="picker-close" onclick={() => showDeleteConfirm = null}>&times;</button>
        </div>
        <div class="modal-body">
          <p class="confirm-text">Delete "{workspaces.find(w => w.id === showDeleteConfirm)?.name}"? This can't be undone.</p>
          <div class="btn-row">
            <button class="action-btn secondary" onclick={() => showDeleteConfirm = null}>Cancel</button>
            <button class="action-btn danger" onclick={handleDelete}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Toast notifications -->
  <div class="toast-container">
    {#each toasts as t (t.id)}
      <div class="toast {t.type}">{t.message}</div>
    {/each}
  </div>

  <footer class="statusbar">
    <span>workspace: <span class="ws-name">{activeName()}</span></span>
    <span class="sep-dot">&middot;</span>
    <span>{activeLayout ? countPanes(activeLayout) : 0} panes</span>
    <span class="sep-dot">&middot;</span>
    <span>{sessions.length} sessions</span>
    <span class="spacer"></span>
    <button class="shortcut-btn" onclick={() => {
      const idx = workspaces.findIndex(w => w.id === activeId);
      const next = (idx + 1) % workspaces.length;
      switchWorkspace(workspaces[next].id);
    }}><kbd>1-9</kbd> workspace</button>
    <button class="shortcut-btn" onclick={openNewWsModal}><kbd>N</kbd> new workspace</button>
    <button class="shortcut-btn" onclick={() => showPropsPanel = !showPropsPanel}><kbd>I</kbd> properties</button>
    <button class="shortcut-btn" onclick={() => {
      if (zoomedPane) { zoomedPane = null; }
      else if (focusedId) {
        const [h, ...r] = focusedId.split(':');
        const s = r.join(':');
        if (s && !s.startsWith('split-')) handleZoom(focusedId, s, h);
      }
    }}><kbd>Ctrl+Shift+F</kbd> {zoomedPane ? 'unzoom' : 'zoom'}</button>
    {#if zoomedPane}
      <button class="shortcut-btn" onclick={() => zoomedPane = null}><kbd>Esc</kbd> unzoom</button>
    {/if}
  </footer>
</div>

<style>
  .app { display: flex; flex-direction: column; height: 100vh; }

  .topnav {
    height: 38px; padding: 0 12px;
    background: #151b23; border-bottom: 1px solid #1e2530;
    display: flex; align-items: center; gap: 8px; flex-shrink: 0;
  }
  .logo { font-size: 13px; font-weight: 700; color: #3d8bfd; font-family: 'JetBrains Mono', monospace; letter-spacing: 1px; }
  .sep { width: 1px; height: 18px; background: #1e2530; }
  .spacer { flex: 1; }
  .ws-tabs { display: flex; gap: 2px; }
  .wt {
    padding: 5px 12px; border-radius: 6px; border: 1px solid transparent;
    background: transparent; color: #6b7688; font-size: 12px; font-weight: 500;
    cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.12s;
    display: flex; align-items: center; gap: 4px;
  }
  .wt:hover { color: #c5cdd9; }
  .wt.active { color: #3d8bfd; background: rgba(61,139,253,0.08); border-color: rgba(61,139,253,0.2); }
  .wt .cnt { font-size: 10px; color: #3d4450; }
  .wt .ws-num { font-size: 9px; color: #3d4450; font-family: 'JetBrains Mono', monospace; min-width: 10px; }
  .wt.active .ws-num { color: rgba(61,139,253,0.5); }
  .add-btn { font-size: 16px; padding: 3px 10px; color: #3d4450; }
  .add-btn:hover { color: #3d8bfd; }
  .pane-count { font-size: 11px; color: #6b7688; font-family: 'JetBrains Mono', monospace; }

  .topnav-btn {
    padding: 3px 8px; border-radius: 4px; border: 1px solid #1e2530;
    background: transparent; color: #6b7688; cursor: pointer; font-size: 10px;
    font-family: 'DM Sans', sans-serif; font-weight: 500;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.12s;
  }
  .topnav-btn:hover { border-color: #3d8bfd; color: #c5cdd9; }
  .topnav-btn.active { border-color: #3d8bfd; background: rgba(61,139,253,0.1); color: #3d8bfd; }

  .main-row { flex: 1; display: flex; overflow: hidden; }
  .content { flex: 1; overflow: hidden; padding: 3px; }
  .center-msg { display: flex; align-items: center; justify-content: center; height: 100%; font-size: 14px; color: #6b7688; }
  .zoomed-container { width: 100%; height: 100%; }
  .zoom-indicator { color: #7fd962; }

  /* Properties panel */
  .props-panel {
    width: 240px; flex-shrink: 0;
    background: #121820; border-left: 1px solid #1e2530;
    display: flex; flex-direction: column;
    overflow-y: auto;
  }
  .props-hdr {
    padding: 10px 12px; display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid #1e2530; flex-shrink: 0;
  }
  .props-title { font-size: 11px; font-weight: 600; color: #6b7688; text-transform: uppercase; letter-spacing: 0.5px; }
  .props-body { padding: 12px; }
  .props-empty {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 8px;
    color: #3d4450; font-size: 12px; padding: 24px;
  }
  .props-empty-icon {
    width: 32px; height: 32px; border: 2px solid #3d4450; border-radius: 50%;
    opacity: 0.4; position: relative;
  }
  .props-empty-icon::after {
    content: ''; position: absolute; top: 50%; left: 50%;
    width: 8px; height: 8px; background: #3d4450; border-radius: 50%;
    transform: translate(-50%, -50%);
  }

  .prop-section { display: flex; flex-direction: column; gap: 8px; }
  .prop-session-name {
    display: flex; align-items: center; gap: 8px;
    font-family: 'JetBrains Mono', monospace; font-size: 14px;
    color: #c5cdd9; font-weight: 600;
  }
  .prop-type-badge {
    font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 500;
    align-self: flex-start;
  }
  .prop-type-badge.claude { background: rgba(61,139,253,0.1); color: #3d8bfd; }
  .prop-type-badge.gsd { background: rgba(199,146,234,0.1); color: #c792ea; }
  .prop-type-badge.terminal { background: rgba(107,118,136,0.1); color: #6b7688; }

  .prop-divider { height: 1px; background: #1e2530; margin: 4px 0; }

  .prop-row { display: flex; justify-content: space-between; align-items: center; }
  .prop-label { font-size: 11px; color: #6b7688; }
  .prop-value { font-size: 11px; color: #c5cdd9; font-family: 'JetBrains Mono', monospace; }

  .prop-section-title {
    font-size: 10px; color: #3d4450; text-transform: uppercase;
    letter-spacing: 0.5px; font-weight: 600;
  }

  .prop-badge {
    font-size: 9px; padding: 1px 6px; border-radius: 3px; font-weight: 500;
  }
  .prop-badge.attached { background: rgba(127,217,98,0.1); color: #7fd962; }
  .prop-badge.detached { background: rgba(240,113,120,0.1); color: #f07178; }

  .prop-ws-link {
    width: 100%; padding: 4px 8px; border-radius: 4px; border: 1px solid #1e2530;
    background: transparent; color: #c5cdd9; font-size: 11px; text-align: left;
    cursor: pointer; font-family: 'JetBrains Mono', monospace;
    display: flex; align-items: center; gap: 6px; transition: all 0.1s;
  }
  .prop-ws-link:hover { border-color: #3d8bfd; color: #3d8bfd; }
  .prop-ws-link.current { border-color: rgba(61,139,253,0.3); background: rgba(61,139,253,0.05); }
  .prop-current-tag { font-size: 8px; padding: 0 4px; border-radius: 2px; background: rgba(61,139,253,0.15); color: #3d8bfd; }
  .prop-value.dim { color: #3d4450; font-style: italic; font-size: 10px; }

  /* Context menu */
  .ctx-menu {
    position: fixed; z-index: 3000;
    background: #1c2333; border: 1px solid #2a3345; border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5); padding: 4px; min-width: 160px;
  }
  .ctx-item {
    width: 100%; padding: 7px 12px; border: none; background: transparent;
    color: #c5cdd9; font-size: 12px; text-align: left; cursor: pointer;
    border-radius: 4px; display: flex; align-items: center; gap: 8px;
  }
  .ctx-item:hover { background: #252d3d; }
  .ctx-item.danger { color: #f07178; }
  .ctx-item.danger:hover { background: rgba(240,113,120,0.1); }
  .ctx-sep { height: 1px; background: #2a3345; margin: 4px 8px; }

  /* Modals */
  .picker-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
    z-index: 2000; display: flex; align-items: center; justify-content: center;
  }
  .picker {
    width: 400px; max-height: 500px; background: #151b23;
    border: 1px solid #1e2530; border-radius: 10px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.5); overflow: hidden;
    display: flex; flex-direction: column;
  }
  .picker-hdr {
    padding: 12px 16px; display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid #1e2530; font-size: 13px; font-weight: 600; color: #c5cdd9;
  }
  .picker-close {
    width: 24px; height: 24px; border-radius: 4px; border: 1px solid #1e2530;
    background: transparent; color: #6b7688; cursor: pointer;
    display: flex; align-items: center; justify-content: center; font-size: 12px;
  }
  .picker-close:hover { border-color: #f07178; color: #f07178; }
  .picker-body { flex: 1; overflow-y: auto; padding: 4px; }
  .picker-item {
    width: 100%; padding: 8px 12px; border: none; background: transparent;
    display: flex; align-items: center; gap: 8px; cursor: pointer;
    border-radius: 6px; font-size: 13px; text-align: left;
    color: #c5cdd9; transition: background 0.1s;
  }
  .picker-item:hover { background: #1c2333; }
  .picker-item.current { background: rgba(61,139,253,0.08); }
  .dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .dot.claude { background: #3d8bfd; box-shadow: 0 0 6px #3d8bfd; }
  .dot.gsd { background: #c792ea; box-shadow: 0 0 6px #c792ea; }
  .dot.terminal { background: #6b7688; }
  .picker-name { font-family: 'JetBrains Mono', monospace; font-size: 12px; flex: 1; }
  .picker-host { font-size: 10px; color: #3d4450; }
  .picker-current { font-size: 9px; padding: 1px 6px; border-radius: 3px; background: rgba(61,139,253,0.15); color: #3d8bfd; }

  .modal-body { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
  .field-label { font-size: 11px; color: #6b7688; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
  .field-input {
    width: 100%; padding: 8px 12px; border-radius: 6px;
    border: 1px solid #1e2530; background: #0b0e11; color: #c5cdd9;
    font-size: 13px; font-family: 'JetBrains Mono', monospace;
    outline: none; box-sizing: border-box;
  }
  .field-input:focus { border-color: #3d8bfd; }

  .preset-grid { display: flex; flex-wrap: wrap; gap: 4px; }
  .preset-btn {
    padding: 5px 10px; border-radius: 4px; border: 1px solid #1e2530;
    background: transparent; color: #6b7688; font-size: 11px; cursor: pointer;
    font-family: 'JetBrains Mono', monospace;
  }
  .preset-btn:hover { border-color: #3d8bfd; color: #c5cdd9; }
  .preset-btn.active { border-color: #3d8bfd; background: rgba(61,139,253,0.1); color: #3d8bfd; }

  .action-btn {
    padding: 8px 16px; border-radius: 6px; border: none;
    background: #3d8bfd; color: #fff; font-size: 12px; font-weight: 600;
    cursor: pointer; transition: background 0.12s;
  }
  .action-btn:hover { background: #5a9eff; }
  .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .action-btn.secondary { background: #1e2530; color: #c5cdd9; }
  .action-btn.secondary:hover { background: #252d3d; }
  .action-btn.danger { background: #f07178; }
  .action-btn.danger:hover { background: #ff8a8f; }

  .confirm-text { color: #c5cdd9; font-size: 13px; margin: 0; }
  .btn-row { display: flex; gap: 8px; justify-content: flex-end; }

  .toast-container {
    position: fixed; bottom: 32px; right: 16px; z-index: 4000;
    display: flex; flex-direction: column; gap: 8px;
  }
  .toast {
    padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    animation: toast-in 0.2s ease-out;
  }
  .toast.success { background: rgba(127,217,98,0.15); color: #7fd962; border: 1px solid rgba(127,217,98,0.3); }
  .toast.error { background: rgba(240,113,120,0.15); color: #f07178; border: 1px solid rgba(240,113,120,0.3); }
  .toast.info { background: rgba(61,139,253,0.15); color: #3d8bfd; border: 1px solid rgba(61,139,253,0.3); }

  @keyframes toast-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .statusbar {
    height: 24px; padding: 0 16px;
    background: #151b23; border-top: 1px solid #1e2530;
    display: flex; align-items: center; gap: 8px;
    font-size: 10px; color: #3d4450; font-family: 'JetBrains Mono', monospace;
    flex-shrink: 0;
  }
  .ws-name { color: #3d8bfd; }
  .sep-dot { color: #1e2530; }
  .shortcut-btn {
    display: flex; align-items: center; gap: 3px;
    background: none; border: none; color: #3d4450; cursor: pointer;
    font-size: 10px; font-family: 'JetBrains Mono', monospace;
    padding: 0 4px; border-radius: 2px; transition: color 0.1s;
  }
  .shortcut-btn:hover { color: #6b7688; }
  .statusbar kbd {
    font-size: 9px; padding: 0 3px; border-radius: 2px;
    background: #0a0e14; border: 1px solid #1e2530; color: #6b7688;
  }
</style>
