(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root){root.JQGame=root.JQGame||{};root.JQGame.TurnPacingLogic=api;}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const TIMINGS=Object.freeze({
    aiThinkingMs:1100,
    aiActionLeadMs:360,
    humanHandoffMs:650
  });

  function statusText(player,stage){
    const name=player?.name||'AI玩家';
    if(stage==='thinking') return `${name} · 思考中…`;
    if(stage==='acting') return `${name} · 正在行动`;
    if(stage==='transition') return `${name} · 回合结束，准备下一位…`;
    if(stage==='human') return '轮到你行动';
    return name;
  }

  return {TIMINGS,statusText};
});
