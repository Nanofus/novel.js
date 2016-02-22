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
inventoryManager = new InventoryManager
parser = new Parser
sceneManager = new SceneManager
soundManager = new SoundManager
textPrinter = new TextPrinter
ui = new UI
util = new Util
