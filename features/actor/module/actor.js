/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class ElectricBastionlandActor extends Actor {
    /**
     * Augment the basic actor data with additional dynamic data.
     */
    prepareData () {
        super.prepareData();
        this.system.groups = this.system.groups || {};
        this.system.attributes = this.system.attributes || {};
        if (this.type === 'character') this._prepareCharacterData(this.system);
    }

    /**
     * Prepare Character type specific data
     */
    _prepareCharacterData (actorData) {
    }

    /** @override */
    getRollData () {
        return super.getRollData();
    }

    /** @override */
    deleteOwnedItem (itemId) {
        const item = this.getOwnedItem(itemId);

        if (item.data.data.quantity > 1) {
            item.data.data.quantity--;
        } else {
            super.deleteOwnedItem(itemId);
        }
    }
}
