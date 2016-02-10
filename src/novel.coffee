data = {
  game: null,
  choices: null,
  debugMode: false,
  music: []
}

gamePath = './game'

prepareData = (json) ->
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

loadCookie = (cname) ->
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

saveCookie = (cname, cvalue, exdays) ->
  d = new Date
  d.setTime d.getTime() + exdays * 24 * 60 * 60 * 1000
  expires = 'expires=' + d.toUTCString()
  document.cookie = cname + '=' + cvalue + '; ' + expires + '; path=/'

# Load JSON
loadGame = (game) ->
  if game == undefined
    if loadCookie("gameData") != ''
      console.log "Cookie dound!"
      cookie = loadCookie("gameData")
      console.log "Cookie loaded"
      console.log cookie
      data.game = JSON.parse(atob(loadCookie("gameData")))
      console.log "Data loaded!"
      data.debugMode = data.game.debugMode
  else if game != undefined
    data.game = JSON.parse(atob(game))
    data.debugMode = data.game.debugMode
    return

startGame = ->
  request = new XMLHttpRequest
  request.open 'GET', gamePath + '/game.json', true
  request.onload = ->
    if request.status >= 200 and request.status < 400
      json = JSON.parse(request.responseText)
      json = prepareData(json)
      data.game = json
      data.game.currentScene = gameArea.changeScene(data.game.scenes[0].name)
      data.debugMode = data.game.debugMode
  request.onerror = ->
    return
  request.send()

# Save game
saveGame = ->
  save = gameArea.saveGameAsJson()
  if data.game.settings.saveMode == "cookie"
    saveCookie("gameData",save,365)
    console.log "Cookie saved!"
  else if data.game.settings.saveMode == "text"
    showSaveNotification(save)

startGame()

# Game area
gameArea = new Vue(
  el: '#game-area'
  data: data
  methods:
    saveGameAsJson: () ->
      save = btoa(JSON.stringify(@game))
      return save

    selectChoice: (choice) ->
      @exitScene(@game.currentScene)
      @readItemAndStatsEdits(choice)
      @readSounds(choice,true)
      if choice.nextScene != ""
        @changeScene(choice.nextScene)
      else
        @updateScene(@game.currentScene)

    selectChoiceByName: (name) ->
      for i in @game.currentScene.choices
        if i.name == name
          @selectChoice(i)
          break

    exitScene: (scene) ->
      @updateInputs(scene)

    changeScene: (sceneNames) ->
      scene = @findSceneByName(@selectRandomScene sceneNames)
      @setupScene(scene)
      return scene

    setupScene: (scene) ->
      @updateScene(scene)
      @readItemAndStatsEdits(@game.currentScene)
      @readSounds(@game.currentScene,false)

    updateScene: (scene) ->
      @combineSceneTexts(scene)
      scene.parsedText = @parseText scene.combinedText
      @game.currentScene = scene
      @updateChoices(this)

    updateChoices: (vue) ->
      @$set 'game.parsedChoices', @game.currentScene.choices.map((choice) ->
        choice.parsedText = vue.parseText(choice.text)
        if vue.game.settings.alwaysShowDisabledChoices
          choice.alwaysShow = true
        choice
      )

    readItemAndStatsEdits: (source) ->
      if source.removeItem != undefined
        @editItemsOrStats(@parseItemOrStats(source.removeItem),"remove",true)
      if source.addItem != undefined
        @editItemsOrStats(@parseItemOrStats(source.addItem),"add",true)
      if source.setItem != undefined
        @editItemsOrStats(@parseItemOrStats(source.setItem),"set",true)
      if source.removeStats != undefined
        @editItemsOrStats(@parseItemOrStats(source.removeStats),"remove",false)
      if source.addStats != undefined
        @editItemsOrStats(@parseItemOrStats(source.addStats),"add",false)
      if source.setStats != undefined
        @editItemsOrStats(@parseItemOrStats(source.setStats),"set",false)
      if source.setValue != undefined
        for val in source.setValue
          @setValue(val.path,val.value)
      if source.increaseValue != undefined
        for val in source.increaseValue
          @increaseValue(val.path,val.value)
      if source.decreaseValue != undefined
        for val in source.decreaseValue
          @decreaseValue(val.path,val.value)

    readSounds: (source,clicked) ->
      played = false
      if source.playSound != undefined
        @playSound(source.playSound,false)
        played = true
      if clicked && !played
        @playDefaultClickSound()
      if source.startMusic != undefined
        @startMusic(source.startMusic)
      if source.stopMusic != undefined
        @stopMusic(source.stopMusic)

    requirementsFilled: (choice) ->
      reqs = []
      if choice.itemRequirement != undefined
        requirements = @parseItemOrStats choice.itemRequirement
        reqs.push @parseRequirements requirements
      if choice.statsRequirement != undefined
        requirements = @parseItemOrStats choice.statsRequirement
        reqs.push @parseRequirements requirements
      if choice.requirement != undefined
        reqs.push @parseIfStatement choice.requirement
      success = true
      for r in reqs
        if r == false
          success = false
      return success

    combineSceneTexts: (scene) ->
      scene.combinedText = scene.text
      for key of scene
        if scene.hasOwnProperty(key)
          if key.includes("text-")
            scene.combinedText = scene.combinedText.concat(scene[key])

    parseItemOrStats: (items) ->
      separate = items.split("|")
      parsed = []
      for i in separate
        i = i.substring(0, i.length - 1)
        i = i.split("[")
        parsed.push(i)
      return parsed

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
        console.warn "ERROR: Invalid scene odds!"
      value = Math.random()
      nameIndex = 0
      for i in chances
        if value < i
          return names[nameIndex]
        nameIndex++

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
            for i in @game.stats
              if i.name == value
                splitText[index] = i.count
          else if s.substring(0,4) == "inv."
            value = s.substring(4,s.length)
            for i in @game.inventory
              if i.name == value
                splitText[index] = i.count
          else if s.substring(0,5) == "print"
            parsed = s.split("print ")
            splitText[index] = @parseStatement(parsed[1])
          else if s.substring(0,5) == "input"
            parsed = s.split("input ")
            nameText = ""
            for i in @game.stats
              if i.name == parsed[1]
                nameText = i.count
            splitText[index] = "<input type=\"text\" value=\"" + nameText + "\" name=\"input\" class=\"input-" + parsed[1] +  "\">"
          else if s.substring(0,6) == "choice"
            parsed = s.split("choice ")
            splitText[index] = "<a href=\"#\" onclick=\"gameArea.selectChoiceByName('"+parsed[1]+"')\">"
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

    updateInputs: (scene) ->
      inputs = document.getElementById("game-area").querySelectorAll("input")
      for i in inputs
        for a in @game.stats
          if a.name == i.className.substring(6,i.className.length)
            a.count = stripHTML(i.value)

    setValue: (parsed, newValue) ->
      arrLast = @arrLast(parsed)
      value = @findValue(parsed,false)
      value[arrLast] = newValue

    increaseValue: (parsed, newValue) ->
      arrLast = @arrLast(parsed)
      value = @findValue(parsed,false)
      value[arrLast] = value[arrLast] + newValue
      if !isNaN(parseFloat(value[arrLast]))
        value[arrLast] = parseFloat(value[arrLast].toFixed(8));

    decreaseValue: (parsed, newValue) ->
      arrLast = @arrLast(parsed)
      value = @findValue(parsed,false)
      value[arrLast] = value[arrLast] - newValue
      if !isNaN(parseFloat(value[arrLast]))
        value[arrLast] = parseFloat(value[arrLast].toFixed(8));

    arrLast: (parsed) ->
      arrLast = parsed.split(",")
      arrLast = arrLast[arrLast.length-1].split(".")
      arrLast = arrLast[arrLast.length-1]
      return arrLast

    findValue: (parsed, toPrint) ->
      splitted = parsed.split(",")
      if !toPrint
        if splitted.length > 1
          variable = @findValueByName(@game,splitted[0])[0]
        else
          variable = @findValueByName(@game,splitted[0])[1]
      else
        variable = @findValueByName(@game,splitted[0])[0]
      for i in [0 .. splitted.length - 1]
        if isOdd(i)
          variable = variable[parseInt(splitted[i])]
        else if i != 0
          if !toPrint
            variable = @findValueByName(variable,splitted[i])[1]
          else
            if splitted[i] == "parsedText" || splitted[i] == "text"
              splitted[i] = "parsedText"
              variable.parsedText = @parseText(variable.text)
            variable = @findValueByName(variable,splitted[i])[0]
      return variable

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

    parseStatement: (s) ->
      if !@checkForValidParentheses(s)
        console.warn "ERROR: Invalid parentheses in statement"
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
            for i in @game.inventory
              if i.name == val.substring(4,val.length)
                parsedValues.push i.count
          when "stats"
            for i in @game.stats
              if i.name == val.substring(5,val.length)
                parsedValues.push i.count
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

    checkForValidParentheses: (s) ->
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

    parseRequirements: (requirements) ->
      reqsFilled = 0
      for i in @game.inventory
        for j in requirements
          if j[0] == i.name
            if j[1] <= i.count
              reqsFilled = reqsFilled + 1
      if reqsFilled == requirements.length
        return true
      else
        return false

    editItemsOrStats: (items, mode, isItem) ->
      if isItem
        inventory = @game.inventory
      else
        inventory = @game.stats
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
                i.count = parseInt(j[1])
              else if (mode == "add")
                i.count = parseInt(i.count) + count
              else if (mode == "remove")
                i.count = parseInt(i.count) - count
                if i.count < 0
                  i.count = 0
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
        @game.inventory = inventory
      else
        @game.stats = inventory

    findSceneByName: (name) ->
      for i in @game.scenes
        if i.name == name
          return i
      console.warn "ERROR: Scene by name '"+name+"' not found!"

    playDefaultClickSound: (name,clicked) ->
      @playSound(@game.settings.soundSettings.defaultClickSound,false)

    playSound: (name, isMusic) ->
      for s in @game.sounds
        if s.name == name
          sound = new Audio(gamePath+'/sounds/'+s.file)
          if isMusic
            sound.volume = @game.settings.soundSettings.musicVolume
          else
            sound.volume = @game.settings.soundSettings.soundVolume
          sound.play()
          return sound

    isPlaying: (name) ->
      for i in @music
        if i.paused
          return false
        else
          return true

    startMusic: (name) ->
      music = @playSound(name,true)
      music.addEventListener 'ended', (->
        @currentTime = 0
        @play()
        return
      ), false
      @music.push {"name":name,"music":music}

    stopMusic: (name) ->
      for i in @music
        if name == i.name
          i.music.pause()
          index = @music.indexOf(i)
          @music.splice(index,1)

)

isEven = (n) ->
  n % 2 == 0

isOdd = (n) ->
  Math.abs(n % 2) == 1

stripHTML = (text) ->
  regex = /(<([^>]+)>)/ig
  text.replace regex, ''

showSaveNotification = (text) ->
  e = document.getElementById("save-notification")
  textArea = e.querySelectorAll("textarea")
  textArea[0].value = text
  e.style.display = 'block';

closeSaveNotification = ->
  e = document.getElementById("save-notification")
  e.style.display = 'none';

showLoadNotification = (text) ->
  e = document.getElementById("load-notification")
  e.style.display = 'block';

closeLoadNotification = (load) ->
  e = document.getElementById("load-notification")
  if load
    textArea = e.querySelectorAll("textarea")
    loadGame(textArea[0].value)
    textArea[0].value = ""
  e.style.display = 'none';
