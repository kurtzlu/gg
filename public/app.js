(() => {
  const $ = (id) => document.getElementById(id);

  const loginScreen = $('loginScreen');
  const lotteryScreen = $('lotteryScreen');
  const waitingScreen = $('waitingScreen');
  const revealScreen = $('revealScreen');
  const cardGrid = $('cardGrid');
  const statusList = $('statusList');
  const loginBtn = $('loginBtn');
  const nameInput = $('nameInput');
  const loginError = $('loginError');
  const quickNames = $('quickNames');
  const hiName = $('hiName');
  const myCardNum = $('myCardNum');
  const winnerName = $('winnerName');
  const resultsGrid = $('resultsGrid');
  const progressFill = $('progressFill');
  const progressText = $('progressText');
  const topStatus = $('topStatus');
  const lotteryStatus = $('lotteryStatus');

  let state = null;        // server state
  let session = null;      // current name (after login)
  let pollTimer = null;
  let confettiFired = false;

  const NUM_LABELS = ['壹', '貳', '參', '肆', '伍', '陸'];

  function show(screen) {
    [loginScreen, lotteryScreen, waitingScreen, revealScreen].forEach(el => el.classList.add('hidden'));
    screen.classList.remove('hidden');
  }

  function renderStatusList() {
    statusList.innerHTML = '';
    for (const name of state.names) {
      const li = document.createElement('li');
      const done = state.drawn.includes(name);
      li.className = done ? 'done' : 'pending';
      li.innerHTML = `<span class="dot"></span><span>${name}</span><span style="margin-left:auto;font-size:12px">${done ? '✓ 已抽' : '等待中'}</span>`;
      statusList.appendChild(li);
    }
    progressFill.style.width = `${(state.drawn.length / state.names.length) * 100}%`;
    progressText.textContent = `${state.drawn.length} / ${state.names.length}`;

    topStatus.textContent = state.allDrawn
      ? '已開獎'
      : `申購中 · ${state.drawn.length}/${state.names.length}`;
    lotteryStatus.textContent = state.allDrawn ? '已開獎' : '受理中';
  }

  function renderQuickNames() {
    quickNames.innerHTML = '';
    for (const name of state.names) {
      const btn = document.createElement('button');
      btn.textContent = name;
      btn.disabled = state.drawn.includes(name);
      btn.onclick = () => { nameInput.value = name; nameInput.focus(); };
      quickNames.appendChild(btn);
    }
  }

  function renderCards(disabled = false) {
    cardGrid.innerHTML = '';
    for (let i = 0; i < state.names.length; i++) {
      const card = document.createElement('div');
      const taken = state.takenCards.includes(i);
      card.className = 'lot-card' + (taken ? ' taken' : '') + (disabled ? ' disabled' : '');
      card.innerHTML = `
        <div class="seal">籤</div>
        <div class="lot-num">第 ${NUM_LABELS[i]} 號</div>
      `;
      if (!taken && !disabled) {
        card.onclick = () => drawCard(i, card);
      }
      cardGrid.appendChild(card);
    }
  }

  function renderResults() {
    resultsGrid.innerHTML = '';
    if (!state.results) return;
    for (const name of state.names) {
      const r = state.results[name];
      const isWin = r?.isWinner;
      const item = document.createElement('div');
      item.className = 'result-item ' + (isWin ? 'win' : 'lose');
      item.innerHTML = `
        <div class="r-name">${name}</div>
        <div class="r-card">第 ${NUM_LABELS[r.cardIndex]} 號籤</div>
        <div class="r-label">${isWin ? '🏆 中籤' : '殘念'}</div>
      `;
      resultsGrid.appendChild(item);
    }
    winnerName.textContent = state.winnerName || '—';
  }

  function fireConfetti() {
    if (confettiFired) return;
    confettiFired = true;
    const layer = document.getElementById('confetti');
    const colors = ['#ffd24a', '#d9001b', '#ff8c3a', '#ffffff', '#ff3a4f'];
    for (let i = 0; i < 140; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = (3 + Math.random() * 3) + 's';
      piece.style.animationDelay = Math.random() * 0.6 + 's';
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      layer.appendChild(piece);
      setTimeout(() => piece.remove(), 7000);
    }
  }

  function decideScreen() {
    if (state.allDrawn) {
      renderResults();
      show(revealScreen);
      if (state.winnerName) setTimeout(fireConfetti, 200);
      return;
    }
    if (state.myName && state.myCardIndex != null) {
      myCardNum.textContent = NUM_LABELS[state.myCardIndex];
      show(waitingScreen);
      return;
    }
    if (session) {
      hiName.textContent = session;
      renderCards(false);
      show(lotteryScreen);
      return;
    }
    show(loginScreen);
  }

  async function fetchState() {
    try {
      const r = await fetch('/api/state');
      state = await r.json();
      if (state.myName && !session) session = state.myName;
      renderStatusList();
      renderQuickNames();
      decideScreen();
    } catch (e) {
      console.error(e);
    }
  }

  async function login() {
    const name = nameInput.value.trim();
    if (!name) {
      loginError.textContent = '請輸入您的名字';
      return;
    }
    loginError.textContent = '';
    loginBtn.disabled = true;
    try {
      const r = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await r.json();
      if (!r.ok) {
        loginError.textContent = data.error || '登入失敗';
        return;
      }
      session = data.name;
      await fetchState();
    } catch (e) {
      loginError.textContent = '網路錯誤，請重試';
    } finally {
      loginBtn.disabled = false;
    }
  }

  async function drawCard(idx, cardEl) {
    if (!session) return;
    // lock all cards immediately
    renderCards(true);
    cardEl.style.transform = 'rotateY(180deg) scale(1.05)';
    cardEl.style.transition = 'transform 0.5s';
    try {
      const r = await fetch('/api/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: session, cardIndex: idx })
      });
      const data = await r.json();
      if (!r.ok) {
        alert(data.error || '抽籤失敗');
        await fetchState();
        return;
      }
      state = data;
      renderStatusList();
      decideScreen();
    } catch (e) {
      alert('網路錯誤，請重試');
      await fetchState();
    }
  }

  loginBtn.addEventListener('click', login);
  nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') login(); });

  // Initial load + polling
  fetchState();
  pollTimer = setInterval(fetchState, 2500);
})();
