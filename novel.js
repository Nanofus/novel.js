
/* GLOBAL GAME DATA */

let novelData = {
  novel: null,
  choices: null,
  debugMode: false,
  status: "Loading",
  inventoryHidden: false,
  choicesHidden: false,
  printedText: "",
  parsedJavascriptCommands: [],
  parsedScrollsounds: [],
  music: [],
  csvEnabled: false,
  input: {
    presses: 0
  },
  printer: {
    fullText: "",
    currentText: "",
    currentOffset: 0,
    defaultInterval: 0,
    soundBuffer: [],
    musicBuffer: [],
    stopMusicBuffer: [],
    executeBuffer: [],
    buffersExecuted: false,
    scrollSound: null,
    tickSoundFrequency: 1,
    tickCounter: 0,
    speedMod: false,
    tickSpeedMultiplier: 1,
    pause: 0,
    interval: 0,
    printCompleted: false
  }
};

let novelPath;

if (typeof Papa !== "undefined") {
   novelData.csvEnabled = true;
}

/* HANDLES KEYBOARD INPUT */

class InputManager {

  // Gets key down and handles their functions
  static keyDown(charCode) {
    if (this.formsSelected()) {
      return;
    }
    // Use SPACE to skip or continue
    if (charCode === 13 || charCode === 32) {
      if (novelData.novel.settings.scrollSettings.continueWithKeyboard) {
        SceneManager.tryContinue();
      }
      if (novelData.novel.settings.scrollSettings.skipWithKeyboard) {
        TextPrinter.trySkip();
      }
      return TextPrinter.unpause();
    }
  }

  // Gets key being pressed
  static keyPressed(charCode) {
    if (this.formsSelected()) {
      return;
    }
    novelData.input.presses++;
    // Use SPACE to fast scroll
    if (charCode === 13 || charCode === 32) {
      if (novelData.input.presses > 2) {
        if (novelData.novel.settings.scrollSettings.fastScrollWithKeyboard) {
          return TextPrinter.fastScroll();
        }
      }
    }
  }

  // Gets key release
  static keyUp(charCode) {
    if (this.formsSelected()) {
      return;
    }
    this.presses = 0;
    // Release SPACE to stop fast scroll
    if (charCode === 13 || charCode === 32) {
      return TextPrinter.stopFastScroll();
    }
  }

  // Checks if any forms on the page are active
  static formsSelected() {
    let novelArea = document.getElementById("novel-area");
    if (novelArea) {
      let inputs = novelArea.querySelectorAll("input");
      for (let j = 0; j < inputs.length; j++) {
        let i = inputs[j];
        if (i === document.activeElement) {
          return true;
        }
      }
    }
    return false;
  }
}

document.onkeydown = function(evt) {
  evt = evt || window.event;
  let charCode = evt.keyCode || evt.which;
  return InputManager.keyDown(charCode);
};

document.onkeypress = function(evt) {
  evt = evt || window.event;
  let charCode = evt.keyCode || evt.which;
  return InputManager.keyPressed(charCode);
};

document.onkeyup = function(evt) {
  evt = evt || window.event;
  let charCode = evt.keyCode || evt.which;
  return InputManager.keyUp(charCode);
};

/* INVENTORY, STAT & VALUE OPERATIONS */

class InventoryManager {

  // Check if item or stat requirements have been filled
  static checkRequirements(requirements) {
    Util.checkFormat(requirements,'array');
    let reqsFilled = 0;
    // Go through all requirements
    for (let k = 0; k < novelData.novel.inventories[novelData.novel.currentInventory].length; k++) {
      let i = novelData.novel.inventories[novelData.novel.currentInventory][k];
      for (let i1 = 0; i1 < requirements.length; i1++) {
        let j = requirements[i1];
        if (j[0] === i.name) {
          if (j[1] <= i.value) {
            reqsFilled = reqsFilled + 1;
          }
        }
      }
    }
    // Check whether all requirements have been filled
    if (reqsFilled === requirements.length) {
      return true;
    } else {
      return false;
    }
  }

  // Set a value in JSON
  static setValue(parsed, newValue) {
    Util.checkFormat(parsed,'string');
    let getValueArrayLast = this.getValueArrayLast(parsed);
    let value = Parser.findValue(parsed,false);
    return value[getValueArrayLast] = newValue;
  }

  // Increase a value in JSON
  static increaseValue(parsed, change) {
    Util.checkFormat(parsed,'string');
    let getValueArrayLast = this.getValueArrayLast(parsed);
    let value = Parser.findValue(parsed,false);
    value[getValueArrayLast] = value[getValueArrayLast] + change;
    if (!isNaN(parseFloat(value[getValueArrayLast]))) {
      return value[getValueArrayLast] = parseFloat(value[getValueArrayLast].toFixed(novelData.novel.settings.floatPrecision));
    }
  }

  // Decrease a value in JSON
  static decreaseValue(parsed, change) {
    Util.checkFormat(parsed,'string');
    let getValueArrayLast = this.getValueArrayLast(parsed);
    let value = Parser.findValue(parsed,false);
    value[getValueArrayLast] = value[getValueArrayLast] - change;
    if (!isNaN(parseFloat(value[getValueArrayLast]))) {
      return value[getValueArrayLast] = parseFloat(value[getValueArrayLast].toFixed(novelData.novel.settings.floatPrecision));
    }
  }

  // Get the last item in a value array
  static getValueArrayLast(parsed) {
    let getValueArrayLast = parsed.split(",");
    getValueArrayLast = getValueArrayLast[getValueArrayLast.length-1].split(".");
    getValueArrayLast = getValueArrayLast[getValueArrayLast.length-1];
    return getValueArrayLast;
  }

  // Add items
  static addItems(items) {
    return this.editItems(items, "add");
  }

  // Set items
  static setItems(items) {
    return this.editItems(items, "set");
  }

  // Remove items
  static removeItems(items) {
    return this.editItems(items, "remove");
  }

  // Edit the player's items or stats
  static editItems(items, mode) {
    Util.checkFormat(items,'array');
    for (let i = 0; i < items.length; i++) {
      let j = items[i];
      let hidden = false;
      // If the item name begins with a "!", it is hidden
      if (j[0].substring(0,1) === "!") {
        hidden = true;
        j[0] = j[0].substring(1,j[0].length);
      }
      // Try to edit the item in the current inventory
      let itemAdded = this.tryEditInInventory(mode, j, hidden);
      // If it failed, add a new item
      if (!itemAdded) {
        this.tryEditNotInInventory(mode, j, hidden);
      }
    }
  }

  // Try to edit an existing item
  static tryEditInInventory(mode, j, hidden) {
    for (let k = 0; k < novelData.novel.inventories[novelData.novel.currentInventory].length; k++) {
      // If the item exists in the current inventory
      let i = novelData.novel.inventories[novelData.novel.currentInventory][k];
      if (i.name === j[0]) {
        let probability = 1;
        // Check the string for display names and probabilities
        if (j.length > 2) {
          var displayName = j[2];
          var value = parseInt(Parser.parseStatement(j[1]));
          if (!isNaN(displayName)) {
            probability = j[2];
            displayName = j.name;
          }
          if (j.length > 3) {
            probability = parseFloat(j[2]);
            displayName = j[3];
          }
        } else {
          var displayName = j[0];
          var value = parseInt(Parser.parseStatement(j[1]));
        }
        // Generate a random value to determine whether to continue
        let random = Math.random();
        if (random < probability) {
          // Set the item's value
          if (mode === "set") {
            if (isNaN(parseInt(j[1]))) {
              i.value = j[1];
            } else {
              i.value = parseInt(j[1]);
            }
          // Add to the item's value - if it was a string, change it into a number
          } else if (mode === "add") {
            if (isNaN(parseInt(i.value))) {
              i.value = 0;
            }
            i.value = parseInt(i.value) + value;
          // Deduct from the item's value - if it's a string, change it into 0
          } else if (mode === "remove") {
            if (!isNaN(parseInt(i.value))) {
              i.value = parseInt(i.value) - value;
              if (i.value < 0) {
                i.value = 0;
              }
            } else {
              i.value = 0;
            }
          }
          // Set whether to hide the item or not
          i.hidden = hidden;
        }
        return true;
      }
    }
    return false;
  }

  // Edit an item that does not exist in inventory yet
  static tryEditNotInInventory(mode, j, hidden) {
    // Only do this if we don't want to remove anything
    if (mode !== "remove") {
      let probability = 1;
      // Check the string for display names and probablities
      let value = parseInt(Parser.parseStatement(j[1]));
      if (isNaN(value)) {
        value = Parser.parseStatement(j[1]);
      }
      if (j.length > 2) {
        var displayName = j[2];
        if (!isNaN(displayName)) {
          probability = j[2];
          displayName = j.name;
        }
        if (j.length > 3) {
          probability = parseFloat(j[2]);
          displayName = j[3];
        }
      } else {
        var displayName = j[0];
      }
      let random = Math.random();
      // Set the display name
      if (displayName === undefined) {
        var displayName = j[0];
      }
      // If we're lucky enough, add the new item
      if (random < probability) {
        return novelData.novel.inventories[novelData.novel.currentInventory].push({"name": j[0], "value": value, "displayName": displayName, "hidden": hidden});
      }
    }
  }
}

/* HANDLES LANGUAGE SETTINGS */

class LanguageManager {

  // Change the novel's language
  static setLanguage(name) {
    novelData.novel.settings.language = name;
    return UI.updateUILanguage();
  }

  // Get a string shown in UI in the current language
  static getUIString(name) {
    Util.checkFormat(name,'string');
    for (let j = 0; j < novelData.novel.uiText.length; j++) {
      let i = novelData.novel.uiText[j];
      if (i.name === name && i.language === novelData.novel.settings.language) {
        return Parser.parseText(i.content);
      }
    }
    console.error(`Error! UI string ${name} not found!`);
    return '[NOT FOUND]';
  }

  // Get the correct version of csv string
  static getCorrectLanguageCsvString(name) {
    Util.checkFormat(name,'string');
    if (novelData.csvData === undefined || novelData.csvEnabled === false) {
      console.error("Error! CSV data cannot be parsed, because Papa Parse can't be detected.");
      return '[NOT FOUND]';
    }
    for (let j = 0; j < novelData.csvData.length; j++) {
      let i = novelData.csvData[j];
      if (i.name === name) {
        if (i[novelData.novel.settings.language] === undefined) {
          if (i['english'] === undefined) {
            console.error(`Error! No CSV value by name ${name} could be found.`);
            return '[NOT FOUND]';
          }
          return Parser.parseText(i['english']);
        }
        return Parser.parseText(i[novelData.novel.settings.language]);
      }
    }
  }

  // Get an item's attribute in the correct language
  static getItemAttribute(item, type) {
    switch (type) {
      case 'displayName':
        if (item.displayName === '[csv]') {
          return this.getCorrectLanguageCsvString(item.name + '|displayName');
        } else {
          return this.getCorrectLanguageString(item.displayName);
        }
        break;
      case 'description':
        if (item.description === '[csv]') {
          return this.getCorrectLanguageCsvString(item.name + '|description');
        } else {
          return this.getCorrectLanguageString(item.description);
        }
        break;
      default:
        console.error('Error! Trying to get an invalid item attribute in LanguageManager.');
        return '[NOT FOUND]';
        break;
    }
  }

  // Get the string in the correct language
  static getCorrectLanguageString(obj, type) {
    Util.checkFormat(obj,'arrayOrString');
    if (typeof obj === "string") {
      return obj;
    }
    if (Object.prototype.toString.call(obj) === '[object Array]') {
      for (let j = 0; j < obj.length; j++) {
        let i = obj[j];
        if (i.language === novelData.novel.settings.language) {
          return i.content;
        }
      }
    }
  }
}

/* SAVING AND LOADING */

class NovelManager {

  // Load a browser cookie
  static loadCookie(cname) {
    let name = cname + '=';
    let ca = document.cookie.split(';');
    let i = 0;
    while (i < ca.length) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
      i++;
    }
  }

  // Save a browser cookie
  static saveCookie(cname, cvalue, exdays) {
    let d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = `expires=${d.toUTCString()}`;
    return document.cookie = cname + '=' + cvalue + '; ' + expires + '; path=/';
  }

  // Load the novel from a cookie or entered json
  static loadData(novel, changeScene) {
    if (changeScene === undefined) {
      changeScene = true;
    }
    if (novel === undefined) {
      if (this.loadCookie("gameData") !== '') {
        console.log("Cookie found!");
        let cookie = this.loadCookie("gameData");
        console.log("Cookie loaded");
        console.log(cookie);
        var loadedData = JSON.parse(atob(this.loadCookie("gameData")));
        return this.prepareLoadedData(loadedData, changeScene);
      }
    } else if (novel !== undefined && novel !== '') {
      var loadedData = JSON.parse(atob(novel));
      return this.prepareLoadedData(loadedData, changeScene);
    }
  }

  // Prepare the novel from the loaded save file
  static prepareLoadedData(loadedData, changeScene) {
    if (novelData.novel.name !== loadedData.name) {
      console.error("ERROR! novel name mismatch");
      return;
    }
    if (novelData.novel.version !== loadedData.version) {
      console.warn("WARNING! novel version mismatch");
    }
    novelData.novel.inventories = loadedData.inventories;
    novelData.debugMode = novelData.novel.debugMode;
    SoundManager.init();
    if (changeScene) {
      return SceneManager.updateScene(loadedData.currentScene,true);
    }
  }

  // Converts the novel's state into json and Base64 encode it
  static saveDataAsJson() {
    // Clone the game data
    let saveData = JSON.parse(JSON.stringify(novelData.novel));
    delete saveData.scenes;
    delete saveData.tagPresets;
    delete saveData.sounds;
    delete saveData.externalText;
    delete saveData.externalJson;
    let save = btoa(JSON.stringify(saveData));
    return save;
  }

  // Save novel in the defined way
  static saveData() {
    let save = this.saveDataAsJson();
    if (novelData.novel.settings.saveMode === "cookie") {
      return this.saveCookie("novelData",save,365);
    } else if (novelData.novel.settings.saveMode === "text") {
      return UI.showSaveNotification(save);
    }
  }

  // Add values to novel.json that are not defined but are required for Vue.js view updating and other functions
  static prepareData(json) {
    // Define variables
    json.currentScene = "";
    json.parsedChoices = "";
    if (json.currentInventory === undefined) {
      json.currentInventory = 0;
    }
    if (json.inventories === undefined) {
      json.inventories = [[]];
    }
    if (json.inventories.length === 0) {
      json.inventories[0] = [];
    }
    if (json.scenes === undefined) {
      json.scenes = [{}];
    }
    if (json.tagPresets === undefined) {
      json.tagPresets = [];
    }
    if (json.sounds === undefined) {
      json.sounds = [];
    }
    for (let k = 0; k < json.inventories.length; k++) {
      let i = json.inventories[k];
      for (let i1 = 0; i1 < i.length; i1++) {
        let j = i[i1];
        if (j.displayName === undefined) {
          j.displayName = j.name;
        }
      }
    }
    // Prepare scenes
    for (let j1 = 0; j1 < json.scenes.length; j1++) {
      let s = json.scenes[j1];
      s.combinedText = "";
      s.parsedText = "";
      s.visited = false;
      if (s.text === undefined) {
        console.warn(`WARNING! scene ${s.name} has no text`);
        s.text = "";
      }
      if (s.choices === undefined) {
        console.warn(`WARNING! scene ${s.name} has no choices`);
        s.choices = [];
      }
      for (let k1 = 0; k1 < s.choices.length; k1++) {
        let c = s.choices[k1];
        c.parsedText = "";
        if (c.alwaysShow === undefined) {
          c.alwaysShow = false;
        }
      }
    }
    // Set default settings
    if (json.settings === undefined) {
      json.settings = {};
    }
    if (json.settings.debugMode === undefined) {
      json.settings.debugMode = false;
    }
    if (json.settings.saveMode === undefined) {
      json.settings.saveMode = "text";
    }
    if (json.settings.language === undefined) {
      json.settings.language = "english";
    }
    if (json.settings.showSaveButtons === undefined) {
      json.settings.showSaveButtons = true;
    }
    if (json.settings.showSkipButton === undefined) {
      json.settings.showSkipButton = false;
    }
    if (json.settings.inventoryHidden === undefined) {
      json.settings.inventoryHidden = false;
    }
    if (json.settings.choicesHidden === undefined) {
      json.settings.choicesHidden = false;
    }
    if (json.settings.alwaysShowDisabledChoices === undefined) {
      json.settings.alwaysShowDisabledChoices = false;
    }
    if (json.settings.floatPrecision === undefined) {
      json.settings.floatPrecision = 5;
    }
    if (json.settings.scrollSettings === undefined) {
      json.settings.scrollSettings = {};
    }
    if (json.settings.scrollSettings.defaultScrollSpeed === undefined) {
      json.settings.scrollSettings.defaultScrollSpeed = 60;
    }
    if (json.settings.scrollSettings.revisitSkipEnabled === undefined) {
      json.settings.scrollSettings.revisitSkipEnabled = true;
    }
    if (json.settings.scrollSettings.textSkipEnabled === undefined) {
      json.settings.scrollSettings.textSkipEnabled = true;
    }
    if (json.settings.scrollSettings.skipWithKeyboard === undefined) {
      json.settings.scrollSettings.skipWithKeyboard = false;
    }
    if (json.settings.scrollSettings.continueWithKeyboard === undefined) {
      json.settings.scrollSettings.continueWithKeyboard = true;
    }
    if (json.settings.scrollSettings.fastScrollWithKeyboard === undefined) {
      json.settings.scrollSettings.fastScrollWithKeyboard = true;
    }
    if (json.settings.scrollSettings.fastScrollSpeedMultiplier === undefined) {
      json.settings.scrollSettings.fastScrollSpeedMultiplier = 20;
    }
    if (json.settings.scrollSettings.tickFreqThreshold === undefined) {
      json.settings.scrollSettings.tickFreqThreshold = 100;
    }
    if (json.settings.soundSettings === undefined) {
      json.settings.soundSettings = {};
    }
    if (json.settings.soundSettings.soundVolume === undefined) {
      json.settings.soundSettings.soundVolume = 0.5;
    }
    if (json.settings.soundSettings.musicVolume === undefined) {
      json.settings.soundSettings.musicVolume = 0.4;
    }
    // Set default UI language values
    if (json.uiText === undefined) {
      return json.uiText = JSON.parse([
        {"name": "saveText", "language": "english", "content": "Copy and save your save data:" },
        {"name": "loadText", "language": "english", "content": "Paste your save data here:" },
        {"name": "closeButton", "language": "english", "content": "Close" },
        {"name": "copyButton", "language": "english", "content": "Copy" },
        {"name": "saveButton", "language": "english", "content": "Save" },
        {"name": "loadButton", "language": "english", "content": "Load" },
        {"name": "loadDataButton", "language": "english", "content": "Load" },
        {"name": "skipButton", "language": "english", "content": "Skip" },
        {"name": "continueButton", "language": "english", "content": "Continue" },
        {"name": "inventoryTitle", "language": "english", "content": "Inventory:" },
        {"name": "hiddenInventoryTitle", "language": "english", "content": "Stats:" }
      ]);
    }
    return json;
  }

  // Start the novel by loading the default novel.json
  static start() {
    console.log("-- Starting Novel.js... --");
    this.getNovelName();
    this.loadMainJson();
  }

  // Figure out the novel folder name
  static getNovelName() {
    let n = document.getElementsByTagName('novel')[0];
    if (!n) {
      n = document.getElementById('novel-area');
    }
    novelPath = n.getAttribute('src');
    if (!novelPath) {
      novelPath = './novel';
    }
  }

  // Load the main json
  static loadMainJson() {
    console.log("Loading main json...");
    let request = new XMLHttpRequest();
    request.open('GET', novelPath + '/novel.json', true);
    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        let json = JSON.parse(request.responseText);
        return NovelManager.loadExternalJson(json);
      }
    };
    request.onerror = function() {

    };
    request.send();
    return UI.showContinueButton(false);
  }

  // Load external json
  static loadExternalJson(json) {
    console.log("Loading external json files...");
    if (json.externalJson === undefined) {
      NovelManager.includeJsons(json,json);
      NovelManager.loadExternalText(json);
      return;
    }
    if (json.externalJson.length === 0) {
      NovelManager.includeJsons(json,json);
      NovelManager.loadExternalText(json);
      return;
    }
    let ready = 0;
    return json.externalJson.map((s) =>
      (function(s) {
        let request = new XMLHttpRequest();
        request.open('GET', novelPath + '/json/' + s.file, true);
        request.onload = function() {
          if (request.status >= 200 && request.status < 400) {
            s.content = JSON.parse(request.responseText);
            ready++;
            if (ready === json.externalJson.length) {
              NovelManager.includeJsons(json,json);
              return NovelManager.loadExternalText(json);
            }
          }
        };
        request.onerror = function() {

        };
        return request.send();
      })(s));
  }

  // Combine other json objects with the main json
  static includeJsons(root,object) {
    if (root.externalJson === undefined) {
      return;
    }
    for (let x in object) {
      if (typeof object[x] === 'object') {
        this.includeJsons(root,object[x]);
      }
      if (object[x].include !== undefined) {
        for (let j = 0; j < root.externalJson.length; j++) {
          let i = root.externalJson[j];
          if (i.name === object[x].include) {
            object[x] = i.content;
            this.includeJsons(root,object[x]);
            break;
          }
        }
      }
    }
  }

  // Load external text files
  static loadExternalText(json) {
    console.log("Loading external text files...");
    if (json.externalText === undefined) {
      NovelManager.loadExternalCsv(json);
      return;
    }
    if (json.externalText.length === 0) {
      NovelManager.loadExternalCsv(json);
      return;
    }
    let ready = 0;
    return json.externalText.map((s) =>
      (function(s) {
        let request = new XMLHttpRequest();
        request.open('GET', novelPath + '/texts/' + s.file, true);
        request.onload = function() {
          if (request.status >= 200 && request.status < 400) {
            s.content = request.responseText;
            ready++;
            if (ready === json.externalText.length) {
              return NovelManager.loadExternalCsv(json);
            }
          }
        };
        request.onerror = function() {

        };
        return request.send();
      })(s));
  }

  // Load external CSV files
  static loadExternalCsv(json) {
    if (novelData.csvEnabled) {
      console.log("Loading external CSV files...");
      if (json.externalText === undefined) {
        NovelManager.prepareLoadedJson(json);
        return;
      }
      if (json.externalText.length === 0) {
        NovelManager.prepareLoadedJson(json);
        return;
      }
      let ready = 0;
      for (let i = 0; i < json.externalCsv.length; i++) {
        let s = json.externalCsv[i];
        Papa.parse(novelPath + '/csv/' + s.file, {
          download: true,
          header: true,
          comments: '#',
          complete(results) {
            if (novelData.csvData === undefined) {
              novelData.csvData = results.data;
            } else {
              novelData.csvData = Util.mergeObjArrays(novelData.csvData,results.data);
            }
            ready++;
            if (ready === json.externalCsv.length) {
              return NovelManager.prepareLoadedJson(json);
            }
          }
        });
      }
    } else {
      return NovelManager.prepareLoadedJson(json);
    }
  }

  // Prepare loaded json data
  static prepareLoadedJson(json) {
    json = this.prepareData(json);
    novelData.novel = json;
    novelData.debugMode = novelData.novel.settings.debugMode;
    SoundManager.init();
    UI.init();
    novelData.novel.currentScene = SceneManager.changeScene(novelData.novel.scenes[0].name);
    novelData.status = "Ready";
    if (novelData.debugMode) {
      console.log(novelData);
    }
    return console.log("-- Loading Novel.js complete! --");
  }
}

/* PARSERS */

class Parser {

  // Select a random scene or choice from a list separated by |, takes string
  static selectRandomOption(name) {
    Util.checkFormat(name,'string');
    let separate = name.split("|");
    if (separate.length === 1) {
      return separate[0];
    }
    let parsed = [];
    for (let j = 0; j < separate.length; j++) {
      let i = separate[j];
      i = i.split(",");
      parsed.push(i);
    }
    parsed = this.chooseRandomly(parsed);
    return parsed;
  }

  // Select a scene or choice randomly from multiple scenes with different probabilities, takes array
  static chooseRandomly(options) {
    let names = [];
    let chances = [];
    let rawChances = [];
    let previous = 0;
    for (let j = 0; j < options.length; j++) {
      var i = options[j];
      names.push(i[0]);
      previous = parseFloat(i[1])+previous;
      chances.push(previous);
      rawChances.push(parseFloat(i[1]));
    }
    let totalChance = 0;
    for (let k = 0; k < rawChances.length; k++) {
      var i = rawChances[k];
      totalChance = totalChance + parseFloat(i);
    }
    if (totalChance !== 1) {
      console.error("ERROR: Invalid scene or choice odds (should add up to exactly 1)!");
    }
    let value = Math.random();
    let nameIndex = 0;
    for (let i1 = 0; i1 < chances.length; i1++) {
      var i = chances[i1];
      if (value < i) {
        return names[nameIndex];
      }
      nameIndex++;
    }
  }

  // Parse a string of items and output an array
  static parseItems(items) {
    Util.checkFormat(items,'string');
    if (items === "") {
      return undefined;
    }
    let separate = items.split("|");
    let parsed = [];
    for (let j = 0; j < separate.length; j++) {
      let i = separate[j];
      i = i.split(",");
      parsed.push(i);
    }
    return parsed;
  }

  // Parse a text for Novel.js tags, and replace them with the correct HTML tags.
  static parseText(text) {
    if (text !== undefined) {
      Util.checkFormat(text,'string');
      if (!Util.validateTagParentheses(text)) {
        console.error("ERROR: Invalid tags in text");
      }
      // External files
      let splitText = text.split("[file ");
      let iterable = __range__(1, splitText.length, true);
      for (let j = 0; j < iterable.length; j++) {
        var index = iterable[j];
        let name = "";
        if (splitText[index]) {
          let iterable1 = splitText[index].split('');
          for (let k = 0; k < iterable1.length; k++) {
            var i = iterable1[k];
            if (i !== ']') {
              name = name + i;
            } else {
              break;
            }
          }
        }
        // Clean spaces
        name = name.replace(/\s+/g, '');
        // If name detected
        if (name !== "") {
          let newText = null;
          // Find external text by name
          for (let i1 = 0; i1 < novelData.novel.externalText.length; i1++) {
            var i = novelData.novel.externalText[i1];
            if (i.name === name) {
              newText = i.content;
              break;
            }
          }
          // If not found from files, get from CSV data
          if (newText === null) {
            newText = LanguageManager.getCorrectLanguageCsvString(name);
          }
          // Replace the text
          if (newText !== null) {
            text = text.split(`[file ${name}]`).join(newText);
          }
        }
      }
      // [p] tags
      for (let j1 = 0; j1 < novelData.novel.tagPresets.length; j1++) {
        var i = novelData.novel.tagPresets[j1];
        let tagName = `[p ${i.name}]`;
        if (text.indexOf(tagName) > -1) {
          text = text.split(tagName).join(i.start);
        }
        tagName = `[/p ${i.name}]`;
        if (text.indexOf(tagName) > -1) {
          text = text.split(tagName).join(i.end);
        }
      }
      // [s] tags
      for (let i = 0; i < 100; i++) {
        text = text.split(`[s${i}]`).join(`<span class="highlight-${i}">`);
      }
      text = text.split("[/s]").join("</span>");
      // Ignore /[ and /]
      text = text.replace(/\/\[/g, "OPEN_BRACKET_REPLACEMENT").replace(/\/\]/g, "CLOSE_BRACKET_REPLACEMENT");
      splitText = text.split(/\[|\]/);
      var index = 0;
      for (let i2 = 0; i2 < splitText.length; i2++) {
        var s = splitText[i2];
        splitText[index] = s.replace(/OPEN_BRACKET_REPLACEMENT/g,"[").replace(/CLOSE_BRACKET_REPLACEMENT/g,"]");
        index++;
      }
      // Other tags
      let spansToBeClosed = 0;
      let asToBeClosed = 0;
      index = 0;
      let iterable3 = __range__(0, splitText.length-1, true);
      for (let j2 = 0; j2 < iterable3.length; j2++) {
        index = iterable3[j2];
        var s = splitText[index];
        // [if] statements
        if (s.substring(0,2) === "if") {
          var parsed = s.split("if ");
          if (!this.parseStatement(parsed[1])) {
            splitText[index] = "<span style=\"display:none;\">";
            spansToBeClosed++;
          } else {
            splitText[index] = "";
          }
        // Endif
        } else if (s.substring(0,3) === "/if") {
          if (spansToBeClosed > 0) {
            splitText[index] = "</span>";
            spansToBeClosed--;
          } else {
            splitText[index] = "";
          }
        // Printed inventory counts
        } else if (s.substring(0,4) === "inv.") {
          let value = s.substring(4,s.length);
          splitText[index] = 0;
          for (let k2 = 0; k2 < novelData.novel.inventories[novelData.novel.currentInventory].length; k2++) {
            var i = novelData.novel.inventories[novelData.novel.currentInventory][k2];
            if (i.name === value) {
              splitText[index] = i.value;
            }
          }
        // Generic print command
        } else if (s.substring(0,5) === "print") {
          var parsed = s.split("print ");
          parsed = this.parseStatement(parsed[1]);
          if (!isNaN(parseFloat(parsed))) {
            parsed = parseFloat(parsed.toFixed(novelData.novel.settings.floatPrecision));
          }
          splitText[index] = parsed;
        // Execute JavaScript
        } else if (s.substring(0,4) === "exec") {
          var parsed = s.substring(5,s.length);
          let p = novelData.parsedJavascriptCommands.push(parsed);
          p--;
          splitText[index] = `<span class="execute-command com-${p}"></span>`;
        // Pause
        } else if (s.substring(0,5) === "pause") {
          var parsed = s.substring(6,s.length);
          splitText[index] = `<span class="pause ${parsed}"></span>`;
        // Play sound
        } else if (s.substring(0,5) === "sound") {
          var parsed = s.split("sound ");
          splitText[index] = `<span class="play-sound ${parsed[1]}"></span>`;
        // Stop music
        } else if (s.substring(0,6) === "/music") {
          var parsed = s.split("/music ");
          splitText[index] = `<span class="stop-music ${parsed[1]}"></span>`;
        // Play music
        } else if (s.substring(0,5) === "music") {
          var parsed = s.split("music ");
          splitText[index] = `<span class="play-music ${parsed[1]}"></span>`;
        // Reset text speed
        } else if (s.substring(0,6) === "/speed") {
          splitText[index] = "<span class=\"default-speed\"></span>";
        // Change speed
        } else if (s.substring(0,5) === "speed") {
          var parsed = s.split("speed ");
          splitText[index] = `<span class="set-speed ${parsed[1]}"></span>`;
        // Reset scroll sound
        } else if (s.substring(0,12) === "/scrollSound") {
          splitText[index] = "<span class=\"default-scroll-sound\"></span>";
        // Scroll sound
        } else if (s.substring(0,11) === "scrollSound") {
          var parsed = s.split("scrollSound ");
          let p = novelData.parsedScrollsounds.push(parsed);
          p--;
          splitText[index] = `<span class="set-scroll-sound s-${p}"></span>`;
        // Input field
        } else if (s.substring(0,5) === "input") {
          var parsed = s.split("input ");
          let nameText = "";
          for (let i3 = 0; i3 < novelData.novel.inventories[novelData.novel.currentInventory].length; i3++) {
            var i = novelData.novel.inventories[novelData.novel.currentInventory][i3];
            if (i.name === parsed[1]) {
              nameText = i.value;
            }
          }
          splitText[index] = `<input type="text" value="${nameText}" name="input" class="input-${parsed[1]}" onblur="UI.updateInputs(true)">`;
        // Embedded choice
        } else if (s.substring(0,6) === "choice") {
          var parsed = s.split("choice ");
          splitText[index] = `<a href="#" onclick="SceneManager.selectChoiceByNameByClicking(event,'${parsed[1]}')">`;
          asToBeClosed++;
        // Choice end
        } else if (s.substring(0,7) === "/choice") {
          if (asToBeClosed > 0) {
            splitText[index] = "</a>";
            asToBeClosed--;
          } else {
            splitText[index] = "";
          }
        }
        index++;
      }
      // Join all back into a string
      text = splitText.join("");
      //if novelData.markdownEnabled
      //  text = marked(text)
      return text;
    }
  }

  // Parse a statement that returns true or false or calculate a value
  static parseStatement(s) {
    if (s === undefined) {
      return undefined;
    }
    s = s.toString();
    Util.checkFormat(s,'string');
    // Check for valid parentheses
    if (!Util.validateParentheses(s)) {
      console.error("ERROR: Invalid parentheses in statement");
    }
    // Clean spaces
    s = s.replace(/\s+/g, '');
    // Remove all operators and parentheses
    let parsedString = s.split(/\(|\)|\+|\*|\-|\/|<=|>=|<|>|==|!=|\|\||&&/);
    let parsedValues = [];
    // Parse the strings for known prefixes, and parse the values based on that.
    for (let j = 0; j < parsedString.length; j++) {
      let val = parsedString[j];
      let type = this.getStatementType(val);
      switch (type) {
        // Parse item
        case "item":
          let found = false;
          for (let k = 0; k < novelData.novel.inventories[novelData.novel.currentInventory].length; k++) {
            var i = novelData.novel.inventories[novelData.novel.currentInventory][k];
            if (i.name === val.substring(4,val.length)) {
              parsedValues.push(i.value);
              found = true;
            }
          }
          if (!found) {
            parsedValues.push(0);
          }
          break;
        // Generate a random value
        case "rand":
          val = val.split(".");
          let vals = val[1].split(",");
          let plus = true;
          if (vals[0].substring(0,5) === "minus") {
            vals[0] = vals[0].substring(5,vals[0].length);
            plus = false;
          }
          if (vals[1].substring(0,5) === "minus") {
            vals[1] = vals[1].substring(5,vals[1].length);
            plus = false;
          }
          if (plus) {
            var result = (Math.random()*vals[1]) + vals[0];
          } else {
            var result = (Math.random()*vals[1]) - vals[0];
          }
          if (vals[2] === undefined) {
            vals[2] = 0;
          }
          if (vals[2] === 0) {
            var result = Math.round(result);
          } else {
            var result = parseFloat(result).toFixed(vals[2]);
          }
          parsedValues.push(result);
          break;
        // Parse variable
        case "var":
          val = this.findValue(val.substring(4,val.length),true);
          if (!isNaN(parseFloat(val))) {
            val = parseFloat(val).toFixed(novelData.novel.settings.floatPrecision);
          } else {
            val = `'${val}'`;
          }
          parsedValues.push(val);
          break;
        // Parse float
        case "float":
          parsedValues.push(parseFloat(val).toFixed(novelData.novel.settings.floatPrecision));
          break;
        // Parse int
        case "int":
          parsedValues.push(parseInt(val));
          break;
        // Parse string
        case "string":
          if (val !== "") {
            parsedValues.push(`'${val}'`);
          } else {
            parsedValues.push("");
          }
          break;
      }
    }
    // Replace all variables with their correct values
    let iterable = __range__(0, parsedString.length-1, true);
    for (let i1 = 0; i1 < iterable.length; i1++) {
      var i = iterable[i1];
      if (parsedString[i] !== "" && parsedValues[i] !== "") {
        s = s.replace(new RegExp(parsedString[i],'g'),parsedValues[i]);
        s = s.replace(new RegExp("''",'g'),"'"); // Remove double-':s caused by string parsing
      }
    }
    // Solve or calculate the statement
    let returnVal = eval(s);
    // Fix booleans
    if (returnVal === "true") {
      returnVal = true;
    }
    if (returnVal === "false") {
      returnVal = false;
    }
    // Return the actual result
    return returnVal;
  }

  // Read a string's beginning to detect its type
  static getStatementType(val) {
    let type = null;
    if (val.substring(0,4) === "inv.") {
      type = "item";
    } else if (val.substring(0,4) === "var.") {
      type = "var";
    } else if (val.substring(0,5) === "rand.") {
      type = "rand";
    } else if (!isNaN(parseFloat(val)) && val.toString().indexOf(".") === -1) {
      type = "int";
    } else if (!isNaN(parseFloat(val)) && val.toString().indexOf(".") !== -1) {
      type = "float";
    } else {
      type = "string";
    }
    return type;
  }

  // Find a value from the game novelData json
  // toPrint is true returns the value, toPrint is false returns the object
  static findValue(parsed, toPrint) {
    let splitted = parsed.split(",");
    // Find the first object in hierarchy
    if (!toPrint) {
      if (splitted.length > 1) {
        var variable = this.findValueByName(novelData.novel,splitted[0])[0];
      } else {
        var variable = this.findValueByName(novelData.novel,splitted[0])[1];
      }
    } else {
      var variable = this.findValueByName(novelData.novel,splitted[0])[0];
    }
    // Follow the path
    let iterable = __range__(0, splitted.length - 1, true);
    for (let j = 0; j < iterable.length; j++) {
      let i = iterable[j];
      if (Util.isOdd(i)) {
        var variable = variable[parseInt(splitted[i])];
      } else if (i !== 0) {
        if (!toPrint) {
          var variable = this.findValueByName(variable,splitted[i])[1];
        } else {
          if (splitted[i] === "parsedText" || splitted[i] === "text") {
            splitted[i] = "parsedText";
            variable.parsedText = this.parseText(variable.text);
          }
          var variable = this.findValueByName(variable,splitted[i])[0];
        }
      }
    }
    if (variable === undefined) {
      console.warn("WARNING: Searched value not found.");
    }
    return variable;
  }

  // Find an object from the object hierarchy by string name
  static findValueByName(obj, string) {
    Util.checkFormat(string,'string');
    let parts = string.split('.');
    let newObj = obj[parts[0]];
    if (parts[1]) {
      parts.splice(0, 1);
      let newString = parts.join('.');
      return this.findValueByName(newObj, newString);
    }
    let r = [];
    r[0] = newObj;
    r[1] = obj;
    return r;
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

/* SOUNDS */

// A class for sound functions
class SoundManager {

  // Load all sounds
  static init() {
    let index = 0;
    for (let i = 0; i < novelData.novel.sounds.length; i++) {
      let s = novelData.novel.sounds[i];
      s.sound = new Audio(novelPath+'/sounds/'+s.file);
      index++;
    }
  }

  // Play the default sound for clicking an item
  static playDefaultClickSound(name,clicked) {
    return this.playSound(novelData.novel.settings.soundSettings.defaultClickSound,false);
  }

  // Play a sound by name
  static playSound(name, isMusic) {
    if (name === undefined) {
      return;
    }
    name = Parser.selectRandomOption(name);
    for (let i = 0; i < novelData.novel.sounds.length; i++) {
      let s = novelData.novel.sounds[i];
      if (s.name === name) {
        let { sound } = s;
        if (isMusic) {
          sound.volume = novelData.novel.settings.soundSettings.musicVolume;
        } else {
          sound.volume = novelData.novel.settings.soundSettings.soundVolume;
        }
        sound.play();
        return sound;
      }
    }
  }

  // Is music playing?
  static isPlaying(name) {
    for (let j = 0; j < novelData.music.length; j++) {
      let i = novelData.music[j];
      if (i.paused) {
        return false;
      } else {
        return true;
      }
    }
  }

  // Start music
  static startMusic(name) {
    for (let i = 0; i < novelData.music.length; i++) {
      let m = novelData.music[i];
      if (m.name === name) {
        return;
      }
    }
    let music = this.playSound(name,true);
    if (music === undefined) {
      return;
    }
    music.addEventListener('ended', (function() {
      this.currentTime = 0;
      this.play();
    }), false);
    return novelData.music.push({"name":name,"music":music});
  }

  // Stop a music that was started previously
  static stopMusic(name) {
    for (let j = 0; j < novelData.music.length; j++) {
      let i = novelData.music[j];
      if (name === i.name) {
        i.music.pause();
        let index = novelData.music.indexOf(i);
        novelData.music.splice(index,1);
      }
    }
  }
}

/* TEXT PRINTING (letter by letter etc.) */

class TextPrinter {

  // Print a scene's text - noBuffers prevents buffers from replaying when scene is not changed
  static printText(text, noBuffers) {
    novelData.printer.printCompleted = false;
    novelData.printer.currentText = "";
    UI.updateText(novelData.printer.currentText);
    // Disable the skip button
    UI.disableSkipButton();
    // Hide the continue button
    UI.showContinueButton(false);
    novelData.printer.fullText = text;
    //console.log fullText
    novelData.printer.currentOffset = -1;
    novelData.printer.soundBuffer = [];
    novelData.printer.musicBuffer = [];
    novelData.printer.stopMusicBuffer = [];
    novelData.printer.executeBuffer = [];
    novelData.printer.buffersExecuted = false;
    if (noBuffers) {
      novelData.printer.buffersExecuted = true;
    }
    novelData.printer.defaultInterval = novelData.novel.currentScene.scrollSpeed;
    this.setTickSoundFrequency(novelData.printer.defaultInterval);
    if (novelData.novel.currentScene.visited && novelData.novel.currentScene.revisitSkipEnabled) {
      this.complete();
      return;
    }
    return setTimeout(this.onTick(),novelData.printer.defaultInterval);
  }

  // Try to skip text, if allowed
  static trySkip() {
    if (novelData.novel.currentScene.skipEnabled) {
      this.complete();
    }
  }

  // Instantly show all text
  static complete() {
    novelData.printer.printCompleted = true;
    novelData.printer.currentOffset = 0;
    // Re-enable skip button
    UI.enableSkipButton();
    // Play missed sounds and start missed music
    this.executeBuffers();
    // Set printed text and update choices
    novelData.printer.currentText = novelData.printer.fullText;
    UI.updateText(novelData.printer.currentText);
    UI.updateChoices();
  }

  static executeBuffers() {
    if (!novelData.printer.buffersExecuted) {
      let ss = [];
      let first = true;
      // Play missed sounds
      if (novelData.printer.fullText.indexOf("play-sound") > -1) {
        var s = novelData.printer.fullText.split("play-sound ");
        for (let j = 0; j < s.length; j++) {
          var i = s[j];
          if (!first) {
            ss.push(i.split(/\s|\"/)[0]);
          }
          first = false;
        }
      }
      if (ss.length > 0) {
        let iterable = __range__(0, ss.length, true);
        for (let k = 0; k < iterable.length; k++) {
          var i = iterable[k];
          if (!(__in__(ss[i], novelData.printer.soundBuffer))) {
            SoundManager.playSound(Parser.parseStatement(ss[i]));
          }
        }
      }
      ss = [];
      first = true;
      // Play missed music
      if (novelData.printer.fullText.indexOf("play-music") > -1) {
        var s = novelData.printer.fullText.split("play-music ");
        for (let i1 = 0; i1 < s.length; i1++) {
          var i = s[i1];
          if (!first) {
            ss.push(i.split(/\s|\"/)[0]);
          }
          first = false;
        }
      }
      if (ss.length > 0) {
        let iterable1 = __range__(0, ss.length, true);
        for (let j1 = 0; j1 < iterable1.length; j1++) {
          var i = iterable1[j1];
          if (!(__in__(ss[i], novelData.printer.musicBuffer))) {
            SoundManager.startMusic(Parser.parseStatement(ss[i]));
          }
        }
      }
      ss = [];
      first = true;
      // Stop missed music
      if (novelData.printer.fullText.indexOf("stop-music") > -1) {
        var s = novelData.printer.fullText.split("stop-music ");
        for (let k1 = 0; k1 < s.length; k1++) {
          var i = s[k1];
          if (!first) {
            ss.push(i.split(/\s|\"/)[0]);
          }
          first = false;
        }
      }
      if (ss.length > 0) {
        let iterable2 = __range__(0, ss.length, true);
        for (let i2 = 0; i2 < iterable2.length; i2++) {
          var i = iterable2[i2];
          if (!(__in__(ss[i], novelData.printer.stopMusicBuffer))) {
            SoundManager.stopMusic(Parser.parseStatement(ss[i]));
          }
        }
      }
      ss = [];
      first = true;
      // Execute missed commands
      if (novelData.printer.fullText.indexOf("execute-command") > -1) {
        var s = novelData.printer.fullText.split("execute-command ");
        for (let j2 = 0; j2 < s.length; j2++) {
          var i = s[j2];
          if (!first) {
            ss.push(i.split(/\s|\"/)[0]);
          }
          first = false;
        }
      }
      if (ss.length > 0) {
        let iterable3 = __range__(0, ss.length, true);
        for (let k2 = 0; k2 < iterable3.length; k2++) {
          var i = iterable3[k2];
          if (!(__in__(ss[i], novelData.printer.executeBuffer)) && ss[i] !== undefined) {
            eval(novelData.parsedJavascriptCommands[parseInt(ss[i].substring(4,ss[i].length))]);
          }
        }
      }
      novelData.printer.buffersExecuted = true;
    }
  }

  // Stop pause
  static unpause() {
    UI.showContinueButton(false);
    if (novelData.printer.pause === "input") {
      novelData.printer.pause = 0;
    }
  }

  // Fast text scrolling
  static fastScroll() {
    if (novelData.novel.currentScene.skipEnabled) {
      novelData.printer.tickSpeedMultiplier = novelData.novel.settings.scrollSettings.fastScrollSpeedMultiplier;
    }
  }

  // Stop fast text scrolling
  static stopFastScroll() {
    novelData.printer.tickSpeedMultiplier = 1;
  }

  // Set how frequently the scrolling sound is played
  static setTickSoundFrequency(freq) {
    let threshold = novelData.novel.settings.scrollSettings.tickFreqThreshold;
    novelData.printer.tickSoundFrequency = 1;
    if (freq <= (threshold * 2)) {
      novelData.printer.tickSoundFrequency = 2;
    }
    if (freq <= (threshold)) {
      novelData.printer.tickSoundFrequency = 3;
    }
  }

  // Show a new letter
  static onTick() {
    // Do not continue if paused
    if (novelData.printer.pause !== "input" && novelData.printer.pause > 0) {
      novelData.printer.pause--;
    }
    // Continue if not paused
    if (novelData.printer.pause === 0) {
      if (!novelData.printer.speedMod) {
        novelData.printer.interval = novelData.printer.defaultInterval;
      }
      // Instantly finish if interval is 0
      if (novelData.printer.defaultInterval === 0) {
        this.complete();
        return;
      }
      // Return if all text is printed
      if (novelData.printer.currentText === novelData.printer.fullText) {
        return;
      }
      // Parse tags
      let offsetChanged = false;
      while (novelData.printer.fullText[novelData.printer.currentOffset] === ' ' || novelData.printer.fullText[novelData.printer.currentOffset] === '<' || novelData.printer.fullText[novelData.printer.currentOffset] === '>') {
        this.readTags();
      }
      // Move forward
      novelData.printer.currentText = novelData.printer.fullText.substring(0, novelData.printer.currentOffset);
      UI.updateText(novelData.printer.currentText);
      if (!offsetChanged) {
        novelData.printer.currentOffset++;
      }
      // Complete if printing finished
      if (novelData.printer.currentOffset >= novelData.printer.fullText.length) {
        this.complete();
        return;
      }
      // Play tick sounds
      novelData.printer.tickCounter++;
      if (novelData.printer.tickCounter >= novelData.printer.tickSoundFrequency) {
        if (novelData.printer.scrollSound !== "none" && novelData.printer.interval !== 0) {
          if (novelData.printer.scrollSound !== null) {
            SoundManager.playSound(novelData.printer.scrollSound);
          } else if (novelData.novel.currentScene.scrollSound !== undefined) {
            SoundManager.playSound(novelData.novel.currentScene.scrollSound);
          }
          novelData.printer.tickCounter = 0;
        }
      }
    }
    // Set the tick sound frequency
    this.setTickSoundFrequency(novelData.printer.interval / novelData.printer.tickSpeedMultiplier);
    // Set the timeout until the next tick
    return setTimeout((function() {
      TextPrinter.onTick();
    }), novelData.printer.interval / novelData.printer.tickSpeedMultiplier);
  }

  // Skip chars that are not printed, and parse tags
  static readTags() {
    // Skip spaces and tag enders
    if (novelData.printer.fullText[novelData.printer.currentOffset] === ' ') {
      novelData.printer.currentOffset++;
    }
    if (novelData.printer.fullText[novelData.printer.currentOffset] === '>') {
      novelData.printer.currentOffset++;
    }
    // Tag starter found, start reading
    if (novelData.printer.fullText[novelData.printer.currentOffset] === '<') {
      let i = novelData.printer.currentOffset;
      let str = "";
      i++;
      // Read the tag
      while (novelData.printer.fullText[i-1] !== '>' && novelData.printer.fullText[i] !== '<') {
        str = str + novelData.printer.fullText[i];
        i++;
      }
      str = str.substring(1,str.length);
      // Do not print hidden text
      if (str.indexOf("display:none;") > -1) {
        let disp = "";
        let spans = 1;
        while (true) {
          i++;
          disp = disp + novelData.printer.fullText[i];
          if (disp.indexOf("/span") !== -1) {
            spans--;
            disp = "";
          } else if (disp.indexOf("span") !== -1) {
            spans++;
            disp = "";
          }
          if (spans === 0) {
            break;
          }
        }
        i++;
      }
      // Buffering of hidden commands
      this.bufferHidden(str);
      // Executing of non-hidden commands
      this.bufferNonHidden(str);
      novelData.printer.currentOffset = i;
      novelData.printer.offsetChanged = true;
    }
  }

  // Parse hidden tags
  static bufferHidden(str) {
    // Sound playing
    if (str.indexOf("play-sound") > -1 && str.indexOf("display:none;") > -1) {
      var s = str.split("play-sound ");
      s = s[1].split(/\s|\"/)[0];
      novelData.printer.soundBuffer.push(Parser.parseStatement(s));
    }
    // Music playing
    if (str.indexOf("play-music") > -1 && str.indexOf("display:none;") > -1) {
      var s = str.split("play-music ");
      s = s[1].split(/\s|\"/)[0];
      novelData.printer.musicBuffer.push(Parser.parseStatement(s));
    }
    // Music stopping
    if (str.indexOf("stop-music") > -1 && str.indexOf("display:none;") > -1) {
      var s = str.split("stop-music ");
      s = s[1].split(/\s|\"/)[0];
      novelData.printer.stopMusicBuffer.push(Parser.parseStatement(s));
    }
    // Command executing
    if (str.indexOf("execute-command") > -1 && str.indexOf("display:none;") > -1) {
      var s = str.split("execute-command ");
      s = s[1].split(/\s|\"/)[0];
      return novelData.printer.executeBuffer.push(Parser.parseStatement(s));
    }
  }

  // Parse visible tags
  static bufferNonHidden(str) {
    if (str.indexOf("display:none;") === -1) {
      // Sound playing
      if (str.indexOf("play-sound") > -1) {
        var s = str.split("play-sound ");
        s = s[1].split(/\s|\"/)[0];
        novelData.printer.soundBuffer.push(Parser.parseStatement(s));
        SoundManager.playSound(Parser.parseStatement(s));
      }
      // Music playing
      if (str.indexOf("play-music") > -1) {
        var s = str.split("play-music ");
        s = s[1].split(/\s|\"/)[0];
        novelData.printer.musicBuffer.push(Parser.parseStatement(s));
        SoundManager.startMusic(Parser.parseStatement(s));
      }
      // Music stopping
      if (str.indexOf("stop-music") > -1) {
        var s = str.split("stop-music ");
        s = s[1].split(/\s|\"/)[0];
        novelData.printer.stopMusicBuffer.push(Parser.parseStatement(s));
        SoundManager.stopMusic(Parser.parseStatement(s));
      }
      // Pausing
      if (str.indexOf("pause") > -1) {
        var s = str.split("pause ");
        s = s[1].split(/\s|\"/)[0];
        novelData.printer.pause = s;
        if (novelData.printer.pause === "input") {
          UI.showContinueButton(true);
        }
      }
      // Command executing
      if (str.indexOf("execute-command") > -1) {
        var s = str.split("execute-command ");
        s = s[1].split(/\s|\"/)[0];
        novelData.printer.executeBuffer.push(s);
        if (s !== undefined) {
          eval(novelData.parsedJavascriptCommands[parseInt(s.substring(4,s.length))]);
        }
      }
      // Speed setting
      if (str.indexOf("set-speed") > -1) {
        var s = str.split("set-speed ");
        s = s[1].split(/\s|\"/)[0];
        novelData.printer.interval = Parser.parseStatement(s);
        novelData.printer.speedMod = true;
      }
      // Speed resetting
      if (str.indexOf("default-speed") > -1) {
        novelData.printer.interval = novelData.printer.defaultInterval;
        novelData.printer.speedMod = false;
      }
      // Scroll sound setting
      if (str.indexOf("set-scroll-sound") > -1) {
        var s = str.split("set-scroll-sound ");
        s = s[1].split(/\s|\"/)[0];
        novelData.printer.scrollSound = Parser.selectRandomOption(novelData.parsedScrollsounds[parseInt(s.substring(2,s.length))][1]);
        console.log(novelData.printer.scrollSound + " ---")
      }
      // Scroll sound resetting
      if (str.indexOf("default-scroll-sound") > -1) {
        return novelData.printer.scrollSound = undefined;
      }
    }
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
function __in__(needle, haystack) {
  return haystack.indexOf(needle) >= 0;
}

/* UI SCRIPTS */

class UI {

  static init() {
    let n = document.getElementsByTagName('novel')[0];
    if (!n) {
      n = document.getElementById('novel-area');
    }
    if (n) {
      let d = document.createElement('div');
      d.id = "novel-area";
      d.innerHTML = `<div id="novel-style-area">
        <div id="novel-notification-wrapper">
          <div id="novel-save-notification" class="novel-notification">
            <p class="novel-save-text"></p>
            <p><textarea name="save-text" readonly></textarea></p>
            <p><button type="button" class="novel-close-button" onclick="UI.closeSaveNotification()"></button><button type="button" class="novel-copy-button" onclick="UI.copyText()"></button></p>
          </div>
          <div id="novel-load-notification" class="novel-notification">
            <p class="novel-load-text"></p>
            <p><textarea name="load-text"></textarea></p>
            <p><button type="button" class="novel-close-button" onclick="UI.closeLoadNotification(false)"></button><button type="button" class="novel-load-data-button" onclick="UI.closeLoadNotification(true)"></button></p>
          </div>
        </div>
        <div id="novel-text-area">
          <div id="novel-text"></div>
          <button type="button" class="novel-skip-button" onclick="TextPrinter.complete()"></button>
          <button type="button" class="novel-continue-button" onclick="TextPrinter.unpause()"></button>
        </div>
        <div id="novel-choices-area">
          <ul id="novel-choice-list"></ul>
        </div>
        <div id="novel-inventory-area">
          <h5 class="novel-inventory-title"></h5>
          <ul id="novel-inventory"></ul>
        </div>
        <div id="novel-hidden-inventory-area">
          <h5 class="novel-hidden-inventory-title"></h5>
          <ul id="novel-hidden-inventory"></ul>
        </div>
        <div id="novel-save-area">
          <button type="button" class="novel-save-button" onclick="NovelManager.saveData()"></button>
          <button type="button" class="novel-load-button" onclick="UI.showLoadNotification()"></button>
        </div>
      </div>`;
      n.parentNode.insertBefore(d, n);
      n.parentNode.removeChild(n);
      this.updateUILanguage();
      return;
    }
  }

  static updateUILanguage() {
    document.getElementsByClassName("novel-save-text")[0].innerHTML = LanguageManager.getUIString('saveText');
    document.getElementsByClassName("novel-load-text")[0].innerHTML = LanguageManager.getUIString('loadText');
    let iterable = document.getElementsByClassName("novel-close-button");
    for (let j = 0; j < iterable.length; j++) {
      let i = iterable[j];
      i.innerHTML = LanguageManager.getUIString('closeButton');
    }
    document.getElementsByClassName("novel-copy-button")[0].innerHTML = LanguageManager.getUIString('copyButton');
    document.getElementsByClassName("novel-skip-button")[0].innerHTML = LanguageManager.getUIString('skipButton');
    document.getElementsByClassName("novel-continue-button")[0].innerHTML = LanguageManager.getUIString('continueButton');
    document.getElementsByClassName("novel-inventory-title")[0].innerHTML = LanguageManager.getUIString('inventoryTitle');
    document.getElementsByClassName("novel-hidden-inventory-title")[0].innerHTML = LanguageManager.getUIString('hiddenInventoryTitle');
    document.getElementsByClassName("novel-load-button")[0].innerHTML = LanguageManager.getUIString('loadButton');
    document.getElementsByClassName("novel-load-data-button")[0].innerHTML = LanguageManager.getUIString('loadDataButton');
    document.getElementsByClassName("novel-save-button")[0].innerHTML = LanguageManager.getUIString('saveButton');
  }

  static updateStyle(style) {
    let e = document.getElementById("novel-style-area");
    if (style === undefined) {
      style = "";
    }
    e.setAttribute( 'class', style );
  }

  static disableSkipButton() {
    if (document.querySelector(".novel-skip-button") !== null) {
      document.querySelector(".novel-skip-button").disabled = true;
    }
  }

  static enableSkipButton() {
    if (document.querySelector(".novel-skip-button") !== null) {
      document.querySelector(".novel-skip-button").disabled = true;
    }
  }

  static showSkipButton(show) {
    let e = document.getElementsByClassName("novel-skip-button")[0];
    if (show && novelData.novel.settings.showSkipButton) {
      e.style.display = "inline";
    } else {
      e.style.display = "none";
    }
  }

  static showChoicesArea(show) {
    let e = document.getElementById("novel-choices-area");
    if (show) {
      e.style.display = "inline";
    } else {
      e.style.display = "none";
    }
  }

  static showInventoryArea(show) {
    let e = document.getElementById("novel-inventory-area");
    if (show) {
      e.style.display = "inline";
    } else {
      e.style.display = "none";
    }
  }

  static showHiddenInventoryArea() {
    let e = document.getElementById("novel-hidden-inventory-area");
    if (novelData.novel.settings.debugMode) {
      e.style.display = "inline";
    } else {
      e.style.display = "none";
    }
  }

  static showSaveButtons(show) {
    let e = document.getElementById("novel-save-area");
    if (show) {
      e.style.display = "inline";
    } else {
      e.style.display = "none";
    }
  }

  static showContinueButton(show) {
    if (document.querySelector(".novel-continue-button") !== null) {
      if (!show) {
        document.querySelector(".novel-continue-button").style.display = 'none';
      } else {
        document.querySelector(".novel-continue-button").style.display = 'inline';
      }
    }
  }

  static updateText(text) {
    let e = document.getElementById("novel-text");
    e.innerHTML = text;
  }

  // Show the save notification window, and update its text
  static showSaveNotification(text) {
    let e = document.getElementById("novel-save-notification");
    let textArea = e.querySelectorAll("textarea");
    textArea[0].value = text;
    e.style.display = 'block';
  }

  // Close the save notification window
  static closeSaveNotification() {
    let e = document.getElementById("novel-save-notification");
    e.style.display = 'none';
  }

  // Show the load notification window
  static showLoadNotification() {
    if (novelData.novel.settings.saveMode === "text") {
      let e = document.getElementById("novel-load-notification");
      e.style.display = 'block';
    } else {
      NovelManager.loadGame();
    }
  }

  // Close the load notification - if load, then load a save. ChangeScene defines whether the scene should be updated or not.
  static closeLoadNotification(load, changeScene) {
    let e = document.getElementById("novel-load-notification");
    if (load) {
      let textArea = e.querySelectorAll("textarea");
      NovelManager.loadData(textArea[0].value,changeScene);
      textArea[0].value = "";
    }
    e.style.display = 'none';
  }

  // Copy text from the save notification
  static copyText() {
    let copyTextarea = document.getElementById("novel-save-notification").querySelector("textarea");
    copyTextarea.select();
    try {
      let successful;
      return successful = document.execCommand('copy');
    } catch (err) {
      console.error(`Error! Copying to clipboard failed: ${err}`);
    }
  }

  // Update the values of the input fields
  static updateInputs(needForUpdate) {
    let inputs = document.getElementById("novel-area").querySelectorAll("input");
    for (let j = 0; j < inputs.length; j++) {
      let i = inputs[j];
      for (let k = 0; k < novelData.novel.inventories[novelData.novel.currentInventory].length; k++) {
        let a = novelData.novel.inventories[novelData.novel.currentInventory][k];
        if (a.name === i.className.substring(6,i.className.length)) {
          a.value = Util.stripHTML(i.value);
          if (needForUpdate) {
            SceneManager.updateScene(novelData.novel.currentScene,true);
          }
        }
      }
    }
  }

  // Reset all choices
  static resetChoices() {
    let choiceArea = document.getElementById("novel-choice-list");
    return (() => { let result = []; while (choiceArea.firstChild) {
      result.push(choiceArea.removeChild(choiceArea.firstChild));
    } return result; })();
  }

  // Reset the inventories
  static resetInventories() {
    let inventoryArea = document.getElementById("novel-inventory");
    while (inventoryArea.firstChild) {
      inventoryArea.removeChild(inventoryArea.firstChild);
    }
    inventoryArea = document.getElementById("novel-hidden-inventory");
    return (() => { let result = []; while (inventoryArea.firstChild) {
      result.push(inventoryArea.removeChild(inventoryArea.firstChild));
    } return result; })();
  }

  // Update the choices
  static updateChoices() {
    this.resetChoices();
    let choiceArea = document.getElementById("novel-choice-list");
    let i = 0;
    let iterable = __range__(0, novelData.novel.currentScene.choices.length, false);
    for (let j = 0; j < novelData.novel.currentScene.choices.length; j++) {
      i = iterable[j];
      let choice = novelData.novel.currentScene.choices[i];
      if (choice.text) {
        choice.parsedText = Parser.parseText(LanguageManager.getCorrectLanguageString(choice.text));
        if (SceneManager.requirementsFilled(choice)) {
          var li = document.createElement("li");
          li.innerHTML = `<a href="#"; onclick="SceneManager.selectChoiceById(${i})">${choice.parsedText}</a>`;
          choiceArea.appendChild(li);
        } else if (choice.alwaysShow || novelData.novel.settings.alwaysShowDisabledChoices) {
          var li = document.createElement("li");
          li.innerHTML = choice.parsedText;
          choiceArea.appendChild(li);
        }
      }
    }
  }

  // Update the inventory items
  static updateInventories() {
    this.resetInventories();
    let inventoryArea = document.getElementById("novel-inventory");
    let hiddenInventoryArea = document.getElementById("novel-hidden-inventory");
    for (let i = 0; i < novelData.novel.inventories[novelData.novel.currentInventory].length; i++) {
      let item = novelData.novel.inventories[novelData.novel.currentInventory][i];
      let targetInventory = hiddenInventoryArea;
      if (!item.hidden || item.hidden === undefined) {
        targetInventory = inventoryArea;
      }
      if (item.value > 0 || isNaN(item.value)) {
        let li = document.createElement("li");
        li.class = "novel-inventory-item";
        let innerHTML = LanguageManager.getItemAttribute(item,'displayName') + ' - ' + item.value;
        innerHTML = innerHTML + '<ul class="novel-inventory-item-info">';
        if (item.description) {
          innerHTML = innerHTML + '<li class="novel-inventory-item-description">' + LanguageManager.getItemAttribute(item,'description') + '</li>';
        }
        innerHTML = innerHTML + '</ul>';
        li.innerHTML = innerHTML;
        targetInventory.appendChild(li);
      }
    }
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

/* UTILITY SCRIPTS */

class Util {

  // Check if a value is even or not
  static isEven(n) {
    return n % 2 === 0;
  }

  // Check if a value is odd or not
  static isOdd(n) {
    return Math.abs(n % 2) === 1;
  }

  // Remove HTML tags from a string - used to clean input
  static stripHTML(text) {
    let regex = /(<([^>]+)>)/ig;
    return text.replace(regex, '');
  }

  // Check if a variable is the chosen format
  static checkFormat(s, format, suppressErrors) {
    if (suppressErrors === undefined) {
      suppressErrors = false;
    }
    if (format === 'array') {
      if (Object.prototype.toString.call(s) === '[object Array]') {
        return true;
      } else {
        if (!suppressErrors) {
          console.error(`ERROR: Invalid input format (should be ${format})`);
        }
        return false;
      }
    } else if (format === 'arrayOrString') {
      if (Object.prototype.toString.call(s) === '[object Array]' || typeof s === 'string') {
        return true;
      } else {
        if (!suppressErrors) {
          console.error(`ERROR: Invalid input format (should be ${format})`);
        }
        return false;
      }
    } else {
      if (typeof s === format) {
        return true;
      } else {
        if (!suppressErrors) {
          console.error(`ERROR: Invalid input format (should be ${format})`);
        }
        return false;
      }
    }
  }

  // Check if the string has valid parentheses
  static validateParentheses(s) {
    let open = 0;
    for (let j = 0; j < s.length; j++) {
      let i = s[j];
      if (i === "(") {
        open++;
      }
      if (i === ")") {
        if (open > 0) {
          open--;
        } else {
          return false;
        }
      }
    }
    if (open === 0) {
      return true;
    } else {
      return false;
    }
  }

  // Check if [] parentheses are valid - ignore /[ and /]
  static validateTagParentheses(s) {
    let open = 0;
    let index = 0;
    for (let j = 0; j < s.length; j++) {
      let i = s[j];
      if (i === "[") {
        if (s[index-1]) {
          if (s[index-1] !== "/") {
            open++;
          }
        } else {
          open++;
        }
      }
      if (i === "]") {
        if (s[index-1]) {
          if (s[index-1] !== "/") {
            if (open > 0) {
              open--;
            } else {
              return false;
            }
          }
        } else {
          if (open > 0) {
            open--;
          } else {
            return false;
          }
        }
      }
      index++;
    }
    if (open === 0) {
      return true;
    } else {
      return false;
    }
  }

  // Merge two object arrays into one
  static mergeObjArrays(list1, list2) {
    let result = {};
    list1.concat(list2).forEach(function(item) {
      let { name } = item;
      let row = result[name];
      if (!row) {
        result[name] = item;
        return;
      }
      for (let column in item) {
        row[column] = item[column];
      }
    });
    let finalResult = Object.keys(result).map(name => result[name]);
    return finalResult;
  }
}

/* And finally, start the game... */

NovelManager.start();
