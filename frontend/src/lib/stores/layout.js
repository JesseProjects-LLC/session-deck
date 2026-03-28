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
