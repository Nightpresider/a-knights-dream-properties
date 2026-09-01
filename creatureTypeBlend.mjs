// A Knights Dream Properties - creatureTypeBlend.mjs
// Compatible with: Foundry VTT 14+, DND5E system
//
// Five features live in this one file:
//   1. CREATURE TYPE BLEND - overhauls dnd5e's native "Creature Type" config dialog into a
//      percentage blend (e.g. "50% Fey / 50% Humanoid"), driving threshold-gated item grants
//      (creatureBlendAdvancement.mjs) and a proportional multi-segment pill on the sheet.
//   2. CLASS BACKGROUND BLEND - swaps the sheet's header banner/body background per class,
//      blended by level for multiclass actors.
//   3. PER-ACTOR IMAGE PICKER - lets a player override their own sheet's background image
//      (auto/pick-a-class/custom), injected into Foundry's native Configure Sheet dialog.
//   4. PANEL TRANSPARENCY - sliders + color pickers (same dialog) controlling how see-through
//      the sheet's section panels are and what color their headers/borders use.
//   5. ITEM HEADER BACKGROUNDS - a GM-picked image spanning the top of a Race or Background
//      item's own sheet, via a gear icon shown next to the name in edit mode; the same image
//      also fills that item's pill on the actor sheet.
//
// File layout follows this same order: shared helpers, then each feature as its own banner-
// delimited section (dialog/hook logic together, in the order a reader would touch them).

import { getCreatureTypeIcon } from "./creatureTypeImages.mjs";

const MODULE_ID = "a-knights-dream-properties";

// ── Shared helpers ──────────────────────────────────────────────────────────────

function escapeAttr(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function ensureHTMLElement(html) {
  return html?.[0] ?? html;
}

function grantedFeatureNamesForType(raceItem, typeKey) {
  if (!raceItem) return [];
  const names = [];
  for (const advancement of raceItem.system.advancement ?? []) {
    // Two sources of a granted feature: the custom Creature Blend Grant type (own creatureType
    // field), or any native advancement tagged via the Level-as-% mechanism (creatureBlendAdvancement.mjs).
    const type = advancement.type === "AKDCreatureBlendGrant"
      ? advancement.configuration.creatureType
      : advancement.flags?.[MODULE_ID]?.creatureType;
    if (type !== typeKey) continue;
    for (const id of Object.keys(advancement.value?.added ?? {})) {
      const item = raceItem.actor?.items.get(id);
      if (item) names.push(item.name);
    }
  }
  return names;
}

function buildBlendTooltipTable(nonzero, raceItem) {
  const table = document.createElement("table");
  table.className = "akd-blend-tooltip-table";
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const tbody = document.createElement("tbody");
  const bodyRow = document.createElement("tr");

  for (const [key, pct] of nonzero) {
    const config = CONFIG.DND5E.creatureTypes[key];
    const th = document.createElement("th");
    th.textContent = `${config ? game.i18n.localize(config.label) : key} ${pct}%`;
    headerRow.appendChild(th);

    const td = document.createElement("td");
    const features = grantedFeatureNamesForType(raceItem, key);
    if (features.length) {
      const list = document.createElement("ul");
      for (const name of features) {
        const li = document.createElement("li");
        li.textContent = name;
        list.appendChild(li);
      }
      td.appendChild(list);
    } else {
      td.textContent = game.i18n.localize("AKDP.CreatureTypeBlend.NoFeaturesGranted");
    }
    bodyRow.appendChild(td);
  }

  thead.appendChild(headerRow);
  tbody.appendChild(bodyRow);
  table.append(thead, tbody);
  return table.outerHTML;
}

/** The actor's current blend flag, read from its Race item if one is embedded, else the actor itself. */
function resolveBlend(actor) {
  const raceItem = actor.system.details?.race instanceof Item ? actor.system.details.race : null;
  const blend = (raceItem ?? actor).getFlag(MODULE_ID, "creatureTypeBlend");
  const nonzero = Object.entries(blend?.types ?? {}).filter(([, pct]) => pct > 0);
  return { raceItem, nonzero };
}

/**
 * One flex segment per blended type, sized by percentage, with the feature tooltip attached.
 * No name/percentage text renders on the segment itself - that only shows on hover, via the
 * tooltip table built above (each column header already reads "{Type} {pct}%").
 */
function buildBlendSegments(nonzero, raceItem) {
  const tooltipHtml = buildBlendTooltipTable(nonzero, raceItem);

  const wrapper = document.createElement("div");
  wrapper.className = "akd-blend-segments";
  for (const [key, pct] of nonzero) {
    const segment = document.createElement("div");
    segment.className = "akd-blend-segment";
    // flex-grow (not a raw percentage flex-basis) so the segments always fill the full width of
    // .akd-blend-segments even after the negative-margin overlaps below eat into the row - a
    // percentage basis would leave a gap equal to (segment count - 1) * --akd-blend-seam.
    segment.style.flexBasis = "0";
    segment.style.flexGrow = pct;
    segment.style.backgroundImage = `url('${getCreatureTypeIcon(key)}')`;
    segment.dataset.tooltip = tooltipHtml;
    segment.dataset.tooltipClass = "akd-blend-tooltip";
    segment.dataset.tooltipDirection = "LEFT";
    wrapper.appendChild(segment);
  }
  return wrapper;
}

// ── Creature Type Config dialog (shared: Race item or actor-direct) ─────────────

function buildBlendFieldsHtml(existingBlend, currentValue, currentCustom) {
  const types = existingBlend?.types
    ?? (currentValue && currentValue !== "custom" ? { [currentValue]: 100 } : {});
  const customPercent = existingBlend?.custom?.percent ?? (currentValue === "custom" ? 100 : 0);
  const customLabel = existingBlend?.custom?.label ?? currentCustom ?? "";

  const rows = Object.entries(CONFIG.DND5E.creatureTypes).map(([key, { label }]) => {
    const pct = types[key] ?? 0;
    return `
      <li class="akd-blend-row" data-akd-type="${key}">
        <span class="akd-blend-label">${game.i18n.localize(label)}</span>
        <input type="number" class="akd-blend-input" min="0" max="100" step="1"
               value="${pct}" data-akd-type-input="${key}">
        <span class="akd-blend-pct-sign">%</span>
      </li>`;
  }).join("");

  const customRow = `
    <li class="akd-blend-row akd-blend-row-custom">
      <input type="text" class="akd-blend-custom-label" data-akd-custom-label
             value="${escapeAttr(customLabel)}"
             placeholder="${game.i18n.localize("AKDP.CreatureTypeBlend.CustomTypePlaceholder")}">
      <input type="number" class="akd-blend-input" min="0" max="100" step="1"
             value="${customPercent}" data-akd-custom-input>
      <span class="akd-blend-pct-sign">%</span>
    </li>`;

  return `
    <fieldset class="card akd-blend-fields">
      <legend>${game.i18n.localize("AKDP.CreatureTypeBlend.Legend")}</legend>
      <ol class="unlist akd-blend-list">
        ${rows}
        ${customRow}
      </ol>
      <div class="meter progress akd-blend-bar" style="--bar-percentage: 0%;">
        <div class="label"><span class="akd-blend-total"></span></div>
      </div>
      <button type="button" class="akd-blend-apply" disabled>
        ${game.i18n.localize("AKDP.CreatureTypeBlend.Apply")}
      </button>
    </fieldset>`;
}

function wireBlendListeners(root, doc, keyPath) {
  const fieldset = root.querySelector(".akd-blend-fields");
  const bar = fieldset.querySelector(".akd-blend-bar");
  const totalLabel = fieldset.querySelector(".akd-blend-total");
  const applyButton = fieldset.querySelector(".akd-blend-apply");
  const typeInputs = [...fieldset.querySelectorAll("[data-akd-type-input]")];
  const customInput = fieldset.querySelector("[data-akd-custom-input]");
  const customLabelInput = fieldset.querySelector("[data-akd-custom-label]");

  function currentTotal() {
    const typeTotal = typeInputs.reduce((sum, el) => sum + (Number(el.value) || 0), 0);
    return typeTotal + (Number(customInput.value) || 0);
  }

  function refresh() {
    const total = currentTotal();
    bar.style.setProperty("--bar-percentage", `${Math.min(total, 100)}%`);
    totalLabel.textContent = game.i18n.format("AKDP.CreatureTypeBlend.Total", { pct: total });
    bar.classList.toggle("akd-blend-bar-invalid", total !== 100);
    applyButton.disabled = total !== 100;
  }

  for (const el of [...typeInputs, customInput]) el.addEventListener("input", refresh);
  refresh();

  applyButton.addEventListener("click", async () => {
    const percentages = typeInputs
      .map(el => [el.dataset.akdTypeInput, Number(el.value) || 0])
      .filter(([, pct]) => pct > 0);
    const customPercent = Number(customInput.value) || 0;
    const customLabel = customLabelInput.value.trim();

    let value = null;
    let highest = -1;
    for (const [key, pct] of percentages) {
      if (pct > highest) { highest = pct; value = key; }
    }
    if (highest <= 0 && customPercent > 0) value = "custom";

    const parts = percentages.map(([key, pct]) =>
      `${pct}% ${game.i18n.localize(CONFIG.DND5E.creatureTypes[key]?.label ?? key)}`);
    if (customPercent > 0) {
      parts.push(`${customPercent}% ${customLabel || game.i18n.localize("AKDP.CreatureTypeBlend.CustomTypeLabel")}`);
    }
    const subtype = parts.join(", ");

    // Document#update() deep-merges object-valued flags into whatever's already stored rather
    // than replacing them - a plain `types: {fey: 100}` would leave stale keys (e.g. celestial,
    // dragon) from a previous blend still merged in. Explicitly delete every old key that isn't
    // part of the new blend via Foundry's `-=key` convention so the flag actually gets replaced.
    const newTypes = Object.fromEntries(percentages);
    const oldTypes = doc.getFlag(MODULE_ID, "creatureTypeBlend")?.types ?? {};
    const typesUpdate = { ...newTypes };
    for (const oldKey of Object.keys(oldTypes)) {
      if (!(oldKey in newTypes)) typesUpdate[`-=${oldKey}`] = null;
    }

    const blendFlag = {
      types: typesUpdate,
      custom: customPercent > 0 ? { label: customLabel, percent: customPercent } : null
    };

    await doc.update({
      [`system.${keyPath}.value`]: value ?? "",
      [`system.${keyPath}.subtype`]: subtype,
      [`system.${keyPath}.custom`]: value === "custom" ? customLabel : "",
      [`flags.${MODULE_ID}.creatureTypeBlend`]: blendFlag
    });

    // Don't rely on dnd5e's actor sheet auto-re-rendering for this update (a Race item's
    // subtype/flag change isn't always treated as render-worthy for the parent actor sheet) -
    // explicitly refresh the pill ourselves so it's never left showing a stale blend.
    const actor = doc.documentName === "Actor" ? doc : doc.actor;
    refreshActorTypePill(actor);
  });
}

/** Explicitly rebuild an actor's creature-type (and, for characters, race/background portrait)
 *  pills, independent of whether its sheet auto-rerendered. */
function refreshActorTypePill(actor) {
  if (!actor?.sheet?.rendered) return;
  const el = actor.sheet.element instanceof HTMLElement ? actor.sheet.element : ensureHTMLElement(actor.sheet.element);
  if (!el) return;
  if (actor.type === "character") {
    rebuildCharacterTypePill(el, actor);
    rebuildRacePortraitPill(el, actor);
    rebuildBackgroundPortraitPill(el, actor);
  } else if (actor.type === "npc") {
    rebuildNPCTypePill(el, actor);
  }
}

function onRenderCreatureTypeConfig(app, html) {
  const root = app.element instanceof HTMLElement ? app.element : ensureHTMLElement(html);
  if (!root || root.querySelector(".akd-blend-fields")) return;

  const doc = app.document;
  const keyPath = app.options.keyPath; // "type" (race item) or "details.type" (actor, NPC-no-race)

  const typesList = root.querySelector("ol.types-list");
  const radioFieldset = typesList?.closest("fieldset");
  if (!radioFieldset) return;
  radioFieldset.style.display = "none";

  // Leave the swarm form-group (NPC-no-race branch only) fully untouched/native - only hide
  // subtype. If there's no swarm field either (the race-item branch, always), the whole
  // fieldset that used to hold subtype+swarm would otherwise sit empty but still visible as a
  // bare card background - hide the entire fieldset in that case instead of just the one field.
  const subtypeInput = root.querySelector(`[name="system.${keyPath}.subtype"]`);
  const subtypeGroup = subtypeInput?.closest(".form-group");
  const subtypeFieldset = subtypeGroup?.closest("fieldset");
  const hasSwarmField = !!subtypeFieldset?.querySelector(`[name="system.${keyPath}.swarm"]`);
  if (hasSwarmField) subtypeGroup?.style.setProperty("display", "none");
  else subtypeFieldset?.style.setProperty("display", "none");

  const existingBlend = doc.getFlag(MODULE_ID, "creatureTypeBlend");
  const source = doc.system._source;
  const currentValue = foundry.utils.getProperty(source, `${keyPath}.value`);
  const currentCustom = foundry.utils.getProperty(source, `${keyPath}.custom`);

  radioFieldset.insertAdjacentHTML("afterend", buildBlendFieldsHtml(existingBlend, currentValue, currentCustom));
  wireBlendListeners(root, doc, keyPath);
}

Hooks.on("renderCreatureTypeConfig", onRenderCreatureTypeConfig);

// ── Character actor sheet: .pills-lg .pill-lg.type (icon + name-stacked pill) ───

function rebuildCharacterTypePill(el, actor) {
  const pill = el.querySelector(".pills-lg .pill-lg.type");
  if (!pill) return;

  pill.querySelector(".akd-blend-segments")?.remove();
  pill.querySelector(".akd-type-placeholder-text")?.remove();
  pill.classList.remove("akd-blend-active", "akd-type-placeholder");
  pill.querySelectorAll(":scope > .gold-icon, :scope > .name").forEach(node => node.style.removeProperty("display"));

  const { raceItem, nonzero } = resolveBlend(actor);

  // No race item at all - dnd5e's own "humanoid" schema default (CharacterData#prepareEmbeddedData)
  // has nothing real behind it yet. Show a neutral placeholder instead, matching the "Add Race"/
  // "Add Background" empty-state pills already shown just below this one.
  if (!raceItem) {
    pill.classList.add("akd-type-placeholder");
    pill.querySelectorAll(":scope > .gold-icon, :scope > .name").forEach(node => node.style.display = "none");
    const placeholder = document.createElement("span");
    placeholder.className = "akd-type-placeholder-text roboto-upper";
    placeholder.textContent = game.i18n.localize("AKDP.CreatureTypeBlend.DeterminedByRace");
    pill.appendChild(placeholder);
    return;
  }

  // No blend flag at all (this feature has never been used on this actor) - leave dnd5e's
  // native rendering alone. Any actual blend, even a single type at 100%, uses our own
  // rendering instead of the native icon+name pill, so a module-overridden image always shows.
  if (nonzero.length === 0) return;

  pill.classList.add("akd-blend-active");
  pill.querySelectorAll(":scope > .gold-icon, :scope > .name").forEach(node => node.style.display = "none");
  pill.appendChild(buildBlendSegments(nonzero, raceItem));
}

// ── Character actor sheet: .pills-lg .pill-lg.race/.background (full-bleed portrait) ────
// Same "image fills the whole pill, name/controls float on top" treatment as the
// type/Ancestry pill above - one image, no blend segments needed. Reads the SAME
// itemHeaderBackground flag as that item's own sheet header (Item Header Backgrounds
// section, below) rather than the item's native .img - these pills are wide and short, a
// much better fit for that wide banner image than the item's own small square portrait crop.
// Leaves the native small icon+name pill alone until that flag is actually set. Shared by
// both the Race and Background pills - only the selector/details-key differ.

function rebuildItemPortraitPill(el, actor, { pillSelector, detailsKey }) {
  const pill = el.querySelector(pillSelector);
  if (!pill) return;

  pill.querySelector(".akd-item-portrait")?.remove();
  pill.classList.remove("akd-item-portrait-active");
  pill.querySelectorAll(":scope > .gold-icon").forEach(node => node.style.removeProperty("display"));

  const item = actor.system.details?.[detailsKey] instanceof Item ? actor.system.details[detailsKey] : null;
  const bgImage = item?.getFlag(MODULE_ID, ITEM_HEADER_BG_FLAG);
  if (!bgImage) return;

  pill.classList.add("akd-item-portrait-active");
  pill.querySelectorAll(":scope > .gold-icon").forEach(node => node.style.display = "none");
  // A real appended child, not ::before - dnd5e's own .pill-lg::before AND
  // .pill-lg.texture::before are both already claimed (opacity/blend-mode overlay, then a
  // gradient), at higher specificity than anything scoped to just our own marker class could
  // beat; .pill-lg.texture.race/.background also paint their own decorative art directly on
  // the pill. A real child paints above all of that, same as .akd-blend-segments.
  const portrait = document.createElement("div");
  portrait.className = "akd-item-portrait";
  portrait.style.backgroundImage = `url('${bgImage}')`;
  pill.appendChild(portrait);
}

function rebuildRacePortraitPill(el, actor) {
  rebuildItemPortraitPill(el, actor, { pillSelector: ".pills-lg .pill-lg.race", detailsKey: "race" });
}

function rebuildBackgroundPortraitPill(el, actor) {
  rebuildItemPortraitPill(el, actor, { pillSelector: ".pills-lg .pill-lg.background", detailsKey: "background" });
}

// ── NPC actor sheet: li.creature-type (plain button + label span, no icon) ──────

function rebuildNPCTypePill(el, actor) {
  const li = el.querySelector("li.creature-type");
  const button = li?.querySelector('button[data-action="showConfiguration"]');
  const label = button?.querySelector("span");
  if (!li || !button || !label) return;

  li.querySelector(".akd-blend-segments")?.remove();
  li.classList.remove("akd-blend-active");
  label.style.removeProperty("display");

  const { raceItem, nonzero } = resolveBlend(actor);
  // No blend flag at all - leave native rendering alone; any actual blend (even one type at
  // 100%) uses our own rendering, so a module-overridden image always shows.
  if (nonzero.length === 0) return;

  li.classList.add("akd-blend-active");
  label.style.display = "none";
  const segments = buildBlendSegments(nonzero, raceItem);
  button.insertBefore(segments, button.querySelector("i.fa-cog"));
}

// ── Hook registration: per actor-sheet-type dispatch ─────────────────────────────

function registerBlendPillHooks() {
  const seen = new Set();

  function register(cls, actorType, rebuild) {
    const name = cls?.name;
    const key = `${actorType}:${name}`;
    if (!name || seen.has(key)) return;
    seen.add(key);
    Hooks.on(`render${name}`, (app, html) => {
      // Foundry fires render<ClassName> for every class up an app's chain, not just the leaf
      // class - so this also fires for unrelated apps sharing an ancestor with actor sheets
      // (e.g. dnd5e's CreatureTypeConfig dialog, via the generic "ApplicationV2" ancestor).
      // CreatureTypeConfig's own `.actor` getter dereferences `this.object`, which it doesn't
      // define, and throws instead of returning undefined - so this access must be guarded.
      let actor;
      try {
        actor = app.actor ?? app.document;
      } catch {
        return;
      }
      if (!actor || actor.type !== actorType) return;
      if (actor.sheet !== app) return;
      const el = app.element instanceof HTMLElement ? app.element : ensureHTMLElement(html);
      if (el) rebuild(el, actor);
    });
  }

  function rebuildCharacterPills(el, actor) {
    rebuildCharacterTypePill(el, actor);
    rebuildRacePortraitPill(el, actor);
    rebuildBackgroundPortraitPill(el, actor);
  }

  const REBUILDERS = { character: rebuildCharacterPills, npc: rebuildNPCTypePill };

  for (const [actorType, sheets] of Object.entries(CONFIG.Actor?.sheetClasses ?? {})) {
    const rebuild = REBUILDERS[actorType];
    if (!rebuild) continue;
    for (const entry of Object.values(sheets)) {
      let cls = entry.cls;
      while (cls && cls.prototype) {
        register(cls, actorType, rebuild);
        cls = Object.getPrototypeOf(cls);
      }
    }
  }
}

Hooks.once("ready", registerBlendPillHooks);

// ═══════════════════════════════════════════════════════════════════════════
// Class Background Blend
//
// Blends a PC's header banner/body background across their classes, proportional to
// levels in each (Fighter 3 / Wizard 5 -> 37.5% Fighter, 62.5% Wizard) - same
// proportional-segments + diagonal-blurred-seam technique as the multi-type pill
// above, applied to two larger regions instead of one small pill, no hover tooltip.
// dnd5e classes are open-ended Items (unlike the small closed creature-type CONFIG
// enum), so there's no fixed list to seed a dialog from - a settings-menu image
// mapping keyed by class identifier instead. If any present class has no image, the
// sheet is left fully native - only replaces the look once every present class has one.
//
// Resolution order per class identifier:
//   1. World-setting override (settings menu) - escape hatch for a file outside the
//      folder, or separate header/body images.
//   2. assets/class/class_<identifier>.webp, used for both header and body - edit/replace
//      directly, no settings step required (the expected workflow).
// Most classes have no file yet (unlike creature types, which all start with one), so
// (2) needs a real existence check rather than an unconditional path - the assets
// folder is scanned once via FilePicker at "ready" and cached for synchronous lookup.
// ═══════════════════════════════════════════════════════════════════════════

const CLASS_BG_SETTING_KEY = "classBackgroundImages";
const CLASS_BG_ASSETS_PATH = `modules/${MODULE_ID}/assets/class`;

const STANDARD_CLASS_IDENTIFIERS = [
  "artificer", "barbarian", "bard", "cleric", "druid", "fighter",
  "monk", "paladin", "ranger", "rogue", "sorcerer", "warlock", "wizard"
];

// ── Settings + storage ────────────────────────────────────────────────────────

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, CLASS_BG_SETTING_KEY, {
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });
});

let classBackgroundFilesAvailable = new Set();

async function scanClassBackgroundFiles() {
  try {
    const FilePickerImpl = foundry.applications.apps.FilePicker.implementation;
    const { files } = await FilePickerImpl.browse("data", CLASS_BG_ASSETS_PATH);
    classBackgroundFilesAvailable = new Set(
      files
        .map(path => path.split("/").pop().match(/^class_([a-z0-9]+)\.webp$/i)?.[1]?.toLowerCase())
        .filter(Boolean)
    );
  } catch (err) {
    console.warn(`${MODULE_ID} | Could not scan class assets folder`, err);
  }
}

function getClassImages(identifier) {
  const overrides = game.settings.get(MODULE_ID, CLASS_BG_SETTING_KEY) ?? {};
  if (overrides[identifier]?.header && overrides[identifier]?.body) return overrides[identifier];
  if (classBackgroundFilesAvailable.has(identifier)) {
    const path = `${CLASS_BG_ASSETS_PATH}/class_${identifier}.webp`;
    return { header: path, body: path };
  }
  return null;
}

// ── Per-actor override (player's own choice, from the Sheet Configuration dialog) ──
//
// Separate from the GM-only, per-class settings above: this is a per-CHARACTER choice
// a player makes for their own sheet, stored on the actor itself (flags.a-knights-
// dream-properties.classImageSelection) so it's visible to everyone who views that
// sheet, not just the viewer. Three modes:
//   - "auto" (or flag unset): no override - falls through to resolveClassBlend's
//     normal class-based resolution, unchanged.
//   - "class": pin to a SPECIFIC class's image regardless of the actor's actual
//     class(es) - lets a player pick a different class's look for flavor.
//   - "custom": an arbitrary player-chosen image via FilePicker, used for both header
//     and body.
const ACTOR_IMAGE_SELECTION_FLAG = "classImageSelection";

function resolveActorImageOverride(actor) {
  const sel = actor.getFlag(MODULE_ID, ACTOR_IMAGE_SELECTION_FLAG);
  if (!sel || sel.mode === "auto") return null;
  if (sel.mode === "class" && sel.classKey) {
    const images = getClassImages(sel.classKey);
    return images ? { identifier: sel.classKey, pct: 100, images } : null;
  }
  if (sel.mode === "custom" && sel.customPath) {
    return { identifier: "custom", pct: 100, images: { header: sel.customPath, body: sel.customPath } };
  }
  return null;
}

/**
 * The actor's class levels as [{identifier, pct}], only including classes with both a header
 * and body image available. Returns [] (triggering native fallback) unless every class the
 * actor actually has is fully configured - a partial blend would leave gaps with nothing to show.
 */
function resolveClassBlend(actor) {
  const classes = Object.values(actor.classes ?? {});
  if (!classes.length) return [];

  const totalLevels = classes.reduce((sum, cls) => sum + (cls.system.levels ?? 0), 0);
  if (!totalLevels) return [];

  const entries = classes.map(cls => ({
    identifier: cls.identifier,
    pct: Math.round((cls.system.levels / totalLevels) * 1000) / 10,
    images: getClassImages(cls.identifier)
  }));

  if (entries.some(e => !e.images?.header || !e.images?.body)) return [];
  return entries;
}

// ── Settings menu ────────────────────────────────────────────────────────────

class AKDClassBackgroundsConfig extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "akd-class-backgrounds",
      title: game.i18n.localize("AKDP.ClassBackgrounds.Title"),
      template: `modules/${MODULE_ID}/templates/class-backgrounds-config.html`,
      width: 560,
      height: 600,
      closeOnSubmit: false
    });
  }

  getData() {
    const stored = game.settings.get(MODULE_ID, CLASS_BG_SETTING_KEY) ?? {};
    const identifiers = new Set([...STANDARD_CLASS_IDENTIFIERS, ...Object.keys(stored)]);
    const rows = [...identifiers].sort().map(identifier => ({
      identifier,
      header: stored[identifier]?.header ?? "",
      body: stored[identifier]?.body ?? ""
    }));
    return { rows };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find("[data-action='pick-image']").on("click", (event) => {
      const target = event.currentTarget.dataset.target;
      const input = html.find(`input[name="${target}"]`)[0];
      const FilePickerImpl = foundry.applications.apps.FilePicker.implementation;
      const fp = new FilePickerImpl({
        type: "image",
        current: input?.value ?? "",
        callback: (path) => { if (input) input.value = path; }
      });
      fp.render(true);
    });

    html.find("[data-action='add-row']").on("click", () => {
      const identifier = html.find("[name='new-identifier']").val()?.trim().toLowerCase();
      if (!identifier) return;
      const list = html.find(".akd-class-bg-list")[0];
      if (list.querySelector(`[data-identifier="${identifier}"]`)) return;
      const row = document.createElement("li");
      row.className = "akd-class-bg-row";
      row.dataset.identifier = identifier;
      row.innerHTML = `
        <label>${identifier}</label>
        <input type="text" name="${identifier}.header" placeholder="${game.i18n.localize("AKDP.ClassBackgrounds.HeaderPlaceholder")}">
        <button type="button" data-action="pick-image" data-target="${identifier}.header"><i class="fas fa-file-import"></i></button>
        <input type="text" name="${identifier}.body" placeholder="${game.i18n.localize("AKDP.ClassBackgrounds.BodyPlaceholder")}">
        <button type="button" data-action="pick-image" data-target="${identifier}.body"><i class="fas fa-file-import"></i></button>`;
      list.appendChild(row);
      row.querySelectorAll("[data-action='pick-image']").forEach(btn => {
        btn.addEventListener("click", (event) => {
          const target = event.currentTarget.dataset.target;
          const input = row.querySelector(`input[name="${target}"]`);
          const FilePickerImpl = foundry.applications.apps.FilePicker.implementation;
          new FilePickerImpl({
            type: "image",
            current: input?.value ?? "",
            callback: (path) => { if (input) input.value = path; }
          }).render(true);
        });
      });
      html.find("[name='new-identifier']").val("");
    });
  }

  async _updateObject(event, formData) {
    const expanded = foundry.utils.expandObject(formData);
    delete expanded["new-identifier"];
    const cleaned = {};
    for (const [identifier, images] of Object.entries(expanded)) {
      if (images?.header || images?.body) cleaned[identifier] = { header: images.header || "", body: images.body || "" };
    }
    await game.settings.set(MODULE_ID, CLASS_BG_SETTING_KEY, cleaned);
  }
}

Hooks.once("ready", () => {
  game.settings.registerMenu(MODULE_ID, "classBackgroundsMenu", {
    name: "AKDP.ClassBackgrounds.MenuName",
    label: "AKDP.ClassBackgrounds.MenuLabel",
    hint: "AKDP.ClassBackgrounds.MenuHint",
    icon: "fas fa-image",
    type: AKDClassBackgroundsConfig,
    restricted: true
  });
});

// ── Per-actor image picker, injected into the native Sheet Configuration dialog ─────
//
// This is Foundry's own "Configure Sheet" dialog (core class, not dnd5e- or akdp-
// defined) - reached from a character sheet's "..." menu. Rather than build a
// separate dialog, this section injects an extra fieldset into the existing one, the
// same DOM-takeover idiom used everywhere else in this file (defensive try/catch
// around document access, guard against double-insert, manual listeners, explicit
// save - never native form auto-submit, since this fieldset's own inputs aren't part
// of that form's real schema).

// A hardcoded shortcut, not part of the scanned class-file list - reuses "custom" mode
// under the hood (customPath pointing here) rather than inventing a whole extra mode,
// since "custom" already means nothing more than "use exactly this image path".
const NATIVE_DEFAULT_IMAGE_PATH = `${CLASS_BG_ASSETS_PATH}/native-default-header-banner.webp`;

function classImagePickerHtml(actor) {
  const current = actor.getFlag(MODULE_ID, ACTOR_IMAGE_SELECTION_FLAG) ?? { mode: "auto" };
  const isNativeDefault = current.mode === "custom" && current.customPath === NATIVE_DEFAULT_IMAGE_PATH;
  const options = [...classBackgroundFilesAvailable].sort().map(key => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
    path: `${CLASS_BG_ASSETS_PATH}/class_${key}.webp`
  }));

  const optionsHtml = options.map(opt => `
    <label class="akd-class-option">
      <input type="radio" name="akd-image-mode" value="class:${escapeAttr(opt.key)}"
        ${current.mode === "class" && current.classKey === opt.key ? "checked" : ""}>
      <img src="${escapeAttr(opt.path)}" alt="${escapeAttr(opt.label)}">
      <span>${escapeAttr(opt.label)}</span>
    </label>`).join("") + `
    <label class="akd-class-option">
      <input type="radio" name="akd-image-mode" value="native" ${isNativeDefault ? "checked" : ""}>
      <img src="${escapeAttr(NATIVE_DEFAULT_IMAGE_PATH)}" alt="${game.i18n.localize("AKDP.ClassImagePicker.Default")}">
      <span>${game.i18n.localize("AKDP.ClassImagePicker.Default")}</span>
    </label>`;

  return `
    <fieldset class="akd-class-image-picker">
      <legend>${game.i18n.localize("AKDP.ClassImagePicker.Legend")}</legend>
      <label class="akd-mode-row">
        <input type="radio" name="akd-image-mode" value="auto" ${current.mode === "auto" || !current.mode ? "checked" : ""}>
        ${game.i18n.localize("AKDP.ClassImagePicker.Auto")}
      </label>
      <div class="akd-class-grid">${optionsHtml}</div>
      <div class="akd-custom-row">
        <input type="radio" name="akd-image-mode" value="custom" class="akd-custom-radio"
          ${current.mode === "custom" && !isNativeDefault ? "checked" : ""}>
        <span>${game.i18n.localize("AKDP.ClassImagePicker.Custom")}</span>
        <input type="text" class="akd-custom-path" value="${escapeAttr(current.customPath ?? "")}"
          placeholder="${game.i18n.localize("AKDP.ClassImagePicker.CustomPlaceholder")}">
        <button type="button" class="akd-custom-pick"><i class="fas fa-file-import"></i></button>
      </div>
    </fieldset>`;
}

// Selecting ANY option saves immediately (a 3-second countdown overlay is the only save
// feedback) - the native "Save Sheet Configuration" button only handles the dialog's own
// This Sheet/Theme fields. Wired off each radio's "click", not "change": setting .checked via
// the file-picker button doesn't dispatch "change", and "change" wouldn't fire anyway when
// re-clicking an already-checked radio to save an edited custom path - "click" fires either way.
function wireClassImagePicker(fieldset, actor) {
  fieldset.querySelector(".akd-custom-pick")?.addEventListener("click", () => {
    const input = fieldset.querySelector(".akd-custom-path");
    const FilePickerImpl = foundry.applications.apps.FilePicker.implementation;
    new FilePickerImpl({
      type: "image",
      current: input?.value ?? "",
      callback: (path) => {
        if (input) input.value = path;
      }
    }).render(true);
  });

  fieldset.querySelectorAll('input[name="akd-image-mode"]').forEach(radio => {
    radio.addEventListener("click", async () => {
      let update;
      if (radio.value === "custom") {
        const path = fieldset.querySelector(".akd-custom-path")?.value?.trim();
        if (!path) {
          ui.notifications.warn(game.i18n.localize("AKDP.ClassImagePicker.NoCustomPath"));
          radio.checked = false;
          return;
        }
        update = { mode: "custom", customPath: path };
      } else if (radio.value === "native") {
        update = { mode: "custom", customPath: NATIVE_DEFAULT_IMAGE_PATH };
      } else if (radio.value.startsWith("class:")) {
        update = { mode: "class", classKey: radio.value.slice("class:".length) };
      } else {
        update = { mode: "auto" };
      }

      // Fires immediately, before the save round-trip below - actor.setFlag() is a real
      // document update (server round-trip), so showing this after awaiting it would make
      // the countdown visibly lag behind the click instead of firing the moment it happens.
      showSaveCountdown(radio.closest(".akd-class-option, .akd-mode-row, .akd-custom-row"));

      // Replace, don't merge - setFlag alone deep-merges object-valued flags, which would
      // leave a stale classKey/customPath from a previous selection sitting alongside the
      // new mode.
      await actor.unsetFlag(MODULE_ID, ACTOR_IMAGE_SELECTION_FLAG);
      await actor.setFlag(MODULE_ID, ACTOR_IMAGE_SELECTION_FLAG, update);
      refreshClassBackground(actor);
    });
  });
}

/** Overlays a 3-second countdown on `container` as visual confirmation a selection saved. */
function showSaveCountdown(container) {
  if (!container) return;
  container.querySelector(":scope > .akd-save-countdown")?.remove();
  const overlay = document.createElement("div");
  overlay.className = "akd-save-countdown";
  overlay.textContent = "3";
  container.appendChild(overlay);
  let remaining = 3;
  const interval = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(interval);
      overlay.remove();
    } else {
      overlay.textContent = String(remaining);
    }
  }, 1000);
}

// Neutral starting swatch for the two color pickers before a player ever customizes
// them - purely the picker widget's own initial appearance, not applied to the sheet
// itself (applyPanelTransparency only applies a color once one is actually saved).
const DEFAULT_SWATCH_COLOR = "#9f9275";

function panelTransparencyHtml(actor) {
  const current = actor.getFlag(MODULE_ID, PANEL_TRANSPARENCY_FLAG) ?? {};
  const headerAlpha = current.headerAlpha ?? 100;
  const itemAlpha = current.itemAlpha ?? 100;
  const headerColor = current.headerColor || DEFAULT_SWATCH_COLOR;
  const borderColor = current.borderColor || DEFAULT_SWATCH_COLOR;

  return `
    <fieldset class="akd-panel-transparency">
      <legend>${game.i18n.localize("AKDP.PanelTransparency.Legend")}</legend>
      <label class="akd-slider-row">
        <input type="color" class="akd-header-color" value="${escapeAttr(headerColor)}"
          title="${game.i18n.localize("AKDP.PanelTransparency.HeaderColor")}">
        <span>${game.i18n.localize("AKDP.PanelTransparency.Headers")}</span>
        <input type="range" class="akd-header-alpha" min="0" max="100" step="5" value="${headerAlpha}">
        <output class="akd-header-alpha-output">${headerAlpha}%</output>
      </label>
      <label class="akd-slider-row">
        <input type="color" class="akd-border-color" value="${escapeAttr(borderColor)}"
          title="${game.i18n.localize("AKDP.PanelTransparency.BorderColor")}">
        <span>${game.i18n.localize("AKDP.PanelTransparency.Items")}</span>
        <input type="range" class="akd-item-alpha" min="0" max="100" step="5" value="${itemAlpha}">
        <output class="akd-item-alpha-output">${itemAlpha}%</output>
      </label>
      <div class="akd-panel-transparency-actions">
        <button type="button" class="akd-save-panel-transparency">
          <i class="fas fa-save"></i> ${game.i18n.localize("AKDP.PanelTransparency.Save")}
        </button>
        <button type="button" class="akd-reset-panel-transparency">
          <i class="fas fa-undo"></i> ${game.i18n.localize("AKDP.PanelTransparency.Reset")}
        </button>
      </div>
    </fieldset>`;
}

function wirePanelTransparency(fieldset, actor) {
  const current = actor.getFlag(MODULE_ID, PANEL_TRANSPARENCY_FLAG) ?? {};
  const headerInput = fieldset.querySelector(".akd-header-alpha");
  const itemInput = fieldset.querySelector(".akd-item-alpha");
  const headerOutput = fieldset.querySelector(".akd-header-alpha-output");
  const itemOutput = fieldset.querySelector(".akd-item-alpha-output");
  const headerColorInput = fieldset.querySelector(".akd-header-color");
  const borderColorInput = fieldset.querySelector(".akd-border-color");

  // Tracks whether each color has actually been deliberately set - either already
  // saved before this dialog opened, or picked just now - so Save never writes the
  // neutral swatch-default color as a real customization, and never wipes out an
  // existing one just because the player only touched a slider before clicking Save.
  let headerColorSet = Boolean(current.headerColor);
  let borderColorSet = Boolean(current.borderColor);

  // Live preview on the actual open character sheet (a separate window from this
  // config dialog) while dragging/picking, before anything is saved - lets a player
  // dial in a value visually, matching how every other value-tuning knob in this
  // module works. Split per-control rather than one shared function: a shared function
  // would re-apply BOTH colors (activating their marker classes) every time, even from
  // just moving an alpha slider - forcing the swatch-default color onto the sheet
  // before the player ever touched a color picker at all.
  function sheetElement() {
    if (!actor.sheet?.rendered) return null;
    return actor.sheet.element instanceof HTMLElement ? actor.sheet.element : actor.sheet.element?.[0];
  }

  headerInput?.addEventListener("input", () => {
    headerOutput.textContent = `${headerInput.value}%`;
    sheetElement()?.style.setProperty("--akd-header-alpha", `${headerInput.value}%`);
  });
  itemInput?.addEventListener("input", () => {
    itemOutput.textContent = `${itemInput.value}%`;
    sheetElement()?.style.setProperty("--akd-item-alpha", `${itemInput.value}%`);
  });
  headerColorInput?.addEventListener("input", () => {
    headerColorSet = true;
    const sheetEl = sheetElement();
    if (!sheetEl) return;
    sheetEl.style.setProperty("--akd-header-color", headerColorInput.value);
    sheetEl.classList.add("akd-header-color-active");
  });
  borderColorInput?.addEventListener("input", () => {
    borderColorSet = true;
    const sheetEl = sheetElement();
    if (!sheetEl) return;
    sheetEl.style.setProperty("--akd-border-color", borderColorInput.value);
    sheetEl.classList.add("akd-border-color-active");
  });

  fieldset.querySelector(".akd-save-panel-transparency")?.addEventListener("click", async () => {
    await actor.setFlag(MODULE_ID, PANEL_TRANSPARENCY_FLAG, {
      headerAlpha: Number(headerInput.value),
      itemAlpha: Number(itemInput.value),
      headerColor: headerColorSet ? headerColorInput.value : "",
      borderColor: borderColorSet ? borderColorInput.value : ""
    });
  });

  fieldset.querySelector(".akd-reset-panel-transparency")?.addEventListener("click", async () => {
    headerInput.value = 100;
    itemInput.value = 100;
    headerOutput.textContent = "100%";
    itemOutput.textContent = "100%";
    headerColorInput.value = DEFAULT_SWATCH_COLOR;
    borderColorInput.value = DEFAULT_SWATCH_COLOR;
    headerColorSet = false;
    borderColorSet = false;

    await actor.setFlag(MODULE_ID, PANEL_TRANSPARENCY_FLAG, {
      headerAlpha: 100,
      itemAlpha: 100,
      headerColor: "",
      borderColor: ""
    });
    // Reuses the same apply logic the render hook uses, rather than duplicating the
    // marker-class/property cleanup here - it correctly reads the just-reset flag and
    // removes the --akd-header-color/--akd-border-color properties and their
    // .akd-*-color-active classes, undoing whatever live preview had applied.
    const sheetEl = sheetElement();
    if (sheetEl) applyPanelTransparency(sheetEl, actor);
  });
}

function onRenderDocumentSheetConfig(app, html) {
  let actor;
  try {
    actor = app.document;
  } catch {
    return;
  }
  if (!(actor instanceof Actor) || actor.type !== "character") return;

  const el = app.element instanceof HTMLElement ? app.element : (html?.[0] ?? html);
  if (!el) return;
  if (el.querySelector(".akd-class-image-picker")) return;

  // Confirmed against the installed client source (document-sheet-config.mjs/.hbs):
  // this app's root element IS the <form> itself (DocumentSheetV2's DEFAULT_OPTIONS sets
  // tag: "form"), and its "Document"/"Defaults" fieldsets render inside a
  // [data-application-part="form"] container, with the Save button in a separate,
  // later "footer" part. Appending into .window-content as a whole would land after
  // that footer (below the Save button) - target the "form" part specifically instead,
  // so this fieldset sits alongside Document/Defaults, with the native Save button
  // still last.
  const formPart = el.querySelector('[data-application-part="form"]') ?? el.querySelector(".window-content");
  if (!formPart) return;

  // This dialog's window-content has no scroll handling of its own - left unbounded,
  // these two added fieldsets (particularly the class thumbnail grid) push the whole
  // window past the screen edge with content silently clipped, no scrollbar anywhere.
  // Contain them in their own scrollable region instead of touching the native
  // Document/Defaults fieldsets' sizing at all - those stay exactly as they were,
  // always fully visible without scrolling.
  const wrapper = document.createElement("div");
  wrapper.className = "akd-sheet-config-extra";
  formPart.appendChild(wrapper);

  wrapper.insertAdjacentHTML("beforeend", classImagePickerHtml(actor));
  wireClassImagePicker(wrapper.querySelector(".akd-class-image-picker"), actor);

  wrapper.insertAdjacentHTML("beforeend", panelTransparencyHtml(actor));
  wirePanelTransparency(wrapper.querySelector(".akd-panel-transparency"), actor);
}

Hooks.on("renderDocumentSheetConfig", onRenderDocumentSheetConfig);

// ── Shared: proportional segments (no tooltip - see file header) ───────────────

function buildClassSegments(entries, imageKey) {
  const wrapper = document.createElement("div");
  wrapper.className = "akd-class-blend-segments";
  for (const { images, pct } of entries) {
    const segment = document.createElement("div");
    segment.className = "akd-class-blend-segment";
    segment.style.flexBasis = "0";
    segment.style.flexGrow = pct;
    segment.style.backgroundImage = `url('${images[imageKey]}')`;
    wrapper.appendChild(segment);
  }
  return wrapper;
}

// ── Single-class: override dnd5e's own CSS variables directly ──────────────────
//
// The common case (no multiclassing): no DOM overlay, just overrides the same custom
// properties dnd5e's own rules already read from. CSS custom properties inherit by DOM
// ancestry, not original document structure, so setting them on the sheet's root
// element reaches them even after AWC relocates .sheet-header into .window-header.
//
// dnd5e uses entirely different variables to paint this banner per theme (dnd5e.css:1150,
// keyed off body.theme-dark). Dark theme's native values make .sheet-header/.sheet-body
// paint nothing of their own, instead driving a .window-content::before overlay (opacity
// 0.5, top-to-bottom fade mask, 300px tall). Light theme's own values differ (that
// overlay never generates; header-image/body-image paint the elements directly instead).
// Rather than a separate light-theme technique, dark theme's four values are set
// unconditionally regardless of active theme - light theme gets the identical overlay.
function toRootRelativePath(path) {
  return path.startsWith("/") ? path : `/${path}`;
}

function applySingleClassCssVars(el, images) {
  const header = toRootRelativePath(images.header);
  // A url() inside a CSS custom property resolves relative to whichever stylesheet's
  // var() reference consumes it, not where setProperty() was called - a bare
  // "modules/..." path resolves against dnd5e's own systems/dnd5e/ and 404s. A leading
  // slash makes it root-relative.
  el.style.setProperty("--dnd5e-character-background-content", '""');
  el.style.setProperty("--dnd5e-character-background-image", `url('${header}')`);
  el.style.setProperty("--dnd5e-character-header-image", "transparent");
  el.style.setProperty("--dnd5e-character-body-image", "none");
  // Marks the sheet so creatureTypeBlend.css can re-shape the .window-content::before
  // overlay's fade (opacity/mask) WITHOUT touching dnd5e's own native rule - which stays
  // exactly as-is for any actor not using this feature (no class image set, multiclassed).
  el.classList.add("akd-class-bg-active");
}

function clearClassCssVars(el) {
  el.style.removeProperty("--dnd5e-character-background-content");
  el.style.removeProperty("--dnd5e-character-background-image");
  el.style.removeProperty("--dnd5e-character-header-image");
  el.style.removeProperty("--dnd5e-character-body-image");
  el.classList.remove("akd-class-bg-active");
}

// ── Header injection (re-rendered per template - reinsert every render) ────────
// Only used for the 2+ class (multiclass) case - see applySingleClassCssVars above
// for the single-class path.

function injectHeaderBlend(el, entries) {
  const header = el.querySelector(".sheet-header");
  if (!header) return;

  header.querySelector(".akd-class-blend-segments")?.remove();
  header.classList.remove("akd-class-blend-active");
  if (entries.length < 2) return;

  header.classList.add("akd-class-blend-active");
  header.prepend(buildClassSegments(entries, "header"));
}

// ── Body injection (sheet-body is created once and persists - guard, don't rebuild) ─
// Only used for the 2+ class (multiclass) case - see applySingleClassCssVars above
// for the single-class path.

function injectBodyBlend(el, entries) {
  const body = el.querySelector(".sheet-body");
  if (!body) return;

  const existing = body.querySelector(":scope > .akd-class-blend-segments");
  existing?.remove();
  body.classList.remove("akd-class-blend-active");
  if (entries.length < 2) return;

  // sheet-body persists across re-renders (built once in _onFirstRender), but the actor's
  // classes/levels can change at any time - always rebuild fresh rather than guarding on
  // "already inserted" the way the header does, since here that would mean never updating.
  body.classList.add("akd-class-blend-active");
  body.prepend(buildClassSegments(entries, "body"));
}

// ═══════════════════════════════════════════════════════════════════════════
// Panel Transparency
//
// A separate per-actor flag: two 0-100 alpha values (headerAlpha/itemAlpha) plus two
// optional color overrides (headerColor/borderColor), all set from the Configure Sheet
// dialog and consumed via color-mix() in creatureTypeBlend.css. Alpha targets
// background-color specifically, never element opacity, so text/icons/meter bars stay
// readable at any slider position. Scoped to Details/Inventory/Features/Spells/Effects
// (Biography untouched).
//
// Colors are marker-class-gated (.akd-header-color-active / .akd-border-color-active)
// rather than reassigning the shared native variables directly (--dnd5e-border-gold and
// the card header gradient are also used by other native chrome, like the outer window
// frame) - the override rule only applies once a color has actually been set, leaving
// native dnd5e.css untouched otherwise.
// ═══════════════════════════════════════════════════════════════════════════

const PANEL_TRANSPARENCY_FLAG = "panelTransparency";

function applyPanelTransparency(el, actor) {
  const current = actor.getFlag(MODULE_ID, PANEL_TRANSPARENCY_FLAG) ?? {};
  el.style.setProperty("--akd-header-alpha", `${current.headerAlpha ?? 100}%`);
  el.style.setProperty("--akd-item-alpha", `${current.itemAlpha ?? 100}%`);

  if (current.borderColor) {
    el.style.setProperty("--akd-border-color", current.borderColor);
    el.classList.add("akd-border-color-active");
  } else {
    el.style.removeProperty("--akd-border-color");
    el.classList.remove("akd-border-color-active");
  }

  if (current.headerColor) {
    el.style.setProperty("--akd-header-color", current.headerColor);
    el.classList.add("akd-header-color-active");
  } else {
    el.style.removeProperty("--akd-header-color");
    el.classList.remove("akd-header-color-active");
  }
}

/** Entry point: routes to CSS-var override (1 class) or DOM segments (2+ classes). */
function applyClassBackground(el, actor) {
  // A player's own explicit choice (Sheet Configuration dialog) always wins over the
  // automatic class-based blend, and forces the single-image path even for a
  // multiclassed actor - it's a deliberate pin, not a percentage.
  const override = resolveActorImageOverride(actor);
  const entries = override ? [override] : resolveClassBlend(actor);

  if (entries.length === 1) applySingleClassCssVars(el, entries[0].images);
  else clearClassCssVars(el);

  const multiclassEntries = !override && entries.length > 1 ? entries : [];
  injectHeaderBlend(el, multiclassEntries);
  injectBodyBlend(el, multiclassEntries);
}

// ── Hook registration ────────────────────────────────────────────────────────

function registerClassBackgroundHooks() {
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
      if (!actor || actor.type !== "character") return;
      if (actor.sheet !== app) return;
      const el = app.element instanceof HTMLElement ? app.element : (html?.[0] ?? html);
      if (!el) return;
      applyClassBackground(el, actor);
      applyPanelTransparency(el, actor);
    });
  }

  for (const sheets of Object.values(CONFIG.Actor?.sheetClasses?.character ?? {})) {
    let cls = sheets.cls;
    while (cls && cls.prototype) {
      register(cls);
      cls = Object.getPrototypeOf(cls);
    }
  }
}

Hooks.once("ready", async () => {
  await scanClassBackgroundFiles();
  registerClassBackgroundHooks();
});

// Class levels can change without a full sheet re-render being guaranteed (e.g. a level-up
// wizard completing) - re-evaluate explicitly whenever a class item on a character changes.
Hooks.on("updateItem", (item) => {
  if (item.type !== "class" || !item.actor || item.actor.type !== "character") return;
  refreshClassBackground(item.actor);
});
Hooks.on("createItem", (item) => {
  if (item.type !== "class" || !item.actor || item.actor.type !== "character") return;
  refreshClassBackground(item.actor);
});
Hooks.on("deleteItem", (item) => {
  if (item.type !== "class" || !item.actor || item.actor.type !== "character") return;
  refreshClassBackground(item.actor);
});

function refreshClassBackground(actor) {
  if (!actor?.sheet?.rendered) return;
  const el = actor.sheet.element instanceof HTMLElement ? actor.sheet.element : actor.sheet.element?.[0];
  if (!el) return;
  applyClassBackground(el, actor);
  applyPanelTransparency(el, actor);
}

// ═══════════════════════════════════════════════════════════════════════════
// Item Header Backgrounds (Race, Background)
//
// A GM-picked image spanning the top of a Race or Background item's own sheet (dnd5e's
// item-sheet header has no native background there to override - unlike the actor sheet's
// header, there's no existing --dnd5e-* variable for this, so this paints its own layer).
// Separate from the item's own native portrait image (.left > .document-image, untouched)
// since this slot wants a wider, more atmospheric image than a face-focused portrait crop -
// the matching actor-sheet pill (Creature Type Blend section above) reads this same flag for
// exactly that reason. Race and Background share every bit of this - only the item type
// differs - so it's written once, parameterized by ITEM_HEADER_BG_TYPES.
// ═══════════════════════════════════════════════════════════════════════════

const ITEM_HEADER_BG_FLAG = "itemHeaderBackground";
const ITEM_HEADER_BG_TYPES = ["race", "background"];

function pickItemHeaderBackground(item) {
  const FilePickerImpl = foundry.applications.apps.FilePicker.implementation;
  new FilePickerImpl({
    type: "image",
    current: item.getFlag(MODULE_ID, ITEM_HEADER_BG_FLAG) ?? "",
    callback: async path => {
      await item.setFlag(MODULE_ID, ITEM_HEADER_BG_FLAG, path);
      // Don't rely on the actor sheet auto-re-rendering off an embedded item's flag change -
      // explicitly refresh its pill too, same reasoning as refreshActorTypePill's own callers.
      refreshActorTypePill(item.actor);
    }
  }).render(true);
}

function applyItemHeaderBackground(el, item) {
  el.querySelector(":scope > .akd-item-header-bg")?.remove();
  el.querySelector(".akd-item-header-bg-button")?.remove();
  el.classList.remove("akd-header-bg-active");
  if (!ITEM_HEADER_BG_TYPES.includes(item.type)) return;

  // Native template renders .document-name as an <input> when editable, else a plain <div> -
  // reuse that instead of re-deriving edit-mode/permission logic.
  const identity = el.querySelector(".sheet-header .identity-info");
  const nameEl = identity?.querySelector(".document-name");
  const editable = nameEl?.tagName === "INPUT";
  if (identity && nameEl && editable) {
    identity.style.position = "relative";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "akd-item-header-bg-button unbutton";
    button.dataset.tooltip = game.i18n.localize("AKDP.ItemHeaderBackground.Pick");
    button.innerHTML = `<i class="fas fa-cog"></i>`;
    button.addEventListener("click", () => pickItemHeaderBackground(item));
    identity.appendChild(button);

    // .identity-info spans the full sheet-header height (flex:1, space-evenly with the
    // subtitles row below) - top:4px would anchor to THAT tall box, not to the name itself.
    // Measure the name's actual vertical center instead, so the button lines up with it
    // regardless of whether subtitles are present/how tall they are.
    const nameRect = nameEl.getBoundingClientRect();
    const identityRect = identity.getBoundingClientRect();
    button.style.top = `${nameRect.top - identityRect.top + nameRect.height / 2}px`;
  }

  const path = item.getFlag(MODULE_ID, ITEM_HEADER_BG_FLAG);
  if (!path) return;

  // Spans from the very top of the window down through the tab nav (Description/Details/
  // Advancement) - .window-header and .window-content are siblings under this root element,
  // so reaching behind both means living here, appended LAST so it paints above
  // .window-content's own opaque background (--dnd5e-color-parchment covers the sheet's full
  // height, including the tab content below - behind it would just get fully hidden). Height
  // is measured, not hardcoded - window-header/tab-nav heights aren't exposed as CSS variables
  // the way --dnd5e-sheet-header-height is. The CSS side lifts .window-header/.sheet-header/
  // nav.tabs back above this layer (position+z-index) so all native chrome stays visible/
  // clickable on top of it - only the space behind them shows the image.
  const navTabs = el.querySelector("nav.tabs");
  const height = navTabs ? navTabs.getBoundingClientRect().bottom - el.getBoundingClientRect().top : 170;

  el.classList.add("akd-header-bg-active");
  const bg = document.createElement("div");
  bg.className = "akd-item-header-bg";
  bg.style.backgroundImage = `url('${path}')`;
  bg.style.height = `${height}px`;
  el.appendChild(bg);
}

function registerItemHeaderBackgroundHooks() {
  const seen = new Set();

  function register(cls) {
    const name = cls?.name;
    if (!name || seen.has(name)) return;
    seen.add(name);
    Hooks.on(`render${name}`, (app, html) => {
      const item = app.document;
      if (!(item instanceof Item) || !ITEM_HEADER_BG_TYPES.includes(item.type)) return;
      if (item.sheet !== app) return;
      const el = app.element instanceof HTMLElement ? app.element : ensureHTMLElement(html);
      if (el) applyItemHeaderBackground(el, item);
    });
  }

  for (const itemType of ITEM_HEADER_BG_TYPES) {
    for (const sheets of Object.values(CONFIG.Item?.sheetClasses?.[itemType] ?? {})) {
      let cls = sheets.cls;
      while (cls && cls.prototype) {
        register(cls);
        cls = Object.getPrototypeOf(cls);
      }
    }
  }
}

Hooks.once("ready", registerItemHeaderBackgroundHooks);
