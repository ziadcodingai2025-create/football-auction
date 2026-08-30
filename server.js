const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// ============================================================
// DATA
// ============================================================

const PLAYER_POOL = [
  { id: 1, name: "Thibaut Courtois", pos: "GK", rating: 90, base: 8, nation: "BEL" },
  { id: 2, name: "Alisson", pos: "GK", rating: 89, base: 8, nation: "BRA" },
  { id: 3, name: "Ederson", pos: "GK", rating: 88, base: 7, nation: "BRA" },
  { id: 4, name: "Donnarumma", pos: "GK", rating: 88, base: 7, nation: "ITA" },

  { id: 5, name: "Theo Hernandez", pos: "LB", rating: 87, base: 8, nation: "FRA" },
  { id: 6, name: "Alphonso Davies", pos: "LB", rating: 86, base: 8, nation: "CAN" },

  { id: 7, name: "William Saliba", pos: "CB", rating: 89, base: 10, nation: "FRA" },
  { id: 8, name: "Virgil van Dijk", pos: "CB", rating: 89, base: 10, nation: "NED" },
  { id: 9, name: "Antonio Rudiger", pos: "CB", rating: 87, base: 8, nation: "GER" },
  { id: 10, name: "Ruben Dias", pos: "CB", rating: 88, base: 9, nation: "POR" },
  { id: 11, name: "Bastoni", pos: "CB", rating: 87, base: 8, nation: "ITA" },

  { id: 12, name: "Achraf Hakimi", pos: "RB", rating: 88, base: 9, nation: "MAR" },
  { id: 13, name: "Trent Alexander-Arnold", pos: "RB", rating: 87, base: 8, nation: "ENG" },

  { id: 14, name: "Rodri", pos: "CM", rating: 90, base: 12, nation: "ESP" },
  { id: 15, name: "Jude Bellingham", pos: "CM", rating: 91, base: 14, nation: "ENG" },
  { id: 16, name: "Federico Valverde", pos: "CM", rating: 89, base: 11, nation: "URU" },
  { id: 17, name: "Pedri", pos: "CM", rating: 89, base: 11, nation: "ESP" },
  { id: 18, name: "Vitinha", pos: "CM", rating: 87, base: 9, nation: "POR" },
  { id: 19, name: "Declan Rice", pos: "CM", rating: 88, base: 10, nation: "ENG" },

  { id: 20, name: "Florian Wirtz", pos: "CAM", rating: 89, base: 12, nation: "GER" },
  { id: 21, name: "Jamal Musiala", pos: "CAM", rating: 89, base: 12, nation: "GER" },
  { id: 22, name: "Cole Palmer", pos: "CAM", rating: 88, base: 11, nation: "ENG" },

  { id: 23, name: "Vinicius Junior", pos: "LW", rating: 91, base: 16, nation: "BRA" },
  { id: 24, name: "Khvicha Kvaratskhelia", pos: "LW", rating: 88, base: 11, nation: "GEO" },
  { id: 25, name: "Rafael Leao", pos: "LW", rating: 87, base: 10, nation: "POR" },

  { id: 26, name: "Mohamed Salah", pos: "RW", rating: 91, base: 15, nation: "EGY" },
  { id: 27, name: "Bukayo Saka", pos: "RW", rating: 89, base: 12, nation: "ENG" },
  { id: 28, name: "Lamine Yamal", pos: "RW", rating: 90, base: 14, nation: "ESP" },

  { id: 29, name: "Kylian Mbappe", pos: "ST", rating: 92, base: 18, nation: "FRA" },
  { id: 30, name: "Erling Haaland", pos: "ST", rating: 91, base: 17, nation: "NOR" },
  { id: 31, name: "Harry Kane", pos: "ST", rating: 90, base: 15, nation: "ENG" },
  { id: 32, name: "Lautaro Martinez", pos: "ST", rating: 89, base: 13, nation: "ARG" }
];

const MODES = {
  classic: {
    name: "CLASSIC",
    positions: ["GK", "CB", "CM", "CM", "ST"],
    budget: 100
  },
  pro: {
    name: "PRO MAX",
    positions: ["GK", "LB", "CB", "CB", "RB", "CM", "CM", "CAM", "LW", "RW", "ST"],
    budget: 160
  }
};

const rooms = new Map();

// ============================================================
// HELPERS
// ============================================================

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function safeRoom(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    state: room.state,
    mode: room.mode,
    modeName: MODES[room.mode].name,
    positions: room.positions,
    round: room.round,
    roundCount: room.positions.length,
    current: room.current,
    currentBid: room.currentBid,
    highestBidder: room.highestBidder,
    seconds: room.seconds,
    players: [...room.users.values()].map(u => ({
      id: u.id,
      name: u.name,
      budget: u.budget,
      squad: u.squad
    }))
  };
}

function broadcast(room) {
  io.to(room.code).emit("state", safeRoom(room));
}

function choosePlayer(pos, used) {
  const pool = PLAYER_POOL.filter(p => p.pos === pos && !used.has(p.id));
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function makeMystery(pos, excludeIds) {
  const pool = PLAYER_POOL.filter(p => p.pos === pos && !excludeIds.has(p.id));

  if (!pool.length) {
    return {
      id: "m-" + Math.random().toString(36).slice(2),
      name: "Mystery " + pos,
      pos,
      rating: 78 + Math.floor(Math.random() * 9),
      base: 0,
      price: 0,
      mystery: true,
      nation: "???"
    };
  }

  const p = pool[Math.floor(Math.random() * pool.length)];
  return { ...p, price: 0, mystery: true };
}

function startGame(room) {
  room.state = "auction";
  room.round = 0;
  room.used = new Set();

  const settings = MODES[room.mode];

  for (const user of room.users.values()) {
    user.budget = settings.budget;
    user.squad = [];
  }

  nextRound(room);
}

function nextRound(room) {
  if (room.timer) clearInterval(room.timer);

  if (room.round >= room.positions.length) {
    finishGame(room);
    return;
  }

  const pos = room.positions[room.round];

  let player = choosePlayer(pos, room.used);

  if (!player) {
    // Position pool is exhausted. We can reuse players only if needed.
    const posIds = PLAYER_POOL.filter(p => p.pos === pos).map(p => p.id);
    posIds.forEach(id => room.used.delete(id));
    player = choosePlayer(pos, room.used);
  }

  room.used.add(player.id);
  room.current = player;
  room.currentBid = player.base;
  room.highestBidder = null;
  room.seconds = 30;

  broadcast(room);

  room.timer = setInterval(() => {
    room.seconds -= 1;

    if (room.seconds <= 0) {
      clearInterval(room.timer);
      settleRound(room);
    } else {
      broadcast(room);
    }
  }, 1000);
}

function settleRound(room) {
  const current = room.current;
  const pos = room.positions[room.round];
  const winner = room.highestBidder ? room.users.get(room.highestBidder) : null;

  const result = {
    position: pos,
    auctionPlayer: current,
    winnerName: null,
    winnerId: null,
    price: 0,
    mystery: []
  };

  if (winner && winner.budget >= room.currentBid) {
    winner.budget -= room.currentBid;
    winner.squad.push({
      ...current,
      price: room.currentBid,
      mystery: false
    });

    result.winnerName = winner.name;
    result.winnerId = winner.id;
    result.price = room.currentBid;
  }

  for (const user of room.users.values()) {
    if (!winner || user.id !== winner.id) {
      const exclude = new Set(
        user.squad.map(p => p.id).filter(id => typeof id === "number")
      );
      const mystery = makeMystery(pos, exclude);
      user.squad.push(mystery);

      result.mystery.push({
        userId: user.id,
        userName: user.name,
        player: mystery
      });
    }
  }

  io.to(room.code).emit("round_result", result);

  room.round += 1;
  room.current = null;
  room.currentBid = 0;
  room.highestBidder = null;
  room.seconds = 0;

  broadcast(room);

  setTimeout(() => nextRound(room), 2600);
}

function finishGame(room) {
  room.state = "result";
  room.current = null;
  room.seconds = 0;

  const users = [...room.users.values()];

  const computed = users.map(u => {
    const ratings = u.squad.map(p => p.rating || 75);
    const avg = ratings.length
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 75;

    const attack = u.squad
      .filter(p => ["ST", "LW", "RW", "CAM"].includes(p.pos))
      .reduce((a, p) => a + p.rating, 0);

    const defense = u.squad
      .filter(p => ["GK", "CB", "LB", "RB"].includes(p.pos))
      .reduce((a, p) => a + p.rating, 0);

    const midfield = u.squad
      .filter(p => ["CM", "CAM"].includes(p.pos))
      .reduce((a, p) => a + p.rating, 0);

    const tacticalRoll = Math.random() * 10;
    const strength = avg + tacticalRoll;

    return {
      id: u.id,
      name: u.name,
      squad: u.squad,
      avg: Math.round(avg * 10) / 10,
      attack,
      defense,
      midfield,
      strength
    };
  });

  const a = computed[0];
  const b = computed[1];

  function goalsFor(team, opp) {
    const gap = (team.strength - opp.strength) / 8;
    const base = 1.1 + Math.random() * 1.8 + gap;
    return clamp(Math.round(base), 0, 6);
  }

  let goalsA = goalsFor(a, b);
  let goalsB = goalsFor(b, a);

  // Avoid too many draws for a more dramatic arcade-style finish.
  if (goalsA === goalsB) {
    if (a.strength >= b.strength) goalsA += 1;
    else goalsB += 1;
  }

  const winner = goalsA > goalsB ? a : b;

  const timeline = [];
  const totalGoals = goalsA + goalsB;

  for (let i = 0; i < totalGoals; i++) {
    const minute = 6 + Math.floor(Math.random() * 83);
    timeline.push({ minute });
  }

  timeline.sort((x, y) => x.minute - y.minute);

  let remainingA = goalsA;
  let remainingB = goalsB;

  timeline.forEach((event, index) => {
    const shouldA =
      remainingA > 0 &&
      (remainingB === 0 || Math.random() < remainingA / (remainingA + remainingB));

    const team = shouldA ? a : b;
    const candidates = team.squad.filter(p =>
      ["ST", "LW", "RW", "CAM", "CM"].includes(p.pos)
    );
    const scorerPool = candidates.length ? candidates : team.squad;
    const scorer = scorerPool[Math.floor(Math.random() * scorerPool.length)];

    if (shouldA) remainingA -= 1;
    else remainingB -= 1;

    event.teamId = team.id;
    event.teamName = team.name;
    event.scorer = scorer?.name || "Unknown";
  });

  const match = {
    winnerId: winner.id,
    winnerName: winner.name,
    score: {
      [a.id]: goalsA,
      [b.id]: goalsB
    },
    teams: computed,
    timeline
  };

  room.match = match;

  io.to(room.code).emit("match_result", match);
  broadcast(room);
}

// ============================================================
// SOCKETS
// ============================================================

io.on("connection", socket => {
  socket.on("create", ({ name, mode }, cb) => {
    let code;
    do code = makeCode();
    while (rooms.has(code));

    mode = mode === "pro" ? "pro" : "classic";

    const room = {
      code,
      hostId: socket.id,
      state: "lobby",
      mode,
      positions: [...MODES[mode].positions],
      round: 0,
      current: null,
      currentBid: 0,
      highestBidder: null,
      seconds: 0,
      used: new Set(),
      users: new Map(),
      timer: null,
      match: null
    };

    room.users.set(socket.id, {
      id: socket.id,
      name: String(name || "Player").slice(0, 18),
      budget: MODES[mode].budget,
      squad: []
    });

    rooms.set(code, room);
    socket.join(code);

    cb?.({ ok: true, code });
    broadcast(room);
  });

  socket.on("join", ({ name, code }, cb) => {
    code = String(code || "").trim().toUpperCase();

    const room = rooms.get(code);

    if (!room) return cb?.({ ok: false, error: "Room not found" });
    if (room.state !== "lobby") return cb?.({ ok: false, error: "Game already started" });

    // EXACTLY TWO HUMAN PLAYERS
    if (room.users.size >= 2) {
      return cb?.({ ok: false, error: "Room is full — 2 players only" });
    }

    room.users.set(socket.id, {
      id: socket.id,
      name: String(name || "Player").slice(0, 18),
      budget: MODES[room.mode].budget,
      squad: []
    });

    socket.join(code);

    cb?.({ ok: true, code });
    broadcast(room);
  });

  socket.on("start", ({ code }, cb) => {
    const room = rooms.get(code);

    if (!room) return cb?.({ ok: false, error: "Room not found" });
    if (room.hostId !== socket.id) return cb?.({ ok: false, error: "Host only" });
    if (room.users.size !== 2) {
      return cb?.({ ok: false, error: "Exactly 2 players are required" });
    }

    startGame(room);
    cb?.({ ok: true });
  });

  socket.on("bid", ({ code, amount }, cb) => {
    const room = rooms.get(code);

    if (!room || room.state !== "auction" || !room.current) {
      return cb?.({ ok: false, error: "No active auction" });
    }

    const user = room.users.get(socket.id);

    if (!user) return cb?.({ ok: false, error: "Not in room" });

    const n = Number(amount);

    if (!Number.isFinite(n)) return cb?.({ ok: false, error: "Invalid bid" });
    if (n <= room.currentBid) return cb?.({ ok: false, error: "Bid must be higher" });
    if (n > user.budget) return cb?.({ ok: false, error: "Not enough budget" });

    room.currentBid = Math.round(n * 10) / 10;
    room.highestBidder = socket.id;

    // Anti-sniping: last second bid gives both players a little reaction time.
    if (room.seconds <= 3) room.seconds = 5;

    broadcast(room);
    cb?.({ ok: true });
  });

  socket.on("disconnect", () => {
    for (const [code, room] of rooms.entries()) {
      if (!room.users.has(socket.id)) continue;

      room.users.delete(socket.id);

      if (room.hostId === socket.id) {
        room.hostId = room.users.keys().next().value || null;
      }

      if (room.users.size === 0) {
        if (room.timer) clearInterval(room.timer);
        rooms.delete(code);
      } else {
        broadcast(room);
      }
    }
  });
});

// ============================================================
// FRONT END
// ============================================================

const PAGE = String.raw`
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#07110e">
<title>Football Auction V2</title>

<style>
*{box-sizing:border-box}
:root{
  --bg:#050b08;
  --panel:#0c1712;
  --panel2:#111f18;
  --line:#24382e;
  --text:#f4fff8;
  --muted:#91a89b;
  --green:#2fe276;
  --green2:#12b95a;
  --gold:#ffd25d;
  --red:#ff6672;
  --blue:#66a7ff;
}
html,body{margin:0;min-height:100%;background:var(--bg);color:var(--text);font-family:Inter,Arial,sans-serif}
body{
  background:
    radial-gradient(circle at 50% -10%,rgba(47,226,118,.14),transparent 28%),
    radial-gradient(circle at 100% 10%,rgba(102,167,255,.07),transparent 22%),
    var(--bg);
}
button,input,select{font:inherit}
button{cursor:pointer}
.app{max-width:560px;margin:auto;padding:16px 15px 38px;min-height:100vh}
.screen{display:none}
.screen.active{display:block}
.muted{color:var(--muted)}
.green{color:var(--green)}
.gold{color:var(--gold)}
.hidden{display:none!important}

.brand{text-align:center;padding:34px 0 20px}
.brandMark{
  width:78px;height:78px;margin:auto;border-radius:25px;
  display:grid;place-items:center;font-size:42px;
  background:linear-gradient(145deg,#142a20,#08100d);
  border:1px solid var(--line);
  box-shadow:inset 0 0 30px rgba(47,226,118,.08);
}
.brand h1{font-size:43px;line-height:.9;margin:15px 0 10px;letter-spacing:-1.5px}
.brand h1 span{color:var(--green)}
.brand p{margin:0;color:var(--muted)}

.card{
  background:linear-gradient(180deg,rgba(17,31,24,.98),rgba(9,18,14,.98));
  border:1px solid var(--line);
  border-radius:24px;
}
.homeCard{padding:18px}
label,small{
  display:block;
  color:var(--muted);
  font-size:11px;
  font-weight:900;
  letter-spacing:.09em;
}
input,select{
  width:100%;
  border:1px solid var(--line);
  background:#06100c;
  color:var(--text);
  border-radius:15px;
  min-height:52px;
  padding:0 14px;
  margin:8px 0 13px;
  outline:none;
}
input:focus,select:focus{border-color:var(--green);box-shadow:0 0 0 3px rgba(47,226,118,.10)}
button{
  border:1px solid var(--line);
  background:#122019;
  color:var(--text);
  min-height:50px;
  border-radius:15px;
  font-weight:950;
  padding:10px 15px;
}
button:active{transform:translateY(1px)}
.primary{
  width:100%;
  border:0;
  color:#031007;
  background:linear-gradient(180deg,var(--green),var(--green2));
}
.secondary{width:100%}
.or{display:flex;gap:11px;align-items:center;color:var(--muted);font-size:11px;margin:17px 0}
.or:before,.or:after{content:"";height:1px;background:var(--line);flex:1}
.error{color:var(--red);font-size:13px;min-height:18px;margin:9px 0 0}

.modeGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0 15px}
.modeBtn{min-height:68px;text-align:left;padding:12px}
.modeBtn.activeMode{border-color:var(--green);background:rgba(47,226,118,.09)}
.modeBtn b{display:block}
.modeBtn span{display:block;font-size:11px;color:var(--muted);margin-top:4px}

.topbar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:18px}
.topTitle small{margin-bottom:3px}
.topTitle h2{margin:0;font-size:22px}
.live{font-size:12px;color:var(--green);font-weight:950}
.roomHero{padding:24px;text-align:center;margin-bottom:20px}
.roomHero .code{font-size:43px;letter-spacing:.14em;font-weight:1000;color:var(--green);margin:10px 0}
.roomHero p{margin:0;color:var(--muted)}
.versus{
  display:grid;grid-template-columns:1fr 50px 1fr;gap:8px;align-items:center;margin:13px 0 17px
}
.managerCard{padding:14px;text-align:center;min-width:0}
.managerAvatar{
  width:48px;height:48px;margin:auto;border-radius:50%;display:grid;place-items:center;
  background:#163126;color:var(--green);font-size:20px;font-weight:1000
}
.managerCard b{display:block;margin-top:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vs{font-size:18px;font-weight:1000;color:var(--gold);text-align:center}
.waiting{opacity:.5}

.auctionHeader{
  display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;margin-bottom:13px
}
.roundText b{font-size:20px}
.roomTag{text-align:right}
.timerWrap{
  width:70px;height:70px;border-radius:50%;
  display:grid;place-items:center;position:relative;
  background:conic-gradient(var(--green) var(--timerDeg,360deg),#183026 0);
}
.timerWrap:after{
  content:"";position:absolute;inset:6px;border-radius:50%;background:#08130f;border:1px solid var(--line)
}
.timerWrap b{position:relative;z-index:2;font-size:23px}

.stage{
  position:relative;
  border-radius:26px;
  padding:22px;
  min-height:270px;
  overflow:hidden;
  border:1px solid var(--line);
  background:
    radial-gradient(circle at 20% 20%,rgba(47,226,118,.23),transparent 28%),
    radial-gradient(circle at 90% 10%,rgba(255,210,93,.10),transparent 26%),
    linear-gradient(145deg,#14281e,#08110d);
}
.stage:after{
  content:"";position:absolute;inset:auto -40px -80px -40px;height:160px;
  border-radius:50%;border:1px solid rgba(47,226,118,.15)
}
.posBadge{
  display:inline-flex;padding:7px 13px;border-radius:999px;background:var(--green);
  color:#061109;font-weight:1000;font-size:12px
}
.playerShow{
  display:grid;grid-template-columns:130px 1fr;gap:20px;align-items:center;margin-top:18px;position:relative;z-index:2
}
.playerVisual{
  height:170px;border-radius:24px;display:grid;place-items:center;position:relative;overflow:hidden;
  border:1px solid #385446;background:linear-gradient(160deg,#274d38,#0c1712)
}
.playerVisual .shirt{font-size:68px;filter:drop-shadow(0 10px 10px rgba(0,0,0,.25))}
.playerVisual .ovr{
  position:absolute;left:10px;top:10px;background:#07110d;border:1px solid var(--line);
  border-radius:12px;padding:7px 8px;font-weight:1000;color:var(--gold)
}
.playerData h1{font-size:30px;line-height:1;margin:8px 0 7px}
.playerData .nation{color:var(--muted);font-size:12px;font-weight:900}

.bidCard{padding:18px;margin-top:12px;text-align:center}
.priceLabel{color:var(--muted);font-size:11px;font-weight:900;letter-spacing:.08em}
.price{font-size:51px;color:var(--green);font-weight:1000;margin:2px 0}
.highest{font-size:13px;color:var(--muted);margin-bottom:13px}
.quickBids{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
.quickBids button{padding:8px;min-height:44px}
.customBid{display:grid;grid-template-columns:1fr 100px;gap:7px;margin-top:8px}
.customBid input{margin:0}
.customBid .primary{min-height:52px}

.duelHud{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
.hudPlayer{padding:13px}
.hudPlayer.you{border-color:rgba(47,226,118,.6)}
.hudTop{display:flex;justify-content:space-between;gap:8px;font-size:12px}
.hudTop b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.money{color:var(--gold);font-weight:1000}
.budgetBar{height:7px;background:#07100d;border-radius:999px;overflow:hidden;margin:9px 0 7px}
.budgetFill{height:100%;background:var(--green)}
.hudBottom{display:flex;justify-content:space-between;font-size:11px;color:var(--muted)}

.overlay{
  position:fixed;inset:0;z-index:20;display:none;align-items:center;justify-content:center;
  padding:20px;background:rgba(3,8,6,.80);backdrop-filter:blur(9px)
}
.overlay.show{display:flex}
.reveal{
  width:min(430px,100%);padding:22px;text-align:center;
  background:linear-gradient(160deg,#13261c,#09120e);
  border:1px solid var(--line);border-radius:27px
}
.revealIcon{font-size:48px}
.reveal h2{margin:10px 0 7px}
.revealPlayer{
  margin-top:14px;padding:15px;border-radius:18px;border:1px solid var(--line);background:#08120e
}
.revealPlayer .big{font-size:23px;font-weight:1000}
.revealPlayer .meta{color:var(--muted);margin-top:5px;font-size:12px}

.resultHero{text-align:center;padding:24px 0 16px}
.cup{font-size:70px}
.resultHero h1{font-size:35px;margin:8px 0;color:var(--green)}
.scoreboard{
  display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center;
  padding:18px;margin-bottom:12px
}
.team{text-align:center;min-width:0}
.team b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.score{font-size:36px;font-weight:1000;color:var(--gold)}
.teamScore{font-size:35px;font-weight:1000;margin-top:5px}
.timeline{padding:16px;margin-bottom:12px}
.timeline h3{margin:0 0 10px}
.event{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--line);font-size:13px}
.event:last-child{border-bottom:0}
.minute{color:var(--green);font-weight:1000;min-width:38px}

.squadTitle{margin:18px 0 9px}
.squadGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.squadItem{padding:12px}
.squadItem .pos{font-size:11px;color:var(--green);font-weight:1000}
.squadItem b{display:block;margin:5px 0;font-size:13px}
.squadItem small{letter-spacing:0}

@media(max-width:410px){
  .brand h1{font-size:39px}
  .playerShow{grid-template-columns:105px 1fr;gap:13px}
  .playerVisual{height:150px}
  .playerVisual .shirt{font-size:55px}
  .playerData h1{font-size:23px}
  .quickBids{grid-template-columns:repeat(2,1fr)}
  .roomHero .code{font-size:35px}
}
</style>
</head>

<body>
<main class="app">

<section id="home" class="screen active">
  <div class="brand">
    <div class="brandMark">⚽</div>
    <h1>FOOTBALL<br><span>AUCTION</span></h1>
    <p>Build. Bid. Dominate.</p>
  </div>

  <div class="card homeCard">
    <label>YOUR NAME</label>
    <input id="name" maxlength="18" placeholder="Player name">

    <label>GAME MODE</label>
    <div class="modeGrid">
      <button type="button" class="modeBtn activeMode" data-mode="classic">
        <b>CLASSIC</b>
        <span>5-player squad • €100M</span>
      </button>
      <button type="button" class="modeBtn" data-mode="pro">
        <b>PRO MAX</b>
        <span>11-player squad • €160M</span>
      </button>
    </div>

    <button id="createBtn" class="primary">CREATE PRIVATE ROOM</button>

    <div class="or">OR</div>

    <label>ROOM CODE</label>
    <input id="joinCode" maxlength="6" placeholder="ABC123">
    <button id="joinBtn" class="secondary">JOIN ROOM</button>

    <p id="homeError" class="error"></p>
  </div>
</section>

<section id="lobby" class="screen">
  <div class="topbar">
    <div class="topTitle">
      <small>PRIVATE ROOM</small>
      <h2 id="lobbyCode">------</h2>
    </div>
    <div class="live">● LIVE</div>
  </div>

  <div class="card roomHero">
    <p>Share this code with your friend</p>
    <div id="bigCode" class="code">------</div>
    <p><span id="modeName">CLASSIC</span> • 2 players only</p>
  </div>

  <div class="versus">
    <div id="managerOne" class="card managerCard waiting"></div>
    <div class="vs">VS</div>
    <div id="managerTwo" class="card managerCard waiting"></div>
  </div>

  <button id="startBtn" class="primary hidden">START AUCTION</button>
  <p id="lobbyMessage" class="muted" style="text-align:center"></p>
</section>

<section id="auction" class="screen">
  <div class="auctionHeader">
    <div class="roundText">
      <small>ROUND</small>
      <b><span id="roundNo">1</span>/<span id="roundCount">5</span></b>
    </div>

    <div id="timerWrap" class="timerWrap">
      <b id="timer">30</b>
    </div>

    <div class="roomTag">
      <small>ROOM</small>
      <b id="auctionCode">------</b>
    </div>
  </div>

  <div class="stage">
    <span id="posBadge" class="posBadge">ST</span>

    <div class="playerShow">
      <div class="playerVisual">
        <span id="playerRating" class="ovr">90</span>
        <span class="shirt">👕</span>
      </div>

      <div class="playerData">
        <small>NOW AUCTIONING</small>
        <h1 id="playerName">Player</h1>
        <div id="playerNation" class="nation">FRA • ST</div>
      </div>
    </div>
  </div>

  <div class="card bidCard">
    <div class="priceLabel">CURRENT BID</div>
    <div class="price">€<span id="currentBid">0</span>M</div>
    <div class="highest">Highest bidder: <b id="highestBidder">—</b></div>

    <div class="quickBids">
      <button type="button" data-add="1">+1M</button>
      <button type="button" data-add="2">+2M</button>
      <button type="button" data-add="5">+5M</button>
      <button type="button" data-add="10">+10M</button>
    </div>

    <div class="customBid">
      <input id="customAmount" type="number" min="0" step="1" placeholder="Custom bid">
      <button id="customBidBtn" class="primary">BID</button>
    </div>

    <p id="bidError" class="error"></p>
  </div>

  <div id="duelHud" class="duelHud"></div>
</section>

<section id="result" class="screen">
  <div class="resultHero">
    <div class="cup">🏆</div>
    <small>MATCH COMPLETE</small>
    <h1 id="winnerName">Winner</h1>
    <p class="muted">AI match simulation</p>
  </div>

  <div id="scoreboard" class="card scoreboard"></div>

  <div class="card timeline">
    <h3>Match events</h3>
    <div id="timeline"></div>
  </div>

  <h3 class="squadTitle">Your squad</h3>
  <div id="mySquad" class="squadGrid"></div>

  <button id="againBtn" class="primary" style="margin-top:18px">BACK TO HOME</button>
</section>

</main>

<div id="roundOverlay" class="overlay">
  <div class="reveal">
    <div id="revealIcon" class="revealIcon">🎭</div>
    <small id="revealEyebrow">ROUND RESULT</small>
    <h2 id="revealTitle">Mystery reveal</h2>
    <p id="revealText" class="muted"></p>
    <div id="revealPlayer" class="revealPlayer"></div>
  </div>
</div>

<script src="/socket.io/socket.io.js"></script>

<script>
(() => {
  const socket = io();

  let myId = null;
  let roomCode = null;
  let state = null;
  let matchResult = null;
  let selectedMode = "classic";

  const $ = id => document.getElementById(id);

  function show(id){
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    $(id).classList.add("active");
  }

  function esc(value){
    return String(value ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function fmt(n){
    const value = Number(n);
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

  function initials(name){
    return String(name || "?").trim().slice(0,1).toUpperCase();
  }

  socket.on("connect", () => {
    myId = socket.id;
  });

  document.querySelectorAll(".modeBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedMode = btn.dataset.mode;
      document.querySelectorAll(".modeBtn").forEach(x => x.classList.remove("activeMode"));
      btn.classList.add("activeMode");
    });
  });

  $("createBtn").addEventListener("click", () => {
    const name = $("name").value.trim();

    if (!name){
      $("homeError").textContent = "Enter your name first";
      return;
    }

    socket.emit("create", { name, mode:selectedMode }, res => {
      if (!res?.ok){
        $("homeError").textContent = res?.error || "Could not create room";
        return;
      }

      roomCode = res.code;
      $("homeError").textContent = "";
      show("lobby");
    });
  });

  $("joinBtn").addEventListener("click", () => {
    const name = $("name").value.trim();
    const code = $("joinCode").value.trim().toUpperCase();

    if (!name || code.length !== 6){
      $("homeError").textContent = "Enter name + 6-character room code";
      return;
    }

    socket.emit("join", { name, code }, res => {
      if (!res?.ok){
        $("homeError").textContent = res?.error || "Could not join";
        return;
      }

      roomCode = res.code;
      $("homeError").textContent = "";
      show("lobby");
    });
  });

  $("startBtn").addEventListener("click", () => {
    socket.emit("start", { code:roomCode }, res => {
      if (!res?.ok){
        $("lobbyMessage").textContent = res?.error || "Could not start";
      }
    });
  });

  function placeBid(amount){
    if (!Number.isFinite(amount) || amount <= 0){
      $("bidError").textContent = "Enter a valid bid";
      return;
    }

    socket.emit("bid", { code:roomCode, amount }, res => {
      $("bidError").textContent = res?.ok ? "" : (res?.error || "Bid failed");
      if (res?.ok) $("customAmount").value = "";
    });
  }

  document.querySelectorAll("[data-add]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!state) return;
      placeBid(Number(state.currentBid) + Number(btn.dataset.add));
    });
  });

  $("customBidBtn").addEventListener("click", () => {
    placeBid(Number($("customAmount").value));
  });

  $("againBtn").addEventListener("click", () => {
    location.reload();
  });

  socket.on("state", newState => {
    state = newState;
    roomCode = newState.code;

    if (newState.state === "lobby"){
      show("lobby");
      renderLobby(newState);
    } else if (newState.state === "auction"){
      show("auction");
      renderAuction(newState);
    } else if (newState.state === "result"){
      show("result");
      if (matchResult) renderMatch(matchResult);
    }
  });

  socket.on("round_result", result => {
    showRoundResult(result);
  });

  socket.on("match_result", result => {
    matchResult = result;
    show("result");
    renderMatch(result);
  });

  function managerHtml(player, hostId){
    if (!player){
      return '<div class="managerAvatar">?</div><b>Waiting...</b><small>Invite your friend</small>';
    }

    return (
      '<div class="managerAvatar">' + esc(initials(player.name)) + '</div>' +
      '<b>' + esc(player.name) + '</b>' +
      '<small>' + (player.id === hostId ? 'HOST' : 'CHALLENGER') + '</small>'
    );
  }

  function renderLobby(s){
    $("lobbyCode").textContent = s.code;
    $("bigCode").textContent = s.code;
    $("modeName").textContent = s.modeName;

    const p1 = s.players[0] || null;
    const p2 = s.players[1] || null;

    $("managerOne").innerHTML = managerHtml(p1, s.hostId);
    $("managerTwo").innerHTML = managerHtml(p2, s.hostId);

    $("managerOne").classList.toggle("waiting", !p1);
    $("managerTwo").classList.toggle("waiting", !p2);

    const amHost = s.hostId === myId;

    $("startBtn").classList.toggle("hidden", !amHost);

    if (amHost){
      $("lobbyMessage").textContent =
        s.players.length === 2
          ? "Both managers are ready"
          : "Waiting for your friend...";
    } else {
      $("lobbyMessage").textContent = "Waiting for the host to start...";
    }
  }

  function renderAuction(s){
    $("roundNo").textContent = Math.min(s.round + 1, s.roundCount);
    $("roundCount").textContent = s.roundCount;
    $("auctionCode").textContent = s.code;
    $("timer").textContent = s.seconds;

    const deg = Math.max(0, Math.min(360, (s.seconds / 30) * 360));
    $("timerWrap").style.setProperty("--timerDeg", deg + "deg");

    if (s.current){
      $("posBadge").textContent = s.current.pos;
      $("playerName").textContent = s.current.name;
      $("playerRating").textContent = s.current.rating;
      $("playerNation").textContent = s.current.nation + " • " + s.current.pos;
    }

    $("currentBid").textContent = fmt(s.currentBid);

    const highest = s.players.find(p => p.id === s.highestBidder);
    $("highestBidder").textContent = highest ? highest.name : "—";

    $("duelHud").innerHTML = s.players.map(p => {
      const maxBudget = s.mode === "pro" ? 160 : 100;
      const pct = Math.max(0, Math.min(100, (p.budget / maxBudget) * 100));

      return (
        '<div class="card hudPlayer ' + (p.id === myId ? 'you' : '') + '">' +
          '<div class="hudTop">' +
            '<b>' + esc(p.name) + (p.id === myId ? ' • YOU' : '') + '</b>' +
            '<span class="money">€' + fmt(p.budget) + 'M</span>' +
          '</div>' +
          '<div class="budgetBar"><div class="budgetFill" style="width:' + pct + '%"></div></div>' +
          '<div class="hudBottom">' +
            '<span>' + p.squad.length + '/' + s.roundCount + ' players</span>' +
            '<span>' + (p.id === s.highestBidder ? 'LEADING BID' : '') + '</span>' +
          '</div>' +
        '</div>'
      );
    }).join("");
  }

  function showRoundResult(result){
    const meMystery = result.mystery.find(x => x.userId === myId);
    const iWon = result.winnerId === myId;

    if (iWon){
      $("revealIcon").textContent = "🔥";
      $("revealEyebrow").textContent = "AUCTION WON";
      $("revealTitle").textContent = "You got " + result.auctionPlayer.name;
      $("revealText").textContent = "Winning bid: €" + fmt(result.price) + "M";
      $("revealPlayer").innerHTML =
        '<div class="big">' + esc(result.auctionPlayer.name) + '</div>' +
        '<div class="meta">' + result.auctionPlayer.rating + ' OVR • ' + result.position + '</div>';
    } else if (meMystery){
      $("revealIcon").textContent = "🎭";
      $("revealEyebrow").textContent = "MYSTERY REVEAL";
      $("revealTitle").textContent = "Your hidden player";
      $("revealText").textContent =
        result.winnerName
          ? result.winnerName + " won the auction."
          : "Nobody won the auction.";

      $("revealPlayer").innerHTML =
        '<div class="big">' + esc(meMystery.player.name) + '</div>' +
        '<div class="meta">' + meMystery.player.rating + ' OVR • ' + meMystery.player.pos + ' • FREE</div>';
    } else {
      return;
    }

    $("roundOverlay").classList.add("show");

    setTimeout(() => {
      $("roundOverlay").classList.remove("show");
    }, 2300);
  }

  function renderMatch(match){
    $("winnerName").textContent = match.winnerName;

    const t1 = match.teams[0];
    const t2 = match.teams[1];
    const s1 = match.score[t1.id] ?? 0;
    const s2 = match.score[t2.id] ?? 0;

    $("scoreboard").innerHTML =
      '<div class="team"><b>' + esc(t1.name) + '</b><small>AVG ' + t1.avg + '</small><div class="teamScore">' + s1 + '</div></div>' +
      '<div class="score">—</div>' +
      '<div class="team"><b>' + esc(t2.name) + '</b><small>AVG ' + t2.avg + '</small><div class="teamScore">' + s2 + '</div></div>';

    if (match.timeline.length){
      $("timeline").innerHTML = match.timeline.map(e =>
        '<div class="event">' +
          '<div class="minute">' + e.minute + '\'</div>' +
          '<div><b>' + esc(e.scorer) + '</b><br><span class="muted">' + esc(e.teamName) + '</span></div>' +
        '</div>'
      ).join("");
    } else {
      $("timeline").innerHTML = '<div class="muted">No goals in regular time.</div>';
    }

    const me = match.teams.find(t => t.id === myId);

    $("mySquad").innerHTML = (me?.squad || []).map(p =>
      '<div class="card squadItem">' +
        '<div class="pos">' + esc(p.pos) + (p.mystery ? ' • MYSTERY' : '') + '</div>' +
        '<b>' + esc(p.name) + '</b>' +
        '<small>' + p.rating + ' OVR • ' + (p.price ? '€' + fmt(p.price) + 'M' : 'FREE') + '</small>' +
      '</div>'
    ).join("");
  }
})();
</script>
</body>
</html>
`;

app.get("/", (req, res) => {
  res.type("html").send(PAGE);
});

server.listen(PORT, () => {
  console.log("Football Auction V2 running on port " + PORT);
});
