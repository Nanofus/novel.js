expect = chai.expect
should = chai.should()

data = {
  game: {gameName:"testGame",inventory:[],scenes:[],tagPresets:[],sounds:[]},
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

gameArea = new Vue(
  el: '#game-area'
  data: data
  methods:
    # Return whether the requirements of a choice have been filled
    requirementsFilled: (choice) ->
      return sceneManager.requirementsFilled(choice)

    # Return whether the text can be skipped
    textSkipEnabled: (choice) ->
      return data.game.currentScene.skipEnabled && data.game.settings.skipButtonShown

    # Check if specific item's count is over 0; if it isn't, it's not shown. Also should not be hidden.
    itemsOverZeroAndNotHidden: (item) ->
      return inventoryManager.itemsOverZero(item) && !inventoryManager.itemHidden(item)

    # Check if specific item's count is over 0; if it isn't, it's not shown. Also should be hidden.
    itemsOverZeroAndHidden: (item) ->
      return inventoryManager.itemsOverZero(item) && inventoryManager.itemHidden(item)

    # Select a choice
    selectChoice: (choice) ->
      sceneManager.selectChoice(choice)
)
