
### SAVING AND LOADING ###

class NovelManager

  # Load a browser cookie
  loadCookie: (cname) ->
    name = cname + '='
    ca = document.cookie.split(';')
    i = 0
    while i < ca.length
      c = ca[i]
      while c.charAt(0) is ' '
        c = c.substring(1)
      if c.indexOf(name) is 0
        return c.substring(name.length, c.length)
      i++

  # Save a browser cookie
  saveCookie: (cname, cvalue, exdays) ->
    d = new Date
    d.setTime d.getTime() + exdays * 24 * 60 * 60 * 1000
    expires = 'expires=' + d.toUTCString()
    document.cookie = cname + '=' + cvalue + '; ' + expires + '; path=/'

  # Load the novel from a cookie or entered json
  loadData: (novel, changeScene) ->
    if changeScene is undefined
      changeScene = true
    if novel is undefined
      if @loadCookie("gameData") isnt ''
        console.log "Cookie found!"
        cookie = @loadCookie("gameData")
        console.log "Cookie loaded"
        console.log cookie
        loadedData = JSON.parse(atob(@loadCookie("gameData")))
        @prepareLoadedData(loadedData, changeScene)
    else if novel isnt undefined
      loadedData = JSON.parse(atob(novel))
      @prepareLoadedData(loadedData, changeScene)

  # Prepare the novel from the loaded save file
  prepareLoadedData: (loadedData, changeScene) ->
    if novelData.novel.name isnt loadedData.name
      console.error "ERROR! novel name mismatch"
      return
    if novelData.novel.version isnt loadedData.version
      console.warn "WARNING! novel version mismatch"
    novelData.novel.inventories = loadedData.inventories
    novelData.debugMode = novelData.novel.debugMode
    soundManager.init()
    if changeScene
      sceneManager.updateScene(loadedData.currentScene,true)

  # Converts the novel's state into json and Base64 encode it
  saveDataAsJson: () ->
    # Clone the game data
    saveData = JSON.parse(JSON.stringify(novelData.novel))
    delete saveData.scenes
    delete saveData.tagPresets
    delete saveData.sounds
    delete saveData.externalText
    delete saveData.externalJson
    save = btoa(JSON.stringify(saveData))
    return save

  # Save novel in the defined way
  saveData: ->
    save = @saveDataAsJson()
    if novelData.novel.settings.saveMode is "cookie"
      @saveCookie("novelData",save,365)
    else if novelData.novel.settings.saveMode is "text"
      ui.showSaveNotification(save)

  # Add values to novel.json that are not defined but are required for Vue.js view updating and other functions
  prepareData: (json) ->
    json.currentScene=""
    json.parsedChoices=""
    if json.currentInventory is undefined
      json.currentInventory = 0
    if json.inventories is undefined
      json.inventories = []
    if json.scenes is undefined
      json.scenes = []
    for i in json.inventories
      for j in i
        if j.displayName is undefined
          j.displayName = j.name
    for s in json.scenes
      s.combinedText = ""
      s.parsedText = ""
      s.visited = false
      if s.revisitSkipEnabled is undefined
        s.revisitSkipEnabled = json.settings.scrollSettings.revisitSkipEnabled
      if s.text is undefined
        console.warn "WARNING! scene "+s.name+" has no text"
        s.text = ""
      if s.choices is undefined
        console.warn "WARNING! scene "+s.name+" has no choices"
        s.choices = []
      for c in s.choices
        c.parsedText = ""
        if c.alwaysShow is undefined
          c.alwaysShow = false

  # Start the novel by loading the default novel.json
  start: ->
    console.log "-- Starting Novel.js... --"
    console.log "Loading main json..."
    request = new XMLHttpRequest
    request.open 'GET', novelPath + '/novel.json', true
    request.onload = ->
      if request.status >= 200 and request.status < 400
        json = JSON.parse(request.responseText)
        novelManager.loadExternalJson(json)
    request.onerror = ->
      return
    request.send()
    if document.querySelector("#continue-button") isnt null
      document.querySelector("#continue-button").style.display = 'none'

  # Load external json
  loadExternalJson: (json) ->
    console.log "Loading external json files..."
    ready = 0
    for s in json.externalJson
      ((s) ->
        request = new XMLHttpRequest
        request.open 'GET', novelPath + '/json/' + s.file, true
        request.onload = ->
          if request.status >= 200 and request.status < 400
            s.content = JSON.parse(request.responseText)
            ready++
            if ready is json.externalJson.length
              novelManager.includeJsons(json,json)
              novelManager.loadExternalText(json)
            return
        request.onerror = ->
          return
        request.send()
      ) s

  # Combine other json objects with the main json
  includeJsons: (root,object) ->
    for x of object
      if typeof object[x] is 'object'
        @includeJsons root,object[x]
      if object[x].include isnt undefined
        for i in root.externalJson
          if i.name is object[x].include
            object[x] = i.content
            @includeJsons root,object[x]
            break

  # Load external text files
  loadExternalText: (json) ->
    console.log "Loading external text files..."
    ready = 0
    for s in json.externalText
      ((s) ->
        request = new XMLHttpRequest
        request.open 'GET', novelPath + '/texts/' + s.file, true
        request.onload = ->
          if request.status >= 200 and request.status < 400
            s.content = request.responseText
            ready++
            if ready is json.externalText.length
              novelManager.prepareLoadedJson(json)
            return
        request.onerror = ->
          return
        request.send()
      ) s

  # Prepare loaded json data
  prepareLoadedJson: (json) ->
    novelManager.prepareData(json)
    novelData.novel = json
    novelData.novel.currentScene = sceneManager.changeScene(novelData.novel.scenes[0].name)
    novelData.debugMode = novelData.novel.debugMode
    soundManager.init()
    novelData.status = "Ready"
    console.log "-- Loading Novel.js complete! --"
