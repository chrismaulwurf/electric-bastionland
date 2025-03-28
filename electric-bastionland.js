// Import Modules
import { ElectricBastionlandActor } from "./features/actor/module/actor.js";
import { ElectricBastionlandActorSheet } from "./features/actor/module/actor-sheet.js";
import { ElectricBastionlandItem } from "./features/item/module/item.js";
import { ElectricBastionlandItemSheet } from "./features/item/module/item-sheet.js";

Hooks.once('init', async function () {

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("electricbastionland", ElectricBastionlandActorSheet, {makeDefault: true});
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("electricbastionland", ElectricBastionlandItemSheet, {makeDefault: true});

    game.electricbastionland = {
        apps: {
            ElectricBastionlandActorSheet,
            ElectricBastionlandItemSheet
        },
        entitie: {
            ElectricBastionlandActor,
            ElectricBastionlandItem,
        }
    };

    // Define custom Entity classes
    CONFIG.Actor.documentClass = ElectricBastionlandActor;
    CONFIG.Item.documentClass = ElectricBastionlandItem;

    // If you need to add Handlebars helpers, here are a few useful examples:
    Handlebars.registerHelper('concat', function () {
        let outStr = '';

        for (var arg in arguments) {
            if (typeof arguments[arg] != 'object') {
                outStr += arguments[arg];
            }
        }

        return outStr;
    });

    Handlebars.registerHelper('toLowerCase', function (str) {
        return str.toLowerCase();
    });

    Handlebars.registerHelper('boldIf', function (cond, options) {
        return (cond) ? '<b>' + options.fn(this) + '</b>' : options.fn(this);
    });

});

