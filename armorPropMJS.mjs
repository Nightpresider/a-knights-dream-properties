// A Knights Dream Properties - armorPropMJS.mjs
// Compatible with: Foundry VTT 14+, DND5E system
function onRenderItemSheet(app) {
    const item = app.document;

    const eProp = {
        snaps: "Snaps",
        agile: "Agile",
        concealed: "Concealed",
        pocketed: "Pocketed",
        quickRelease: "Quick Release",
        weighted: "Weighted",
        // Armor Weight Class item markers — same key names as that module's
        // ITEM_MARKERS values, so checking these boxes here sets the exact
        // system.properties entries AWC's itemHasMarker() looks for.
        coversFace: "Covers Face",
        bypassFaceCover: "Bypass Face Cover",
        ignoresHandSlot: "Ignores Hand Slot"
    };

    for (const [k, v] of Object.entries(eProp)) {
        CONFIG.DND5E.validProperties.equipment.add(k);
        CONFIG.DND5E.itemProperties[k] = { label: v };
    }
    // ignoresHandSlot also needs to be settable on Weapons, not just
    // Equipment (shields) — a magic weapon can ignore its hand slot too.
    CONFIG.DND5E.validProperties.weapon?.add("ignoresHandSlot");

    // dnd5e's own native "Two-Handed" property (key "two") - normally weapon-only.
    // Registering it onto consumable too gets a free native Two-Handed checkbox on
    // potion/scroll/wand/etc. sheets, for Armor Weight Class's hand-slot system (a
    // "heavy" consumable that should collapse both hands, like a two-handed weapon).
    CONFIG.DND5E.validProperties.consumable?.add("two");

    // Registering "pocketed" onto container too lets a genuine dnd5e Container (backpack,
    // pouch, vial) become a pocket carrier itself, same as an equipment shield/belt already can.
    CONFIG.DND5E.validProperties.container?.add("pocketed");

    if (item.type !== "equipment") return;
    // Material category/craft UI moved to materialCategoryCraft.mjs.
}

Hooks.on("renderItemSheet", onRenderItemSheet);
Hooks.on("renderItemSheet5e", onRenderItemSheet);
