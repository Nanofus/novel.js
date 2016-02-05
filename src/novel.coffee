data = {
  game: null,
  currentScene: null,
  parsedText: "",
  choices: null,
  debugMode: false
}

gamePath = '/game'

prepareData = (json) ->
  for s in json.scenes
    s.combinedText = ""
    for c in s.choices
      c.parsedText = ""
      if c.showAlways == undefined
        c.showAlways = false
  return json

loadGame = ->
  $.getJSON 'game/game.json', (json) ->
    json = prepareData(json)
    data.game = json
    data.currentScene = gameArea.changeScene(json.scenes[0].name)
    data.debugMode = json.debugMode

loadGame()

gameArea = new Vue(
  el: '#game-area'
  data: data
  methods:
    selectChoice: (choice) ->
      @readItemAndActionEdits(choice)
      @readSounds(choice,true)
      @changeScene(choice.nextScene)

    changeScene: (sceneNames) ->
      scene = @findSceneByName(@selectRandomScene sceneNames)
      @setupScene(scene)
      return scene

    setupScene: (scene) ->
      @currentScene = scene
      @parseSceneText(@currentScene)
      @parsedText = @parseText @currentScene.combinedText
      @updateChoices(this)
      @readItemAndActionEdits(@currentScene)
      @readSounds(@currentScene,false)

    updateChoices: (vue) ->
      @$set 'parsedChoices', @currentScene.choices.map((choice) ->
        choice.parsedText = vue.parseText(choice.text)
        if vue.game.settings.alwaysShowDisabledChoices
          choice.showAlways = true
        choice
      )

    readItemAndActionEdits: (source) ->
      if source.removeItem != undefined
        removedItems = @parseItemOrAction source.removeItem
        @editItemsOrActions(removedItems,"remove",true)
      if source.addItem != undefined
        addedItems = @parseItemOrAction source.addItem
        @editItemsOrActions(addedItems,"add",true)
      if source.removeAction != undefined
        removedActions = @parseItemOrAction source.removeAction
        @editItemsOrActions(removedActions,"remove",false)
      if source.addAction != undefined
        addedActions = @parseItemOrAction source.addAction
        @editItemsOrActions(addedActions,"add",false)
      if source.setAction != undefined
        setActions = @parseItemOrAction source.setAction
        @editItemsOrActions(setActions,"set",false)
      if source.setItem != undefined
        setItems = @parseItemOrAction source.setItem
        @editItemsOrActions(setItems,"set",true)

    readSounds: (source,clicked) ->
      played = false
      if source.playSound != undefined
        @playSound(source.playSound)
        played = true
      if clicked && !played
        @playDefaultClickSound()

    requirementsFilled: (choice) ->
      if choice.itemRequirement != undefined
        requirements = @parseItemOrAction choice.itemRequirement
        return @parseRequirements requirements
      else if choice.actionRequirement != undefined
        requirements = @parseItemOrAction choice.actionRequirement
        return @parseRequirements requirements
      else return true

    parseSceneText: (scene) ->
      scene.combinedText = scene.text
      for key of scene
        if scene.hasOwnProperty(key)
          if key.includes("text-")
            scene.combinedText = scene.combinedText.concat(scene[key])

    parseItemOrAction: (items) ->
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
      for i in [0 .. 99]
        text = text.split("[s" + i + "]").join("<span class=\"highlight-" + i + "\">")
      text = text.split("[/s]").join("</span>")
      splitText = text.split(/\[|\]/)
      index = 0
      tagToBeClosed = false
      for s in splitText
        if s.substring(0,2) == "if"
          parsed = s.split(" ")
          if !@parseIfStatement(parsed[1])
            splitText[index] = "<span style=\"display:none;\">"
            tagToBeClosed = true
          else
            splitText[index] = ""
        if s.substring(0,4) == "act."
          value = s.substring(4,s.length)
          for i in @game.actions
            if i.name == value
              splitText[index] = i.count
        if s.substring(0,4) == "inv."
          value = s.substring(4,s.length)
          for i in @game.inventory
            if i.name == value
              splitText[index] = i.count
        if s.substring(0,3) == "/if"
          if tagToBeClosed
            splitText[index] = "</span>"
            tagToBeClosed = false
          else
            splitText[index] = ""
        index++
      text = splitText.join("")
      return text

    parseIfStatement: (s) ->
      statement = s.split("&&")
      mode = ""
      if statement.length > 1
        mode = "&&"
      else
        statement = s.split("||")
        if statement.length > 1
          mode = "||"
      results = []
      for i in [0 .. statement.length - 1]
        s = statement[i].split("||")
        if s.length > 1
          results.push @parseIfStatement(statement[i])
        else if @parseEquation(statement[i])
          results.push(true)
        else
          results.push(false)
      if mode == "&&"
        fail = false
        for r in results
          if r == false
            fail = true
        if fail
          return false
        else
          return true
      if mode == "||"
        success = false
        for r in results
          if r == true
            success = true
        if success
          return true
        else
          return false
      if mode == ""
        return @parseEquation(statement[0])

    parseEquation: (s) ->
      sign = ''
      statement = s.split("==")
      if statement.length > 1
        sign = "=="
      else
        statement = s.split("!=")
        if statement.length > 1
          sign = "!="
        else
          statement = s.split("<=")
          if statement.length > 1
            sign = "<="
          else
            statement = s.split("<")
            if statement.length > 1
              sign = "<"
            else
              statement = s.split(">=")
              if statement.length > 1
                sign = ">="
              else
                statement = s.split(">")
                if statement.length > 1
                  sign = ">"
      s = statement[0]
      type = null
      if s.substring(0,4) == "act."
        type = "action"
      else if s.substring(0,4) == "inv."
        type = "item"
      entity = null;
      if type == "item"
        for i in @game.inventory
          if i.name == s.substring(4,s.length)
            entity = i
            break
      if type == "action"
        for i in @game.actions
          if i.name == s.substring(4,s.length)
            entity = i
            break
      parsedValue = parseInt(statement[1])
      switch sign
        when "=="
          if i.count == parsedValue
            return true
        when "!="
          if i.count != parsedValue
            return true
        when "<="
          if i.count <= parsedValue
            return true
        when ">="
          if i.count >= parsedValue
            return true
        when "<"
          if i.count < parsedValue
            return true
        when ">"
          if i.count > parsedValue
            return true
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

    editItemsOrActions: (items, mode, isItem) ->
      if isItem
        inventory = @game.inventory
      else
        inventory = @game.actions
      for j in items
        itemAdded = false
        for i in inventory
          if i.name == j[0]
            if (mode == "set")
              i.count = parseInt(j[1])
            else if (mode == "add")
              i.count = parseInt(i.count) + parseInt(j[1])
            else if (mode == "remove")
              i.count = parseInt(i.count) - parseInt(j[1])
              if i.count < 0
                i.count = 0
            itemAdded = true
        if !itemAdded && mode != "remove"
          inventory.push({"name": j[0], "count": j[1]})
      if isItem
        @game.inventory = inventory
      else
        @game.actions = inventory

    findSceneByName: (name) ->
      for i in @game.scenes
        if i.name == name
          return i
      console.warn "ERROR: Scene by name '"+name+"' not found!"

    playDefaultClickSound: (name,clicked) ->
      @playSound(@game.settings.defaultClickSound)

    playSound: (name) ->
      for s in @game.sounds
        if s.name == name
          sound = new Audio(gamePath+'/sounds/'+s.file)
          sound.volume = @game.settings.soundVolume
          sound.play()

)
