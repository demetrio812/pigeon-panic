(()=>{'use strict';
// Local test drives never read or write the player's real saved progress.
const previewMode=['localhost','127.0.0.1','[::1]'].includes(location.hostname)&&new URLSearchParams(location.search).has('preview');
const gameStorage={getItem:key=>previewMode?null:localStorage.getItem(key),setItem:(key,value)=>{if(!previewMode)localStorage.setItem(key,value)},removeItem:key=>{if(!previewMode)localStorage.removeItem(key)}};

const $=id=>document.getElementById(id),scene=new THREE.Scene();scene.background=new THREE.Color('#9ecbb8');scene.scale.x=1.3;const camera=new THREE.OrthographicCamera(-24,24,26,-26,.1,180);camera.position.set(0,65,19);camera.lookAt(0,0,0);const renderer=new THREE.WebGLRenderer({antialias:true});const lightDevice=matchMedia('(pointer:coarse)').matches;renderer.setPixelRatio(Math.min(devicePixelRatio,lightDevice?1.25:1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;$('game').appendChild(renderer.domElement);scene.add(new THREE.HemisphereLight(0xffffff,0x77947b,2));const sun=new THREE.DirectionalLight(0xffefd3,2.6);sun.position.set(-16,40,15);sun.castShadow=true;Object.assign(sun.shadow.camera,{left:-40,right:40,top:50,bottom:-50});sun.shadow.mapSize.set(lightDevice?512:1024,lightDevice?512:1024);scene.add(sun);
const mats={};function mat(c){return mats[c]||(mats[c]=new THREE.MeshStandardMaterial({color:c,roughness:.8}))}const cube=new THREE.BoxGeometry(1,1,1),sphere=new THREE.SphereGeometry(1,10,8);function box(w,h,d,c,x=0,y=0,z=0,p=scene){let m=new THREE.Mesh(cube,mat(c));m.scale.set(w,h,d);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;p.add(m);return m}function ball(r,c,x,y,z,p=scene,sx=1,sy=1,sz=1){let m=new THREE.Mesh(sphere,mat(c));m.scale.set(r*sx,r*sy,r*sz);m.position.set(x,y,z);m.castShadow=true;p.add(m);return m}
const scenery=[],world=createPigeonWorld({scene,box,ball,scenery,sun});
// Ground cue compensates for the flight time of a drop.
const cue=new THREE.Group();
function makeBird(color){let g=new THREE.Group();scene.add(g);ball(.56,'#a8b7c7',0,0,0,g,.85,.8,1.25);ball(.36,color,0,.27,-.5,g);ball(.29,'#e4e5db',0,.51,-.6,g);box(.16,.12,.33,'#efbb54',0,.49,-.94,g);for(let s of [-1,1])ball(.055,'#223c48',s*.24,.57,-.7,g);const tail=box(.45,.12,.65,'#536b80',0,0,.62,g);const head=new THREE.Group();for(const part of g.children.slice(1,6))head.add(part);g.add(head);g.scale.setScalar(1.3);let wings=[];for(let s of [-1,1]){let w=new THREE.Group();w.position.set(s*.35,0,0);g.add(w);box(1.1,.13,.65,color,s*.53,0,0,w);box(.25,.1,.55,'#4c657a',s*1.12,0,.1,w);wings.push(w)}let ring=new THREE.Mesh(new THREE.RingGeometry(.7,.8,32),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.2;scene.add(ring);let guide=ring.clone();guide.material=ring.material.clone();guide.scale.set(1.25,1.25,1.25);scene.add(guide);return{g,wings,head,tail,ring,guide,color,x:0,vx:0,queued:0,score:0,hits:0,partialHits:0,directHits:0,shots:0,combo:0,lastHit:-10,cool:0}}
const characters=[
{name:'Crumbs',body:'#a8b7c7',head:'#dce2e7',wing:'#6b8298',neck:'#58a38e',hat:'none',bob:1,tail:1,win:'strut',line:'Another flawless delivery. Probably.'},
{name:'Duchess',body:'#f5eadb',head:'#fff7e8',wing:'#c9b9d8',neck:'#b084cb',hat:'crown',bob:.72,tail:.7,win:'bow',line:'A royal flush. You are welcome.'},
{name:'Spikes',body:'#566071',head:'#747e8e',wing:'#374455',neck:'#ed7087',hat:'mohawk',bob:1.45,tail:1.6,win:'rock',line:'No rules. No clean windscreens.'},
{name:'Captain',body:'#ae9985',head:'#d7c6ae',wing:'#7a6e64',neck:'#da9655',hat:'goggles',bob:.9,tail:1.2,win:'spin',line:'Payload delivered. Snack time.'},
{name:'Sunny',body:'#f1deba',head:'#fff0d7',wing:'#cda46e',neck:'#edbf52',hat:'cap',bob:1.3,tail:1.4,win:'strut',line:'Sunshine with a chance of splats.',unlock:25},
{name:'Pebble',body:'#8897b4',head:'#aab9d0',wing:'#596b8b',neck:'#398e9a',hat:'beret',bob:.8,tail:.9,win:'bow',line:'A little art. A lot of attitude.',unlock:60},
{name:'Dove',species:'dove',body:'#fff6e8',head:'#fffdf4',wing:'#e4e8dc',neck:'#d4e2cf',hat:'ribbon',bob:.5,tail:.65,flap:.62,win:'bow',line:'A graceful little disgrace.',unlockPoints:1500},
{name:'Seagull',species:'seagull',body:'#f6f4e8',head:'#fff9ed',wing:'#bbc5cb',neck:'#f3f4e8',hat:'none',bob:1.3,tail:1.25,flap:1.2,win:'squawk',line:'Mine. Mine. All those points are mine.',unlockPoints:4500},
{name:'Penguin',species:'penguin',body:'#273e51',head:'#263849',wing:'#203649',neck:'#f2eee0',hat:'scarf',bob:1.65,tail:.7,flap:1.8,win:'waddle',line:'Flightless? Watch this.',unlockPoints:9000}
];let selectedCharacters=[0,1];const reducedMotion=matchMedia('(prefers-reduced-motion:reduce)').matches;
// Progress is shared by this browser; the original four birds stay available.
const flockStorageKey='pigeonFlockV1';
let flock={crumbs:0,points:0,unlocked:[],completed:false},showPowerCards=true;
try{
 const saved=JSON.parse(gameStorage.getItem(flockStorageKey)||'null');
 if(saved&&typeof saved==='object'){
  flock.crumbs=Number.isSafeInteger(saved.crumbs)?Math.max(0,saved.crumbs):0;
  flock.points=Number.isSafeInteger(saved.points)?Math.max(0,saved.points):0;
  flock.unlocked=Array.isArray(saved.unlocked)?saved.unlocked.filter(n=>characters.some(c=>(c.unlock||c.unlockPoints)&&c.name===n)):[];
  flock.completed=saved.completed===true;
 }
}catch{}
if(previewMode){flock={crumbs:60,points:9000,unlocked:characters.filter(c=>c.unlock||c.unlockPoints).map(c=>c.name),completed:false};selectedCharacters=[8,8];$('testDriveNotice').hidden=false}
function saveFlock(){try{gameStorage.setItem(flockStorageKey,JSON.stringify(flock))}catch{}}
function isUnlocked(c){return !(c.unlock||c.unlockPoints)||flock.unlocked.includes(c.name)}
function pendingGifts(){return characters.filter(c=>!isUnlocked(c)&&(c.unlockPoints?flock.points>=c.unlockPoints:flock.crumbs>=c.unlock))}
function giftProgress(){if(pendingGifts().length)return 'Gift ready to open!';const next=characters.find(c=>c.unlock&&!isUnlocked(c));return next?(flock.crumbs>=next.unlock?'Gift ready to open!':flock.crumbs+' / '+next.unlock+' breadcrumbs · next gift'):(characters.every(isUnlocked)?'Full flock unlocked · keep collecting +10!':'Breadcrumb flock complete · guests unlock with points')}
$('showPowerCards').checked=showPowerCards=!flock.completed;
function characterIcon(c){return '<img src="assets/characters/'+c.name.toLowerCase()+'.png" alt="" width="1254" height="1254" decoding="async">'}
function applyCharacter(p,index){const c=characters[index];p.character=index;p.g.children[0].material=mat(c.body);p.head.children[0].material=mat(c.neck);p.head.children[1].material=mat(c.head);for(const w of p.wings){w.children[0].material=mat(c.wing);w.children[1].material=mat(p.color)}p.tail.material=mat(c.wing);
const body=p.g.children[0],beak=p.head.children[2];body.scale.set(.476,.448,.7);beak.scale.set(.16,.12,.33);beak.position.set(0,.49,-.94);beak.material=mat(c.species==='dove'?'#eaa38b':'#efbb54');
p.tail.scale.set(.45,.12,.65);p.tail.position.z=.62;
for(const w of p.wings){w.scale.set(1,1,1);w.rotation.set(0,0,0)}
if(p.speciesDetails)p.g.remove(p.speciesDetails);p.speciesDetails=new THREE.Group();p.g.add(p.speciesDetails);
if(c.species==='dove'){body.scale.set(.43,.43,.76);p.tail.scale.set(.55,.1,.85);for(const w of p.wings)w.scale.x=1.08}
if(c.species==='seagull'){body.scale.set(.47,.42,.85);beak.scale.set(.23,.15,.6);beak.position.z=-1.07;for(const w of p.wings){w.scale.x=1.45;w.children[1].material=mat('#354653')}ball(.05,'#e58053',.08,.55,-1.21,p.speciesDetails)}
if(c.species==='penguin'){body.scale.set(.61,.56,.83);ball(.44,'#f6efdc',0,.36,.08,p.speciesDetails,.95,.65,1.2);p.tail.scale.set(.28,.12,.35);for(const w of p.wings){w.scale.set(.66,1,.8);w.children[1].material=mat('#203649')}for(const x of [-.28,.28])box(.23,.09,.35,'#efaa52',x,-.16,.68,p.speciesDetails)}
if(p.accessory)p.head.remove(p.accessory);const a=new THREE.Group();p.head.add(a);p.accessory=a;
if(c.hat==='ribbon'||c.hat==='scarf'){const color=c.hat==='ribbon'?'#9ec7b4':'#eb7580';box(.52,.12,.48,color,0,.22,-.48,a);const ribbon=box(.18,.08,.65,color,-.24,.2,-.04,a);ribbon.rotation.z=.25}
if(c.hat==='crown'){box(.55,.12,.43,'#efbf49',0,.83,-.6,a);for(const x of [-.21,0,.21])box(.1,.25,.12,'#efbf49',x,1,-.72,a)}
if(c.hat==='mohawk')for(let i=0;i<4;i++)box(.13,.28+i*.035,.14,'#ed7087',0,.85,-.83+i*.16,a);
if(c.hat==='goggles'){box(.59,.12,.12,'#674d36',0,.58,-.77,a);for(const x of [-.16,.16]){ball(.13,'#e6bb65',x,.6,-.84,a,1,1,.5);ball(.095,'#80cad2',x,.6,-.91,a,1,1,.45)}box(.5,.13,.5,'#e2a357',0,.21,-.5,a);const scarf=box(.2,.1,.65,'#e2a357',-.25,.2,-.13,a);scarf.rotation.z=.3}
if(c.hat==='cap'){ball(.37,'#ed923d',0,.84,-.6,a,1,.45,1);box(.5,.06,.36,'#ed923d',0,.85,-.17,a)}
if(c.hat==='beret'){const hat=ball(.4,'#25818e',-.07,.86,-.6,a,1,.4,1);hat.rotation.z=-.2;box(.07,.15,.07,'#25818e',-.13,1.08,-.6,a)}
p.g.rotation.set(0,0,0);p.head.rotation.set(0,0,0);p.head.position.set(0,0,0);p.tail.rotation.set(0,0,0)}
function renderCharacters(){
 for(let i=0;i<2;i++){
  const field=$('character'+i);field.hidden=i>=count;
  field.querySelector('.character-grid').innerHTML=characters.map((c,j)=>{
   const locked=!isUnlocked(c),label=locked?'Gift · '+(c.unlockPoints?c.unlockPoints.toLocaleString()+' pts':c.unlock+' crumbs'):c.species?({dove:'Graceful bow',seagull:'Triumphant squawk',penguin:'Victory waddle'}[c.species]):({none:'Street strut',crown:'Royal bow',mohawk:'Victory headbang',goggles:'Barrel-roll brag',cap:'Sunshine strut',beret:'Artful bow'}[c.hat]);
   return '<button type="button" class="character-choice '+(selectedCharacters[i]===j?'chosen ':'')+(locked?'locked':'')+'" data-character="'+j+'" '+(locked?'disabled ':'')+'aria-pressed="'+(selectedCharacters[i]===j)+'" aria-label="Player '+(i+1)+': '+c.name+(locked?', locked, collect '+(c.unlockPoints?c.unlockPoints+' lifetime points':c.unlock+' breadcrumbs'):'')+'"><span class="portrait">'+characterIcon(c)+(locked?'<span class="lock-badge">GIFT</span>':'')+'</span><strong>'+c.name+'</strong><small>'+label+'</small></button>';
  }).join('');
  for(const b of field.querySelectorAll('[data-character]'))b.onclick=()=>{if(!isUnlocked(characters[+b.dataset.character]))return;selectedCharacters[i]=+b.dataset.character;renderCharacters();beep(540)};
 }
 $('flockProgress').textContent=giftProgress();$('menuGift').hidden=!pendingGifts().length;renderRoutes();
}

let selectedRoute=previewMode?'ice':'market',activeRoute='market';
try{const saved=gameStorage.getItem('pigeonRouteV1');if(PIGEON_ROUTES.some(r=>r.id===saved))selectedRoute=saved}catch{}
function routeAvailable(route){return flock.points>=route.points&&(!route.species||selectedCharacters.slice(0,count).every(i=>characters[i].species===route.species&&isUnlocked(characters[i])))}
function renderRoutes(){
 const chosen=PIGEON_ROUTES.find(r=>r.id===selectedRoute);
 let reset=chosen&&!routeAvailable(chosen)&&selectedRoute!=='market';
 if(reset)selectedRoute='market';
 const list=$('routeChoices');
 list.innerHTML=PIGEON_ROUTES.map(route=>{
  const open=routeAvailable(route),selected=route.id===selectedRoute;
  const bird=route.species?route.species[0].toUpperCase()+route.species.slice(1):'';
  const reason=flock.points<route.points?(route.points-flock.points).toLocaleString()+' more points':!open?'Choose '+bird+(count===2?' for both players':''):selected?'Selected':'Ready to fly';
  return '<button type="button" class="route-card '+(selected?'selected ':'')+'" data-route="'+route.id+'" aria-pressed="'+selected+'" '+(!open?'disabled':'')+' style="--route-color:'+route.accent+';--route-sky:'+route.sky+';--route-road:'+route.road+'"><span class="route-art '+route.id+'" aria-hidden="true"><i></i><i></i><i></i></span><span class="route-tag">'+route.tag+'</span><strong>'+route.name+'</strong><small>'+reason+'</small></button>';
 }).join('');
 for(const b of list.querySelectorAll('button'))b.onclick=()=>{const route=PIGEON_ROUTES.find(r=>r.id===b.dataset.route);if(!routeAvailable(route))return;selectedRoute=route.id;try{gameStorage.setItem('pigeonRouteV1',selectedRoute)}catch{}renderRoutes();beep(620);list.querySelector('[data-route="'+selectedRoute+'"]').focus({preventScroll:true})};
 $('routeProgress').textContent=flock.points.toLocaleString()+' lifetime points · unlocks are yours to keep';
 const route=PIGEON_ROUTES.find(r=>r.id===selectedRoute);
 $('routeDescription').textContent=(reset?'Switched to Market Street for this flock. ':'')+route.description;
}
function prepareRoute(){
 renderRoutes();const changed=activeRoute!==selectedRoute;activeRoute=selectedRoute;
 if(changed){for(const pool of Object.values(trafficPool))pool.length=0;world.build(activeRoute)}
 const route=PIGEON_ROUTES.find(r=>r.id===activeRoute);
 document.querySelector('.brand small').textContent=route.name;
 $('targetLegend').textContent=activeRoute==='ice'?'Snowcat +50 · Snowmobile +150 · Sled +80 · Explorer +100':'Car +50 · Motorcycle +150 · Bicycle +80 · Pedestrian +100';
}
function bankRoundPoints(){
 const before=flock.points,earned=players.slice(0,count).reduce((total,p)=>total+Math.max(0,p.score),0);
 flock.points=Math.min(Number.MAX_SAFE_INTEGER,before+earned);
 const newRoutes=PIGEON_ROUTES.filter(r=>r.points>before&&r.points<=flock.points);
 $('resultsRoutes').textContent='+'+earned.toLocaleString()+' lifetime points · '+flock.points.toLocaleString()+' total'+(newRoutes.length?' · New routes: '+newRoutes.map(r=>r.name).join(', '):'');
}
function victoryVoice(species){
 if(!sound||!species)return;
 try{ctx ||=new(window.AudioContext||window.webkitAudioContext)();ctx.resume();
 const notes=species==='seagull'?[900,1280,870]:species==='penguin'?[290,390,290]:[490,420,370];
 notes.forEach((hz,i)=>{const o=ctx.createOscillator(),gain=ctx.createGain(),at=ctx.currentTime+i*.16;o.type=species==='seagull'?'triangle':'sine';o.frequency.setValueAtTime(hz,at);o.frequency.exponentialRampToValueAtTime(hz*.7,at+.16);gain.gain.setValueAtTime(.04,at);gain.gain.exponentialRampToValueAtTime(.001,at+.18);o.connect(gain).connect(ctx.destination);o.start(at);o.stop(at+.19)})}catch{}
}

const players=[makeBird('#f47783'),makeBird('#6aafff')];players.forEach((p,i)=>{p.ring.visible=false;applyCharacter(p,selectedCharacters[i])});players[1].g.visible=players[1].ring.visible=players[1].guide.visible=false;
let mode='intro',count=1,time=60,elapsed=0,speed=26,spawnIn=0,base=26,targets=[],drops=[],splats=[],keys=new Set(),best=0,sound=false,visualCues=true,ctx;try{best=+gameStorage.getItem('pigeonExpressBest')||0}catch{}$('best').textContent=best;
function beep(f){if(!sound)return;try{ctx ||=new(window.AudioContext||window.webkitAudioContext)();ctx.resume();let o=ctx.createOscillator(),v=ctx.createGain();o.frequency.setValueAtTime(f,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(f*.55,ctx.currentTime+.1);v.gain.setValueAtTime(.06,ctx.currentTime);v.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.12);o.connect(v).connect(ctx.destination);o.start();o.stop(ctx.currentTime+.13)}catch{}}
const trafficPool={Car:[],Motorcycle:[],Person:[],Bicycle:[]},effectPool=[];let hudClock=0;function recycleTarget(t){scene.remove(t.g);t.mark.visible=false;t.react=0;t.g.rotation.set(0,0,0);t.g.position.y=0;trafficPool[t.kind].push(t)}function recycleEffect(m){scene.remove(m);effectPool.push(m)}function effect(r,x,y,z){let m=effectPool.pop();if(!m)m=new THREE.Mesh(sphere,mat('#fff9eb'));m.scale.set(r,r*.06,r);m.position.set(x,y,z);scene.add(m);return m}function spawn(forcedKind){const roll=Math.random();let kind=forcedKind||(roll<.22?'Person':roll<.42?'Bicycle':roll<.62?'Motorcycle':'Car'),g=new THREE.Group(),x=kind==='Person'?(Math.random()<.5?-1:1)*(9+Math.random()*2):kind==='Bicycle'?(Math.random()<.5?-1:1)*7.05:[-5.3,0,5.3][Math.floor(Math.random()*3)];const reused=trafficPool[kind].pop();if(reused){reused.g.position.set(x,0,-43);reused.hit=false;scene.add(reused.g);targets.push(reused);return}g.position.set(x,0,-43);scene.add(g);let points=50,rx=1.15,rz=2,height=1.3;if(world.iceVehicle(kind,g)){({Car:()=>{},Motorcycle:()=>{points=150;rx=.7;rz=1.2},Bicycle:()=>{points=80;rx=.55;rz=1.15},Person:()=>{points=100;rx=.65;rz=.65}}[kind])()}else if(kind==='Car'){let c=['#ee7180','#e9c553','#81c8c5','#c3b5ed','#f7e9d0'][Math.floor(Math.random()*5)];box(2.2,.8,4,c,0,.7,0,g);box(1.9,.65,2.1,c,0,1.35,0,g);box(1.75,.05,.7,'#446978',0,1.69,.65,g);box(1.75,.05,.5,'#446978',0,1.69,-.7,g);for(let a of [-1.1,1.1])for(let b of [-1.3,1.3])ball(.36,'#2e424a',a,.4,b,g,.55,1,1);for(let a of [-.7,.7])box(.45,.18,.05,'#fff0b2',a,.8,2.03,g)}else if(kind==='Motorcycle'){points=150;rx=.7;rz=1.2;height=1.5;for(let z of [-.9,.9])ball(.45,'#2e424a',0,.48,z,g,.45,1,1);box(.5,.5,1.65,'#eaa249',0,.75,0,g);box(.9,.1,.15,'#ced8d4',0,1.2,.7,g);ball(.33,'#e85468',0,1.42,-.1,g);box(.5,.65,.6,'#394e6a',0,1.08,-.4,g)}else if(kind==='Bicycle'){points=80;rx=.55;rz=1.15;height=1.8;
for(const z of [-.85,.85]){ball(.43,'#2e424a',0,.46,z,g,.24,1,1);ball(.31,'#dce5d8',0,.46,z,g,.27,1,1)}
box(.12,.12,1.65,'#e9ca54',0,.68,0,g);const frame=box(.13,.7,1.1,'#e9ca54',0,.84,0,g);frame.rotation.x=.28;
box(.48,.12,.5,'#31474c',0,1.1,-.2,g);box(.85,.1,.12,'#31474c',0,1.15,.82,g);
box(.5,.65,.48,'#58bdb0',0,1.48,-.05,g);ball(.28,'#e6b28b',0,1.99,.18,g);ball(.3,'#ffe182',0,2.14,.17,g,1,.65,1);
for(const side of [-1,1]){const leg=box(.17,.54,.18,'#405a75',side*.22,1.04,-.1,g);leg.userData.pedal=side;const arm=box(.13,.14,.65,'#58bdb0',side*.32,1.55,.45,g);arm.rotation.x=.3}
}else{points=100;rx=.65;rz=.65;height=1.5;box(.55,.8,.4,'#e95c76',0,.95,0,g);ball(.3,'#dca578',0,1.65,0,g);for(let a of [-.18,.18])box(.18,.5,.22,'#37516c',a,.35,0,g)}if(kind==='Person'){g.scale.setScalar(1.35);rx*=1.35;rz*=1.35;for(const side of [-1,1]){const arm=box(.17,.6,.18,'#e95c76',side*.42,1.05,0,g);arm.userData.arm=side}}else if(kind==='Motorcycle'){g.scale.setScalar(1.18);rx*=1.18;rz*=1.18}const markY=(activeRoute==='ice'?{Car:1.78,Motorcycle:1.83,Bicycle:1.9,Person:2.09}:{Car:1.78,Motorcycle:1.83,Bicycle:2.4,Person:2.02})[kind];height=markY*g.scale.y;const mark=ball(.95,'#fff9eb',0,markY,0,g,1,.06,1);mark.visible=false;targets.push({g,kind,points,rx,rz,height,mark,react:0,hit:false,extra:kind==='Person'?0:kind==='Bicycle'?-4:kind==='Car'?4:8})}
const bursts=[];function splash(x,z,y){for(let i=0;i<7;i++){const a=i*Math.PI*2/7,m=effect(.17,x,y,z);m.scale.setScalar(.17);bursts.push({m,vx:Math.cos(a)*3.5,vz:Math.sin(a)*3.5,vy:3+Math.random()*2,life:.5})}}const flight=.24,birdZ=13;function drop(i){let p=players[i];if(mode!=='playing'||i>=count)return;if(p.cool>0){if(p.cool<=.1)p.queued=.12;return}p.queued=0;p.cool=p.rapidUntil>elapsed?1/12:.3;p.shots++;const radius=p.superUntil>elapsed?2.2:0;let m=effect(radius?.5:.2,p.x,4.8,birdZ);m.scale.setScalar(radius?.5:.2);drops.push({m,i,x:p.x,age:0,radius});if(!p.rapidUntil||p.rapidUntil<=elapsed||p.shots%3===0)beep(220)}function float(t,x,z,color){let v=new THREE.Vector3(x*scene.scale.x,2,z).project(camera),el=document.createElement('div');el.className='float';el.style.color=color;el.textContent=t.replace('Glancing hit ','Glancing hit\n').replace('Bullseye! ','Bullseye!\n');el.style.left=Math.max(0,Math.min(innerWidth-180,(v.x*.5+.5)*innerWidth-90))+'px';el.style.top=(-v.y*.5+.5)*innerHeight+'px';document.body.appendChild(el);setTimeout(()=>el.remove(),1000)}
// The central 60% of each half-extent earns full points; the outer splash area earns half.
function hitQuality(t,x,z,radius=0){const dx=Math.abs(t.g.position.x-x),dz=Math.abs(t.g.position.z-z);if(t.hit||dx>t.rx+.35+radius||dz>t.rz+.65+radius)return 0;return dx<=t.rx*.6+radius*.7&&dz<=t.rz*.6+radius*.7?1:.5}
// Score one target once. Bomb hits use base points and do not count as shots.
function splatTarget(t,p,quality,x,z,multiplier=1){
  if(t.hit)return 0;
  t.hit=true;const earned=Math.round(t.points*quality)*multiplier*(isFrenzy()?2:1);p.score+=earned;
  t.mark.visible=true;t.mark.scale.set(quality===.5?.6:.95,.055,quality===.5?.6:.95);
  t.mark.position.x=THREE.MathUtils.clamp((x-t.g.position.x)/t.g.scale.x,-t.rx*.6,t.rx*.6);
  t.react=quality===.5?.4:.75;splash(x,z,t.height);return earned;
}
function impact(d,late=0){
  const p=players[d.i],hits=[];
  for(const t of targets){const q=hitQuality(t,d.x,birdZ+targetSpeed(t)*late,d.radius);if(q)hits.push({t,q})}
  hits.sort((a,b)=>b.q-a.q);if(!d.radius)hits.splice(1);
  if(hits.length){
    p.combo=elapsed-p.lastHit<2?Math.min(5,p.combo+1):1;p.lastHit=elapsed;p.hits++;p.bestCombo=Math.max(p.bestCombo||0,p.combo);
    const quality=hits[0].q;if(quality===.5)p.partialHits++;else p.directHits++;
    let earned=0;for(const {t,q} of hits)earned+=splatTarget(t,p,q,d.radius?t.g.position.x:d.x,t.g.position.z,p.combo);
    float((d.radius?'Super splat! ':quality===.5?'Glancing hit ':'Bullseye! ')+'+'+earned+(p.combo>1?' ×'+p.combo:'')+(isFrenzy()?' · FRENZY!':''),d.x,birdZ,p.color);
    beep(quality===.5?330:480+p.combo*100);
  }else{p.combo=0;if(!(p.rapidUntil>elapsed))float('miss',d.x,birdZ,'#fff9eb')}
  splats.push(effect(d.radius?2.7:.48,d.x,.22,birdZ));
}

const hawk=new THREE.Group();scene.add(hawk);hawk.visible=false;ball(.62,'#79553c',0,0,0,hawk,.8,.65,1.65);ball(.4,'#e6c491',0,.2,.85,hawk);box(.3,.18,.44,'#dfa741',0,.12,1.23,hawk);box(.17,.3,.17,'#bc842f',0,-.06,1.38,hawk);for(const side of [-1,1]){ball(.065,'#261c1c',side*.3,.33,1.04,hawk);const wing=box(1.65,.14,.65,'#77513a',side*1.05,0,-.1,hawk);wing.rotation.y=side*.3;for(let j=0;j<3;j++){const feather=box(.7,.1,.19,'#4e382e',side*(1.9+j*.13),0,-.45+j*.22,hawk);feather.rotation.y=side*.5}}box(.65,.12,1,'#543c2f',0,0,-1.12,hawk);
const dangerMat=new THREE.MeshBasicMaterial({color:'#f16b51',transparent:true,opacity:.17,depthWrite:false});const dangerLane=new THREE.Mesh(new THREE.PlaneGeometry(4.4,64),dangerMat);dangerLane.rotation.x=-Math.PI/2;dangerLane.position.set(0,.26,0);dangerLane.visible=false;scene.add(dangerLane);
let hawkPhase='idle',hawkWait=7,hawkWarning=0,hawkStruck=new Set(),hawkResolved=new Set(),hawkClosest=[Infinity,Infinity];
function resetHawk(){hawkPhase='idle';hawkWait=7;hawkWarning=0;hawkStruck.clear();hawkResolved.clear();hawkClosest.fill(Infinity);hawk.visible=dangerLane.visible=false;$('hawkNotice').hidden=true;players.forEach(p=>{p.invulnerable=0;p.clips=0;p.nearMisses=0;p.nearUntil=0})}
function warnHawk(x){hawkPhase='warning';hawkWarning=1.3;hawk.position.set(x,5,-32);dangerLane.position.x=x;dangerLane.visible=visualCues;$('hawkNotice').hidden=false;$('hawkNotice').textContent=visualCues?'Hawk incoming! Move out of the orange lane':'Hawk incoming! Watch the sky';hawkStruck.clear();hawkResolved.clear();hawkClosest.fill(Infinity);beep(150)}
function updateHawk(dt){
  for(const p of players)p.invulnerable=Math.max(0,(p.invulnerable||0)-dt);
  if(hawkPhase==='idle'){
    hawkWait-=dt*worldScale;if(hawkWait<=0)warnHawk(players[Math.floor(Math.random()*count)].x);
  }else if(hawkPhase==='warning'){
    hawkWarning-=dt*worldScale;dangerMat.opacity=reducedMotion?.18:.14+Math.sin(elapsed*8)*.04;
    if(hawkWarning<=0){hawkPhase='swoop';hawk.visible=true;$('hawkNotice').textContent='Dodge the hawk!'}
  }else{
    const oldZ=hawk.position.z;hawk.position.z+=(speed+11*worldScale)*dt;
    hawk.rotation.z=reducedMotion?0:Math.sin(elapsed*7)*.07;dangerMat.opacity=.09;
    for(let i=0;i<count;i++){
      const p=players[i],distance=Math.abs(p.x-hawk.position.x);
      const alongside=oldZ<=birdZ+1.4&&hawk.position.z>=birdZ-1.4;
      if(alongside&&!p.invulnerable){
        hawkClosest[i]=Math.min(hawkClosest[i],distance);
        if(!hawkStruck.has(i)&&distance<2.2){
          hawkStruck.add(i);p.invulnerable=1.2;p.clips++;
          const lost=Math.min(100,p.score);p.score-=lost;p.combo=0;p.lastHit=-10;p.queued=0;
          float('Clipped! −'+lost,p.x,birdZ,p.color);beep(95);
        }
      }
      // Award only after the entire collision window is safely behind the pigeon.
      if(oldZ<=birdZ+1.4&&hawk.position.z>birdZ+1.4&&!hawkResolved.has(i)){
        hawkResolved.add(i);
        if(!hawkStruck.has(i)&&!p.invulnerable&&hawkClosest[i]>=2.2&&hawkClosest[i]<3.4){
          p.nearMisses++;p.score+=75;p.nearUntil=elapsed+.85;
          float('Close shave!\n+75',p.x,birdZ,'#ffe18a');beep(960);hud();
        }
      }
    }
    if(hawk.position.z>30){hawk.visible=dangerLane.visible=false;hawkPhase='idle';hawkWait=4.5+Math.random()*2;$('hawkNotice').hidden=true}
  }
}

let frenzyStarted=false,frenzyBeatAt=0,frenzyBeat=0;
function isFrenzy(){return elapsed>=50&&elapsed<60&&(mode==='playing'||mode==='paused'||mode==='discovery'||mode==='confirmExit')}
function resetFrenzy(){
  frenzyStarted=false;frenzyBeatAt=0;frenzyBeat=0;document.body.classList.remove('frenzy');
  $('frenzyBadge').hidden=true;$('frenzyIntro').hidden=true;$('timerStat').querySelector('span').textContent='Time left';
}
function updateFrenzy(){
  if(!isFrenzy())return;
  if(!frenzyStarted){
    frenzyStarted=true;document.body.classList.add('frenzy');$('frenzyBadge').hidden=false;
    $('frenzyIntro').hidden=false;$('timerStat').querySelector('span').textContent='Final frenzy';
    frenzyBeatAt=elapsed;
  }
  $('frenzyIntro').hidden=elapsed>=52;
  if(elapsed>=frenzyBeatAt){
    const notes=[392,494,587,784,587,494,659,784];beep(notes[frenzyBeat++%notes.length]);
    frenzyBeatAt=elapsed+(.34-(elapsed-50)*.012);
  }
}


// Pickups activate on contact. Durations use the round clock, which never slows.
const powerTypes={slow:{name:'Slow motion',color:'#67d5e6',icon:'◷'},bomb:{name:'Splat bomb',color:'#ffbd65',icon:'✹'},super:{name:'Super splat',color:'#c5a0f0',icon:'✦'},rapid:{name:'Splat Storm',color:'#82d5a5',icon:'ϟ'}};
let pickups=[],pickupPool=[],pickupIn=2.5,pickupBag=[],slowUntil=0,worldScale=1,bombUntil=0,bombMessageUntil=0,powerHudHTML='';
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
  const p=players[i],info=powerTypes[kind];p.score+=50;let earned=50,bombHits=0;
  if(kind==='slow')slowUntil=elapsed+10;
  else if(kind==='super')p.superUntil=elapsed+10;
  else if(kind==='rapid'){p.rapidUntil=elapsed+10;p.cool=0;}
  else{
    for(const t of targets)if(!t.hit&&onScreen(t)){earned+=splatTarget(t,p,1,t.g.position.x,t.g.position.z);bombHits++}p.bombHits=(p.bombHits||0)+bombHits;
    bombUntil=elapsed+1.2;bombWave.position.set(p.x,.35,birdZ);bombWave.scale.setScalar(1);bombWave.material.opacity=.65;bombWave.visible=true;bombMessageUntil=elapsed+2.5;$('bombFeedback').hidden=false;$('bombFeedback').textContent='SPLAT BOMB! '+(bombHits?bombHits+' target'+(bombHits===1?'':'s')+' splatted':'No fresh targets on screen')+' · +'+earned;
  }
  float(info.name+'! +'+earned,p.x,birdZ,info.color);
  $('powerAnnouncement').textContent='Player '+(i+1)+': '+info.name+(kind==='bomb'?'!':' for 10 seconds!');
  beep(kind==='bomb'?180:880);hudPowers();
}

// First-time discoveries suspend simulation before the collected power activates.
const discoveryStorageKey='pigeonPowerDiscoveriesV1';
let seenPowers=new Set(),pendingDiscovery=null;
try{const saved=JSON.parse(gameStorage.getItem(discoveryStorageKey)||'[]');if(Array.isArray(saved))seenPowers=new Set(saved.filter(kind=>Object.hasOwn(powerTypes,kind)))}catch{}
const discoveryDetails={
  slow:{tagline:'A little breathing room.',description:'Traffic and hawks move at 45% speed. Your steering and drops stay quick.',duration:'10 seconds',scope:'Shared road',note:'The round clock keeps its normal pace once you continue.'},
  bomb:{tagline:'One drop. Total chaos.',description:'Instantly splat every visible street target for its base points. Already splatted targets cannot score twice.',duration:'One big blast',scope:'Visible targets',note:'Your bomb goes off when you continue. Enjoy the mess.'},
  rapid:{tagline:'Just steer. We handle the mess.',description:'Fire twelve drops every second automatically. Keep steering to line up your targets; no button-holding needed.',duration:'10 seconds',scope:'Collecting player',note:'Combines with Super splat. Slow motion never slows your firing speed.'},
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
  $('discoveryArt').alt={rapid:'A cheeky pigeon unleashing a stream of cartoon splats over pastel cars beside a green lightning token.',slow:'A cheeky pigeon flying beside a turquoise stopwatch above a miniature city.',bomb:'A triumphant pigeon unleashing a toy splat bomb over pastel cars.',super:'A proud pigeon beside a giant glowing drop showing its wider splash.'}[kind];
  $('discoveryIcon').src='assets/pickups/'+kind+'.svg';
  dialog.showModal();dialog.scrollTop=0;$('discoveryTitle').focus({preventScroll:true});beep(720);hud();
}
function continueDiscovery(){
  if(mode!=='discovery'||!pendingDiscovery)return;
  const {kind,i}=pendingDiscovery;pendingDiscovery=null;seenPowers.add(kind);
  try{gameStorage.setItem(discoveryStorageKey,JSON.stringify([...seenPowers]))}catch{}
  $('discovery').close();keys.clear();mode='playing';document.body.dataset.mode=mode;
  // Start the next frame from now, so reading time never becomes simulation time.
  prev=performance.now();activatePickup(kind,i);hud();$('play').blur();
}
$('discoveryContinue').onclick=continueDiscovery;
$('discovery').addEventListener('cancel',e=>e.preventDefault());

function updatePickups(dt,now){
  $('bombFeedback').hidden=elapsed>=bombMessageUntil;pickupIn-=dt;
  if(pickupIn<=0&&elapsed<55&&pickups.length<3){spawnPickup();pickupIn=6+Math.random()*2}
  for(let n=pickups.length-1;n>=0;n--){
    const item=pickups[n],oldZ=item.g.position.z;item.g.position.z+=speed*dt;
    item.g.position.y=5+(reducedMotion?0:Math.sin(now*.004+n)*.2);
    // Swept forward check avoids skipping a collectible between frames.
    if(oldZ<=birdZ+1.3&&item.g.position.z>=birdZ-1.3){
      let winner=-1,distance=Infinity;
      for(let i=0;i<count;i++){const dx=Math.abs(players[i].x-item.g.position.x);if(dx<1.55&&(dx<distance||(dx===distance&&Math.random()<.5))){winner=i;distance=dx}}
      if(winner>=0){if(!showPowerCards||seenPowers.has(item.kind))activatePickup(item.kind,winner);else discoverPower(item.kind,winner);recyclePickup(item);pickups.splice(n,1);if(mode==='discovery')return;continue}
    }
    if(item.g.position.z>32){recyclePickup(item);pickups.splice(n,1)}
  }
  bombWave.visible=bombUntil>elapsed;
  if(bombWave.visible){const progress=1-(bombUntil-elapsed)/1.2;bombWave.scale.setScalar(1+progress*42);bombWave.material.opacity=(1-progress)*.65}
}
function hudPowers(){
  const active=[];
  if(slowUntil>elapsed)active.push({kind:'slow',label:count===2?'Slow motion · both':'Slow motion',remaining:slowUntil-elapsed});
  players.slice(0,count).forEach((p,i)=>{if(p.superUntil>elapsed)active.push({kind:'super',label:(count===2?'P'+(i+1)+' · ':'')+'Super splat',remaining:p.superUntil-elapsed})});
  players.slice(0,count).forEach((p,i)=>{if(p.rapidUntil>elapsed)active.push({kind:'rapid',label:(count===2?'P'+(i+1)+' · ':'')+'Splat Storm',remaining:p.rapidUntil-elapsed})});
  const html=active.map(a=>'<div class="power-pill '+a.kind+'"><span><img src="assets/pickups/'+a.kind+'.svg" alt="">'+a.label+'</span><b>'+Math.ceil(a.remaining)+'s</b><i style="width:'+a.remaining*10+'%"></i></div>').join('');
  if(html!==powerHudHTML){$('powerStatus').innerHTML=html;powerHudHTML=html}
  $('powerStatus').hidden=!active.length;
  if(active.length)document.body.style.setProperty('--hawk-notice-top',($('powerStatus').getBoundingClientRect().bottom+9)+'px');else document.body.style.removeProperty('--hawk-notice-top');
}
function resetPowers(){
  pickups.forEach(recyclePickup);pickups=[];pickupIn=2.5;pickupBag=previewMode?['rapid']:[];slowUntil=0;worldScale=1;bombUntil=0;bombMessageUntil=0;$('bombFeedback').hidden=true;bombWave.visible=false;
  players.forEach(p=>{p.superUntil=0;p.rapidUntil=0});$('powerAnnouncement').textContent='';hudPowers();
}

// Breadcrumb trails are ordinary collectibles, independent of the power system.
let crumbs=[],crumbPool=[],crumbIn=3.5,crumbHudText='';
function spawnCrumb(x,z=-36){
 let c=crumbPool.pop();
 if(!c){
  c=new THREE.Group();
  const crust=box(.95,.45,.75,'#bd7436',0,0,0,c);crust.rotation.y=.3;
  box(.73,.25,.57,'#ffe2a0',0,.27,0,c).rotation.y=.3;
  ball(.13,'#fff3ca',-.18,.43,.02,c);ball(.1,'#d6a053',.2,.42,-.1,c);
  const glow=new THREE.Mesh(new THREE.RingGeometry(.65,.73,20),new THREE.MeshBasicMaterial({color:'#ffdf77',side:THREE.DoubleSide}));
  glow.rotation.x=-Math.PI/2;glow.position.y=-.25;c.add(glow);
 }
 c.position.set(x,5,z);c.rotation.set(0,0,0);scene.add(c);crumbs.push(c);return c;
}
function recycleCrumb(c){scene.remove(c);crumbPool.push(c)}
function resetCrumbs(){crumbs.forEach(recycleCrumb);crumbs=[];crumbIn=3.5}
function updateCrumbs(dt,now){
 crumbIn-=dt;
 if(crumbIn<=0&&elapsed<55&&crumbs.length<18){
  const x=[-9,-5,0,5,9][Math.floor(Math.random()*5)];
  for(let i=0;i<3;i++)spawnCrumb(x,-36-i*4);
  crumbIn=3.8+Math.random()*.6;
 }
 for(let n=crumbs.length-1;n>=0;n--){
  const c=crumbs[n],oldZ=c.position.z;c.position.z+=speed*dt;
  c.position.y=5+(reducedMotion?0:Math.sin(now*.006+n)*.16);
  c.rotation.y=reducedMotion?.2:now*.002+n;
  if(oldZ<=birdZ+1&&c.position.z>=birdZ-1){
   let winner=-1,nearest=Infinity;
   for(let i=0;i<count;i++){const d=Math.abs(players[i].x-c.position.x);if(d<1.3&&(d<nearest||(d===nearest&&Math.random()<.5))){winner=i;nearest=d}}
   if(winner>=0){
    const p=players[winner],before=pendingGifts().length;p.crumbs=(p.crumbs||0)+1;p.score+=10;flock.crumbs++;saveFlock();
    if(pendingGifts().length>before){float('Gift earned!\nOpen after your flight',p.x,birdZ,'#ffe18a');$('powerAnnouncement').textContent='Gift earned! Open it after this flight.';beep(1100)}else beep(780+(p.crumbs%3)*90);
    recycleCrumb(c);crumbs.splice(n,1);hud();continue;
   }
  }
  if(c.position.z>32){recycleCrumb(c);crumbs.splice(n,1)}
 }
}
function hudCrumbs(){
 const text=(count===2?'P1 '+(players[0].crumbs||0)+' · P2 '+(players[1].crumbs||0):(players[0].crumbs||0)+' crumbs')+' · +10 each';
 const combined=text+giftProgress();
 if(combined!==crumbHudText){$('crumbCount').textContent=text;$('crumbGoal').textContent=giftProgress();crumbHudText=combined}
}
let giftStage='wrapped',giftCharacter=null;
function showGift(){
 const next=pendingGifts()[0];if(!next){showSelection();return}
 mode='gift';document.body.dataset.mode=mode;freezeInput();giftStage='wrapped';giftCharacter=next;
 $('overlay').classList.add('hidden');$('giftDialog').dataset.stage=giftStage;
 $('giftTitle').textContent='A gift from the flock!';$('giftDescription').textContent='You collected '+(next.unlockPoints?next.unlockPoints.toLocaleString()+' lifetime points':next.unlock+' breadcrumbs')+'. Someone new wants to fly with you.';
 $('giftPortrait').src='assets/characters/'+next.name.toLowerCase()+'.png';$('giftPortrait').alt=next.name;
 $('giftAction').textContent='Open gift';
 if(!$('giftDialog').open)$('giftDialog').showModal();$('giftTitle').focus({preventScroll:true});
}
function advanceGift(){
 if(mode!=='gift')return;
 if(giftStage==='wrapped'){
  if(!isUnlocked(giftCharacter)){flock.unlocked.push(giftCharacter.name);saveFlock()}
  giftStage='revealed';$('giftDialog').dataset.stage=giftStage;
  $('giftTitle').textContent=giftCharacter.name+' joins the flock!';
  $('giftDescription').textContent=giftCharacter.line+' Now available for both players. Same flying skills, fresh attitude.';
  $('giftAction').textContent=pendingGifts().length?'Next gift':'Choose your bird';renderCharacters();beep(1200);
 }else{
  $('giftDialog').close();if(pendingGifts().length)showGift();else showSelection();
 }
}
$('giftAction').onclick=advanceGift;$('menuGift').onclick=showGift;

function clear(){resetHawk();resetPowers();resetCrumbs();for(const b of bursts)recycleEffect(b.m);bursts.length=0;document.querySelectorAll('.float').forEach(el=>el.remove());for(let t of targets)recycleTarget(t);for(let d of drops)recycleEffect(d.m);for(let m of splats)recycleEffect(m);targets=[];drops=[];splats=[];keys.clear()}
let countdownElapsed=0,countdownLabel='',pausedMode='playing';
function showCountdown(){const label=countdownElapsed<3?String(3-Math.floor(countdownElapsed)):'GO!';if(label===countdownLabel)return;countdownLabel=label;$('countdownNumber').textContent=label;$('countdownCaption').textContent=label==='GO!'?'Make a mess!':'Get ready';$('countdownNumber').classList.remove('pop');void $('countdownNumber').offsetWidth;$('countdownNumber').classList.add('pop');beep(label==='GO!'?880:440)}
function start(){if(mode==='countdown'||mode==='discovery')return;if($('results').open)$('results').close();document.querySelector('.panel .bird').className='bird';sharing.reset();clear();prepareRoute();resetFrenzy();showPowerCards=$('showPowerCards').checked;seenPowers.clear();visualCues=$('visualCues').checked;time=60;elapsed=0;base=+$('pace').value;speed=base;spawnIn=0;players.forEach((p,i)=>{applyCharacter(p,selectedCharacters[i]);Object.assign(p,{x:count===1?0:i?3:-3,vx:0,queued:0,score:0,hits:0,partialHits:0,directHits:0,shots:0,crumbs:0,combo:0,bestCombo:0,bombHits:0,lastHit:-10,cool:0});p.g.visible=i<count;p.guide.visible=false;p.ring.visible=false});mode='countdown';countdownElapsed=0;countdownLabel='';$('countdown').hidden=false;showCountdown();$('play').blur();document.body.dataset.mode=mode;document.body.classList.remove('hide-help');$('overlay').classList.add('hidden');$('pause').textContent='Ⅱ';$('firstLabel').textContent='P1 · '+characters[players[0].character].name;$('secondLabel').textContent=count===2?'P2 · '+characters[players[1].character].name:'Best';$('p2help').hidden=count===1;hud()}
function hud(){hudPowers();hudCrumbs();$('score').textContent=players[0].score;$('best').textContent=count===2?players[1].score:best;$('time').textContent=Math.ceil(time);$('speed').textContent=Math.round(speed*5)+' km/h';$('charge').style.width=Math.max(0,(1-players[0].cool/(players[0].rapidUntil>elapsed?1/12:.3))*100)+'%';$('ready').textContent=players[0].rapidUntil>elapsed?'Splat Storm · auto!':players[0].cool?'Reloading…':'Tap to drop';$('timerStat').classList.toggle('danger',time<11)}
function finish(early=false){
  if(mode==='over'||mode==='gift'||mode==='intro')return;
  if($('exitDialog').open)$('exitDialog').close();
  if($('discovery').open)$('discovery').close();pendingDiscovery=null;
  $('countdown').hidden=true;$('pause').textContent='Ⅱ';
  bankRoundPoints();flock.completed=true;$('showPowerCards').checked=false;saveFlock();
  $('results').querySelector('.results-eyebrow').textContent=early?'FLIGHT ENDED EARLY':'FLIGHT COMPLETE';
  $('resultsGift').textContent=giftProgress();$('raceAgain').innerHTML=(pendingGifts().length?'Open gift':'Race again')+' <span aria-hidden="true">→</span>';
  mode='over';players.forEach(p=>{p.head.children[3].scale.y=.055;p.tail.rotation.z=0});
  resetFrenzy();resetPowers();hawk.visible=dangerLane.visible=false;$('hawkNotice').hidden=true;
  document.body.dataset.mode=mode;keys.clear();
  const active=players.slice(0,count),topScore=Math.max(...active.map(p=>p.score)),previousBest=best;
  best=Math.max(best,topScore);try{gameStorage.setItem('pigeonExpressBest',best)}catch{}
  const winner=active.findIndex(p=>p.score===topScore),draw=count===2&&players[0].score===players[1].score;
  $('resultsTitle').textContent=count===1?'Special delivery!':draw?'A messy draw!':'P'+(winner+1)+' · '+characters[active[winner].character].name+' wins!';
  $('resultsSubtitle').textContent=(draw?'Two birds. Equally outrageous.':characters[active[winner].character].line)+' · '+PIGEON_ROUTES.find(r=>r.id===activeRoute).name;victoryVoice(characters[active[winner].character].species);
  $('resultsBest').textContent=(topScore>previousBest?'New personal best! · ':'Personal best · ')+best.toLocaleString()+' points';
  $('resultsPlayers').dataset.players=count;
  $('resultsPlayers').innerHTML=active.map((p,i)=>{
    const c=characters[p.character],accuracy=p.shots?Math.round(p.hits/p.shots*100):0;
    const stats=[['Accuracy',accuracy+'%'],['Best combo',p.bestCombo?'×'+p.bestCombo:'—'],['Drops landed',p.hits+' / '+p.shots],['Close shaves',p.nearMisses||0],['Bomb targets',p.bombHits||0],['Hawk clips',p.clips||0],['Breadcrumbs',p.crumbs||0]];
    return '<section class="result-player player-'+i+'"><div class="result-character"><img src="assets/characters/'+c.name.toLowerCase()+'.png" alt=""><div><span>PLAYER '+(i+1)+'</span><h3>'+c.name+'</h3></div></div><div class="result-score" data-score="'+p.score+'">'+p.score.toLocaleString()+'</div><p class="result-points">POINTS DELIVERED</p><dl class="result-stats">'+stats.map(([label,value])=>'<div><dt>'+label+'</dt><dd>'+value+'</dd></div>').join('')+'</dl></section>';
  }).join('');
  sharing.setResult({...shareSnapshot(),early});
  $('overlay').classList.add('hidden');$('results').showModal();$('results').scrollTop=0;$('resultsTitle').focus({preventScroll:true});hud();
}
function returnToSelection(){
  if(mode!=='over')return;
  sharing.stopClip();$('results').close();if(pendingGifts().length){showGift();return}showSelection();
}
function showSelection(){
  mode='intro';document.body.dataset.mode=mode;keys.clear();
  $('title').innerHTML='Express<br><em>mess.</em>';
  $('description').innerHTML='One road. Full speed. Zero dignity.<br>Dodge sideways and time your drops over<br>cars, motorcycles, and pedestrians.';
  $('result').textContent='60 seconds. The road keeps getting faster.';
  $('options').hidden=false;$('play').textContent='Hit the road';$('overlay').classList.remove('hidden');
  document.querySelector('.panel').scrollTop=0;renderCharacters();$('play').focus({preventScroll:true});
}
$('raceAgain').onclick=returnToSelection;
$('results').addEventListener('cancel',e=>e.preventDefault());

// All overlays share fresh-key handling; held fire never skips a dialog.
function pause(){
 if(mode==='playing'||mode==='countdown'){
  pausedMode=mode;mode='paused';$('countdown').hidden=true;freezeInput();
  $('pauseTime').textContent=Math.ceil(time)+' seconds remaining';
  $('pauseDialog').showModal();$('resumeFlight').focus({preventScroll:true});$('pause').textContent='▶';
 }else if(mode==='paused'){
  $('pauseDialog').close();mode=pausedMode;freezeInput();prev=performance.now();
  if(mode==='countdown'){countdownElapsed=0;countdownLabel='';$('countdown').hidden=false;showCountdown()}
  $('pause').textContent='Ⅱ';
 }
 document.body.dataset.mode=mode;
}
function freezeInput(){keys.clear();players.forEach(p=>{p.vx=0;p.queued=0})}
let exitFrom='playing';
function requestExit(){
 if(!['playing','countdown','paused','discovery'].includes(mode))return;
 exitFrom=mode;mode='confirmExit';freezeInput();$('countdown').hidden=true;
 document.body.dataset.mode=mode;$('exitDialog').showModal();$('keepFlying').focus({preventScroll:true});
}
function cancelExit(){
 if(mode!=='confirmExit')return;
 $('exitDialog').close();mode=exitFrom;freezeInput();prev=performance.now();
 if(mode==='countdown')$('countdown').hidden=false;
 document.body.dataset.mode=mode;
}
function endFlight(){
 if(mode!=='confirmExit')return;
 if($('pauseDialog').open)$('pauseDialog').close();
 // A power already collected belongs to its player, even if its card was open.
 if(pendingDiscovery){const {kind,i}=pendingDiscovery;activatePickup(kind,i)}
 finish(true);
}
function toggleSound(){sound=!sound;$('sound').setAttribute('aria-label',sound?'Mute sound (S)':'Enable sound (S)');$('sound').setAttribute('aria-pressed',String(sound));$('sound').style.background=sound?'#edc857':'#fff9e9';beep(600)}
$('resumeFlight').onclick=pause;$('pauseEnd').onclick=requestExit;$('keepFlying').onclick=cancelExit;$('endFlight').onclick=endFlight;
for(const id of ['pauseDialog','exitDialog','giftDialog'])$(id).addEventListener('cancel',e=>{e.preventDefault();if(id==='exitDialog')cancelExit();else if(id==='pauseDialog')requestExit()});
for(let b of document.querySelectorAll('[data-players]'))b.onclick=()=>{count=+b.dataset.players;for(let a of document.querySelectorAll('[data-players]'))a.classList.toggle('selected',a===b);renderCharacters()};
renderCharacters();$('play').onclick=()=>mode==='paused'?pause():start();$('pause').onclick=pause;$('sound').onclick=toggleSound;
window.addEventListener('keydown',e=>{
 const k=e.key.toLowerCase(),confirm=k===' '||k==='enter';
 if(e.ctrlKey||e.metaKey||e.altKey)return;
 if(confirm&&e.repeat){e.preventDefault();return}
 if(k==='s'){e.preventDefault();if(!e.repeat)toggleSound();return}
 if(k==='escape'){e.preventDefault();if(!e.repeat){if(mode==='confirmExit')cancelExit();else requestExit()}return}
 if(k==='p'){e.preventDefault();if(!e.repeat)pause();return}
 if(k==='r'&&(mode==='playing'||mode==='over')){e.preventDefault();if(!e.repeat)sharing.startClip();return}
 const main={discovery:continueDiscovery,over:returnToSelection,paused:pause,confirmExit:cancelExit,gift:advanceGift}[mode];
 if(main){
  if(confirm){
   // Tab users can deliberately choose the secondary action with Enter.
   const secondary=e.target instanceof Element&&e.target.matches('[data-secondary]');
   if(!secondary||e.repeat){e.preventDefault();if(!e.repeat)main()}
  }
  return;
 }
 if(mode==='intro'){
  // Preserve native Space on checkboxes/selects and activation of character buttons.
  if(confirm&&(!e.target.closest||!e.target.closest('button,input,select'))){e.preventDefault();if(!e.repeat){if(pendingGifts().length)showGift();else start()}}
  return;
 }
 if([' ','arrowleft','arrowright','enter'].includes(k))e.preventDefault();
 keys.add(k);if(e.repeat)return;if(k===' ')drop(0);if(k==='enter')drop(1);
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{keys.clear();if(mode==='playing'||mode==='countdown')pause()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(mode==='playing'||mode==='countdown'))pause()});
for(let b of document.querySelectorAll('[data-key]')){b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key)};b.onpointerup=b.onpointercancel=()=>keys.delete(b.dataset.key)}$('drop').onpointerdown=e=>{e.preventDefault();drop(0)};
function resize(){let a=innerWidth/innerHeight,h=Math.max(24,17.3/a);camera.left=-h*a;camera.right=h*a;camera.top=h;camera.bottom=-h;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}window.addEventListener('resize',resize);resize();
function step(dt,now){if(['discovery','confirmExit','gift','paused'].includes(mode))return;if(mode==='countdown'){countdownElapsed+=dt;if(countdownElapsed>=3.6){mode='playing';document.body.dataset.mode=mode;$('countdown').hidden=true;dt=0}else showCountdown()}if(mode==='playing'){elapsed+=dt;updateFrenzy();worldScale=slowUntil>elapsed?.45:1;speed=(base+elapsed*.18)*worldScale;updateHawk(dt);if(elapsed>6)document.body.classList.add('hide-help');time=Math.max(0,60-elapsed);spawnIn-=dt*worldScale;if(spawnIn<=0){spawn();spawnIn=(.30+Math.random()*.25)*(isFrenzy()?.7:1)}for(let i=0;i<count;i++){let p=players[i],left=i?'arrowleft':'a',right=i?'arrowright':'d';let dir=(keys.has(right)?1:0)-(keys.has(left)?1:0);if(count===1)dir+=(keys.has('arrowright')?1:0)-(keys.has('arrowleft')?1:0);dir=dir?Math.sign(dir):controllers.axis(i);const desired=dir*19,k=dir?18:24,decay=Math.exp(-k*dt),old=p.vx;p.vx=desired+(old-desired)*decay;p.x+=desired*dt+(old-desired)*(1-decay)/k;p.x=THREE.MathUtils.clamp(p.x,-11.5,11.5);if((p.x===-11.5&&p.vx<0)||(p.x===11.5&&p.vx>0))p.vx=0;p.cool=Math.max(0,p.cool-dt);p.queued=Math.max(0,p.queued-dt);if(p.cool<=1e-8&&p.rapidUntil>elapsed){p.cool=0;drop(i)}else if(p.queued&&p.cool===0)drop(i);p.g.rotation.z=THREE.MathUtils.lerp(p.g.rotation.z,-p.vx/19*.3,1-Math.exp(-14*dt))}for(let o of scenery){o.position.z+=speed*dt;if(o.position.z>43)o.position.z-=108}for(let i=targets.length-1;i>=0;i--){let t=targets[i];t.g.position.z+=targetSpeed(t)*dt;if(t.kind==='Bicycle')for(const part of t.g.children)if(part.userData.pedal)part.rotation.x=Math.sin(elapsed*10+part.userData.pedal*Math.PI/2)*.6;if(t.react>0){t.react=Math.max(0,t.react-dt);const phase=(.75-t.react)*18;t.g.rotation.z=Math.sin(phase)*t.react*.3;if(t.kind==='Person'){t.g.position.y=Math.abs(Math.sin(phase))*t.react*.9;for(const part of t.g.children)if(part.userData.arm)part.rotation.z=part.userData.arm*t.react*2}}else{t.g.rotation.z=0;t.g.position.y=0;for(const part of t.g.children)if(part.userData.arm)part.rotation.z=0}if(t.g.position.z>35){recycleTarget(t);targets.splice(i,1)}}updatePickups(dt,now);if(mode==='discovery')return;updateCrumbs(dt,now);for(let i=drops.length-1;i>=0;i--){let d=drops[i];d.age+=dt;d.m.position.y=4.8*(1-Math.pow(d.age/flight,2));if(d.age>=flight){impact(d,d.age-flight);recycleEffect(d.m);drops.splice(i,1)}}for(let i=splats.length-1;i>=0;i--){splats[i].position.z+=speed*dt;if(splats[i].position.z>35){recycleEffect(splats[i]);splats.splice(i,1)}}for(let i=bursts.length-1;i>=0;i--){const b=bursts[i];b.life-=dt;b.vy-=15*dt;b.m.position.x+=b.vx*dt;b.m.position.y+=b.vy*dt;b.m.position.z+=(speed+b.vz)*dt;b.m.scale.setScalar(Math.max(.01,b.life*.34));if(b.life<=0){recycleEffect(b.m);bursts.splice(i,1)}}hudClock+=dt;if(hudClock>=.05){hud();hudClock=0}if(time<=0)finish()}cue.position.z=birdZ-(speed+4*worldScale)*flight;for(let i=0;i<count;i++){let p=players[i];p.g.position.set(p.x,5,birdZ);p.g.scale.setScalar(p.invulnerable&&!reducedMotion?1.3+Math.sin(elapsed*25)*.08:1.3);p.ring.position.x=p.x;p.ring.position.z=birdZ;let nearest=null,distance=Infinity;for(const t of targets){if(t.hit||Math.abs(t.g.position.x-p.x)>t.rx+.35+(p.superUntil>elapsed?2.2:0))continue;const error=Math.abs(t.g.position.z+targetSpeed(t)*flight-birdZ);if(error<distance){distance=error;nearest=t}}const quality=mode==='playing'&&p.cool===0&&nearest?hitQuality(nearest,p.x,birdZ-targetSpeed(nearest)*flight,p.superUntil>elapsed?2.2:0):0;const ready=quality>0,aimColor=quality===1?'#73ffb1':quality===.5?'#ffcf65':p.color;p.guide.position.set(p.x,.24,nearest?birdZ-targetSpeed(nearest)*flight:cue.position.z);p.guide.material.color.set(aimColor);p.guide.scale.setScalar(p.superUntil>elapsed?3.6:ready?1.65:1.25);p.ring.material.color.set(aimColor);p.guide.visible=visualCues&&mode==='playing';if(mode!=='paused'){p.wings.forEach((w,j)=>w.rotation.z=Math.sin(now*.025*(characters[p.character].flap||1)+i)*(characters[p.character].species==='dove'?.25:.4)*(j?1:-1));p.g.position.y+=Math.sin(now*.006)*.08;const personality=characters[p.character];p.head.position.y=reducedMotion?0:Math.sin(now*.011*personality.bob+i)*.09;p.head.rotation.x=reducedMotion?0:Math.sin(now*.011*personality.bob+i)*.09;p.tail.rotation.x=reducedMotion?0:Math.sin(now*.019*personality.tail+i)*.24;if(mode==='over'&&(count===1||p.score===Math.max(...players.map(b=>b.score)))){if(!reducedMotion){const style=characters[p.character].win;p.g.rotation.y=style==='spin'?now*.004:Math.sin(now*.007)*.3;p.g.rotation.x=style==='bow'?Math.sin(now*.005)*.45:style==='squawk'?-.2:0;p.head.rotation.x=style==='rock'?Math.sin(now*.022)*.4:p.head.rotation.x;p.g.position.y+=Math.abs(Math.sin(now*(style==='rock'||style==='waddle'?.012:.006)))*.6;if(style==='waddle')p.g.rotation.z=Math.sin(now*.012)*.24;if(style==='squawk')p.wings.forEach((w,j)=>w.rotation.z=(j?1:-1)*(.7+Math.sin(now*.012)*.12))}}else{const brag=mode==='playing'&&p.nearUntil>elapsed&&!reducedMotion;p.g.rotation.y=brag?Math.sin((p.nearUntil-elapsed)/.85*Math.PI)*.28:0;p.head.children[3].scale.y=brag?.012:.055;p.tail.rotation.z=brag?Math.sin((p.nearUntil-elapsed)*14)*.2:0}}}}
function shareSnapshot(){return {mode,route:PIGEON_ROUTES.find(r=>r.id===activeRoute).name,players:players.slice(0,count).map(p=>({name:characters[p.character].name,score:p.score,hits:p.hits,accuracy:p.shots?Math.round(p.hits/p.shots*100):0}))}}
function renderSharingFrame(now=performance.now()){renderer.render(scene,camera);sharing.recordFrame(renderer.domElement,now)}
const sharing=createPigeonSharing({snapshot:shareSnapshot,render:renderSharingFrame});
const controllers=createPigeonControllers({state:()=>({mode,count}),drop,pause,sound:toggleSound,back:()=>{if(mode==='confirmExit')cancelExit();else if(mode==='paused')pause();else requestExit()}});
let prev=performance.now();function frame(now){requestAnimationFrame(frame);controllers.poll(now);let remaining=Math.min((now-prev)/1000,.15);while(remaining>0){const dt=Math.min(remaining,1/120);step(dt,now);remaining-=dt;}prev=now;renderSharingFrame(now)}requestAnimationFrame(frame);
window.pigeonGame={get state(){return{mode,count,time,speed,previewMode,route:activeRoute,selectedRoute,routes:PIGEON_ROUTES.map(r=>({id:r.id,points:r.points,available:routeAvailable(r)})),visualCues,sound,showPowerCards,flock:{...flock,unlocked:[...flock.unlocked],gifts:pendingGifts().map(c=>c.name)},crumbs:crumbs.map(c=>({x:c.position.x,z:c.position.z})),frenzy:isFrenzy(),discovery:pendingDiscovery?.kind||null,worldScale,slowRemaining:Math.max(0,slowUntil-elapsed),pickups:pickups.map(p=>({kind:p.kind,x:p.g.position.x,z:p.g.position.z})),hawk:{phase:hawkPhase,x:hawk.position.x,z:hawk.position.z,warning:hawkWarning,laneVisible:dangerLane.visible},targets:targets.map(t=>({kind:t.kind,x:t.g.position.x,z:t.g.position.z,hit:t.hit,markY:t.mark.position.y,extra:t.extra,rx:t.rx,rz:t.rz})),players:players.slice(0,count).map(p=>({character:characters[p.character].name,species:characters[p.character].species||'pigeon',rapidRemaining:Math.max(0,(p.rapidUntil||0)-elapsed),crumbs:p.crumbs||0,superRemaining:Math.max(0,(p.superUntil||0)-elapsed),guideVisible:p.guide.visible,nearMisses:p.nearMisses||0,bestCombo:p.bestCombo||0,bombHits:p.bombHits||0,clips:p.clips||0,invulnerable:p.invulnerable||0,x:p.x,vx:p.vx,score:p.score,shots:p.shots,hits:p.hits,partialHits:p.partialHits,directHits:p.directHits})),drops:drops.length,pool:Object.fromEntries(Object.entries(trafficPool).map(([k,v])=>[k,v.length])),geometries:renderer.info?.memory?.geometries}},...(new URLSearchParams(location.search).has('test')?{world,characters,selectRoute(id){selectedRoute=id;renderRoutes()},setProgress(points){flock.points=points;saveFlock();renderCharacters()},controllers,step,spawn,drop,warnHawk,spawnPickup,spawnCrumb,sharing,renderSharingFrame,resetFlock(){flock={crumbs:0,points:0,unlocked:[],completed:false};saveFlock();$('showPowerCards').checked=true;showPowerCards=true;selectedCharacters=[0,1];renderCharacters()},resetDiscoveries(){seenPowers.clear();showPowerCards=true;$('showPowerCards').checked=true;try{gameStorage.removeItem(discoveryStorageKey)}catch{}},skipDiscoveries(){seenPowers=new Set(Object.keys(powerTypes));showPowerCards=false;$('showPowerCards').checked=false},quietPickups(){pickupIn=Infinity;hawkWait=Infinity;crumbIn=Infinity},placeTarget(kind,x,z){spawn(kind);targets[targets.length-1].g.position.set(x,0,z)},setupTarget(kind,x,z){clear();spawn(kind);targets[0].g.position.set(x,0,z);spawnIn=10;return targets[0].extra}}: {})};
$('visualCues').addEventListener('change',()=>{document.querySelectorAll('[data-cue-help]').forEach(el=>el.hidden=!$('visualCues').checked)});
})();
