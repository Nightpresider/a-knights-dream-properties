// A Knights Dream Properties - damageTypeCardColors.mjs
// Compatible with: Foundry VTT 14+, DND5E system
//
// Visual customization of dnd5e's (and midi-qol's, which reuses the same classes) damage-type
// breakdown rows on attack/damage chat cards: de-emphasizes the type name to a hover-only label,
// recolors each type's icon (GM-configurable), and overlays a value badge on the always-visible
// collapsed icon. Also includes a "hide damage on a miss" toggle and a resistance/immunity math
// tooltip on the Apply Damage tray.

const MODULE_ID = "a-knights-dream-properties";
const SETTING_KEY = "damageTypeCardColors";

// Physical types default to greyscale; elemental/other types match traditional associations.
const DEFAULT_COLORS = {
  acid: "#f5a623",
  bludgeoning: "#666666",
  cold: "#3498db",
  fire: "#e63c2f",
  force: "#999999",
  lightning: "#f1c40f",
  necrotic: "#141414",
  piercing: "#aaaaaa",
  poison: "#27ae60",
  psychic: "#8e44ad",
  radiant: "#f0ece0",
  slashing: "#888888",
  thunder: "#7f9bb3"
};

export function getDamageTypeColors() {
  const overrides = game.settings.get(MODULE_ID, SETTING_KEY) ?? {};
  return foundry.utils.mergeObject(DEFAULT_COLORS, overrides, { inplace: false });
}

// Global display options, pushed as CSS custom properties on :root so every icon/badge picks
// them up via inheritance instead of needing a DOM re-scan per change.
const DISPLAY_SETTING_KEY = "cardIconDisplayOptions";
const DEFAULT_DISPLAY_OPTIONS = {
  iconSize: 1.6, badgeFontSize: 1.2, badgeOpacity: 0.5, badgeColor: "#ffffff",
  // Actor sheet Inventory tab's weapon-row damage icon (applyInventoryIconStyling below) -
  // separate from the chat-card options above, which only affect chat messages.
  inventoryIconOpacity: 0.5, inventoryIconColorEnabled: true
};

export function getDisplayOptions() {
  const overrides = game.settings.get(MODULE_ID, DISPLAY_SETTING_KEY) ?? {};
  return foundry.utils.mergeObject(DEFAULT_DISPLAY_OPTIONS, overrides, { inplace: false });
}

function applyDisplayOptionsToRoot() {
  const opts = getDisplayOptions();
  const root = document.documentElement.style;
  root.setProperty("--akd-icon-size", `${opts.iconSize}em`);
  root.setProperty("--akd-badge-font-size", `${opts.badgeFontSize}em`);
  root.setProperty("--akd-badge-opacity", String(opts.badgeOpacity));
  root.setProperty("--akd-badge-color", opts.badgeColor);
}

// Top-level setting (not a sub-window field) - mirrors rollBreakdown.mjs's off/players/all pattern.
const HIDE_ON_MISS_SETTING = "hideDamageOnMiss";

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, SETTING_KEY, {
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });

  game.settings.register(MODULE_ID, DISPLAY_SETTING_KEY, {
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });

  game.settings.register(MODULE_ID, HIDE_ON_MISS_SETTING, {
    name: "AKDP.CardColors.HideDamageOnMiss.Name",
    hint: "AKDP.CardColors.HideDamageOnMiss.Hint",
    scope: "world",
    config: true,
    type: String,
    choices: {
      off: "AKDP.CardColors.HideDamageOnMiss.Off",
      players: "AKDP.CardColors.HideDamageOnMiss.Players",
      all: "AKDP.CardColors.HideDamageOnMiss.All"
    },
    default: "off"
  });
});

Hooks.once("ready", applyDisplayOptionsToRoot);

// -- Settings menu ------------------------------------------------------------------------------
class AKDCardColorsConfig extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "akd-card-colors",
      title: game.i18n.localize("AKDP.CardColors.Title"),
      template: `modules/${MODULE_ID}/templates/damage-type-card-colors-config.html`,
      width: 500,
      height: 780
    });
  }

  getData() {
    const colors = getDamageTypeColors();
    const types = Object.keys(DEFAULT_COLORS).map(key => ({
      key,
      label: game.i18n.localize(CONFIG.DND5E.damageTypes[key]?.label ?? key),
      color: colors[key],
      icon: CONFIG.DND5E.damageTypes[key]?.icon
    }));
    return { types, display: getDisplayOptions() };
  }

  // Each swatch button is that type's own icon (or a "#" glyph for the badge-color field),
  // recolored live via a visually-hidden <input type="color"> it forwards clicks to.
  async activateListeners(html) {
    super.activateListeners(html);

    for (const button of html[0].querySelectorAll(".akd-card-colors-swatch")) {
      const input = button.parentElement.querySelector('input[type="color"]');
      if (!input) continue;

      const src = button.dataset.iconSrc;
      if (src) {
        try {
          button.innerHTML = await fetchIconSvg(src);
          const svg = button.querySelector("svg");
          if (svg) svg.style.setProperty("--icon-fill", input.value);
        } catch (err) {
          console.warn(`[${MODULE_ID}] damageTypeCardColors: failed to load swatch icon "${src}"`, err);
        }
      } else {
        button.textContent = "#";
        button.style.color = input.value;
      }

      button.addEventListener("click", () => input.click());
      input.addEventListener("input", () => {
        const svg = button.querySelector("svg");
        if (svg) svg.style.setProperty("--icon-fill", input.value);
        else button.style.color = input.value;
      });
    }

    html.find("[data-action='reset-color']").on("click", event => {
      const row = event.currentTarget.closest("[data-type-key]");
      const key = row?.dataset.typeKey;
      const input = row?.querySelector(`input[name="${key}"]`);
      if (input) {
        input.value = DEFAULT_COLORS[key];
        input.dispatchEvent(new Event("input"));
      }
    });

    // Live-previews to :root while dragging, the same custom properties every card's CSS reads.
    // (The inventory-icon-opacity slider has nothing in this dialog to visibly preview against -
    // its actual effect only applies to actor sheets on Save, via refreshAllVisibleInventoryIcons.)
    const PLAIN_NUMBER_KEYS = new Set(["badge-opacity", "inventory-icon-opacity"]);
    for (const slider of html[0].querySelectorAll("[data-display-key]")) {
      const displayKey = slider.dataset.displayKey;
      const valueLabel = slider.parentElement.querySelector(".akd-slider-value");
      const apply = () => {
        if (valueLabel) valueLabel.textContent = slider.value;
        document.documentElement.style.setProperty(`--akd-${displayKey}`,
          PLAIN_NUMBER_KEYS.has(displayKey) ? slider.value : `${slider.value}em`);
      };
      slider.addEventListener("input", apply);
    }

    html.find("[data-action='reset-display']").on("click", event => {
      const key = event.currentTarget.dataset.resetKey;
      const slider = html[0].querySelector(`[name="${key}"]`);
      if (slider) {
        slider.value = DEFAULT_DISPLAY_OPTIONS[key.slice(1)];
        slider.dispatchEvent(new Event("input"));
      }
    });
  }

  async _updateObject(event, formData) {
    const overrides = {};
    const display = {};
    for (const [key, value] of Object.entries(formData)) {
      if (key.startsWith("_")) {
        // badgeColor is a hex string, inventoryIconColorEnabled a checkbox boolean; every
        // other display field is numeric.
        const displayKey = key.slice(1);
        display[displayKey] = displayKey === "badgeColor" ? value
          : displayKey === "inventoryIconColorEnabled" ? !!value
          : Number(value);
      } else if (value && value.toLowerCase() !== DEFAULT_COLORS[key]) {
        overrides[key] = value;
      }
    }
    await game.settings.set(MODULE_ID, SETTING_KEY, overrides);
    await game.settings.set(MODULE_ID, DISPLAY_SETTING_KEY, display);
    ui.notifications?.info(game.i18n.localize("AKDP.CardColors.Saved"));
  }
}

Hooks.once("ready", () => {
  game.settings.registerMenu(MODULE_ID, "cardColorsMenu", {
    name: "AKDP.CardColors.MenuName",
    label: "AKDP.CardColors.MenuLabel",
    hint: "AKDP.CardColors.MenuHint",
    icon: "fas fa-palette",
    type: AKDCardColorsConfig,
    restricted: true
  });
});

// -- Chat card recoloring -------------------------------------------------------------------

let iconSrcToType = null;
function getIconSrcToType() {
  if (iconSrcToType) return iconSrcToType;
  iconSrcToType = new Map();
  for (const [key, cfg] of Object.entries(CONFIG.DND5E.damageTypes)) {
    if (cfg.icon) iconSrcToType.set(cfg.icon, key);
  }
  return iconSrcToType;
}

const svgCache = new Map();

async function fetchIconSvg(src) {
  let svgText = svgCache.get(src);
  if (svgText) return svgText;
  const response = await fetch(src);
  svgText = await response.text();
  svgCache.set(src, svgText);
  return svgText;
}

// dnd5e's per-row icon is a plain <img>; CSS can't recolor it exactly, so this swaps it for an
// inline <svg> - whose fill is keyed to --icon-fill internally, not a plain fill attribute.
async function recolorNativeIcon(img, type, color) {
  let svgText;
  try {
    svgText = await fetchIconSvg(img.getAttribute("src"));
  } catch (err) {
    console.warn(`[${MODULE_ID}] damageTypeCardColors: failed to fetch icon "${img.getAttribute("src")}"`, err);
    return;
  }
  if (!img.isConnected) return;

  const wrapper = document.createElement("span");
  wrapper.classList.add("akd-damage-type-icon");
  wrapper.dataset.damageType = type; // lets refreshAllVisibleCards() recolor without refetching
  wrapper.innerHTML = svgText;
  const svg = wrapper.querySelector("svg");
  if (!svg) return;
  svg.style.setProperty("--icon-fill", color);
  img.replaceWith(wrapper);
}

// midi-qol often builds a message's damage HTML progressively into an existing card, after
// renderChatMessageHTML already fired - a MutationObserver below re-runs this as content appears.
function applyCardStyling(message, root) {
  const colors = getDamageTypeColors();
  const srcToType = getIconSrcToType();

  for (const img of root.querySelectorAll(".dice-tooltip .tooltip-part .total > img")) {
    const type = srcToType.get(img.getAttribute("src"));
    const color = type && colors[type];
    if (color) recolorNativeIcon(img, type, color);
  }

  applyTermSourceLabels(message, root);
  applyCollapsedTypeBadges(message, root, srcToType, colors);
  balanceCollapsedIcons(root);
  applyMissHiding(message, root);
}

// Centers the grand total in .dice-total with icons spread evenly left/right of it, via flexbox
// order rather than moving anything in the DOM: the total's bare text node gets wrapped so order
// can apply to it too (order:0 keeps it centered), and icons alternate order -1,1,-2,2...
// spreading outward on each side without ever landing on 0. Re-run by the same observer that
// catches applyCollapsedTypeBadges' async icon replacement, so it settles once those wrappers
// actually exist.
function balanceCollapsedIcons(root) {
  for (const totalEl of root.querySelectorAll(".dice-result .dice-total")) {
    const wrappers = totalEl.querySelectorAll(".akd-collapsed-badge-wrapper");
    if (!wrappers.length) continue;

    if (!totalEl.querySelector(".akd-total-number")) {
      for (const node of Array.from(totalEl.childNodes)) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          const span = document.createElement("span");
          span.classList.add("akd-total-number");
          totalEl.insertBefore(span, node);
          span.appendChild(node);
        }
      }
    }

    // Single type: the icon is a background watermark behind the total (CSS handles the
    // centering/layering) rather than a flex sibling spread out beside it.
    const singleIcon = wrappers.length === 1 ? totalEl.querySelector(".akd-single-damage-icon") : null;
    totalEl.classList.toggle("akd-single-damage-total", !!singleIcon);
    if (singleIcon) continue;

    wrappers.forEach((wrapper, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      const magnitude = Math.floor(i / 2) + 1;
      wrapper.style.order = side * magnitude;
    });
  }
}

// midi-qol pre-rolls damage even on a miss. Hides just the damage roll(s) + Apply Damage tray,
// per a world setting (off/players/all). isSuccess is only reliable for a single target, so
// multi-target attacks are left alone rather than risk hiding a real hit.
function applyMissHiding(message, root) {
  const mode = game.settings.get(MODULE_ID, HIDE_ON_MISS_SETTING);
  if (mode === "off") return;
  if (mode === "players" && game.user.isGM) return;

  const attackRoll = message.rolls?.find(r => r instanceof CONFIG.Dice.D20Roll);
  if (attackRoll?.isSuccess !== false) return;

  const rollEls = root.querySelectorAll(".dice-roll");
  message.rolls?.forEach((roll, i) => {
    if (roll instanceof CONFIG.Dice.DamageRoll) rollEls[i]?.classList.add("akd-damage-hidden-on-miss");
  });

  root.querySelector("damage-application")?.classList.add("akd-damage-hidden-on-miss");
}

// midi-qol's aggregate icon (a <dnd5e-icon>, closed shadow root) sits outside the collapsible
// tooltip, so it's visible even collapsed. Centering a badge against it directly runs into its
// closed shadow-DOM internals, so this replaces it with a plain inline <svg> instead - the same
// recolor-by-replacement technique already used for the per-row icons (recolorNativeIcon).
async function applyCollapsedTypeBadges(message, root, srcToType, colors) {
  const typeValues = new Map();
  for (const roll of message.rolls ?? []) {
    if (!(roll instanceof CONFIG.Dice.DamageRoll)) continue;
    const type = roll.options?.type;
    if (!type) continue;
    typeValues.set(type, (typeValues.get(type) ?? 0) + roll.total);
  }
  if (!typeValues.size) return;

  // A single damage type already has its total shown once by dnd5e's own native number -
  // a small badge on the icon too would just duplicate it. Instead the icon sits behind that
  // same number as a centered watermark (see balanceCollapsedIcons), and gets no badge at all.
  const isSingleType = typeValues.size === 1;

  for (const icon of root.querySelectorAll("dnd5e-icon.midi-damage-type-icon")) {
    if (icon.closest(".akd-collapsed-badge-wrapper")) continue;

    const type = srcToType.get(icon.getAttribute("src"));
    const value = type !== undefined ? typeValues.get(type) : undefined;
    if (value === undefined) continue;

    let svgText;
    try {
      svgText = await fetchIconSvg(icon.getAttribute("src"));
    } catch (err) {
      console.warn(`[${MODULE_ID}] damageTypeCardColors: failed to fetch icon "${icon.getAttribute("src")}"`, err);
      continue;
    }
    if (!icon.isConnected) continue;

    const wrapper = document.createElement("span");
    wrapper.classList.add("akd-collapsed-badge-wrapper");
    if (isSingleType) wrapper.classList.add("akd-single-damage-icon");
    wrapper.dataset.damageType = type; // for refreshAllVisibleCards() to recolor without refetching
    icon.replaceWith(wrapper);
    wrapper.innerHTML = svgText;
    const svg = wrapper.querySelector("svg");
    const color = colors[type];
    if (svg && color) svg.style.setProperty("--icon-fill", color);

    if (!isSingleType) {
      const badge = document.createElement("span");
      badge.classList.add("akd-collapsed-badge");
      badge.textContent = value;
      wrapper.appendChild(badge);
    }
  }
}

Hooks.on("renderChatMessageHTML", (message, html) => {
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root) return;

  applyCardStyling(message, root);
  new MutationObserver(() => applyCardStyling(message, root)).observe(root, { childList: true, subtree: true });

  const tray = root.querySelector("damage-application");
  if (tray) watchDamageApplicationTray(message, tray);
});

// Re-colors already-rendered cards in place when settings are saved, instead of waiting for the
// next render/mutation.
function refreshAllVisibleCards() {
  const colors = getDamageTypeColors();

  for (const wrapper of document.querySelectorAll(".akd-damage-type-icon[data-damage-type]")) {
    const color = colors[wrapper.dataset.damageType];
    const svg = wrapper.querySelector("svg");
    if (svg && color) svg.style.setProperty("--icon-fill", color);
  }

  for (const wrapper of document.querySelectorAll(".akd-collapsed-badge-wrapper[data-damage-type]")) {
    const color = colors[wrapper.dataset.damageType];
    const svg = wrapper.querySelector("svg");
    if (svg && color) svg.style.setProperty("--icon-fill", color);
  }

  for (const el of document.querySelectorAll("[data-message-id]")) {
    const message = game.messages.get(el.dataset.messageId);
    if (message) applyCardStyling(message, el);
  }
}

// -- Actor sheet Inventory tab weapon-row damage icon --------------------------------------

// dnd5e's own formula.hbs renders the formula text and its damage-type icon as plain flex
// siblings, the icon tiny and easy to miss. Restyled as a semi-transparent background watermark
// sitting BEHIND the formula (akd-inventory-formula-row/-icon-wrap in itemPropStyles.css overlay
// both in the same CSS Grid cell), sized per-row in JS below rather than via CSS percentages -
// see itemPropStyles.css for why. dnd5e-icon's shadow-DOM svg reads --icon-fill/--icon-size
// custom properties directly, so no fetch-and-replace-with-inline-svg trick is needed here.
function applyInventoryIconStyling(el) {
  const opts = getDisplayOptions();
  const colors = opts.inventoryIconColorEnabled ? getDamageTypeColors() : null;
  const srcToType = getIconSrcToType();

  for (const row of el.querySelectorAll('.tab[data-tab="inventory"] .item-detail.item-formula .row')) {
    const formula = row.querySelector(".formula");
    // Locate the wrap FROM the icon, not the other way around - a row can carry more than one
    // [data-tooltip] element (e.g. a properties tooltip alongside the damage-type one), and
    // grabbing the first match in DOM order risked binding iconWrap to one that isn't actually
    // the icon's own wrapper, leaving `icon` null and silently skipping the whole row.
    const icon = row.querySelector("dnd5e-icon");
    const iconWrap = icon?.closest("[data-tooltip]") ?? icon?.parentElement;
    if (!formula || !iconWrap || !icon) continue;

    row.classList.add("akd-inventory-formula-row");
    iconWrap.classList.add("akd-inventory-formula-icon-wrap");

    // Formula's own rendered height is unaffected by the icon overlaid behind it, so measuring
    // it here and pushing it into the icon as a fixed px value scales the icon to match the row
    // without the two ever influencing each other's size (see itemPropStyles.css for why a pure
    // CSS percentage-height approach isn't safe here).
    const rowHeight = formula.getBoundingClientRect().height;
    if (rowHeight > 0) {
      icon.style.setProperty("--icon-height", `${rowHeight}px`);
      icon.style.setProperty("--icon-width", "auto");
    }

    const type = srcToType.get(icon.getAttribute("src"));
    const color = colors?.[type];
    icon.style.setProperty("--icon-fill", color ?? "");
    icon.style.opacity = String(opts.inventoryIconOpacity);
  }
}

// <dnd5e-inventory> patches individual item rows in place (tab activation, item updates, etc.)
// without necessarily going through a full ApplicationV2 render cycle, so renderActorSheet alone
// can miss rows that appear/get replaced afterward - same class of problem already solved for
// chat cards above via a MutationObserver. Only watches for childList changes (row insertion/
// replacement), never attributes, so this function's own classList/style writes below can't
// re-trigger it.
const observedInventoryRoots = new WeakSet();
function watchInventoryFormulaRows(root) {
  if (observedInventoryRoots.has(root)) return;
  observedInventoryRoots.add(root);
  new MutationObserver(() => applyInventoryIconStyling(root)).observe(root, { childList: true, subtree: true });
}

// "renderActorSheet" is NOT a real hook name here - Foundry's ApplicationV2 fires
// render<ActualClassName> (e.g. whatever dnd5e's character sheet class is literally called in
// this version), never a generic base name, so a plain Hooks.on("renderActorSheet", ...) never
// fires at all. Same discovery armor-weight-class's hooks.js already made; mirrors its fix of
// introspecting CONFIG.Actor.sheetClasses and walking the prototype chain to find every real
// hook name to listen for, instead of guessing one.
Hooks.once("ready", () => {
  const seen = new Set();

  function register(cls) {
    const name = cls?.name;
    if (!name || seen.has(name)) return;
    seen.add(name);
    Hooks.on(`render${name}`, (app, html) => {
      let actor;
      try {
        actor = app.actor ?? app.document;
      } catch {
        return;
      }
      if (actor?.type !== "character" || actor.sheet !== app) return;

      // ApplicationV2 sheets render in independent parts and fire this once per part - app.element
      // is always the full, current sheet regardless of which part just re-rendered, so a
      // part-render that doesn't happen to include the Inventory tab (the raw `html` argument for
      // that firing) would otherwise leave every row's icon untouched.
      const root = app.element instanceof HTMLElement ? app.element : (html instanceof HTMLElement ? html : html?.[0]);
      if (!root) return;
      applyInventoryIconStyling(root);
      watchInventoryFormulaRows(root);
    });
  }

  for (const sheets of Object.values(CONFIG.Actor?.sheetClasses ?? {})) {
    for (const entry of Object.values(sheets)) {
      register(entry.cls);
      let proto = entry.cls?.prototype?.__proto__?.constructor;
      while (proto && proto !== Function.prototype) {
        register(proto);
        proto = proto.prototype?.__proto__?.constructor;
      }
    }
  }
});

// Re-applies to every currently-rendered actor sheet when settings are saved, instead of
// waiting for the next render.
function refreshAllVisibleInventoryIcons() {
  for (const app of foundry.applications.instances.values()) {
    if (app.element && app.element.querySelector('.tab[data-tab="inventory"]')) {
      applyInventoryIconStyling(app.element);
    }
  }
}

Hooks.on("updateSetting", setting => {
  if (setting.key === `${MODULE_ID}.${SETTING_KEY}`) {
    refreshAllVisibleCards();
    refreshAllVisibleInventoryIcons();
  } else if (setting.key === `${MODULE_ID}.${DISPLAY_SETTING_KEY}`) {
    applyDisplayOptionsToRoot();
    refreshAllVisibleInventoryIcons();
  }
});

// Hovering a die/modifier reveals its source: an effect's own akdLabel if set, otherwise the
// activating item's name for a die or "Ability Modifier" for a flat term - a best-effort default,
// since dnd5e doesn't expose which formula piece a rolled term came from.
function applyTermSourceLabels(message, root) {
  const activity = message.getAssociatedActivity?.();
  const itemName = activity?.item?.name?.trim().split(/\s+/).pop();

  const tooltipParts = root.querySelectorAll(".dice-tooltip .tooltip-part");
  tooltipParts.forEach((part, index) => {
    const roll = message.rolls?.[index];
    if (!(roll instanceof CONFIG.Dice.DamageRoll)) return;

    const effectLabel = roll.options?.akdLabel;

    for (const li of part.querySelectorAll(".dice-rolls > li")) {
      if (li.querySelector(".akd-term-source")) continue;

      const isConstant = li.classList.contains("constant");
      const label = effectLabel ?? (isConstant ? "Ability Modifier" : itemName);
      if (!label) continue;

      const span = document.createElement("span");
      span.classList.add("akd-term-source");
      span.textContent = label;
      li.appendChild(span);
    }
  });
}

// Hovering a target's calculated damage shows raw-to-adjusted math per type, computed via
// Actor5e#calculateDamage() directly so it can't drift from dnd5e's own resistance rules. The
// Apply Damage tray builds rows lazily/repeatedly, so a MutationObserver watches for them.
function rawDamagesFromMessage(message) {
  const damages = [];
  for (const roll of message.rolls ?? []) {
    if (!(roll instanceof CONFIG.Dice.DamageRoll)) continue;
    damages.push({
      type: roll.options.type,
      value: roll.total,
      properties: new Set(roll.options.properties ?? [])
    });
  }
  return damages;
}

function describeDamageMath(rawDamages, actor) {
  let adjusted;
  try {
    adjusted = actor.calculateDamage(rawDamages);
  } catch (err) {
    console.warn(`[${MODULE_ID}] damageTypeCardColors: calculateDamage failed for "${actor.name}"`, err);
    return null;
  }
  if (!adjusted) return null;

  const lines = [];
  for (let i = 0; i < rawDamages.length; i++) {
    const raw = rawDamages[i];
    const adj = adjusted[i];
    if (!adj || adj.value === raw.value) continue;
    const typeLabel = game.i18n.localize(CONFIG.DND5E.damageTypes[raw.type]?.label ?? raw.type);
    lines.push(`${typeLabel} ${raw.value} → ${adj.value}`);
  }
  if (!lines.length) return null;
  return lines.join(" | ");
}

function attachDamageMathTooltip(row, message) {
  if (row.querySelector(".akd-damage-math")) return;

  const uuid = row.dataset.targetUuid;
  const actor = uuid ? fromUuidSync(uuid) : null;
  if (!actor) return;

  const rawDamages = rawDamagesFromMessage(message);
  if (!rawDamages.length) return;

  const math = describeDamageMath(rawDamages, actor);
  if (!math) return;

  const calculated = row.querySelector(".calculated.damage");
  if (!calculated) return;

  calculated.classList.add("akd-has-damage-math");
  const tooltip = document.createElement("span");
  tooltip.classList.add("akd-damage-math");
  tooltip.textContent = math;
  calculated.appendChild(tooltip);
}

function watchDamageApplicationTray(message, trayEl) {
  const scan = () => {
    for (const row of trayEl.querySelectorAll("li.target[data-target-uuid]")) {
      attachDamageMathTooltip(row, message);
    }
  };
  scan();
  new MutationObserver(scan).observe(trayEl, { childList: true, subtree: true });
}

Hooks.once("ready", () => {
  console.log(`[${MODULE_ID}] damageTypeCardColors loaded and ready.`);
});
