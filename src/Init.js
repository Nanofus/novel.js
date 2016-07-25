
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
  parsedScrollsounds: [],
  music: [],
  csvEnabled: false,
  input: {
    presses: 0
  },
  printer: {
    fullText: "",
    currentText: "",
    currentOffset: 0,
    defaultInterval: 0,
    soundBuffer: [],
    musicBuffer: [],
    stopMusicBuffer: [],
    executeBuffer: [],
    buffersExecuted: false,
    scrollSound: null,
    tickSoundFrequency: 1,
    tickCounter: 0,
    speedMod: false,
    tickSpeedMultiplier: 1,
    pause: 0,
    interval: 0,
    printCompleted: false
  }
};

let novelPath;

if (typeof Papa !== "undefined") {
   novelData.csvEnabled = true;
}
