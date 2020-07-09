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


function convert(text) {
    let lines = text.split('\r\n'); // Onenote uses carrage returns so we need to consider \r and \n

    $.getJSON("foundryEmptyNPC.json", foundryNPC => {
        // Easy ones
        foundryNPC.name = lines[0];
        foundryNPC.data.traits.size = getWord(lines, attrToWordIndex['size']);
        foundryNPC.data.details.type = getWord(lines, attrToWordIndex['type']);
        foundryNPC.data.attributes.ac.value = getWord(lines, attrToWordIndex['ac']);
        foundryNPC.data.attributes.hp.value = getWord(lines, attrToWordIndex['hp']);
        foundryNPC.data.attributes.hp.max = getWord(lines, attrToWordIndex['hp']);
        foundryNPC.data.attributes.hp.formula = getWord(lines, attrToWordIndex['hpFormula']);
        foundryNPC.data.attributes.speed = getWord(lines, attrToWordIndex['speed']);
        foundryNPC.data.details.alignment = getWord(lines, attrToWordIndex['alignment']);
        foundryNPC.data.abilities.str.value = getWord(lines, attrToWordIndex['str']);
        foundryNPC.data.abilities.dex.value = getWord(lines, attrToWordIndex['dex']);
        foundryNPC.data.abilities.con.value = getWord(lines, attrToWordIndex['con']);
        foundryNPC.data.abilities.int.value = getWord(lines, attrToWordIndex['int']);
        foundryNPC.data.abilities.wis.value = getWord(lines, attrToWordIndex['wis']);
        foundryNPC.data.abilities.cha.value = getWord(lines, attrToWordIndex['cha']);

        // Proficient Skills
        lines
            .find(line => line.split(' ')[0] === "Skills") // Find the skills line
            .split(' ')                         // Turn line into array of words
            .slice(1)                           // Get rid of the word "Skills" from the start of the line
            .filter(word => word[0] !== '+' && word[0] !== '-') // Get rid of bonus values
            .filter(word => word !== "")        // Get rid of empty words
            .map(skill => skillsMap[skill])     // Convert to foundry abbreviations
            .forEach(skill => foundryNPC.data.skills[skill].value = 1); // Save proficiency to output NPC

        // Resistances
        lines
            .find(line => line.split(' ').slice(0,2).join(' ') === "Damage Resistances")
            .split(' ')
            .slice(2)
            .filter(word => word !== "") // Get rid of empty words
            .map(resistance => resistance.replace(/,$/, "")) // Remove comma from end of each damage type
            .forEach(resistance => foundryNPC.data.traits.dr.value.push(resistance));

        // Senses
        let senses = lines
            .find(line => line.split(' ')[0] === "Senses")
            .replace(/^Senses /, "") // Remove the word senses from the string
        foundryNPC.data.traits.senses = senses;


        // Actions


        console.log(foundryNPC)
    })


    let json = text;
    return json;
}
