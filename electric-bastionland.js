// Import Modules
import { ELECTRIC_BASTIONLAND_CONFIG } from "./modules/config.js";
import { ElectricBastionlandActor } from "./modules/objects/actor.js";
import { ElectricBastionlandActorSheet } from "./modules/sheets/actor-sheet.js";
import { ElectricBastionlandItem } from "./modules/objects/item.js";
import { ElectricBastionlandItemSheet } from "./modules/sheets/item-sheet.js";

Hooks.once('init', async function () {

    CONFIG.ELECTRIC_BASTIONLAND_CONFIG = ELECTRIC_BASTIONLAND_CONFIG;
    CONFIG.INIT = true;
    CONFIG.Actor.documentClass = ElectricBastionlandActor;
    CONFIG.Item.documentClass = ElectricBastionlandItem;

    const DocumentSheetConfig = foundry.applications.apps.DocumentSheetConfig;

    DocumentSheetConfig.unregisterSheet(Actor, "core", foundry.appv1.sheets.ActorSheet);
    DocumentSheetConfig.registerSheet(Actor, 'electricbastionland', ElectricBastionlandActorSheet, {
        types: ["character"],
        makeDefault: true,
        label: "Electric Bastionland Actor w1"
    });

    DocumentSheetConfig.unregisterSheet(Item, "core", foundry.appv1.sheets.ItemSheet);
    DocumentSheetConfig.registerSheet(Item, 'electricbastionland', ElectricBastionlandItemSheet, {
        makeDefault: true,
        label: "Electric Bastionland Item w2"
    });

    /*Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("electricbastionland", ElectricBastionlandActorSheet, {
        makeDefault: true
    });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("electricbastionland", ElectricBastionlandItemSheet, { makeDefault: true });
    game.electricbastionland = {
        apps: {
            ElectricBastionlandActorSheet,
            ElectricBastionlandItemSheet
        },
        entities: {
            ElectricBastionlandActor,
            ElectricBastionlandItem,
        }
    }; */

    registerHandlebarsHelpers();

});

Hooks.once('ready', async function () {
    CONFIG.INIT = false;

    for (const actor of game.actors.contents) {
        const systemData = actor.system;
        if (systemData.abilities?.STR !== undefined) {
            const updateData = {};
            // Werte kopieren
            updateData["system.abilities.STAER"] = foundry.utils.duplicate(systemData.abilities.STR);
            // Alten Key löschen
            updateData["-system.abilities.STR"] = null;
            await actor.update(updateData);
        }
    }
});

Hooks.on("preCreateActor", (actor, data, options, userId) => {
    if (actor.type === "character" && !data.img) {
        actor.updateSource({ img: "systems/electricbastionland/assets/images/char-default.svg" });
    }
});

// Updates Token name when editing the name of a character
Hooks.on("updateActor", (actor, changes, diff, userId) => {
    if (game.user.id == userId && changes.name !== undefined) {
        if (actor.system.playerName !== "") {
            actor.update({ "prototypeToken.actorLink": true });
            actor.update({ "prototypeToken.disposition": 1 });
        }

        actor.update({ "prototypeToken.name": changes.name });
        actor.update({ "prototypeToken.width": 2 });
        actor.update({ "prototypeToken.height": 2 });
        actor.update({ "prototypeToken.displayName": 50 });
    }
});


function registerHandlebarsHelpers() {
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
}