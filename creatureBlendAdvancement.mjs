// A Knights Dream Properties - creatureBlendAdvancement.mjs
// Compatible with: Foundry VTT 14+, DND5E system
//
// Two ways to gate a Race item's grants on Creature Type Blend % (see creatureTypeBlend.mjs):
//   1. A custom Advancement type ("Creature Blend Grant") with its own threshold field. Modeled on
//      dnd5e's own ItemGrantAdvancement, but apply()/reverse() persist directly instead of using
//      updateSource(): ItemGrantAdvancement can get away with in-memory staging because it always
//      runs through AdvancementManager against an actor clone that gets diffed-and-committed at the
//      end of the level-up/item-drop wizard. This type is triggered reactively by the blend-flag
//      hooks below instead, with no wizard ever committing on its behalf, so it persists for real.
//   2. Any native advancement type (Item Grant, ASI, Trait, etc.), by repurposing the shared Level
//      dropdown as a % threshold - Race items only, Class/Subclass left untouched. See the
//      "Native advancement types" section below.
//
// Race stays a native singleton (one per actor) - each race item is its own complete, self-
// contained package.

const MODULE_ID = "a-knights-dream-properties";
const FLAG_NS = MODULE_ID;
const ADVANCEMENT_TYPE = "AKDCreatureBlendGrant";

const { StringField, NumberField, ArrayField, SchemaField } = foundry.data.fields;

class AKDCreatureBlendGrantConfigurationData extends foundry.abstract.DataModel {
  static LOCALIZATION_PREFIXES = ["AKDP.ADVANCEMENT.CreatureBlendGrant"];

  static defineSchema() {
    return {
      creatureType: new StringField({ required: true, blank: false }),
      threshold: new NumberField({ required: true, integer: true, min: 1, max: 100, initial: 50 }),
      items: new ArrayField(new SchemaField({ uuid: new StringField() }), { required: true })
    };
  }
}

class AKDCreatureBlendGrantConfig extends dnd5e.applications.advancement.AdvancementConfigV2 {
  static DEFAULT_OPTIONS = {
    classes: ["akd-creature-blend-grant"],
    dropKeyPath: "items"
  };

  static PARTS = {
    ...super.PARTS,
    details: { template: `modules/${MODULE_ID}/templates/advancement/creature-blend-config-details.hbs` },
    items: { template: `modules/${MODULE_ID}/templates/advancement/creature-blend-config-items.hbs` }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    // Read CONFIG.DND5E.creatureTypes live rather than baking choices into the schema, so a type
    // added/removed later (by this or another module) doesn't turn an existing advancement into a
    // validation error - it just stops/starts appearing as selectable here.
    context.creatureTypeOptions = Object.entries(CONFIG.DND5E.creatureTypes).map(([value, { label }]) => ({
      value, label: game.i18n.localize(label), selected: value === this.advancement.configuration.creatureType
    }));
    context.items = this.advancement.configuration.items.map(data => ({ data }));
    return context;
  }
}

class AKDCreatureBlendGrantFlow extends dnd5e.applications.advancement.AdvancementFlowV2 {
  // This advancement is never applied via the level-up/item-drop wizard - apply()/reverse() are
  // driven exclusively by the reactive blend-percentage trigger hooks below. Without this override,
  // the base class's _handleForm would call advancement.apply() unconditionally the moment a GM
  // drops the race item on an actor, granting items before any blend has ever been set. The player
  // still sees this step (title/hint/summary, all inherited) as an informational page and clicks
  // through; nothing is granted here.
  async _handleForm(event, form, formData) {}
}

class AKDCreatureBlendGrantAdvancement extends dnd5e.documents.advancement.Advancement {
  static get metadata() {
    return foundry.utils.mergeObject(super.metadata, {
      dataModels: { configuration: AKDCreatureBlendGrantConfigurationData },
      order: 50,
      icon: "icons/svg/upgrade.svg",
      typeIcon: "icons/svg/upgrade.svg",
      title: game.i18n.localize("AKDP.ADVANCEMENT.CreatureBlendGrant.Title"),
      hint: game.i18n.localize("AKDP.ADVANCEMENT.CreatureBlendGrant.Hint"),
      validItemTypes: new Set(["race"]),
      apps: { config: AKDCreatureBlendGrantConfig, flow: AKDCreatureBlendGrantFlow }
    });
  }

  storagePath(level) {
    return "value.added";
  }

  configuredForLevel(level) {
    return !foundry.utils.isEmpty(this.value.added ?? {});
  }

  summaryForLevel(level, { configMode = false } = {}) {
    const typeConfig = CONFIG.DND5E.creatureTypes[this.configuration.creatureType];
    const typeLabel = typeConfig ? game.i18n.localize(typeConfig.label) : this.configuration.creatureType;
    const prefix = `${this.configuration.threshold}% ${typeLabel}: `;

    if (!this.value.added || configMode) {
      return prefix + this.configuration.items
        .filter(i => fromUuidSync(i.uuid))
        .reduce((html, i) => html + dnd5e.utils.linkForUuid(i.uuid), "");
    }
    return prefix + Object.keys(this.value.added).map(id => {
      const item = this.actor?.items.get(id);
      return item?.toAnchor({ classes: ["content-link"] }).outerHTML ?? "";
    }).join("");
  }

  get isGranted() {
    return !foundry.utils.isEmpty(this.value.added ?? {});
  }

  async apply(level, data = {}, options = {}) {
    if (!this.actor || this.isGranted) return;

    // Self-heal: if items bearing this advancement's own advancementOrigin flag already exist on the
    // actor (e.g. value.added bookkeeping fell out of sync after an interrupted apply, since our two
    // writes below aren't a single atomic transaction the way AdvancementManager's clone-diff-commit
    // is), recover the tracking data from them instead of granting duplicates.
    const origin = `${this.item.id}.${this.id}`;
    const already = this.actor.items.filter(i => i.getFlag("dnd5e", "advancementOrigin") === origin);
    if (already.length) {
      const added = {};
      for (const item of already) added[item.id] = item.getFlag("dnd5e", "sourceId") ?? item.uuid;
      await this.update({ "value.added": added });
      return;
    }

    const itemDatas = [];
    const added = {};
    for (const { uuid } of this.configuration.items) {
      const itemData = await this.createItemData(uuid);
      if (!itemData) continue;
      itemDatas.push(itemData);
      added[itemData._id] = uuid;
    }
    if (!itemDatas.length) return;

    await this.actor.createEmbeddedDocuments("Item", itemDatas, { keepId: true });
    await this.update({ "value.added": added });
  }

  async reverse(level, options = {}) {
    if (!this.actor) return;
    const added = this.value.added ?? {};
    const ids = Object.keys(added).filter(id => this.actor.items.has(id));
    if (!ids.length) {
      if (!foundry.utils.isEmpty(added)) await this.update({ "value.added": {} });
      return;
    }
    await this.actor.deleteEmbeddedDocuments("Item", ids);
    await this.update({ "value.added": {} });
  }
}

Hooks.once("init", () => {
  CONFIG.DND5E.advancementTypes[ADVANCEMENT_TYPE] = {
    documentClass: AKDCreatureBlendGrantAdvancement,
    validItemTypes: new Set(["race"])
  };

  // Gate native advancements' Level field for blend-tagged Race entries (see below); every other
  // advancement calls straight through to the original getter, unmodified.
  const proto = dnd5e.documents.advancement.Advancement.prototype;
  const nativeAppliesToClass = Object.getOwnPropertyDescriptor(proto, "appliesToClass").get;
  Object.defineProperty(proto, "appliesToClass", {
    configurable: true,
    get() {
      const type = this.flags?.[MODULE_ID]?.creatureType;
      if (this.item?.type !== "race" || !(this.level > 0) || !type) return nativeAppliesToClass.call(this);
      const pct = Math.round((this.level / CONFIG.DND5E.maxLevel) * 100);
      const blend = this.item.getFlag(MODULE_ID, "creatureTypeBlend");
      const current = type === "custom" ? (blend?.custom?.percent ?? 0) : (blend?.types?.[type] ?? 0);
      // Also true once already granted-but-now-under-threshold, so a reverse step can still be built.
      return (current >= pct) || this.configuredForLevel(this.level);
    }
  });
});

// ── Native advancement types: Level → % (Race items only) ──────────────────────
// dnd5e's Level dropdown is shared by every advancement-config window, Class/Subclass included, so
// this is a pure post-render DOM patch (never a subclass/override of that shared window) gated on
// item type - Class/Subclass config windows are unaffected. Tiers reuse levels 5/10/15/20 as
// 25/50/75/100%; level 0 keeps its native meaning, "Any Level" (ungated, fires immediately).

const PERCENT_LEVELS = { 5: 25, 10: 50, 15: 75, 20: 100 };

function onRenderAdvancementConfig(app, html) {
  if (app.item?.type !== "race") return;
  const root = app.element instanceof HTMLElement ? app.element : (html?.[0] ?? html);
  const levelSelect = root?.querySelector('select[name="level"]');
  if (!levelSelect || levelSelect.dataset.akdPercent) return;
  levelSelect.dataset.akdPercent = "true";

  for (const option of [...levelSelect.options]) {
    const value = Number(option.value);
    if (value === 0) continue; // native "Any Level" label stays
    if (value in PERCENT_LEVELS) option.textContent = `${PERCENT_LEVELS[value]}%`;
    else option.remove();
  }

  injectCreatureTypeField(levelSelect.closest(".form-group"), app.advancement);
}

/** Adds a Creature Type <select> right after the Level field, storing to advancement.flags. */
function injectCreatureTypeField(levelFormGroup, advancement) {
  if (!levelFormGroup || levelFormGroup.nextElementSibling?.dataset.akdCreatureTypeField !== undefined) return;

  const current = advancement.flags?.[MODULE_ID]?.creatureType ?? "";
  const options = Object.entries(CONFIG.DND5E.creatureTypes)
    .map(([value, { label }]) => `<option value="${value}" ${value === current ? "selected" : ""}>${game.i18n.localize(label)}</option>`)
    .join("");

  levelFormGroup.insertAdjacentHTML("afterend", `
    <div class="form-group" data-akd-creature-type-field>
      <label>${game.i18n.localize("AKDP.ADVANCEMENT.CreatureTypeField.Label")}</label>
      <div class="form-fields">
        <select data-akd-creature-type>
          <option value="">-</option>
          ${options}
          <option value="custom" ${current === "custom" ? "selected" : ""}>${game.i18n.localize("AKDP.CreatureTypeBlend.CustomTypeLabel")}</option>
        </select>
      </div>
    </div>`);

  levelFormGroup.nextElementSibling.querySelector("[data-akd-creature-type]").addEventListener("change", event => {
    advancement.update({ [`flags.${MODULE_ID}.creatureType`]: event.target.value || null });
  });
}

Hooks.on("renderAdvancementConfig", onRenderAdvancementConfig);

/**
 * Re-evaluate every Creature Blend Grant advancement on a race item against its current blend flag.
 * Idempotent: apply()/reverse() are themselves no-ops when already in the target state, so calling
 * this redundantly (e.g. from an unrelated flag change slipping past the guard below) is always safe.
 */
function evaluateBlend(item, blend) {
  const advancements = item.system.advancement?.filter(a => a.type === ADVANCEMENT_TYPE) ?? [];
  for (const advancement of advancements) {
    const pct = blend?.types?.[advancement.configuration.creatureType] ?? 0;
    if (pct >= advancement.configuration.threshold && !advancement.isGranted) advancement.apply(0);
    else if (pct < advancement.configuration.threshold && advancement.isGranted) advancement.reverse(0);
  }
}

/**
 * Re-evaluate every blend-tagged native advancement on a race item, via dnd5e's own AdvancementManager
 * (cloned actor, automaticApplication so only genuinely choice-requiring steps show a wizard page).
 * Reversal never needs a wizard page - forward() handles it unconditionally before any automatic-
 * application check, same as dnd5e's own level-down handling.
 */
function evaluateNativeBlendAdvancements(item, blend) {
  const actor = item.actor;
  if (!actor?.system.metadata?.supportsAdvancement || game.settings.get("dnd5e", "disableAdvancements")) return;

  const manager = new dnd5e.applications.advancement.AdvancementManager(actor, { automaticApplication: true });
  const clonedItem = manager.clone.items.get(item.id);
  const decisions = new Map(); // level -> Map(advancementId -> "forward"|"reverse")

  for (const advancement of clonedItem.system.advancement ?? []) {
    const type = advancement.flags?.[MODULE_ID]?.creatureType;
    if (!(advancement.level > 0) || !type) continue;
    const pct = Math.round((advancement.level / CONFIG.DND5E.maxLevel) * 100);
    const current = type === "custom" ? (blend?.custom?.percent ?? 0) : (blend?.types?.[type] ?? 0);
    const meets = current >= pct, already = advancement.configuredForLevel(advancement.level);
    if (meets === already) continue;
    const byLevel = decisions.get(advancement.level) ?? decisions.set(advancement.level, new Map()).get(advancement.level);
    byLevel.set(advancement.id, meets ? "forward" : "reverse");
  }
  if (!decisions.size) return;

  for (const [level, byId] of [...decisions].sort(([a], [b]) => a - b)) {
    for (const flow of dnd5e.applications.advancement.AdvancementManager.flowsForLevel(clonedItem, level)) {
      const type = byId.get(flow.advancement.id);
      if (type) manager.steps.push({ type, flow });
    }
  }
  if (manager.steps.length) manager.render(true);
}

Hooks.on("updateItem", (item, changes) => {
  if (item.type !== "race" || !item.isOwner) return;
  const blend = foundry.utils.getProperty(changes, `flags.${FLAG_NS}.creatureTypeBlend`);
  if (blend === undefined) return;
  const resolved = item.getFlag(FLAG_NS, "creatureTypeBlend");
  evaluateBlend(item, resolved);
  evaluateNativeBlendAdvancements(item, resolved);
});

Hooks.on("createItem", (item) => {
  if (item.type !== "race" || !item.actor || !item.isOwner) return;
  let blend = item.getFlag(FLAG_NS, "creatureTypeBlend");
  // A race item embedded onto an actor that already carried an orphaned blend flag (only possible in
  // the no-race-item branch, from before this race item existed - see creatureTypeBlend.mjs) inherits
  // it here, so grants evaluate immediately without the GM needing to reopen the dialog and hit Apply.
  if (!blend) {
    const orphaned = item.actor.getFlag(FLAG_NS, "creatureTypeBlend");
    if (orphaned) {
      item.setFlag(FLAG_NS, "creatureTypeBlend", orphaned);
      blend = orphaned;
    }
  }
  if (blend) {
    evaluateBlend(item, blend);
    evaluateNativeBlendAdvancements(item, blend);
  }
});
