// A Knights Dream Properties - materialCategoryCraft.mjs
// Compatible with: Foundry VTT 14+, DND5E system
// Module: a-knights-dream-properties

// -- Constants --------------------------------------------------------------------------------
const MODULE_ID = "a-knights-dream-properties";
const LEGACY_NAMESPACE = "moduleid";
const CATEGORY_FIELD = "materialCategory";
const CRAFT_FIELD = "materialCraft";
// dnd5e's native "Silvered" property - separate key from this module's own "silver"
// material-craft key. See syncSilveredProperty() below.
const SILVERED_KEY = "sil";
const EXTERNAL_MATERIAL_DATA = "modules/a-knights-dream/files/material-data-source.json";
const CATEGORY_LABELS = {
  Metals: "Metal",
  Wood: "Wood",
  Glass: "Glass",
  Stone: "Stone",
  Cloth: "Cloth",
  Osso: "Osso",
  Leatherwork: "Leather"
};

// -- Material data catalog (fallback when EXTERNAL_MATERIAL_DATA isn't reachable) -------------
const DEFAULT_MATERIAL_DATA = {
  categories: {
    Metals: { weightFactor: 1.0 },
    Wood: { weightFactor: 0.7 },
    Glass: { weightFactor: 0.9 },
    Stone: { weightFactor: 1.2 },
    Cloth: { weightFactor: 0.55 },
    Osso: { weightFactor: 0.85 },
    Leatherwork: { weightFactor: 0.88 }
  },
  materials: [
    { name: "Baatorium", category: "Metals" },
    { name: "Bronze", category: "Metals" },
    { name: "Cinnabryl", category: "Metals" },
    { name: "Gold", category: "Metals", overrideFactor: 1.1 },
    { name: "Mithril", category: "Metals", overrideFactor: 0.5 },
    { name: "Silver", category: "Metals", overrideFactor: 0.9 },
    { name: "Steel", category: "Metals" },
    { name: "Adamantine", category: "Metals", overrideFactor: 1.15 },
    { name: "Arandur", category: "Metals" },
    { name: "drift", category: "Metals" },
    { name: "Aurorum", category: "Metals" },
    { name: "Copper", category: "Metals" },
    { name: "Cyrite", category: "Metals" },
    { name: "Darksteel", category: "Metals", overrideFactor: 1.1 },
    { name: "Entropium", category: "Metals" },
    { name: "Fever Iron", category: "Metals" },
    { name: "Flametouched Iron", category: "Metals" },
    { name: "Hizagkuur", category: "Metals" },
    { name: "Living Metal", category: "Metals", overrideFactor: 1.0 },
    { name: "Mindsteel", category: "Metals" },
    { name: "Mournlode", category: "Metals" },
    { name: "Oerthblood", category: "Metals" },
    { name: "Platinum", category: "Metals", overrideFactor: 1.05 },
    { name: "Sentira", category: "Metals" },
    { name: "Starmetal", category: "Metals" },
    { name: "Susalian Chainweave", category: "Metals" },
    { name: "Ysgardian Heartwire", category: "Metals" },
    { name: "Tin", category: "Metals" },
    { name: "Stailinn", category: "Metals" },
    { name: "Soulbound Steel", category: "Metals", overrideFactor: 1.0 },
    { name: "Orichalcum", category: "Metals" },
    { name: "Etherium", category: "Metals" },
    { name: "Iron", category: "Metals" },
    { name: "Quicksilver", category: "Metals" },
    { name: "Thinaun", category: "Metals" },
    { name: "Lead", category: "Metals" },
    { name: "Birch", category: "Wood" },
    { name: "Bludbud", category: "Wood" },
    { name: "Bluleaf", category: "Wood" },
    { name: "Broon", category: "Wood" },
    { name: "Elder", category: "Wood" },
    { name: "Hazel", category: "Wood" },
    { name: "Holly", category: "Wood" },
    { name: "Iren", category: "Wood" },
    { name: "Juniper", category: "Wood" },
    { name: "Oak", category: "Wood" },
    { name: "Pine", category: "Wood" },
    { name: "Willow", category: "Wood" },
    { name: "Yew", category: "Wood" },
    { name: "Bronwood", category: "Wood" },
    { name: "Darkleaf", category: "Wood" },
    { name: "Darkwood", category: "Wood" },
    { name: "Duskwood", category: "Wood" },
    { name: "Leafweave", category: "Wood" },
    { name: "Wildwood", category: "Wood" },
    { name: "Bloodwood", category: "Wood" },
    { name: "Ash", category: "Wood" },
    { name: "Ironwood", category: "Wood", overrideFactor: 0.8 },
    { name: "Ivren", category: "Wood" },
    { name: "Beskar", category: "Glass" },
    { name: "Byeshk", category: "Glass" },
    { name: "Dimeriti", category: "Glass" },
    { name: "Ebony", category: "Glass" },
    { name: "Glass", category: "Glass" },
    { name: "Glassteel", category: "Glass" },
    { name: "Plutite", category: "Glass" },
    { name: "Pursuit", category: "Glass" },
    { name: "Shimmering", category: "Glass" },
    { name: "Stygian", category: "Glass" },
    { name: "Blended Quartz", category: "Glass" },
    { name: "Fluid Stone", category: "Glass" },
    { name: "Amber", category: "Glass" },
    { name: "Shimmer Ring", category: "Glass" },
    { name: "Coldron", category: "Stone" },
    { name: "Crystal", category: "Stone" },
    { name: "Malachite", category: "Stone" },
    { name: "Moonstone", category: "Stone" },
    { name: "Blueice", category: "Stone" },
    { name: "Elukian Clay", category: "Stone" },
    { name: "True Ice", category: "Stone" },
    { name: "Ceramic", category: "Stone" },
    { name: "Corundum", category: "Stone" },
    { name: "Elysian", category: "Stone" },
    { name: "Obsidian", category: "Stone" },
    { name: "Aethel", category: "Stone" },
    { name: "Cold Iron", category: "Stone" },
    { name: "Cotton", category: "Cloth" },
    { name: "Hemp", category: "Cloth" },
    { name: "Jute", category: "Cloth" },
    { name: "Linen", category: "Cloth" },
    { name: "Silk", category: "Cloth" },
    { name: "Shadowsilk", category: "Cloth" },
    { name: "Thistledown", category: "Cloth" },
    { name: "Twisted Silk", category: "Cloth" },
    { name: "Wool", category: "Cloth" },
    { name: "Bonemold", category: "Osso" },
    { name: "Chitin", category: "Osso" },
    { name: "Longgu", category: "Osso" },
    { name: "Forsworn", category: "Osso" },
    { name: "Dragonhide", category: "Osso" },
    { name: "Kaorti", category: "Osso" },
    { name: "Bone", category: "Osso" },
    { name: "Ivory", category: "Osso" },
    { name: "Scale", category: "Osso" },
    { name: "Ohmu", category: "Osso" },
    { name: "Osso", category: "Osso" },
    { name: "Feyken", category: "Leatherwork" },
    { name: "Olyther", category: "Leatherwork" },
    { name: "Pigskin", category: "Leatherwork" },
    { name: "Fur Hide", category: "Leatherwork" },
    { name: "Fur Heavy", category: "Leatherwork" },
    { name: "Dar'ether", category: "Leatherwork" },
    { name: "Abyssus Skin", category: "Leatherwork" },
    { name: "Tanned Pelt", category: "Leatherwork" },
    { name: "Cured Hide", category: "Leatherwork" },
    { name: "Boiled Plate-Hide", category: "Leatherwork" },
    { name: "Deather", category: "Leatherwork" },
    { name: "Heavy Fur", category: "Leatherwork" },
    { name: "Short Fur", category: "Leatherwork" },
    { name: "Pelt Hard", category: "Leatherwork" },
    { name: "Pelt Rigid", category: "Leatherwork" },
    { name: "Pelt Soft", category: "Leatherwork" }
  ]
};

// -- Setup / property registration -------------------------------------------------------------
const materialDataPromise = fetchMaterialData();

const MATERIAL_PROPERTY_TYPES = ["weapon", "equipment", "loot", "container", "tool"];

Hooks.once("init", () => {
  if (!game.modules.get("a-knights-dream")?.active) {
    console.warn("[a-knights-dream-properties] Missing required dependency 'a-knights-dream'. Material category/craft options may not populate correctly.");
  }
});

// Registering materials happens at "ready" rather than "init" so game.i18n.localize() is guaranteed
// to have all translations loaded - at "init" it's not reliable, and dnd5e's built-in properties
// (e.g. Adamantine's real key "ada") store their label as an i18n key, not literal text. Without a
// working localize() here we can't detect the collision and would register a useless duplicate
// "adamantine" key alongside the real one dnd5e's rules engine actually reads.
Hooks.once("ready", () => {
  // Registers every material from material-data-source.json (mirrored below in
  // DEFAULT_MATERIAL_DATA) as a valid item property - this module is the single source of truth
  // for material property keys.
  const existingLabels = new Set();
  for (const prop of Object.values(CONFIG.DND5E.itemProperties || {})) {
    if (!prop?.label) continue;
    existingLabels.add(normalizeValue(game.i18n.localize(prop.label)));
  }
  for (const material of DEFAULT_MATERIAL_DATA.materials) {
    const key = normalizeValue(material.name);
    if (!key || existingLabels.has(key) || CONFIG.DND5E.itemProperties[key]) continue;
    for (const type of MATERIAL_PROPERTY_TYPES) {
      CONFIG.DND5E.validProperties[type]?.add(key);
    }
    CONFIG.DND5E.itemProperties[key] = { label: material.name };
  }
});

// -- Data loading / small helpers ---------------------------------------------------------------
async function fetchMaterialData() {
  try {
    const response = await fetch(EXTERNAL_MATERIAL_DATA);
    if (response.ok) {
      const json = await response.json();
      if (json?.materials?.length) return json;
    }
  } catch (error) {
    console.warn("[a-knights-dream-properties] Could not load external material data:", error);
  }
  return DEFAULT_MATERIAL_DATA;
}

function normalizeValue(value) {
  return value?.toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, "") || "";
}

function propertyLabel(key, fallback) {
  const rawLabel = CONFIG.DND5E.itemProperties[key]?.label;
  return rawLabel ? game.i18n.localize(rawLabel) : fallback;
}

// -- Material definitions / lookup --------------------------------------------------------------
function buildMaterialDefinitions(materialData) {
  const labelToKey = new Map();
  for (const [key, prop] of Object.entries(CONFIG.DND5E.itemProperties || {})) {
    if (!prop?.label) continue;
    // Built-in dnd5e properties store `label` as an i18n key (e.g. "DND5E.ITEM.Property.Adamantine"),
    // not literal text. localize() is a safe no-op for labels that are already literal text.
    labelToKey.set(normalizeValue(game.i18n.localize(prop.label)), key);
  }

  const defs = [];
  for (const material of materialData.materials) {
    const normalized = normalizeValue(material.name);
    const key = labelToKey.get(normalized) || labelToKey.get(normalized.replace(/^(the|a|an)/, ""));
    if (!key) continue;
    const category = CATEGORY_LABELS[material.category] || material.category;
    defs.push({ key, name: material.name, category });
  }
  return defs.sort((a, b) => normalizeValue(b.name).length - normalizeValue(a.name).length);
}

function buildCategoryMap(definitions) {
  const categories = new Map();
  for (const def of definitions) {
    const list = categories.get(def.category) ?? [];
    list.push(def);
    categories.set(def.category, list);
  }
  return categories;
}

function getLegacyMaterialFlags(item) {
  const legacy = item.flags?.[LEGACY_NAMESPACE] || {};
  return {
    category: legacy[CATEGORY_FIELD],
    craft: legacy[CRAFT_FIELD],
    material: legacy.material
  };
}

function getCurrentMaterialFlags(item) {
  return {
    category: item.flags?.[MODULE_ID]?.[CATEGORY_FIELD],
    craft: item.flags?.[MODULE_ID]?.[CRAFT_FIELD]
  };
}

function ensureHTMLElement(html) {
  return html?.[0] ?? html;
}

function findMaterialFromProperties(item, definitions) {
  const properties = item.system?.properties;
  if (!properties || typeof properties.has !== "function") return null;
  return definitions.find(def => properties.has(def.key)) || null;
}

function findMaterialFromName(name, definitions) {
  const normalizedName = normalizeValue(name);
  if (!normalizedName) return null;
  return definitions.find(def => normalizedName.includes(normalizeValue(def.name))) || null;
}

async function migrateMaterialFlags(item, definitions) {
  const current = getCurrentMaterialFlags(item);
  const legacy = getLegacyMaterialFlags(item);
  let category = current.category;
  let craft = current.craft;

  if (!category || !craft) {
    if (legacy.material && !craft) {
      const entry = definitions.find(def => def.key === legacy.material);
      if (entry) {
        craft = entry.key;
        category = category || entry.category;
      }
    }
    if (!craft) {
      const entry = findMaterialFromProperties(item, definitions);
      if (entry) {
        craft = entry.key;
        category = category || entry.category;
      }
    }
    if (!craft) {
      const entry = findMaterialFromName(item.name, definitions);
      if (entry) {
        craft = entry.key;
        category = category || entry.category;
      }
    }
  }

  if ((category && craft) && item.isOwner) {
    const needsCategory = !current.category || current.category !== category;
    const needsCraft = !current.craft || current.craft !== craft;
    if (needsCategory) await item.setFlag(MODULE_ID, CATEGORY_FIELD, category);
    if (needsCraft) await item.setFlag(MODULE_ID, CRAFT_FIELD, craft);
  }

  return { category, craft };
}

// -- DOM rendering / insertion -------------------------------------------------------------------
function renderMaterialControls(html, category, craft, categories, categoryMap) {
  const categoryOptions = [""].concat([...categories]).map(value => {
    if (!value) return `<option value="" ${!category ? "selected" : ""}>Automatic</option>`;
    return `<option value="${value}" ${value === category ? "selected" : ""}>${value}</option>`;
  }).join("");

  const crafts = category ? [...(categoryMap.get(category) || [])].sort((a, b) => a.name.localeCompare(b.name)) : [];
  const craftOptions = crafts.map(def => {
    const label = propertyLabel(def.key, def.name);
    return `<option value="${def.key}" ${def.key === craft ? "selected" : ""}>${label}</option>`;
  }).join("");
  const craftOptionsHtml = `<option value="" ${!craft ? "selected" : ""}>Automatic</option>${craftOptions}`;

  const categoryHtml = `
    <div class="form-group akd-material-field">
      <label>Material Category</label>
      <select name="flags.${MODULE_ID}.${CATEGORY_FIELD}" data-category-select>
        ${categoryOptions}
      </select>
    </div>
  `;

  const craftHtml = `
    <div class="form-group akd-material-field" data-craft-group>
      <label>Material Craft</label>
      <select name="flags.${MODULE_ID}.${CRAFT_FIELD}" data-craft-select ${category ? "" : "disabled"}>
        ${craftOptionsHtml}
      </select>
    </div>
  `;

  return `
    <div class="akd-material-fields">
      ${categoryHtml}
      ${craftHtml}
    </div>
  `;
}

function findDetailsTab(html) {
  return html.querySelector('.tab[data-tab="details"]')
    || html.querySelector('.tab[data-tab=details]')
    || html.querySelector('.tab-pane#details')
    || html.querySelector('.tab-pane[data-tab="details"]')
    || html;
}

function findInsertPoint(html, item) {
  const detailsTab = findDetailsTab(html);
  if (item.type === "weapon") {
    const groups = Array.from(detailsTab.querySelectorAll('.form-group'));
    const labelMatch = label => label?.textContent?.trim().toLowerCase() === 'base weapon';
    const baseGroup = groups.find(group => labelMatch(group.querySelector('label')));
    if (baseGroup) return baseGroup;
    return detailsTab.querySelector('.form-group.stacked.weapon-properties')
      || detailsTab.querySelector('.form-group.stacked')
      || groups[0];
  }

  if (item.type === "container") {
    // containerTypeConfig.mjs inserts its own "Container Type" field first (loads earlier in
    // module.json, so its render hook always runs before this one on the same render pass) -
    // anchoring after it keeps Container Type / Material Category / Material Craft in one
    // predictable order, ahead of the raw properties fieldset this file strips checkboxes from
    // below. Falls back to the fieldset itself if that field isn't there for some reason.
    return detailsTab.querySelector('[data-akd-container-type-field]')
      || detailsTab.querySelector("fieldset")
      || detailsTab.querySelector('.form-group');
  }

  const equipmentGroup = detailsTab.querySelector('.form-group.stacked.equipment-properties')
    || detailsTab.querySelector('.form-group.stacked');
  return equipmentGroup || detailsTab.querySelector('.form-group');
}

function insertMaterialControls(html, item, controlsHtml) {
  const insertBefore = findInsertPoint(html, item);
  if (!insertBefore) return false;
  insertBefore.insertAdjacentHTML("afterend", controlsHtml);
  return true;
}

function updateCraftControlState(html, category, categoryMap) {
  const craftGroup = html.querySelector("[data-craft-group]");
  const craftSelect = html.querySelector("[data-craft-select]");
  if (!craftGroup || !craftSelect) return;
  if (!category) {
    craftGroup.style.display = "none";
    craftSelect.disabled = true;
    craftSelect.value = "";
    return;
  }
  craftGroup.style.display = "";
  craftSelect.disabled = false;
  const crafts = categoryMap.get(category) || [];
  if (craftSelect.value) {
    const valid = crafts.some(def => def.key === craftSelect.value);
    if (!valid) craftSelect.value = "";
  }
}

// -- Item sheet render hook -----------------------------------------------------------------------
async function onRenderItemSheet(app, html) {
  // ApplicationV2 sheets render in independent parts (header, tabs, footer, ...) and fire this
  // hook once per part, so `html` may only be a small fragment (e.g. the mode-slider toggle).
  // app.element is always the full, current sheet regardless of which part just re-rendered.
  html = app.element instanceof HTMLElement ? app.element : ensureHTMLElement(html);
  const item = app.document;
  if (!["weapon", "equipment", "container"].includes(item.type)) return;
  if (html.querySelector('.akd-material-fields')) return; // already inserted by an earlier part render

  const materialData = await materialDataPromise;
  const definitions = buildMaterialDefinitions(materialData);
  if (!definitions.length) {
    console.warn(`[${MODULE_ID}] No material definitions available for item "${item.name}" (${item.type}).`);
    return;
  }

  const categoryMap = buildCategoryMap(definitions);
  const categories = [...categoryMap.keys()];

  const legacy = getLegacyMaterialFlags(item);
  const current = getCurrentMaterialFlags(item);
  let category = current.category || legacy.category;
  let craft = current.craft || legacy.craft;

  const materialMatch = findMaterialFromProperties(item, definitions);
  if (materialMatch && !craft) {
    craft = materialMatch.key;
    category = category || materialMatch.category;
  }

  if (!craft) {
    const nameMatch = findMaterialFromName(item.name, definitions);
    if (nameMatch) {
      craft = nameMatch.key;
      category = category || nameMatch.category;
    }
  }

  if (category && craft && item.isOwner) {
    if (!current.category || current.category !== category) await item.setFlag(MODULE_ID, CATEGORY_FIELD, category);
    if (!current.craft || current.craft !== craft) await item.setFlag(MODULE_ID, CRAFT_FIELD, craft);
  }

  // Self-heals a material's own property key (e.g. "coldiron", "ada") on every sheet open, not
  // just on flag change - covers items whose Material Craft flag was already set (by import, an
  // earlier session, or before that material's property key existed) and so never went through
  // an actual flag CHANGE, which is the only thing that triggers the updateItem-hook sync below.
  const knownMaterialKeys = new Set(definitions.map(def => def.key));
  await syncMaterialProperty(item, knownMaterialKeys, craft || null);

  // Self-heals "sil" on every sheet open, not just on flag change - covers items that
  // already had Material Craft set to Silver before this existed.
  await syncSilveredProperty(item, craft || null);

  const controlsHtml = renderMaterialControls(html, category, craft, categories, categoryMap);
  const inserted = insertMaterialControls(html, item, controlsHtml);
  if (!inserted) {
    const detailsTabDebug = findDetailsTab(html);
    console.warn(`[${MODULE_ID}] Could not find insertion point for material controls on item "${item.name}" (${item.type}).`, {
      itemType: item.type,
      itemName: item.name,
      detailsTabExists: !!detailsTabDebug,
      formGroups: Array.from(detailsTabDebug.querySelectorAll('.form-group')).map(group => group.querySelector('label')?.textContent?.trim()),
      detailsTabOuterHTML: detailsTabDebug?.outerHTML?.slice(0, 800),
      htmlRootOuterHTML: html?.outerHTML?.slice(0, 300)
    });
    return;
  }

  updateCraftControlState(html, category, categoryMap);

  const categorySelect = html.querySelector(`[name="flags.${MODULE_ID}.${CATEGORY_FIELD}"]`);
  const craftSelect = html.querySelector(`[name="flags.${MODULE_ID}.${CRAFT_FIELD}"]`);

  if (categorySelect && craftSelect) {
    categorySelect.addEventListener("change", event => {
      const selectedCategory = event.target.value;
      const craftGroup = html.querySelector("[data-craft-group]");
      const craftDefs = selectedCategory
        ? [...(categoryMap.get(selectedCategory) || [])].sort((a, b) => a.name.localeCompare(b.name))
        : [];
      craftSelect.innerHTML = [`
        <option value="" selected>Automatic</option>
        ${craftDefs.map(def => {
          const label = propertyLabel(def.key, def.name);
          return `<option value="${def.key}">${label}</option>`;
        }).join("")}
      `].join("");
      if (craftGroup) craftGroup.style.display = selectedCategory ? "" : "none";
      craftSelect.disabled = !selectedCategory;
      if (!selectedCategory) craftSelect.value = "";
    });
  }

  // The weapon-properties checkboxes are custom <dnd5e-checkbox> elements; give the sheet one more
  // frame to finish attaching them before we search the DOM for ones to strip out.
  await new Promise(resolve => requestAnimationFrame(resolve));

  const materialKeys = new Set(definitions.map(def => def.key));
  const PROPERTY_PREFIX = "system.properties.";
  let removedCount = 0;
  const propertyNameEls = html.querySelectorAll(`[name^="${PROPERTY_PREFIX}"]`);
  for (const nameEl of propertyNameEls) {
    const key = nameEl.getAttribute("name").slice(PROPERTY_PREFIX.length);
    if (!materialKeys.has(key) && key !== SILVERED_KEY) continue;
    (nameEl.closest(".checkbox") || nameEl).remove();
    removedCount++;
  }
  if (materialKeys.size && removedCount === 0 && propertyNameEls.length) {
    console.warn(`[${MODULE_ID}] Found ${propertyNameEls.length} property checkboxes but removed none for item "${item.name}".`, {
      materialKeys: [...materialKeys],
      sampleNames: [...propertyNameEls].slice(0, 5).map(el => el.getAttribute("name"))
    });
  }
}

// -- Property sync (system.properties) -------------------------------------------------------------
async function syncMaterialProperty(item, materialKeys, newKey) {
  if (!item.isOwner) return;
  const current = item.system?.properties;
  if (!current || typeof current.has !== "function") return;
  const updated = new Set(current);
  let changed = false;
  for (const key of materialKeys) {
    if (key !== newKey && updated.has(key)) {
      updated.delete(key);
      changed = true;
    }
  }
  if (newKey && !updated.has(newKey)) {
    updated.add(newKey);
    changed = true;
  }
  if (changed) await item.update({ "system.properties": [...updated] });
}

// "sil" isn't one of this module's material-craft keys, so the sync above never touches
// it - keeps it a pure derivative of Material Craft instead of a separate checkbox.
async function syncSilveredProperty(item, craftKey) {
  if (!item.isOwner) return;
  const current = item.system?.properties;
  if (!current || typeof current.has !== "function") return;
  const shouldBeSilvered = craftKey === "silver";
  if (current.has(SILVERED_KEY) === shouldBeSilvered) return;
  const updated = new Set(current);
  if (shouldBeSilvered) updated.add(SILVERED_KEY);
  else updated.delete(SILVERED_KEY);
  await item.update({ "system.properties": [...updated] });
}

// Keep the item's real `system.properties` set (which drives dnd5e's own rules, e.g. resistance
// bypass for Adamantine) in sync whenever the Material Craft flag changes, whether that happens via
// auto-detection on render or the user picking a new option from the dropdown.
Hooks.on("updateItem", async (item, changes) => {
  const newCraft = foundry.utils.getProperty(changes, `flags.${MODULE_ID}.${CRAFT_FIELD}`);
  if (newCraft === undefined) return;
  if (!["weapon", "equipment", "container"].includes(item.type)) return;
  const materialData = await materialDataPromise;
  const definitions = buildMaterialDefinitions(materialData);
  const materialKeys = new Set(definitions.map(def => def.key));
  await syncMaterialProperty(item, materialKeys, newCraft || null);
  await syncSilveredProperty(item, newCraft || null);
});

// -- Hook registration --------------------------------------------------------------------------
Hooks.on("renderItemSheet", onRenderItemSheet);
Hooks.on("renderItemSheet5e", onRenderItemSheet);

Hooks.once("ready", () => {
  window.aKDProperties = window.aKDProperties || {};
  window.aKDProperties.migrateAllMaterials = migrateAllMaterials;
  console.log(`[${MODULE_ID}] materialCategoryCraft loaded and ready.`);
});

// -- Bulk migration helper -----------------------------------------------------------------------
// Scans world items and sets material flags when a material name is detected in the item's name.
async function migrateAllMaterials() {
  const materialData = await materialDataPromise;
  const definitions = buildMaterialDefinitions(materialData);
  if (!definitions.length) return ui.notifications?.warn("[a-knights-dream-properties] No material definitions available for migration.");
  let changed = 0;
  const items = (game.items && game.items.contents) ? game.items.contents : [];
  for (const item of items) {
    if (!["weapon", "equipment", "container"].includes(item.type)) continue;
    const curr = getCurrentMaterialFlags(item);
    if (curr.category && curr.craft) continue;
    const nameMatch = findMaterialFromName(item.name, definitions);
    if (nameMatch) {
      await item.setFlag(MODULE_ID, CATEGORY_FIELD, nameMatch.category);
      await item.setFlag(MODULE_ID, CRAFT_FIELD, nameMatch.key);
      changed++;
    }
  }
  ui.notifications?.info(`[a-knights-dream-properties] Material migration applied to ${changed} items.`);
  return changed;
}
