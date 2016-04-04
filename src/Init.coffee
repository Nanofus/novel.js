
### GLOBAL GAME novelData ###

novelData = {
  novel: null
  choices: null
  debugMode: false
  inventoryHidden: false
  printedText: ""
  parsedJavascriptCommands: []
  music: []
}

novelPath = './novel'

novelManager = new NovelManager
inputManager = new InputManager
inventoryManager = new InventoryManager
parser = new Parser
sceneManager = new SceneManager
soundManager = new SoundManager
textPrinter = new TextPrinter
ui = new UI
util = new Util
