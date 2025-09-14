const api = foundry.applications.api;
const sheets = foundry.applications.sheets;

export class ElectricBastionlandActorSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {

    CHAT_TEMPLATE = "systems/electricbastionland/templates/chat/roll.hbs";
    CHAT_TEMPLATE_LUCK = "systems/electricbastionland/templates/chat/roll-luck.hbs";
    CHAT_TEMPLATE_DAMAGE = "systems/electricbastionland/templates/chat/roll-damage.hbs";
    sheetContext = {};

    ///////////////////////

    /** @override */
    static DEFAULT_OPTIONS = {
        id: "electricbastionland-actor",
        classes: ["electricbastionland", "sheet", "actor"],
        actions: {
            "item.edit": function (event) {
                this._onItemEdit(event);
            },
            "item.delete": function (event) {
                this._onItemDelete(event);
            },
            "actor.rest": function (event) {
                this._onRest(event);
            },
            "actor.restore": function (event) {
                this._onRestore(event);
            },
            "roll.stat": function (event) {
                this._onRollStat(event);
            },
            "roll.luck": function (event) {
                this._onRollForLuck(event);
            },
            "roll.damage": function (event) {
                this._onRollDamage(event);
            }, "edit-image": async function (event) {
                event.preventDefault();
                const FilePickerCls = foundry.applications.apps.FilePicker.implementation;
                const fp = new FilePickerCls({
                    type: "image",
                    current: "user-uploads",
                    callback: path => this._updateActorImage(path)
                });

                fp.render(true);
            },
        },
        form: {
            submitOnChange: true,
            closeOnSubmit: false
        },
        window: {
            title: "Electric Bastionland Actor",
            icon: "fas fa-user",
            resizable: true
        },
        position: {
            width: 630,
            height: 850
        },
        resizable: true
    };

    ///////////////////////

    /** @override */
    static PARTS = {
        form: {
            template: "systems/electricbastionland/templates/sheets/actor-sheet.hbs",
            classes: ["form-body"],
            tag: "form"
        }
    };

    ///////////////////////

    get title() {
        return "Charakter – " + this.actor.name;
    }

    ///////////////////////

    /** @override */
    async _prepareContext(options) {
        const baseData = await super._prepareContext();
        const context = {
            owner: baseData.document.isOwner,
            editable: baseData.editable,
            actor: baseData.document,
            systemData: baseData.document.system,
            items: baseData.document.items,
            config: CONFIG.ELECTRIC_BASTIONLAND_CONFIG,
            isGm: baseData.user.isGM,
            effects: baseData.document.effects
        };
        context.actor.system.abilities.STAER.fullName = game.i18n.localize("EB.Sheet.Strength");
        context.actor.system.abilities.DEX.fullName = game.i18n.localize("EB.Sheet.Dexterity");
        context.actor.system.abilities.CHA.fullName = game.i18n.localize("EB.Sheet.Charisma");
        await this._getOwnerData(context);
        this.sheetContext = context;
        return context;
    }

    ///////////////////////

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options);

        // Inline-Edit Inputs: Text und Number
        this.element.querySelectorAll('.inline-item-edit').forEach(input => {
            input.addEventListener('change', async (event) => {
                event.preventDefault();
                this._onItemChangeValue(event);
            });
        });

        // Inline-Edit Name
        this.element.querySelector('h1.char input').addEventListener('change', async (event) => {
            event.preventDefault();
            this.actor.name = event.target.value;
            if (this.actor.name !== '') {
                // Actor aktualisieren
                await this.actor.update({
                    name: this.actor.name
                });
            }
        });

        // Inline-Edit Name
        this.element.querySelector('.item-create').addEventListener('click', async (event) => {
            event.preventDefault();
            this._onItemCreate(event);
        });

    }

    ///////////////////////
    // onChangeForm

    /** @override */
    async _onChangeForm(formConfig, event) {
        event.preventDefault();

        if (!this.sheetContext.editable) return;

        // Finde das nächstgelegene <form>
        const form = event.target.closest("form");
        if (!form) return;

        // FormData aus dem Formular auslesen
        const formData = new FormData(form);
        const formDataObj = Object.fromEntries(formData);

        // Checkboxen explizit prüfen, auch wenn sie nicht angehakt sind
        form.querySelectorAll('input[type="checkbox"][data-dtype="Boolean"]').forEach(cb => {
            formDataObj[cb.name] = cb.checked;
        });

        // Expandiertes Objekt für verschachtelte System-Daten
        const expandedData = foundry.utils.expandObject(formDataObj);

        // Actor aktualisieren
        await this.actor.update(expandedData);
    }

    ///////////////////////
    // getPlayerById

    _getPlayerById(searchId) {
        return game.users.players.find(u => u.id === searchId) ?? null;
    }

    ///////////////////////
    // getOwnerData

    async _getOwnerData(context) {
        if (typeof context.actor.ownership === "object") {
            for (let ownerUserId in context.actor.ownership) {
                if (ownerUserId !== "default" && context.actor.ownership[ownerUserId] >= 3) {
                    const user = this._getPlayerById(ownerUserId);
                    if (user !== null) {
                        const playerName = user?.name ?? "";
                        if (context.actor.system.playerName !== playerName) {
                            await this.actor.update({ "system.playerName": playerName });
                        }
                        return;
                    }
                }
            }
        }
    }

    ///////////////////////
    // onRollStat

    async _onRollStat(event) {
        event.preventDefault();
        const dataset = event.target.dataset;
        const roll = new Roll(dataset.roll, this.actor.system);
        await roll.evaluate();
        const abilityKey = dataset.abilityKey;
        const abilityValue = this.actor.system.abilities[abilityKey]?.value ?? 0;

        const data = {
            abilityName: dataset.abilityName,
            abilityKey,
            abilityValue,
            rolledValue: roll.total,
            isSuccess: roll.total <= abilityValue
        };

        // Sonderfälle wie automatische 1/20
        if (roll.total === 1) data.isSuccess = true;
        if (roll.total === 20) data.isSuccess = false;

        const content = await foundry.applications.handlebars.renderTemplate(this.CHAT_TEMPLATE, data);

        roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content
        });
    }

    ///////////////////////
    // onRest

    async _onRest() {
        if (this.actor.system.deprived) {
            ui.notifications.warn(game.i18n.localize("EB.Notify.CannotRestWhenDeprived"));
            return;
        }
        await this.actor.update({ 'system.hp.value': this.actor.system.hp.max });
    }

    ///////////////////////
    // onRestore

    async _onRestore() {
        await this.actor.update({
            'system.abilities.STAER.value': this.actor.system.abilities.STAER.max,
            'system.abilities.DEX.value': this.actor.system.abilities.DEX.max,
            'system.abilities.CHA.value': this.actor.system.abilities.CHA.max
        });
    }

    ///////////////////////
    // onRollForLuck

    async _onRollForLuck(event, target) {
        event.preventDefault();
        const r = new Roll("1D6", this.actor.system);
        await r.evaluate();

        const data = {
            abilityName: game.i18n.localize("EB.Chat.Luck"),
            rolledValue: r.total
        };

        data.resultMessage = data.rolledValue <= 2
            ? game.i18n.localize("EB.Chat.Failure")
            : game.i18n.localize("EB.Chat.SuccessComplications");
        data.resultMessage = data.rolledValue >= 5
            ? game.i18n.localize("EB.Chat.SuccessFull")
            : data.resultMessage;

        data.successLevel = data.rolledValue <= 2 ? 0 : 1;
        data.successLevel = data.rolledValue >= 5 ? 2 : data.successLevel;

        const resultContent = await foundry.applications.handlebars.renderTemplate(this.CHAT_TEMPLATE_LUCK, data);

        r.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: resultContent
        });
    }

    ///////////////////////
    // _onItemChangeValue

    async _onItemChangeValue(event) {
        event.preventDefault();
        const target = event.target;
        const itemId = target.dataset.itemId;
        const field = target.dataset.field === 'item' ? 'name' : target.dataset.field;
        const value = target.type === "number" ? Number(target.value) : target.value;

        const item = this.actor.items.get(itemId);
        if (!item) return;

        await item.update({ [field]: value });
        console.log(`Updated item ${itemId}: ${field} =`, value);
    }

    ///////////////////////
    // _onItemEdit

    async _onItemEdit(event) {
        const li = event.target.closest(".item");
        const item = this.actor.items.get(li.dataset.itemId);
        item.sheet.render(true);
    }

    ///////////////////////
    // _onItemCreate

    async _onItemCreate(event) {
        event.preventDefault();
        const header = event.target;
        const type = 'item';
        const data = foundry.utils.duplicate(header.dataset);
        const name = `New Item`;
        const itemData = { name, type, data };
        delete itemData.data.type; // item instead of data
        return this.actor.createEmbeddedDocuments("Item", [itemData]);
    }

    ///////////////////////
    // _onItemDelete

    async _onItemDelete(event, target) {
        const li = event.target.closest(".item");
        await this.actor.deleteEmbeddedDocuments("Item", [li.dataset.itemId]);
    }



    _activateListeners(context, options) {
        // Update Inventory Item
        html.find('.item-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".item")[0];
            const item = this.actor.items.get(li.dataset.itemId);
            item.sheet.render(true);
        });

        // Delete Inventory Item
        html.find('.item-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".item")[0];
            this.actor.deleteEmbeddedDocuments("Item", [li.dataset.itemId]);
        });



    }


    async _updateActorImage(path) {
        this.actor.update({ img: path });
    }

    async onItemInlineEdit(event, target) {
        const itemId = event.target.dataset.itemId;
        const field = event.target.dataset.field;
        const item = this.actor.items.get(itemId);
        return item?.update({ [field]: event.target.value });
    }

    ///////////////////////
    // onRollDamage NEED TO CHECK

    async _onRollDamage(event, target) {
        event.preventDefault();
        const dataset = event.target.dataset;

        if (dataset.roll) {
            const isDeprived = this.actor.system.deprived;
            const roll = isDeprived ? "1D4" : dataset.roll;
            const weapon = dataset.weapon;

            const r = new Roll(roll, this.actor.system);
            await r.evaluate();

            const data = {
                abilityName: game.i18n.localize("EB.Item.Damage"),
                roll,
                weapon,
                isDeprived,
                rolledValue: r.total
            };

            const resultContent = await foundry.applications.handlebars.renderTemplate(this.CHAT_TEMPLATE_DAMAGE, data);

            r.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                content: resultContent
            });
        }
    }

    //////////////////////////////////////////////////////////////////////////////////////


}