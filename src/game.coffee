data = {
  gameData: null,
  currentScene: null,
  shownText: "",
  shownChoices: null,
  debugMode: false
}

loadGame = ->
  $.getJSON 'game.json', (json) ->
    console.log "Loaded game: " + json.gameName
    data.gameData = json
    data.currentScene = gameArea.enterStartingScene(json.scenes[0])
    data.debugMode = json.debugMode

loadGame()

gameArea = new Vue(
  el: '#game-area'
  data: data,
  methods:
    selectChoice: (choice) ->
      this.readItemAndActionEdits(choice)
      this.changeScene(choice.nextScene)

    enterStartingScene: (scene) ->
      this.currentScene = scene
      this.shownText = this.parseSceneText this.currentScene
      this.shownChoices = this.currentScene.choices

    changeScene: (sceneNames) ->
      this.currentScene = this.findSceneByName(this.selectRandomScene sceneNames)
      this.shownText = this.parseSceneText this.currentScene
      this.shownChoices = this.currentScene.choices
      this.readItemAndActionEdits(this.currentScene)

    readItemAndActionEdits: (source) ->
      if source.removeItem != undefined
        removedItems = this.parseItemOrAction source.removeItem
        this.editItemsOrActions(removedItems,"remove",true)
      if source.addItem != undefined
        addedItems = this.parseItemOrAction source.addItem
        this.editItemsOrActions(addedItems,"add",true)
      if source.removeAction != undefined
        removedActions = this.parseItemOrAction source.removeAction
        this.editItemsOrActions(removedActions,"remove",false)
      if source.addAction != undefined
        addedActions = this.parseItemOrAction source.addAction
        this.editItemsOrActions(addedActions,"add",false)
      if source.setAction != undefined
        setActions = this.parseItemOrAction source.setAction
        this.editItemsOrActions(setActions,"set",false)
      if source.setItem != undefined
        setItems = this.parseItemOrAction source.setItem
        this.editItemsOrActions(setItems,"set",true)

    requirementsFilled: (choice) ->
      if choice.itemRequirement != undefined
        requirements = this.parseItemOrAction choice.itemRequirement
        return this.parseRequirements requirements
      else if choice.actionRequirement != undefined
        requirements = this.parseItemOrAction choice.actionRequirement
        return this.parseRequirements requirements
      else return true

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
      parsed = this.chooseFromMultipleScenes parsed
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
        console.log "ERROR: Invalid scene odds!"
      value = Math.random()
      nameIndex = 0
      for i in chances
        if value < i
          return names[nameIndex]
        nameIndex++

    parseSceneText: (scene) ->
      text = scene.text
      for i in [0 .. 99]
        text = text.split("[s" + i + "]").join("<span class=\"highlight-" + i + "\">")
      text = text.split("[/s]").join("</span>")
      splitText = text.split(/\[|\]/)
      index = 0
      tagToBeClosed = false
      for s in splitText
        if s.substring(0,2) == "if"
          parsed = s.split(" ")
          if !this.parseIfStatement(parsed[1])
            splitText[index] = "<span style=\"display:none;\">"
            tagToBeClosed = true
          else
            splitText[index] = ""
        if s.substring(0,4) == "act."
          value = s.substring(4,s.length)
          for i in this.gameData.actions
            if i.name == value
              splitText[index] = i.count
        if s.substring(0,4) == "inv."
          value = s.substring(4,s.length)
          for i in this.gameData.inv
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
          results.push this.parseIfStatement(statement[i])
        else if this.parseEquation(statement[i])
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
        return this.parseEquation(statement[0])

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
        for i in this.gameData.inventory
          if i.name == s.substring(4,s.length)
            entity = i
            break
      if type == "action"
        for i in this.gameData.actions
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
      for i in this.gameData.inventory
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
        inventory = this.gameData.inventory
      else
        inventory = this.gameData.actions
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
        this.gameData.inventory = inventory
      else
        this.gameData.actions = inventory

    findSceneByName: (name) ->
      for i in this.gameData.scenes
        if i.name == name
          return i
      console.log "ERROR: Scene by name '"+name+"' not found!"
)
