
### SAVING AND LOADING ###

GameManager = {

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
        console.log "Cookie dound!"
        cookie = @loadCookie("gameData")
        console.log "Cookie loaded"
        console.log cookie
        data.game = JSON.parse(atob(@loadCookie("gameData")))
        console.log "Data loaded!"
        data.debugMode = data.game.debugMode
    else if game != undefined
      data.game = JSON.parse(atob(game))
      data.debugMode = data.game.debugMode
      return

  # Start the game by loading the default game.json
  startGame: ->
    request = new XMLHttpRequest
    request.open 'GET', gamePath + '/game.json', true
    request.onload = ->
      if request.status >= 200 and request.status < 400
        json = JSON.parse(request.responseText)
        json = GameManager.prepareData(json)
        data.game = json
        data.game.currentScene = Scene.changeScene(data.game.scenes[0].name)
        data.debugMode = data.game.debugMode
    request.onerror = ->
      return
    request.send()

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
      UI.showSaveNotification(save)

  # Add values to game.json that are not defined but are required for Vue.js view updating
  prepareData: (json) ->
    json.currentScene=""
    json.parsedChoices=""
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

}


### INVENTORY, STAT & VALUE OPERATIONS ###

Inventory = {

  # Check if item or stat requirements have been filled
  checkRequirements: (requirements, isItem) ->
    reqsFilled = 0
    if isItem
      for i in data.game.inventory
        for j in requirements
          if j[0] == i.name
            if j[1] <= i.count
              reqsFilled = reqsFilled + 1
    else
      for i in data.game.stats
        for j in requirements
          if j[0] == i.name
            if j[1] <= i.value
              reqsFilled = reqsFilled + 1
    if reqsFilled == requirements.length
      return true
    else
      return false

  # Set a value in JSON
  setValue: (parsed, newValue) ->
    getValueArrayLast = @getValueArrayLast(parsed)
    value = Parser.findValue(parsed,false)
    value[getValueArrayLast] = newValue

  # Increase a value in JSON
  increaseValue: (parsed, change) ->
    getValueArrayLast = @getValueArrayLast(parsed)
    value = Parser.findValue(parsed,false)
    value[getValueArrayLast] = value[getValueArrayLast] + change
    if !isNaN(parseFloat(value[getValueArrayLast]))
      value[getValueArrayLast] = parseFloat(value[getValueArrayLast].toFixed(8));

  # Decrease a value in JSON
  decreaseValue: (parsed, change) ->
    getValueArrayLast = @getValueArrayLast(parsed)
    value = Parser.findValue(parsed,false)
    value[getValueArrayLast] = value[getValueArrayLast] - change
    if !isNaN(parseFloat(value[getValueArrayLast]))
      value[getValueArrayLast] = parseFloat(value[getValueArrayLast].toFixed(8));

  # Get the last item in a value array
  getValueArrayLast: (parsed) ->
    getValueArrayLast = parsed.split(",")
    getValueArrayLast = getValueArrayLast[getValueArrayLast.length-1].split(".")
    getValueArrayLast = getValueArrayLast[getValueArrayLast.length-1]
    return getValueArrayLast

  # Edit the player's items or stats
  editItemsOrStats: (items, mode, isItem) ->
    if isItem
      inventory = data.game.inventory
      isInv = true
    else
      inventory = data.game.stats
      isInv = false
    for j in items
      itemAdded = false
      for i in inventory
        if i.name == j[0]
          p = j[1].split(",")
          probability = 1
          if p.length > 1
            displayName = p[1]
            count = parseInt(p[0])
            if !isNaN(displayName)
              probability = p[1]
              displayName = j.name
            if p.length > 2
              probability = parseFloat(p[1])
              displayName = p[2]
          else
            displayName = j[0]
            count = parseInt(j[1])
          value = Math.random()
          if value < probability
            if (mode == "set")
              if isInv
                i.count = parseInt(j[1])
              else
                i.value = parseInt(j[1])
            else if (mode == "add")
              if isInv
                i.count = parseInt(i.count) + count
              else
                if isNaN parseInt(i.value)
                  i.value = 0
                i.value = parseInt(i.value) + count
            else if (mode == "remove")
              if isInv
                i.count = parseInt(i.count) - count
                if i.count < 0
                  i.count = 0
              else
                i.value = parseInt(i.value) - count
                if i.value < 0
                  i.value = 0
          itemAdded = true
      if !itemAdded && mode != "remove"
        p = j[1].split(",")
        probability = 1
        if p.length > 1
          displayName = p[1]
          count = parseInt(p[0])
          if !isNaN(displayName)
            probability = p[1]
            displayName = j.name
          if p.length > 2
            probability = parseFloat(p[1])
            displayName = p[2]
        else
          displayName = j[0]
          count = parseInt(j[1])
        value = Math.random()
        if value < probability
          inventory.push({"name": j[0], "count": count, "displayName": displayName})
    if isItem
      data.game.inventory = inventory
    else
      data.game.stats = inventory

}

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


### PARSERS ###

Parser = {

  # Parse a string of items and output an array
  parseItemOrStats: (items) ->
    separate = items.split("|")
    parsed = []
    for i in separate
      i = i.substring(0, i.length - 1)
      i = i.split("[")
      parsed.push(i)
    return parsed

  # Parse a text for Novel.js tags, and replace them with the correct HTML tags.
  parseText: (text) ->
    if text != undefined
      for i in [0 .. 99]
        text = text.split("[s" + i + "]").join("<span class=\"highlight-" + i + "\">")
      text = text.split("[/s]").join("</span>")
      splitText = text.split(/\[|\]/)
      spansToBeClosed = 0
      asToBeClosed = 0
      for index in [0 .. splitText.length-1]
        s = splitText[index]
        if s.substring(0,2) == "if"
          parsed = s.split("if ")
          if !@parseStatement(parsed[1])
            splitText[index] = "<span style=\"display:none;\">"
            spansToBeClosed++
          else
            splitText[index] = ""
        else if s.substring(0,5) == "stat."
          value = s.substring(5,s.length)
          for i in data.game.stats
            if i.name == value
              splitText[index] = i.value
        else if s.substring(0,4) == "inv."
          value = s.substring(4,s.length)
          for i in data.game.inventory
            if i.name == value
              splitText[index] = i.count
        else if s.substring(0,5) == "print"
          parsed = s.split("print ")
          splitText[index] = @parseStatement(parsed[1])
        else if s.substring(0,5) == "input"
          parsed = s.split("input ")
          nameText = ""
          for i in data.game.stats
            if i.name == parsed[1]
              nameText = i.value
          splitText[index] = "<input type=\"text\" value=\"" + nameText + "\" name=\"input\" class=\"input-" + parsed[1] +  "\">"
        else if s.substring(0,6) == "choice"
          parsed = s.split("choice ")
          splitText[index] = "<a href=\"#\" onclick=\"Scene.selectChoiceByName('"+parsed[1]+"')\">"
          asToBeClosed++
        else if s.substring(0,7) == "/choice"
          if asToBeClosed > 0
            splitText[index] = "</a>"
            asToBeClosed--
          else
            splitText[index] = ""
        else if s.substring(0,3) == "/if"
          if spansToBeClosed > 0
            splitText[index] = "</span>"
            spansToBeClosed--
          else
            splitText[index] = ""
        index++
      text = splitText.join("")
      return text

  # Parse a statement that returns true or false or calculate a value
  parseStatement: (s) ->
    if !Util.validateParentheses(s)
      console.error "ERROR: Invalid parentheses in statement"
    s = s.replace(/\s+/g, '');
    parsedString = s.split(/\(|\)|\+|\*|\-|\/|<=|>=|<|>|==|!=|\|\||&&/)
    parsedValues = []
    for val in parsedString
      type = null
      if val.substring(0,5) == "stat."
        type = "stats"
      else if val.substring(0,4) == "inv."
        type = "item"
      else if val.substring(0,4) == "var."
        type = "var"
      else if !isNaN(parseFloat(val)) && val.toString().indexOf(".") == -1
        type = "int"
      else if !isNaN(parseFloat(val)) && val.toString().indexOf(".") != -1
        type = "float"
      else
        type = "string"
      switch type
        when "item"
          for i in data.game.inventory
            if i.name == val.substring(4,val.length)
              parsedValues.push i.count
        when "stats"
          for i in data.game.stats
            if i.name == val.substring(5,val.length)
              parsedValues.push i.value
        when "var"
          val = @findValue(val.substring(4,val.length),true)
          if !isNaN(parseFloat(val))
            parsedValues.push val
          else
            parsedValues.push "'" + val + "'"
        when "float"
          parsedValues.push parseFloat(val)
        when "int"
          parsedValues.push parseInt(val)
        when "string"
          if val != ""
            parsedValues.push "'" + val + "'"
          else
            parsedValues.push ""
    for i in [0 .. parsedString.length-1]
      if parsedString[i] != "" && parsedValues[i] != ""
        s = s.replace(new RegExp(parsedString[i],'g'),parsedValues[i])
    return eval(s)

  # Find a value from the game data json
  # toPrint == true returns the value, toPrint == false returns the object
  findValue: (parsed, toPrint) ->
    splitted = parsed.split(",")
    if !toPrint
      if splitted.length > 1
        variable = @findValueByName(data.game,splitted[0])[0]
      else
        variable = @findValueByName(data.game,splitted[0])[1]
    else
      variable = @findValueByName(data.game,splitted[0])[0]
    for i in [0 .. splitted.length - 1]
      if Util.isOdd(i)
        variable = variable[parseInt(splitted[i])]
      else if i != 0
        if !toPrint
          variable = @findValueByName(variable,splitted[i])[1]
        else
          if splitted[i] == "parsedText" || splitted[i] == "text"
            splitted[i] = "parsedText"
            variable.parsedText = Parser.parseText(variable.text)
          variable = @findValueByName(variable,splitted[i])[0]
    return variable

  # Find an object from the object hierarchy by string name
  findValueByName: (obj, string) ->
    parts = string.split('.')
    newObj = obj[parts[0]]
    if parts[1]
      parts.splice 0, 1
      newString = parts.join('.')
      return @findValueByName(newObj, newString)
    r = []
    r[0] = newObj
    r[1] = obj
    return r

}


### SCENE MANIPULATION ###

Scene = {

  # Select a choice by name
  selectChoiceByName: (name) ->
    for i in data.game.currentScene.choices
      if i.name == name
        gameArea.selectChoice(i)
        break

  # Called when exiting a scene
  exitScene: (scene) ->
    UI.updateInputs(scene)

  # Called when changing a scene
  changeScene: (sceneNames) ->
    scene = @findSceneByName(@selectRandomScene sceneNames)
    @setupScene(scene)
    return scene

  # Setup a scene changed to
  setupScene: (scene) ->
    @updateScene(scene)
    @readItemAndStatsEdits(data.game.currentScene)
    @readSounds(data.game.currentScene,false)
    @readSaving(data.game.currentScene)

  # If not changing scenes but update needed, this is called
  updateScene: (scene) ->
    Scene.combineSceneTexts(scene)
    scene.parsedText = Parser.parseText scene.combinedText
    data.game.currentScene = scene
    @updateChoices()

  # Update choice texts when they are changed - Vue.js doesn't detect them without this.
  updateChoices: ->
    gameArea.$set 'game.parsedChoices', data.game.currentScene.choices.map((choice) ->
      choice.parsedText = Parser.parseText(choice.text)
      if gameArea.game.settings.alwaysShowDisabledChoices
        choice.alwaysShow = true
      choice
    )

  # Select a random scene from a list separated by |, takes string
  selectRandomScene: (name) ->
    separate = name.split("|")
    if separate.length == 1
      return separate[0]
    parsed = []
    for i in separate
      i = i.substring(0, i.length - 1)
      i = i.split("[")
      parsed.push(i)
    parsed = @chooseFromMultipleScenes parsed
    return parsed

  # Select a scene randomly from multiple scenes with different probabilities, takes array
  chooseFromMultipleScenes: (scenes) ->
    names = []
    chances = []
    rawChances = []
    previous = 0
    for i in scenes
      names.push i[0]
      previous = parseFloat(i[1])+previous
      chances.push previous
      rawChances.push parseFloat(i[1])
    totalChance = 0
    for i in rawChances
      totalChance = totalChance + parseFloat(i)
    if totalChance != 1
      console.error "ERROR: Invalid scene odds!"
    value = Math.random()
    nameIndex = 0
    for i in chances
      if value < i
        return names[nameIndex]
      nameIndex++

  # Return a scene by its name; throw an error if not found.
  findSceneByName: (name) ->
    for i in data.game.scenes
      if i.name == name
        return i
    console.error "ERROR: Scene by name '"+name+"' not found!"

  # Combine the multiple scene text rows
  combineSceneTexts: (scene) ->
    scene.combinedText = scene.text
    for key of scene
      if scene.hasOwnProperty(key)
        if key.includes("text-")
          scene.combinedText = scene.combinedText.concat(scene[key])

  # Read item, stat and val edit commands from scene or choice
  readItemAndStatsEdits: (source) ->
    if source.removeItem != undefined
      Inventory.editItemsOrStats(Parser.parseItemOrStats(source.removeItem),"remove",true)
    if source.addItem != undefined
      Inventory.editItemsOrStats(Parser.parseItemOrStats(source.addItem),"add",true)
    if source.setItem != undefined
      Inventory.editItemsOrStats(Parser.parseItemOrStats(source.setItem),"set",true)
    if source.removeStats != undefined
      Inventory.editItemsOrStats(Parser.parseItemOrStats(source.removeStats),"remove",false)
    if source.addStats != undefined
      Inventory.editItemsOrStats(Parser.parseItemOrStats(source.addStats),"add",false)
    if source.setStats != undefined
      Inventory.editItemsOrStats(Parser.parseItemOrStats(source.setStats),"set",false)
    if source.setValue != undefined
      for val in source.setValue
        Inventory.setValue(val.path,val.value)
    if source.increaseValue != undefined
      for val in source.increaseValue
        Inventory.increaseValue(val.path,val.value)
    if source.decreaseValue != undefined
      for val in source.decreaseValue
        Inventory.decreaseValue(val.path,val.value)

  # Read sound commands from scene or choice
  readSounds: (source,clicked) ->
    played = false
    if source.playSound != undefined
      Sound.playSound(source.playSound,false)
      played = true
    if clicked && !played
      Sound.playDefaultClickSound()
    if source.startMusic != undefined
      Sound.startMusic(source.startMusic)
    if source.stopMusic != undefined
      Sound.stopMusic(source.stopMusic)

  # Read save and load commands from scene or choice
  readSaving: (source) ->
    if source.saveGame != undefined
      saveGame()
    if source.loadGame != undefined
      showLoadNotification()

  # Check whether the requirements for a choice have been met
  requirementsFilled: (choice) ->
    reqs = []
    if choice.itemRequirement != undefined
      requirements = Parser.parseItemOrStats choice.itemRequirement
      reqs.push Inventory.checkRequirements(requirements, true)
    if choice.statsRequirement != undefined
      requirements = Parser.parseItemOrStats choice.statsRequirement
      reqs.push Inventory.checkRequirements(requirements, false)
    if choice.requirement != undefined
      reqs.push Inventory.parseIfStatement choice.requirement
    success = true
    for r in reqs
      if r == false
        success = false
    return success

}


### SOUNDS ###

# A class for sound functions
Sound = {

  # Play the default sound for clicking an item
  playDefaultClickSound: (name,clicked) ->
    @playSound(data.game.settings.soundSettings.defaultClickSound,false)

  # Play a sound by name
  playSound: (name, isMusic) ->
    for s in data.game.sounds
      if s.name == name
        sound = new Audio(gamePath+'/sounds/'+s.file)
        if isMusic
          sound.volume = data.game.settings.soundSettings.musicVolume
        else
          sound.volume = data.game.settings.soundSettings.soundVolume
        sound.play()
        return sound

  # Is music playing?
  isPlaying: (name) ->
    for i in data.music
      if i.paused
        return false
      else
        return true

  # Start music
  startMusic: (name) ->
    music = @playSound(name,true)
    music.addEventListener 'ended', (->
      @currentTime = 0
      @play()
      return
    ), false
    data.music.push {"name":name,"music":music}

  # Stop a music that was started previously
  stopMusic: (name) ->
    for i in data.music
      if name == i.name
        i.music.pause()
        index = data.music.indexOf(i)
        data.music.splice(index,1)

}


### UI SCRIPTS ###

UI = {

  # Show the save notification window, and update its text
  showSaveNotification: (text) ->
    e = document.getElementById("save-notification")
    textArea = e.querySelectorAll("textarea")
    textArea[0].value = text
    e.style.display = 'block';

  # Close the save notification window
  closeSaveNotification: ->
    e = document.getElementById("save-notification")
    e.style.display = 'none';

  # Show the load notification window
  showLoadNotification: ->
    if gameArea.game.settings.saveMode == "text"
      e = document.getElementById("load-notification")
      e.style.display = 'block';
    else
      loadGame()

  # Close the load notification - if load, then load a save.
  closeLoadNotification: (load) ->
    e = document.getElementById("load-notification")
    if load
      textArea = e.querySelectorAll("textarea")
      loadGame(textArea[0].value)
      textArea[0].value = ""
    e.style.display = 'none'

  # Update the values of the input fields
  updateInputs: (scene) ->
    inputs = document.getElementById("game-area").querySelectorAll("input")
    for i in inputs
      for a in data.game.stats
        if a.name == i.className.substring(6,i.className.length)
          a.value = Util.stripHTML(i.value)

}

# The button that can be used to copy the text from the save window.
copyButton = document.querySelector('#copy-button')
copyButton.addEventListener 'click', (event) ->
  copyTextarea = document.getElementById("save-notification").querySelector("textarea")
  copyTextarea.select()
  try
    successful = document.execCommand('copy')
  catch err
    console.error "Copying to clipboard failed: "+err
  return


### UTILITY SCRIPTS ###

Util = {

  # Check if a value is even or not
  isEven: (n) ->
    n % 2 == 0

  # Check if a value is odd or not
  isOdd: (n) ->
    Math.abs(n % 2) == 1

  # Remove HTML tags from a string - used to clean input
  stripHTML: (text) ->
    regex = /(<([^>]+)>)/ig
    text.replace regex, ''

  # Check if the string has valid parentheses
  validateParentheses: (s) ->
    open = 0
    for i in s
      if i == "("
        open++
      if i == ")"
        if open > 0
          open--
        else
          return false
    if open == 0
      return true
    else
      return false

}
