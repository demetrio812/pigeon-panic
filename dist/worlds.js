/* Each route owns only its environment; movement, scoring and hitboxes stay shared. */
window.PIGEON_ROUTES = [
 {id:'market',name:'Market Street',tag:'THE ORIGINAL MESS',points:0,description:'Pastel shops, striped awnings, familiar victims.',sky:'#9ecbb8',ground:'#8dbc9b',road:'#53686e',pavement:'#e7d6af',accent:'#ed7f86'},
 {id:'neon',name:'Neon District',tag:'AFTER HOURS',points:2000,description:'Midnight towers, electric signs, late-night deliveries.',sky:'#25334f',ground:'#344665',road:'#3c4260',pavement:'#677497',accent:'#bb8ce8'},
 {id:'oldtown',name:'Old Town',tag:'GOLDEN HOUR',points:5000,description:'Terracotta rooftops and a sun-soaked cobbled boulevard.',sky:'#e8c49d',ground:'#b9b584',road:'#978e81',pavement:'#edcf9f',accent:'#dd9769'},
 {id:'gardens',name:'Dove Gardens',tag:'DOVE EXCLUSIVE',points:1500,species:'dove',description:'A leafy garden avenue with fountains and blossom.',sky:'#c5dfca',ground:'#83b395',road:'#aab59e',pavement:'#eee8cf',accent:'#b8cfab'},
 {id:'harbour',name:'Seagull Harbour',tag:'SEAGULL EXCLUSIVE',points:4500,species:'seagull',description:'A coastal causeway. Boats, beach huts, maximum smugness.',sky:'#93d8e2',ground:'#57acbe',road:'#637e87',pavement:'#e9d4a4',accent:'#65b9ce'},
 {id:'ice',name:'Penguin Ice Run',tag:'PENGUIN EXCLUSIVE',points:9000,species:'penguin',description:'Snowcats, sleds and snowmobiles. Flying is a state of mind.',sky:'#b8dbe8',ground:'#dfeef2',road:'#8eb9ce',pavement:'#f0f5ea',accent:'#87adce'}
];
window.createPigeonWorld = function ({scene,box,ball,scenery,sun}) {
 let root=null,current=null;
 const group=(x,z,scroll=true)=>{const g=new THREE.Group();g.position.set(x,0,z);root.add(g);if(scroll)scenery.push(g);return g};
 function tree(g,x,z,color='#50926c',size=1){box(.3,1.5,.3,'#9b7457',x,.75,z,g);ball(size,color,x,2,z,g,1,1.2,1)}
 function build(id) {
  const route=PIGEON_ROUTES.find(r=>r.id===id)||PIGEON_ROUTES[0];
  if(current===route.id)return;
  if(root)scene.remove(root);
  root=new THREE.Group();scene.add(root);current=route.id;scenery.length=0;
  scene.background.set(route.sky);sun.color.set(route.id==='neon'?'#d5dbff':route.id==='oldtown'?'#ffdda6':'#ffefd3');
  sun.intensity=route.id==='neon'?1.8:2.6;
  box(80,.4,160,route.ground,0,-.35,0,root);box(16,.12,150,route.road,0,0,0,root);
  for(const x of [-10.3,10.3]){box(4.6,.22,150,route.pavement,x,.04,0,root);box(.2,.3,150,'#fff2d2',Math.sign(x)*8.15,.1,0,root)}
  for(let z=-65;z<40;z+=6){
   for(const x of [-2.65,2.65]){const g=group(x,z);box(.16,.025,2.8,route.id==='ice'?'#d9f6fb':'#f4eac9',0,.1,0,g)}
   if(route.id==='oldtown'){const g=group(0,z);for(let n=-3;n<=3;n++)box(1.8,.02,.06,'#b3aa98',n*2,.1,0,g)}
  }
  for(let z=-60;z<36;z+=12)for(const side of [-1,1]){
   const g=group(side*17,z);
   if(route.id==='market'){
    box(6,2.8,8,side>0?'#e5ad97':'#83a9b1',0,1.4,0,g);box(6.3,.25,8.3,'#ffe6bb',0,2.9,0,g);box(5.3,.12,7.3,'#b59c80',0,3.1,0,g);
    tree(g,-side*3.6,4);for(let k=0;k<6;k++)box(1.15,.14,.72,k%2?'#fff1cc':side>0?'#e56c7f':'#488b9c',-side*3.2,1.65,-2.9+k*1.15,g);
    box(.1,1.1,4.5,'#426b74',-side*3.02,.8,0,g);
   }else if(route.id==='neon'){
    const height=4+(z+60)%3;box(6,height,8,side>0?'#3d486a':'#575575',0,height/2,0,g);box(6.3,.18,8.3,'#8c91b3',0,height+.1,0,g);
    for(let y=1;y<height;y+=1.4)for(let k=-2;k<=2;k+=2)box(.1,.55,.65,(k+y)%2?'#ffcea3':'#80e6df',-side*3.04,y,k,g);
    box(.15,.3,5,'#f69ad0',-side*3.12,2.6,0,g);box(.25,2,.25,'#82dbd3',-side*4.3,1,3.5,g);ball(.38,'#ffe0b5',-side*4.3,2.2,3.5,g);
   }else if(route.id==='oldtown'){
    box(6,3.5,8,side>0?'#edc793':'#d5a986',0,1.75,0,g);
    for(const slope of [-1,1]){const roof=box(3.7,.3,8.8,'#b96f59',slope*1.55,4.1,0,g);roof.rotation.z=-slope*.4}
    for(let k=-2.6;k<3;k+=2.6){box(.14,1.05,.95,'#626f75',-side*3.03,1.6,k,g);box(.2,.14,1.2,'#aa6c4e',-side*3.15,.98,k,g)}
    tree(g,-side*4,4,'#82945f',.85);
   }else if(route.id==='gardens'){
    for(let k=-3;k<=3;k+=3){tree(g,side*1.5,k,k%2?'#d5b9d1':'#5c9d79',1.3);box(2,.45,1.2,'#6c9a69',-side*3,.3,k,g);for(let f=-.65;f<1;f+=.65)ball(.19,'#f4c1cd',-side*3+f,.64,k,g)}
    ball(1.5,'#e9e1cc',0,.25,0,g,1,.2,1);ball(1.22,'#82c6d4',0,.57,0,g,1,.08,1);box(.25,1.1,.25,'#ddd9c3',0,1,0,g);ball(.4,'#bcdfdf',0,1.65,0,g);
   }else if(route.id==='harbour'){
    box(6,.25,3,'#bca079',0,.2,3.5,g);for(let k=-2;k<=2;k+=2)box(.2,.7,.2,'#886d52',k,.5,4.9,g);
    const boat=new THREE.Group();boat.position.set(side*2,.1,-1.7);g.add(boat);ball(1.7,'#faf0d6',0,.3,0,boat,1,.45,2);box(1.5,.6,1.6,'#e78f78',0,.85,0,boat);box(.12,3,.12,'#edddbd',0,2,0,boat);const sail=box(1.3,1.8,.08,'#fff5df',.7,2.6,0,boat);sail.rotation.z=.12;
    box(1.8,1.4,2,'#f1c35d',-side*3.2,.9,-3.5,g);box(2,.15,2.2,'#fff3d6',-side*3.2,1.7,-3.5,g);
   }else{
    ball(3.3,'#f4f8f5',side*1.6,1.1,0,g,1,.75,1.3);ball(1.9,'#b7dce9',-side*1,1,-3,g,1,.9,1.2);
    box(2.4,1.7,2.5,'#e78973',-side*2.6,.85,3.4,g);box(2.8,.3,2.9,'#eff8f4',-side*2.6,1.85,3.4,g);
    for(const x of [-.5,.5])box(.12,.12,3.4,'#788f9d',-side*2.6+x,.16,3.4,g);
   }
  }
  if(['market','neon','oldtown'].includes(route.id))for(const z of [-35,19]){const g=group(0,z);for(let x=-7;x<8;x+=1.4)box(.8,.02,2.8,'#eee8cf',x,.1,0,g)}
 }
 function iceVehicle(kind,g){
  if(current!=='ice')return false;
  if(kind==='Car'){
   box(2.2,.8,4,'#e89958',0,.7,0,g);box(1.9,.65,2.1,'#fff0cf',0,1.35,0,g);box(1.75,.06,.7,'#47758e',0,1.69,.65,g);
   for(const x of [-1.1,1.1])box(.35,.6,3.3,'#435569',x,.35,0,g);
  }else if(kind==='Motorcycle'){
   box(.8,.55,1.9,'#ea746d',0,.7,0,g);for(const x of [-.5,.5])box(.12,.12,2.5,'#42586b',x,.18,0,g);
   box(.5,.6,.55,'#394e6a',0,1.08,-.4,g);ball(.33,'#ffe0a4',0,1.42,-.1,g);
  }else if(kind==='Bicycle'){
   for(const x of [-.4,.4])box(.12,.12,2.2,'#526c80',x,.15,0,g);box(.8,.15,1.5,'#c59367',0,.4,0,g);box(.5,.8,.5,'#dfb950',0,.9,0,g);ball(.28,'#edd1ad',0,1.48,.15,g);ball(.31,'#f3e6ce',0,1.64,.12,g,1,.65,1);
  }else{box(.7,.85,.6,'#df786b',0,.95,0,g);ball(.33,'#f3dec2',0,1.65,0,g);ball(.36,'#344f70',0,1.83,0,g,1,.6,1);for(const x of [-.18,.18])box(.22,.5,.32,'#37516c',x,.35,0,g)}
  return true;
 }
 build('market');
 return {build,iceVehicle,get id(){return current},get root(){return root}};
};
