
$(document).ready(function () {
    let inputElement = document.getElementById('inputfile');
    inputElement.onchange = function (event) {
        let fileReader = new FileReader();
        fileReader.onload = () => {
            convert(fileReader.result);
        }
        fileReader.readAsText(inputElement.files.item(0));
    }
})


// Remove a number of characters equal to endTrim from the end of str
function trimEnds(str, startTrim, endTrim) {
    return str.slice(startTrim, str.length-endTrim);
}

// Returns the first N words from a string as a new string
// remove the last endTrim letters
function getFirstWords(str, numberOfWords, endTrim=0) {
    let firstWords = str
        .split(' ')
        .slice(0, numberOfWords)
        .join(' ');
    return trimEnds(firstWords, 0, endTrim);
}


// given an array of text lines and a [lineNumber, [word1, word2]] position array,
// make a string of the selected words. 
function getWords(textArray, position) {
    let lineIndicies = position[0];
    let wordIndicies = position[1];
    let line = textArray[lineIndicies].split(' ');
    let words = line.filter((_, index) => wordIndicies.includes(index));
    return words.join(' ');
}


function setDataFromStaticPositionText(foundryJson, lines) {
    let prevJson
    for (attributeName in attributeToKey) {
        let currentJson = foundryJson;
        let keyPath = attributeToKey[attributeName].split('.');
        keyPath.forEach(nextKey => {
            prevJson = foundryJson;
            currentJson = currentJson[nextKey];
        })
        prevJson[keyPath[keyPath.length-1]] = getWords(lines, attrToWordIndex[attributeName])
    }
    return prevJson;
}


function saveJson(json, fileName) {
    let a = document.createElement("a");
    let file = new Blob([JSON.stringify(json)]);
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}


function findLineByStartWord(lines, startWord) {
    return lines.findIndex(line => line.split(' ')[0] === startWord);
}


function getLastItem(indexable) {
    return indexable[indexable.length-1];
}


function isUpperCase(char) {
    if (!isNaN(char*1))
        return false; // character is a number
    if (char === char.toLowerCase())
        return false; // character is lower case
    return true; // passed both checks, its upper case
}

// Check if an action is an attack from its details string
function isAttack(detailsString) {
    return isAttackType(getFirstWords(detailsString, 3, 1));
}

// returns true if str is a type of attack
function isAttackType(str) {
    const ATTACK_TYPES = ["Melee Weapon Attack", "Ranged Weapon Attack", "Melee Spell Attack", "Ranged Spell Attack"];
    return ATTACK_TYPES.includes(str);
}


// Check if a line starts a new character feature
// line is a string, returns bool
function lineStartsFeature(line) {
    if (line.length === 1) return false;
    return  ((getLastItem(line[0]) === '.' && isUpperCase(line[0][0])) 
            || 
            (getLastItem(line[1]) === '.')  && isUpperCase(line[1][0]));
}


// Takes in the entire block of abilities or actions and gives back an object of feature name to feature description.
function readFeatures(featuresLines) {
    let features = {};
    let featureName = "";
    let featureDescription = "";
    featuresLines.forEach(line => {
        let words = line.split(' ');
        console.log(words)
        if  (lineStartsFeature(words)) {
            if (featureName !== "")
                features[featureName] = featureDescription;
            const NAME_END_INDEX = line.indexOf('.'); // Get the index of the first dot
            featureName = line.slice(0,NAME_END_INDEX); // chars before first dot
            featureDescription = line.slice(NAME_END_INDEX+2); // chars after first dot and space
        } else {                
            featureDescription += line;
        }
    });
    features[featureName] = featureDescription;

    return features;
}


function convert(text) {
    const LINES = text
        .split('\r\n') // Onenote uses carrage returns so we need to consider \r and \n
        .filter(line => line !== "" && line !== " "); 
    
    const CHALLENGE_LINE = findLineByStartWord(LINES, "Challenge");
    const ACTIONS_LINE = findLineByStartWord(LINES, "ACTIONS");

    $.getJSON("emptyNpcData.json", npcData => {
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

        saveJson(npcData, 'actor.json');
    })

    // Abilities
    const ABILITY_LINES = LINES.slice(CHALLENGE_LINE+1, ACTIONS_LINE);
    let abilities = readFeatures(ABILITY_LINES);
    // Make Foundry Items
    $.getJSON("abilityItem.json", emptyAbility => {
        let abilityItems = []
        for (let ability in abilities) {
            let newItem = JSON.parse(JSON.stringify(emptyAbility)); // stringify then parse to make a copy rather than reference original
            newItem.name = ability;
            newItem.data.description.value = abilities[ability];
            abilityItems.push(newItem);
        }
        saveJson(abilityItems, 'abilities.json')
    })

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
    $.getJSON("actionItem.json", emptyFoundryAction => {
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
        saveJson(foundryActionItems, 'actions.json')
    });


    let json = text;
    return json;
}
