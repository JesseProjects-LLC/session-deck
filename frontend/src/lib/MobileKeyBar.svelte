<script>
  // Touch key accessory bar for the mobile terminal view.
  // Sends raw escape sequences to the active Terminal so TUIs (Claude prompts,
  // menus, vim, etc.) are navigable without a physical keyboard.
  //
  // Buttons use pointerdown + preventDefault so tapping them never steals focus
  // from xterm's hidden textarea — the soft keyboard stays up.

  let { onKey = () => {}, onShowKeyboard = () => {}, onCtrlToggle = () => {} } = $props();

  let ctrlActive = $state(false);

  // Allow the parent (via the Terminal) to clear the sticky Ctrl highlight once
  // a keystroke has consumed it.
  export function clearCtrl() {
    ctrlActive = false;
  }

  // Control / navigation keys
  const ESC = '\x1b';
  const NAV_KEYS = [
    { label: 'Esc', seq: ESC, wide: true },
    { label: 'Tab', seq: '\t' },
    { label: '⌃C', seq: '\x03', title: 'Interrupt (Ctrl-C)' },
    { label: '⌫', seq: '\x7f', title: 'Backspace' },
    { label: '←', seq: ESC + '[D' },
    { label: '↑', seq: ESC + '[A' },
    { label: '↓', seq: ESC + '[B' },
    { label: '→', seq: ESC + '[C' },
    { label: '↵', seq: '\r', accent: true, title: 'Enter' },
  ];

  const NUMBERS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  function tapKey(seq) {
    onKey(seq);
    // A real key press clears any armed Ctrl (the press itself was the target).
    if (ctrlActive) {
      ctrlActive = false;
      onCtrlToggle(false);
    }
  }

  function toggleCtrl() {
    ctrlActive = !ctrlActive;
    onCtrlToggle(ctrlActive);
  }
</script>

<div class="keybar" role="toolbar" aria-label="Terminal key bar" tabindex="-1" onpointerdown={(e) => e.preventDefault()}>
  <div class="keybar-row">
    {#each NAV_KEYS as k}
      <button
        class="key"
        class:wide={k.wide}
        class:accent={k.accent}
        title={k.title || k.label}
        onpointerdown={(e) => { e.preventDefault(); tapKey(k.seq); }}
      >{k.label}</button>
    {/each}
    <button
      class="key ctrl"
      class:armed={ctrlActive}
      title="Ctrl — next key becomes a control char"
      onpointerdown={(e) => { e.preventDefault(); toggleCtrl(); }}
    >Ctrl</button>
    <button
      class="key kbd"
      title="Show keyboard"
      onpointerdown={(e) => { e.preventDefault(); onShowKeyboard(); }}
    >⌨</button>
  </div>
  <div class="keybar-row numbers">
    {#each NUMBERS as n}
      <button
        class="key num"
        onpointerdown={(e) => { e.preventDefault(); tapKey(n); }}
      >{n}</button>
    {/each}
  </div>
</div>

<style>
  .keybar {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 5px 6px;
    background: #11161d;
    border-top: 1px solid #1e2530;
    /* Respect the iOS home-indicator safe area */
    padding-bottom: calc(5px + env(safe-area-inset-bottom, 0px));
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
  }
  .keybar-row {
    display: flex;
    gap: 4px;
  }
  .key {
    flex: 1;
    min-width: 0;
    height: 38px;
    border: 1px solid #232c38;
    border-radius: 6px;
    background: #1a212b;
    color: #c5cdd9;
    font-family: 'JetBrains Mono', monospace;
    font-size: 15px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-tap-highlight-color: transparent;
    cursor: pointer;
    transition: background 0.08s, transform 0.08s;
  }
  .key:active {
    background: #2a3340;
    transform: scale(0.94);
  }
  .key.wide { flex: 1.4; }
  .key.accent {
    background: var(--accent-bg-strong, rgba(249,115,22,0.15));
    border-color: var(--accent-border-strong, rgba(249,115,22,0.3));
    color: var(--accent, #F97316);
  }
  .key.ctrl.armed {
    background: var(--accent, #F97316);
    border-color: var(--accent, #F97316);
    color: #0b0e11;
    font-weight: 700;
  }
  .key.kbd { flex: 0.9; font-size: 18px; }
  .key.num { font-size: 16px; }
  .numbers .key { height: 34px; }
</style>
