
### GLOBAL GAME DATA ###

novelData = {
  novel: null
  choices: null
  debugMode: false
  status: "Loading"
  inventoryHidden: false
  choicesHidden: false
  printedText: ""
  parsedJavascriptCommands: []
  music: []
  csvEnabled: false
}

novelPath = './novel'

if typeof Papa isnt "undefined"
   novelData.csvEnabled = true
