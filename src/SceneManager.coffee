
### SCENE MANIPULATION ###

class SceneManager

  # Try to select "Continue"
  tryContinue: ->
    if textPrinter.printCompleted && textPrinter.tickSpeedMultiplier == 1
      @selectChoiceByName("Continue")

  # Select a choice
  selectChoice: (choice) ->
    @exitScene(novelData.novel.currentScene)
    @readItemEdits(choice)
    @readSounds(choice,true)
    @readSaving(choice)
    @readExecutes(choice)
    @readCheckpoints(choice)
    if choice.nextScene != ""
      @changeScene(choice.nextScene)
    else if choice.nextScene == ""
      if choice.nextChoice != undefined
        @selectChoiceByName(@selectRandomOption(choice.nextChoice))
      else
        @updateScene(novelData.novel.currentScene,true)

  # Select a choice by clicking a link embedded in text
  selectChoiceByNameByClicking: (event, name) ->
    event.stopPropagation()
    event.preventDefault()
    @selectChoiceByName(name)

  # Select a choice by name
  selectChoiceByName: (name) ->
    for i in novelData.novel.currentScene.choices
      if i.name == name
        novelArea.selectChoice(i)
        break

  # Called when exiting a scene
  exitScene: (scene) ->
    ui.updateInputs(false)

  # Called when changing a scene
  changeScene: (sceneNames) ->
    util.checkFormat(sceneNames,'string')
    scene = @findSceneByName(@selectRandomOption sceneNames)
    @setupScene(scene)
    return scene

  # Setup a scene changed to
  setupScene: (scene) ->
    @updateScene(scene, false)
    @readItemEdits(novelData.novel.currentScene)
    @readSounds(novelData.novel.currentScene,false)
    @readSaving(novelData.novel.currentScene)
    @readExecutes(novelData.novel.currentScene)
    @readCheckpoints(novelData.novel.currentScene)
    @readMisc(novelData.novel.currentScene)
    textPrinter.printText(scene.parsedText,false)

  # If not changing scenes but update needed, this is called
  updateScene: (scene, onlyUpdating) ->
    @combineSceneTexts(scene)
    scene.parsedText = parser.parseText scene.combinedText
    novelData.novel.currentScene = scene
    if !onlyUpdating
      novelData.novel.parsedChoices = null
    else
      textPrinter.printText(scene.parsedText,true)
      textPrinter.complete()

  # Update choice texts when they are changed - Vue.js doesn't detect them without this.
  updateChoices: ->
    novelArea.$set 'novel.parsedChoices', novelData.novel.currentScene.choices.map((choice) ->
      choice.parsedText = parser.parseText choice.text
      if novelArea.novel.settings.alwaysShowDisabledChoices
        choice.alwaysShow = true
      choice
    )

  # Select a random scene or choice from a list separated by |, takes string
  selectRandomOption: (name) ->
    util.checkFormat(name,'string')
    separate = name.split("|")
    if separate.length == 1
      return separate[0]
    parsed = []
    for i in separate
      i = i.split(",")
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
    util.checkFormat(name,'string')
    for i in novelData.novel.scenes
      if i.name == name
        return i
    console.error "ERROR: Scene by name '"+name+"' not found!"

  # Combine the multiple scene text rows
  combineSceneTexts: (s) ->
    util.checkFormat(s,'object')
    util.checkFormat(s.text,'arrayOrString')
    s.combinedText = ""
    if Object.prototype.toString.call(s.text) == "[object Array]"
      for i in s.text
        s.combinedText = s.combinedText + "<p>" + i + "</p>"
    else
      s.combinedText = s.text

  # Read item and val edit commands from scene or choice
  readItemEdits: (source) ->
    if source.changeInventory != undefined
      novelData.novel.currentInventory = parser.parseStatement(source.changeInventory)
    if source.removeItem != undefined
      inventoryManager.editItems(parser.parseItems(source.removeItem),"remove")
    if source.addItem != undefined
      inventoryManager.editItems(parser.parseItems(source.addItem),"add")
    if source.setItem != undefined
      inventoryManager.editItems(parser.parseItems(source.setItem),"set")
    if source.setValue != undefined
      for val in source.setValue
        inventoryManager.setValue(val.path,parser.parseStatement(val.value.toString()))
    if source.increaseValue != undefined
      for val in source.increaseValue
        inventoryManager.increaseValue(val.path,parser.parseStatement(val.value.toString()))
    if source.decreaseValue != undefined
      for val in source.decreaseValue
        inventoryManager.decreaseValue(val.path,parser.parseStatement(val.value.toString()))

  # Read sound commands from scene or choice
  readSounds: (source,clicked) ->
    played = false
    if source.playSound != undefined
      soundManager.playSound(parser.parseStatement(source.playSound),false)
      played = true
    if clicked && !played
      soundManager.playDefaultClickSound()
    if source.startMusic != undefined
      soundManager.startMusic(parser.parseStatement(source.startMusic))
    if source.stopMusic != undefined
      soundManager.stopMusic(parser.parseStatement(source.stopMusic))
    if source.scrollSound != undefined
      novelData.novel.currentScene.scrollSound = parser.parseStatement(source.scrollSound)
    else
      if novelData.novel.settings.soundSettings.defaultScrollSound
        novelData.novel.currentScene.scrollSound = novelData.novel.settings.soundSettings.defaultScrollSound
      else
        novelData.novel.currentScene.scrollSound = undefined

  # Read JS commands
  readExecutes: (source) ->
    if source.executeJs != undefined
      eval(source.executeJs)

  # Read miscellaneous scene values
  readMisc: (source) ->
    if source.skipEnabled != undefined
      novelData.novel.currentScene.skipEnabled = parser.parseStatement(source.skipEnabled)
    else
      novelData.novel.currentScene.skipEnabled = novelData.novel.settings.scrollSettings.textSkipEnabled
    if source.scrollSpeed != undefined
      novelData.novel.currentScene.scrollSpeed = source.scrollSpeed
    else
      novelData.novel.currentScene.scrollSpeed = novelData.novel.settings.scrollSettings.defaultScrollSpeed
    if source.inventoryHidden != undefined
      novelData.inventoryHidden = parser.parseStatement(source.inventoryHidden)
    else
      novelData.inventoryHidden = false

  # Read save and load commands from scene or choice
  readSaving: (source) ->
    if source.save != undefined
      novelManager.saveData()
    if source.load != undefined
      ui.showLoadNotification()

  # Read checkpoint commands
  readCheckpoints: (source) ->
    if source.saveCheckpoint != undefined
      if novelData.novel.checkpoints == undefined
        novelData.novel.checkpoints = []
      dataChanged = false
      for i in novelData.novel.checkpoints
        if i.name == parser.parseStatement(source.saveCheckpoint)
          i.scene = novelData.novel.currentScene.name
          dataChanged = true
          #console.log "Updated checkpoint!"
      if !dataChanged
        checkpoint = {name:parser.parseStatement(source.saveCheckpoint),scene:novelData.novel.currentScene.name}
        novelData.novel.checkpoints.push(checkpoint)
      #console.log "Checkpoint saved!"
      #console.log checkpoint
    if source.loadCheckpoint != undefined
      if novelData.novel.checkpoints == undefined
        novelData.novel.checkpoints = []
      for i in novelData.novel.checkpoints
        if i.name == parser.parseStatement(source.loadCheckpoint)
          #console.log "Checkpoint found!"
          @changeScene(i.scene)

  # Check whether the requirements for a choice have been met
  requirementsFilled: (choice) ->
    reqs = []
    if choice.itemRequirement != undefined
      requirements = parser.parseItems choice.itemRequirement
      reqs.push inventoryManager.checkRequirements(requirements)
    if choice.requirement != undefined
      reqs.push inventoryManager.parseIfStatement choice.requirement
    success = true
    for r in reqs
      if r == false
        success = false
    return success
