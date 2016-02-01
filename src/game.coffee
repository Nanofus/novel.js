
data = {
  gameData: null,
  currentScene: null
}

loadGame = ->
  $.getJSON 'game.json', (json) ->
    console.log "Loaded game: " + json.gameName
    data.gameData = json
    data.currentScene = json.scenes[0]

loadGame()

gameArea = new Vue(
  el: '#game-area'
  data: data,
  methods:
    selectChoice: (choice) ->
      this.currentScene = this.findSceneByName(choice.nextScene)

    requirementsFilled: (choice) ->
      if choice.itemRequirement != null
        console.log "YERS"

    findSceneByName: (name) ->
      console.log this.gameData.scenes
      for i in this.gameData.scenes
        if i.name == name
          return i
      console.log "ERROR: Scene by name '"+name+"' not found!"
)
