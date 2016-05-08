
### SCENE MANIPULATION ###

class SceneManager

  # Create instance
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
    @readLanguage(choice)
    # Move to the next scene or choice
    if choice.nextScene isnt undefined
      @changeScene(choice.nextScene)
    else
      if choice.nextChoice isnt undefined
        @selectChoiceByName(Parser.selectRandomOption(choice.nextChoice))
      else
        @updateScene(novelData.novel.currentScene,true)
    UI.updateInventories()

  # Select a choice by clicking a link embedded in text
  @selectChoiceByNameByClicking: (event, name) ->
    event.stopPropagation()
    event.preventDefault()
    @selectChoiceByName(name)

  # Select a choice by name
  @selectChoiceByName: (name) ->
    for i in novelData.novel.currentScene.choices
      if i.name is name
        @selectChoice(i)
        break

  # Select a choice by ID
  @selectChoiceById: (id) ->
    if novelData.novel.currentScene.choices[id]
      @selectChoice(novelData.novel.currentScene.choices[id])

  # Called when exiting a scene
  @exitScene = (scene) ->
    # Set the previous scene as visited
    scene.visited = true
    UI.updateInputs(false)
    UI.resetChoices()

  # Called when changing a scene
  @changeScene = (sceneNames) ->
    # Load the new scene
    Util.checkFormat(sceneNames,'string')
    scene = @findSceneByName(Parser.selectRandomOption sceneNames)
    @setupScene(scene)
    return scene

  # Setup a scene changed to
  @setupScene = (scene) ->
    @updateScene(scene, false)
    @readItemEdits(novelData.novel.currentScene)
    @readSounds(novelData.novel.currentScene,false)
    @readSaving(novelData.novel.currentScene)
    @readExecutes(novelData.novel.currentScene)
    @readCheckpoints(novelData.novel.currentScene)
    @readLanguage(novelData.novel.currentScene)
    @readMisc(novelData.novel.currentScene)
    # Show the hidden inventory items based on debug mode
    UI.showHiddenInventoryArea()
    # Finally print the scene's text
    TextPrinter.printText(scene.parsedText,false)

  # If not changing scenes but update needed, this is called
  @updateScene = (scene, onlyUpdating) ->
    # Handle the scene text
    scene = @combineSceneTexts(scene)
    scene.parsedText = Parser.parseText scene.combinedText
    # Set the current scene
    novelData.novel.currentScene = scene
    # Update scene style
    UI.updateStyle(scene.style)
    # Make the next steps
    if not onlyUpdating
      novelData.novel.parsedChoices = null
    else
      TextPrinter.printText(scene.parsedText,true)
      TextPrinter.complete()

  # Return a scene by its name; throw an error if not found.
  @findSceneByName = (name) ->
    Util.checkFormat(name,'string')
    for i in novelData.novel.scenes
      if i.name is name
        return i
    console.error "ERROR: Scene by name '"+name+"' not found!"

  # Combine the multiple scene text rows
  @combineSceneTexts = (s) ->
    Util.checkFormat(s,'object')
    Util.checkFormat(s.text,'arrayOrString')
    s.combinedText = ""
    if Object.prototype.toString.call(s.text) is "[object Array]"
      for i in s.text
        # Rows should be formatted into paragraphs
        s.combinedText = s.combinedText + "<p>" + LanguageManager.getCorrectLanguageString(i) + "</p>"
    else
      s.combinedText = s.text
    return s

  # Read item and val edit commands from scene or choice
  @readItemEdits = (source) ->
    # Handle inventory changing
    if source.changeInventory isnt undefined
      novelData.novel.currentInventory = Parser.parseStatement(source.changeInventory)
      if novelData.novel.currentInventory > novelData.novel.inventories.length
        for i in [0 .. novelData.novel.currentInventory]
          if novelData.novel.inventories[i] is undefined
            novelData.novel.inventories[i] = []
    # Handle item removal
    if source.removeItem isnt undefined
      InventoryManager.removeItems(Parser.parseItems(source.removeItem))
    # Handle item adding
    if source.addItem isnt undefined
      InventoryManager.addItems(Parser.parseItems(source.addItem))
    # Handle item value setting
    if source.setItem isnt undefined
      InventoryManager.setItems(Parser.parseItems(source.setItem))
    # Handle object value setting
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
  @readSounds = (source, clicked) ->
    played = false
    # If should play a sound
    if source.playSound isnt undefined
      SoundManager.playSound(Parser.parseStatement(source.playSound),false)
      played = true
    # If no other sound was played, play the default click sound
    if clicked and not played
      SoundManager.playDefaultClickSound()
    # Start music
    if source.startMusic isnt undefined
      SoundManager.startMusic(Parser.parseStatement(source.startMusic))
    # Stop music
    if source.stopMusic isnt undefined
      SoundManager.stopMusic(Parser.parseStatement(source.stopMusic))
    # Scene-specific scrolling sound
    if source.scrollSound isnt undefined
      novelData.novel.currentScene.scrollSound = Parser.parseStatement(source.scrollSound)
    else
      if novelData.novel.settings.soundSettings.defaultScrollSound
        novelData.novel.currentScene.scrollSound = novelData.novel.settings.soundSettings.defaultScrollSound
      else
        novelData.novel.currentScene.scrollSound = undefined

  # Read JS commands
  @readExecutes = (source) ->
    # Execute found JS
    if source.executeJs isnt undefined
      eval(source.executeJs)

  # Language changing
  @readLanguage = (source) ->
    # Check if changing language
    if source.setLanguage isnt undefined
      LanguageManager.setLanguage(source.setLanguage)

  # Read miscellaneous scene values
  @readMisc = (source) ->
    # Check if skipping is enabled in this scene
    if source.skipEnabled isnt undefined
      val = Parser.parseStatement(source.skipEnabled)
    else
      val = novelData.novel.settings.scrollSettings.textSkipEnabled
    novelData.novel.currentScene.skipEnabled = val
    UI.showSkipButton(val)
    # Check if revisit skipping is enabled in this scene
    if source.revisitSkipEnabled isnt undefined
      novelData.novel.currentScene.revisitSkipEnabled = Parser.parseStatement(source.revisitSkipEnabled)
    else
      novelData.novel.currentScene.revisitSkipEnabled = novelData.novel.settings.scrollSettings.revisitSkipEnabled
    # Check if scroll speed setting is enabled
    if source.scrollSpeed isnt undefined
      novelData.novel.currentScene.scrollSpeed = source.scrollSpeed
    else
      novelData.novel.currentScene.scrollSpeed = novelData.novel.settings.scrollSettings.defaultScrollSpeed
    # Check if inventory hiding is enabled
    if source.inventoryHidden isnt undefined
      val = Parser.parseStatement(source.inventoryHidden)
    else
      val = novelData.novel.settings.inventoryHidden
    novelData.inventoryHidden = val
    UI.showInventoryArea(!val)
    # Check if choice hiding is enabled
    if source.choicesHidden isnt undefined
      val = Parser.parseStatement(source.choicesHidden)
    else
      val = novelData.novel.settings.choicesHidden
    novelData.choicesHidden = val
    UI.showChoicesArea(!val)
    # Check if choice hiding is enabled
    if source.saveButtonsHidden isnt undefined
      val = Parser.parseStatement(source.saveButtonsHidden)
    else
      val = !novelData.novel.settings.showSaveButtons
    novelData.saveButtonsHidden = val
    UI.showSaveButtons(!val)

  # Read save and load commands from scene or choice
  @readSaving = (source) ->
    if source.save isnt undefined
      NovelManager.saveData()
    if source.load isnt undefined
      UI.showLoadNotification()

  # Read checkpoint commands
  @readCheckpoints = (source) ->
    # Save a new checkpoint
    if source.saveCheckpoint isnt undefined
      # Generate checkpoints object if not defined
      if novelData.novel.checkpoints is undefined
        novelData.novel.checkpoints = []
      dataChanged = false
      # Try to set a checkpoint
      for i in novelData.novel.checkpoints
        if i.name is Parser.parseStatement(source.saveCheckpoint)
          i.scene = novelData.novel.currentScene.name
          dataChanged = true
      # If an existing checkpoint was not found, create a new one
      if not dataChanged
        checkpoint = { name: Parser.parseStatement(source.saveCheckpoint), scene: novelData.novel.currentScene.name }
        novelData.novel.checkpoints.push(checkpoint)
    # Load a checkpoint if able
    if source.loadCheckpoint isnt undefined
      # Generate a checkpoints object if not defined
      if novelData.novel.checkpoints is undefined
        novelData.novel.checkpoints = []
      for i in novelData.novel.checkpoints
        if i.name is Parser.parseStatement(source.loadCheckpoint)
          @changeScene(i.scene)

  # Check whether the requirements for a choice have been met
  @requirementsFilled = (choice) ->
    reqs = []
    # Check the item requirement
    if choice.itemRequirement isnt undefined
      requirements = Parser.parseItems choice.itemRequirement
      reqs.push InventoryManager.checkRequirements requirements
    # Check the requirement statement
    if choice.requirement isnt undefined
      reqs.push Parser.parseStatement choice.requirement
    success = true
    # If both were satisfied, return true
    for r in reqs
      if r is false
        success = false
    return success
