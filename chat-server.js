const http = require("http");
const { WebSocketServer, WebSocket } = require("ws");
const server = http.createServer((req,res) => {
  if (req.url === "/health") { res.writeHead(200,{"content-type":"application/json"}); return res.end(JSON.stringify({ok:true,service:"house-money-table-chat"})); }
  res.writeHead(200,{"content-type":"text/plain"}); res.end("House Money table chat service");
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
