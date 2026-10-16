/* ==========================================================
   濠港雙城大亨 — online.js
   PeerJS 線上聯機（房間碼模式，房主權威）
   - 房主創建房間得 6 位房間碼；其他玩家輸入房間碼加入（最多 5 人）
   - 全部遊戲邏輯在房主端運行；客戶端僅發送操作意圖
   - 房主廣播完整狀態快照；斷線玩家由 AI 託管
   - PeerJS CDN 動態加載，失敗時 available=false 優雅降級
   ========================================================== */
(function (global) {
'use strict';

if (typeof document === 'undefined') return;

const CDN = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
const ID_PREFIX = 'mft2hk-';
const MAX_PLAYERS = 5;

function makeCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 去掉易混淆字符
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const MFT2Online = {
  available: false,
  ready: null,
  // 回調（由 game.js 掛接）
  onLobbyUpdate: null,   // (players:[{name,charId}]) => {}
  onState: null,         // (state, myId) => {}  — 客戶端收到快照
  onIntent: null,        // (playerId, action) => {} — 房主收到客戶端意圖
  onPeerDropped: null,   // (playerId) => {} — 房主：某玩家斷線
  onClosed: null,        // (msg) => {} — 連線中斷（客戶端失去房主 / 房主出錯）

  _peer: null,
  _isHost: false,
  _code: null,
  _myId: null,           // 客戶端自己的玩家 id
  _conns: [],            // 房主：所有 DataConnection
  _hostConn: null,       // 客戶端：與房主的連接
  _lobbyPlayers: [],     // 房主：[{name,charId,conn}]
  _started: false
};

/* ---------- 動態加載 PeerJS ---------- */
MFT2Online.ready = new Promise(resolve => {
  const done = ok => { MFT2Online.available = ok; resolve(ok); };
  if (typeof Peer !== 'undefined') { done(true); return; }
  const s = document.createElement('script');
  s.src = CDN;
  s.async = true;
  const timer = setTimeout(() => { s.onload = s.onerror = null; done(false); }, 8000);
  s.onload = () => { clearTimeout(timer); done(typeof Peer !== 'undefined'); };
  s.onerror = () => { clearTimeout(timer); done(false); };
  document.head.appendChild(s);
});

function cleanup() {
  try { if (MFT2Online._peer) MFT2Online._peer.destroy(); } catch (e) { /* ignore */ }
  MFT2Online._peer = null;
  MFT2Online._isHost = false;
  MFT2Online._code = null;
  MFT2Online._myId = null;
  MFT2Online._conns = [];
  MFT2Online._hostConn = null;
  MFT2Online._lobbyPlayers = [];
  MFT2Online._started = false;
}

MFT2Online.leave = function () { cleanup(); };

/* ---------- 房主 ---------- */
MFT2Online.hostGame = function (profile) {
  return new Promise((resolve, reject) => {
    if (!MFT2Online.available) { reject(new Error('網絡不可用')); return; }
    cleanup();
    MFT2Online._isHost = true;
    MFT2Online._code = makeCode();
    let settled = false;
    const peer = new Peer(ID_PREFIX + MFT2Online._code, { debug: 0 });
    MFT2Online._peer = peer;

    peer.on('open', () => {
      settled = true;
      MFT2Online._lobbyPlayers = [{ name: profile.name, charId: profile.charId, conn: null }];
      emitLobby();
      resolve(MFT2Online._code);
    });
    peer.on('error', err => {
      if (!settled) {
        settled = true;
        cleanup();
        reject(new Error(err && err.type === 'unavailable-id' ? '房間碼衝突，請重試' : '無法連接伺服器'));
      } else if (MFT2Online.onClosed) {
        MFT2Online.onClosed('房主連線出錯：' + (err && err.type ? err.type : '未知錯誤'));
      }
    });
    peer.on('disconnected', () => { try { peer.reconnect(); } catch (e) { /* ignore */ } });

    peer.on('connection', conn => {
      conn.on('data', msg => {
        if (!msg || typeof msg !== 'object') return;
        // 玩家報到
        if (msg.t === 'hello' && !MFT2Online._started) {
          if (MFT2Online._lobbyPlayers.length >= MAX_PLAYERS) {
            conn.send({ t: 'reject', reason: '房間已滿（最多 ' + MAX_PLAYERS + ' 人）' });
            setTimeout(() => { try { conn.close(); } catch (e) { /* ignore */ } }, 500);
            return;
          }
          const id = MFT2Online._lobbyPlayers.length;
          conn._playerId = id;
          MFT2Online._lobbyPlayers.push({ name: String(msg.name || '玩家').slice(0, 12), charId: msg.charId, conn: conn });
          MFT2Online._conns.push(conn);
          conn.send({ t: 'welcome', playerId: id });
          emitLobby();
          return;
        }
        // 遊戲內操作意圖 → 轉交 game.js（房主權威執行）
        if (msg.t === 'intent' && typeof conn._playerId === 'number' && MFT2Online.onIntent) {
          MFT2Online.onIntent(conn._playerId, msg.a);
        }
      });
      const drop = () => {
        if (typeof conn._playerId !== 'number') return;
        if (!MFT2Online._started) {
          // 大廳階段離開：從名單移除（不影響已分配的 id 順序會錯位，故開局後才標記斷線）
          const idx = MFT2Online._lobbyPlayers.findIndex(p => p.conn === conn);
          if (idx > 0) {
            MFT2Online._lobbyPlayers.splice(idx, 1);
            // 重新分配 id
            MFT2Online._lobbyPlayers.forEach((p, i) => {
              if (p.conn) {
                p.conn._playerId = i;
                try { p.conn.send({ t: 'welcome', playerId: i }); } catch (e) { /* ignore */ }
              }
            });
            emitLobby();
          }
        } else if (MFT2Online.onPeerDropped) {
          MFT2Online.onPeerDropped(conn._playerId);
        }
      };
      conn.on('close', drop);
      conn.on('error', drop);
    });
  });
};

function emitLobby() {
  const list = MFT2Online._lobbyPlayers.map(p => ({ name: p.name, charId: p.charId }));
  if (MFT2Online.onLobbyUpdate) MFT2Online.onLobbyUpdate(list);
  broadcastAll({ t: 'lobby', players: list });
}

function broadcastAll(msg) {
  MFT2Online._conns.forEach(c => {
    try { if (c.open) c.send(msg); } catch (e) { /* ignore */ }
  });
}

// 房主開局：建立權威遊戲狀態並廣播
MFT2Online.startGame = function (difficulty) {
  if (!MFT2Online._isHost) return null;
  const players = MFT2Online._lobbyPlayers;
  if (players.length < 2) return null;
  MFT2Online._started = true;
  const state = global.MFT2.Engine.createGame({
    players: players.map(p => ({ name: p.name, charId: p.charId, isAI: false })),
    difficulty: difficulty,
    maxRounds: 30
  });
  broadcastAll({ t: 'state', state: state });
  return state;
};

// 房主廣播完整狀態快照
MFT2Online.broadcast = function (state) {
  if (!MFT2Online._isHost) return;
  broadcastAll({ t: 'state', state: state });
};

/* ---------- 客戶端 ---------- */
MFT2Online.joinGame = function (code, profile) {
  return new Promise((resolve, reject) => {
    if (!MFT2Online.available) { reject(new Error('網絡不可用')); return; }
    cleanup();
    MFT2Online._isHost = false;
    let settled = false;
    const peer = new Peer({ debug: 0 });
    MFT2Online._peer = peer;

    peer.on('error', err => {
      if (!settled) {
        settled = true;
        cleanup();
        reject(new Error(err && err.type === 'peer-unavailable' ? '找不到房間，請核對房間碼' : '無法連接伺服器'));
      }
    });

    peer.on('open', () => {
      const conn = peer.connect(ID_PREFIX + code.toUpperCase(), { reliable: true });
      MFT2Online._hostConn = conn;
      const timeout = setTimeout(() => {
        if (!settled) { settled = true; cleanup(); reject(new Error('連接逾時')); }
      }, 10000);

      conn.on('open', () => {
        conn.send({ t: 'hello', name: profile.name, charId: profile.charId });
      });
      conn.on('data', msg => {
        if (!msg || typeof msg !== 'object') return;
        if (msg.t === 'reject') {
          if (!settled) { settled = true; clearTimeout(timeout); cleanup(); reject(new Error(msg.reason || '被房主拒絕')); }
          return;
        }
        if (msg.t === 'welcome') {
          MFT2Online._myId = msg.playerId;
          if (!settled) { settled = true; clearTimeout(timeout); resolve(msg.playerId); }
          return;
        }
        if (msg.t === 'lobby' && MFT2Online.onLobbyUpdate) {
          MFT2Online.onLobbyUpdate(msg.players);
          return;
        }
        if (msg.t === 'state' && MFT2Online.onState) {
          MFT2Online.onState(msg.state, MFT2Online._myId);
        }
      });
      const closed = () => {
        if (MFT2Online._started || settled) {
          if (MFT2Online.onClosed) MFT2Online.onClosed('與房主的連線已中斷');
          cleanup();
        }
      };
      conn.on('close', closed);
      conn.on('error', closed);
    });
  });
};

// 客戶端發送操作意圖
MFT2Online.sendIntent = function (action) {
  const conn = MFT2Online._hostConn;
  if (conn && conn.open) {
    try { conn.send({ t: 'intent', a: action }); } catch (e) { /* ignore */ }
  }
};

global.MFT2Online = MFT2Online;

})(typeof window !== 'undefined' ? window : globalThis);
