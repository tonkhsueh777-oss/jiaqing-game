# V2 Mac Desktop Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不修改现有线上 V43 规则与页面入口的前提下，建立可运行、可测试、可打包为 Intel + Apple Silicon Universal Mac 应用的 V2 本机端基础工程，并接入 V43 稳定游戏内核，为后续 2.5D 场景与演出提供独立承载层。

**Architecture:** 新增独立 `desktop-v2/`，使用 Tauri 2 作为桌面壳、Vite 作为前端构建、现有 V43 IIFE/`globalThis.JQGame` 代码作为第一阶段规则源，通过专用 adapter 按固定顺序加载，不复制或改写规则。第一阶段只建立桌面壳、核心接入、平台接口、基础三栏 V2 UI 与 Universal Mac 自动构建；PixiJS 2.5D 主舞台在下一份独立计划中加入。

**Tech Stack:** Tauri 2、Rust stable、Vite、Vanilla JavaScript、Vitest、现有 V43 JavaScript game core、GitHub Actions macOS runner。

**Spec:** `docs/superpowers/specs/2026-09-03-v2-mac-desktop-25d-design.md`

## Global Constraints

- 第一目标平台：Mac，同时支持 Intel Mac 与 Apple Silicon Mac。
- 后续必须能复用到 Windows；游戏代码禁止写死 macOS 路径或 Cocoa 专属逻辑。
- 默认窗口模式启动，提供全屏切换；主视觉基准 1920×1080，并适配 1440×900、1680×1050、Retina。
- 现有 V43 回合、AI、计策、王牌、宝物、胜负、存档语义保持不变。
- 现有网页根目录和 GitHub Pages 入口不得被 V2 初始化改写。
- 第一阶段不做重型 3D；后续 2.5D 以轻量图层、WebGL、粒子与已有 H.264 技能视频为主。
- Mac 构建目标使用 `universal-apple-darwin`；CI 同时安装 `aarch64-apple-darwin` 和 `x86_64-apple-darwin` Rust targets。
- 开发阶段允许未签名 `.app` / `.dmg`；Developer ID 签名和 notarization 不属于本计划。

---

## File Structure Locked By This Plan

```text
/desktop-v2/
  package.json                     前端、测试、Tauri 命令
  vite.config.js                   Vite 构建与跨目录 V43 源码访问
  index.html                       V2 桌面入口
  /src/
    main.js                        V2 启动编排
    /core/
      v43-bootstrap.js             按顺序加载现有 V43 核心
      game-adapter.js              V43 对 V2 的稳定接口
    /platform/
      platform-api.js              窗口、设置、存档抽象
      browser-platform.js          浏览器/测试 fallback
      tauri-platform.js            Tauri 实现
    /ui/
      app-shell.js                 V2 基础三栏 UI
      app-shell.css                V2 基础视觉布局
    /state/
      desktop-session.js           V2 会话状态，不修改游戏规则
  /tests/
    v43-bootstrap.test.js
    game-adapter.test.js
    platform-api.test.js
    app-shell.test.js
  /src-tauri/
    Cargo.toml
    build.rs
    tauri.conf.json
    capabilities/default.json
    src/main.rs
    src/lib.rs
  /scripts/
    verify-v43-boundary.mjs         防止 V2 误改线上核心
/.github/workflows/
  desktop-v2-macos.yml             Universal Mac CI 构建
```

---

### Task 1: Scaffold isolated Tauri/Vite desktop project

**Files:**
- Create: `desktop-v2/package.json`
- Create: `desktop-v2/vite.config.js`
- Create: `desktop-v2/index.html`
- Create: `desktop-v2/src/main.js`
- Create: `desktop-v2/src-tauri/Cargo.toml`
- Create: `desktop-v2/src-tauri/build.rs`
- Create: `desktop-v2/src-tauri/src/main.rs`
- Create: `desktop-v2/src-tauri/src/lib.rs`
- Create: `desktop-v2/src-tauri/tauri.conf.json`
- Create: `desktop-v2/src-tauri/capabilities/default.json`
- Test: `desktop-v2/tests/app-shell.test.js`

**Interfaces:**
- Produces: Vite application entry `desktop-v2/src/main.js` and a Tauri window named `main`.
- Produces npm scripts: `dev`, `build`, `test`, `tauri`, `desktop:dev`, `desktop:build:mac`.
- Later tasks consume the `#app` root created by `index.html`.

- [ ] **Step 1: Write the failing smoke test**

```js
// desktop-v2/tests/app-shell.test.js
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

describe('desktop-v2 scaffold', () => {
  it('has an isolated desktop entry and never reuses the root index.html', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    expect(html).toContain('id="app"');
    expect(html).toContain('/src/main.js');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd desktop-v2 && npm test -- --run tests/app-shell.test.js
```

Expected: FAIL because `desktop-v2/package.json` / test runner / entry do not exist yet.

- [ ] **Step 3: Create minimal frontend package and entry**

```json
// desktop-v2/package.json
{
  "name": "jiaqing-game-desktop-v2",
  "private": true,
  "version": "2.0.0-alpha.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run",
    "tauri": "tauri",
    "desktop:dev": "tauri dev",
    "desktop:build:mac": "tauri build --target universal-apple-darwin --bundles app,dmg"
  },
  "dependencies": {
    "@tauri-apps/api": "^2.0.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "vite": "^7.0.0",
    "vitest": "^3.0.0"
  }
}
```

```html
<!-- desktop-v2/index.html -->
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>嘉庆君游台湾：御前争霸 V2</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

```js
// desktop-v2/src/main.js
const root = document.querySelector('#app');
root.textContent = '嘉庆君游台湾：御前争霸 V2';
```

- [ ] **Step 4: Configure Vite and Tauri window**

```js
// desktop-v2/vite.config.js
import { defineConfig, searchForWorkspaceRoot } from 'vite';

export default defineConfig({
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    fs: { allow: [searchForWorkspaceRoot(process.cwd()), '..'] }
  },
  build: { target: 'es2020' }
});
```

```json
// desktop-v2/src-tauri/tauri.conf.json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "嘉庆君游台湾：御前争霸 V2",
  "version": "2.0.0-alpha.1",
  "identifier": "com.redseed.jiaqinggame.v2",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [{
      "label": "main",
      "title": "嘉庆君游台湾：御前争霸 V2",
      "width": 1440,
      "height": 900,
      "minWidth": 1180,
      "minHeight": 720,
      "fullscreen": false,
      "resizable": true,
      "center": true
    }],
    "security": { "csp": null }
  },
  "bundle": {
    "active": true,
    "targets": ["app", "dmg"],
    "macOS": { "minimumSystemVersion": "10.15" }
  }
}
```

```toml
# desktop-v2/src-tauri/Cargo.toml
[package]
name = "jiaqing-game-v2"
version = "2.0.0-alpha.1"
edition = "2021"

[lib]
name = "jiaqing_game_v2_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

```rust
// desktop-v2/src-tauri/src/lib.rs
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running 嘉庆君游台湾 V2");
}
```

```rust
// desktop-v2/src-tauri/src/main.rs
fn main() {
    jiaqing_game_v2_lib::run();
}
```

```rust
// desktop-v2/src-tauri/build.rs
fn main() {
    tauri_build::build()
}
```

```json
// desktop-v2/src-tauri/capabilities/default.json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default desktop capability",
  "windows": ["main"],
  "permissions": ["core:default", "core:window:allow-set-fullscreen", "core:window:allow-is-fullscreen"]
}
```

- [ ] **Step 5: Install dependencies and run tests/build**

Run:

```bash
cd desktop-v2
npm install
npm test
npm run build
```

Expected: tests PASS and Vite build exits 0.

- [ ] **Step 6: Commit**

```bash
git add desktop-v2
git commit -m "feat: scaffold isolated V2 desktop app"
```

---

### Task 2: Load the existing V43 game core without changing it

**Files:**
- Create: `desktop-v2/src/core/v43-bootstrap.js`
- Create: `desktop-v2/src/core/game-adapter.js`
- Test: `desktop-v2/tests/v43-bootstrap.test.js`
- Test: `desktop-v2/tests/game-adapter.test.js`

**Interfaces:**
- `loadV43Core(): Promise<object>` returns `globalThis.JQGame` after ordered side-effect imports.
- `createGameAdapter(game): { createState, beginTurn, legalActions, play, runAiTurn, snapshot }`.
- This task may import root V43 source files, but MUST NOT modify them.

- [ ] **Step 1: Write failing bootstrap test**

```js
// desktop-v2/tests/v43-bootstrap.test.js
import { describe, expect, it } from 'vitest';
import { loadV43Core } from '../src/core/v43-bootstrap.js';

describe('V43 desktop bootstrap', () => {
  it('loads the stable game rules into JQGame', async () => {
    const game = await loadV43Core();
    expect(typeof game.createGameState).toBe('function');
    expect(typeof game.beginTurn).toBe('function');
    expect(typeof game.playTacticCard).toBe('function');
    expect(typeof game.playTrumpCard).toBe('function');
    expect(typeof game.runAiTurn).toBe('function');
  });
});
```

- [ ] **Step 2: Run it and verify failure**

Run:

```bash
cd desktop-v2 && npm test -- --run tests/v43-bootstrap.test.js
```

Expected: FAIL because `v43-bootstrap.js` does not exist.

- [ ] **Step 3: Implement ordered core loading**

```js
// desktop-v2/src/core/v43-bootstrap.js
let loaded;

export async function loadV43Core() {
  if (loaded) return loaded;

  globalThis.JQGame = {};
  await import('../../../src/namespace.js');
  await import('../../../src/catalog.js');
  await import('../../../src/state.js');
  await import('../../../src/rules.js');
  await import('../../../src/ai.js');
  await import('../../../src/storage.js');

  loaded = globalThis.JQGame;
  return loaded;
}
```

- [ ] **Step 4: Write failing adapter contract test**

```js
// desktop-v2/tests/game-adapter.test.js
import { describe, expect, it } from 'vitest';
import { loadV43Core } from '../src/core/v43-bootstrap.js';
import { createGameAdapter } from '../src/core/game-adapter.js';

describe('desktop game adapter', () => {
  it('creates a V43 state and exposes a serializable snapshot', async () => {
    const game = await loadV43Core();
    const adapter = createGameAdapter(game);
    const state = adapter.createState({ rng: () => 0.5 });
    const view = adapter.snapshot(state);

    expect(view.players).toHaveLength(3);
    expect(view.players[0].hand).toHaveLength(3);
    expect(view.winnerId).toBe(null);
  });
});
```

- [ ] **Step 5: Implement minimal adapter**

```js
// desktop-v2/src/core/game-adapter.js
export function createGameAdapter(game) {
  if (!game?.createGameState) throw new Error('V43 core is not loaded');

  return Object.freeze({
    createState: options => game.createGameState(options),
    beginTurn: (state, rng) => game.beginTurn(state, rng),
    legalActions: (state, playerId) => game.getLegalActions(state, playerId),
    runAiTurn: (state, playerId, hooks) => game.runAiTurn(state, playerId, hooks),
    snapshot: state => structuredClone(state),
    play: {
      location: (...args) => game.playLocationCard(...args),
      travel: (...args) => game.playTravelCard(...args),
      inspect: (...args) => game.playInspectCard(...args),
      tactic: (...args) => game.playTacticCard(...args),
      trump: (...args) => game.playTrumpCard(...args),
      swapPass: (...args) => game.passTurnBySwappingCard(...args)
    }
  });
}
```

- [ ] **Step 6: Run adapter tests and root V43 regression tests**

Run:

```bash
cd desktop-v2 && npm test
cd .. && node --test tests/*.test.js
```

Expected: desktop tests PASS; existing root regression suite remains PASS.

- [ ] **Step 7: Commit**

```bash
git add desktop-v2/src/core desktop-v2/tests
git commit -m "feat: bridge V43 game core into desktop V2"
```

---

### Task 3: Add a platform-neutral desktop API for window, settings, and save data

**Files:**
- Create: `desktop-v2/src/platform/platform-api.js`
- Create: `desktop-v2/src/platform/browser-platform.js`
- Create: `desktop-v2/src/platform/tauri-platform.js`
- Test: `desktop-v2/tests/platform-api.test.js`

**Interfaces:**
- `createPlatformApi(driver)` returns exactly:
  - `window.toggleFullscreen(): Promise<boolean>`
  - `window.isFullscreen(): Promise<boolean>`
  - `settings.get(key, fallback): Promise<any>`
  - `settings.set(key, value): Promise<void>`
  - `save.load(): Promise<object|null>`
  - `save.write(state): Promise<void>`
  - `save.clear(): Promise<void>`
- Browser fallback uses `localStorage`; Tauri window implementation uses `@tauri-apps/api/window`.
- No game-rule module imports platform APIs directly.

- [ ] **Step 1: Write failing platform contract test**

```js
// desktop-v2/tests/platform-api.test.js
import { describe, expect, it } from 'vitest';
import { createBrowserPlatform } from '../src/platform/browser-platform.js';

describe('platform api', () => {
  it('persists settings and save state behind one contract', async () => {
    const memory = new Map();
    const platform = createBrowserPlatform({
      storage: {
        getItem: key => memory.get(key) ?? null,
        setItem: (key, value) => memory.set(key, value),
        removeItem: key => memory.delete(key)
      }
    });

    await platform.settings.set('quality', 'low');
    expect(await platform.settings.get('quality', 'standard')).toBe('low');

    await platform.save.write({ turnNumber: 4 });
    expect(await platform.save.load()).toEqual({ turnNumber: 4 });
  });
});
```

- [ ] **Step 2: Verify failure**

Run:

```bash
cd desktop-v2 && npm test -- --run tests/platform-api.test.js
```

Expected: FAIL because platform files do not exist.

- [ ] **Step 3: Implement browser fallback**

```js
// desktop-v2/src/platform/browser-platform.js
export function createBrowserPlatform({ storage = globalThis.localStorage } = {}) {
  const SAVE_KEY = 'jiaqing-v2-save';
  const SETTINGS_PREFIX = 'jiaqing-v2-setting:';

  return {
    window: {
      async toggleFullscreen() {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
        else await document.exitFullscreen?.();
        return Boolean(document.fullscreenElement);
      },
      async isFullscreen() { return Boolean(document.fullscreenElement); }
    },
    settings: {
      async get(key, fallback) {
        const raw = storage.getItem(SETTINGS_PREFIX + key);
        return raw == null ? fallback : JSON.parse(raw);
      },
      async set(key, value) {
        storage.setItem(SETTINGS_PREFIX + key, JSON.stringify(value));
      }
    },
    save: {
      async load() {
        const raw = storage.getItem(SAVE_KEY);
        return raw ? JSON.parse(raw) : null;
      },
      async write(state) { storage.setItem(SAVE_KEY, JSON.stringify(state)); },
      async clear() { storage.removeItem(SAVE_KEY); }
    }
  };
}
```

- [ ] **Step 4: Implement Tauri window driver while preserving same storage semantics initially**

```js
// desktop-v2/src/platform/tauri-platform.js
import { getCurrentWindow } from '@tauri-apps/api/window';
import { createBrowserPlatform } from './browser-platform.js';

export function createTauriPlatform() {
  const base = createBrowserPlatform();
  const appWindow = getCurrentWindow();

  return {
    ...base,
    window: {
      async toggleFullscreen() {
        const next = !(await appWindow.isFullscreen());
        await appWindow.setFullscreen(next);
        return next;
      },
      async isFullscreen() { return appWindow.isFullscreen(); }
    }
  };
}
```

- [ ] **Step 5: Add runtime selector**

```js
// desktop-v2/src/platform/platform-api.js
import { createBrowserPlatform } from './browser-platform.js';
import { createTauriPlatform } from './tauri-platform.js';

export function createPlatformApi() {
  return globalThis.__TAURI_INTERNALS__ ? createTauriPlatform() : createBrowserPlatform();
}
```

- [ ] **Step 6: Run tests**

Run:

```bash
cd desktop-v2 && npm test
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add desktop-v2/src/platform desktop-v2/tests/platform-api.test.js
git commit -m "feat: add cross-platform desktop API"
```

---

### Task 4: Build the first V2 desktop UI shell around the live V43 state

**Files:**
- Create: `desktop-v2/src/ui/app-shell.js`
- Create: `desktop-v2/src/ui/app-shell.css`
- Create: `desktop-v2/src/state/desktop-session.js`
- Modify: `desktop-v2/src/main.js`
- Modify: `desktop-v2/index.html`
- Test: `desktop-v2/tests/app-shell.test.js`

**Interfaces:**
- `createDesktopSession({ adapter, platform }): Promise<DesktopSession>` owns current game state and platform persistence.
- `renderAppShell(root, session)` renders three desktop regions and a placeholder 2.5D stage mount `#v2-stage`.
- Later PixiJS plan consumes `#v2-stage`; this task does not draw 2.5D content.

- [ ] **Step 1: Extend failing UI test**

```js
import { describe, expect, it } from 'vitest';
import { shellMarkup } from '../src/ui/app-shell.js';

describe('V2 desktop shell', () => {
  it('provides the fixed regions needed by the 2.5D version', () => {
    const html = shellMarkup();
    expect(html).toContain('id="v2-left-panel"');
    expect(html).toContain('id="v2-stage"');
    expect(html).toContain('id="v2-hand"');
    expect(html).toContain('id="v2-action-guide"');
    expect(html).toContain('data-action="toggle-fullscreen"');
  });
});
```

- [ ] **Step 2: Verify failure**

Run:

```bash
cd desktop-v2 && npm test -- --run tests/app-shell.test.js
```

Expected: FAIL because `shellMarkup` does not exist.

- [ ] **Step 3: Implement the shell markup**

```js
// desktop-v2/src/ui/app-shell.js
export function shellMarkup() {
  return `
    <main class="v2-shell">
      <aside id="v2-left-panel" class="v2-panel v2-left"></aside>
      <section class="v2-center">
        <div id="v2-stage" class="v2-stage" aria-label="2.5D 主舞台"></div>
        <div id="v2-hand" class="v2-hand" aria-label="玩家手牌"></div>
      </section>
      <aside class="v2-panel v2-right">
        <div id="v2-card-preview"></div>
        <div id="v2-action-guide"></div>
        <div id="v2-actions"></div>
        <button type="button" data-action="toggle-fullscreen">全屏</button>
      </aside>
    </main>`;
}

export function renderAppShell(root) {
  root.innerHTML = shellMarkup();
}
```

- [ ] **Step 4: Add lightweight responsive layout**

```css
/* desktop-v2/src/ui/app-shell.css */
:root { font-family: system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif; background:#06171c; color:#f2e8ca; }
* { box-sizing:border-box; }
html, body, #app { width:100%; height:100%; margin:0; overflow:hidden; }
.v2-shell { height:100%; display:grid; grid-template-columns:minmax(220px,16vw) 1fr minmax(250px,19vw); gap:12px; padding:12px; background:radial-gradient(circle at 50% 42%,#143339,#06171c 66%); }
.v2-center { min-width:0; display:grid; grid-template-rows:minmax(0,1fr) minmax(190px,25vh); gap:12px; }
.v2-panel,.v2-stage,.v2-hand { border:1px solid rgba(207,169,89,.35); border-radius:14px; background:rgba(6,28,31,.82); box-shadow:0 15px 40px rgba(0,0,0,.28); }
.v2-stage { position:relative; min-height:0; overflow:hidden; }
.v2-hand { min-height:180px; }
@media (max-width:1280px) { .v2-shell { grid-template-columns:210px 1fr 240px; gap:8px; padding:8px; } }
```

- [ ] **Step 5: Implement desktop session creation**

```js
// desktop-v2/src/state/desktop-session.js
export async function createDesktopSession({ adapter, platform }) {
  const saved = await platform.save.load();
  const state = saved || adapter.createState();
  return {
    state,
    async save() { await platform.save.write(adapter.snapshot(state)); },
    async newGame() {
      await platform.save.clear();
      this.state = adapter.createState();
      return this.state;
    }
  };
}
```

- [ ] **Step 6: Wire startup**

```js
// desktop-v2/src/main.js
import './ui/app-shell.css';
import { loadV43Core } from './core/v43-bootstrap.js';
import { createGameAdapter } from './core/game-adapter.js';
import { createPlatformApi } from './platform/platform-api.js';
import { createDesktopSession } from './state/desktop-session.js';
import { renderAppShell } from './ui/app-shell.js';

async function boot() {
  const game = await loadV43Core();
  const adapter = createGameAdapter(game);
  const platform = createPlatformApi();
  const session = await createDesktopSession({ adapter, platform });
  const root = document.querySelector('#app');
  renderAppShell(root, session);
  root.querySelector('[data-action="toggle-fullscreen"]')?.addEventListener('click', () => platform.window.toggleFullscreen());
}

boot();
```

- [ ] **Step 7: Run unit tests and frontend build**

Run:

```bash
cd desktop-v2
npm test
npm run build
```

Expected: PASS / exit 0.

- [ ] **Step 8: Commit**

```bash
git add desktop-v2/src desktop-v2/tests desktop-v2/index.html
git commit -m "feat: add V2 desktop game shell"
```

---

### Task 5: Protect the V43 boundary with a verification script

**Files:**
- Create: `desktop-v2/scripts/verify-v43-boundary.mjs`
- Modify: `desktop-v2/package.json`
- Test: reuse root git diff plus existing V43 tests.

**Interfaces:**
- `npm run verify:v43-boundary` exits non-zero if a V2 development commit changes protected online files.
- Protected files for this phase: `index.html`, `src/catalog.js`, `src/state.js`, `src/rules.js`, `src/ai.js`, `src/main.js`, `src/ui.js`, `src/v23-visual-effects.js`.

- [ ] **Step 1: Add boundary script**

```js
// desktop-v2/scripts/verify-v43-boundary.mjs
import { execFileSync } from 'node:child_process';

const protectedPaths = new Set([
  'index.html',
  'src/catalog.js',
  'src/state.js',
  'src/rules.js',
  'src/ai.js',
  'src/main.js',
  'src/ui.js',
  'src/v23-visual-effects.js'
]);

const base = process.env.V43_BASE || '2518d190b4b38d7373aff625039c3f5acccafb85';
const output = execFileSync('git', ['diff', '--name-only', base, '--'], { encoding: 'utf8' });
const changed = output.trim().split('\n').filter(Boolean).filter(path => protectedPaths.has(path));

if (changed.length) {
  console.error(`V2 must not modify protected V43 files:\n${changed.join('\n')}`);
  process.exit(1);
}
console.log('V43 boundary OK');
```

- [ ] **Step 2: Add verification npm script**

Update `desktop-v2/package.json` scripts:

```json
"verify:v43-boundary": "node scripts/verify-v43-boundary.mjs",
"verify": "npm test && npm run build && npm run verify:v43-boundary"
```

- [ ] **Step 3: Run complete verification**

Run:

```bash
cd desktop-v2 && npm run verify
cd .. && node --test tests/*.test.js
```

Expected: V2 tests PASS, Vite build PASS, boundary OK, root V43 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add desktop-v2/scripts desktop-v2/package.json
git commit -m "test: protect stable V43 core during V2 development"
```

---

### Task 6: Add Universal Mac CI packaging

**Files:**
- Create: `.github/workflows/desktop-v2-macos.yml`
- Modify only if needed: `desktop-v2/package.json`

**Interfaces:**
- Workflow dispatch and pushes touching `desktop-v2/**` build a Universal Mac app.
- Artifact name: `jiaqing-game-v2-macos-universal`.
- Artifact must contain the Tauri `bundle/macos/*.app` and generated `.dmg` if bundler succeeds.

- [ ] **Step 1: Create the Mac workflow**

```yaml
# .github/workflows/desktop-v2-macos.yml
name: Build V2 Mac Universal

on:
  workflow_dispatch:
  push:
    paths:
      - 'desktop-v2/**'
      - '.github/workflows/desktop-v2-macos.yml'

jobs:
  build-macos-universal:
    runs-on: macos-latest
    defaults:
      run:
        working-directory: desktop-v2
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: desktop-v2/package-lock.json

      - uses: dtolnay/rust-toolchain@stable
        with:
          targets: aarch64-apple-darwin,x86_64-apple-darwin

      - uses: swatinem/rust-cache@v2
        with:
          workspaces: desktop-v2/src-tauri -> target

      - run: npm ci
      - run: npm run verify
      - run: npm run desktop:build:mac -- --no-sign

      - uses: actions/upload-artifact@v4
        with:
          name: jiaqing-game-v2-macos-universal
          path: |
            desktop-v2/src-tauri/target/universal-apple-darwin/release/bundle/macos/*.app
            desktop-v2/src-tauri/target/universal-apple-darwin/release/bundle/dmg/*.dmg
          if-no-files-found: error
```

- [ ] **Step 2: Validate YAML and local frontend verification**

Run:

```bash
cd desktop-v2 && npm run verify
```

Expected: exit 0 before pushing workflow.

- [ ] **Step 3: Commit and push**

```bash
git add .github/workflows/desktop-v2-macos.yml desktop-v2
git commit -m "ci: build Universal Mac V2 app"
git push
```

- [ ] **Step 4: Verify GitHub Actions result**

Expected workflow state:
- `Build V2 Mac Universal` = completed/success
- artifact `jiaqing-game-v2-macos-universal` exists
- artifact contains `.app`; `.dmg` is expected for the configured bundle targets.

- [ ] **Step 5: Download artifact and confirm bundle architecture on a Mac runner**

Add/run diagnostic during CI if architecture is unclear:

```bash
file src-tauri/target/universal-apple-darwin/release/bundle/macos/*.app/Contents/MacOS/*
```

Expected output contains both `x86_64` and `arm64` architectures.

- [ ] **Step 6: Commit any CI-only correction only after reproducing the exact failure**

If the workflow fails, inspect job logs first and make one minimal correction; rerun until the exact final workflow is green. Do not change V43 game files to fix desktop packaging.

---

## Foundation Acceptance Gate

Before starting the PixiJS / 2.5D visual plan, all of the following must be true:

1. `desktop-v2/` starts in browser development mode.
2. V2 loads live V43 functions through the adapter; no copied fork of game rules exists.
3. A new V43 game state can be created with three players and three-card starting hands.
4. Desktop shell contains left info, center stage mount, bottom hand mount, right action guide, and full-screen control.
5. Window/fullscreen access is behind platform abstraction.
6. `npm run verify` passes.
7. Existing root V43 test suite passes unchanged.
8. V43 protected files show no V2-induced modifications.
9. GitHub Actions builds a Universal Mac artifact containing both `x86_64` and `arm64`.
10. Existing GitHub Pages deployment remains untouched.

## Next Plan After This Gate

Create `docs/superpowers/plans/2026-09-03-v2-25d-stage-implementation.md` covering only:
- PixiJS stage lifecycle
- five-layer 2.5D scene graph
- central imperial desk / map stage
- four location card podiums
- player token rendering and movement
- low-load vs standard render quality
- placeholder art first, final AI/generated art swapped later through an asset manifest

Do not mix special-card cinematic effects or audio into that plan; those are subsequent independently testable plans.
