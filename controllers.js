/* Bluetooth and USB controllers are paired by the OS, then exposed by Gamepad API. */
window.createPigeonControllers = function ({state, drop, pause, back, sound}) {
  const slots = [null, null], axes = [0, 0];
  let previousMode = '', lastStatus = '', suspended = false, resync = false;
  const status = document.getElementById('controllerStatus');
  const roots = {intro:'overlay', paused:'pauseDialog', confirmExit:'exitDialog', discovery:'discovery', over:'results', gift:'giftDialog'};
  const primary = {intro:'play', paused:'resumeFlight', confirmExit:'keepFlying', discovery:'discoveryContinue', over:'raceAgain', gift:'giftAction'};
  const pressed = (pad, i) => !!pad.buttons[i]?.pressed || pad.buttons[i]?.value > .5;
  const deadzone = value => Number.isFinite(value) && Math.abs(value) > .2 ? Math.sign(value) * Math.min(1, (Math.abs(value) - .2) / .8) : 0;
  const visible = el => !el.disabled && !el.closest('[hidden], [inert]') && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
  function focus(el) {
    document.querySelectorAll('.controller-focus').forEach(e => e.classList.remove('controller-focus'));
    if (!el) return;
    el.classList.add('controller-focus');
    el.focus({preventScroll:true});
    el.scrollIntoView({block:'nearest', inline:'nearest'});
  }
  function menu(mode, direction = 0, activate = false) {
    const root = document.getElementById(roots[mode]);
    if (!root) return;
    const items = [...root.querySelectorAll('button, input[type="checkbox"], select, summary, a[href]')].filter(visible);
    let active = items.includes(document.activeElement) ? document.activeElement : document.getElementById(primary[mode]);
    if (!active || !visible(active)) active = items[0];
    if (!active) return;
    if (direction) {
      if (active.tagName === 'SELECT' && Math.abs(direction) === 2) {
        active.selectedIndex = Math.max(0, Math.min(active.options.length - 1, active.selectedIndex + Math.sign(direction)));
        active.dispatchEvent(new Event('change', {bubbles:true}));
      } else {
        active = items[(items.indexOf(active) + Math.sign(direction) + items.length) % items.length];
      }
      focus(active);
    } else if (activate) {
      focus(active);
      if (active.tagName === 'SELECT') return; // Left/right changes the value without opening a native popup.
      const index = items.indexOf(active);
      active.click();
      if (!active.isConnected && state().mode === mode) {
        const next = [...root.querySelectorAll('button, input[type="checkbox"], select, summary, a[href]')].filter(visible);
        focus(next[index]); // Character selection replaces its buttons.
      }
    } else focus(active);
  }
  function poll(now = performance.now(), suppliedPads) {
    let pads, unavailable = suppliedPads === undefined && !navigator.getGamepads;
    try { pads = [...(suppliedPads ?? navigator.getGamepads?.() ?? [])].filter(p => p && p.connected !== false); }
    catch { pads = []; unavailable = true; }
    const supported = pads.filter(p => p.mapping === 'standard');
    const before = state();
    let disconnected = false;
    for (let i = 0; i < 2; i++) {
      const slot = slots[i];
      if (slot && !supported.some(p => p.index === slot.index)) {
        if (i < before.count) disconnected = true;
        slots[i] = null; axes[i] = 0;
      }
    }
    for (const pad of supported) {
      if (slots.some(s => s?.index === pad.index)) continue;
      const vacant = slots.indexOf(null);
      if (vacant < 0) break;
      // Ignore the button used to reveal/connect a controller until released.
      slots[vacant] = {index:pad.index, buttons:pad.buttons.map((_,i) => pressed(pad,i)), direction:0, nextRepeat:0, navigationReady:false};
    }
    if (disconnected && ['playing','countdown'].includes(before.mode)) pause();
    const labels = slots.map((s,i) => s ? `P${i+1} connected` : '').filter(Boolean);
    const message = unavailable ? 'Controller access is unavailable in this browser. Keyboard and touch still work.' : labels.length ? `${labels.join(' · ')}${disconnected ? ' · Controller disconnected; flight paused.' : ''}` : pads.length ? 'This controller has no standard browser mapping. Try another controller or use the keyboard.' : disconnected ? 'Controller disconnected. Reconnect or use the keyboard to resume.' : 'Pair in device settings, then press a controller button here.';
    if (message !== lastStatus) { status.textContent = message; lastStatus = message; }
    const mode = state().mode;
    if (mode !== previousMode) {
      previousMode = mode;
      if (labels.length && roots[mode]) focus(document.getElementById(primary[mode]));
      slots.forEach(s => {if(s){s.direction=0;s.nextRepeat=now+350;s.navigationReady=false;}});
    }
    for (let i = 0; i < 2; i++) {
      const slot = slots[i];
      if (!slot) {axes[i] = 0; continue;}
      const pad = supported.find(p => p.index === slot.index);
      const buttons = pad.buttons.map((_,j) => pressed(pad,j));
      const edge = j => !resync && buttons[j] && !slot.buttons[j];
      const horizontal = pressed(pad,15) ? 1 : pressed(pad,14) ? -1 : deadzone(pad.axes[0]);
      axes[i] = !suspended && !document.hidden && state().mode === 'playing' && i < state().count ? horizontal : 0;
      if (!suspended && !document.hidden && state().mode === mode) {
        if (edge(9) && ['playing','countdown','paused'].includes(mode)) pause();
        else if (edge(1)) back();
        else if (edge(3)) sound();
        else if (edge(0)) {
          if (mode === 'playing' && i < state().count) drop(i);
          else if (roots[mode]) menu(mode,0,true);
        } else if (roots[mode]) {
          const vertical = pressed(pad,13) ? 1 : pressed(pad,12) ? -1 : deadzone(pad.axes[1]);
          const direction = Math.abs(vertical) > .5 ? Math.sign(vertical) : Math.abs(horizontal) > .5 ? 2*Math.sign(horizontal) : 0;
          if (!direction) slot.navigationReady=true;
          if (slot.navigationReady && direction && (direction !== slot.direction || now >= slot.nextRepeat)) {
            menu(mode,direction);slot.nextRepeat=now+(direction!==slot.direction?350:140);
          }
          slot.direction=direction;
        }
      }
      slot.buttons=buttons;
    }
    resync=false;
  }
  window.addEventListener('blur', () => {suspended=true; axes.fill(0);});
  window.addEventListener('focus', () => {suspended=false;resync=true;});
  // Mouse and keyboard retain their normal focus styling.
  for (const event of ['pointerdown','keydown']) document.addEventListener(event, () => document.querySelectorAll('.controller-focus').forEach(e => e.classList.remove('controller-focus')));
  return {poll, axis:i=>axes[i] || 0, get slots(){return slots.map(s=>s?.index ?? null)}};
};
