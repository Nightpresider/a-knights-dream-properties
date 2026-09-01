// A Knights Dream Properties - pocketConfig.mjs
// Compatible with: Foundry VTT 14+, DND5E system
// Adds "Pocket Capacity" (number) and "Allowed Pocket Types" (checkboxes) to an equipment
// item's own sheet, shown only when that item's "Pocketed" property (armorPropMJS.mjs) is
// checked - lets a GM configure how many consumables a pocketed carrier (a shield, a belt,
// etc.) can hold and which dnd5e consumable subtypes fit in it. Consumed by armor-weight-
// class's pocket-tracking logic (paired-slots.js) via flags.a-knights-dream-properties.
// pocketCapacity / .pocketTypes - this module only WRITES them, AWC only READS them.

const MODULE_ID = "a-knights-dream-properties";
const CAPACITY_FIELD = "pocketCapacity";
const TYPES_FIELD = "pocketTypes";
const POCKETED_PROPERTY_NAME = "system.properties.pocketed";

// Every dnd5e consumable subtype EXCEPT ammo - the existing Armor Weight Class Quiver
// feature already owns ammo specifically; pockets never compete with it for ammo items.
// "bobble" isn't a consumable subtype - it's containerTypeConfig.mjs's small-Container-as-
// pocketable-item subtype (a vial/bobble small enough to tuck into another item's pockets).
const POCKET_TYPE_CHOICES = ["potion", "poison", "food", "scroll", "wand", "rod", "trinket", "wondrous", "bobble"];
const CUSTOM_TYPE_LABELS = { bobble: "Bobble/Vial (Container)" };

function ensureHTMLElement(html) {
  return html?.[0] ?? html;
}

function isPocketed(item) {
  const props = item.system?.properties;
  return !!(props && typeof props.has === "function" && props.has("pocketed"));
}

function getPocketFlags(item) {
  return {
    capacity: item.flags?.[MODULE_ID]?.[CAPACITY_FIELD] ?? 0,
    types: item.flags?.[MODULE_ID]?.[TYPES_FIELD] ?? {},
  };
}

function subtypeLabel(key) {
  if (CUSTOM_TYPE_LABELS[key]) return CUSTOM_TYPE_LABELS[key];
  const raw = CONFIG.DND5E?.consumableTypes?.[key]?.label;
  return raw ? game.i18n.localize(raw) : key;
}

// Same "find the properties block, insert right after it" convention materialCategoryCraft.mjs
// already established for equipment items, rather than anchoring to the Pocketed checkbox
// itself - keeps the properties checkbox grid visually intact.
function findDetailsTab(html) {
  return html.querySelector('.tab[data-tab="details"]')
    || html.querySelector('.tab[data-tab=details]')
    || html.querySelector('.tab-pane#details')
    || html.querySelector('.tab-pane[data-tab="details"]')
    || html;
}

function findInsertPoint(html) {
  const detailsTab = findDetailsTab(html);
  return detailsTab.querySelector('.form-group.stacked.equipment-properties')
    || detailsTab.querySelector('.form-group.stacked')
    || detailsTab.querySelector('.form-group');
}

function renderPocketControls(capacity, types) {
  const checkboxesHtml = POCKET_TYPE_CHOICES.map(key => `
    <label class="checkbox akd-pocket-type-choice">
      <input type="checkbox" name="flags.${MODULE_ID}.${TYPES_FIELD}.${key}" ${types[key] === true ? "checked" : ""}>
      ${subtypeLabel(key)}
    </label>
  `).join("");

  return `
    <div class="akd-pocket-fields" data-akd-pocket-fields>
      <div class="form-group akd-pocket-field">
        <label>Pocket Capacity</label>
        <input type="number" name="flags.${MODULE_ID}.${CAPACITY_FIELD}" value="${capacity}" min="0" step="1">
      </div>
      <div class="form-group akd-pocket-field stacked">
        <label>Allowed Pocket Types</label>
        <div class="akd-pocket-type-choices">${checkboxesHtml}</div>
      </div>
    </div>
  `;
}

async function onRenderItemSheet(app, html) {
  // ApplicationV2 sheets render in independent parts and fire this hook once per part -
  // app.element is always the full, current sheet regardless of which part just re-rendered.
  html = app.element instanceof HTMLElement ? app.element : ensureHTMLElement(html);
  const item = app.document;
  if (!["equipment", "container"].includes(item.type)) return;
  if (html.querySelector("[data-akd-pocket-fields]")) return; // already inserted by an earlier part render

  const insertPoint = findInsertPoint(html);
  if (!insertPoint) return;

  const { capacity, types } = getPocketFlags(item);
  insertPoint.insertAdjacentHTML("afterend", renderPocketControls(capacity, types));

  const fieldsEl = html.querySelector("[data-akd-pocket-fields]");
  fieldsEl.style.display = isPocketed(item) ? "" : "none";

  // The Pocketed checkbox is a custom <dnd5e-checkbox> element (same as dnd5e's other
  // property checkboxes) - give the sheet one more frame to finish attaching it before
  // searching the DOM for it, matching materialCategoryCraft.mjs's own established pattern.
  await new Promise(resolve => requestAnimationFrame(resolve));
  const pocketedCheckbox = html.querySelector(`[name="${POCKETED_PROPERTY_NAME}"]`);
  pocketedCheckbox?.addEventListener("change", () => {
    fieldsEl.style.display = pocketedCheckbox.checked ? "" : "none";
  });
}

Hooks.on("renderItemSheet", onRenderItemSheet);
Hooks.on("renderItemSheet5e", onRenderItemSheet);
