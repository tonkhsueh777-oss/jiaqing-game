/*
 * 嘉庆君游台湾 | 3D 网页卡牌原型（基于 V42）
 * 仅替换棋盘表现层：原有规则、AI、卡牌操作和 UI 继续运行。
 * Three.js 加载失败时，原 2D 棋盘保持可用。
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const game = window.JQGame;
const container = document.getElementById('board-wrap');
if (!game?.UI || !container) throw new Error('3D 棋盘：找不到原游戏界面');

const POSITIONS = Object.freeze({
  center: [0, 0],
  tainan: [0, -3.05],
  mengxia: [3.48, 0],
  zhuluo: [-3.48, 0],
  madou: [0, 3.05]
});
const TITLES = {center:'中央起点', tainan:'台南府城', mengxia:'艋舺', zhuluo:'诸罗大营', madou:'麻豆古镇'};
// 取得自制 GLB 后填写相应路径；未填写时使用内置的几何占位模型。
const CUSTOM_GLB = {
  tainan: null, // 例如 'assets/3d/locations/tainan.glb'
  mengxia: null,
  zhuluo: null,
  madou: null
};
const COLORS = { human:0xe7bf60, ai1:0xe8796e, ai2:0x78bfe1 };
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x08212a);
scene.fog = new THREE.FogExp2(0x08212a, 0.028);
const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 100);
camera.position.set(0, 9.4, 12.8);
camera.lookAt(0, 0, 0);
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'default' });
} catch (error) {
  console.warn('无法启动 WebGL，保留原版2D棋盘。', error);
}
if (!renderer) {
  // 不隐藏原 2D 棋盘；其余原游戏不受影响。
  throw new Error('浏览器不支持 WebGL');
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.className = 'jq-3d-canvas';
renderer.domElement.setAttribute('aria-label', '可旋转的三维棋盘。选择巡游牌后，点击高亮的地点移动。');
container.prepend(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 9.5;
controls.maxDistance = 19;
controls.minPolarAngle = 0.48;
controls.maxPolarAngle = 1.16;
controls.minAzimuthAngle = -0.65;
controls.maxAzimuthAngle = 0.65;
controls.target.set(0, 0.15, 0);
controls.update();
scene.add(new THREE.HemisphereLight(0xcce8ff, 0x24352e, 2.15));
const sun = new THREE.DirectionalLight(0xffdfac, 3);
sun.position.set(-5, 11, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left = -10; sun.shadow.camera.right = 10;
sun.shadow.camera.top = 10; sun.shadow.camera.bottom = -10;
scene.add(sun);

const mats = {
  board: new THREE.MeshStandardMaterial({color:0x143b3b, roughness:0.66, metalness:0.28}),
  rim: new THREE.MeshStandardMaterial({color:0x8f7040, metalness:0.74, roughness:0.35}),
  gold: new THREE.MeshStandardMaterial({color:0xd3a856, metalness:0.67, roughness:0.32}),
  roof: new THREE.MeshStandardMaterial({color:0x884c3c, roughness:0.8}),
  stone: new THREE.MeshStandardMaterial({color:0x99957b, roughness:0.95}),
  closed: new THREE.MeshStandardMaterial({color:0x52615d, roughness:0.8}),
  route: new THREE.MeshStandardMaterial({color:0x896f41, roughness:0.7, metalness:0.3}),
  blue: new THREE.MeshStandardMaterial({color:0x29798b, roughness:0.55}),
  target: new THREE.MeshStandardMaterial({color:0xffee97,emissive:0xffbd55,emissiveIntensity:.6})
};
function mesh(geometry, material, x=0,y=0,z=0) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true;
  return m;
}
const ground = mesh(new THREE.CylinderGeometry(6.2,6.3,.33,8),mats.rim,0,-.32,0);
ground.rotation.y=Math.PI/8;
scene.add(ground);
const top = mesh(new THREE.CylinderGeometry(6.1,6.15,.18,8),mats.board,0,-.07,0);
top.rotation.y=Math.PI/8;
scene.add(top);
function labelTexture(text) {
  const c=document.createElement('canvas'); c.width=512; c.height=128;
  const ctx=c.getContext('2d');
  ctx.fillStyle='rgba(5,28,32,.91)'; ctx.beginPath();if(ctx.roundRect){ctx.roundRect(6,6,500,116,20);}else{ctx.rect(6,6,500,116);}ctx.fill();
  ctx.strokeStyle='#d7b26e';ctx.lineWidth=4;ctx.stroke();
  ctx.fillStyle='#ffe8b0';ctx.font='bold 44px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,64,465);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
  return texture;
}
function labelSprite(text, x,y,z,w=1.65) {
  const mat=new THREE.SpriteMaterial({map:labelTexture(text),transparent:true,depthWrite:false});
  const sprite=new THREE.Sprite(mat);
  sprite.position.set(x,y,z);sprite.scale.set(w,w*.25,1);
  return sprite;
}
function createBuilding(kind) {
  const g=new THREE.Group();
  // 低模地标占位：后续可用 GLB 替换，底座、逻辑与碰撞区不需要改写。
  const stone=mesh(new THREE.BoxGeometry(.85,.48,.58),mats.stone,0,.38,0);
  g.add(stone);
  if(kind==='zhuluo'){
    for(let i of [-1,1])g.add(mesh(new THREE.CylinderGeometry(.17,.23,.94,6),mats.roof,i*.36,.76,0));
  } else if(kind==='mengxia'){
    for(let i of [-1,0,1])g.add(mesh(new THREE.BoxGeometry(.20,.72+i*.07,.34),mats.stone,i*.27,.75,0));
  } else if(kind==='madou'){
    const dome=mesh(new THREE.SphereGeometry(.35,10,7),mats.gold,0,.83,0);
    dome.scale.y=.7;g.add(dome);
  } else {
    const roof=mesh(new THREE.ConeGeometry(.69,.38,4),mats.roof,0,.90,0);
    roof.rotation.y=Math.PI/4;g.add(roof);
  }
  return g;
}
const PICKABLE=[];
const LOCATION_NODES={};
for(const [id,[x,z]] of Object.entries(POSITIONS)){
  if(id!=='center'){
    const [cx,cz]=POSITIONS.center;
    const points=[new THREE.Vector3(cx,.04,cz),new THREE.Vector3(x,.04,z)];
    const curve=new THREE.LineCurve3(...points);
    const beam=mesh(new THREE.TubeGeometry(curve,1,.055,7,false),mats.route);
    beam.castShadow=false;scene.add(beam);
  }
  const group=new THREE.Group();group.position.set(x,0,z);group.userData.locationId=id;
  const center=id==='center';
  const plinth=mesh(new THREE.CylinderGeometry(center?.99:1.08,center?1.15:1.16,.28,8),center?mats.gold:mats.rim,0,.11,0);
  group.add(plinth);
  const inner=mesh(new THREE.CylinderGeometry(center?.88:.96,center?.89:.97,.09,8),center?mats.blue:mats.board,0,.3,0);
  group.add(inner);
  let placeholder=null;
  if(center){
    placeholder=mesh(new THREE.CylinderGeometry(.20,.31,.66,8),mats.gold,0,.70,0);
    group.add(placeholder);
    group.add(mesh(new THREE.ConeGeometry(.32,.3,8),mats.roof,0,1.2,0));
  } else{
    placeholder=createBuilding(id);
    placeholder.position.y=.24;group.add(placeholder);
  }
  const label=labelSprite(TITLES[id],0,center?1.48:1.83,.60,center?1.6:1.75);
  group.add(label);
  const beacon=mesh(new THREE.TorusGeometry(center?1.0:1.05,.055,5,44),mats.gold,0,.35,0);
  beacon.rotation.x=Math.PI/2;group.add(beacon);
  scene.add(group);
  PICKABLE.push(group);
  LOCATION_NODES[id]={group,inner,placeholder,beacon,card:null,model:null,loaded:false,modelPending:false};
}
const PEOPLE={};
for(const [index,id] of ['human','ai1','ai2'].entries()){
  const group=new THREE.Group();
  const bodyMat=new THREE.MeshStandardMaterial({color:COLORS[id],metalness:.32,roughness:.36});
  group.add(mesh(new THREE.CylinderGeometry(.17,.23,.42,10),bodyMat,0,.23,0));
  group.add(mesh(new THREE.SphereGeometry(.17,12,8),bodyMat,0,.55,0));
  group.add(mesh(new THREE.ConeGeometry(.24,.15,8),mats.gold,0,.76,0));
  group.add(labelSprite(id==='human'?'我':id==='ai1'?'甲':'乙',0,1.07,0,.50));
  group.position.set((index-1)*.35,.4,0);
  group.userData.target=group.position.clone();
  scene.add(group);PEOPLE[id]=group;
}
const texLoader=new THREE.TextureLoader();
const texCache=new Map();
const modelLoader=new GLTFLoader();
function addCustomGLB(id){
  const path=CUSTOM_GLB[id];
  const node=LOCATION_NODES[id];
  if(!path||node.modelPending)return;
  node.modelPending=true;
  modelLoader.load(path,gltf=>{
    const model=gltf.scene;
    const bounds=new THREE.Box3().setFromObject(model);
    const size=bounds.getSize(new THREE.Vector3());
    const max=Math.max(size.x,size.y,size.z)||1;
    model.scale.multiplyScalar(1.0/max);
    bounds.setFromObject(model);
    const center=bounds.getCenter(new THREE.Vector3());
    model.position.sub(center);
    model.position.y-=bounds.min.y-center.y;
    model.position.y+=.32;
    node.group.remove(node.placeholder);
    node.group.add(model);node.model=model;node.loaded=true;
  },undefined,err=>{node.modelPending=false;console.warn('3D模型加载失败，继续使用占位模型：'+path,err)});
}
function cardAtLocation(node,asset) {
  if(node.card){node.group.remove(node.card);node.card.geometry.dispose();node.card.material.dispose();node.card=null;}
  if(!asset)return;
  const card=mesh(new THREE.BoxGeometry(.52,.78,.035),new THREE.MeshStandardMaterial({color:0xf0ddb0,roughness:.7,side:THREE.DoubleSide}),0,.94,-.22);
  node.group.add(card);node.card=card;
  if(texCache.has(asset)){card.material.map=texCache.get(asset);card.material.needsUpdate=true;return;}
  texLoader.load(asset,texture=>{
    texture.colorSpace=THREE.SRGBColorSpace;
    texCache.set(asset,texture);
    if(node.card===card){card.material.map=texture;card.material.needsUpdate=true;}
  },undefined,()=>{});
}
let legalTargets=[];
let lastCardAssets={};
function update(state){
  if(!state||!Array.isArray(state.players))return;
  const humanTurn=state.players[state.currentPlayerIndex]?.id==='human' && state.phase==='action';
  legalTargets=humanTurn?Array.from(document.querySelectorAll('#board-overlay [data-board-target]')).map(b=>b.dataset.boardTarget):[];
  for(const [id,node] of Object.entries(LOCATION_NODES)){
    if(id==='center')continue;
    const opened=Boolean(state.openedLocations?.[id]);
    node.placeholder.visible=opened;
    if(node.model)node.model.visible=opened;
    node.beacon.material=legalTargets.includes(id)?mats.target:mats.gold;
    node.inner.material=opened?mats.board:mats.closed;
    const asset=opened?(state.locationCards?.[id]?.asset||game.LOCATIONS?.[id]?.asset):null;
    if(lastCardAssets[id]!==asset){lastCardAssets[id]=asset;cardAtLocation(node,asset);}
    if(opened)addCustomGLB(id);
  }
  LOCATION_NODES.center.beacon.material=legalTargets.includes('center')?mats.target:mats.gold;
  const groups={};
  for(const p of state.players){(groups[p.position]??=[]).push(p);}
  for(const [id,pos] of Object.entries(PEOPLE)){
    const p=state.players.find(player=>player.id===id);
    if(!p)continue;
    const [x,z]=POSITIONS[p.position]||POSITIONS.center;
    const peers=groups[p.position]||[p];const index=peers.findIndex(q=>q.id===id);
    const offsets=[[-.35,-.25],[.35,-.25],[0,.35]];
    const [dx,dz]=peers.length===1?[0,0]:offsets[index]||[0,0];
    pos.userData.target.set(x+dx,.42,z+dz);
  }
}
const baseRender=game.UI.render.bind(game.UI);
game.UI.render=function renderWith3D(state){const result=baseRender(state);update(state);return result;};
const baseInteraction=game.UI.setInteractionMode.bind(game.UI);
game.UI.setInteractionMode=function interactionWith3D(mode,payload){
  const result=baseInteraction(mode,payload);
  const current=game.loadGame?.();
  if(current)update(current);
  return result;
};
const initial=game.loadGame?.();if(initial)update(initial);
const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();
let pointerDown=null;
function hit(event){
  const box=renderer.domElement.getBoundingClientRect();
  pointer.x=((event.clientX-box.left)/box.width)*2-1;
  pointer.y=-((event.clientY-box.top)/box.height)*2+1;
  raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects(PICKABLE,true);
  if(!hits.length)return null;
  let node=hits[0].object;
  while(node&&!node.userData.locationId)node=node.parent;
  return node?.userData.locationId||null;
}
renderer.domElement.addEventListener('pointerdown',event=>{pointerDown={x:event.clientX,y:event.clientY};});
renderer.domElement.addEventListener('pointermove',event=>{
  const id=hit(event);
  renderer.domElement.style.cursor=(id&&legalTargets.includes(id))?'pointer':'grab';
});
renderer.domElement.addEventListener('pointerup',event=>{
  if(!pointerDown)return;
  const distance=Math.hypot(event.clientX-pointerDown.x,event.clientY-pointerDown.y);
  pointerDown=null;
  if(distance>8)return; // 旋转镜头不触发出牌
  const id=hit(event);
  if(!id||!legalTargets.includes(id))return;
  // 调用现有 UI 绑定的事件，而不是另写一份巡游规则。
  document.querySelector('#board-overlay [data-board-target="'+id+'"]')?.click();
});
function resize(){
  const w=Math.max(1,container.clientWidth),h=Math.max(1,container.clientHeight);
  camera.aspect=w/h;
  camera.zoom=Math.min(1,Math.max(.62,(w/h)*.9));
  camera.updateProjectionMatrix();renderer.setSize(w,h,false);
}
resize();
new ResizeObserver(resize).observe(container);
const switcher=document.createElement('button');
switcher.type='button';switcher.className='jq-3d-toggle';switcher.textContent='切换2D棋盘';
switcher.setAttribute('aria-label','切换2D和3D棋盘');
container.appendChild(switcher);
let enabled=true;
switcher.addEventListener('click',()=>{
  enabled=!enabled;container.classList.toggle('jq-3d-ready',enabled);
  switcher.textContent=enabled?'切换2D棋盘':'切换3D棋盘';
  if(enabled)resize();
});
container.classList.add('jq-3d-ready');
let frame=0;
function animate(){
  requestAnimationFrame(animate);
  if(!enabled)return;
  frame++;
  for(const p of Object.values(PEOPLE)){p.position.lerp(p.userData.target,0.085);}
  for(const [id,node] of Object.entries(LOCATION_NODES)){
    if(legalTargets.includes(id))node.beacon.scale.setScalar(1+Math.sin(frame*.055)*.055);
    else node.beacon.scale.setScalar(1);
  }
  controls.update();renderer.render(scene,camera);
}
animate();
console.info('嘉庆君3D棋盘已载入；规则与 AI 使用原 V42 程序。');
