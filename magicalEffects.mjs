// A Knights Dream Properties - magicalEffects.mjs
// Compatible with: Foundry VTT 14+, DND5E system
//
// Adds "Blessed", "Cursed", and "Imbued" as selectable Active Effect types (dnd5e natively only
// has "base" and "enchantment"). Any item with an effect of type enchantment/blessed/cursed/imbued
// is automatically marked with the real dnd5e "magical" property (mgc), which drives the system's
// own resistance-bypass rules. If an item is marked magical without any such effect, the Effects
// tab and the Magical checkbox pulse for GMs as a data-integrity nudge, and a settings-menu tool
// lets a GM scan a compendium or world items for the same thing in bulk.

const MODULE_ID = "a-knights-dream-properties";
const MAGICAL_KEY = "mgc";
// Foundry namespaces module-provided document sub-types as "<moduleId>.<type>" - see the
// TypeDataModel JSDoc in foundry.mjs. An unnamespaced key (just "blessed") is silently ignored.
const CUSTOM_EFFECT_TYPES = {
  [`${MODULE_ID}.blessed`]: { label: "Blessed", icon: "icons/magic/holy/prayer-hands-glowing-yellow.webp" },
  [`${MODULE_ID}.cursed`]: { label: "Cursed", icon: "icons/magic/unholy/hand-claw-fire-blue.webp" },
  [`${MODULE_ID}.imbued`]: { label: "Imbued", icon: "icons/magic/movement/trail-streak-pink.webp" }
};
const QUALIFYING_EFFECT_TYPES = new Set(["enchantment", ...Object.keys(CUSTOM_EFFECT_TYPES)]);

class SimpleEffectKindData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {};
  }
}

Hooks.once("init", () => {
  CONFIG.ActiveEffect.typeLabels ??= {};
  CONFIG.ActiveEffect.typeIcons ??= {};

  // Labels are resolved from lang/en.json's TYPES.ActiveEffect.a-knights-dream-properties.* entries
  // (the same mechanism dnd5e uses for "Enchantment") - a runtime game.i18n.translations merge here
  // isn't reliable, since Foundry's i18n system can rebuild that object after "init" runs.
  for (const [type, { icon }] of Object.entries(CUSTOM_EFFECT_TYPES)) {
    CONFIG.ActiveEffect.dataModels[type] = SimpleEffectKindData;
    CONFIG.ActiveEffect.typeLabels[type] = `TYPES.ActiveEffect.${type}`;
    CONFIG.ActiveEffect.typeIcons[type] = icon;
  }
});

// Give Blessed/Cursed/Imbued their own sections in the Effects tab, the same way dnd5e gives
// Enchantment its own section, instead of falling wherever EffectsElement's default categorization
// happens to put an unrecognized type. Requires libWrapper since EffectsElement.prepareCategories
// is a static method with no hook of its own.
Hooks.once("setup", () => {
  if (!game.modules.get("lib-wrapper")?.active) {
    console.warn(`[${MODULE_ID}] libWrapper is not active - Blessed/Cursed/Imbued effects will still `
      + "work, but won't get their own section in the Effects tab (they'll fall into whatever "
      + "section dnd5e's default categorization puts them in).");
    return;
  }
  libWrapper.register(MODULE_ID, "dnd5e.applications.components.EffectsElement.prepareCategories",
    function (wrapped, effects, options) {
      const categories = wrapped(effects, options);
      const custom = {};
      for (const [type, { label }] of Object.entries(CUSTOM_EFFECT_TYPES)) {
        custom[type] = { type, label, effects: [], localizationPrefix: "DND5E.Effect" };
      }
      for (const category of Object.values(categories)) {
        category.effects = category.effects.filter(effect => {
          if (!custom[effect.type]) return true;
          custom[effect.type].effects.push(effect);
          return false;
        });
      }
      for (const [type, category] of Object.entries(custom)) {
        category.hidden = !category.effects.length;
        categories[type] = category;
      }
      return categories;
    }, "WRAPPER");
});

function hasQualifyingEffect(item) {
  return item.effects?.some(effect => QUALIFYING_EFFECT_TYPES.has(effect.type)) ?? false;
}

function isMagical(item) {
  return item.system?.properties?.has?.(MAGICAL_KEY) ?? false;
}

async function markMagicalIfQualifying(effect) {
  const item = effect.parent;
  if (!item || item.documentName !== "Item") return;
  if (!QUALIFYING_EFFECT_TYPES.has(effect.type)) return;
  if (!item.isOwner || isMagical(item)) return;
  const updated = new Set(item.system.properties ?? []);
  updated.add(MAGICAL_KEY);
  await item.update({ "system.properties": [...updated] });
}

Hooks.on("createActiveEffect", markMagicalIfQualifying);
Hooks.on("updateActiveEffect", (effect, changes) => {
  if ("type" in changes) markMagicalIfQualifying(effect);
});

// -- GM-only pulse warning: magical without a qualifying effect ------------------------------
function applyMagicalWarningPulse(app) {
  if (!game.user.isGM) return;
  const item = app.document;
  if (!item || !["weapon", "equipment"].includes(item.type)) return;
  if (!isMagical(item) || hasQualifyingEffect(item)) return;

  const root = app.element;
  if (!(root instanceof HTMLElement)) return;

  const effectsTabButton = root.querySelector('[data-action="tab"][data-tab="effects"]');
  effectsTabButton?.classList.add("akd-pulse-warning");

  const magicalInput = root.querySelector(`[name="system.properties.${MAGICAL_KEY}"]`);
  const magicalWrapper = magicalInput?.closest(".checkbox");
  magicalWrapper?.classList.add("akd-pulse-warning");
}

Hooks.on("renderItemSheet", applyMagicalWarningPulse);
Hooks.on("renderItemSheet5e", applyMagicalWarningPulse);

// -- Settings menu scanner tool ---------------------------------------------------------------
class AKDMagicalScanDialog extends FormApplication {
  static get defaultOptions() {
    const opts = {
      id: "akd-magical-scan-dialog",
      title: "A Knights Dream Properties — Magical Item Scan",
      template: `modules/${MODULE_ID}/templates/magical-scan-dialog.html`,
      width: 520
    };
    return foundry.utils.mergeObject(super.defaultOptions, opts);
  }

  async getData() {
    const packs = game.packs
      .filter(p => p.documentName === "Item")
      .map(p => ({ id: p.collection, label: p.title }));
    return { packs };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("#run-scan").click(this._onRunScan.bind(this));
  }

  async _onRunScan(event) {
    event.preventDefault();
    const select = this.element.find("#scan-source")[0];
    const source = select?.value ?? "world";

    let items;
    if (source === "world") {
      items = game.items.contents;
    } else {
      const pack = game.packs.get(source);
      items = pack ? await pack.getDocuments() : [];
    }

    const offenders = items
      .filter(item => ["weapon", "equipment"].includes(item.type))
      .filter(item => isMagical(item) && !hasQualifyingEffect(item));

    const resultsEl = this.element.find("#scan-results")[0];
    if (!resultsEl) return;
    if (!offenders.length) {
      resultsEl.innerHTML = `<p>No offenders found - every magical item has a qualifying effect.</p>`;
      return;
    }
    resultsEl.innerHTML = `
      <p>${offenders.length} item(s) marked magical with no Blessed/Cursed/Enchantment/Imbued effect:</p>
      <ul>${offenders.map(item => `<li>${item.name}</li>`).join("")}</ul>
    `;
  }

  async _updateObject() { /* no-op, this is a scan tool, not a data-editing form */ }
}

Hooks.once("ready", () => {
  game.settings.registerMenu(MODULE_ID, "scanMagicalItems", {
    name: "Scan for Unmarked Magical Items",
    label: "Scan items",
    hint: "Find items marked magical that have no Blessed/Cursed/Enchantment/Imbued effect explaining why.",
    icon: "fas fa-magnifying-glass-plus",
    type: AKDMagicalScanDialog,
    restricted: true
  });
});
