data = {
  game: null,
  choices: null,
  debugMode: false,
  printedText: "",
  parsedJavascriptCommands: [],
  music: []
}

gamePath = './game'

# Game area
gameArea = new Vue(
  el: '#game-area'
  data: data
  methods:
    # Return whether the requirements of a choice have been filled
    requirementsFilled: (choice) ->
      return Scene.requirementsFilled(choice)

    # Return whether the text can be skipped
    textSkipEnabled: (choice) ->
      return data.game.currentScene.skipEnabled

    # Check if specific item's count is over 0; if it isn't, it's not shown.
    itemsOverZero: (item) ->
      for i in @game.inventory
        if i.name == item.name
          if i.count > 0
            return true
      return false

    # Select a choice
    selectChoice: (choice) ->
      Scene.selectChoice(choice)

)

### And finally, start the game... ###
GameManager.startGame()
