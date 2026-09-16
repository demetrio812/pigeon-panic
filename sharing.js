/* Results sharing and opt-in, local-only highlight capture. */
'use strict';
window.createPigeonSharing = function ({ snapshot, render }) {
  const $ = id => document.getElementById(id);
  const playURL = 'https://pigeon-panic-express.novaware.chatgpt.site/';
  const format = n => Math.max(0, Math.round(n)).toLocaleString('en-GB');
  let result = null, busy = false, session = null, clip = null, clipURL = '', serial = 0;
  const status = message => { $('shareStatus').textContent = message; };
  const supportsClips = () => typeof MediaRecorder !== 'undefined' && typeof HTMLCanvasElement.prototype.captureStream === 'function';
  const portraits = new Map();

  function challenge(data = result) {
    if (!data) return '';
    const scores = data.players.map(p => format(p.score));
    const context = data.early ? 'an early flight' : '60 seconds';
    return data.players.length === 1
      ? `I scored ${scores[0]} in ${context} on Pigeon Panic—beat that!`
      : `We scored ${scores[0]} and ${scores[1]} in ${context} on Pigeon Panic. Beat our best: ${format(Math.max(...data.players.map(p => p.score)))}!`;
  }
  function payload() { return { title: 'Pigeon Panic — beat that!', text: challenge(), url: playURL }; }
  function manualCopy(text) {
    $('challengeText').value = text; $('manualShare').hidden = false;
    $('challengeText').focus(); $('challengeText').select();
    status('Select and copy the message below, then send it to a friend.');
  }
  async function copyChallenge() {
    if (!result) return;
    const text = challenge() + '\n' + playURL;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      $('manualShare').hidden = true; status('Challenge copied. Send it to a friend!');
    } catch { manualCopy(text); }
  }
  async function shareChallenge() {
    if (!result || busy) return;
    busy = true; $('shareScore').disabled = true;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share(payload()); status('Challenge handed to your share app.');
      } else await copyChallenge();
    } catch (error) {
      if (error.name === 'AbortError') status('Sharing cancelled. Your score is still here.');
      else await copyChallenge();
    } finally { busy = false; $('shareScore').disabled = false; }
  }
  function imageFor(name) {
    if (!portraits.has(name)) portraits.set(name, new Promise(resolve => {
      const img = new Image(); img.onload = () => resolve(img); img.onerror = () => resolve(null);
      img.src = 'assets/characters/' + name.toLowerCase() + '.png';
    }));
    return portraits.get(name);
  }
  async function scoreCard(data = result) {
    if (!data) return null;
    const images = await Promise.all(data.players.map(p => imageFor(p.name)));
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1080;
    const c = canvas.getContext('2d');
    c.fillStyle = '#fff9e9'; c.fillRect(0, 0, 1080, 1080);
    c.fillStyle = '#e7ece2'; c.beginPath(); c.ellipse(540, 370, 500, 300, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#203d40'; c.lineWidth = 10; c.strokeRect(20, 20, 1040, 1040);
    c.textAlign = 'center'; c.fillStyle = '#203d40'; c.font = '900 64px system-ui, sans-serif';
    c.fillText('PIGEON PANIC', 540, 110);
    c.font = '26px system-ui, sans-serif'; c.fillText('Tiny bird. Big trouble.', 540, 155);
    const two = data.players.length === 2;
    data.players.forEach((p, i) => {
      const x = two ? 290 + i * 500 : 540, size = two ? 255 : 310;
      if (images[i]) c.drawImage(images[i], x - size / 2, 205, size, size);
      c.fillStyle = '#203d40'; c.font = 'bold 32px system-ui, sans-serif';
      c.fillText((two ? 'P' + (i + 1) + ' · ' : '') + p.name, x, 560);
      c.fillStyle = i ? '#235889' : '#b6314a';
      c.font = `900 ${two ? 88 : 144}px system-ui, sans-serif`;
      c.fillText(format(p.score), x, 715, two ? 440 : 920);
      c.fillStyle = '#203d40'; c.font = '24px system-ui, sans-serif';
      c.fillText(p.accuracy + '% accuracy · ' + p.hits + ' hits', x, 765);
    });
    c.fillStyle = '#203d40'; c.font = '900 50px system-ui, sans-serif'; c.fillText('BEAT THAT.', 540, 870);
    c.font = '24px system-ui, sans-serif';
    c.fillText(data.early ? 'Early flight · another mess awaits' : '60 seconds. Your turn.', 540, 915);
    c.fillStyle = '#eb5966'; c.fillRect(25, 950, 1030, 105);
    c.fillStyle = '#fff9e9'; c.font = 'bold 27px system-ui, sans-serif';
    c.fillText('pigeon-panic-express.novaware.chatgpt.site', 540, 1015, 950);
    return canvas;
  }
  function download(blob, name) {
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  async function saveCard() {
    if (!result || $('saveScoreCard').disabled) return;
    $('saveScoreCard').disabled = true;
    try {
      const canvas = await scoreCard();
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Image export unavailable');
      download(blob, 'pigeon-panic-beat-that.png'); status('Score image ready to save. Share it with your play link.');
    } catch { status('Could not create the image. You can still copy or share your challenge.'); }
    finally { $('saveScoreCard').disabled = false; }
  }
  function refreshClipControls() {
    const recording = !!session, supported = supportsClips();
    $('recordClip').hidden = !supported;
    $('recordClip').textContent = recording ? '■ Stop clip' : '● Record';
    $('recordClip').setAttribute('aria-pressed', String(recording));
    $('recordCelebration').hidden = !supported;
    $('recordCelebration').textContent = recording ? 'Stop recording' : 'Record victory · 10s';
    $('recordCelebration').disabled = recording && session.stopping;
    $('clipReady').hidden = !clip;
    $('clipSupport').textContent = supported ? 'Optional 10-second silent clips. Save before your next flight.' : 'Clip recording is unavailable in this browser. You can still save your score image.';
  }
  function clearClip() {
    serial++;
    if (session) {
      const old = session; session = null;
      if (old.recorder.state !== 'inactive') old.recorder.stop();
      old.stream.getTracks().forEach(t => t.stop());
    }
    clip = null;
    $('clipPreview').pause(); $('clipPreview').removeAttribute('src'); $('clipPreview').load();
    if (clipURL) URL.revokeObjectURL(clipURL); clipURL = '';
    $('clipNotice').hidden = true; $('clipSection').open = false; refreshClipControls();
  }
  function stopClip() {
    if (!session || session.stopping) return;
    session.stopping = true;
    $('clipNotice').textContent = 'Preparing your clip…';
    if (session.recorder.state !== 'inactive') session.recorder.stop();
    refreshClipControls();
  }
  function startClip() {
    if (session) { stopClip(); return; }
    const state = snapshot();
    if (!supportsClips() || !['playing', 'over'].includes(state.mode)) return;
    clearClip(); const id = serial;
    let stream;
    try {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(1, 720 / innerWidth, 720 / innerHeight);
      canvas.width = Math.max(2, Math.floor(innerWidth * ratio / 2) * 2);
      canvas.height = Math.max(2, Math.floor(innerHeight * ratio / 2) * 2);
      stream = canvas.captureStream(24);
      const type = ['video/mp4;codecs=avc1.42E01E', 'video/mp4;codecs=avc1', 'video/webm;codecs=vp8', 'video/mp4', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t));
      const recorder = new MediaRecorder(stream, { ...(type ? { mimeType: type } : {}), videoBitsPerSecond: 1800000 });
      const chunks = [];
      session = { recorder, stream, canvas, context: canvas.getContext('2d'), seconds: 0, last: null, lastPaint: -Infinity, stopping: false };
      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        if (id !== serial) return;
        session = null;
        const blob = new Blob(chunks, { type: recorder.mimeType || type || 'video/webm' });
        if (blob.size) {
          clip = blob; clipURL = URL.createObjectURL(blob); $('clipPreview').src = clipURL; $('clipSection').open = true;
          $('saveClip').href = clipURL; $('saveClip').download = 'pigeon-panic-highlight.' + (blob.type.includes('mp4') ? 'mp4' : 'webm');
          $('clipNotice').textContent = 'Clip ready · save it from your results'; status('Your clip is ready to preview and save.');
        } else { $('clipNotice').textContent = 'No clip captured. Try again while the game is visible.'; }
        refreshClipControls();
      };
      recorder.onerror = () => {
        clearClip(); $('clipNotice').hidden = false; $('clipNotice').textContent = 'Recording failed. Score sharing is still available.';
      };
      recorder.start(250); $('clipNotice').hidden = false; $('clipNotice').textContent = 'Recording · 10s';
      refreshClipControls(); render();
    } catch {
      if (stream) stream.getTracks().forEach(t => t.stop()); session = null;
      $('clipNotice').hidden = false; $('clipNotice').textContent = 'This browser could not start a clip. Try saving a score image instead.';
      refreshClipControls();
    }
  }
  function recordFrame(source, now) {
    const current = session;
    if (!current || current.stopping) return;
    const state = snapshot(), active = ['playing', 'over'].includes(state.mode) && !document.hidden;
    if (!active) {
      if (current.recorder.state === 'recording') current.recorder.pause();
      current.last = null; return;
    }
    if (current.recorder.state === 'paused') current.recorder.resume();
    const dt = current.last === null ? 0 : Math.max(0, Math.min((now - current.last) / 1000, .15));
    current.last = now; current.seconds += dt;
    if (now - current.lastPaint >= 1000 / 24) {
      current.lastPaint = now;
      const c = current.context, w = current.canvas.width, h = current.canvas.height;
      c.drawImage(source, 0, 0, w, h);
      const font = Math.max(12, Math.round(w * .027)), bar = font * 4.8;
      c.fillStyle = '#fff9e9f2'; c.fillRect(0, 0, w, bar);
      c.fillStyle = '#203d40'; c.textAlign = 'center'; c.font = `900 ${font * 1.3}px system-ui, sans-serif`;
      c.fillText(state.mode === 'over' ? 'SPECIAL DELIVERY. BEAT THAT!' : 'PIGEON PANIC', w / 2, font * 1.6, w - 20);
      c.font = `bold ${font}px system-ui, sans-serif`;
      c.fillText(state.players.map((p, i) => (state.players.length > 1 ? 'P' + (i + 1) + ' ' : '') + p.name + ' · ' + format(p.score)).join('   /   '), w / 2, font * 3.3, w - 20);
      c.fillStyle = '#203d40e8'; c.fillRect(0, h - font * 2.8, w, font * 2.8);
      c.fillStyle = '#fff9e9'; c.font = `${font * .8}px system-ui, sans-serif`;
      c.fillText('pigeon-panic-express.novaware.chatgpt.site', w / 2, h - font, w - 16);
      $('clipNotice').textContent = 'Recording · ' + Math.max(0, Math.ceil(10 - current.seconds)) + 's';
    }
    if (current.seconds >= 10) stopClip();
  }
  function setResult(data) {
    result = data; $('shareHeadline').textContent = challenge();
    $('manualShare').hidden = true; status('A little friendly competition?'); refreshClipControls();
  }
  $('shareScore').onclick = shareChallenge; $('copyChallenge').onclick = copyChallenge; $('saveScoreCard').onclick = saveCard;
  $('recordClip').onclick = startClip; $('recordCelebration').onclick = startClip;
  function suspendInactiveCapture() {
    if (!session || session.stopping) return;
    if (document.hidden || !['playing', 'over'].includes(snapshot().mode)) {
      if (session.recorder.state === 'recording') session.recorder.pause();
      session.last = null;
    }
  }
  new MutationObserver(suspendInactiveCapture).observe(document.body, { attributes: true, attributeFilter: ['data-mode'] });
  document.addEventListener('visibilitychange', suspendInactiveCapture);
  // Leaving the results to choose another bird finalizes any victory recording.
  $('raceAgain').addEventListener('click', stopClip);
  window.addEventListener('pagehide', clearClip);
  refreshClipControls();
  return { setResult, reset: clearClip, startClip, stopClip, recordFrame, payload, scoreCard,
    get state() { return { recording: !!session, seconds: session?.seconds || 0, ready: !!clip, type: clip?.type || null, bytes: clip?.size || 0 }; } };
};
