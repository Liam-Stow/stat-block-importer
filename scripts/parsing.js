import { skillsMap } from './maps.js'

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

// Check if two arrays are the same
function arraysEqual(a,b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
}

// Remove a number of characters equal to endTrim from the end of str
function trimEnds(str, startTrim, endTrim) {
    return str.slice(startTrim, str.length-endTrim);
}

// Returns the first N words from a string as a new string
// remove the last endTrim letters
function getFirstWords(str, numberOfWords, endTrim=0) {
    let firstWords = str
        .split(' ')
        .slice(0, numberOfWords)
        .join(' ');
    return trimEnds(firstWords, 0, endTrim);
}

// Take an array of start words like ["Armor","Class"] and return the rest of
// the text on the first line that starts with those words (not including
// those words themselves).
export function findTextByStartWords(lines, startWords) {
    const wordsCount = startWords.length;
    const foundLine = lines[findIndexByStartWords(lines,startWords)];
    if (foundLine != undefined) {
        return foundLine.split(' ')
                        .slice(wordsCount)
                        .join(' ');
    } 
    ui.notifications.info("No " + startWords.join(' ') + " found in stat block text")
    return "";
}

// Take an array of start words like ["Armor","Class"] and return the index
// of the first line that starts with those words.
export function findIndexByStartWords(lines, startWords) {
    const wordsCount = startWords.length;
    return lines.findIndex(line => {
        const words = line.split(' ');
        if (words.length >= wordsCount) {
            return arraysEqual(words.slice(0,wordsCount), startWords);
        }
        return false;
    });
}

// Check if an action is an attack from its details string
export function isAttack(detailsString) {
    return isAttackType(getFirstWords(detailsString, 3, 1));
}

// returns true if str is a type of attack
function isAttackType(str) {
    const ATTACK_TYPES = ["Melee Weapon Attack", "Ranged Weapon Attack", "Melee Spell Attack", "Ranged Spell Attack"];
    return ATTACK_TYPES.includes(str);
}


// Check if a line starts a new character feature
// line is a string, returns title of feat if it exists, undefined otherwise
function findFeatTitle(line) {
    const capatalisedWord = '[A-Z][a-z]*'
    const capatalisedWords = '(' + capatalisedWord + ' ?)+'
    const maybeTag = '(\\(' + capatalisedWord + '\\))?'
    const maybeRecharge = '(\\(Recharge \\d-\\d\\))?'
    // const featTitleRegex = /^[A-Z][a-z] ?([A-Z][a-z]* ?)+\./
    const featTitleRegex = RegExp('^' + capatalisedWords + maybeTag + maybeRecharge + '\\.')
    const results = line.match(featTitleRegex)
    if (results){
        return results[0].replace(/.$/,'') // return first result without the dot
    }
    return undefined
}


// Takes in the entire block of abilities or actions and gives back an object of feature name to feature description.
export function readFeatures(featuresLines) {
    let features = {}
    let featName = ""
    let featureDescription = ""
    featuresLines.forEach(line => {
        const newFeatName = findFeatTitle(line)
        if  (newFeatName) {
            if (featName !== "")
                features[featName] = featureDescription
            featName = newFeatName
            featureDescription = line.slice(featName.length+2) // text after the feat name and dot
        } else {                
            featureDescription += line
        }
    });
    features[featName] = featureDescription

    return features
}

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
                movement[pair[0]] = pair[1]
            } else {
                movement.walk = pair[0]
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
            senses[senseName] = dist
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
        .forEach(skill => setDeepJson(skills, [skillsMap[skill], "value"], 1))

    // TODO: Account for expertise

    return skills
}