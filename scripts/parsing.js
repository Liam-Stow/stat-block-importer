import { skillsMap } from './maps.js'

export function parseMovement(movementString) {
    let movement = {
        burrow: 0,
        climb: 0,
        fly: 0,
        swim: 0,
        walk: 0,
        units: "ft",
        hover: false
    }

    movementString
        .split(', ')
        .map(s=>s.slice(0,-4))
        .forEach(speedString => {
            let pair = speedString.split(' ')
            if (pair.length > 1) {
                movement[pair[0]] = parseFloat(pair[1])
            } else {
                pair[0] = 
                movement.walk = parseFloat(pair[0])
            }
        })

    return movement
}

export function parseSenses(sensesString) {
    let senses = {
        darkvision: 0,
        blindsight: 0,
        tremorsense: 0,
        truesight: 0,
        units: "ft",
        special: ""
    }

    sensesString
        .toLowerCase()
        .split(', ')
        .filter(s=>!s.includes("passive perception")) // Foundry calculates pp, don't store it explicitly
        .forEach(sense => {
            let [senseName, dist] = sense.split(' ')
            dist = dist.match(/[0-9]+/)[0]
            senses[senseName] = parseFloat(dist)
        })

    return senses
}


// Parses a line of Resistances, Immunities or Vulnerabilities
export function parseTrait(traitString) {
    let traitValue = []

    traitString
        .split('; ')[0] // Ignore traits after a ;, they will need to be treated differently.
        .split(', ')
        .filter(word => word !== "") // Get rid of empty words
        .map(s => s.toLowerCase())
        .forEach(trait => traitValue.push(trait))
    if (traitString.includes("Bludgeoning, Piercing, and Slashing from Nonmagical Attacks"))
        traitValue.push("physical");

    return traitValue
}


export function parseLanguages(languagesString) {
    const defaultLanguages = ["Aarakocra", "Abyssal", "Aquan", "Auran", "Celestial", "Common", "Deep Speech", "Draconic", "Druidic", "Dwarvish", "Elvish", "Giant", "Gith", "Gnoll", "Gnomish", "Goblin", "Halfling", "Ignan", "Infernal", "Orc", "Primordial", "Sylvan", "Terran", "Thieves' Cant", "Undercommon"]
    
    let languages = {
        value: [],
        custom: ""
    }

    languagesString
        .split(', ')
        .map(s=>s.trim()) // Remove whitespace from ends
        .forEach(language => {
            if (defaultLanguages.includes(language))
                languages.value.push(language.toLowerCase())
            else
                languages.custom += language + ';'
        })

    // Remove final semicolon that was added as a seperator
    languages.custom = languages.custom.replace(/;$/, "")

    return languages
}


export function parseSkills(skillsString) {
    let skills={}

    skillsString
        .toLowerCase()
        .match(/[A-z]+/g)
        .forEach(skill => {
            const skillShortHand = skillsMap[skill]
            skills[skillShortHand] = {}
            skills[skillShortHand].value = 1
        })

    console.log(skills)
    // TODO: Account for expertise

    return skills
}