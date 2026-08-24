// A Knights Dream Properties - creatureBlendAdvancement.mjs
// Compatible with: Foundry VTT 14+, DND5E system
//
// A custom Advancement type for Race items ("Creature Blend Grant") that grants/revokes Feature
// item(s) once a creature type reaches a percentage threshold in the actor's Creature Type Blend
// (see creatureTypeBlend.mjs), instead of the usual character-level gating. Modeled on dnd5e's own
// ItemGrantAdvancement, but apply()/reverse() persist directly instead of using updateSource():
// ItemGrantAdvancement can get away with in-memory staging because it always runs through
// AdvancementManager against an actor clone that gets diffed-and-committed at the end of the
// level-up/item-drop wizard. This advancement is triggered reactively by the blend-flag hooks below,
// with no wizard ever committing on its behalf, so it has to persist for real every time.

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
});

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

Hooks.on("updateItem", (item, changes) => {
  if (item.type !== "race" || !item.isOwner) return;
  const blend = foundry.utils.getProperty(changes, `flags.${FLAG_NS}.creatureTypeBlend`);
  if (blend === undefined) return;
  evaluateBlend(item, item.getFlag(FLAG_NS, "creatureTypeBlend"));
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
  if (blend) evaluateBlend(item, blend);
});
