const api = foundry.applications.api;
const sheets = foundry.applications.sheets;

export class ElectricBastionlandItemSheet extends api.HandlebarsApplicationMixin(sheets.ItemSheetV2) {
    sheetContext = {};

    ///////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "electricbastionland-item",
            classes: ["electricbastionland", "sheet", "item"],
            actions: {

            },
            form: {
                submitOnChange: true,
                closeOnSubmit: false
            },
            window: {
                title: "Electric Bastionland Item",
                icon: "fas fa-item"
            },
            position: { width: 540, height: 335 }
        });
    }

    /** @override */
    static PARTS = {
        form: {
            template: "systems/electricbastionland/templates/sheets/item-sheet.hbs",
            classes: ["form-body"],
            tag: "form"
        }
    };

    ////////////////////////////////////////////////////////////////////////////////

    /** @override */
    async _prepareContext(options) {
        const baseData = await super._prepareContext();
        const context = {
            owner: baseData.document.isOwner,
            editable: baseData.editable,
            item: baseData.document,
            systemData: baseData.document.system,
            items: baseData.document.items,
            config: CONFIG.ELECTRIC_BASTIONLAND_CONFIG,
            isGm: baseData.user.isGM,
            effects: baseData.document.effects
        };
        this.sheetContext = context;
        return context;
    }



    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        // Roll handlers, click handlers, etc. would go here.
    }
}
