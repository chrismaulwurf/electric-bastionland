const api = foundry.applications.api;
const sheets = foundry.applications.sheets;

export class ElectricBastionlandItemSheet extends api.HandlebarsApplicationMixin(sheets.ItemSheetV2) {
    sheetContext = {};

    ///////////////////////

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["electricbastionland", "sheet", "item"],  // das wirkt auf <div class="application ...">
            actions: {
                "item.inlineedit": function (event) {
                    this._onItemChangeValue(event);
                },
            },
            form: {
                submitOnChange: true,
                closeOnSubmit: false
            },
            window: {
                title: "Electric Bastionland Item",
                icon: "fas fa-item"
            },
            position: { width: 240, height: 335 },
            resizable: true
        });
    }

    /** @override */
    static PARTS = {
        form: {
            template: "systems/electricbastionland/templates/sheets/item-sheet.hbs",
            classes: ["form-body", "item-body"],
            tag: "form"
        }
    };

    ///////////////////////

    get title() {
        return "Item – " + this.item.name;
    }

    ///////////////////////

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

    ///////////////////////

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options);

        // Äußere Section mit Klassen versehen
        this.element.classList.add("electricbastionland", "sheet", "item");


        // Inline-Edit Inputs: Text und Number
        this.element.querySelectorAll('.inline-item-edit').forEach(input => {
            input.addEventListener('change', async (event) => {
                event.preventDefault();
                this._onItemChangeValue(event);
            });
        });

    }

    ///////////////////////
    // _onItemChangeValue

    async _onItemChangeValue(event) {
        event.preventDefault();
        const target = event.target;
        const itemId = this.document.id;
        const field = target.dataset.field === 'system.item' ? 'name' : target.dataset.field;
        let value = target.type === "number" ? Number(target.value) : target.value;
        if (target.dataset.dtype === 'Boolean') {
            value = target.checked;
        }


        //const item = this.actor.items.get(itemId);
        const item = this.document;
        if (!item) return;
        await item.update({ [field]: value });
        console.log(`Updated item ${itemId}: ${field} =`, value);
    }

    ///////////////////////

}
