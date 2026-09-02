(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root){root.JQGame=root.JQGame||{};root.JQGame.TurnIndicatorLogic=api;}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const TIMINGS=Object.freeze({
    transitionHoldMs:850,
    actingNoticeMs:620,
    humanNoticeMs:900
  });

  function actorToken(player){
    if(player?.id==='ai1') return '甲';
    if(player?.id==='ai2') return '乙';
    if(player?.id==='human') return '我';
    return '御';
  }

  function presentation(player,stage,nextPlayer=null){
    const actorId=player?.id||null;
    const name=player?.name||'玩家';
    const base={actorId,actorToken:actorToken(player),stage};
    if(stage==='thinking') return {...base,eyebrow:'当前回合',title:`现在轮到 ${name}`,detail:'思考中……'};
    if(stage==='acting') return {...base,eyebrow:'当前回合',title:`${name} 正在行动`,detail:'请看他的动作'};
    if(stage==='transition') return {...base,eyebrow:'回合切换',title:`${name} 回合结束`,detail:nextPlayer?`下一位：${nextPlayer.name}`:'准备下一位'};
    if(stage==='human') return {...base,eyebrow:'你的回合',title:'轮到你了！',detail:'请选择手牌行动'};
    return {...base,eyebrow:'当前回合',title:name,detail:''};
  }

  return {TIMINGS,actorToken,presentation};
});
