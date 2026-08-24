
// A Knights Dream Properties - additionalEnrichers.mjs
// Compatible with: Foundry VTT 14+, DND5E system
Hooks.once("init", () => {
        const effects = {
                slowed: {
                        label: "Slowed",
                        icon: "modules/a-knights-dream/Icon/Actor - Status Conditoins/Slowed.webp",
                        reference: "Compendium.dnd5e.rules.JournalEntry.w7eitkpD7QQTB6j0.JournalEntryPage.aNXVztwFYrHinfGs{Slowed}"
                }
        };

        for (const [k, v] of Object.entries(effects)) {
                CONFIG.statusEffects.push({
                        _id: dnd5e.utils.staticID(k),
                        id: k,
                        name: v.label,
                        icon: v.icon,
                        reference: v.reference
                });
                CONFIG.DND5E.conditionTypes[k] = v;
        }
        // Rules
        CONFIG.DND5E.rules.v = "Compendium.world.organized-jes.JournalEntry.5bdM7VV8ehuP60I4.JournalEntryPage.0yIKw7lOsC81CbnS";
        CONFIG.DND5E.rules.vl = "Compendium.world.organized-jes.JournalEntry.5bdM7VV8ehuP60I4.JournalEntryPage.0In4JNglWXfCqDf0";
        CONFIG.DND5E.rules.vq = "Compendium.world.organized-jes.JournalEntry.5bdM7VV8ehuP60I4.JournalEntryPage.OV5uiIA1U9TV0bFb";
});

// Register a migration menu in Module Settings so admins can run the migration from UI
class AKDMigrationDialog extends FormApplication {
    static get defaultOptions() {
        const opts = {
            id: "akd-migration-dialog",
            title: "A Knights Dream Properties — Material Migration",
            template: `modules/a-knights-dream-properties/templates/migration-dialog.html`,
            width: 520
        };
        if (typeof foundry !== 'undefined' && foundry.utils && typeof foundry.utils.mergeObject === 'function') {
            return foundry.utils.mergeObject(super.defaultOptions, opts);
        }
        if (typeof mergeObject === 'function') return mergeObject(super.defaultOptions, opts);
        return Object.assign({}, super.defaultOptions, opts);
    }

    constructor(options = {}) { super(options); }

    activateListeners(html) {
        super.activateListeners(html);
        html.find('#run-migration').click(async () => {
            const fn = window.aKDProperties?.migrateAllMaterials;
            if (typeof fn !== 'function') return ui.notifications.error('Migration helper not available.');
            try {
                this.element.find('#run-migration').prop('disabled', true);
                const changed = await fn();
                ui.notifications.info(`Migration complete: ${changed} items updated.`);
            } catch (err) {
                console.error(err);
                ui.notifications.error('Migration failed; see console for details.');
            } finally {
                this.close();
            }
        });
        html.find('#close-dialog').click(() => this.close());
    }

    async _updateObject(event, formData) { /* no-op */ }
}

Hooks.once('ready', () => {
    game.settings.registerMenu('a-knights-dream-properties', 'runMaterialMigration', {
        name: 'Material Migration',
        label: 'Run material migration',
        icon: 'fas fa-hammer',
        type: AKDMigrationDialog,
        restricted: true
    });
});
