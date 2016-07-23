
/* GLOBAL GAME DATA */

let novelData = {
  novel: null,
  choices: null,
  debugMode: false,
  status: "Loading",
  inventoryHidden: false,
  choicesHidden: false,
  printedText: "",
  parsedJavascriptCommands: [],
  music: [],
  csvEnabled: false
};

let novelPath = './novel';

if (typeof Papa !== "undefined") {
   novelData.csvEnabled = true;
}
