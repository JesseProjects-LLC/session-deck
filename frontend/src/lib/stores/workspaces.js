// frontend/src/lib/stores/workspaces.js — Workspace state management

let _workspaces = [];
let _activeId = null;
let _listeners = [];
let _saveTimer = null;

function notify() {
  _listeners.forEach(fn => fn({ workspaces: _workspaces, activeId: _activeId }));
}

export function subscribe(fn) {
  _listeners.push(fn);
  fn({ workspaces: _workspaces, activeId: _activeId });
  return () => { _listeners = _listeners.filter(f => f !== fn); };
}

export function getWorkspaces() { return _workspaces; }
export function getActiveId() { return _activeId; }
export function getActiveWorkspace() {
  return _workspaces.find(w => w.id === _activeId) || _workspaces[0];
}

export async function loadWorkspaces() {
  try {
    const res = await fetch('/api/workspaces');
    const data = await res.json();
    _workspaces = data.workspaces || [];
    if (!_activeId && _workspaces.length) {
      _activeId = _workspaces[0].id;
    }
    notify();
  } catch (e) {
    console.error('Failed to load workspaces:', e);
  }
}

export function setActive(id) {
  _activeId = id;
  notify();
}

export async function updateLayout(id, layout) {
  const ws = _workspaces.find(w => w.id === id);
  if (ws) {
    ws.layout = layout;
    notify();
    // Debounced save to API
    debouncedSave(id, layout);
  }
}

export async function updatePaneSession(workspaceId, path, session, host) {
  const ws = _workspaces.find(w => w.id === workspaceId);
  if (!ws) return;

  // Walk the tree using the path (array of child indices)
  let node = ws.layout;
  for (let i = 0; i < path.length - 1; i++) {
    node = node.children[path[i]];
  }
  const leaf = node.children ? node.children[path[path.length - 1]] : node;

  if (leaf) {
    leaf.session = session;
    leaf.host = host || 'reliant';
    notify();
    debouncedSave(workspaceId, ws.layout);
  }
}

export async function createWorkspace(name, layout, description) {
  try {
    const res = await fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, layout, description }),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    const data = await res.json();
    _workspaces.push({ ...data, isDefault: false });
    _activeId = data.id;
    notify();
    return data;
  } catch (e) {
    console.error('Failed to create workspace:', e);
    throw e;
  }
}

export async function renameWorkspace(id, name) {
  try {
    const res = await fetch(`/api/workspaces/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    const ws = _workspaces.find(w => w.id === id);
    if (ws) ws.name = name;
    notify();
  } catch (e) {
    console.error('Failed to rename workspace:', e);
    throw e;
  }
}

export async function duplicateWorkspace(id) {
  const ws = _workspaces.find(w => w.id === id);
  if (!ws) throw new Error('Workspace not found');
  const newName = `${ws.name} (copy)`;
  // Deep clone layout to avoid shared references
  const layout = JSON.parse(JSON.stringify(ws.layout));
  return createWorkspace(newName, layout, ws.description || '');
}

export async function deleteWorkspace(id) {
  try {
    const res = await fetch(`/api/workspaces/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error);
    _workspaces = _workspaces.filter(w => w.id !== id);
    if (_activeId === id) {
      _activeId = _workspaces[0]?.id || null;
    }
    notify();
  } catch (e) {
    console.error('Failed to delete workspace:', e);
    throw e;
  }
}

function debouncedSave(id, layout) {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(async () => {
    try {
      await fetch(`/api/workspaces/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout }),
      });
    } catch (e) {
      console.error('Failed to save layout:', e);
    }
  }, 1000);
}
