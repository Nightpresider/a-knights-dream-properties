// A Knights Dream Properties - rollBreakdown.mjs
// Compatible with: Foundry VTT 14+, DND5E system
//
// A toggleable "why did this roll come out this way" breakdown on attack and damage chat cards.
// dnd5e's chat card only shows a combined modifier (e.g. "+3") - the named sub-values (ability
// modifier, proficiency, magic bonus, etc.) get merged into flat, unlabeled numeric terms before
// the Roll object exists, so they're not recoverable from it afterward.
//
// Recomputes the same recipe independently via dnd5e's own public methods, at chat-message
// render time rather than roll time - a roll-time hook keyed on Roll.parent misses rolls from
// modules (e.g. midi-qol) that roll without letting dnd5e create the ChatMessage itself, while
// message.getAssociatedActivity() resolves the activity from message flags regardless of who
// created it. Attack uses Activity#getAttackData({attackMode, ammunition}) to reproduce the
// {parts, data} recipe dnd5e built the roll from. Damage has no single recipe (each part is a
// real dice formula), so each roll already on the message (message.rolls, before
// aggregateDamageRolls merges them for card display) is listed as its own line; a part gets a
// real label via an opt-in options.akdLabel string, set by materialEffects.mjs on its Cold Iron
// bonus part.

const MODULE_ID = "a-knights-dream-properties";
const WORLD_MODE_SETTING = "rollBreakdownMode";
const CLIENT_SHOW_SETTING = "showRollBreakdown";

const ATTACK_LABELS = {
  mod: "Ability Modifier",
  prof: "Proficiency Bonus",
  bonus: "Weapon Bonus",
  weaponMagic: "Magic Weapon Bonus",
  ammoMagic: "Magic Ammunition Bonus",
  actorBonus: "Other Bonuses",
  situational: "Situational Bonus",
  // Items with a flat attack bonus (getAttackData's `this.attack.flat` branch) use this single
  // key instead of the mod/prof/etc. breakdown above.
  toHit: "Flat Attack Bonus"
};

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, WORLD_MODE_SETTING, {
    name: "AKDP.RollBreakdown.ModeName",
    hint: "AKDP.RollBreakdown.ModeHint",
    scope: "world",
    config: true,
    type: String,
    choices: {
      choice: "AKDP.RollBreakdown.ModeChoice",
      on: "AKDP.RollBreakdown.ModeOn",
      off: "AKDP.RollBreakdown.ModeOff"
    },
    default: "on"
  });

  game.settings.register(MODULE_ID, CLIENT_SHOW_SETTING, {
    name: "AKDP.RollBreakdown.ClientName",
    hint: "AKDP.RollBreakdown.ClientHint",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });
});

function shouldShowBreakdown() {
  const mode = game.settings.get(MODULE_ID, WORLD_MODE_SETTING);
  if (mode === "on") return true;
  if (mode === "off") return false;
  return game.settings.get(MODULE_ID, CLIENT_SHOW_SETTING);
}

// -- Recompute + display -----------------------------------------------------------------------

Hooks.on("renderChatMessageHTML", (message, html) => {
  if (!shouldShowBreakdown()) return;

  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root || root.querySelector(".akd-roll-breakdown")) return;

  const activity = message.getAssociatedActivity?.();
  const entries = [];

  for (const roll of message.rolls ?? []) {
    if (roll instanceof CONFIG.Dice.D20Roll) {
      if (!activity) continue;
      const { parts, data: values } = activity.getAttackData({
        attackMode: roll.options.attackMode,
        ammunition: roll.options.ammunition
      });
      entries.push(...parts
        .map(part => part.replace(/^@/, ""))
        .filter(key => ATTACK_LABELS[key])
        .map(key => ({ label: ATTACK_LABELS[key], value: values[key] }))
        .filter(entry => entry.value));
    } else if (roll instanceof CONFIG.Dice.DamageRoll) {
      const typeLabel = CONFIG.DND5E.damageTypes[roll.options.type]?.label
        ?? CONFIG.DND5E.healingTypes[roll.options.type]?.label
        ?? roll.options.type ?? "Damage";
      const label = roll.options.akdLabel ?? `${game.i18n.localize(typeLabel)} damage`;
      entries.push({ label, value: roll.total });
    }
  }

  if (!entries.length) return;

  const wrapper = document.createElement("details");
  wrapper.classList.add("akd-roll-breakdown");

  const summary = document.createElement("summary");
  summary.textContent = game.i18n.localize("AKDP.RollBreakdown.Summary");
  wrapper.appendChild(summary);

  const list = document.createElement("ul");
  for (const { label, value } of entries) {
    const li = document.createElement("li");
    const sign = value < 0 ? "-" : "+";
    li.innerHTML = `<span class="akd-roll-breakdown-label">${label}</span><span class="akd-roll-breakdown-value">${sign}${Math.abs(value)}</span>`;
    list.appendChild(li);
  }
  wrapper.appendChild(list);

  root.querySelector(".message-content")?.appendChild(wrapper);
});
