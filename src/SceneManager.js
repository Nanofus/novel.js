
/* SCENE MANIPULATION */

class SceneManager {

  // Try to select "Continue"
  static tryContinue() {
    if (TextPrinter.printCompleted && TextPrinter.tickSpeedMultiplier === 1) {
      return this.selectChoiceByName("Continue");
    }
  }

  // Select a choice
  static selectChoice(choice) {
    this.exitScene(novelData.novel.currentScene);
    this.readItemEdits(choice);
    this.readSounds(choice,true);
    this.readSaving(choice);
    this.readExecutes(choice);
    this.readCheckpoints(choice);
    this.readLanguage(choice);
    // Move to the next scene or choice
    if (choice.nextScene !== undefined) {
      this.changeScene(choice.nextScene);
    } else {
      if (choice.nextChoice !== undefined) {
        this.selectChoiceByName(Parser.selectRandomOption(choice.nextChoice));
      } else {
        this.updateScene(novelData.novel.currentScene,true);
      }
    }
    return UI.updateInventories();
  }

  // Select a choice by clicking a link embedded in text
  static selectChoiceByNameByClicking(event, name) {
    event.stopPropagation();
    event.preventDefault();
    return this.selectChoiceByName(name);
  }

  // Select a choice by name
  static selectChoiceByName(name) {
    for (let j = 0; j < novelData.novel.currentScene.choices.length; j++) {
      let i = novelData.novel.currentScene.choices[j];
      if (i.name === name) {
        this.selectChoice(i);
        break;
      }
    }
  }

  // Select a choice by ID
  static selectChoiceById(id) {
    if (novelData.novel.currentScene.choices[id]) {
      return this.selectChoice(novelData.novel.currentScene.choices[id]);
    }
  }

  // Called when exiting a scene
  static exitScene(scene) {
    // Set the previous scene as visited
    scene.visited = true;
    UI.updateInputs(false);
    return UI.resetChoices();
  }

  // Called when changing a scene
  static changeScene(sceneNames) {
    // Load the new scene
    Util.checkFormat(sceneNames,'string');
    let scene = this.findSceneByName(Parser.selectRandomOption(sceneNames));
    this.setupScene(scene);
    return scene;
  }

  // Setup a scene changed to
  static setupScene(scene) {
    this.updateScene(scene, false);
    this.readItemEdits(novelData.novel.currentScene);
    this.readSounds(novelData.novel.currentScene,false);
    this.readSaving(novelData.novel.currentScene);
    this.readExecutes(novelData.novel.currentScene);
    this.readCheckpoints(novelData.novel.currentScene);
    this.readLanguage(novelData.novel.currentScene);
    this.readMisc(novelData.novel.currentScene);
    // Show the hidden inventory items based on debug mode
    UI.showHiddenInventoryArea();
    // Finally print the scene's text
    return TextPrinter.printText(scene.parsedText,false);
  }

  // If not changing scenes but update needed, this is called
  static updateScene(scene, onlyUpdating) {
    // Handle the scene text
    scene = this.combineSceneTexts(scene);
    scene.parsedText = Parser.parseText(scene.combinedText);
    // Set the current scene
    novelData.novel.currentScene = scene;
    // Update scene style
    UI.updateStyle(scene.style);
    // Make the next steps
    if (!onlyUpdating) {
      return novelData.novel.parsedChoices = null;
    } else {
      TextPrinter.printText(scene.parsedText,true);
      return TextPrinter.complete();
    }
  }

  // Return a scene by its name; throw an error if not found.
  static findSceneByName(name) {
    Util.checkFormat(name,'string');
    for (let j = 0; j < novelData.novel.scenes.length; j++) {
      let i = novelData.novel.scenes[j];
      if (i.name === name) {
        return i;
      }
    }
    return console.error(`ERROR: Scene by name '${name}' not found!`);
  }

  // Combine the multiple scene text rows
  static combineSceneTexts(s) {
    Util.checkFormat(s,'object');
    Util.checkFormat(s.text,'arrayOrString');
    s.combinedText = "";
    if (Object.prototype.toString.call(s.text) === "[object Array]") {
      for (let j = 0; j < s.text.length; j++) {
        // Rows should be formatted into paragraphs
        let i = s.text[j];
        s.combinedText = s.combinedText + "<p>" + LanguageManager.getCorrectLanguageString(i) + "</p>";
      }
    } else {
      s.combinedText = s.text;
    }
    return s;
  }

  // Read item and val edit commands from scene or choice
  static readItemEdits(source) {
    // Handle inventory changing
    if (source.changeInventory !== undefined) {
      novelData.novel.currentInventory = Parser.parseStatement(source.changeInventory);
      if (novelData.novel.currentInventory > novelData.novel.inventories.length) {
        let iterable = __range__(0, novelData.novel.currentInventory, true);
        for (let j = 0; j < iterable.length; j++) {
          let i = iterable[j];
          if (novelData.novel.inventories[i] === undefined) {
            novelData.novel.inventories[i] = [];
          }
        }
      }
    }
    // Handle item removal
    if (source.removeItem !== undefined) {
      InventoryManager.removeItems(Parser.parseItems(source.removeItem));
    }
    // Handle item adding
    if (source.addItem !== undefined) {
      InventoryManager.addItems(Parser.parseItems(source.addItem));
    }
    // Handle item value setting
    if (source.setItem !== undefined) {
      InventoryManager.setItems(Parser.parseItems(source.setItem));
    }
    // Handle object value setting
    if (source.setValue !== undefined) {
      for (let k = 0; k < source.setValue.length; k++) {
        var val = source.setValue[k];
        InventoryManager.setValue(val.path,Parser.parseStatement(val.value.toString()));
      }
    }
    if (source.increaseValue !== undefined) {
      for (let i1 = 0; i1 < source.increaseValue.length; i1++) {
        var val = source.increaseValue[i1];
        InventoryManager.increaseValue(val.path,Parser.parseStatement(val.value.toString()));
      }
    }
    if (source.decreaseValue !== undefined) {
      return source.decreaseValue.map((val) =>
        InventoryManager.decreaseValue(val.path,Parser.parseStatement(val.value.toString())));
    }
  }

  // Read sound commands from scene or choice
  static readSounds(source, clicked) {
    let played = false;
    // If should play a sound
    if (source.playSound !== undefined) {
      SoundManager.playSound(Parser.parseStatement(source.playSound),false);
      played = true;
    }
    // If no other sound was played, play the default click sound
    if (clicked && !played) {
      SoundManager.playDefaultClickSound();
    }
    // Start music
    if (source.startMusic !== undefined) {
      SoundManager.startMusic(Parser.parseStatement(source.startMusic));
    }
    // Stop music
    if (source.stopMusic !== undefined) {
      SoundManager.stopMusic(Parser.parseStatement(source.stopMusic));
    }
    // Scene-specific scrolling sound
    if (source.scrollSound !== undefined) {
      return novelData.novel.currentScene.scrollSound = Parser.parseStatement(source.scrollSound);
    } else {
      if (novelData.novel.settings.soundSettings.defaultScrollSound) {
        return novelData.novel.currentScene.scrollSound = novelData.novel.settings.soundSettings.defaultScrollSound;
      } else {
        return novelData.novel.currentScene.scrollSound = undefined;
      }
    }
  }

  // Read JS commands
  static readExecutes(source) {
    // Execute found JS
    if (source.executeJs !== undefined) {
      return eval(source.executeJs);
    }
  }

  // Language changing
  static readLanguage(source) {
    // Check if changing language
    if (source.setLanguage !== undefined) {
      return LanguageManager.setLanguage(source.setLanguage);
    }
  }

  // Read miscellaneous scene values
  static readMisc(source) {
    // Check if skipping is enabled in this scene
    if (source.skipEnabled !== undefined) {
      var val = Parser.parseStatement(source.skipEnabled);
    } else {
      var val = novelData.novel.settings.scrollSettings.textSkipEnabled;
    }
    novelData.novel.currentScene.skipEnabled = val;
    UI.showSkipButton(val);
    // Check if revisit skipping is enabled in this scene
    if (source.revisitSkipEnabled !== undefined) {
      novelData.novel.currentScene.revisitSkipEnabled = Parser.parseStatement(source.revisitSkipEnabled);
    } else {
      novelData.novel.currentScene.revisitSkipEnabled = novelData.novel.settings.scrollSettings.revisitSkipEnabled;
    }
    // Check if scroll speed setting is enabled
    if (source.scrollSpeed !== undefined) {
      novelData.novel.currentScene.scrollSpeed = source.scrollSpeed;
    } else {
      novelData.novel.currentScene.scrollSpeed = novelData.novel.settings.scrollSettings.defaultScrollSpeed;
    }
    // Check if inventory hiding is enabled
    if (source.inventoryHidden !== undefined) {
      var val = Parser.parseStatement(source.inventoryHidden);
    } else {
      var val = novelData.novel.settings.inventoryHidden;
    }
    novelData.inventoryHidden = val;
    UI.showInventoryArea(!val);
    // Check if choice hiding is enabled
    if (source.choicesHidden !== undefined) {
      var val = Parser.parseStatement(source.choicesHidden);
    } else {
      var val = novelData.novel.settings.choicesHidden;
    }
    novelData.choicesHidden = val;
    UI.showChoicesArea(!val);
    // Check if choice hiding is enabled
    if (source.saveButtonsHidden !== undefined) {
      var val = Parser.parseStatement(source.saveButtonsHidden);
    } else {
      var val = !novelData.novel.settings.showSaveButtons;
    }
    novelData.saveButtonsHidden = val;
    return UI.showSaveButtons(!val);
  }

  // Read save and load commands from scene or choice
  static readSaving(source) {
    if (source.save !== undefined) {
      NovelManager.saveData();
    }
    if (source.load !== undefined) {
      return UI.showLoadNotification();
    }
  }

  // Read checkpoint commands
  static readCheckpoints(source) {
    // Save a new checkpoint
    if (source.saveCheckpoint !== undefined) {
      // Generate checkpoints object if not defined
      if (novelData.novel.checkpoints === undefined) {
        novelData.novel.checkpoints = [];
      }
      let dataChanged = false;
      // Try to set a checkpoint
      for (let j = 0; j < novelData.novel.checkpoints.length; j++) {
        var i = novelData.novel.checkpoints[j];
        if (i.name === Parser.parseStatement(source.saveCheckpoint)) {
          i.scene = novelData.novel.currentScene.name;
          dataChanged = true;
        }
      }
      // If an existing checkpoint was not found, create a new one
      if (!dataChanged) {
        let checkpoint = { name: Parser.parseStatement(source.saveCheckpoint), scene: novelData.novel.currentScene.name };
        novelData.novel.checkpoints.push(checkpoint);
      }
    }
    // Load a checkpoint if able
    if (source.loadCheckpoint !== undefined) {
      // Generate a checkpoints object if not defined
      if (novelData.novel.checkpoints === undefined) {
        novelData.novel.checkpoints = [];
      }
      for (let k = 0; k < novelData.novel.checkpoints.length; k++) {
        var i = novelData.novel.checkpoints[k];
        if (i.name === Parser.parseStatement(source.loadCheckpoint)) {
          this.changeScene(i.scene);
        }
      }
    }
  }

  // Check whether the requirements for a choice have been met
  static requirementsFilled(choice) {
    let reqs = [];
    // Check the item requirement
    if (choice.itemRequirement !== undefined) {
      let requirements = Parser.parseItems(choice.itemRequirement);
      reqs.push(InventoryManager.checkRequirements(requirements));
    }
    // Check the requirement statement
    if (choice.requirement !== undefined) {
      reqs.push(Parser.parseStatement(choice.requirement));
    }
    let success = true;
    // If both were satisfied, return true
    for (let i = 0; i < reqs.length; i++) {
      let r = reqs[i];
      if (r === false) {
        success = false;
      }
    }
    return success;
  }
}

function __range__(left, right, inclusive) {
  let range = [];
  let ascending = left < right;
  let end = !inclusive ? right : ascending ? right + 1 : right - 1;
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }
  return range;
}
