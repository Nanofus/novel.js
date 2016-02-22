expect = chai.expect
should = chai.should()

describe 'Tests', ->
  beforeEach ->
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

    gameArea = new Vue(
      el: '#game-area'
      data: data
      methods:
        # Return whether the requirements of a choice have been filled
        requirementsFilled: (choice) ->
          return scene.requirementsFilled(choice)

        # Return whether the text can be skipped
        textSkipEnabled: (choice) ->
          return data.game.currentScene.skipEnabled && data.game.settings.skipButtonShown

        # Check if specific item's count is over 0; if it isn't, it's not shown.
        itemsOverZero: (item) ->
          for i in @game.inventory
            if i.name == item.name
              if i.count > 0
                return true
          return false

        # Select a choice
        selectChoice: (choice) ->
          scene.selectChoice(choice)
    )

  describe 'Parser', ->
    describe 'parseItemsOrStats()', ->
      it 'should return correct items', ->
        items = parser.parseItemsOrStats("sword[1]|shield[2]")
        expect(items[0][0]).to.equal('sword')
        expect(items[1][1]).to.equal(3)
        expect(items[2]).to.equal(undefined)
      it 'should return correct items when list empty', ->
        items = parser.parseItemsOrStats("")
        expect(items).to.equal(undefined)
