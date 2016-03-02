expect = chai.expect
should = chai.should()

novelData = {
  novel: {novelName:"testGame",currentInventory:0,inventories:[],scenes:[],tagPresets:[],settings:{soundSettings:{soundVolume:0}},sounds:[]},
  choices: null,
  debugMode: false,
  inventoryHidden: false,
  printedText: "",
  parsedJavascriptCommands: [],
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

novelArea = new Vue(
  el: '#novel-area'
  data: novelData
  methods:
    # Return whether the requirements of a choice have been filled
    requirementsFilled: (choice) ->
      return sceneManager.requirementsFilled(choice)

    # Return whether the text can be skipped
    textSkipEnabled: (choice) ->
      return novelData.novel.currentScene.skipEnabled && novelData.novel.settings.skipButtonShown

    # Check if specific item's count is over 0; if it isn't, it's not shown. Also it should be hidden.
    itemsOverZeroAndAreHidden: (item) ->
      for i in novelData.novel.inventories[novelData.currentInventoryIndex]
        if i.name == item.name && (i.hidden && i.hidden != undefined)
          if i.value > 0
            return true
          if isNaN i.value
            return true
      return false

    # Check if specific item's count is over 0; if it isn't, it's not shown. Also should not be hidden.
    itemsOverZeroAndNotHidden: (item) ->
      for i in novelData.novel.inventories[novelData.currentInventoryIndex]
        if i.name == item.name && (!i.hidden || i.hidden == undefined)
          if i.value > 0
            return true
          if isNaN i.value
            return true
      return false

    # Check if specific item's count is over 0; if it isn't, it's not shown. Also should be hidden.
    itemsOverZeroAndHidden: (item) ->
      return inventoryManager.itemsOverZero(item) && inventoryManager.itemHidden(item)

    # Select a choice
    selectChoice: (choice) ->
      sceneManager.selectChoice(choice)
)
