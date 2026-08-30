const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";

// ============================================================
// BID XI V4 — Arabic / Turn Based Auction
// ============================================================

const FORMATION = [
  "GK",
  "LB", "CB", "CB", "RB",
  "CM", "CM", "CAM",
  "LW", "ST", "RW"
];

const PLAYER_POOL = [
  {id:1,name:"Gianluigi Donnarumma",pos:"GK",ovr:91,nation:"ITA",base:12},
  {id:2,name:"Thibaut Courtois",pos:"GK",ovr:90,nation:"BEL",base:11},
  {id:3,name:"Alisson Becker",pos:"GK",ovr:90,nation:"BRA",base:11},
  {id:4,name:"Ederson",pos:"GK",ovr:88,nation:"BRA",base:9},
  {id:5,name:"Mike Maignan",pos:"GK",ovr:88,nation:"FRA",base:9},
  {id:6,name:"Jan Oblak",pos:"GK",ovr:88,nation:"SLO",base:9},
  {id:7,name:"Emiliano Martinez",pos:"GK",ovr:88,nation:"ARG",base:9},
  {id:8,name:"David Raya",pos:"GK",ovr:87,nation:"ESP",base:8},
  {id:9,name:"Diogo Costa",pos:"GK",ovr:87,nation:"POR",base:8},
  {id:10,name:"Gregor Kobel",pos:"GK",ovr:87,nation:"SUI",base:8},
  {id:11,name:"Unai Simon",pos:"GK",ovr:86,nation:"ESP",base:7},
  {id:12,name:"Marc-Andre ter Stegen",pos:"GK",ovr:88,nation:"GER",base:9},
  {id:13,name:"Theo Hernandez",pos:"LB",ovr:89,nation:"FRA",base:12},
  {id:14,name:"Alphonso Davies",pos:"LB",ovr:88,nation:"CAN",base:11},
  {id:15,name:"Nuno Mendes",pos:"LB",ovr:88,nation:"POR",base:11},
  {id:16,name:"Alejandro Balde",pos:"LB",ovr:86,nation:"ESP",base:8},
  {id:17,name:"Federico Dimarco",pos:"LB",ovr:87,nation:"ITA",base:9},
  {id:18,name:"Destiny Udogie",pos:"LB",ovr:85,nation:"ITA",base:7},
  {id:19,name:"Milos Kerkez",pos:"LB",ovr:85,nation:"HUN",base:7},
  {id:20,name:"Pervis Estupinan",pos:"LB",ovr:84,nation:"ECU",base:6},
  {id:21,name:"Andrew Robertson",pos:"LB",ovr:86,nation:"SCO",base:8},
  {id:22,name:"Alejandro Grimaldo",pos:"LB",ovr:87,nation:"ESP",base:9},
  {id:23,name:"Riccardo Calafiori",pos:"LB",ovr:86,nation:"ITA",base:8},
  {id:24,name:"Ferland Mendy",pos:"LB",ovr:86,nation:"FRA",base:8},
  {id:25,name:"Virgil van Dijk",pos:"CB",ovr:91,nation:"NED",base:14},
  {id:26,name:"William Saliba",pos:"CB",ovr:90,nation:"FRA",base:13},
  {id:27,name:"Ruben Dias",pos:"CB",ovr:89,nation:"POR",base:12},
  {id:28,name:"Antonio Rudiger",pos:"CB",ovr:89,nation:"GER",base:12},
  {id:29,name:"Alessandro Bastoni",pos:"CB",ovr:89,nation:"ITA",base:12},
  {id:30,name:"Marquinhos",pos:"CB",ovr:87,nation:"BRA",base:9},
  {id:31,name:"Gabriel Magalhaes",pos:"CB",ovr:89,nation:"BRA",base:12},
  {id:32,name:"Ronald Araujo",pos:"CB",ovr:88,nation:"URU",base:11},
  {id:33,name:"Eder Militao",pos:"CB",ovr:88,nation:"BRA",base:11},
  {id:34,name:"Pau Cubarsi",pos:"CB",ovr:87,nation:"ESP",base:10},
  {id:35,name:"Ibrahima Konate",pos:"CB",ovr:87,nation:"FRA",base:10},
  {id:36,name:"Dayot Upamecano",pos:"CB",ovr:86,nation:"FRA",base:9},
  {id:37,name:"Jonathan Tah",pos:"CB",ovr:86,nation:"GER",base:9},
  {id:38,name:"Kim Min-jae",pos:"CB",ovr:86,nation:"KOR",base:9},
  {id:39,name:"Matthijs de Ligt",pos:"CB",ovr:86,nation:"NED",base:9},
  {id:40,name:"Cristian Romero",pos:"CB",ovr:87,nation:"ARG",base:10},
  {id:41,name:"Bremer",pos:"CB",ovr:87,nation:"BRA",base:10},
  {id:42,name:"Lisandro Martinez",pos:"CB",ovr:86,nation:"ARG",base:9},
  {id:43,name:"Levi Colwill",pos:"CB",ovr:85,nation:"ENG",base:8},
  {id:44,name:"Murillo",pos:"CB",ovr:85,nation:"BRA",base:8},
  {id:45,name:"Dean Huijsen",pos:"CB",ovr:86,nation:"ESP",base:9},
  {id:46,name:"Jarrad Branthwaite",pos:"CB",ovr:85,nation:"ENG",base:8},
  {id:47,name:"Achraf Hakimi",pos:"RB",ovr:90,nation:"MAR",base:13},
  {id:48,name:"Trent Alexander-Arnold",pos:"RB",ovr:89,nation:"ENG",base:12},
  {id:49,name:"Jules Kounde",pos:"RB",ovr:88,nation:"FRA",base:11},
  {id:50,name:"Dani Carvajal",pos:"RB",ovr:87,nation:"ESP",base:10},
  {id:51,name:"Jeremie Frimpong",pos:"RB",ovr:88,nation:"NED",base:11},
  {id:52,name:"Pedro Porro",pos:"RB",ovr:86,nation:"ESP",base:9},
  {id:53,name:"Reece James",pos:"RB",ovr:86,nation:"ENG",base:9},
  {id:54,name:"Ben White",pos:"RB",ovr:86,nation:"ENG",base:9},
  {id:55,name:"Diogo Dalot",pos:"RB",ovr:85,nation:"POR",base:8},
  {id:56,name:"Malo Gusto",pos:"RB",ovr:84,nation:"FRA",base:7},
  {id:57,name:"Tino Livramento",pos:"RB",ovr:84,nation:"ENG",base:7},
  {id:58,name:"Denzel Dumfries",pos:"RB",ovr:86,nation:"NED",base:9},
  {id:59,name:"Jude Bellingham",pos:"CM",ovr:93,nation:"ENG",base:19},
  {id:60,name:"Rodri",pos:"CM",ovr:92,nation:"ESP",base:18},
  {id:61,name:"Federico Valverde",pos:"CM",ovr:91,nation:"URU",base:16},
  {id:62,name:"Pedri",pos:"CM",ovr:91,nation:"ESP",base:16},
  {id:63,name:"Vitinha",pos:"CM",ovr:90,nation:"POR",base:15},
  {id:64,name:"Declan Rice",pos:"CM",ovr:90,nation:"ENG",base:15},
  {id:65,name:"Frenkie de Jong",pos:"CM",ovr:89,nation:"NED",base:13},
  {id:66,name:"Alexis Mac Allister",pos:"CM",ovr:89,nation:"ARG",base:13},
  {id:67,name:"Martin Odegaard",pos:"CM",ovr:90,nation:"NOR",base:15},
  {id:68,name:"Nicolo Barella",pos:"CM",ovr:89,nation:"ITA",base:13},
  {id:69,name:"Bruno Guimaraes",pos:"CM",ovr:88,nation:"BRA",base:12},
  {id:70,name:"Enzo Fernandez",pos:"CM",ovr:88,nation:"ARG",base:12},
  {id:71,name:"Eduardo Camavinga",pos:"CM",ovr:88,nation:"FRA",base:12},
  {id:72,name:"Aurelien Tchouameni",pos:"CM",ovr:88,nation:"FRA",base:12},
  {id:73,name:"Joao Neves",pos:"CM",ovr:88,nation:"POR",base:12},
  {id:74,name:"Ryan Gravenberch",pos:"CM",ovr:87,nation:"NED",base:11},
  {id:75,name:"Tijjani Reijnders",pos:"CM",ovr:87,nation:"NED",base:11},
  {id:76,name:"Joshua Kimmich",pos:"CM",ovr:89,nation:"GER",base:13},
  {id:77,name:"Kevin De Bruyne",pos:"CM",ovr:90,nation:"BEL",base:15},
  {id:78,name:"Ilkay Gundogan",pos:"CM",ovr:86,nation:"GER",base:9},
  {id:79,name:"Sandro Tonali",pos:"CM",ovr:87,nation:"ITA",base:11},
  {id:80,name:"Moises Caicedo",pos:"CM",ovr:88,nation:"ECU",base:12},
  {id:81,name:"Kobbie Mainoo",pos:"CM",ovr:85,nation:"ENG",base:9},
  {id:82,name:"Gavi",pos:"CM",ovr:88,nation:"ESP",base:12},
  {id:83,name:"Florian Wirtz",pos:"CAM",ovr:92,nation:"GER",base:18},
  {id:84,name:"Jamal Musiala",pos:"CAM",ovr:92,nation:"GER",base:18},
  {id:85,name:"Cole Palmer",pos:"CAM",ovr:91,nation:"ENG",base:17},
  {id:86,name:"Bruno Fernandes",pos:"CAM",ovr:89,nation:"POR",base:14},
  {id:87,name:"Dani Olmo",pos:"CAM",ovr:89,nation:"ESP",base:14},
  {id:88,name:"Xavi Simons",pos:"CAM",ovr:88,nation:"NED",base:13},
  {id:89,name:"Morgan Gibbs-White",pos:"CAM",ovr:86,nation:"ENG",base:10},
  {id:90,name:"James Maddison",pos:"CAM",ovr:86,nation:"ENG",base:10},
  {id:91,name:"Paulo Dybala",pos:"CAM",ovr:88,nation:"ARG",base:13},
  {id:92,name:"Christopher Nkunku",pos:"CAM",ovr:87,nation:"FRA",base:12},
  {id:93,name:"Rayan Cherki",pos:"CAM",ovr:87,nation:"FRA",base:12},
  {id:94,name:"Eberechi Eze",pos:"CAM",ovr:87,nation:"ENG",base:12},
  {id:95,name:"Vinicius Junior",pos:"LW",ovr:93,nation:"BRA",base:20},
  {id:96,name:"Khvicha Kvaratskhelia",pos:"LW",ovr:90,nation:"GEO",base:15},
  {id:97,name:"Rafael Leao",pos:"LW",ovr:89,nation:"POR",base:14},
  {id:98,name:"Luis Diaz",pos:"LW",ovr:89,nation:"COL",base:14},
  {id:99,name:"Nico Williams",pos:"LW",ovr:88,nation:"ESP",base:13},
  {id:100,name:"Bradley Barcola",pos:"LW",ovr:88,nation:"FRA",base:13},
  {id:101,name:"Cody Gakpo",pos:"LW",ovr:87,nation:"NED",base:12},
  {id:102,name:"Gabriel Martinelli",pos:"LW",ovr:87,nation:"BRA",base:12},
  {id:103,name:"Anthony Gordon",pos:"LW",ovr:86,nation:"ENG",base:11},
  {id:104,name:"Kaoru Mitoma",pos:"LW",ovr:86,nation:"JPN",base:11},
  {id:105,name:"Jack Grealish",pos:"LW",ovr:86,nation:"ENG",base:11},
  {id:106,name:"Marcus Rashford",pos:"LW",ovr:86,nation:"ENG",base:11},
  {id:107,name:"Kylian Mbappe",pos:"ST",ovr:94,nation:"FRA",base:22},
  {id:108,name:"Erling Haaland",pos:"ST",ovr:93,nation:"NOR",base:21},
  {id:109,name:"Harry Kane",pos:"ST",ovr:92,nation:"ENG",base:19},
  {id:110,name:"Lautaro Martinez",pos:"ST",ovr:91,nation:"ARG",base:18},
  {id:111,name:"Alexander Isak",pos:"ST",ovr:91,nation:"SWE",base:18},
  {id:112,name:"Victor Osimhen",pos:"ST",ovr:90,nation:"NGA",base:16},
  {id:113,name:"Julian Alvarez",pos:"ST",ovr:90,nation:"ARG",base:16},
  {id:114,name:"Robert Lewandowski",pos:"ST",ovr:90,nation:"POL",base:16},
  {id:115,name:"Viktor Gyokeres",pos:"ST",ovr:90,nation:"SWE",base:16},
  {id:116,name:"Ollie Watkins",pos:"ST",ovr:88,nation:"ENG",base:13},
  {id:117,name:"Benjamin Sesko",pos:"ST",ovr:87,nation:"SLO",base:12},
  {id:118,name:"Darwin Nunez",pos:"ST",ovr:87,nation:"URU",base:12},
  {id:119,name:"Dusan Vlahovic",pos:"ST",ovr:88,nation:"SRB",base:13},
  {id:120,name:"Marcus Thuram",pos:"ST",ovr:88,nation:"FRA",base:13},
  {id:121,name:"Serhou Guirassy",pos:"ST",ovr:88,nation:"GUI",base:13},
  {id:122,name:"Lois Openda",pos:"ST",ovr:87,nation:"BEL",base:12},
  {id:123,name:"Hugo Ekitike",pos:"ST",ovr:86,nation:"FRA",base:11},
  {id:124,name:"Santiago Gimenez",pos:"ST",ovr:86,nation:"MEX",base:11},
  {id:125,name:"Rasmus Hojlund",pos:"ST",ovr:85,nation:"DEN",base:10},
  {id:126,name:"Jonathan David",pos:"ST",ovr:87,nation:"CAN",base:12},
  {id:127,name:"Dominic Solanke",pos:"ST",ovr:86,nation:"ENG",base:11},
  {id:128,name:"Mateo Retegui",pos:"ST",ovr:87,nation:"ITA",base:12},
  {id:129,name:"Mohamed Salah",pos:"RW",ovr:93,nation:"EGY",base:21},
  {id:130,name:"Lamine Yamal",pos:"RW",ovr:93,nation:"ESP",base:21},
  {id:131,name:"Bukayo Saka",pos:"RW",ovr:91,nation:"ENG",base:18},
  {id:132,name:"Rodrygo",pos:"RW",ovr:89,nation:"BRA",base:15},
  {id:133,name:"Ousmane Dembele",pos:"RW",ovr:91,nation:"FRA",base:18},
  {id:134,name:"Michael Olise",pos:"RW",ovr:89,nation:"FRA",base:15},
  {id:135,name:"Raphinha",pos:"RW",ovr:90,nation:"BRA",base:16},
  {id:136,name:"Takefusa Kubo",pos:"RW",ovr:87,nation:"JPN",base:12},
  {id:137,name:"Johan Bakayoko",pos:"RW",ovr:86,nation:"BEL",base:11},
  {id:138,name:"Bryan Mbeumo",pos:"RW",ovr:87,nation:"CMR",base:12},
  {id:139,name:"Savinho",pos:"RW",ovr:86,nation:"BRA",base:11},
  {id:140,name:"Pedro Neto",pos:"RW",ovr:86,nation:"POR",base:11},
  {id:141,name:"Antony",pos:"RW",ovr:84,nation:"BRA",base:9},
  {id:142,name:"Noni Madueke",pos:"RW",ovr:86,nation:"ENG",base:11}
];

const MANAGERS = {
  scout:{id:"scout",name:"الكشاف",icon:"🔎",desc:"أي لاعب غامض تحصل عليه تزيد قوته +1."},
  tycoon:{id:"tycoon",name:"رجل الأعمال",icon:"💰",desc:"تبدأ المباراة بميزانية إضافية +12 مليون."},
  tactician:{id:"tactician",name:"المدرب التكتيكي",icon:"🧠",desc:"تحصل على +4 كيمياء قبل محاكاة المباراة."}
};

const FLAGS={
  BEL:"🇧🇪",BRA:"🇧🇷",ITA:"🇮🇹",FRA:"🇫🇷",CAN:"🇨🇦",POR:"🇵🇹",
  NED:"🇳🇱",GER:"🇩🇪",MAR:"🇲🇦",ENG:"🏴",ESP:"🇪🇸",URU:"🇺🇾",
  GEO:"🇬🇪",COL:"🇨🇴",NOR:"🇳🇴",ARG:"🇦🇷",SWE:"🇸🇪",EGY:"🇪🇬",
  SLO:"🇸🇮",SUI:"🇨🇭",HUN:"🇭🇺",ECU:"🇪🇨",SCO:"🏴",KOR:"🇰🇷",
  JPN:"🇯🇵",NGA:"🇳🇬",POL:"🇵🇱",SRB:"🇷🇸",GUI:"🇬🇳",MEX:"🇲🇽",
  DEN:"🇩🇰",CMR:"🇨🇲"
};

const rooms=new Map();

function clamp(v,min,max){return Math.max(min,Math.min(max,v));}

function makeCode(){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s="";
  for(let i=0;i<6;i++) s+=chars[Math.floor(Math.random()*chars.length)];
  return s;
}

function cleanDisplayName(value,fallback="Player"){
  const name=String(value||"")
    .replace(/[<>]/g,"")
    .replace(/\s+/g," ")
    .trim()
    .slice(0,18);

  return name || String(fallback||"Player").slice(0,18);
}

function publicUser(u){
  return {
    id:u.id,
    name:u.name,
    picture:u.picture || "",
    manager:u.manager,
    budget:u.budget,
    squad:u.squad
  };
}

function publicRoom(room){
  return {
    code:room.code,
    hostId:room.hostId,
    phase:room.phase,
    round:room.round,
    roundCount:FORMATION.length,
    current:room.current,
    currentBid:room.currentBid,
    highestBidder:room.highestBidder,
    turnPlayerId:room.turnPlayerId,
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

function mysteryPlayer(pos,exclude=new Set(),forbidden=new Set()){
  let pool=PLAYER_POOL.filter(p=>
    p.pos===pos &&
    !exclude.has(p.id) &&
    !forbidden.has(p.id)
  );

  if(!pool.length){
    pool=PLAYER_POOL.filter(p=>
      p.pos===pos &&
      !forbidden.has(p.id)
    );
  }

  if(!pool.length){
    pool=PLAYER_POOL.filter(p=>p.pos===pos);
  }

  const p=pool[Math.floor(Math.random()*pool.length)];
  return {...p,price:0,mystery:true};
}

function otherUser(room,userId){
  return [...room.users.values()].find(u=>u.id!==userId) || null;
}

function setTurn(room,userId){
  room.turnPlayerId=userId;
  room.seconds=10;

  if(room.turnTimer) clearInterval(room.turnTimer);

  emitRoom(room);

  room.turnTimer=setInterval(()=>{
    room.seconds--;

    if(room.seconds<=0){
      clearInterval(room.turnTimer);
      handlePass(room,userId,"timeout");
    }else{
      emitRoom(room);
    }
  },1000);
}

function startAuction(room){
  room.phase="auction";
  room.round=0;
  room.used=new Set();

  for(const u of room.users.values()){
    u.budget=180+(u.manager==="tycoon"?12:0);
    u.squad=[];
  }

  nextRound(room);
}

function nextRound(room){
  if(room.turnTimer) clearInterval(room.turnTimer);

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

  const users=[...room.users.values()];

  // Fairness: alternate who starts each round.
  const starter=users[room.round%2];
  setTurn(room,starter.id);
}

function awardCurrentPlayer(room,winner,reason){
  if(room.turnTimer) clearInterval(room.turnTimer);

  if(!winner){
    room.round++;
    room.current=null;
    room.currentBid=0;
    room.highestBidder=null;
    room.turnPlayerId=null;
    room.seconds=0;
    emitRoom(room);
    setTimeout(()=>nextRound(room),1800);
    return;
  }

  const loser=otherUser(room,winner.id);
  const auctionPlayer=room.current;
  const forbiddenForWinner=new Set([auctionPlayer.id]);

  let winnerPlayer=null;
  let winnerPaid=0;

  // الفائز يحصل على اللاعب المعروض إذا كانت ميزانيته تسمح.
  if(room.currentBid<=winner.budget){
    winnerPaid=room.currentBid;
    winner.budget-=winnerPaid;
    winnerPlayer={...auctionPlayer,price:winnerPaid,mystery:false};
  }else{
    // حالة احتياطية نادرة: لو السعر الأساسي أعلى من الميزانية المتبقية.
    const excludeWinner=new Set(
      winner.squad.map(x=>x.id).filter(x=>typeof x.id==="number")
    );

    winnerPlayer=mysteryPlayer(
      auctionPlayer.pos,
      excludeWinner,
      forbiddenForWinner
    );

    if(winner.manager==="scout"){
      winnerPlayer={...winnerPlayer,ovr:clamp(winnerPlayer.ovr+1,0,99)};
    }
  }

  winner.squad.push(winnerPlayer);
  room.used.add(winnerPlayer.id);

  // الخاسر يحصل دائمًا على لاعب عشوائي مختلف من نفس المركز مجانًا.
  let loserPlayer=null;

  if(loser){
    const excludeLoser=new Set(
      loser.squad.map(x=>x.id).filter(x=>typeof x.id==="number")
    );

    const forbiddenLoser=new Set([
      auctionPlayer.id,
      winnerPlayer.id,
      ...[...room.used]
    ]);

    loserPlayer=mysteryPlayer(
      auctionPlayer.pos,
      excludeLoser,
      forbiddenLoser
    );

    if(loser.manager==="scout"){
      loserPlayer={...loserPlayer,ovr:clamp(loserPlayer.ovr+1,0,99)};
    }

    loser.squad.push(loserPlayer);
    if(loserPlayer?.id) room.used.add(loserPlayer.id);
  }

  io.to(room.code).emit("round_result",{
    winnerId:winner.id,
    winnerName:winner.name,
    loserId:loser?.id || null,
    loserName:loser?.name || null,
    price:winnerPaid,
    reason,
    auctionPlayer,
    winnerPlayer,
    loserReward:loserPlayer ? {
      userId:loser.id,
      userName:loser.name,
      player:loserPlayer
    } : null
  });

  room.round++;
  room.current=null;
  room.currentBid=0;
  room.highestBidder=null;
  room.turnPlayerId=null;
  room.seconds=0;

  emitRoom(room);
  setTimeout(()=>nextRound(room),2300);
}

function handlePass(room,playerId,reason){
  if(room.phase!=="auction"||!room.current) return;
  if(room.turnPlayerId!==playerId) return;

  const passer=room.users.get(playerId);
  const opponent=otherUser(room,playerId);

  let winner=null;

  if(room.highestBidder){
    winner=room.users.get(room.highestBidder);
  }else{
    // No one has bid yet: if the current player passes, opponent gets the player at base price.
    winner=opponent;
  }

  io.to(room.code).emit("pass_event",{
    playerId,
    playerName:passer?.name || "لاعب",
    reason
  });

  awardCurrentPlayer(room,winner,reason);
}

function calcChemistry(user){
  let chem=0;
  const nations={};

  for(const p of user.squad){
    nations[p.nation]=(nations[p.nation]||0)+1;
  }

  for(const count of Object.values(nations)){
    if(count>=2) chem+=2;
    if(count>=3) chem+=2;
  }

  if(user.manager==="tactician") chem+=4;

  return clamp(chem,0,20);
}

function metrics(user){
  const avg=user.squad.reduce((a,p)=>a+p.ovr,0)/Math.max(1,user.squad.length);
  const chem=calcChemistry(user);

  const attack=user.squad
    .filter(p=>["LW","ST","RW","CAM"].includes(p.pos))
    .reduce((a,p)=>a+p.ovr,0);

  const midfield=user.squad
    .filter(p=>["CM","CAM"].includes(p.pos))
    .reduce((a,p)=>a+p.ovr,0);

  const defense=user.squad
    .filter(p=>["GK","LB","CB","RB"].includes(p.pos))
    .reduce((a,p)=>a+p.ovr,0);

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
    strength:avg+(chem*.28)+(Math.random()*5)
  };
}

function finishMatch(room){
  room.phase="result";
  room.current=null;
  room.turnPlayerId=null;
  room.seconds=0;

  const users=[...room.users.values()];
  if(users.length!==2){
    emitRoom(room);
    return;
  }

  const a=metrics(users[0]);
  const b=metrics(users[1]);

  function goals(team,opp){
    const delta=(team.strength-opp.strength)/7;
    return clamp(Math.round(1.1+Math.random()*2.3+delta),0,6);
  }

  let ga=goals(a,b);
  let gb=goals(b,a);

  if(ga===gb){
    if(a.strength>=b.strength) ga++;
    else gb++;
  }

  const events=[];
  let leftA=ga,leftB=gb;

  for(let i=0;i<ga+gb;i++){
    const chooseA=leftA>0&&(leftB===0||Math.random()<leftA/(leftA+leftB));
    const team=chooseA?a:b;

    const scorers=team.squad.filter(p=>["ST","LW","RW","CAM","CM"].includes(p.pos));
    const pool=scorers.length?scorers:team.squad;
    const scorer=pool[Math.floor(Math.random()*pool.length)];

    events.push({
      minute:4+Math.floor(Math.random()*87),
      type:"goal",
      teamId:team.id,
      teamName:team.name,
      player:scorer?.name || "Unknown"
    });

    if(chooseA) leftA--;
    else leftB--;
  }

  for(let i=0;i<4;i++){
    const types=[
      {type:"save",icon:"🧤"},
      {type:"yellow",icon:"🟨"},
      {type:"chance",icon:"⚡"}
    ];
    const e=types[Math.floor(Math.random()*types.length)];
    const team=Math.random()<.5?a:b;
    const p=team.squad[Math.floor(Math.random()*team.squad.length)];

    events.push({
      minute:5+Math.floor(Math.random()*84),
      type:e.type,
      icon:e.icon,
      teamId:team.id,
      teamName:team.name,
      player:p?.name || ""
    });
  }

  events.sort((x,y)=>x.minute-y.minute);

  const winner=ga>gb?a:b;
  const xgA=Math.max(.3,ga*.72+Math.random()*1.4);
  const xgB=Math.max(.3,gb*.72+Math.random()*1.4);

  const possA=clamp(Math.round(50+(a.midfield-b.midfield)/18+(Math.random()*8-4)),37,63);
  const possB=100-possA;

  const result={
    winnerId:winner.id,
    winnerName:winner.name,
    score:{[a.id]:ga,[b.id]:gb},
    teams:[a,b],
    stats:{
      possession:{[a.id]:possA,[b.id]:possB},
      shots:{
        [a.id]:Math.max(ga,Math.round(xgA*4+Math.random()*4)),
        [b.id]:Math.max(gb,Math.round(xgB*4+Math.random()*4))
      },
      xg:{[a.id]:xgA.toFixed(1),[b.id]:xgB.toFixed(1)}
    },
    events
  };

  room.result=result;

  io.to(room.code).emit("match_result",result);
  emitRoom(room);
}

// ============================================================
// SOCKET.IO
// ============================================================

io.on("connection",socket=>{

  socket.on("google_auth",async ({credential},cb)=>{
    try{
      if(!GOOGLE_CLIENT_ID){
        return cb?.({
          ok:false,
          error:"Google Login محتاج GOOGLE_CLIENT_ID في Railway Variables"
        });
      }

      if(!credential){
        return cb?.({ok:false,error:"بيانات تسجيل الدخول غير موجودة"});
      }

      // Verify Google's ID token without any extra npm package.
      const verifyUrl =
        "https://oauth2.googleapis.com/tokeninfo?id_token=" +
        encodeURIComponent(credential);

      const response = await fetch(verifyUrl);

      if(!response.ok){
        return cb?.({ok:false,error:"Google رفض بيانات تسجيل الدخول"});
      }

      const payload = await response.json();

      // The token must be issued for THIS game's Google Web Client ID.
      if(payload.aud !== GOOGLE_CLIENT_ID){
        return cb?.({ok:false,error:"Google Client ID غير مطابق للعبة"});
      }

      if(!payload.sub || !payload.name){
        return cb?.({ok:false,error:"تعذر قراءة بيانات حساب Google"});
      }

      if(payload.email_verified !== "true" && payload.email_verified !== true){
        return cb?.({ok:false,error:"حساب Google غير موثّق"});
      }

      socket.data.googleUser={
        sub:String(payload.sub),
        name:String(payload.name).slice(0,30),
        email:String(payload.email||""),
        picture:String(payload.picture||"")
      };

      cb?.({
        ok:true,
        user:{
          name:socket.data.googleUser.name,
          email:socket.data.googleUser.email,
          picture:socket.data.googleUser.picture
        }
      });

    }catch(err){
      console.error("Google auth error:",err?.message||err);
      cb?.({ok:false,error:"تعذر الاتصال بخدمة Google الآن"});
    }
  });

  socket.on("create",({displayName}={},cb)=>{
    let code;
    do{code=makeCode();}while(rooms.has(code));

    const room={
      code,
      hostId:socket.id,
      phase:"manager",
      round:0,
      current:null,
      currentBid:0,
      highestBidder:null,
      turnPlayerId:null,
      seconds:0,
      users:new Map(),
      used:new Set(),
      turnTimer:null,
      result:null
    };

    const googleUser=socket.data.googleUser;

    if(!googleUser){
      return cb?.({ok:false,error:"سجّل دخول بحساب Google الأول"});
    }

    room.users.set(socket.id,{
      id:socket.id,
      googleSub:googleUser.sub,
      name:cleanDisplayName(displayName,googleUser.name),
      picture:googleUser.picture,
      manager:null,
      budget:180,
      squad:[]
    });

    rooms.set(code,room);
    socket.join(code);

    cb?.({ok:true,code});
    emitRoom(room);
  });

  socket.on("join",({code,displayName},cb)=>{
    code=String(code||"").trim().toUpperCase();

    const room=rooms.get(code);
    const googleUser=socket.data.googleUser;

    if(!googleUser){
      return cb?.({ok:false,error:"سجّل دخول بحساب Google الأول"});
    }

    if(!room) return cb?.({ok:false,error:"الغرفة غير موجودة"});
    if(room.phase!=="manager") return cb?.({ok:false,error:"اللعبة بدأت بالفعل"});
    if(room.users.size>=2) return cb?.({ok:false,error:"الغرفة ممتلئة — لاعبان فقط"});

    if([...room.users.values()].some(u=>u.googleSub===googleUser.sub)){
      return cb?.({ok:false,error:"نفس حساب Google موجود بالفعل داخل الغرفة"});
    }

    room.users.set(socket.id,{
      id:socket.id,
      googleSub:googleUser.sub,
      name:cleanDisplayName(displayName,googleUser.name),
      picture:googleUser.picture,
      manager:null,
      budget:180,
      squad:[]
    });

    socket.join(code);

    cb?.({ok:true,code});
    emitRoom(room);
  });

  socket.on("choose_manager",({code,manager},cb)=>{
    const room=rooms.get(code);
    const user=room?.users.get(socket.id);

    if(!room||!user) return cb?.({ok:false,error:"الغرفة غير موجودة"});
    if(!MANAGERS[manager]) return cb?.({ok:false,error:"اختيار غير صالح"});

    user.manager=manager;

    emitRoom(room);
    cb?.({ok:true});
  });

  socket.on("start",({code},cb)=>{
    const room=rooms.get(code);

    if(!room) return cb?.({ok:false,error:"الغرفة غير موجودة"});
    if(room.hostId!==socket.id) return cb?.({ok:false,error:"صاحب الغرفة فقط يمكنه البدء"});
    if(room.users.size!==2) return cb?.({ok:false,error:"لازم يكون فيه لاعبين بالضبط"});

    const users=[...room.users.values()];
    if(users.some(u=>!u.manager)){
      return cb?.({ok:false,error:"كل لاعب لازم يختار مدرب"});
    }

    startAuction(room);
    cb?.({ok:true});
  });

  socket.on("bid",({code,amount},cb)=>{
    const room=rooms.get(code);

    if(!room||room.phase!=="auction"||!room.current){
      return cb?.({ok:false,error:"لا يوجد مزاد حالي"});
    }

    if(room.turnPlayerId!==socket.id){
      return cb?.({ok:false,error:"استنى دورك"});
    }

    const user=room.users.get(socket.id);
    const opponent=otherUser(room,socket.id);

    if(!user||!opponent){
      return cb?.({ok:false,error:"مشكلة في اللاعبين"});
    }

    const n=Number(amount);

    if(!Number.isFinite(n)) return cb?.({ok:false,error:"مزايدة غير صحيحة"});
    if(n<=room.currentBid) return cb?.({ok:false,error:"لازم المزايدة تكون أعلى من السعر الحالي"});
    if(n>user.budget) return cb?.({ok:false,error:"ميزانيتك لا تكفي"});

    room.currentBid=Math.round(n*10)/10;
    room.highestBidder=socket.id;

    io.to(room.code).emit("bid_event",{
      bidderId:user.id,
      bidderName:user.name,
      amount:room.currentBid
    });

    // Successful bid => immediately hand the turn to opponent with a fresh 10 seconds.
    setTurn(room,opponent.id);

    cb?.({ok:true});
  });

  socket.on("pass",({code},cb)=>{
    const room=rooms.get(code);

    if(!room||room.phase!=="auction"||!room.current){
      return cb?.({ok:false,error:"لا يوجد مزاد حالي"});
    }

    if(room.turnPlayerId!==socket.id){
      return cb?.({ok:false,error:"مش دورك"});
    }

    handlePass(room,socket.id,"manual");
    cb?.({ok:true});
  });

  socket.on("rematch",({code},cb)=>{
    const room=rooms.get(code);

    if(!room) return cb?.({ok:false,error:"الغرفة غير موجودة"});
    if(room.users.size!==2) return cb?.({ok:false,error:"لازم اللاعبان يكونوا موجودين"});

    room.phase="manager";
    room.round=0;
    room.current=null;
    room.currentBid=0;
    room.highestBidder=null;
    room.turnPlayerId=null;
    room.seconds=0;
    room.result=null;

    for(const u of room.users.values()){
      u.manager=null;
      u.budget=180;
      u.squad=[];
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
        if(room.turnTimer) clearInterval(room.turnTimer);
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
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#050908">
<title>BID XI V7 — حرب المزاد</title>

<style>
*{box-sizing:border-box}
:root{
  --bg:#050908;--panel:#0c1512;--panel2:#111f1a;--line:#20352c;
  --text:#f4fff8;--muted:#91a79c;--lime:#43f47d;--lime2:#1dbf59;
  --gold:#ffd969;--red:#ff6370;--blue:#6aa9ff;
}
html,body{margin:0;min-height:100%;background:#050908;color:var(--text);font-family:Tahoma,Arial,sans-serif}
body{
  background:
    radial-gradient(circle at 50% -5%,rgba(67,244,125,.16),transparent 27%),
    radial-gradient(circle at 100% 20%,rgba(106,169,255,.07),transparent 24%),
    linear-gradient(#050908,#040706 70%);
}
button,input{font:inherit}
button{cursor:pointer}
.app{max-width:620px;margin:auto;padding:15px 14px 44px;min-height:100vh}
.screen{display:none}.screen.active{display:block}
.hidden{display:none!important}.muted{color:var(--muted)}
.card{
  background:linear-gradient(180deg,rgba(17,31,26,.98),rgba(8,16,13,.98));
  border:1px solid var(--line);border-radius:24px
}
.brand{text-align:center;padding:32px 0 21px}
.logo{
  width:88px;height:88px;margin:auto;border-radius:27px;display:grid;place-items:center;
  font-size:46px;background:linear-gradient(150deg,#153324,#07100c);
  border:1px solid #2b4a39
}
.brand h1{font-size:47px;line-height:.87;margin:14px 0 8px;letter-spacing:-2px}
.brand h1 span{color:var(--lime)}
.brand p{margin:0;color:var(--muted)}
.homeCard{padding:18px}
.googleWrap{display:flex;justify-content:center;min-height:44px;margin:8px 0 12px}
.authState{display:none;align-items:center;gap:12px;padding:12px;border:1px solid var(--line);border-radius:16px;background:#07100d;margin-bottom:13px;text-align:right}
.authState.show{display:flex}
.authAvatar{width:46px;height:46px;border-radius:50%;object-fit:cover;border:2px solid rgba(67,244,125,.45);background:#15281f}
.authInfo{min-width:0;flex:1}
.authInfo b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.authInfo span{display:block;color:var(--muted);font-size:10px;direction:ltr;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.authActions{display:flex;gap:8px;align-items:center;margin:0 0 14px}
.authActions button{min-height:40px;font-size:11px;flex:1}
.nicknameBox{margin:4px 0 14px;padding:12px;border:1px solid var(--line);border-radius:16px;background:#09130f}
.nicknameBox input{margin:7px 0 5px}
.gameEntry{display:none}.gameEntry.show{display:block}
.googleHint{text-align:center;color:var(--muted);font-size:11px;line-height:1.5;margin-bottom:8px}
label,small{display:block;color:var(--muted);font-size:11px;font-weight:900;letter-spacing:.03em}
.help{font-size:11px;line-height:1.55;color:var(--muted);margin:5px 2px 12px}
input{
  width:100%;min-height:52px;margin:8px 0 6px;padding:0 14px;color:#fff;
  border:1px solid var(--line);border-radius:15px;background:#06100c;outline:none;font-size:16px
}
input:focus{border-color:var(--lime);box-shadow:0 0 0 3px rgba(67,244,125,.09)}
button{
  border:1px solid var(--line);background:#122019;color:#fff;border-radius:15px;
  min-height:50px;padding:10px 15px;font-weight:950
}
button:disabled{opacity:.45;cursor:not-allowed}
button:active:not(:disabled){transform:translateY(1px)}
.primary{width:100%;border:0;color:#041008;background:linear-gradient(var(--lime),var(--lime2))}
.danger{width:100%;border-color:rgba(255,99,112,.45);background:rgba(255,99,112,.09);color:#ff9ba4}
.secondary{width:100%}
.or{display:flex;gap:10px;align-items:center;color:var(--muted);font-size:11px;margin:17px 0}
.or:before,.or:after{content:"";height:1px;background:var(--line);flex:1}
.error{color:var(--red);font-size:13px;min-height:18px}
.topbar{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:16px}
.topbar h2{margin:2px 0 0}.live{color:var(--lime);font-size:12px;font-weight:950}
.roomHero{text-align:center;padding:24px;margin-bottom:14px}
.roomHero .code{font-size:43px;letter-spacing:.14em;color:var(--lime);font-weight:1000;margin:10px 0;direction:ltr}
.duel{display:grid;grid-template-columns:1fr 46px 1fr;gap:8px;align-items:center;margin-bottom:14px}
.managerMini{text-align:center;padding:14px;min-width:0}
.avatar{
  width:48px;height:48px;margin:auto;border-radius:50%;display:grid;place-items:center;
  background:#183326;color:var(--lime);font-weight:1000;font-size:20px;overflow:hidden
}
.avatar img{width:100%;height:100%;object-fit:cover;display:block}
.managerMini b{display:block;margin-top:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vs{text-align:center;color:var(--gold);font-weight:1000}
.managerPick{padding:18px}
.managerGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:11px 0 15px}
.managerChoice{min-height:145px;text-align:right;padding:12px}
.managerChoice.selected{border-color:var(--lime);background:rgba(67,244,125,.08)}
.managerChoice .icon{font-size:29px}.managerChoice b{display:block;margin:7px 0 5px;font-size:13px}
.managerChoice span{font-size:10px;color:var(--muted);line-height:1.5;display:block}
.auctionHeader{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;margin-bottom:12px}
.round{text-align:right}.roomTag{text-align:left;direction:ltr}
.turnTimer{
  width:82px;height:82px;border-radius:50%;display:grid;place-items:center;position:relative;
  background:conic-gradient(var(--lime) var(--deg,360deg),#183026 0)
}
.turnTimer:after{content:"";position:absolute;inset:7px;border-radius:50%;background:#07100d;border:1px solid var(--line)}
.turnTimer .inside{z-index:2;text-align:center}.turnTimer b{display:block;font-size:23px}.turnTimer small{font-size:8px}
.turnBanner{
  padding:12px 14px;border-radius:17px;margin-bottom:10px;text-align:center;
  border:1px solid var(--line);background:#0b1712;font-weight:900
}
.turnBanner.mine{border-color:rgba(67,244,125,.55);background:rgba(67,244,125,.07);color:#b9ffce}
.turnBanner.theirs{color:#ffdca3}
.stage{
  border:1px solid var(--line);border-radius:27px;padding:21px;overflow:hidden;position:relative;
  background:
    radial-gradient(circle at 20% 20%,rgba(67,244,125,.23),transparent 29%),
    radial-gradient(circle at 86% 12%,rgba(255,217,105,.10),transparent 24%),
    linear-gradient(145deg,#14271e,#08100d)
}
.pos{display:inline-flex;padding:7px 13px;border-radius:999px;background:var(--lime);color:#041008;font-weight:1000;font-size:12px}
.playerHero{display:grid;grid-template-columns:136px 1fr;gap:18px;align-items:center;margin-top:16px;position:relative;z-index:2}
.playerCard{
  height:178px;border-radius:24px;display:grid;place-items:center;position:relative;
  border:1px solid #385747;background:linear-gradient(160deg,#2b4f3b,#0b1711)
}
.playerVisual{width:100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:23px}
.playerPhotoSlot{width:100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:hidden;background:linear-gradient(160deg,#294f3a,#0a1510)}
.realPlayerPhoto{width:100%;height:100%;object-fit:cover;object-position:center top;display:block}
.photoFallback{width:100%;height:100%;display:grid;place-items:center;font-size:52px;font-weight:1000;color:#dfffea;background:linear-gradient(160deg,#294f3a,#0a1510)}
.pitchPhoto{width:36px;height:36px;border-radius:50%;margin:0 auto 3px;border:1px solid rgba(255,255,255,.16)}
.pitchPhoto .photoFallback{font-size:14px}
.revealPhoto{width:118px;height:118px;border-radius:20px;margin:0 auto 10px;border:1px solid var(--line)}
.playerCard .sil{font-size:76px}.ovr{
  position:absolute;top:9px;right:9px;padding:7px 8px;border-radius:12px;background:#07100d;
  border:1px solid var(--line);font-weight:1000;color:var(--gold)
}
.playerInfo h1{font-size:29px;line-height:1;margin:8px 0;direction:ltr;text-align:right}
.playerMeta{color:var(--muted);font-size:13px;font-weight:800}
.bidBox{text-align:center;padding:18px;margin-top:11px}
.priceLabel{color:var(--muted);font-size:11px;font-weight:900}
.price{font-size:52px;color:var(--lime);font-weight:1000;margin:2px 0;direction:ltr}
.highest{font-size:13px;color:var(--muted);margin-bottom:12px}
.quick{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;direction:ltr}
.quick button{min-height:44px;padding:7px}
.custom{display:grid;grid-template-columns:1fr 110px;gap:7px;margin-top:8px;direction:ltr}
.custom input{margin:0;direction:ltr}
.auctionActions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
.duelTimers{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:11px}
.playerTimer{padding:13px}.playerTimer.activeTurn{border-color:rgba(67,244,125,.6)}
.ptop{display:flex;justify-content:space-between;gap:8px;font-size:12px}
.ptop b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.money{color:var(--gold);font-weight:1000}
.pstatus{margin-top:8px;font-size:11px;color:var(--muted)}
.pitchSection{
  margin-top:24px;
  margin-bottom:44px;
  position:relative;
  clear:both;
}
.pitchSection + .pitchSection{margin-top:52px}
.pitchTitle{
  display:flex;justify-content:space-between;align-items:center;
  gap:10px;margin:0 4px 10px;min-height:24px
}
.pitch{
  padding:20px 10px;border:1px solid var(--line);border-radius:23px;
  overflow:hidden;position:relative;
  background:
    linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px),
    linear-gradient(#0d3b23,#082d1b);
  background-size:100% 25%,25% 100%,auto;
  min-height:470px
}
.pitchRows{
  display:flex;flex-direction:column;justify-content:space-between;
  gap:18px;min-height:428px;height:auto
}
.pitchRow{
  display:flex;justify-content:space-around;align-items:center;
  gap:6px;direction:ltr;min-height:72px;flex:none
}
.pitchPlayer{
  width:73px;min-height:66px;text-align:center;padding:6px 3px;border-radius:12px;
  background:rgba(5,12,8,.84);border:1px solid rgba(255,255,255,.12);
  flex:0 0 auto
}
.pitchPlayer .povr{color:var(--gold);font-weight:1000;font-size:12px}
.pitchPlayer b{display:block;font-size:8px;direction:ltr;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pitchPlayer small{font-size:7px;letter-spacing:0}
.overlay{
  position:fixed;inset:0;z-index:30;display:none;align-items:center;justify-content:center;padding:20px;
  background:rgba(2,7,5,.84);backdrop-filter:blur(9px)
}
.overlay.show{display:flex}
.reveal{width:min(430px,100%);padding:24px;text-align:center}
.revealIcon{font-size:50px}.reveal h2{margin:9px 0 6px}
.revealPlayer{margin-top:13px;padding:16px;border:1px solid var(--line);border-radius:18px;background:#07100d}
.revealPlayer .big{font-size:22px;font-weight:1000;direction:ltr}.revealPlayer .meta{font-size:12px;color:var(--muted);margin-top:5px}
.toast{
  position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:40;
  background:#102019;border:1px solid var(--line);border-radius:999px;padding:10px 15px;
  font-size:12px;font-weight:900;display:none
}
.toast.show{display:block}
.resultHero{text-align:center;padding:25px 0 17px}.cup{font-size:70px}
.resultHero h1{font-size:36px;color:var(--lime);margin:7px 0}
.scoreboard{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;padding:18px;direction:ltr}
.team{text-align:center;min-width:0}.team b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.teamScore{font-size:40px;font-weight:1000;margin-top:5px}.dash{font-size:28px;color:var(--gold)}
.statBox{padding:15px;margin-top:10px}.statRow{display:grid;grid-template-columns:1fr 90px 1fr;align-items:center;text-align:center;padding:8px 0;border-bottom:1px solid var(--line);direction:ltr}
.statRow:last-child{border-bottom:0}.statRow span:nth-child(2){font-size:10px;color:var(--muted);font-weight:900}
.timeline{padding:15px;margin-top:10px}.timeline h3{margin:0 0 8px}
.event{display:flex;gap:9px;padding:9px 0;border-bottom:1px solid var(--line);font-size:12px}.event:last-child{border-bottom:0}
.minute{color:var(--lime);font-weight:1000;min-width:36px;direction:ltr}
.actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:15px}
@media(max-width:430px){
  .brand h1{font-size:41px}.managerGrid{grid-template-columns:1fr}.managerChoice{min-height:auto}
  .playerHero{grid-template-columns:106px 1fr;gap:12px}.playerCard{height:152px}.playerCard .sil{font-size:58px}
  .playerInfo h1{font-size:23px}.quick{grid-template-columns:repeat(2,1fr)}
  .roomHero .code{font-size:34px}.pitchPlayer{width:64px}.duelTimers{grid-template-columns:1fr}
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
    <p>حرب المزاد — ابنِ تشكيلتك واسحق خصمك</p><small style="margin-top:9px">أكثر من 142 لاعب داخل قاعدة اللعبة</small>
  </div>

  <div class="card homeCard">
    <small>تسجيل الدخول</small>
    <div class="googleHint">اضغط زر Google وسيظهر لك اختيار حسابات Google المسجّل دخولها في المتصفح. اختار الحساب فقط؛ اللعبة لا تطلب منك كتابة الإيميل يدويًا.</div>

    <div id="googleButton" class="googleWrap"></div>
    <div class="help" style="text-align:center">لو عندك أكتر من حساب Google مسجّل في المتصفح، Google هيعرضهم لك للاختيار. مش مطلوب تكتب الإيميل داخل اللعبة.</div>

    <div id="authState" class="authState">
      <img id="authAvatar" class="authAvatar" alt="">
      <div class="authInfo">
        <b id="authName">—</b>
        <span id="authEmail">—</span>
      </div>
    </div>

    <div id="gameEntry" class="gameEntry">
      <div class="authActions">
        <button id="changeGoogleBtn" type="button">تغيير حساب Google</button>
      </div>

      <div class="nicknameBox">
        <label>اسمك داخل اللعبة</label>
        <input id="displayName" maxlength="18" placeholder="اسم اللاعب">
        <div class="help">هنحط اسم حساب Google تلقائيًا، لكن تقدر تغيره لأي اسم تحبه قبل دخول اللعبة.</div>
      </div>

      <button id="createBtn" class="primary">إنشاء غرفة خاصة</button>
      <div class="help">مش محتاج تكتب إيميل أو باسورد داخل اللعبة. Google هو اللي بيختار الحساب.</div>

      <div class="or">أو</div>

      <label>كود الغرفة</label>
      <input id="joinCode" maxlength="6" placeholder="ABC123">
      <div class="help">صاحبك يسجل بحسابه من Google، وبعدها يكتب كود الغرفة فقط.</div>

      <button id="joinBtn" class="secondary">دخول الغرفة</button>
    </div>

    <p id="homeError" class="error"></p>
  </div>
</section>

<section id="manager" class="screen">
  <div class="topbar">
    <div>
      <small>الغرفة الخاصة</small>
      <h2 id="managerCode">------</h2>
    </div>
    <div class="live">● مباشر</div>
  </div>

  <div class="card roomHero">
    <small>ابعت الكود لصاحبك</small>
    <div id="bigCode" class="code">------</div>
    <p>لاعبان فقط • تشكيل 11 لاعب • ميزانية 180 مليون</p>
  </div>

  <div class="duel">
    <div id="leftManager" class="card managerMini"></div>
    <div class="vs">VS</div>
    <div id="rightManager" class="card managerMini"></div>
  </div>

  <div class="card managerPick">
    <small>اختار مدير فريقك</small>
    <div class="help">كل مدير له ميزة مختلفة تؤثر على بناء فريقك أو نتيجة المباراة.</div>

    <div class="managerGrid">
      <button class="managerChoice" data-manager="scout">
        <div class="icon">🔎</div>
        <b>الكشاف</b>
        <span>أي لاعب غامض تحصل عليه تزيد قوته +1 OVR.</span>
      </button>

      <button class="managerChoice" data-manager="tycoon">
        <div class="icon">💰</div>
        <b>رجل الأعمال</b>
        <span>تبدأ بميزانية 192 مليون بدل 180 مليون.</span>
      </button>

      <button class="managerChoice" data-manager="tactician">
        <div class="icon">🧠</div>
        <b>المدرب التكتيكي</b>
        <span>يضيف +4 كيمياء لفريقك قبل محاكاة المباراة.</span>
      </button>
    </div>

    <button id="startBtn" class="primary hidden">ابدأ حرب المزاد</button>
    <div class="help">صاحب الغرفة فقط يقدر يبدأ بعد دخول اللاعب الثاني واختيار كل واحد لمدربه.</div>

    <p id="managerMessage" class="muted" style="text-align:center"></p>
  </div>
</section>

<section id="auction" class="screen">

  <div class="auctionHeader">
    <div class="round">
      <small>الجولة</small>
      <b><span id="roundNo">1</span>/11</b>
    </div>

    <div id="turnTimer" class="turnTimer">
      <div class="inside">
        <b id="timer">10</b>
        <small>ثواني</small>
      </div>
    </div>

    <div class="roomTag">
      <small>ROOM</small>
      <b id="auctionCode">------</b>
    </div>
  </div>

  <div id="turnBanner" class="turnBanner">...</div>

  <div class="stage">
    <span id="position" class="pos">ST</span>

    <div class="playerHero">
      <div class="playerCard">
        <div id="ovr" class="ovr">90</div>
        <div id="playerVisual" class="playerVisual"></div>
      </div>

      <div class="playerInfo">
        <small>اللاعب المعروض الآن</small>
        <h1 id="playerName">Player</h1>
        <div id="playerMeta" class="playerMeta">🇫🇷 FRA • ST</div>
      </div>
    </div>
  </div>

  <div class="card bidBox">
    <div class="priceLabel">السعر الحالي</div>
    <div class="price">€<span id="bid">0</span>M</div>
    <div class="highest">صاحب أعلى مزايدة: <b id="highest">—</b></div>

    <div class="quick">
      <button data-add="1">+1M</button>
      <button data-add="2">+2M</button>
      <button data-add="5">+5M</button>
      <button data-add="10">+10M</button>
    </div>
    <div class="help">اختار قيمة زيادة سريعة. أول ما تزايد، دورك ينتهي فورًا ويبدأ عداد خصمك من 10 ثواني.</div>

    <div class="custom">
      <input id="customBid" type="number" min="0" placeholder="مزايدة مخصصة">
      <button id="customBidBtn" class="primary">زايد</button>
    </div>
    <div class="help">تقدر تكتب السعر النهائي اللي عايز توصل له بدل أزرار الزيادة السريعة.</div>

    <div class="auctionActions">
      <button id="passBtn" class="danger">اترك اللاعب</button>
      <button id="statusBtn" disabled>الدور بيتغير تلقائيًا</button>
    </div>
    <div class="help"><b>اترك اللاعب:</b> لو ضغطت عليه أو عداد الـ10 ثواني خلص، اللاعب المعروض يروح لخصمك بالسعر الحالي، وأنت تحصل على لاعب عشوائي مختلف من نفس المركز مجانًا. كذلك لو أنت كسبت المزاد، خصمك يحصل على لاعب عشوائي مختلف.</div>

    <p id="bidError" class="error"></p>
  </div>

  <div id="duelTimers" class="duelTimers"></div>

  <div id="pitches"></div>

</section>

<section id="result" class="screen">

  <div class="resultHero">
    <div class="cup">🏆</div>
    <small>انتهت المباراة</small>
    <h1 id="winnerName">الفائز</h1>
    <p class="muted">النتيجة محسوبة من قوة التشكيلة والكيمياء مع عنصر عشوائي بسيط.</p>
  </div>

  <div id="scoreboard" class="card scoreboard"></div>
  <div id="statBox" class="card statBox"></div>

  <div class="card timeline">
    <h3>أحداث المباراة</h3>
    <div id="timeline"></div>
  </div>

  <div id="resultPitches"></div>

  <div class="actions">
    <button id="rematchBtn" class="primary">إعادة المباراة</button>
    <button id="homeBtn">الصفحة الرئيسية</button>
  </div>

</section>

<div style="text-align:center;margin-top:18px;color:var(--muted);font-size:9px;line-height:1.5">صور اللاعبين تُحمّل تلقائيًا من Wikipedia/Wikimedia عند توفر صورة، ويظهر بديل تلقائي لو تعذر التحميل.</div>

</main>

<div id="roundOverlay" class="overlay">
  <div class="card reveal">
    <div id="revealIcon" class="revealIcon">✅</div>
    <small id="revealEyebrow">نتيجة الجولة</small>
    <h2 id="revealTitle">تم حسم اللاعب</h2>
    <p id="revealText" class="muted"></p>
    <div id="revealPlayer" class="revealPlayer"></div>
  </div>
</div>

<script src="https://accounts.google.com/gsi/client?hl=ar" async defer></script>
<script src="/socket.io/socket.io.js"></script>

<script>
(()=>{
const socket=io();

const MANAGERS={
  scout:{name:"الكشاف",icon:"🔎"},
  tycoon:{name:"رجل الأعمال",icon:"💰"},
  tactician:{name:"المدرب التكتيكي",icon:"🧠"}
};

const FLAGS={
  BEL:"🇧🇪",BRA:"🇧🇷",ITA:"🇮🇹",FRA:"🇫🇷",CAN:"🇨🇦",POR:"🇵🇹",
  NED:"🇳🇱",GER:"🇩🇪",MAR:"🇲🇦",ENG:"🏴",ESP:"🇪🇸",URU:"🇺🇾",
  GEO:"🇬🇪",COL:"🇨🇴",NOR:"🇳🇴",ARG:"🇦🇷",SWE:"🇸🇪",EGY:"🇪🇬",
  SLO:"🇸🇮",SUI:"🇨🇭",HUN:"🇭🇺",ECU:"🇪🇨",SCO:"🏴",KOR:"🇰🇷",
  JPN:"🇯🇵",NGA:"🇳🇬",POL:"🇵🇱",SRB:"🇷🇸",GUI:"🇬🇳",MEX:"🇲🇽",
  DEN:"🇩🇰",CMR:"🇨🇲"
};

const WIKI_TITLES={
  "Alisson":"Alisson Becker",
  "Ederson":"Ederson (footballer, born 1993)",
  "Donnarumma":"Gianluigi Donnarumma",
  "Theo Hernandez":"Theo Hernández",
  "Nuno Mendes":"Nuno Mendes (footballer)",
  "Antonio Rudiger":"Antonio Rüdiger",
  "Ruben Dias":"Rúben Dias",
  "Bastoni":"Alessandro Bastoni",
  "Marquinhos":"Marquinhos",
  "Jules Kounde":"Jules Koundé",
  "Rodri":"Rodri (footballer, born 1996)",
  "Vitinha":"Vitinha (footballer, born February 2000)",
  "Florian Wirtz":"Florian Wirtz",
  "Vinicius Junior":"Vinícius Júnior",
  "Khvicha Kvaratskhelia":"Khvicha Kvaratskhelia",
  "Rafael Leao":"Rafael Leão",
  "Luis Diaz":"Luis Díaz (footballer, born 1997)",
  "Kylian Mbappe":"Kylian Mbappé",
  "Lautaro Martinez":"Lautaro Martínez"
};

const imageCache=new Map();

function wikiTitleFor(name){
  return WIKI_TITLES[name] || name;
}

function playerPhotoHtml(player,extraClass=""){
  if(!player) return "";

  const initial=esc((player.name||"?").charAt(0).toUpperCase());

  return (
    '<div class="playerPhotoSlot '+extraClass+'" data-player-photo="'+esc(player.name)+'">'+
      '<div class="photoFallback">'+initial+'</div>'+
    '</div>'
  );
}

async function getPlayerImage(name){
  if(imageCache.has(name)){
    return imageCache.get(name);
  }

  const title=wikiTitleFor(name);

  const directUrl=
    "https://en.wikipedia.org/w/api.php"+
    "?action=query"+
    "&format=json"+
    "&origin=*"+
    "&prop=pageimages"+
    "&piprop=thumbnail"+
    "&pithumbsize=500"+
    "&titles="+encodeURIComponent(title);

  const searchUrl=
    "https://en.wikipedia.org/w/api.php"+
    "?action=query"+
    "&format=json"+
    "&origin=*"+
    "&generator=search"+
    "&gsrsearch="+encodeURIComponent(name+" footballer")+
    "&gsrlimit=1"+
    "&prop=pageimages"+
    "&piprop=thumbnail"+
    "&pithumbsize=500";

  const promise=fetch(directUrl)
    .then(r=>r.ok?r.json():null)
    .then(data=>{
      const pages=data?.query?.pages;
      if(!pages) return null;
      const page=Object.values(pages)[0];
      return page?.thumbnail?.source || null;
    })
    .then(url=>{
      if(url) return url;

      return fetch(searchUrl)
        .then(r=>r.ok?r.json():null)
        .then(data=>{
          const pages=data?.query?.pages;
          if(!pages) return null;
          const page=Object.values(pages)[0];
          return page?.thumbnail?.source || null;
        });
    })
    .catch(()=>null);

  imageCache.set(name,promise);
  return promise;
}

function hydratePlayerImages(root=document){
  const slots=[...root.querySelectorAll("[data-player-photo]")];

  for(const slot of slots){
    if(slot.dataset.loading==="1" || slot.dataset.loaded==="1") continue;

    slot.dataset.loading="1";
    const name=slot.dataset.playerPhoto;

    getPlayerImage(name).then(url=>{
      if(!slot.isConnected) return;

      if(!url){
        slot.dataset.loading="0";
        return;
      }

      const img=document.createElement("img");
      img.className="realPlayerPhoto";
      img.alt=name;
      img.src=url;

      img.onload=()=>{
        if(!slot.isConnected) return;
        slot.innerHTML="";
        slot.appendChild(img);
        slot.dataset.loaded="1";
      };

      img.onerror=()=>{
        slot.dataset.loading="0";
      };
    });
  }
}

const GOOGLE_CLIENT_ID="__GOOGLE_CLIENT_ID__";

let myId=null;
let code=null;
let state=null;
let match=null;
let googleUser=null;
let googleCredential="";

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

function initials(name){
  return String(name||"?").trim().slice(0,1).toUpperCase();
}

function toast(text){
  const t=$("toast");
  t.textContent=text;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer=setTimeout(()=>t.classList.remove("show"),1800);
}

function renderSignedInUser(user){
  googleUser=user;
  $("authName").textContent=user.name||"Google User";
  $("authEmail").textContent=user.email||"";
  $("authAvatar").src=user.picture||"";
  $("authAvatar").style.display=user.picture?"block":"none";
  $("displayName").value=user.name||"";
  $("authState").classList.add("show");
  $("gameEntry").classList.add("show");
  $("googleButton").style.display="none";
  $("homeError").textContent="";
}

function authWithServer(credential){
  if(!credential) return;

  socket.emit("google_auth",{credential},r=>{
    if(!r?.ok){
          googleCredential="";
      googleUser=null;
      $("authState").classList.remove("show");
      $("gameEntry").classList.remove("show");
      $("googleButton").style.display="flex";
      $("homeError").textContent=r?.error||"تعذر تسجيل الدخول";
      renderGoogleButton();
      return;
    }

    googleCredential=credential;
    renderSignedInUser(r.user);
  });
}

window.handleGoogleCredential=function(response){
  if(!response?.credential){
    $("homeError").textContent="لم يتم استلام بيانات حساب Google";
    return;
  }

  authWithServer(response.credential);
};

function renderGoogleButton(){
  if(!GOOGLE_CLIENT_ID){
    $("homeError").textContent="لازم تضيف GOOGLE_CLIENT_ID في Railway Variables";
    return;
  }

  if(!window.google?.accounts?.id){
    setTimeout(renderGoogleButton,250);
    return;
  }

  const box=$("googleButton");
  if(box.dataset.rendered==="1") return;

  google.accounts.id.initialize({
    client_id:GOOGLE_CLIENT_ID,
    callback:window.handleGoogleCredential,
    auto_select:false,
    cancel_on_tap_outside:true
  });

  google.accounts.id.renderButton(box,{
    type:"standard",
    theme:"filled_black",
    size:"large",
    text:"signin_with",
    shape:"pill",
    logo_alignment:"left",
    width:320,
    locale:"ar"
  });

  box.dataset.rendered="1";
}

window.onGoogleLibraryLoad=()=>{
  renderGoogleButton();
};

socket.on("connect",()=>{
  myId=socket.id;

  if(googleCredential && googleUser){
    authWithServer(googleCredential);
  }else{
    renderGoogleButton();
  }
});

$("changeGoogleBtn").onclick=()=>{
  googleUser=null;
  googleCredential="";

  $("authState").classList.remove("show");
  $("gameEntry").classList.remove("show");
  $("googleButton").style.display="flex";
  $("googleButton").innerHTML="";
  $("googleButton").dataset.rendered="0";
  $("homeError").textContent="اختار حساب Google من القائمة.";

  try{
    google.accounts.id.disableAutoSelect();
  }catch(e){}

  renderGoogleButton();
};

$("createBtn").onclick=()=>{
  if(!googleUser){
    return $("homeError").textContent="سجّل دخول بحساب Google الأول";
  }

  const displayName=$("displayName").value.trim();

  socket.emit("create",{displayName},r=>{
    if(!r?.ok){
      return $("homeError").textContent=r?.error||"تعذر إنشاء الغرفة";
    }

    code=r.code;
    $("homeError").textContent="";
    show("manager");
  });
};

$("joinBtn").onclick=()=>{
  if(!googleUser){
    return $("homeError").textContent="سجّل دخول بحساب Google الأول";
  }

  const room=$("joinCode").value.trim().toUpperCase();

  if(room.length!==6){
    return $("homeError").textContent="اكتب كود الغرفة المكون من 6 خانات";
  }

  const displayName=$("displayName").value.trim();

  socket.emit("join",{code:room,displayName},r=>{
    if(!r?.ok){
      return $("homeError").textContent=r?.error||"تعذر دخول الغرفة";
    }

    code=r.code;
    $("homeError").textContent="";
    show("manager");
  });
};

document.querySelectorAll("[data-manager]").forEach(btn=>{
  btn.onclick=()=>{
    socket.emit("choose_manager",{code,manager:btn.dataset.manager},r=>{
      if(!r?.ok) return toast(r?.error||"تعذر اختيار المدرب");
      toast("تم اختيار المدرب");
    });
  };
});

$("startBtn").onclick=()=>{
  socket.emit("start",{code},r=>{
    if(!r?.ok){
      $("managerMessage").textContent=r?.error||"تعذر بدء اللعبة";
    }
  });
};

function placeBid(amount){
  if(!Number.isFinite(amount)||amount<=0){
    return $("bidError").textContent="اكتب مزايدة صحيحة";
  }

  socket.emit("bid",{code,amount},r=>{
    $("bidError").textContent=r?.ok?"":(r?.error||"فشلت المزايدة");

    if(r?.ok){
      $("customBid").value="";
    }
  });
}

document.querySelectorAll("[data-add]").forEach(btn=>{
  btn.onclick=()=>{
    if(!state) return;
    placeBid(Number(state.currentBid)+Number(btn.dataset.add));
  };
});

$("customBidBtn").onclick=()=>{
  placeBid(Number($("customBid").value));
};

$("passBtn").onclick=()=>{
  socket.emit("pass",{code},r=>{
    if(!r?.ok){
      $("bidError").textContent=r?.error||"تعذر ترك اللاعب";
    }
  });
};

$("rematchBtn").onclick=()=>{
  socket.emit("rematch",{code},r=>{
    if(!r?.ok) toast(r?.error||"تعذرت إعادة المباراة");
  });
};

$("homeBtn").onclick=()=>location.reload();

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

socket.on("bid_event",e=>{
  toast(e.bidderName+" زايد إلى €"+fmt(e.amount)+"M");
});

socket.on("pass_event",e=>{
  if(e.reason==="timeout"){
    toast("انتهى وقت "+e.playerName);
  }else{
    toast(e.playerName+" ترك اللاعب");
  }
});

socket.on("round_result",r=>{
  showRoundResult(r);
});

socket.on("match_result",r=>{
  match=r;
  show("result");
  renderResult(r);
});

function managerBox(player,hostId){
  if(!player){
    return '<div class="avatar">?</div><b>في انتظار اللاعب...</b><small>ابعت له كود الغرفة</small>';
  }

  const m=player.manager?MANAGERS[player.manager]:null;

  const avatar=player.picture
    ? '<div class="avatar"><img src="'+esc(player.picture)+'" alt=""></div>'
    : '<div class="avatar">'+esc(initials(player.name))+'</div>';

  return (
    avatar+
    '<b>'+esc(player.name)+'</b>'+
    '<small>'+(player.id===hostId?"صاحب الغرفة":"المنافس")+(m?" • "+m.icon+" "+m.name:"")+'</small>'
  );
}

function renderManager(s){
  $("managerCode").textContent=s.code;
  $("bigCode").textContent=s.code;

  $("leftManager").innerHTML=managerBox(s.players[0],s.hostId);
  $("rightManager").innerHTML=managerBox(s.players[1],s.hostId);

  const me=s.players.find(p=>p.id===myId);

  document.querySelectorAll(".managerChoice").forEach(x=>{
    x.classList.toggle("selected",x.dataset.manager===me?.manager);
  });

  const host=s.hostId===myId;
  $("startBtn").classList.toggle("hidden",!host);

  const allReady=s.players.length===2&&s.players.every(p=>p.manager);

  $("managerMessage").textContent=
    host
      ? (allReady?"جاهزين 🔥 اضغط ابدأ حرب المزاد":"في انتظار دخول صاحبك واختيار المدربين...")
      : "في انتظار صاحب الغرفة يبدأ...";
}

function renderAuction(s){
  $("roundNo").textContent=Math.min(s.round+1,11);
  $("auctionCode").textContent=s.code;
  $("timer").textContent=s.seconds;
  $("turnTimer").style.setProperty("--deg",(Math.max(0,Math.min(10,s.seconds))/10*360)+"deg");

  if(s.current){
    $("position").textContent=s.current.pos;
    $("ovr").textContent=s.current.ovr;
    $("playerName").textContent=s.current.name;
    $("playerMeta").textContent=(FLAGS[s.current.nation]||"🌍")+" "+s.current.nation+" • "+s.current.pos;
    $("playerVisual").innerHTML=playerPhotoHtml(s.current);
    hydratePlayerImages($("playerVisual"));
  }

  $("bid").textContent=fmt(s.currentBid);

  const highest=s.players.find(p=>p.id===s.highestBidder);
  $("highest").textContent=highest?highest.name:"لا يوجد";

  const turnPlayer=s.players.find(p=>p.id===s.turnPlayerId);
  const mine=s.turnPlayerId===myId;

  $("turnBanner").className="turnBanner "+(mine?"mine":"theirs");
  $("turnBanner").textContent=
    mine
      ? "🔥 دورك الآن — عندك 10 ثواني: زايد أو اترك اللاعب"
      : "⏳ دور "+(turnPlayer?.name||"خصمك")+" — انتظر قراره";

  document.querySelectorAll("[data-add]").forEach(btn=>btn.disabled=!mine);
  $("customBid").disabled=!mine;
  $("customBidBtn").disabled=!mine;
  $("passBtn").disabled=!mine;

  $("duelTimers").innerHTML=s.players.map(p=>{
    const active=p.id===s.turnPlayerId;
    return (
      '<div class="card playerTimer '+(active?"activeTurn":"")+'">'+
        '<div class="ptop">'+
          '<b>'+esc(p.name)+(p.id===myId?" • أنت":"")+'</b>'+
          '<span class="money">€'+fmt(p.budget)+'M</span>'+
        '</div>'+
        '<div class="pstatus">'+
          (active
            ? '⏱️ دوره الآن: '+s.seconds+' ثواني'
            : '⌛ منتظر دوره')+
          ' • التشكيلة '+p.squad.length+'/11'+
        '</div>'+
      '</div>'
    );
  }).join("");

  renderLivePitches(s.players);
}

function showRoundResult(r){
  const iWon=r.winnerId===myId;
  const iLost=r.loserId===myId;

  let myPlayer=null;

  $("revealEyebrow").textContent="نتيجة الجولة";

  if(iWon){
    myPlayer=r.winnerPlayer;
    $("revealIcon").textContent="✅";
    $("revealTitle").textContent="اللاعب المعروض دخل تشكيلتك";
    $("revealText").textContent=
      r.price>0
        ? "كسبت "+r.auctionPlayer.name+" مقابل €"+fmt(r.price)+"M. خصمك حصل على لاعب عشوائي مختلف."
        : "حصلت على لاعب بديل مجاني بسبب الميزانية.";
  }else if(iLost && r.loserReward){
    myPlayer=r.loserReward.player;
    $("revealIcon").textContent="🎲";
    $("revealTitle").textContent="وصلك لاعب عشوائي مختلف";
    $("revealText").textContent=
      r.winnerName+" كسب "+r.auctionPlayer.name+
      "، وأنت حصلت مجانًا على لاعب مختلف من نفس المركز.";
  }else{
    return;
  }

  $("revealPlayer").innerHTML=
    playerPhotoHtml(myPlayer,"revealPhoto")+
    '<div class="big">'+esc(myPlayer.name)+'</div>'+
    '<div class="meta">'+myPlayer.ovr+' OVR • '+myPlayer.pos+(myPlayer.mystery?" • لاعب عشوائي":"")+'</div>';

  hydratePlayerImages($("revealPlayer"));

  $("roundOverlay").classList.add("show");
  setTimeout(()=>$("roundOverlay").classList.remove("show"),2500);
}

function playerCardHtml(p){
  if(!p){
    return '<div class="pitchPlayer"><div class="pitchPhoto playerPhotoSlot"><div class="photoFallback">?</div></div><div class="povr">—</div><b>EMPTY</b><small>—</small></div>';
  }

  return (
    '<div class="pitchPlayer">'+
      playerPhotoHtml(p,"pitchPhoto")+
      '<div class="povr">'+p.ovr+'</div>'+
      '<b>'+esc(p.name)+'</b>'+
      '<small>'+p.pos+(p.mystery?" • 🎲":"")+'</small>'+
    '</div>'
  );
}

function pitchHtml(user,title){
  const by={};

  for(const p of user.squad){
    if(!by[p.pos]) by[p.pos]=[];
    by[p.pos].push(p);
  }

  const take=pos=>by[pos]?.shift()||null;

  return (
    '<div class="pitchSection">'+
      '<div class="pitchTitle"><b>'+esc(title)+'</b><span class="muted">'+esc(user.name)+' • €'+fmt(user.budget)+'M</span></div>'+
      '<div class="pitch">'+
        '<div class="pitchRows">'+
          '<div class="pitchRow">'+playerCardHtml(take("LW"))+playerCardHtml(take("ST"))+playerCardHtml(take("RW"))+'</div>'+
          '<div class="pitchRow">'+playerCardHtml(take("CAM"))+'</div>'+
          '<div class="pitchRow">'+playerCardHtml(take("CM"))+playerCardHtml(take("CM"))+'</div>'+
          '<div class="pitchRow">'+playerCardHtml(take("LB"))+playerCardHtml(take("CB"))+playerCardHtml(take("CB"))+playerCardHtml(take("RB"))+'</div>'+
          '<div class="pitchRow">'+playerCardHtml(take("GK"))+'</div>'+
        '</div>'+
      '</div>'+
    '</div>'
  );
}

function renderLivePitches(players){
  const me=players.find(p=>p.id===myId);
  const opp=players.find(p=>p.id!==myId);

  $("pitches").innerHTML=
    (me?pitchHtml(me,"🏟️ ملعبي"):"")+
    (opp?pitchHtml(opp,"🏟️ ملعب الخصم"):"");

  hydratePlayerImages($("pitches"));
}

function statRow(label,a,b){
  return '<div class="statRow"><b>'+a+'</b><span>'+label+'</span><b>'+b+'</b></div>';
}

function renderResult(r){
  $("winnerName").textContent=r.winnerName;

  const a=r.teams[0];
  const b=r.teams[1];

  const ga=r.score[a.id]??0;
  const gb=r.score[b.id]??0;

  $("scoreboard").innerHTML=
    '<div class="team"><b>'+esc(a.name)+'</b><small>AVG '+a.avg+' • CHEM '+a.chem+'</small><div class="teamScore">'+ga+'</div></div>'+
    '<div class="dash">—</div>'+
    '<div class="team"><b>'+esc(b.name)+'</b><small>AVG '+b.avg+' • CHEM '+b.chem+'</small><div class="teamScore">'+gb+'</div></div>';

  $("statBox").innerHTML=
    statRow("الاستحواذ",r.stats.possession[a.id]+"%",r.stats.possession[b.id]+"%")+
    statRow("التسديدات",r.stats.shots[a.id],r.stats.shots[b.id])+
    statRow("xG",r.stats.xg[a.id],r.stats.xg[b.id])+
    statRow("متوسط الفريق",a.avg,b.avg)+
    statRow("الكيمياء",a.chem,b.chem);

  $("timeline").innerHTML=r.events.map(e=>{
    const icon=e.type==="goal"?"⚽":(e.icon||"•");

    const type=
      e.type==="goal"?"هدف":
      e.type==="save"?"تصدي":
      e.type==="yellow"?"بطاقة صفراء":
      "فرصة خطيرة";

    return (
      '<div class="event">'+
        '<div class="minute">'+e.minute+"'</div>"+
        '<div><b>'+icon+" "+esc(e.player)+'</b><br><span class="muted">'+esc(e.teamName)+" • "+type+'</span></div>'+
      '</div>'
    );
  }).join("");

  const me=r.teams.find(t=>t.id===myId);
  const opp=r.teams.find(t=>t.id!==myId);

  $("resultPitches").innerHTML=
    (me?pitchHtml({...me,budget:0},"🏟️ تشكيلتي النهائية"):"")+
    (opp?pitchHtml({...opp,budget:0},"🏟️ تشكيلة الخصم"):"");

  hydratePlayerImages($("resultPitches"));
}

})();
</script>
</body>
</html>
`;

app.get("/",(req,res)=>res.type("html").send(PAGE.replace("__GOOGLE_CLIENT_ID__",GOOGLE_CLIENT_ID)));

server.listen(PORT,()=>{
  console.log("BID XI V7 Mega Pool running on port "+PORT);
  if(!GOOGLE_CLIENT_ID){
    console.log("WARNING: GOOGLE_CLIENT_ID is not set. App will run, but Google Login stays disabled.");
  }
});
