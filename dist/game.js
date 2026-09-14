(()=>{'use strict';
const $=id=>document.getElementById(id),scene=new THREE.Scene();scene.background=new THREE.Color('#9ecbb8');scene.scale.x=1.3;const camera=new THREE.OrthographicCamera(-24,24,26,-26,.1,180);camera.position.set(0,65,19);camera.lookAt(0,0,0);const renderer=new THREE.WebGLRenderer({antialias:true});const lightDevice=matchMedia('(pointer:coarse)').matches;renderer.setPixelRatio(Math.min(devicePixelRatio,lightDevice?1.25:1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;$('game').appendChild(renderer.domElement);scene.add(new THREE.HemisphereLight(0xffffff,0x77947b,2));const sun=new THREE.DirectionalLight(0xffefd3,2.6);sun.position.set(-16,40,15);sun.castShadow=true;Object.assign(sun.shadow.camera,{left:-40,right:40,top:50,bottom:-50});sun.shadow.mapSize.set(lightDevice?512:1024,lightDevice?512:1024);scene.add(sun);
const mats={};function mat(c){return mats[c]||(mats[c]=new THREE.MeshStandardMaterial({color:c,roughness:.8}))}const cube=new THREE.BoxGeometry(1,1,1),sphere=new THREE.SphereGeometry(1,10,8);function box(w,h,d,c,x=0,y=0,z=0,p=scene){let m=new THREE.Mesh(cube,mat(c));m.scale.set(w,h,d);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;p.add(m);return m}function ball(r,c,x,y,z,p=scene,sx=1,sy=1,sz=1){let m=new THREE.Mesh(sphere,mat(c));m.scale.set(r*sx,r*sy,r*sz);m.position.set(x,y,z);m.castShadow=true;p.add(m);return m}
box(80,.4,160,'#8dbc9b',0,-.35,0);box(16,.12,150,'#53686e',0,0,0);for(let x of [-10.3,10.3]){box(4.6,.22,150,'#e7d6af',x,.04,0);box(.2,.3,150,'#fff2d2',Math.sign(x)*8.15,.1,0)}
const scenery=[];for(let z=-65;z<40;z+=6){for(let x of [-2.65,2.65])scenery.push(box(.16,.025,2.8,'#f4eac9',x,.1,z));for(let x of [-11.5,11.5])scenery.push(box(.035,.03,5.8,'#d1bc94',x,.17,z))}for(let z=-60;z<36;z+=12)for(let s of [-1,1]){let g=new THREE.Group();g.position.set(s*17,0,z);scene.add(g);box(6,2.8,8,s>0?'#e5ad97':'#83a9b1',0,1.4,0,g);box(6.3,.25,8.3,'#ffe6bb',0,2.9,0,g);box(5.3,.12,7.3,'#b59c80',0,3.1,0,g);box(.35,1.7,.35,'#9b7457',-s*3.6,.85,4,g);ball(1,'#50926c',-s*3.6,2.2,4,g);for(let stripe=0;stripe<6;stripe++)box(1.15,.14,.72,stripe%2?'#fff1cc':s>0?'#e56c7f':'#488b9c',-s*3.2,1.65,-2.9+stripe*1.15,g);box(.1,1.1,4.5,'#426b74',-s*3.02,.8,0,g);box(.7,.1,.7,'#52696a',-s*4.5,.12,3,g);for(let k=0;k<3;k++)box(.5,.02,.055,'#293e43',-s*4.5,.19,2.8+k*.17,g);if(z%24===0){const bike=new THREE.Group();bike.position.set(-s*3.8,.3,-4.2);g.add(bike);for(let bz of [-.55,.55])ball(.32,'#38525a',0,0,bz,bike,.2,1,1);box(.14,.45,1,'#dc8356',0,.3,0,bike);box(.5,.08,.1,'#38525a',0,.62,.5,bike)}scenery.push(g)}for(let z of [-35,19]){const crossing=new THREE.Group();crossing.position.z=z;scene.add(crossing);for(let x=-7;x<8;x+=1.4)box(.8,.02,2.8,'#eee8cf',x,.1,0,crossing);scenery.push(crossing)}
// Ground cue compensates for the flight time of a drop.
const cue=new THREE.Group();
function makeBird(color){let g=new THREE.Group();scene.add(g);ball(.56,'#a8b7c7',0,0,0,g,.85,.8,1.25);ball(.36,color,0,.27,-.5,g);ball(.29,'#e4e5db',0,.51,-.6,g);box(.16,.12,.33,'#efbb54',0,.49,-.94,g);for(let s of [-1,1])ball(.055,'#223c48',s*.24,.57,-.7,g);const tail=box(.45,.12,.65,'#536b80',0,0,.62,g);const head=new THREE.Group();for(const part of g.children.slice(1,6))head.add(part);g.add(head);g.scale.setScalar(1.3);let wings=[];for(let s of [-1,1]){let w=new THREE.Group();w.position.set(s*.35,0,0);g.add(w);box(1.1,.13,.65,color,s*.53,0,0,w);box(.25,.1,.55,'#4c657a',s*1.12,0,.1,w);wings.push(w)}let ring=new THREE.Mesh(new THREE.RingGeometry(.7,.8,32),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.2;scene.add(ring);let guide=ring.clone();guide.material=ring.material.clone();guide.scale.set(1.25,1.25,1.25);scene.add(guide);return{g,wings,head,tail,ring,guide,color,x:0,vx:0,queued:0,score:0,hits:0,partialHits:0,directHits:0,shots:0,combo:0,lastHit:-10,cool:0}}
const characters=[
{name:'Crumbs',body:'#a8b7c7',head:'#dce2e7',wing:'#6b8298',neck:'#58a38e',hat:'none',bob:1,tail:1,win:'strut',line:'Another flawless delivery. Probably.'},
{name:'Duchess',body:'#f5eadb',head:'#fff7e8',wing:'#c9b9d8',neck:'#b084cb',hat:'crown',bob:.72,tail:.7,win:'bow',line:'A royal flush. You are welcome.'},
{name:'Spikes',body:'#566071',head:'#747e8e',wing:'#374455',neck:'#ed7087',hat:'mohawk',bob:1.45,tail:1.6,win:'rock',line:'No rules. No clean windscreens.'},
{name:'Captain',body:'#ae9985',head:'#d7c6ae',wing:'#7a6e64',neck:'#da9655',hat:'goggles',bob:.9,tail:1.2,win:'spin',line:'Payload delivered. Snack time.'}
];let selectedCharacters=[0,1];const reducedMotion=matchMedia('(prefers-reduced-motion:reduce)').matches;
function characterIcon(c){return '<img src="assets/characters/'+c.name.toLowerCase()+'.png" alt="" width="1254" height="1254" decoding="async">'}
function applyCharacter(p,index){const c=characters[index];p.character=index;p.g.children[0].material=mat(c.body);p.head.children[0].material=mat(c.neck);p.head.children[1].material=mat(c.head);for(const w of p.wings){w.children[0].material=mat(c.wing);w.children[1].material=mat(p.color)}p.tail.material=mat(c.wing);if(p.accessory)p.head.remove(p.accessory);const a=new THREE.Group();p.head.add(a);p.accessory=a;
if(c.hat==='crown'){box(.55,.12,.43,'#efbf49',0,.83,-.6,a);for(const x of [-.21,0,.21])box(.1,.25,.12,'#efbf49',x,1,-.72,a)}
if(c.hat==='mohawk')for(let i=0;i<4;i++)box(.13,.28+i*.035,.14,'#ed7087',0,.85,-.83+i*.16,a);
if(c.hat==='goggles'){box(.59,.12,.12,'#674d36',0,.58,-.77,a);for(const x of [-.16,.16]){ball(.13,'#e6bb65',x,.6,-.84,a,1,1,.5);ball(.095,'#80cad2',x,.6,-.91,a,1,1,.45)}box(.5,.13,.5,'#e2a357',0,.21,-.5,a);const scarf=box(.2,.1,.65,'#e2a357',-.25,.2,-.13,a);scarf.rotation.z=.3}
p.g.rotation.set(0,0,0);p.head.rotation.set(0,0,0);p.head.position.set(0,0,0);p.tail.rotation.set(0,0,0)}
function renderCharacters(){for(let i=0;i<2;i++){const field=$('character'+i);field.hidden=i>=count;field.querySelector('.character-grid').innerHTML=characters.map((c,j)=>'<button type="button" class="character-choice '+(selectedCharacters[i]===j?'chosen':'')+'" data-character="'+j+'" aria-pressed="'+(selectedCharacters[i]===j)+'" aria-label="Player '+(i+1)+': '+c.name+'"><span class="portrait">'+characterIcon(c)+'</span><strong>'+c.name+'</strong><small>'+({none:'Street strut',crown:'Royal bow',mohawk:'Victory headbang',goggles:'Barrel-roll brag'}[c.hat])+'</small></button>').join('');for(const b of field.querySelectorAll('[data-character]'))b.onclick=()=>{selectedCharacters[i]=+b.dataset.character;renderCharacters();beep(540)}}}
const players=[makeBird('#f47783'),makeBird('#6aafff')];players.forEach((p,i)=>{p.ring.visible=false;applyCharacter(p,selectedCharacters[i])});players[1].g.visible=players[1].ring.visible=players[1].guide.visible=false;
let mode='intro',count=1,time=60,elapsed=0,speed=26,spawnIn=0,base=26,targets=[],drops=[],splats=[],keys=new Set(),best=0,sound=false,visualCues=true,ctx;try{best=+localStorage.getItem('pigeonExpressBest')||0}catch{}$('best').textContent=best;
function beep(f){if(!sound)return;try{ctx ||=new(window.AudioContext||window.webkitAudioContext)();ctx.resume();let o=ctx.createOscillator(),v=ctx.createGain();o.frequency.setValueAtTime(f,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(f*.55,ctx.currentTime+.1);v.gain.setValueAtTime(.06,ctx.currentTime);v.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.12);o.connect(v).connect(ctx.destination);o.start();o.stop(ctx.currentTime+.13)}catch{}}
const trafficPool={Car:[],Motorcycle:[],Person:[],Bicycle:[]},effectPool=[];let hudClock=0;function recycleTarget(t){scene.remove(t.g);t.mark.visible=false;t.react=0;t.g.rotation.set(0,0,0);t.g.position.y=0;trafficPool[t.kind].push(t)}function recycleEffect(m){scene.remove(m);effectPool.push(m)}function effect(r,x,y,z){let m=effectPool.pop();if(!m)m=new THREE.Mesh(sphere,mat('#fff9eb'));m.scale.set(r,r*.06,r);m.position.set(x,y,z);scene.add(m);return m}function spawn(forcedKind){const roll=Math.random();let kind=forcedKind||(roll<.22?'Person':roll<.42?'Bicycle':roll<.62?'Motorcycle':'Car'),g=new THREE.Group(),x=kind==='Person'?(Math.random()<.5?-1:1)*(9+Math.random()*2):kind==='Bicycle'?(Math.random()<.5?-1:1)*7.05:[-5.3,0,5.3][Math.floor(Math.random()*3)];const reused=trafficPool[kind].pop();if(reused){reused.g.position.set(x,0,-43);reused.hit=false;scene.add(reused.g);targets.push(reused);return}g.position.set(x,0,-43);scene.add(g);let points=50,rx=1.15,rz=2,height=1.3;if(kind==='Car'){let c=['#ee7180','#e9c553','#81c8c5','#c3b5ed','#f7e9d0'][Math.floor(Math.random()*5)];box(2.2,.8,4,c,0,.7,0,g);box(1.9,.65,2.1,c,0,1.35,0,g);box(1.75,.05,.7,'#446978',0,1.69,.65,g);box(1.75,.05,.5,'#446978',0,1.69,-.7,g);for(let a of [-1.1,1.1])for(let b of [-1.3,1.3])ball(.36,'#2e424a',a,.4,b,g,.55,1,1);for(let a of [-.7,.7])box(.45,.18,.05,'#fff0b2',a,.8,2.03,g)}else if(kind==='Motorcycle'){points=150;rx=.7;rz=1.2;height=1.5;for(let z of [-.9,.9])ball(.45,'#2e424a',0,.48,z,g,.45,1,1);box(.5,.5,1.65,'#eaa249',0,.75,0,g);box(.9,.1,.15,'#ced8d4',0,1.2,.7,g);ball(.33,'#e85468',0,1.42,-.1,g);box(.5,.65,.6,'#394e6a',0,1.08,-.4,g)}else if(kind==='Bicycle'){points=80;rx=.55;rz=1.15;height=1.8;
for(const z of [-.85,.85]){ball(.43,'#2e424a',0,.46,z,g,.24,1,1);ball(.31,'#dce5d8',0,.46,z,g,.27,1,1)}
box(.12,.12,1.65,'#e9ca54',0,.68,0,g);const frame=box(.13,.7,1.1,'#e9ca54',0,.84,0,g);frame.rotation.x=.28;
box(.48,.12,.5,'#31474c',0,1.1,-.2,g);box(.85,.1,.12,'#31474c',0,1.15,.82,g);
box(.5,.65,.48,'#58bdb0',0,1.48,-.05,g);ball(.28,'#e6b28b',0,1.99,.18,g);ball(.3,'#ffe182',0,2.14,.17,g,1,.65,1);
for(const side of [-1,1]){const leg=box(.17,.54,.18,'#405a75',side*.22,1.04,-.1,g);leg.userData.pedal=side;const arm=box(.13,.14,.65,'#58bdb0',side*.32,1.55,.45,g);arm.rotation.x=.3}
}else{points=100;rx=.65;rz=.65;height=1.5;box(.55,.8,.4,'#e95c76',0,.95,0,g);ball(.3,'#dca578',0,1.65,0,g);for(let a of [-.18,.18])box(.18,.5,.22,'#37516c',a,.35,0,g)}if(kind==='Person'){g.scale.setScalar(1.35);rx*=1.35;rz*=1.35;for(const side of [-1,1]){const arm=box(.17,.6,.18,'#e95c76',side*.42,1.05,0,g);arm.userData.arm=side}}else if(kind==='Motorcycle'){g.scale.setScalar(1.18);rx*=1.18;rz*=1.18}const mark=ball(.95,'#fff9eb',0,height+.3,0,g,1,.06,1);mark.visible=false;targets.push({g,kind,points,rx,rz,height,mark,react:0,hit:false,extra:kind==='Person'?0:kind==='Bicycle'?-4:kind==='Car'?4:8})}
const bursts=[];function splash(x,z,y){for(let i=0;i<7;i++){const a=i*Math.PI*2/7,m=effect(.17,x,y,z);m.scale.setScalar(.17);bursts.push({m,vx:Math.cos(a)*3.5,vz:Math.sin(a)*3.5,vy:3+Math.random()*2,life:.5})}}const flight=.24,birdZ=13;function drop(i){let p=players[i];if(mode!=='playing'||i>=count)return;if(p.cool>0){if(p.cool<=.1)p.queued=.12;return}p.queued=0;p.cool=.3;p.shots++;const radius=p.superUntil>elapsed?2.2:0;let m=effect(radius?.5:.2,p.x,4.8,birdZ);m.scale.setScalar(radius?.5:.2);drops.push({m,i,x:p.x,age:0,radius});beep(220)}function float(t,x,z,color){let v=new THREE.Vector3(x*scene.scale.x,2,z).project(camera),el=document.createElement('div');el.className='float';el.style.color=color;el.textContent=t.replace('Glancing hit ','Glancing hit\n').replace('Bullseye! ','Bullseye!\n');el.style.left=Math.max(0,Math.min(innerWidth-180,(v.x*.5+.5)*innerWidth-90))+'px';el.style.top=(-v.y*.5+.5)*innerHeight+'px';document.body.appendChild(el);setTimeout(()=>el.remove(),1000)}
// The central 60% of each half-extent earns full points; the outer splash area earns half.
function hitQuality(t,x,z,radius=0){const dx=Math.abs(t.g.position.x-x),dz=Math.abs(t.g.position.z-z);if(t.hit||dx>t.rx+.35+radius||dz>t.rz+.65+radius)return 0;return dx<=t.rx*.6+radius*.7&&dz<=t.rz*.6+radius*.7?1:.5}
// Score one target once. Bomb hits use base points and do not count as shots.
function splatTarget(t,p,quality,x,z,multiplier=1){
  if(t.hit)return 0;
  t.hit=true;const earned=Math.round(t.points*quality)*multiplier;p.score+=earned;
  t.mark.visible=true;t.mark.scale.set(quality===.5?.6:.95,.055,quality===.5?.6:.95);
  t.mark.position.x=THREE.MathUtils.clamp((x-t.g.position.x)/t.g.scale.x,-t.rx*.6,t.rx*.6);
  t.react=quality===.5?.4:.75;splash(x,z,t.height);return earned;
}
function impact(d,late=0){
  const p=players[d.i],hits=[];
  for(const t of targets){const q=hitQuality(t,d.x,birdZ+targetSpeed(t)*late,d.radius);if(q)hits.push({t,q})}
  hits.sort((a,b)=>b.q-a.q);if(!d.radius)hits.splice(1);
  if(hits.length){
    p.combo=elapsed-p.lastHit<2?Math.min(5,p.combo+1):1;p.lastHit=elapsed;p.hits++;
    const quality=hits[0].q;if(quality===.5)p.partialHits++;else p.directHits++;
    let earned=0;for(const {t,q} of hits)earned+=splatTarget(t,p,q,d.radius?t.g.position.x:d.x,t.g.position.z,p.combo);
    float((d.radius?'Super splat! ':quality===.5?'Glancing hit ':'Bullseye! ')+'+'+earned+(p.combo>1?' ×'+p.combo:''),d.x,birdZ,p.color);
    beep(quality===.5?330:480+p.combo*100);
  }else{p.combo=0;float('miss',d.x,birdZ,'#fff9eb')}
  splats.push(effect(d.radius?2.7:.48,d.x,.22,birdZ));
}

const hawk=new THREE.Group();scene.add(hawk);hawk.visible=false;ball(.62,'#79553c',0,0,0,hawk,.8,.65,1.65);ball(.4,'#e6c491',0,.2,.85,hawk);box(.3,.18,.44,'#dfa741',0,.12,1.23,hawk);box(.17,.3,.17,'#bc842f',0,-.06,1.38,hawk);for(const side of [-1,1]){ball(.065,'#261c1c',side*.3,.33,1.04,hawk);const wing=box(1.65,.14,.65,'#77513a',side*1.05,0,-.1,hawk);wing.rotation.y=side*.3;for(let j=0;j<3;j++){const feather=box(.7,.1,.19,'#4e382e',side*(1.9+j*.13),0,-.45+j*.22,hawk);feather.rotation.y=side*.5}}box(.65,.12,1,'#543c2f',0,0,-1.12,hawk);
const dangerMat=new THREE.MeshBasicMaterial({color:'#f16b51',transparent:true,opacity:.17,depthWrite:false});const dangerLane=new THREE.Mesh(new THREE.PlaneGeometry(4.4,64),dangerMat);dangerLane.rotation.x=-Math.PI/2;dangerLane.position.set(0,.26,0);dangerLane.visible=false;scene.add(dangerLane);
let hawkPhase='idle',hawkWait=7,hawkWarning=0,hawkStruck=new Set();
function resetHawk(){hawkPhase='idle';hawkWait=7;hawkWarning=0;hawkStruck.clear();hawk.visible=dangerLane.visible=false;$('hawkNotice').hidden=true;players.forEach(p=>{p.invulnerable=0;p.clips=0})}
function warnHawk(x){hawkPhase='warning';hawkWarning=1.3;hawk.position.set(x,5,-32);dangerLane.position.x=x;dangerLane.visible=visualCues;$('hawkNotice').hidden=false;$('hawkNotice').textContent=visualCues?'Hawk incoming! Move out of the orange lane':'Hawk incoming! Watch the sky';hawkStruck.clear();beep(150)}
function updateHawk(dt){for(const p of players)p.invulnerable=Math.max(0,(p.invulnerable||0)-dt);if(hawkPhase==='idle'){hawkWait-=dt*worldScale;if(hawkWait<=0)warnHawk(players[Math.floor(Math.random()*count)].x)}else if(hawkPhase==='warning'){hawkWarning-=dt*worldScale;dangerMat.opacity=reducedMotion?.18:.14+Math.sin(elapsed*8)*.04;if(hawkWarning<=0){hawkPhase='swoop';hawk.visible=true;$('hawkNotice').textContent='Dodge the hawk!'}}else{const oldZ=hawk.position.z;hawk.position.z+=(speed+11*worldScale)*dt;hawk.rotation.z=reducedMotion?0:Math.sin(elapsed*7)*.07;dangerMat.opacity=.09;for(let i=0;i<count;i++){const p=players[i];if(!hawkStruck.has(i)&&!p.invulnerable&&Math.abs(p.x-hawk.position.x)<2.2&&oldZ<=birdZ+1.4&&hawk.position.z>=birdZ-1.4){hawkStruck.add(i);p.invulnerable=1.2;p.clips++;const lost=Math.min(100,p.score);p.score-=lost;p.combo=0;p.lastHit=-10;p.queued=0;float('Clipped! −'+lost,p.x,birdZ,p.color);beep(95)}}if(hawk.position.z>30){hawk.visible=dangerLane.visible=false;hawkPhase='idle';hawkWait=4.5+Math.random()*2;$('hawkNotice').hidden=true}}}

// Pickups activate on contact. Durations use the round clock, which never slows.
const powerTypes={slow:{name:'Slow motion',color:'#67d5e6',icon:'◷'},bomb:{name:'Splat bomb',color:'#ffbd65',icon:'✹'},super:{name:'Super splat',color:'#c5a0f0',icon:'✦'}};
let pickups=[],pickupPool=[],pickupIn=2.5,pickupBag=[],slowUntil=0,worldScale=1,bombUntil=0,powerHudHTML='';
// Shared vector artwork stays crisp in flight and in the menus.
const powerTextures={},pickupTextureLoader=new THREE.TextureLoader();
for(const kind of Object.keys(powerTypes)){
  const texture=pickupTextureLoader.load('assets/pickups/'+kind+'.svg');
  texture.colorSpace=THREE.SRGBColorSpace;powerTextures[kind]=texture;
}
const bombWave=new THREE.Mesh(new THREE.RingGeometry(.82,1,48),new THREE.MeshBasicMaterial({color:'#fff9eb',transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));
bombWave.rotation.x=-Math.PI/2;bombWave.visible=false;scene.add(bombWave);
function targetSpeed(t){return speed+t.extra*worldScale}
function recyclePickup(p){scene.remove(p.g);pickupPool.push(p)}
function spawnPickup(kind,x,z=-34){
  if(!kind){if(!pickupBag.length)pickupBag=Object.keys(powerTypes).sort(()=>Math.random()-.5);kind=pickupBag.pop()}
  if(x===undefined)x=[-9,-5,0,5,9][Math.floor(Math.random()*5)];
  let p=pickupPool.pop();
  if(!p){
    const g=new THREE.Group(),body=ball(.75,'#fff9e9',0,0,0,g,1,.4,1);
    const badge=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,depthWrite:false}));badge.scale.set(2.6,2.6,1);badge.position.y=.6;g.add(badge);p={g,body,badge};
  }
  p.kind=kind;p.body.material=mat(powerTypes[kind].color);p.badge.material.map=powerTextures[kind];p.badge.material.needsUpdate=true;
  p.g.position.set(x,5,z);scene.add(p.g);pickups.push(p);return p;
}
function onScreen(t){const v=new THREE.Vector3(t.g.position.x*scene.scale.x,t.height,t.g.position.z).project(camera);return Math.abs(v.x)<1&&Math.abs(v.y)<1&&Math.abs(v.z)<1}
function activatePickup(kind,i){
  const p=players[i],info=powerTypes[kind];p.score+=50;let earned=50;
  if(kind==='slow')slowUntil=elapsed+10;
  else if(kind==='super')p.superUntil=elapsed+10;
  else{
    for(const t of targets)if(!t.hit&&onScreen(t))earned+=splatTarget(t,p,1,t.g.position.x,t.g.position.z);
    bombUntil=elapsed+.8;bombWave.position.set(p.x,.35,birdZ);bombWave.visible=true;
  }
  float(info.name+'! +'+earned,p.x,birdZ,info.color);
  $('powerAnnouncement').textContent='Player '+(i+1)+': '+info.name+(kind==='bomb'?'!':' for 10 seconds!');
  beep(kind==='bomb'?180:880);hudPowers();
}

// First-time discoveries suspend simulation before the collected power activates.
const discoveryStorageKey='pigeonPowerDiscoveriesV1';
let seenPowers=new Set(),pendingDiscovery=null;
try{const saved=JSON.parse(localStorage.getItem(discoveryStorageKey)||'[]');if(Array.isArray(saved))seenPowers=new Set(saved.filter(kind=>Object.hasOwn(powerTypes,kind)))}catch{}
const discoveryDetails={
  slow:{tagline:'A little breathing room.',description:'Traffic and hawks move at 45% speed. Your steering and drops stay quick.',duration:'10 seconds',scope:'Shared road',note:'The round clock keeps its normal pace once you continue.'},
  bomb:{tagline:'One drop. Total chaos.',description:'Instantly splat every visible street target for its base points. Already splatted targets cannot score twice.',duration:'One big blast',scope:'Visible targets',note:'Your bomb goes off when you continue. Enjoy the mess.'},
  super:{tagline:'Make every drop count.',description:'Your splats spread wider and can hit several nearby targets with one shot.',duration:'10 seconds',scope:'Your drops',note:'The power belongs to the collecting pigeon. Make it count!'}
};
for(const kind of Object.keys(powerTypes)){const art=new Image();art.src='assets/pickups/discovery-'+kind+'.png'}
function discoverPower(kind,i){
  pendingDiscovery={kind,i};mode='discovery';document.body.dataset.mode=mode;
  keys.clear();players.forEach(p=>{p.vx=0;p.queued=0});
  const info=powerTypes[kind],detail=discoveryDetails[kind],dialog=$('discovery');
  dialog.dataset.power=kind;
  $('discoveryTitle').textContent=info.name;
  $('discoveryTagline').textContent=detail.tagline;
  $('discoveryDescription').textContent=detail.description;
  $('discoveryDuration').textContent=detail.duration;
  $('discoveryScope').textContent=detail.scope;
  $('discoveryNote').textContent=detail.note;
  $('discoveryOwner').textContent=(count===2?'P'+(i+1)+' · ':'')+characters[players[i].character].name+' found a new power';
  $('discoveryArt').src='assets/pickups/discovery-'+kind+'.png';
  $('discoveryArt').alt={slow:'A cheeky pigeon flying beside a turquoise stopwatch above a miniature city.',bomb:'A triumphant pigeon unleashing a toy splat bomb over pastel cars.',super:'A proud pigeon beside a giant glowing drop showing its wider splash.'}[kind];
  $('discoveryIcon').src='assets/pickups/'+kind+'.svg';
  dialog.showModal();dialog.scrollTop=0;$('discoveryTitle').focus({preventScroll:true});beep(720);hud();
}
function continueDiscovery(){
  if(mode!=='discovery'||!pendingDiscovery)return;
  const {kind,i}=pendingDiscovery;pendingDiscovery=null;seenPowers.add(kind);
  try{localStorage.setItem(discoveryStorageKey,JSON.stringify([...seenPowers]))}catch{}
  $('discovery').close();keys.clear();mode='playing';document.body.dataset.mode=mode;
  // Start the next frame from now, so reading time never becomes simulation time.
  prev=performance.now();activatePickup(kind,i);hud();$('play').blur();
}
$('discoveryContinue').onclick=continueDiscovery;
$('discovery').addEventListener('cancel',e=>e.preventDefault());

function updatePickups(dt,now){
  pickupIn-=dt;
  if(pickupIn<=0&&elapsed<55&&pickups.length<3){spawnPickup();pickupIn=6+Math.random()*2}
  for(let n=pickups.length-1;n>=0;n--){
    const item=pickups[n],oldZ=item.g.position.z;item.g.position.z+=speed*dt;
    item.g.position.y=5+(reducedMotion?0:Math.sin(now*.004+n)*.2);
    // Swept forward check avoids skipping a collectible between frames.
    if(oldZ<=birdZ+1.3&&item.g.position.z>=birdZ-1.3){
      let winner=-1,distance=Infinity;
      for(let i=0;i<count;i++){const dx=Math.abs(players[i].x-item.g.position.x);if(dx<1.55&&(dx<distance||(dx===distance&&Math.random()<.5))){winner=i;distance=dx}}
      if(winner>=0){if(seenPowers.has(item.kind))activatePickup(item.kind,winner);else discoverPower(item.kind,winner);recyclePickup(item);pickups.splice(n,1);if(mode==='discovery')return;continue}
    }
    if(item.g.position.z>32){recyclePickup(item);pickups.splice(n,1)}
  }
  bombWave.visible=bombUntil>elapsed;
  if(bombWave.visible){const progress=1-(bombUntil-elapsed)/.8;bombWave.scale.setScalar(1+progress*42);bombWave.material.opacity=(1-progress)*.65}
}
function hudPowers(){
  const active=[];
  if(slowUntil>elapsed)active.push({kind:'slow',label:count===2?'Slow motion · both':'Slow motion',remaining:slowUntil-elapsed});
  players.slice(0,count).forEach((p,i)=>{if(p.superUntil>elapsed)active.push({kind:'super',label:(count===2?'P'+(i+1)+' · ':'')+'Super splat',remaining:p.superUntil-elapsed})});
  const html=active.map(a=>'<div class="power-pill '+a.kind+'"><span><img src="assets/pickups/'+a.kind+'.svg" alt="">'+a.label+'</span><b>'+Math.ceil(a.remaining)+'s</b><i style="width:'+a.remaining*10+'%"></i></div>').join('');
  if(html!==powerHudHTML){$('powerStatus').innerHTML=html;powerHudHTML=html}
  $('powerStatus').hidden=!active.length;
}
function resetPowers(){
  pickups.forEach(recyclePickup);pickups=[];pickupIn=2.5;pickupBag=[];slowUntil=0;worldScale=1;bombUntil=0;bombWave.visible=false;
  players.forEach(p=>p.superUntil=0);$('powerAnnouncement').textContent='';hudPowers();
}

function clear(){resetHawk();resetPowers();for(const b of bursts)recycleEffect(b.m);bursts.length=0;document.querySelectorAll('.float').forEach(el=>el.remove());for(let t of targets)recycleTarget(t);for(let d of drops)recycleEffect(d.m);for(let m of splats)recycleEffect(m);targets=[];drops=[];splats=[];keys.clear()}
let countdownElapsed=0,countdownLabel='',pausedMode='playing';
function showCountdown(){const label=countdownElapsed<3?String(3-Math.floor(countdownElapsed)):'GO!';if(label===countdownLabel)return;countdownLabel=label;$('countdownNumber').textContent=label;$('countdownCaption').textContent=label==='GO!'?'Make a mess!':'Get ready';$('countdownNumber').classList.remove('pop');void $('countdownNumber').offsetWidth;$('countdownNumber').classList.add('pop');beep(label==='GO!'?880:440)}
function start(){if(mode==='countdown'||mode==='discovery')return;document.querySelector('.panel .bird').className='bird';clear();visualCues=$('visualCues').checked;time=60;elapsed=0;base=+$('pace').value;speed=base;spawnIn=0;players.forEach((p,i)=>{applyCharacter(p,selectedCharacters[i]);Object.assign(p,{x:count===1?0:i?3:-3,vx:0,queued:0,score:0,hits:0,partialHits:0,directHits:0,shots:0,combo:0,lastHit:-10,cool:0});p.g.visible=i<count;p.guide.visible=false;p.ring.visible=false});mode='countdown';countdownElapsed=0;countdownLabel='';$('countdown').hidden=false;showCountdown();$('play').blur();document.body.dataset.mode=mode;document.body.classList.remove('hide-help');$('overlay').classList.add('hidden');$('pause').textContent='Ⅱ';$('firstLabel').textContent='P1 · '+characters[players[0].character].name;$('secondLabel').textContent=count===2?'P2 · '+characters[players[1].character].name:'Best';$('p2help').hidden=count===1;hud()}
function hud(){hudPowers();$('score').textContent=players[0].score;$('best').textContent=count===2?players[1].score:best;$('time').textContent=Math.ceil(time);$('speed').textContent=Math.round(speed*5)+' km/h';$('charge').style.width=(1-players[0].cool/.3)*100+'%';$('ready').textContent=players[0].cool?'Reloading…':'Tap to drop';$('timerStat').classList.toggle('danger',time<11)}
function finish(){mode='over';resetPowers();hawk.visible=dangerLane.visible=false;$('hawkNotice').hidden=true;document.body.dataset.mode=mode;keys.clear();best=Math.max(best,...players.slice(0,count).map(p=>p.score));try{localStorage.setItem('pigeonExpressBest',best)}catch{}$('title').innerHTML=count===2?(players[0].score===players[1].score?'A messy<br><em>draw!</em>':characters[players[0].score>players[1].score?players[0].character:players[1].character].name+' pigeon<br><em>wins!</em>'):'Special<br><em>delivery.</em>';$('description').textContent=count===2?characters[players[0].character].name+' (P1): '+players[0].score+' · '+characters[players[1].character].name+' (P2): '+players[1].score:players[0].score+' points · '+players[0].hits+' hits · '+(players[0].shots?Math.round(players[0].hits/players[0].shots*100):0)+'% accuracy';const winners=players.slice(0,count).filter(p=>p.score===Math.max(...players.slice(0,count).map(b=>b.score)));document.querySelector('.panel .bird').innerHTML=winners.map(p=>'<span class="victory-bird '+characters[p.character].win+'">'+characterIcon(characters[p.character])+'</span>').join('');$('result').textContent=characters[winners[0].character].line;$('play').textContent='Race again';$('options').hidden=false;$('overlay').classList.remove('hidden');hud()}
function pause(){if(mode==='playing'||mode==='countdown'){pausedMode=mode;$('countdown').hidden=true;mode='paused';document.body.dataset.mode=mode;keys.clear();players.forEach(p=>{p.vx=0;p.queued=0});$('title').innerHTML='Pit<br><em>stop.</em>';$('description').textContent='Take a breather. The road will wait.';$('result').textContent=Math.ceil(time)+' seconds remaining';$('options').hidden=true;$('play').textContent='Resume flight';$('overlay').classList.remove('hidden');$('pause').textContent='▶'}else if(mode==='paused'){mode=pausedMode;if(mode==='countdown'){countdownElapsed=0;countdownLabel='';$('countdown').hidden=false;showCountdown()}$('play').blur();document.body.dataset.mode=mode;$('overlay').classList.add('hidden');$('pause').textContent='Ⅱ'}}
for(let b of document.querySelectorAll('[data-players]'))b.onclick=()=>{count=+b.dataset.players;for(let a of document.querySelectorAll('[data-players]'))a.classList.toggle('selected',a===b);renderCharacters()};renderCharacters();$('play').onclick=()=>mode==='paused'?pause():start();$('pause').onclick=pause;$('sound').onclick=()=>{sound=!sound;$('sound').setAttribute('aria-label',sound?'Mute sound':'Enable sound');$('sound').style.background=sound?'#edc857':'#fff9e9';beep(600)};
window.addEventListener('keydown',e=>{let k=e.key.toLowerCase();if(mode==='discovery'){if((k===' '||k==='enter')&&e.target!==$('discoveryContinue'))e.preventDefault();return}if([' ','arrowleft','arrowright','enter'].includes(k)&&(mode==='playing'||mode==='countdown'))e.preventDefault();keys.add(k);if(e.repeat)return;if(k===' ')drop(0);if(k==='enter')drop(1);if(k==='p')pause()});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();if(mode==='playing'||mode==='countdown')pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&(mode==='playing'||mode==='countdown'))pause()});for(let b of document.querySelectorAll('[data-key]')){b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key)};b.onpointerup=b.onpointercancel=()=>keys.delete(b.dataset.key)}$('drop').onpointerdown=e=>{e.preventDefault();drop(0)};
function resize(){let a=innerWidth/innerHeight,h=Math.max(24,17.3/a);camera.left=-h*a;camera.right=h*a;camera.top=h;camera.bottom=-h;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}window.addEventListener('resize',resize);resize();
function step(dt,now){if(mode==='discovery')return;if(mode==='countdown'){countdownElapsed+=dt;if(countdownElapsed>=3.6){mode='playing';document.body.dataset.mode=mode;$('countdown').hidden=true;dt=0}else showCountdown()}if(mode==='playing'){elapsed+=dt;worldScale=slowUntil>elapsed?.45:1;speed=(base+elapsed*.18)*worldScale;updateHawk(dt);if(elapsed>6)document.body.classList.add('hide-help');time=Math.max(0,60-elapsed);spawnIn-=dt*worldScale;if(spawnIn<=0){spawn();spawnIn=.30+Math.random()*.25}for(let i=0;i<count;i++){let p=players[i],left=i?'arrowleft':'a',right=i?'arrowright':'d';let dir=(keys.has(right)?1:0)-(keys.has(left)?1:0);if(count===1)dir+=(keys.has('arrowright')?1:0)-(keys.has('arrowleft')?1:0);const desired=Math.sign(dir)*19,k=dir?18:24,decay=Math.exp(-k*dt),old=p.vx;p.vx=desired+(old-desired)*decay;p.x+=desired*dt+(old-desired)*(1-decay)/k;p.x=THREE.MathUtils.clamp(p.x,-11.5,11.5);if((p.x===-11.5&&p.vx<0)||(p.x===11.5&&p.vx>0))p.vx=0;p.cool=Math.max(0,p.cool-dt);p.queued=Math.max(0,p.queued-dt);if(p.queued&&p.cool===0)drop(i);p.g.rotation.z=THREE.MathUtils.lerp(p.g.rotation.z,-p.vx/19*.3,1-Math.exp(-14*dt))}for(let o of scenery){o.position.z+=speed*dt;if(o.position.z>43)o.position.z-=108}for(let i=targets.length-1;i>=0;i--){let t=targets[i];t.g.position.z+=targetSpeed(t)*dt;if(t.kind==='Bicycle')for(const part of t.g.children)if(part.userData.pedal)part.rotation.x=Math.sin(elapsed*10+part.userData.pedal*Math.PI/2)*.6;if(t.react>0){t.react=Math.max(0,t.react-dt);const phase=(.75-t.react)*18;t.g.rotation.z=Math.sin(phase)*t.react*.3;if(t.kind==='Person'){t.g.position.y=Math.abs(Math.sin(phase))*t.react*.9;for(const part of t.g.children)if(part.userData.arm)part.rotation.z=part.userData.arm*t.react*2}}else{t.g.rotation.z=0;t.g.position.y=0;for(const part of t.g.children)if(part.userData.arm)part.rotation.z=0}if(t.g.position.z>35){recycleTarget(t);targets.splice(i,1)}}updatePickups(dt,now);if(mode==='discovery')return;for(let i=drops.length-1;i>=0;i--){let d=drops[i];d.age+=dt;d.m.position.y=4.8*(1-Math.pow(d.age/flight,2));if(d.age>=flight){impact(d,d.age-flight);recycleEffect(d.m);drops.splice(i,1)}}for(let i=splats.length-1;i>=0;i--){splats[i].position.z+=speed*dt;if(splats[i].position.z>35){recycleEffect(splats[i]);splats.splice(i,1)}}for(let i=bursts.length-1;i>=0;i--){const b=bursts[i];b.life-=dt;b.vy-=15*dt;b.m.position.x+=b.vx*dt;b.m.position.y+=b.vy*dt;b.m.position.z+=(speed+b.vz)*dt;b.m.scale.setScalar(Math.max(.01,b.life*.34));if(b.life<=0){recycleEffect(b.m);bursts.splice(i,1)}}hudClock+=dt;if(hudClock>=.05){hud();hudClock=0}if(time<=0)finish()}cue.position.z=birdZ-(speed+4*worldScale)*flight;for(let i=0;i<count;i++){let p=players[i];p.g.position.set(p.x,5,birdZ);p.g.scale.setScalar(p.invulnerable&&!reducedMotion?1.3+Math.sin(elapsed*25)*.08:1.3);p.ring.position.x=p.x;p.ring.position.z=birdZ;let nearest=null,distance=Infinity;for(const t of targets){if(t.hit||Math.abs(t.g.position.x-p.x)>t.rx+.35+(p.superUntil>elapsed?2.2:0))continue;const error=Math.abs(t.g.position.z+targetSpeed(t)*flight-birdZ);if(error<distance){distance=error;nearest=t}}const quality=mode==='playing'&&p.cool===0&&nearest?hitQuality(nearest,p.x,birdZ-targetSpeed(nearest)*flight,p.superUntil>elapsed?2.2:0):0;const ready=quality>0,aimColor=quality===1?'#73ffb1':quality===.5?'#ffcf65':p.color;p.guide.position.set(p.x,.24,nearest?birdZ-targetSpeed(nearest)*flight:cue.position.z);p.guide.material.color.set(aimColor);p.guide.scale.setScalar(p.superUntil>elapsed?3.6:ready?1.65:1.25);p.ring.material.color.set(aimColor);p.guide.visible=visualCues&&mode==='playing';if(mode!=='paused'){p.wings.forEach((w,j)=>w.rotation.z=Math.sin(now*.025+i)*.4*(j?1:-1));p.g.position.y+=Math.sin(now*.006)*.08;const personality=characters[p.character];p.head.position.y=reducedMotion?0:Math.sin(now*.011*personality.bob+i)*.09;p.head.rotation.x=reducedMotion?0:Math.sin(now*.011*personality.bob+i)*.09;p.tail.rotation.x=reducedMotion?0:Math.sin(now*.019*personality.tail+i)*.24;if(mode==='over'&&(count===1||p.score===Math.max(...players.map(b=>b.score)))){if(!reducedMotion){const style=characters[p.character].win;p.g.rotation.y=style==='spin'?now*.004:Math.sin(now*.007)*.3;p.g.rotation.x=style==='bow'?Math.sin(now*.005)*.45:0;p.head.rotation.x=style==='rock'?Math.sin(now*.022)*.4:p.head.rotation.x;p.g.position.y+=Math.abs(Math.sin(now*(style==='rock'?.012:.006)))*.6}}else p.g.rotation.y=0}}}
let prev=performance.now();function frame(now){requestAnimationFrame(frame);let remaining=Math.min((now-prev)/1000,.15);while(remaining>0){const dt=Math.min(remaining,1/120);step(dt,now);remaining-=dt;}prev=now;renderer.render(scene,camera)}requestAnimationFrame(frame);
window.pigeonGame={get state(){return{mode,count,time,speed,visualCues,discovery:pendingDiscovery?.kind||null,worldScale,slowRemaining:Math.max(0,slowUntil-elapsed),pickups:pickups.map(p=>({kind:p.kind,x:p.g.position.x,z:p.g.position.z})),hawk:{phase:hawkPhase,x:hawk.position.x,z:hawk.position.z,warning:hawkWarning,laneVisible:dangerLane.visible},targets:targets.map(t=>({kind:t.kind,x:t.g.position.x,z:t.g.position.z,hit:t.hit,extra:t.extra,rx:t.rx,rz:t.rz})),players:players.slice(0,count).map(p=>({character:characters[p.character].name,superRemaining:Math.max(0,(p.superUntil||0)-elapsed),guideVisible:p.guide.visible,clips:p.clips||0,invulnerable:p.invulnerable||0,x:p.x,vx:p.vx,score:p.score,shots:p.shots,hits:p.hits,partialHits:p.partialHits,directHits:p.directHits})),drops:drops.length,pool:Object.fromEntries(Object.entries(trafficPool).map(([k,v])=>[k,v.length])),geometries:renderer.info?.memory?.geometries}},...(new URLSearchParams(location.search).has('test')?{step,spawn,drop,warnHawk,spawnPickup,resetDiscoveries(){seenPowers.clear();try{localStorage.removeItem(discoveryStorageKey)}catch{}},skipDiscoveries(){seenPowers=new Set(Object.keys(powerTypes))},quietPickups(){pickupIn=Infinity;hawkWait=Infinity},placeTarget(kind,x,z){spawn(kind);targets[targets.length-1].g.position.set(x,0,z)},setupTarget(kind,x,z){clear();spawn(kind);targets[0].g.position.set(x,0,z);spawnIn=10;return targets[0].extra}}: {})};
$('visualCues').addEventListener('change',()=>{document.querySelectorAll('[data-cue-help]').forEach(el=>el.hidden=!$('visualCues').checked)});
})();
