// Uses the browser's real MediaRecorder, without requesting camera or microphone access.
window.runClipTests = async () => {
 const g=pigeonGame,$=id=>document.getElementById(id),checks=[];
 const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name)};
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const key=k=>window.dispatchEvent(new KeyboardEvent('keydown',{key:k,cancelable:true}));
 g.resetFlock();$('play').click();g.step(3.61,0);g.skipDiscoveries();g.quietPickups();
 if(typeof MediaRecorder==='undefined'||typeof HTMLCanvasElement.prototype.captureStream!=='function'){
  check('Unsupported browsers hide recording controls',$('recordClip').hidden);return checks;
 }
 key('r');check('R starts an opt-in recording',g.sharing.state.recording);
 for(let i=0;i<5;i++){g.renderSharingFrame();await wait(40)}
 key('p');await wait(0);const before=g.sharing.state.seconds;await wait(200);g.renderSharingFrame();
 check('Pause excludes time from the recording',g.sharing.state.seconds===before);
 key('p');key('Escape');await wait(0);g.renderSharingFrame();
 check('Exit confirmation also suspends recording',g.sharing.state.seconds===before);
 $('endFlight').click();
 check('Round end lets the recording continue into the celebration',g.state.mode==='over'&&g.sharing.state.recording);
 const timeout=performance.now()+12500;
 while(g.sharing.state.recording&&performance.now()<timeout){g.step(.04,performance.now());g.renderSharingFrame();await wait(40)}
 for(let i=0;i<40&&!g.sharing.state.ready;i++)await wait(50);
 check('The clip automatically stops and finalizes at ten active seconds',!g.sharing.state.recording&&g.sharing.state.ready);
 const v=$('clipPreview');
 for(let i=0;i<30&&v.readyState<2;i++)await wait(50);
 check('The captured file is nonempty and playable',g.sharing.state.bytes>1000&&v.readyState>=2&&!v.error);
 check('Video export stays within a 720px resolution budget',v.videoWidth>0&&v.videoWidth<=720&&v.videoHeight<=720);
 check('Results expose the preview and download link',!$('clipReady').hidden&&$('clipSection').open&&$('saveClip').href.startsWith('blob:'));
 check('Download extension matches the recorded format',$('saveClip').download.endsWith(g.sharing.state.type.includes('mp4')?'.mp4':'.webm'));
 key('Enter');$('play').click();
 check('Starting another round clears the old clip and preview',!g.sharing.state.ready&&!g.sharing.state.recording&&!v.getAttribute('src'));
 g.step(3.61,0);g.quietPickups();key('r');g.renderSharingFrame();await wait(100);key('r');
 for(let i=0;i<30&&g.sharing.state.recording;i++)await wait(50);
 check('R can stop a clip early',!g.sharing.state.recording);
 return checks;
};
