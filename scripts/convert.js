import { setDeepJson, findTextByPosition, findTextByStartWords } from './parsing.js'
import { attributeToKey, attrToWordIndex, modifierFunctions, startWords, regexExpressions } from './maps.js'

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

    // Try to map a string with a given map, otherwise just return the 
    // text with a capatal letter at the start. This is to avoid writing
    // a bunch of mappings that just capatalise the first letter.
    const mapOrCapatalise = (text, map) => {
        const mapped = map[text]
        const capatalised = text[0].toUpperCase() + text.slice(1)
        return mapped? mapped:[capatalised]
    }

    const setStats = (stats, finder, targetMap) => {
        stats.forEach(stat => {
            console.log("parsing", stat)
            const modifier = modifierFunctions[stat]
            const regex = regexExpressions[stat]
            const mappedStatTarget = mapOrCapatalise(stat, targetMap)
            console.log("   searching for", mappedStatTarget)
            let text = finder(lines, mappedStatTarget) // Find line of interest
            console.log("   initial text", text)
            if (regex) text = regex.exec(text)[0]   // Find substring of interest
            if (modifier) text = modifier(text)     // Modify it if needed
            console.log("   Setting", stat, "to", text)
            setDeepJson(actorData.data, attributeToKey[stat], text)
        })
    }

    // Stats that can be found in the stat block by searching for specific words
    const statsByWord = ['ac', 'hpval', 'hpmax', 
                        'hpformula', 'speed', 'size', 
                        'type', 'alignment', 'senses', 
                        'challenge', 'languages', 'resistance', 
                        'immunity', 'vulnerability', 'conditionImmunity', 'skills']
    setStats(statsByWord, findTextByStartWords, startWords)

    // Stats that are found using the relevant text's line and column numbers in the stat block
    const statsByPosition = ['str', 'dex', 'con', 'int', 'wis', 'cha']
    setStats(statsByPosition, findTextByPosition, attrToWordIndex)

    actor.update(actorData)
}
