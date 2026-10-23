/*
 * beikost-tracker — Lovelace-Karte für den Beikost-Tracker (Familie Gottschalk)
 *
 * Datenhaltung: eine lokale To-do-Liste (`todo.*`) je Kategorie bleibt der Speicher.
 *   - abgehakt  = "schon probiert"      (todo-Status completed)
 *   - Ja/Nein   = "mag sie es"          (todo-Beschreibung: "mag: ja" / "mag: nein")
 * Dadurch funktionieren Handy-App, HA-To-do-Dashboard, Assist und die native
 * To-do-Karte weiterhin mit denselben Daten.
 *
 * Einbindung: Datei nach /config/www/beikost/beikost-tracker.js, dann als Ressource
 *   /local/beikost/beikost-tracker.js  (Typ: JavaScript-Modul)
 *
 * Karte:
 *   type: custom:beikost-tracker
 *   title: Isabella · Beikost-Tracker      # optional
 *   lists:                                 # optional; sonst automatisch alle todo.beikost_*
 *     - entity: todo.beikost_obst
 *       name: Obst
 *       icon: mdi:fruit-cherries
 */

const VERSION = "1.0.0";
const ITEM_SUBSCRIBE = "todo/item/subscribe";
const CAT_PREFIX = "todo.beikost_";
const MAG_RE = /mag\s*:\s*(ja|nein)/i;

const I18N = {
  search: "Lebensmittel suchen …",
  add: "Neues Lebensmittel …",
  addBtn: "Hinzufügen",
  all: "Alle",
  open: "Noch offen",
  done: "Probiert",
  likes: "Mag sie",
  dislikes: "Mag sie nicht",
  yes: "Ja",
  no: "Nein",
  remove: "Eintrag löschen",
  hint: "✓ abgehakt = schon probiert · Ja/Nein = mag sie es",
  tried: "probiert",
  unknown: "Liste nicht verfügbar",
  empty: "Keine Einträge gefunden",
  noList: "Keine Beikost-Liste gefunden (todo.beikost_*)",
};

function norm(text) {
  return (text || "")
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss");
}

function magOf(item) {
  const match = MAG_RE.exec(item.description || "");
  if (!match) return null;
  return match[1].toLowerCase() === "ja";
}

function setMagInDescription(description, wants) {
  const cleaned = (description || "").replace(MAG_RE, "").replace(/\s{2,}/g, " ").trim();
  const value = `mag: ${wants ? "ja" : "nein"}`;
  return cleaned ? `${cleaned} · ${value}` : value;
}

class BeikostTrackerCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._config = null;
    this._items = {};        // entity_id -> [item]
    this._unsubs = {};       // entity_id -> unsubscribe
    this._subscribed = [];   // aktuell abonnierte entity_ids
    this._query = "";
    this._filter = "all";
    this._addCategory = null;
    this._busy = new Set();
    this._built = false;
  }

  static getStubConfig() {
    return { title: "Isabella · Beikost-Tracker" };
  }

  setConfig(config) {
    this._config = config || {};
    this._built = false;
  }

  connectedCallback() {
    this._render();
  }

  disconnectedCallback() {
    this._teardown();
  }

  _teardown() {
    Object.values(this._unsubs).forEach((fn) => {
      try { fn(); } catch (err) { /* egal */ }
    });
    this._unsubs = {};
    this._subscribed = [];
  }

  getCardSize() {
    return 12;
  }

  /** Anzeigename/Kategorie aus der Liste selbst ableiten. */
  _autoCategory(entityId) {
    const state = this._hass?.states?.[entityId];
    return {
      entity: entityId,
      name: (state?.attributes?.friendly_name || entityId).replace(/^Beikost\s*·\s*/, "").trim(),
    };
  }

  /**
   * Kategorien in Anzeigereihenfolge: `lists` aus der Konfiguration gibt die Reihenfolge
   * (samt eigenen Namen/Icons) vor; weitere vorhandene `todo.beikost_*`-Listen werden
   * hinten angehängt, damit neu angelegte Kategorien automatisch auftauchen.
   */
  _categories() {
    if (!this._hass) return [];
    const known = Object.keys(this._hass.states).filter((entityId) =>
      entityId.startsWith(CAT_PREFIX)
    );
    const configured = Array.isArray(this._config?.lists) ? this._config.lists : [];
    const ordered = configured
      .map((entry) => (typeof entry === "string" ? { entity: entry } : { ...entry }))
      .filter((entry) => entry.entity)
      .map((entry) => ({ ...this._autoCategory(entry.entity), ...entry }));
    if (this._config?.auto_add_missing === false) return ordered;
    const rest = known
      .filter((entityId) => !ordered.some((entry) => entry.entity === entityId))
      .sort()
      .map((entityId) => this._autoCategory(entityId));
    return [...ordered, ...rest];
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    const wanted = this._categories().map((cat) => cat.entity);
    const changed =
      wanted.length !== this._subscribed.length ||
      wanted.some((entityId) => !this._subscribed.includes(entityId));
    if (changed) this._subscribe(wanted);
    if (first || changed) this._built = false;
    if (this._built && !this._needsRender(hass)) return;
    this._render();
  }

  /** Neu rendern, wenn sich Zähler der Listen geändert haben (Fallback ohne Abo). */
  _needsRender(hass) {
    return this._categories().some((cat) => {
      const state = hass.states[cat.entity];
      return state && state.state !== this._lastStates?.[cat.entity];
    });
  }

  _subscribe(entityIds) {
    this._teardown();
    this._subscribed = [...entityIds];
    if (!this._hass) return;
    entityIds.forEach((entityId) => {
      this._hass.connection
        .subscribeMessage(
          (message) => {
            this._items[entityId] = message.items || [];
            this._render();
          },
          { type: ITEM_SUBSCRIBE, entity_id: entityId }
        )
        .then((unsub) => { this._unsubs[entityId] = unsub; })
        .catch((err) => console.warn("beikost-tracker: Abo fehlgeschlagen", entityId, err));
    });
  }

  _callService(service, data) {
    const key = `${data.entity_id}|${data.item || data.uid}`;
    if (this._busy.has(key)) return;
    this._busy.add(key);
    this._hass
      .callService("todo", service, data)
      .catch((err) => console.error("beikost-tracker:", service, err))
      .finally(() => this._busy.delete(key));
  }

  _toggleTried(cat, item) {
    this._callService("update_item", {
      entity_id: cat.entity,
      item: item.uid || item.summary,
      status: item.status === "completed" ? "needs_action" : "completed",
    });
  }

  _setMag(cat, item, wants) {
    this._callService("update_item", {
      entity_id: cat.entity,
      item: item.uid || item.summary,
      status: "completed",
      description: setMagInDescription(item.description, wants),
    });
  }

  _removeItem(cat, item) {
    this._callService("remove_item", {
      entity_id: cat.entity,
      item: item.uid || item.summary,
    });
  }

  _addItem(categoryName) {
    const input = this.shadowRoot.querySelector(".add-input");
    const select = this.shadowRoot.querySelector(".add-select");
    const name = (input?.value || "").trim();
    const entityId = select?.value || this._addCategory;
    if (!name || !entityId) return;
    this._callService("add_item", { entity_id: entityId, item: name });
    if (input) input.value = "";
    input?.focus();
    if (categoryName) this._addCategory = entityId;
  }

  /** sichtbare Einträge einer Kategorie nach Suche + Filter */
  _visibleItems(entityId) {
    const query = norm(this._query);
    return (this._items[entityId] || [])
      .filter((item) => {
        if (query && !norm(item.summary).includes(query)) return false;
        const tried = item.status === "completed";
        const mag = magOf(item);
        switch (this._filter) {
          case "open": return !tried;
          case "done": return tried;
          case "likes": return mag === true;
          case "dislikes": return mag === false;
          default: return true;
        }
      })
      .sort((a, b) => a.summary.localeCompare(b.summary, "de"));
  }

  _stats(items) {
    const tried = items.filter((item) => item.status === "completed").length;
    const likes = items.filter((item) => magOf(item) === true).length;
    const dislikes = items.filter((item) => magOf(item) === false).length;
    return { total: items.length, tried, likes, dislikes };
  }

  _render() {
    if (!this.shadowRoot) return;
    if (!this._hass || !this._config) return;
    const categories = this._categories();
    this._lastStates = {};
    categories.forEach((cat) => {
      const state = this._hass.states[cat.entity];
      if (state) this._lastStates[cat.entity] = state.state;
    });

    const allItems = categories.flatMap((cat) => this._items[cat.entity] || []);
    const total = this._stats(allItems);

    if (!this._built) {
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>`;
      const card = document.createElement("ha-card");
      card.innerHTML = `
        <div class="head">
          <div class="title"><ha-icon icon="mdi:baby-bottle-outline"></ha-icon><span class="title-text"></span></div>
          <div class="stats"></div>
        </div>
        <div class="toolbar">
          <div class="search">
            <ha-icon icon="mdi:magnify"></ha-icon>
            <input class="search-input" type="search" placeholder="${I18N.search}">
          </div>
          <div class="chips"></div>
        </div>
        <div class="addrow">
          <input class="add-input" type="text" placeholder="${I18N.add}">
          <select class="add-select"></select>
          <button class="add-btn">${I18N.addBtn}</button>
        </div>
        <div class="lists"></div>
        <div class="hint">${I18N.hint}</div>`;
      this.shadowRoot.appendChild(card);
      this._card = card;

      card.querySelector(".search-input").addEventListener("input", (ev) => {
        this._query = ev.target.value;
        this._render();
      });
      card.querySelector(".add-btn").addEventListener("click", () => this._addItem(true));
      card.querySelector(".add-input").addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") this._addItem(true);
      });
      card.querySelector(".add-select").addEventListener("change", (ev) => {
        this._addCategory = ev.target.value;
      });
      this._built = true;
    }

    this._card.querySelector(".title-text").textContent =
      this._config.title || "Beikost-Tracker";
    this._card.querySelector(".stats").textContent =
      `${total.tried}/${total.total} ${I18N.tried} · 👍 ${total.likes} · 👎 ${total.dislikes}`;

    const searchInput = this._card.querySelector(".search-input");
    if (searchInput.value !== this._query) searchInput.value = this._query;

    // Kategorie-Auswahl im Hinzufügen-Bereich
    const select = this._card.querySelector(".add-select");
    if (select.dataset.signature !== categories.map((c) => c.entity).join(",")) {
      select.innerHTML = "";
      categories.forEach((cat) => {
        const option = document.createElement("option");
        option.value = cat.entity;
        option.textContent = cat.name;
        select.appendChild(option);
      });
      select.dataset.signature = categories.map((c) => c.entity).join(",");
    }
    if (!this._addCategory || !categories.some((c) => c.entity === this._addCategory)) {
      this._addCategory = categories[0]?.entity || null;
    }
    select.value = this._addCategory || "";

    // Filter-Chips
    const chips = this._card.querySelector(".chips");
    const chipDefs = [
      ["all", I18N.all], ["open", I18N.open], ["done", I18N.done],
      ["likes", I18N.likes], ["dislikes", I18N.dislikes],
    ];
    chips.innerHTML = "";
    chipDefs.forEach(([key, label]) => {
      const chip = document.createElement("button");
      chip.className = `chip${this._filter === key ? " active" : ""}`;
      chip.textContent = label;
      chip.addEventListener("click", () => {
        this._filter = key;
        this._render();
      });
      chips.appendChild(chip);
    });

    // Kategorien + Einträge
    const container = this._card.querySelector(".lists");
    container.innerHTML = "";
    if (!categories.length) {
      container.innerHTML = `<div class="empty">${I18N.noList}</div>`;
      return;
    }
    categories.forEach((cat) => {
      const items = this._items[cat.entity] || [];
      const stats = this._stats(items);
      const state = this._hass.states[cat.entity];
      const section = document.createElement("section");
      section.className = "category";

      const head = document.createElement("div");
      head.className = "cat-head";
      head.innerHTML = `<ha-icon icon="${cat.icon || "mdi:food-apple-outline"}"></ha-icon>`;
      const name = document.createElement("span");
      name.className = "cat-name";
      name.textContent = cat.name;
      const counts = document.createElement("span");
      counts.className = "cat-counts";
      counts.textContent = state
        ? `${stats.tried}/${stats.total} ${I18N.tried} · 👍 ${stats.likes} · 👎 ${stats.dislikes}`
        : I18N.unknown;
      head.append(name, counts);
      section.appendChild(head);

      const visible = this._visibleItems(cat.entity);
      if (!visible.length) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = I18N.empty;
        section.appendChild(empty);
      }

      visible.forEach((item) => {
        const tried = item.status === "completed";
        const mag = magOf(item);
        const row = document.createElement("div");
        row.className = `row${tried ? " tried" : ""}`;

        const checkbox = document.createElement("button");
        checkbox.className = `check${tried ? " on" : ""}`;
        checkbox.title = I18N.done;
        checkbox.innerHTML = tried ? '<ha-icon icon="mdi:check"></ha-icon>' : "";
        checkbox.addEventListener("click", () => this._toggleTried(cat, item));

        const label = document.createElement("span");
        label.className = "food";
        label.textContent = item.summary;

        const yes = document.createElement("button");
        yes.className = `mag${mag === true ? " yes-on" : ""}`;
        yes.textContent = I18N.yes;
        yes.addEventListener("click", () => this._setMag(cat, item, true));

        const no = document.createElement("button");
        no.className = `mag${mag === false ? " no-on" : ""}`;
        no.textContent = I18N.no;
        no.addEventListener("click", () => this._setMag(cat, item, false));

        const del = document.createElement("button");
        del.className = "del";
        del.title = I18N.remove;
        del.innerHTML = '<ha-icon icon="mdi:trash-can-outline"></ha-icon>';
        del.addEventListener("click", () => {
          if (confirm(`"${item.summary}" aus "${cat.name}" löschen?`)) this._removeItem(cat, item);
        });

        row.append(checkbox, label, yes, no, del);
        section.appendChild(row);
      });

      container.appendChild(section);
    });
  }
}

const STYLE = `
  :host { display: block; }
  ha-card { padding: 12px 12px 6px; }
  .head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  .title { display: flex; align-items: center; gap: 6px; font-size: 1.15rem; font-weight: 600;
           color: var(--primary-text-color); }
  .stats { margin-left: auto; font-size: .85rem; color: var(--secondary-text-color); }
  .toolbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 10px 0 8px; }
  .search { display: flex; align-items: center; gap: 6px; flex: 1 1 220px;
            background: var(--secondary-background-color); border-radius: 10px; padding: 6px 10px; }
  .search input { border: 0; outline: 0; background: transparent; width: 100%;
                  font-size: .95rem; color: var(--primary-text-color); }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { border: 1px solid var(--divider-color); background: transparent; border-radius: 14px;
          padding: 4px 10px; font-size: .8rem; color: var(--secondary-text-color); cursor: pointer; }
  .chip.active { background: var(--primary-color); border-color: var(--primary-color);
                 color: var(--text-primary-color, #fff); }
  .addrow { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
  .addrow input, .addrow select { padding: 7px 9px; border-radius: 9px;
        border: 1px solid var(--divider-color); background: var(--card-background-color);
        color: var(--primary-text-color); font-size: .9rem; }
  .addrow input { flex: 1 1 160px; }
  .add-btn { border: 0; border-radius: 9px; padding: 7px 14px; cursor: pointer;
             background: var(--primary-color); color: var(--text-primary-color, #fff);
             font-size: .9rem; }
  .category { margin-top: 10px; }
  .cat-head { display: flex; align-items: center; gap: 6px; padding: 6px 2px 4px;
              border-bottom: 1px solid var(--divider-color);
              font-weight: 600; color: var(--primary-text-color); }
  .cat-name { flex: 1 1 auto; }
  .cat-counts { font-size: .78rem; font-weight: 400; color: var(--secondary-text-color); }
  .row { display: flex; align-items: center; gap: 8px; padding: 3px 0; }
  .food { flex: 1 1 auto; font-size: .95rem; color: var(--primary-text-color); }
  .row.tried .food { color: var(--secondary-text-color); }
  .check { width: 26px; height: 26px; flex: 0 0 26px; border-radius: 50%; cursor: pointer;
           border: 2px solid var(--divider-color); background: transparent; color: #fff;
           display: flex; align-items: center; justify-content: center; padding: 0; }
  .check.on { background: var(--success-color, #4caf50); border-color: var(--success-color, #4caf50); }
  .check ha-icon { --mdc-icon-size: 18px; }
  .mag { border: 1px solid var(--divider-color); background: transparent; border-radius: 8px;
         padding: 2px 9px; font-size: .8rem; cursor: pointer; color: var(--secondary-text-color); }
  .mag.yes-on { background: var(--success-color, #4caf50); border-color: var(--success-color, #4caf50);
                color: #fff; }
  .mag.no-on { background: var(--error-color, #db4437); border-color: var(--error-color, #db4437);
               color: #fff; }
  .del { border: 0; background: transparent; cursor: pointer; color: var(--secondary-text-color);
         display: flex; align-items: center; }
  .del ha-icon { --mdc-icon-size: 18px; }
  .empty { padding: 8px 2px; font-size: .85rem; color: var(--secondary-text-color); }
  .hint { margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--divider-color);
          font-size: .75rem; color: var(--secondary-text-color); }
`;

if (!customElements.get("beikost-tracker")) {
  customElements.define("beikost-tracker", BeikostTrackerCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "beikost-tracker")) {
  window.customCards.push({
    type: "beikost-tracker",
    name: "Beikost-Tracker",
    description: "Suchbare Beikost-Liste: abhaken (probiert) und Ja/Nein (mag sie es).",
    preview: false,
  });
}

console.info(`%c BEIKOST-TRACKER %c v${VERSION} `, "color:#fff;background:#4caf50", "color:#4caf50;background:#fff");
