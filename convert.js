
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


function getWord(textArray, position) {
    let lineIndicies = position[0];
    let wordIndicies = position[1];
    let line = textArray[lineIndicies].split(' ');
    let words = line.filter((_, index) => wordIndicies.includes(index));
    return words.reduce((sum, next) => sum + ' ' + next);
}


function setDataFromStaticPositionText(foundryJson, lines) {
    let prevJson
    for (attributeName in attributeToKey) {
        let currentJson = foundryJson;
        let keyPath = attributeToKey[attributeName].split('.');
        keyPath.forEach(nextKey => {
            prevJson = foundryJson;
            console.log('going down', nextKey)
            currentJson = currentJson[nextKey];
        })
        console.log(keyPath, attributeName)
        prevJson[keyPath[keyPath.length-1]] = getWord(lines, attrToWordIndex[attributeName])
    }
    return prevJson;
}


function saveJson(json) {
    let a = document.createElement("a");
    let file = new Blob([JSON.stringify(json)]);
    a.href = URL.createObjectURL(file);
    a.download = 'foundryOut.json';
    a.click();
}


function findLineByStartWord(lines, startWord) {
    return lines.findIndex(line => line.split(' ')[0] === startWord);
}


function getLastItem(indexable) {
    return indexable[indexable.length-1];
}


function convert(text) {
    const LINES = text.split('\r\n'); // Onenote uses carrage returns so we need to consider \r and \n
    const CHALLENGE_LINE = findLineByStartWord(LINES, "Challenge");
    const ACTIONS_LINE = findLineByStartWord(LINES, "ACTIONS");

    $.getJSON("emptyNpcData.json", npcData => {
        // Easy ones
        npcData.traits.size = getWord(LINES, attrToWordIndex['size']);
        npcData.details.type = getWord(LINES, attrToWordIndex['type']);
        npcData.attributes.ac.value = getWord(LINES, attrToWordIndex['ac']);
        npcData.attributes.hp.value = getWord(LINES, attrToWordIndex['hpval']);
        npcData.attributes.hp.max = getWord(LINES, attrToWordIndex['hpmax']);
        npcData.attributes.hp.formula = getWord(LINES, attrToWordIndex['hpformula']);
        npcData.attributes.speed = getWord(LINES, attrToWordIndex['speed']);
        npcData.details.alignment = getWord(LINES, attrToWordIndex['alignment']);
        npcData.abilities.str.value = getWord(LINES, attrToWordIndex['str']);
        npcData.abilities.dex.value = getWord(LINES, attrToWordIndex['dex']);
        npcData.abilities.con.value = getWord(LINES, attrToWordIndex['con']);
        npcData.abilities.int.value = getWord(LINES, attrToWordIndex['int']);
        npcData.abilities.wis.value = getWord(LINES, attrToWordIndex['wis']);
        npcData.abilities.cha.value = getWord(LINES, attrToWordIndex['cha']);

        // Proficient Skills
        LINES
            .find(line => line.split(' ')[0] === "Skills") // Find the skills line
            .split(' ')                         // Turn line into array of words
            .slice(1)                           // Get rid of the word "Skills" from the start of the line
            .filter(word => word[0] !== '+' && word[0] !== '-') // Get rid of bonus values
            .filter(word => word !== "")        // Get rid of empty words
            .map(skill => skillsMap[skill])     // Convert to foundry abbreviations
            .forEach(skill => npcData.skills[skill].value = 1); // Save proficiency to output NPC

        // Resistances
        LINES
            .find(line => line.split(' ').slice(0,2).join(' ') === "Damage Resistances")
            .split(' ')
            .slice(2)
            .filter(word => word !== "") // Get rid of empty words
            .map(resistance => resistance.replace(/,$/, "")) // Remove comma from end of each damage type
            .forEach(resistance => npcData.traits.dr.value.push(resistance));

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
                    npcData.traits.languages.value.push(lanuage);
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

        console.log(npcData)
        saveJson(npcData);
    })

    // Abilities
    $.getJSON("abilityItem.json", emptyAbility => {
        // Parse abilities
        const ABILITY_LINES = LINES.slice(CHALLENGE_LINE+1, ACTIONS_LINE);
        let abilities = {};
        let abilityName = ""
        let abilityText = "";
        ABILITY_LINES.forEach(line => {
            // If either of the first two words ends in a full stop, its probably the start of a new ability.
            const WORDS = line.split(' ');
            if (getLastItem(WORDS[0]) === '.' || getLastItem(WORDS[1]) === '.') {
                if (abilityName !== "")
                    abilities[abilityName] = abilityText;
                const NAME_END_INDEX = line.indexOf('.'); // Get the index of the first dot
                abilityName = line.slice(0,NAME_END_INDEX); // chars before first dot
                abilityText = line.slice(NAME_END_INDEX); // chars after first dot
            } else {                
                abilityText += line;
            }
        });
        abilities[abilityName] = abilityText;
        console.log(abilities)

        // Make Foundry Items
        let abilityItems = []
        for (let ability in abilities) {
            let newItem = JSON.parse(JSON.stringify(emptyAbility)); // stringify then parse to make a copy rather than reference original
            newItem.name = ability;
            newItem.data.description.value = abilities[ability];
            abilityItems.push(newItem);
        }
        saveJson(abilityItems)
    })

    let json = text;
    return json;
}
