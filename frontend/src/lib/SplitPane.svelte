<script>
  import Terminal from './Terminal.svelte';
  import SplitPane from './SplitPane.svelte';

  let {
    node,
    path = [],
    focusedId = null,
    zoomedId = null,
    onFocus = () => {},
    onLayoutChange = () => {},
    onSessionPick = () => {},
    onZoom = () => {},
    onSplit = () => {},
    onClose = () => {},
    onDrop = () => {},
    onPaneContextMenu = () => {},
    parentSplit = null,
    siblingCount = 0,
  } = $props();

  let resizing = $state(false);
  let containerEl = $state(null);
  let dropZone = $state(null); // 'left' | 'right' | 'top' | 'bottom' | null

  function startResize(index, event) {
    event.preventDefault();
    resizing = true;

    const isHorizontal = node.split === 'h';
    const startPos = isHorizontal ? event.clientX : event.clientY;
    const containerRect = containerEl.getBoundingClientRect();
    const totalSize = isHorizontal ? containerRect.width : containerRect.height;
    const totalRatio = node.children.reduce((sum, c) => sum + (c.size || 1), 0);
    const childSizes = node.children.map(c => ((c.size || 1) / totalRatio) * totalSize);

    function onMouseMove(e) {
      const delta = (isHorizontal ? e.clientX : e.clientY) - startPos;
      const newSize1 = Math.max(40, childSizes[index] + delta);
      const newSize2 = Math.max(40, childSizes[index + 1] - delta);
      const pixelPerRatio = totalSize / totalRatio;
      node.children[index].size = newSize1 / pixelPerRatio;
      node.children[index + 1].size = newSize2 / pixelPerRatio;
      node = node;
    }

    function onMouseUp() {
      resizing = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      onLayoutChange();
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }

  function nodeId(child) {
    if (child.session) return `${child.host || 'reliant'}:${child.session}`;
    return `split-${child.split}-${child.children?.length}`;
  }

  function handleSessionClick(session) {
    onSessionPick(path, session);
  }

  function getDropZone(e, el) {
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    // Determine quadrant — edges win over center
    if (x < 0.25) return 'left';
    if (x > 0.75) return 'right';
    if (y < 0.35) return 'top';
    if (y > 0.65) return 'bottom';
    // Center area — use closest edge
    const dists = { left: x, right: 1 - x, top: y, bottom: 1 - y };
    return Object.entries(dists).sort((a, b) => a[1] - b[1])[0][0];
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const sourceSession = e.dataTransfer.types.includes('text/plain') ? true : false;
    if (sourceSession) {
      const zone = getDropZone(e, e.currentTarget);
      // Detect swap: if parent is splitting in the same direction as the drop zone,
      // and there are exactly 2 siblings, show swap indicator
      const dropDir = (zone === 'left' || zone === 'right') ? 'h' : 'v';
      if (parentSplit === dropDir && siblingCount === 2) {
        dropZone = 'swap';
      } else {
        dropZone = zone;
      }
    }
  }

  function handleDragLeave(e) {
    // Only clear if actually leaving the pane (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      dropZone = null;
    }
  }

  function handleDropOnPane(e) {
    e.preventDefault();
    const sourceSession = e.dataTransfer.getData('text/plain');
    const zone = dropZone;
    dropZone = null;
    if (sourceSession && zone && sourceSession !== node.session) {
      onDrop(sourceSession, node.session, zone);
    }
  }
</script>

{#if node.session}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="pane-leaf"
    role="group"
    style="flex: {node.size || 1}"
    onclick={() => onFocus(nodeId(node))}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDropOnPane}
  >
    {#if dropZone}
      <div class="drop-indicator {dropZone}"></div>
    {/if}
    <Terminal
      session={node.session}
      host={node.host || 'reliant'}
      focused={focusedId === nodeId(node)}
      zoomed={zoomedId === nodeId(node)}
      onSessionClick={() => handleSessionClick(node.session)}
      onZoom={() => onZoom(nodeId(node), node.session, node.host || 'reliant')}
      onSplit={(dir) => onSplit(path, dir)}
      onClose={() => onClose(path)}
      onDragStart={() => {}}
      onContextMenu={(e) => onPaneContextMenu(e, path, node.session, node.host || 'reliant')}
    />
  </div>
{:else if node.split && node.children}
  <div
    class="split-container {node.split === 'h' ? 'split-h' : 'split-v'}"
    class:resizing
    style="flex: {node.size || 1}"
    bind:this={containerEl}
  >
    {#each node.children as child, i}
      <SplitPane
        node={child}
        path={[...path, i]}
        {focusedId}
        {zoomedId}
        {onFocus}
        {onLayoutChange}
        {onSessionPick}
        {onZoom}
        {onSplit}
        {onClose}
        {onDrop}
        {onPaneContextMenu}
        parentSplit={node.split}
        siblingCount={node.children.length}
      />
      {#if i < node.children.length - 1}
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
          class="resize-handle {node.split === 'h' ? 'resize-h' : 'resize-v'}"
          onmousedown={(e) => startResize(i, e)}
          role="separator"
          aria-orientation={node.split === 'h' ? 'vertical' : 'horizontal'}
        ></div>
      {/if}
    {/each}
  </div>
{/if}

<style>
  .pane-leaf { min-width: 0; min-height: 0; overflow: hidden; position: relative; }
  .split-container {
    display: flex; min-width: 0; min-height: 0;
    overflow: hidden; width: 100%; height: 100%;
  }
  .split-h { flex-direction: row; }
  .split-v { flex-direction: column; }
  .split-container.resizing :global(.term-pane) { pointer-events: none; }
  .resize-handle {
    flex-shrink: 0; z-index: 10; background: transparent; transition: background 0.1s;
  }
  .resize-handle:hover, .resize-handle:active {
    background: rgba(61, 139, 253, 0.4);
  }
  .resize-h { width: 5px; cursor: col-resize; margin: 0 -1px; }
  .resize-v { height: 5px; cursor: row-resize; margin: -1px 0; }

  /* Drop zone indicators */
  .drop-indicator {
    position: absolute; z-index: 100; pointer-events: none;
    border-radius: 4px;
    transition: all 0.1s ease;
  }
  .drop-indicator.left { top: 4px; left: 4px; bottom: 4px; width: 45%; background: rgba(61, 139, 253, 0.15); border: 2px solid rgba(61, 139, 253, 0.6); }
  .drop-indicator.right { top: 4px; right: 4px; bottom: 4px; width: 45%; background: rgba(61, 139, 253, 0.15); border: 2px solid rgba(61, 139, 253, 0.6); }
  .drop-indicator.top { top: 4px; left: 4px; right: 4px; height: 45%; background: rgba(61, 139, 253, 0.15); border: 2px solid rgba(61, 139, 253, 0.6); }
  .drop-indicator.bottom { bottom: 4px; left: 4px; right: 4px; height: 45%; background: rgba(61, 139, 253, 0.15); border: 2px solid rgba(61, 139, 253, 0.6); }
  .drop-indicator.swap { top: 4px; left: 4px; right: 4px; bottom: 4px; background: rgba(127, 217, 98, 0.12); border: 2px solid rgba(127, 217, 98, 0.5); }
</style>
