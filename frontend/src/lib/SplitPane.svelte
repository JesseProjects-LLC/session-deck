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
  } = $props();

  let resizing = $state(false);
  let containerEl = $state(null);

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
</script>

{#if node.session}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="pane-leaf"
    role="group"
    style="flex: {node.size || 1}"
    onclick={() => onFocus(nodeId(node))}
  >
    <Terminal
      session={node.session}
      host={node.host || 'reliant'}
      focused={focusedId === nodeId(node)}
      zoomed={zoomedId === nodeId(node)}
      onSessionClick={() => handleSessionClick(node.session)}
      onZoom={() => onZoom(nodeId(node), node.session, node.host || 'reliant')}
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
  .pane-leaf { min-width: 0; min-height: 0; overflow: hidden; }
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
</style>
