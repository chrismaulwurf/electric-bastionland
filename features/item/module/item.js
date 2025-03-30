/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class ElectricBastionlandItem extends Item {
    /**
     * Augment the basic Item data model with additional dynamic data.
     */
    prepareData () {
        super.prepareData();
        const itemData = this.system;
        const actorData = this.actor
            ? this.actor.system
            : {};
        const data = itemData.data;
    }
}
