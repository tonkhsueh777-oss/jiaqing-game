(function(root){
  const game=root.JQGame;
  const logic=game?.TurnIndicatorLogic;
  const pacing=game?.TurnPacingLogic;
  if(!game||!logic||typeof document==='undefined') return;

  const {TIMINGS}=logic;
  let lastState=null;
  let lastRenderedActorId=null;
  let overlayTimer=null;
  let actingTimer=null;

  function delay(ms){
    return new Promise(resolve=>setTimeout(resolve,ms));
  }

  function activePlayer(state){
    return state?.players?.[state.currentPlayerIndex]||null;
  }

  function ensureOverlay(){
    let overlay=document.getElementById('v37-turn-overlay');
    if(overlay) return overlay;
    overlay=document.createElement('div');
    overlay.id='v37-turn-overlay';
    overlay.className='v37-turn-overlay';
    overlay.setAttribute('aria-live','assertive');
    overlay.setAttribute('aria-atomic','true');
    overlay.innerHTML=`
      <div class="v37-turn-card">
        <div class="v37-turn-eyebrow"></div>
        <div class="v37-turn-main">
          <div class="v37-turn-token" aria-hidden="true"></div>
          <div class="v37-turn-copy">
            <strong class="v37-turn-title"></strong>
            <span class="v37-turn-detail"></span>
          </div>
        </div>
        <div class="v37-turn-arrow" aria-hidden="true">↓</div>
      </div>`;
    document.body.appendChild(overlay);
    return overlay;
  }

  function actorSurfaceIds(playerId){
    if(playerId==='ai1') return ['#ai-left .player-card','[data-overview-player="ai1"]','.player-token--ai1'];
    if(playerId==='ai2') return ['#ai-right .player-card','[data-overview-player="ai2"]','.player-token--ai2'];
    if(playerId==='human') return ['.hand-dashboard','[data-overview-player="human"]','.player-token--human'];
    return [];
  }

  function clearActorMarks(){
    document.querySelectorAll('.v37-is-current,.v37-is-inactive').forEach(node=>{
      node.classList.remove('v37-is-current','v37-is-inactive');
    });
    document.querySelectorAll('.v37-current-badge').forEach(node=>node.remove());
  }

  function addCurrentBadge(playerId){
    const selector=playerId==='ai1'?'#ai-left .player-card':playerId==='ai2'?'#ai-right .player-card':playerId==='human'?'.hand-dashboard':null;
    const target=selector?document.querySelector(selector):null;
    if(!target||target.querySelector('.v37-current-badge')) return;
    const badge=document.createElement('span');
    badge.className='v37-current-badge';
    badge.textContent='当前回合';
    target.appendChild(badge);
  }

  function markCurrentPlayer(state,forcedPlayerId=null){
    const currentId=forcedPlayerId||activePlayer(state)?.id;
    if(!currentId) return;
    document.documentElement.dataset.v37Actor=currentId;
    clearActorMarks();

    ['human','ai1','ai2'].forEach(playerId=>{
      actorSurfaceIds(playerId).forEach(selector=>{
        document.querySelectorAll(selector).forEach(node=>node.classList.add(playerId===currentId?'v37-is-current':'v37-is-inactive'));
      });
    });
    addCurrentBadge(currentId);
  }

  function escapeHtml(value){
    return String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function enhanceBanner(player,stage,nextPlayer){
    const banner=document.getElementById('turn-banner');
    if(!banner||!player) return;
    const stateText=stage==='thinking'?'正在思考 ● ● ●':stage==='acting'?'正在行动':stage==='transition'?(nextPlayer?`回合结束 → 下一位：${nextPlayer.name}`:'回合结束，准备下一位'):stage==='human'?'请选择手牌行动':'';
    const currentName=player.id==='human'?'你':player.name;
    banner.classList.add('v37-turn-banner');
    banner.innerHTML=`<span class="v37-banner-label">当前玩家：<strong>${escapeHtml(currentName)}</strong></span><span class="v37-banner-state">${escapeHtml(stateText)}</span>`;
  }

  function showCenter(player,stage,nextPlayer=null){
    if(!player) return;
    const data=logic.presentation(player,stage,nextPlayer);
    const overlay=ensureOverlay();
    clearTimeout(overlayTimer);
    overlay.className=`v37-turn-overlay is-open v37-turn-overlay--${stage} v37-turn-overlay--${data.actorId||'unknown'}`;
    overlay.querySelector('.v37-turn-eyebrow').textContent=data.eyebrow;
    overlay.querySelector('.v37-turn-token').textContent=data.actorToken;
    overlay.querySelector('.v37-turn-title').textContent=data.title;
    overlay.querySelector('.v37-turn-detail').textContent=data.detail;
    overlay.querySelector('.v37-turn-arrow').hidden=stage!=='transition';
    enhanceBanner(player,stage,nextPlayer);

    const hold=stage==='acting'?TIMINGS.actingNoticeMs:stage==='transition'?TIMINGS.transitionHoldMs:stage==='human'?TIMINGS.humanNoticeMs:0;
    if(hold>0){
      overlayTimer=setTimeout(()=>overlay.classList.remove('is-open'),hold);
    }
  }

  function maybeShowRenderedHandoff(state){
    const player=activePlayer(state);
    if(!player||state?.winnerId) return;
    markCurrentPlayer(state);
    if(player.id===lastRenderedActorId) return;
    lastRenderedActorId=player.id;
    if(player.id==='human'&&state.phase==='action') showCenter(player,'human');
    else if(player.kind==='ai'&&state.phase==='action') showCenter(player,'thinking');
  }

  if(game.UI?.render){
    const baseRender=game.UI.render.bind(game.UI);
    game.UI.render=function renderV37(state){
      lastState=state;
      const result=baseRender(state);
      maybeShowRenderedHandoff(state);
      return result;
    };
  }

  if(game.UI?.setInteractionMode){
    const baseSetInteractionMode=game.UI.setInteractionMode.bind(game.UI);
    game.UI.setInteractionMode=function setInteractionModeV37(mode,payload){
      const result=baseSetInteractionMode(mode,payload);
      const player=activePlayer(lastState);
      if(mode==='idle'&&player?.id==='human'&&!lastState?.winnerId&&lastState?.phase==='action'){
        markCurrentPlayer(lastState,'human');
        showCenter(player,'human');
      }
      return result;
    };
  }

  if(typeof game.runAiTurn==='function'){
    const baseRunAiTurn=game.runAiTurn;
    game.runAiTurn=async function runAiTurnV37(state,playerId,hooks={}){
      const player=state?.players?.find?.(item=>item.id===playerId)||null;
      if(!player||player.kind!=='ai') return baseRunAiTurn.call(this,state,playerId,hooks);

      lastState=state;
      markCurrentPlayer(state,playerId);
      showCenter(player,'thinking');
      clearTimeout(actingTimer);
      const thinkMs=pacing?.TIMINGS?.aiThinkingMs||1100;
      actingTimer=setTimeout(()=>{
        markCurrentPlayer(state,playerId);
        showCenter(player,'acting');
      },thinkMs);

      const result=await baseRunAiTurn.call(this,state,playerId,hooks);
      clearTimeout(actingTimer);

      const next=activePlayer(state);
      const nextPlayer=next&&next.id!==playerId?next:null;
      showCenter(player,'transition',nextPlayer);
      if(nextPlayer) markCurrentPlayer(state,nextPlayer.id);
      await delay(TIMINGS.transitionHoldMs);
      if(nextPlayer?.id==='human'&&state.phase==='turnStart'){
        markCurrentPlayer(state,'human');
      }
      return result;
    };
  }

  game.TurnIndicatorUI={showCenter,markCurrentPlayer};
})(globalThis);
