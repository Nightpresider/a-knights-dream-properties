// A Knights Dream Properties - materialEffects.mjs
// Compatible with: Foundry VTT 14+, DND5E system
//
// Gameplay effects triggered by Material Craft - as opposed to materialCategoryCraft.mjs, which
// only owns the category/craft dropdowns and keeps system.properties in sync. This file is the
// home for every material-driven mechanical effect (tracked in dream.xlsx's Effect Tracker sheet).
//
// First effect: Cold Iron vs Fey (specifically Cold Iron, not plain Iron - traditional fey
// vulnerability, and this module already has a distinct "Cold Iron" material for it). Intensity
// scales with the actor's Fey percentage from the Species Blend system (creatureTypeBlend.mjs) -
// a creature isn't just "Fey or not", it can be a blend (e.g. 50% Fey / 50% Humanoid). Hit-bonus
// and burn have different thresholds/bases:
//   Fey %        <25   25   50   75   100
//   hit bonus:     0    1    2    4    8
//   burn/round:    0    0    1    2    4

const MODULE_ID = "a-knights-dream-properties";
// materialCategoryCraft.mjs's current minted key for "Cold Iron" (normalizeValue() strips the
// space) - not yet migrated to the drafted 3-letter convention ("col"), see dream.xlsx Punch List.
const COLD_IRON_KEY = "coldiron";
const FEY_KEY = "fey";
// Tags our injected bonus damage part so dnd5e.preCalculateDamage can find and scale/zero it per
// target actor - not a real dnd5e item property, can't collide with anything's `bypasses` set.
const FEY_BONUS_MARKER = "akdColdIronFeyBonus";

function hasColdIron(item) {
  return item?.system?.properties?.has?.(COLD_IRON_KEY) ?? false;
}

// Mirrors creatureTypeBlend.mjs's own resolveBlend() resolution order (Race item's flag if the
// actor has one embedded, else the actor's own flag directly) - that function isn't exported, so
// this is a small self-contained duplicate rather than a cross-file coupling change.
function getCreatureTypePercent(actor, typeKey) {
  const raceItem = actor?.system?.details?.race instanceof Item ? actor.system.details.race : null;
  const blend = (raceItem ?? actor)?.getFlag(MODULE_ID, "creatureTypeBlend");
  return blend?.types?.[typeKey] ?? 0;
}

// 0 below the threshold; otherwise doubles for every 25% past it (thresholdSteps=1 -> starts at
// 25% with base 1; thresholdSteps=2 -> starts at 50% with base 1).
function tieredMultiplier(pct, thresholdSteps) {
  const steps = Math.floor(pct / 25);
  return steps < thresholdSteps ? 0 : 2 ** (steps - thresholdSteps);
}

function feyHitMultiplier(actor) {
  return tieredMultiplier(getCreatureTypePercent(actor, FEY_KEY), 1);
}

function feyBurnMultiplier(actor) {
  return tieredMultiplier(getCreatureTypePercent(actor, FEY_KEY), 2);
}

// -- Weapon of Cold Iron: extra damage vs Fey on hit -----------------------------------------
// Fires the same whether or not midi-qol is active: midi-qol's Activity#rollDamage override
// calls through to this same core dnd5e method via super.rollDamage(), so one hook covers both.
//
// Unconditional at roll time (no target/Fey check here at all) - dnd5e rolls damage once per
// attack and applies that same roll to every targeted actor individually via
// Actor5e#calculateDamage, which runs once PER TARGET. Deciding "is this a Fey" at roll time would
// leak the bonus to every target of a multi-target attack; deciding it per target in
// dnd5e.preCalculateDamage below is the same mechanism dnd5e's own resistance/immunity already
// uses, and is what makes this correct even when a Fey and non-Fey are hit by the same attack.
Hooks.on("dnd5e.preRollDamageV2", (config) => {
  const item = config.subject?.item;
  if (!hasColdIron(item)) return;

  // akdLabel is rollBreakdown.mjs's opt-in convention for a human-readable name on this damage
  // part - without it, the breakdown display would just show "Necrotic damage".
  //
  // A flat "1", not "1d1": a one-sided die is deterministic (always evaluates to 1) but still
  // renders on the chat card as die notation rather than a plain number. A literal numeric
  // formula evaluates identically and displays as just "1" - preCalculateDamage below still
  // multiplies d.value the same way regardless of how the roll was expressed.
  config.rolls ??= [];
  config.rolls.push({
    parts: ["1"],
    data: {},
    options: { type: "necrotic", properties: [FEY_BONUS_MARKER], akdLabel: "Cold Iron vs Fey" }
  });
});

// A roll's options.properties survives into the DamageDescription.properties calculateDamage
// receives here - the same mechanism dnd5e uses for its own mgc/sil/ada bypass checks.
Hooks.on("dnd5e.preCalculateDamage", (actor, damages) => {
  const multiplier = feyHitMultiplier(actor);
  for (const d of damages) {
    if (!d.properties?.has?.(FEY_BONUS_MARKER)) continue;
    if (multiplier > 0) {
      d.value *= multiplier;
    } else {
      // Matches dnd5e's own immunity-zeroing pattern (d.value = 0, active.multiplier = 0) so the
      // Apply Damage tray displays this consistently with a real zero, not a display bug.
      d.value = 0;
      d.active ??= {};
      d.active.multiplier = 0;
    }
  }
});

// -- Fey wielding/wearing Cold Iron: damage at the start of its own turn ---------------------
// updateCombat fires on every connected client - gating on activeGM (the same pattern DAE uses
// for its own combat-turn-driven automation, dae/module/specialDurations.js) ensures exactly one
// client calls actor.applyDamage(), not one per connected GM/player.
Hooks.on("updateCombat", async (combat, update) => {
  if (!("turn" in update) && !("round" in update)) return;
  if (!game.users.activeGM?.isSelf) return;

  const actor = combat.combatant?.actor;
  const multiplier = feyBurnMultiplier(actor);
  if (!multiplier) return;

  const touchingColdIron = actor.items.some(item => item.system?.equipped && hasColdIron(item));
  if (!touchingColdIron) return;

  await actor.applyDamage([{ type: "necrotic", value: 1 * multiplier }]);
});

Hooks.once("ready", () => {
  console.log(`[${MODULE_ID}] materialEffects loaded and ready.`);
});
