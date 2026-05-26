const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.set('trust proxy', true);
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const NAMES = ['Aki', 'Queenie', 'Jimmy', 'Stanley', 'Even', 'Chris'];
const STOCK = { code: '6182', name: '合晶', shares: 1000, lotteryPrice: null };
const DATA_FILE = path.join(__dirname, 'data.json');

function loadState() {
  if (!fs.existsSync(DATA_FILE)) {
    const winnerIndex = Math.floor(Math.random() * NAMES.length);
    const initial = {
      winnerIndex,
      draws: {},
      ipsUsed: {},
      createdAt: Date.now()
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function saveState(state) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

function getIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return xff.split(',')[0].trim();
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function publicState(state, ip) {
  const drawn = Object.keys(state.draws);
  const pending = NAMES.filter(n => !state.draws[n]);
  const allDrawn = drawn.length === NAMES.length;
  const myName = state.ipsUsed[ip] || null;
  const myDraw = myName ? state.draws[myName] : null;

  let winnerName = null;
  let results = null;
  if (allDrawn) {
    winnerName = Object.entries(state.draws).find(
      ([, d]) => d.cardIndex === state.winnerIndex
    )?.[0] ?? null;
    results = Object.fromEntries(
      Object.entries(state.draws).map(([n, d]) => [
        n,
        { cardIndex: d.cardIndex, isWinner: d.cardIndex === state.winnerIndex }
      ])
    );
  }

  return {
    names: NAMES,
    stock: STOCK,
    drawn,
    pending,
    allDrawn,
    takenCards: Object.values(state.draws).map(d => d.cardIndex),
    myName,
    myCardIndex: myDraw ? myDraw.cardIndex : null,
    winnerName,
    results
  };
}

app.get('/api/state', (req, res) => {
  const state = loadState();
  res.json(publicState(state, getIp(req)));
});

app.post('/api/login', (req, res) => {
  const name = (req.body?.name || '').trim();
  const state = loadState();
  const ip = getIp(req);

  const match = NAMES.find(n => n.toLowerCase() === name.toLowerCase());
  if (!match) {
    return res.status(400).json({ error: '名字不在名單中，請輸入：Aki / Queenie / Jimmy / Stanley / Even / Chris' });
  }
  if (state.draws[match]) {
    return res.status(400).json({ error: `${match} 已經抽過了` });
  }
  if (state.ipsUsed[ip] && state.ipsUsed[ip] !== match) {
    return res.status(400).json({ error: `此 IP 已抽過 (${state.ipsUsed[ip]})，每個 IP 限抽一次` });
  }
  res.json({ ok: true, name: match });
});

app.post('/api/draw', (req, res) => {
  const name = (req.body?.name || '').trim();
  const cardIndex = req.body?.cardIndex;
  const state = loadState();
  const ip = getIp(req);

  const match = NAMES.find(n => n.toLowerCase() === name.toLowerCase());
  if (!match) return res.status(400).json({ error: '名字不在名單中' });
  if (state.draws[match]) return res.status(400).json({ error: `${match} 已經抽過了` });
  if (state.ipsUsed[ip]) return res.status(400).json({ error: `此 IP 已抽過 (${state.ipsUsed[ip]})` });
  if (typeof cardIndex !== 'number' || cardIndex < 0 || cardIndex >= NAMES.length) {
    return res.status(400).json({ error: '無效的選擇' });
  }
  if (Object.values(state.draws).some(d => d.cardIndex === cardIndex)) {
    return res.status(400).json({ error: '這張籤已經被抽走了' });
  }

  state.draws[match] = { cardIndex, ip, ts: Date.now() };
  state.ipsUsed[ip] = match;
  saveState(state);

  res.json({ ok: true, ...publicState(state, ip) });
});

// Admin reset (requires ADMIN_TOKEN env var)
app.post('/api/reset', (req, res) => {
  const token = req.headers['x-admin-token'];
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: 'forbidden' });
  }
  if (fs.existsSync(DATA_FILE)) fs.unlinkSync(DATA_FILE);
  loadState();
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎰 合晶抽籤 running on http://localhost:${PORT}`);
});
