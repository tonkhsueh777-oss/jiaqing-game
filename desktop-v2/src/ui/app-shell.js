export function shellMarkup() {
  return `
    <main class="v2-shell">
      <aside id="v2-left-panel" class="v2-panel v2-left" aria-label="牌局信息">
        <div class="v2-brand">
          <h1>嘉庆君游台湾：御前争霸</h1>
          <p>V2 本机端 · 御案 2.5D 演出版</p>
        </div>
        <section class="v2-section"><span>回合状态</span><strong id="v2-turn-status">准备开局</strong></section>
        <section class="v2-section"><span>玩家一览</span><div id="v2-player-list"></div></section>
        <section class="v2-section"><span>宝物总览</span><div id="v2-treasure-list"></div></section>
        <section class="v2-section"><span>牌堆信息</span><div id="v2-deck-status"></div></section>
        <section class="v2-section v2-log"><span>行动记录</span><div id="v2-action-log"></div></section>
      </aside>

      <section class="v2-center">
        <div id="v2-stage" class="v2-stage" aria-label="2.5D 主舞台">
          <div class="v2-stage-topline">
            <div class="v2-turn-banner"><small>御前战局</small><strong id="v2-stage-turn">你的回合</strong></div>
            <div class="v2-quality" aria-label="画质模式">
              <button type="button" data-quality="standard" class="is-active">标准</button>
              <button type="button" data-quality="low">旧 Mac</button>
            </div>
          </div>
          <div id="v2-stage-canvas-host" class="v2-stage-canvas-host"></div>
        </div>
        <div id="v2-hand" class="v2-hand" aria-label="玩家手牌">
          <div class="v2-hand__label">玩家手牌</div>
          <div id="v2-hand-cards" class="v2-hand__cards"></div>
        </div>
      </section>

      <aside class="v2-panel v2-right" aria-label="当前操作">
        <section class="v2-section v2-preview"><span>牌面预览</span><div id="v2-card-preview">请选择一张手牌</div></section>
        <section class="v2-section v2-guide"><span>行动说明</span><div id="v2-action-guide">读取牌局后显示可执行动作。</div></section>
        <section class="v2-section"><span>可执行动作</span><div id="v2-actions" class="v2-actions"></div></section>
        <div class="v2-utility-actions">
          <button class="v2-button" type="button" data-action="toggle-sound">音效：开</button>
          <button class="v2-button" type="button" data-action="toggle-fullscreen">切换全屏</button>
        </div>
      </aside>
    </main>`;
}

export function renderAppShell(root) {
  root.innerHTML = shellMarkup();
}
