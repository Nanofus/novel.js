
/* SAVING AND LOADING */
var GameManager, Inventory, Parser, Scene, Sound, TextPrinter, UI, Util, copyButton, currentInterval, currentOffset, data, fullText, gameArea, gamePath, musicBuffer, soundBuffer, stopMusicBuffer, timer,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

GameManager = {
  loadCookie: function(cname) {
    var c, ca, i, name;
    name = cname + '=';
    ca = document.cookie.split(';');
    i = 0;
    while (i < ca.length) {
      c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
      i++;
    }
    return '';
  },
  saveCookie: function(cname, cvalue, exdays) {
    var d, expires;
    d = new Date;
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    expires = 'expires=' + d.toUTCString();
    return document.cookie = cname + '=' + cvalue + '; ' + expires + '; path=/';
  },
  loadGame: function(game) {
    var cookie;
    if (game === void 0) {
      if (this.loadCookie("gameData") !== '') {
        console.log("Cookie dound!");
        cookie = this.loadCookie("gameData");
        console.log("Cookie loaded");
        console.log(cookie);
        data.game = JSON.parse(atob(this.loadCookie("gameData")));
        console.log("Data loaded!");
        return data.debugMode = data.game.debugMode;
      }
    } else if (game !== void 0) {
      data.game = JSON.parse(atob(game));
      data.debugMode = data.game.debugMode;
    }
  },
  startGame: function() {
    var request;
    request = new XMLHttpRequest;
    request.open('GET', gamePath + '/game.json', true);
    request.onload = function() {
      var json;
      if (request.status >= 200 && request.status < 400) {
        json = JSON.parse(request.responseText);
        json = GameManager.prepareData(json);
        data.game = json;
        data.game.currentScene = Scene.changeScene(data.game.scenes[0].name);
        return data.debugMode = data.game.debugMode;
      }
    };
    request.onerror = function() {};
    return request.send();
  },
  saveGameAsJson: function() {
    var save;
    save = btoa(JSON.stringify(data.game));
    return save;
  },
  saveGame: function() {
    var save;
    save = this.saveGameAsJson();
    if (data.game.settings.saveMode === "cookie") {
      return this.saveCookie("gameData", save, 365);
    } else if (data.game.settings.saveMode === "text") {
      return UI.showSaveNotification(save);
    }
  },
  prepareData: function(json) {
    var c, i, k, l, len, len1, len2, m, ref, ref1, ref2, s;
    json.currentScene = "";
    json.parsedChoices = "";
    ref = json.inventory;
    for (k = 0, len = ref.length; k < len; k++) {
      i = ref[k];
      if (i.displayName === void 0) {
        i.displayName = i.name;
      }
    }
    ref1 = json.scenes;
    for (l = 0, len1 = ref1.length; l < len1; l++) {
      s = ref1[l];
      s.combinedText = "";
      s.parsedText = "";
      ref2 = s.choices;
      for (m = 0, len2 = ref2.length; m < len2; m++) {
        c = ref2[m];
        c.parsedText = "";
        if (c.nextScene === void 0) {
          c.nextScene = "";
        }
        if (c.alwaysShow === void 0) {
          c.alwaysShow = false;
        }
      }
    }
    return json;
  }
};


/* INVENTORY, STAT & VALUE OPERATIONS */

Inventory = {
  checkRequirements: function(requirements, isItem) {
    var i, j, k, l, len, len1, len2, len3, m, o, ref, ref1, reqsFilled;
    reqsFilled = 0;
    if (isItem) {
      ref = data.game.inventory;
      for (k = 0, len = ref.length; k < len; k++) {
        i = ref[k];
        for (l = 0, len1 = requirements.length; l < len1; l++) {
          j = requirements[l];
          if (j[0] === i.name) {
            if (j[1] <= i.count) {
              reqsFilled = reqsFilled + 1;
            }
          }
        }
      }
    } else {
      ref1 = data.game.stats;
      for (m = 0, len2 = ref1.length; m < len2; m++) {
        i = ref1[m];
        for (o = 0, len3 = requirements.length; o < len3; o++) {
          j = requirements[o];
          if (j[0] === i.name) {
            if (j[1] <= i.value) {
              reqsFilled = reqsFilled + 1;
            }
          }
        }
      }
    }
    if (reqsFilled === requirements.length) {
      return true;
    } else {
      return false;
    }
  },
  setValue: function(parsed, newValue) {
    var getValueArrayLast, value;
    getValueArrayLast = this.getValueArrayLast(parsed);
    value = Parser.findValue(parsed, false);
    return value[getValueArrayLast] = newValue;
  },
  increaseValue: function(parsed, change) {
    var getValueArrayLast, value;
    getValueArrayLast = this.getValueArrayLast(parsed);
    value = Parser.findValue(parsed, false);
    value[getValueArrayLast] = value[getValueArrayLast] + change;
    if (!isNaN(parseFloat(value[getValueArrayLast]))) {
      return value[getValueArrayLast] = parseFloat(value[getValueArrayLast].toFixed(8));
    }
  },
  decreaseValue: function(parsed, change) {
    var getValueArrayLast, value;
    getValueArrayLast = this.getValueArrayLast(parsed);
    value = Parser.findValue(parsed, false);
    value[getValueArrayLast] = value[getValueArrayLast] - change;
    if (!isNaN(parseFloat(value[getValueArrayLast]))) {
      return value[getValueArrayLast] = parseFloat(value[getValueArrayLast].toFixed(8));
    }
  },
  getValueArrayLast: function(parsed) {
    var getValueArrayLast;
    getValueArrayLast = parsed.split(",");
    getValueArrayLast = getValueArrayLast[getValueArrayLast.length - 1].split(".");
    getValueArrayLast = getValueArrayLast[getValueArrayLast.length - 1];
    return getValueArrayLast;
  },
  editItemsOrStats: function(items, mode, isItem) {
    var count, displayName, i, inventory, isInv, itemAdded, j, k, l, len, len1, p, probability, value;
    if (isItem) {
      inventory = data.game.inventory;
      isInv = true;
    } else {
      inventory = data.game.stats;
      isInv = false;
    }
    for (k = 0, len = items.length; k < len; k++) {
      j = items[k];
      itemAdded = false;
      for (l = 0, len1 = inventory.length; l < len1; l++) {
        i = inventory[l];
        if (i.name === j[0]) {
          p = j[1].split(",");
          probability = 1;
          if (p.length > 1) {
            displayName = p[1];
            count = parseInt(p[0]);
            if (!isNaN(displayName)) {
              probability = p[1];
              displayName = j.name;
            }
            if (p.length > 2) {
              probability = parseFloat(p[1]);
              displayName = p[2];
            }
          } else {
            displayName = j[0];
            count = parseInt(j[1]);
          }
          value = Math.random();
          if (value < probability) {
            if (mode === "set") {
              if (isInv) {
                i.count = parseInt(j[1]);
              } else {
                i.value = parseInt(j[1]);
              }
            } else if (mode === "add") {
              if (isInv) {
                i.count = parseInt(i.count) + count;
              } else {
                if (isNaN(parseInt(i.value))) {
                  i.value = 0;
                }
                i.value = parseInt(i.value) + count;
              }
            } else if (mode === "remove") {
              if (isInv) {
                i.count = parseInt(i.count) - count;
                if (i.count < 0) {
                  i.count = 0;
                }
              } else {
                i.value = parseInt(i.value) - count;
                if (i.value < 0) {
                  i.value = 0;
                }
              }
            }
          }
          itemAdded = true;
        }
      }
      if (!itemAdded && mode !== "remove") {
        p = j[1].split(",");
        probability = 1;
        if (p.length > 1) {
          displayName = p[1];
          count = parseInt(p[0]);
          if (!isNaN(displayName)) {
            probability = p[1];
            displayName = j.name;
          }
          if (p.length > 2) {
            probability = parseFloat(p[1]);
            displayName = p[2];
          }
        } else {
          displayName = j[0];
          count = parseInt(j[1]);
        }
        value = Math.random();
        if (value < probability) {
          inventory.push({
            "name": j[0],
            "count": count,
            "displayName": displayName
          });
        }
      }
    }
    if (isItem) {
      return data.game.inventory = inventory;
    } else {
      return data.game.stats = inventory;
    }
  }
};

data = {
  game: null,
  choices: null,
  debugMode: false,
  printedText: "",
  music: []
};

gamePath = './game';

gameArea = new Vue({
  el: '#game-area',
  data: data,
  methods: {
    requirementsFilled: function(choice) {
      return Scene.requirementsFilled(choice);
    },
    textSkipEnabled: function(choice) {
      return data.game.currentScene.skipEnabled;
    },
    selectChoice: function(choice) {
      Scene.exitScene(this.game.currentScene);
      Scene.readItemAndStatsEdits(choice);
      Scene.readSounds(choice, true);
      Scene.readSaving(choice);
      if (choice.nextScene !== "") {
        return Scene.changeScene(choice.nextScene);
      } else {
        return Scene.updateScene(this.game.currentScene);
      }
    }
  }
});


/* And finally, start the game... */

GameManager.startGame();


/* PARSERS */

Parser = {
  parseItemOrStats: function(items) {
    var i, k, len, parsed, separate;
    separate = items.split("|");
    parsed = [];
    for (k = 0, len = separate.length; k < len; k++) {
      i = separate[k];
      i = i.substring(0, i.length - 1);
      i = i.split("[");
      parsed.push(i);
    }
    return parsed;
  },
  parseText: function(text) {
    var asToBeClosed, i, index, k, l, len, len1, len2, m, nameText, o, parsed, q, ref, ref1, ref2, ref3, s, spansToBeClosed, splitText, value;
    if (text !== void 0) {
      for (i = k = 0; k <= 99; i = ++k) {
        text = text.split("[s" + i + "]").join("<span class=\"highlight-" + i + "\">");
      }
      text = text.split("[/s]").join("</span>");
      splitText = text.split(/\[|\]/);
      spansToBeClosed = 0;
      asToBeClosed = 0;
      for (index = l = 0, ref = splitText.length - 1; 0 <= ref ? l <= ref : l >= ref; index = 0 <= ref ? ++l : --l) {
        s = splitText[index];
        if (s.substring(0, 2) === "if") {
          parsed = s.split("if ");
          if (!this.parseStatement(parsed[1])) {
            splitText[index] = "<span style=\"display:none;\">";
            spansToBeClosed++;
          } else {
            splitText[index] = "";
          }
        } else if (s.substring(0, 3) === "/if") {
          if (spansToBeClosed > 0) {
            splitText[index] = "</span>";
            spansToBeClosed--;
          } else {
            splitText[index] = "";
          }
        } else if (s.substring(0, 5) === "stat.") {
          value = s.substring(5, s.length);
          ref1 = data.game.stats;
          for (m = 0, len = ref1.length; m < len; m++) {
            i = ref1[m];
            if (i.name === value) {
              splitText[index] = i.value;
            }
          }
        } else if (s.substring(0, 4) === "inv.") {
          value = s.substring(4, s.length);
          ref2 = data.game.inventory;
          for (o = 0, len1 = ref2.length; o < len1; o++) {
            i = ref2[o];
            if (i.name === value) {
              splitText[index] = i.count;
            }
          }
        } else if (s.substring(0, 5) === "print") {
          parsed = s.split("print ");
          splitText[index] = this.parseStatement(parsed[1]);
        } else if (s.substring(0, 5) === "sound") {
          parsed = s.split("sound ");
          splitText[index] = "<span class=\"play-sound " + parsed[1] + "\"></span>";
        } else if (s.substring(0, 9) === "stopMusic") {
          parsed = s.split("stopMusic ");
          splitText[index] = "<span class=\"stop-music " + parsed[1] + "\"></span>";
        } else if (s.substring(0, 5) === "music") {
          parsed = s.split("music ");
          splitText[index] = "<span class=\"play-music " + parsed[1] + "\"></span>";
        } else if (s.substring(0, 6) === "/speed") {
          splitText[index] = "<span class=\"default-speed\"></span>";
        } else if (s.substring(0, 5) === "speed") {
          parsed = s.split("speed ");
          splitText[index] = "<span class=\"set-speed " + parsed[1] + "\"></span>";
        } else if (s.substring(0, 5) === "input") {
          parsed = s.split("input ");
          nameText = "";
          ref3 = data.game.stats;
          for (q = 0, len2 = ref3.length; q < len2; q++) {
            i = ref3[q];
            if (i.name === parsed[1]) {
              nameText = i.value;
            }
          }
          splitText[index] = "<input type=\"text\" value=\"" + nameText + "\" name=\"input\" class=\"input-" + parsed[1] + "\">";
        } else if (s.substring(0, 6) === "choice") {
          parsed = s.split("choice ");
          splitText[index] = "<a href=\"#\" onclick=\"Scene.selectChoiceByNameByClicking(event,'" + parsed[1] + "')\">";
          asToBeClosed++;
        } else if (s.substring(0, 7) === "/choice") {
          if (asToBeClosed > 0) {
            splitText[index] = "</a>";
            asToBeClosed--;
          } else {
            splitText[index] = "";
          }
        }
        index++;
      }
      text = splitText.join("");
      return text;
    }
  },
  parseStatement: function(s) {
    var i, k, l, len, len1, len2, m, o, parsedString, parsedValues, ref, ref1, ref2, type, val;
    if (!Util.validateParentheses(s)) {
      console.error("ERROR: Invalid parentheses in statement");
    }
    s = s.replace(/\s+/g, '');
    parsedString = s.split(/\(|\)|\+|\*|\-|\/|<=|>=|<|>|==|!=|\|\||&&/);
    parsedValues = [];
    for (k = 0, len = parsedString.length; k < len; k++) {
      val = parsedString[k];
      type = this.getStatementType(val);
      switch (type) {
        case "item":
          ref = data.game.inventory;
          for (l = 0, len1 = ref.length; l < len1; l++) {
            i = ref[l];
            if (i.name === val.substring(4, val.length)) {
              parsedValues.push(i.count);
            }
          }
          break;
        case "stats":
          ref1 = data.game.stats;
          for (m = 0, len2 = ref1.length; m < len2; m++) {
            i = ref1[m];
            if (i.name === val.substring(5, val.length)) {
              parsedValues.push(i.value);
            }
          }
          break;
        case "var":
          val = this.findValue(val.substring(4, val.length), true);
          if (!isNaN(parseFloat(val))) {
            parsedValues.push(val);
          } else {
            parsedValues.push("'" + val + "'");
          }
          break;
        case "float":
          parsedValues.push(parseFloat(val));
          break;
        case "int":
          parsedValues.push(parseInt(val));
          break;
        case "string":
          if (val !== "") {
            parsedValues.push("'" + val + "'");
          } else {
            parsedValues.push("");
          }
      }
    }
    for (i = o = 0, ref2 = parsedString.length - 1; 0 <= ref2 ? o <= ref2 : o >= ref2; i = 0 <= ref2 ? ++o : --o) {
      if (parsedString[i] !== "" && parsedValues[i] !== "") {
        s = s.replace(new RegExp(parsedString[i], 'g'), parsedValues[i]);
      }
    }
    return eval(s);
  },
  getStatementType: function(val) {
    var type;
    type = null;
    if (val.substring(0, 5) === "stat.") {
      type = "stats";
    } else if (val.substring(0, 4) === "inv.") {
      type = "item";
    } else if (val.substring(0, 4) === "var.") {
      type = "var";
    } else if (!isNaN(parseFloat(val)) && val.toString().indexOf(".") === -1) {
      type = "int";
    } else if (!isNaN(parseFloat(val)) && val.toString().indexOf(".") !== -1) {
      type = "float";
    } else {
      type = "string";
    }
    return type;
  },
  findValue: function(parsed, toPrint) {
    var i, k, ref, splitted, variable;
    splitted = parsed.split(",");
    if (!toPrint) {
      if (splitted.length > 1) {
        variable = this.findValueByName(data.game, splitted[0])[0];
      } else {
        variable = this.findValueByName(data.game, splitted[0])[1];
      }
    } else {
      variable = this.findValueByName(data.game, splitted[0])[0];
    }
    for (i = k = 0, ref = splitted.length - 1; 0 <= ref ? k <= ref : k >= ref; i = 0 <= ref ? ++k : --k) {
      if (Util.isOdd(i)) {
        variable = variable[parseInt(splitted[i])];
      } else if (i !== 0) {
        if (!toPrint) {
          variable = this.findValueByName(variable, splitted[i])[1];
        } else {
          if (splitted[i] === "parsedText" || splitted[i] === "text") {
            splitted[i] = "parsedText";
            variable.parsedText = Parser.parseText(variable.text);
          }
          variable = this.findValueByName(variable, splitted[i])[0];
        }
      }
    }
    return variable;
  },
  findValueByName: function(obj, string) {
    var newObj, newString, parts, r;
    parts = string.split('.');
    newObj = obj[parts[0]];
    if (parts[1]) {
      parts.splice(0, 1);
      newString = parts.join('.');
      return this.findValueByName(newObj, newString);
    }
    r = [];
    r[0] = newObj;
    r[1] = obj;
    return r;
  }
};


/* SCENE MANIPULATION */

Scene = {
  selectChoiceByNameByClicking: function(event, name) {
    event.stopPropagation();
    event.preventDefault();
    return this.selectChoiceByName(name);
  },
  selectChoiceByName: function(name) {
    var i, k, len, ref, results;
    ref = data.game.currentScene.choices;
    results = [];
    for (k = 0, len = ref.length; k < len; k++) {
      i = ref[k];
      if (i.name === name) {
        gameArea.selectChoice(i);
        break;
      } else {
        results.push(void 0);
      }
    }
    return results;
  },
  exitScene: function(scene) {
    return UI.updateInputs(scene);
  },
  changeScene: function(sceneNames) {
    var scene;
    scene = this.findSceneByName(this.selectRandomScene(sceneNames));
    this.setupScene(scene);
    return scene;
  },
  setupScene: function(scene) {
    this.updateScene(scene);
    this.readItemAndStatsEdits(data.game.currentScene);
    this.readSounds(data.game.currentScene, false);
    this.readSaving(data.game.currentScene);
    return this.readMisc(data.game.currentScene);
  },
  updateScene: function(scene) {
    Scene.combineSceneTexts(scene);
    scene.parsedText = Parser.parseText(scene.combinedText);
    data.game.currentScene = scene;
    data.game.parsedChoices = null;
    return TextPrinter.printText(scene.parsedText);
  },
  updateChoices: function() {
    return gameArea.$set('game.parsedChoices', data.game.currentScene.choices.map(function(choice) {
      choice.parsedText = Parser.parseText(choice.text);
      if (gameArea.game.settings.alwaysShowDisabledChoices) {
        choice.alwaysShow = true;
      }
      return choice;
    }));
  },
  selectRandomScene: function(name) {
    var i, k, len, parsed, separate;
    separate = name.split("|");
    if (separate.length === 1) {
      return separate[0];
    }
    parsed = [];
    for (k = 0, len = separate.length; k < len; k++) {
      i = separate[k];
      i = i.substring(0, i.length - 1);
      i = i.split("[");
      parsed.push(i);
    }
    parsed = this.chooseFromMultipleScenes(parsed);
    return parsed;
  },
  chooseFromMultipleScenes: function(scenes) {
    var chances, i, k, l, len, len1, len2, m, nameIndex, names, previous, rawChances, totalChance, value;
    names = [];
    chances = [];
    rawChances = [];
    previous = 0;
    for (k = 0, len = scenes.length; k < len; k++) {
      i = scenes[k];
      names.push(i[0]);
      previous = parseFloat(i[1]) + previous;
      chances.push(previous);
      rawChances.push(parseFloat(i[1]));
    }
    totalChance = 0;
    for (l = 0, len1 = rawChances.length; l < len1; l++) {
      i = rawChances[l];
      totalChance = totalChance + parseFloat(i);
    }
    if (totalChance !== 1) {
      console.error("ERROR: Invalid scene odds!");
    }
    value = Math.random();
    nameIndex = 0;
    for (m = 0, len2 = chances.length; m < len2; m++) {
      i = chances[m];
      if (value < i) {
        return names[nameIndex];
      }
      nameIndex++;
    }
  },
  findSceneByName: function(name) {
    var i, k, len, ref;
    ref = data.game.scenes;
    for (k = 0, len = ref.length; k < len; k++) {
      i = ref[k];
      if (i.name === name) {
        return i;
      }
    }
    return console.error("ERROR: Scene by name '" + name + "' not found!");
  },
  combineSceneTexts: function(scene) {
    var key, results;
    scene.combinedText = scene.text;
    results = [];
    for (key in scene) {
      if (scene.hasOwnProperty(key)) {
        if (key.includes("text-")) {
          results.push(scene.combinedText = scene.combinedText.concat(scene[key]));
        } else {
          results.push(void 0);
        }
      } else {
        results.push(void 0);
      }
    }
    return results;
  },
  readItemAndStatsEdits: function(source) {
    var k, l, len, len1, len2, m, ref, ref1, ref2, results, val;
    if (source.removeItem !== void 0) {
      Inventory.editItemsOrStats(Parser.parseItemOrStats(source.removeItem), "remove", true);
    }
    if (source.addItem !== void 0) {
      Inventory.editItemsOrStats(Parser.parseItemOrStats(source.addItem), "add", true);
    }
    if (source.setItem !== void 0) {
      Inventory.editItemsOrStats(Parser.parseItemOrStats(source.setItem), "set", true);
    }
    if (source.removeStats !== void 0) {
      Inventory.editItemsOrStats(Parser.parseItemOrStats(source.removeStats), "remove", false);
    }
    if (source.addStats !== void 0) {
      Inventory.editItemsOrStats(Parser.parseItemOrStats(source.addStats), "add", false);
    }
    if (source.setStats !== void 0) {
      Inventory.editItemsOrStats(Parser.parseItemOrStats(source.setStats), "set", false);
    }
    if (source.setValue !== void 0) {
      ref = source.setValue;
      for (k = 0, len = ref.length; k < len; k++) {
        val = ref[k];
        Inventory.setValue(val.path, val.value);
      }
    }
    if (source.increaseValue !== void 0) {
      ref1 = source.increaseValue;
      for (l = 0, len1 = ref1.length; l < len1; l++) {
        val = ref1[l];
        Inventory.increaseValue(val.path, val.value);
      }
    }
    if (source.decreaseValue !== void 0) {
      ref2 = source.decreaseValue;
      results = [];
      for (m = 0, len2 = ref2.length; m < len2; m++) {
        val = ref2[m];
        results.push(Inventory.decreaseValue(val.path, val.value));
      }
      return results;
    }
  },
  readSounds: function(source, clicked) {
    var played;
    played = false;
    if (source.playSound !== void 0) {
      Sound.playSound(source.playSound, false);
      played = true;
    }
    if (clicked && !played) {
      Sound.playDefaultClickSound();
    }
    if (source.startMusic !== void 0) {
      Sound.startMusic(source.startMusic);
    }
    if (source.stopMusic !== void 0) {
      return Sound.stopMusic(source.stopMusic);
    }
  },
  readMisc: function(source) {
    if (source.skipEnabled !== void 0) {
      data.game.currentScene.skipEnabled = source.skipEnabled;
    } else {
      data.game.currentScene.skipEnabled = data.game.settings.textSkipEnabled;
    }
    if (source.scrollSpeed !== void 0) {
      return data.game.currentScene.scrollSpeed = source.scrollSpeed;
    } else {
      return data.game.currentScene.scrollSpeed = data.game.settings.defaultScrollSpeed;
    }
  },
  readSaving: function(source) {
    if (source.saveGame !== void 0) {
      saveGame();
    }
    if (source.loadGame !== void 0) {
      return showLoadNotification();
    }
  },
  requirementsFilled: function(choice) {
    var k, len, r, reqs, requirements, success;
    reqs = [];
    if (choice.itemRequirement !== void 0) {
      requirements = Parser.parseItemOrStats(choice.itemRequirement);
      reqs.push(Inventory.checkRequirements(requirements, true));
    }
    if (choice.statsRequirement !== void 0) {
      requirements = Parser.parseItemOrStats(choice.statsRequirement);
      reqs.push(Inventory.checkRequirements(requirements, false));
    }
    if (choice.requirement !== void 0) {
      reqs.push(Inventory.parseIfStatement(choice.requirement));
    }
    success = true;
    for (k = 0, len = reqs.length; k < len; k++) {
      r = reqs[k];
      if (r === false) {
        success = false;
      }
    }
    return success;
  }
};


/* SOUNDS */

Sound = {
  playDefaultClickSound: function(name, clicked) {
    return this.playSound(data.game.settings.soundSettings.defaultClickSound, false);
  },
  playSound: function(name, isMusic) {
    var k, len, ref, s, sound;
    ref = data.game.sounds;
    for (k = 0, len = ref.length; k < len; k++) {
      s = ref[k];
      if (s.name === name) {
        sound = new Audio(gamePath + '/sounds/' + s.file);
        if (isMusic) {
          sound.volume = data.game.settings.soundSettings.musicVolume;
        } else {
          sound.volume = data.game.settings.soundSettings.soundVolume;
        }
        sound.play();
        return sound;
      }
    }
  },
  isPlaying: function(name) {
    var i, k, len, ref;
    ref = data.music;
    for (k = 0, len = ref.length; k < len; k++) {
      i = ref[k];
      if (i.paused) {
        return false;
      } else {
        return true;
      }
    }
  },
  startMusic: function(name) {
    var music;
    music = this.playSound(name, true);
    music.addEventListener('ended', (function() {
      this.currentTime = 0;
      this.play();
    }), false);
    return data.music.push({
      "name": name,
      "music": music
    });
  },
  stopMusic: function(name) {
    var i, index, k, len, ref, results;
    ref = data.music;
    results = [];
    for (k = 0, len = ref.length; k < len; k++) {
      i = ref[k];
      if (name === i.name) {
        i.music.pause();
        index = data.music.indexOf(i);
        results.push(data.music.splice(index, 1));
      } else {
        results.push(void 0);
      }
    }
    return results;
  }
};


/* TEXT PRINTING (letter by letter etc.) */

fullText = "";

timer = null;

currentOffset = 0;

currentInterval = 0;

soundBuffer = [];

musicBuffer = [];

stopMusicBuffer = [];

TextPrinter = {
  printText: function(text, interval) {
    if (document.querySelector("#skip-button") !== null) {
      document.querySelector("#skip-button").disabled = false;
    }
    clearInterval(timer);
    fullText = text;
    currentOffset = 0;
    soundBuffer = [];
    musicBuffer = [];
    stopMusicBuffer = [];
    if (interval === void 0) {
      currentInterval = data.game.currentScene.scrollSpeed;
    } else {
      currentInterval = interval;
    }
    return timer = setInterval(this.onTick, currentInterval);
  },
  complete: function() {
    var i, k, l, len, len1, len2, m, o, q, ref, ref1, ref2, ref3, ref4, ref5, s, ss, t;
    if (document.querySelector("#skip-button") !== null) {
      document.querySelector("#skip-button").disabled = true;
    }
    clearInterval(timer);
    timer = null;
    ss = [];
    if (fullText.indexOf("play-sound") > -1) {
      s = fullText.split("play-sound ");
      for (k = 0, len = s.length; k < len; k++) {
        i = s[k];
        ss.push(i.split(/\s|\"/)[0]);
      }
    }
    if (ss.length > 0) {
      for (i = l = 0, ref = ss.length; 0 <= ref ? l <= ref : l >= ref; i = 0 <= ref ? ++l : --l) {
        if (!(ref1 = ss[i], indexOf.call(soundBuffer, ref1) >= 0)) {
          Sound.playSound(ss[i]);
        }
      }
    }
    ss = [];
    if (fullText.indexOf("play-music") > -1) {
      s = fullText.split("play-music ");
      for (m = 0, len1 = s.length; m < len1; m++) {
        i = s[m];
        ss.push(i.split(/\s|\"/)[0]);
      }
    }
    if (ss.length > 0) {
      for (i = o = 0, ref2 = ss.length; 0 <= ref2 ? o <= ref2 : o >= ref2; i = 0 <= ref2 ? ++o : --o) {
        if (!(ref3 = ss[i], indexOf.call(musicBuffer, ref3) >= 0)) {
          Sound.startMusic(ss[i]);
        }
      }
    }
    ss = [];
    if (fullText.indexOf("stop-music") > -1) {
      s = fullText.split("stop-music ");
      for (q = 0, len2 = s.length; q < len2; q++) {
        i = s[q];
        ss.push(i.split(/\s|\"/)[0]);
      }
    }
    if (ss.length > 0) {
      for (i = t = 0, ref4 = ss.length; 0 <= ref4 ? t <= ref4 : t >= ref4; i = 0 <= ref4 ? ++t : --t) {
        if (!(ref5 = ss[i], indexOf.call(stopMusicBuffer, ref5) >= 0)) {
          Sound.stopMusic(ss[i]);
        }
      }
    }
    data.printedText = fullText;
    return Scene.updateChoices();
  },
  changeTimer: function(time) {
    clearInterval(timer);
    return timer = setInterval(this.onTick, time);
  },
  resetTimer: function() {
    clearInterval(timer);
    return timer = setInterval(this.onTick, currentInterval);
  },
  onTick: function() {
    var disp, i, s, str;
    if (currentInterval === 0) {
      TextPrinter.complete();
      return;
    }
    if (fullText[currentOffset] === '<') {
      i = currentOffset;
      str = "";
      while (fullText[i] !== '>') {
        i++;
        str = str + fullText[i];
      }
      str = str.substring(0, str.length - 1);
      if (str.indexOf("display:none;") > -1) {
        disp = "";
        i++;
        while (disp.indexOf("/span") === -1) {
          i++;
          disp = disp + fullText[i];
        }
      }
      if (str.indexOf("play-sound") > -1 && str.indexOf("display:none;") > -1) {
        s = str.split("play-sound ");
        s = s[1].split(/\s|\"/)[0];
        soundBuffer.push(s);
      }
      if (str.indexOf("play-music") > -1 && str.indexOf("display:none;") > -1) {
        s = str.split("play-music ");
        s = s[1].split(/\s|\"/)[0];
        musicBuffer.push(s);
      }
      if (str.indexOf("display:none;") === -1) {
        if (str.indexOf("play-sound") > -1) {
          s = str.split("play-sound ");
          s = s[1].split(/\s|\"/)[0];
          soundBuffer.push(s);
          Sound.playSound(s);
        }
        if (str.indexOf("play-music") > -1) {
          s = str.split("play-music ");
          s = s[1].split(/\s|\"/)[0];
          musicBuffer.push(s);
          Sound.startMusic(s);
        }
        if (str.indexOf("stop-music") > -1) {
          s = str.split("stop-music ");
          s = s[1].split(/\s|\"/)[0];
          stopMusicBuffer.push(s);
          Sound.stopMusic(s);
        }
        if (str.indexOf("set-speed") > -1) {
          s = str.split("set-speed ");
          s = s[1].split(/\s|\"/)[0];
          TextPrinter.changeTimer(Parser.parseStatement(s));
        }
        if (str.indexOf("default-speed") > -1) {
          TextPrinter.resetTimer();
        }
      }
      currentOffset = i;
    }
    currentOffset++;
    if (currentOffset === fullText.length) {
      TextPrinter.complete();
      return;
    }
    if (fullText[currentOffset] === '<') {
      return data.printedText = fullText.substring(0, currentOffset - 1);
    } else {
      return data.printedText = fullText.substring(0, currentOffset);
    }
  }
};


/* UI SCRIPTS */

UI = {
  showSaveNotification: function(text) {
    var e, textArea;
    e = document.getElementById("save-notification");
    textArea = e.querySelectorAll("textarea");
    textArea[0].value = text;
    return e.style.display = 'block';
  },
  closeSaveNotification: function() {
    var e;
    e = document.getElementById("save-notification");
    return e.style.display = 'none';
  },
  showLoadNotification: function() {
    var e;
    if (gameArea.game.settings.saveMode === "text") {
      e = document.getElementById("load-notification");
      return e.style.display = 'block';
    } else {
      return loadGame();
    }
  },
  closeLoadNotification: function(load) {
    var e, textArea;
    e = document.getElementById("load-notification");
    if (load) {
      textArea = e.querySelectorAll("textarea");
      loadGame(textArea[0].value);
      textArea[0].value = "";
    }
    return e.style.display = 'none';
  },
  updateInputs: function(scene) {
    var a, i, inputs, k, len, results;
    inputs = document.getElementById("game-area").querySelectorAll("input");
    results = [];
    for (k = 0, len = inputs.length; k < len; k++) {
      i = inputs[k];
      results.push((function() {
        var l, len1, ref, results1;
        ref = data.game.stats;
        results1 = [];
        for (l = 0, len1 = ref.length; l < len1; l++) {
          a = ref[l];
          if (a.name === i.className.substring(6, i.className.length)) {
            results1.push(a.value = Util.stripHTML(i.value));
          } else {
            results1.push(void 0);
          }
        }
        return results1;
      })());
    }
    return results;
  }
};

copyButton = document.querySelector('#copy-button');

copyButton.addEventListener('click', function(event) {
  var copyTextarea, err, error, successful;
  copyTextarea = document.getElementById("save-notification").querySelector("textarea");
  copyTextarea.select();
  try {
    successful = document.execCommand('copy');
  } catch (error) {
    err = error;
    console.error("Copying to clipboard failed: " + err);
  }
});


/* UTILITY SCRIPTS */

Util = {
  isEven: function(n) {
    return n % 2 === 0;
  },
  isOdd: function(n) {
    return Math.abs(n % 2) === 1;
  },
  stripHTML: function(text) {
    var regex;
    regex = /(<([^>]+)>)/ig;
    return text.replace(regex, '');
  },
  validateParentheses: function(s) {
    var i, k, len, open;
    open = 0;
    for (k = 0, len = s.length; k < len; k++) {
      i = s[k];
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
};

//# sourceMappingURL=data:application/json;base64,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QUFBLEdBQU8sQ0FBVjtVQUNFLElBQUEsR0FERjtTQUFBLE1BQUE7QUFHRSxpQkFBTyxNQUhUO1NBREY7O0FBSEY7SUFRQSxJQUFHLElBQUEsS0FBUSxDQUFYO0FBQ0UsYUFBTyxLQURUO0tBQUEsTUFBQTtBQUdFLGFBQU8sTUFIVDs7RUFWbUIsQ0FmaEIiLCJmaWxlIjoibm92ZWwuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyJcclxuIyMjIFNBVklORyBBTkQgTE9BRElORyAjIyNcclxuXHJcbkdhbWVNYW5hZ2VyID0ge1xyXG5cclxuICAjIExvYWQgYSBicm93c2VyIGNvb2tpZVxyXG4gIGxvYWRDb29raWU6IChjbmFtZSkgLT5cclxuICAgIG5hbWUgPSBjbmFtZSArICc9J1xyXG4gICAgY2EgPSBkb2N1bWVudC5jb29raWUuc3BsaXQoJzsnKVxyXG4gICAgaSA9IDBcclxuICAgIHdoaWxlIGkgPCBjYS5sZW5ndGhcclxuICAgICAgYyA9IGNhW2ldXHJcbiAgICAgIHdoaWxlIGMuY2hhckF0KDApID09ICcgJ1xyXG4gICAgICAgIGMgPSBjLnN1YnN0cmluZygxKVxyXG4gICAgICBpZiBjLmluZGV4T2YobmFtZSkgPT0gMFxyXG4gICAgICAgIHJldHVybiBjLnN1YnN0cmluZyhuYW1lLmxlbmd0aCwgYy5sZW5ndGgpXHJcbiAgICAgIGkrK1xyXG4gICAgJydcclxuXHJcbiAgIyBTYXZlIGEgYnJvd3NlciBjb29raWVcclxuICBzYXZlQ29va2llOiAoY25hbWUsIGN2YWx1ZSwgZXhkYXlzKSAtPlxyXG4gICAgZCA9IG5ldyBEYXRlXHJcbiAgICBkLnNldFRpbWUgZC5nZXRUaW1lKCkgKyBleGRheXMgKiAyNCAqIDYwICogNjAgKiAxMDAwXHJcbiAgICBleHBpcmVzID0gJ2V4cGlyZXM9JyArIGQudG9VVENTdHJpbmcoKVxyXG4gICAgZG9jdW1lbnQuY29va2llID0gY25hbWUgKyAnPScgKyBjdmFsdWUgKyAnOyAnICsgZXhwaXJlcyArICc7IHBhdGg9LydcclxuXHJcbiAgIyBMb2FkIHRoZSBnYW1lIGZyb20gYSBjb29raWUgb3IgZW50ZXJlZCBqc29uXHJcbiAgbG9hZEdhbWU6IChnYW1lKSAtPlxyXG4gICAgaWYgZ2FtZSA9PSB1bmRlZmluZWRcclxuICAgICAgaWYgQGxvYWRDb29raWUoXCJnYW1lRGF0YVwiKSAhPSAnJ1xyXG4gICAgICAgIGNvbnNvbGUubG9nIFwiQ29va2llIGRvdW5kIVwiXHJcbiAgICAgICAgY29va2llID0gQGxvYWRDb29raWUoXCJnYW1lRGF0YVwiKVxyXG4gICAgICAgIGNvbnNvbGUubG9nIFwiQ29va2llIGxvYWRlZFwiXHJcbiAgICAgICAgY29uc29sZS5sb2cgY29va2llXHJcbiAgICAgICAgZGF0YS5nYW1lID0gSlNPTi5wYXJzZShhdG9iKEBsb2FkQ29va2llKFwiZ2FtZURhdGFcIikpKVxyXG4gICAgICAgIGNvbnNvbGUubG9nIFwiRGF0YSBsb2FkZWQhXCJcclxuICAgICAgICBkYXRhLmRlYnVnTW9kZSA9IGRhdGEuZ2FtZS5kZWJ1Z01vZGVcclxuICAgIGVsc2UgaWYgZ2FtZSAhPSB1bmRlZmluZWRcclxuICAgICAgZGF0YS5nYW1lID0gSlNPTi5wYXJzZShhdG9iKGdhbWUpKVxyXG4gICAgICBkYXRhLmRlYnVnTW9kZSA9IGRhdGEuZ2FtZS5kZWJ1Z01vZGVcclxuICAgICAgcmV0dXJuXHJcblxyXG4gICMgU3RhcnQgdGhlIGdhbWUgYnkgbG9hZGluZyB0aGUgZGVmYXVsdCBnYW1lLmpzb25cclxuICBzdGFydEdhbWU6IC0+XHJcbiAgICByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0XHJcbiAgICByZXF1ZXN0Lm9wZW4gJ0dFVCcsIGdhbWVQYXRoICsgJy9nYW1lLmpzb24nLCB0cnVlXHJcbiAgICByZXF1ZXN0Lm9ubG9hZCA9IC0+XHJcbiAgICAgIGlmIHJlcXVlc3Quc3RhdHVzID49IDIwMCBhbmQgcmVxdWVzdC5zdGF0dXMgPCA0MDBcclxuICAgICAgICBqc29uID0gSlNPTi5wYXJzZShyZXF1ZXN0LnJlc3BvbnNlVGV4dClcclxuICAgICAgICBqc29uID0gR2FtZU1hbmFnZXIucHJlcGFyZURhdGEoanNvbilcclxuICAgICAgICBkYXRhLmdhbWUgPSBqc29uXHJcbiAgICAgICAgZGF0YS5nYW1lLmN1cnJlbnRTY2VuZSA9IFNjZW5lLmNoYW5nZVNjZW5lKGRhdGEuZ2FtZS5zY2VuZXNbMF0ubmFtZSlcclxuICAgICAgICBkYXRhLmRlYnVnTW9kZSA9IGRhdGEuZ2FtZS5kZWJ1Z01vZGVcclxuICAgIHJlcXVlc3Qub25lcnJvciA9IC0+XHJcbiAgICAgIHJldHVyblxyXG4gICAgcmVxdWVzdC5zZW5kKClcclxuXHJcbiAgIyBDb252ZXJ0cyB0aGUgZ2FtZSdzIHN0YXRlIGludG8ganNvbiBhbmQgQmFzZTY0IGVuY29kZSBpdFxyXG4gIHNhdmVHYW1lQXNKc29uOiAoKSAtPlxyXG4gICAgc2F2ZSA9IGJ0b2EoSlNPTi5zdHJpbmdpZnkoZGF0YS5nYW1lKSlcclxuICAgIHJldHVybiBzYXZlXHJcblxyXG4gICMgU2F2ZSBnYW1lIGluIHRoZSBkZWZpbmVkIHdheVxyXG4gIHNhdmVHYW1lOiAtPlxyXG4gICAgc2F2ZSA9IEBzYXZlR2FtZUFzSnNvbigpXHJcbiAgICBpZiBkYXRhLmdhbWUuc2V0dGluZ3Muc2F2ZU1vZGUgPT0gXCJjb29raWVcIlxyXG4gICAgICBAc2F2ZUNvb2tpZShcImdhbWVEYXRhXCIsc2F2ZSwzNjUpXHJcbiAgICBlbHNlIGlmIGRhdGEuZ2FtZS5zZXR0aW5ncy5zYXZlTW9kZSA9PSBcInRleHRcIlxyXG4gICAgICBVSS5zaG93U2F2ZU5vdGlmaWNhdGlvbihzYXZlKVxyXG5cclxuICAjIEFkZCB2YWx1ZXMgdG8gZ2FtZS5qc29uIHRoYXQgYXJlIG5vdCBkZWZpbmVkIGJ1dCBhcmUgcmVxdWlyZWQgZm9yIFZ1ZS5qcyB2aWV3IHVwZGF0aW5nXHJcbiAgcHJlcGFyZURhdGE6IChqc29uKSAtPlxyXG4gICAganNvbi5jdXJyZW50U2NlbmU9XCJcIlxyXG4gICAganNvbi5wYXJzZWRDaG9pY2VzPVwiXCJcclxuICAgIGZvciBpIGluIGpzb24uaW52ZW50b3J5XHJcbiAgICAgIGlmIGkuZGlzcGxheU5hbWUgPT0gdW5kZWZpbmVkXHJcbiAgICAgICAgaS5kaXNwbGF5TmFtZSA9IGkubmFtZVxyXG4gICAgZm9yIHMgaW4ganNvbi5zY2VuZXNcclxuICAgICAgcy5jb21iaW5lZFRleHQgPSBcIlwiXHJcbiAgICAgIHMucGFyc2VkVGV4dCA9IFwiXCJcclxuICAgICAgZm9yIGMgaW4gcy5jaG9pY2VzXHJcbiAgICAgICAgYy5wYXJzZWRUZXh0ID0gXCJcIlxyXG4gICAgICAgIGlmIGMubmV4dFNjZW5lID09IHVuZGVmaW5lZFxyXG4gICAgICAgICAgYy5uZXh0U2NlbmUgPSBcIlwiXHJcbiAgICAgICAgaWYgYy5hbHdheXNTaG93ID09IHVuZGVmaW5lZFxyXG4gICAgICAgICAgYy5hbHdheXNTaG93ID0gZmFsc2VcclxuICAgIHJldHVybiBqc29uXHJcblxyXG59XHJcblxuXHJcbiMjIyBJTlZFTlRPUlksIFNUQVQgJiBWQUxVRSBPUEVSQVRJT05TICMjI1xyXG5cclxuSW52ZW50b3J5ID0ge1xyXG5cclxuICAjIENoZWNrIGlmIGl0ZW0gb3Igc3RhdCByZXF1aXJlbWVudHMgaGF2ZSBiZWVuIGZpbGxlZFxyXG4gIGNoZWNrUmVxdWlyZW1lbnRzOiAocmVxdWlyZW1lbnRzLCBpc0l0ZW0pIC0+XHJcbiAgICByZXFzRmlsbGVkID0gMFxyXG4gICAgaWYgaXNJdGVtXHJcbiAgICAgIGZvciBpIGluIGRhdGEuZ2FtZS5pbnZlbnRvcnlcclxuICAgICAgICBmb3IgaiBpbiByZXF1aXJlbWVudHNcclxuICAgICAgICAgIGlmIGpbMF0gPT0gaS5uYW1lXHJcbiAgICAgICAgICAgIGlmIGpbMV0gPD0gaS5jb3VudFxyXG4gICAgICAgICAgICAgIHJlcXNGaWxsZWQgPSByZXFzRmlsbGVkICsgMVxyXG4gICAgZWxzZVxyXG4gICAgICBmb3IgaSBpbiBkYXRhLmdhbWUuc3RhdHNcclxuICAgICAgICBmb3IgaiBpbiByZXF1aXJlbWVudHNcclxuICAgICAgICAgIGlmIGpbMF0gPT0gaS5uYW1lXHJcbiAgICAgICAgICAgIGlmIGpbMV0gPD0gaS52YWx1ZVxyXG4gICAgICAgICAgICAgIHJlcXNGaWxsZWQgPSByZXFzRmlsbGVkICsgMVxyXG4gICAgaWYgcmVxc0ZpbGxlZCA9PSByZXF1aXJlbWVudHMubGVuZ3RoXHJcbiAgICAgIHJldHVybiB0cnVlXHJcbiAgICBlbHNlXHJcbiAgICAgIHJldHVybiBmYWxzZVxyXG5cclxuICAjIFNldCBhIHZhbHVlIGluIEpTT05cclxuICBzZXRWYWx1ZTogKHBhcnNlZCwgbmV3VmFsdWUpIC0+XHJcbiAgICBnZXRWYWx1ZUFycmF5TGFzdCA9IEBnZXRWYWx1ZUFycmF5TGFzdChwYXJzZWQpXHJcbiAgICB2YWx1ZSA9IFBhcnNlci5maW5kVmFsdWUocGFyc2VkLGZhbHNlKVxyXG4gICAgdmFsdWVbZ2V0VmFsdWVBcnJheUxhc3RdID0gbmV3VmFsdWVcclxuXHJcbiAgIyBJbmNyZWFzZSBhIHZhbHVlIGluIEpTT05cclxuICBpbmNyZWFzZVZhbHVlOiAocGFyc2VkLCBjaGFuZ2UpIC0+XHJcbiAgICBnZXRWYWx1ZUFycmF5TGFzdCA9IEBnZXRWYWx1ZUFycmF5TGFzdChwYXJzZWQpXHJcbiAgICB2YWx1ZSA9IFBhcnNlci5maW5kVmFsdWUocGFyc2VkLGZhbHNlKVxyXG4gICAgdmFsdWVbZ2V0VmFsdWVBcnJheUxhc3RdID0gdmFsdWVbZ2V0VmFsdWVBcnJheUxhc3RdICsgY2hhbmdlXHJcbiAgICBpZiAhaXNOYU4ocGFyc2VGbG9hdCh2YWx1ZVtnZXRWYWx1ZUFycmF5TGFzdF0pKVxyXG4gICAgICB2YWx1ZVtnZXRWYWx1ZUFycmF5TGFzdF0gPSBwYXJzZUZsb2F0KHZhbHVlW2dldFZhbHVlQXJyYXlMYXN0XS50b0ZpeGVkKDgpKTtcclxuXHJcbiAgIyBEZWNyZWFzZSBhIHZhbHVlIGluIEpTT05cclxuICBkZWNyZWFzZVZhbHVlOiAocGFyc2VkLCBjaGFuZ2UpIC0+XHJcbiAgICBnZXRWYWx1ZUFycmF5TGFzdCA9IEBnZXRWYWx1ZUFycmF5TGFzdChwYXJzZWQpXHJcbiAgICB2YWx1ZSA9IFBhcnNlci5maW5kVmFsdWUocGFyc2VkLGZhbHNlKVxyXG4gICAgdmFsdWVbZ2V0VmFsdWVBcnJheUxhc3RdID0gdmFsdWVbZ2V0VmFsdWVBcnJheUxhc3RdIC0gY2hhbmdlXHJcbiAgICBpZiAhaXNOYU4ocGFyc2VGbG9hdCh2YWx1ZVtnZXRWYWx1ZUFycmF5TGFzdF0pKVxyXG4gICAgICB2YWx1ZVtnZXRWYWx1ZUFycmF5TGFzdF0gPSBwYXJzZUZsb2F0KHZhbHVlW2dldFZhbHVlQXJyYXlMYXN0XS50b0ZpeGVkKDgpKTtcclxuXHJcbiAgIyBHZXQgdGhlIGxhc3QgaXRlbSBpbiBhIHZhbHVlIGFycmF5XHJcbiAgZ2V0VmFsdWVBcnJheUxhc3Q6IChwYXJzZWQpIC0+XHJcbiAgICBnZXRWYWx1ZUFycmF5TGFzdCA9IHBhcnNlZC5zcGxpdChcIixcIilcclxuICAgIGdldFZhbHVlQXJyYXlMYXN0ID0gZ2V0VmFsdWVBcnJheUxhc3RbZ2V0VmFsdWVBcnJheUxhc3QubGVuZ3RoLTFdLnNwbGl0KFwiLlwiKVxyXG4gICAgZ2V0VmFsdWVBcnJheUxhc3QgPSBnZXRWYWx1ZUFycmF5TGFzdFtnZXRWYWx1ZUFycmF5TGFzdC5sZW5ndGgtMV1cclxuICAgIHJldHVybiBnZXRWYWx1ZUFycmF5TGFzdFxyXG5cclxuICAjIEVkaXQgdGhlIHBsYXllcidzIGl0ZW1zIG9yIHN0YXRzXHJcbiAgZWRpdEl0ZW1zT3JTdGF0czogKGl0ZW1zLCBtb2RlLCBpc0l0ZW0pIC0+XHJcbiAgICBpZiBpc0l0ZW1cclxuICAgICAgaW52ZW50b3J5ID0gZGF0YS5nYW1lLmludmVudG9yeVxyXG4gICAgICBpc0ludiA9IHRydWVcclxuICAgIGVsc2VcclxuICAgICAgaW52ZW50b3J5ID0gZGF0YS5nYW1lLnN0YXRzXHJcbiAgICAgIGlzSW52ID0gZmFsc2VcclxuICAgIGZvciBqIGluIGl0ZW1zXHJcbiAgICAgIGl0ZW1BZGRlZCA9IGZhbHNlXHJcbiAgICAgIGZvciBpIGluIGludmVudG9yeVxyXG4gICAgICAgIGlmIGkubmFtZSA9PSBqWzBdXHJcbiAgICAgICAgICBwID0galsxXS5zcGxpdChcIixcIilcclxuICAgICAgICAgIHByb2JhYmlsaXR5ID0gMVxyXG4gICAgICAgICAgaWYgcC5sZW5ndGggPiAxXHJcbiAgICAgICAgICAgIGRpc3BsYXlOYW1lID0gcFsxXVxyXG4gICAgICAgICAgICBjb3VudCA9IHBhcnNlSW50KHBbMF0pXHJcbiAgICAgICAgICAgIGlmICFpc05hTihkaXNwbGF5TmFtZSlcclxuICAgICAgICAgICAgICBwcm9iYWJpbGl0eSA9IHBbMV1cclxuICAgICAgICAgICAgICBkaXNwbGF5TmFtZSA9IGoubmFtZVxyXG4gICAgICAgICAgICBpZiBwLmxlbmd0aCA+IDJcclxuICAgICAgICAgICAgICBwcm9iYWJpbGl0eSA9IHBhcnNlRmxvYXQocFsxXSlcclxuICAgICAgICAgICAgICBkaXNwbGF5TmFtZSA9IHBbMl1cclxuICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgZGlzcGxheU5hbWUgPSBqWzBdXHJcbiAgICAgICAgICAgIGNvdW50ID0gcGFyc2VJbnQoalsxXSlcclxuICAgICAgICAgIHZhbHVlID0gTWF0aC5yYW5kb20oKVxyXG4gICAgICAgICAgaWYgdmFsdWUgPCBwcm9iYWJpbGl0eVxyXG4gICAgICAgICAgICBpZiAobW9kZSA9PSBcInNldFwiKVxyXG4gICAgICAgICAgICAgIGlmIGlzSW52XHJcbiAgICAgICAgICAgICAgICBpLmNvdW50ID0gcGFyc2VJbnQoalsxXSlcclxuICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBpLnZhbHVlID0gcGFyc2VJbnQoalsxXSlcclxuICAgICAgICAgICAgZWxzZSBpZiAobW9kZSA9PSBcImFkZFwiKVxyXG4gICAgICAgICAgICAgIGlmIGlzSW52XHJcbiAgICAgICAgICAgICAgICBpLmNvdW50ID0gcGFyc2VJbnQoaS5jb3VudCkgKyBjb3VudFxyXG4gICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGlmIGlzTmFOIHBhcnNlSW50KGkudmFsdWUpXHJcbiAgICAgICAgICAgICAgICAgIGkudmFsdWUgPSAwXHJcbiAgICAgICAgICAgICAgICBpLnZhbHVlID0gcGFyc2VJbnQoaS52YWx1ZSkgKyBjb3VudFxyXG4gICAgICAgICAgICBlbHNlIGlmIChtb2RlID09IFwicmVtb3ZlXCIpXHJcbiAgICAgICAgICAgICAgaWYgaXNJbnZcclxuICAgICAgICAgICAgICAgIGkuY291bnQgPSBwYXJzZUludChpLmNvdW50KSAtIGNvdW50XHJcbiAgICAgICAgICAgICAgICBpZiBpLmNvdW50IDwgMFxyXG4gICAgICAgICAgICAgICAgICBpLmNvdW50ID0gMFxyXG4gICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGkudmFsdWUgPSBwYXJzZUludChpLnZhbHVlKSAtIGNvdW50XHJcbiAgICAgICAgICAgICAgICBpZiBpLnZhbHVlIDwgMFxyXG4gICAgICAgICAgICAgICAgICBpLnZhbHVlID0gMFxyXG4gICAgICAgICAgaXRlbUFkZGVkID0gdHJ1ZVxyXG4gICAgICBpZiAhaXRlbUFkZGVkICYmIG1vZGUgIT0gXCJyZW1vdmVcIlxyXG4gICAgICAgIHAgPSBqWzFdLnNwbGl0KFwiLFwiKVxyXG4gICAgICAgIHByb2JhYmlsaXR5ID0gMVxyXG4gICAgICAgIGlmIHAubGVuZ3RoID4gMVxyXG4gICAgICAgICAgZGlzcGxheU5hbWUgPSBwWzFdXHJcbiAgICAgICAgICBjb3VudCA9IHBhcnNlSW50KHBbMF0pXHJcbiAgICAgICAgICBpZiAhaXNOYU4oZGlzcGxheU5hbWUpXHJcbiAgICAgICAgICAgIHByb2JhYmlsaXR5ID0gcFsxXVxyXG4gICAgICAgICAgICBkaXNwbGF5TmFtZSA9IGoubmFtZVxyXG4gICAgICAgICAgaWYgcC5sZW5ndGggPiAyXHJcbiAgICAgICAgICAgIHByb2JhYmlsaXR5ID0gcGFyc2VGbG9hdChwWzFdKVxyXG4gICAgICAgICAgICBkaXNwbGF5TmFtZSA9IHBbMl1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICBkaXNwbGF5TmFtZSA9IGpbMF1cclxuICAgICAgICAgIGNvdW50ID0gcGFyc2VJbnQoalsxXSlcclxuICAgICAgICB2YWx1ZSA9IE1hdGgucmFuZG9tKClcclxuICAgICAgICBpZiB2YWx1ZSA8IHByb2JhYmlsaXR5XHJcbiAgICAgICAgICBpbnZlbnRvcnkucHVzaCh7XCJuYW1lXCI6IGpbMF0sIFwiY291bnRcIjogY291bnQsIFwiZGlzcGxheU5hbWVcIjogZGlzcGxheU5hbWV9KVxyXG4gICAgaWYgaXNJdGVtXHJcbiAgICAgIGRhdGEuZ2FtZS5pbnZlbnRvcnkgPSBpbnZlbnRvcnlcclxuICAgIGVsc2VcclxuICAgICAgZGF0YS5nYW1lLnN0YXRzID0gaW52ZW50b3J5XHJcblxyXG59XHJcblxuZGF0YSA9IHtcclxuICBnYW1lOiBudWxsLFxyXG4gIGNob2ljZXM6IG51bGwsXHJcbiAgZGVidWdNb2RlOiBmYWxzZSxcclxuICBwcmludGVkVGV4dDogXCJcIixcclxuICBtdXNpYzogW11cclxufVxyXG5cclxuZ2FtZVBhdGggPSAnLi9nYW1lJ1xyXG5cclxuIyBHYW1lIGFyZWFcclxuZ2FtZUFyZWEgPSBuZXcgVnVlKFxyXG4gIGVsOiAnI2dhbWUtYXJlYSdcclxuICBkYXRhOiBkYXRhXHJcbiAgbWV0aG9kczpcclxuICAgICMgUmV0dXJuIHdoZXRoZXIgdGhlIHJlcXVpcmVtZW50cyBvZiBhIGNob2ljZSBoYXZlIGJlZW4gZmlsbGVkXHJcbiAgICByZXF1aXJlbWVudHNGaWxsZWQ6IChjaG9pY2UpIC0+XHJcbiAgICAgIHJldHVybiBTY2VuZS5yZXF1aXJlbWVudHNGaWxsZWQoY2hvaWNlKVxyXG5cclxuICAgICMgUmV0dXJuIHdoZXRoZXIgdGhlIHRleHQgY2FuIGJlIHNraXBwZWRcclxuICAgIHRleHRTa2lwRW5hYmxlZDogKGNob2ljZSkgLT5cclxuICAgICAgcmV0dXJuIGRhdGEuZ2FtZS5jdXJyZW50U2NlbmUuc2tpcEVuYWJsZWRcclxuXHJcbiAgICAjIFNlbGVjdCBhIGNob2ljZVxyXG4gICAgc2VsZWN0Q2hvaWNlOiAoY2hvaWNlKSAtPlxyXG4gICAgICBTY2VuZS5leGl0U2NlbmUoQGdhbWUuY3VycmVudFNjZW5lKVxyXG4gICAgICBTY2VuZS5yZWFkSXRlbUFuZFN0YXRzRWRpdHMoY2hvaWNlKVxyXG4gICAgICBTY2VuZS5yZWFkU291bmRzKGNob2ljZSx0cnVlKVxyXG4gICAgICBTY2VuZS5yZWFkU2F2aW5nKGNob2ljZSlcclxuICAgICAgaWYgY2hvaWNlLm5leHRTY2VuZSAhPSBcIlwiXHJcbiAgICAgICAgU2NlbmUuY2hhbmdlU2NlbmUoY2hvaWNlLm5leHRTY2VuZSlcclxuICAgICAgZWxzZVxyXG4gICAgICAgIFNjZW5lLnVwZGF0ZVNjZW5lKEBnYW1lLmN1cnJlbnRTY2VuZSlcclxuKVxyXG5cclxuIyMjIEFuZCBmaW5hbGx5LCBzdGFydCB0aGUgZ2FtZS4uLiAjIyNcclxuR2FtZU1hbmFnZXIuc3RhcnRHYW1lKClcclxuXG5cclxuIyMjIFBBUlNFUlMgIyMjXHJcblxyXG5QYXJzZXIgPSB7XHJcblxyXG4gICMgUGFyc2UgYSBzdHJpbmcgb2YgaXRlbXMgYW5kIG91dHB1dCBhbiBhcnJheVxyXG4gIHBhcnNlSXRlbU9yU3RhdHM6IChpdGVtcykgLT5cclxuICAgIHNlcGFyYXRlID0gaXRlbXMuc3BsaXQoXCJ8XCIpXHJcbiAgICBwYXJzZWQgPSBbXVxyXG4gICAgZm9yIGkgaW4gc2VwYXJhdGVcclxuICAgICAgaSA9IGkuc3Vic3RyaW5nKDAsIGkubGVuZ3RoIC0gMSlcclxuICAgICAgaSA9IGkuc3BsaXQoXCJbXCIpXHJcbiAgICAgIHBhcnNlZC5wdXNoKGkpXHJcbiAgICByZXR1cm4gcGFyc2VkXHJcblxyXG4gICMgUGFyc2UgYSB0ZXh0IGZvciBOb3ZlbC5qcyB0YWdzLCBhbmQgcmVwbGFjZSB0aGVtIHdpdGggdGhlIGNvcnJlY3QgSFRNTCB0YWdzLlxyXG4gIHBhcnNlVGV4dDogKHRleHQpIC0+XHJcbiAgICBpZiB0ZXh0ICE9IHVuZGVmaW5lZFxyXG4gICAgICAjIFtzXSB0YWdzXHJcbiAgICAgIGZvciBpIGluIFswIC4uIDk5XVxyXG4gICAgICAgIHRleHQgPSB0ZXh0LnNwbGl0KFwiW3NcIiArIGkgKyBcIl1cIikuam9pbihcIjxzcGFuIGNsYXNzPVxcXCJoaWdobGlnaHQtXCIgKyBpICsgXCJcXFwiPlwiKVxyXG4gICAgICB0ZXh0ID0gdGV4dC5zcGxpdChcIlsvc11cIikuam9pbihcIjwvc3Bhbj5cIilcclxuICAgICAgIyBPdGhlciB0YWdzXHJcbiAgICAgIHNwbGl0VGV4dCA9IHRleHQuc3BsaXQoL1xcW3xcXF0vKVxyXG4gICAgICBzcGFuc1RvQmVDbG9zZWQgPSAwXHJcbiAgICAgIGFzVG9CZUNsb3NlZCA9IDBcclxuICAgICAgZm9yIGluZGV4IGluIFswIC4uIHNwbGl0VGV4dC5sZW5ndGgtMV1cclxuICAgICAgICBzID0gc3BsaXRUZXh0W2luZGV4XVxyXG4gICAgICAgICMgW2lmXSBzdGF0ZW1lbnRzXHJcbiAgICAgICAgaWYgcy5zdWJzdHJpbmcoMCwyKSA9PSBcImlmXCJcclxuICAgICAgICAgIHBhcnNlZCA9IHMuc3BsaXQoXCJpZiBcIilcclxuICAgICAgICAgIGlmICFAcGFyc2VTdGF0ZW1lbnQocGFyc2VkWzFdKVxyXG4gICAgICAgICAgICBzcGxpdFRleHRbaW5kZXhdID0gXCI8c3BhbiBzdHlsZT1cXFwiZGlzcGxheTpub25lO1xcXCI+XCJcclxuICAgICAgICAgICAgc3BhbnNUb0JlQ2xvc2VkKytcclxuICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgc3BsaXRUZXh0W2luZGV4XSA9IFwiXCJcclxuICAgICAgICBlbHNlIGlmIHMuc3Vic3RyaW5nKDAsMykgPT0gXCIvaWZcIlxyXG4gICAgICAgICAgaWYgc3BhbnNUb0JlQ2xvc2VkID4gMFxyXG4gICAgICAgICAgICBzcGxpdFRleHRbaW5kZXhdID0gXCI8L3NwYW4+XCJcclxuICAgICAgICAgICAgc3BhbnNUb0JlQ2xvc2VkLS1cclxuICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgc3BsaXRUZXh0W2luZGV4XSA9IFwiXCJcclxuICAgICAgICAjIFByaW50ZWQgc3RhdCB2YWx1ZXNcclxuICAgICAgICBlbHNlIGlmIHMuc3Vic3RyaW5nKDAsNSkgPT0gXCJzdGF0LlwiXHJcbiAgICAgICAgICB2YWx1ZSA9IHMuc3Vic3RyaW5nKDUscy5sZW5ndGgpXHJcbiAgICAgICAgICBmb3IgaSBpbiBkYXRhLmdhbWUuc3RhdHNcclxuICAgICAgICAgICAgaWYgaS5uYW1lID09IHZhbHVlXHJcbiAgICAgICAgICAgICAgc3BsaXRUZXh0W2luZGV4XSA9IGkudmFsdWVcclxuICAgICAgICAjIFByaW50ZWQgaW52ZW50b3J5IGNvdW50c1xyXG4gICAgICAgIGVsc2UgaWYgcy5zdWJzdHJpbmcoMCw0KSA9PSBcImludi5cIlxyXG4gICAgICAgICAgdmFsdWUgPSBzLnN1YnN0cmluZyg0LHMubGVuZ3RoKVxyXG4gICAgICAgICAgZm9yIGkgaW4gZGF0YS5nYW1lLmludmVudG9yeVxyXG4gICAgICAgICAgICBpZiBpLm5hbWUgPT0gdmFsdWVcclxuICAgICAgICAgICAgICBzcGxpdFRleHRbaW5kZXhdID0gaS5jb3VudFxyXG4gICAgICAgICMgR2VuZXJpYyBwcmludCBjb21tYW5kXHJcbiAgICAgICAgZWxzZSBpZiBzLnN1YnN0cmluZygwLDUpID09IFwicHJpbnRcIlxyXG4gICAgICAgICAgcGFyc2VkID0gcy5zcGxpdChcInByaW50IFwiKVxyXG4gICAgICAgICAgc3BsaXRUZXh0W2luZGV4XSA9IEBwYXJzZVN0YXRlbWVudChwYXJzZWRbMV0pXHJcbiAgICAgICAgIyBQbGF5IHNvdW5kXHJcbiAgICAgICAgZWxzZSBpZiBzLnN1YnN0cmluZygwLDUpID09IFwic291bmRcIlxyXG4gICAgICAgICAgcGFyc2VkID0gcy5zcGxpdChcInNvdW5kIFwiKVxyXG4gICAgICAgICAgc3BsaXRUZXh0W2luZGV4XSA9IFwiPHNwYW4gY2xhc3M9XFxcInBsYXktc291bmQgXCIgKyBwYXJzZWRbMV0gKyBcIlxcXCI+PC9zcGFuPlwiXHJcbiAgICAgICAgIyBTdG9wIG11c2ljXHJcbiAgICAgICAgZWxzZSBpZiBzLnN1YnN0cmluZygwLDkpID09IFwic3RvcE11c2ljXCJcclxuICAgICAgICAgIHBhcnNlZCA9IHMuc3BsaXQoXCJzdG9wTXVzaWMgXCIpXHJcbiAgICAgICAgICBzcGxpdFRleHRbaW5kZXhdID0gXCI8c3BhbiBjbGFzcz1cXFwic3RvcC1tdXNpYyBcIiArIHBhcnNlZFsxXSArIFwiXFxcIj48L3NwYW4+XCJcclxuICAgICAgICAjIFBsYXkgbXVzaWNcclxuICAgICAgICBlbHNlIGlmIHMuc3Vic3RyaW5nKDAsNSkgPT0gXCJtdXNpY1wiXHJcbiAgICAgICAgICBwYXJzZWQgPSBzLnNwbGl0KFwibXVzaWMgXCIpXHJcbiAgICAgICAgICBzcGxpdFRleHRbaW5kZXhdID0gXCI8c3BhbiBjbGFzcz1cXFwicGxheS1tdXNpYyBcIiArIHBhcnNlZFsxXSArIFwiXFxcIj48L3NwYW4+XCJcclxuICAgICAgICAjIFJlc2V0IHRleHQgc3BlZWRcclxuICAgICAgICBlbHNlIGlmIHMuc3Vic3RyaW5nKDAsNikgPT0gXCIvc3BlZWRcIlxyXG4gICAgICAgICAgc3BsaXRUZXh0W2luZGV4XSA9IFwiPHNwYW4gY2xhc3M9XFxcImRlZmF1bHQtc3BlZWRcXFwiPjwvc3Bhbj5cIlxyXG4gICAgICAgICMgQ2hhbmdlIHNwZWVkXHJcbiAgICAgICAgZWxzZSBpZiBzLnN1YnN0cmluZygwLDUpID09IFwic3BlZWRcIlxyXG4gICAgICAgICAgcGFyc2VkID0gcy5zcGxpdChcInNwZWVkIFwiKVxyXG4gICAgICAgICAgc3BsaXRUZXh0W2luZGV4XSA9IFwiPHNwYW4gY2xhc3M9XFxcInNldC1zcGVlZCBcIiArIHBhcnNlZFsxXSArIFwiXFxcIj48L3NwYW4+XCJcclxuICAgICAgICAjIElucHV0IGZpZWxkXHJcbiAgICAgICAgZWxzZSBpZiBzLnN1YnN0cmluZygwLDUpID09IFwiaW5wdXRcIlxyXG4gICAgICAgICAgcGFyc2VkID0gcy5zcGxpdChcImlucHV0IFwiKVxyXG4gICAgICAgICAgbmFtZVRleHQgPSBcIlwiXHJcbiAgICAgICAgICBmb3IgaSBpbiBkYXRhLmdhbWUuc3RhdHNcclxuICAgICAgICAgICAgaWYgaS5uYW1lID09IHBhcnNlZFsxXVxyXG4gICAgICAgICAgICAgIG5hbWVUZXh0ID0gaS52YWx1ZVxyXG4gICAgICAgICAgc3BsaXRUZXh0W2luZGV4XSA9IFwiPGlucHV0IHR5cGU9XFxcInRleHRcXFwiIHZhbHVlPVxcXCJcIiArIG5hbWVUZXh0ICsgXCJcXFwiIG5hbWU9XFxcImlucHV0XFxcIiBjbGFzcz1cXFwiaW5wdXQtXCIgKyBwYXJzZWRbMV0gKyAgXCJcXFwiPlwiXHJcbiAgICAgICAgIyBFbWJlZGRlZCBjaG9pY2VcclxuICAgICAgICBlbHNlIGlmIHMuc3Vic3RyaW5nKDAsNikgPT0gXCJjaG9pY2VcIlxyXG4gICAgICAgICAgcGFyc2VkID0gcy5zcGxpdChcImNob2ljZSBcIilcclxuICAgICAgICAgIHNwbGl0VGV4dFtpbmRleF0gPSBcIjxhIGhyZWY9XFxcIiNcXFwiIG9uY2xpY2s9XFxcIlNjZW5lLnNlbGVjdENob2ljZUJ5TmFtZUJ5Q2xpY2tpbmcoZXZlbnQsJ1wiK3BhcnNlZFsxXStcIicpXFxcIj5cIlxyXG4gICAgICAgICAgYXNUb0JlQ2xvc2VkKytcclxuICAgICAgICBlbHNlIGlmIHMuc3Vic3RyaW5nKDAsNykgPT0gXCIvY2hvaWNlXCJcclxuICAgICAgICAgIGlmIGFzVG9CZUNsb3NlZCA+IDBcclxuICAgICAgICAgICAgc3BsaXRUZXh0W2luZGV4XSA9IFwiPC9hPlwiXHJcbiAgICAgICAgICAgIGFzVG9CZUNsb3NlZC0tXHJcbiAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHNwbGl0VGV4dFtpbmRleF0gPSBcIlwiXHJcbiAgICAgICAgaW5kZXgrK1xyXG4gICAgICAjIEpvaW4gYWxsIGJhY2sgaW50byBhIHN0cmluZ1xyXG4gICAgICB0ZXh0ID0gc3BsaXRUZXh0LmpvaW4oXCJcIilcclxuICAgICAgcmV0dXJuIHRleHRcclxuXHJcbiAgIyBQYXJzZSBhIHN0YXRlbWVudCB0aGF0IHJldHVybnMgdHJ1ZSBvciBmYWxzZSBvciBjYWxjdWxhdGUgYSB2YWx1ZVxyXG4gIHBhcnNlU3RhdGVtZW50OiAocykgLT5cclxuICAgICMgQ2hlY2sgZm9yIHZhbGlkIHBhcmVudGhlc2VzXHJcbiAgICBpZiAhVXRpbC52YWxpZGF0ZVBhcmVudGhlc2VzKHMpXHJcbiAgICAgIGNvbnNvbGUuZXJyb3IgXCJFUlJPUjogSW52YWxpZCBwYXJlbnRoZXNlcyBpbiBzdGF0ZW1lbnRcIlxyXG4gICAgIyBDbGVhbiBzcGFjZXNcclxuICAgIHMgPSBzLnJlcGxhY2UoL1xccysvZywgJycpO1xyXG4gICAgIyBSZW1vdmUgYWxsIG9wZXJhdG9ycyBhbmQgcGFyZW50aGVzZXNcclxuICAgIHBhcnNlZFN0cmluZyA9IHMuc3BsaXQoL1xcKHxcXCl8XFwrfFxcKnxcXC18XFwvfDw9fD49fDx8Pnw9PXwhPXxcXHxcXHx8JiYvKVxyXG4gICAgcGFyc2VkVmFsdWVzID0gW11cclxuICAgICMgUGFyc2UgdGhlIHN0cmluZ3MgZm9yIGtub3duIHByZWZpeGVzLCBhbmQgcGFyc2UgdGhlIHZhbHVlcyBiYXNlZCBvbiB0aGF0LlxyXG4gICAgZm9yIHZhbCBpbiBwYXJzZWRTdHJpbmdcclxuICAgICAgdHlwZSA9IEBnZXRTdGF0ZW1lbnRUeXBlKHZhbClcclxuICAgICAgc3dpdGNoIHR5cGVcclxuICAgICAgICB3aGVuIFwiaXRlbVwiXHJcbiAgICAgICAgICBmb3IgaSBpbiBkYXRhLmdhbWUuaW52ZW50b3J5XHJcbiAgICAgICAgICAgIGlmIGkubmFtZSA9PSB2YWwuc3Vic3RyaW5nKDQsdmFsLmxlbmd0aClcclxuICAgICAgICAgICAgICBwYXJzZWRWYWx1ZXMucHVzaCBpLmNvdW50XHJcbiAgICAgICAgd2hlbiBcInN0YXRzXCJcclxuICAgICAgICAgIGZvciBpIGluIGRhdGEuZ2FtZS5zdGF0c1xyXG4gICAgICAgICAgICBpZiBpLm5hbWUgPT0gdmFsLnN1YnN0cmluZyg1LHZhbC5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgcGFyc2VkVmFsdWVzLnB1c2ggaS52YWx1ZVxyXG4gICAgICAgIHdoZW4gXCJ2YXJcIlxyXG4gICAgICAgICAgdmFsID0gQGZpbmRWYWx1ZSh2YWwuc3Vic3RyaW5nKDQsdmFsLmxlbmd0aCksdHJ1ZSlcclxuICAgICAgICAgIGlmICFpc05hTihwYXJzZUZsb2F0KHZhbCkpXHJcbiAgICAgICAgICAgIHBhcnNlZFZhbHVlcy5wdXNoIHZhbFxyXG4gICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBwYXJzZWRWYWx1ZXMucHVzaCBcIidcIiArIHZhbCArIFwiJ1wiXHJcbiAgICAgICAgd2hlbiBcImZsb2F0XCJcclxuICAgICAgICAgIHBhcnNlZFZhbHVlcy5wdXNoIHBhcnNlRmxvYXQodmFsKVxyXG4gICAgICAgIHdoZW4gXCJpbnRcIlxyXG4gICAgICAgICAgcGFyc2VkVmFsdWVzLnB1c2ggcGFyc2VJbnQodmFsKVxyXG4gICAgICAgIHdoZW4gXCJzdHJpbmdcIlxyXG4gICAgICAgICAgaWYgdmFsICE9IFwiXCJcclxuICAgICAgICAgICAgcGFyc2VkVmFsdWVzLnB1c2ggXCInXCIgKyB2YWwgKyBcIidcIlxyXG4gICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBwYXJzZWRWYWx1ZXMucHVzaCBcIlwiXHJcbiAgICAjIFJlcGxhY2UgYWxsIHZhcmlhYmxlcyB3aXRoIHRoZWlyIGNvcnJlY3QgdmFsdWVzXHJcbiAgICBmb3IgaSBpbiBbMCAuLiBwYXJzZWRTdHJpbmcubGVuZ3RoLTFdXHJcbiAgICAgIGlmIHBhcnNlZFN0cmluZ1tpXSAhPSBcIlwiICYmIHBhcnNlZFZhbHVlc1tpXSAhPSBcIlwiXHJcbiAgICAgICAgcyA9IHMucmVwbGFjZShuZXcgUmVnRXhwKHBhcnNlZFN0cmluZ1tpXSwnZycpLHBhcnNlZFZhbHVlc1tpXSlcclxuICAgICMgU29sdmUgb3IgY2FsY3VsYXRlIHRoZSBzdGF0ZW1lbnRcclxuICAgIHJldHVybiBldmFsKHMpXHJcblxyXG4gICMgUmVhZCBhIHN0cmluZydzIGJlZ2lubmluZyB0byBkZXRlY3QgaXRzIHR5cGVcclxuICBnZXRTdGF0ZW1lbnRUeXBlOiAodmFsKSAtPlxyXG4gICAgdHlwZSA9IG51bGxcclxuICAgIGlmIHZhbC5zdWJzdHJpbmcoMCw1KSA9PSBcInN0YXQuXCJcclxuICAgICAgdHlwZSA9IFwic3RhdHNcIlxyXG4gICAgZWxzZSBpZiB2YWwuc3Vic3RyaW5nKDAsNCkgPT0gXCJpbnYuXCJcclxuICAgICAgdHlwZSA9IFwiaXRlbVwiXHJcbiAgICBlbHNlIGlmIHZhbC5zdWJzdHJpbmcoMCw0KSA9PSBcInZhci5cIlxyXG4gICAgICB0eXBlID0gXCJ2YXJcIlxyXG4gICAgZWxzZSBpZiAhaXNOYU4ocGFyc2VGbG9hdCh2YWwpKSAmJiB2YWwudG9TdHJpbmcoKS5pbmRleE9mKFwiLlwiKSA9PSAtMVxyXG4gICAgICB0eXBlID0gXCJpbnRcIlxyXG4gICAgZWxzZSBpZiAhaXNOYU4ocGFyc2VGbG9hdCh2YWwpKSAmJiB2YWwudG9TdHJpbmcoKS5pbmRleE9mKFwiLlwiKSAhPSAtMVxyXG4gICAgICB0eXBlID0gXCJmbG9hdFwiXHJcbiAgICBlbHNlXHJcbiAgICAgIHR5cGUgPSBcInN0cmluZ1wiXHJcbiAgICByZXR1cm4gdHlwZVxyXG5cclxuICAjIEZpbmQgYSB2YWx1ZSBmcm9tIHRoZSBnYW1lIGRhdGEganNvblxyXG4gICMgdG9QcmludCA9PSB0cnVlIHJldHVybnMgdGhlIHZhbHVlLCB0b1ByaW50ID09IGZhbHNlIHJldHVybnMgdGhlIG9iamVjdFxyXG4gIGZpbmRWYWx1ZTogKHBhcnNlZCwgdG9QcmludCkgLT5cclxuICAgIHNwbGl0dGVkID0gcGFyc2VkLnNwbGl0KFwiLFwiKVxyXG4gICAgIyBGaW5kIHRoZSBmaXJzdCBvYmplY3QgaW4gaGllcmFyY2h5XHJcbiAgICBpZiAhdG9QcmludFxyXG4gICAgICBpZiBzcGxpdHRlZC5sZW5ndGggPiAxXHJcbiAgICAgICAgdmFyaWFibGUgPSBAZmluZFZhbHVlQnlOYW1lKGRhdGEuZ2FtZSxzcGxpdHRlZFswXSlbMF1cclxuICAgICAgZWxzZVxyXG4gICAgICAgIHZhcmlhYmxlID0gQGZpbmRWYWx1ZUJ5TmFtZShkYXRhLmdhbWUsc3BsaXR0ZWRbMF0pWzFdXHJcbiAgICBlbHNlXHJcbiAgICAgIHZhcmlhYmxlID0gQGZpbmRWYWx1ZUJ5TmFtZShkYXRhLmdhbWUsc3BsaXR0ZWRbMF0pWzBdXHJcbiAgICAjIEZvbGxvdyB0aGUgcGF0aFxyXG4gICAgZm9yIGkgaW4gWzAgLi4gc3BsaXR0ZWQubGVuZ3RoIC0gMV1cclxuICAgICAgaWYgVXRpbC5pc09kZChpKVxyXG4gICAgICAgIHZhcmlhYmxlID0gdmFyaWFibGVbcGFyc2VJbnQoc3BsaXR0ZWRbaV0pXVxyXG4gICAgICBlbHNlIGlmIGkgIT0gMFxyXG4gICAgICAgIGlmICF0b1ByaW50XHJcbiAgICAgICAgICB2YXJpYWJsZSA9IEBmaW5kVmFsdWVCeU5hbWUodmFyaWFibGUsc3BsaXR0ZWRbaV0pWzFdXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgaWYgc3BsaXR0ZWRbaV0gPT0gXCJwYXJzZWRUZXh0XCIgfHwgc3BsaXR0ZWRbaV0gPT0gXCJ0ZXh0XCJcclxuICAgICAgICAgICAgc3BsaXR0ZWRbaV0gPSBcInBhcnNlZFRleHRcIlxyXG4gICAgICAgICAgICB2YXJpYWJsZS5wYXJzZWRUZXh0ID0gUGFyc2VyLnBhcnNlVGV4dCh2YXJpYWJsZS50ZXh0KVxyXG4gICAgICAgICAgdmFyaWFibGUgPSBAZmluZFZhbHVlQnlOYW1lKHZhcmlhYmxlLHNwbGl0dGVkW2ldKVswXVxyXG4gICAgcmV0dXJuIHZhcmlhYmxlXHJcblxyXG4gICMgRmluZCBhbiBvYmplY3QgZnJvbSB0aGUgb2JqZWN0IGhpZXJhcmNoeSBieSBzdHJpbmcgbmFtZVxyXG4gIGZpbmRWYWx1ZUJ5TmFtZTogKG9iaiwgc3RyaW5nKSAtPlxyXG4gICAgcGFydHMgPSBzdHJpbmcuc3BsaXQoJy4nKVxyXG4gICAgbmV3T2JqID0gb2JqW3BhcnRzWzBdXVxyXG4gICAgaWYgcGFydHNbMV1cclxuICAgICAgcGFydHMuc3BsaWNlIDAsIDFcclxuICAgICAgbmV3U3RyaW5nID0gcGFydHMuam9pbignLicpXHJcbiAgICAgIHJldHVybiBAZmluZFZhbHVlQnlOYW1lKG5ld09iaiwgbmV3U3RyaW5nKVxyXG4gICAgciA9IFtdXHJcbiAgICByWzBdID0gbmV3T2JqXHJcbiAgICByWzFdID0gb2JqXHJcbiAgICByZXR1cm4gclxyXG5cclxufVxyXG5cblxyXG4jIyMgU0NFTkUgTUFOSVBVTEFUSU9OICMjI1xyXG5cclxuU2NlbmUgPSB7XHJcblxyXG4gICMgU2VsZWN0IGEgY2hvaWNlIGJ5IGNsaWNraW5nIGEgbGluayBlbWJlZGRlZCBpbiB0ZXh0XHJcbiAgc2VsZWN0Q2hvaWNlQnlOYW1lQnlDbGlja2luZzogKGV2ZW50LCBuYW1lKSAtPlxyXG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcclxuICAgIEBzZWxlY3RDaG9pY2VCeU5hbWUobmFtZSlcclxuXHJcbiAgIyBTZWxlY3QgYSBjaG9pY2UgYnkgbmFtZVxyXG4gIHNlbGVjdENob2ljZUJ5TmFtZTogKG5hbWUpIC0+XHJcbiAgICBmb3IgaSBpbiBkYXRhLmdhbWUuY3VycmVudFNjZW5lLmNob2ljZXNcclxuICAgICAgaWYgaS5uYW1lID09IG5hbWVcclxuICAgICAgICBnYW1lQXJlYS5zZWxlY3RDaG9pY2UoaSlcclxuICAgICAgICBicmVha1xyXG5cclxuICAjIENhbGxlZCB3aGVuIGV4aXRpbmcgYSBzY2VuZVxyXG4gIGV4aXRTY2VuZTogKHNjZW5lKSAtPlxyXG4gICAgVUkudXBkYXRlSW5wdXRzKHNjZW5lKVxyXG5cclxuICAjIENhbGxlZCB3aGVuIGNoYW5naW5nIGEgc2NlbmVcclxuICBjaGFuZ2VTY2VuZTogKHNjZW5lTmFtZXMpIC0+XHJcbiAgICBzY2VuZSA9IEBmaW5kU2NlbmVCeU5hbWUoQHNlbGVjdFJhbmRvbVNjZW5lIHNjZW5lTmFtZXMpXHJcbiAgICBAc2V0dXBTY2VuZShzY2VuZSlcclxuICAgIHJldHVybiBzY2VuZVxyXG5cclxuICAjIFNldHVwIGEgc2NlbmUgY2hhbmdlZCB0b1xyXG4gIHNldHVwU2NlbmU6IChzY2VuZSkgLT5cclxuICAgIEB1cGRhdGVTY2VuZShzY2VuZSlcclxuICAgIEByZWFkSXRlbUFuZFN0YXRzRWRpdHMoZGF0YS5nYW1lLmN1cnJlbnRTY2VuZSlcclxuICAgIEByZWFkU291bmRzKGRhdGEuZ2FtZS5jdXJyZW50U2NlbmUsZmFsc2UpXHJcbiAgICBAcmVhZFNhdmluZyhkYXRhLmdhbWUuY3VycmVudFNjZW5lKVxyXG4gICAgQHJlYWRNaXNjKGRhdGEuZ2FtZS5jdXJyZW50U2NlbmUpXHJcblxyXG4gICMgSWYgbm90IGNoYW5naW5nIHNjZW5lcyBidXQgdXBkYXRlIG5lZWRlZCwgdGhpcyBpcyBjYWxsZWRcclxuICB1cGRhdGVTY2VuZTogKHNjZW5lKSAtPlxyXG4gICAgU2NlbmUuY29tYmluZVNjZW5lVGV4dHMoc2NlbmUpXHJcbiAgICBzY2VuZS5wYXJzZWRUZXh0ID0gUGFyc2VyLnBhcnNlVGV4dCBzY2VuZS5jb21iaW5lZFRleHRcclxuICAgIGRhdGEuZ2FtZS5jdXJyZW50U2NlbmUgPSBzY2VuZVxyXG4gICAgZGF0YS5nYW1lLnBhcnNlZENob2ljZXMgPSBudWxsXHJcbiAgICBUZXh0UHJpbnRlci5wcmludFRleHQoc2NlbmUucGFyc2VkVGV4dClcclxuXHJcbiAgIyBVcGRhdGUgY2hvaWNlIHRleHRzIHdoZW4gdGhleSBhcmUgY2hhbmdlZCAtIFZ1ZS5qcyBkb2Vzbid0IGRldGVjdCB0aGVtIHdpdGhvdXQgdGhpcy5cclxuICB1cGRhdGVDaG9pY2VzOiAtPlxyXG4gICAgZ2FtZUFyZWEuJHNldCAnZ2FtZS5wYXJzZWRDaG9pY2VzJywgZGF0YS5nYW1lLmN1cnJlbnRTY2VuZS5jaG9pY2VzLm1hcCgoY2hvaWNlKSAtPlxyXG4gICAgICBjaG9pY2UucGFyc2VkVGV4dCA9IFBhcnNlci5wYXJzZVRleHQoY2hvaWNlLnRleHQpXHJcbiAgICAgIGlmIGdhbWVBcmVhLmdhbWUuc2V0dGluZ3MuYWx3YXlzU2hvd0Rpc2FibGVkQ2hvaWNlc1xyXG4gICAgICAgIGNob2ljZS5hbHdheXNTaG93ID0gdHJ1ZVxyXG4gICAgICBjaG9pY2VcclxuICAgIClcclxuXHJcbiAgIyBTZWxlY3QgYSByYW5kb20gc2NlbmUgZnJvbSBhIGxpc3Qgc2VwYXJhdGVkIGJ5IHwsIHRha2VzIHN0cmluZ1xyXG4gIHNlbGVjdFJhbmRvbVNjZW5lOiAobmFtZSkgLT5cclxuICAgIHNlcGFyYXRlID0gbmFtZS5zcGxpdChcInxcIilcclxuICAgIGlmIHNlcGFyYXRlLmxlbmd0aCA9PSAxXHJcbiAgICAgIHJldHVybiBzZXBhcmF0ZVswXVxyXG4gICAgcGFyc2VkID0gW11cclxuICAgIGZvciBpIGluIHNlcGFyYXRlXHJcbiAgICAgIGkgPSBpLnN1YnN0cmluZygwLCBpLmxlbmd0aCAtIDEpXHJcbiAgICAgIGkgPSBpLnNwbGl0KFwiW1wiKVxyXG4gICAgICBwYXJzZWQucHVzaChpKVxyXG4gICAgcGFyc2VkID0gQGNob29zZUZyb21NdWx0aXBsZVNjZW5lcyBwYXJzZWRcclxuICAgIHJldHVybiBwYXJzZWRcclxuXHJcbiAgIyBTZWxlY3QgYSBzY2VuZSByYW5kb21seSBmcm9tIG11bHRpcGxlIHNjZW5lcyB3aXRoIGRpZmZlcmVudCBwcm9iYWJpbGl0aWVzLCB0YWtlcyBhcnJheVxyXG4gIGNob29zZUZyb21NdWx0aXBsZVNjZW5lczogKHNjZW5lcykgLT5cclxuICAgIG5hbWVzID0gW11cclxuICAgIGNoYW5jZXMgPSBbXVxyXG4gICAgcmF3Q2hhbmNlcyA9IFtdXHJcbiAgICBwcmV2aW91cyA9IDBcclxuICAgIGZvciBpIGluIHNjZW5lc1xyXG4gICAgICBuYW1lcy5wdXNoIGlbMF1cclxuICAgICAgcHJldmlvdXMgPSBwYXJzZUZsb2F0KGlbMV0pK3ByZXZpb3VzXHJcbiAgICAgIGNoYW5jZXMucHVzaCBwcmV2aW91c1xyXG4gICAgICByYXdDaGFuY2VzLnB1c2ggcGFyc2VGbG9hdChpWzFdKVxyXG4gICAgdG90YWxDaGFuY2UgPSAwXHJcbiAgICBmb3IgaSBpbiByYXdDaGFuY2VzXHJcbiAgICAgIHRvdGFsQ2hhbmNlID0gdG90YWxDaGFuY2UgKyBwYXJzZUZsb2F0KGkpXHJcbiAgICBpZiB0b3RhbENoYW5jZSAhPSAxXHJcbiAgICAgIGNvbnNvbGUuZXJyb3IgXCJFUlJPUjogSW52YWxpZCBzY2VuZSBvZGRzIVwiXHJcbiAgICB2YWx1ZSA9IE1hdGgucmFuZG9tKClcclxuICAgIG5hbWVJbmRleCA9IDBcclxuICAgIGZvciBpIGluIGNoYW5jZXNcclxuICAgICAgaWYgdmFsdWUgPCBpXHJcbiAgICAgICAgcmV0dXJuIG5hbWVzW25hbWVJbmRleF1cclxuICAgICAgbmFtZUluZGV4KytcclxuXHJcbiAgIyBSZXR1cm4gYSBzY2VuZSBieSBpdHMgbmFtZTsgdGhyb3cgYW4gZXJyb3IgaWYgbm90IGZvdW5kLlxyXG4gIGZpbmRTY2VuZUJ5TmFtZTogKG5hbWUpIC0+XHJcbiAgICBmb3IgaSBpbiBkYXRhLmdhbWUuc2NlbmVzXHJcbiAgICAgIGlmIGkubmFtZSA9PSBuYW1lXHJcbiAgICAgICAgcmV0dXJuIGlcclxuICAgIGNvbnNvbGUuZXJyb3IgXCJFUlJPUjogU2NlbmUgYnkgbmFtZSAnXCIrbmFtZStcIicgbm90IGZvdW5kIVwiXHJcblxyXG4gICMgQ29tYmluZSB0aGUgbXVsdGlwbGUgc2NlbmUgdGV4dCByb3dzXHJcbiAgY29tYmluZVNjZW5lVGV4dHM6IChzY2VuZSkgLT5cclxuICAgIHNjZW5lLmNvbWJpbmVkVGV4dCA9IHNjZW5lLnRleHRcclxuICAgIGZvciBrZXkgb2Ygc2NlbmVcclxuICAgICAgaWYgc2NlbmUuaGFzT3duUHJvcGVydHkoa2V5KVxyXG4gICAgICAgIGlmIGtleS5pbmNsdWRlcyhcInRleHQtXCIpXHJcbiAgICAgICAgICBzY2VuZS5jb21iaW5lZFRleHQgPSBzY2VuZS5jb21iaW5lZFRleHQuY29uY2F0KHNjZW5lW2tleV0pXHJcblxyXG4gICMgUmVhZCBpdGVtLCBzdGF0IGFuZCB2YWwgZWRpdCBjb21tYW5kcyBmcm9tIHNjZW5lIG9yIGNob2ljZVxyXG4gIHJlYWRJdGVtQW5kU3RhdHNFZGl0czogKHNvdXJjZSkgLT5cclxuICAgIGlmIHNvdXJjZS5yZW1vdmVJdGVtICE9IHVuZGVmaW5lZFxyXG4gICAgICBJbnZlbnRvcnkuZWRpdEl0ZW1zT3JTdGF0cyhQYXJzZXIucGFyc2VJdGVtT3JTdGF0cyhzb3VyY2UucmVtb3ZlSXRlbSksXCJyZW1vdmVcIix0cnVlKVxyXG4gICAgaWYgc291cmNlLmFkZEl0ZW0gIT0gdW5kZWZpbmVkXHJcbiAgICAgIEludmVudG9yeS5lZGl0SXRlbXNPclN0YXRzKFBhcnNlci5wYXJzZUl0ZW1PclN0YXRzKHNvdXJjZS5hZGRJdGVtKSxcImFkZFwiLHRydWUpXHJcbiAgICBpZiBzb3VyY2Uuc2V0SXRlbSAhPSB1bmRlZmluZWRcclxuICAgICAgSW52ZW50b3J5LmVkaXRJdGVtc09yU3RhdHMoUGFyc2VyLnBhcnNlSXRlbU9yU3RhdHMoc291cmNlLnNldEl0ZW0pLFwic2V0XCIsdHJ1ZSlcclxuICAgIGlmIHNvdXJjZS5yZW1vdmVTdGF0cyAhPSB1bmRlZmluZWRcclxuICAgICAgSW52ZW50b3J5LmVkaXRJdGVtc09yU3RhdHMoUGFyc2VyLnBhcnNlSXRlbU9yU3RhdHMoc291cmNlLnJlbW92ZVN0YXRzKSxcInJlbW92ZVwiLGZhbHNlKVxyXG4gICAgaWYgc291cmNlLmFkZFN0YXRzICE9IHVuZGVmaW5lZFxyXG4gICAgICBJbnZlbnRvcnkuZWRpdEl0ZW1zT3JTdGF0cyhQYXJzZXIucGFyc2VJdGVtT3JTdGF0cyhzb3VyY2UuYWRkU3RhdHMpLFwiYWRkXCIsZmFsc2UpXHJcbiAgICBpZiBzb3VyY2Uuc2V0U3RhdHMgIT0gdW5kZWZpbmVkXHJcbiAgICAgIEludmVudG9yeS5lZGl0SXRlbXNPclN0YXRzKFBhcnNlci5wYXJzZUl0ZW1PclN0YXRzKHNvdXJjZS5zZXRTdGF0cyksXCJzZXRcIixmYWxzZSlcclxuICAgIGlmIHNvdXJjZS5zZXRWYWx1ZSAhPSB1bmRlZmluZWRcclxuICAgICAgZm9yIHZhbCBpbiBzb3VyY2Uuc2V0VmFsdWVcclxuICAgICAgICBJbnZlbnRvcnkuc2V0VmFsdWUodmFsLnBhdGgsdmFsLnZhbHVlKVxyXG4gICAgaWYgc291cmNlLmluY3JlYXNlVmFsdWUgIT0gdW5kZWZpbmVkXHJcbiAgICAgIGZvciB2YWwgaW4gc291cmNlLmluY3JlYXNlVmFsdWVcclxuICAgICAgICBJbnZlbnRvcnkuaW5jcmVhc2VWYWx1ZSh2YWwucGF0aCx2YWwudmFsdWUpXHJcbiAgICBpZiBzb3VyY2UuZGVjcmVhc2VWYWx1ZSAhPSB1bmRlZmluZWRcclxuICAgICAgZm9yIHZhbCBpbiBzb3VyY2UuZGVjcmVhc2VWYWx1ZVxyXG4gICAgICAgIEludmVudG9yeS5kZWNyZWFzZVZhbHVlKHZhbC5wYXRoLHZhbC52YWx1ZSlcclxuXHJcbiAgIyBSZWFkIHNvdW5kIGNvbW1hbmRzIGZyb20gc2NlbmUgb3IgY2hvaWNlXHJcbiAgcmVhZFNvdW5kczogKHNvdXJjZSxjbGlja2VkKSAtPlxyXG4gICAgcGxheWVkID0gZmFsc2VcclxuICAgIGlmIHNvdXJjZS5wbGF5U291bmQgIT0gdW5kZWZpbmVkXHJcbiAgICAgIFNvdW5kLnBsYXlTb3VuZChzb3VyY2UucGxheVNvdW5kLGZhbHNlKVxyXG4gICAgICBwbGF5ZWQgPSB0cnVlXHJcbiAgICBpZiBjbGlja2VkICYmICFwbGF5ZWRcclxuICAgICAgU291bmQucGxheURlZmF1bHRDbGlja1NvdW5kKClcclxuICAgIGlmIHNvdXJjZS5zdGFydE11c2ljICE9IHVuZGVmaW5lZFxyXG4gICAgICBTb3VuZC5zdGFydE11c2ljKHNvdXJjZS5zdGFydE11c2ljKVxyXG4gICAgaWYgc291cmNlLnN0b3BNdXNpYyAhPSB1bmRlZmluZWRcclxuICAgICAgU291bmQuc3RvcE11c2ljKHNvdXJjZS5zdG9wTXVzaWMpXHJcblxyXG4gICMgUmVhZCBtaXNjZWxsYW5lb3VzIHZhbHVlc1xyXG4gIHJlYWRNaXNjOiAoc291cmNlKSAtPlxyXG4gICAgaWYgc291cmNlLnNraXBFbmFibGVkICE9IHVuZGVmaW5lZFxyXG4gICAgICBkYXRhLmdhbWUuY3VycmVudFNjZW5lLnNraXBFbmFibGVkID0gc291cmNlLnNraXBFbmFibGVkXHJcbiAgICBlbHNlXHJcbiAgICAgIGRhdGEuZ2FtZS5jdXJyZW50U2NlbmUuc2tpcEVuYWJsZWQgPSBkYXRhLmdhbWUuc2V0dGluZ3MudGV4dFNraXBFbmFibGVkXHJcbiAgICBpZiBzb3VyY2Uuc2Nyb2xsU3BlZWQgIT0gdW5kZWZpbmVkXHJcbiAgICAgIGRhdGEuZ2FtZS5jdXJyZW50U2NlbmUuc2Nyb2xsU3BlZWQgPSBzb3VyY2Uuc2Nyb2xsU3BlZWRcclxuICAgIGVsc2VcclxuICAgICAgZGF0YS5nYW1lLmN1cnJlbnRTY2VuZS5zY3JvbGxTcGVlZCA9IGRhdGEuZ2FtZS5zZXR0aW5ncy5kZWZhdWx0U2Nyb2xsU3BlZWRcclxuXHJcbiAgIyBSZWFkIHNhdmUgYW5kIGxvYWQgY29tbWFuZHMgZnJvbSBzY2VuZSBvciBjaG9pY2VcclxuICByZWFkU2F2aW5nOiAoc291cmNlKSAtPlxyXG4gICAgaWYgc291cmNlLnNhdmVHYW1lICE9IHVuZGVmaW5lZFxyXG4gICAgICBzYXZlR2FtZSgpXHJcbiAgICBpZiBzb3VyY2UubG9hZEdhbWUgIT0gdW5kZWZpbmVkXHJcbiAgICAgIHNob3dMb2FkTm90aWZpY2F0aW9uKClcclxuXHJcbiAgIyBDaGVjayB3aGV0aGVyIHRoZSByZXF1aXJlbWVudHMgZm9yIGEgY2hvaWNlIGhhdmUgYmVlbiBtZXRcclxuICByZXF1aXJlbWVudHNGaWxsZWQ6IChjaG9pY2UpIC0+XHJcbiAgICByZXFzID0gW11cclxuICAgIGlmIGNob2ljZS5pdGVtUmVxdWlyZW1lbnQgIT0gdW5kZWZpbmVkXHJcbiAgICAgIHJlcXVpcmVtZW50cyA9IFBhcnNlci5wYXJzZUl0ZW1PclN0YXRzIGNob2ljZS5pdGVtUmVxdWlyZW1lbnRcclxuICAgICAgcmVxcy5wdXNoIEludmVudG9yeS5jaGVja1JlcXVpcmVtZW50cyhyZXF1aXJlbWVudHMsIHRydWUpXHJcbiAgICBpZiBjaG9pY2Uuc3RhdHNSZXF1aXJlbWVudCAhPSB1bmRlZmluZWRcclxuICAgICAgcmVxdWlyZW1lbnRzID0gUGFyc2VyLnBhcnNlSXRlbU9yU3RhdHMgY2hvaWNlLnN0YXRzUmVxdWlyZW1lbnRcclxuICAgICAgcmVxcy5wdXNoIEludmVudG9yeS5jaGVja1JlcXVpcmVtZW50cyhyZXF1aXJlbWVudHMsIGZhbHNlKVxyXG4gICAgaWYgY2hvaWNlLnJlcXVpcmVtZW50ICE9IHVuZGVmaW5lZFxyXG4gICAgICByZXFzLnB1c2ggSW52ZW50b3J5LnBhcnNlSWZTdGF0ZW1lbnQgY2hvaWNlLnJlcXVpcmVtZW50XHJcbiAgICBzdWNjZXNzID0gdHJ1ZVxyXG4gICAgZm9yIHIgaW4gcmVxc1xyXG4gICAgICBpZiByID09IGZhbHNlXHJcbiAgICAgICAgc3VjY2VzcyA9IGZhbHNlXHJcbiAgICByZXR1cm4gc3VjY2Vzc1xyXG5cclxufVxyXG5cblxyXG4jIyMgU09VTkRTICMjI1xyXG5cclxuIyBBIGNsYXNzIGZvciBzb3VuZCBmdW5jdGlvbnNcclxuU291bmQgPSB7XHJcblxyXG4gICMgUGxheSB0aGUgZGVmYXVsdCBzb3VuZCBmb3IgY2xpY2tpbmcgYW4gaXRlbVxyXG4gIHBsYXlEZWZhdWx0Q2xpY2tTb3VuZDogKG5hbWUsY2xpY2tlZCkgLT5cclxuICAgIEBwbGF5U291bmQoZGF0YS5nYW1lLnNldHRpbmdzLnNvdW5kU2V0dGluZ3MuZGVmYXVsdENsaWNrU291bmQsZmFsc2UpXHJcblxyXG4gICMgUGxheSBhIHNvdW5kIGJ5IG5hbWVcclxuICBwbGF5U291bmQ6IChuYW1lLCBpc011c2ljKSAtPlxyXG4gICAgZm9yIHMgaW4gZGF0YS5nYW1lLnNvdW5kc1xyXG4gICAgICBpZiBzLm5hbWUgPT0gbmFtZVxyXG4gICAgICAgIHNvdW5kID0gbmV3IEF1ZGlvKGdhbWVQYXRoKycvc291bmRzLycrcy5maWxlKVxyXG4gICAgICAgIGlmIGlzTXVzaWNcclxuICAgICAgICAgIHNvdW5kLnZvbHVtZSA9IGRhdGEuZ2FtZS5zZXR0aW5ncy5zb3VuZFNldHRpbmdzLm11c2ljVm9sdW1lXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgc291bmQudm9sdW1lID0gZGF0YS5nYW1lLnNldHRpbmdzLnNvdW5kU2V0dGluZ3Muc291bmRWb2x1bWVcclxuICAgICAgICBzb3VuZC5wbGF5KClcclxuICAgICAgICByZXR1cm4gc291bmRcclxuXHJcbiAgIyBJcyBtdXNpYyBwbGF5aW5nP1xyXG4gIGlzUGxheWluZzogKG5hbWUpIC0+XHJcbiAgICBmb3IgaSBpbiBkYXRhLm11c2ljXHJcbiAgICAgIGlmIGkucGF1c2VkXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICAgIGVsc2VcclxuICAgICAgICByZXR1cm4gdHJ1ZVxyXG5cclxuICAjIFN0YXJ0IG11c2ljXHJcbiAgc3RhcnRNdXNpYzogKG5hbWUpIC0+XHJcbiAgICBtdXNpYyA9IEBwbGF5U291bmQobmFtZSx0cnVlKVxyXG4gICAgbXVzaWMuYWRkRXZlbnRMaXN0ZW5lciAnZW5kZWQnLCAoLT5cclxuICAgICAgQGN1cnJlbnRUaW1lID0gMFxyXG4gICAgICBAcGxheSgpXHJcbiAgICAgIHJldHVyblxyXG4gICAgKSwgZmFsc2VcclxuICAgIGRhdGEubXVzaWMucHVzaCB7XCJuYW1lXCI6bmFtZSxcIm11c2ljXCI6bXVzaWN9XHJcblxyXG4gICMgU3RvcCBhIG11c2ljIHRoYXQgd2FzIHN0YXJ0ZWQgcHJldmlvdXNseVxyXG4gIHN0b3BNdXNpYzogKG5hbWUpIC0+XHJcbiAgICBmb3IgaSBpbiBkYXRhLm11c2ljXHJcbiAgICAgIGlmIG5hbWUgPT0gaS5uYW1lXHJcbiAgICAgICAgaS5tdXNpYy5wYXVzZSgpXHJcbiAgICAgICAgaW5kZXggPSBkYXRhLm11c2ljLmluZGV4T2YoaSlcclxuICAgICAgICBkYXRhLm11c2ljLnNwbGljZShpbmRleCwxKVxyXG5cclxufVxyXG5cblxyXG4jIyMgVEVYVCBQUklOVElORyAobGV0dGVyIGJ5IGxldHRlciBldGMuKSAjIyNcclxuXHJcbmZ1bGxUZXh0ID0gXCJcIlxyXG50aW1lciA9IG51bGxcclxuY3VycmVudE9mZnNldCA9IDBcclxuY3VycmVudEludGVydmFsID0gMFxyXG5zb3VuZEJ1ZmZlciA9IFtdXHJcbm11c2ljQnVmZmVyID0gW11cclxuc3RvcE11c2ljQnVmZmVyID0gW11cclxuXHJcblRleHRQcmludGVyID0ge1xyXG5cclxuICAjIFByaW50IGEgc2NlbmUncyB0ZXh0XHJcbiAgcHJpbnRUZXh0OiAodGV4dCxpbnRlcnZhbCkgLT5cclxuICAgICMgRGlzYWJsZSB0aGUgc2tpcCBidXR0b25cclxuICAgIGlmIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc2tpcC1idXR0b25cIikgIT0gbnVsbFxyXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3NraXAtYnV0dG9uXCIpLmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICBjbGVhckludGVydmFsIHRpbWVyXHJcbiAgICBmdWxsVGV4dCA9IHRleHRcclxuICAgICNjb25zb2xlLmxvZyBmdWxsVGV4dFxyXG4gICAgY3VycmVudE9mZnNldCA9IDBcclxuICAgIHNvdW5kQnVmZmVyID0gW11cclxuICAgIG11c2ljQnVmZmVyID0gW11cclxuICAgIHN0b3BNdXNpY0J1ZmZlciA9IFtdXHJcbiAgICBpZiBpbnRlcnZhbCA9PSB1bmRlZmluZWRcclxuICAgICAgY3VycmVudEludGVydmFsID0gZGF0YS5nYW1lLmN1cnJlbnRTY2VuZS5zY3JvbGxTcGVlZFxyXG4gICAgZWxzZVxyXG4gICAgICBjdXJyZW50SW50ZXJ2YWwgPSBpbnRlcnZhbFxyXG4gICAgdGltZXIgPSBzZXRJbnRlcnZhbChAb25UaWNrLCBjdXJyZW50SW50ZXJ2YWwpXHJcblxyXG4gICMgSW5zdGFudGx5IHNob3cgYWxsIHRleHRcclxuICBjb21wbGV0ZTogLT5cclxuICAgICMgUmUtZW5hYmxlIHNraXAgYnV0dG9uXHJcbiAgICBpZiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3NraXAtYnV0dG9uXCIpICE9IG51bGxcclxuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNza2lwLWJ1dHRvblwiKS5kaXNhYmxlZCA9IHRydWU7XHJcblxyXG4gICAgIyBSZXNldCB0aW1lclxyXG4gICAgY2xlYXJJbnRlcnZhbCB0aW1lclxyXG4gICAgdGltZXIgPSBudWxsXHJcblxyXG4gICAgIyBQbGF5IG1pc3NlZCBzb3VuZHNcclxuICAgIHNzID0gW11cclxuICAgIGlmIGZ1bGxUZXh0LmluZGV4T2YoXCJwbGF5LXNvdW5kXCIpID4gLTFcclxuICAgICAgcyA9IGZ1bGxUZXh0LnNwbGl0KFwicGxheS1zb3VuZCBcIilcclxuICAgICAgZm9yIGkgaW4gc1xyXG4gICAgICAgIHNzLnB1c2goaS5zcGxpdCgvXFxzfFxcXCIvKVswXSlcclxuICAgIGlmIHNzLmxlbmd0aCA+IDBcclxuICAgICAgZm9yIGkgaW4gWzAgLi4gc3MubGVuZ3RoXVxyXG4gICAgICAgIGlmICEoc3NbaV0gaW4gc291bmRCdWZmZXIpXHJcbiAgICAgICAgICBTb3VuZC5wbGF5U291bmQoc3NbaV0pXHJcbiAgICBzcyA9IFtdXHJcbiAgICBpZiBmdWxsVGV4dC5pbmRleE9mKFwicGxheS1tdXNpY1wiKSA+IC0xXHJcbiAgICAgIHMgPSBmdWxsVGV4dC5zcGxpdChcInBsYXktbXVzaWMgXCIpXHJcbiAgICAgIGZvciBpIGluIHNcclxuICAgICAgICBzcy5wdXNoKGkuc3BsaXQoL1xcc3xcXFwiLylbMF0pXHJcbiAgICBpZiBzcy5sZW5ndGggPiAwXHJcbiAgICAgIGZvciBpIGluIFswIC4uIHNzLmxlbmd0aF1cclxuICAgICAgICBpZiAhKHNzW2ldIGluIG11c2ljQnVmZmVyKVxyXG4gICAgICAgICAgU291bmQuc3RhcnRNdXNpYyhzc1tpXSlcclxuICAgIHNzID0gW11cclxuICAgIGlmIGZ1bGxUZXh0LmluZGV4T2YoXCJzdG9wLW11c2ljXCIpID4gLTFcclxuICAgICAgcyA9IGZ1bGxUZXh0LnNwbGl0KFwic3RvcC1tdXNpYyBcIilcclxuICAgICAgZm9yIGkgaW4gc1xyXG4gICAgICAgIHNzLnB1c2goaS5zcGxpdCgvXFxzfFxcXCIvKVswXSlcclxuICAgIGlmIHNzLmxlbmd0aCA+IDBcclxuICAgICAgZm9yIGkgaW4gWzAgLi4gc3MubGVuZ3RoXVxyXG4gICAgICAgIGlmICEoc3NbaV0gaW4gc3RvcE11c2ljQnVmZmVyKVxyXG4gICAgICAgICAgU291bmQuc3RvcE11c2ljKHNzW2ldKVxyXG5cclxuICAgICMgU2V0IHByaW50ZWQgdGV4dCBhbmQgdXBkYXRlIGNob2ljZXNcclxuICAgIGRhdGEucHJpbnRlZFRleHQgPSBmdWxsVGV4dFxyXG4gICAgU2NlbmUudXBkYXRlQ2hvaWNlcygpXHJcblxyXG4gICMgQ2hhbmdlIHRoZSBpbnRlcnZhbCB0aW1lclxyXG4gIGNoYW5nZVRpbWVyOiAodGltZSkgLT5cclxuICAgIGNsZWFySW50ZXJ2YWwgdGltZXJcclxuICAgIHRpbWVyID0gc2V0SW50ZXJ2YWwoQG9uVGljaywgdGltZSlcclxuXHJcbiAgIyBSZXR1cm4gdGhlIGludGVydmFsIHRpbWVyIHRvIGRlZmF1bHRcclxuICByZXNldFRpbWVyOiAtPlxyXG4gICAgY2xlYXJJbnRlcnZhbCB0aW1lclxyXG4gICAgdGltZXIgPSBzZXRJbnRlcnZhbChAb25UaWNrLCBjdXJyZW50SW50ZXJ2YWwpXHJcblxyXG4gICMgU2hvdyBhIG5ldyBsZXR0ZXJcclxuICBvblRpY2s6IC0+XHJcbiAgICBpZiBjdXJyZW50SW50ZXJ2YWwgPT0gMFxyXG4gICAgICBUZXh0UHJpbnRlci5jb21wbGV0ZSgpXHJcbiAgICAgIHJldHVyblxyXG4gICAgI2NvbnNvbGUubG9nIGN1cnJlbnRPZmZzZXQgKyBcIjogXCIgKyBmdWxsVGV4dFtjdXJyZW50T2Zmc2V0XVxyXG4gICAgaWYgZnVsbFRleHRbY3VycmVudE9mZnNldF0gPT0gJzwnXHJcbiAgICAgIGkgPSBjdXJyZW50T2Zmc2V0XHJcbiAgICAgIHN0ciA9IFwiXCJcclxuICAgICAgd2hpbGUgZnVsbFRleHRbaV0gIT0gJz4nXHJcbiAgICAgICAgaSsrXHJcbiAgICAgICAgc3RyID0gc3RyICsgZnVsbFRleHRbaV1cclxuICAgICAgc3RyID0gc3RyLnN1YnN0cmluZygwLHN0ci5sZW5ndGgtMSlcclxuICAgICAgI2NvbnNvbGUubG9nIFwiSGFhISBcIiArIHN0clxyXG4gICAgICBpZiBzdHIuaW5kZXhPZihcImRpc3BsYXk6bm9uZTtcIikgPiAtMVxyXG4gICAgICAgICNjb25zb2xlLmxvZyBcIkRJU1BMQVkgTk9ORSBGT1VORFwiXHJcbiAgICAgICAgZGlzcCA9IFwiXCJcclxuICAgICAgICBpKytcclxuICAgICAgICB3aGlsZSBkaXNwLmluZGV4T2YoXCIvc3BhblwiKSA9PSAtMVxyXG4gICAgICAgICAgaSsrXHJcbiAgICAgICAgICBkaXNwID0gZGlzcCArIGZ1bGxUZXh0W2ldXHJcbiAgICAgICAgI2NvbnNvbGUubG9nIFwiRGlzcDogXCIgKyBkaXNwXHJcbiAgICAgIGlmIHN0ci5pbmRleE9mKFwicGxheS1zb3VuZFwiKSA+IC0xICYmIHN0ci5pbmRleE9mKFwiZGlzcGxheTpub25lO1wiKSA+IC0xXHJcbiAgICAgICAgcyA9IHN0ci5zcGxpdChcInBsYXktc291bmQgXCIpXHJcbiAgICAgICAgcyA9IHNbMV0uc3BsaXQoL1xcc3xcXFwiLylbMF1cclxuICAgICAgICBzb3VuZEJ1ZmZlci5wdXNoKHMpXHJcbiAgICAgIGlmIHN0ci5pbmRleE9mKFwicGxheS1tdXNpY1wiKSA+IC0xICYmIHN0ci5pbmRleE9mKFwiZGlzcGxheTpub25lO1wiKSA+IC0xXHJcbiAgICAgICAgcyA9IHN0ci5zcGxpdChcInBsYXktbXVzaWMgXCIpXHJcbiAgICAgICAgcyA9IHNbMV0uc3BsaXQoL1xcc3xcXFwiLylbMF1cclxuICAgICAgICBtdXNpY0J1ZmZlci5wdXNoKHMpXHJcbiAgICAgIGlmIHN0ci5pbmRleE9mKFwiZGlzcGxheTpub25lO1wiKSA9PSAtMVxyXG4gICAgICAgIGlmIHN0ci5pbmRleE9mKFwicGxheS1zb3VuZFwiKSA+IC0xXHJcbiAgICAgICAgICBzID0gc3RyLnNwbGl0KFwicGxheS1zb3VuZCBcIilcclxuICAgICAgICAgIHMgPSBzWzFdLnNwbGl0KC9cXHN8XFxcIi8pWzBdXHJcbiAgICAgICAgICBzb3VuZEJ1ZmZlci5wdXNoKHMpXHJcbiAgICAgICAgICBTb3VuZC5wbGF5U291bmQocylcclxuICAgICAgICBpZiBzdHIuaW5kZXhPZihcInBsYXktbXVzaWNcIikgPiAtMVxyXG4gICAgICAgICAgcyA9IHN0ci5zcGxpdChcInBsYXktbXVzaWMgXCIpXHJcbiAgICAgICAgICBzID0gc1sxXS5zcGxpdCgvXFxzfFxcXCIvKVswXVxyXG4gICAgICAgICAgbXVzaWNCdWZmZXIucHVzaChzKVxyXG4gICAgICAgICAgU291bmQuc3RhcnRNdXNpYyhzKVxyXG4gICAgICAgIGlmIHN0ci5pbmRleE9mKFwic3RvcC1tdXNpY1wiKSA+IC0xXHJcbiAgICAgICAgICBzID0gc3RyLnNwbGl0KFwic3RvcC1tdXNpYyBcIilcclxuICAgICAgICAgIHMgPSBzWzFdLnNwbGl0KC9cXHN8XFxcIi8pWzBdXHJcbiAgICAgICAgICBzdG9wTXVzaWNCdWZmZXIucHVzaChzKVxyXG4gICAgICAgICAgU291bmQuc3RvcE11c2ljKHMpXHJcbiAgICAgICAgaWYgc3RyLmluZGV4T2YoXCJzZXQtc3BlZWRcIikgPiAtMVxyXG4gICAgICAgICAgcyA9IHN0ci5zcGxpdChcInNldC1zcGVlZCBcIilcclxuICAgICAgICAgIHMgPSBzWzFdLnNwbGl0KC9cXHN8XFxcIi8pWzBdXHJcbiAgICAgICAgICBUZXh0UHJpbnRlci5jaGFuZ2VUaW1lcihQYXJzZXIucGFyc2VTdGF0ZW1lbnQocykpXHJcbiAgICAgICAgaWYgc3RyLmluZGV4T2YoXCJkZWZhdWx0LXNwZWVkXCIpID4gLTFcclxuICAgICAgICAgIFRleHRQcmludGVyLnJlc2V0VGltZXIoKVxyXG4gICAgICBjdXJyZW50T2Zmc2V0ID0gaVxyXG5cclxuICAgIGN1cnJlbnRPZmZzZXQrK1xyXG4gICAgaWYgY3VycmVudE9mZnNldCA9PSBmdWxsVGV4dC5sZW5ndGhcclxuICAgICAgVGV4dFByaW50ZXIuY29tcGxldGUoKVxyXG4gICAgICByZXR1cm5cclxuXHJcbiAgICBpZiBmdWxsVGV4dFtjdXJyZW50T2Zmc2V0XSA9PSAnPCdcclxuICAgICAgZGF0YS5wcmludGVkVGV4dCA9IGZ1bGxUZXh0LnN1YnN0cmluZygwLCBjdXJyZW50T2Zmc2V0LTEpXHJcbiAgICBlbHNlXHJcbiAgICAgIGRhdGEucHJpbnRlZFRleHQgPSBmdWxsVGV4dC5zdWJzdHJpbmcoMCwgY3VycmVudE9mZnNldClcclxuXHJcbn1cclxuXG5cclxuIyMjIFVJIFNDUklQVFMgIyMjXHJcblxyXG5VSSA9IHtcclxuXHJcbiAgIyBTaG93IHRoZSBzYXZlIG5vdGlmaWNhdGlvbiB3aW5kb3csIGFuZCB1cGRhdGUgaXRzIHRleHRcclxuICBzaG93U2F2ZU5vdGlmaWNhdGlvbjogKHRleHQpIC0+XHJcbiAgICBlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzYXZlLW5vdGlmaWNhdGlvblwiKVxyXG4gICAgdGV4dEFyZWEgPSBlLnF1ZXJ5U2VsZWN0b3JBbGwoXCJ0ZXh0YXJlYVwiKVxyXG4gICAgdGV4dEFyZWFbMF0udmFsdWUgPSB0ZXh0XHJcbiAgICBlLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xyXG5cclxuICAjIENsb3NlIHRoZSBzYXZlIG5vdGlmaWNhdGlvbiB3aW5kb3dcclxuICBjbG9zZVNhdmVOb3RpZmljYXRpb246IC0+XHJcbiAgICBlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzYXZlLW5vdGlmaWNhdGlvblwiKVxyXG4gICAgZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG5cclxuICAjIFNob3cgdGhlIGxvYWQgbm90aWZpY2F0aW9uIHdpbmRvd1xyXG4gIHNob3dMb2FkTm90aWZpY2F0aW9uOiAtPlxyXG4gICAgaWYgZ2FtZUFyZWEuZ2FtZS5zZXR0aW5ncy5zYXZlTW9kZSA9PSBcInRleHRcIlxyXG4gICAgICBlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsb2FkLW5vdGlmaWNhdGlvblwiKVxyXG4gICAgICBlLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xyXG4gICAgZWxzZVxyXG4gICAgICBsb2FkR2FtZSgpXHJcblxyXG4gICMgQ2xvc2UgdGhlIGxvYWQgbm90aWZpY2F0aW9uIC0gaWYgbG9hZCwgdGhlbiBsb2FkIGEgc2F2ZS5cclxuICBjbG9zZUxvYWROb3RpZmljYXRpb246IChsb2FkKSAtPlxyXG4gICAgZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibG9hZC1ub3RpZmljYXRpb25cIilcclxuICAgIGlmIGxvYWRcclxuICAgICAgdGV4dEFyZWEgPSBlLnF1ZXJ5U2VsZWN0b3JBbGwoXCJ0ZXh0YXJlYVwiKVxyXG4gICAgICBsb2FkR2FtZSh0ZXh0QXJlYVswXS52YWx1ZSlcclxuICAgICAgdGV4dEFyZWFbMF0udmFsdWUgPSBcIlwiXHJcbiAgICBlLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcclxuXHJcbiAgIyBVcGRhdGUgdGhlIHZhbHVlcyBvZiB0aGUgaW5wdXQgZmllbGRzXHJcbiAgdXBkYXRlSW5wdXRzOiAoc2NlbmUpIC0+XHJcbiAgICBpbnB1dHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWUtYXJlYVwiKS5xdWVyeVNlbGVjdG9yQWxsKFwiaW5wdXRcIilcclxuICAgIGZvciBpIGluIGlucHV0c1xyXG4gICAgICBmb3IgYSBpbiBkYXRhLmdhbWUuc3RhdHNcclxuICAgICAgICBpZiBhLm5hbWUgPT0gaS5jbGFzc05hbWUuc3Vic3RyaW5nKDYsaS5jbGFzc05hbWUubGVuZ3RoKVxyXG4gICAgICAgICAgYS52YWx1ZSA9IFV0aWwuc3RyaXBIVE1MKGkudmFsdWUpXHJcblxyXG59XHJcblxyXG4jIFRoZSBidXR0b24gdGhhdCBjYW4gYmUgdXNlZCB0byBjb3B5IHRoZSB0ZXh0IGZyb20gdGhlIHNhdmUgd2luZG93LlxyXG5jb3B5QnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2NvcHktYnV0dG9uJylcclxuY29weUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyICdjbGljaycsIChldmVudCkgLT5cclxuICBjb3B5VGV4dGFyZWEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmUtbm90aWZpY2F0aW9uXCIpLnF1ZXJ5U2VsZWN0b3IoXCJ0ZXh0YXJlYVwiKVxyXG4gIGNvcHlUZXh0YXJlYS5zZWxlY3QoKVxyXG4gIHRyeVxyXG4gICAgc3VjY2Vzc2Z1bCA9IGRvY3VtZW50LmV4ZWNDb21tYW5kKCdjb3B5JylcclxuICBjYXRjaCBlcnJcclxuICAgIGNvbnNvbGUuZXJyb3IgXCJDb3B5aW5nIHRvIGNsaXBib2FyZCBmYWlsZWQ6IFwiK2VyclxyXG4gIHJldHVyblxyXG5cblxyXG4jIyMgVVRJTElUWSBTQ1JJUFRTICMjI1xyXG5cclxuVXRpbCA9IHtcclxuICAjIENoZWNrIGlmIGEgdmFsdWUgaXMgZXZlbiBvciBub3RcclxuICBpc0V2ZW46IChuKSAtPlxyXG4gICAgbiAlIDIgPT0gMFxyXG5cclxuICAjIENoZWNrIGlmIGEgdmFsdWUgaXMgb2RkIG9yIG5vdFxyXG4gIGlzT2RkOiAobikgLT5cclxuICAgIE1hdGguYWJzKG4gJSAyKSA9PSAxXHJcblxyXG4gICMgUmVtb3ZlIEhUTUwgdGFncyBmcm9tIGEgc3RyaW5nIC0gdXNlZCB0byBjbGVhbiBpbnB1dFxyXG4gIHN0cmlwSFRNTDogKHRleHQpIC0+XHJcbiAgICByZWdleCA9IC8oPChbXj5dKyk+KS9pZ1xyXG4gICAgdGV4dC5yZXBsYWNlIHJlZ2V4LCAnJ1xyXG5cclxuICAjIENoZWNrIGlmIHRoZSBzdHJpbmcgaGFzIHZhbGlkIHBhcmVudGhlc2VzXHJcbiAgdmFsaWRhdGVQYXJlbnRoZXNlczogKHMpIC0+XHJcbiAgICBvcGVuID0gMFxyXG4gICAgZm9yIGkgaW4gc1xyXG4gICAgICBpZiBpID09IFwiKFwiXHJcbiAgICAgICAgb3BlbisrXHJcbiAgICAgIGlmIGkgPT0gXCIpXCJcclxuICAgICAgICBpZiBvcGVuID4gMFxyXG4gICAgICAgICAgb3Blbi0tXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICBpZiBvcGVuID09IDBcclxuICAgICAgcmV0dXJuIHRydWVcclxuICAgIGVsc2VcclxuICAgICAgcmV0dXJuIGZhbHNlXHJcbn1cclxuIl19
