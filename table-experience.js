/* House Money: casino-style felt table presentation for the local demo. */
(() => {
  "use strict";
  const $ = (s, r=document) => r.querySelector(s);
  function mount() {
    const panel = $("#hm-playable-game");
    if (!panel || panel.dataset.tableSkin === "ready") return;
    const main = $(".hm-game-grid > .hm-game-card", panel);
    const side = $(".hm-game-grid > .hm-game-card:nth-child(2)", panel);
    const seats = $("#hm-game-seats", panel);
    const board = $("#hm-game-board", panel);
    const pot = $("#hm-game-pot", panel);
    const hand = $("#hm-game-hand", panel);
    const message = $("#hm-game-message", panel);
    const stage = $("#hm-game-stage", panel);
    if (!main || !side || !seats || !board || !pot || !hand || !message) return;
    panel.dataset.tableSkin = "ready";
    const style = document.createElement("style");
    style.id = "hm-real-table-skin";
    style.textContent = `
      #hm-playable-game .hm-skin-hide{display:none!important}\n      #hm-playable-game{--felt:#07543f;--felt2:#0b7655;--rail:#4d3020;--rail2:#9a6b3d}
      #hm-playable-game .hm-game-grid{grid-template-columns:minmax(0,1.5fr) minmax(255px,.7fr);align-items:start}
      #hm-playable-game .hm-game-grid>.hm-game-card{background:linear-gradient(160deg,#141d2d,#0b1220);border-color:#34445b}
      #hm-playable-game .hm-game-fields{margin-bottom:14px}
      #hm-real-table{position:relative;isolation:isolate;min-height:550px;margin:14px 0 10px;padding:26px 16px 22px;border:12px solid var(--rail);border-radius:48% / 35%;background:radial-gradient(ellipse at 50% 42%,#13815b 0%,var(--felt) 62%,#043a2d 100%);box-shadow:inset 0 0 0 3px var(--rail2),inset 0 0 35px #001b14,0 12px 24px #0006;overflow:hidden}
      #hm-real-table:before{content:"HOUSE MONEY  •  PLAY MONEY TABLE";position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);text-align:center;font-size:clamp(11px,1.7vw,16px);letter-spacing:3px;font-weight:900;color:#ffffff12;pointer-events:none}
      #hm-real-table .hm-table-label{position:absolute;top:16px;left:50%;transform:translateX(-50%);font-size:10px;letter-spacing:1.4px;color:#d9f3e5b8;white-space:nowrap}
      #hm-real-table .hm-table-seat-list{position:absolute;inset:0}
      #hm-real-table .hm-player-row{position:absolute;width:clamp(118px,30%,190px);min-height:74px;padding:8px 10px;background:linear-gradient(145deg,#263449,#121b2a);border:1px solid #78869a;border-radius:12px;box-shadow:0 5px 14px #0007;text-align:center;z-index:2}
      #hm-real-table .hm-player-row:nth-child(1){left:50%;bottom:10px;transform:translateX(-50%);border-color:#e6bd59;box-shadow:0 0 0 2px #e6bd5933,0 5px 14px #0007}
      #hm-real-table .hm-player-row:nth-child(2){left:5%;top:28%;transform:translateY(-50%)}
      #hm-real-table .hm-player-row:nth-child(3){right:5%;top:28%;transform:translateY(-50%)}
      #hm-real-table .hm-player-row:nth-child(4){left:50%;top:12px;transform:translateX(-50%)}
      #hm-real-table .hm-player-top{font-size:12px;flex-direction:column;gap:1px}
      #hm-real-table .hm-player-top span{font-size:11px;color:#e8d8a6}
      #hm-real-table .hm-player-row .hm-game-muted{font-size:10px}
      #hm-real-table .hm-player-row .hm-cards{justify-content:center;min-height:0;margin-top:3px;gap:0}
      #hm-real-table .hm-player-row .hm-playing-card{min-width:23px;height:32px;font-size:11px;margin:1px;padding:0 2px;border-radius:4px}
      #hm-real-table .hm-player-row:not(:first-child) .hm-cards{display:none}
      #hm-real-table .hm-table-center{position:absolute;left:50%;top:47%;transform:translate(-50%,-50%);width:66%;display:flex;flex-direction:column;align-items:center;gap:8px;z-index:1}
      #hm-real-table .hm-pot-pill{display:inline-flex;align-items:center;gap:7px;border:1px solid #d4b66b99;background:#092d25d9;color:#f6e6b2;padding:5px 12px;border-radius:99px;font-size:12px;box-shadow:0 2px 8px #0003}
      #hm-real-table .hm-pot-dot{width:12px;height:12px;border-radius:50%;background:repeating-conic-gradient(#f5f5f5 0 12deg,#cf515a 12deg 24deg);border:1px solid white}
      #hm-real-table .hm-community{display:flex;flex-wrap:nowrap;justify-content:center;min-height:66px;gap:clamp(1px,.5vw,5px)}
      #hm-real-table .hm-community .hm-playing-card{min-width:clamp(27px,7vw,43px);height:clamp(40px,9vw,60px);font-size:clamp(12px,2vw,17px);margin:1px;padding:0 3px;border-radius:5px;box-shadow:0 3px 7px #001b14aa}
      #hm-real-table .hm-board-caption{font-size:10px;letter-spacing:1.2px;color:#d8eee4}
      #hm-real-table .hm-human-cards{position:absolute;bottom:100px;left:50%;transform:translateX(-50%);display:flex;justify-content:center;gap:2px;z-index:3}
      #hm-real-table .hm-human-cards .hm-playing-card{min-width:clamp(34px,8vw,47px);height:clamp(48px,10vw,66px);font-size:clamp(15px,2.5vw,20px);margin:0;padding:0 4px;border-radius:6px;box-shadow:0 4px 10px #001b14aa}
      #hm-real-table .hm-human-caption{position:absolute;bottom:80px;left:50%;transform:translateX(-50%);font-size:9px;letter-spacing:1.5px;color:#d8eee4;white-space:nowrap}
      #hm-real-table .hm-empty{font-size:11px;color:#d5eee2aa;text-align:center;padding:12px}
      #hm-real-table .hm-dealer-button{position:absolute;right:22%;bottom:26%;width:23px;height:23px;display:grid;place-items:center;background:#f8f5e9;color:#20252b;border-radius:50%;font-size:10px;font-weight:900;border:2px solid #b3b1a7;box-shadow:0 2px 5px #0005;z-index:2}
      #hm-real-table .hm-table-seat-list .hm-game-muted{line-height:1.3}
      #hm-playable-game .hm-game-actions button{transition:transform .12s,filter .12s}
      #hm-playable-game .hm-game-actions button:hover:not(:disabled){filter:brightness(1.12);transform:translateY(-1px)}
      #hm-playable-game .hm-game-actions button:disabled{opacity:.38;cursor:not-allowed}
      #hm-playable-game .hm-table-setup{display:flex;align-items:center;gap:8px;margin:0 0 8px;color:#9ba8be;font-size:11px}
      #hm-playable-game .hm-table-setup strong{color:#e6bd59}
      @media(max-width:850px){#hm-playable-game .hm-game-grid{grid-template-columns:1fr}#hm-real-table{min-height:515px;border-width:9px;padding:18px 8px}#hm-real-table .hm-player-row{width:31%;padding:7px 4px}#hm-real-table .hm-player-row:nth-child(2){left:2%}#hm-real-table .hm-player-row:nth-child(3){right:2%}#hm-real-table .hm-table-center{width:72%;top:46%}#hm-real-table .hm-human-cards{bottom:95px}#hm-real-table .hm-human-caption{bottom:75px}}
      @media(max-width:390px){#hm-real-table{min-height:490px}#hm-real-table .hm-player-row{width:34%}#hm-real-table .hm-player-row:nth-child(2){left:0}#hm-real-table .hm-player-row:nth-child(3){right:0}#hm-real-table .hm-player-top{font-size:10px}#hm-real-table .hm-table-center{width:78%}}
    `;
    document.head.appendChild(style);
    const setup = document.createElement("div");
    setup.className = "hm-table-setup";
    setup.innerHTML = '<span>TABLE</span> <strong id="hm-live-table-name">HM-01</strong><span>•</span><span>BLINDS <strong id="hm-live-blinds">5 / 10</strong></span><span>•</span><span>DEMO CHIPS</span>';
    const felt = document.createElement("div");
    felt.id = "hm-real-table";
    felt.setAttribute("aria-label","Poker table with player seats, community cards and your hand");
    felt.innerHTML = '<div class="hm-table-label">NO-LIMIT PRACTICE · DEMO CHIPS ONLY</div><div class="hm-table-seat-list"></div><div class="hm-table-center"><div class="hm-pot-pill"><span class="hm-pot-dot"></span><span id="hm-live-pot">POT 0</span></div><div class="hm-board-caption">COMMUNITY CARDS</div><div class="hm-community"></div></div><div class="hm-dealer-button" title="Dealer button">D</div><div class="hm-human-caption">YOUR HAND</div><div class="hm-human-cards"></div>';
    const community = $(".hm-community", felt);
    const humanCards = $(".hm-human-cards", felt);
    const seatList = $(".hm-table-seat-list", felt);
    const setupParent = main.querySelector(".hm-game-fields");
    setupParent.insertAdjacentElement("afterend", setup);
    setup.insertAdjacentElement("afterend", felt);
    seatList.appendChild(seats);
    seats.classList.add("hm-table-seat-list-inner");
    community.appendChild(board);
    humanCards.appendChild(hand);
    // Keep the existing engine's live elements as the source of truth; visually relocate them.
    main.querySelectorAll(".sectionhead").forEach(head => {
      const label = head.textContent.toLowerCase();
      if (label.includes("community cards") || label.includes("your cards")) head.classList.add("hm-skin-hide");
    });
    const drawHint = $("#hm-game-draw-hint", main);
    if (drawHint) felt.appendChild(drawHint);
    pot.classList.add("hm-skin-hide");
    message.insertAdjacentElement("afterend", main.querySelector("#hm-game-actions"));
    const sync = () => {
      const table = $("#hm-game-table", panel);
      const blinds = $("#hm-game-blinds", panel);
      $("#hm-live-table-name", panel).textContent = table ? table.value : "HM-01";
      $("#hm-live-blinds", panel).textContent = blinds ? blinds.value.replace("/", " / ") : "5 / 10";
      const sourcePot = pot.textContent.replace(/^Pot:\s*/,"POT ");
      $("#hm-live-pot", panel).textContent = sourcePot;
      const hasBoard = board.children.length > 0 && !board.textContent.includes("Community cards appear here");
      $(".hm-board-caption", felt).textContent = hasBoard ? "COMMUNITY CARDS" : "COMMUNITY CARDS · WAITING FOR DEAL";
      if (!hand.children.length) humanCards.innerHTML = '<div class="hm-empty">Start a hand to receive your cards</div>';
      else if (humanCards.querySelector(".hm-empty")) humanCards.querySelector(".hm-empty").remove();
      // Keep draw-card selection clicks and existing event handlers intact.
    };
    const observer = new MutationObserver(sync);
    observer.observe(panel,{subtree:true,childList:true,characterData:true,attributes:true});
    panel.addEventListener("change",sync);
    sync();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",mount);
  else mount();
  const retry = new MutationObserver(() => { if ($("#hm-playable-game")) mount(); });
  if (document.documentElement) retry.observe(document.documentElement,{subtree:true,childList:true});
})();