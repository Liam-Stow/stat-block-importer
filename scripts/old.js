const convert2 = function (text) {
    let actorOut;
    let abilitiesOut;
    let actionsOut;

    console.log(text)

    const LINES = text
        .split('\n') // Onenote uses carrage returns so we need to consider \r and \n
        .filter(line => line !== "" && line !== " "); 
    
    console.log(LINES)

    const CHALLENGE_LINE = findLineByStartWord(LINES, "Challenge");
    const ACTIONS_LINE = findLineByStartWord(LINES, "ACTIONS");

    // $.getJSON("../json-templates/emptyNpcData.json", npcData => {
    let npcData = {};
    // Easy ones
    npcData.traits.size = sizes[getWords(LINES, attrToWordIndex['size'])];
    npcData.details.type = getWords(LINES, attrToWordIndex['type']);
    npcData.attributes.ac.value = parseInt(getWords(LINES, attrToWordIndex['ac']));
    npcData.attributes.hp.value = parseInt(getWords(LINES, attrToWordIndex['hpval']));
    npcData.attributes.hp.max = parseInt(getWords(LINES, attrToWordIndex['hpmax']));
    npcData.attributes.hp.formula = getWords(LINES, attrToWordIndex['hpformula']);
    npcData.attributes.speed.value = getWords(LINES, attrToWordIndex['speed']) + "ft";
    npcData.details.alignment = getWords(LINES, attrToWordIndex['alignment']);
    npcData.abilities.str.value = parseInt(getWords(LINES, attrToWordIndex['str']));
    npcData.abilities.dex.value = parseInt(getWords(LINES, attrToWordIndex['dex']));
    npcData.abilities.con.value = parseInt(getWords(LINES, attrToWordIndex['con']));
    npcData.abilities.int.value = parseInt(getWords(LINES, attrToWordIndex['int']));
    npcData.abilities.wis.value = parseInt(getWords(LINES, attrToWordIndex['wis']));
    npcData.abilities.cha.value = parseInt(getWords(LINES, attrToWordIndex['cha']));

    // Proficient Skills
    if (LINES.find(line => line.split(' ')[0] === "Skills") !== undefined) {
        LINES
            .find(line => line.split(' ')[0] === "Skills") // Find the skills line
            .split(' ')                         // Turn line into array of words
            .slice(1)                           // Get rid of the word "Skills" from the start of the line
            .filter(word => word[0] !== '+' && word[0] !== '-') // Get rid of bonus values
            .filter(word => word !== "")        // Get rid of empty words
            .map(skill => skillsMap[skill])     // Convert to foundry abbreviations
            .forEach(skill => npcData.skills[skill].value = 1); // Save proficiency to output NPC
    }

    // Resistances
    let resistancesLine = LINES.find(line => line.match(/^Damage Resistances/) !== null);
    if (resistancesLine !== undefined) {
        resistancesLine
            .split(' ')
            .slice(2)
            .filter(word => word !== "") // Get rid of empty words
            .map(resistance => resistance.replace(/,$/, "")) // Remove comma from end of each damage type
            .forEach(resistance => npcData.traits.dr.value.push(resistance));
    }

    // Senses
    let senses = LINES
        .find(line => line.split(' ')[0] === "Senses")
        .replace(/^Senses /, "") // Remove the word senses from the string
    npcData.traits.senses = senses;

    // Languages
    const FOUNDRY_DEFAULT_LANGUAGES = ["Aarakocra", "Abyssal", "Aquan", "Auran", "Celestial", "Common", "Deep Speech", "Draconic", "Druidic", "Dwarvish", "Elvish", "Giant", "Gith", "Gnoll", "Gnomish", "Goblin", "Halfling", "Ignan", "Infernal", "Orc", "Primordial", "Sylvan", "Terran", "Thieves' Cant", "Undercommon"]
    LINES
        .find(line => line.split(' ')[0] === "Languages") 
        .replace(/^Languages /, "") // Remove the word Languages from the string
        .replace(/ $/, "") // Remove space at end of line
        .split(', ')
        .filter(word => word !== "")
        .forEach(language => {
            if (FOUNDRY_DEFAULT_LANGUAGES.includes(language)) {
                npcData.traits.languages.value.push(language.toLowerCase());
            } else {
                npcData.traits.languages.custom += language + ';';
            }
        });
    // Remove final semicolon that was added as a seperator
    npcData.traits.languages.custom = npcData.traits.languages.custom.replace(/;$/, "") 

    // Challenge Rating
    const challengeRating = LINES[CHALLENGE_LINE]
        .split(' ')[1]
    npcData.details.cr = parseInt(challengeRating);

    // XP
    const xpValue = LINES[CHALLENGE_LINE]
        .split(' ')[2]
        .replace(/,/, '')   // Remove commas from number
        .replace(/\(/, '')  // Remove bracket from around number
    npcData.details.xp.value = parseInt(xpValue);

    // saveJson(npcData, 'actor.json');
    actorOut = npcData;
    // })

    // Abilities
    const ABILITY_LINES = LINES.slice(CHALLENGE_LINE+1, ACTIONS_LINE);
    let abilities = readFeatures(ABILITY_LINES);
    // Make Foundry Items
    let emptyAbility = {};
    // $.getJSON("json-templates/abilityItem.json", emptyAbility => {
    let abilityItems = []
    for (let ability in abilities) {
        let newItem = JSON.parse(JSON.stringify(emptyAbility)); // stringify then parse to make a copy rather than reference original
        newItem.name = ability;
        newItem.data.description.value = abilities[ability];
        abilityItems.push(newItem);
    }
    // saveJson(abilityItems, 'abilities.json')
    abilitiesOut = abilityItems;
    // })

    // Actions
    console.log("----attacks-----")
    const ACTION_LINES = LINES.slice(ACTIONS_LINE+1);
    let actions = readFeatures(ACTION_LINES);
    let detailedActions = {}

    // Split actions into details
    for (let actionName in actions) {
        let actionDetails = {}
        let detailsString = actions[actionName];
        console.log(actionName, ":", detailsString)
        
        if (isAttack(detailsString)) {
            // add all attack details
            let endOfTypeIndex = detailsString.indexOf(':');
            let detailsArray = detailsString.slice(endOfTypeIndex+2).split(/(?:, )|(?:\. )/);
            actionDetails.type = detailsString.slice(0, endOfTypeIndex);
            actionDetails.atkBonus = detailsArray[0].match(/\d+/)[0];
            actionDetails.targetNumber = detailsArray[2].split(' ')[0];
            actionDetails.targetType = detailsArray[2].split(' ')[1];
            actionDetails.damageDice = detailsArray[3].match(/\(.+\)/)[0];
            actionDetails.damageType = trimEnds(detailsArray[3].match(/\)\s.+\s/)[0], 2, 1);

            switch (actionDetails.type.split(' ')[0]) {
                case "Melee":
                    actionDetails.reach = detailsArray[1].match(/\d+/)[0]; // Reach is only ever going to be 5 or 10 feet. Units are always feet.
                    break;
                case "Ranged":
                    let ranges = detailsArray[1].split(/[\/\s]/);
                    actionDetails.normalRange = ranges[1];
                    actionDetails.maxRange = ranges[2];
                    actionDetails.rangeUnits = ranges[3];
                    break;
                default:
                    break;
            }

        } else {
            // just add description
            actionDetails.description = detailsString;
            actionDetails.type = "Ability";
        }
        detailedActions[actionName] = actionDetails
    }

    // Make Foundry Items
    let foundryActionItems = [];
    let emptyFoundryAction = {};
    // $.getJSON("json-templates/actionItem.json", emptyFoundryAction => {
    for (action in detailedActions) {
        let foundryAction = JSON.parse(JSON.stringify(emptyFoundryAction)); // stringify then parse to make a copy rather than reference original
        foundryAction.name = action;
        foundryAction.data.description.value = actions[action]
        
        if (detailedActions[action].type !== "Ability") {
            let dmgDice = detailedActions[action].damageDice;
            let dmgType = detailedActions[action].damageType;
            foundryAction.data.damage.parts.push([dmgDice, dmgType]);
            foundryAction.data.actionType = attackTypes[detailedActions[action].type];
            switch (detailedActions[action].type.split(' ')[0]) {
                case "Melee":
                    foundryAction.data.range.value = detailedActions[action].reach;
                    break;
                    
                case "Ranged":
                    foundryAction.data.range.value = detailedActions[action].normalRange;
                    foundryAction.data.range.long = detailedActions[action].maxRange;
                    foundryAction.data.range.units = detailedActions[action].rangeUnits;
                    break;

                default:
                    break;
            }
        }
        foundryActionItems.push(foundryAction);
    }
    actionsOut = foundryActionItems;

    make("newActor", actorOut, abilitiesOut.concat(actionsOut))

    return [actorOut, abilitiesOut, actionsOut];
}