data = {
  game: null,
  choices: null,
  debugMode: false,
  printedText: "",
  parsedJavascriptCommands: [],
  music: []
}

gamePath = './game'

gameManager = new GameManager
inputManager = new InputManager
inventory = new Inventory
parser = new Parser
scene = new Scene
sound = new Sound
textPrinter = new TextPrinter
ui = new UI
util = new Util
