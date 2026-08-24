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

    if (item.type !== "equipment") return;
    // Material category/craft UI moved to materialCategoryCraft.mjs.
}

Hooks.on("renderItemSheet", onRenderItemSheet);
Hooks.on("renderItemSheet5e", onRenderItemSheet);
/**The way Foundry's data architecture works
//the Foundry system gets to define the system property on '?something?'
//e.g. system.quantity
//or system.attributes.str.value
//Modules work underneath flags
//and within flags, you're supposed to namespace stuff by package ID */
//"ada", "baa", "bro", "bye", "cin", "cop", "Dar", "eth", "gol", "iro", "ori", "qui", "sta", "ste", "thi", "tin"
// Climate, Color, Condition, craftLevel, 

/**Hooks.on('renderItemSheet5e', (app, html, data) => {
  const { item } = data
  if (!["loot", "equipment", "weapon"].includes(item.type)) return;
  const choices = { Craft_Matterial, Craft_Source, Cursed, Blessed, } // prep the info here 
  // im guessing these are what the dropdown boxes are labeled as AKA 4 drop down boxes
  const optionString = HandlebarsHelpers.selectOptions(Craft_Matterial, Craft_Source, Cursed, Blessed)
  { hash: { selected: item.getFlag("moduleid", "craftOptions") } }
  const htmlString = `<select name="flags.moduleid.craftOptions>${optionString}</select>`
  // use jquery to add it to the right spot in the `html`
  // - this means location on item sheet
  // I need to learn what is jquery and how too. 
})
 
 */
