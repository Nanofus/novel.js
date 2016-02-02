
data = {
  gameData: null,
  currentScene: null
}

loadGame = ->
  $.getJSON 'game.json', (json) ->
    console.log "Loaded game: " + json.gameName
    data.gameData = json
    data.currentScene = gameArea.parseSceneText json.scenes[0]

loadGame()

gameArea = new Vue(
  el: '#game-area'
  data: data,
  methods:
    selectChoice: (choice) ->
      if choice.removeItem != undefined
        removedItems = this.parseItemOrAction choice.removeItem
        this.removeItemsOrActions(removedItems,true)
      if choice.addItem != undefined
        addedItems = this.parseItemOrAction choice.addItem
        this.addItemsOrActions(addedItems,true)
      if choice.removeAction != undefined
        removedActions = this.parseItemOrAction choice.removeAction
        this.removeItemsOrActions(removedItems,false)
      if choice.addAction != undefined
        addedItems = this.parseItemOrAction choice.addAction
        this.addItemsOrActions(addedItems,false)
      nextScene = this.parseSceneName choice.nextScene
      this.currentScene = this.parseSceneText(this.findSceneByName(nextScene))

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

    parseSceneName: (name) ->
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
      console.log chances
      for i in rawChances
        totalChance = totalChance + parseFloat(i)
      if totalChance != 1
        console.log "ERROR: Invalid scene odds!"
      value = Math.random()
      console.log value
      nameIndex = 0
      for i in chances
        if value < i
          return names[nameIndex]
        nameIndex++

    parseSceneText: (scene) ->
      text = scene.text
      text = text.split("[s1]").join("<span class=\"highlight\">")
      text = text.split("[/s]").join("</span>")
      text = text.split("[p]").join("<p>")
      text = text.split("[/p]").join("</p>")
      splitText = text.split(/\[|\]/)
      for s in splitText
        if s.substring(0,2) == "if"
          parsed = s.split(" ")
          sign = ''
          for p in parsed
            statement = p.split("==")
            if statement.length > 1
              sign = "=="
            else
              statement = p.split("!=")
              if statement.length > 1
                sign = "!="
              else
                statement = p.split("<=")
                if statement.length > 1
                  sign = "<="
                else
                  statement = p.split("<")
                  if statement.length > 1
                    sign = "<"
                  else
                    statement = p.split(">=")
                    if statement.length > 1
                      sign = ">="
                    else
                      statement = p.split(">")
                      if statement.length > 1
                        sign = ">"
      scene.text = text
      return scene

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

    removeItemsOrActions: (items, isItem) ->
      if isItem
        inventory = this.gameData.inventory
      else
        inventory = this.gameData.actions
      for i in this.gameData.inventory
        for j in items
          if i.name == j[0]
            i.count = parseInt(i.count) - parseInt(j[1])
            if i.count < 0
              i.count = 0

    addItemsOrActions: (items, isItem) ->
      if isItem
        inventory = this.gameData.inventory
      else
        inventory = this.gameData.actions
      for j in items
        itemAdded = false
        for i in this.gameData.inventory
          if i.name == j[0]
            i.count = parseInt(i.count) + parseInt(j[1])
            itemAdded = true
        if !itemAdded
          this.gameData.inventory.push({"name": j[0], "count": j[1]})

    findSceneByName: (name) ->
      for i in this.gameData.scenes
        if i.name == name
          return i
      console.log "ERROR: Scene by name '"+name+"' not found!"
)
