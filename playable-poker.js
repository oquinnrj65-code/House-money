/* House Money playable poker demo.
 * Local single-player versus computer seats. Play chips only; no backend, cash or multiplayer.
 * House rules for this prototype: Hold'em and Omaha use standard 5-card evaluation;
 * 5-Card High/Low is draw poker with one draw and ace-to-five low qualification;
 * 4-Card Stud compares the best 4-card hand using a 4-card category ranking.
 */
(() => {
  "use strict";
  const STORE = "houseMoneyPlayableDemoV1";
  let dealTimer=null;
  const VARIANTS = [
    { key:"holdem", name:"Texas Hold'em", hole:2, board:5, handSize:5 },
    { key:"fivecard", name:"5-Card High / Low", hole:5, board:0, handSize:5 },
    { key:"fourstud", name:"4-Card Stud", hole:4, board:0, handSize:4 },
    { key:"omaha", name:"Omaha", hole:4, board:5, handSize:5 }
  ];
  const SUITS = ["♠","♥","♦","♣"];
  const RANKS = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
  const $ = (s,r=document)=>r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const fmt = n => Math.max(0,Math.floor(n)).toLocaleString("en-US");
  const cardText = c => c.rank + c.suit;
  const isRed = c => c.suit==="♥" || c.suit==="♦";
  const cardHTML = c => '<span class="hm-playing-card'+(isRed(c)?" red":"")+'">'+esc(cardText(c))+'</span>';
  const shuffledDeck = () => {
    const d = [];
    for (let r=2;r<=14;r++) for (const suit of SUITS) d.push({r,rank:RANKS[r-2],suit});
    for (let i=d.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [d[i],d[j]]=[d[j],d[i]]; }
    return d;
  };
  const rankLabel = r => ({14:"Ace",13:"King",12:"Queen",11:"Jack"}[r] || String(r));
  function combinations(arr,k) {
    const out=[];
    function walk(start, picked) {
      if (picked.length===k) { out.push(picked.slice()); return; }
      for (let i=start;i<=arr.length-(k-picked.length);i++) { picked.push(arr[i]); walk(i+1,picked); picked.pop(); }
    }
    walk(0,[]); return out;
  }
  function cmp(a,b) {
    for (let i=0;i<Math.max(a.length,b.length);i++) {
      const x=a[i]||0,y=b[i]||0;
      if(x!==y) return x>y?1:-1;
    }
    return 0;
  }
  function evalFive(cards) {
    const rs=cards.map(c=>c.r).sort((a,b)=>b-a);
    const counts={}; rs.forEach(r=>counts[r]=(counts[r]||0)+1);
    const groups=Object.keys(counts).map(Number).sort((a,b)=>counts[b]-counts[a]||b-a);
    const flush=cards.every(c=>c.suit===cards[0].suit);
    const unique=[...new Set(rs)];
    let straightHigh=0;
    if(unique.length===5) {
      if(unique[0]-unique[4]===4) straightHigh=unique[0];
      else if(unique.join(",")==="14,5,4,3,2") straightHigh=5;
    }
    if(flush&&straightHigh) return {score:[8,straightHigh],name:straightHigh===14?"Royal/straight flush":"Straight flush"};
    if(counts[groups[0]]===4) return {score:[7,groups[0],groups[1]],name:"Four of a kind"};
    if(counts[groups[0]]===3&&counts[groups[1]]===2) return {score:[6,groups[0],groups[1]],name:"Full house"};
    if(flush) return {score:[5,...rs],name:"Flush"};
    if(straightHigh) return {score:[4,straightHigh],name:"Straight"};
    if(counts[groups[0]]===3) return {score:[3,groups[0],...groups.slice(1).sort((a,b)=>b-a)],name:"Three of a kind"};
    const pairs=Object.keys(counts).map(Number).filter(r=>counts[r]===2).sort((a,b)=>b-a);
    if(pairs.length===2) return {score:[2,pairs[0],pairs[1],...rs.filter(r=>!pairs.includes(r))],name:"Two pair"};
    if(pairs.length===1) return {score:[1,pairs[0],...rs.filter(r=>r!==pairs[0])],name:"One pair"};
    return {score:[0,...rs],name:"High card"};
  }
  function evalFour(cards) {
    const counts={}; cards.forEach(c=>counts[c.r]=(counts[c.r]||0)+1);
    const rs=cards.map(c=>c.r).sort((a,b)=>b-a);
    const groups=Object.keys(counts).map(Number).sort((a,b)=>counts[b]-counts[a]||b-a);
    const flush=cards.every(c=>c.suit===cards[0].suit);
    const unique=[...new Set(rs)];
    const straight=unique.length===4 && (unique[0]-unique[3]===3 || unique.join(",")==="14,5,4,3");
    if(flush&&straight) return {score:[7,unique[0]===14?5:unique[0]],name:"Straight flush"};
    if(counts[groups[0]]===4) return {score:[6,groups[0]],name:"Four of a kind"};
    if(counts[groups[0]]===3) return {score:[5,groups[0],groups[1]],name:"Three of a kind"};
    if(flush) return {score:[4,...rs],name:"Flush"};
    if(straight) return {score:[3,unique[0]===14?5:unique[0]],name:"Straight"};
    if(counts[groups[0]]===2) return {score:[2,groups[0],...groups.slice(1).sort((a,b)=>b-a)],name:"One pair"};
    return {score:[1,...rs],name:"High card"};
  }
  function bestHand(cards,k) {
    let best=null;
    for(const combo of combinations(cards,k)) {
      const value=k===4?evalFour(combo):evalFive(combo);
      if(!best||cmp(value.score,best.score)>0) best={...value,cards:combo};
    }
    return best;
  }
  function evaluate(player, board, variant) {
    if(variant.key==="holdem") return bestHand(player.cards.concat(board),5);
    if(variant.key==="omaha") {
      let best=null;
      for(const h of combinations(player.cards,2)) for(const b of combinations(board,3)) {
        const v=evalFive(h.concat(b)); if(!best||cmp(v.score,best.score)>0) best={...v,cards:h.concat(b)};
      }
      return best;
    }
    if(variant.key==="fourstud") return evalFour(player.cards);
    return evalFive(player.cards);
  }
  function lowValue(cards) {
    const rs=cards.map(c=>c.r===14?1:c.r);
    if(new Set(rs).size!==5||Math.max(...rs)>8) return null;
    return rs.sort((a,b)=>b-a);
  }
  function evaluateLow(player) { return lowValue(player.cards); }
  function defaultState() {
    return {bankroll:5000,hands:0,wins:0,losses:0,variant:"holdem",table:"HM-01",smallBlind:5,bigBlind:10,bet:0,game:null,message:"Choose a table and start a hand.",history:[]};
  }
  function loadState() {
    try {
      const s=JSON.parse(localStorage.getItem(STORE)||"null");
      if(!s||typeof s!=="object") return defaultState();
      return {...defaultState(),...s,game:null};
    } catch(_) { return defaultState(); }
  }
  let state=loadState();
  let pendingDraw=new Set();
  function save() { try { localStorage.setItem(STORE,JSON.stringify({...state,game:null})); } catch(_) {} }
  function styles() {
    if($("#hm-game-styles")) return;
    const style=document.createElement("style"); style.id="hm-game-styles";
    style.textContent='.hm-game-panel{margin-top:14px}.hm-game-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(250px,.75fr);gap:14px}.hm-game-panel .hm-game-card{background:#0d1423;border:1px solid var(--line);border-radius:12px;padding:14px;min-width:0}.hm-game-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.hm-game-fields label{display:flex;flex-direction:column;gap:5px;font-size:12px;color:var(--muted)}.hm-game-fields select,.hm-game-fields input{width:100%;background:#0b1220;border:1px solid #35445f;color:var(--text);border-radius:8px;padding:9px;font:inherit}.hm-game-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.hm-playing-card{display:inline-grid;place-items:center;min-width:38px;height:54px;padding:0 5px;background:#fff;color:#101827;border-radius:6px;font-weight:800;margin:3px;box-shadow:0 2px 6px #0004}.hm-playing-card.red{color:#c73549}.hm-cards{display:flex;flex-wrap:wrap;gap:3px;min-height:62px}.hm-player-row{border-top:1px solid var(--line);padding:10px 0}.hm-player-row:first-child{border-top:0}.hm-player-top{display:flex;justify-content:space-between;gap:10px;align-items:center}.hm-game-muted{font-size:12px;color:var(--muted)}.hm-game-message{padding:10px 12px;background:#211e18;border:1px solid #5a4c2d;border-radius:9px;color:#dfd1a8;margin-top:12px}.hm-draw-select{cursor:pointer}.hm-draw-select.selected{outline:3px solid var(--gold);outline-offset:1px}.hm-hand-result{color:var(--gold);font-size:12px}.hm-card-back{display:inline-grid;place-items:center;min-width:38px;height:54px;margin:3px;border-radius:6px;border:2px solid #e4c36f;background:repeating-linear-gradient(45deg,#112a65,#112a65 4px,#1d478c 4px,#1d478c 8px);color:#f6d779;font-weight:900;box-shadow:0 2px 6px #0005}.hm-deal-log{display:flex;flex-direction:column;gap:5px;max-height:135px;overflow:auto;padding:9px 11px;border:1px solid #30425c;background:#08111f;border-radius:9px;font-size:11px;color:#b6c5da}.hm-deal-log p{margin:0}.hm-deal-log p:first-child{color:#f5d27d}.hm-rules-note{font-size:11px;line-height:1.5;color:#9fb0c8;padding:9px 11px;background:#101d30;border:1px solid #2a3d56;border-radius:9px}.hm-dealing{color:#f5d27d;font-weight:800;animation:hmPulse .8s infinite alternate}@keyframes hmPulse{to{opacity:.45}}@media(max-width:850px){.hm-game-grid{grid-template-columns:1fr}.hm-game-fields{grid-template-columns:1fr}}';
    document.head.appendChild(style);
  }
  function buildUI() {
    const page=$("#page-poker"); if(!page||$("#hm-playable-game")) return;
    const panel=document.createElement("section"); panel.id="hm-playable-game"; panel.className="card hm-game-panel";
    panel.innerHTML='<div class="sectionhead" style="margin-top:0"><div><div class="eyebrow">PLAYABLE DEMO TABLES</div><h3 style="margin:4px 0">Play a hand against computer players</h3></div><span class="tag">Play chips only</span></div>'+
      '<p class="hm-game-muted">Local single-player demo with dealing, betting, folding, showdown, and chip accounting. No real money and no online multiplayer.</p>'+
      '<div class="hm-game-grid"><div class="hm-game-card"><div class="hm-game-fields"><label for="hm-game-table">Poker table<select id="hm-game-table">'+Array.from({length:16},(_,i)=>{const n=i+1;const v=n<=4?"Texas Hold'em":n<=8?"5-Card High / Low":n<=12?"4-Card Stud":"Omaha";return '<option value="HM-'+String(n).padStart(2,"0")+'">HM-'+String(n).padStart(2,"0")+' — '+v+'</option>';}).join("")+'</select></label><label for="hm-game-variant">Game variant<select id="hm-game-variant">'+VARIANTS.map(v=>'<option value="'+v.key+'">'+v.name+'</option>').join("")+'</select></label><label for="hm-game-buyin">Buy-in (demo chips)<input id="hm-game-buyin" type="number" min="100" max="1000" step="50" value="500"></label><label for="hm-game-blinds">Blind level<select id="hm-game-blinds"><option value="5/10">5 / 10</option><option value="10/20">10 / 20</option><option value="25/50">25 / 50</option></select></label></div><div class="hm-game-actions"><button class="btn gold" id="hm-game-start" type="button">Start new hand</button><button class="btn" id="hm-game-reset" type="button">Reset play chips</button></div><div id="hm-game-message" class="hm-game-message" role="status" aria-live="polite"></div><div id="hm-game-rules" class="hm-rules-note">Rules for the selected table will appear here.</div><div class="sectionhead"><h3>Hand history</h3><span class="hm-game-muted">This hand</span></div><div id="hm-game-action-log" class="hm-deal-log" aria-live="polite"><p>Choose a table and start a hand to see the deal and actions.</p></div><div class="sectionhead"><h3>Community cards</h3><span class="hm-game-muted" id="hm-game-stage">Waiting to deal</span></div><div class="hm-cards" id="hm-game-board"></div><div class="hm-game-muted" id="hm-game-pot">Pot: 0 demo chips</div><div class="sectionhead"><h3>Your cards</h3><span class="hm-game-muted" id="hm-game-hand-label">Start a hand to receive cards</span></div><div class="hm-cards" id="hm-game-hand"></div><div id="hm-game-draw-hint" class="hm-game-muted"></div><div class="hm-game-actions" id="hm-game-actions"><button class="btn" data-act="check">Check</button><button class="btn" data-act="call">Call</button><button class="btn" data-act="raise">Raise</button><button class="btn" data-act="fold">Fold</button><button class="btn" data-act="draw">Draw selected cards</button><button class="btn gold" data-act="next">Next hand</button></div></div><div class="hm-game-card"><div class="sectionhead" style="margin-top:0"><h3>Table seats</h3><span class="hm-game-muted">You + 3 computer players</span></div><div id="hm-game-seats"></div><div class="sectionhead"><h3>Session stats</h3></div><div class="hm-game-fields"><div><div class="hm-game-muted">Play-chip balance</div><strong id="hm-game-bankroll"></strong></div><div><div class="hm-game-muted">Hands played</div><strong id="hm-game-hands"></strong></div><div><div class="hm-game-muted">Wins</div><strong id="hm-game-wins"></strong></div><div><div class="hm-game-muted">Losses</div><strong id="hm-game-losses"></strong></div></div><p class="hm-game-muted">Scores and chip totals are saved only in this browser. Computer opponents are simulated. Reloading the page ends the current hand.</p></div></div>';
    page.prepend(panel);
    $("#hm-game-table").addEventListener("change",()=>syncVariantFromTable());
    document.addEventListener("click",e=>{const open=e.target.closest("[data-join]");if(!open)return;const target=$("#hm-game-table");if(!target)return;target.value=open.dataset.join;target.dispatchEvent(new Event("change"));setTimeout(()=>panel.scrollIntoView({behavior:"smooth",block:"start"}),0);});
    $("#hm-game-variant").addEventListener("change",()=>{syncTableFromVariant();render();});
    $("#hm-game-start").addEventListener("click",startHand);
    $("#hm-game-reset").addEventListener("click",()=>{state.bankroll=5000;state.hands=0;state.wins=0;state.losses=0;state.game=null;state.message="Play chips reset to 5,000.";save();render();});
    $("#hm-game-actions").addEventListener("click",e=>{const b=e.target.closest("[data-act]");if(b) action(b.dataset.act);});
    syncVariantFromTable(); render();
  }
  function syncVariantFromTable() {
    const n=Number($("#hm-game-table").value.slice(3));
    const key=n<=4?"holdem":n<=8?"fivecard":n<=12?"fourstud":"omaha";
    $("#hm-game-variant").value=key; state.table=$("#hm-game-table").value; state.variant=key; render();
  }
  function syncTableFromVariant() {
    const key=$("#hm-game-variant").value;
    const first={holdem:1,fivecard:5,fourstud:9,omaha:13}[key];
    $("#hm-game-table").value="HM-"+String(first).padStart(2,"0");
    state.variant=key;state.table=$("#hm-game-table").value;render();
  }
  function startHand() {
    const tableNo=Number($("#hm-game-table").value.slice(3));
    const tableVariant=tableNo<=4?"holdem":tableNo<=8?"fivecard":tableNo<=12?"fourstud":"omaha";
    const variant=VARIANTS.find(v=>v.key===tableVariant)||VARIANTS.find(v=>v.key===$("#hm-game-variant").value)||VARIANTS[0];
    $("#hm-game-variant").value=variant.key;
    const buyin=Number($("#hm-game-buyin").value);
    const blinds=$("#hm-game-blinds").value.split("/").map(Number);
    if(!Number.isSafeInteger(buyin)||buyin<100||buyin>1000){state.message="Choose a whole-number buy-in from 100 to 1,000 demo chips.";render();return;}
    if(state.bankroll<buyin){state.message="Not enough play chips. Reset play chips to restart your demo session.";render();return;}
    state.bankroll-=buyin;state.hands++;state.variant=variant.key;state.table=$("#hm-game-table").value;state.smallBlind=blinds[0];state.bigBlind=blinds[1];
    pendingDraw.clear();
    const deck=shuffledDeck();
    const players=[
      {id:0,name:"You",chips:buyin,bet:0,folded:false,allIn:false,cards:[]},
      {id:1,name:"Roxy",chips:buyin,bet:0,folded:false,allIn:false,cards:[]},
      {id:2,name:"Maverick",chips:buyin,bet:0,folded:false,allIn:false,cards:[]},
      {id:3,name:"Ace",chips:buyin,bet:0,folded:false,allIn:false,cards:[]}
    ];
    for(let round=0;round<variant.hole;round++) for(const p of players) p.cards.push(deck.pop());
    const post=(p,n)=>{const amount=Math.min(p.chips,n);p.chips-=amount;p.bet+=amount;if(!p.chips)p.allIn=true;return amount;};
    // Demo uses a rotating dealer; the two seats clockwise after the dealer post blinds.
    const dealer=(state.dealer||0)%players.length;
    const sb=players[(dealer+1)%players.length],bb=players[(dealer+2)%players.length];
    const pot=post(sb,blinds[0])+post(bb,blinds[1]);
    state.game={variant:variant.key,players,board:[],deck,pot,currentBet:Math.max(...players.map(p=>p.bet)),stage:"dealing",street:0,drawDone:false,showdown:false,results:[],dealer,sb:sb.id,bb:bb.id,handNo:state.hands,acted:false,dealProgress:0,log:[]};
    state.dealer=(dealer+1)%players.length;
    gLog("Hand #"+state.hands+" started at "+state.table+".");
    gLog("Dealer: "+players[dealer].name+". Small blind: "+sb.name+" ("+fmt(blinds[0])+"), big blind: "+bb.name+" ("+fmt(blinds[1])+").");
    state.message="Dealing private cards…";
    save();render();
    if(dealTimer)clearInterval(dealTimer);
    let dealt=0;const total=variant.hole*players.length;
    dealTimer=setInterval(()=>{
      const game=state.game;if(!game||game.handNo!==state.hands||game.stage!=="dealing"){clearInterval(dealTimer);dealTimer=null;return;}
      dealt++;game.dealProgress=dealt;
      if(dealt>=total){
        clearInterval(dealTimer);dealTimer=null;game.stage="betting";game.street=0;
        if(variant.key==="fivecard")state.message="Deal complete. Five-card draw — first betting round.";
        else if(variant.key==="fourstud")state.message="Deal complete. Four-card stud — betting round.";
        else state.message="Deal complete. "+(variant.key==="omaha"?"Omaha":"Texas Hold'em")+" pre-flop betting. Blinds are posted.";
        gLog("Deal complete. "+variant.hole+" private cards dealt to each seat.");
      } else state.message="Dealing private cards… ("+dealt+" of "+total+")";
      render();
    },150);
  }
  function gLog(text){const g=state.game;if(!g)return;if(!g.log)g.log=[];g.log.unshift(text);g.log=g.log.slice(0,30);}
  function ruleText(g){
    const selectedKey=($("#hm-game-variant")&&$("#hm-game-variant").value)||"holdem";
    const key=g&&!g.showdown?g.variant:selectedKey;
    const blindValue=($("#hm-game-blinds")&&$("#hm-game-blinds").value)||"5/10";
    const parts=blindValue.split("/");
    const small=g&&!g.showdown?g.smallBlind:Number(parts[0]);
    const big=g&&!g.showdown?g.bigBlind:Number(parts[1]);
    if(key==="holdem")return "TEXAS HOLD'EM · 2 private cards each · 5 community cards (flop 3, turn 1, river 1). Make the best 5-card hand from any combination of your hole cards and the board. Blinds: "+fmt(small)+"/"+fmt(big)+".";
    if(key==="omaha")return "OMAHA · 4 private cards each · 5 community cards. Your final hand must use exactly 2 private cards and exactly 3 board cards. Blinds: "+fmt(small)+"/"+fmt(big)+".";
    if(key==="fivecard")return "5-CARD HIGH / LOW · 5 private cards each · one discard/draw phase. High hand wins half when a qualifying low exists; low qualifies as five distinct ranks 8 or lower (ace low). Otherwise high wins the whole pot. House Money demo rules.";
    return "4-CARD STUD · 4 private cards each · no community board in this demo. Best 4-card hand wins at showdown. House Money demo rules.";
  }
  function activePlayers(g){return g.players.filter(p=>!p.folded);}
  function postHuman(amount) {
    const g=state.game,p=g.players[0],n=Math.max(0,Math.min(p.chips,amount));
    p.chips-=n;p.bet+=n;g.pot+=n;g.currentBet=Math.max(g.currentBet,p.bet);if(!p.chips)p.allIn=true;
    state.message="You put in "+fmt(n)+" demo chips.";
  }
  function action(act) {
    const g=state.game;if(!g){state.message="Start a hand first.";render();return;}
    if(g.showdown){if(act==="next")startHand();return;}
    const human=g.players[0];
    if(act==="next"){state.message="Finish the current hand before starting the next.";render();return;}
    if(g.stage==="draw") {
      if(act!=="draw"){state.message="Select the cards to discard, then tap Draw selected cards.";render();return;}
      const keep=human.cards.filter((_,i)=>!pendingDraw.has(i));
      const needed=5-keep.length;
      const replacements=needed?g.deck.splice(0,needed):[];
      human.cards=keep.concat(replacements);pendingDraw.clear();
      for(const p of g.players.slice(1)){
        if(p.folded)continue;
        const discard=Math.random()<.7?Math.floor(Math.random()*4):0;
        for(let i=0;i<Math.min(discard,p.cards.length);i++){p.cards.splice(Math.floor(Math.random()*p.cards.length),1);p.cards.push(g.deck.pop());}
      }
      g.drawDone=true;beginBettingRound(g,"after-draw");gLog("You draw "+needed+" replacement card(s).");
      state.message="Cards drawn. Final betting round — check, call, raise, or fold.";
      render();return;
    }
    if(g.stage!=="betting"){render();return;}
    const need=Math.max(0,g.currentBet-human.bet);
    if(act==="fold"){human.folded=true;state.message="You folded.";gLog("You fold.");runBots();return;}
    if(act==="check"&&need>0){state.message="You cannot check while facing a bet. Call, raise, or fold.";render();return;}
    if(act==="call"){
      if(need===0){state.message="There is no bet to call; choose Check.";render();return;}
      postHuman(Math.min(need,human.chips));gLog("You call "+fmt(Math.min(need,human.chips))+".");
    } else if(act==="raise"){
      if(human.chips<=need){state.message="You need enough chips to call and raise.";render();return;}
      const raiseBy=g.bigBlind;
      const target=g.currentBet+raiseBy;
      const amount=Math.min(human.chips,Math.max(0,target-human.bet));
      if(amount<=need){state.message="Not enough chips for a raise; call or fold instead.";render();return;}
      postHuman(amount);state.message="You raised to "+fmt(human.bet)+" this round.";gLog("You raise to "+fmt(human.bet)+".");
    } else if(act==="check"){
      state.message="You checked.";
    } else {render();return;}
    runBots();
  }
  function beginBettingRound(g,streetName) {
    g.players.forEach(p=>{p.bet=0;});
    g.currentBet=0;g.stage="betting";g.streetName=streetName;
  }
  function runBots() {
    const g=state.game;if(!g)return;
    for(const p of g.players.slice(1)){
      if(p.folded||p.allIn)continue;
      const need=Math.max(0,g.currentBet-p.bet);
      const confidence=Math.random();
      if(need>0&&confidence<(g.street===0?.16:.22)){p.folded=true;continue;}
      if(need>p.chips){if(p.chips>0){g.pot+=p.chips;p.bet+=p.chips;p.chips=0;p.allIn=true;}else p.allIn=true;continue;}
      if(need>0){p.chips-=need;p.bet+=need;g.pot+=need;if(!p.chips)p.allIn=true;}
      else if(confidence>.84&&p.chips>g.bigBlind){
        const n=Math.min(g.bigBlind,p.chips);p.chips-=n;p.bet+=n;g.pot+=n;g.currentBet=p.bet;if(!p.chips)p.allIn=true;
      }
    }
    const alive=activePlayers(g);
    if(alive.length===1){award(alive[0],g);return;}
    // A simplified one-action-per-seat demo round: all bots respond, then progress the real street sequence.
    g.players.forEach(p=>{p.bet=0;});
    g.currentBet=0;
    if(g.variant==="holdem"||g.variant==="omaha"){
      if(g.street===0){g.deck.pop();g.board.push(...g.deck.splice(0,3));g.street=1;beginBettingRound(g,"flop");state.message="Flop dealt. New betting round.";gLog("Flop: "+g.board.slice(0,3).map(cardText).join(" ")+".");}
      else if(g.street===1){g.deck.pop();g.board.push(g.deck.pop());g.street=2;beginBettingRound(g,"turn");state.message="Turn dealt. New betting round.";gLog("Turn: "+cardText(g.board[3])+".");}
      else if(g.street===2){g.deck.pop();g.board.push(g.deck.pop());g.street=3;beginBettingRound(g,"river");state.message="River dealt. Final betting round.";gLog("River: "+cardText(g.board[4])+".");}
      else {g.stage="showdown";finishHand();return;}
    } else if(g.variant==="fivecard"&&!g.drawDone){
      g.stage="draw";state.message="Draw phase: tap any cards you want to discard, then tap Draw selected cards.";gLog("Draw phase begins. Select cards to discard.");
    } else {g.stage="showdown";finishHand();return;}
    render();
  }
  function finishHand() {
    const g=state.game;if(!g)return;
    const players=activePlayers(g);
    if(g.variant==="fivecard") {
      const ranked=players.map(p=>({player:p,value:evalFive(p.cards),low:evaluateLow(p)})).sort((a,b)=>cmp(b.value.score,a.value.score));
      const highScore=ranked[0].value.score;
      const highWinners=ranked.filter(x=>cmp(x.value.score,highScore)===0);
      let lowWinners=ranked.filter(x=>x.low).sort((a,b)=>cmp(a.low,b.low));
      const hasLow=lowWinners.length>0;
      if(hasLow) {
        const lowBest=lowWinners[0].low;lowWinners=lowWinners.filter(x=>cmp(x.low,lowBest)===0);
        const highPool=g.pot-Math.floor(g.pot/2),lowPool=Math.floor(g.pot/2);
        const highShare=Math.floor(highPool/highWinners.length),lowShare=Math.floor(lowPool/lowWinners.length);
        highWinners.forEach(x=>x.player.chips+=highShare);
        lowWinners.forEach(x=>x.player.chips+=lowShare);
        g.results=[...highWinners.map(x=>({player:x.player,value:x.value,share:highShare,kind:"High"})),...lowWinners.map(x=>({player:x.player,value:null,share:lowShare,kind:"Low"}))];
      } else {
        const share=Math.floor(g.pot/highWinners.length);
        highWinners.forEach(x=>x.player.chips+=share);
        g.results=highWinners.map(x=>({player:x.player,value:x.value,share,kind:"High"}));
      }
    } else {
      const ranked=players.map(p=>({player:p,value:evaluate(p,g.board,g.variant)})).sort((a,b)=>cmp(b.value.score,a.value.score));
      const best=ranked[0].value.score;const winners=ranked.filter(x=>cmp(x.value.score,best)===0);
      const share=Math.floor(g.pot/winners.length);winners.forEach(x=>x.player.chips+=share);
      g.results=winners.map(x=>({player:x.player,value:x.value,share,kind:"High"}));
    }
    const humanWon=g.results.some(x=>x.player.id===0);
    if(humanWon)state.wins++;else state.losses++;
    g.players.forEach(p=>{if(p.id===0)state.bankroll+=p.chips;});
    // Only return the human player's remaining stack; bot chips are never user funds.
    g.showdown=true;g.stage="complete";gLog("Showdown: "+g.results.map(x=>x.player.name+" shows "+(x.value?x.value.name:x.kind)).join("; ")+".");
    const summary=g.results.map(x=>x.player.name+" wins "+fmt(x.share||g.pot)+" ("+(x.value?x.value.name:x.kind||"uncontested")+")").join("; ");
    state.message=summary+". Hand over — start another hand when ready.";
    save();render();
  }
  function award(winner,g) {
    winner.chips+=g.pot;g.results=[{player:winner,value:null,share:g.pot,kind:"Uncontested"}];
    if(winner.id===0)state.wins++;else state.losses++;
    // Only return the human player's remaining stack; bot chips are never user funds.
    state.bankroll+=g.players[0].chips;
    g.showdown=true;g.stage="complete";gLog(winner.name+" wins the pot uncontested.");state.message=winner.name+" wins the pot uncontested ("+fmt(g.pot)+" demo chips).";save();render();
  }
  function toggleDiscard(i) {
    if(pendingDraw.has(i))pendingDraw.delete(i);else pendingDraw.add(i);
    render();
  }
  function render() {
    if(!$("#hm-playable-game"))return;
    const g=state.game;
    $("#hm-game-message").textContent=state.message;
    $("#hm-game-rules").textContent=ruleText(g);
    $("#hm-game-action-log").innerHTML=(g&&g.log&&g.log.length?g.log:["Start a hand to see the deal and action history."]).map(line=>"<p>"+esc(line)+"</p>").join("");
    $("#hm-game-bankroll").textContent=fmt(state.bankroll)+" demo chips";
    $("#hm-game-hands").textContent=String(state.hands);
    $("#hm-game-wins").textContent=String(state.wins);
    $("#hm-game-losses").textContent=String(state.losses);
    $("#hm-game-stage").textContent=g?(g.stage==="dealing"?"Dealing cards…":g.showdown?"Hand complete":g.stage==="draw"?"Draw phase":g.variant==="holdem"||g.variant==="omaha"?(["Pre-flop","Flop","Turn","River"][g.street]||"Betting"):g.variant==="fivecard"?(g.drawDone?"Final betting":"First betting round"):"Four-card stud betting"):"Waiting to deal";
    $("#hm-game-pot").textContent="Pot: "+fmt(g?g.pot:0)+" demo chips";
    $("#hm-game-board").innerHTML=g?g.board.map(cardHTML).join(""):'<span class="hm-game-muted">Community cards appear here for Hold’em and Omaha.</span>';
    $("#hm-game-hand-label").textContent=g?VARIANTS.find(v=>v.key===g.variant).name:"Start a hand to receive cards";
    $("#hm-game-hand").innerHTML=g?(g.stage==="dealing"?g.players[0].cards.slice(0,Math.min(g.players[0].cards.length,Math.floor(g.dealProgress/g.players.length)+(0<g.dealProgress%g.players.length?1:0))).map(cardHTML).join(""):g.players[0].cards.map((c,i)=>'<button type="button" class="hm-playing-card hm-draw-select'+(pendingDraw.has(i)?" selected":"")+'" data-card="'+i+'" aria-label="Card '+esc(cardText(c))+'">'+esc(cardText(c))+'</button>').join("")):'';
    $("#hm-game-hand").querySelectorAll("[data-card]").forEach(b=>b.addEventListener("click",()=>{if(g&&g.variant==="fivecard"&&g.stage==="draw")toggleDiscard(Number(b.dataset.card));}));
    $("#hm-game-draw-hint").textContent=g&&g.variant==="fivecard"&&g.stage==="draw"?"Tap any cards you want to discard, then click Draw selected cards.":"";
    const buttons=$("#hm-game-actions");
    const inBetting=!!g&&!g.showdown&&g.stage==="betting";
    const inDraw=!!g&&!g.showdown&&g.variant==="fivecard"&&g.stage==="draw";
    buttons.querySelectorAll('[data-act="check"],[data-act="call"],[data-act="raise"],[data-act="fold"]').forEach(b=>{b.disabled=!inBetting;});
    buttons.querySelector('[data-act="draw"]').disabled=!inDraw;
    buttons.querySelector('[data-act="next"]').disabled=!(g&&g.showdown);
    $("#hm-game-seats").innerHTML=g?g.players.map(p=>{
      const result=g.results.find(x=>x.player.id===p.id);
      const reveal=p.id===0||g.showdown;
      const countDealt=g.stage==="dealing"?Math.max(0,Math.floor(g.dealProgress/g.players.length)+(p.id<g.dealProgress%g.players.length?1:0)):p.cards.length;
      const cardsShown=g.stage==="dealing"?p.cards.slice(0,countDealt).map((card,i)=>p.id===0?cardHTML(card):'<span class="hm-card-back">HM</span>').join(""):reveal?p.cards.map(cardHTML).join(""):p.cards.map(()=>'<span class="hm-card-back">HM</span>').join("");
      return '<div class="hm-player-row"><div class="hm-player-top"><strong>'+esc(p.name)+(p.id===0?" (you)":"")+'</strong><span>'+fmt(p.chips)+' chips</span></div><div class="hm-game-muted">'+(p.id===g.dealer?"DEALER · ":"")+(p.id===g.sb?"SMALL BLIND · ":"")+(p.id===g.bb?"BIG BLIND · ":"")+(p.folded?"Folded":p.allIn?"All-in":p.id===0?"Your seat":"Computer player")+(result?" · "+esc(result.value?result.value.name:result.kind)+" · won "+fmt(result.share||g.pot):"")+'</div><div class="hm-cards">'+cardsShown+'</div></div>';
    }).join(""):'<p class="hm-game-muted">Start a hand to seat the computer players.</p>';
  }
  function init(){styles();buildUI();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();