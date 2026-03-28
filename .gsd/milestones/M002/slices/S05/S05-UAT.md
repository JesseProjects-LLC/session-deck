# S05: Workspace management UI — UAT

**Milestone:** M002
**Written:** 2026-03-28T20:34:24.947Z

## UAT: S05 — Workspace Management UI\n\n### Test 1: Create workspace\n1. Click '+' in tabs row → New Workspace modal appears\n2. Enter name, select preset layout\n3. Click Create → new tab appears, auto-switches, terminals connect\n\n### Test 2: Rename workspace\n1. Right-click workspace tab → context menu\n2. Click Rename → modal with current name\n3. Type new name, press Enter → tab label updates\n\n### Test 3: Duplicate workspace\n1. Right-click workspace tab → context menu\n2. Click Duplicate → new tab with '(copy)' suffix, same layout\n\n### Test 4: Delete workspace\n1. Right-click workspace tab → context menu\n2. Click Delete → confirmation dialog\n3. Click Delete → tab removed, switches to adjacent\n\n### Test 5: Persistence\n1. Create a workspace, rename it\n2. Reload page → workspace persists with new name"
