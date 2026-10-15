/* House Money poker table catalog — local prototype only.
 * Configuration is stored in this browser, not a shared server/database.
 * Never use client-side settings to calculate real-money rake or balances.
 */
(() => {
  const variants = [
    { key: "holdem", title: "Texas Hold'em", description: "Two hole cards · five community cards" },
    { key: "fivecard", title: "5-Card High / Low", description: "Five-card draw-style high/low demo" },
    { key: "fourstud", title: "4-Card Stud", description: "Four-card stud demo variant" },
    { key: "omaha", title: "Omaha", description: "Four hole cards · use exactly two" }
  ];
  const defaults = {};
  variants.forEach((v, group) => {
    for (let i = 1; i <= 4; i++) {
      const n = group * 4 + i;
      defaults["HM-" + String(n).padStart(2, "0")] = {
        id: "HM-" + String(n).padStart(2, "0"), variant: v.key,
        name: v.title + " Table " + i, enabled: true, rake: 5,
        minBuyIn: 100, maxBuyIn: 1000, minSmallBlind: 1, maxSmallBlind: 5,
        minBigBlind: 2, maxBigBlind: 10, rebuysEnabled: true,
        minRebuy: 100, maxRebuy: 1000
      };
    }
  });
  const STORE = "houseMoneyPokerTableSettingsV1";
  const getSettings = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || "{}");
      const result = {};
      Object.keys(defaults).forEach(id => result[id] = { ...defaults[id], ...(saved[id] || {}) });
      return result;
    } catch (_) { return structuredClone(defaults); }
  };
  let settings = getSettings();
  let activeFilter = "all";
  let selectedAdminId = "HM-01";
  let joinedId = null;
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  const fmt = n => Number(n).toLocaleString("en-US");
  const variantTitle = key => variants.find(v => v.key === key)?.title || key;
  const tableList = () => Object.values(settings);
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(settings)); return true; } catch (_) { return false; } };

  function ensureStyles() {
    if ($("#hm-tables-styles")) return;
    const style = document.createElement("style");
    style.id = "hm-tables-styles";
    style.textContent = `
      .hm-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 18px}
      .hm-filter{border:1px solid var(--line);background:var(--panel2);color:var(--muted);padding:9px 12px;border-radius:9px}
      .hm-filter.active{background:var(--gold);border-color:var(--gold);color:#171b24;font-weight:800}
      .hm-tables-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .hm-table-card{background:linear-gradient(160deg,#172238,#111827);border:1px solid var(--line);border-radius:13px;padding:15px;min-width:0}
      .hm-table-card h4{margin:0 0 3px;font-size:15px}.hm-table-meta{color:var(--muted);font-size:12px;margin-bottom:12px}
      .hm-table-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0 14px}
      .hm-table-stats div{background:#0d1423;border-radius:8px;padding:8px}.hm-table-stats small{display:block;color:var(--muted);font-size:10px}.hm-table-stats strong{font-size:13px}
      .hm-card-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
      .hm-admin-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .hm-field{display:flex;flex-direction:column;gap:5px;min-width:0}.hm-field label{font-size:12px;color:var(--muted)}
      .hm-field input,.hm-field select{width:100%;background:#0b1220;border:1px solid #35445f;color:var(--text);border-radius:8px;padding:10px;font:inherit;min-width:0}
      .hm-field input:focus,.hm-field select:focus{outline:2px solid var(--gold);outline-offset:1px}
      .hm-field.full{grid-column:1/-1}.hm-toggle{display:flex;align-items:center;gap:8px;padding:10px;background:#0b1220;border:1px solid #35445f;border-radius:8px}
      .hm-toggle input{width:auto}.hm-hint{font-size:12px;color:var(--muted)}.hm-alert{padding:10px 12px;border-radius:8px;margin:10px 0;font-size:12px}
      .hm-alert.ok{background:#12372d;color:#92edc7}.hm-alert.error{background:#402125;color:#ffb2b2}
      .hm-admin-list{display:flex;flex-direction:column;gap:8px}.hm-admin-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px;border:1px solid var(--line);border-radius:9px}
      .hm-admin-row strong{display:block}.hm-admin-row small{color:var(--muted)}
      .hm-account-form{display:grid;grid-template-columns:1fr 1.4fr auto;gap:10px;align-items:end;margin:12px 0}
      .hm-account-form input{width:100%;background:#0b1220;border:1px solid #35445f;color:var(--text);border-radius:8px;padding:10px;font:inherit}
      .hm-account-actions{display:flex;gap:7px;flex-wrap:wrap}.hm-account-actions button{padding:7px 10px;font-size:12px}
      .hm-account-status{font-size:10px;text-transform:uppercase;letter-spacing:.7px;border-radius:5px;padding:4px 7px;background:#3c2e19;color:#f0ca70}
      .hm-account-status.approved{background:#20392f;color:#79e0b8}.hm-account-status.rejected{background:#402125;color:#ffb2b2}
      @media(max-width:760px){.hm-tables-grid{grid-template-columns:1fr}.hm-admin-form{grid-template-columns:1fr}.hm-field.full{grid-column:auto}.hm-account-form{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function buildPokerRoom() {
    const page = $("#page-poker");
    if (!page) return;
    page.innerHTML = `
      <div class="hero"><div><div class="eyebrow">POKER MODULE · 16 TABLES</div><h2>Poker Room</h2><p>Four game groups with four tables in each. All play-money prototype tables.</p></div><span class="tag">16 tables configured</span></div>
      <div class="stats">
        <div class="stat"><small>Total tables</small><strong>16</strong><small>4 per game variant</small></div>
        <div class="stat"><small>Table configuration</small><strong>Per table</strong><small>Limits and rake can differ</small></div>
        <div class="stat"><small>Mode</small><strong style="font-size:20px">Play money</strong><small>No real funds or wagers</small></div>
      </div>
      <div class="hm-toolbar" id="hm-filters" aria-label="Filter tables">
        <button class="hm-filter active" data-filter="all">All 16 tables</button>
        <button class="hm-filter" data-filter="holdem">Texas Hold'em</button>
        <button class="hm-filter" data-filter="fivecard">5-Card High / Low</button>
        <button class="hm-filter" data-filter="fourstud">4-Card Stud</button>
        <button class="hm-filter" data-filter="omaha">Omaha</button>
      </div>
      <div id="hm-table-grid" class="hm-tables-grid"></div>
      <div id="hm-joined-panel" class="card hidden" style="margin-top:14px"></div>
      <div class="note">Table cards show configured rules only. Joining a table here is a local UI demo; multiplayer dealing, seat reservations, chip accounting, and server-authoritative game logic are not connected.</div>`;
    $("#hm-filters").addEventListener("click", e => {
      const b = e.target.closest("[data-filter]"); if (!b) return;
      activeFilter = b.dataset.filter;
      $("#hm-filters").querySelectorAll("button").forEach(x => x.classList.toggle("active", x === b));
      renderTables();
    });
    renderTables();
  }

  function renderTables() {
    const grid = $("#hm-table-grid"); if (!grid) return;
    const list = tableList().filter(t => activeFilter === "all" || t.variant === activeFilter);
    grid.innerHTML = list.map(t => `
      <article class="hm-table-card">
        <div class="hm-card-foot"><span class="tag">${esc(variantTitle(t.variant))}</span><span class="status"><span class="dot"></span>${t.enabled ? "Enabled for demo" : "Disabled"}</span></div>
        <h4 style="margin-top:12px">${esc(t.name)}</h4><div class="hm-table-meta">${esc(t.id)} · ${t.variant === "omaha" ? "4 hole cards" : t.variant === "holdem" ? "2 hole cards" : "Variant rules preview"}</div>
        <div class="hm-table-stats">
          <div><small>Demo rake setting</small><strong>${t.rake}%</strong></div>
          <div><small>Buy-in range</small><strong>${fmt(t.minBuyIn)}–${fmt(t.maxBuyIn)}</strong></div>
          <div><small>Small blind range</small><strong>${fmt(t.minSmallBlind)}–${fmt(t.maxSmallBlind)}</strong></div>
          <div><small>Big blind range</small><strong>${fmt(t.minBigBlind)}–${fmt(t.maxBigBlind)}</strong></div>
          <div><small>Rebuys</small><strong>${t.rebuysEnabled ? "On · " + fmt(t.minRebuy) + "–" + fmt(t.maxRebuy) : "Off"}</strong></div>
          <div><small>Table status</small><strong>${t.enabled ? "Available" : "Closed"}</strong></div>
        </div>
        <div class="hm-card-foot"><button class="btn" data-config="${esc(t.id)}">Configure in admin</button><button class="btn gold" data-join="${esc(t.id)}" ${t.enabled ? "" : "disabled"}>Open demo table</button></div>
      </article>`).join("");
    grid.querySelectorAll("[data-config]").forEach(b => b.addEventListener("click", () => {
      selectedAdminId = b.dataset.config; goToAdmin(); $("#hm-admin-table").value = selectedAdminId; fillForm(); renderAdminList();
    }));
    grid.querySelectorAll("[data-join]").forEach(b => b.addEventListener("click", () => joinDemo(b.dataset.join)));
  }

  function goToAdmin() {
    const adminNav = document.querySelector('[data-page="admin"]');
    if (adminNav) adminNav.click();
    const section = $("#hm-admin-settings");
    if (section) section.scrollIntoView({behavior:"smooth",block:"start"});
  }

  function joinDemo(id) {
    const t = settings[id]; if (!t || !t.enabled) return;
    joinedId = id;
    const panel = $("#hm-joined-panel"); if (!panel) return;
    panel.classList.remove("hidden");
    panel.innerHTML = `<div class="sectionhead" style="margin-top:0"><div><span class="eyebrow">LOCAL TABLE PREVIEW</span><h3 style="margin:4px 0">${esc(t.name)}</h3></div><span class="tag warn">Not multiplayer</span></div>
      <p class="muted">${esc(variantTitle(t.variant))} · Demo chips only. Buy-in range: ${fmt(t.minBuyIn)}–${fmt(t.maxBuyIn)}. Blind ranges: small ${fmt(t.minSmallBlind)}–${fmt(t.maxSmallBlind)}, big ${fmt(t.minBigBlind)}–${fmt(t.maxBigBlind)}.</p>
      <div class="hm-admin-form"><div class="hm-field"><label for="hm-demo-buyin">Choose demo buy-in</label><input id="hm-demo-buyin" type="number" min="${t.minBuyIn}" max="${t.maxBuyIn}" step="1" value="${t.minBuyIn}"></div><div class="hm-field"><label for="hm-demo-blinds">Choose demo blind level</label><select id="hm-demo-blinds">${blindOptions(t).map(x=>`<option value="${x.small}/${x.big}">${x.small}/${x.big} demo chips</option>`).join("")}</select></div></div>
      <button class="btn gold" id="hm-confirm-seat" style="margin-top:12px">Confirm local preview</button><p id="hm-seat-message" class="hm-hint" aria-live="polite">No seat or chips have been reserved.</p>`;
    $("#hm-confirm-seat").addEventListener("click", () => {
      const amount = Number($("#hm-demo-buyin").value);
      if (!Number.isInteger(amount) || amount < t.minBuyIn || amount > t.maxBuyIn) {
        $("#hm-seat-message").textContent = "Enter a whole-number demo buy-in within this table's limits."; return;
      }
      $("#hm-seat-message").textContent = "Local preview selected: " + fmt(amount) + " demo chips at " + $("#hm-demo-blinds").value + ". No account, seat, server game, or balance was changed.";
    });
    panel.scrollIntoView({behavior:"smooth",block:"nearest"});
  }

  function blindOptions(t) {
    const result = [];
    for (let small = t.minSmallBlind; small <= Math.min(t.maxSmallBlind, t.minSmallBlind + 9); small++) {
      const minBig = Math.max(t.minBigBlind, small * 2);
      if (minBig > t.maxBigBlind) continue;
      result.push({small, big:minBig});
    }
    if (!result.length) result.push({small:t.minSmallBlind,big:t.minBigBlind});
    return result;
  }

  function buildAdmin() {
    const page = $("#page-admin"); if (!page) return;
    const panel = document.createElement("div");
    panel.id = "hm-admin-settings";
    panel.className = "card";
    panel.style.marginTop = "14px";
    panel.innerHTML = `
      <div class="sectionhead" style="margin-top:0"><div><div class="eyebrow">TABLE MANAGEMENT</div><h3 style="margin:4px 0">Poker table settings</h3></div><span class="tag warn">Local prototype</span></div>
      <p class="hm-hint">Select any of the 16 tables to configure its rules. Changes save in this browser only. A real admin login and server-side permissions are required before shared or production use.</p>
      <div id="hm-admin-alert" class="hidden" role="status"></div>
      <div class="hm-admin-form">
        <div class="hm-field full"><label for="hm-admin-table">Table</label><select id="hm-admin-table"></select></div>
        <div class="hm-field"><label for="hm-table-name">Table display name</label><input id="hm-table-name" maxlength="60" required></div>
        <div class="hm-field"><label for="hm-table-variant">Game variant (fixed group)</label><input id="hm-table-variant" type="text" readonly></div>
        <div class="hm-field"><label for="hm-rake">Rake (%) — allowed 3–20</label><input id="hm-rake" type="number" min="3" max="20" step="0.5" required></div>
        <div class="hm-field"><label for="hm-enabled">Table availability</label><select id="hm-enabled"><option value="true">Enabled</option><option value="false">Disabled</option></select></div>
        <div class="hm-field"><label for="hm-min-buy">Minimum buy-in (demo chips)</label><input id="hm-min-buy" type="number" min="1" step="1" required></div>
        <div class="hm-field"><label for="hm-max-buy">Maximum buy-in (demo chips)</label><input id="hm-max-buy" type="number" min="1" step="1" required></div>
        <div class="hm-field"><label for="hm-min-sb">Minimum small blind</label><input id="hm-min-sb" type="number" min="1" step="1" required></div>
        <div class="hm-field"><label for="hm-max-sb">Maximum small blind</label><input id="hm-max-sb" type="number" min="1" step="1" required></div>
        <div class="hm-field"><label for="hm-min-bb">Minimum big blind</label><input id="hm-min-bb" type="number" min="2" step="1" required></div>
        <div class="hm-field"><label for="hm-max-bb">Maximum big blind</label><input id="hm-max-bb" type="number" min="2" step="1" required></div>
        <div class="hm-field full"><label class="hm-toggle"><input id="hm-rebuys" type="checkbox"> Allow rebuys on this table</label></div>
        <div class="hm-field"><label for="hm-min-rebuy">Minimum rebuy amount</label><input id="hm-min-rebuy" type="number" min="1" step="1" required></div>
        <div class="hm-field"><label for="hm-max-rebuy">Maximum rebuy amount</label><input id="hm-max-rebuy" type="number" min="1" step="1" required></div>
        <div class="hm-field full"><button id="hm-save-settings" class="btn gold" type="button">Save table settings</button></div>
      </div>
      <p class="hm-hint">Rake is displayed as a configuration value only; no rake is collected. All values are demo-chip rules until a vetted backend is built and approved.</p>
      <div class="sectionhead"><h3>All 16 table configurations</h3><span class="hm-hint">Choose a row to edit</span></div>
      <div class="hm-admin-list" id="hm-admin-table-list"></div>`;
    page.appendChild(panel);
    const selector = $("#hm-admin-table");
    selector.innerHTML = tableList().map(t=>`<option value="${t.id}">${t.id} — ${esc(t.name)}</option>`).join("");
    selector.value = selectedAdminId;
    selector.addEventListener("change", () => { selectedAdminId = selector.value; fillForm(); });
    $("#hm-save-settings").addEventListener("click", saveForm);
    $("#hm-rebuys").addEventListener("change", e => {
      $("#hm-min-rebuy").disabled = !e.target.checked;
      $("#hm-max-rebuy").disabled = !e.target.checked;
    });
    fillForm(); renderAdminList();
  }

  function fillForm() {
    const t = settings[selectedAdminId]; if (!t) return;
    $("#hm-admin-table").value = selectedAdminId;
    $("#hm-table-name").value = t.name;
    $("#hm-table-variant").value = variantTitle(t.variant);
    $("#hm-rake").value = t.rake;
    $("#hm-enabled").value = String(t.enabled);
    $("#hm-min-buy").value = t.minBuyIn; $("#hm-max-buy").value = t.maxBuyIn;
    $("#hm-min-sb").value = t.minSmallBlind; $("#hm-max-sb").value = t.maxSmallBlind;
    $("#hm-min-bb").value = t.minBigBlind; $("#hm-max-bb").value = t.maxBigBlind;
    $("#hm-rebuys").checked = !!t.rebuysEnabled;
    $("#hm-min-rebuy").value = t.minRebuy; $("#hm-max-rebuy").value = t.maxRebuy;
    $("#hm-min-rebuy").disabled = $("#hm-max-rebuy").disabled = !t.rebuysEnabled;
    showAlert("", "");
  }

  function val(id) { return Number($("#" + id).value); }
  function saveForm() {
    const name = $("#hm-table-name").value.trim();
    const rake = val("hm-rake"), minBuy = val("hm-min-buy"), maxBuy = val("hm-max-buy");
    const minSB = val("hm-min-sb"), maxSB = val("hm-max-sb"), minBB = val("hm-min-bb"), maxBB = val("hm-max-bb");
    const rebuy = $("#hm-rebuys").checked, minRebuy = val("hm-min-rebuy"), maxRebuy = val("hm-max-rebuy");
    const positiveInts = [minBuy,maxBuy,minSB,maxSB,minBB,maxBB];
    if (!name) return showAlert("Enter a table name.", "error");
    if (!Number.isFinite(rake) || rake < 3 || rake > 20) return showAlert("Rake must be between 3% and 20%.", "error");
    if (positiveInts.some(n => !Number.isInteger(n) || n < 1)) return showAlert("Buy-in and blind limits must be positive whole numbers.", "error");
    if (minBuy > maxBuy) return showAlert("Minimum buy-in cannot exceed maximum buy-in.", "error");
    if (minSB > maxSB) return showAlert("Minimum small blind cannot exceed maximum small blind.", "error");
    if (minBB > maxBB) return showAlert("Minimum big blind cannot exceed maximum big blind.", "error");
    if (minBB < minSB * 2 || maxBB < maxSB * 2) return showAlert("Each big-blind limit must be at least twice its matching small-blind limit.", "error");
    if (rebuy && (!Number.isInteger(minRebuy) || !Number.isInteger(maxRebuy) || minRebuy < 1 || minRebuy > maxRebuy)) return showAlert("Rebuy amounts must be positive whole numbers and minimum cannot exceed maximum.", "error");
    const current = settings[selectedAdminId];
    settings[selectedAdminId] = { ...current, name, rake,
      enabled:$("#hm-enabled").value === "true", minBuyIn:minBuy, maxBuyIn:maxBuy,
      minSmallBlind:minSB, maxSmallBlind:maxSB, minBigBlind:minBB, maxBigBlind:maxBB,
      rebuysEnabled:rebuy, minRebuy, maxRebuy };
    if (!save()) return showAlert("Browser storage could not save changes. Try another browser/device or check storage settings.", "error");
    showAlert("Saved " + selectedAdminId + " in this browser. This does not change server settings.", "ok");
    renderAdminList(); renderTables();
  }

  function showAlert(message, kind) {
    const box = $("#hm-admin-alert"); if (!box) return;
    box.textContent = message; box.className = message ? "hm-alert " + kind : "hidden";
  }

  function renderAdminList() {
    const list = $("#hm-admin-table-list"); if (!list) return;
    list.innerHTML = tableList().map(t => `<button type="button" class="hm-admin-row" data-edit="${t.id}" style="text-align:left;background:transparent;color:var(--text);width:100%">
      <span><strong>${esc(t.id)} · ${esc(t.name)}</strong><small>${esc(variantTitle(t.variant))} · ${t.enabled ? "Enabled" : "Disabled"} · Rake ${t.rake}%</small></span>
      <span class="muted">Edit →</span></button>`).join("");
    list.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => {
      selectedAdminId = b.dataset.edit; $("#hm-admin-table").value = selectedAdminId; fillForm();
      $("#hm-admin-settings").scrollIntoView({behavior:"smooth",block:"start"});
    }));
  }


  // Demo-only account approval queue. Production must enforce approval server-side.
  const ACCOUNT_STORE = "houseMoneyAccountApprovalDemoV1";
  const demoRequests = [
    { id:"demo-req-1001", name:"Demo Player One", email:"player.one@example.test", requestedAt:"Demo request", status:"pending" },
    { id:"demo-req-1002", name:"Demo Player Two", email:"player.two@example.test", requestedAt:"Demo request", status:"pending" }
  ];
  function getAccountRequests() {
    try {
      const saved = JSON.parse(localStorage.getItem(ACCOUNT_STORE) || "null");
      return Array.isArray(saved) ? saved : demoRequests.map(x=>({...x}));
    } catch (_) { return demoRequests.map(x=>({...x})); }
  }
  let accountRequests = getAccountRequests();
  function saveAccountRequests() {
    try { localStorage.setItem(ACCOUNT_STORE, JSON.stringify(accountRequests)); return true; }
    catch (_) { return false; }
  }
  function buildAccountApprovals() {
    const page = $("#page-admin"); if (!page || $("#hm-account-approvals")) return;
    const panel = document.createElement("section");
    panel.id = "hm-account-approvals";
    panel.className = "card";
    panel.style.marginTop = "14px";
    panel.innerHTML = `
      <div class="sectionhead" style="margin-top:0"><div><div class="eyebrow">ACCESS CONTROL</div><h3 style="margin:4px 0">New account approvals</h3></div><span class="tag warn">Demo queue</span></div>
      <p class="hm-hint">New signups must remain <strong>Pending</strong> until an authorized admin approves them. Pending and rejected users must not enter the poker room or use account features. This screen is a browser-only mock; it does not control actual logins yet.</p>
      <div class="hm-account-form">
        <div class="hm-field"><label for="hm-new-account-name">Test display name</label><input id="hm-new-account-name" maxlength="60" placeholder="Demo Player Three"></div>
        <div class="hm-field"><label for="hm-new-account-email">Test email</label><input id="hm-new-account-email" type="email" maxlength="254" placeholder="player.three@example.test"></div>
        <button id="hm-add-account-request" class="btn" type="button">Add test request</button>
      </div>
      <div id="hm-account-alert" class="hidden" role="status"></div>
      <div id="hm-account-list" class="hm-admin-list"></div>
      <p class="hm-hint" style="margin-top:12px">Approving here only changes the local demo queue. Production approval needs a server-side account status, authenticated admin permissions, audit records, and checks on every protected API route.</p>`;
    page.appendChild(panel);
    $("#hm-add-account-request").addEventListener("click", addAccountRequest);
    renderAccountRequests();
  }
  function addAccountRequest() {
    const name = $("#hm-new-account-name").value.trim();
    const email = $("#hm-new-account-email").value.trim().toLowerCase();
    const alert = $("#hm-account-alert");
    const show = (msg, kind) => { alert.textContent = msg; alert.className = "hm-alert " + kind; };
    if (!name) return show("Enter a test display name.", "error");
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) return show("Enter a valid test email address.", "error");
    if (accountRequests.some(r => r.email.toLowerCase() === email)) return show("A request for that email already exists.", "error");
    accountRequests.unshift({id:"demo-req-" + Date.now(), name, email, requestedAt:new Date().toLocaleString(), status:"pending"});
    if (!saveAccountRequests()) { accountRequests.shift(); return show("Could not save this demo request in browser storage.", "error"); }
    $("#hm-new-account-name").value = ""; $("#hm-new-account-email").value = "";
    show("Added a pending demo request. No real account was created.", "ok");
    renderAccountRequests();
  }
  function renderAccountRequests() {
    const list = $("#hm-account-list"); if (!list) return;
    if (!accountRequests.length) { list.innerHTML = '<p class="hm-hint">No demo account requests yet.</p>'; return; }
    list.innerHTML = accountRequests.map(r => `
      <div class="hm-admin-row">
        <span style="min-width:0"><strong>${esc(r.name)}</strong><small>${esc(r.email)} · ${esc(r.requestedAt)}</small></span>
        <span class="hm-account-status ${esc(r.status)}">${esc(r.status)}</span>
        <span class="hm-account-actions">
          ${r.status === "pending" ? `<button class="btn gold" type="button" data-account-action="approved" data-account-id="${esc(r.id)}">Approve</button><button class="btn" type="button" data-account-action="rejected" data-account-id="${esc(r.id)}">Reject</button>` : `<button class="btn" type="button" data-account-action="pending" data-account-id="${esc(r.id)}">Reset to pending</button>`}
        </span>
      </div>`).join("");
    list.querySelectorAll("[data-account-action]").forEach(b => b.addEventListener("click", () => {
      const request = accountRequests.find(r => r.id === b.dataset.accountId); if (!request) return;
      request.status = b.dataset.accountAction;
      if (!saveAccountRequests()) { request.status = "pending"; const a=$("#hm-account-alert"); a.textContent="Could not save the demo status in browser storage."; a.className="hm-alert error"; return; }
      const a=$("#hm-account-alert");
      a.textContent = request.status === "approved" ? "Demo request marked approved locally. No login permissions changed." : request.status === "rejected" ? "Demo request marked rejected locally. No real account was affected." : "Demo request reset to pending locally.";
      a.className="hm-alert ok";
      renderAccountRequests();
    }));
  }

  function patchOverview() {
    const tableStat = document.querySelector("#page-overview .stats .stat:nth-child(2) strong");
    if (tableStat) tableStat.textContent = "16";
  }

  function init() {
    ensureStyles();
    buildPokerRoom();
    buildAdmin();
    buildAccountApprovals();
    patchOverview();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
