# 嘉庆君游台湾：御前争霸

网页版与 macOS 2.5D 单机桌面版共用同一套游戏核心。桌面版使用 Tauri 2 封装，2.5D 表现只在 Tauri 运行环境启用，不修改 V30 的规则、AI 与牌组逻辑。

## macOS 桌面开发

前置环境：Node.js 22、Rust stable、macOS Xcode Command Line Tools。

```bash
npm install
npm test
npm run desktop:dev
```

`desktop:dev` 会先把运行所需的网页静态资源复制到 `desktop-dist/`，然后打开 Tauri 桌面窗口。

## 构建 Mac APP / DMG

本机架构：

```bash
npm run desktop:build
```

Universal（Intel + Apple Silicon）：

```bash
rustup target add aarch64-apple-darwin x86_64-apple-darwin
npm run desktop:build:universal
```

构建前会从 `assets/app-icon-source.png` 自动生成 Tauri 所需的 `.icns`、`.ico` 和 PNG 图标。

主要产物位于：

```text
src-tauri/target/universal-apple-darwin/release/bundle/macos/
src-tauri/target/universal-apple-darwin/release/bundle/dmg/
```

## 桌面版 V1.0 视觉层

- 2.5D 场景景深与轻视差
- 卡牌悬浮、厚度、透视和动态阴影
- 桌面抽牌演出锁与加强版搓牌/翻牌氛围
- 真人玩家宝物电影式演出
- AI 宝物保持无完整宝物演出
- AI 回合区域呼吸与动作反馈
- 桌面音频控制器（支持总音量 / 音乐 / 音效）
- `prefers-reduced-motion` 降级
- 本地静态资源 staging 与离线入口检查

## 重要边界

桌面表现层不直接写入游戏状态。以下核心文件保持原有职责：

```text
src/state.js
src/rules.js
src/ai.js
src/storage.js
```

视觉动画失败时必须静默降级，不允许阻断牌局推进。
