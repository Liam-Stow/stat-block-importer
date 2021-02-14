import { setDeepJson, findTextByStartWords } from './parsing.js'
import { attributeToKey, modifierFunctions, startWords, regexExpressions } from './maps.js'

const preprocess = text => {
    const lines = text
        .split('\n')
        .filter(line => line !== "" && line !== " ")  // Remove empty lines
        .map(s=>s.trim()) // Remove edge whitespace
    lines[1] = "Meta " + lines[1] // Add a title to the meta line so it can be found later

    const stats = ["STR", "DEX", "CON", "INT", "WIS", "CHA"]
    stats.forEach(stat => {
        const statNameIndex = lines.findIndex(s=>s===stat)
        if (statNameIndex !== -1) {
            const statValueIndex = statNameIndex + 1
            lines[statNameIndex] += " " + lines[statValueIndex] // Put stat value on same line as stat name
            lines.splice(statValueIndex, 1) // Remove the old line with the stat value
        }
    })

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

    // Try to map a stat string with to its search term, otherwise just 
    // return the string with a capatal letter at the start. This 
    // is to avoid writing a bunch of mappings that just capatalise the 
    // first letter.
    const mapOrCapatalise = (text) => {
        const mapped = startWords[text]
        const capatalised = text[0].toUpperCase() + text.slice(1)
        return mapped? mapped:[capatalised]
    }

    const setStat = (statName) => {
        console.log("parsing", statName)
        const modifier = modifierFunctions[statName]
        const regex = regexExpressions[statName]
        const mappedStatTarget = mapOrCapatalise(statName)
        console.log("   searching for", mappedStatTarget)
        let text = findTextByStartWords(lines, mappedStatTarget) // Find line of interest
        console.log("   initial text:", text)
        if (regex) text = regex.exec(text)[0]   // Find substring of interest
        if (modifier) text = modifier(text)     // Modify it if needed
        console.log("   Setting", statName, "to", text)
        setDeepJson(actorData.data, attributeToKey[statName], text)
    }

    ['ac', 'hpval', 'hpmax', 'hpformula', 'speed', 'size', 'type', 
    'alignment', 'senses', 'challenge', 'languages', 'resistance', 
    'immunity', 'vulnerability', 'conditionImmunity', 'skills', 'str', 
    'dex', 'con', 'int', 'wis', 'cha'].forEach(setStat)

    actor.update(actorData)
}
