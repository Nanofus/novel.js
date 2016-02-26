
### SAVING AND LOADING ###

class NovelManager

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

  # Load the novel from a cookie or entered json
  loadData: (novel) ->
    if novel == undefined
      if @loadCookie("gameData") != ''
        console.log "Cookie found!"
        cookie = @loadCookie("gameData")
        console.log "Cookie loaded"
        console.log cookie
        loadedData = JSON.parse(atob(@loadCookie("gameData")))
        @prepareLoadedData(loadedData)
    else if novel != undefined
      loadedData = JSON.parse(atob(novel))
      @prepareLoadedData(loadedData)

  # Prepare the novel from the loaded save file
  prepareLoadedData: (loadedData) ->
    if novelData.novel.name != loadedData.name
      console.error "ERROR! novel name mismatch"
      return
    if novelData.novel.version != loadedData.version
      console.warn "WARNING! novel version mismatch"
    novelData.novel = loadedData
    novelData.debugMode = novelData.novel.debugMode
    sceneManager.updateScene(novelData.novel.currentScene,true)

  # Start the novel by loading the default novel.json
  start: ->
    request = new XMLHttpRequest
    request.open 'GET', novelPath + '/novel.json', true
    request.onload = ->
      if request.status >= 200 and request.status < 400
        json = JSON.parse(request.responseText)
        json = novelManager.prepareData(json)
        novelData.novel = json
        novelData.novel.currentScene = sceneManager.changeScene(novelData.novel.scenes[0].name)
        novelData.debugMode = novelData.novel.debugMode
    request.onerror = ->
      return
    request.send()
    if document.querySelector("#continue-button") != null
      document.querySelector("#continue-button").style.display = 'none'

  # Converts the novel's state into json and Base64 encode it
  saveDataAsJson: () ->
    save = btoa(JSON.stringify(novelData.novel))
    return save

  # Save novel in the defined way
  saveData: ->
    save = @saveDataAsJson()
    if novelData.novel.settings.saveMode == "cookie"
      @saveCookie("novelData",save,365)
    else if novelData.novel.settings.saveMode == "text"
      ui.showSaveNotification(save)

  # Add values to novel.json that are not defined but are required for Vue.js view updating and other functions
  prepareData: (json) ->
    json.currentScene=""
    json.parsedChoices=""
    if json.currentInventory == undefined
      json.currentInventory = 0
    if json.inventories == undefined
      json.inventories = []
    if json.scenes == undefined
      json.scenes = []
    for i in json.inventories
      for j in i
        if j.displayName == undefined
          j.displayName = j.name
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
