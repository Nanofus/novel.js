
### SCENE MANIPULATION ###

Scene = {

  # Try to select "Continue"
  tryContinue: ->
    if printCompleted && tickSpeedMultiplier == 1
      @selectChoiceByName("Continue")

  # Select a choice
  selectChoice: (choice) ->
    @exitScene(data.game.currentScene)
    @readItemAndStatsEdits(choice)
    @readSounds(choice,true)
    @readSaving(choice)
    @readExecutes(choice)
    if choice.nextScene != ""
      @changeScene(choice.nextScene)
    else if choice.nextScene == ""
      if choice.nextChoice != undefined
        @selectChoiceByName(@selectRandomOption(choice.nextChoice))
      else
        @updateScene(data.game.currentScene,true)

  # Select a choice by clicking a link embedded in text
  selectChoiceByNameByClicking: (event, name) ->
    event.stopPropagation()
    event.preventDefault()
    @selectChoiceByName(name)

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
    scene = @findSceneByName(@selectRandomOption sceneNames)
    @setupScene(scene)
    return scene

  # Setup a scene changed to
  setupScene: (scene) ->
    @updateScene(scene, false)
    @readItemAndStatsEdits(data.game.currentScene)
    @readSounds(data.game.currentScene,false)
    @readSaving(data.game.currentScene)
    @readExecutes(data.game.currentScene)
    @readMisc(data.game.currentScene)
    TextPrinter.printText(scene.parsedText,false)

  # If not changing scenes but update needed, this is called
  updateScene: (scene, onlyUpdating) ->
    Scene.combineSceneTexts(scene)
    scene.parsedText = Parser.parseText scene.combinedText
    data.game.currentScene = scene
    if !onlyUpdating
      data.game.parsedChoices = null
    else
      TextPrinter.printText(scene.parsedText,true)
      TextPrinter.complete()

  # Update choice texts when they are changed - Vue.js doesn't detect them without this.
  updateChoices: ->
    gameArea.$set 'game.parsedChoices', data.game.currentScene.choices.map((choice) ->
      choice.parsedText = Parser.parseText(choice.text)
      if gameArea.game.settings.alwaysShowDisabledChoices
        choice.alwaysShow = true
      choice
    )

  # Select a random scene or choice from a list separated by |, takes string
  selectRandomOption: (name) ->
    separate = name.split("|")
    if separate.length == 1
      return separate[0]
    parsed = []
    for i in separate
      i = i.substring(0, i.length - 1)
      i = i.split("[")
      parsed.push(i)
    parsed = @chooseRandomly(parsed)
    return parsed

  # Select a scene or choice randomly from multiple scenes with different probabilities, takes array
  chooseRandomly: (options) ->
    names = []
    chances = []
    rawChances = []
    previous = 0
    for i in options
      names.push i[0]
      previous = parseFloat(i[1])+previous
      chances.push previous
      rawChances.push parseFloat(i[1])
    totalChance = 0
    for i in rawChances
      totalChance = totalChance + parseFloat(i)
    if totalChance != 1
      console.error "ERROR: Invalid scene or choice odds (should add up to exactly 1)!"
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
    if source.scrollSound != undefined
      data.game.currentScene.scrollSound = source.scrollSound
    else
      if data.game.settings.soundSettings.defaultScrollSound
        data.game.currentScene.scrollSound = data.game.settings.soundSettings.defaultScrollSound
      else
        data.game.currentScene.scrollSound = undefined

  # Read JS commands
  readExecutes: (source) ->
    if source.executeJs != undefined
      eval(source.executeJs)

  # Read miscellaneous scene values
  readMisc: (source) ->
    if source.skipEnabled != undefined
      data.game.currentScene.skipEnabled = source.skipEnabled
    else
      data.game.currentScene.skipEnabled = data.game.settings.scrollSettings.textSkipEnabled
    if source.scrollSpeed != undefined
      data.game.currentScene.scrollSpeed = source.scrollSpeed
    else
      data.game.currentScene.scrollSpeed = data.game.settings.scrollSettings.defaultScrollSpeed

  # Read save and load commands from scene or choice
  readSaving: (source) ->
    if source.saveGame != undefined
      GameManager.saveGame()
    if source.loadGame != undefined
      UI.showLoadNotification()

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
