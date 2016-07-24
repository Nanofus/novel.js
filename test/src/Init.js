let { expect } = chai;
let should = chai.should();

let novelData = {
  novel: {novelName:"testGame",currentInventory:0,inventories:[],scenes:[],tagPresets:[],settings:{soundSettings:{soundVolume:0}},sounds:[]},
  choices: null,
  debugMode: false,
  status: "Loading",
  inventoryHidden: false,
  choicesHidden: false,
  printedText: "",
  parsedJavascriptCommands: [],
  music: [],
  csvEnabled: false,
  markdownEnabled: false
};

let novelPath = './novel';
