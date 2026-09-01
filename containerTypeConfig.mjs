// A Knights Dream Properties - containerTypeConfig.mjs
// Compatible with: Foundry VTT 14+, DND5E system
// dnd5e's native Container item (type "container") has no subtype field at all - unlike
// Equipment, its data model never mixes in ItemTypeTemplate. This adds a "Container Type"
// dropdown to a container's own Details tab so it can be given one, consumed by armor-weight-
// class's doll-slot/hand-slot logic via flags.a-knights-dream-properties.containerType -
// this module only WRITES the flag, AWC only READS it.

const MODULE_ID = "a-knights-dream-properties";
const TYPE_FIELD = "containerType";

const CONTAINER_TYPE_CHOICES = {
  backpack: "Backpack",
  beltPouch: "Belt Pouch",
  purse: "Purse",
  keg: "Keg",
  bobble: "Bobble/Vial"
};

function ensureHTMLElement(html) {
  return html?.[0] ?? html;
}

function findDetailsTab(html) {
  return html.querySelector('.tab[data-tab="details"]')
    || html.querySelector('.tab[data-tab=details]')
    || html.querySelector('.tab-pane#details')
    || html.querySelector('.tab-pane[data-tab="details"]')
    || html;
}

// Containers have no ".form-group.stacked.equipment-properties" anchor like weapons/equipment do
// (their Properties field is the first thing in the Details fieldset) - anchor on the fieldset
// itself instead, and insert before it so Container Type leads the tab.
function findInsertPoint(html) {
  const detailsTab = findDetailsTab(html);
  const fieldset = detailsTab.querySelector("fieldset");
  return { anchor: fieldset || detailsTab.querySelector(".form-group") || detailsTab, before: !!fieldset };
}

function renderContainerTypeControl(value) {
  const options = [`<option value="" ${!value ? "selected" : ""}>None</option>`]
    .concat(Object.entries(CONTAINER_TYPE_CHOICES).map(([key, label]) =>
      `<option value="${key}" ${key === value ? "selected" : ""}>${label}</option>`))
    .join("");

  return `
    <div class="form-group akd-material-field" data-akd-container-type-field>
      <label>Container Type</label>
      <select name="flags.${MODULE_ID}.${TYPE_FIELD}">${options}</select>
    </div>
  `;
}

function onRenderItemSheet(app, html) {
  html = app.element instanceof HTMLElement ? app.element : ensureHTMLElement(html);
  const item = app.document;
  if (item.type !== "container") return;
  if (html.querySelector("[data-akd-container-type-field]")) return; // already inserted by an earlier part render

  const { anchor, before } = findInsertPoint(html);
  if (!anchor) return;

  const controlsHtml = renderContainerTypeControl(item.getFlag(MODULE_ID, TYPE_FIELD));
  anchor.insertAdjacentHTML(before ? "beforebegin" : "afterbegin", controlsHtml);
}

Hooks.on("renderItemSheet", onRenderItemSheet);
Hooks.on("renderItemSheet5e", onRenderItemSheet);
