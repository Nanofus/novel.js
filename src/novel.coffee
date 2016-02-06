data = {
  game: null,
  currentScene: null,
  parsedText: "",
  choices: null,
  debugMode: false
}

gamePath = './game'

prepareData = (json) ->
  for i in json.inventory
    if i.displayName == undefined
      i.displayName = i.name
  for s in json.scenes
    s.combinedText = ""
    for c in s.choices
      c.parsedText = ""
      if c.nextScene == undefined
        c.nextScene = ""
      if c.alwaysShow == undefined
        c.alwaysShow = false
  return json

loadGame = ->
  $.getJSON './game/game.json', (json) ->
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
      if choice.nextScene != ""
        @changeScene(choice.nextScene)
      else
        @updateScene(@currentScene)

    changeScene: (sceneNames) ->
      scene = @findSceneByName(@selectRandomScene sceneNames)
      @setupScene(scene)
      return scene

    setupScene: (scene) ->
      @updateScene(scene)
      @readItemAndActionEdits(@currentScene)
      @readSounds(@currentScene,false)

    updateScene: (scene) ->
      @currentScene = scene
      @parseSceneText(@currentScene)
      @parsedText = @parseText @currentScene.combinedText
      @updateChoices(this)

    updateChoices: (vue) ->
      @$set 'parsedChoices', @currentScene.choices.map((choice) ->
        choice.parsedText = vue.parseText(choice.text)
        if vue.game.settings.alwaysShowDisabledChoices
          choice.alwaysShow = true
        choice
      )

    readItemAndActionEdits: (source) ->
      if source.removeItem != undefined
        @editItemsOrActions(@parseItemOrAction(source.removeItem),"remove",true)
      if source.addItem != undefined
        @editItemsOrActions(@parseItemOrAction(source.addItem),"add",true)
      if source.setItem != undefined
        @editItemsOrActions(@parseItemOrAction(source.setItem),"set",true)
      if source.removeAction != undefined
        @editItemsOrActions(@parseItemOrAction(source.removeAction),"remove",false)
      if source.addAction != undefined
        @editItemsOrActions(@parseItemOrAction(source.addAction),"add",false)
      if source.setAction != undefined
        @editItemsOrActions(@parseItemOrAction(source.setAction),"set",false)

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
          parsed = s.split("if ")
          if !@parseIfStatement(parsed[1])
            splitText[index] = "<span style=\"display:none;\">"
            tagToBeClosed = true
          else
            splitText[index] = ""
        else if s.substring(0,4) == "act."
          value = s.substring(4,s.length)
          for i in @game.actions
            if i.name == value
              splitText[index] = i.count
        else if s.substring(0,4) == "inv."
          value = s.substring(4,s.length)
          for i in @game.inventory
            if i.name == value
              splitText[index] = i.count
        else if s.substring(0,3) == "/if"
          if tagToBeClosed
            splitText[index] = "</span>"
            tagToBeClosed = false
          else
            splitText[index] = ""
        else if s.substring(0,3) == "var"
          parsed = s.split("var ")
          splitText[index] = ""
        index++
      text = splitText.join("")
      return text

    parseIfStatement: (s) ->
      #console.log "stat " + s
      if !@checkForValidParentheses(s)
        console.warn "ERROR: Invalid parentheses in statement"
      s = s.replace(/\s+/g, '');
      solved = false
      rerun = true
      while rerun == true
        result = @solveStatement(s)
        s = result[0]
        rerun = result[1]
      #console.log "truth: " + s
      #console.log "----------------"
      return s = (s == "true");

    solveStatement: (s) ->
      firstParIndex = -1
      for index in [0 .. s.length-1]
        if s[index] == '('
          #console.log "( found " + index
          firstParIndex = index
        if s[index] == ')'
          substr = s.substring(firstParIndex+1,index)
          parsed = @parseOperators(substr)
          #console.log ") found " + substr + " -> " + parsed
          s = s.replace('('+substr+')',parsed)
          #console. log "update " + s
          break
      if firstParIndex == -1
        rerun = false
      else
        rerun = true
      return [s,rerun]

    parseOperators: (s) ->
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
          results.push @parseOperators(statement[i])
        if @parseEquation(statement[i])
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
      if s == "true"
        return true
      else if s == "false"
        return false
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
      if entity != null
        count = entity.count
      else
        count = 0
      switch sign
        when "=="
          if count == parsedValue
            return true
        when "!="
          if count != parsedValue
            return true
        when "<="
          if count <= parsedValue
            return true
        when ">="
          if count >= parsedValue
            return true
        when "<"
          if count < parsedValue
            return true
        when ">"
          if count > parsedValue
            return true
      return false

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

    editItemsOrActions: (items, mode, isItem) ->
      if isItem
        inventory = @game.inventory
      else
        inventory = @game.actions
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
