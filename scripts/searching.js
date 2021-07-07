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

// Return the first words of a string up to but not including the first occurance of endWord
function getWordsUpTo(str, ...endWords) {
    const endWordIndex = str.split(' ').findIndex(word=>endWords.includes(word))
    return getFirstWords(str, endWordIndex)
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
    console.log(getWordsUpTo(detailsString, "Attack", "Attack:"));
    // Check words up to "Attack" or "Attack:" because text extraction often misses the :
    return isAttackType(getWordsUpTo(detailsString, "Attack", "Attack:"));
}
 
// returns true if str is a type of attack
function isAttackType(str) {
    const ATTACK_TYPES = [
        "Melee Weapon", 
        "Ranged Weapon", 
        "Melee Spell", 
        "Ranged Spell", 
        "Melee or Ranged Weapon", 
        "Melee or Ranged Spell"
    ];
    return ATTACK_TYPES.includes(str);
}

// Check if a line starts a new character feature
// line is a string, returns title of feat if it exists, undefined otherwise
function findFeatTitle(line) {
    const capatalisedWord = '[A-Z][a-z]*'
    const capatalisedWords = '(' + capatalisedWord + ' ?)+'
    const maybeTag = '(\\(' + capatalisedWord + '\\))?'
    const maybeRecharge = '(\\(Recharge \\d-\\d\\))?'
    // featTitleRegex is /^[A-Z][a-z] ?([A-Z][a-z]* ?)+\./
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
        if (line === "ACTIONS") return // in a forEach(), return works like continue
        const newFeatName = findFeatTitle(line)
        if  (newFeatName) {
            if (featName !== "")
                features[featName] = featureDescription
            featName = newFeatName
            featureDescription = line.slice(featName.length+2) // text after the feat name and dot
        } else {                
            featureDescription += " " + line
        }
    });
    features[featName] = featureDescription

    return features
}