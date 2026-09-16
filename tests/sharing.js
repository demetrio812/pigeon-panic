window.runSharingTests = async () => {
  const g=pigeonGame,$=id=>document.getElementById(id),checks=[];
  const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name)};
  const key=k=>window.dispatchEvent(new KeyboardEvent('keydown',{key:k,cancelable:true}));
  const finish=()=>{key('Escape');$('endFlight').click()};
  const start=()=>{$('play').click();g.step(3.61,0);g.skipDiscoveries();g.quietPickups()};
  const settle=()=>new Promise(r=>setTimeout(r,0));
  const originalShare=Object.getOwnPropertyDescriptor(navigator,'share'),originalClipboard=Object.getOwnPropertyDescriptor(navigator,'clipboard');
  let sent=null,copied='',copies=0;
  try {
    Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{sent=data}});
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{copied=text;copies++}}});
    start();check('Recording is off by default',!g.sharing.state.recording&&!g.sharing.state.ready);
    for(let i=0;i<5;i++){g.spawnCrumb(0,13);g.step(0,0)}finish();
    check('Early flight shares the earned score honestly',g.sharing.payload().text.includes('50')&&g.sharing.payload().text.includes('early flight'));
    check('Share URL always points to the public game',g.sharing.payload().url==='https://pigeon-panic-express.novaware.chatgpt.site/');
    check('No test or localhost parameters leak into share data',!JSON.stringify(g.sharing.payload()).match(/localhost|127\.0\.0\.1|test=|share-check/));
    const points=g.state.players[0].score;
    $('shareScore').click();await settle();
    check('Native share receives a title, message and play link',sent.title.includes('Pigeon Panic')&&sent.text===g.sharing.payload().text&&sent.url===g.sharing.payload().url);
    check('Sharing preserves the result and score',g.state.mode==='over'&&g.state.players[0].score===points);
    Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('Cancelled','AbortError')}});
    $('shareScore').click();await settle();
    check('Cancelling native share does not silently copy',copies===0&&$('shareStatus').textContent.includes('cancelled'));
    Object.defineProperty(navigator,'share',{configurable:true,value:undefined});
    $('shareScore').click();await settle();
    check('Browsers without native share copy the whole challenge',copied.includes('50')&&copied.includes(g.sharing.payload().url));
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('Denied')}}});
    $('copyChallenge').click();await settle();
    check('Clipboard denial exposes selectable challenge text',!$('manualShare').hidden&&$('challengeText').value.includes(g.sharing.payload().url));
    $('saveScoreCard').focus();const event=new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true});$('saveScoreCard').dispatchEvent(event);
    check('Focused share actions keep their native keyboard action',!event.defaultPrevented&&g.state.mode==='over');
    $('resultsTitle').focus();key('Enter');check('Main Enter still returns to selection',g.state.mode==='intro');
    document.querySelector('[data-players="2"]').click();start();g.spawnCrumb(3,13);g.step(0,0);finish();
    check('Two-player sharing includes both scores',g.sharing.payload().text.includes('We scored 0 and 10'));
    const card=await g.sharing.scoreCard();
    check('Score card renders a square downloadable image',card.width===1080&&card.height===1080&&card.toDataURL().startsWith('data:image/png'));
    key('Enter');document.querySelector('[data-players="1"]').click();start();
    for(let left=60.05;left>1e-8;left-=1/120)g.step(Math.min(left,1/120),0);
    check('Completed rounds use the sixty-second challenge message',g.sharing.payload().text.includes('60 seconds')&&!g.sharing.payload().text.includes('early'));
    check('Sharing never unlocks characters or awards bonus points',g.state.players[0].score===0);
  } finally {
    if(originalShare)Object.defineProperty(navigator,'share',originalShare);else delete navigator.share;
    if(originalClipboard)Object.defineProperty(navigator,'clipboard',originalClipboard);else delete navigator.clipboard;
  }
  return checks;
};
