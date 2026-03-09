!function(t){const n=16,e=184,i=20;function a(t,n){if(n>=1)return[t];if(n<=0)return[];const e=Math.max(1,Math.round(i*n)),a=i-e,o=[];let r=t;for(;r>=i;)o.push(e,a),r-=i;if(r>0){const t=Math.max(1,Math.round(r*n)),e=r-t;o.push(t),e>0&&o.push(e)}return o}let o=0;function r(t){null!==t.rafId&&(cancelAnimationFrame(t.rafId),t.rafId=null),t.patternResolve?.(),t.patternResolve=null}const s="undefined"!=typeof navigator&&"function"==typeof navigator.vibrate;t.WebHaptics={isSupported:s,createHaptics:function(){const t={hapticLabel:null,domInitialized:!1,rafId:null,patternResolve:null};return{isSupported:s,async trigger(i,l){l=l||{};const u=function(t){if("number"==typeof t)return{vibrations:[{duration:t}]};if(Array.isArray(t)){if(0===t.length)return{vibrations:[]};if("number"==typeof t[0]){const n=[];for(let e=0;e<t.length;e+=2){const i=e>0?t[e-1]:0;n.push({...i>0&&{delay:i},duration:t[e]})}return{vibrations:n}}return{vibrations:t.map((t=>({...t})))}}return{vibrations:t.pattern.map((t=>({...t})))}}(i=i||[{duration:25,intensity:.7}]);if(!u)return;const{vibrations:c}=u;if(0===c.length)return;const d=Math.max(0,Math.min(1,l.intensity??.5));for(const t of c)if(t.duration>1e3&&(t.duration=1e3),!Number.isFinite(t.duration)||t.duration<0||void 0!==t.delay&&(!Number.isFinite(t.delay)||t.delay<0))return void console.warn("[web-haptics-js] Invalid vibration values.");if(s&&navigator.vibrate(function(t,n){const e=[];for(const i of t){const t=Math.max(0,Math.min(1,i.intensity??n)),o=i.delay??0;o>0&&(e.length>0&&e.length%2==0?e[e.length-1]+=o:(0===e.length&&e.push(0),e.push(o)));const r=a(i.duration,t);0!==r.length?e.push(...r):e.length>0&&e.length%2==0?e[e.length-1]+=i.duration:i.duration>0&&e.push(0,i.duration)}return e}(c,d)),!s){if(function(t){if(t.domInitialized||"undefined"==typeof document)return;const n="web-haptics-js-"+ ++o,e=document.createElement("label");e.htmlFor=n,e.style.display="none";const i=document.createElement("input");i.type="checkbox",i.setAttribute("switch",""),i.id=n,i.style.display="none",e.appendChild(i),document.body.appendChild(e),t.hapticLabel=e,t.domInitialized=!0}(t),!t.hapticLabel)return;r(t);const i=0===(c[0]?.delay??0);i&&t.hapticLabel.click(),await function(t,i,a,o){return new Promise((r=>{t.patternResolve=r;const s=[];let l=0;for(const t of i){const n=Math.max(0,Math.min(1,t.intensity??a)),e=t.delay??0;e>0&&(l+=e,s.push({end:l,isOn:!1,intensity:0})),l+=t.duration,s.push({end:l,isOn:!0,intensity:n})}const u=l;let c=0,d=-1;const f=i=>{0===c&&(c=i);const a=i-c;if(a>=u)return t.rafId=null,t.patternResolve=null,void r();let l=s[0];for(const t of s)if(a<t.end){l=t;break}if(l.isOn){const a=n+(1-l.intensity)*e;-1===d?(d=i,o||(t.hapticLabel?.click(),o=!0)):i-d>=a&&(t.hapticLabel?.click(),d=i)}t.rafId=requestAnimationFrame(f)};t.rafId=requestAnimationFrame(f)}))}(t,c,d,i)}},cancel(){r(t),s&&navigator.vibrate(0)},destroy(){r(t),t.hapticLabel?.remove(),t.hapticLabel=null,t.domInitialized=!1}}}}}("undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:this);

const haptics = WebHaptics.createHaptics();
const BOARD_SIZE = 16;
const MAX_LEVEL_ITEMS = 7;
const HIGH_SCORE_KEY = 'sequence_high_score';
const REVEAL_TIME_MS = 1400;
const ANIMATION_DURATION_MS = 400;
const NEXT_LEVEL_DELAY_MS = 700;
const SOUND_DELAY_MS = 200;

const gridEl = document.getElementById('game-grid');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('best-score-value');
const instructionsEl = document.getElementById('instructions');

const soundEffect = {
  fail: [2.4, , 42, 0.05, 0.19, 0.76, , 2.6, , , , , 0.06, 1, , 0.6, 0.03, 0.39, 0.1, 0.48],
  success: [1.1, , 690, 0.02, 0.02, 0.19, , 3.7, , -20, 300, 0.1, 0.03, , , 0.1, , 0.73, 0.01],
  //tap: [0.9, , 85, 0.01, 0.04, 0.23, 1, 1.5, , , , , , 0.9, , 0.4, , 0.64, 0.04, 0.06, -2424]
  tap: [1, 0.08, 589, 0.01, , 0.03, 1, 4.4, , , , , , , , , , 0.51, 0.02]
};

let score = 0;
let bestScore = 0;
let level = 1;
let sequence = [];
let isGameOver = false;
let idolNumber = null;
let expectingIdol = false;
let hasCompletedMaxLevel = false;
let waitingForFirstClick = true;
let postMaxLevelStartLevel = 0;

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function createGridCell(content = null) {
  const li = document.createElement('li');
  if (content) li.appendChild(content);
  return li;
}

function createIdol() {
  return `<svg fill="none" viewBox="0 0 64 64">
  <path fill="#3B2113" d="M33.6 1.6h.3c4.5.1 12.3.8 15.6 4.1 1 1.2 1 3.4 1.3 4.9 0 .7.2 1.3.3 2l.1.4.3 1.5c0 .5 0 1-.2 1.6 0 .7-.2 1.3-.3 2v.3c-.1.6-.1.6-.3.8l.4.1c1.2.5 1.9 1.5 2.4 2.7 1.7 3.7 3.4 10 2.2 14-.4.8-.8 1.3-1.6 1.7l.4 2c.4 2.2.6 4.2-.6 6.2-1.2 1.8-3.2 2.6-5.1 3.3l.3.3c2.3 2.2 5.7 5.5 6 9 .1 1-.2 2-.8 2.7-1 1.1-2.4 2.1-3.8 2.2h-37c-1.3 0-2.4-.1-3.4-1-.7-.8-1-2.8-1-3.8 0-.6.2-1 .4-1.5l.2-.4c.7-1.7 1.8-3.4 3-4.8l3-2.8c.3-.2.3-.2.4-.5H16a7 7 0 0 1-4.5-3.3c-1-1.9-.6-4-.2-6l.3-1.7-.3-.1-.7-.5-.2-.2c-.5-.9-.6-1.7-.7-2.6v-.4c0-1.4.2-2.7.4-4v-.4c1.3-7.5 1.3-7.5 3.5-9.5l1.1-.7c0-1.2-.2-2.5-.4-3.7-.1-.9 0-1.7.2-2.6 0-.7.2-1.4.4-2.2v-.3l.3-1.8.1-.4.1-.7a3.4 3.4 0 0 1 1.3-2.3c1.1-.8 2.4-1.3 3.7-1.8l.4-.1a33 33 0 0 1 7-1.4h.4c1.8-.3 3.7-.3 5.5-.3Z"/>
  <path fill="#EAC869" d="M47.5 50c-12 4.8-26.5 2-29-.5 0 0-2 .5-5 4.5a47 47 0 0 0 37 .5c-1-1-2-3-3-4.5Z"/>
  <path fill="#FFE08C" d="M38 17.6c3.1.3 6.2.9 9.3 1.8l.4.1c.3.3.4.3.5.7v.7l.4 1.6v5.3l2 5.6.9 5 .6 3a5 5 0 0 1-.8 3.9 6 6 0 0 1-2.9 1.8l-.3.1c-4.1 1.5-4.1 1.5-5.5 1.5l.1-1.4V47l.3-2.5c.3-1.6.3-1.6 0-3.3l-.6-.2-.3-.1a34.8 34.8 0 0 0-21 0 4 4 0 0 0-1 .7c0 1.3 0 2.5.2 3.8l.2 3c-1.5-.3-2.9-.8-4.2-1.3L16 47c-1.4-.5-2.5-1.1-3.1-2.4-1-2-.2-4.3.2-6.3L15 35l-1.2-.8.6-3 .9-5v-.3l.7-4 .2-1v-.3l.3-.8a3 3 0 0 1 1-.3l.3-.1c2.4-.8 5-1.3 7.5-1.4a154 154 0 0 1-1 6.3v.3l-.3 1.7-.3 1.6c-.4 1.9-.5 3.7-.5 5.6V35c0 .6.1 1.2.6 1.7.7.6 1.3.6 2.2.6h.4a150.7 150.7 0 0 0 6.6 0h4.5c.8 0 1.4-.1 2-.6.5-.6.6-1.2.6-2v-3a5 5 0 0 0-.3-1.7l-.1-1v-.3l-.2-.8-.3-1.9-.2-1.5-.7-4.7-.1-.3-.1-.6-.1-1.2Z"/>
  <path fill="#FFE08C" d="M31.4 41.1h.4c7.6 0 7.6 0 10 1.1l-.2 2.8-.2 1.8c0 1-.2 1.8-1 2.6-.6.5-1.3.8-2.1 1h-.4l-1.4-1.9-1 2.5c-3.5.7-6 .3-9.5-.5h-.4c-2.2-.6-2.2-.6-2.9-1.5-.4-.7-.6-1.3-.7-2v-1.1a429 429 0 0 1-.3-3.8c3.1-1 6.4-1 9.7-1ZM14.6 54l.4.2a33 33 0 0 0 6.6 2.2h.3l3.8.8h.4a41 41 0 0 0 10.2.2h.8l.4-.1h.8l2.5-.4h.8c2.6-.4 5.3-1.2 7.6-2.2.8-.4.8-.2 1.3-.2 1.2 1.3 1.9 3 2 4.7 0 .4-.2.7-.5 1-.8.5-1.5.5-2.4.5h-2L45 57.5l-1 3.2H13.3c-.8 0-1.3 0-1.9-.6-.4-.4-.4-.9-.4-1.5a9.8 9.8 0 0 1 2.7-4.6h1Z"/>
  <path fill="#FFE9AD" d="M30.4 11.9h5.1l.4 2v.5l.1.5.8 5.3.4 2.3.2 1.5.5 2.9.1 1 .1.7c-.5 0-.9-.2-1.4-.4-3.6-1.3-8-1-11.5.4a88.1 88.1 0 0 0 1.6-11l.3-1.8.6-3.8c1-.1 1.8-.2 2.7-.1Z"/>
  <path fill="#EAC869" d="M38 17.6c2.9.3 5.7.8 8.5 1.6 1.4.4 1.4.4 1.7.8v.9l.3 1 .1 1.6a34 34 0 0 1-9.1 1.1H39c-.3-.6-.3-1.2-.4-1.9l-.5-3.6-.1-.4v-.3l-.1-.8Zm-12.7.3-1 6v.4c0 .3 0 .3-.2.4-1.4.2-2.8 0-4.2-.2h-.3c-1.2-.2-2.4-.4-3.6-.8-.2-.8 0-1.5.1-2.3V21c.3-1.1.3-1.1.6-1.4l.8-.2.6-.2c4.9-1.4 4.9-1.4 7.2-1.3Z"/>
  <path fill="#B99840" d="m37.5 30.1.3.2.7.7v2.9l-.1 1.7H24.9c-.3-.5-.2-1.4-.2-2v-1.7c0-.8.2-1 .7-1.5 3.1-2.2 8.9-2 12.1-.3Zm-.4-18 3 .3a29 29 0 0 1 8.5 2.6c0 1-.1 2-.4 3.1l-2-.5c-2.8-.8-5.6-1.2-8.5-1.6a2187.5 2187.5 0 0 1-.6-3.9Zm-11 .2a25 25 0 0 1-.6 3.8l-2.3.5c-2 .3-4 .7-6 1.3l-1 .2-.1-1-.2-1.2-.1-.4c0-.4.2-.5.5-.7l1.6-.7.3-.1c2.5-1 5.2-1.6 8-1.7Z"/>
  <path fill="#FFF5DA" d="M30.4 11.9h5.1l.2 1c.3 1.3.4 2.7.6 4.1l-.5-.2-.7-.2-.4-.1c-2.5-.7-5.2-.5-7.6.5 0-1.3.1-2.5.4-3.8l.3-1.2c.8-.1 1.7-.2 2.6-.1Z"/>
  <path fill="#FFF5DA" d="M31.8 3.4h.3A32 32 0 0 1 43.6 5l.3.1c2.6.9 2.6.9 3.5 1.9l.2 1v.3c.4 1.5.6 3.1.8 4.7l-2-.6c-1.4-.4-2.8-.9-4.3-1.1l-.3-.1c-8-1.6-17.5-1.5-25 1.7l-.7.2c.1-1.4.3-2.7.6-4.1l.2-1.2c.1-.7.4-1 .9-1.4 2.8-2 6.8-2.5 10.1-2.9l.6 2.5 3.3-2.6Zm-.5 37.7h.4c7.6 0 7.6 0 10 1.2l-.3 3.5-.3-.1a45 45 0 0 0-19.2 0l-.3-3.6c3.1-1 6.4-1 9.7-1ZM14.5 21.3h.1c0 .9-.3 1.8-.4 2.8l-1.6 8.5v.3L12 36h-.3a4 4 0 0 1-.4-2v-.4c.1-3.5.6-9.8 3.2-12.3Zm35.4 0c.5.3.7.6 1 1.1l.2.4c1.4 3.5 2 7.2 2 10.9v.4c0 .8 0 1.3-.4 1.9-.2-.4-.4-1-.4-1.4v-.3l-.4-1.8-.9-4.8c-.3-1.6-.5-3.2-.9-4.7v-.3L50 22l-.1-.8Z"/>
</svg>`;
}

function generateBoard(isFirstTimeMaxLevel = false) {
  gridEl.classList.remove('hide');
  gridEl.innerHTML = '';
  isGameOver = false;
  expectingIdol = false;
  idolNumber = null;

  const numItems = hasCompletedMaxLevel
    ? Math.min(2 + (level - postMaxLevelStartLevel), MAX_LEVEL_ITEMS)
    : Math.min(level + 1, MAX_LEVEL_ITEMS);
  sequence = Array.from({ length: numItems }, (_, i) => i + 1);

  if (hasCompletedMaxLevel) {
    idolNumber = 1 + Math.floor(Math.random() * Math.min(numItems - 1, numItems));
    if (isFirstTimeMaxLevel) {
      waitingForFirstClick = true;
      instructionsEl.innerHTML = `Tap number with the idol,<br />Then tap idol`;
      instructionsEl.classList.remove('hidden');
    }
  }

  const buttons = sequence.map((index) => {
    const button = document.createElement('button');
    button.className = 'button';
    button.style.animationDelay = `${index * 10}ms`;
    button.dataset.value = index;
    const hasIdolIndicator = hasCompletedMaxLevel && index === idolNumber;
    const idolIndicatorHtml = hasIdolIndicator ? `<div class="idol-indicator">${createIdol()}</div>` : '';
    button.innerHTML = `<span>${idolIndicatorHtml}${index}</span>`;
    button.addEventListener('click', handleTap);
    return button;
  });

  if (hasCompletedMaxLevel) {
    const idolButton = document.createElement('button');
    idolButton.className = 'button idol';
    idolButton.dataset.value = 'idol';
    idolButton.innerHTML = `<span>${createIdol()}</span>`;
    idolButton.addEventListener('click', handleTap);
    buttons.push(idolButton);
  }

  const emptyCellsCount = BOARD_SIZE - buttons.length;
  const emptyCells = Array(emptyCellsCount).fill(null);
  const allItems = shuffle([...buttons, ...emptyCells]);

  const fragment = document.createDocumentFragment();
  allItems.forEach((item) => {
    fragment.appendChild(createGridCell(item));
  });

  gridEl.appendChild(fragment);
  gridEl.classList.add('next');
  setTimeout(() => gridEl.classList.remove('next'), ANIMATION_DURATION_MS);

  if (!waitingForFirstClick) {
    setTimeout(() => {
      if (!isGameOver) {
        gridEl.classList.add('hide');
      }
    }, REVEAL_TIME_MS);
  }
}

function handleTap(event) {
  event.preventDefault();
  const button = event.target;
  const value = button.dataset.value;

  haptics.trigger([{ duration: 25, intensity: 0.7 }]);
  zzfx(...soundEffect.tap);
  
  if (waitingForFirstClick) {
    waitingForFirstClick = false;
    instructionsEl.classList.add('hidden');
  }

  gridEl.classList.add('hide');
  button.disabled = true;

  if (value === 'idol') {
    if (expectingIdol) {
      button.classList.add('correct');
      expectingIdol = false;
      score += 7;
      updateScore();

      if (sequence.length === 0) {
        document.body.classList.add('success');
        setTimeout(() => zzfx(...soundEffect.success), SOUND_DELAY_MS);
        setTimeout(() => {
          document.body.classList.remove('success');
          nextLevel();
        }, NEXT_LEVEL_DELAY_MS);
      }
    } else {
      handleGameOver(button);
    }
    return;
  }

  const numValue = parseInt(value, 10);

  if (expectingIdol) {
    handleGameOver(button);
    return;
  }

  if (numValue === sequence[0]) {
    button.classList.add('correct');
    sequence.shift();
    score += numValue;
    updateScore();

    if (idolNumber && numValue === idolNumber) {
      expectingIdol = true;
    }

    if (sequence.length === 0 && !expectingIdol) {
      document.body.classList.add('success');

      setTimeout(() => zzfx(...soundEffect.success), SOUND_DELAY_MS);
      setTimeout(() => {
        document.body.classList.remove('success');
        nextLevel();
      }, NEXT_LEVEL_DELAY_MS);
    }
  } else {
    handleGameOver(button);
  }
}

function handleGameOver(button) {
  isGameOver = true;
  button.classList.add('wrong');
  document.body.classList.add('wrong');
  gridEl.classList.remove('hide');
  gridEl.querySelectorAll('button:not(:disabled)').forEach((btn) => {
    btn.disabled = true;
  });
  setTimeout(() => zzfx(...soundEffect.fail), SOUND_DELAY_MS);
  setTimeout(resetGame, REVEAL_TIME_MS);
}

function updateScore() {
  // if ('startViewTransition' in document) {
  //   document.startViewTransition(() => {
  //     scoreEl.textContent = score;
  //   });
  // } else {
  //   scoreEl.textContent = score;
  // }

  scoreEl.textContent = score;

  if (score > bestScore) {
    bestScore = score;
    bestScoreEl.textContent = bestScore;
    localStorage.setItem(HIGH_SCORE_KEY, bestScore);
  }
}

function startGame() {
  gridEl.classList.remove('hide');
  level = 1;
  score = 0;
  hasCompletedMaxLevel = false;
  updateScore();
  generateBoard();
}

function nextLevel() {
  if (level === MAX_LEVEL_ITEMS - 1 && !hasCompletedMaxLevel) {
    hasCompletedMaxLevel = true;
    level++;
    postMaxLevelStartLevel = level;
    generateBoard(true);
  } else {
    level++;
    generateBoard();
  }
}

function resetGame() {
  gridEl.innerHTML = '';
  for (let i = 0; i < BOARD_SIZE; i++) {
    gridEl.appendChild(createGridCell());
  }

  document.body.classList.remove('wrong');
  instructionsEl.classList.remove('hidden');
  instructionsEl.innerHTML = 'Tap 1, then 2...';
  hasCompletedMaxLevel = false;
  waitingForFirstClick = true;

  startGame();
}

function initialize() {
  bestScore = Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
  scoreEl.textContent = score;
  bestScoreEl.textContent = bestScore;
  resetGame();
}

document.addEventListener('DOMContentLoaded', initialize);

// Sound effects
let zzfxV=.3,zzfxX=new AudioContext,zzfx=(e=1,t=.05,f=220,z=0,a=0,n=.1,o=0,r=1,x=0,s=0,c=0,u=0,i=0,d=0,X=0,b=0,l=0,m=1,h=0,B=0,C=0)=>{let V=Math,g=2*V.PI,w=44100,A=x*=500*g/w/w,D=f*=(1-t+2*t*V.random(t=[]))*g/w,I=0,M=0,P=0,S=1,j=0,k=0,p=0,q=C<0?-1:1,v=g*q*C*2/w,y=V.cos(v),E=V.sin,F=E(v)/4,G=1+F,H=-2*y/G,J=(1-F)/G,K=(1+q*y)/2/G,L=-(q+y)/G,N=K,O=0,Q=0,R=0,T=0;for(s*=500*g/w**3,X*=g/w,c*=g/w,u*=w,i=w*i|0,e*=zzfxV,q=(z=w*z+9)+(h*=w)+(a*=w)+(n*=w)+(l*=w)|0;P<q;t[P++]=p*e)++k%(100*b|0)||(p=o?1<o?2<o?3<o?E(I**3):V.max(V.min(V.tan(I),1),-1):1-(2*I/g%2+2)%2:1-4*V.abs(V.round(I/g)-I/g):E(I),p=(i?1-B+B*E(g*P/i):1)*(p<0?-1:1)*V.abs(p)**r*(P<z?P/z:P<z+h?1-(P-z)/h*(1-m):P<z+h+a?m:P<q-l?(q-P-l)/n*m:0),p=l?p/2+(l>P?0:(P<q-l?1:(q-P)/l)*t[P-l|0]/2/e):p,C&&(p=T=N*O+L*(O=Q)+K*(Q=p)-J*R-H*(R=T))),v=(f+=x+=s)*V.cos(X*M++),I+=v+v*d*E(P**5),S&&++S>u&&(f+=c,D+=c,S=0),!i||++j%i||(f=D,x=A,S=S||1);(e=zzfxX.createBuffer(1,q,w)).getChannelData(0).set(t),(f=zzfxX.createBufferSource()).buffer=e,f.connect(zzfxX.destination),f.start()};
