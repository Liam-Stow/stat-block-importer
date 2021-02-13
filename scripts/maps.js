import { parseMovement, parseSenses, parseLanguages, parseTrait } from './parsing.js'

// [lineNumber, [word1, word2, ..., wordn]]
export const attrToWordIndex = {
    name : [0,[0]],
    ac : [2,[2]],
    hpval : [3,[2]],
    hpmax : [3,[2]],
    hpformula : [3,[3,4,5]],
    speed : [4,[1]],
    str : [6,[0]],
    dex : [8,[0]],
    con : [10,[0]],
    int : [12,[0]],
    wis : [14,[0]],
    cha : [16,[0]],
}

export const skillsMap = {
    Acrobatics : 'acr',
    'Animal Handling' : 'ani',
    Arcana : 'arc',
    Athletics : 'ath',
    Deception : 'dec',
    History : 'his',
    Insight : 'ins',
    Intimidation : 'itm',
    Investigation : 'inv',
    Medicine : 'med',
    Nature : 'nat',
    Perception : 'prc',
    Performance : 'prf',
    Persuasion : 'per',
    Religion : 'rel',
    'Sleight of Hand' : 'slt',
    Stealth : 'ste',
    Survival  : 'sur',
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
    Acrobatics: ['skills', 'acr', 'value'],
    Animal: ['skills', 'ani', 'value'],
    Arcana: ['skills', 'arc', 'value'],
    Athletics: ['skills', 'ath', 'value'],
    Deception: ['skills', 'dec', 'value'],
    History: ['skills', 'his', 'value'],
    Insight: ['skills', 'ins', 'value'],
    Intimidation: ['skills', 'itm', 'value'],
    Investigation: ['skills', 'inv', 'value'],
    Medicine: ['skills', 'med', 'value'],
    Nature: ['skills', 'nat', 'value'],
    Perception: ['skills', 'prc', 'value'],
    Performance: ['skills', 'prf', 'value'],
    Persuasion: ['skills', 'per', 'value'],
    Religion: ['skills', 'rel', 'value'],
    Sleight: ['skills', 'slt', 'value'],
    Stealth: ['skills', 'ste', 'value'],
    Survival: ['skills', 'sur', 'value'],
    senses: ['attributes', 'senses'],
    cr: ['details', 'cr'],
    languages: ['traits', 'languages'],
    resistance: ['traits', 'dr', 'value'],
    immunity: ['traits', 'di', 'value'],
    vulnerability: ['traits', 'dv', 'value'],
    conditionImmunity: ['traits', 'ci', 'value'],
}

export const startWords = {
    size: ["Meta"], // Inserted by preprocessing
    type: ["Meta"],
    alignment: ["Meta"],
    ac: ["Armor", "Class"],
    hpval: ["Hit", "Points"],
    hpmax: ["Hit", "Points"],
    hpformula: ["Hit", "Points"],
    speed: ["Speed"],
    senses: ["Senses"],
    resistance: ["Damage", "Resistances"],
    immunity: ["Damage", "Immunities"],
    vulnerability: ["Damage", "Vulnerabilities"],
    conditionImmunity: ["Condition", "Immunities"],
    cr: ["Challenge"],
    languages: ["Languages"],
}

// Used to find the value you're looking for once you already have the
// correct line.
export const regexExpressions = {
    size: /(Tiny|Small|Medium|Large|Huge|Gargantuan)/,
    type: /\S+( \(\S+\))? ?,/,
    alignment: /, .*/,
    ac: /[0-9]+/,
    hpval: /[0-9]+/,
    hpmax: /[0-9]+/,
    hpformula: /\(.+\)/,
    cr: /^[0-9]+/
}

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
    conditionImmunity: parseTrait
}


export const attackTypes = {
    "Melee Weapon Attack" : "mwak",
    "Ranged Weapon Attack" : "rwak",
    "Melee Spell Attack" : "msak",
    "Ranged Spell Attack" : "rsak",
}

export const sizes = {
    Gargantuan : "grg",
    Huge : "huge",
    Large : "lg",
    Medium : "med",
    Small : "sm",
    Tiny : "tiny",
}