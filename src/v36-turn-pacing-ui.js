(function(root){
  const game=root.JQGame;
  const logic=game?.TurnPacingLogic;
  if(!game||!logic||typeof document==='undefined') return;

  const {TIMINGS}=logic;
  const pacingClasses=['turn-pacing--thinking','turn-pacing--acting','turn-pacing--transition','turn-pacing--human'];
  let lastState=null;
  let unlockTimer=null;

  function delay(ms){
    return new Promise(resolve=>setTimeout(resolve,ms));
  }

  function activePlayer(state){
    return state?.players?.[state.currentPlayerIndex]||null;
  }

  function lockHuman(locked){
    document.documentElement.classList.toggle('turn-pacing-lock',Boolean(locked));
  }

  function showStatus(player,stage){
    const banner=document.getElementById('turn-banner');
    if(!banner) return;
    pacingClasses.forEach(name=>banner.classList.remove(name));
    banner.classList.add(`turn-pacing--${stage}`);
    banner.dataset.pacingStage=stage;
    banner.textContent=logic.statusText(player,stage);
  }

  function scheduleHumanHandoff(state){
    const player=activePlayer(state);
    if(!player||player.id!=='human'||state?.winnerId||state?.phase!=='action') return;
    clearTimeout(unlockTimer);
    lockHuman(true);
    showStatus(player,'human');
    unlockTimer=setTimeout(()=>{
      lockHuman(false);
      showStatus(player,'human');
    },TIMINGS.humanHandoffMs);
  }

  if(game.UI?.render){
    const baseRender=game.UI.render.bind(game.UI);
    game.UI.render=function renderV36(state){
      lastState=state;
      return baseRender(state);
    };
  }

  if(game.UI?.setInteractionMode){
    const baseSetInteractionMode=game.UI.setInteractionMode.bind(game.UI);
    game.UI.setInteractionMode=function setInteractionModeV36(mode,payload){
      const result=baseSetInteractionMode(mode,payload);
      if(mode==='idle') scheduleHumanHandoff(lastState);
      return result;
    };
  }

  if(typeof game.runAiTurn==='function'){
    const baseRunAiTurn=game.runAiTurn;
    game.runAiTurn=async function runAiTurnV36(state,playerId,hooks={}){
      const player=state?.players?.find?.(item=>item.id===playerId)||null;
      if(!player||player.kind!=='ai') return baseRunAiTurn.call(this,state,playerId,hooks);

      clearTimeout(unlockTimer);
      lockHuman(true);
      showStatus(player,'thinking');
      await delay(TIMINGS.aiThinkingMs);

      showStatus(player,'acting');
      await delay(TIMINGS.aiActionLeadMs);

      const originalAfterAction=hooks.afterAction;
      const wrappedHooks={
        ...hooks,
        afterAction:async(decision,liveState,result)=>{
          if(originalAfterAction) await originalAfterAction(decision,liveState,result);
          showStatus(player,'transition');
        }
      };

      const result=await baseRunAiTurn.call(this,state,playerId,wrappedHooks);
      showStatus(player,'transition');
      return result;
    };
  }

  game.TurnPacingUI={showStatus,lockHuman,scheduleHumanHandoff};
})(globalThis);
