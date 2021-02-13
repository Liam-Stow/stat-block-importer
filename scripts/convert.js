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
    setStats(['ac', 'hpval', 'hpmax', 'hpformula', 'speed', 'size', 'type', 'alignment', 'senses', 'cr', 'languages', 'resistance', 'immunity', 'vulnerability', 'conditionImmunity'], findTextByStartWords, startWords)
    setStats(['str', 'dex', 'con', 'int', 'wis', 'cha'], findTextByPosition, attrToWordIndex)

    // Proficient Skills
    findTextByStartWords(lines, ["Skills"])
        .match(/[A-z]+/g)
        .forEach(skill => setDeepJson(actorData.data, attributeToKey[skill], 1))
        
    actor.update(actorData)
}
