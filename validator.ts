@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

* { box-sizing: border-box; }

:root {
  --bg-base: #080b12;
  --bg-surface: #0d1117;
  --bg-elevated: #161b27;
  --bg-overlay: #1c2333;
  --border-subtle: #1e2d40;
  --border-default: #243044;
  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --text-muted: #484f58;
  --accent-blue: #388bfd;
  --accent-green: #3fb950;
  --accent-purple: #bc8cff;
  --accent-orange: #f0883e;
  --accent-red: #f85149;
}

body {
  font-family: 'Inter', system-ui, sans-serif;
  background: var(--bg-base);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ── Canvas background ── */
.react-flow {
  background: var(--bg-base) !important;
}

.react-flow__background {
  background: var(--bg-base) !important;
}

/* Dot grid pattern */
.react-flow__background pattern circle {
  fill: #1e2d40 !important;
}

/* ── Node styles ── */
.react-flow__node {
  cursor: grab;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.4));
}
.react-flow__node:active { cursor: grabbing; }
.react-flow__node.selected {
  filter: drop-shadow(0 0 16px rgba(56, 139, 253, 0.3));
}

/* ── Handle styles ── */
.react-flow__handle {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  border: 2px solid var(--bg-base) !important;
}
.react-flow__handle:hover {
  transform: scale(1.6);
  box-shadow: 0 0 8px currentColor;
}

/* ── Edge styles ── */
.react-flow__edge-path {
  transition: stroke-width 0.2s ease, filter 0.2s ease;
}

/* ── Controls ── */
.react-flow__controls {
  background: var(--bg-elevated) !important;
  border: 1px solid var(--border-default) !important;
  border-radius: 10px !important;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4) !important;
}
.react-flow__controls-button {
  background: var(--bg-elevated) !important;
  border-bottom: 1px solid var(--border-subtle) !important;
  color: var(--text-secondary) !important;
  transition: background 0.15s ease, color 0.15s ease !important;
}
.react-flow__controls-button:hover {
  background: var(--bg-overlay) !important;
  color: var(--text-primary) !important;
}
.react-flow__controls-button svg { fill: currentColor !important; }

/* ── MiniMap ── */
.react-flow__minimap {
  background: var(--bg-elevated) !important;
  border: 1px solid var(--border-default) !important;
  border-radius: 10px !important;
  overflow: hidden;
}

/* ── Scrollbars ── */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: #2d3f55; }

/* ── Animations ── */
@keyframes pulse-glow {
  0%, 100% { opacity: 1; box-shadow: 0 0 4px currentColor; }
  50% { opacity: 0.6; box-shadow: 0 0 8px currentColor; }
}

@keyframes slide-in-right {
  from { transform: translateX(20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes packet-travel {
  0% { offset-distance: 0%; opacity: 0; transform: scale(0.5); }
  10% { opacity: 1; transform: scale(1); }
  90% { opacity: 1; transform: scale(1); }
  100% { offset-distance: 100%; opacity: 0; transform: scale(0.5); }
}

.panel-slide-in { animation: slide-in-right 0.2s ease; }
.fade-in { animation: fade-in 0.15s ease; }
.status-pulse { animation: pulse-glow 2s ease-in-out infinite; }

/* ── Glass effect for panels ── */
.glass {
  background: rgba(13, 17, 23, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* ── Glow utilities ── */
.glow-blue { box-shadow: 0 0 20px rgba(56, 139, 253, 0.15), 0 0 40px rgba(56, 139, 253, 0.05); }
.glow-green { box-shadow: 0 0 20px rgba(63, 185, 80, 0.15), 0 0 40px rgba(63, 185, 80, 0.05); }

/* ── Font ── */
code, pre, .font-mono {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}
