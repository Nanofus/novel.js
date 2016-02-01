gameData = '';

loadGame = ->
  $.getJSON 'test.json', (json) ->
    console.log "Loaded game: " + json.gameName
    gameData = json

gameArea = new Vue(
  el: '#game-area'
  data: { gameData: gameData }
  methods:
    makeChoice: (choice) ->

)
