const http = require("http");
const { WebSocketServer, WebSocket } = require("ws");
const ODDS_API_KEY = process.env.THE_ODDS_API_KEY || "";
const ODDS_BASE = "https://api.the-odds-api.com/v4/sports/";
const ALLOWED_SPORTS = {
  nfl: ["americanfootball_nfl"],
  nba: ["basketball_nba"],
  ncaaf: ["americanfootball_ncaaf"],
  ncaab: ["basketball_ncaab"],
  soccer: ["soccer_epl","soccer_uefa_champs_league","soccer_usa_mls","soccer_spain_la_liga","soccer_germany_bundesliga","soccer_italy_serie_a","soccer_france_ligue_one"],
  ufc: ["mma_mixed_martial_arts"],
  mlb: ["baseball_mlb"]
};
const oddsCache = new Map();
const oddsRate = new Map();
const sendJson = (res,status,data) => { res.writeHead(status,{"content-type":"application/json; charset=utf-8","access-control-allow-origin":"*","cache-control":"no-store"}); res.end(JSON.stringify(data)); };
const server = http.createServer(async (req,res) => {
  const url = new URL(req.url, "http://localhost");
  if (req.method === "OPTIONS") { res.writeHead(204,{"access-control-allow-origin":"*","access-control-allow-methods":"GET,OPTIONS","access-control-allow-headers":"content-type"}); return res.end(); }
  if (url.pathname === "/health") { return sendJson(res,200,{ok:true,service:"house-money-table-chat",oddsConfigured:!!ODDS_API_KEY}); }
  if (url.pathname === "/api/odds") {
    const sport = (url.searchParams.get("sport") || "all").toLowerCase();
    if (!["all",...Object.keys(ALLOWED_SPORTS)].includes(sport)) return sendJson(res,400,{error:"Unsupported sport filter."});
    if (!ODDS_API_KEY) return sendJson(res,503,{error:"Sports odds provider is not configured yet.",code:"ODDS_KEY_MISSING",sports:Object.keys(ALLOWED_SPORTS)});
    const now = Date.now(), cacheKey = sport;
    const cached = oddsCache.get(cacheKey);
    if (cached && now-cached.at<30000) return sendJson(res,200,{...cached.data,cached:true});
    const last = oddsRate.get(cacheKey)||0;
    if (now-last<5000) return sendJson(res,429,{error:"Please wait a few seconds before refreshing odds."});
    oddsRate.set(cacheKey,now);
    const keys = sport==="all" ? Object.values(ALLOWED_SPORTS).flat() : ALLOWED_SPORTS[sport];
    const results = await Promise.all(keys.map(async key => {
      try {
        const apiUrl = new URL(ODDS_BASE+encodeURIComponent(key)+"/odds");
        apiUrl.searchParams.set("apiKey",ODDS_API_KEY);
        apiUrl.searchParams.set("regions","us");
        apiUrl.searchParams.set("markets","h2h,spreads,totals");
        apiUrl.searchParams.set("oddsFormat","american");
        apiUrl.searchParams.set("dateFormat","iso");
        const response = await fetch(apiUrl,{headers:{"accept":"application/json"},signal:AbortSignal.timeout(10000)});
        if (!response.ok) return {sportKey:key,error:response.status===401||response.status===403?"Provider key invalid or plan does not include this sport.":"Provider returned HTTP "+response.status};
        return {sportKey:key,events:await response.json()};
      } catch (error) { return {sportKey:key,error:"Could not retrieve this feed right now."}; }
    }));
    const events = results.flatMap(r=>(r.events||[]).map(e=>({...e,sport_key:r.sportKey})));
    const errors = results.filter(r=>r.error).map(r=>({sportKey:r.sportKey,error:r.error}));
    const payload = {events,errors,source:"The Odds API · US sportsbook markets",updatedAt:new Date().toISOString(),sports:Object.keys(ALLOWED_SPORTS),configured:true};
    if (events.length || !errors.length) oddsCache.set(cacheKey,{at:now,data:payload});
    return sendJson(res,events.length||!errors.length?200:502,payload);
  }
  res.writeHead(200,{"content-type":"text/plain"}); res.end("House Money table chat and sports odds service");
});
const wss = new WebSocketServer({server});
const rooms = new Map();
const history = new Map();
const MAX_HISTORY = 60;
const clean = (v,n=500) => String(v || "").replace(/[<>\u0000-\u001f]/g,"").trim().slice(0,n);
function send(ws,data){ if(ws.readyState===WebSocket.OPEN) ws.send(JSON.stringify(data)); }
function broadcast(room,data,except){ for(const peer of rooms.get(room)||[]) if(peer!==except) send(peer,data); }
wss.on("connection", ws => {
  ws.rooms = new Set(); ws.user = "Player"; ws.id = Math.random().toString(36).slice(2,10);
  ws.on("message", raw => {
    let m; try { m=JSON.parse(raw.toString()); } catch { return; }
    if(m.type==="join"){
      const room=clean(m.room,16).toUpperCase(); const name=clean(m.name,24)||"Player";
      if(!/^HM-\d{2}$/.test(room)) return send(ws,{type:"error",message:"Choose a valid House Money table."});
      if(ws.room){ const old=rooms.get(ws.room); if(old){old.delete(ws);broadcast(ws.room,{type:"presence",count:old.size});} }
      ws.room=room;ws.user=name;ws.rooms.add(room);
      if(!rooms.has(room))rooms.set(room,new Set()); rooms.get(room).add(ws);
      send(ws,{type:"joined",room,name,id:ws.id,history:history.get(room)||[],count:rooms.get(room).size});
      broadcast(room,{type:"presence",count:rooms.get(room).size},ws);
      broadcast(room,{type:"system",text:name+" joined the table chat.",at:Date.now()},ws);
      return;
    }
    if(!ws.room) return;
    if(m.type==="chat"){
      const text=clean(m.text,500); if(!text) return;
      const item={type:"chat",id:ws.id,name:ws.user,text,at:Date.now()};
      const h=history.get(ws.room)||[];h.push(item);history.set(ws.room,h.slice(-MAX_HISTORY));
      broadcast(ws.room,item);
      return;
    }
    if(m.type==="signal" && m.to && ["offer","answer","ice","voice-join","voice-leave"].includes(m.signalType)){
      if(m.to==="*"||m.to==="broadcast"){ for(const peer of rooms.get(ws.room)||[]) if(peer!==ws) send(peer,{type:"signal",from:ws.id,name:ws.user,signalType:m.signalType,data:m.data}); return; }
      const target=[...(rooms.get(ws.room)||[])].find(p=>p.id===m.to);
      if(target) send(target,{type:"signal",from:ws.id,name:ws.user,signalType:m.signalType,data:m.data});
      return;
    }
    if(m.type==="voice-state") broadcast(ws.room,{type:"voice-state",id:ws.id,name:ws.user,muted:!!m.muted},ws);
  });
  ws.on("close",()=>{ if(!ws.room)return;const room=ws.room;const set=rooms.get(room);if(set){set.delete(ws);broadcast(room,{type:"presence",count:set.size});broadcast(room,{type:"system",text:ws.user+" left the table chat.",at:Date.now()});if(!set.size)rooms.delete(room);} });
});
const port=process.env.PORT||10000;
server.listen(port,"0.0.0.0",()=>console.log("House Money chat listening on "+port));
