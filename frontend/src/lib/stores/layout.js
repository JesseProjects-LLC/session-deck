// frontend/src/lib/stores/layout.js — Workspace layout tree store

/**
 * Layout tree node types:
 *
 * Leaf (terminal pane):
 *   { session: 'main', host: 'reliant', size: 1 }
 *
 * Split (container):
 *   { split: 'h' | 'v', children: [node, node, ...], size: 1 }
 *
 * size is a flex ratio — relative to siblings, not absolute pixels.
 */

/**
 * Create a leaf node for a session.
 */
export function leaf(session, host = 'reliant', size = 1) {
  return { session, host, size };
}

/**
 * Create a horizontal split (children arranged left-to-right).
 */
export function hsplit(children, size = 1) {
  return { split: 'h', children, size };
}

/**
 * Create a vertical split (children arranged top-to-bottom).
 */
export function vsplit(children, size = 1) {
  return { split: 'v', children, size };
}

/**
 * Generate preset layouts from a list of session names.
 */
export function presets(sessionNames) {
  const s = (i) => leaf(sessionNames[i] || sessionNames[i % sessionNames.length]);

  return {
    // Simple side-by-side
    dual: hsplit([s(0), s(1)]),

    // 1 big + 2 stacked
    'claude-focus': hsplit([
      { ...s(0), size: 3 },
      vsplit([s(1), s(2)], 2),
    ]),

    // 2x2 grid
    quad: hsplit([
      vsplit([s(0), s(2)]),
      vsplit([s(1), s(3)]),
    ]),

    // 2 wide top + 2 narrow bottom
    infra: vsplit([
      hsplit([s(0), s(1)], 3),
      hsplit([s(2), s(3)], 2),
    ]),

    // 4x3 grid
    deck: hsplit([
      vsplit([s(0), s(4), s(8)]),
      vsplit([s(1), s(5), s(9)]),
      vsplit([s(2), s(6), s(10)]),
      vsplit([s(3), s(7), s(11)]),
    ]),

    // Complex: big hero + sidebar stack + bottom bar
    mixed: vsplit([
      hsplit([
        { ...s(0), size: 3 },
        vsplit([s(1), s(2), s(3)], 2),
      ], 4),
      hsplit([s(4), s(5)], 1),
    ]),
  };
}

/**
 * Count total panes in a layout tree.
 */
export function countPanes(node) {
  if (node.session) return 1;
  if (node.children) return node.children.reduce((sum, c) => sum + countPanes(c), 0);
  return 0;
}

/**
 * Get all session names from a layout tree.
 */
export function getSessionNames(node) {
  if (node.session) return [node.session];
  if (node.children) return node.children.flatMap(c => getSessionNames(c));
  return [];
}

/**
 * Remove a pane at the given path from the layout tree.
 * Returns the new root node (may collapse parent splits).
 * Returns null if the last pane is removed.
 */
export function removePane(root, path) {
  if (path.length === 0) return null; // removing the root itself

  // Navigate to parent
  let parent = root;
  for (let i = 0; i < path.length - 1; i++) {
    parent = parent.children[path[i]];
  }

  const idx = path[path.length - 1];
  parent.children.splice(idx, 1);

  // If parent has only one child left, collapse it
  if (parent.children.length === 1) {
    const survivor = parent.children[0];
    // Replace parent's properties with survivor's
    if (survivor.session) {
      delete parent.split;
      delete parent.children;
      parent.session = survivor.session;
      parent.host = survivor.host;
    } else {
      parent.split = survivor.split;
      parent.children = survivor.children;
    }
  }

  // If parent has zero children (shouldn't happen but safety)
  if (parent.children && parent.children.length === 0) {
    return null;
  }

  return root;
}

/**
 * Split a pane at the given path into two panes.
 * direction: 'h' (side-by-side) or 'v' (top-bottom)
 * Returns the modified root.
 */
export function splitPaneAt(root, path, direction, newSession = 'main', newHost = 'reliant') {
  // Find the target node
  let target = root;
  let parent = null;
  let parentIdx = -1;

  for (let i = 0; i < path.length; i++) {
    parent = target;
    parentIdx = path[i];
    target = target.children[path[i]];
  }

  if (!target || !target.session) return root; // Can only split leaves

  const newNode = {
    split: direction,
    size: target.size || 1,
    children: [
      { session: target.session, host: target.host || 'reliant', size: 1 },
      { session: newSession, host: newHost, size: 1 },
    ],
  };

  if (parent) {
    parent.children[parentIdx] = newNode;
  } else {
    // Splitting the root leaf
    return newNode;
  }

  return root;
}

/**
 * Move a pane from one location to adjacent to another pane.
 * sourceSession: session name of the pane being dragged
 * targetSession: session name of the drop target
 * position: 'left' | 'right' | 'top' | 'bottom'
 * Returns new root (deep cloned).
 */
export function movePane(root, sourceSession, targetSession, position) {
  if (sourceSession === targetSession) return root;

  // Deep clone
  root = JSON.parse(JSON.stringify(root));

  // Handle 'swap' — just swap the session/host data between the two leaves
  if (position === 'swap') {
    const srcPath = findPathBySession(root, sourceSession);
    const tgtPath = findPathBySession(root, targetSession);
    if (!srcPath || !tgtPath) return root;

    let srcNode = root;
    for (const idx of srcPath) srcNode = srcNode.children[idx];
    let tgtNode = root;
    for (const idx of tgtPath) tgtNode = tgtNode.children[idx];

    // Swap session and host
    const tmpSession = srcNode.session;
    const tmpHost = srcNode.host;
    srcNode.session = tgtNode.session;
    srcNode.host = tgtNode.host;
    tgtNode.session = tmpSession;
    tgtNode.host = tmpHost;
    return root;
  }

  // Check if source and target are siblings in a matching split direction
  // If so, just reorder children instead of creating nested splits
  const sourcePath = findPathBySession(root, sourceSession);
  const targetPath = findPathBySession(root, targetSession);
  if (!sourcePath || !targetPath) return root;

  const direction = (position === 'left' || position === 'right') ? 'h' : 'v';
  const insertBefore = (position === 'left' || position === 'top');

  // Check if siblings in same parent with matching direction
  if (sourcePath.length === targetPath.length && sourcePath.length > 0) {
    const sourceParentPath = sourcePath.slice(0, -1);
    const targetParentPath = targetPath.slice(0, -1);
    if (sourceParentPath.join(',') === targetParentPath.join(',')) {
      let parent = root;
      for (const idx of sourceParentPath) parent = parent.children[idx];
      if (parent.split === direction) {
        // Same parent, same direction — reorder children
        const srcIdx = sourcePath[sourcePath.length - 1];
        const tgtIdx = targetPath[targetPath.length - 1];
        const [removed] = parent.children.splice(srcIdx, 1);
        const newIdx = insertBefore
          ? (srcIdx < tgtIdx ? tgtIdx - 1 : tgtIdx)
          : (srcIdx < tgtIdx ? tgtIdx : tgtIdx + 1);
        parent.children.splice(newIdx, 0, removed);
        return root;
      }
    }
  }

  // General case: remove source, wrap target in a new split
  let sourceNode = root;
  for (const idx of sourcePath) sourceNode = sourceNode.children[idx];
  const sourceLeaf = { session: sourceNode.session, host: sourceNode.host, size: 1 };

  root = removePane(root, sourcePath);
  if (!root) return { ...sourceLeaf };

  // Re-find target after removal
  const newTargetPath = findPathBySession(root, targetSession);
  if (!newTargetPath) return root;

  let targetNode = root;
  let targetParent = null;
  let targetIdx = -1;
  for (let i = 0; i < newTargetPath.length; i++) {
    targetParent = targetNode;
    targetIdx = newTargetPath[i];
    targetNode = targetNode.children[newTargetPath[i]];
  }

  if (!targetNode) return root;

  // If target's parent already splits in the same direction, insert as sibling
  if (targetParent && targetParent.split === direction) {
    const insertIdx = insertBefore ? targetIdx : targetIdx + 1;
    targetParent.children.splice(insertIdx, 0, sourceLeaf);
    return root;
  }

  // Otherwise wrap target in a new split
  const newSplit = {
    split: direction,
    size: targetNode.size || 1,
    children: insertBefore
      ? [sourceLeaf, { ...targetNode, size: 1 }]
      : [{ ...targetNode, size: 1 }, sourceLeaf],
  };

  if (targetParent) {
    targetParent.children[targetIdx] = newSplit;
  } else {
    root = newSplit;
  }

  return root;
}

function findPathBySession(node, sessionName, path = []) {
  if (node.session === sessionName) return path;
  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      const found = findPathBySession(node.children[i], sessionName, [...path, i]);
      if (found) return found;
    }
  }
  return null;
}
