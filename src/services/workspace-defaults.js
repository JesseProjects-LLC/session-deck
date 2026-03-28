// src/services/workspace-defaults.js — Default workspace layout presets

/**
 * Generate default workspace presets using well-known session names.
 * These are seeded into the DB on first run.
 */
export function presetLayouts() {
  return [
    {
      name: 'claude-focus',
      description: 'One large pane with two smaller context panes',
      layout: {
        split: 'h',
        children: [
          { session: 'main', host: 'reliant', size: 3 },
          {
            split: 'v', size: 2,
            children: [
              { session: 'homelab', host: 'reliant', size: 1 },
              { session: 'onsite', host: 'reliant', size: 1 },
            ],
          },
        ],
      },
    },
    {
      name: 'quad',
      description: 'Four equal panes in a 2×2 grid',
      layout: {
        split: 'h',
        children: [
          {
            split: 'v', size: 1,
            children: [
              { session: 'main', host: 'reliant', size: 1 },
              { session: 'business', host: 'reliant', size: 1 },
            ],
          },
          {
            split: 'v', size: 1,
            children: [
              { session: 'homelab', host: 'reliant', size: 1 },
              { session: 'onsite', host: 'reliant', size: 1 },
            ],
          },
        ],
      },
    },
    {
      name: 'deck',
      description: 'Full 4×3 grid with all sessions',
      layout: {
        split: 'h',
        children: [
          { split: 'v', children: [
            { session: 'main', host: 'reliant', size: 1 },
            { session: 'gsd-clawdeck', host: 'reliant', size: 1 },
            { session: 'onsite', host: 'reliant', size: 1 },
          ]},
          { split: 'v', children: [
            { session: 'homelab', host: 'reliant', size: 1 },
            { session: 'gsd-homelab', host: 'reliant', size: 1 },
            { session: 'openclaw', host: 'reliant', size: 1 },
          ]},
          { split: 'v', children: [
            { session: 'business', host: 'reliant', size: 1 },
            { session: 'gsd-placer', host: 'reliant', size: 1 },
            { session: 'other', host: 'reliant', size: 1 },
          ]},
          { split: 'v', children: [
            { session: 'placer', host: 'reliant', size: 1 },
            { session: 'gsd-onsite', host: 'reliant', size: 1 },
            { session: 'social', host: 'reliant', size: 1 },
          ]},
        ],
      },
    },
  ];
}
