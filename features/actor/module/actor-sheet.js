/**
 * @extends {ActorSheet}
 */
export class ElectricBastionlandActorSheet extends ActorSheet {
    
    CHAT_TEMPLATE = "systems/electricbastionland/features/chat/template/roll.hbs";
    CHAT_TEMPLATE_LUCK = "systems/electricbastionland/features/chat/template/roll-luck.hbs";
    CHAT_TEMPLATE_DAMAGE = "systems/electricbastionland/features/chat/template/roll-damage.hbs";

    ///////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////
    
    /** @override */
    static get defaultOptions () {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: [
                "electricbastionland",
                "sheet",
                "actor"
            ],
            template: "systems/electricbastionland/features/actor/template/actor-sheet.hbs",
            width: 620,
            height: 640,
            tabs: [
                {
                    navSelector: ".sheet-tabs",
                    contentSelector: ".sheet-body",
                    initial: "items",
                },
            ],
        });
    }

    ///////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////
    
    /** @override */
    getData () {
        let context = super.getData();
        context.data.system.abilities.CHA.fullName = game.i18n.localize("EB.Sheet.Charisma");
        context.data.system.abilities.DEX.fullName = game.i18n.localize("EB.Sheet.Dexterity");
        context.data.system.abilities.STR.fullName = game.i18n.localize("EB.Sheet.Strength");
        //..............................
        this._getOwnerData(context);
        //..............................
        context.systemData = context.data.system;   
        //..............................
        return context;
    }

    ///////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////
    
    /** @override */
    async _getOwnerData (context) {
        if(typeof context.data.ownership === 'object'){
            for(let ownerUserId in context.data.ownership){
                if(ownerUserId !== 'default' && context.data.ownership[ownerUserId] >= 3){
                    let user = this._getPlayerById(ownerUserId);
                    if(user !== null){
                        let playerName = user === null ? "" : user?.name;
                        if(context.actor.system.playerName !== playerName){
                            await this.actor.update({'system.playerName': playerName});
                        }
                        return;
                    }
                }
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////
    
    /** @override */
    _getPlayerById (searchId) {
        let foundUser = null;
            for(let userIndex in game.users.players){
                let user = game.users.players[userIndex];
                if(user.id == searchId){
                    foundUser = user;
                    break;
                }
            }
        return foundUser;
    }

    ///////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////
    
    /** @override */
    activateListeners (html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if ( !this.options.editable ) return;

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

        html.find(".item-create").click(this._onItemCreate.bind(this));

        // Add draggable for macros.
        html.find(".attributes a.attribute-roll").each((i, a) => {
            a.setAttribute("draggable", true);
            a.addEventListener("dragstart", ev => {
                let dragData = ev.currentTarget.dataset;
                ev.dataTransfer.setData('text/plain', JSON.stringify(dragData));
            }, false);
        });

        // Inline change item
        html.find('.inline-item-edit').change(this._onItemInlineEdit.bind(this));

        // Rest restores HP
        html.find('.rest')
            .click(async ev => {
                await this.actor.update({'system.hp.value': this.actor.system.hp.max});
            });

        html.find('.restore')
            .click(async ev => {
                await this.actor.update({'system.abilities.STR.value': this.actor.system.abilities.STR.max});
                await this.actor.update({'system.abilities.DEX.value': this.actor.system.abilities.DEX.max});
                await this.actor.update({'system.abilities.CHA.value': this.actor.system.abilities.CHA.max});
            });

            html.find(".rollable").on("click", this._rollStat.bind(this));
            html.find(".luck").on("click", this._rollForLuck.bind(this));
            html.find(".roll-damage").on("click", this._rollDamge.bind(this));
    }

    ///////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////
    
    /**
     * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
     * @param {Event} event   The originating click event
     * @private
     */
    _onItemCreate (event) {
        event.preventDefault();
        const header = event.currentTarget;
        // Get the type of item to create.
        const type = header.dataset.type;
        // Grab any data associated with this control.
        const data = duplicate(header.dataset);
        // Initialize a default name.
        const name = `New ${type.capitalize()}`;
        // Prepare the item object.
        const itemData = {
            name: name,
            type: type,
            data: data,
        };
        // Remove the type from the dataset since it's in the itemData.type prop.
        delete itemData.data["type"];

        // Finally, create the item!
        return this.actor.createEmbeddedDocuments("Item", [itemData]);
    }

    ///////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////
    
    /**
     * @param {Event} event   The originating click event
     * @private
     */
    _onItemInlineEdit (event) {
        event.preventDefault();
        let element = event.currentTarget;
        let itemId = element.dataset.itemId;
        let item = this.actor.items.contents[itemId];
        let field = element.dataset.field;
        return item.update({ [field]: element.value });
    }


    ///////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////
    /**
     * Handle clickable rolls.
     * @param {Event} event   The originating click event
     * @private
     */
    async _rollStat (event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        if (dataset.roll) {

            let r = new Roll(dataset.roll, this.actor.system);
            await r.evaluate();


            let data = {
                abilityName: dataset.abilityName,
                abilityKey: dataset.abilityKey,
                abilityValue: this.actor.system.abilities[dataset.abilityKey].value,
                rolledValue: r.total
            };

            data.isSuccess = data.rolledValue <= data.abilityValue;
            data.isSuccess = data.rolledValue === 20 ? false : data.isSuccess;
            data.isSuccess = data.rolledValue === 1 ? true : data.isSuccess;

            let resultContent = await renderTemplate(this.CHAT_TEMPLATE, data);

            r.toMessage({
                speaker: ChatMessage.getSpeaker({actor: this.actor}),
                content: resultContent
            });

        }
    }


    ///////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////
    /**
     * Handle clickable rolls.
     * @param {Event} event   The originating click event
     * @private
     */
    async _rollForLuck (event) {

        event.preventDefault();

        let r = new Roll('1D6', this.actor.system);
        await r.evaluate();

        let data = {
            abilityName: game.i18n.localize("EB.Chat.Luck"),
            rolledValue: r.total
        };

        data.resultMessage = data.rolledValue <= 1 ? game.i18n.localize("EB.Chat.Failure") : game.i18n.localize("EB.Chat.SuccessComplications");
        data.resultMessage = data.rolledValue >= 4 ? game.i18n.localize("EB.Chat.SuccessFull") : data.resultMessage;

        data.successLevel = data.rolledValue <= 1 ? 0 : 1;
        data.successLevel = data.rolledValue >= 4 ? 2 : data.successLevel;

        let resultContent = await renderTemplate(this.CHAT_TEMPLATE_LUCK, data);

        r.toMessage({
            speaker: ChatMessage.getSpeaker({actor: this.actor}),
            content: resultContent
        });

    }


    ///////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////
    /**
     * Handle clickable rolls.
     * @param {Event} event   The originating click event
     * @private
     */
    async _rollDamge (event) {

        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        if (dataset.roll) {
            let isDeprived = this.actor.system.deprived;
            let roll = isDeprived ? "1D4" : dataset.roll;
            let weapon = dataset.weapon;

            let r = new Roll(roll, this.actor.system);
            await r.evaluate();

            let data = {
                abilityName: game.i18n.localize("EB.Item.Damage"),
                roll: roll,
                weapon: weapon,
                isDeprived: isDeprived,
                rolledValue: r.total
            };

            let resultContent = await renderTemplate(this.CHAT_TEMPLATE_DAMAGE, data);

            r.toMessage({
                speaker: ChatMessage.getSpeaker({actor: this.actor}),
                content: resultContent
            });

        }
    }

    ///////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////

}
