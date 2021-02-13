import { setDeepJson, findTextByPosition, findTextByStartWords, parseMovement } from './parsing.js'
import { attributeToKey, attrToWordIndex, sizes, skillsMap, modifierFunctions, startWords, regexExpressions, traits } from './maps.js'

const preprocess = text => {
    const lines = text
        .split('\n')
        .filter(line => line !== "" && line !== " ")  // Remove empty lines
    lines[1] = "Meta " + lines[1] // Add a title to the meta line so it can be found later
    return lines
}


export const makeActor = async (text) => {
    const lines = preprocess(text)
    let actorPromise = Actor.create({ name: lines[0], type: "npc" })
    actorPromise.then(actor => {
        populateActor(actor, lines)
    })
}


const populateActor = (actor, lines) => {
    let actorData = actor.data;

    // Stats: AC, HP, Movement, Size, Type, Alignment, Senses, CR, STR, DEX, CON etc...
    const setStats = (stats, finder, targetMap) => {
        stats.forEach(stat => {
            console.log("parsing", stat)
            const modifier = modifierFunctions[stat]
            const regex = regexExpressions[stat]
            let text = finder(lines, targetMap[stat]) // Find line of interest
            console.log("   initial text", text)
            if (regex) text = regex.exec(text)[0]   // Find substring of interest
            if (modifier) text = modifier(text)     // Modify it if needed
            console.log("   Setting", stat, "to", text)
            setDeepJson(actorData.data, attributeToKey[stat], text)
        })
    }
    setStats(['ac', 'hpval', 'hpmax', 'hpformula', 'speed', 'size', 'type', 'alignment', 'senses', 'cr', 'languages'], findTextByStartWords, startWords)
    setStats(['str', 'dex', 'con', 'int', 'wis', 'cha'], findTextByPosition, attrToWordIndex)

    // Proficient Skills
    findTextByStartWords(lines, ["Skills"])
        .match(/[A-z]+/g)
        .forEach(skill => setDeepJson(actorData.data, attributeToKey[skill], 1))

    // Traits: Resistances, immunities, vulnerabilities
    const setTraits = (traitType) => {
        const traitKey = traits[traitType]
        const traitLine = findTextByStartWords(lines, startWords[traitType])
        traitLine
            .split('; ')[0] // Ignore resistances after a ;, they will need to be treated differently.
            .split(', ')
            .filter(word => word !== "") // Get rid of empty words
            .map(s => s.toLowerCase())
            .forEach(trait => {
                actorData.data.traits[traitKey].value.push(trait)
            })
        if (traitLine.includes("Bludgeoning, Piercing, and Slashing from Nonmagical Attacks"))
            actorData.data.traits[traitKey].value.push("physical");
    }
    ["Resistance", "Immunity", "Vulnerability", "ConditionImmunity"].forEach(setTraits)

    actor.update(actorData)
}


export const convert = async (LINES) => {
    let actorOut = {};

    // Size 
    setDeepJson(actorOut, ["traits", "size"], sizes[getWords(LINES, attrToWordIndex['size'])]);

    // Type
    setDeepJson(actorOut, ["details", "type"], getWords(LINES, attrToWordIndex['type']));

    // Alignment
    setDeepJson(actorOut, ["details", "alignment"], getWords(LINES, attrToWordIndex['alignment']));

    // do AC
    setDeepJson(actorOut, ["attributes", "ac", "value"], findTextByStartWords(LINES, ["Armor", "Class"]).split(' ')[0]);

    // do HP
    let hpData = findTextByStartWords(LINES, ["Hit", "Points"]).split(' ');
    setDeepJson(actorOut, ["attributes", "hp", "value"], parseInt(hpData[0]));
    setDeepJson(actorOut, ["attributes", "hp", "max"], parseInt(hpData[0]));
    setDeepJson(actorOut, ["attributes", "hp", "formula"], hpData.slice(1).join(' '));

    // do speed
    let movementData = findTextByStartWords(LINES, ["Speed"])
    movementData = parseMovement(movementData)
    setDeepJson(actorOut, ["attributes", "movement"], movementData);

    ["str", "dex", "con", "int", "wis", "cha"].forEach(stat => {
        setDeepJson(actorOut, ["abilities", stat, "value"], parseInt(getWords(LINES, attrToWordIndex[stat])));
    })

    // Proficient Skills
    if (LINES.find(line => line.split(' ')[0] === "Skills") !== undefined) {
        LINES
            .find(line => line.split(' ')[0] === "Skills") // Find the skills line
            .split(' ')                         // Turn line into array of words
            .slice(1)                           // Get rid of the word "Skills" from the start of the line
            .filter(word => word[0] !== '+' && word[0] !== '-') // Get rid of bonus values
            .filter(word => word !== "")        // Get rid of empty words
            .map(skill => skillsMap[skill])     // Convert to foundry abbreviations
            .forEach(skill => setDeepJson(actorOut, ["skills", skill, "value"], 1)); // Save proficiency to output NPC
    }

    // Resistances
    setDeepJson(actorOut, ["traits", "dr", "value"], []);
    let resistancesLine = findTextByStartWords(LINES, ["Damage", "Resistances"]);
    if (resistancesLine !== undefined) {
        resistancesLine
            .split('; ')[0] // Ignore resistances after a ;, they will need to be treated differently.
            .split(', ')
            .filter(word => word !== "") // Get rid of empty words
            .map(s => s.toLowerCase())
            .forEach(resistance => actorOut.traits.dr.value.push(resistance));
        if (resistancesLine.includes("Bludgeoning, Piercing, and Slashing from Nonmagical Attacks")) {
            actorOut.traits.dr.value.push("physical");
        }
    }

    // Damage Immunities
    setDeepJson(actorOut, ["traits", "di", "value"], []);
    let immunitiesLine = findTextByStartWords(LINES, ["Damage", "Immunities"]);
    if (immunitiesLine !== undefined) {
        immunitiesLine
            .split('; ')[0] // Ignore resistances after a ;, they will need to be treated differently.
            .split(', ')
            .filter(word => word !== "") // Get rid of empty words
            .map(s => s.toLowerCase())
            .forEach(immunity => actorOut.traits.di.value.push(immunity));
        if (immunitiesLine.includes("Bludgeoning, Piercing, and Slashing from Nonmagical Attacks")) {
            actorOut.traits.di.value.push("physical");
        }
    }

    // Damage Vulnerabilities 
    setDeepJson(actorOut, ["traits", "dv", "value"], []);
    let vulnerabilitiesLine = findTextByStartWords(LINES, ["Damage", "Vulnerabilities"]);
    if (vulnerabilitiesLine !== undefined) {
        vulnerabilitiesLine
            .split('; ')[0] // Ignore resistances after a ;, they will need to be treated differently.
            .split(', ')
            .filter(word => word !== "") // Get rid of empty words
            .map(s => s.toLowerCase())
            .forEach(immunity => actorOut.traits.dv.value.push(immunity));
        if (vulnerabilitiesLine.includes("Bludgeoning, Piercing, and Slashing from Nonmagical Attacks")) {
            actorOut.traits.dv.value.push("physical");
        }
    }

    // Condition Immunities
    setDeepJson(actorOut, ["traits", "ci", "value"], []);
    let conditionImmunitiesLine = findTextByStartWords(LINES, ["Condition", "Immunities"]);
    if (conditionImmunitiesLine !== undefined) {
        conditionImmunitiesLine
            .split(', ')
            .filter(word => word !== "") // Get rid of empty words
            .map(s => s.toLowerCase())
            .forEach(immunity => actorOut.traits.ci.value.push(immunity));
    }

    // Senses
    let senses = LINES
        .find(line => line.split(' ')[0] === "Senses")
        .replace(/^Senses /, "") // Remove the word senses from the string
    setDeepJson(actorOut, ["traits", "senses"], senses);

    // Languages
    setDeepJson(actorOut, ["traits", "languages", "value"], []);
    setDeepJson(actorOut, ["traits", "languages", "custom"], "");
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
    setDeepJson(actorOut, ["details", "cr"], findTextByStartWords(LINES, ["Challenge"]).split(' ')[0]);

    // XP
    const xpValue = findTextByStartWords(LINES, ["Challenge"])
        .split(' ')[2]
        .replace(/,/, '')   // Remove commas from number
        .replace(/\(/, '')  // Remove bracket from around number
    setDeepJson(actorOut, ["details", "xp", "value"], parseInt(xpValue));

    // make(name, actorOut, undefined)

    // return actorOut;
}