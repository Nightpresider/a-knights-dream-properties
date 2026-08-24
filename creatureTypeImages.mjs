// A Knights Dream Properties - creatureTypeImages.mjs
// Compatible with: Foundry VTT 14+, DND5E system
//
// Lets a GM override which image represents each creature type in the percentage-blend UI
// (creatureTypeBlend.mjs's segments). Resolution order:
//   1. An explicit world-setting override (set via the "Creature Type Images" settings menu) -
//      an escape hatch for pointing at a file outside the assets folder below.
//   2. modules/a-knights-dream-properties/assets/creature-type-blends/<key>.webp - edit/replace
//      that file directly and it's picked up with NO settings-menu step required. This is the
//      primary, expected workflow: every creature type already has a starting file there.
//   3. The native CONFIG.DND5E.creatureTypes icon, for a type with neither of the above.
// There's no way to synchronously check whether the assets-folder file actually exists from
// client JS without an async request, so (2) is used unconditionally once (1) is absent - a
// creature type added later with no matching file there just shows a broken image until one's
// added, rather than silently falling through to (3). Worth it for zero-config editing of the
// other ~20 that do have a file.

const MODULE_ID = "a-knights-dream-properties";
const SETTING_KEY = "creatureTypeImageOverrides";
const ASSETS_PATH = `modules/${MODULE_ID}/assets/creature-type-blends`;

export function getCreatureTypeIcon(key) {
  const overrides = game.settings.get(MODULE_ID, SETTING_KEY) ?? {};
  if (overrides[key]) return overrides[key];
  if (CONFIG.DND5E.creatureTypes[key]) return `${ASSETS_PATH}/${key}.webp`;
  return "icons/svg/mystery-man.svg";
}

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, SETTING_KEY, {
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });
});

class AKDCreatureTypeImagesConfig extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "akd-creature-type-images",
      title: game.i18n.localize("AKDP.CreatureTypeImages.Title"),
      template: `modules/${MODULE_ID}/templates/creature-type-images-config.html`,
      width: 480,
      height: 600,
      closeOnSubmit: false
    });
  }

  getData() {
    const overrides = game.settings.get(MODULE_ID, SETTING_KEY) ?? {};
    const types = Object.entries(CONFIG.DND5E.creatureTypes).map(([key, cfg]) => ({
      key,
      label: game.i18n.localize(cfg.label),
      icon: getCreatureTypeIcon(key),
      overridden: !!overrides[key]
    }));
    return { types };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find("[data-action='pick-image']").on("click", (event) => {
      const row = event.currentTarget.closest("[data-type-key]");
      const key = row?.dataset.typeKey;
      const input = row?.querySelector(`input[name="${key}"]`);
      const preview = row?.querySelector("img");
      const FilePickerImpl = foundry.applications.apps.FilePicker.implementation;
      const fp = new FilePickerImpl({
        type: "image",
        current: input?.value ?? "",
        callback: (path) => {
          if (input) input.value = path;
          if (preview) preview.src = path;
        }
      });
      fp.render(true);
    });

    html.find("[data-action='reset-image']").on("click", (event) => {
      const row = event.currentTarget.closest("[data-type-key]");
      const key = row?.dataset.typeKey;
      const input = row?.querySelector(`input[name="${key}"]`);
      const preview = row?.querySelector("img");
      // Clear the override entirely (not "set it to the current default path") so this type
      // goes back to following assets/creature-type-blends/<key>.webp automatically, including
      // any future edits to that file - pinning it to today's resolved path would defeat that.
      if (input) input.value = "";
      const fallback = getCreatureTypeIcon(key);
      if (preview) preview.src = fallback;
    });
  }

  async _updateObject(event, formData) {
    const overrides = {};
    for (const [key, value] of Object.entries(formData)) {
      // Compare against the convention-path default (what getCreatureTypeIcon resolves to with
      // no override), not the raw CONFIG icon - fields get pre-filled with that resolved value
      // (see getData()/the template), so an untouched field must be recognized as "no override"
      // rather than getting pinned to today's convention path forever, which would defeat the
      // whole point of auto-following future edits to that file.
      const defaultPath = CONFIG.DND5E.creatureTypes[key] ? `${ASSETS_PATH}/${key}.webp` : "";
      if (value && value !== defaultPath) overrides[key] = value;
    }
    await game.settings.set(MODULE_ID, SETTING_KEY, overrides);
  }
}

Hooks.once("ready", () => {
  game.settings.registerMenu(MODULE_ID, "creatureTypeImagesMenu", {
    name: "AKDP.CreatureTypeImages.MenuName",
    label: "AKDP.CreatureTypeImages.MenuLabel",
    hint: "AKDP.CreatureTypeImages.MenuHint",
    icon: "fas fa-images",
    type: AKDCreatureTypeImagesConfig,
    restricted: true
  });
});
