// A Knights Dream Properties - worldConfig.mjs
// Compatible with: Foundry VTT 14+, DND5E system
//
// Migrated from the "Before the Fog" world script TESTaKnightsWeaponProperties.js so this
// configuration lives with the rest of a-knights-dream-properties instead of the world. The
// world script has been retired; a-knights-dream stays a pure content/compendium module.

Hooks.once("init", () => {
  // -- Creature types -----------------------------------------------------------------------
  CONFIG.DND5E.creatureTypes.aberration = {
    label: "Aberration",
    plural: "aberrations",
    reference: "JournalEntry.Of1H8h2CHdEBsxwq.JournalEntryPage.auns2EJnXNRysz0I",
    icon: "modules/a-knights-dream/Icon/Journal - Faction/Abberation.webp"
  };
  CONFIG.DND5E.creatureTypes.avain = {
    label: "Avain",
    plural: "avains",
    reference: "JournalEntry.wtPFZs8gDVIBWKZD.JournalEntryPage.H2V47OdPBKXezmoA",
    icon: "modules/a-knights-dream/Icon/Journal - Faction/bird.webp"
  };
  CONFIG.DND5E.creatureTypes.beast = {
    label: "Beast",
    plural: "beasts",
    reference: "JournalEntry.Th7HORz0vhDamtIX.JournalEntryPage.R89X3glHk72entKU",
    icon: "modules/a-knights-dream/Icon/Journal - Faction/Beast.webp"
  };
  CONFIG.DND5E.creatureTypes.construct = {
    label: "Construct",
    plural: "constructs",
    reference: "Compendium.world.organized-jes.JournalEntry.B2qXSj6TYHUUf8C4.JournalEntryPage.66lw41UBqjfGuYkH",
    icon: "modules/a-knights-dream/Icon/Journal - Faction/Construct.webp"
  };
  CONFIG.DND5E.creatureTypes.elemental = {
    label: "Elemental",
    plural: "elementals",
    reference: "JournalEntry.XhzhaYsgHzY6aU4y.JournalEntryPage.mBV4IOiF4ZsxxjvP",
    icon: "modules/a-knights-dream/Icon/Journal - Faction/Elemental.webp"
  };
  CONFIG.DND5E.creatureTypes.fish = {
    label: "Fish",
    plural: "fishies",
    reference: "JournalEntry.LJqBJQfNTInX6dwu.JournalEntryPage.3YwGevH9uTDPMP3w",
    icon: "modules/a-knights-dream/Icon/Journal - Faction/Fish.webp"
  };
  CONFIG.DND5E.creatureTypes.humanoid.icon = "modules/a-knights-dream/Icon/Journal - Faction/Humanoid.webp";
  CONFIG.DND5E.creatureTypes.insect = {
    label: "Insect",
    plural: "insects",
    reference: "JournalEntry.kPZbfBiwEJJyutie.JournalEntryPage.fisuDZScHnChxVfA",
    icon: "modules/a-knights-dream/Icon/Journal - Faction/Insect.webp"
  };
  CONFIG.DND5E.creatureTypes.lycanthrope = {
    label: "Lycanthrope",
    plural: "lycanthropes",
    reference: "JournalEntry.AunzNLUuZ8S4Ru7a.JournalEntryPage.Jpt0twDhWMOJxn10",
    icon: "modules/a-knights-dream/Icon/Journal - Faction/Lycanthrope.webp"
  };
  CONFIG.DND5E.creatureTypes.monstrosity = {
    label: "Monstrosity",
    plural: "monstrosity",
    reference: "JournalEntry.O8PSBbUS5WHVybK3.JournalEntryPage.DGUd8amOVIdUvvvV",
    icon: "modules/a-knights-dream/Icon/Journal - Faction/Monstrosity.webp"
  };
  CONFIG.DND5E.creatureTypes.ooze = {
    label: "Ooze",
    plural: "ooze",
    reference: "JournalEntry.gzLFxtLjWDne2QtM.JournalEntryPage.GM7JYnWhzNm3Fx0v",
    icon: "modules/a-knights-dream/Icon/Journal - Faction/Ooze.webp"
  };
  CONFIG.DND5E.creatureTypes.plant = {
    label: "Plant",
    plural: "plants",
    reference: "JournalEntry.TbiyU4pUEUZEpMv8.JournalEntryPage.wPHK3AzbA8YbAnzk",
    icon: "modules/a-knights-dream/Icon/Journal - Faction/Plant.webp"
  };
  CONFIG.DND5E.creatureTypes.reptile = {
    label: "Reptile",
    plural: "reptiles",
    reference: "JournalEntry.S07xE8jKvUQywrsa.JournalEntryPage.RwELaxKn9xbOmKqj",
    icon: "modules/a-knights-dream/Icon/Journal - Faction/reptile.webp"
  };
  CONFIG.DND5E.creatureTypes.spirit = {
    label: "Spirit",
    plural: "spirits",
    reference: "JournalEntry.uIyR7GcImdqGoWin.JournalEntryPage.oy8JAHFTe2K9rwSz",
    icon: "modules/a-knights-dream/Icon/Journal - Faction/Spirit.webp"
  };
  CONFIG.DND5E.creatureTypes.undead = {
    label: "Undead",
    plural: "undeads",
    reference: "JournalEntry.oas6qi6CgilOxUEc.JournalEntryPage.iGxflqwLQlzsPv9a",
    icon: "modules/a-knights-dream/Icon/Journal - Faction/Undead.webp"
  };

  // -- Base weapon compendium links ----------------------------------------------------------
  CONFIG.DND5E.weaponIds.bardiche = "Compendium.world.unidentified-items.Item.QZFtuS9rZK1YbCy9";
  CONFIG.DND5E.weaponIds.bastardSword = "Compendium.world.unidentified-items.Item.rRuNx1Omv5aSTaAu";
  CONFIG.DND5E.weaponIds.battleAxe = "Compendium.world.unidentified-items.Item.slmiKvge8aUfq97Y";
  CONFIG.DND5E.weaponIds.blowgun = "Compendium.world.unidentified-items.Item.RmMvgGeymAYTdjXc";
  CONFIG.DND5E.weaponIds.bolt = "Compendium.world.unidentified-items.Item.0Gg8MWEHx5fuEJ1O";
  CONFIG.DND5E.weaponIds.boomerang = "Compendium.world.unidentified-items.Item.Cp58WXn3c9KHcoxP";
  CONFIG.DND5E.weaponIds.bow = "Compendium.world.unidentified-items.Item.Ez50THAn4raDAFO6";
  CONFIG.DND5E.weaponIds.caltrops = "Compendium.world.unidentified-items.Item.xlaksFQeeKo3ghdA";
  CONFIG.DND5E.weaponIds.cestus = "Compendium.world.unidentified-items.Item.apjHTJuyQzZ7QXTJ";
  CONFIG.DND5E.weaponIds.chain = "Compendium.world.unidentified-items.Item.HOxS1NLn0IExmtMe";
  CONFIG.DND5E.weaponIds.claymore = "Compendium.world.unidentified-items.Item.OD6Exn8oFLAZYSMh";
  CONFIG.DND5E.weaponIds.club = "Compendium.world.unidentified-items.Item.G39ZFISmeDv88CgS";
  CONFIG.DND5E.weaponIds.compoundBow = "Compendium.world.unidentified-items.Item.MLMsViISEqHuf7K2";
  CONFIG.DND5E.weaponIds.cutlass = "Compendium.world.unidentified-items.Item.zKlMUuzS9RnFqDm5";
  CONFIG.DND5E.weaponIds.dagger = "Compendium.world.unidentified-items.Item.B9hljuoHfcSBjd64";
  CONFIG.DND5E.weaponIds.dbleHeadAxe = "Compendium.world.unidentified-items.Item.g7Wx2Kl7ktxRCxDo";
  CONFIG.DND5E.weaponIds.flail = "Compendium.world.unidentified-items.Item.GoDbVxJM7Zv1ZGBw";
  CONFIG.DND5E.weaponIds.fauchardScythe = "Compendium.world.unidentified-items.Item.vFSVcmzRywiNdwyQ";
  CONFIG.DND5E.weaponIds.glaive = "Compendium.world.unidentified-items.Item.uPe9HFQTYmyo4Cey";
  CONFIG.DND5E.weaponIds.grapleHook = "Compendium.world.unidentified-items.Item.WncIDTp6lNBCMqoG";
  CONFIG.DND5E.weaponIds.greatAxe = "Compendium.world.unidentified-items.Item.nvtcEpe0ZLpAYqtl";
  CONFIG.DND5E.weaponIds.greatBow = "Compendium.world.unidentified-items.Item.dg5N5TShDZ1SJNqb";
  CONFIG.DND5E.weaponIds.greatClub = "Compendium.world.unidentified-items.Item.kE2ILc8P82Ps2BVO";
  CONFIG.DND5E.weaponIds.greatDbleHeadAxe = "Compendium.world.unidentified-items.Item.Jl1Q0wWRjRxcx5ia";
  CONFIG.DND5E.weaponIds.greatKhyber = "Compendium.world.unidentified-items.Item.iAziTUE0A6ENaXtu";
  CONFIG.DND5E.weaponIds.greatMace = "Compendium.world.unidentified-items.Item.uqDicYY6s8ZiRyPF";
  CONFIG.DND5E.weaponIds.greatWarHammer = "Compendium.world.unidentified-items.Item.hWSt7WJfmRas3g9m";
  CONFIG.DND5E.weaponIds.greatWarPick = "Compendium.world.unidentified-items.Item.iR0L6JfCTE91sK0B";
  CONFIG.DND5E.weaponIds.guisarme = "Compendium.world.unidentified-items.Item.ShH6wFRNYkUVtXpG";
  CONFIG.DND5E.weaponIds.handCrossBow = "Compendium.world.unidentified-items.Item.ybEWnPf8CPgcvpdS";
  CONFIG.DND5E.weaponIds.halberd = "Compendium.world.unidentified-items.Item.LjNqkLUaj4ojeSME";
  CONFIG.DND5E.weaponIds.handAxe = "Compendium.world.unidentified-items.Item.uYR0kd3ermyqHIpj";
  CONFIG.DND5E.weaponIds.harpoon = "Compendium.world.unidentified-items.Item.n18zyvqOD3rDg7Ev";
  CONFIG.DND5E.weaponIds.heavyCrossBow = "Compendium.world.unidentified-items.Item.6Cpwu99LnWyCRsy6";
  CONFIG.DND5E.weaponIds.huntingTrap = "Compendium.world.unidentified-items.Item.zmDxIBMfB8wJ6EKZ";
  CONFIG.DND5E.weaponIds.huntingTrapL = "Compendium.world.unidentified-items.Item.xlX5pBGsaN0DnNhg";
  CONFIG.DND5E.weaponIds.huntingTrapS = "Compendium.before-the-fog-compendia.items.Item.afK7nvU6wTBal12w";
  CONFIG.DND5E.weaponIds.javelin = "Compendium.world.unidentified-items.Item.lLUWPr3Kb238Cy72";
  CONFIG.DND5E.weaponIds.katana = "Compendium.world.unidentified-items.Item.zcfFRtL18GHnKW8e";
  CONFIG.DND5E.weaponIds.khpesh = "Compendium.world.unidentified-items.Item.Y7CqAymye8MYGjmw";
  CONFIG.DND5E.weaponIds.khyber = "Compendium.world.unidentified-items.Item.YiaYjpc3OJJQ0CcR";
  CONFIG.DND5E.weaponIds.lance = "Compendium.world.unidentified-items.Item.KMij20c7Nkb4Cnai";
  CONFIG.DND5E.weaponIds.lightCrossBow = "Compendium.world.unidentified-items.Item.Lgd1Pu62tigT7Wfm";
  CONFIG.DND5E.weaponIds.longBow = "Compendium.world.unidentified-items.Item.xpZj6Jm4HoFCD2qb";
  CONFIG.DND5E.weaponIds.longSpear = "Compendium.world.unidentified-items.Item.RmXkPUeYkdzSfssu";
  CONFIG.DND5E.weaponIds.lucerinceHammer = "Compendium.world.unidentified-items.Item.toaNQDqhHVwDL5w8";
  CONFIG.DND5E.weaponIds.mace = "Compendium.world.unidentified-items.Item.ihgjl74K0CF9nbKW";
  CONFIG.DND5E.weaponIds.morningstar = "Compendium.world.unidentified-items.Item.evLDPtogAjzYH0HE";
  CONFIG.DND5E.weaponIds.pike = "Compendium.world.unidentified-items.Item.FpAVyy6DVq5Xqgpf";
  CONFIG.DND5E.weaponIds.quarterStaff = "Compendium.world.unidentified-items.Item.GzVPdKTukP4YC0Vc";
  CONFIG.DND5E.weaponIds.ranseur = "Compendium.world.unidentified-items.Item.mtjyTYeal0EmpQfJ";
  CONFIG.DND5E.weaponIds.rapier = "Compendium.world.unidentified-items.Item.wyAwP7drrgCMZSJA";
  CONFIG.DND5E.weaponIds.recurveBow = "Compendium.world.unidentified-items.Item.TlDiaXioY5BHtdCl";
  CONFIG.DND5E.weaponIds.repeaterCrossBow = "Compendium.world.unidentified-items.Item.JmHl6mgSQozhYvVT";
  CONFIG.DND5E.weaponIds.sabre = "Compendium.world.unidentified-items.Item.rQnKc5JTvMxWtPuJ";
  CONFIG.DND5E.weaponIds.scimitar = "Compendium.world.unidentified-items.Item.oUhZ26ZogIdYQmdN";
  CONFIG.DND5E.weaponIds.scythe = "Compendium.world.unidentified-items.Item.Ie0ImxukmvK5v6Rj";
  CONFIG.DND5E.weaponIds.shortBow = "Compendium.world.unidentified-items.Item.I2hYG2p9iXDMQFQt";
  CONFIG.DND5E.weaponIds.shortSpear = "Compendium.world.unidentified-items.Item.gZjXqc28xlDhK9Cn";
  CONFIG.DND5E.weaponIds.shortSword = "Compendium.world.unidentified-items.Item.66ut8dlnZDDOTERl";
  CONFIG.DND5E.weaponIds.shotel = "Compendium.world.unidentified-items.Item.kADzJb1zcx2xqPS5";
  CONFIG.DND5E.weaponIds.sickle = "Compendium.world.unidentified-items.Item.qGhR1u2HBCni3jK6";
  CONFIG.DND5E.weaponIds.sling = "Compendium.world.unidentified-items.Item.SMNBnciq6hZ7z4yI";
  CONFIG.DND5E.weaponIds.staff = "Compendium.world.unidentified-items.Item.EmokdXGeiOXPBuRV";
  CONFIG.DND5E.weaponIds.sword = "Compendium.world.unidentified-items.Item.TuglXcXIhZaTCVVR";
  CONFIG.DND5E.weaponIds.tapal = "Compendium.world.unidentified-items.Item.SDLVbDCbqMKzANyI";
  CONFIG.DND5E.weaponIds.trident = "Compendium.world.unidentified-items.Item.kIHlddUls5aP4Qdw";
  CONFIG.DND5E.weaponIds.warhammer = "Compendium.world.unidentified-items.Item.aKvQjoZlana4ImIC";
  CONFIG.DND5E.weaponIds.warpick = "Compendium.world.unidentified-items.Item.twMfycNgGgYYOFoJ";
  CONFIG.DND5E.weaponIds.konda = "Compendium.world.unidentified-items.Item.0s8xrMYreZsOZGWr";
  CONFIG.DND5E.weaponIds.greatkonda = "Compendium.world.unidentified-items.Item.GBCEgju6u1yNOqlV";

  // -- Weapon type categories (replaces dnd5e's simple/martial split) -----------------------
  CONFIG.DND5E.weaponProficiencies = CONFIG.DND5E.weaponProficienciesMap = CONFIG.DND5E.weaponTypes = {
    skr: "Transpiercive", // Staff & Spear
    gun: "Launching", // Gun & Bow
    swd: "Lacerater", // Sword
    bsh: "Disequilibrated", // Club & Axe
    grb: "Circuitous" // Hook & Whip
  };

  foundry.utils.mergeObject(CONFIG.DND5E.weaponProficiencies, {
    skr: "Transpiercive",
    gun: "Launching",
    swd: "Lacerater",
    bsh: "Disequilibrated",
    grb: "Circuitous"
  });
  foundry.utils.mergeObject(CONFIG.DND5E.weaponProficienciesMap, {
    skrs: "skr",
    skrm: "skr",
    skre: "skr",
    pnts: "gun",
    pntm: "gun",
    pnte: "gun",
    swds: "swd",
    swdm: "swd",
    swde: "swd",
    bshs: "bsh",
    bshm: "bsh",
    bshe: "bsh",
    grbs: "grb",
    grbm: "grb",
    grbe: "grb"
  });
  foundry.utils.mergeObject(CONFIG.DND5E.weaponTypes, {
    skrs: "Transpiercive Simple",
    skrm: "Transpiercive Martial",
    skre: "Transpiercive Exotic",
    pnts: "Launching Simple",
    pntm: "Launching Martial",
    pnte: "Launching Exotic",
    swds: "Lacerater Simple",
    swdm: "Lacerater Martial",
    swde: "Lacerater Exotic",
    bshs: "Disequilibrated Simple",
    bshm: "Disequilibrated Martial",
    bshe: "Disequilibrated Exotic",
    grbs: "Circuitous Simple",
    grbm: "Circuitous Martial",
    grbe: "Circuitous Exotic"
  });
  delete CONFIG.DND5E.weaponTypes.simpleM;
  delete CONFIG.DND5E.weaponTypes.simpleR;
  delete CONFIG.DND5E.weaponTypes.exotic;
  delete CONFIG.DND5E.weaponTypes.martialM;
  delete CONFIG.DND5E.weaponTypes.martialR;
  delete CONFIG.DND5E.weaponProficienciesMap.simpleM;
  delete CONFIG.DND5E.weaponProficienciesMap.simpleR;
  delete CONFIG.DND5E.weaponProficienciesMap.martialR;
  delete CONFIG.DND5E.weaponProficienciesMap.martialM;
  delete CONFIG.DND5E.weaponProficienciesMap.exotic;

  // -- Custom weapon properties (not materials - those live in materialCategoryCraft.mjs) --
  const wProp = {
    arching: "Arching",
    bludgeon: "Bludgeon",
    brawlter: "Brawlter",
    breaker: "Breaker",
    brutal: "Brutal",
    bulky: "Bulky",
    bypass: "Bypass",
    cavalry: "Cavalry",
    compounding: "Compounding",
    covert: "Covert",
    cumbersome: "Cumbersome",
    dancing: "Dancing",
    defencive: "Defencive",
    deflective: "Deflective",
    dismounting: "Dismounting",
    drub: "Drub",
    ensnaring: "Ensnaring",
    entangle: "Entangle",
    famous: "Famous",
    feign: "Feign",
    finisher: "Finisher",
    handy: "Handy",
    herculean: "Herculean",
    hidden: "Hidden",
    hollowed: "Hollowed",
    impotent: "Impotent",
    lacerate: "Lacerate",
    momentum: "Momentum",
    parry: "Parry",
    polearm: "Polearm",
    proner: "Proner",
    ranged: "Ranged",
    rigidRange: "Rigid_Range",
    staking: "Staking",
    status: "Status",
    stubby: "Stubby",
    sundering: "Sundering",
    sweep: "Sweep",
    swift: "Swift",
    tethering: "Tethering",
    topple: "Topple",
    windUp: "Wind-Up",
    winged: "Winged"
  };
  for (const [k, v] of Object.entries(wProp)) {
    CONFIG.DND5E.validProperties.weapon.add(k);
    CONFIG.DND5E.itemProperties[k] = { label: v };
  }

  // -- Custom feature/consumable/loot subtypes ------------------------------------------------
  CONFIG.DND5E.featureTypes.actAct = {
    label: "Actor Action", subtypes: {
      first: "Natural Meele Attack",
      second: "Natural Ranged Attack",
      thrid: "Inate Touch Spell",
      forth: "Inate Ranged Spell"
    }
  };
  CONFIG.DND5E.featureTypes.statCon = {
    label: "Status Condition", subtypes: {
      first: "Negative",
      second: "Boon",
      third: "Hex",
      forth: "Enviromental",
      fifth: "Blessing",
      sixth: "Heritage"
    }
  };
  CONFIG.DND5E.featureTypes.itmProp = {
    label: "Item Property", subtypes: {
      first: "Climate",
      second: "Condition",
      third: "Craft Level",
      forth: "Craft Material",
      fifth: "Craft Source",
      sixth: "Design",
      seventh: "Modification",
      eighth: "Weapon",
      ninth: "Armor",
      tenth: "Transport"
    }
  };
  CONFIG.DND5E.consumableTypes.liquid = {
    label: "Liquid",
    subtypes: {
      first: "Contact",
      second: "Ingested",
      third: "Inhaled",
      forth: "Injury"
    }
  };
  CONFIG.DND5E.lootTypes.Monsterparts = {
    label: "Monster Parts",
    subtypes: {
      first: "Liquid",
      second: "Bone",
      third: "Egg",
      forth: "Eye",
      fifth: "Flesh",
      sixth: "Hoof",
      seventh: "Guts",
      eighth: "Skin",
      ninth: "Defication",
      tenth: "Tentical",
      eleven: "Appendage"
    }
  };
  CONFIG.DND5E.featureTypes.species = {
    label: "Species Category",
    subtypes: {
      first: "Aberration Feature",
      second: "Beast Feature",
      third: "Bird Feature",
      forth: "Construct Feature",
      fifth: "Elemental Feature",
      sixth: "Fish Feature",
      seventh: "Giant Feature",
      eighth: "Humanoid Feature",
      ninth: "Insect Feature",
      tenth: "Monstrosity Feature",
      eleven: "Ooze Feature",
      twelve: "Plant Feature",
      thirteen: "Reptile Feature",
      fourteen: "Spirit Feature",
      fifteen: "Undead Feature"
    }
  };
  CONFIG.DND5E.featureTypes.consum = CONFIG.DND5E.consumableTypes.liquid;

  // -- Poison/consumable properties (creature-type specialized) -----------------------------
  // The original world script's registration loop for these was broken (referenced undefined
  // variables, threw on every load) - only the design notes in comments survived. Registering
  // the properties themselves here; the "effective against / heals" creature-type relationships
  // from those notes are exposed as data on CONFIG.AKD_POISON_TYPES for later use, but no
  // mechanical damage/healing behavior is wired up - that was never actually implemented before.
  const POISON_TYPES = {
    neutralitatis: { label: "Neutralitatis", effectiveAgainst: ["aberration", "monstrosity", "ooze"], heals: ["avain", "fish"] },
    faunatear: { label: "Faunatear", effectiveAgainst: ["beast", "giant", "humanoid"], heals: ["spirit", "undead"] },
    aviserary: { label: "Aviserary", effectiveAgainst: ["avain"], heals: ["construct"] },
    razen: { label: "Razen", effectiveAgainst: ["construct"], heals: ["aberration"] },
    piscicide: { label: "Piscicide", effectiveAgainst: ["fish"], heals: ["ooze"] },
    insecticide: { label: "Insecticide", effectiveAgainst: ["insect"], heals: ["elemental"] },
    potassix: { label: "Potassix", effectiveAgainst: ["elemental", "reptile"], heals: ["monstrosity"] },
    herbacide: { label: "Herbacide", effectiveAgainst: ["plant"], heals: ["reptile"] },
    positoxin: { label: "Positoxin", effectiveAgainst: ["spirit", "undead"], heals: ["beast", "giant", "humanoid"] }
  };
  CONFIG.AKD_POISON_TYPES = POISON_TYPES;
  for (const [key, data] of Object.entries(POISON_TYPES)) {
    CONFIG.DND5E.validProperties.consumable.add(key);
    CONFIG.DND5E.itemProperties[key] = { label: data.label };
  }
});
