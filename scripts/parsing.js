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


function concatJson(object1, object2) {
    for (let key in object2) {
        object1[key] = object2[key]
    }
    return object1
}


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


// given an array of text lines and a [lineNumber, [word1, word2]] position array,
// make a string of the selected words. 
export function findTextByPosition(textArray, position) {
    let lineIndicies = position[0];
    let wordIndicies = position[1];
    let line = textArray[lineIndicies].split(' ');
    let words = line.filter((_, index) => wordIndicies.includes(index));
    return words.join(' ');
}


// function setDataFromStaticPositionText(foundryJson, lines) {
//     let prevJson
//     for (attributeName in attributeToKey) {
//         let currentJson = foundryJson;
//         let keyPath = attributeToKey[attributeName].split('.');
//         keyPath.forEach(nextKey => {
//             prevJson = foundryJson;
//             currentJson = currentJson[nextKey];
//         })
//         prevJson[keyPath[keyPath.length-1]] = getWords(lines, attrToWordIndex[attributeName])
//     }
//     return prevJson;
// }


function saveJson(json, fileName) {
    let a = document.createElement("a");
    let file = new Blob([JSON.stringify(json)]);
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}


function findLineByStartWord(lines, startWord) {
    return lines.findIndex(line => line.split(' ')[0] === startWord);
}


// Take an array of start words like ["Armor","Class"] and return the rest of
// the text on the first line that starts with those words (not including
// those words themselves).
export function findTextByStartWords(lines, startWords) {
    const count = startWords.length;
    // console.log("lines")
    // console.log(lines)
    let foundLine = lines.find(line => {
        if (arraysEqual(startWords, ["Damage","Immunities"])) {
        }
        const words = line.split(' ');
        if (words.length >= count) {
            return arraysEqual(words.slice(0,count), startWords);
        }
        return false;
    })
    if (foundLine != undefined) {
        return foundLine.split(' ')
                        .slice(count)
                        .join(' ');
    }
    return "";
}

function getLastItem(indexable) {
    return indexable[indexable.length-1];
}


function isUpperCase(char) {
    if (!isNaN(char*1))
        return false; // character is a number
    if (char === char.toLowerCase())
        return false; // character is lower case
    return true; // passed both checks, its upper case
}

// Check if an action is an attack from its details string
function isAttack(detailsString) {
    return isAttackType(getFirstWords(detailsString, 3, 1));
}

// returns true if str is a type of attack
function isAttackType(str) {
    const ATTACK_TYPES = ["Melee Weapon Attack", "Ranged Weapon Attack", "Melee Spell Attack", "Ranged Spell Attack"];
    return ATTACK_TYPES.includes(str);
}


// Check if a line starts a new character feature
// line is a string, returns bool
function lineStartsFeature(line) {
    if (line.length === 1) return false;
    return  ((getLastItem(line[0]) === '.' && isUpperCase(line[0][0])) 
            || 
            (getLastItem(line[1]) === '.')  && isUpperCase(line[1][0]));
}


// Takes in the entire block of abilities or actions and gives back an object of feature name to feature description.
function readFeatures(featuresLines) {
    let features = {};
    let featureName = "";
    let featureDescription = "";
    featuresLines.forEach(line => {
        let words = line.split(' ');
        if  (lineStartsFeature(words)) {
            if (featureName !== "")
                features[featureName] = featureDescription;
            const NAME_END_INDEX = line.indexOf('.'); // Get the index of the first dot
            featureName = line.slice(0,NAME_END_INDEX); // chars before first dot
            featureDescription = line.slice(NAME_END_INDEX+2); // chars after first dot and space
        } else {                
            featureDescription += line;
        }
    });
    features[featureName] = featureDescription;

    return features;
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