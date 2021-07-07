import { findTextByStartWords, findIndexByStartWords, readFeatures, isAttack } from './searching.js'
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

// Set the value of an object nested deeply in a long JSON path, inventing
// the path along the way if it does not exist. 
export function setDeepJson(root,path,value) {
    if (path.length === 1) {
        root[path[0]] = value;
        return;
    }
    if (!root.hasOwnProperty(path[0])) {
        root[path[0]] = {};
    }
    setDeepJson(root[path[0]], path.slice(1), value);
}

export const makeActor = async (text) => {
    const lines = preprocess(text)
    let actor = await makeActorWithStats(lines);
    await setFeats(actor, lines);
}

const makeActorWithStats = async (lines) => {
    let actorData = {};

    // Try to map a stat string to its search term, otherwise just 
    // return the string with a capatal letter at the start. This 
    // is to avoid writing a bunch of mappings that just capatalise the 
    // first letter.
    const getSearchTerm = (text) => {
        const mapped = startWords[text]
        const capatalised = text[0].toUpperCase() + text.slice(1)
        return mapped? mapped:[capatalised]
    }

    const setStat = (statName) => {
        const modifier = modifierFunctions[statName]
        const regex = regexExpressions[statName]
        const searchTerm = getSearchTerm(statName)
        let text = findTextByStartWords(lines, searchTerm) // Find line of interest
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


const setFeats = async (actor, lines) => {
    const featsStartLine = findIndexByStartWords(lines, "Challenge")+1;

    const feats = readFeatures(lines.slice(featsStartLine))
    console.log(feats)

    for(const featKey in feats) {
        const description = feats[featKey]
        const featType = isAttack(description)? 'weapon':'feat'
        console.log("making", featKey, "a", featType)

        const success = await AddDocumentFromCompendium(actor, featKey, featType)

        if (!success) 
            actor.createEmbeddedDocuments("Item", [{name: featKey, type: featType, 'data.description.value': description}])
    }

}


// featType either "weapon" or "feat". Returns true on success, false on failure
const AddDocumentFromCompendium = async (actor, itemName, featType) => {
    const packName = featType == "weapon" ? "dnd5e.items" : "dnd5e.monsterfeatures"
    const pack = await game.packs.get(packName)
    const index = await pack.index.getName(itemName)

    if (index === undefined) return false

    const item = await pack.getDocument(index._id)
    await actor.update({"items": [item]})

    // Make actor proficient with item if its a weapon
    if (featType === "weapon")
        await actor.updateEmbeddedDocuments("Item", [{_id: index._id, data: {equipped: true, proficient: true}}])

    return true
}