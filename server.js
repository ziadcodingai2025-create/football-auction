const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

const PLAYERS = [
  {id:1,name:'Thibaut Courtois',pos:'GK',rating:90,base:8},
  {id:2,name:'Alisson',pos:'GK',rating:89,base:8},
  {id:3,name:'Ederson',pos:'GK',rating:88,base:7},
  {id:4,name:'William Saliba',pos:'CB',rating:89,base:9},
  {id:5,name:'Virgil van Dijk',pos:'CB',rating:89,base:9},
  {id:6,name:'Antonio Rudiger',pos:'CB',rating:87,base:7},
  {id:7,name:'Jude Bellingham',pos:'CM',rating:91,base:12},
  {id:8,name:'Pedri',pos:'CM',rating:89,base:10},
  {id:9,name:'Federico Valverde',pos:'CM',rating:89,base:10},
  {id:10,name:'Rodri',pos:'CM',rating:90,base:11},
  {id:11,name:'Kylian Mbappe',pos:'ST',rating:92,base:16},
  {id:12,name:'Erling Haaland',pos:'ST',rating:91,base:15},
  {id:13,name:'Harry Kane',pos:'ST',rating:90,base:13},
  {id:14,name:'Lautaro Martinez',pos:'ST',rating:89,base:11}
];

const POSITIONS = ['GK','CB','CM','CM','ST'];
const rooms = new Map();

function roomCode(){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code='';
  for(let i=0;i<6;i++){
    code += chars[Math.floor(Math.random()*chars.length)];
  }
  return code;
}

function safeRoom(room){
  return {
    code:room.code,
    hostId:room.hostId,
    state:room.state,
    round:room.round,
    current:room.current,
    currentBid:room.currentBid,
    highestBidder:room.highestBidder,
    seconds:room.seconds,
    players:[...room.users.values()].map(u=>({
      id:u.id,
      name:u.name,
      budget:u.budget,
      squad:u.squad
    }))
  };
}

function broadcast(room){
  io.to(room.code).emit('state',safeRoom(room));
}

function randomPlayer(pos,used){
  const pool=PLAYERS.filter(p=>p.pos===pos&&!used.has(p.id));
  if(!pool.length) return null;
  return pool[Math.floor(Math.random()*pool.length)];
}

function mystery(pos,exclude){
  const pool=PLAYERS.filter(p=>p.pos===pos&&!exclude.has(p.id));

  if(!pool.length){
    return {
      id:'m'+Math.random(),
      name:'Mystery '+pos,
      pos,
      rating:78+Math.floor(Math.random()*8),
      price:0,
      mystery:true
    };
  }

  const p=pool[Math.floor(Math.random()*pool.length)];

  return {
    ...p,
    price:0,
    mystery:true
  };
}

function startGame(room){
  room.state='auction';
  room.round=0;
  room.used=new Set();

  for(const u of room.users.values()){
    u.budget=100;
    u.squad=[];
  }

  nextRound(room);
}

function nextRound(room){
  if(room.timer){
    clearInterval(room.timer);
  }

  if(room.round>=POSITIONS.length){
    finish(room);
    return;
  }

  const pos=POSITIONS[room.round];

  let p=randomPlayer(pos,room.used);

  if(!p){
    room.used.clear();
    p=randomPlayer(pos,room.used);
  }

  room.used.add(p.id);

  room.current=p;
  room.currentBid=p.base;
  room.highestBidder=null;
  room.seconds=30;

  broadcast(room);

  room.timer=setInterval(()=>{

    room.seconds--;

    if(room.seconds<=0){

      clearInterval(room.timer);
      settle(room);

    }else{

      broadcast(room);

    }

  },1000);
}

function settle(room){
  const pos=POSITIONS[room.round];

  const winner=
    room.highestBidder
      ? room.users.get(room.highestBidder)
      : null;

  if(winner && winner.budget>=room.currentBid){

    winner.budget-=room.currentBid;

    winner.squad.push({
      ...room.current,
      price:room.currentBid,
      mystery:false
    });
  }

  for(const u of room.users.values()){

    if(!winner || u.id!==winner.id){

      const ex=new Set(
        u.squad
          .map(p=>p.id)
          .filter(id=>typeof id==='number')
      );

      u.squad.push(
        mystery(pos,ex)
      );
    }
  }

  room.round++;

  room.current=null;
  room.currentBid=0;
  room.highestBidder=null;
  room.seconds=0;

  broadcast(room);

  setTimeout(()=>{
    nextRound(room);
  },1500);
}

function finish(room){
  room.state='result';
  room.current=null;
  room.seconds=0;

  const results=[...room.users.values()]
    .map(u=>{

      const power=u.squad.reduce(
        (a,p)=>a+p.rating,
        0
      );

      const chemistry=Math.floor(
        Math.random()*11
      );

      const tactics=Math.floor(
        Math.random()*11
      );

      return {
        id:u.id,
        name:u.name,
        power,
        chemistry,
        tactics,
        total:power+chemistry+tactics
      };
    })
    .sort((a,b)=>b.total-a.total);

  room.results=results;

  io.to(room.code)
    .emit('results',results);

  broadcast(room);
}

io.on('connection',socket=>{

  socket.on('create',({name},cb)=>{

    let code;

    do{
      code=roomCode();
    }
    while(rooms.has(code));

    const room={
      code,
      hostId:socket.id,
      state:'lobby',
      round:0,
      current:null,
      currentBid:0,
      highestBidder:null,
      seconds:0,
      used:new Set(),
      users:new Map(),
      timer:null,
      results:null
    };

    room.users.set(
      socket.id,
      {
        id:socket.id,
        name:String(name||'Player').slice(0,18),
        budget:100,
        squad:[]
      }
    );

    rooms.set(code,room);

    socket.join(code);

    cb({
      ok:true,
      code
    });

    broadcast(room);
  });

  socket.on('join',({name,code},cb)=>{

    code=String(code||'')
      .trim()
      .toUpperCase();

    const room=rooms.get(code);

    if(!room){
      return cb({
        ok:false,
        error:'Room not found'
      });
    }

    if(room.state!=='lobby'){
      return cb({
        ok:false,
        error:'Game already started'
      });
    }

    // MAX 2 PLAYERS ONLY
    if(room.users.size>=2){
      return cb({
        ok:false,
        error:'Room is full'
      });
    }

    room.users.set(
      socket.id,
      {
        id:socket.id,
        name:String(name||'Player').slice(0,18),
        budget:100,
        squad:[]
      }
    );

    socket.join(code);

    cb({
      ok:true,
      code
    });

    broadcast(room);
  });

  socket.on('start',({code},cb)=>{

    const room=rooms.get(code);

    if(!room){
      return cb({
        ok:false,
        error:'Room not found'
      });
    }

    if(room.hostId!==socket.id){
      return cb({
        ok:false,
        error:'Only host can start'
      });
    }

    if(room.users.size<2){
      return cb({
        ok:false,
        error:'Need exactly 2 players'
      });
    }

    startGame(room);

    cb({
      ok:true
    });
  });

  socket.on('bid',({code,amount},cb)=>{

    const room=rooms.get(code);

    if(
      !room ||
      room.state!=='auction' ||
      !room.current
    ){
      return cb({
        ok:false,
        error:'No active auction'
      });
    }

    const user=room.users.get(socket.id);

    if(!user){
      return cb({
        ok:false,
        error:'Not in room'
      });
    }

    const n=Number(amount);

    if(!Number.isFinite(n)){
      return cb({
        ok:false,
        error:'Invalid bid'
      });
    }

    if(n<=room.currentBid){
      return cb({
        ok:false,
        error:'Bid must be higher'
      });
    }

    if(n>user.budget){
      return cb({
        ok:false,
        error:'Not enough budget'
      });
    }

    room.currentBid=
      Math.round(n*10)/10;

    room.highestBidder=
      socket.id;

    if(room.seconds<=3){
      room.seconds=5;
    }

    broadcast(room);

    cb({
      ok:true
    });
  });

  socket.on('disconnect',()=>{

    for(const [code,room] of rooms.entries()){

      if(!room.users.has(socket.id)){
        continue;
      }

      room.users.delete(socket.id);

      if(room.hostId===socket.id){

        room.hostId=
          room.users
            .keys()
            .next()
            .value
          || null;

      }

      if(room.users.size===0){

        if(room.timer){
          clearInterval(room.timer);
        }

        rooms.delete(code);

      }else{

        broadcast(room);

      }
    }
  });
});

const PAGE = `
<!doctype html>

<html lang="en">

<head>

<meta charset="utf-8">

<meta
name="viewport"
content="width=device-width,initial-scale=1"
>

<title>
Football Auction
</title>

<style>

*{
  box-sizing:border-box
}

:root{
  --bg:#07110e;
  --panel:#111d18;
  --line:#2b3a33;
  --text:#f7fff9;
  --muted:#98aaa0;
  --green:#35e37a;
  --green2:#16b95a;
  --gold:#ffd15b;
  --red:#ff6570;
}

body{
  margin:0;
  background:
    radial-gradient(
      circle at 50% -20%,
      #153925 0,
      transparent 40%
    ),
    var(--bg);

  color:var(--text);

  font-family:
    Arial,
    sans-serif;
}

.app{
  max-width:520px;
  margin:auto;
  padding:18px 15px 40px;
  min-height:100vh;
}

.screen{
  display:none;
}

.active{
  display:block;
}

.brand{
  text-align:center;
  padding:45px 0 25px;
}

.brand .ball{
  font-size:70px;
}

.brand h1{
  font-size:45px;
  line-height:.9;
  margin:8px;
}

.green{
  color:var(--green);
}

.muted{
  color:var(--muted);
}

.card,
.hero,
.playerCard,
.bidBox,
.stats,
.resultBox{

  background:
    linear-gradient(
      #17261f,
      #0f1915
    );

  border:
    1px solid
    var(--line);

  border-radius:22px;
}

.card{
  padding:18px;
}

label,
small{
  font-size:11px;
  color:var(--muted);
  font-weight:800;
  letter-spacing:.08em;
}

input{
  width:100%;
  padding:14px;
  margin:8px 0 12px;
  border-radius:14px;

  border:
    1px solid
    var(--line);

  background:#07100d;

  color:#fff;

  font-size:16px;

  outline:none;
}

input:focus{
  border-color:var(--green);
}

button{
  min-height:48px;
  border-radius:14px;

  border:
    1px solid
    var(--line);

  background:#16241d;

  color:#fff;

  font-weight:900;

  padding:10px 15px;

  cursor:pointer;
}

.primary{
  width:100%;

  background:
    linear-gradient(
      var(--green),
      var(--green2)
    );

  border:0;

  color:#041008;
}

.error{
  color:var(--red);
  font-size:13px;
  min-height:18px;
}

.or{
  display:flex;
  align-items:center;
  gap:10px;
  margin:16px 0;
  color:var(--muted);
  font-size:11px;
}

.or:before,
.or:after{
  content:'';
  height:1px;
  background:var(--line);
  flex:1;
}

.top{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:10px;
  margin-bottom:18px;
}

.code{
  font-size:40px;
  color:var(--green);
  font-weight:950;
  letter-spacing:.12em;
}

.hero{
  text-align:center;
  padding:22px;
  margin-bottom:20px;
}

.list{
  display:grid;
  gap:9px;
  margin:10px 0 18px;
}

.person{
  display:flex;
  justify-content:space-between;
  align-items:center;

  padding:13px;

  border:
    1px solid
    var(--line);

  border-radius:15px;

  background:#0b1511;
}

.avatar{
  width:40px;
  height:40px;

  border-radius:50%;

  display:grid;
  place-items:center;

  background:#1b3227;

  color:var(--green);

  font-weight:900;
}

.left{
  display:flex;
  gap:10px;
  align-items:center;
}

.host{
  font-size:10px;
  color:var(--gold);
}

.hidden{
  display:none!important;
}

.center{
  text-align:center;
}

.timer{
  width:55px;
  height:55px;

  border-radius:50%;

  border:
    3px solid
    var(--green);

  display:grid;
  place-items:center;

  font-size:21px;

  font-weight:950;
}

.playerCard{
  display:flex;

  align-items:center;

  gap:17px;

  padding:20px;

  min-height:200px;

  background:
    radial-gradient(
      circle at 20% 20%,
      rgba(53,227,122,.2),
      transparent 35%
    ),
    linear-gradient(
      135deg,
      #1a2d23,
      #0e1713
    );
}

.art{
  width:110px;
  height:150px;

  border-radius:18px;

  background:#21382c;

  display:grid;
  place-items:center;

  font-size:63px;
}

.playerCard h1{
  font-size:27px;
  margin:7px 0;
}

.rating{
  color:var(--gold);
  font-weight:950;
}

.position{
  width:max-content;

  margin:
    0 auto -14px;

  position:relative;

  z-index:2;

  padding:
    7px 18px;

  border-radius:999px;

  background:var(--green);

  color:#041008;

  font-weight:950;
}

.bidBox{
  text-align:center;
  padding:18px;
  margin-top:12px;
}

.price{
  font-size:49px;
  font-weight:950;
  color:var(--green);
  margin:4px;
}

.quick{
  display:grid;

  grid-template-columns:
    repeat(4,1fr);

  gap:7px;

  margin-top:13px;
}

.quick button{
  padding:8px;
}

.custom{
  display:grid;

  grid-template-columns:
    1fr 100px;

  gap:7px;

  margin-top:8px;
}

.custom input{
  margin:0;
}

.stats{
  display:grid;

  grid-template-columns:
    1fr 1fr;

  text-align:center;

  padding:14px;

  margin-top:12px;
}

.stats>div:first-child{
  border-right:
    1px solid
    var(--line);
}

.stats b{
  display:block;
  font-size:19px;
  margin-top:4px;
}

.managers{
  display:flex;
  gap:7px;
  overflow:auto;
  margin-top:12px;
}

.mini{
  min-width:120px;

  padding:10px;

  border:
    1px solid
    var(--line);

  border-radius:13px;

  background:#0a1410;

  font-size:12px;
}

.mini b{
  display:block;
  margin-bottom:4px;
}

.resultHero{
  text-align:center;
  padding:35px 0 20px;
}

.trophy{
  font-size:70px;
}

.resultHero h1{
  font-size:36px;
  color:var(--green);
  margin:6px;
}

.resultBox{
  overflow:hidden;
}

.row{
  display:grid;

  grid-template-columns:
    35px 1fr auto;

  gap:10px;

  align-items:center;

  padding:14px;

  border-bottom:
    1px solid
    var(--line);
}

.row:last-child{
  border-bottom:0;
}

.total{
  color:var(--gold);
  font-weight:950;
}

.squad{
  display:grid;

  grid-template-columns:
    repeat(2,1fr);

  gap:8px;

  margin:
    10px 0 20px;
}

.squadCard{
  border:
    1px solid
    var(--line);

  border-radius:14px;

  background:#0c1511;

  padding:11px;
}

.squadCard .pos{
  color:var(--green);
  font-size:11px;
  font-weight:900;
}

.squadCard b{
  display:block;
  margin:5px 0;
}

@media(max-width:410px){

  .brand h1{
    font-size:39px;
  }

  .code{
    font-size:34px;
  }

  .quick{
    grid-template-columns:
      repeat(2,1fr);
  }

  .art{
    width:92px;
    height:135px;
    font-size:52px;
  }

  .playerCard h1{
    font-size:22px;
  }
}

</style>

</head>

<body>

<main class="app">

<section
id="home"
class="screen active"
>

<div class="brand">

<div class="ball">
⚽
</div>

<h1>

FOOTBALL

<br>

<span class="green">
AUCTION
</span>

</h1>

<p class="muted">
Build your dream squad
</p>

</div>

<div class="card">

<label>
YOUR NAME
</label>

<input
id="name"
maxlength="18"
placeholder="Player name"
>

<button
id="create"
class="primary"
>

Create private room

</button>

<div class="or">
OR
</div>

<label>
ROOM CODE
</label>

<input
id="joinCode"
maxlength="6"
placeholder="ABC123"
>

<button
id="join"
style="width:100%"
>

Join room

</button>

<p
id="homeErr"
class="error"
></p>

</div>

</section>

<section
id="lobby"
class="screen"
>

<div class="top">

<div>

<small>
PRIVATE ROOM
</small>

<h2 id="lobbyTitle">
------
</h2>

</div>

<b class="green">
● LIVE
</b>

</div>

<div class="hero">

<p class="muted">
Share this code with your friend
</p>

<div
id="bigCode"
class="code"
>
------
</div>

<p class="muted">
2 players only • Classic Mode
</p>

</div>

<h3>
Managers
</h3>

<div
id="lobbyPlayers"
class="list"
></div>

<button
id="start"
class="primary hidden"
>
Start Auction
</button>

<p
id="lobbyMsg"
class="muted center"
></p>

</section>

<section
id="auction"
class="screen"
>

<div class="top">

<div>

<small>
ROUND
</small>

<h2>
<span id="round">1</span>/5
</h2>

</div>

<div>

<small>
ROOM
</small>

<b id="roomMini"></b>

</div>

<div
id="timer"
class="timer"
>
30
</div>

</div>

<div
id="pos"
class="position"
>
ST
</div>

<div class="playerCard">

<div class="art">
⚽
</div>

<div>

<small>
NOW AUCTIONING
</small>

<h1 id="pname">
Player
</h1>

<div class="rating">

<span id="rating">
90
</span>

OVR

</div>

</div>

</div>

<div class="bidBox">

<small>
CURRENT BID
</small>

<div class="price">

€

<span id="bid">
0
</span>

M

</div>

<p class="muted">

Highest bidder:

<b id="highest">
—
</b>

</p>

<div class="quick">

<button data-add="1">
+1M
</button>

<button data-add="2">
+2M
</button>

<button data-add="5">
+5M
</button>

<button data-add="10">
+10M
</button>

</div>

<div class="custom">

<input
id="custom"
type="number"
min="0"
placeholder="Custom bid"
>

<button
id="bidBtn"
class="primary"
>

BID

</button>

</div>

<p
id="bidErr"
class="error"
></p>

</div>

<div class="stats">

<div>

<small>
YOUR BUDGET
</small>

<b>

€

<span id="budget">
100
</span>

M

</b>

</div>

<div>

<small>
SQUAD
</small>

<b>

<span id="squadCount">
0
</span>

/5

</b>

</div>

</div>

<div
id="managers"
class="managers"
></div>

</section>

<section
id="result"
class="screen"
>

<div class="resultHero">

<div class="trophy">
🏆
</div>

<small>
AUCTION COMPLETE
</small>

<h1 id="winner">
Winner
</h1>

<p class="muted">
Match simulation result
</p>

</div>

<div
id="resultList"
class="resultBox"
></div>

<h3>
Your squad
</h3>

<div
id="squad"
class="squad"
></div>

<button
id="again"
class="primary"
>
Back to Home
</button>

</section>

</main>

<script src="/socket.io/socket.io.js"></script>

<script>

const socket=io();

let code=null;
let myId=null;
let state=null;
let lastResults=null;

const $=id=>
  document.getElementById(id);

function show(id){

  document
    .querySelectorAll('.screen')
    .forEach(x=>
      x.classList.remove('active')
    );

  $(id)
    .classList
    .add('active');
}

function esc(s){

  return String(s)

    .replaceAll('&','&amp;')

    .replaceAll('<','&lt;')

    .replaceAll('>','&gt;')

    .replaceAll('"','&quot;')

    .replaceAll("'",'&#039;');
}

function fmt(n){

  return Number.isInteger(n)
    ? n
    : Number(n).toFixed(1);
}

socket.on(
  'connect',
  ()=>{
    myId=socket.id;
  }
);

$('create').onclick=()=>{

  const name=
    $('name')
      .value
      .trim();

  if(!name){

    return $('homeErr')
      .textContent=
      'Enter your name';

  }

  socket.emit(
    'create',
    {name},
    r=>{

      if(!r.ok){

        return $('homeErr')
          .textContent=
          r.error;

      }

      code=r.code;

      show('lobby');
    }
  );
};

$('join').onclick=()=>{

  const name=
    $('name')
      .value
      .trim();

  const c=
    $('joinCode')
      .value
      .trim()
      .toUpperCase();

  if(
    !name ||
    c.length!==6
  ){

    return $('homeErr')
      .textContent=
      'Enter name + 6-character room code';

  }

  socket.emit(
    'join',
    {
      name,
      code:c
    },
    r=>{

      if(!r.ok){

        return $('homeErr')
          .textContent=
          r.error;

      }

      code=r.code;

      show('lobby');
    }
  );
};

$('start').onclick=()=>{

  socket.emit(
    'start',
    {code},
    r=>{

      if(!r.ok){

        $('lobbyMsg')
          .textContent=
          r.error;

      }
    }
  );
};

$('again').onclick=()=>{
  location.reload();
};

function place(n){

  if(
    !Number.isFinite(n) ||
    n<=0
  ){

    return $('bidErr')
      .textContent=
      'Invalid bid';

  }

  socket.emit(
    'bid',
    {
      code,
      amount:n
    },
    r=>{

      $('bidErr')
        .textContent=
        r.ok
          ? ''
          : r.error;

      if(r.ok){

        $('custom')
          .value='';

      }
    }
  );
}

document
  .querySelectorAll('[data-add]')
  .forEach(b=>{

    b.onclick=()=>{

      if(!state){
        return;
      }

      place(
        Number(state.currentBid)
        +
        Number(b.dataset.add)
      );
    };
  });

$('bidBtn').onclick=()=>{

  place(
    Number(
      $('custom').value
    )
  );

};

socket.on(
  'state',
  s=>{

    state=s;
    code=s.code;

    if(s.state==='lobby'){

      show('lobby');
      renderLobby(s);

    }
    else if(s.state==='auction'){

      show('auction');
      renderAuction(s);

    }
    else if(s.state==='result'){

      show('result');

      if(lastResults){

        renderResult(
          lastResults
        );

      }
    }
  }
);

socket.on(
  'results',
  r=>{

    lastResults=r;

    show('result');

    renderResult(r);
  }
);

function renderLobby(s){

  $('lobbyTitle')
    .textContent=
    s.code;

  $('bigCode')
    .textContent=
    s.code;

  $('lobbyPlayers')
    .innerHTML=
    s.players
      .map(p=>

        '<div class="person">'+

          '<div class="left">'+

            '<div class="avatar">'+
              esc(
                p.name[0]
                  ?.toUpperCase()
                ||
                '?'
              )+
            '</div>'+

            '<div>'+

              '<b>'+
                esc(p.name)+
              '</b>'+

              (
                p.id===s.hostId
                  ?
                  '<div class="host">HOST</div>'
                  :
                  ''
              )+

            '</div>'+

          '</div>'+

          '<b class="green">READY</b>'+

        '</div>'

      )
      .join('');

  const host=
    s.hostId===myId;

  $('start')
    .classList
    .toggle(
      'hidden',
      !host
    );

  $('lobbyMsg')
    .textContent=

    host

      ?

      (
        s.players.length<2

          ?

          'Waiting for a friend…'

          :

          'Ready to start'
      )

      :

      'Waiting for host…';
}

function renderAuction(s){

  $('round')
    .textContent=
    Math.min(
      s.round+1,
      5
    );

  $('roomMini')
    .textContent=
    s.code;

  $('timer')
    .textContent=
    s.seconds;

  if(s.current){

    $('pos')
      .textContent=
      s.current.pos;

    $('pname')
      .textContent=
      s.current.name;

    $('rating')
      .textContent=
      s.current.rating;

  }

  $('bid')
    .textContent=
    s.currentBid;

  const h=
    s.players
      .find(
        p=>
          p.id===
          s.highestBidder
      );

  $('highest')
    .textContent=

    h

      ?

      h.name

      :

      '—';

  const me=
    s.players
      .find(
        p=>
          p.id===myId
      );

  if(me){

    $('budget')
      .textContent=
      fmt(me.budget);

    $('squadCount')
      .textContent=
      me.squad.length;

  }

  $('managers')
    .innerHTML=

    s.players
      .map(p=>

        '<div class="mini">'+

          '<b>'+

            esc(p.name)+

            (
              p.id===myId
                ?
                ' • YOU'
                :
                ''
            )+

          '</b>'+

          '€'+
          fmt(p.budget)+
          'M • '+
          p.squad.length+
          '/5'+

        '</div>'

      )
      .join('');
}

function renderResult(r){

  if(!r.length){
    return;
  }

  $('winner')
    .textContent=
    r[0].name;

  $('resultList')
    .innerHTML=

    r.map(
      (x,i)=>

      '<div class="row">'+

        '<b>#'+
          (i+1)+
        '</b>'+

        '<div>'+

          '<b>'+
            esc(x.name)+
          '</b>'+

          '<br>'+

          '<small>'+

            'Squad '+
            x.power+

            ' • Chem '+
            x.chemistry+

            ' • Tactics '+
            x.tactics+

          '</small>'+

        '</div>'+

        '<div class="total">'+
          x.total+
        '</div>'+

      '</div>'

    )
    .join('');

  const me=
    state
      ?.players
      ?.find(
        p=>
          p.id===myId
      );

  $('squad')
    .innerHTML=

    (me?.squad||[])
      .map(
        p=>

        '<div class="squadCard">'+

          '<div class="pos">'+

            p.pos+

            (
              p.mystery

                ?

                ' • MYSTERY'

                :

                ''
            )+

          '</div>'+

          '<b>'+
            esc(p.name)+
          '</b>'+

          '<small>'+

            p.rating+
            ' OVR • '+

            (
              p.price

                ?

                '€'+
                fmt(p.price)+
                'M'

                :

                'FREE'
            )+

          '</small>'+

        '</div>'

      )
      .join('');
}

</script>

</body>

</html>
`;

app.get(
  '/',
  (req,res)=>
    res
      .type('html')
      .send(PAGE)
);

server.listen(
  PORT,
  ()=>{
    console.log(
      `Football Auction running at http://localhost:${PORT}`
    );
  }
);
