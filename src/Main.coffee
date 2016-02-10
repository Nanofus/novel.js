data = {
  game: null,
  choices: null,
  debugMode: false,
  music: []
}

gamePath = './game'

# Game area
gameArea = new Vue(
  el: '#game-area'
  data: data
  methods:
    requirementsFilled: (choice) ->
      return Scene.requirementsFilled(choice)

    selectChoice: (choice) ->
      Scene.exitScene(@game.currentScene)
      Scene.readItemAndStatsEdits(choice)
      Scene.readSounds(choice,true)
      Scene.readSaving(choice)
      if choice.nextScene != ""
        Scene.changeScene(choice.nextScene)
      else
        Scene.updateScene(@game.currentScene)
)

### And finally, start the game... ###
GameManager.startGame()
