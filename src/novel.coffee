data = {
  game: null,
  currentScene: null,
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
    s.parsedText = ""
    for c in s.choices
      c.parsedText = ""
      if c.nextScene == undefined
        c.nextScene = ""
      if c.alwaysShow == undefined
        c.alwaysShow = false
  return json

# Load JSON
request = new XMLHttpRequest
request.open 'GET', gamePath + '/game.json', true
request.onload = ->
  if request.status >= 200 and request.status < 400
    json = JSON.parse(request.responseText)
    json = prepareData(json)
    data.game = json
    data.currentScene = gameArea.changeScene(json.scenes[0].name)
    data.debugMode = json.debugMode
request.onerror = ->
  return
request.send()

# Game area
gameArea = new Vue(
  el: '#game-area'
  data: data
  methods:
    selectChoice: (choice) ->
      @exitScene(@currentScene)
      @readItemAndActionEdits(choice)
      @readSounds(choice,true)
      if choice.nextScene != ""
        @changeScene(choice.nextScene)
      else
        @updateScene(@currentScene)

    selectChoiceByName: (name) ->
      for i in @currentScene.choices
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
      @readItemAndActionEdits(@currentScene)
      @readSounds(@currentScene,false)

    updateScene: (scene) ->
      @currentScene = scene
      @combineSceneTexts(@currentScene)
      @currentScene.parsedText = @parseText @currentScene.combinedText
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
        @playSound(source.playSound)
        played = true
      if clicked && !played
        @playDefaultClickSound()

    requirementsFilled: (choice) ->
      reqs = []
      if choice.itemRequirement != undefined
        requirements = @parseItemOrAction choice.itemRequirement
        reqs.push @parseRequirements requirements
      if choice.actionRequirement != undefined
        requirements = @parseItemOrAction choice.actionRequirement
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
      if text != undefined
        for i in [0 .. 99]
          text = text.split("[s" + i + "]").join("<span class=\"highlight-" + i + "\">")
        text = text.split("[/s]").join("</span>")
        splitText = text.split(/\[|\]/)
        index = 0
        spansToBeClosed = 0
        asToBeClosed = 0
        for s in splitText
          if s.substring(0,2) == "if"
            parsed = s.split("if ")
            if !@parseIfStatement(parsed[1])
              splitText[index] = "<span style=\"display:none;\">"
              spansToBeClosed++
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
          else if s.substring(0,3) == "cal"
            parsed = s.split("cal ")
            splitText[index] = @calculateEquationSide(parsed[1])
          else if s.substring(0,3) == "equ"
            parsed = s.split("equ ")
            splitText[index] = @parseIfStatement(parsed[1])
          else if s.substring(0,5) == "input"
            parsed = s.split("input ")
            nameText = ""
            for i in @game.actions
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
          else if s.substring(0,3) == "var"
            splitText[index] = @findValue(s.split("var ")[1],true)
          index++
        text = splitText.join("")
        return text

    updateInputs: (scene) ->
      inputs = document.getElementById("game-area").querySelectorAll("input")
      for i in inputs
        for a in @game.actions
          if a.name == i.className.substring(6,i.className.length)
            a.count = i.value

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

    parseIfStatement: (s) ->
      #console.log "stat " + s
      if !@checkForValidParentheses(s)
        console.warn "ERROR: Invalid parentheses in statement"
      s = "("+s+")"
      s = s.replace(/\s+/g, '');
      solved = false
      rerun = true
      while rerun == true
        result = @parseStatement(s)
        s = result[0]
        rerun = result[1]
      #console.log "truth: " + s
      #console.log "----------------"
      return s = (s == "true");

    parseStatement: (s) ->
      firstParIndex = -1
      for index in [0 .. s.length-1]
        if s[index] == '\?'
          if ignore == true
            ignore = false
          else
            ignore = true
        if !ignore
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
      sides = @readSides(s,sign)
      switch sign
        when "=="
          if sides[0] == sides[1]
            return true
        when "!="
          if sides[0] != sides[1]
            return true
        when "<="
          if sides[0] <= sides[1]
            return true
        when ">="
          if sides[0] >= sides[1]
            return true
        when "<"
          if sides[0] < sides[1]
            return true
        when ">"
          if sides[0] > sides[1]
            return true
      return false

    readSides: (sides,sign) ->
      sides = sides.split(sign)
      parsed = []
      for s in sides
        parsed.push @calculateEquationSide(s)
      return parsed

    calculateEquationSide: (s) ->
      if s[0]=='\?' && s[s.length-1] == '\?'
        s = s.substring(1,s.length-1)
      parsedString = s.split(/\(|\)|\+|\*|\-|\//)
      parsedValues = []
      for val in parsedString
        type = null
        if val.substring(0,4) == "act."
          type = "action"
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
          when "action"
            for i in @game.actions
              if i.name == val.substring(4,val.length)
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
      @playSound(@game.settings.soundSettings.defaultClickSound)

    playSound: (name) ->
      for s in @game.sounds
        if s.name == name
          sound = new Audio(gamePath+'/sounds/'+s.file)
          sound.volume = @game.settings.soundSettings.soundVolume
          sound.play()
)

isEven = (n) ->
  n % 2 == 0

isOdd = (n) ->
  Math.abs(n % 2) == 1
