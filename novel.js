
/* SAVING AND LOADING */
var GameManager, Inventory, Parser, Scene, Sound, TextPrinter, UI, Util, copyButton, currentInterval, currentOffset, data, fullText, gameArea, gamePath, timer;

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
    return this.readSaving(data.game.currentScene);
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

fullText = "";

timer = null;

currentOffset = 0;

currentInterval = 0;

TextPrinter = {
  printText: function(text, interval) {
    clearInterval(timer);
    fullText = text;
    currentOffset = 0;
    if (interval === void 0) {
      currentInterval = data.game.settings.defaultScrollSpeed;
    } else {
      currentInterval = interval;
    }
    return timer = setInterval(this.onTick, currentInterval);
  },
  complete: function() {
    clearInterval(timer);
    timer = null;
    data.printedText = fullText;
    Scene.updateChoices();
    return false;
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
      if (str.indexOf("play-sound") > -1) {
        s = str.split("play-sound ");
        s = s[1].split(/\s|\"/)[0];
      }
      if (str.indexOf("set-speed") > -1) {
        s = str.split("set-speed ");
        s = s[1].split(/\s|\"/)[0];
        TextPrinter.changeTimer(Parser.parseStatement(s));
      }
      if (str.indexOf("default-speed") > -1) {
        TextPrinter.resetTimer();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vdmVsLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0E7QUFBQSxJQUFBOztBQUVBLFdBQUEsR0FBYztFQUdaLFVBQUEsRUFBWSxTQUFDLEtBQUQ7QUFDVixRQUFBO0lBQUEsSUFBQSxHQUFPLEtBQUEsR0FBUTtJQUNmLEVBQUEsR0FBSyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQWhCLENBQXNCLEdBQXRCO0lBQ0wsQ0FBQSxHQUFJO0FBQ0osV0FBTSxDQUFBLEdBQUksRUFBRSxDQUFDLE1BQWI7TUFDRSxDQUFBLEdBQUksRUFBRyxDQUFBLENBQUE7QUFDUCxhQUFNLENBQUMsQ0FBQyxNQUFGLENBQVMsQ0FBVCxDQUFBLEtBQWUsR0FBckI7UUFDRSxDQUFBLEdBQUksQ0FBQyxDQUFDLFNBQUYsQ0FBWSxDQUFaO01BRE47TUFFQSxJQUFHLENBQUMsQ0FBQyxPQUFGLENBQVUsSUFBVixDQUFBLEtBQW1CLENBQXRCO0FBQ0UsZUFBTyxDQUFDLENBQUMsU0FBRixDQUFZLElBQUksQ0FBQyxNQUFqQixFQUF5QixDQUFDLENBQUMsTUFBM0IsRUFEVDs7TUFFQSxDQUFBO0lBTkY7V0FPQTtFQVhVLENBSEE7RUFpQlosVUFBQSxFQUFZLFNBQUMsS0FBRCxFQUFRLE1BQVIsRUFBZ0IsTUFBaEI7QUFDVixRQUFBO0lBQUEsQ0FBQSxHQUFJLElBQUk7SUFDUixDQUFDLENBQUMsT0FBRixDQUFVLENBQUMsQ0FBQyxPQUFGLENBQUEsQ0FBQSxHQUFjLE1BQUEsR0FBUyxFQUFULEdBQWMsRUFBZCxHQUFtQixFQUFuQixHQUF3QixJQUFoRDtJQUNBLE9BQUEsR0FBVSxVQUFBLEdBQWEsQ0FBQyxDQUFDLFdBQUYsQ0FBQTtXQUN2QixRQUFRLENBQUMsTUFBVCxHQUFrQixLQUFBLEdBQVEsR0FBUixHQUFjLE1BQWQsR0FBdUIsSUFBdkIsR0FBOEIsT0FBOUIsR0FBd0M7RUFKaEQsQ0FqQkE7RUF3QlosUUFBQSxFQUFVLFNBQUMsSUFBRDtBQUNSLFFBQUE7SUFBQSxJQUFHLElBQUEsS0FBUSxNQUFYO01BQ0UsSUFBRyxJQUFDLENBQUEsVUFBRCxDQUFZLFVBQVosQ0FBQSxLQUEyQixFQUE5QjtRQUNFLE9BQU8sQ0FBQyxHQUFSLENBQVksZUFBWjtRQUNBLE1BQUEsR0FBUyxJQUFDLENBQUEsVUFBRCxDQUFZLFVBQVo7UUFDVCxPQUFPLENBQUMsR0FBUixDQUFZLGVBQVo7UUFDQSxPQUFPLENBQUMsR0FBUixDQUFZLE1BQVo7UUFDQSxJQUFJLENBQUMsSUFBTCxHQUFZLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBQSxDQUFLLElBQUMsQ0FBQSxVQUFELENBQVksVUFBWixDQUFMLENBQVg7UUFDWixPQUFPLENBQUMsR0FBUixDQUFZLGNBQVo7ZUFDQSxJQUFJLENBQUMsU0FBTCxHQUFpQixJQUFJLENBQUMsSUFBSSxDQUFDLFVBUDdCO09BREY7S0FBQSxNQVNLLElBQUcsSUFBQSxLQUFRLE1BQVg7TUFDSCxJQUFJLENBQUMsSUFBTCxHQUFZLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBQSxDQUFLLElBQUwsQ0FBWDtNQUNaLElBQUksQ0FBQyxTQUFMLEdBQWlCLElBQUksQ0FBQyxJQUFJLENBQUMsVUFGeEI7O0VBVkcsQ0F4QkU7RUF3Q1osU0FBQSxFQUFXLFNBQUE7QUFDVCxRQUFBO0lBQUEsT0FBQSxHQUFVLElBQUk7SUFDZCxPQUFPLENBQUMsSUFBUixDQUFhLEtBQWIsRUFBb0IsUUFBQSxHQUFXLFlBQS9CLEVBQTZDLElBQTdDO0lBQ0EsT0FBTyxDQUFDLE1BQVIsR0FBaUIsU0FBQTtBQUNmLFVBQUE7TUFBQSxJQUFHLE9BQU8sQ0FBQyxNQUFSLElBQWtCLEdBQWxCLElBQTBCLE9BQU8sQ0FBQyxNQUFSLEdBQWlCLEdBQTlDO1FBQ0UsSUFBQSxHQUFPLElBQUksQ0FBQyxLQUFMLENBQVcsT0FBTyxDQUFDLFlBQW5CO1FBQ1AsSUFBQSxHQUFPLFdBQVcsQ0FBQyxXQUFaLENBQXdCLElBQXhCO1FBQ1AsSUFBSSxDQUFDLElBQUwsR0FBWTtRQUNaLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBVixHQUF5QixLQUFLLENBQUMsV0FBTixDQUFrQixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU8sQ0FBQSxDQUFBLENBQUUsQ0FBQyxJQUF0QztlQUN6QixJQUFJLENBQUMsU0FBTCxHQUFpQixJQUFJLENBQUMsSUFBSSxDQUFDLFVBTDdCOztJQURlO0lBT2pCLE9BQU8sQ0FBQyxPQUFSLEdBQWtCLFNBQUEsR0FBQTtXQUVsQixPQUFPLENBQUMsSUFBUixDQUFBO0VBWlMsQ0F4Q0M7RUF1RFosY0FBQSxFQUFnQixTQUFBO0FBQ2QsUUFBQTtJQUFBLElBQUEsR0FBTyxJQUFBLENBQUssSUFBSSxDQUFDLFNBQUwsQ0FBZSxJQUFJLENBQUMsSUFBcEIsQ0FBTDtBQUNQLFdBQU87RUFGTyxDQXZESjtFQTREWixRQUFBLEVBQVUsU0FBQTtBQUNSLFFBQUE7SUFBQSxJQUFBLEdBQU8sSUFBQyxDQUFBLGNBQUQsQ0FBQTtJQUNQLElBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBbkIsS0FBK0IsUUFBbEM7YUFDRSxJQUFDLENBQUEsVUFBRCxDQUFZLFVBQVosRUFBdUIsSUFBdkIsRUFBNEIsR0FBNUIsRUFERjtLQUFBLE1BRUssSUFBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFuQixLQUErQixNQUFsQzthQUNILEVBQUUsQ0FBQyxvQkFBSCxDQUF3QixJQUF4QixFQURHOztFQUpHLENBNURFO0VBb0VaLFdBQUEsRUFBYSxTQUFDLElBQUQ7QUFDWCxRQUFBO0lBQUEsSUFBSSxDQUFDLFlBQUwsR0FBa0I7SUFDbEIsSUFBSSxDQUFDLGFBQUwsR0FBbUI7QUFDbkI7QUFBQSxTQUFBLHFDQUFBOztNQUNFLElBQUcsQ0FBQyxDQUFDLFdBQUYsS0FBaUIsTUFBcEI7UUFDRSxDQUFDLENBQUMsV0FBRixHQUFnQixDQUFDLENBQUMsS0FEcEI7O0FBREY7QUFHQTtBQUFBLFNBQUEsd0NBQUE7O01BQ0UsQ0FBQyxDQUFDLFlBQUYsR0FBaUI7TUFDakIsQ0FBQyxDQUFDLFVBQUYsR0FBZTtBQUNmO0FBQUEsV0FBQSx3Q0FBQTs7UUFDRSxDQUFDLENBQUMsVUFBRixHQUFlO1FBQ2YsSUFBRyxDQUFDLENBQUMsU0FBRixLQUFlLE1BQWxCO1VBQ0UsQ0FBQyxDQUFDLFNBQUYsR0FBYyxHQURoQjs7UUFFQSxJQUFHLENBQUMsQ0FBQyxVQUFGLEtBQWdCLE1BQW5CO1VBQ0UsQ0FBQyxDQUFDLFVBQUYsR0FBZSxNQURqQjs7QUFKRjtBQUhGO0FBU0EsV0FBTztFQWZJLENBcEVEOzs7O0FBd0ZkOztBQUVBLFNBQUEsR0FBWTtFQUdWLGlCQUFBLEVBQW1CLFNBQUMsWUFBRCxFQUFlLE1BQWY7QUFDakIsUUFBQTtJQUFBLFVBQUEsR0FBYTtJQUNiLElBQUcsTUFBSDtBQUNFO0FBQUEsV0FBQSxxQ0FBQTs7QUFDRSxhQUFBLGdEQUFBOztVQUNFLElBQUcsQ0FBRSxDQUFBLENBQUEsQ0FBRixLQUFRLENBQUMsQ0FBQyxJQUFiO1lBQ0UsSUFBRyxDQUFFLENBQUEsQ0FBQSxDQUFGLElBQVEsQ0FBQyxDQUFDLEtBQWI7Y0FDRSxVQUFBLEdBQWEsVUFBQSxHQUFhLEVBRDVCO2FBREY7O0FBREY7QUFERixPQURGO0tBQUEsTUFBQTtBQU9FO0FBQUEsV0FBQSx3Q0FBQTs7QUFDRSxhQUFBLGdEQUFBOztVQUNFLElBQUcsQ0FBRSxDQUFBLENBQUEsQ0FBRixLQUFRLENBQUMsQ0FBQyxJQUFiO1lBQ0UsSUFBRyxDQUFFLENBQUEsQ0FBQSxDQUFGLElBQVEsQ0FBQyxDQUFDLEtBQWI7Y0FDRSxVQUFBLEdBQWEsVUFBQSxHQUFhLEVBRDVCO2FBREY7O0FBREY7QUFERixPQVBGOztJQVlBLElBQUcsVUFBQSxLQUFjLFlBQVksQ0FBQyxNQUE5QjtBQUNFLGFBQU8sS0FEVDtLQUFBLE1BQUE7QUFHRSxhQUFPLE1BSFQ7O0VBZGlCLENBSFQ7RUF1QlYsUUFBQSxFQUFVLFNBQUMsTUFBRCxFQUFTLFFBQVQ7QUFDUixRQUFBO0lBQUEsaUJBQUEsR0FBb0IsSUFBQyxDQUFBLGlCQUFELENBQW1CLE1BQW5CO0lBQ3BCLEtBQUEsR0FBUSxNQUFNLENBQUMsU0FBUCxDQUFpQixNQUFqQixFQUF3QixLQUF4QjtXQUNSLEtBQU0sQ0FBQSxpQkFBQSxDQUFOLEdBQTJCO0VBSG5CLENBdkJBO0VBNkJWLGFBQUEsRUFBZSxTQUFDLE1BQUQsRUFBUyxNQUFUO0FBQ2IsUUFBQTtJQUFBLGlCQUFBLEdBQW9CLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixNQUFuQjtJQUNwQixLQUFBLEdBQVEsTUFBTSxDQUFDLFNBQVAsQ0FBaUIsTUFBakIsRUFBd0IsS0FBeEI7SUFDUixLQUFNLENBQUEsaUJBQUEsQ0FBTixHQUEyQixLQUFNLENBQUEsaUJBQUEsQ0FBTixHQUEyQjtJQUN0RCxJQUFHLENBQUMsS0FBQSxDQUFNLFVBQUEsQ0FBVyxLQUFNLENBQUEsaUJBQUEsQ0FBakIsQ0FBTixDQUFKO2FBQ0UsS0FBTSxDQUFBLGlCQUFBLENBQU4sR0FBMkIsVUFBQSxDQUFXLEtBQU0sQ0FBQSxpQkFBQSxDQUFrQixDQUFDLE9BQXpCLENBQWlDLENBQWpDLENBQVgsRUFEN0I7O0VBSmEsQ0E3Qkw7RUFxQ1YsYUFBQSxFQUFlLFNBQUMsTUFBRCxFQUFTLE1BQVQ7QUFDYixRQUFBO0lBQUEsaUJBQUEsR0FBb0IsSUFBQyxDQUFBLGlCQUFELENBQW1CLE1BQW5CO0lBQ3BCLEtBQUEsR0FBUSxNQUFNLENBQUMsU0FBUCxDQUFpQixNQUFqQixFQUF3QixLQUF4QjtJQUNSLEtBQU0sQ0FBQSxpQkFBQSxDQUFOLEdBQTJCLEtBQU0sQ0FBQSxpQkFBQSxDQUFOLEdBQTJCO0lBQ3RELElBQUcsQ0FBQyxLQUFBLENBQU0sVUFBQSxDQUFXLEtBQU0sQ0FBQSxpQkFBQSxDQUFqQixDQUFOLENBQUo7YUFDRSxLQUFNLENBQUEsaUJBQUEsQ0FBTixHQUEyQixVQUFBLENBQVcsS0FBTSxDQUFBLGlCQUFBLENBQWtCLENBQUMsT0FBekIsQ0FBaUMsQ0FBakMsQ0FBWCxFQUQ3Qjs7RUFKYSxDQXJDTDtFQTZDVixpQkFBQSxFQUFtQixTQUFDLE1BQUQ7QUFDakIsUUFBQTtJQUFBLGlCQUFBLEdBQW9CLE1BQU0sQ0FBQyxLQUFQLENBQWEsR0FBYjtJQUNwQixpQkFBQSxHQUFvQixpQkFBa0IsQ0FBQSxpQkFBaUIsQ0FBQyxNQUFsQixHQUF5QixDQUF6QixDQUEyQixDQUFDLEtBQTlDLENBQW9ELEdBQXBEO0lBQ3BCLGlCQUFBLEdBQW9CLGlCQUFrQixDQUFBLGlCQUFpQixDQUFDLE1BQWxCLEdBQXlCLENBQXpCO0FBQ3RDLFdBQU87RUFKVSxDQTdDVDtFQW9EVixnQkFBQSxFQUFrQixTQUFDLEtBQUQsRUFBUSxJQUFSLEVBQWMsTUFBZDtBQUNoQixRQUFBO0lBQUEsSUFBRyxNQUFIO01BQ0UsU0FBQSxHQUFZLElBQUksQ0FBQyxJQUFJLENBQUM7TUFDdEIsS0FBQSxHQUFRLEtBRlY7S0FBQSxNQUFBO01BSUUsU0FBQSxHQUFZLElBQUksQ0FBQyxJQUFJLENBQUM7TUFDdEIsS0FBQSxHQUFRLE1BTFY7O0FBTUEsU0FBQSx1Q0FBQTs7TUFDRSxTQUFBLEdBQVk7QUFDWixXQUFBLDZDQUFBOztRQUNFLElBQUcsQ0FBQyxDQUFDLElBQUYsS0FBVSxDQUFFLENBQUEsQ0FBQSxDQUFmO1VBQ0UsQ0FBQSxHQUFJLENBQUUsQ0FBQSxDQUFBLENBQUUsQ0FBQyxLQUFMLENBQVcsR0FBWDtVQUNKLFdBQUEsR0FBYztVQUNkLElBQUcsQ0FBQyxDQUFDLE1BQUYsR0FBVyxDQUFkO1lBQ0UsV0FBQSxHQUFjLENBQUUsQ0FBQSxDQUFBO1lBQ2hCLEtBQUEsR0FBUSxRQUFBLENBQVMsQ0FBRSxDQUFBLENBQUEsQ0FBWDtZQUNSLElBQUcsQ0FBQyxLQUFBLENBQU0sV0FBTixDQUFKO2NBQ0UsV0FBQSxHQUFjLENBQUUsQ0FBQSxDQUFBO2NBQ2hCLFdBQUEsR0FBYyxDQUFDLENBQUMsS0FGbEI7O1lBR0EsSUFBRyxDQUFDLENBQUMsTUFBRixHQUFXLENBQWQ7Y0FDRSxXQUFBLEdBQWMsVUFBQSxDQUFXLENBQUUsQ0FBQSxDQUFBLENBQWI7Y0FDZCxXQUFBLEdBQWMsQ0FBRSxDQUFBLENBQUEsRUFGbEI7YUFORjtXQUFBLE1BQUE7WUFVRSxXQUFBLEdBQWMsQ0FBRSxDQUFBLENBQUE7WUFDaEIsS0FBQSxHQUFRLFFBQUEsQ0FBUyxDQUFFLENBQUEsQ0FBQSxDQUFYLEVBWFY7O1VBWUEsS0FBQSxHQUFRLElBQUksQ0FBQyxNQUFMLENBQUE7VUFDUixJQUFHLEtBQUEsR0FBUSxXQUFYO1lBQ0UsSUFBSSxJQUFBLEtBQVEsS0FBWjtjQUNFLElBQUcsS0FBSDtnQkFDRSxDQUFDLENBQUMsS0FBRixHQUFVLFFBQUEsQ0FBUyxDQUFFLENBQUEsQ0FBQSxDQUFYLEVBRFo7ZUFBQSxNQUFBO2dCQUdFLENBQUMsQ0FBQyxLQUFGLEdBQVUsUUFBQSxDQUFTLENBQUUsQ0FBQSxDQUFBLENBQVgsRUFIWjtlQURGO2FBQUEsTUFLSyxJQUFJLElBQUEsS0FBUSxLQUFaO2NBQ0gsSUFBRyxLQUFIO2dCQUNFLENBQUMsQ0FBQyxLQUFGLEdBQVUsUUFBQSxDQUFTLENBQUMsQ0FBQyxLQUFYLENBQUEsR0FBb0IsTUFEaEM7ZUFBQSxNQUFBO2dCQUdFLElBQUcsS0FBQSxDQUFNLFFBQUEsQ0FBUyxDQUFDLENBQUMsS0FBWCxDQUFOLENBQUg7a0JBQ0UsQ0FBQyxDQUFDLEtBQUYsR0FBVSxFQURaOztnQkFFQSxDQUFDLENBQUMsS0FBRixHQUFVLFFBQUEsQ0FBUyxDQUFDLENBQUMsS0FBWCxDQUFBLEdBQW9CLE1BTGhDO2VBREc7YUFBQSxNQU9BLElBQUksSUFBQSxLQUFRLFFBQVo7Y0FDSCxJQUFHLEtBQUg7Z0JBQ0UsQ0FBQyxDQUFDLEtBQUYsR0FBVSxRQUFBLENBQVMsQ0FBQyxDQUFDLEtBQVgsQ0FBQSxHQUFvQjtnQkFDOUIsSUFBRyxDQUFDLENBQUMsS0FBRixHQUFVLENBQWI7a0JBQ0UsQ0FBQyxDQUFDLEtBQUYsR0FBVSxFQURaO2lCQUZGO2VBQUEsTUFBQTtnQkFLRSxDQUFDLENBQUMsS0FBRixHQUFVLFFBQUEsQ0FBUyxDQUFDLENBQUMsS0FBWCxDQUFBLEdBQW9CO2dCQUM5QixJQUFHLENBQUMsQ0FBQyxLQUFGLEdBQVUsQ0FBYjtrQkFDRSxDQUFDLENBQUMsS0FBRixHQUFVLEVBRFo7aUJBTkY7ZUFERzthQWJQOztVQXNCQSxTQUFBLEdBQVksS0F0Q2Q7O0FBREY7TUF3Q0EsSUFBRyxDQUFDLFNBQUQsSUFBYyxJQUFBLEtBQVEsUUFBekI7UUFDRSxDQUFBLEdBQUksQ0FBRSxDQUFBLENBQUEsQ0FBRSxDQUFDLEtBQUwsQ0FBVyxHQUFYO1FBQ0osV0FBQSxHQUFjO1FBQ2QsSUFBRyxDQUFDLENBQUMsTUFBRixHQUFXLENBQWQ7VUFDRSxXQUFBLEdBQWMsQ0FBRSxDQUFBLENBQUE7VUFDaEIsS0FBQSxHQUFRLFFBQUEsQ0FBUyxDQUFFLENBQUEsQ0FBQSxDQUFYO1VBQ1IsSUFBRyxDQUFDLEtBQUEsQ0FBTSxXQUFOLENBQUo7WUFDRSxXQUFBLEdBQWMsQ0FBRSxDQUFBLENBQUE7WUFDaEIsV0FBQSxHQUFjLENBQUMsQ0FBQyxLQUZsQjs7VUFHQSxJQUFHLENBQUMsQ0FBQyxNQUFGLEdBQVcsQ0FBZDtZQUNFLFdBQUEsR0FBYyxVQUFBLENBQVcsQ0FBRSxDQUFBLENBQUEsQ0FBYjtZQUNkLFdBQUEsR0FBYyxDQUFFLENBQUEsQ0FBQSxFQUZsQjtXQU5GO1NBQUEsTUFBQTtVQVVFLFdBQUEsR0FBYyxDQUFFLENBQUEsQ0FBQTtVQUNoQixLQUFBLEdBQVEsUUFBQSxDQUFTLENBQUUsQ0FBQSxDQUFBLENBQVgsRUFYVjs7UUFZQSxLQUFBLEdBQVEsSUFBSSxDQUFDLE1BQUwsQ0FBQTtRQUNSLElBQUcsS0FBQSxHQUFRLFdBQVg7VUFDRSxTQUFTLENBQUMsSUFBVixDQUFlO1lBQUMsTUFBQSxFQUFRLENBQUUsQ0FBQSxDQUFBLENBQVg7WUFBZSxPQUFBLEVBQVMsS0FBeEI7WUFBK0IsYUFBQSxFQUFlLFdBQTlDO1dBQWYsRUFERjtTQWhCRjs7QUExQ0Y7SUE0REEsSUFBRyxNQUFIO2FBQ0UsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFWLEdBQXNCLFVBRHhCO0tBQUEsTUFBQTthQUdFLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBVixHQUFrQixVQUhwQjs7RUFuRWdCLENBcERSOzs7QUE4SFosSUFBQSxHQUFPO0VBQ0wsSUFBQSxFQUFNLElBREQ7RUFFTCxPQUFBLEVBQVMsSUFGSjtFQUdMLFNBQUEsRUFBVyxLQUhOO0VBSUwsV0FBQSxFQUFhLEVBSlI7RUFLTCxLQUFBLEVBQU8sRUFMRjs7O0FBUVAsUUFBQSxHQUFXOztBQUdYLFFBQUEsR0FBZSxJQUFBLEdBQUEsQ0FDYjtFQUFBLEVBQUEsRUFBSSxZQUFKO0VBQ0EsSUFBQSxFQUFNLElBRE47RUFFQSxPQUFBLEVBQ0U7SUFBQSxrQkFBQSxFQUFvQixTQUFDLE1BQUQ7QUFDbEIsYUFBTyxLQUFLLENBQUMsa0JBQU4sQ0FBeUIsTUFBekI7SUFEVyxDQUFwQjtJQUlBLFlBQUEsRUFBYyxTQUFDLE1BQUQ7TUFDWixLQUFLLENBQUMsU0FBTixDQUFnQixJQUFDLENBQUEsSUFBSSxDQUFDLFlBQXRCO01BQ0EsS0FBSyxDQUFDLHFCQUFOLENBQTRCLE1BQTVCO01BQ0EsS0FBSyxDQUFDLFVBQU4sQ0FBaUIsTUFBakIsRUFBd0IsSUFBeEI7TUFDQSxLQUFLLENBQUMsVUFBTixDQUFpQixNQUFqQjtNQUNBLElBQUcsTUFBTSxDQUFDLFNBQVAsS0FBb0IsRUFBdkI7ZUFDRSxLQUFLLENBQUMsV0FBTixDQUFrQixNQUFNLENBQUMsU0FBekIsRUFERjtPQUFBLE1BQUE7ZUFHRSxLQUFLLENBQUMsV0FBTixDQUFrQixJQUFDLENBQUEsSUFBSSxDQUFDLFlBQXhCLEVBSEY7O0lBTFksQ0FKZDtHQUhGO0NBRGE7OztBQW1CZjs7QUFDQSxXQUFXLENBQUMsU0FBWixDQUFBOzs7QUFHQTs7QUFFQSxNQUFBLEdBQVM7RUFHUCxnQkFBQSxFQUFrQixTQUFDLEtBQUQ7QUFDaEIsUUFBQTtJQUFBLFFBQUEsR0FBVyxLQUFLLENBQUMsS0FBTixDQUFZLEdBQVo7SUFDWCxNQUFBLEdBQVM7QUFDVCxTQUFBLDBDQUFBOztNQUNFLENBQUEsR0FBSSxDQUFDLENBQUMsU0FBRixDQUFZLENBQVosRUFBZSxDQUFDLENBQUMsTUFBRixHQUFXLENBQTFCO01BQ0osQ0FBQSxHQUFJLENBQUMsQ0FBQyxLQUFGLENBQVEsR0FBUjtNQUNKLE1BQU0sQ0FBQyxJQUFQLENBQVksQ0FBWjtBQUhGO0FBSUEsV0FBTztFQVBTLENBSFg7RUFhUCxTQUFBLEVBQVcsU0FBQyxJQUFEO0FBQ1QsUUFBQTtJQUFBLElBQUcsSUFBQSxLQUFRLE1BQVg7QUFFRSxXQUFTLDJCQUFUO1FBQ0UsSUFBQSxHQUFPLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBQSxHQUFPLENBQVAsR0FBVyxHQUF0QixDQUEwQixDQUFDLElBQTNCLENBQWdDLDBCQUFBLEdBQTZCLENBQTdCLEdBQWlDLEtBQWpFO0FBRFQ7TUFFQSxJQUFBLEdBQU8sSUFBSSxDQUFDLEtBQUwsQ0FBVyxNQUFYLENBQWtCLENBQUMsSUFBbkIsQ0FBd0IsU0FBeEI7TUFFUCxTQUFBLEdBQVksSUFBSSxDQUFDLEtBQUwsQ0FBVyxPQUFYO01BQ1osZUFBQSxHQUFrQjtNQUNsQixZQUFBLEdBQWU7QUFDZixXQUFhLHVHQUFiO1FBQ0UsQ0FBQSxHQUFJLFNBQVUsQ0FBQSxLQUFBO1FBRWQsSUFBRyxDQUFDLENBQUMsU0FBRixDQUFZLENBQVosRUFBYyxDQUFkLENBQUEsS0FBb0IsSUFBdkI7VUFDRSxNQUFBLEdBQVMsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxLQUFSO1VBQ1QsSUFBRyxDQUFDLElBQUMsQ0FBQSxjQUFELENBQWdCLE1BQU8sQ0FBQSxDQUFBLENBQXZCLENBQUo7WUFDRSxTQUFVLENBQUEsS0FBQSxDQUFWLEdBQW1CO1lBQ25CLGVBQUEsR0FGRjtXQUFBLE1BQUE7WUFJRSxTQUFVLENBQUEsS0FBQSxDQUFWLEdBQW1CLEdBSnJCO1dBRkY7U0FBQSxNQU9LLElBQUcsQ0FBQyxDQUFDLFNBQUYsQ0FBWSxDQUFaLEVBQWMsQ0FBZCxDQUFBLEtBQW9CLEtBQXZCO1VBQ0gsSUFBRyxlQUFBLEdBQWtCLENBQXJCO1lBQ0UsU0FBVSxDQUFBLEtBQUEsQ0FBVixHQUFtQjtZQUNuQixlQUFBLEdBRkY7V0FBQSxNQUFBO1lBSUUsU0FBVSxDQUFBLEtBQUEsQ0FBVixHQUFtQixHQUpyQjtXQURHO1NBQUEsTUFPQSxJQUFHLENBQUMsQ0FBQyxTQUFGLENBQVksQ0FBWixFQUFjLENBQWQsQ0FBQSxLQUFvQixPQUF2QjtVQUNILEtBQUEsR0FBUSxDQUFDLENBQUMsU0FBRixDQUFZLENBQVosRUFBYyxDQUFDLENBQUMsTUFBaEI7QUFDUjtBQUFBLGVBQUEsc0NBQUE7O1lBQ0UsSUFBRyxDQUFDLENBQUMsSUFBRixLQUFVLEtBQWI7Y0FDRSxTQUFVLENBQUEsS0FBQSxDQUFWLEdBQW1CLENBQUMsQ0FBQyxNQUR2Qjs7QUFERixXQUZHO1NBQUEsTUFNQSxJQUFHLENBQUMsQ0FBQyxTQUFGLENBQVksQ0FBWixFQUFjLENBQWQsQ0FBQSxLQUFvQixNQUF2QjtVQUNILEtBQUEsR0FBUSxDQUFDLENBQUMsU0FBRixDQUFZLENBQVosRUFBYyxDQUFDLENBQUMsTUFBaEI7QUFDUjtBQUFBLGVBQUEsd0NBQUE7O1lBQ0UsSUFBRyxDQUFDLENBQUMsSUFBRixLQUFVLEtBQWI7Y0FDRSxTQUFVLENBQUEsS0FBQSxDQUFWLEdBQW1CLENBQUMsQ0FBQyxNQUR2Qjs7QUFERixXQUZHO1NBQUEsTUFNQSxJQUFHLENBQUMsQ0FBQyxTQUFGLENBQVksQ0FBWixFQUFjLENBQWQsQ0FBQSxLQUFvQixPQUF2QjtVQUNILE1BQUEsR0FBUyxDQUFDLENBQUMsS0FBRixDQUFRLFFBQVI7VUFDVCxTQUFVLENBQUEsS0FBQSxDQUFWLEdBQW1CLElBQUMsQ0FBQSxjQUFELENBQWdCLE1BQU8sQ0FBQSxDQUFBLENBQXZCLEVBRmhCO1NBQUEsTUFJQSxJQUFHLENBQUMsQ0FBQyxTQUFGLENBQVksQ0FBWixFQUFjLENBQWQsQ0FBQSxLQUFvQixPQUF2QjtVQUNILE1BQUEsR0FBUyxDQUFDLENBQUMsS0FBRixDQUFRLFFBQVI7VUFDVCxTQUFVLENBQUEsS0FBQSxDQUFWLEdBQW1CLDJCQUFBLEdBQThCLE1BQU8sQ0FBQSxDQUFBLENBQXJDLEdBQTBDLGFBRjFEO1NBQUEsTUFJQSxJQUFHLENBQUMsQ0FBQyxTQUFGLENBQVksQ0FBWixFQUFjLENBQWQsQ0FBQSxLQUFvQixRQUF2QjtVQUNILFNBQVUsQ0FBQSxLQUFBLENBQVYsR0FBbUIsd0NBRGhCO1NBQUEsTUFHQSxJQUFHLENBQUMsQ0FBQyxTQUFGLENBQVksQ0FBWixFQUFjLENBQWQsQ0FBQSxLQUFvQixPQUF2QjtVQUNILE1BQUEsR0FBUyxDQUFDLENBQUMsS0FBRixDQUFRLFFBQVI7VUFDVCxTQUFVLENBQUEsS0FBQSxDQUFWLEdBQW1CLDBCQUFBLEdBQTZCLE1BQU8sQ0FBQSxDQUFBLENBQXBDLEdBQXlDLGFBRnpEO1NBQUEsTUFJQSxJQUFHLENBQUMsQ0FBQyxTQUFGLENBQVksQ0FBWixFQUFjLENBQWQsQ0FBQSxLQUFvQixPQUF2QjtVQUNILE1BQUEsR0FBUyxDQUFDLENBQUMsS0FBRixDQUFRLFFBQVI7VUFDVCxRQUFBLEdBQVc7QUFDWDtBQUFBLGVBQUEsd0NBQUE7O1lBQ0UsSUFBRyxDQUFDLENBQUMsSUFBRixLQUFVLE1BQU8sQ0FBQSxDQUFBLENBQXBCO2NBQ0UsUUFBQSxHQUFXLENBQUMsQ0FBQyxNQURmOztBQURGO1VBR0EsU0FBVSxDQUFBLEtBQUEsQ0FBVixHQUFtQiwrQkFBQSxHQUFrQyxRQUFsQyxHQUE2QyxrQ0FBN0MsR0FBa0YsTUFBTyxDQUFBLENBQUEsQ0FBekYsR0FBK0YsTUFOL0c7U0FBQSxNQVFBLElBQUcsQ0FBQyxDQUFDLFNBQUYsQ0FBWSxDQUFaLEVBQWMsQ0FBZCxDQUFBLEtBQW9CLFFBQXZCO1VBQ0gsTUFBQSxHQUFTLENBQUMsQ0FBQyxLQUFGLENBQVEsU0FBUjtVQUNULFNBQVUsQ0FBQSxLQUFBLENBQVYsR0FBbUIsb0VBQUEsR0FBcUUsTUFBTyxDQUFBLENBQUEsQ0FBNUUsR0FBK0U7VUFDbEcsWUFBQSxHQUhHO1NBQUEsTUFJQSxJQUFHLENBQUMsQ0FBQyxTQUFGLENBQVksQ0FBWixFQUFjLENBQWQsQ0FBQSxLQUFvQixTQUF2QjtVQUNILElBQUcsWUFBQSxHQUFlLENBQWxCO1lBQ0UsU0FBVSxDQUFBLEtBQUEsQ0FBVixHQUFtQjtZQUNuQixZQUFBLEdBRkY7V0FBQSxNQUFBO1lBSUUsU0FBVSxDQUFBLEtBQUEsQ0FBVixHQUFtQixHQUpyQjtXQURHOztRQU1MLEtBQUE7QUE5REY7TUFnRUEsSUFBQSxHQUFPLFNBQVMsQ0FBQyxJQUFWLENBQWUsRUFBZjtBQUNQLGFBQU8sS0ExRVQ7O0VBRFMsQ0FiSjtFQTJGUCxjQUFBLEVBQWdCLFNBQUMsQ0FBRDtBQUVkLFFBQUE7SUFBQSxJQUFHLENBQUMsSUFBSSxDQUFDLG1CQUFMLENBQXlCLENBQXpCLENBQUo7TUFDRSxPQUFPLENBQUMsS0FBUixDQUFjLHlDQUFkLEVBREY7O0lBR0EsQ0FBQSxHQUFJLENBQUMsQ0FBQyxPQUFGLENBQVUsTUFBVixFQUFrQixFQUFsQjtJQUVKLFlBQUEsR0FBZSxDQUFDLENBQUMsS0FBRixDQUFRLDJDQUFSO0lBQ2YsWUFBQSxHQUFlO0FBRWYsU0FBQSw4Q0FBQTs7TUFDRSxJQUFBLEdBQU8sSUFBQyxDQUFBLGdCQUFELENBQWtCLEdBQWxCO0FBQ1AsY0FBTyxJQUFQO0FBQUEsYUFDTyxNQURQO0FBRUk7QUFBQSxlQUFBLHVDQUFBOztZQUNFLElBQUcsQ0FBQyxDQUFDLElBQUYsS0FBVSxHQUFHLENBQUMsU0FBSixDQUFjLENBQWQsRUFBZ0IsR0FBRyxDQUFDLE1BQXBCLENBQWI7Y0FDRSxZQUFZLENBQUMsSUFBYixDQUFrQixDQUFDLENBQUMsS0FBcEIsRUFERjs7QUFERjtBQURHO0FBRFAsYUFLTyxPQUxQO0FBTUk7QUFBQSxlQUFBLHdDQUFBOztZQUNFLElBQUcsQ0FBQyxDQUFDLElBQUYsS0FBVSxHQUFHLENBQUMsU0FBSixDQUFjLENBQWQsRUFBZ0IsR0FBRyxDQUFDLE1BQXBCLENBQWI7Y0FDRSxZQUFZLENBQUMsSUFBYixDQUFrQixDQUFDLENBQUMsS0FBcEIsRUFERjs7QUFERjtBQURHO0FBTFAsYUFTTyxLQVRQO1VBVUksR0FBQSxHQUFNLElBQUMsQ0FBQSxTQUFELENBQVcsR0FBRyxDQUFDLFNBQUosQ0FBYyxDQUFkLEVBQWdCLEdBQUcsQ0FBQyxNQUFwQixDQUFYLEVBQXVDLElBQXZDO1VBQ04sSUFBRyxDQUFDLEtBQUEsQ0FBTSxVQUFBLENBQVcsR0FBWCxDQUFOLENBQUo7WUFDRSxZQUFZLENBQUMsSUFBYixDQUFrQixHQUFsQixFQURGO1dBQUEsTUFBQTtZQUdFLFlBQVksQ0FBQyxJQUFiLENBQWtCLEdBQUEsR0FBTSxHQUFOLEdBQVksR0FBOUIsRUFIRjs7QUFGRztBQVRQLGFBZU8sT0FmUDtVQWdCSSxZQUFZLENBQUMsSUFBYixDQUFrQixVQUFBLENBQVcsR0FBWCxDQUFsQjtBQURHO0FBZlAsYUFpQk8sS0FqQlA7VUFrQkksWUFBWSxDQUFDLElBQWIsQ0FBa0IsUUFBQSxDQUFTLEdBQVQsQ0FBbEI7QUFERztBQWpCUCxhQW1CTyxRQW5CUDtVQW9CSSxJQUFHLEdBQUEsS0FBTyxFQUFWO1lBQ0UsWUFBWSxDQUFDLElBQWIsQ0FBa0IsR0FBQSxHQUFNLEdBQU4sR0FBWSxHQUE5QixFQURGO1dBQUEsTUFBQTtZQUdFLFlBQVksQ0FBQyxJQUFiLENBQWtCLEVBQWxCLEVBSEY7O0FBcEJKO0FBRkY7QUEyQkEsU0FBUyx1R0FBVDtNQUNFLElBQUcsWUFBYSxDQUFBLENBQUEsQ0FBYixLQUFtQixFQUFuQixJQUF5QixZQUFhLENBQUEsQ0FBQSxDQUFiLEtBQW1CLEVBQS9DO1FBQ0UsQ0FBQSxHQUFJLENBQUMsQ0FBQyxPQUFGLENBQWMsSUFBQSxNQUFBLENBQU8sWUFBYSxDQUFBLENBQUEsQ0FBcEIsRUFBdUIsR0FBdkIsQ0FBZCxFQUEwQyxZQUFhLENBQUEsQ0FBQSxDQUF2RCxFQUROOztBQURGO0FBSUEsV0FBTyxJQUFBLENBQUssQ0FBTDtFQXpDTyxDQTNGVDtFQXVJUCxnQkFBQSxFQUFrQixTQUFDLEdBQUQ7QUFDaEIsUUFBQTtJQUFBLElBQUEsR0FBTztJQUNQLElBQUcsR0FBRyxDQUFDLFNBQUosQ0FBYyxDQUFkLEVBQWdCLENBQWhCLENBQUEsS0FBc0IsT0FBekI7TUFDRSxJQUFBLEdBQU8sUUFEVDtLQUFBLE1BRUssSUFBRyxHQUFHLENBQUMsU0FBSixDQUFjLENBQWQsRUFBZ0IsQ0FBaEIsQ0FBQSxLQUFzQixNQUF6QjtNQUNILElBQUEsR0FBTyxPQURKO0tBQUEsTUFFQSxJQUFHLEdBQUcsQ0FBQyxTQUFKLENBQWMsQ0FBZCxFQUFnQixDQUFoQixDQUFBLEtBQXNCLE1BQXpCO01BQ0gsSUFBQSxHQUFPLE1BREo7S0FBQSxNQUVBLElBQUcsQ0FBQyxLQUFBLENBQU0sVUFBQSxDQUFXLEdBQVgsQ0FBTixDQUFELElBQTJCLEdBQUcsQ0FBQyxRQUFKLENBQUEsQ0FBYyxDQUFDLE9BQWYsQ0FBdUIsR0FBdkIsQ0FBQSxLQUErQixDQUFDLENBQTlEO01BQ0gsSUFBQSxHQUFPLE1BREo7S0FBQSxNQUVBLElBQUcsQ0FBQyxLQUFBLENBQU0sVUFBQSxDQUFXLEdBQVgsQ0FBTixDQUFELElBQTJCLEdBQUcsQ0FBQyxRQUFKLENBQUEsQ0FBYyxDQUFDLE9BQWYsQ0FBdUIsR0FBdkIsQ0FBQSxLQUErQixDQUFDLENBQTlEO01BQ0gsSUFBQSxHQUFPLFFBREo7S0FBQSxNQUFBO01BR0gsSUFBQSxHQUFPLFNBSEo7O0FBSUwsV0FBTztFQWRTLENBdklYO0VBeUpQLFNBQUEsRUFBVyxTQUFDLE1BQUQsRUFBUyxPQUFUO0FBQ1QsUUFBQTtJQUFBLFFBQUEsR0FBVyxNQUFNLENBQUMsS0FBUCxDQUFhLEdBQWI7SUFFWCxJQUFHLENBQUMsT0FBSjtNQUNFLElBQUcsUUFBUSxDQUFDLE1BQVQsR0FBa0IsQ0FBckI7UUFDRSxRQUFBLEdBQVcsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsSUFBSSxDQUFDLElBQXRCLEVBQTJCLFFBQVMsQ0FBQSxDQUFBLENBQXBDLENBQXdDLENBQUEsQ0FBQSxFQURyRDtPQUFBLE1BQUE7UUFHRSxRQUFBLEdBQVcsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsSUFBSSxDQUFDLElBQXRCLEVBQTJCLFFBQVMsQ0FBQSxDQUFBLENBQXBDLENBQXdDLENBQUEsQ0FBQSxFQUhyRDtPQURGO0tBQUEsTUFBQTtNQU1FLFFBQUEsR0FBVyxJQUFDLENBQUEsZUFBRCxDQUFpQixJQUFJLENBQUMsSUFBdEIsRUFBMkIsUUFBUyxDQUFBLENBQUEsQ0FBcEMsQ0FBd0MsQ0FBQSxDQUFBLEVBTnJEOztBQVFBLFNBQVMsOEZBQVQ7TUFDRSxJQUFHLElBQUksQ0FBQyxLQUFMLENBQVcsQ0FBWCxDQUFIO1FBQ0UsUUFBQSxHQUFXLFFBQVMsQ0FBQSxRQUFBLENBQVMsUUFBUyxDQUFBLENBQUEsQ0FBbEIsQ0FBQSxFQUR0QjtPQUFBLE1BRUssSUFBRyxDQUFBLEtBQUssQ0FBUjtRQUNILElBQUcsQ0FBQyxPQUFKO1VBQ0UsUUFBQSxHQUFXLElBQUMsQ0FBQSxlQUFELENBQWlCLFFBQWpCLEVBQTBCLFFBQVMsQ0FBQSxDQUFBLENBQW5DLENBQXVDLENBQUEsQ0FBQSxFQURwRDtTQUFBLE1BQUE7VUFHRSxJQUFHLFFBQVMsQ0FBQSxDQUFBLENBQVQsS0FBZSxZQUFmLElBQStCLFFBQVMsQ0FBQSxDQUFBLENBQVQsS0FBZSxNQUFqRDtZQUNFLFFBQVMsQ0FBQSxDQUFBLENBQVQsR0FBYztZQUNkLFFBQVEsQ0FBQyxVQUFULEdBQXNCLE1BQU0sQ0FBQyxTQUFQLENBQWlCLFFBQVEsQ0FBQyxJQUExQixFQUZ4Qjs7VUFHQSxRQUFBLEdBQVcsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsUUFBakIsRUFBMEIsUUFBUyxDQUFBLENBQUEsQ0FBbkMsQ0FBdUMsQ0FBQSxDQUFBLEVBTnBEO1NBREc7O0FBSFA7QUFXQSxXQUFPO0VBdEJFLENBekpKO0VBa0xQLGVBQUEsRUFBaUIsU0FBQyxHQUFELEVBQU0sTUFBTjtBQUNmLFFBQUE7SUFBQSxLQUFBLEdBQVEsTUFBTSxDQUFDLEtBQVAsQ0FBYSxHQUFiO0lBQ1IsTUFBQSxHQUFTLEdBQUksQ0FBQSxLQUFNLENBQUEsQ0FBQSxDQUFOO0lBQ2IsSUFBRyxLQUFNLENBQUEsQ0FBQSxDQUFUO01BQ0UsS0FBSyxDQUFDLE1BQU4sQ0FBYSxDQUFiLEVBQWdCLENBQWhCO01BQ0EsU0FBQSxHQUFZLEtBQUssQ0FBQyxJQUFOLENBQVcsR0FBWDtBQUNaLGFBQU8sSUFBQyxDQUFBLGVBQUQsQ0FBaUIsTUFBakIsRUFBeUIsU0FBekIsRUFIVDs7SUFJQSxDQUFBLEdBQUk7SUFDSixDQUFFLENBQUEsQ0FBQSxDQUFGLEdBQU87SUFDUCxDQUFFLENBQUEsQ0FBQSxDQUFGLEdBQU87QUFDUCxXQUFPO0VBVlEsQ0FsTFY7Ozs7QUFpTVQ7O0FBRUEsS0FBQSxHQUFRO0VBR04sNEJBQUEsRUFBOEIsU0FBQyxLQUFELEVBQVEsSUFBUjtJQUM1QixLQUFLLENBQUMsZUFBTixDQUFBO0lBQ0EsS0FBSyxDQUFDLGNBQU4sQ0FBQTtXQUNBLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixJQUFwQjtFQUg0QixDQUh4QjtFQVNOLGtCQUFBLEVBQW9CLFNBQUMsSUFBRDtBQUNsQixRQUFBO0FBQUE7QUFBQTtTQUFBLHFDQUFBOztNQUNFLElBQUcsQ0FBQyxDQUFDLElBQUYsS0FBVSxJQUFiO1FBQ0UsUUFBUSxDQUFDLFlBQVQsQ0FBc0IsQ0FBdEI7QUFDQSxjQUZGO09BQUEsTUFBQTs2QkFBQTs7QUFERjs7RUFEa0IsQ0FUZDtFQWdCTixTQUFBLEVBQVcsU0FBQyxLQUFEO1dBQ1QsRUFBRSxDQUFDLFlBQUgsQ0FBZ0IsS0FBaEI7RUFEUyxDQWhCTDtFQW9CTixXQUFBLEVBQWEsU0FBQyxVQUFEO0FBQ1gsUUFBQTtJQUFBLEtBQUEsR0FBUSxJQUFDLENBQUEsZUFBRCxDQUFpQixJQUFDLENBQUEsaUJBQUQsQ0FBbUIsVUFBbkIsQ0FBakI7SUFDUixJQUFDLENBQUEsVUFBRCxDQUFZLEtBQVo7QUFDQSxXQUFPO0VBSEksQ0FwQlA7RUEwQk4sVUFBQSxFQUFZLFNBQUMsS0FBRDtJQUNWLElBQUMsQ0FBQSxXQUFELENBQWEsS0FBYjtJQUNBLElBQUMsQ0FBQSxxQkFBRCxDQUF1QixJQUFJLENBQUMsSUFBSSxDQUFDLFlBQWpDO0lBQ0EsSUFBQyxDQUFBLFVBQUQsQ0FBWSxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQXRCLEVBQW1DLEtBQW5DO1dBQ0EsSUFBQyxDQUFBLFVBQUQsQ0FBWSxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQXRCO0VBSlUsQ0ExQk47RUFpQ04sV0FBQSxFQUFhLFNBQUMsS0FBRDtJQUNYLEtBQUssQ0FBQyxpQkFBTixDQUF3QixLQUF4QjtJQUNBLEtBQUssQ0FBQyxVQUFOLEdBQW1CLE1BQU0sQ0FBQyxTQUFQLENBQWlCLEtBQUssQ0FBQyxZQUF2QjtJQUNuQixJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVYsR0FBeUI7SUFDekIsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFWLEdBQTBCO1dBQzFCLFdBQVcsQ0FBQyxTQUFaLENBQXNCLEtBQUssQ0FBQyxVQUE1QjtFQUxXLENBakNQO0VBeUNOLGFBQUEsRUFBZSxTQUFBO1dBQ2IsUUFBUSxDQUFDLElBQVQsQ0FBYyxvQkFBZCxFQUFvQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBL0IsQ0FBbUMsU0FBQyxNQUFEO01BQ3JFLE1BQU0sQ0FBQyxVQUFQLEdBQW9CLE1BQU0sQ0FBQyxTQUFQLENBQWlCLE1BQU0sQ0FBQyxJQUF4QjtNQUNwQixJQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLHlCQUExQjtRQUNFLE1BQU0sQ0FBQyxVQUFQLEdBQW9CLEtBRHRCOzthQUVBO0lBSnFFLENBQW5DLENBQXBDO0VBRGEsQ0F6Q1Q7RUFrRE4saUJBQUEsRUFBbUIsU0FBQyxJQUFEO0FBQ2pCLFFBQUE7SUFBQSxRQUFBLEdBQVcsSUFBSSxDQUFDLEtBQUwsQ0FBVyxHQUFYO0lBQ1gsSUFBRyxRQUFRLENBQUMsTUFBVCxLQUFtQixDQUF0QjtBQUNFLGFBQU8sUUFBUyxDQUFBLENBQUEsRUFEbEI7O0lBRUEsTUFBQSxHQUFTO0FBQ1QsU0FBQSwwQ0FBQTs7TUFDRSxDQUFBLEdBQUksQ0FBQyxDQUFDLFNBQUYsQ0FBWSxDQUFaLEVBQWUsQ0FBQyxDQUFDLE1BQUYsR0FBVyxDQUExQjtNQUNKLENBQUEsR0FBSSxDQUFDLENBQUMsS0FBRixDQUFRLEdBQVI7TUFDSixNQUFNLENBQUMsSUFBUCxDQUFZLENBQVo7QUFIRjtJQUlBLE1BQUEsR0FBUyxJQUFDLENBQUEsd0JBQUQsQ0FBMEIsTUFBMUI7QUFDVCxXQUFPO0VBVlUsQ0FsRGI7RUErRE4sd0JBQUEsRUFBMEIsU0FBQyxNQUFEO0FBQ3hCLFFBQUE7SUFBQSxLQUFBLEdBQVE7SUFDUixPQUFBLEdBQVU7SUFDVixVQUFBLEdBQWE7SUFDYixRQUFBLEdBQVc7QUFDWCxTQUFBLHdDQUFBOztNQUNFLEtBQUssQ0FBQyxJQUFOLENBQVcsQ0FBRSxDQUFBLENBQUEsQ0FBYjtNQUNBLFFBQUEsR0FBVyxVQUFBLENBQVcsQ0FBRSxDQUFBLENBQUEsQ0FBYixDQUFBLEdBQWlCO01BQzVCLE9BQU8sQ0FBQyxJQUFSLENBQWEsUUFBYjtNQUNBLFVBQVUsQ0FBQyxJQUFYLENBQWdCLFVBQUEsQ0FBVyxDQUFFLENBQUEsQ0FBQSxDQUFiLENBQWhCO0FBSkY7SUFLQSxXQUFBLEdBQWM7QUFDZCxTQUFBLDhDQUFBOztNQUNFLFdBQUEsR0FBYyxXQUFBLEdBQWMsVUFBQSxDQUFXLENBQVg7QUFEOUI7SUFFQSxJQUFHLFdBQUEsS0FBZSxDQUFsQjtNQUNFLE9BQU8sQ0FBQyxLQUFSLENBQWMsNEJBQWQsRUFERjs7SUFFQSxLQUFBLEdBQVEsSUFBSSxDQUFDLE1BQUwsQ0FBQTtJQUNSLFNBQUEsR0FBWTtBQUNaLFNBQUEsMkNBQUE7O01BQ0UsSUFBRyxLQUFBLEdBQVEsQ0FBWDtBQUNFLGVBQU8sS0FBTSxDQUFBLFNBQUEsRUFEZjs7TUFFQSxTQUFBO0FBSEY7RUFqQndCLENBL0RwQjtFQXNGTixlQUFBLEVBQWlCLFNBQUMsSUFBRDtBQUNmLFFBQUE7QUFBQTtBQUFBLFNBQUEscUNBQUE7O01BQ0UsSUFBRyxDQUFDLENBQUMsSUFBRixLQUFVLElBQWI7QUFDRSxlQUFPLEVBRFQ7O0FBREY7V0FHQSxPQUFPLENBQUMsS0FBUixDQUFjLHdCQUFBLEdBQXlCLElBQXpCLEdBQThCLGNBQTVDO0VBSmUsQ0F0Rlg7RUE2Rk4saUJBQUEsRUFBbUIsU0FBQyxLQUFEO0FBQ2pCLFFBQUE7SUFBQSxLQUFLLENBQUMsWUFBTixHQUFxQixLQUFLLENBQUM7QUFDM0I7U0FBQSxZQUFBO01BQ0UsSUFBRyxLQUFLLENBQUMsY0FBTixDQUFxQixHQUFyQixDQUFIO1FBQ0UsSUFBRyxHQUFHLENBQUMsUUFBSixDQUFhLE9BQWIsQ0FBSDt1QkFDRSxLQUFLLENBQUMsWUFBTixHQUFxQixLQUFLLENBQUMsWUFBWSxDQUFDLE1BQW5CLENBQTBCLEtBQU0sQ0FBQSxHQUFBLENBQWhDLEdBRHZCO1NBQUEsTUFBQTsrQkFBQTtTQURGO09BQUEsTUFBQTs2QkFBQTs7QUFERjs7RUFGaUIsQ0E3RmI7RUFxR04scUJBQUEsRUFBdUIsU0FBQyxNQUFEO0FBQ3JCLFFBQUE7SUFBQSxJQUFHLE1BQU0sQ0FBQyxVQUFQLEtBQXFCLE1BQXhCO01BQ0UsU0FBUyxDQUFDLGdCQUFWLENBQTJCLE1BQU0sQ0FBQyxnQkFBUCxDQUF3QixNQUFNLENBQUMsVUFBL0IsQ0FBM0IsRUFBc0UsUUFBdEUsRUFBK0UsSUFBL0UsRUFERjs7SUFFQSxJQUFHLE1BQU0sQ0FBQyxPQUFQLEtBQWtCLE1BQXJCO01BQ0UsU0FBUyxDQUFDLGdCQUFWLENBQTJCLE1BQU0sQ0FBQyxnQkFBUCxDQUF3QixNQUFNLENBQUMsT0FBL0IsQ0FBM0IsRUFBbUUsS0FBbkUsRUFBeUUsSUFBekUsRUFERjs7SUFFQSxJQUFHLE1BQU0sQ0FBQyxPQUFQLEtBQWtCLE1BQXJCO01BQ0UsU0FBUyxDQUFDLGdCQUFWLENBQTJCLE1BQU0sQ0FBQyxnQkFBUCxDQUF3QixNQUFNLENBQUMsT0FBL0IsQ0FBM0IsRUFBbUUsS0FBbkUsRUFBeUUsSUFBekUsRUFERjs7SUFFQSxJQUFHLE1BQU0sQ0FBQyxXQUFQLEtBQXNCLE1BQXpCO01BQ0UsU0FBUyxDQUFDLGdCQUFWLENBQTJCLE1BQU0sQ0FBQyxnQkFBUCxDQUF3QixNQUFNLENBQUMsV0FBL0IsQ0FBM0IsRUFBdUUsUUFBdkUsRUFBZ0YsS0FBaEYsRUFERjs7SUFFQSxJQUFHLE1BQU0sQ0FBQyxRQUFQLEtBQW1CLE1BQXRCO01BQ0UsU0FBUyxDQUFDLGdCQUFWLENBQTJCLE1BQU0sQ0FBQyxnQkFBUCxDQUF3QixNQUFNLENBQUMsUUFBL0IsQ0FBM0IsRUFBb0UsS0FBcEUsRUFBMEUsS0FBMUUsRUFERjs7SUFFQSxJQUFHLE1BQU0sQ0FBQyxRQUFQLEtBQW1CLE1BQXRCO01BQ0UsU0FBUyxDQUFDLGdCQUFWLENBQTJCLE1BQU0sQ0FBQyxnQkFBUCxDQUF3QixNQUFNLENBQUMsUUFBL0IsQ0FBM0IsRUFBb0UsS0FBcEUsRUFBMEUsS0FBMUUsRUFERjs7SUFFQSxJQUFHLE1BQU0sQ0FBQyxRQUFQLEtBQW1CLE1BQXRCO0FBQ0U7QUFBQSxXQUFBLHFDQUFBOztRQUNFLFNBQVMsQ0FBQyxRQUFWLENBQW1CLEdBQUcsQ0FBQyxJQUF2QixFQUE0QixHQUFHLENBQUMsS0FBaEM7QUFERixPQURGOztJQUdBLElBQUcsTUFBTSxDQUFDLGFBQVAsS0FBd0IsTUFBM0I7QUFDRTtBQUFBLFdBQUEsd0NBQUE7O1FBQ0UsU0FBUyxDQUFDLGFBQVYsQ0FBd0IsR0FBRyxDQUFDLElBQTVCLEVBQWlDLEdBQUcsQ0FBQyxLQUFyQztBQURGLE9BREY7O0lBR0EsSUFBRyxNQUFNLENBQUMsYUFBUCxLQUF3QixNQUEzQjtBQUNFO0FBQUE7V0FBQSx3Q0FBQTs7cUJBQ0UsU0FBUyxDQUFDLGFBQVYsQ0FBd0IsR0FBRyxDQUFDLElBQTVCLEVBQWlDLEdBQUcsQ0FBQyxLQUFyQztBQURGO3FCQURGOztFQW5CcUIsQ0FyR2pCO0VBNkhOLFVBQUEsRUFBWSxTQUFDLE1BQUQsRUFBUSxPQUFSO0FBQ1YsUUFBQTtJQUFBLE1BQUEsR0FBUztJQUNULElBQUcsTUFBTSxDQUFDLFNBQVAsS0FBb0IsTUFBdkI7TUFDRSxLQUFLLENBQUMsU0FBTixDQUFnQixNQUFNLENBQUMsU0FBdkIsRUFBaUMsS0FBakM7TUFDQSxNQUFBLEdBQVMsS0FGWDs7SUFHQSxJQUFHLE9BQUEsSUFBVyxDQUFDLE1BQWY7TUFDRSxLQUFLLENBQUMscUJBQU4sQ0FBQSxFQURGOztJQUVBLElBQUcsTUFBTSxDQUFDLFVBQVAsS0FBcUIsTUFBeEI7TUFDRSxLQUFLLENBQUMsVUFBTixDQUFpQixNQUFNLENBQUMsVUFBeEIsRUFERjs7SUFFQSxJQUFHLE1BQU0sQ0FBQyxTQUFQLEtBQW9CLE1BQXZCO2FBQ0UsS0FBSyxDQUFDLFNBQU4sQ0FBZ0IsTUFBTSxDQUFDLFNBQXZCLEVBREY7O0VBVFUsQ0E3SE47RUEwSU4sVUFBQSxFQUFZLFNBQUMsTUFBRDtJQUNWLElBQUcsTUFBTSxDQUFDLFFBQVAsS0FBbUIsTUFBdEI7TUFDRSxRQUFBLENBQUEsRUFERjs7SUFFQSxJQUFHLE1BQU0sQ0FBQyxRQUFQLEtBQW1CLE1BQXRCO2FBQ0Usb0JBQUEsQ0FBQSxFQURGOztFQUhVLENBMUlOO0VBaUpOLGtCQUFBLEVBQW9CLFNBQUMsTUFBRDtBQUNsQixRQUFBO0lBQUEsSUFBQSxHQUFPO0lBQ1AsSUFBRyxNQUFNLENBQUMsZUFBUCxLQUEwQixNQUE3QjtNQUNFLFlBQUEsR0FBZSxNQUFNLENBQUMsZ0JBQVAsQ0FBd0IsTUFBTSxDQUFDLGVBQS9CO01BQ2YsSUFBSSxDQUFDLElBQUwsQ0FBVSxTQUFTLENBQUMsaUJBQVYsQ0FBNEIsWUFBNUIsRUFBMEMsSUFBMUMsQ0FBVixFQUZGOztJQUdBLElBQUcsTUFBTSxDQUFDLGdCQUFQLEtBQTJCLE1BQTlCO01BQ0UsWUFBQSxHQUFlLE1BQU0sQ0FBQyxnQkFBUCxDQUF3QixNQUFNLENBQUMsZ0JBQS9CO01BQ2YsSUFBSSxDQUFDLElBQUwsQ0FBVSxTQUFTLENBQUMsaUJBQVYsQ0FBNEIsWUFBNUIsRUFBMEMsS0FBMUMsQ0FBVixFQUZGOztJQUdBLElBQUcsTUFBTSxDQUFDLFdBQVAsS0FBc0IsTUFBekI7TUFDRSxJQUFJLENBQUMsSUFBTCxDQUFVLFNBQVMsQ0FBQyxnQkFBVixDQUEyQixNQUFNLENBQUMsV0FBbEMsQ0FBVixFQURGOztJQUVBLE9BQUEsR0FBVTtBQUNWLFNBQUEsc0NBQUE7O01BQ0UsSUFBRyxDQUFBLEtBQUssS0FBUjtRQUNFLE9BQUEsR0FBVSxNQURaOztBQURGO0FBR0EsV0FBTztFQWRXLENBakpkOzs7O0FBb0tSOztBQUdBLEtBQUEsR0FBUTtFQUdOLHFCQUFBLEVBQXVCLFNBQUMsSUFBRCxFQUFNLE9BQU47V0FDckIsSUFBQyxDQUFBLFNBQUQsQ0FBVyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsaUJBQTVDLEVBQThELEtBQTlEO0VBRHFCLENBSGpCO0VBT04sU0FBQSxFQUFXLFNBQUMsSUFBRCxFQUFPLE9BQVA7QUFDVCxRQUFBO0FBQUE7QUFBQSxTQUFBLHFDQUFBOztNQUNFLElBQUcsQ0FBQyxDQUFDLElBQUYsS0FBVSxJQUFiO1FBQ0UsS0FBQSxHQUFZLElBQUEsS0FBQSxDQUFNLFFBQUEsR0FBUyxVQUFULEdBQW9CLENBQUMsQ0FBQyxJQUE1QjtRQUNaLElBQUcsT0FBSDtVQUNFLEtBQUssQ0FBQyxNQUFOLEdBQWUsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLFlBRGxEO1NBQUEsTUFBQTtVQUdFLEtBQUssQ0FBQyxNQUFOLEdBQWUsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLFlBSGxEOztRQUlBLEtBQUssQ0FBQyxJQUFOLENBQUE7QUFDQSxlQUFPLE1BUFQ7O0FBREY7RUFEUyxDQVBMO0VBbUJOLFNBQUEsRUFBVyxTQUFDLElBQUQ7QUFDVCxRQUFBO0FBQUE7QUFBQSxTQUFBLHFDQUFBOztNQUNFLElBQUcsQ0FBQyxDQUFDLE1BQUw7QUFDRSxlQUFPLE1BRFQ7T0FBQSxNQUFBO0FBR0UsZUFBTyxLQUhUOztBQURGO0VBRFMsQ0FuQkw7RUEyQk4sVUFBQSxFQUFZLFNBQUMsSUFBRDtBQUNWLFFBQUE7SUFBQSxLQUFBLEdBQVEsSUFBQyxDQUFBLFNBQUQsQ0FBVyxJQUFYLEVBQWdCLElBQWhCO0lBQ1IsS0FBSyxDQUFDLGdCQUFOLENBQXVCLE9BQXZCLEVBQWdDLENBQUMsU0FBQTtNQUMvQixJQUFDLENBQUEsV0FBRCxHQUFlO01BQ2YsSUFBQyxDQUFBLElBQUQsQ0FBQTtJQUYrQixDQUFELENBQWhDLEVBSUcsS0FKSDtXQUtBLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBWCxDQUFnQjtNQUFDLE1BQUEsRUFBTyxJQUFSO01BQWEsT0FBQSxFQUFRLEtBQXJCO0tBQWhCO0VBUFUsQ0EzQk47RUFxQ04sU0FBQSxFQUFXLFNBQUMsSUFBRDtBQUNULFFBQUE7QUFBQTtBQUFBO1NBQUEscUNBQUE7O01BQ0UsSUFBRyxJQUFBLEtBQVEsQ0FBQyxDQUFDLElBQWI7UUFDRSxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQVIsQ0FBQTtRQUNBLEtBQUEsR0FBUSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQVgsQ0FBbUIsQ0FBbkI7cUJBQ1IsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFYLENBQWtCLEtBQWxCLEVBQXdCLENBQXhCLEdBSEY7T0FBQSxNQUFBOzZCQUFBOztBQURGOztFQURTLENBckNMOzs7QUE4Q1IsUUFBQSxHQUFXOztBQUNYLEtBQUEsR0FBUTs7QUFDUixhQUFBLEdBQWdCOztBQUNoQixlQUFBLEdBQWtCOztBQUVsQixXQUFBLEdBQWM7RUFFWixTQUFBLEVBQVcsU0FBQyxJQUFELEVBQU0sUUFBTjtJQUNULGFBQUEsQ0FBYyxLQUFkO0lBQ0EsUUFBQSxHQUFXO0lBRVgsYUFBQSxHQUFnQjtJQUNoQixJQUFHLFFBQUEsS0FBWSxNQUFmO01BQ0UsZUFBQSxHQUFrQixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxtQkFEdkM7S0FBQSxNQUFBO01BR0UsZUFBQSxHQUFrQixTQUhwQjs7V0FJQSxLQUFBLEdBQVEsV0FBQSxDQUFZLElBQUMsQ0FBQSxNQUFiLEVBQXFCLGVBQXJCO0VBVEMsQ0FGQztFQWFaLFFBQUEsRUFBVSxTQUFBO0lBQ1IsYUFBQSxDQUFjLEtBQWQ7SUFDQSxLQUFBLEdBQVE7SUFDUixJQUFJLENBQUMsV0FBTCxHQUFtQjtJQUNuQixLQUFLLENBQUMsYUFBTixDQUFBO0FBQ0EsV0FBTztFQUxDLENBYkU7RUFvQlosV0FBQSxFQUFhLFNBQUMsSUFBRDtJQUNYLGFBQUEsQ0FBYyxLQUFkO1dBQ0EsS0FBQSxHQUFRLFdBQUEsQ0FBWSxJQUFDLENBQUEsTUFBYixFQUFxQixJQUFyQjtFQUZHLENBcEJEO0VBd0JaLFVBQUEsRUFBWSxTQUFBO0lBQ1YsYUFBQSxDQUFjLEtBQWQ7V0FDQSxLQUFBLEdBQVEsV0FBQSxDQUFZLElBQUMsQ0FBQSxNQUFiLEVBQXFCLGVBQXJCO0VBRkUsQ0F4QkE7RUE0QlosTUFBQSxFQUFRLFNBQUE7QUFDTixRQUFBO0lBQUEsSUFBRyxlQUFBLEtBQW1CLENBQXRCO01BQ0UsV0FBVyxDQUFDLFFBQVosQ0FBQTtBQUNBLGFBRkY7O0lBSUEsSUFBRyxRQUFTLENBQUEsYUFBQSxDQUFULEtBQTJCLEdBQTlCO01BQ0UsQ0FBQSxHQUFJO01BQ0osR0FBQSxHQUFNO0FBQ04sYUFBTSxRQUFTLENBQUEsQ0FBQSxDQUFULEtBQWUsR0FBckI7UUFDRSxDQUFBO1FBQ0EsR0FBQSxHQUFNLEdBQUEsR0FBTSxRQUFTLENBQUEsQ0FBQTtNQUZ2QjtNQUdBLEdBQUEsR0FBTSxHQUFHLENBQUMsU0FBSixDQUFjLENBQWQsRUFBZ0IsR0FBRyxDQUFDLE1BQUosR0FBVyxDQUEzQjtNQUVOLElBQUcsR0FBRyxDQUFDLE9BQUosQ0FBWSxlQUFaLENBQUEsR0FBK0IsQ0FBQyxDQUFuQztRQUVFLElBQUEsR0FBTztRQUNQLENBQUE7QUFDQSxlQUFNLElBQUksQ0FBQyxPQUFMLENBQWEsT0FBYixDQUFBLEtBQXlCLENBQUMsQ0FBaEM7VUFDRSxDQUFBO1VBQ0EsSUFBQSxHQUFPLElBQUEsR0FBTyxRQUFTLENBQUEsQ0FBQTtRQUZ6QixDQUpGOztNQVFBLElBQUcsR0FBRyxDQUFDLE9BQUosQ0FBWSxZQUFaLENBQUEsR0FBNEIsQ0FBQyxDQUFoQztRQUNFLENBQUEsR0FBSSxHQUFHLENBQUMsS0FBSixDQUFVLGFBQVY7UUFDSixDQUFBLEdBQUksQ0FBRSxDQUFBLENBQUEsQ0FBRSxDQUFDLEtBQUwsQ0FBVyxPQUFYLENBQW9CLENBQUEsQ0FBQSxFQUYxQjs7TUFHQSxJQUFHLEdBQUcsQ0FBQyxPQUFKLENBQVksV0FBWixDQUFBLEdBQTJCLENBQUMsQ0FBL0I7UUFDRSxDQUFBLEdBQUksR0FBRyxDQUFDLEtBQUosQ0FBVSxZQUFWO1FBQ0osQ0FBQSxHQUFJLENBQUUsQ0FBQSxDQUFBLENBQUUsQ0FBQyxLQUFMLENBQVcsT0FBWCxDQUFvQixDQUFBLENBQUE7UUFDeEIsV0FBVyxDQUFDLFdBQVosQ0FBd0IsTUFBTSxDQUFDLGNBQVAsQ0FBc0IsQ0FBdEIsQ0FBeEIsRUFIRjs7TUFJQSxJQUFHLEdBQUcsQ0FBQyxPQUFKLENBQVksZUFBWixDQUFBLEdBQStCLENBQUMsQ0FBbkM7UUFDRSxXQUFXLENBQUMsVUFBWixDQUFBLEVBREY7O01BRUEsYUFBQSxHQUFnQixFQXpCbEI7O0lBMkJBLGFBQUE7SUFDQSxJQUFHLGFBQUEsS0FBaUIsUUFBUSxDQUFDLE1BQTdCO01BQ0UsV0FBVyxDQUFDLFFBQVosQ0FBQTtBQUNBLGFBRkY7O0lBSUEsSUFBRyxRQUFTLENBQUEsYUFBQSxDQUFULEtBQTJCLEdBQTlCO2FBQ0UsSUFBSSxDQUFDLFdBQUwsR0FBbUIsUUFBUSxDQUFDLFNBQVQsQ0FBbUIsQ0FBbkIsRUFBc0IsYUFBQSxHQUFjLENBQXBDLEVBRHJCO0tBQUEsTUFBQTthQUdFLElBQUksQ0FBQyxXQUFMLEdBQW1CLFFBQVEsQ0FBQyxTQUFULENBQW1CLENBQW5CLEVBQXNCLGFBQXRCLEVBSHJCOztFQXJDTSxDQTVCSTs7OztBQXlFZDs7QUFFQSxFQUFBLEdBQUs7RUFHSCxvQkFBQSxFQUFzQixTQUFDLElBQUQ7QUFDcEIsUUFBQTtJQUFBLENBQUEsR0FBSSxRQUFRLENBQUMsY0FBVCxDQUF3QixtQkFBeEI7SUFDSixRQUFBLEdBQVcsQ0FBQyxDQUFDLGdCQUFGLENBQW1CLFVBQW5CO0lBQ1gsUUFBUyxDQUFBLENBQUEsQ0FBRSxDQUFDLEtBQVosR0FBb0I7V0FDcEIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFSLEdBQWtCO0VBSkUsQ0FIbkI7RUFVSCxxQkFBQSxFQUF1QixTQUFBO0FBQ3JCLFFBQUE7SUFBQSxDQUFBLEdBQUksUUFBUSxDQUFDLGNBQVQsQ0FBd0IsbUJBQXhCO1dBQ0osQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFSLEdBQWtCO0VBRkcsQ0FWcEI7RUFlSCxvQkFBQSxFQUFzQixTQUFBO0FBQ3BCLFFBQUE7SUFBQSxJQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQXZCLEtBQW1DLE1BQXRDO01BQ0UsQ0FBQSxHQUFJLFFBQVEsQ0FBQyxjQUFULENBQXdCLG1CQUF4QjthQUNKLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBUixHQUFrQixRQUZwQjtLQUFBLE1BQUE7YUFJRSxRQUFBLENBQUEsRUFKRjs7RUFEb0IsQ0FmbkI7RUF1QkgscUJBQUEsRUFBdUIsU0FBQyxJQUFEO0FBQ3JCLFFBQUE7SUFBQSxDQUFBLEdBQUksUUFBUSxDQUFDLGNBQVQsQ0FBd0IsbUJBQXhCO0lBQ0osSUFBRyxJQUFIO01BQ0UsUUFBQSxHQUFXLENBQUMsQ0FBQyxnQkFBRixDQUFtQixVQUFuQjtNQUNYLFFBQUEsQ0FBUyxRQUFTLENBQUEsQ0FBQSxDQUFFLENBQUMsS0FBckI7TUFDQSxRQUFTLENBQUEsQ0FBQSxDQUFFLENBQUMsS0FBWixHQUFvQixHQUh0Qjs7V0FJQSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQVIsR0FBa0I7RUFORyxDQXZCcEI7RUFnQ0gsWUFBQSxFQUFjLFNBQUMsS0FBRDtBQUNaLFFBQUE7SUFBQSxNQUFBLEdBQVMsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsV0FBeEIsQ0FBb0MsQ0FBQyxnQkFBckMsQ0FBc0QsT0FBdEQ7QUFDVDtTQUFBLHdDQUFBOzs7O0FBQ0U7QUFBQTthQUFBLHVDQUFBOztVQUNFLElBQUcsQ0FBQyxDQUFDLElBQUYsS0FBVSxDQUFDLENBQUMsU0FBUyxDQUFDLFNBQVosQ0FBc0IsQ0FBdEIsRUFBd0IsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFwQyxDQUFiOzBCQUNFLENBQUMsQ0FBQyxLQUFGLEdBQVUsSUFBSSxDQUFDLFNBQUwsQ0FBZSxDQUFDLENBQUMsS0FBakIsR0FEWjtXQUFBLE1BQUE7a0NBQUE7O0FBREY7OztBQURGOztFQUZZLENBaENYOzs7QUEwQ0wsVUFBQSxHQUFhLFFBQVEsQ0FBQyxhQUFULENBQXVCLGNBQXZCOztBQUNiLFVBQVUsQ0FBQyxnQkFBWCxDQUE0QixPQUE1QixFQUFxQyxTQUFDLEtBQUQ7QUFDbkMsTUFBQTtFQUFBLFlBQUEsR0FBZSxRQUFRLENBQUMsY0FBVCxDQUF3QixtQkFBeEIsQ0FBNEMsQ0FBQyxhQUE3QyxDQUEyRCxVQUEzRDtFQUNmLFlBQVksQ0FBQyxNQUFiLENBQUE7QUFDQTtJQUNFLFVBQUEsR0FBYSxRQUFRLENBQUMsV0FBVCxDQUFxQixNQUFyQixFQURmO0dBQUEsYUFBQTtJQUVNO0lBQ0osT0FBTyxDQUFDLEtBQVIsQ0FBYywrQkFBQSxHQUFnQyxHQUE5QyxFQUhGOztBQUhtQyxDQUFyQzs7O0FBVUE7O0FBRUEsSUFBQSxHQUFPO0VBRUwsTUFBQSxFQUFRLFNBQUMsQ0FBRDtXQUNOLENBQUEsR0FBSSxDQUFKLEtBQVM7RUFESCxDQUZIO0VBTUwsS0FBQSxFQUFPLFNBQUMsQ0FBRDtXQUNMLElBQUksQ0FBQyxHQUFMLENBQVMsQ0FBQSxHQUFJLENBQWIsQ0FBQSxLQUFtQjtFQURkLENBTkY7RUFVTCxTQUFBLEVBQVcsU0FBQyxJQUFEO0FBQ1QsUUFBQTtJQUFBLEtBQUEsR0FBUTtXQUNSLElBQUksQ0FBQyxPQUFMLENBQWEsS0FBYixFQUFvQixFQUFwQjtFQUZTLENBVk47RUFlTCxtQkFBQSxFQUFxQixTQUFDLENBQUQ7QUFDbkIsUUFBQTtJQUFBLElBQUEsR0FBTztBQUNQLFNBQUEsbUNBQUE7O01BQ0UsSUFBRyxDQUFBLEtBQUssR0FBUjtRQUNFLElBQUEsR0FERjs7TUFFQSxJQUFHLENBQUEsS0FBSyxHQUFSO1FBQ0UsSUFBRyxJQUFBLEdBQU8sQ0FBVjtVQUNFLElBQUEsR0FERjtTQUFBLE1BQUE7QUFHRSxpQkFBTyxNQUhUO1NBREY7O0FBSEY7SUFRQSxJQUFHLElBQUEsS0FBUSxDQUFYO0FBQ0UsYUFBTyxLQURUO0tBQUEsTUFBQTtBQUdFLGFBQU8sTUFIVDs7RUFWbUIsQ0FmaEIiLCJmaWxlIjoibm92ZWwuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyJcclxuIyMjIFNBVklORyBBTkQgTE9BRElORyAjIyNcclxuXHJcbkdhbWVNYW5hZ2VyID0ge1xyXG5cclxuICAjIExvYWQgYSBicm93c2VyIGNvb2tpZVxyXG4gIGxvYWRDb29raWU6IChjbmFtZSkgLT5cclxuICAgIG5hbWUgPSBjbmFtZSArICc9J1xyXG4gICAgY2EgPSBkb2N1bWVudC5jb29raWUuc3BsaXQoJzsnKVxyXG4gICAgaSA9IDBcclxuICAgIHdoaWxlIGkgPCBjYS5sZW5ndGhcclxuICAgICAgYyA9IGNhW2ldXHJcbiAgICAgIHdoaWxlIGMuY2hhckF0KDApID09ICcgJ1xyXG4gICAgICAgIGMgPSBjLnN1YnN0cmluZygxKVxyXG4gICAgICBpZiBjLmluZGV4T2YobmFtZSkgPT0gMFxyXG4gICAgICAgIHJldHVybiBjLnN1YnN0cmluZyhuYW1lLmxlbmd0aCwgYy5sZW5ndGgpXHJcbiAgICAgIGkrK1xyXG4gICAgJydcclxuXHJcbiAgIyBTYXZlIGEgYnJvd3NlciBjb29raWVcclxuICBzYXZlQ29va2llOiAoY25hbWUsIGN2YWx1ZSwgZXhkYXlzKSAtPlxyXG4gICAgZCA9IG5ldyBEYXRlXHJcbiAgICBkLnNldFRpbWUgZC5nZXRUaW1lKCkgKyBleGRheXMgKiAyNCAqIDYwICogNjAgKiAxMDAwXHJcbiAgICBleHBpcmVzID0gJ2V4cGlyZXM9JyArIGQudG9VVENTdHJpbmcoKVxyXG4gICAgZG9jdW1lbnQuY29va2llID0gY25hbWUgKyAnPScgKyBjdmFsdWUgKyAnOyAnICsgZXhwaXJlcyArICc7IHBhdGg9LydcclxuXHJcbiAgIyBMb2FkIHRoZSBnYW1lIGZyb20gYSBjb29raWUgb3IgZW50ZXJlZCBqc29uXHJcbiAgbG9hZEdhbWU6IChnYW1lKSAtPlxyXG4gICAgaWYgZ2FtZSA9PSB1bmRlZmluZWRcclxuICAgICAgaWYgQGxvYWRDb29raWUoXCJnYW1lRGF0YVwiKSAhPSAnJ1xyXG4gICAgICAgIGNvbnNvbGUubG9nIFwiQ29va2llIGRvdW5kIVwiXHJcbiAgICAgICAgY29va2llID0gQGxvYWRDb29raWUoXCJnYW1lRGF0YVwiKVxyXG4gICAgICAgIGNvbnNvbGUubG9nIFwiQ29va2llIGxvYWRlZFwiXHJcbiAgICAgICAgY29uc29sZS5sb2cgY29va2llXHJcbiAgICAgICAgZGF0YS5nYW1lID0gSlNPTi5wYXJzZShhdG9iKEBsb2FkQ29va2llKFwiZ2FtZURhdGFcIikpKVxyXG4gICAgICAgIGNvbnNvbGUubG9nIFwiRGF0YSBsb2FkZWQhXCJcclxuICAgICAgICBkYXRhLmRlYnVnTW9kZSA9IGRhdGEuZ2FtZS5kZWJ1Z01vZGVcclxuICAgIGVsc2UgaWYgZ2FtZSAhPSB1bmRlZmluZWRcclxuICAgICAgZGF0YS5nYW1lID0gSlNPTi5wYXJzZShhdG9iKGdhbWUpKVxyXG4gICAgICBkYXRhLmRlYnVnTW9kZSA9IGRhdGEuZ2FtZS5kZWJ1Z01vZGVcclxuICAgICAgcmV0dXJuXHJcblxyXG4gICMgU3RhcnQgdGhlIGdhbWUgYnkgbG9hZGluZyB0aGUgZGVmYXVsdCBnYW1lLmpzb25cclxuICBzdGFydEdhbWU6IC0+XHJcbiAgICByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0XHJcbiAgICByZXF1ZXN0Lm9wZW4gJ0dFVCcsIGdhbWVQYXRoICsgJy9nYW1lLmpzb24nLCB0cnVlXHJcbiAgICByZXF1ZXN0Lm9ubG9hZCA9IC0+XHJcbiAgICAgIGlmIHJlcXVlc3Quc3RhdHVzID49IDIwMCBhbmQgcmVxdWVzdC5zdGF0dXMgPCA0MDBcclxuICAgICAgICBqc29uID0gSlNPTi5wYXJzZShyZXF1ZXN0LnJlc3BvbnNlVGV4dClcclxuICAgICAgICBqc29uID0gR2FtZU1hbmFnZXIucHJlcGFyZURhdGEoanNvbilcclxuICAgICAgICBkYXRhLmdhbWUgPSBqc29uXHJcbiAgICAgICAgZGF0YS5nYW1lLmN1cnJlbnRTY2VuZSA9IFNjZW5lLmNoYW5nZVNjZW5lKGRhdGEuZ2FtZS5zY2VuZXNbMF0ubmFtZSlcclxuICAgICAgICBkYXRhLmRlYnVnTW9kZSA9IGRhdGEuZ2FtZS5kZWJ1Z01vZGVcclxuICAgIHJlcXVlc3Qub25lcnJvciA9IC0+XHJcbiAgICAgIHJldHVyblxyXG4gICAgcmVxdWVzdC5zZW5kKClcclxuXHJcbiAgIyBDb252ZXJ0cyB0aGUgZ2FtZSdzIHN0YXRlIGludG8ganNvbiBhbmQgQmFzZTY0IGVuY29kZSBpdFxyXG4gIHNhdmVHYW1lQXNKc29uOiAoKSAtPlxyXG4gICAgc2F2ZSA9IGJ0b2EoSlNPTi5zdHJpbmdpZnkoZGF0YS5nYW1lKSlcclxuICAgIHJldHVybiBzYXZlXHJcblxyXG4gICMgU2F2ZSBnYW1lIGluIHRoZSBkZWZpbmVkIHdheVxyXG4gIHNhdmVHYW1lOiAtPlxyXG4gICAgc2F2ZSA9IEBzYXZlR2FtZUFzSnNvbigpXHJcbiAgICBpZiBkYXRhLmdhbWUuc2V0dGluZ3Muc2F2ZU1vZGUgPT0gXCJjb29raWVcIlxyXG4gICAgICBAc2F2ZUNvb2tpZShcImdhbWVEYXRhXCIsc2F2ZSwzNjUpXHJcbiAgICBlbHNlIGlmIGRhdGEuZ2FtZS5zZXR0aW5ncy5zYXZlTW9kZSA9PSBcInRleHRcIlxyXG4gICAgICBVSS5zaG93U2F2ZU5vdGlmaWNhdGlvbihzYXZlKVxyXG5cclxuICAjIEFkZCB2YWx1ZXMgdG8gZ2FtZS5qc29uIHRoYXQgYXJlIG5vdCBkZWZpbmVkIGJ1dCBhcmUgcmVxdWlyZWQgZm9yIFZ1ZS5qcyB2aWV3IHVwZGF0aW5nXHJcbiAgcHJlcGFyZURhdGE6IChqc29uKSAtPlxyXG4gICAganNvbi5jdXJyZW50U2NlbmU9XCJcIlxyXG4gICAganNvbi5wYXJzZWRDaG9pY2VzPVwiXCJcclxuICAgIGZvciBpIGluIGpzb24uaW52ZW50b3J5XHJcbiAgICAgIGlmIGkuZGlzcGxheU5hbWUgPT0gdW5kZWZpbmVkXHJcbiAgICAgICAgaS5kaXNwbGF5TmFtZSA9IGkubmFtZVxyXG4gICAgZm9yIHMgaW4ganNvbi5zY2VuZXNcclxuICAgICAgcy5jb21iaW5lZFRleHQgPSBcIlwiXHJcbiAgICAgIHMucGFyc2VkVGV4dCA9IFwiXCJcclxuICAgICAgZm9yIGMgaW4gcy5jaG9pY2VzXHJcbiAgICAgICAgYy5wYXJzZWRUZXh0ID0gXCJcIlxyXG4gICAgICAgIGlmIGMubmV4dFNjZW5lID09IHVuZGVmaW5lZFxyXG4gICAgICAgICAgYy5uZXh0U2NlbmUgPSBcIlwiXHJcbiAgICAgICAgaWYgYy5hbHdheXNTaG93ID09IHVuZGVmaW5lZFxyXG4gICAgICAgICAgYy5hbHdheXNTaG93ID0gZmFsc2VcclxuICAgIHJldHVybiBqc29uXHJcblxyXG59XHJcblxuXHJcbiMjIyBJTlZFTlRPUlksIFNUQVQgJiBWQUxVRSBPUEVSQVRJT05TICMjI1xyXG5cclxuSW52ZW50b3J5ID0ge1xyXG5cclxuICAjIENoZWNrIGlmIGl0ZW0gb3Igc3RhdCByZXF1aXJlbWVudHMgaGF2ZSBiZWVuIGZpbGxlZFxyXG4gIGNoZWNrUmVxdWlyZW1lbnRzOiAocmVxdWlyZW1lbnRzLCBpc0l0ZW0pIC0+XHJcbiAgICByZXFzRmlsbGVkID0gMFxyXG4gICAgaWYgaXNJdGVtXHJcbiAgICAgIGZvciBpIGluIGRhdGEuZ2FtZS5pbnZlbnRvcnlcclxuICAgICAgICBmb3IgaiBpbiByZXF1aXJlbWVudHNcclxuICAgICAgICAgIGlmIGpbMF0gPT0gaS5uYW1lXHJcbiAgICAgICAgICAgIGlmIGpbMV0gPD0gaS5jb3VudFxyXG4gICAgICAgICAgICAgIHJlcXNGaWxsZWQgPSByZXFzRmlsbGVkICsgMVxyXG4gICAgZWxzZVxyXG4gICAgICBmb3IgaSBpbiBkYXRhLmdhbWUuc3RhdHNcclxuICAgICAgICBmb3IgaiBpbiByZXF1aXJlbWVudHNcclxuICAgICAgICAgIGlmIGpbMF0gPT0gaS5uYW1lXHJcbiAgICAgICAgICAgIGlmIGpbMV0gPD0gaS52YWx1ZVxyXG4gICAgICAgICAgICAgIHJlcXNGaWxsZWQgPSByZXFzRmlsbGVkICsgMVxyXG4gICAgaWYgcmVxc0ZpbGxlZCA9PSByZXF1aXJlbWVudHMubGVuZ3RoXHJcbiAgICAgIHJldHVybiB0cnVlXHJcbiAgICBlbHNlXHJcbiAgICAgIHJldHVybiBmYWxzZVxyXG5cclxuICAjIFNldCBhIHZhbHVlIGluIEpTT05cclxuICBzZXRWYWx1ZTogKHBhcnNlZCwgbmV3VmFsdWUpIC0+XHJcbiAgICBnZXRWYWx1ZUFycmF5TGFzdCA9IEBnZXRWYWx1ZUFycmF5TGFzdChwYXJzZWQpXHJcbiAgICB2YWx1ZSA9IFBhcnNlci5maW5kVmFsdWUocGFyc2VkLGZhbHNlKVxyXG4gICAgdmFsdWVbZ2V0VmFsdWVBcnJheUxhc3RdID0gbmV3VmFsdWVcclxuXHJcbiAgIyBJbmNyZWFzZSBhIHZhbHVlIGluIEpTT05cclxuICBpbmNyZWFzZVZhbHVlOiAocGFyc2VkLCBjaGFuZ2UpIC0+XHJcbiAgICBnZXRWYWx1ZUFycmF5TGFzdCA9IEBnZXRWYWx1ZUFycmF5TGFzdChwYXJzZWQpXHJcbiAgICB2YWx1ZSA9IFBhcnNlci5maW5kVmFsdWUocGFyc2VkLGZhbHNlKVxyXG4gICAgdmFsdWVbZ2V0VmFsdWVBcnJheUxhc3RdID0gdmFsdWVbZ2V0VmFsdWVBcnJheUxhc3RdICsgY2hhbmdlXHJcbiAgICBpZiAhaXNOYU4ocGFyc2VGbG9hdCh2YWx1ZVtnZXRWYWx1ZUFycmF5TGFzdF0pKVxyXG4gICAgICB2YWx1ZVtnZXRWYWx1ZUFycmF5TGFzdF0gPSBwYXJzZUZsb2F0KHZhbHVlW2dldFZhbHVlQXJyYXlMYXN0XS50b0ZpeGVkKDgpKTtcclxuXHJcbiAgIyBEZWNyZWFzZSBhIHZhbHVlIGluIEpTT05cclxuICBkZWNyZWFzZVZhbHVlOiAocGFyc2VkLCBjaGFuZ2UpIC0+XHJcbiAgICBnZXRWYWx1ZUFycmF5TGFzdCA9IEBnZXRWYWx1ZUFycmF5TGFzdChwYXJzZWQpXHJcbiAgICB2YWx1ZSA9IFBhcnNlci5maW5kVmFsdWUocGFyc2VkLGZhbHNlKVxyXG4gICAgdmFsdWVbZ2V0VmFsdWVBcnJheUxhc3RdID0gdmFsdWVbZ2V0VmFsdWVBcnJheUxhc3RdIC0gY2hhbmdlXHJcbiAgICBpZiAhaXNOYU4ocGFyc2VGbG9hdCh2YWx1ZVtnZXRWYWx1ZUFycmF5TGFzdF0pKVxyXG4gICAgICB2YWx1ZVtnZXRWYWx1ZUFycmF5TGFzdF0gPSBwYXJzZUZsb2F0KHZhbHVlW2dldFZhbHVlQXJyYXlMYXN0XS50b0ZpeGVkKDgpKTtcclxuXHJcbiAgIyBHZXQgdGhlIGxhc3QgaXRlbSBpbiBhIHZhbHVlIGFycmF5XHJcbiAgZ2V0VmFsdWVBcnJheUxhc3Q6IChwYXJzZWQpIC0+XHJcbiAgICBnZXRWYWx1ZUFycmF5TGFzdCA9IHBhcnNlZC5zcGxpdChcIixcIilcclxuICAgIGdldFZhbHVlQXJyYXlMYXN0ID0gZ2V0VmFsdWVBcnJheUxhc3RbZ2V0VmFsdWVBcnJheUxhc3QubGVuZ3RoLTFdLnNwbGl0KFwiLlwiKVxyXG4gICAgZ2V0VmFsdWVBcnJheUxhc3QgPSBnZXRWYWx1ZUFycmF5TGFzdFtnZXRWYWx1ZUFycmF5TGFzdC5sZW5ndGgtMV1cclxuICAgIHJldHVybiBnZXRWYWx1ZUFycmF5TGFzdFxyXG5cclxuICAjIEVkaXQgdGhlIHBsYXllcidzIGl0ZW1zIG9yIHN0YXRzXHJcbiAgZWRpdEl0ZW1zT3JTdGF0czogKGl0ZW1zLCBtb2RlLCBpc0l0ZW0pIC0+XHJcbiAgICBpZiBpc0l0ZW1cclxuICAgICAgaW52ZW50b3J5ID0gZGF0YS5nYW1lLmludmVudG9yeVxyXG4gICAgICBpc0ludiA9IHRydWVcclxuICAgIGVsc2VcclxuICAgICAgaW52ZW50b3J5ID0gZGF0YS5nYW1lLnN0YXRzXHJcbiAgICAgIGlzSW52ID0gZmFsc2VcclxuICAgIGZvciBqIGluIGl0ZW1zXHJcbiAgICAgIGl0ZW1BZGRlZCA9IGZhbHNlXHJcbiAgICAgIGZvciBpIGluIGludmVudG9yeVxyXG4gICAgICAgIGlmIGkubmFtZSA9PSBqWzBdXHJcbiAgICAgICAgICBwID0galsxXS5zcGxpdChcIixcIilcclxuICAgICAgICAgIHByb2JhYmlsaXR5ID0gMVxyXG4gICAgICAgICAgaWYgcC5sZW5ndGggPiAxXHJcbiAgICAgICAgICAgIGRpc3BsYXlOYW1lID0gcFsxXVxyXG4gICAgICAgICAgICBjb3VudCA9IHBhcnNlSW50KHBbMF0pXHJcbiAgICAgICAgICAgIGlmICFpc05hTihkaXNwbGF5TmFtZSlcclxuICAgICAgICAgICAgICBwcm9iYWJpbGl0eSA9IHBbMV1cclxuICAgICAgICAgICAgICBkaXNwbGF5TmFtZSA9IGoubmFtZVxyXG4gICAgICAgICAgICBpZiBwLmxlbmd0aCA+IDJcclxuICAgICAgICAgICAgICBwcm9iYWJpbGl0eSA9IHBhcnNlRmxvYXQocFsxXSlcclxuICAgICAgICAgICAgICBkaXNwbGF5TmFtZSA9IHBbMl1cclxuICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgZGlzcGxheU5hbWUgPSBqWzBdXHJcbiAgICAgICAgICAgIGNvdW50ID0gcGFyc2VJbnQoalsxXSlcclxuICAgICAgICAgIHZhbHVlID0gTWF0aC5yYW5kb20oKVxyXG4gICAgICAgICAgaWYgdmFsdWUgPCBwcm9iYWJpbGl0eVxyXG4gICAgICAgICAgICBpZiAobW9kZSA9PSBcInNldFwiKVxyXG4gICAgICAgICAgICAgIGlmIGlzSW52XHJcbiAgICAgICAgICAgICAgICBpLmNvdW50ID0gcGFyc2VJbnQoalsxXSlcclxuICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBpLnZhbHVlID0gcGFyc2VJbnQoalsxXSlcclxuICAgICAgICAgICAgZWxzZSBpZiAobW9kZSA9PSBcImFkZFwiKVxyXG4gICAgICAgICAgICAgIGlmIGlzSW52XHJcbiAgICAgICAgICAgICAgICBpLmNvdW50ID0gcGFyc2VJbnQoaS5jb3VudCkgKyBjb3VudFxyXG4gICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGlmIGlzTmFOIHBhcnNlSW50KGkudmFsdWUpXHJcbiAgICAgICAgICAgICAgICAgIGkudmFsdWUgPSAwXHJcbiAgICAgICAgICAgICAgICBpLnZhbHVlID0gcGFyc2VJbnQoaS52YWx1ZSkgKyBjb3VudFxyXG4gICAgICAgICAgICBlbHNlIGlmIChtb2RlID09IFwicmVtb3ZlXCIpXHJcbiAgICAgICAgICAgICAgaWYgaXNJbnZcclxuICAgICAgICAgICAgICAgIGkuY291bnQgPSBwYXJzZUludChpLmNvdW50KSAtIGNvdW50XHJcbiAgICAgICAgICAgICAgICBpZiBpLmNvdW50IDwgMFxyXG4gICAgICAgICAgICAgICAgICBpLmNvdW50ID0gMFxyXG4gICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGkudmFsdWUgPSBwYXJzZUludChpLnZhbHVlKSAtIGNvdW50XHJcbiAgICAgICAgICAgICAgICBpZiBpLnZhbHVlIDwgMFxyXG4gICAgICAgICAgICAgICAgICBpLnZhbHVlID0gMFxyXG4gICAgICAgICAgaXRlbUFkZGVkID0gdHJ1ZVxyXG4gICAgICBpZiAhaXRlbUFkZGVkICYmIG1vZGUgIT0gXCJyZW1vdmVcIlxyXG4gICAgICAgIHAgPSBqWzFdLnNwbGl0KFwiLFwiKVxyXG4gICAgICAgIHByb2JhYmlsaXR5ID0gMVxyXG4gICAgICAgIGlmIHAubGVuZ3RoID4gMVxyXG4gICAgICAgICAgZGlzcGxheU5hbWUgPSBwWzFdXHJcbiAgICAgICAgICBjb3VudCA9IHBhcnNlSW50KHBbMF0pXHJcbiAgICAgICAgICBpZiAhaXNOYU4oZGlzcGxheU5hbWUpXHJcbiAgICAgICAgICAgIHByb2JhYmlsaXR5ID0gcFsxXVxyXG4gICAgICAgICAgICBkaXNwbGF5TmFtZSA9IGoubmFtZVxyXG4gICAgICAgICAgaWYgcC5sZW5ndGggPiAyXHJcbiAgICAgICAgICAgIHByb2JhYmlsaXR5ID0gcGFyc2VGbG9hdChwWzFdKVxyXG4gICAgICAgICAgICBkaXNwbGF5TmFtZSA9IHBbMl1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICBkaXNwbGF5TmFtZSA9IGpbMF1cclxuICAgICAgICAgIGNvdW50ID0gcGFyc2VJbnQoalsxXSlcclxuICAgICAgICB2YWx1ZSA9IE1hdGgucmFuZG9tKClcclxuICAgICAgICBpZiB2YWx1ZSA8IHByb2JhYmlsaXR5XHJcbiAgICAgICAgICBpbnZlbnRvcnkucHVzaCh7XCJuYW1lXCI6IGpbMF0sIFwiY291bnRcIjogY291bnQsIFwiZGlzcGxheU5hbWVcIjogZGlzcGxheU5hbWV9KVxyXG4gICAgaWYgaXNJdGVtXHJcbiAgICAgIGRhdGEuZ2FtZS5pbnZlbnRvcnkgPSBpbnZlbnRvcnlcclxuICAgIGVsc2VcclxuICAgICAgZGF0YS5nYW1lLnN0YXRzID0gaW52ZW50b3J5XHJcblxyXG59XHJcblxuZGF0YSA9IHtcclxuICBnYW1lOiBudWxsLFxyXG4gIGNob2ljZXM6IG51bGwsXHJcbiAgZGVidWdNb2RlOiBmYWxzZSxcclxuICBwcmludGVkVGV4dDogXCJcIixcclxuICBtdXNpYzogW11cclxufVxyXG5cclxuZ2FtZVBhdGggPSAnLi9nYW1lJ1xyXG5cclxuIyBHYW1lIGFyZWFcclxuZ2FtZUFyZWEgPSBuZXcgVnVlKFxyXG4gIGVsOiAnI2dhbWUtYXJlYSdcclxuICBkYXRhOiBkYXRhXHJcbiAgbWV0aG9kczpcclxuICAgIHJlcXVpcmVtZW50c0ZpbGxlZDogKGNob2ljZSkgLT5cclxuICAgICAgcmV0dXJuIFNjZW5lLnJlcXVpcmVtZW50c0ZpbGxlZChjaG9pY2UpXHJcblxyXG4gICAgIyBTZWxlY3QgYSBjaG9pY2VcclxuICAgIHNlbGVjdENob2ljZTogKGNob2ljZSkgLT5cclxuICAgICAgU2NlbmUuZXhpdFNjZW5lKEBnYW1lLmN1cnJlbnRTY2VuZSlcclxuICAgICAgU2NlbmUucmVhZEl0ZW1BbmRTdGF0c0VkaXRzKGNob2ljZSlcclxuICAgICAgU2NlbmUucmVhZFNvdW5kcyhjaG9pY2UsdHJ1ZSlcclxuICAgICAgU2NlbmUucmVhZFNhdmluZyhjaG9pY2UpXHJcbiAgICAgIGlmIGNob2ljZS5uZXh0U2NlbmUgIT0gXCJcIlxyXG4gICAgICAgIFNjZW5lLmNoYW5nZVNjZW5lKGNob2ljZS5uZXh0U2NlbmUpXHJcbiAgICAgIGVsc2VcclxuICAgICAgICBTY2VuZS51cGRhdGVTY2VuZShAZ2FtZS5jdXJyZW50U2NlbmUpXHJcbilcclxuXHJcbiMjIyBBbmQgZmluYWxseSwgc3RhcnQgdGhlIGdhbWUuLi4gIyMjXHJcbkdhbWVNYW5hZ2VyLnN0YXJ0R2FtZSgpXHJcblxuXHJcbiMjIyBQQVJTRVJTICMjI1xyXG5cclxuUGFyc2VyID0ge1xyXG5cclxuICAjIFBhcnNlIGEgc3RyaW5nIG9mIGl0ZW1zIGFuZCBvdXRwdXQgYW4gYXJyYXlcclxuICBwYXJzZUl0ZW1PclN0YXRzOiAoaXRlbXMpIC0+XHJcbiAgICBzZXBhcmF0ZSA9IGl0ZW1zLnNwbGl0KFwifFwiKVxyXG4gICAgcGFyc2VkID0gW11cclxuICAgIGZvciBpIGluIHNlcGFyYXRlXHJcbiAgICAgIGkgPSBpLnN1YnN0cmluZygwLCBpLmxlbmd0aCAtIDEpXHJcbiAgICAgIGkgPSBpLnNwbGl0KFwiW1wiKVxyXG4gICAgICBwYXJzZWQucHVzaChpKVxyXG4gICAgcmV0dXJuIHBhcnNlZFxyXG5cclxuICAjIFBhcnNlIGEgdGV4dCBmb3IgTm92ZWwuanMgdGFncywgYW5kIHJlcGxhY2UgdGhlbSB3aXRoIHRoZSBjb3JyZWN0IEhUTUwgdGFncy5cclxuICBwYXJzZVRleHQ6ICh0ZXh0KSAtPlxyXG4gICAgaWYgdGV4dCAhPSB1bmRlZmluZWRcclxuICAgICAgIyBbc10gdGFnc1xyXG4gICAgICBmb3IgaSBpbiBbMCAuLiA5OV1cclxuICAgICAgICB0ZXh0ID0gdGV4dC5zcGxpdChcIltzXCIgKyBpICsgXCJdXCIpLmpvaW4oXCI8c3BhbiBjbGFzcz1cXFwiaGlnaGxpZ2h0LVwiICsgaSArIFwiXFxcIj5cIilcclxuICAgICAgdGV4dCA9IHRleHQuc3BsaXQoXCJbL3NdXCIpLmpvaW4oXCI8L3NwYW4+XCIpXHJcbiAgICAgICMgT3RoZXIgdGFnc1xyXG4gICAgICBzcGxpdFRleHQgPSB0ZXh0LnNwbGl0KC9cXFt8XFxdLylcclxuICAgICAgc3BhbnNUb0JlQ2xvc2VkID0gMFxyXG4gICAgICBhc1RvQmVDbG9zZWQgPSAwXHJcbiAgICAgIGZvciBpbmRleCBpbiBbMCAuLiBzcGxpdFRleHQubGVuZ3RoLTFdXHJcbiAgICAgICAgcyA9IHNwbGl0VGV4dFtpbmRleF1cclxuICAgICAgICAjIFtpZl0gc3RhdGVtZW50c1xyXG4gICAgICAgIGlmIHMuc3Vic3RyaW5nKDAsMikgPT0gXCJpZlwiXHJcbiAgICAgICAgICBwYXJzZWQgPSBzLnNwbGl0KFwiaWYgXCIpXHJcbiAgICAgICAgICBpZiAhQHBhcnNlU3RhdGVtZW50KHBhcnNlZFsxXSlcclxuICAgICAgICAgICAgc3BsaXRUZXh0W2luZGV4XSA9IFwiPHNwYW4gc3R5bGU9XFxcImRpc3BsYXk6bm9uZTtcXFwiPlwiXHJcbiAgICAgICAgICAgIHNwYW5zVG9CZUNsb3NlZCsrXHJcbiAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHNwbGl0VGV4dFtpbmRleF0gPSBcIlwiXHJcbiAgICAgICAgZWxzZSBpZiBzLnN1YnN0cmluZygwLDMpID09IFwiL2lmXCJcclxuICAgICAgICAgIGlmIHNwYW5zVG9CZUNsb3NlZCA+IDBcclxuICAgICAgICAgICAgc3BsaXRUZXh0W2luZGV4XSA9IFwiPC9zcGFuPlwiXHJcbiAgICAgICAgICAgIHNwYW5zVG9CZUNsb3NlZC0tXHJcbiAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHNwbGl0VGV4dFtpbmRleF0gPSBcIlwiXHJcbiAgICAgICAgIyBQcmludGVkIHN0YXQgdmFsdWVzXHJcbiAgICAgICAgZWxzZSBpZiBzLnN1YnN0cmluZygwLDUpID09IFwic3RhdC5cIlxyXG4gICAgICAgICAgdmFsdWUgPSBzLnN1YnN0cmluZyg1LHMubGVuZ3RoKVxyXG4gICAgICAgICAgZm9yIGkgaW4gZGF0YS5nYW1lLnN0YXRzXHJcbiAgICAgICAgICAgIGlmIGkubmFtZSA9PSB2YWx1ZVxyXG4gICAgICAgICAgICAgIHNwbGl0VGV4dFtpbmRleF0gPSBpLnZhbHVlXHJcbiAgICAgICAgIyBQcmludGVkIGludmVudG9yeSBjb3VudHNcclxuICAgICAgICBlbHNlIGlmIHMuc3Vic3RyaW5nKDAsNCkgPT0gXCJpbnYuXCJcclxuICAgICAgICAgIHZhbHVlID0gcy5zdWJzdHJpbmcoNCxzLmxlbmd0aClcclxuICAgICAgICAgIGZvciBpIGluIGRhdGEuZ2FtZS5pbnZlbnRvcnlcclxuICAgICAgICAgICAgaWYgaS5uYW1lID09IHZhbHVlXHJcbiAgICAgICAgICAgICAgc3BsaXRUZXh0W2luZGV4XSA9IGkuY291bnRcclxuICAgICAgICAjIEdlbmVyaWMgcHJpbnQgY29tbWFuZFxyXG4gICAgICAgIGVsc2UgaWYgcy5zdWJzdHJpbmcoMCw1KSA9PSBcInByaW50XCJcclxuICAgICAgICAgIHBhcnNlZCA9IHMuc3BsaXQoXCJwcmludCBcIilcclxuICAgICAgICAgIHNwbGl0VGV4dFtpbmRleF0gPSBAcGFyc2VTdGF0ZW1lbnQocGFyc2VkWzFdKVxyXG4gICAgICAgICMgUGxheSBzb3VuZFxyXG4gICAgICAgIGVsc2UgaWYgcy5zdWJzdHJpbmcoMCw1KSA9PSBcInNvdW5kXCJcclxuICAgICAgICAgIHBhcnNlZCA9IHMuc3BsaXQoXCJzb3VuZCBcIilcclxuICAgICAgICAgIHNwbGl0VGV4dFtpbmRleF0gPSBcIjxzcGFuIGNsYXNzPVxcXCJwbGF5LXNvdW5kIFwiICsgcGFyc2VkWzFdICsgXCJcXFwiPjwvc3Bhbj5cIlxyXG4gICAgICAgICMgUmVzZXQgdGV4dCBzcGVlZFxyXG4gICAgICAgIGVsc2UgaWYgcy5zdWJzdHJpbmcoMCw2KSA9PSBcIi9zcGVlZFwiXHJcbiAgICAgICAgICBzcGxpdFRleHRbaW5kZXhdID0gXCI8c3BhbiBjbGFzcz1cXFwiZGVmYXVsdC1zcGVlZFxcXCI+PC9zcGFuPlwiXHJcbiAgICAgICAgIyBDaGFuZ2Ugc3BlZWRcclxuICAgICAgICBlbHNlIGlmIHMuc3Vic3RyaW5nKDAsNSkgPT0gXCJzcGVlZFwiXHJcbiAgICAgICAgICBwYXJzZWQgPSBzLnNwbGl0KFwic3BlZWQgXCIpXHJcbiAgICAgICAgICBzcGxpdFRleHRbaW5kZXhdID0gXCI8c3BhbiBjbGFzcz1cXFwic2V0LXNwZWVkIFwiICsgcGFyc2VkWzFdICsgXCJcXFwiPjwvc3Bhbj5cIlxyXG4gICAgICAgICMgSW5wdXQgZmllbGRcclxuICAgICAgICBlbHNlIGlmIHMuc3Vic3RyaW5nKDAsNSkgPT0gXCJpbnB1dFwiXHJcbiAgICAgICAgICBwYXJzZWQgPSBzLnNwbGl0KFwiaW5wdXQgXCIpXHJcbiAgICAgICAgICBuYW1lVGV4dCA9IFwiXCJcclxuICAgICAgICAgIGZvciBpIGluIGRhdGEuZ2FtZS5zdGF0c1xyXG4gICAgICAgICAgICBpZiBpLm5hbWUgPT0gcGFyc2VkWzFdXHJcbiAgICAgICAgICAgICAgbmFtZVRleHQgPSBpLnZhbHVlXHJcbiAgICAgICAgICBzcGxpdFRleHRbaW5kZXhdID0gXCI8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgdmFsdWU9XFxcIlwiICsgbmFtZVRleHQgKyBcIlxcXCIgbmFtZT1cXFwiaW5wdXRcXFwiIGNsYXNzPVxcXCJpbnB1dC1cIiArIHBhcnNlZFsxXSArICBcIlxcXCI+XCJcclxuICAgICAgICAjIEVtYmVkZGVkIGNob2ljZVxyXG4gICAgICAgIGVsc2UgaWYgcy5zdWJzdHJpbmcoMCw2KSA9PSBcImNob2ljZVwiXHJcbiAgICAgICAgICBwYXJzZWQgPSBzLnNwbGl0KFwiY2hvaWNlIFwiKVxyXG4gICAgICAgICAgc3BsaXRUZXh0W2luZGV4XSA9IFwiPGEgaHJlZj1cXFwiI1xcXCIgb25jbGljaz1cXFwiU2NlbmUuc2VsZWN0Q2hvaWNlQnlOYW1lQnlDbGlja2luZyhldmVudCwnXCIrcGFyc2VkWzFdK1wiJylcXFwiPlwiXHJcbiAgICAgICAgICBhc1RvQmVDbG9zZWQrK1xyXG4gICAgICAgIGVsc2UgaWYgcy5zdWJzdHJpbmcoMCw3KSA9PSBcIi9jaG9pY2VcIlxyXG4gICAgICAgICAgaWYgYXNUb0JlQ2xvc2VkID4gMFxyXG4gICAgICAgICAgICBzcGxpdFRleHRbaW5kZXhdID0gXCI8L2E+XCJcclxuICAgICAgICAgICAgYXNUb0JlQ2xvc2VkLS1cclxuICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgc3BsaXRUZXh0W2luZGV4XSA9IFwiXCJcclxuICAgICAgICBpbmRleCsrXHJcbiAgICAgICMgSm9pbiBhbGwgYmFjayBpbnRvIGEgc3RyaW5nXHJcbiAgICAgIHRleHQgPSBzcGxpdFRleHQuam9pbihcIlwiKVxyXG4gICAgICByZXR1cm4gdGV4dFxyXG5cclxuICAjIFBhcnNlIGEgc3RhdGVtZW50IHRoYXQgcmV0dXJucyB0cnVlIG9yIGZhbHNlIG9yIGNhbGN1bGF0ZSBhIHZhbHVlXHJcbiAgcGFyc2VTdGF0ZW1lbnQ6IChzKSAtPlxyXG4gICAgIyBDaGVjayBmb3IgdmFsaWQgcGFyZW50aGVzZXNcclxuICAgIGlmICFVdGlsLnZhbGlkYXRlUGFyZW50aGVzZXMocylcclxuICAgICAgY29uc29sZS5lcnJvciBcIkVSUk9SOiBJbnZhbGlkIHBhcmVudGhlc2VzIGluIHN0YXRlbWVudFwiXHJcbiAgICAjIENsZWFuIHNwYWNlc1xyXG4gICAgcyA9IHMucmVwbGFjZSgvXFxzKy9nLCAnJyk7XHJcbiAgICAjIFJlbW92ZSBhbGwgb3BlcmF0b3JzIGFuZCBwYXJlbnRoZXNlc1xyXG4gICAgcGFyc2VkU3RyaW5nID0gcy5zcGxpdCgvXFwofFxcKXxcXCt8XFwqfFxcLXxcXC98PD18Pj18PHw+fD09fCE9fFxcfFxcfHwmJi8pXHJcbiAgICBwYXJzZWRWYWx1ZXMgPSBbXVxyXG4gICAgIyBQYXJzZSB0aGUgc3RyaW5ncyBmb3Iga25vd24gcHJlZml4ZXMsIGFuZCBwYXJzZSB0aGUgdmFsdWVzIGJhc2VkIG9uIHRoYXQuXHJcbiAgICBmb3IgdmFsIGluIHBhcnNlZFN0cmluZ1xyXG4gICAgICB0eXBlID0gQGdldFN0YXRlbWVudFR5cGUodmFsKVxyXG4gICAgICBzd2l0Y2ggdHlwZVxyXG4gICAgICAgIHdoZW4gXCJpdGVtXCJcclxuICAgICAgICAgIGZvciBpIGluIGRhdGEuZ2FtZS5pbnZlbnRvcnlcclxuICAgICAgICAgICAgaWYgaS5uYW1lID09IHZhbC5zdWJzdHJpbmcoNCx2YWwubGVuZ3RoKVxyXG4gICAgICAgICAgICAgIHBhcnNlZFZhbHVlcy5wdXNoIGkuY291bnRcclxuICAgICAgICB3aGVuIFwic3RhdHNcIlxyXG4gICAgICAgICAgZm9yIGkgaW4gZGF0YS5nYW1lLnN0YXRzXHJcbiAgICAgICAgICAgIGlmIGkubmFtZSA9PSB2YWwuc3Vic3RyaW5nKDUsdmFsLmxlbmd0aClcclxuICAgICAgICAgICAgICBwYXJzZWRWYWx1ZXMucHVzaCBpLnZhbHVlXHJcbiAgICAgICAgd2hlbiBcInZhclwiXHJcbiAgICAgICAgICB2YWwgPSBAZmluZFZhbHVlKHZhbC5zdWJzdHJpbmcoNCx2YWwubGVuZ3RoKSx0cnVlKVxyXG4gICAgICAgICAgaWYgIWlzTmFOKHBhcnNlRmxvYXQodmFsKSlcclxuICAgICAgICAgICAgcGFyc2VkVmFsdWVzLnB1c2ggdmFsXHJcbiAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHBhcnNlZFZhbHVlcy5wdXNoIFwiJ1wiICsgdmFsICsgXCInXCJcclxuICAgICAgICB3aGVuIFwiZmxvYXRcIlxyXG4gICAgICAgICAgcGFyc2VkVmFsdWVzLnB1c2ggcGFyc2VGbG9hdCh2YWwpXHJcbiAgICAgICAgd2hlbiBcImludFwiXHJcbiAgICAgICAgICBwYXJzZWRWYWx1ZXMucHVzaCBwYXJzZUludCh2YWwpXHJcbiAgICAgICAgd2hlbiBcInN0cmluZ1wiXHJcbiAgICAgICAgICBpZiB2YWwgIT0gXCJcIlxyXG4gICAgICAgICAgICBwYXJzZWRWYWx1ZXMucHVzaCBcIidcIiArIHZhbCArIFwiJ1wiXHJcbiAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHBhcnNlZFZhbHVlcy5wdXNoIFwiXCJcclxuICAgICMgUmVwbGFjZSBhbGwgdmFyaWFibGVzIHdpdGggdGhlaXIgY29ycmVjdCB2YWx1ZXNcclxuICAgIGZvciBpIGluIFswIC4uIHBhcnNlZFN0cmluZy5sZW5ndGgtMV1cclxuICAgICAgaWYgcGFyc2VkU3RyaW5nW2ldICE9IFwiXCIgJiYgcGFyc2VkVmFsdWVzW2ldICE9IFwiXCJcclxuICAgICAgICBzID0gcy5yZXBsYWNlKG5ldyBSZWdFeHAocGFyc2VkU3RyaW5nW2ldLCdnJykscGFyc2VkVmFsdWVzW2ldKVxyXG4gICAgIyBTb2x2ZSBvciBjYWxjdWxhdGUgdGhlIHN0YXRlbWVudFxyXG4gICAgcmV0dXJuIGV2YWwocylcclxuXHJcbiAgIyBSZWFkIGEgc3RyaW5nJ3MgYmVnaW5uaW5nIHRvIGRldGVjdCBpdHMgdHlwZVxyXG4gIGdldFN0YXRlbWVudFR5cGU6ICh2YWwpIC0+XHJcbiAgICB0eXBlID0gbnVsbFxyXG4gICAgaWYgdmFsLnN1YnN0cmluZygwLDUpID09IFwic3RhdC5cIlxyXG4gICAgICB0eXBlID0gXCJzdGF0c1wiXHJcbiAgICBlbHNlIGlmIHZhbC5zdWJzdHJpbmcoMCw0KSA9PSBcImludi5cIlxyXG4gICAgICB0eXBlID0gXCJpdGVtXCJcclxuICAgIGVsc2UgaWYgdmFsLnN1YnN0cmluZygwLDQpID09IFwidmFyLlwiXHJcbiAgICAgIHR5cGUgPSBcInZhclwiXHJcbiAgICBlbHNlIGlmICFpc05hTihwYXJzZUZsb2F0KHZhbCkpICYmIHZhbC50b1N0cmluZygpLmluZGV4T2YoXCIuXCIpID09IC0xXHJcbiAgICAgIHR5cGUgPSBcImludFwiXHJcbiAgICBlbHNlIGlmICFpc05hTihwYXJzZUZsb2F0KHZhbCkpICYmIHZhbC50b1N0cmluZygpLmluZGV4T2YoXCIuXCIpICE9IC0xXHJcbiAgICAgIHR5cGUgPSBcImZsb2F0XCJcclxuICAgIGVsc2VcclxuICAgICAgdHlwZSA9IFwic3RyaW5nXCJcclxuICAgIHJldHVybiB0eXBlXHJcblxyXG4gICMgRmluZCBhIHZhbHVlIGZyb20gdGhlIGdhbWUgZGF0YSBqc29uXHJcbiAgIyB0b1ByaW50ID09IHRydWUgcmV0dXJucyB0aGUgdmFsdWUsIHRvUHJpbnQgPT0gZmFsc2UgcmV0dXJucyB0aGUgb2JqZWN0XHJcbiAgZmluZFZhbHVlOiAocGFyc2VkLCB0b1ByaW50KSAtPlxyXG4gICAgc3BsaXR0ZWQgPSBwYXJzZWQuc3BsaXQoXCIsXCIpXHJcbiAgICAjIEZpbmQgdGhlIGZpcnN0IG9iamVjdCBpbiBoaWVyYXJjaHlcclxuICAgIGlmICF0b1ByaW50XHJcbiAgICAgIGlmIHNwbGl0dGVkLmxlbmd0aCA+IDFcclxuICAgICAgICB2YXJpYWJsZSA9IEBmaW5kVmFsdWVCeU5hbWUoZGF0YS5nYW1lLHNwbGl0dGVkWzBdKVswXVxyXG4gICAgICBlbHNlXHJcbiAgICAgICAgdmFyaWFibGUgPSBAZmluZFZhbHVlQnlOYW1lKGRhdGEuZ2FtZSxzcGxpdHRlZFswXSlbMV1cclxuICAgIGVsc2VcclxuICAgICAgdmFyaWFibGUgPSBAZmluZFZhbHVlQnlOYW1lKGRhdGEuZ2FtZSxzcGxpdHRlZFswXSlbMF1cclxuICAgICMgRm9sbG93IHRoZSBwYXRoXHJcbiAgICBmb3IgaSBpbiBbMCAuLiBzcGxpdHRlZC5sZW5ndGggLSAxXVxyXG4gICAgICBpZiBVdGlsLmlzT2RkKGkpXHJcbiAgICAgICAgdmFyaWFibGUgPSB2YXJpYWJsZVtwYXJzZUludChzcGxpdHRlZFtpXSldXHJcbiAgICAgIGVsc2UgaWYgaSAhPSAwXHJcbiAgICAgICAgaWYgIXRvUHJpbnRcclxuICAgICAgICAgIHZhcmlhYmxlID0gQGZpbmRWYWx1ZUJ5TmFtZSh2YXJpYWJsZSxzcGxpdHRlZFtpXSlbMV1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICBpZiBzcGxpdHRlZFtpXSA9PSBcInBhcnNlZFRleHRcIiB8fCBzcGxpdHRlZFtpXSA9PSBcInRleHRcIlxyXG4gICAgICAgICAgICBzcGxpdHRlZFtpXSA9IFwicGFyc2VkVGV4dFwiXHJcbiAgICAgICAgICAgIHZhcmlhYmxlLnBhcnNlZFRleHQgPSBQYXJzZXIucGFyc2VUZXh0KHZhcmlhYmxlLnRleHQpXHJcbiAgICAgICAgICB2YXJpYWJsZSA9IEBmaW5kVmFsdWVCeU5hbWUodmFyaWFibGUsc3BsaXR0ZWRbaV0pWzBdXHJcbiAgICByZXR1cm4gdmFyaWFibGVcclxuXHJcbiAgIyBGaW5kIGFuIG9iamVjdCBmcm9tIHRoZSBvYmplY3QgaGllcmFyY2h5IGJ5IHN0cmluZyBuYW1lXHJcbiAgZmluZFZhbHVlQnlOYW1lOiAob2JqLCBzdHJpbmcpIC0+XHJcbiAgICBwYXJ0cyA9IHN0cmluZy5zcGxpdCgnLicpXHJcbiAgICBuZXdPYmogPSBvYmpbcGFydHNbMF1dXHJcbiAgICBpZiBwYXJ0c1sxXVxyXG4gICAgICBwYXJ0cy5zcGxpY2UgMCwgMVxyXG4gICAgICBuZXdTdHJpbmcgPSBwYXJ0cy5qb2luKCcuJylcclxuICAgICAgcmV0dXJuIEBmaW5kVmFsdWVCeU5hbWUobmV3T2JqLCBuZXdTdHJpbmcpXHJcbiAgICByID0gW11cclxuICAgIHJbMF0gPSBuZXdPYmpcclxuICAgIHJbMV0gPSBvYmpcclxuICAgIHJldHVybiByXHJcblxyXG59XHJcblxuXHJcbiMjIyBTQ0VORSBNQU5JUFVMQVRJT04gIyMjXHJcblxyXG5TY2VuZSA9IHtcclxuXHJcbiAgI1xyXG4gIHNlbGVjdENob2ljZUJ5TmFtZUJ5Q2xpY2tpbmc6IChldmVudCwgbmFtZSkgLT5cclxuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICBAc2VsZWN0Q2hvaWNlQnlOYW1lKG5hbWUpXHJcblxyXG4gICMgU2VsZWN0IGEgY2hvaWNlIGJ5IG5hbWVcclxuICBzZWxlY3RDaG9pY2VCeU5hbWU6IChuYW1lKSAtPlxyXG4gICAgZm9yIGkgaW4gZGF0YS5nYW1lLmN1cnJlbnRTY2VuZS5jaG9pY2VzXHJcbiAgICAgIGlmIGkubmFtZSA9PSBuYW1lXHJcbiAgICAgICAgZ2FtZUFyZWEuc2VsZWN0Q2hvaWNlKGkpXHJcbiAgICAgICAgYnJlYWtcclxuXHJcbiAgIyBDYWxsZWQgd2hlbiBleGl0aW5nIGEgc2NlbmVcclxuICBleGl0U2NlbmU6IChzY2VuZSkgLT5cclxuICAgIFVJLnVwZGF0ZUlucHV0cyhzY2VuZSlcclxuXHJcbiAgIyBDYWxsZWQgd2hlbiBjaGFuZ2luZyBhIHNjZW5lXHJcbiAgY2hhbmdlU2NlbmU6IChzY2VuZU5hbWVzKSAtPlxyXG4gICAgc2NlbmUgPSBAZmluZFNjZW5lQnlOYW1lKEBzZWxlY3RSYW5kb21TY2VuZSBzY2VuZU5hbWVzKVxyXG4gICAgQHNldHVwU2NlbmUoc2NlbmUpXHJcbiAgICByZXR1cm4gc2NlbmVcclxuXHJcbiAgIyBTZXR1cCBhIHNjZW5lIGNoYW5nZWQgdG9cclxuICBzZXR1cFNjZW5lOiAoc2NlbmUpIC0+XHJcbiAgICBAdXBkYXRlU2NlbmUoc2NlbmUpXHJcbiAgICBAcmVhZEl0ZW1BbmRTdGF0c0VkaXRzKGRhdGEuZ2FtZS5jdXJyZW50U2NlbmUpXHJcbiAgICBAcmVhZFNvdW5kcyhkYXRhLmdhbWUuY3VycmVudFNjZW5lLGZhbHNlKVxyXG4gICAgQHJlYWRTYXZpbmcoZGF0YS5nYW1lLmN1cnJlbnRTY2VuZSlcclxuXHJcbiAgIyBJZiBub3QgY2hhbmdpbmcgc2NlbmVzIGJ1dCB1cGRhdGUgbmVlZGVkLCB0aGlzIGlzIGNhbGxlZFxyXG4gIHVwZGF0ZVNjZW5lOiAoc2NlbmUpIC0+XHJcbiAgICBTY2VuZS5jb21iaW5lU2NlbmVUZXh0cyhzY2VuZSlcclxuICAgIHNjZW5lLnBhcnNlZFRleHQgPSBQYXJzZXIucGFyc2VUZXh0IHNjZW5lLmNvbWJpbmVkVGV4dFxyXG4gICAgZGF0YS5nYW1lLmN1cnJlbnRTY2VuZSA9IHNjZW5lXHJcbiAgICBkYXRhLmdhbWUucGFyc2VkQ2hvaWNlcyA9IG51bGxcclxuICAgIFRleHRQcmludGVyLnByaW50VGV4dChzY2VuZS5wYXJzZWRUZXh0KVxyXG5cclxuICAjIFVwZGF0ZSBjaG9pY2UgdGV4dHMgd2hlbiB0aGV5IGFyZSBjaGFuZ2VkIC0gVnVlLmpzIGRvZXNuJ3QgZGV0ZWN0IHRoZW0gd2l0aG91dCB0aGlzLlxyXG4gIHVwZGF0ZUNob2ljZXM6IC0+XHJcbiAgICBnYW1lQXJlYS4kc2V0ICdnYW1lLnBhcnNlZENob2ljZXMnLCBkYXRhLmdhbWUuY3VycmVudFNjZW5lLmNob2ljZXMubWFwKChjaG9pY2UpIC0+XHJcbiAgICAgIGNob2ljZS5wYXJzZWRUZXh0ID0gUGFyc2VyLnBhcnNlVGV4dChjaG9pY2UudGV4dClcclxuICAgICAgaWYgZ2FtZUFyZWEuZ2FtZS5zZXR0aW5ncy5hbHdheXNTaG93RGlzYWJsZWRDaG9pY2VzXHJcbiAgICAgICAgY2hvaWNlLmFsd2F5c1Nob3cgPSB0cnVlXHJcbiAgICAgIGNob2ljZVxyXG4gICAgKVxyXG5cclxuICAjIFNlbGVjdCBhIHJhbmRvbSBzY2VuZSBmcm9tIGEgbGlzdCBzZXBhcmF0ZWQgYnkgfCwgdGFrZXMgc3RyaW5nXHJcbiAgc2VsZWN0UmFuZG9tU2NlbmU6IChuYW1lKSAtPlxyXG4gICAgc2VwYXJhdGUgPSBuYW1lLnNwbGl0KFwifFwiKVxyXG4gICAgaWYgc2VwYXJhdGUubGVuZ3RoID09IDFcclxuICAgICAgcmV0dXJuIHNlcGFyYXRlWzBdXHJcbiAgICBwYXJzZWQgPSBbXVxyXG4gICAgZm9yIGkgaW4gc2VwYXJhdGVcclxuICAgICAgaSA9IGkuc3Vic3RyaW5nKDAsIGkubGVuZ3RoIC0gMSlcclxuICAgICAgaSA9IGkuc3BsaXQoXCJbXCIpXHJcbiAgICAgIHBhcnNlZC5wdXNoKGkpXHJcbiAgICBwYXJzZWQgPSBAY2hvb3NlRnJvbU11bHRpcGxlU2NlbmVzIHBhcnNlZFxyXG4gICAgcmV0dXJuIHBhcnNlZFxyXG5cclxuICAjIFNlbGVjdCBhIHNjZW5lIHJhbmRvbWx5IGZyb20gbXVsdGlwbGUgc2NlbmVzIHdpdGggZGlmZmVyZW50IHByb2JhYmlsaXRpZXMsIHRha2VzIGFycmF5XHJcbiAgY2hvb3NlRnJvbU11bHRpcGxlU2NlbmVzOiAoc2NlbmVzKSAtPlxyXG4gICAgbmFtZXMgPSBbXVxyXG4gICAgY2hhbmNlcyA9IFtdXHJcbiAgICByYXdDaGFuY2VzID0gW11cclxuICAgIHByZXZpb3VzID0gMFxyXG4gICAgZm9yIGkgaW4gc2NlbmVzXHJcbiAgICAgIG5hbWVzLnB1c2ggaVswXVxyXG4gICAgICBwcmV2aW91cyA9IHBhcnNlRmxvYXQoaVsxXSkrcHJldmlvdXNcclxuICAgICAgY2hhbmNlcy5wdXNoIHByZXZpb3VzXHJcbiAgICAgIHJhd0NoYW5jZXMucHVzaCBwYXJzZUZsb2F0KGlbMV0pXHJcbiAgICB0b3RhbENoYW5jZSA9IDBcclxuICAgIGZvciBpIGluIHJhd0NoYW5jZXNcclxuICAgICAgdG90YWxDaGFuY2UgPSB0b3RhbENoYW5jZSArIHBhcnNlRmxvYXQoaSlcclxuICAgIGlmIHRvdGFsQ2hhbmNlICE9IDFcclxuICAgICAgY29uc29sZS5lcnJvciBcIkVSUk9SOiBJbnZhbGlkIHNjZW5lIG9kZHMhXCJcclxuICAgIHZhbHVlID0gTWF0aC5yYW5kb20oKVxyXG4gICAgbmFtZUluZGV4ID0gMFxyXG4gICAgZm9yIGkgaW4gY2hhbmNlc1xyXG4gICAgICBpZiB2YWx1ZSA8IGlcclxuICAgICAgICByZXR1cm4gbmFtZXNbbmFtZUluZGV4XVxyXG4gICAgICBuYW1lSW5kZXgrK1xyXG5cclxuICAjIFJldHVybiBhIHNjZW5lIGJ5IGl0cyBuYW1lOyB0aHJvdyBhbiBlcnJvciBpZiBub3QgZm91bmQuXHJcbiAgZmluZFNjZW5lQnlOYW1lOiAobmFtZSkgLT5cclxuICAgIGZvciBpIGluIGRhdGEuZ2FtZS5zY2VuZXNcclxuICAgICAgaWYgaS5uYW1lID09IG5hbWVcclxuICAgICAgICByZXR1cm4gaVxyXG4gICAgY29uc29sZS5lcnJvciBcIkVSUk9SOiBTY2VuZSBieSBuYW1lICdcIituYW1lK1wiJyBub3QgZm91bmQhXCJcclxuXHJcbiAgIyBDb21iaW5lIHRoZSBtdWx0aXBsZSBzY2VuZSB0ZXh0IHJvd3NcclxuICBjb21iaW5lU2NlbmVUZXh0czogKHNjZW5lKSAtPlxyXG4gICAgc2NlbmUuY29tYmluZWRUZXh0ID0gc2NlbmUudGV4dFxyXG4gICAgZm9yIGtleSBvZiBzY2VuZVxyXG4gICAgICBpZiBzY2VuZS5oYXNPd25Qcm9wZXJ0eShrZXkpXHJcbiAgICAgICAgaWYga2V5LmluY2x1ZGVzKFwidGV4dC1cIilcclxuICAgICAgICAgIHNjZW5lLmNvbWJpbmVkVGV4dCA9IHNjZW5lLmNvbWJpbmVkVGV4dC5jb25jYXQoc2NlbmVba2V5XSlcclxuXHJcbiAgIyBSZWFkIGl0ZW0sIHN0YXQgYW5kIHZhbCBlZGl0IGNvbW1hbmRzIGZyb20gc2NlbmUgb3IgY2hvaWNlXHJcbiAgcmVhZEl0ZW1BbmRTdGF0c0VkaXRzOiAoc291cmNlKSAtPlxyXG4gICAgaWYgc291cmNlLnJlbW92ZUl0ZW0gIT0gdW5kZWZpbmVkXHJcbiAgICAgIEludmVudG9yeS5lZGl0SXRlbXNPclN0YXRzKFBhcnNlci5wYXJzZUl0ZW1PclN0YXRzKHNvdXJjZS5yZW1vdmVJdGVtKSxcInJlbW92ZVwiLHRydWUpXHJcbiAgICBpZiBzb3VyY2UuYWRkSXRlbSAhPSB1bmRlZmluZWRcclxuICAgICAgSW52ZW50b3J5LmVkaXRJdGVtc09yU3RhdHMoUGFyc2VyLnBhcnNlSXRlbU9yU3RhdHMoc291cmNlLmFkZEl0ZW0pLFwiYWRkXCIsdHJ1ZSlcclxuICAgIGlmIHNvdXJjZS5zZXRJdGVtICE9IHVuZGVmaW5lZFxyXG4gICAgICBJbnZlbnRvcnkuZWRpdEl0ZW1zT3JTdGF0cyhQYXJzZXIucGFyc2VJdGVtT3JTdGF0cyhzb3VyY2Uuc2V0SXRlbSksXCJzZXRcIix0cnVlKVxyXG4gICAgaWYgc291cmNlLnJlbW92ZVN0YXRzICE9IHVuZGVmaW5lZFxyXG4gICAgICBJbnZlbnRvcnkuZWRpdEl0ZW1zT3JTdGF0cyhQYXJzZXIucGFyc2VJdGVtT3JTdGF0cyhzb3VyY2UucmVtb3ZlU3RhdHMpLFwicmVtb3ZlXCIsZmFsc2UpXHJcbiAgICBpZiBzb3VyY2UuYWRkU3RhdHMgIT0gdW5kZWZpbmVkXHJcbiAgICAgIEludmVudG9yeS5lZGl0SXRlbXNPclN0YXRzKFBhcnNlci5wYXJzZUl0ZW1PclN0YXRzKHNvdXJjZS5hZGRTdGF0cyksXCJhZGRcIixmYWxzZSlcclxuICAgIGlmIHNvdXJjZS5zZXRTdGF0cyAhPSB1bmRlZmluZWRcclxuICAgICAgSW52ZW50b3J5LmVkaXRJdGVtc09yU3RhdHMoUGFyc2VyLnBhcnNlSXRlbU9yU3RhdHMoc291cmNlLnNldFN0YXRzKSxcInNldFwiLGZhbHNlKVxyXG4gICAgaWYgc291cmNlLnNldFZhbHVlICE9IHVuZGVmaW5lZFxyXG4gICAgICBmb3IgdmFsIGluIHNvdXJjZS5zZXRWYWx1ZVxyXG4gICAgICAgIEludmVudG9yeS5zZXRWYWx1ZSh2YWwucGF0aCx2YWwudmFsdWUpXHJcbiAgICBpZiBzb3VyY2UuaW5jcmVhc2VWYWx1ZSAhPSB1bmRlZmluZWRcclxuICAgICAgZm9yIHZhbCBpbiBzb3VyY2UuaW5jcmVhc2VWYWx1ZVxyXG4gICAgICAgIEludmVudG9yeS5pbmNyZWFzZVZhbHVlKHZhbC5wYXRoLHZhbC52YWx1ZSlcclxuICAgIGlmIHNvdXJjZS5kZWNyZWFzZVZhbHVlICE9IHVuZGVmaW5lZFxyXG4gICAgICBmb3IgdmFsIGluIHNvdXJjZS5kZWNyZWFzZVZhbHVlXHJcbiAgICAgICAgSW52ZW50b3J5LmRlY3JlYXNlVmFsdWUodmFsLnBhdGgsdmFsLnZhbHVlKVxyXG5cclxuICAjIFJlYWQgc291bmQgY29tbWFuZHMgZnJvbSBzY2VuZSBvciBjaG9pY2VcclxuICByZWFkU291bmRzOiAoc291cmNlLGNsaWNrZWQpIC0+XHJcbiAgICBwbGF5ZWQgPSBmYWxzZVxyXG4gICAgaWYgc291cmNlLnBsYXlTb3VuZCAhPSB1bmRlZmluZWRcclxuICAgICAgU291bmQucGxheVNvdW5kKHNvdXJjZS5wbGF5U291bmQsZmFsc2UpXHJcbiAgICAgIHBsYXllZCA9IHRydWVcclxuICAgIGlmIGNsaWNrZWQgJiYgIXBsYXllZFxyXG4gICAgICBTb3VuZC5wbGF5RGVmYXVsdENsaWNrU291bmQoKVxyXG4gICAgaWYgc291cmNlLnN0YXJ0TXVzaWMgIT0gdW5kZWZpbmVkXHJcbiAgICAgIFNvdW5kLnN0YXJ0TXVzaWMoc291cmNlLnN0YXJ0TXVzaWMpXHJcbiAgICBpZiBzb3VyY2Uuc3RvcE11c2ljICE9IHVuZGVmaW5lZFxyXG4gICAgICBTb3VuZC5zdG9wTXVzaWMoc291cmNlLnN0b3BNdXNpYylcclxuXHJcbiAgIyBSZWFkIHNhdmUgYW5kIGxvYWQgY29tbWFuZHMgZnJvbSBzY2VuZSBvciBjaG9pY2VcclxuICByZWFkU2F2aW5nOiAoc291cmNlKSAtPlxyXG4gICAgaWYgc291cmNlLnNhdmVHYW1lICE9IHVuZGVmaW5lZFxyXG4gICAgICBzYXZlR2FtZSgpXHJcbiAgICBpZiBzb3VyY2UubG9hZEdhbWUgIT0gdW5kZWZpbmVkXHJcbiAgICAgIHNob3dMb2FkTm90aWZpY2F0aW9uKClcclxuXHJcbiAgIyBDaGVjayB3aGV0aGVyIHRoZSByZXF1aXJlbWVudHMgZm9yIGEgY2hvaWNlIGhhdmUgYmVlbiBtZXRcclxuICByZXF1aXJlbWVudHNGaWxsZWQ6IChjaG9pY2UpIC0+XHJcbiAgICByZXFzID0gW11cclxuICAgIGlmIGNob2ljZS5pdGVtUmVxdWlyZW1lbnQgIT0gdW5kZWZpbmVkXHJcbiAgICAgIHJlcXVpcmVtZW50cyA9IFBhcnNlci5wYXJzZUl0ZW1PclN0YXRzIGNob2ljZS5pdGVtUmVxdWlyZW1lbnRcclxuICAgICAgcmVxcy5wdXNoIEludmVudG9yeS5jaGVja1JlcXVpcmVtZW50cyhyZXF1aXJlbWVudHMsIHRydWUpXHJcbiAgICBpZiBjaG9pY2Uuc3RhdHNSZXF1aXJlbWVudCAhPSB1bmRlZmluZWRcclxuICAgICAgcmVxdWlyZW1lbnRzID0gUGFyc2VyLnBhcnNlSXRlbU9yU3RhdHMgY2hvaWNlLnN0YXRzUmVxdWlyZW1lbnRcclxuICAgICAgcmVxcy5wdXNoIEludmVudG9yeS5jaGVja1JlcXVpcmVtZW50cyhyZXF1aXJlbWVudHMsIGZhbHNlKVxyXG4gICAgaWYgY2hvaWNlLnJlcXVpcmVtZW50ICE9IHVuZGVmaW5lZFxyXG4gICAgICByZXFzLnB1c2ggSW52ZW50b3J5LnBhcnNlSWZTdGF0ZW1lbnQgY2hvaWNlLnJlcXVpcmVtZW50XHJcbiAgICBzdWNjZXNzID0gdHJ1ZVxyXG4gICAgZm9yIHIgaW4gcmVxc1xyXG4gICAgICBpZiByID09IGZhbHNlXHJcbiAgICAgICAgc3VjY2VzcyA9IGZhbHNlXHJcbiAgICByZXR1cm4gc3VjY2Vzc1xyXG5cclxufVxyXG5cblxyXG4jIyMgU09VTkRTICMjI1xyXG5cclxuIyBBIGNsYXNzIGZvciBzb3VuZCBmdW5jdGlvbnNcclxuU291bmQgPSB7XHJcblxyXG4gICMgUGxheSB0aGUgZGVmYXVsdCBzb3VuZCBmb3IgY2xpY2tpbmcgYW4gaXRlbVxyXG4gIHBsYXlEZWZhdWx0Q2xpY2tTb3VuZDogKG5hbWUsY2xpY2tlZCkgLT5cclxuICAgIEBwbGF5U291bmQoZGF0YS5nYW1lLnNldHRpbmdzLnNvdW5kU2V0dGluZ3MuZGVmYXVsdENsaWNrU291bmQsZmFsc2UpXHJcblxyXG4gICMgUGxheSBhIHNvdW5kIGJ5IG5hbWVcclxuICBwbGF5U291bmQ6IChuYW1lLCBpc011c2ljKSAtPlxyXG4gICAgZm9yIHMgaW4gZGF0YS5nYW1lLnNvdW5kc1xyXG4gICAgICBpZiBzLm5hbWUgPT0gbmFtZVxyXG4gICAgICAgIHNvdW5kID0gbmV3IEF1ZGlvKGdhbWVQYXRoKycvc291bmRzLycrcy5maWxlKVxyXG4gICAgICAgIGlmIGlzTXVzaWNcclxuICAgICAgICAgIHNvdW5kLnZvbHVtZSA9IGRhdGEuZ2FtZS5zZXR0aW5ncy5zb3VuZFNldHRpbmdzLm11c2ljVm9sdW1lXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgc291bmQudm9sdW1lID0gZGF0YS5nYW1lLnNldHRpbmdzLnNvdW5kU2V0dGluZ3Muc291bmRWb2x1bWVcclxuICAgICAgICBzb3VuZC5wbGF5KClcclxuICAgICAgICByZXR1cm4gc291bmRcclxuXHJcbiAgIyBJcyBtdXNpYyBwbGF5aW5nP1xyXG4gIGlzUGxheWluZzogKG5hbWUpIC0+XHJcbiAgICBmb3IgaSBpbiBkYXRhLm11c2ljXHJcbiAgICAgIGlmIGkucGF1c2VkXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICAgIGVsc2VcclxuICAgICAgICByZXR1cm4gdHJ1ZVxyXG5cclxuICAjIFN0YXJ0IG11c2ljXHJcbiAgc3RhcnRNdXNpYzogKG5hbWUpIC0+XHJcbiAgICBtdXNpYyA9IEBwbGF5U291bmQobmFtZSx0cnVlKVxyXG4gICAgbXVzaWMuYWRkRXZlbnRMaXN0ZW5lciAnZW5kZWQnLCAoLT5cclxuICAgICAgQGN1cnJlbnRUaW1lID0gMFxyXG4gICAgICBAcGxheSgpXHJcbiAgICAgIHJldHVyblxyXG4gICAgKSwgZmFsc2VcclxuICAgIGRhdGEubXVzaWMucHVzaCB7XCJuYW1lXCI6bmFtZSxcIm11c2ljXCI6bXVzaWN9XHJcblxyXG4gICMgU3RvcCBhIG11c2ljIHRoYXQgd2FzIHN0YXJ0ZWQgcHJldmlvdXNseVxyXG4gIHN0b3BNdXNpYzogKG5hbWUpIC0+XHJcbiAgICBmb3IgaSBpbiBkYXRhLm11c2ljXHJcbiAgICAgIGlmIG5hbWUgPT0gaS5uYW1lXHJcbiAgICAgICAgaS5tdXNpYy5wYXVzZSgpXHJcbiAgICAgICAgaW5kZXggPSBkYXRhLm11c2ljLmluZGV4T2YoaSlcclxuICAgICAgICBkYXRhLm11c2ljLnNwbGljZShpbmRleCwxKVxyXG5cclxufVxyXG5cbmZ1bGxUZXh0ID0gXCJcIlxyXG50aW1lciA9IG51bGxcclxuY3VycmVudE9mZnNldCA9IDBcclxuY3VycmVudEludGVydmFsID0gMFxyXG5cclxuVGV4dFByaW50ZXIgPSB7XHJcblxyXG4gIHByaW50VGV4dDogKHRleHQsaW50ZXJ2YWwpIC0+XHJcbiAgICBjbGVhckludGVydmFsIHRpbWVyXHJcbiAgICBmdWxsVGV4dCA9IHRleHRcclxuICAgICNjb25zb2xlLmxvZyBmdWxsVGV4dFxyXG4gICAgY3VycmVudE9mZnNldCA9IDBcclxuICAgIGlmIGludGVydmFsID09IHVuZGVmaW5lZFxyXG4gICAgICBjdXJyZW50SW50ZXJ2YWwgPSBkYXRhLmdhbWUuc2V0dGluZ3MuZGVmYXVsdFNjcm9sbFNwZWVkXHJcbiAgICBlbHNlXHJcbiAgICAgIGN1cnJlbnRJbnRlcnZhbCA9IGludGVydmFsXHJcbiAgICB0aW1lciA9IHNldEludGVydmFsKEBvblRpY2ssIGN1cnJlbnRJbnRlcnZhbClcclxuXHJcbiAgY29tcGxldGU6IC0+XHJcbiAgICBjbGVhckludGVydmFsIHRpbWVyXHJcbiAgICB0aW1lciA9IG51bGxcclxuICAgIGRhdGEucHJpbnRlZFRleHQgPSBmdWxsVGV4dFxyXG4gICAgU2NlbmUudXBkYXRlQ2hvaWNlcygpXHJcbiAgICByZXR1cm4gZmFsc2VcclxuXHJcbiAgY2hhbmdlVGltZXI6ICh0aW1lKSAtPlxyXG4gICAgY2xlYXJJbnRlcnZhbCB0aW1lclxyXG4gICAgdGltZXIgPSBzZXRJbnRlcnZhbChAb25UaWNrLCB0aW1lKVxyXG5cclxuICByZXNldFRpbWVyOiAtPlxyXG4gICAgY2xlYXJJbnRlcnZhbCB0aW1lclxyXG4gICAgdGltZXIgPSBzZXRJbnRlcnZhbChAb25UaWNrLCBjdXJyZW50SW50ZXJ2YWwpXHJcblxyXG4gIG9uVGljazogLT5cclxuICAgIGlmIGN1cnJlbnRJbnRlcnZhbCA9PSAwXHJcbiAgICAgIFRleHRQcmludGVyLmNvbXBsZXRlKClcclxuICAgICAgcmV0dXJuXHJcbiAgICAjY29uc29sZS5sb2cgY3VycmVudE9mZnNldCArIFwiOiBcIiArIGZ1bGxUZXh0W2N1cnJlbnRPZmZzZXRdXHJcbiAgICBpZiBmdWxsVGV4dFtjdXJyZW50T2Zmc2V0XSA9PSAnPCdcclxuICAgICAgaSA9IGN1cnJlbnRPZmZzZXRcclxuICAgICAgc3RyID0gXCJcIlxyXG4gICAgICB3aGlsZSBmdWxsVGV4dFtpXSAhPSAnPidcclxuICAgICAgICBpKytcclxuICAgICAgICBzdHIgPSBzdHIgKyBmdWxsVGV4dFtpXVxyXG4gICAgICBzdHIgPSBzdHIuc3Vic3RyaW5nKDAsc3RyLmxlbmd0aC0xKVxyXG4gICAgICAjY29uc29sZS5sb2cgXCJIYWEhIFwiICsgc3RyXHJcbiAgICAgIGlmIHN0ci5pbmRleE9mKFwiZGlzcGxheTpub25lO1wiKSA+IC0xXHJcbiAgICAgICAgI2NvbnNvbGUubG9nIFwiRElTUExBWSBOT05FIEZPVU5EXCJcclxuICAgICAgICBkaXNwID0gXCJcIlxyXG4gICAgICAgIGkrK1xyXG4gICAgICAgIHdoaWxlIGRpc3AuaW5kZXhPZihcIi9zcGFuXCIpID09IC0xXHJcbiAgICAgICAgICBpKytcclxuICAgICAgICAgIGRpc3AgPSBkaXNwICsgZnVsbFRleHRbaV1cclxuICAgICAgICAjY29uc29sZS5sb2cgXCJEaXNwOiBcIiArIGRpc3BcclxuICAgICAgaWYgc3RyLmluZGV4T2YoXCJwbGF5LXNvdW5kXCIpID4gLTFcclxuICAgICAgICBzID0gc3RyLnNwbGl0KFwicGxheS1zb3VuZCBcIilcclxuICAgICAgICBzID0gc1sxXS5zcGxpdCgvXFxzfFxcXCIvKVswXVxyXG4gICAgICBpZiBzdHIuaW5kZXhPZihcInNldC1zcGVlZFwiKSA+IC0xXHJcbiAgICAgICAgcyA9IHN0ci5zcGxpdChcInNldC1zcGVlZCBcIilcclxuICAgICAgICBzID0gc1sxXS5zcGxpdCgvXFxzfFxcXCIvKVswXVxyXG4gICAgICAgIFRleHRQcmludGVyLmNoYW5nZVRpbWVyKFBhcnNlci5wYXJzZVN0YXRlbWVudChzKSlcclxuICAgICAgaWYgc3RyLmluZGV4T2YoXCJkZWZhdWx0LXNwZWVkXCIpID4gLTFcclxuICAgICAgICBUZXh0UHJpbnRlci5yZXNldFRpbWVyKClcclxuICAgICAgY3VycmVudE9mZnNldCA9IGlcclxuXHJcbiAgICBjdXJyZW50T2Zmc2V0KytcclxuICAgIGlmIGN1cnJlbnRPZmZzZXQgPT0gZnVsbFRleHQubGVuZ3RoXHJcbiAgICAgIFRleHRQcmludGVyLmNvbXBsZXRlKClcclxuICAgICAgcmV0dXJuXHJcblxyXG4gICAgaWYgZnVsbFRleHRbY3VycmVudE9mZnNldF0gPT0gJzwnXHJcbiAgICAgIGRhdGEucHJpbnRlZFRleHQgPSBmdWxsVGV4dC5zdWJzdHJpbmcoMCwgY3VycmVudE9mZnNldC0xKVxyXG4gICAgZWxzZVxyXG4gICAgICBkYXRhLnByaW50ZWRUZXh0ID0gZnVsbFRleHQuc3Vic3RyaW5nKDAsIGN1cnJlbnRPZmZzZXQpXHJcblxyXG59XHJcblxuXHJcbiMjIyBVSSBTQ1JJUFRTICMjI1xyXG5cclxuVUkgPSB7XHJcblxyXG4gICMgU2hvdyB0aGUgc2F2ZSBub3RpZmljYXRpb24gd2luZG93LCBhbmQgdXBkYXRlIGl0cyB0ZXh0XHJcbiAgc2hvd1NhdmVOb3RpZmljYXRpb246ICh0ZXh0KSAtPlxyXG4gICAgZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2F2ZS1ub3RpZmljYXRpb25cIilcclxuICAgIHRleHRBcmVhID0gZS5xdWVyeVNlbGVjdG9yQWxsKFwidGV4dGFyZWFcIilcclxuICAgIHRleHRBcmVhWzBdLnZhbHVlID0gdGV4dFxyXG4gICAgZS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcclxuXHJcbiAgIyBDbG9zZSB0aGUgc2F2ZSBub3RpZmljYXRpb24gd2luZG93XHJcbiAgY2xvc2VTYXZlTm90aWZpY2F0aW9uOiAtPlxyXG4gICAgZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2F2ZS1ub3RpZmljYXRpb25cIilcclxuICAgIGUuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuXHJcbiAgIyBTaG93IHRoZSBsb2FkIG5vdGlmaWNhdGlvbiB3aW5kb3dcclxuICBzaG93TG9hZE5vdGlmaWNhdGlvbjogLT5cclxuICAgIGlmIGdhbWVBcmVhLmdhbWUuc2V0dGluZ3Muc2F2ZU1vZGUgPT0gXCJ0ZXh0XCJcclxuICAgICAgZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibG9hZC1ub3RpZmljYXRpb25cIilcclxuICAgICAgZS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcclxuICAgIGVsc2VcclxuICAgICAgbG9hZEdhbWUoKVxyXG5cclxuICAjIENsb3NlIHRoZSBsb2FkIG5vdGlmaWNhdGlvbiAtIGlmIGxvYWQsIHRoZW4gbG9hZCBhIHNhdmUuXHJcbiAgY2xvc2VMb2FkTm90aWZpY2F0aW9uOiAobG9hZCkgLT5cclxuICAgIGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxvYWQtbm90aWZpY2F0aW9uXCIpXHJcbiAgICBpZiBsb2FkXHJcbiAgICAgIHRleHRBcmVhID0gZS5xdWVyeVNlbGVjdG9yQWxsKFwidGV4dGFyZWFcIilcclxuICAgICAgbG9hZEdhbWUodGV4dEFyZWFbMF0udmFsdWUpXHJcbiAgICAgIHRleHRBcmVhWzBdLnZhbHVlID0gXCJcIlxyXG4gICAgZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcblxyXG4gICMgVXBkYXRlIHRoZSB2YWx1ZXMgb2YgdGhlIGlucHV0IGZpZWxkc1xyXG4gIHVwZGF0ZUlucHV0czogKHNjZW5lKSAtPlxyXG4gICAgaW5wdXRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lLWFyZWFcIikucXVlcnlTZWxlY3RvckFsbChcImlucHV0XCIpXHJcbiAgICBmb3IgaSBpbiBpbnB1dHNcclxuICAgICAgZm9yIGEgaW4gZGF0YS5nYW1lLnN0YXRzXHJcbiAgICAgICAgaWYgYS5uYW1lID09IGkuY2xhc3NOYW1lLnN1YnN0cmluZyg2LGkuY2xhc3NOYW1lLmxlbmd0aClcclxuICAgICAgICAgIGEudmFsdWUgPSBVdGlsLnN0cmlwSFRNTChpLnZhbHVlKVxyXG5cclxufVxyXG5cclxuIyBUaGUgYnV0dG9uIHRoYXQgY2FuIGJlIHVzZWQgdG8gY29weSB0aGUgdGV4dCBmcm9tIHRoZSBzYXZlIHdpbmRvdy5cclxuY29weUJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjb3B5LWJ1dHRvbicpXHJcbmNvcHlCdXR0b24uYWRkRXZlbnRMaXN0ZW5lciAnY2xpY2snLCAoZXZlbnQpIC0+XHJcbiAgY29weVRleHRhcmVhID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzYXZlLW5vdGlmaWNhdGlvblwiKS5xdWVyeVNlbGVjdG9yKFwidGV4dGFyZWFcIilcclxuICBjb3B5VGV4dGFyZWEuc2VsZWN0KClcclxuICB0cnlcclxuICAgIHN1Y2Nlc3NmdWwgPSBkb2N1bWVudC5leGVjQ29tbWFuZCgnY29weScpXHJcbiAgY2F0Y2ggZXJyXHJcbiAgICBjb25zb2xlLmVycm9yIFwiQ29weWluZyB0byBjbGlwYm9hcmQgZmFpbGVkOiBcIitlcnJcclxuICByZXR1cm5cclxuXG5cclxuIyMjIFVUSUxJVFkgU0NSSVBUUyAjIyNcclxuXHJcblV0aWwgPSB7XHJcbiAgIyBDaGVjayBpZiBhIHZhbHVlIGlzIGV2ZW4gb3Igbm90XHJcbiAgaXNFdmVuOiAobikgLT5cclxuICAgIG4gJSAyID09IDBcclxuXHJcbiAgIyBDaGVjayBpZiBhIHZhbHVlIGlzIG9kZCBvciBub3RcclxuICBpc09kZDogKG4pIC0+XHJcbiAgICBNYXRoLmFicyhuICUgMikgPT0gMVxyXG5cclxuICAjIFJlbW92ZSBIVE1MIHRhZ3MgZnJvbSBhIHN0cmluZyAtIHVzZWQgdG8gY2xlYW4gaW5wdXRcclxuICBzdHJpcEhUTUw6ICh0ZXh0KSAtPlxyXG4gICAgcmVnZXggPSAvKDwoW14+XSspPikvaWdcclxuICAgIHRleHQucmVwbGFjZSByZWdleCwgJydcclxuXHJcbiAgIyBDaGVjayBpZiB0aGUgc3RyaW5nIGhhcyB2YWxpZCBwYXJlbnRoZXNlc1xyXG4gIHZhbGlkYXRlUGFyZW50aGVzZXM6IChzKSAtPlxyXG4gICAgb3BlbiA9IDBcclxuICAgIGZvciBpIGluIHNcclxuICAgICAgaWYgaSA9PSBcIihcIlxyXG4gICAgICAgIG9wZW4rK1xyXG4gICAgICBpZiBpID09IFwiKVwiXHJcbiAgICAgICAgaWYgb3BlbiA+IDBcclxuICAgICAgICAgIG9wZW4tLVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgaWYgb3BlbiA9PSAwXHJcbiAgICAgIHJldHVybiB0cnVlXHJcbiAgICBlbHNlXHJcbiAgICAgIHJldHVybiBmYWxzZVxyXG59XHJcbiJdfQ==
