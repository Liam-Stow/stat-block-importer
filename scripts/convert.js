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

    // Stats that can be found in the stat block by searching for specific words
    const statsByWord = ['ac', 'hpval', 'hpmax', 
                        'hpformula', 'speed', 'size', 
                        'type', 'alignment', 'senses', 
                        'cr', 'languages', 'resistance', 
                        'immunity', 'vulnerability', 'conditionImmunity']
    setStats(statsByWord, findTextByStartWords, startWords)

    // Stats that are found using the relevant text's line and column numbers in the stat block
    const statsByPosition = ['str', 'dex', 'con', 'int', 'wis', 'cha']
    setStats(statsByPosition, findTextByPosition, attrToWordIndex)

    // Proficient Skills
    findTextByStartWords(lines, ["Skills"])
        .match(/[A-z]+/g)
        .forEach(skill => setDeepJson(actorData.data, attributeToKey[skill], 1))

    actor.update(actorData)
}
