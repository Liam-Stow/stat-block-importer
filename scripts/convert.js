import { setDeepJson, findTextByStartWords, findIndexByStartWords, readFeatures, isAttack } from './parsing.js'
import { attributeToKey, modifierFunctions, startWords, regexExpressions } from './maps.js'

const preprocess = text => {
    const lines = text
        .replace(/–/g, '-')                             // Replace all Ascii 150 with Ascii 45
        .split('\n')
        .filter(line => line !== "" && line !== " ")    // Remove empty lines
        .map(s=>s.trim())                               // Remove edge whitespace
    
    // Add a title to the meta line (size, type, alignment) so it can be found later
    lines[1] = "Meta " + lines[1] 

    // Put three letter attribute title on same line as its value
    const stats = ["STR", "DEX", "CON", "INT", "WIS", "CHA"]
    stats.forEach(stat => {
        const statNameIndex = lines.findIndex(s=>s===stat)
        if (statNameIndex !== -1) {
            const statValueIndex = statNameIndex + 1
            lines[statNameIndex] += " " + lines[statValueIndex] 
            lines.splice(statValueIndex, 1)
        }
    })

    return lines
}


export const makeActor = async (text) => {
    const lines = preprocess(text)
    let actor = await makeActorWithStats(lines);
    //setFeats(actor, lines);
}


const makeActorWithStats = async (lines) => {
    let actorData = {};

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
        const modifier = modifierFunctions[statName]
        const regex = regexExpressions[statName]
        const mappedStatTarget = mapOrCapatalise(statName)
        let text = findTextByStartWords(lines, mappedStatTarget) // Find line of interest
        if (regex) text = regex.exec(text)[0]   // Find substring of interest
        if (modifier) text = modifier(text)     // Modify it if needed
        setDeepJson(actorData, attributeToKey[statName], text)
    }

    ['ac', 'hpval', 'hpmax', 'hpformula', 'speed', 'size', 'type', 
    'alignment', 'senses', 'challenge', 'languages', 'resistance', 
    'immunity', 'vulnerability', 'conditionImmunity', 'skills', 'str', 
    'dex', 'con', 'int', 'wis', 'cha'].forEach(setStat)

    return await Actor.create({
        name: lines[0],
        type: "npc",
        data: actorData
    });
}


const setFeats = (actor, lines) => {
    const featsStartLine = findIndexByStartWords(lines, "Challenge")+1;

    const feats = readFeatures(lines.slice(featsStartLine))
    console.log(feats)

    for(const featKey in feats) {
        const description = feats[featKey]
        const featType = isAttack(description)? 'weapon':'feat'
        console.log("making", featKey, "a", featType)
        actor.createEmbeddedDocuments("Item", {name: featKey, type: featType, 'data.description.value': description})
    }

}
