
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
