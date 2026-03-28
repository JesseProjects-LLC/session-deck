# S03: Split tree layout engine with resize — UAT

**Milestone:** M002
**Written:** 2026-03-28T18:01:13.897Z

## UAT: S03 — Split tree layout engine\n\n### Test 1: Multiple presets\nOpen http://192.168.150.120:7890/\nClick each preset tab: Dual, Focus, Quad, Infra, Deck, Mixed\nExpect: Different pane arrangements, all with live terminals\n\n### Test 2: Resize\nHover between two panes \u2014 see blue resize handle\nDrag to resize \u2014 panes resize proportionally\n\n### Test 3: Complex layout\nClick Mixed \u2014 see hero + 3 stacked sidebar + 2 bottom bar\nExpect: 6 panes, all connected, nested splits render correctly"
