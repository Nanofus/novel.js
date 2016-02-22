
### SAVING AND LOADING ###

class GameManager

  # Load a browser cookie
  loadCookie: (cname) ->
    name = cname + '='
    ca = document.cookie.split(';')
    i = 0
    while i < ca.length
      c = ca[i]
      while c.charAt(0) == ' '
        c = c.substring(1)
      if c.indexOf(name) == 0
        return c.substring(name.length, c.length)
      i++
    ''

  # Save a browser cookie
  saveCookie: (cname, cvalue, exdays) ->
    d = new Date
    d.setTime d.getTime() + exdays * 24 * 60 * 60 * 1000
    expires = 'expires=' + d.toUTCString()
    document.cookie = cname + '=' + cvalue + '; ' + expires + '; path=/'

  # Load the game from a cookie or entered json
  loadGame: (game) ->
    if game == undefined
      if @loadCookie("gameData") != ''
        console.log "Cookie found!"
        cookie = @loadCookie("gameData")
        console.log "Cookie loaded"
        console.log cookie
        loadedData = JSON.parse(atob(@loadCookie("gameData")))
        @prepareLoadedGame(loadedData)
    else if game != undefined
      loadedData = JSON.parse(atob(game))
      @prepareLoadedGame(loadedData)

  # Prepare the game from the loaded save file
  prepareLoadedGame: (loadedData) ->
    if data.game.gameName != loadedData.gameName
      console.error "ERROR! Game name mismatch"
      return
    if data.game.version != loadedData.version
      console.warn "WARNING! Game version mismatch"
    data.game = loadedData
    data.debugMode = data.game.debugMode
    scene.updateScene(data.game.currentScene,true)

  # Start the game by loading the default game.json
  startGame: ->
    request = new XMLHttpRequest
    request.open 'GET', gamePath + '/game.json', true
    request.onload = ->
      if request.status >= 200 and request.status < 400
        json = JSON.parse(request.responseText)
        json = gameManager.prepareData(json)
        data.game = json
        data.game.currentScene = scene.changeScene(data.game.scenes[0].name)
        data.debugMode = data.game.debugMode
    request.onerror = ->
      return
    request.send()
    if document.querySelector("#continue-button") != null
      document.querySelector("#continue-button").style.display = 'none'

  # Converts the game's state into json and Base64 encode it
  saveGameAsJson: () ->
    save = btoa(JSON.stringify(data.game))
    return save

  # Save game in the defined way
  saveGame: ->
    save = @saveGameAsJson()
    if data.game.settings.saveMode == "cookie"
      @saveCookie("gameData",save,365)
    else if data.game.settings.saveMode == "text"
      ui.showSaveNotification(save)

  # Add values to game.json that are not defined but are required for Vue.js view updating and other functions
  prepareData: (json) ->
    json.currentScene=""
    json.parsedChoices=""
    if json.inventory == undefined
      json.inventory = []
    if json.stats == undefined
      json.stats = []
    if json.scenes == undefined
      json.scenes = []
    for i in json.inventory
      if i.displayName == undefined
        i.displayName = i.name
    for s in json.scenes
      s.combinedText = ""
      s.parsedText = ""
      for c in s.choices
        c.parsedText = ""
        if c.nextScene == undefined
          c.nextScene = ""
        if c.alwaysShow == undefined
          c.alwaysShow = false
    return json
