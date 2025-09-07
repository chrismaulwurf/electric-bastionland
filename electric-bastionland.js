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


// Updates Token name when editing the name of a character
Hooks.on("updateActor", (actor,changes,diff,userId) => {
    if (game.user.id==userId && changes.name!==undefined){
    

        if(actor.system.playerName !== ""){
            actor.update({"prototypeToken.actorLink":true});
            actor.update({"prototypeToken.disposition":1});            
        }

        actor.update({"prototypeToken.name":changes.name});
        actor.update({"prototypeToken.width":2});
        actor.update({"prototypeToken.height":2});
        actor.update({"prototypeToken.displayName":50});
     }
});