
### SCENE MANIPULATION ###

class SceneManager
  instance = null
  constructor: ->
    if instance
      return instance
    else
      instance = this

  # Try to select "Continue"
  @tryContinue: ->
    if TextPrinter.printCompleted and TextPrinter.tickSpeedMultiplier is 1
      @selectChoiceByName("Continue")

  # Select a choice
  @selectChoice: (choice) ->
    @exitScene(novelData.novel.currentScene)
    @readItemEdits(choice)
    @readSounds(choice,true)
    @readSaving(choice)
    @readExecutes(choice)
    @readCheckpoints(choice)
    if choice.nextScene isnt undefined
      @changeScene(choice.nextScene)
    else
      if choice.nextChoice isnt undefined
        @selectChoiceByName(Parser.selectRandomOption(choice.nextChoice))
      else
        @updateScene(novelData.novel.currentScene,true)

  # Select a choice by clicking a link embedded in text
  @selectChoiceByNameByClicking: (event, name) ->
    event.stopPropagation()
    event.preventDefault()
    @selectChoiceByName(name)

  # Select a choice by name
  @selectChoiceByName: (name) ->
    for i in novelData.novel.currentScene.choices
      if i.name is name
        novelArea.selectChoice(i)
        break

  # Called when exiting a scene
  @exitScene: (scene) ->
    # Set the previous scene as visited
    scene.visited = true
    UI.updateInputs(false)

  # Called when changing a scene
  @changeScene: (sceneNames) ->
    # Load the new scene
    Util.checkFormat(sceneNames,'string')
    scene = @findSceneByName(Parser.selectRandomOption sceneNames)
    @setupScene(scene)
    return scene

  # Setup a scene changed to
  @setupScene: (scene) ->
    @updateScene(scene, false)
    @readItemEdits(novelData.novel.currentScene)
    @readSounds(novelData.novel.currentScene,false)
    @readSaving(novelData.novel.currentScene)
    @readExecutes(novelData.novel.currentScene)
    @readCheckpoints(novelData.novel.currentScene)
    @readMisc(novelData.novel.currentScene)
    TextPrinter.printText(scene.parsedText,false)

  # If not changing scenes but update needed, this is called
  @updateScene: (scene, onlyUpdating) ->
    # Handle the scene text
    scene = @combineSceneTexts(scene)
    scene.parsedText = Parser.parseText scene.combinedText
    # Set the current scene
    novelData.novel.currentScene = scene
    if not onlyUpdating
      novelData.novel.parsedChoices = null
    else
      TextPrinter.printText(scene.parsedText,true)
      TextPrinter.complete()

  # Update choice texts when they are changed - Vue.js doesn't detect them without this.
  @updateChoices: ->
    novelArea.$set 'novel.parsedChoices', novelData.novel.currentScene.choices.map((choice) ->
      choice.parsedText = Parser.parseText choice.text
      if novelArea.novel.settings.alwaysShowDisabledChoices
        choice.alwaysShow = true
      choice
    )

  # Return a scene by its name; throw an error if not found.
  @findSceneByName: (name) ->
    Util.checkFormat(name,'string')
    for i in novelData.novel.scenes
      if i.name is name
        return i
    console.error "ERROR: Scene by name '"+name+"' not found!"

  # Combine the multiple scene text rows
  @combineSceneTexts: (s) ->
    Util.checkFormat(s,'object')
    Util.checkFormat(s.text,'arrayOrString')
    s.combinedText = ""
    if Object.prototype.toString.call(s.text) is "[object Array]"
      for i in s.text
        s.combinedText = s.combinedText + "<p>" + i + "</p>"
    else
      s.combinedText = s.text
    return s

  # Read item and val edit commands from scene or choice
  @readItemEdits: (source) ->
    if source.changeInventory isnt undefined
      novelData.novel.currentInventory = Parser.parseStatement(source.changeInventory)
      if novelData.novel.currentInventory > novelData.novel.inventories.length
        for i in [0 .. novelData.novel.currentInventory]
          if novelData.novel.inventories[i] is undefined
            novelData.novel.inventories[i] = []
    if source.removeItem isnt undefined
      InventoryManager.editItems(Parser.parseItems(source.removeItem),"remove")
    if source.addItem isnt undefined
      InventoryManager.editItems(Parser.parseItems(source.addItem),"add")
    if source.setItem isnt undefined
      InventoryManager.editItems(Parser.parseItems(source.setItem),"set")
    if source.setValue isnt undefined
      for val in source.setValue
        InventoryManager.setValue(val.path,Parser.parseStatement(val.value.toString()))
    if source.increaseValue isnt undefined
      for val in source.increaseValue
        InventoryManager.increaseValue(val.path,Parser.parseStatement(val.value.toString()))
    if source.decreaseValue isnt undefined
      for val in source.decreaseValue
        InventoryManager.decreaseValue(val.path,Parser.parseStatement(val.value.toString()))

  # Read sound commands from scene or choice
  @readSounds: (source,clicked) ->
    played = false
    if source.playSound isnt undefined
      SoundManager.playSound(Parser.parseStatement(source.playSound),false)
      played = true
    if clicked and not played
      SoundManager.playDefaultClickSound()
    if source.startMusic isnt undefined
      SoundManager.startMusic(Parser.parseStatement(source.startMusic))
    if source.stopMusic isnt undefined
      SoundManager.stopMusic(Parser.parseStatement(source.stopMusic))
    if source.scrollSound isnt undefined
      novelData.novel.currentScene.scrollSound = Parser.parseStatement(source.scrollSound)
    else
      if novelData.novel.settings.soundSettings.defaultScrollSound
        novelData.novel.currentScene.scrollSound = novelData.novel.settings.soundSettings.defaultScrollSound
      else
        novelData.novel.currentScene.scrollSound = undefined

  # Read JS commands
  @readExecutes: (source) ->
    if source.executeJs isnt undefined
      eval(source.executeJs)

  # Read miscellaneous scene values
  @readMisc: (source) ->
    if source.skipEnabled isnt undefined
      novelData.novel.currentScene.skipEnabled = Parser.parseStatement(source.skipEnabled)
    else
      novelData.novel.currentScene.skipEnabled = novelData.novel.settings.scrollSettings.textSkipEnabled
    if source.revisitSkipEnabled isnt undefined
      novelData.novel.currentScene.revisitSkipEnabled = Parser.parseStatement(source.revisitSkipEnabled)
    else
      novelData.novel.currentScene.revisitSkipEnabled = novelData.novel.settings.scrollSettings.revisitSkipEnabled
    if source.scrollSpeed isnt undefined
      novelData.novel.currentScene.scrollSpeed = source.scrollSpeed
    else
      novelData.novel.currentScene.scrollSpeed = novelData.novel.settings.scrollSettings.defaultScrollSpeed
    if source.inventoryHidden isnt undefined
      novelData.inventoryHidden = Parser.parseStatement(source.inventoryHidden)
    else
      novelData.inventoryHidden = novelData.novel.settings.inventoryHidden

  # Read save and load commands from scene or choice
  @readSaving: (source) ->
    if source.save isnt undefined
      NovelManager.saveData()
    if source.load isnt undefined
      UI.showLoadNotification()

  # Read checkpoint commands
  @readCheckpoints: (source) ->
    if source.saveCheckpoint isnt undefined
      if novelData.novel.checkpoints is undefined
        novelData.novel.checkpoints = []
      dataChanged = false
      for i in novelData.novel.checkpoints
        if i.name is Parser.parseStatement(source.saveCheckpoint)
          i.scene = novelData.novel.currentScene.name
          dataChanged = true
          #console.log "Updated checkpoint!"
      if not dataChanged
        checkpoint = {name:Parser.parseStatement(source.saveCheckpoint),scene:novelData.novel.currentScene.name}
        novelData.novel.checkpoints.push(checkpoint)
      #console.log "Checkpoint saved!"
      #console.log checkpoint
    if source.loadCheckpoint isnt undefined
      if novelData.novel.checkpoints is undefined
        novelData.novel.checkpoints = []
      for i in novelData.novel.checkpoints
        if i.name is Parser.parseStatement(source.loadCheckpoint)
          #console.log "Checkpoint found!"
          @changeScene(i.scene)

  # Check whether the requirements for a choice have been met
  @requirementsFilled: (choice) ->
    reqs = []
    if choice.itemRequirement isnt undefined
      requirements = Parser.parseItems choice.itemRequirement
      reqs.push InventoryManager.checkRequirements requirements
    if choice.requirement isnt undefined
      reqs.push Parser.parseStatement choice.requirement
    success = true
    for r in reqs
      if r is false
        success = false
    return success
