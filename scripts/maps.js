import { parseMovement, parseSenses, parseLanguages, parseTrait, parseSkills } from './parsing.js'

export const skillsMap = {
    acrobatics : 'acr',
    'animal handling' : 'ani',
    arcana : 'arc',
    athletics : 'ath',
    deception : 'dec',
    history : 'his',
    insight : 'ins',
    intimidation : 'itm',
    investigation : 'inv',
    medicine : 'med',
    nature : 'nat',
    perception : 'prc',
    performance : 'prf',
    persuasion : 'per',
    religion : 'rel',
    'sleight of hand' : 'slt',
    stealth : 'ste',
    survival  : 'sur',
}

export const traits = {
    Resistance: 'dr',
    Immunity: 'di',
    Vulnerability: 'dv',
    ConditionImmunity: 'ci',
}

export const attributeToKey = {
    size : ['traits','size'],
    type : ['details','type'],
    alignment : ['details','alignment'],
    ac : ['attributes','ac','value'],
    hpval : ['attributes','hp','value'],
    hpmax : ['attributes','hp','max'],
    hpformula : ['attributes','hp','formula'],
    speed : ['attributes','movement'],
    str : ['abilities','str','value'],
    dex : ['abilities','dex','value'],
    con : ['abilities','con','value'],
    int : ['abilities','int','value'],
    wis : ['abilities','wis','value'],
    cha : ['abilities','cha','value'],
    skills: ['skills'],
    senses: ['attributes', 'senses'],
    challenge: ['details', 'cr'],
    languages: ['traits', 'languages'],
    resistance: ['traits', 'dr', 'value'],
    immunity: ['traits', 'di', 'value'],
    vulnerability: ['traits', 'dv', 'value'],
    conditionImmunity: ['traits', 'ci', 'value'],
}

// values hold the list of words to search for to find the stat denoted
// by the key. eg, to find the ac value, search for "Armor Class" in text
export const startWords = {
    size: ["Meta"], // Inserted by preprocessing
    type: ["Meta"],
    alignment: ["Meta"],
    ac: ["Armor", "Class"],
    hpval: ["Hit", "Points"],
    hpmax: ["Hit", "Points"],
    hpformula: ["Hit", "Points"],
    str : ['STR'],
    dex : ['DEX'],
    con : ['CON'],
    int : ['INT'],
    wis : ['WIS'],
    cha : ['CHA'],
    resistance: ["Damage", "Resistances"],
    immunity: ["Damage", "Immunities"],
    vulnerability: ["Damage", "Vulnerabilities"],
    conditionImmunity: ["Condition", "Immunities"],
}

// Used to find the value you're looking for once you already have the
// correct line.
const matchNumber = /[0-9]+/
export const regexExpressions = {
    size: /(Tiny|Small|Medium|Large|Huge|Gargantuan)/,
    type: /\S+( \(\S+\))? ?,/,  // Match a string, then possibly another string in (brackets), and then a comma
    alignment: /, .*/,          // Match everything after a comma
    ac: matchNumber,
    hpval: matchNumber,
    hpmax: matchNumber,
    hpformula: /\(.+\)/,        // Match everything inside a set of brackets
    str : matchNumber,
    dex : matchNumber,
    con : matchNumber,
    int : matchNumber,
    wis : matchNumber,
    cha : matchNumber,
    challenge: matchNumber,
}

// map each stat to a modifier function that takes the stat text as written
// in the stat block and returns a value in the correct format for foundry.
export const modifierFunctions = {
    size: i=>sizes[i],                  // Get the foundry compatible size string
    alignment: i=>i.replace(/, /,''),   // Remove comma from start of string   
    type: i=>i.replace(/,/,''),
    speed: parseMovement,
    senses: parseSenses,
    languages: parseLanguages,
    str: parseInt,
    dex: parseInt,
    con: parseInt,
    int: parseInt,
    wis: parseInt,
    cha: parseInt,
    resistance: parseTrait,
    immunity: parseTrait,
    vulnerability: parseTrait,
    conditionImmunity: parseTrait,
    skills: parseSkills
}


export const attackTypes = {
    'Melee Weapon Attack' : 'mwak',
    'Ranged Weapon Attack' : 'rwak',
    'Melee Spell Attack' : 'msak',
    'Ranged Spell Attack' : 'rsak',
}

export const sizes = {
    Gargantuan : 'grg',
    Huge : 'huge',
    Large : 'lg',
    Medium : 'med',
    Small : 'sm',
    Tiny : 'tiny',
}

export const languages = {
    'deep speech': 'deep',
    "thieves' cant": 'cant' 
}