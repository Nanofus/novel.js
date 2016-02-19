
/* SAVING AND LOADING */
var GameManager, InputManager, Inventory, Parser, Scene, Sound, TextPrinter, UI, Util, buffersExecuted, copyButton, currentOffset, data, defaultInterval, executeBuffer, fullText, gameArea, gamePath, interval, musicBuffer, parsedJavascriptCommands, printCompleted, scrollSound, soundBuffer, speedMod, stopMusicBuffer, tickCounter, tickSoundFrequency, tickSpeedMultiplier,
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
    var cookie, loadedData;
    if (game === void 0) {
      if (this.loadCookie("gameData") !== '') {
        console.log("Cookie found!");
        cookie = this.loadCookie("gameData");
        console.log("Cookie loaded");
        console.log(cookie);
        loadedData = JSON.parse(atob(this.loadCookie("gameData")));
        return this.prepareLoadedGame(loadedData);
      }
    } else if (game !== void 0) {
      loadedData = JSON.parse(atob(game));
      return this.prepareLoadedGame(loadedData);
    }
  },
  prepareLoadedGame: function(loadedData) {
    if (data.game.gameName !== loadedData.gameName) {
      console.error("ERROR! Game name mismatch");
      return;
    }
    if (data.game.version !== loadedData.version) {
      console.warn("WARNING! Game version mismatch");
    }
    data.game = loadedData;
    data.debugMode = data.game.debugMode;
    return Scene.updateScene(data.game.currentScene, true);
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


/* HANDLES KEYBOARD INPUT */

InputManager = {
  keyPressed: function(charCode) {
    if (charCode === 13 || charCode === 32) {
      if (data.game.settings.scrollSettings.continueWithKeyboard) {
        Scene.tryContinue();
      }
      if (data.game.settings.scrollSettings.skipWithKeyboard) {
        TextPrinter.trySkip();
      }
      if (data.game.settings.scrollSettings.fastScrollWithKeyboard) {
        return TextPrinter.fastScroll();
      }
    }
  },
  keyUp: function(charCode) {
    if (charCode === 13 || charCode === 32) {
      return TextPrinter.stopFastScroll();
    }
  }
};

document.onkeypress = function(evt) {
  var charCode;
  evt = evt || window.event;
  charCode = evt.keyCode || evt.which;
  return InputManager.keyPressed(charCode);
};

document.onkeyup = function(evt) {
  var charCode;
  evt = evt || window.event;
  charCode = evt.keyCode || evt.which;
  return InputManager.keyUp(charCode);
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
  parsedJavascriptCommands: [],
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
      Scene.readExecutes(choice);
      if (choice.nextScene !== "") {
        return Scene.changeScene(choice.nextScene);
      } else if (choice.nextScene === "") {
        if (choice.nextChoice !== void 0) {
          return Scene.selectChoiceByName(Scene.selectRandomOption(choice.nextChoice));
        } else {
          return Scene.updateScene(this.game.currentScene, true);
        }
      }
    }
  }
});


/* And finally, start the game... */

GameManager.startGame();

parsedJavascriptCommands = [];


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
    var asToBeClosed, i, index, k, l, len, len1, len2, len3, m, nameText, o, p, parsed, q, ref, ref1, ref2, ref3, ref4, s, spansToBeClosed, splitText, t, tagName, value;
    if (text !== void 0) {
      ref = data.game.tagPresets;
      for (k = 0, len = ref.length; k < len; k++) {
        i = ref[k];
        tagName = "[p " + i.name + "]";
        if (text.indexOf(tagName) > -1) {
          text = text.split(tagName).join(i.start);
        }
        tagName = "[/p " + i.name + "]";
        if (text.indexOf(tagName) > -1) {
          text = text.split(tagName).join(i.end);
        }
      }
      for (i = l = 0; l <= 99; i = ++l) {
        text = text.split("[s" + i + "]").join("<span class=\"highlight-" + i + "\">");
      }
      text = text.split("[/s]").join("</span>");
      splitText = text.split(/\[|\]/);
      spansToBeClosed = 0;
      asToBeClosed = 0;
      for (index = m = 0, ref1 = splitText.length - 1; 0 <= ref1 ? m <= ref1 : m >= ref1; index = 0 <= ref1 ? ++m : --m) {
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
          ref2 = data.game.stats;
          for (o = 0, len1 = ref2.length; o < len1; o++) {
            i = ref2[o];
            if (i.name === value) {
              splitText[index] = i.value;
            }
          }
        } else if (s.substring(0, 4) === "inv.") {
          value = s.substring(4, s.length);
          ref3 = data.game.inventory;
          for (q = 0, len2 = ref3.length; q < len2; q++) {
            i = ref3[q];
            if (i.name === value) {
              splitText[index] = i.count;
            }
          }
        } else if (s.substring(0, 5) === "print") {
          parsed = s.split("print ");
          splitText[index] = this.parseStatement(parsed[1]);
        } else if (s.substring(0, 4) === "exec") {
          parsed = s.substring(5, s.length);
          p = data.parsedJavascriptCommands.push(parsed);
          p--;
          splitText[index] = "<span class=\"execute-command com-" + p + "\"></span>";
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
        } else if (s.substring(0, 12) === "/scrollSound") {
          splitText[index] = "<span class=\"default-scroll-sound\"></span>";
        } else if (s.substring(0, 11) === "scrollSound") {
          parsed = s.split("scrollSound ");
          splitText[index] = "<span class=\"set-scroll-sound " + parsed[1] + "\"></span>";
        } else if (s.substring(0, 5) === "input") {
          parsed = s.split("input ");
          nameText = "";
          ref4 = data.game.stats;
          for (t = 0, len3 = ref4.length; t < len3; t++) {
            i = ref4[t];
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
            parsedValues.push(parseFloat(val).toFixed(5));
          } else {
            parsedValues.push("'" + val + "'");
          }
          break;
        case "float":
          parsedValues.push(parseFloat(val).toFixed(5));
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
  tryContinue: function() {
    if (printCompleted && tickSpeedMultiplier === 1) {
      return this.selectChoiceByName("Continue");
    }
  },
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
    scene = this.findSceneByName(this.selectRandomOption(sceneNames));
    this.setupScene(scene);
    return scene;
  },
  setupScene: function(scene) {
    this.updateScene(scene, false);
    this.readItemAndStatsEdits(data.game.currentScene);
    this.readSounds(data.game.currentScene, false);
    this.readSaving(data.game.currentScene);
    this.readExecutes(data.game.currentScene);
    this.readMisc(data.game.currentScene);
    return TextPrinter.printText(scene.parsedText, false);
  },
  updateScene: function(scene, onlyUpdating) {
    Scene.combineSceneTexts(scene);
    scene.parsedText = Parser.parseText(scene.combinedText);
    data.game.currentScene = scene;
    if (!onlyUpdating) {
      return data.game.parsedChoices = null;
    } else {
      TextPrinter.printText(scene.parsedText, true);
      return TextPrinter.complete();
    }
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
  selectRandomOption: function(name) {
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
    parsed = this.chooseRandomly(parsed);
    return parsed;
  },
  chooseRandomly: function(options) {
    var chances, i, k, l, len, len1, len2, m, nameIndex, names, previous, rawChances, totalChance, value;
    names = [];
    chances = [];
    rawChances = [];
    previous = 0;
    for (k = 0, len = options.length; k < len; k++) {
      i = options[k];
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
      console.error("ERROR: Invalid scene or choice odds (should add up to exactly 1)!");
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
      Sound.stopMusic(source.stopMusic);
    }
    if (source.scrollSound !== void 0) {
      return data.game.currentScene.scrollSound = source.scrollSound;
    } else {
      if (data.game.settings.soundSettings.defaultScrollSound) {
        return data.game.currentScene.scrollSound = data.game.settings.soundSettings.defaultScrollSound;
      } else {
        return data.game.currentScene.scrollSound = void 0;
      }
    }
  },
  readExecutes: function(source) {
    if (source.executeJs !== void 0) {
      return eval(source.executeJs);
    }
  },
  readMisc: function(source) {
    if (source.skipEnabled !== void 0) {
      data.game.currentScene.skipEnabled = source.skipEnabled;
    } else {
      data.game.currentScene.skipEnabled = data.game.settings.scrollSettings.textSkipEnabled;
    }
    if (source.scrollSpeed !== void 0) {
      return data.game.currentScene.scrollSpeed = source.scrollSpeed;
    } else {
      return data.game.currentScene.scrollSpeed = data.game.settings.scrollSettings.defaultScrollSpeed;
    }
  },
  readSaving: function(source) {
    if (source.saveGame !== void 0) {
      GameManager.saveGame();
    }
    if (source.loadGame !== void 0) {
      return UI.showLoadNotification();
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

currentOffset = 0;

defaultInterval = 0;

soundBuffer = [];

musicBuffer = [];

stopMusicBuffer = [];

executeBuffer = [];

buffersExecuted = false;

scrollSound = null;

tickSoundFrequency = 1;

tickCounter = 0;

tickSpeedMultiplier = 1;

speedMod = false;

interval = 0;

printCompleted = false;

TextPrinter = {
  printText: function(text, noBuffers) {
    printCompleted = false;
    data.printedText = "";
    if (document.querySelector("#skip-button") !== null) {
      document.querySelector("#skip-button").disabled = false;
    }
    fullText = text;
    currentOffset = -1;
    soundBuffer = [];
    musicBuffer = [];
    stopMusicBuffer = [];
    executeBuffer = [];
    buffersExecuted = false;
    if (noBuffers) {
      buffersExecuted = true;
    }
    defaultInterval = data.game.currentScene.scrollSpeed;
    this.setTickSoundFrequency(defaultInterval);
    return setTimeout(this.onTick(), defaultInterval);
  },
  trySkip: function() {
    if (data.game.currentScene.skipEnabled) {
      return this.complete();
    }
  },
  complete: function() {
    var first, i, k, l, len, len1, len2, len3, m, o, q, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, s, ss, t, u, v;
    printCompleted = true;
    currentOffset = 0;
    if (document.querySelector("#skip-button") !== null) {
      document.querySelector("#skip-button").disabled = true;
    }
    if (!buffersExecuted) {
      ss = [];
      first = true;
      if (fullText.indexOf("play-sound") > -1) {
        s = fullText.split("play-sound ");
        for (k = 0, len = s.length; k < len; k++) {
          i = s[k];
          if (!first) {
            ss.push(i.split(/\s|\"/)[0]);
          }
          first = false;
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
      first = true;
      if (fullText.indexOf("play-music") > -1) {
        s = fullText.split("play-music ");
        for (m = 0, len1 = s.length; m < len1; m++) {
          i = s[m];
          if (!first) {
            ss.push(i.split(/\s|\"/)[0]);
          }
          first = false;
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
      first = true;
      if (fullText.indexOf("stop-music") > -1) {
        s = fullText.split("stop-music ");
        for (q = 0, len2 = s.length; q < len2; q++) {
          i = s[q];
          if (!first) {
            ss.push(i.split(/\s|\"/)[0]);
          }
          first = false;
        }
      }
      if (ss.length > 0) {
        for (i = t = 0, ref4 = ss.length; 0 <= ref4 ? t <= ref4 : t >= ref4; i = 0 <= ref4 ? ++t : --t) {
          if (!(ref5 = ss[i], indexOf.call(stopMusicBuffer, ref5) >= 0)) {
            Sound.stopMusic(ss[i]);
          }
        }
      }
      ss = [];
      first = true;
      if (fullText.indexOf("execute-command") > -1) {
        s = fullText.split("execute-command ");
        for (u = 0, len3 = s.length; u < len3; u++) {
          i = s[u];
          if (!first) {
            ss.push(i.split(/\s|\"/)[0]);
          }
          first = false;
        }
      }
      if (ss.length > 0) {
        for (i = v = 0, ref6 = ss.length; 0 <= ref6 ? v <= ref6 : v >= ref6; i = 0 <= ref6 ? ++v : --v) {
          if (!(ref7 = ss[i], indexOf.call(executeBuffer, ref7) >= 0) && ss[i] !== void 0) {
            eval(data.parsedJavascriptCommands[parseInt(s.substring(4, s.length))]);
          }
        }
      }
      buffersExecuted = true;
    }
    data.printedText = fullText;
    return Scene.updateChoices();
  },
  fastScroll: function() {
    if (data.game.currentScene.skipEnabled) {
      return tickSpeedMultiplier = data.game.settings.scrollSettings.fastScrollSpeedMultiplier;
    }
  },
  stopFastScroll: function() {
    return tickSpeedMultiplier = 1;
  },
  setTickSoundFrequency: function(freq) {
    var threshold;
    threshold = data.game.settings.scrollSettings.tickFreqThreshold;
    tickSoundFrequency = 1;
    if (freq <= (threshold * 2)) {
      tickSoundFrequency = 2;
    }
    if (freq <= threshold) {
      return tickSoundFrequency = 3;
    }
  },
  onTick: function() {
    var offsetChanged;
    if (!speedMod) {
      interval = defaultInterval;
    }
    if (defaultInterval === 0) {
      TextPrinter.complete();
      return;
    }
    if (data.printedText === fullText) {
      return;
    }
    offsetChanged = false;
    while (fullText[currentOffset] === ' ' || fullText[currentOffset] === '<' || fullText[currentOffset] === '>') {
      TextPrinter.readTags();
    }
    data.printedText = fullText.substring(0, currentOffset);
    if (!offsetChanged) {
      currentOffset++;
    }
    if (currentOffset >= fullText.length) {
      TextPrinter.complete();
      return;
    }
    tickCounter++;
    if (tickCounter >= tickSoundFrequency) {
      if (scrollSound !== "none" && interval !== 0) {
        if (scrollSound !== null) {
          Sound.playSound(scrollSound);
        } else if (data.game.currentScene.scrollSound !== void 0) {
          Sound.playSound(data.game.currentScene.scrollSound);
        }
        tickCounter = 0;
      }
    }
    this.setTickSoundFrequency(interval / tickSpeedMultiplier);
    return setTimeout((function() {
      TextPrinter.onTick();
    }), interval / tickSpeedMultiplier);
  },
  readTags: function() {
    var disp, i, offsetChanged, s, spans, str;
    if (fullText[currentOffset] === ' ') {
      currentOffset++;
    }
    if (fullText[currentOffset] === '>') {
      currentOffset++;
    }
    if (fullText[currentOffset] === '<') {
      i = currentOffset;
      str = "";
      i++;
      while (fullText[i - 1] !== '>' && fullText[i] !== '<') {
        str = str + fullText[i];
        i++;
      }
      str = str.substring(1, str.length);
      if (str.indexOf("display:none;") > -1) {
        disp = "";
        spans = 1;
        while (true) {
          i++;
          disp = disp + fullText[i];
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
      if (str.indexOf("stop-music") > -1 && str.indexOf("display:none;") > -1) {
        s = str.split("stop-music ");
        s = s[1].split(/\s|\"/)[0];
        stopMusicBuffer.push(s);
      }
      if (str.indexOf("execute-command") > -1 && str.indexOf("display:none;") > -1) {
        s = str.split("execute-command ");
        s = s[1].split(/\s|\"/)[0];
        executeBuffer.push(s);
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
        if (str.indexOf("execute-command") > -1) {
          s = str.split("execute-command ");
          s = s[1].split(/\s|\"/)[0];
          executeBuffer.push(s);
          if (s !== void 0) {
            eval(data.parsedJavascriptCommands[parseInt(s.substring(4, s.length))]);
          }
        }
        if (str.indexOf("set-speed") > -1) {
          s = str.split("set-speed ");
          s = s[1].split(/\s|\"/)[0];
          interval = Parser.parseStatement(s);
          speedMod = true;
        }
        if (str.indexOf("default-speed") > -1) {
          interval = defaultInterval;
          speedMod = false;
        }
        if (str.indexOf("set-scroll-sound") > -1) {
          s = str.split("set-scroll-sound ");
          s = s[1].split(/\s|\"/)[0];
          scrollSound = s;
        }
        if (str.indexOf("default-scroll-sound") > -1) {
          scrollSound = null;
        }
      }
      currentOffset = i;
      return offsetChanged = true;
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
      return GameManager.loadGame();
    }
  },
  closeLoadNotification: function(load) {
    var e, textArea;
    e = document.getElementById("load-notification");
    if (load) {
      textArea = e.querySelectorAll("textarea");
      GameManager.loadGame(textArea[0].value);
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
