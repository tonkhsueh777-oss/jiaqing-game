# 《嘉庆君游台湾》3D 网页卡牌版 — 第一阶段原型

> 独立开发分支：`feature/3d-web-card-prototype-v42`。从已确认的 V42 右栏引导版（commit `088dc79854`）建立，**未修改 main**。

## 目标与当前范围

这不是新游戏规则，而是给现有单机三人网页卡牌游戏替换 3D 视觉棋盘。

- Three.js 网页实时3D棋盘：五个节点（中央起点、台南府城、艋舺、诸罗大营、麻豆古镇）。
- 三名玩家 3D 棋子：位置读取已有 `state.players[].position`，有移动过渡。
- 地点开放：读取 `state.openedLocations`，显示对应地牌图片和模型占位。
- 巡游目标：原 UI 自动计算合法目的地，3D 场景读取原 DOM 高亮目标；点击3D节点会模拟点击原有的目标按钮，仍由原 `game.playTravelCard` 校验。
- 支持鼠标 / 触控旋转、缩放；“切换2D棋盘”按钮作为退路。
- 手牌保持原 V42 逻辑，在 CSS 中增加轻度立体悬浮效果，未重写出牌规则。
- 规则 / AI / 回合 / 宝物胜负判断复用 V42 原程序；3D独立存档键 `jiaqing-webgame-3d-v42`。
- 若 Three.js 组件加载失败，原 2D 页面仍可运行；GPU不支持 WebGL 时亦有 2D 退路。

## 开发架构

| 文件 | 用途 |
|---|---|
| `index.html` | **仅3D分支**引入 Three.js、3D脚本与独立存档键 |
| `src/v3d-board.js` | Three.js 3D场景、可选GLB载入、动画、原UI事件桥接 |
| `v3d-web-board.css` | 3D棋盘覆盖层、2D切换与手牌视觉 |
| `src/rules.js` / `src/ai.js` / `src/main.js` | V42已有规则，**未修改** |

三维效果使用公共CDN引入 Three.js 0.160.1；首次联网载入需要能访问 CDN。部署到中国大陆或离线运行时，建议将 Three.js 依赖改为本地静态资源，以避免 CDN 访问问题。

## 你提供3D模型时怎么替换

建议从AI建模软件导出 **GLB / glTF 2.0**；检查正确朝向、材质贴图、比例和面数。上传位置建议：

```text
assets/3d/locations/tainan.glb
assets/3d/locations/mengxia.glb
assets/3d/locations/zhuluo.glb
assets/3d/locations/madou.glb
assets/3d/characters/jiaqing.glb    (第二阶段)
assets/3d/treasures/...             (第二阶段)
```

第一阶段地点的 GLB 接口已预留：将 `src/v3d-board.js` 的 `CUSTOM_GLB` 改成实际相对路径，例如：

```js
const CUSTOM_GLB = {
  tainan: 'assets/3d/locations/tainan.glb',
  mengxia: 'assets/3d/locations/mengxia.glb',
  zhuluo: 'assets/3d/locations/zhuluo.glb',
  madou: 'assets/3d/locations/madou.glb'
};
```

模型保留原3D底座及点击区域。如果缺模型，页面用内建低模占位呈现，不会影响规则。

## 当前限制与下一步验收

- 本分支还不是公开上线的网站；GitHub Pages 当前正式部署保持不变。若需独立公开试玩，请后续创建专用 3D 仓库或独立部署地址，**不要直接将这个分支合并到正式版 main**。
- 第一阶段的地图建筑为程序占位几何体，未使用定制 GLB 人物；手牌仍是2D图像，只有3D动效。不是完整美术定稿。
- 待实机检查：电脑 Chrome/Safari、手机竖屏；合法目的地点击、轮次推进、AI行动、四圣物胜负、存档与3D/2D切换。
- 尚未确认 GitHub Pages 的公开3D预览网址，也尚未完成实机验收；**不要将当前代码当作已通过测试的正式版本**。
