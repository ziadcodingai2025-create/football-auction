const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// ============================================================
// BID XI — V3
// 2-player real-time football auction battle
// ============================================================

const FORMATION = [
  "GK",
  "LB", "CB", "CB", "RB",
  "CM", "CM", "CAM",
  "LW", "ST", "RW"
];

const PLAYER_POOL = [
  {id:1,name:"Thibaut Courtois",pos:"GK",ovr:90,nation:"BEL",base:10},
  {id:2,name:"Alisson",pos:"GK",ovr:89,nation:"BRA",base:9},
  {id:3,name:"Ederson",pos:"GK",ovr:88,nation:"BRA",base:8},
  {id:4,name:"Donnarumma",pos:"GK",ovr:89,nation:"ITA",base:9},

  {id:5,name:"Theo Hernandez",pos:"LB",ovr:88,nation:"FRA",base:10},
  {id:6,name:"Alphonso Davies",pos:"LB",ovr:87,nation:"CAN",base:9},
  {id:7,name:"Nuno Mendes",pos:"LB",ovr:87,nation:"POR",base:9},

  {id:8,name:"William Saliba",pos:"CB",ovr:89,nation:"FRA",base:11},
  {id:9,name:"Virgil van Dijk",pos:"CB",ovr:90,nation:"NED",base:12},
  {id:10,name:"Antonio Rudiger",pos:"CB",ovr:88,nation:"GER",base:9},
  {id:11,name:"Ruben Dias",pos:"CB",ovr:89,nation:"POR",base:10},
  {id:12,name:"Bastoni",pos:"CB",ovr:88,nation:"ITA",base:9},
  {id:13,name:"Marquinhos",pos:"CB",ovr:87,nation:"BRA",base:8},

  {id:14,name:"Achraf Hakimi",pos:"RB",ovr:89,nation:"MAR",base:11},
  {id:15,name:"Trent Alexander-Arnold",pos:"RB",ovr:88,nation:"ENG",base:10},
  {id:16,name:"Jules Kounde",pos:"RB",ovr:87,nation:"FRA",base:9},

  {id:17,name:"Rodri",pos:"CM",ovr:91,nation:"ESP",base:14},
  {id:18,name:"Jude Bellingham",pos:"CM",ovr:92,nation:"ENG",base:16},
  {id:19,name:"Federico Valverde",pos:"CM",ovr:90,nation:"URU",base:13},
  {id:20,name:"Pedri",pos:"CM",ovr:89,nation:"ESP",base:12},
  {id:21,name:"Vitinha",pos:"CM",ovr:89,nation:"POR",base:12},
  {id:22,name:"Declan Rice",pos:"CM",ovr:89,nation:"ENG",base:12},
  {id:23,name:"Frenkie de Jong",pos:"CM",ovr:88,nation:"NED",base:11},

  {id:24,name:"Florian Wirtz",pos:"CAM",ovr:90,nation:"GER",base:14},
  {id:25,name:"Jamal Musiala",pos:"CAM",ovr:90,nation:"GER",base:14},
  {id:26,name:"Cole Palmer",pos:"CAM",ovr:89,nation:"ENG",base:13},
  {id:27,name:"Bruno Fernandes",pos:"CAM",ovr:88,nation:"POR",base:11},

  {id:28,name:"Vinicius Junior",pos:"LW",ovr:92,nation:"BRA",base:18},
  {id:29,name:"Khvicha Kvaratskhelia",pos:"LW",ovr:89,nation:"GEO",base:13},
  {id:30,name:"Rafael Leao",pos:"LW",ovr:88,nation:"POR",base:12},
  {id:31,name:"Luis Diaz",pos:"LW",ovr:87,nation:"COL",base:10},

  {id:32,name:"Kylian Mbappe",pos:"ST",ovr:93,nation:"FRA",base:20},
  {id:33,name:"Erling Haaland",pos:"ST",ovr:92,nation:"NOR",base:19},
  {id:34,name:"Harry Kane",pos:"ST",ovr:91,nation:"ENG",base:17},
  {id:35,name:"Lautaro Martinez",pos:"ST",ovr:90,nation:"ARG",base:15},
  {id:36,name:"Alexander Isak",pos:"ST",ovr:89,nation:"SWE",base:14},

  {id:37,name:"Mohamed Salah",pos:"RW",ovr:92,nation:"EGY",base:18},
  {id:38,name:"Lamine Yamal",pos:"RW",ovr:91,nation:"ESP",base:17},
  {id:39,name:"Bukayo Saka",pos:"RW",ovr:90,nation:"ENG",base:15},
  {id:40,name:"Rodrygo",pos:"RW",ovr:88,nation:"BRA",base:12}
];

const FLAG = {
  BEL:"🇧🇪", BRA:"🇧🇷", ITA:"🇮🇹", FRA:"🇫🇷", CAN:"🇨🇦", POR:"🇵🇹",
  NED:"🇳🇱", GER:"🇩🇪", MAR:"🇲🇦", ENG:"🏴", ESP:"🇪🇸", URU:"🇺🇾",
  GEO:"🇬🇪", COL:"🇨🇴", NOR:"🇳🇴", ARG:"🇦🇷", SWE:"🇸🇪", EGY:"🇪🇬"
};

const MANAGERS = {
  scout: {
    id:"scout",
    name:"THE SCOUT",
    desc:"Mystery players receive +1 OVR.",
    icon:"🔎"
  },
  tycoon: {
    id:"tycoon",
    name:"THE TYCOON",
    desc:"+12M starting budget.",
    icon:"💰"
  },
  tactician: {
    id:"tactician",
    name:"THE TACTICIAN",
    desc:"+4 chemistry before the match.",
    icon:"🧠"
  }
};

const POWER_CARDS = {
  freeze: {
    id:"freeze",
    name:"FREEZE",
    icon:"❄️",
    desc:"Locks your opponent's bidding for 4 seconds."
  },
  boost: {
    id:"boost",
    name:"CASH BOOST",
    icon:"💸",
    desc:"Adds 6M to your budget."
  },
  pressure: {
    id:"pressure",
    name:"PRESSURE",
    icon:"🔥",
    desc:"Adds 3M to the current bid without charging you immediately."
  }
};

const rooms = new Map();

function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }

function code6(){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s="";
  for(let i=0;i<6;i++) s+=chars[Math.floor(Math.random()*chars.length)];
  return s;
}

function shuffle(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function makeCardHand(){
  return shuffle(Object.keys(POWER_CARDS)).slice(0,2);
}

function publicUser(u){
  return {
    id:u.id,
    name:u.name,
    budget:u.budget,
    squad:u.squad,
    manager:u.manager,
    cards:u.cards,
    usedCards:u.usedCards,
    frozenUntil:u.frozenUntil || 0
  };
}

function publicRoom(room){
  return {
    code:room.code,
    hostId:room.hostId,
    phase:room.phase,
    round:room.round,
    roundCount:FORMATION.length,
    positions:FORMATION,
    current:room.current,
    currentBid:room.currentBid,
    highestBidder:room.highestBidder,
    seconds:room.seconds,
    players:[...room.users.values()].map(publicUser)
  };
}

function emitRoom(room){
  io.to(room.code).emit("state",publicRoom(room));
}

function choosePlayer(pos,used){
  const pool=PLAYER_POOL.filter(p=>p.pos===pos&&!used.has(p.id));
  if(!pool.length) return null;
  return pool[Math.floor(Math.random()*pool.length)];
}

function chooseMystery(pos,exclude){
  let pool=PLAYER_POOL.filter(p=>p.pos===pos&&!exclude.has(p.id));
  if(!pool.length) pool=PLAYER_POOL.filter(p=>p.pos===pos);
  const p=pool[Math.floor(Math.random()*pool.length)];
  return {...p,price:0,mystery:true};
}

function startAuction(room){
  room.phase="auction";
  room.round=0;
  room.used=new Set();

  for(const u of room.users.values()){
    let budget=180;
    if(u.manager==="tycoon") budget+=12;
    u.budget=budget;
    u.squad=[];
    u.cards=makeCardHand();
    u.usedCards=[];
    u.frozenUntil=0;
  }

  nextRound(room);
}

function nextRound(room){
  if(room.timer) clearInterval(room.timer);

  if(room.round>=FORMATION.length){
    finishMatch(room);
    return;
  }

  const pos=FORMATION[room.round];
  let p=choosePlayer(pos,room.used);

  if(!p){
    PLAYER_POOL.filter(x=>x.pos===pos).forEach(x=>room.used.delete(x.id));
    p=choosePlayer(pos,room.used);
  }

  room.used.add(p.id);
  room.current=p;
  room.currentBid=p.base;
  room.highestBidder=null;
  room.seconds=22;

  emitRoom(room);

  room.timer=setInterval(()=>{
    room.seconds--;
    if(room.seconds<=0){
      clearInterval(room.timer);
      settleRound(room);
    }else{
      emitRoom(room);
    }
  },1000);
}

function settleRound(room){
  const winner=room.highestBidder ? room.users.get(room.highestBidder) : null;
  const result={
    auctionPlayer:room.current,
    winnerId:winner?.id || null,
    winnerName:winner?.name || null,
    price:winner ? room.currentBid : 0,
    mystery:[]
  };

  if(winner && winner.budget>=room.currentBid){
    winner.budget-=room.currentBid;
    winner.squad.push({...room.current,price:room.currentBid,mystery:false});
  }

  for(const u of room.users.values()){
    if(!winner || u.id!==winner.id){
      const exclude=new Set(u.squad.map(x=>x.id).filter(x=>typeof x.id==="number"));
      let m=chooseMystery(room.current.pos,exclude);

      if(u.manager==="scout"){
        m={...m,ovr:clamp(m.ovr+1,0,99)};
      }

      u.squad.push(m);
      result.mystery.push({userId:u.id,userName:u.name,player:m});
    }
  }

  io.to(room.code).emit("round_result",result);

  room.round++;
  room.current=null;
  room.currentBid=0;
  room.highestBidder=null;
  room.seconds=0;

  emitRoom(room);

  setTimeout(()=>nextRound(room),2600);
}

function calcChemistry(user){
  let chem=0;
  const nationCounts={};
  for(const p of user.squad){
    nationCounts[p.nation]=(nationCounts[p.nation]||0)+1;
  }
  for(const count of Object.values(nationCounts)){
    if(count>=2) chem+=2;
    if(count>=3) chem+=2;
  }
  if(user.manager==="tactician") chem+=4;
  return clamp(chem,0,20);
}

function teamMetrics(user){
  const avg=user.squad.reduce((a,p)=>a+p.ovr,0)/Math.max(1,user.squad.length);
  const attack=user.squad.filter(p=>["LW","ST","RW","CAM"].includes(p.pos)).reduce((a,p)=>a+p.ovr,0);
  const midfield=user.squad.filter(p=>["CM","CAM"].includes(p.pos)).reduce((a,p)=>a+p.ovr,0);
  const defense=user.squad.filter(p=>["GK","LB","CB","RB"].includes(p.pos)).reduce((a,p)=>a+p.ovr,0);
  const chem=calcChemistry(user);
  const tactical=Math.random()*5;
  const strength=avg + chem*0.28 + tactical;

  return {
    id:user.id,
    name:user.name,
    manager:user.manager,
    squad:user.squad,
    avg:Math.round(avg*10)/10,
    chem,
    attack,
    midfield,
    defense,
    strength
  };
}

function finishMatch(room){
  room.phase="result";
  room.current=null;
  room.seconds=0;

  const users=[...room.users.values()];
  if(users.length!==2){
    emitRoom(room);
    return;
  }

  const a=teamMetrics(users[0]);
  const b=teamMetrics(users[1]);

  function goalCount(team,opp){
    const delta=(team.strength-opp.strength)/7;
    const raw=1.1+Math.random()*2.3+delta;
    return clamp(Math.round(raw),0,6);
  }

  let ga=goalCount(a,b);
  let gb=goalCount(b,a);

  if(ga===gb){
    if(a.strength>=b.strength) ga++;
    else gb++;
  }

  const totalGoals=ga+gb;
  const events=[];
  let leftA=ga,leftB=gb;

  for(let i=0;i<totalGoals;i++){
    const minute=4+Math.floor(Math.random()*87);
    const chooseA=leftA>0 && (leftB===0 || Math.random()<leftA/(leftA+leftB));
    const team=chooseA?a:b;

    const scorers=team.squad.filter(p=>["ST","LW","RW","CAM","CM"].includes(p.pos));
    const pool=scorers.length?scorers:team.squad;
    const scorer=pool[Math.floor(Math.random()*pool.length)];

    events.push({
      minute,
      type:"goal",
      teamId:team.id,
      teamName:team.name,
      player:scorer?.name || "Unknown"
    });

    if(chooseA) leftA--;
    else leftB--;
  }

  const extraEvents=[
    {type:"yellow",icon:"🟨"},
    {type:"save",icon:"🧤"},
    {type:"chance",icon:"⚡"}
  ];

  for(let i=0;i<4;i++){
    const ev=extraEvents[Math.floor(Math.random()*extraEvents.length)];
    const team=Math.random()<.5?a:b;
    const minute=5+Math.floor(Math.random()*84);
    events.push({
      minute,
      type:ev.type,
      icon:ev.icon,
      teamId:team.id,
      teamName:team.name,
      player:team.squad[Math.floor(Math.random()*team.squad.length)]?.name || ""
    });
  }

  events.sort((x,y)=>x.minute-y.minute);

  const winner=ga>gb?a:b;
  const loser=ga>gb?b:a;

  const xgA=Math.max(.3,ga*0.72+Math.random()*1.4);
  const xgB=Math.max(.3,gb*0.72+Math.random()*1.4);

  const possA=clamp(Math.round(50+(a.midfield-b.midfield)/18+(Math.random()*8-4)),37,63);
  const possB=100-possA;

  const shotsA=Math.max(ga,Math.round(xgA*4+Math.random()*4));
  const shotsB=Math.max(gb,Math.round(xgB*4+Math.random()*4));

  const motmCandidates=winner.squad.filter(p=>["ST","LW","RW","CAM","CM"].includes(p.pos));
  const motmPool=motmCandidates.length?motmCandidates:winner.squad;
  const motm=motmPool[Math.floor(Math.random()*motmPool.length)];

  const result={
    winnerId:winner.id,
    winnerName:winner.name,
    loserId:loser.id,
    score:{[a.id]:ga,[b.id]:gb},
    teams:[a,b],
    stats:{
      possession:{[a.id]:possA,[b.id]:possB},
      shots:{[a.id]:shotsA,[b.id]:shotsB},
      xg:{[a.id]:xgA.toFixed(1),[b.id]:xgB.toFixed(1)}
    },
    events,
    motm:motm?.name || winner.name
  };

  room.result=result;
  io.to(room.code).emit("match_result",result);
  emitRoom(room);
}

function getOpponent(room,socketId){
  return [...room.users.values()].find(u=>u.id!==socketId);
}

// ============================================================
// SOCKETS
// ============================================================

io.on("connection",socket=>{

  socket.on("create",({name},cb)=>{
    let code;
    do{code=code6();}while(rooms.has(code));

    const room={
      code,
      hostId:socket.id,
      phase:"manager",
      round:0,
      current:null,
      currentBid:0,
      highestBidder:null,
      seconds:0,
      users:new Map(),
      timer:null,
      used:new Set(),
      result:null
    };

    room.users.set(socket.id,{
      id:socket.id,
      name:String(name||"Player").slice(0,18),
      manager:null,
      budget:180,
      squad:[],
      cards:[],
      usedCards:[],
      frozenUntil:0
    });

    rooms.set(code,room);
    socket.join(code);
    cb?.({ok:true,code});
    emitRoom(room);
  });

  socket.on("join",({name,code},cb)=>{
    code=String(code||"").trim().toUpperCase();
    const room=rooms.get(code);

    if(!room) return cb?.({ok:false,error:"Room not found"});
    if(room.phase!=="manager") return cb?.({ok:false,error:"Game already started"});
    if(room.users.size>=2) return cb?.({ok:false,error:"Room is full — 2 players only"});

    room.users.set(socket.id,{
      id:socket.id,
      name:String(name||"Player").slice(0,18),
      manager:null,
      budget:180,
      squad:[],
      cards:[],
      usedCards:[],
      frozenUntil:0
    });

    socket.join(code);
    cb?.({ok:true,code});
    emitRoom(room);
  });

  socket.on("choose_manager",({code,manager},cb)=>{
    const room=rooms.get(code);
    const user=room?.users.get(socket.id);

    if(!room||!user) return cb?.({ok:false,error:"Room not found"});
    if(!MANAGERS[manager]) return cb?.({ok:false,error:"Invalid manager"});

    user.manager=manager;
    emitRoom(room);
    cb?.({ok:true});
  });

  socket.on("start",({code},cb)=>{
    const room=rooms.get(code);
    if(!room) return cb?.({ok:false,error:"Room not found"});
    if(room.hostId!==socket.id) return cb?.({ok:false,error:"Host only"});
    if(room.users.size!==2) return cb?.({ok:false,error:"Exactly 2 players are required"});

    const users=[...room.users.values()];
    if(users.some(u=>!u.manager)) return cb?.({ok:false,error:"Both players must choose a manager"});

    startAuction(room);
    cb?.({ok:true});
  });

  socket.on("bid",({code,amount},cb)=>{
    const room=rooms.get(code);
    if(!room||room.phase!=="auction"||!room.current){
      return cb?.({ok:false,error:"No active auction"});
    }

    const user=room.users.get(socket.id);
    if(!user) return cb?.({ok:false,error:"Not in room"});

    if(Date.now()<(user.frozenUntil||0)){
      const secs=Math.ceil((user.frozenUntil-Date.now())/1000);
      return cb?.({ok:false,error:`Frozen for ${secs}s`});
    }

    // No self-bidding.
    if(room.highestBidder===socket.id){
      return cb?.({ok:false,error:"You already lead this auction"});
    }

    const n=Number(amount);
    if(!Number.isFinite(n)) return cb?.({ok:false,error:"Invalid bid"});
    if(n<=room.currentBid) return cb?.({ok:false,error:"Bid must be higher"});
    if(n>user.budget) return cb?.({ok:false,error:"Not enough budget"});

    room.currentBid=Math.round(n*10)/10;
    room.highestBidder=socket.id;

    if(room.seconds<=3) room.seconds=5;

    emitRoom(room);
    cb?.({ok:true});
  });

  socket.on("use_card",({code,card},cb)=>{
    const room=rooms.get(code);
    const user=room?.users.get(socket.id);

    if(!room||!user) return cb?.({ok:false,error:"Room not found"});
    if(room.phase!=="auction") return cb?.({ok:false,error:"Cards work during auctions"});
    if(!user.cards.includes(card)) return cb?.({ok:false,error:"You do not own this card"});
    if(user.usedCards.includes(card)) return cb?.({ok:false,error:"Card already used"});

    const opponent=getOpponent(room,socket.id);

    if(card==="freeze"){
      if(!opponent) return cb?.({ok:false,error:"No opponent"});
      opponent.frozenUntil=Date.now()+4000;
    }

    if(card==="boost"){
      user.budget+=6;
    }

    if(card==="pressure"){
      room.currentBid+=3;
      room.highestBidder=null;
    }

    user.usedCards.push(card);

    io.to(room.code).emit("card_event",{
      userId:user.id,
      userName:user.name,
      card,
      cardName:POWER_CARDS[card].name,
      icon:POWER_CARDS[card].icon
    });

    emitRoom(room);
    cb?.({ok:true});
  });

  socket.on("rematch",({code},cb)=>{
    const room=rooms.get(code);
    if(!room) return cb?.({ok:false,error:"Room not found"});
    if(room.users.size!==2) return cb?.({ok:false,error:"Need both players"});

    room.phase="manager";
    room.round=0;
    room.current=null;
    room.currentBid=0;
    room.highestBidder=null;
    room.seconds=0;
    room.result=null;

    for(const u of room.users.values()){
      u.manager=null;
      u.budget=180;
      u.squad=[];
      u.cards=[];
      u.usedCards=[];
      u.frozenUntil=0;
    }

    emitRoom(room);
    cb?.({ok:true});
  });

  socket.on("disconnect",()=>{
    for(const [code,room] of rooms.entries()){
      if(!room.users.has(socket.id)) continue;

      room.users.delete(socket.id);

      if(room.hostId===socket.id){
        room.hostId=room.users.keys().next().value || null;
      }

      if(room.users.size===0){
        if(room.timer) clearInterval(room.timer);
        rooms.delete(code);
      }else{
        emitRoom(room);
      }
    }
  });
});

// ============================================================
// FRONT END
// ============================================================

const PAGE=String.raw`
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#050908">
<title>BID XI</title>
<style>
*{box-sizing:border-box}
:root{
  --bg:#050908;--panel:#0c1512;--panel2:#111f1a;--line:#20352c;
  --text:#f3fff7;--muted:#8fa49a;--lime:#43f47d;--lime2:#1dbf59;
  --gold:#ffd969;--red:#ff6370;--blue:#6aa9ff;--purple:#a688ff;
}
html,body{margin:0;min-height:100%;background:#050908;color:var(--text);font-family:Inter,Arial,sans-serif}
body{
  background:
    radial-gradient(circle at 50% -5%,rgba(67,244,125,.16),transparent 26%),
    radial-gradient(circle at 100% 20%,rgba(106,169,255,.07),transparent 24%),
    linear-gradient(#050908,#040706 70%);
}
button,input{font:inherit}
button{cursor:pointer}
.app{max-width:590px;margin:auto;padding:15px 14px 42px;min-height:100vh}
.screen{display:none}.screen.active{display:block}
.hidden{display:none!important}.muted{color:var(--muted)}.lime{color:var(--lime)}
.card{
  background:linear-gradient(180deg,rgba(17,31,26,.98),rgba(8,16,13,.98));
  border:1px solid var(--line);border-radius:24px;
}
.brand{text-align:center;padding:32px 0 21px}
.logo{
  width:88px;height:88px;margin:auto;border-radius:27px;display:grid;place-items:center;
  font-size:46px;background:linear-gradient(150deg,#153324,#07100c);
  border:1px solid #2b4a39;box-shadow:inset 0 0 40px rgba(67,244,125,.08)
}
.brand h1{font-size:48px;line-height:.87;margin:14px 0 8px;letter-spacing:-2px}
.brand h1 span{color:var(--lime)}
.brand p{margin:0;color:var(--muted)}
.homeCard{padding:18px}
label,small{display:block;color:var(--muted);font-size:11px;font-weight:900;letter-spacing:.09em}
input{
  width:100%;min-height:52px;margin:8px 0 13px;padding:0 14px;color:#fff;
  border:1px solid var(--line);border-radius:15px;background:#06100c;outline:none;font-size:16px
}
input:focus{border-color:var(--lime);box-shadow:0 0 0 3px rgba(67,244,125,.09)}
button{
  border:1px solid var(--line);background:#122019;color:#fff;border-radius:15px;
  min-height:50px;padding:10px 15px;font-weight:950
}
button:active{transform:translateY(1px)}
.primary{width:100%;border:0;color:#041008;background:linear-gradient(var(--lime),var(--lime2))}
.secondary{width:100%}
.or{display:flex;gap:10px;align-items:center;color:var(--muted);font-size:11px;margin:17px 0}
.or:before,.or:after{content:"";height:1px;background:var(--line);flex:1}
.error{color:var(--red);font-size:13px;min-height:18px}
.topbar{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:16px}
.topbar h2{margin:2px 0 0}.live{color:var(--lime);font-size:12px;font-weight:950}
.roomHero{text-align:center;padding:24px;margin-bottom:14px}
.roomHero .code{font-size:43px;letter-spacing:.14em;color:var(--lime);font-weight:1000;margin:10px 0}
.duel{display:grid;grid-template-columns:1fr 50px 1fr;gap:8px;align-items:center;margin-bottom:14px}
.managerMini{text-align:center;padding:14px;min-width:0}
.avatar{
  width:48px;height:48px;margin:auto;border-radius:50%;display:grid;place-items:center;
  background:#183326;color:var(--lime);font-weight:1000;font-size:20px
}
.managerMini b{display:block;margin-top:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vs{text-align:center;color:var(--gold);font-weight:1000}
.managerPick{padding:18px}
.managerGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:11px 0 15px}
.managerChoice{min-height:128px;text-align:left;padding:12px}
.managerChoice.selected{border-color:var(--lime);background:rgba(67,244,125,.08)}
.managerChoice .icon{font-size:29px}.managerChoice b{display:block;margin:7px 0 5px;font-size:12px}
.managerChoice span{font-size:10px;color:var(--muted);line-height:1.3;display:block}
.auctionHeader{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;margin-bottom:12px}
.timer{
  width:70px;height:70px;border-radius:50%;display:grid;place-items:center;position:relative;
  background:conic-gradient(var(--lime) var(--deg,360deg),#183026 0)
}
.timer:after{content:"";position:absolute;inset:6px;border-radius:50%;background:#07100d;border:1px solid var(--line)}
.timer b{z-index:2;font-size:23px}.right{text-align:right}
.stage{
  border:1px solid var(--line);border-radius:27px;padding:21px;overflow:hidden;position:relative;
  background:
    radial-gradient(circle at 20% 20%,rgba(67,244,125,.23),transparent 29%),
    radial-gradient(circle at 86% 12%,rgba(255,217,105,.10),transparent 24%),
    linear-gradient(145deg,#14271e,#08100d)
}
.stage:after{
  content:"";position:absolute;left:-10%;right:-10%;bottom:-105px;height:190px;
  border:1px solid rgba(67,244,125,.16);border-radius:50%
}
.pos{display:inline-flex;padding:7px 13px;border-radius:999px;background:var(--lime);color:#041008;font-weight:1000;font-size:12px}
.playerHero{display:grid;grid-template-columns:136px 1fr;gap:18px;align-items:center;margin-top:16px;position:relative;z-index:2}
.playerCard{
  height:178px;border-radius:24px;display:grid;place-items:center;position:relative;overflow:hidden;
  border:1px solid #385747;background:linear-gradient(160deg,#2b4f3b,#0b1711)
}
.playerCard .sil{font-size:78px;filter:drop-shadow(0 9px 12px rgba(0,0,0,.25))}
.ovr{
  position:absolute;top:9px;left:9px;padding:7px 8px;border-radius:12px;background:#07100d;
  border:1px solid var(--line);font-weight:1000;color:var(--gold)
}
.playerInfo h1{font-size:29px;line-height:1;margin:8px 0}
.playerMeta{color:var(--muted);font-size:13px;font-weight:800}
.bidBox{text-align:center;padding:18px;margin-top:11px}
.priceLabel{color:var(--muted);font-size:11px;font-weight:900;letter-spacing:.08em}
.price{font-size:52px;color:var(--lime);font-weight:1000;margin:2px 0}
.highest{font-size:13px;color:var(--muted);margin-bottom:12px}
.quick{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
.quick button{min-height:44px;padding:7px}
.custom{display:grid;grid-template-columns:1fr 100px;gap:7px;margin-top:8px}
.custom input{margin:0}
.duelHud{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:11px}
.hud{padding:12px}.hud.you{border-color:rgba(67,244,125,.6)}
.hudTop{display:flex;justify-content:space-between;gap:8px;font-size:12px}.hudTop b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.money{color:var(--gold);font-weight:1000}
.bar{height:7px;border-radius:999px;background:#07100d;overflow:hidden;margin:8px 0}
.bar>div{height:100%;background:var(--lime)}
.hudBottom{display:flex;justify-content:space-between;gap:5px;color:var(--muted);font-size:10px}
.cardTray{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:11px}
.powerCard{padding:12px;text-align:left;min-height:78px}
.powerCard.used{opacity:.35}
.powerCard .ci{font-size:24px}.powerCard b{display:block;margin:3px 0;font-size:11px}.powerCard span{font-size:9px;color:var(--muted);display:block}
.overlay{
  position:fixed;inset:0;z-index:30;display:none;align-items:center;justify-content:center;padding:20px;
  background:rgba(2,7,5,.84);backdrop-filter:blur(9px)
}
.overlay.show{display:flex}
.reveal{width:min(430px,100%);padding:24px;text-align:center}.revealIcon{font-size:50px}
.reveal h2{margin:9px 0 6px}
.revealPlayer{margin-top:13px;padding:16px;border:1px solid var(--line);border-radius:18px;background:#07100d}
.revealPlayer .big{font-size:22px;font-weight:1000}.revealPlayer .meta{font-size:12px;color:var(--muted);margin-top:5px}
.toast{
  position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:40;
  background:#102019;border:1px solid var(--line);border-radius:999px;padding:10px 15px;
  font-size:12px;font-weight:900;display:none
}
.toast.show{display:block}
.resultHero{text-align:center;padding:25px 0 17px}.cup{font-size:70px}
.resultHero h1{font-size:36px;color:var(--lime);margin:7px 0}
.scoreboard{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;padding:18px}
.team{text-align:center;min-width:0}.team b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.teamScore{font-size:40px;font-weight:1000;margin-top:5px}.dash{font-size:28px;color:var(--gold)}
.statBox{padding:15px;margin-top:10px}.statRow{display:grid;grid-template-columns:1fr 90px 1fr;align-items:center;text-align:center;padding:8px 0;border-bottom:1px solid var(--line)}
.statRow:last-child{border-bottom:0}.statRow span:nth-child(2){font-size:10px;color:var(--muted);font-weight:900}
.timeline{padding:15px;margin-top:10px}.timeline h3{margin:0 0 8px}
.event{display:flex;gap:9px;padding:9px 0;border-bottom:1px solid var(--line);font-size:12px}.event:last-child{border-bottom:0}
.minute{color:var(--lime);font-weight:1000;min-width:36px}
.motm{padding:16px;margin-top:10px;text-align:center}.motm .star{font-size:35px}.motm b{display:block;font-size:21px;margin-top:4px}
.pitch{
  margin-top:10px;padding:16px 12px;border:1px solid var(--line);border-radius:23px;
  background:
    linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px),
    linear-gradient(#0d3b23,#082d1b);
  background-size:100% 25%,25% 100%,auto;min-height:390px;position:relative
}
.pitchRows{display:flex;flex-direction:column;justify-content:space-between;height:355px}
.pitchRow{display:flex;justify-content:space-around;gap:5px}
.pitchPlayer{width:82px;text-align:center;padding:7px 4px;border-radius:13px;background:rgba(5,12,8,.82);border:1px solid rgba(255,255,255,.12)}
.pitchPlayer .povr{color:var(--gold);font-weight:1000}.pitchPlayer b{display:block;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pitchPlayer small{font-size:8px;letter-spacing:0}
.actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:15px}
@media(max-width:420px){
  .brand h1{font-size:41px}.managerGrid{grid-template-columns:1fr}.managerChoice{min-height:auto}
  .playerHero{grid-template-columns:106px 1fr;gap:12px}.playerCard{height:152px}.playerCard .sil{font-size:58px}
  .playerInfo h1{font-size:23px}.quick{grid-template-columns:repeat(2,1fr)}
  .roomHero .code{font-size:34px}.pitchPlayer{width:70px}.duelHud{grid-template-columns:1fr}
}
</style>
</head>

<body>
<div id="toast" class="toast"></div>

<main class="app">

<section id="home" class="screen active">
  <div class="brand">
    <div class="logo">⚽</div>
    <h1>BID <span>XI</span></h1>
    <p>Auction. Outsmart. Win.</p>
  </div>

  <div class="card homeCard">
    <label>YOUR NAME</label>
    <input id="name" maxlength="18" placeholder="Player name">

    <button id="createBtn" class="primary">CREATE PRIVATE BATTLE</button>

    <div class="or">OR</div>

    <label>ROOM CODE</label>
    <input id="joinCode" maxlength="6" placeholder="ABC123">
    <button id="joinBtn" class="secondary">JOIN BATTLE</button>

    <p id="homeError" class="error"></p>
  </div>
</section>

<section id="manager" class="screen">
  <div class="topbar">
    <div>
      <small>PRIVATE BATTLE</small>
      <h2 id="managerCode">------</h2>
    </div>
    <div class="live">● LIVE</div>
  </div>

  <div class="card roomHero">
    <small>ROOM CODE</small>
    <div id="bigCode" class="code">------</div>
    <p>2 players • Ultimate XI • €180M</p>
  </div>

  <div class="duel">
    <div id="leftManager" class="card managerMini"></div>
    <div class="vs">VS</div>
    <div id="rightManager" class="card managerMini"></div>
  </div>

  <div class="card managerPick">
    <small>CHOOSE YOUR MANAGER</small>
    <div class="managerGrid">
      <button class="managerChoice" data-manager="scout">
        <div class="icon">🔎</div>
        <b>THE SCOUT</b>
        <span>Mystery players get +1 OVR.</span>
      </button>
      <button class="managerChoice" data-manager="tycoon">
        <div class="icon">💰</div>
        <b>THE TYCOON</b>
        <span>Start with +12M extra budget.</span>
      </button>
      <button class="managerChoice" data-manager="tactician">
        <div class="icon">🧠</div>
        <b>THE TACTICIAN</b>
        <span>Extra chemistry before the match.</span>
      </button>
    </div>

    <button id="startBtn" class="primary hidden">START THE WAR</button>
    <p id="managerMessage" class="muted" style="text-align:center"></p>
  </div>
</section>

<section id="auction" class="screen">
  <div class="auctionHeader">
    <div>
      <small>ROUND</small>
      <b><span id="roundNo">1</span>/11</b>
    </div>

    <div id="timerWrap" class="timer">
      <b id="timer">22</b>
    </div>

    <div class="right">
      <small>ROOM</small>
      <b id="auctionCode">------</b>
    </div>
  </div>

  <div class="stage">
    <span id="position" class="pos">ST</span>

    <div class="playerHero">
      <div class="playerCard">
        <div id="ovr" class="ovr">90</div>
        <div class="sil">👤</div>
      </div>

      <div class="playerInfo">
        <small>LIVE AUCTION</small>
        <h1 id="playerName">Player</h1>
        <div id="playerMeta" class="playerMeta">🇫🇷 FRA • ST</div>
      </div>
    </div>
  </div>

  <div class="card bidBox">
    <div class="priceLabel">CURRENT BID</div>
    <div class="price">€<span id="bid">0</span>M</div>
    <div class="highest">Highest bidder: <b id="highest">—</b></div>

    <div class="quick">
      <button data-add="1">+1M</button>
      <button data-add="2">+2M</button>
      <button data-add="5">+5M</button>
      <button data-add="10">+10M</button>
    </div>

    <div class="custom">
      <input id="customBid" type="number" min="0" placeholder="Custom bid">
      <button id="customBidBtn" class="primary">BID</button>
    </div>

    <p id="bidError" class="error"></p>
  </div>

  <div id="duelHud" class="duelHud"></div>

  <small style="margin-top:12px">POWER CARDS</small>
  <div id="cardTray" class="cardTray"></div>
</section>

<section id="result" class="screen">
  <div class="resultHero">
    <div class="cup">🏆</div>
    <small>FULL TIME</small>
    <h1 id="winnerName">Winner</h1>
    <p class="muted">The stronger squad won the battle.</p>
  </div>

  <div id="scoreboard" class="card scoreboard"></div>

  <div id="statBox" class="card statBox"></div>

  <div class="card motm">
    <div class="star">⭐</div>
    <small>PLAYER OF THE MATCH</small>
    <b id="motm">—</b>
  </div>

  <div class="card timeline">
    <h3>Match Timeline</h3>
    <div id="timeline"></div>
  </div>

  <h3>Your Ultimate XI</h3>
  <div id="pitch" class="pitch"></div>

  <div class="actions">
    <button id="rematchBtn" class="primary">REMATCH</button>
    <button id="homeBtn">HOME</button>
  </div>
</section>

</main>

<div id="roundOverlay" class="overlay">
  <div class="card reveal">
    <div id="revealIcon" class="revealIcon">🎭</div>
    <small id="revealEyebrow">ROUND RESULT</small>
    <h2 id="revealTitle">Mystery reveal</h2>
    <p id="revealText" class="muted"></p>
    <div id="revealPlayer" class="revealPlayer"></div>
  </div>
</div>

<script src="/socket.io/socket.io.js"></script>
<script>
(()=>{
const socket=io();

const MANAGERS={
  scout:{name:"THE SCOUT",icon:"🔎"},
  tycoon:{name:"THE TYCOON",icon:"💰"},
  tactician:{name:"THE TACTICIAN",icon:"🧠"}
};

const CARDS={
  freeze:{name:"FREEZE",icon:"❄️",desc:"Lock opponent bidding for 4s."},
  boost:{name:"CASH BOOST",icon:"💸",desc:"+6M budget instantly."},
  pressure:{name:"PRESSURE",icon:"🔥",desc:"+3M to current bid."}
};

const FLAGS={
  BEL:"🇧🇪",BRA:"🇧🇷",ITA:"🇮🇹",FRA:"🇫🇷",CAN:"🇨🇦",POR:"🇵🇹",
  NED:"🇳🇱",GER:"🇩🇪",MAR:"🇲🇦",ENG:"🏴",ESP:"🇪🇸",URU:"🇺🇾",
  GEO:"🇬🇪",COL:"🇨🇴",NOR:"🇳🇴",ARG:"🇦🇷",SWE:"🇸🇪",EGY:"🇪🇬"
};

let myId=null;
let code=null;
let state=null;
let match=null;

const $=id=>document.getElementById(id);

function show(id){
  document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));
  $(id).classList.add("active");
}

function esc(s){
  return String(s??"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function fmt(n){
  const x=Number(n);
  return Number.isInteger(x)?String(x):x.toFixed(1);
}

function toast(text){
  const t=$("toast");
  t.textContent=text;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer=setTimeout(()=>t.classList.remove("show"),1800);
}

function initials(name){
  return String(name||"?").trim().slice(0,1).toUpperCase();
}

socket.on("connect",()=>{myId=socket.id});

$("createBtn").onclick=()=>{
  const name=$("name").value.trim();
  if(!name) return $("homeError").textContent="Enter your name";

  socket.emit("create",{name},r=>{
    if(!r?.ok) return $("homeError").textContent=r?.error||"Create failed";
    code=r.code;
    $("homeError").textContent="";
    show("manager");
  });
};

$("joinBtn").onclick=()=>{
  const name=$("name").value.trim();
  const room=$("joinCode").value.trim().toUpperCase();

  if(!name||room.length!==6){
    return $("homeError").textContent="Enter name + 6-character code";
  }

  socket.emit("join",{name,code:room},r=>{
    if(!r?.ok) return $("homeError").textContent=r?.error||"Join failed";
    code=r.code;
    $("homeError").textContent="";
    show("manager");
  });
};

document.querySelectorAll("[data-manager]").forEach(btn=>{
  btn.onclick=()=>{
    if(!code) return;

    const manager=btn.dataset.manager;

    socket.emit("choose_manager",{code,manager},r=>{
      if(!r?.ok) return toast(r?.error||"Manager error");

      document.querySelectorAll(".managerChoice").forEach(x=>x.classList.remove("selected"));
      btn.classList.add("selected");
      toast("Manager selected");
    });
  };
});

$("startBtn").onclick=()=>{
  socket.emit("start",{code},r=>{
    if(!r?.ok) $("managerMessage").textContent=r?.error||"Could not start";
  });
};

function bid(amount){
  if(!Number.isFinite(amount)||amount<=0){
    return $("bidError").textContent="Invalid bid";
  }

  socket.emit("bid",{code,amount},r=>{
    $("bidError").textContent=r?.ok?"":(r?.error||"Bid failed");
    if(r?.ok) $("customBid").value="";
  });
}

document.querySelectorAll("[data-add]").forEach(btn=>{
  btn.onclick=()=>{
    if(!state) return;
    bid(Number(state.currentBid)+Number(btn.dataset.add));
  };
});

$("customBidBtn").onclick=()=>bid(Number($("customBid").value));

socket.on("state",s=>{
  state=s;
  code=s.code;

  if(s.phase==="manager"){
    show("manager");
    renderManager(s);
  }else if(s.phase==="auction"){
    show("auction");
    renderAuction(s);
  }else if(s.phase==="result"){
    show("result");
    if(match) renderResult(match);
  }
});

socket.on("round_result",result=>showRoundResult(result));

socket.on("card_event",event=>{
  toast(event.icon+" "+event.userName+" used "+event.cardName);
});

socket.on("match_result",result=>{
  match=result;
  show("result");
  renderResult(result);
});

function managerBox(player,hostId){
  if(!player){
    return '<div class="avatar">?</div><b>Waiting...</b><small>INVITE FRIEND</small>';
  }

  const m=player.manager?MANAGERS[player.manager]:null;

  return (
    '<div class="avatar">'+esc(initials(player.name))+'</div>'+
    '<b>'+esc(player.name)+'</b>'+
    '<small>'+(player.id===hostId?"HOST":"CHALLENGER")+(m?" • "+m.icon+" "+m.name:"")+'</small>'
  );
}

function renderManager(s){
  $("managerCode").textContent=s.code;
  $("bigCode").textContent=s.code;

  $("leftManager").innerHTML=managerBox(s.players[0],s.hostId);
  $("rightManager").innerHTML=managerBox(s.players[1],s.hostId);

  const me=s.players.find(p=>p.id===myId);
  if(me?.manager){
    document.querySelectorAll(".managerChoice").forEach(x=>{
      x.classList.toggle("selected",x.dataset.manager===me.manager);
    });
  }

  const host=s.hostId===myId;
  $("startBtn").classList.toggle("hidden",!host);

  const allReady=s.players.length===2&&s.players.every(p=>p.manager);

  $("managerMessage").textContent=
    host
      ? (allReady?"Both managers ready 🔥":"Waiting for both manager choices...")
      : "Waiting for the host...";
}

function renderAuction(s){
  $("roundNo").textContent=Math.min(s.round+1,11);
  $("auctionCode").textContent=s.code;
  $("timer").textContent=s.seconds;
  $("timerWrap").style.setProperty("--deg",(Math.max(0,Math.min(22,s.seconds))/22*360)+"deg");

  if(s.current){
    $("position").textContent=s.current.pos;
    $("ovr").textContent=s.current.ovr;
    $("playerName").textContent=s.current.name;
    $("playerMeta").textContent=(FLAGS[s.current.nation]||"🌍")+" "+s.current.nation+" • "+s.current.pos;
  }

  $("bid").textContent=fmt(s.currentBid);

  const highest=s.players.find(p=>p.id===s.highestBidder);
  $("highest").textContent=highest?highest.name:"—";

  $("duelHud").innerHTML=s.players.map(p=>{
    const max=p.manager==="tycoon"?192:180;
    const pct=Math.max(0,Math.min(100,p.budget/max*100));
    const frozen=Date.now()<(p.frozenUntil||0);

    return (
      '<div class="card hud '+(p.id===myId?"you":"")+'">'+
        '<div class="hudTop">'+
          '<b>'+esc(p.name)+(p.id===myId?" • YOU":"")+'</b>'+
          '<span class="money">€'+fmt(p.budget)+'M</span>'+
        '</div>'+
        '<div class="bar"><div style="width:'+pct+'%"></div></div>'+
        '<div class="hudBottom">'+
          '<span>'+p.squad.length+'/11 players</span>'+
          '<span>'+(frozen?"❄️ FROZEN":(p.id===s.highestBidder?"🔥 LEADING":""))+'</span>'+
        '</div>'+
      '</div>'
    );
  }).join("");

  const me=s.players.find(p=>p.id===myId);
  $("cardTray").innerHTML=(me?.cards||[]).map(card=>{
    const c=CARDS[card];
    const used=me.usedCards.includes(card);

    return (
      '<button class="powerCard '+(used?"used":"")+'" data-card="'+card+'" '+(used?"disabled":"")+'>'+
        '<div class="ci">'+c.icon+'</div>'+
        '<b>'+c.name+'</b>'+
        '<span>'+c.desc+'</span>'+
      '</button>'
    );
  }).join("");

  document.querySelectorAll("[data-card]").forEach(btn=>{
    btn.onclick=()=>{
      socket.emit("use_card",{code,card:btn.dataset.card},r=>{
        if(!r?.ok) toast(r?.error||"Card failed");
      });
    };
  });
}

function showRoundResult(r){
  const mine=r.mystery.find(x=>x.userId===myId);
  const won=r.winnerId===myId;

  if(won){
    $("revealIcon").textContent="🔥";
    $("revealEyebrow").textContent="AUCTION WON";
    $("revealTitle").textContent="You signed "+r.auctionPlayer.name;
    $("revealText").textContent="Winning price: €"+fmt(r.price)+"M";
    $("revealPlayer").innerHTML=
      '<div class="big">'+esc(r.auctionPlayer.name)+'</div>'+
      '<div class="meta">'+r.auctionPlayer.ovr+' OVR • '+r.auctionPlayer.pos+'</div>';
  }else if(mine){
    $("revealIcon").textContent="🎭";
    $("revealEyebrow").textContent="MYSTERY PLAYER";
    $("revealTitle").textContent="Your fallback signing";
    $("revealText").textContent=r.winnerName?esc(r.winnerName)+" won the auction.":"Nobody won the auction.";
    $("revealPlayer").innerHTML=
      '<div class="big">'+esc(mine.player.name)+'</div>'+
      '<div class="meta">'+mine.player.ovr+' OVR • '+mine.player.pos+' • FREE</div>';
  }else{
    return;
  }

  $("roundOverlay").classList.add("show");
  setTimeout(()=>$("roundOverlay").classList.remove("show"),2250);
}

function statRow(label,a,b){
  return '<div class="statRow"><b>'+a+'</b><span>'+label+'</span><b>'+b+'</b></div>';
}

function renderResult(r){
  $("winnerName").textContent=r.winnerName;

  const a=r.teams[0],b=r.teams[1];
  const ga=r.score[a.id]??0,gb=r.score[b.id]??0;

  $("scoreboard").innerHTML=
    '<div class="team"><b>'+esc(a.name)+'</b><small>AVG '+a.avg+' • CHEM '+a.chem+'</small><div class="teamScore">'+ga+'</div></div>'+
    '<div class="dash">—</div>'+
    '<div class="team"><b>'+esc(b.name)+'</b><small>AVG '+b.avg+' • CHEM '+b.chem+'</small><div class="teamScore">'+gb+'</div></div>';

  $("statBox").innerHTML=
    statRow("POSSESSION",r.stats.possession[a.id]+"%",r.stats.possession[b.id]+"%")+
    statRow("SHOTS",r.stats.shots[a.id],r.stats.shots[b.id])+
    statRow("xG",r.stats.xg[a.id],r.stats.xg[b.id])+
    statRow("TEAM AVG",a.avg,b.avg)+
    statRow("CHEMISTRY",a.chem,b.chem);

  $("motm").textContent=r.motm;

  $("timeline").innerHTML=r.events.map(e=>{
    const icon=e.type==="goal"?"⚽":(e.icon||"•");
    return (
      '<div class="event">'+
        '<div class="minute">'+e.minute+"'</div>"+
        '<div><b>'+icon+" "+esc(e.player)+'</b><br><span class="muted">'+esc(e.teamName)+" • "+e.type.toUpperCase()+'</span></div>'+
      '</div>'
    );
  }).join("");

  const me=r.teams.find(t=>t.id===myId);
  renderPitch(me?.squad||[]);
}

function renderPitch(squad){
  const byPos={};
  squad.forEach(p=>{
    if(!byPos[p.pos]) byPos[p.pos]=[];
    byPos[p.pos].push(p);
  });

  function pop(pos){
    return byPos[pos]?.shift()||null;
  }

  function pp(p){
    if(!p) return '<div class="pitchPlayer"><div class="povr">—</div><b>EMPTY</b><small>—</small></div>';
    return (
      '<div class="pitchPlayer">'+
        '<div class="povr">'+p.ovr+'</div>'+
        '<b>'+esc(p.name)+'</b>'+
        '<small>'+p.pos+(p.mystery?" • M":"")+'</small>'+
      '</div>'
    );
  }

  $("pitch").innerHTML=
    '<div class="pitchRows">'+
      '<div class="pitchRow">'+pp(pop("LW"))+pp(pop("ST"))+pp(pop("RW"))+'</div>'+
      '<div class="pitchRow">'+pp(pop("CAM"))+'</div>'+
      '<div class="pitchRow">'+pp(pop("CM"))+pp(pop("CM"))+'</div>'+
      '<div class="pitchRow">'+pp(pop("LB"))+pp(pop("CB"))+pp(pop("CB"))+pp(pop("RB"))+'</div>'+
      '<div class="pitchRow">'+pp(pop("GK"))+'</div>'+
    '</div>';
}

$("rematchBtn").onclick=()=>{
  socket.emit("rematch",{code},r=>{
    if(!r?.ok) toast(r?.error||"Rematch failed");
  });
};

$("homeBtn").onclick=()=>location.reload();

})();
</script>
</body>
</html>
`;

app.get("/",(req,res)=>res.type("html").send(PAGE));

server.listen(PORT,()=>{
  console.log("BID XI V3 running on port "+PORT);
});
