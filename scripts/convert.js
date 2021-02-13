import {make} from './makeActor.js'
import * as parsing from './parsing.js'

export const convert = function (text) {
    let actorOut = {};
    let doStats = true;

    const LINES = text
        .split('\n')
        .filter(line => line !== "" && line !== " "); 

    // Size
    parsing.setDeepJson(actorOut, ["traits","size"], sizes[parsing.getWords(LINES, attrToWordIndex['size'])]);

    // Type
    parsing.setDeepJson(actorOut, ["details","type"], parsing.getWords(LINES, attrToWordIndex['type']));

    // Alignment
    parsing.setDeepJson(actorOut, ["details","alignment"], parsing.getWords(LINES, attrToWordIndex['alignment']));

    // do AC
    parsing.setDeepJson(actorOut, ["attributes","ac","value"], parsing.findTextByStartWords(LINES, ["Armor","Class"]).split(' ')[0]);

    // do HP
    let hpData = parsing.findTextByStartWords(LINES, ["Hit","Points"]).split(' ');
    parsing.setDeepJson(actorOut,["attributes","hp","value"], parseInt(hpData[0]));
    parsing.setDeepJson(actorOut,["attributes","hp","max"], parseInt(hpData[0]));
    parsing.setDeepJson(actorOut,["attributes","hp","formula"], hpData.slice(1).join(' '));

    // do speed
    let movementData = parsing.findTextByStartWords(LINES, ["Speed"])
    movementData = parsing.parseMovement(movementData)
    parsing.setDeepJson(actorOut, ["attributes","movement"], movementData);

    if (doStats) {
        ["str", "dex", "con", "int", "wis", "cha"].forEach(stat => {
            parsing.setDeepJson(actorOut, ["abilities", stat, "value"], parseInt(parsing.getWords(LINES, attrToWordIndex[stat])));
        })
    }

    // Proficient Skills
    if (LINES.find(line => line.split(' ')[0] === "Skills") !== undefined) {
        LINES
            .find(line => line.split(' ')[0] === "Skills") // Find the skills line
            .split(' ')                         // Turn line into array of words
            .slice(1)                           // Get rid of the word "Skills" from the start of the line
            .filter(word => word[0] !== '+' && word[0] !== '-') // Get rid of bonus values
            .filter(word => word !== "")        // Get rid of empty words
            .map(skill => skillsMap[skill])     // Convert to foundry abbreviations
            .forEach(skill => parsing.setDeepJson(actorOut, ["skills", skill, "value"], 1)); // Save proficiency to output NPC
    }

    // Resistances
    parsing.setDeepJson(actorOut, ["traits","dr","value"], []);
    let resistancesLine = parsing.findTextByStartWords(LINES, ["Damage","Resistances"]);
    if (resistancesLine !== undefined) {
        resistancesLine
            .split('; ')[0] // Ignore resistances after a ;, they will need to be treated differently.
            .split(', ')
            .filter(word => word !== "") // Get rid of empty words
            .map(s=>s.toLowerCase())
            .forEach(resistance => actorOut.traits.dr.value.push(resistance));
        if (resistancesLine.includes("Bludgeoning, Piercing, and Slashing from Nonmagical Attacks")) {
            actorOut.traits.dr.value.push("physical");
        }
    }

    // Damage Immunities
    parsing.setDeepJson(actorOut, ["traits","di","value"], []);
    let immunitiesLine = parsing.findTextByStartWords(LINES, ["Damage","Immunities"]);
    if (immunitiesLine !== undefined) {
        immunitiesLine
            .split('; ')[0] // Ignore resistances after a ;, they will need to be treated differently.
            .split(', ')
            .filter(word => word !== "") // Get rid of empty words
            .map(s=>s.toLowerCase())
            .forEach(immunity => actorOut.traits.di.value.push(immunity));
        if (immunitiesLine.includes("Bludgeoning, Piercing, and Slashing from Nonmagical Attacks")) {
            actorOut.traits.di.value.push("physical");
        }
    }

    // Damage Vulnerabilities 
    parsing.setDeepJson(actorOut, ["traits","dv","value"], []);
    let vulnerabilitiesLine = parsing.findTextByStartWords(LINES, ["Damage","Vulnerabilities"]);
    if (vulnerabilitiesLine !== undefined) {
        vulnerabilitiesLine
            .split('; ')[0] // Ignore resistances after a ;, they will need to be treated differently.
            .split(', ')
            .filter(word => word !== "") // Get rid of empty words
            .map(s=>s.toLowerCase())
            .forEach(immunity => actorOut.traits.dv.value.push(immunity));
        if (vulnerabilitiesLine.includes("Bludgeoning, Piercing, and Slashing from Nonmagical Attacks")) {
            actorOut.traits.dv.value.push("physical");
        }
    }

    // Condition Immunities
    parsing.setDeepJson(actorOut, ["traits","ci","value"], []);
    let conditionImmunitiesLine = parsing.findTextByStartWords(LINES, ["Condition","Immunities"]);
    if (conditionImmunitiesLine !== undefined) {
        conditionImmunitiesLine
            .split(', ')
            .filter(word => word !== "") // Get rid of empty words
            .map(s=>s.toLowerCase())
            .forEach(immunity => actorOut.traits.ci.value.push(immunity));
    }

    // Senses
    let senses = LINES
        .find(line => line.split(' ')[0] === "Senses")
        .replace(/^Senses /, "") // Remove the word senses from the string
    parsing.setDeepJson(actorOut, ["traits","senses"], senses);

    // Languages
    parsing.setDeepJson(actorOut, ["traits","languages","value"], []);
    parsing.setDeepJson(actorOut, ["traits","languages","custom"], "");
    const FOUNDRY_DEFAULT_LANGUAGES = ["Aarakocra", "Abyssal", "Aquan", "Auran", "Celestial", "Common", "Deep Speech", "Draconic", "Druidic", "Dwarvish", "Elvish", "Giant", "Gith", "Gnoll", "Gnomish", "Goblin", "Halfling", "Ignan", "Infernal", "Orc", "Primordial", "Sylvan", "Terran", "Thieves' Cant", "Undercommon"]
    LINES
        .find(line => line.split(' ')[0] === "Languages") 
        .replace(/^Languages /, "") // Remove the word Languages from the string
        .replace(/ $/, "") // Remove space at end of line
        .split(', ')
        .filter(word => word !== "")
        .forEach(language => {
            if (FOUNDRY_DEFAULT_LANGUAGES.includes(language)) {
                actorOut.traits.languages.value.push(language.toLowerCase());
            } else {
                actorOut.traits.languages.custom += language + ';';
            }
        });
    // Remove final semicolon that was added as a seperator
    actorOut.traits.languages.custom = actorOut.traits.languages.custom.replace(/;$/, "") 

    // Challenge Rating
    parsing.setDeepJson(actorOut,["details","cr"], parsing.findTextByStartWords(LINES, ["Challenge"]).split(' ')[0]);

    // XP
    const xpValue = parsing.findTextByStartWords(LINES, ["Challenge"])
        .split(' ')[2]
        .replace(/,/, '')   // Remove commas from number
        .replace(/\(/, '')  // Remove bracket from around number
    parsing.setDeepJson(actorOut, ["details","xp","value"], parseInt(xpValue));

    const name = LINES[0];
    make(name, actorOut, undefined)

    return actorOut;
}