export class ElectricBastionlandActor extends Actor {

    prepareData() {
        super.prepareData();
        this.system.groups = this.system.groups || {};
        this.system.attributes = this.system.attributes || {};

        if (this.type === 'character') this._prepareCharacterData(this.system);
    }

    _prepareCharacterData(actorData) {
    }

    getRollData() {
        return super.getRollData();
    }

    deleteOwnedItem(itemId) {
        const item = this.getOwnedItem(itemId);

        if (item.data.data.quantity > 1) {
            item.data.data.quantity--;
        } else {
            super.deleteOwnedItem(itemId);
        }
    }

    addLogEntry(Entry) {
        let log = this.system.log;
        log.push(Entry);
        this.update({ "system.log": log });
    }
}
