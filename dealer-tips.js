/* Dealer tips — local play-money prototype only. No payments or real funds. */
(() => {
  "use strict";
  const SETTINGS_KEY = "houseMoneyDealerTipSettingsV1";
  const TOTALS_KEY = "houseMoneyDealerTipsDemoV1";
  const tables = [];
  const groups = [
    ["Texas Hold'em", 1], ["5-Card High / Low", 5],
    ["4-Card Stud", 9], ["Omaha", 13]
  ];
  groups.forEach(group => {
    for (let i = 0; i < 4; i++) {
      const n = group[1] + i;
      tables.push({ id: "HM-" + String(n).padStart(2, "0"), name: group[0] + " Table " + (i + 1) });
    }
  });
  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  const readStore = key => { try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch (_) { return {}; } };
  const getSettings = () => {
    const saved = readStore(SETTINGS_KEY);
    const result = {};
    tables.forEach(t => {
      const row = saved[t.id] || {};
      result[t.id] = {
        enabled: row.enabled !== false,
        min: Number.isSafeInteger(row.min) && row.min > 0 ? row.min : 1,
        max: Number.isSafeInteger(row.max) && row.max > 0 ? row.max : 100
      };
      if (result[t.id].min > result[t.id].max) result[t.id] = { enabled: true, min: 1, max: 100 };
    });
    return result;
  };
  let settings = getSettings();
  const getTotal = id => {
    const value = readStore(TOTALS_KEY)[id];
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  };
  const fmt = n => Number(n).toLocaleString("en-US");
  const tableOptions = () => tables.map(t => '<option value="' + t.id + '">' + esc(t.id + " — " + t.name) + '</option>').join("");

  function styles() {
    if ($("#hm-dealer-tip-styles")) return;
    const style = document.createElement("style");
    style.id = "hm-dealer-tip-styles";
    style.textContent = '.hm-tip-panel{margin-top:14px}.hm-tip-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.hm-tip-field{display:flex;flex-direction:column;gap:5px}.hm-tip-field label{font-size:12px;color:var(--muted)}.hm-tip-field input,.hm-tip-field select{width:100%;box-sizing:border-box;background:#0b1220;border:1px solid #35445f;color:var(--text);border-radius:8px;padding:10px;font:inherit}.hm-tip-note{font-size:12px;color:var(--muted)}@media(max-width:760px){.hm-tip-grid{grid-template-columns:1fr}}';
    document.head.appendChild(style);
  }

  function buildPlayerPanel() {
    const page = $("#page-poker");
    if (!page || $("#hm-dealer-tip-player")) return;
    const panel = document.createElement("section");
    panel.id = "hm-dealer-tip-player";
    panel.className = "card hm-tip-panel";
    panel.innerHTML = '<div class="sectionhead" style="margin-top:0"><div><div class="eyebrow">THANK YOUR DEALER</div><h3 style="margin:4px 0">Optional dealer tips</h3></div><span class="tag">Demo chips only</span></div>' +
      '<p class="hm-tip-note">Choose a table and enter an optional tip. This prototype records demo-chip totals in this browser only; no real money is sent to a dealer.</p>' +
      '<div class="hm-tip-grid"><div class="hm-tip-field"><label for="hm-tip-table">Poker table</label><select id="hm-tip-table">' + tableOptions() + '</select></div>' +
      '<div class="hm-tip-field"><label for="hm-tip-amount">Tip amount (demo chips)</label><input id="hm-tip-amount" type="number" min="1" step="1" value="1"></div>' +
      '<div class="hm-tip-field"><label for="hm-tip-total">Demo tips recorded for this table</label><input id="hm-tip-total" readonly value="0 demo chips"></div>' +
      '<div class="hm-tip-field" style="justify-content:end"><button class="btn gold" id="hm-tip-submit" type="button">Tip dealer with demo chips</button></div></div>' +
      '<p id="hm-tip-player-message" class="hm-tip-note" role="status" aria-live="polite">Tips are optional.</p>';
    page.appendChild(panel);
    $("#hm-tip-table").addEventListener("change", syncPlayerForm);
    $("#hm-tip-submit").addEventListener("click", submitTip);
    syncPlayerForm();
  }

  function syncPlayerForm() {
    const id = $("#hm-tip-table").value;
    const config = settings[id];
    $("#hm-tip-total").value = fmt(getTotal(id)) + " demo chips";
    $("#hm-tip-amount").min = String(config.min);
    $("#hm-tip-amount").max = String(config.max);
    $("#hm-tip-amount").value = String(config.min);
    $("#hm-tip-amount").disabled = !config.enabled;
    $("#hm-tip-submit").disabled = !config.enabled;
    $("#hm-tip-player-message").textContent = config.enabled
      ? "Optional tip range: " + fmt(config.min) + "–" + fmt(config.max) + " demo chips. No real funds move."
      : "Dealer tips are disabled for this table.";
  }

  function submitTip() {
    const id = $("#hm-tip-table").value;
    const config = settings[id];
    const amount = Number($("#hm-tip-amount").value);
    const message = $("#hm-tip-player-message");
    if (!config.enabled) { message.textContent = "Dealer tips are disabled for this table."; return; }
    if (!Number.isSafeInteger(amount) || amount < config.min || amount > config.max) {
      message.textContent = "Enter a whole-number tip between " + fmt(config.min) + " and " + fmt(config.max) + " demo chips."; return;
    }
    const totals = readStore(TOTALS_KEY);
    const next = getTotal(id) + amount;
    if (!Number.isSafeInteger(next)) { message.textContent = "Tip total is too large."; return; }
    totals[id] = next;
    try { localStorage.setItem(TOTALS_KEY, JSON.stringify(totals)); }
    catch (_) { message.textContent = "Could not save this demo tip in browser storage."; return; }
    $("#hm-tip-total").value = fmt(next) + " demo chips";
    message.textContent = "Recorded " + fmt(amount) + " demo chips for " + id + ". No real funds moved.";
  }

  function buildAdminPanel() {
    const page = $("#page-admin");
    if (!page || $("#hm-dealer-tip-admin")) return;
    const panel = document.createElement("section");
    panel.id = "hm-dealer-tip-admin";
    panel.className = "card hm-tip-panel";
    panel.innerHTML = '<div class="sectionhead" style="margin-top:0"><div><div class="eyebrow">TABLE MANAGEMENT</div><h3 style="margin:4px 0">Dealer tip settings</h3></div><span class="tag warn">Local prototype</span></div>' +
      '<p class="hm-tip-note">Configure optional demo-chip dealer tips for each table. These settings are stored in this browser and are not secure/shared production settings.</p>' +
      '<div class="hm-tip-grid"><div class="hm-tip-field"><label for="hm-tip-admin-table">Table</label><select id="hm-tip-admin-table">' + tableOptions() + '</select></div>' +
      '<div class="hm-tip-field"><label for="hm-tip-admin-enabled">Dealer tips</label><select id="hm-tip-admin-enabled"><option value="true">Enabled</option><option value="false">Disabled</option></select></div>' +
      '<div class="hm-tip-field"><label for="hm-tip-admin-min">Minimum tip (demo chips)</label><input id="hm-tip-admin-min" type="number" min="1" step="1" required></div>' +
      '<div class="hm-tip-field"><label for="hm-tip-admin-max">Maximum tip (demo chips)</label><input id="hm-tip-admin-max" type="number" min="1" step="1" required></div>' +
      '<div><button class="btn gold" id="hm-tip-admin-save" type="button">Save dealer tip settings</button></div></div>' +
      '<p id="hm-tip-admin-message" class="hm-tip-note" role="status" aria-live="polite">Settings apply only to this browser prototype.</p>';
    page.appendChild(panel);
    $("#hm-tip-admin-table").addEventListener("change", fillAdminForm);
    $("#hm-tip-admin-enabled").addEventListener("change", syncAdminFields);
    $("#hm-tip-admin-save").addEventListener("click", saveAdminForm);
    fillAdminForm();
  }

  function fillAdminForm() {
    const config = settings[$("#hm-tip-admin-table").value];
    $("#hm-tip-admin-enabled").value = String(config.enabled);
    $("#hm-tip-admin-min").value = String(config.min);
    $("#hm-tip-admin-max").value = String(config.max);
    syncAdminFields();
    $("#hm-tip-admin-message").textContent = "Settings apply only to this browser prototype.";
  }

  function syncAdminFields() {
    const disabled = $("#hm-tip-admin-enabled").value !== "true";
    $("#hm-tip-admin-min").disabled = disabled;
    $("#hm-tip-admin-max").disabled = disabled;
  }

  function saveAdminForm() {
    const id = $("#hm-tip-admin-table").value;
    const enabled = $("#hm-tip-admin-enabled").value === "true";
    const min = Number($("#hm-tip-admin-min").value);
    const max = Number($("#hm-tip-admin-max").value);
    if (enabled && (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || min < 1 || max < min)) {
      $("#hm-tip-admin-message").textContent = "Tip limits must be positive whole numbers and minimum cannot exceed maximum.";
      return;
    }
    settings[id] = { enabled, min: enabled ? min : settings[id].min, max: enabled ? max : settings[id].max };
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
    catch (_) { $("#hm-tip-admin-message").textContent = "Could not save settings in this browser."; return; }
    $("#hm-tip-admin-message").textContent = "Saved settings for " + id + " locally. Not a server-side permission or payment.";
    syncPlayerForm();
  }

  function init() {
    styles();
    buildPlayerPanel();
    buildAdminPanel();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();