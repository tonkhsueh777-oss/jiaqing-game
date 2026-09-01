# 《嘉庆君游台湾》macOS 2.5D Desktop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不修改 V30 游戏规则、AI、牌组与版面关系的前提下，把现有网页游戏升级为可离线安装的 macOS 2.5D 单机桌面游戏，并产出 `.app` / `.dmg`。

**Architecture:** 保留现有 HTML/CSS/JavaScript 游戏核心，新增独立桌面表现层与 Tauri 2 壳层。桌面表现层只消费游戏状态与日志，不直接改写规则状态；普通网页继续使用现有 V30 表现，桌面模式通过 `window.__TAURI__` 与 `body.desktop-mode` 启用 2.5D 效果。构建时先把静态前端复制到 `desktop-dist/`，Tauri 只打包该目录，避免把仓库源码与文档误带入安装包。

**Tech Stack:** Tauri 2、Rust、Vanilla HTML/CSS/JavaScript、CSS 3D transforms、Canvas 2D 轻量粒子、Web Audio/HTMLAudioElement、Node `node:test`

**Spec:** `docs/superpowers/specs/2026-09-01-jiaqing-macos-2_5d-desktop-design.md`

## Global Constraints

- V1.0 不修改游戏胜负条件、牌张数量、牌面规则、AI 决策、玩家回合流程、四张地牌基本布局关系、手牌上限与补牌规则。
- 真人玩家宝物继续触发完整大演出；AI 宝物只允许轻量反馈，不触发全屏宝物演出。
- 网页版 V30 必须继续可用，桌面增强只能在桌面运行时启用。
- 所有运行资源必须本地打包；断网后游戏仍可完整运行。
- 视觉层异常不能阻断游戏状态推进。
- 默认目标 60 fps；低性能或 `prefers-reduced-motion` 下减少视差、粒子与镜头运动。
- V1.0 不引入 Unity、Godot、物理引擎或全量 Three.js 场景。
- Tauri 2 使用 `app.withGlobalTauri: true`，Vanilla JS 通过 `window.__TAURI__` 识别桌面运行时。
- macOS 目标产物为 `.app` 与 `.dmg`；最终验证 Universal 构建，覆盖 Intel 与 Apple Silicon。

---

## File Structure

### 新增

- `package.json`：桌面开发、测试、静态资源 staging、Tauri build 命令。
- `scripts/build-desktop-dist.mjs`：把运行必需静态文件复制到 `desktop-dist/`。
- `.gitignore`：忽略 `node_modules/`、`desktop-dist/`、`src-tauri/target/`。
- `src/desktop-runtime.js`：桌面环境判定、降级策略、body class 初始化。
- `src/desktop-scene.js`：牌桌视差、场景深度、全局 Canvas 特效层。
- `src/desktop-card-motion.js`：卡牌悬停、透视、厚度、复位。
- `src/desktop-draw-cinematic.js`：抽牌/翻牌演出协调，不直接抽牌或改状态。
- `src/desktop-treasure-cinematic.js`：真人宝物完整演出队列与 AI 轻量反馈接口。
- `src/desktop-ai-cinematic.js`：AI 回合动作可视化。
- `src/desktop-audio.js`：环境音、操作音、重要事件音量控制与安全播放。
- `desktop-2_5d.css`：所有桌面模式 2.5D 样式。
- `tests/desktop-runtime.test.js`：桌面环境与 reduced-motion 判定。
- `tests/desktop-cinematics.test.js`：宝物与演出队列纯逻辑测试。
- `tests/desktop-staging.test.js`：静态 staging 文件清单测试。
- `src-tauri/Cargo.toml`：Tauri Rust 依赖。
- `src-tauri/build.rs`：Tauri build helper。
- `src-tauri/src/lib.rs`：Tauri app builder。
- `src-tauri/src/main.rs`：桌面应用入口。
- `src-tauri/tauri.conf.json`：窗口、bundle、frontendDist、全局 API 配置。
- `src-tauri/capabilities/default.json`：最小桌面权限。
- `src-tauri/icons/`：后续放置正式 app icon；初始阶段可使用 Tauri 生成占位图标。

### 修改

- `index.html`：仅新增桌面 CSS/JS 引用和桌面效果根层，不改变现有布局节点与规则脚本顺序。
- `src/v23-visual-effects-logic.js`：如需要，只新增纯事件映射 helper；保留 `shouldShowTreasureGain()` 现有语义。
- `src/v23-visual-effects.js`：把现有真人宝物事件桥接到新的桌面 cinematic，网页模式沿用现有效果。
- `src/v22-draw-ritual-ui.js`：只加入桌面演出 hook，不改变 `draw-ritual.js` 的阈值与规则。
- `src/main.js`：仅负责桌面模块初始化，不加入视觉细节。

---

### Task 1: 建立桌面 staging 与 Tauri 2 壳层

**Files:**
- Create: `package.json`
- Create: `scripts/build-desktop-dist.mjs`
- Create: `.gitignore`
- Create: `tests/desktop-staging.test.js`
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/build.rs`
- Create: `src-tauri/src/lib.rs`
- Create: `src-tauri/src/main.rs`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/capabilities/default.json`

**Interfaces:**
- Consumes: 现有根目录 `index.html`、CSS、`src/`、`assets/`。
- Produces: `npm run desktop:stage`、`npm run desktop:dev`、`npm run desktop:build`；Tauri `frontendDist` 指向 `../desktop-dist`。

- [ ] **Step 1: 写 staging 失败测试**

```js
// tests/desktop-staging.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'desktop-dist');

test('desktop staging contains runtime files but excludes repository internals', () => {
  assert.equal(fs.existsSync(path.join(dist, 'index.html')), true);
  assert.equal(fs.existsSync(path.join(dist, 'src', 'main.js')), true);
  assert.equal(fs.existsSync(path.join(dist, 'assets')), true);
  assert.equal(fs.existsSync(path.join(dist, 'src-tauri')), false);
  assert.equal(fs.existsSync(path.join(dist, 'docs')), false);
  assert.equal(fs.existsSync(path.join(dist, '.git')), false);
});
```

- [ ] **Step 2: 运行测试确认先失败**

Run:

```bash
rm -rf desktop-dist
node --test tests/desktop-staging.test.js
```

Expected: FAIL，因为 `desktop-dist/index.html` 尚不存在。

- [ ] **Step 3: 建立 staging 脚本**

```js
// scripts/build-desktop-dist.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const out = path.join(root, 'desktop-dist');

const rootFiles = fs.readdirSync(root, { withFileTypes: true });
const allowedRootFiles = rootFiles
  .filter(entry => entry.isFile())
  .map(entry => entry.name)
  .filter(name => name === 'index.html' || name.endsWith('.css'));

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const file of allowedRootFiles) {
  fs.copyFileSync(path.join(root, file), path.join(out, file));
}

for (const dir of ['src', 'assets']) {
  fs.cpSync(path.join(root, dir), path.join(out, dir), { recursive: true });
}
```

- [ ] **Step 4: 建立 `package.json`**

```json
{
  "name": "jiaqing-game-desktop",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "test": "node --test tests/*.test.js",
    "desktop:stage": "node scripts/build-desktop-dist.mjs",
    "desktop:dev": "npm run desktop:stage && tauri dev",
    "desktop:build": "tauri build --bundles app,dmg",
    "desktop:build:universal": "npm run desktop:stage && tauri build --bundles app,dmg --target universal-apple-darwin"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0"
  }
}
```

- [ ] **Step 5: 建立最小 Tauri Rust 项目**

```toml
# src-tauri/Cargo.toml
[package]
name = "jiaqing-game"
version = "1.0.0"
description = "嘉庆君游台湾：御前争霸"
authors = ["Red Seed Media"]
edition = "2021"

[lib]
name = "jiaqing_game_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

```rust
// src-tauri/build.rs
fn main() {
    tauri_build::build()
}
```

```rust
// src-tauri/src/lib.rs
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running 嘉庆君游台湾");
}
```

```rust
// src-tauri/src/main.rs
fn main() {
    jiaqing_game_lib::run();
}
```

- [ ] **Step 6: 建立 Tauri 配置**

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "嘉庆君游台湾：御前争霸",
  "version": "1.0.0",
  "identifier": "com.redseed.jiaqinggame",
  "build": {
    "beforeBuildCommand": "npm run desktop:stage",
    "frontendDist": "../desktop-dist"
  },
  "app": {
    "withGlobalTauri": true,
    "windows": [
      {
        "title": "嘉庆君游台湾：御前争霸",
        "width": 1440,
        "height": 900,
        "minWidth": 1180,
        "minHeight": 720,
        "resizable": true,
        "fullscreen": false
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": ["app", "dmg"]
  }
}
```

```json
// src-tauri/capabilities/default.json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default desktop capability",
  "windows": ["main"],
  "permissions": ["core:default"]
}
```

- [ ] **Step 7: 建立 `.gitignore`**

```gitignore
node_modules/
desktop-dist/
src-tauri/target/
.DS_Store
```

- [ ] **Step 8: 运行 staging 与测试**

Run:

```bash
npm install
npm run desktop:stage
node --test tests/desktop-staging.test.js
npm test
```

Expected: staging test PASS；现有 Node tests 全部 PASS。

- [ ] **Step 9: 启动开发壳层**

Run:

```bash
npm run desktop:dev
```

Expected: macOS 独立窗口正常打开现有 V30，规则、牌面、音效、响应式逻辑均未改变。

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json scripts/build-desktop-dist.mjs .gitignore tests/desktop-staging.test.js src-tauri
git commit -m "feat: add macOS Tauri desktop shell"
```

---

### Task 2: 桌面运行时判定与安全降级

**Files:**
- Create: `src/desktop-runtime.js`
- Create: `tests/desktop-runtime.test.js`
- Modify: `index.html`
- Modify: `src/main.js`

**Interfaces:**
- Produces: `JQGame.DesktopRuntime.isDesktop(env)`、`prefersReducedMotion(env)`、`applyDesktopMode(document, env)`。
- Later tasks only activate when `document.body.classList.contains('desktop-mode')`。

- [ ] **Step 1: 写失败测试**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const runtime = require('../src/desktop-runtime.js');

test('desktop mode requires the Tauri global', () => {
  assert.equal(runtime.isDesktop({ __TAURI__: {} }), true);
  assert.equal(runtime.isDesktop({}), false);
});

test('reduced motion follows matchMedia', () => {
  const env = { matchMedia: query => ({ matches: query.includes('reduce') }) };
  assert.equal(runtime.prefersReducedMotion(env), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test tests/desktop-runtime.test.js
```

Expected: FAIL with module not found。

- [ ] **Step 3: 实现最小 runtime 模块**

```js
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.JQGame = root.JQGame || {};
    root.JQGame.DesktopRuntime = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function isDesktop(env = globalThis) {
    return Boolean(env && env.__TAURI__);
  }

  function prefersReducedMotion(env = globalThis) {
    return Boolean(env?.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  }

  function applyDesktopMode(doc = globalThis.document, env = globalThis) {
    if (!doc?.body) return false;
    const enabled = isDesktop(env);
    doc.body.classList.toggle('desktop-mode', enabled);
    doc.body.classList.toggle('reduced-motion', enabled && prefersReducedMotion(env));
    return enabled;
  }

  return { isDesktop, prefersReducedMotion, applyDesktopMode };
});
```

- [ ] **Step 4: 在 `index.html` 的现有游戏脚本前载入 runtime**

```html
<script src="src/desktop-runtime.js?v=31"></script>
```

并在 `main.js` 初始化最前面调用：

```js
JQGame.DesktopRuntime?.applyDesktopMode(document, window);
```

- [ ] **Step 5: Run tests**

```bash
node --test tests/desktop-runtime.test.js
npm test
```

Expected: PASS。

- [ ] **Step 6: 浏览器回归检查**

直接打开现有 GitHub Pages，确认 `body.desktop-mode` 不存在，V30 视觉保持不变。

- [ ] **Step 7: Commit**

```bash
git add src/desktop-runtime.js tests/desktop-runtime.test.js index.html src/main.js
git commit -m "feat: add desktop runtime detection"
```

---

### Task 3: 2.5D 场景与卡牌空间交互

**Files:**
- Create: `desktop-2_5d.css`
- Create: `src/desktop-scene.js`
- Create: `src/desktop-card-motion.js`
- Modify: `index.html`

**Interfaces:**
- `DesktopScene.init({ root, reducedMotion })`
- `DesktopScene.destroy()`
- `DesktopCardMotion.bind(container)`
- `DesktopCardMotion.unbind()`

- [ ] **Step 1: 先加入纯数学 helper 测试**

将 `desktop-card-motion.js` 导出：

```js
function tiltFromPointer(x, y, width, height, maxTilt = 5) {
  if (!width || !height) return { x: 0, y: 0 };
  const nx = Math.max(-1, Math.min(1, (x / width - 0.5) * 2));
  const ny = Math.max(-1, Math.min(1, (y / height - 0.5) * 2));
  return { x: -ny * maxTilt, y: nx * maxTilt };
}
```

测试：

```js
const { tiltFromPointer } = require('../src/desktop-card-motion.js');
assert.deepEqual(tiltFromPointer(50, 50, 100, 100), { x: 0, y: 0 });
assert.deepEqual(tiltFromPointer(100, 50, 100, 100), { x: 0, y: 5 });
```

- [ ] **Step 2: 运行测试确认失败，然后实现 helper 并通过**

```bash
node --test tests/desktop-cinematics.test.js
```

- [ ] **Step 3: 加入桌面视觉根层**

在 `#app` 之前新增：

```html
<div id="desktop-scene-layer" class="desktop-scene-layer" aria-hidden="true">
  <div class="desktop-bg-depth desktop-bg-depth--far"></div>
  <div class="desktop-bg-depth desktop-bg-depth--mid"></div>
  <canvas id="desktop-fx-canvas" class="desktop-fx-canvas"></canvas>
</div>
```

并在 `<head>` 末尾新增：

```html
<link rel="stylesheet" href="desktop-2_5d.css?v=31">
```

- [ ] **Step 4: 实现 CSS 3D 基础**

```css
body.desktop-mode {
  overflow: hidden;
  perspective: 1400px;
}

body.desktop-mode .game-shell {
  transform-style: preserve-3d;
}

body.desktop-mode .hand-dashboard [data-card-id],
body.desktop-mode .selected-card-preview [data-card-id],
body.desktop-mode .pile-card {
  transform-style: preserve-3d;
  backface-visibility: hidden;
  will-change: transform, filter;
  transition: transform 180ms ease, filter 180ms ease;
}

body.desktop-mode .desktop-card-hover {
  transform: translateY(-10px) translateZ(18px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg));
  filter: drop-shadow(0 18px 18px rgba(0,0,0,.28));
}

body.desktop-mode.reduced-motion .desktop-card-hover {
  transform: translateY(-4px);
}
```

- [ ] **Step 5: 实现 pointer-based card motion**

`bind(container)` 使用事件委托查找最接近的卡牌节点；pointermove 只写 CSS variables，不修改 DOM 几何或游戏数据。

- [ ] **Step 6: 实现场景轻视差**

标准强度：far 1%、mid 2%、game 3%；reduced-motion 时完全关闭 pointer parallax，只保留静态景深。

- [ ] **Step 7: Run tests and manual check**

```bash
npm test
npm run desktop:dev
```

Expected: 网页模式完全不变；桌面模式卡牌悬停有轻微立体倾斜，点击区域不漂移。

- [ ] **Step 8: Commit**

```bash
git add desktop-2_5d.css src/desktop-scene.js src/desktop-card-motion.js index.html tests/desktop-cinematics.test.js
git commit -m "feat: add 2.5D desktop scene and card motion"
```

---

### Task 4: 桌面抽牌/翻牌 cinematic coordinator

**Files:**
- Create: `src/desktop-draw-cinematic.js`
- Modify: `src/v22-draw-ritual-ui.js`
- Modify: `desktop-2_5d.css`
- Test: `tests/desktop-cinematics.test.js`

**Interfaces:**
- Consumes: `JQGame.DrawRitual.dragProgress()`、`releaseOutcome()`、`dragTilt()`。
- Produces: `DesktopDrawCinematic.createController()`，包含 `begin(payload)`、`finish()`、`isLocked()`。

- [ ] **Step 1: 写“演出锁”失败测试**

```js
const draw = require('../src/desktop-draw-cinematic.js');

test('draw cinematic lock prevents duplicate starts', async () => {
  const controller = draw.createController();
  assert.equal(controller.begin({}), true);
  assert.equal(controller.begin({}), false);
  controller.finish();
  assert.equal(controller.begin({}), true);
});
```

- [ ] **Step 2: 运行确认失败**

```bash
node --test tests/desktop-cinematics.test.js
```

- [ ] **Step 3: 实现最小锁与 hook**

```js
function createController() {
  let locked = false;
  return {
    begin() {
      if (locked) return false;
      locked = true;
      return true;
    },
    finish() { locked = false; },
    isLocked() { return locked; }
  };
}
```

- [ ] **Step 4: 桌面模式把现有揭牌 DOM 升级为 3D 翻转**

流程固定为：牌堆反馈 → 卡牌滑出 → 中央悬停 → Y 轴翻转 → 普通牌飞入手牌 / 宝物交给 Task 5。

禁止在 cinematic 中直接调用规则层“抽牌”；只围绕现有成功抽牌事件做表现。

- [ ] **Step 5: 所有动画使用 `try/finally` 解锁**

```js
try {
  await playDesktopReveal(payload);
} finally {
  controller.finish();
}
```

- [ ] **Step 6: reduced-motion 降级**

reduced-motion 下用 120–180ms 淡入 + 小位移代替完整 3D 翻转。

- [ ] **Step 7: Run full tests and manual rapid-click test**

```bash
npm test
npm run desktop:dev
```

Expected: 快速连点不会重复抽牌；动画异常也会释放锁。

- [ ] **Step 8: Commit**

```bash
git add src/desktop-draw-cinematic.js src/v22-draw-ritual-ui.js desktop-2_5d.css tests/desktop-cinematics.test.js
git commit -m "feat: add desktop draw and reveal cinematic"
```

---

### Task 5: 真人宝物电影演出 + AI 轻量反馈

**Files:**
- Create: `src/desktop-treasure-cinematic.js`
- Modify: `src/v23-visual-effects.js`
- Modify: `index.html`
- Modify: `desktop-2_5d.css`
- Test: `tests/desktop-cinematics.test.js`

**Interfaces:**
- Consumes: `JQGame.VisualEffectsLogic.shouldShowTreasureGain(gain)` 与 `detectTreasureGains(prev, next)`。
- Produces: `enqueueHumanTreasure(gain, meta)`、`showAiTreasure(gain, meta)`、`isPlaying()`。

- [ ] **Step 1: 写队列与真人/AI 分流失败测试**

```js
const treasure = require('../src/desktop-treasure-cinematic.js');

test('human treasures queue in order while AI treasures stay out of full reveal queue', () => {
  const q = treasure.createQueue();
  q.enqueue({ playerId: 'human', treasureId: 'goldSeal', amount: 1 });
  q.enqueue({ playerId: 'human', treasureId: 'sword', amount: 1 });
  assert.equal(q.size(), 2);
  assert.equal(q.enqueue({ playerId: 'ai1', treasureId: 'gun', amount: 1 }), false);
  assert.equal(q.size(), 2);
});
```

- [ ] **Step 2: 实现最小 queue**

队列只接受 `playerId === 'human' && amount > 0`；AI 走单独 `showAiTreasure()`，不进入全屏队列。

- [ ] **Step 3: 在 `index.html` 新增宝物 cinematic 根节点**

```html
<div id="desktop-treasure-cinematic" class="desktop-treasure-cinematic" aria-hidden="true">
  <div class="desktop-treasure-backdrop"></div>
  <div class="desktop-treasure-stage">
    <div class="desktop-treasure-halo"></div>
    <div class="desktop-treasure-object"></div>
    <div class="desktop-treasure-title"></div>
    <div class="desktop-treasure-copy"></div>
  </div>
</div>
```

- [ ] **Step 4: 演出时间线**

固定为：

```text
0–350ms   背景压暗 + 低频 cue
250–900ms 宝物从 scale(.72) / translateY(18px) 升起
700–1900ms 宝物左右轻摆（最大 ±8°）+ halo + 金尘
1600–2500ms 标题/说明进入
2500–3300ms 缩小并飞向玩家宝物栏
3300–3600ms 恢复桌面
```

如果目标宝物栏节点无法定位，最后一步改为淡出，不抛异常。

- [ ] **Step 5: 复用现有宝物事件**

`v23-visual-effects.js` 在桌面模式调用新 cinematic；非桌面模式继续走当前网页表现。不要复制 `shouldShowTreasureGain()` 判断逻辑。

- [ ] **Step 6: AI 宝物反馈**

AI 只显示 250–450ms 的图标/光点飞向 AI 状态区域，不压暗全屏、不改变回合时长主节奏。

- [ ] **Step 7: Run tests and manual validation**

```bash
npm test
npm run desktop:dev
```

Expected: 真人宝物完整演出；AI 宝物无全屏演出；连续获得两件宝物按顺序播放，不重叠。

- [ ] **Step 8: Commit**

```bash
git add src/desktop-treasure-cinematic.js src/v23-visual-effects.js index.html desktop-2_5d.css tests/desktop-cinematics.test.js
git commit -m "feat: add cinematic treasure reveals"
```

---

### Task 6: AI 动作可视化与桌面音频控制

**Files:**
- Create: `src/desktop-ai-cinematic.js`
- Create: `src/desktop-audio.js`
- Modify: `src/v23-visual-effects.js`
- Modify: `index.html`
- Modify: `desktop-2_5d.css`
- Test: `tests/desktop-cinematics.test.js`

**Interfaces:**
- `DesktopAiCinematic.play(event, context)`：接受 `turn | move | location | command | discard | end`。
- `DesktopAudio.play(name, options)`：失败时 resolve/return false，不抛异常阻断游戏。
- `DesktopAudio.setVolumes({ master, music, effects })`：值域 0–1，持久化到 localStorage。

- [ ] **Step 1: 写音量 clamp 与事件优先级测试**

```js
const audio = require('../src/desktop-audio.js');
assert.equal(audio.clampVolume(1.4), 1);
assert.equal(audio.clampVolume(-0.2), 0);
assert.equal(audio.clampVolume(0.4), 0.4);
```

- [ ] **Step 2: 实现安全音频 controller**

```js
async function safePlay(audioElement) {
  try {
    await audioElement?.play?.();
    return true;
  } catch {
    return false;
  }
}
```

所有音频播放必须走安全包装；浏览器自动播放限制或文件缺失不能卡住游戏。

- [ ] **Step 3: AI cinematic 只监听既有分类事件**

复用 `VisualEffectsLogic.classifyLog()`；AI 区域高亮、出牌飞行动画、目标地牌闪光，不加入新的 AI 决策。

- [ ] **Step 4: 先使用轻量本地音频占位结构**

目录约定：

```text
assets/audio/ambient/
assets/audio/cards/
assets/audio/ui/
assets/audio/treasure/
```

若正式音频尚未到位，controller 必须允许对应 URL 不存在时静默降级；不要阻塞 V1.0 其他视觉开发。

- [ ] **Step 5: Run tests and manual check**

```bash
npm test
npm run desktop:dev
```

Expected: AI 行动有短促可见反馈；关闭音效后无播放；音频失败无未捕获异常。

- [ ] **Step 6: Commit**

```bash
git add src/desktop-ai-cinematic.js src/desktop-audio.js src/v23-visual-effects.js index.html desktop-2_5d.css tests/desktop-cinematics.test.js
git commit -m "feat: add desktop AI choreography and audio controller"
```

---

### Task 7: 性能降级、断网与 Web V30 回归

**Files:**
- Modify: `src/desktop-scene.js`
- Modify: `src/desktop-card-motion.js`
- Modify: `src/desktop-treasure-cinematic.js`
- Modify: `desktop-2_5d.css`
- Test: existing tests + `tests/desktop-runtime.test.js`

**Interfaces:**
- `DesktopScene.setQuality('high' | 'reduced')`
- 所有 cinematic 都必须检查 reduced-motion 状态。

- [ ] **Step 1: 加入 reduced-motion 逻辑测试**

测试桌面 runtime 在 reduced-motion 环境下添加 `reduced-motion` class。

- [ ] **Step 2: 限制长期 GPU/CPU 负载**

执行约束：

```text
全局持续 Canvas：最多 1 个
全屏 blur：最多 1 层
宝物大粒子：只在演出时存在
requestAnimationFrame：无动画任务时停止
pointermove：每帧最多处理一次
```

- [ ] **Step 3: 增加 `visibilitychange` 暂停**

窗口隐藏时停止粒子 RAF 与环境动画计时器；恢复时重新启动。

- [ ] **Step 4: 网页模式回归**

在普通浏览器中运行：

```bash
python3 -m http.server 8080
```

访问 `http://localhost:8080`，确认无 `desktop-mode`，V30 UI/规则与手机响应逻辑不受影响。

- [ ] **Step 5: 断网桌面测试**

先运行：

```bash
npm run desktop:stage
npm run desktop:dev
```

断开网络后重新启动 app，确认牌面、图片、脚本、样式、现有本地音效全部可用；开发者工具 Network 不出现必需远程 CDN 请求。

- [ ] **Step 6: 连续多局 smoke test**

至少完成：新游戏 → 真人抽牌 → 真人获宝 → AI 获宝 → 胜负结算 → 再开一局，连续 3 局无 cinematic 锁死。

- [ ] **Step 7: Commit**

```bash
git add src/desktop-scene.js src/desktop-card-motion.js src/desktop-treasure-cinematic.js desktop-2_5d.css tests/desktop-runtime.test.js
git commit -m "perf: add desktop visual fallbacks"
```

---

### Task 8: macOS `.app` / `.dmg` 与 Universal 构建验收

**Files:**
- Modify: `src-tauri/tauri.conf.json`
- Add/Modify: `src-tauri/icons/*`
- Modify: `README.md`

**Interfaces:**
- Produces: `src-tauri/target/release/bundle/macos/*.app`、`src-tauri/target/release/bundle/dmg/*.dmg`，Universal 构建在 `target/universal-apple-darwin/...`。

- [ ] **Step 1: 安装 Rust 双架构 targets**

Apple Silicon 构建机：

```bash
rustup target add aarch64-apple-darwin x86_64-apple-darwin
```

Intel 构建机同样确保两者均存在。

- [ ] **Step 2: 本机 architecture build**

```bash
npm run desktop:build
```

Expected: 生成 `.app` 与 `.dmg`。

- [ ] **Step 3: Universal build**

```bash
npm run desktop:build:universal
```

Expected: 生成 Universal `.app` / `.dmg`；Apple Silicon 与 Intel 都包含在同一 app binary 中。

- [ ] **Step 4: 验证 Universal binary**

```bash
lipo -archs "src-tauri/target/universal-apple-darwin/release/bundle/macos/嘉庆君游台湾：御前争霸.app/Contents/MacOS/jiaqing-game"
```

Expected output 包含：

```text
x86_64 arm64
```

如实际主二进制名称由 Tauri 生成不同名称，先：

```bash
ls "src-tauri/target/universal-apple-darwin/release/bundle/macos/嘉庆君游台湾：御前争霸.app/Contents/MacOS"
```

然后对该文件执行 `lipo -archs`。

- [ ] **Step 5: Gatekeeper 本地检查**

未签名开发构建至少执行：

```bash
codesign -dv --verbose=4 "<app-path>"
```

正式对外发放前另设签名/notarization 子项目；V1.0 本阶段不把 Apple Developer 签名作为视觉开发阻塞项。

- [ ] **Step 6: README 写明开发与构建命令**

必须记录：

```text
npm install
npm test
npm run desktop:dev
npm run desktop:build
npm run desktop:build:universal
```

- [ ] **Step 7: 最终验证**

```bash
npm test
npm run desktop:stage
npm run desktop:build:universal
```

人工验收：

```text
.app 双击启动
.dmg 打开并可拖入 Applications
完全断网可玩
全屏/退出正常
真人宝物完整演出
AI 宝物不播放完整演出
连续三局无卡死
普通网页版 V30 不受影响
```

- [ ] **Step 8: Commit**

```bash
git add src-tauri/tauri.conf.json src-tauri/icons README.md
git commit -m "build: prepare macOS 2.5D desktop release"
```

---

## Plan Self-Review

### Spec coverage

- Tauri macOS 壳层：Task 1、8。
- 离线资源：Task 1、7、8。
- 桌面运行时隔离：Task 2。
- 2.5D 牌桌与卡牌：Task 3。
- 抽牌/翻牌：Task 4。
- 真人宝物完整演出 / AI 静默大演出：Task 5。
- AI 动作可视化：Task 6。
- 音频：Task 6。
- 性能与 reduced-motion：Task 7。
- Universal `.app` / `.dmg`：Task 8。
- 网页 V30 不受影响：Task 2、7、8。

### Type/interface consistency

- Runtime: `isDesktop()` / `prefersReducedMotion()` / `applyDesktopMode()`。
- Card motion: `tiltFromPointer()` / `bind()` / `unbind()`。
- Draw cinematic: `createController()` → `begin()` / `finish()` / `isLocked()`。
- Treasure cinematic: `createQueue()` / `enqueueHumanTreasure()` / `showAiTreasure()` / `isPlaying()`。
- Audio: `clampVolume()` / `play()` / `setVolumes()`。

### Scope control

本计划明确不做：3D 人物、物理引擎、可旋转 3D 大地图、联网、角色走动、完整 Three.js 场景、Apple Developer 正式签名/公证自动化。上述内容需要后续单独规格与计划。