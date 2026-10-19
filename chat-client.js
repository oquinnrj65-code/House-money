/* House Money per-table chat. Text uses a WebSocket backend; voice uses peer-to-peer WebRTC. */
(() => {
  "use strict";
  const CHAT_URL = "wss://house-money-chat.onrender.com";
  const $ = (s,r=document)=>r.querySelector(s);
  const peers = new Map();
  let socket=null, room="", myId="", localStream=null, muted=false, joined=false;
  const state={};
  function build(){
    const panel=$("#hm-playable-game"); if(!panel||$("#hm-table-chat"))return;
    const wrap=document.createElement("section");wrap.id="hm-table-chat";wrap.innerHTML=`
      <style>
      #hm-table-chat{margin:12px auto 20px;max-width:1450px;padding:0 clamp(8px,2vw,22px);color:#f4f7ff;font:14px/1.4 system-ui,sans-serif}
      #hm-table-chat .chat-shell{border:1px solid #314661;background:linear-gradient(180deg,#101d30,#091321);border-radius:15px;overflow:hidden;box-shadow:0 12px 28px #0004}
      #hm-table-chat .chat-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:13px 15px;background:#0a1423;border-bottom:1px solid #30415a}
      #hm-table-chat .chat-title{font-weight:900;letter-spacing:1px}#hm-table-chat .chat-sub{font-size:11px;color:#9eacc1}
      #hm-table-chat .chat-online{font-size:11px;color:#66e2b5;white-space:nowrap}
      #hm-table-chat .chat-body{display:grid;grid-template-columns:minmax(0,1fr) 170px;min-height:230px}
      #hm-table-chat .chat-log{height:235px;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
      #hm-table-chat .chat-line{overflow-wrap:anywhere;background:#17253a;border:1px solid #2a3c55;border-radius:10px;padding:8px 10px}
      #hm-table-chat .chat-line strong{color:#f4ce6e;font-size:12px}#hm-table-chat .chat-line p{margin:3px 0 0;white-space:pre-wrap}
      #hm-table-chat .chat-line.system{background:transparent;border:0;color:#8c9db4;font-size:11px;padding:2px 4px}
      #hm-table-chat .chat-side{border-left:1px solid #263850;padding:12px;display:flex;flex-direction:column;gap:9px;background:#0c1727}
      #hm-table-chat button,#hm-table-chat input{font:inherit}#hm-table-chat button{border:1px solid #3a4f6d;border-radius:9px;background:#1b2c45;color:white;padding:10px 12px;font-weight:800;cursor:pointer}
      #hm-table-chat button.primary{background:linear-gradient(#2a9b78,#167151);border-color:#4ccda1}
      #hm-table-chat button:disabled{opacity:.45;cursor:not-allowed}
      #hm-table-chat .chat-compose{display:flex;gap:8px;padding:10px;border-top:1px solid #263850;background:#0b1422}
      #hm-table-chat input{min-width:0;flex:1;border:1px solid #344862;border-radius:9px;background:#101d30;color:white;padding:11px}
      #hm-table-chat .chat-foot{font-size:10px;color:#8495ac;padding:8px 12px;border-top:1px solid #263850}
      #hm-table-chat .voice-state{font-size:11px;color:#a8bad1;overflow-wrap:anywhere}
      @media(max-width:560px){#hm-table-chat .chat-body{grid-template-columns:1fr}#hm-table-chat .chat-side{border-left:0;border-top:1px solid #263850;display:grid;grid-template-columns:1fr 1fr;gap:7px;padding:9px}#hm-table-chat .chat-side .voice-state{grid-column:1/-1}#hm-table-chat .chat-log{height:205px}#hm-table-chat .chat-compose{gap:6px;padding:8px}#hm-table-chat .chat-compose button{padding:9px}}
      </style>
      <div class="chat-shell">
        <div class="chat-head"><div><div class="chat-title">TABLE CHAT <span id="hm-chat-room">HM-01</span></div><div class="chat-sub">Talk with players at this table</div></div><div id="hm-chat-online" class="chat-online">Connecting…</div></div>
        <div class="chat-body"><div id="hm-chat-log" class="chat-log" aria-live="polite"></div>
          <aside class="chat-side"><button id="hm-chat-join" class="primary">Connect chat</button><button id="hm-voice-join" disabled>Join voice</button><button id="hm-voice-mute" disabled>Mute mic</button><button id="hm-voice-leave" disabled>Leave voice</button><div id="hm-voice-state" class="voice-state">Voice is off. Join voice and allow microphone access.</div></aside>
        </div>
        <form id="hm-chat-form" class="chat-compose"><input id="hm-chat-input" maxlength="500" placeholder="Message this table…" autocomplete="off" aria-label="Table chat message"><button class="primary" type="submit">Send</button></form>
        <div class="chat-foot">Table rooms are separate. Voice requires microphone permission and a secure connection. Be respectful; don’t share private information.</div>
      </div>`;
    panel.insertAdjacentElement("afterend",wrap);
    $("#hm-chat-join").addEventListener("click",connect);
    $("#hm-chat-form").addEventListener("submit",e=>{e.preventDefault();const text=$("#hm-chat-input").value.trim();if(!text)return;if(!socket||socket.readyState!==WebSocket.OPEN){append({type:"system",text:"Connect chat before sending messages."});return;}socket.send(JSON.stringify({type:"chat",text}));$("#hm-chat-input").value="";});
    $("#hm-voice-join").addEventListener("click",joinVoice);
    $("#hm-voice-mute").addEventListener("click",toggleMute);
    $("#hm-voice-leave").addEventListener("click",leaveVoice);
    const table=$("#hm-game-table");if(table)table.addEventListener("change",()=>{if(joined&&table.value!==room){leaveVoice();connect();}});
    connect();
  }
  function append(m){
    const log=$("#hm-chat-log");if(!log)return;
    const row=document.createElement("div");row.className="chat-line"+(m.type==="system"?" system":"");
    if(m.type==="chat"){const strong=document.createElement("strong");strong.textContent=(m.name||"Player")+(m.id===myId?" (you)":"");const p=document.createElement("p");p.textContent=m.text;row.append(strong,p);}
    else {row.textContent=m.text||"";}
    log.appendChild(row);while(log.children.length>100)log.firstElementChild.remove();log.scrollTop=log.scrollHeight;
  }
  function connect(){
    const table=$("#hm-game-table");room=table?table.value:"HM-01";$("#hm-chat-room").textContent=room;
    if(socket)try{socket.close();}catch(_){}
    joined=false;$("#hm-chat-online").textContent="Connecting…";$("#hm-chat-join").disabled=true;
    try{socket=new WebSocket(CHAT_URL);}catch(e){failed();return;}
    socket.addEventListener("open",()=>{const name=(prompt("Choose a display name for table chat (optional):")||"Player").trim().slice(0,24)||"Player";socket.send(JSON.stringify({type:"join",room,name}));});
    socket.addEventListener("message",async e=>{let m;try{m=JSON.parse(e.data);}catch(_){return;}
      if(m.type==="joined"){joined=true;myId=socket.id||"";$("#hm-chat-online").textContent=(m.count||1)+" connected";$("#hm-chat-join").textContent="Connected";$("#hm-chat-join").disabled=false;$("#hm-voice-join").disabled=false;$("#hm-chat-log").replaceChildren();(m.history||[]).forEach(append);append({type:"system",text:"Connected to "+room+"."});}
      else if(m.type==="presence")$("#hm-chat-online").textContent=m.count+" connected";
      else if(m.type==="chat")append(m);else if(m.type==="system")append(m);else if(m.type==="error")append({type:"system",text:m.message});
      else if(m.type==="signal")await handleSignal(m);
    });
    socket.addEventListener("close",()=>{joined=false;$("#hm-chat-online").textContent="Disconnected";$("#hm-chat-join").disabled=false;$("#hm-chat-join").textContent="Reconnect chat";$("#hm-voice-join").disabled=true;});
    socket.addEventListener("error",failed);
  }
  function failed(){const online=$("#hm-chat-online");if(online)online.textContent="Chat unavailable";const join=$("#hm-chat-join");if(join){join.disabled=false;join.textContent="Retry connection";}append({type:"system",text:"Could not reach the chat server. It may still be deploying; try again shortly."});}
  function send(m){if(socket&&socket.readyState===WebSocket.OPEN)socket.send(JSON.stringify(m));}
  async function joinVoice(){
    if(!joined)return;
    try{
      localStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
      $("#hm-voice-state").textContent="Microphone ready. Connecting to players in "+room+"…";
      $("#hm-voice-join").disabled=true;$("#hm-voice-mute").disabled=false;$("#hm-voice-leave").disabled=false;
      send({type:"signal",signalType:"voice-join",to:"*"});
      // Ask all room peers to establish a connection through a room-wide voice announcement.
      send({type:"voice-state",muted:false});
      send({type:"signal",signalType:"voice-join",to:"broadcast"});
      $("#hm-voice-state").textContent="Microphone on. Voice links connect as other players join voice.";
    }catch(e){$("#hm-voice-state").textContent=e.name==="NotAllowedError"?"Microphone permission was denied. Allow it in browser settings.":"Microphone unavailable: "+e.message;}
  }
  async function makePeer(id,name,offer){
    if(!localStream||peers.has(id))return;
    const pc=new RTCPeerConnection({iceServers:[{urls:"stun:stun.l.google.com:19302"}]});
    peers.set(id,{pc,name});
    localStream.getTracks().forEach(t=>pc.addTrack(t,localStream));
    pc.ontrack=e=>{let audio=$("#hm-audio-"+id);if(!audio){audio=document.createElement("audio");audio.id="hm-audio-"+id;audio.autoplay=true;audio.playsInline=true;document.body.appendChild(audio);}audio.srcObject=e.streams[0];};
    pc.onicecandidate=e=>{if(e.candidate)send({type:"signal",to:id,signalType:"ice",data:e.candidate});};
    if(offer){const s=await pc.createOffer();await pc.setLocalDescription(s);send({type:"signal",to:id,signalType:"offer",data:s});}
  }
  async function handleSignal(m){
    if(m.signalType==="voice-join"){if(localStream&&m.from!==myId)await makePeer(m.from,m.name,true);return;}
    if(m.signalType==="voice-leave"){closePeer(m.from);return;}
    if(m.signalType==="offer"){if(!localStream)return;await makePeer(m.from,m.name,false);const p=peers.get(m.from);await p.pc.setRemoteDescription(m.data);const answer=await p.pc.createAnswer();await p.pc.setLocalDescription(answer);send({type:"signal",to:m.from,signalType:"answer",data:answer});}
    else if(m.signalType==="answer"){const p=peers.get(m.from);if(p)await p.pc.setRemoteDescription(m.data);}
    else if(m.signalType==="ice"){const p=peers.get(m.from);if(p&&m.data)try{await p.pc.addIceCandidate(m.data);}catch(_){}}
  }
  function closePeer(id){const p=peers.get(id);if(p){p.pc.close();peers.delete(id);}const a=$("#hm-audio-"+id);if(a)a.remove();}
  function toggleMute(){if(!localStream)return;muted=!muted;localStream.getAudioTracks().forEach(t=>t.enabled=!muted);$("#hm-voice-mute").textContent=muted?"Unmute mic":"Mute mic";$("#hm-voice-state").textContent=muted?"Microphone muted.":"Microphone on." ;send({type:"voice-state",muted});}
  function leaveVoice(){send({type:"signal",signalType:"voice-leave",to:"broadcast"});peers.forEach((_,id)=>closePeer(id));if(localStream)localStream.getTracks().forEach(t=>t.stop());localStream=null;muted=false;$("#hm-voice-join").disabled=!joined;$("#hm-voice-mute").disabled=true;$("#hm-voice-leave").disabled=true;$("#hm-voice-mute").textContent="Mute mic";$("#hm-voice-state").textContent="Voice is off.";}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",build);else build();
})();