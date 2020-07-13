
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


function convert(text) {
    let lines = text.split('\r\n'); // Onenote uses carrage returns so we need to consider \r and \n

    $.getJSON("emptyNpcData.json", npcData => {
        // Easy ones
        // foundryNPC.name = lines[0];
        // foundryNPC = setDataFromStaticPositionText(foundryNPC, lines);
        npcData.traits.size = getWord(lines, attrToWordIndex['size']);
        npcData.details.type = getWord(lines, attrToWordIndex['type']);
        npcData.attributes.ac.value = getWord(lines, attrToWordIndex['ac']);
        npcData.attributes.hp.value = getWord(lines, attrToWordIndex['hpval']);
        npcData.attributes.hp.max = getWord(lines, attrToWordIndex['hpmax']);
        npcData.attributes.hp.formula = getWord(lines, attrToWordIndex['hpformula']);
        npcData.attributes.speed = getWord(lines, attrToWordIndex['speed']);
        npcData.details.alignment = getWord(lines, attrToWordIndex['alignment']);
        npcData.abilities.str.value = getWord(lines, attrToWordIndex['str']);
        npcData.abilities.dex.value = getWord(lines, attrToWordIndex['dex']);
        npcData.abilities.con.value = getWord(lines, attrToWordIndex['con']);
        npcData.abilities.int.value = getWord(lines, attrToWordIndex['int']);
        npcData.abilities.wis.value = getWord(lines, attrToWordIndex['wis']);
        npcData.abilities.cha.value = getWord(lines, attrToWordIndex['cha']);

        // Proficient Skills
        lines
            .find(line => line.split(' ')[0] === "Skills") // Find the skills line
            .split(' ')                         // Turn line into array of words
            .slice(1)                           // Get rid of the word "Skills" from the start of the line
            .filter(word => word[0] !== '+' && word[0] !== '-') // Get rid of bonus values
            .filter(word => word !== "")        // Get rid of empty words
            .map(skill => skillsMap[skill])     // Convert to foundry abbreviations
            .forEach(skill => npcData.skills[skill].value = 1); // Save proficiency to output NPC

        // Resistances
        lines
            .find(line => line.split(' ').slice(0,2).join(' ') === "Damage Resistances")
            .split(' ')
            .slice(2)
            .filter(word => word !== "") // Get rid of empty words
            .map(resistance => resistance.replace(/,$/, "")) // Remove comma from end of each damage type
            .forEach(resistance => npcData.traits.dr.value.push(resistance));

        // Senses
        let senses = lines
            .find(line => line.split(' ')[0] === "Senses")
            .replace(/^Senses /, "") // Remove the word senses from the string
        npcData.traits.senses = senses;

        // Languages
        const FOUNDRY_DEFAULT_LANGUAGES = ["Aarakocra", "Abyssal", "Aquan", "Auran", "Celestial", "Common", "Deep Speech", "Draconic", "Druidic", "Dwarvish", "Elvish", "Giant", "Gith", "Gnoll", "Gnomish", "Goblin", "Halfling", "Ignan", "Infernal", "Orc", "Primordial", "Sylvan", "Terran", "Thieves' Cant", "Undercommon"]
        lines
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
        const CHALLENGE_LINE = lines.findIndex(line => line.split(' ')[0] === "Challenge");
        let challengeRating = lines[CHALLENGE_LINE]
            .split(' ')[1]
        npcData.details.cr = parseInt(challengeRating);

        // XP
        let xpValue = lines[CHALLENGE_LINE]
            .split(' ')[2]
            .replace(/,/, '')   // Remove commas from number
            .replace(/\(/, '')  // Remove bracket from around number
        npcData.details.xp.value = parseInt(xpValue);

        // Abilities
        // const ACTIONS_LINE = lines.findIndex(line => line === "ACTIONS ");
        // const ABILITIES_LINES = lines.slice(CHALLENGE_LINE+1, ACTIONS_LINE);

        // $.getJSON("abilityItem.json")
        //     .done(ability=>{

        //     });

        // Actions
        
        console.log(npcData)
        saveJson(npcData);
    })


    let json = text;
    return json;
}
