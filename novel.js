
/* SAVING AND LOADING */
var GameManager, Inventory, Parser, Scene, Sound, TextPrinter, UI, Util, copyButton, currentInterval, currentOffset, data, defaultInterval, fullText, gameArea, gamePath, timer;

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
          splitText[index] = "<span class=\"play-sound " + parsed[1] + "\">";
        } else if (s.substring(0, 5) === "speed") {
          parsed = s.split("speed ");
          splitText[index] = "<span class=\"set-speed " + parsed[1] + "\">";
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
        } else if (s.substring(0, 5) === "speed") {
          parsed = s.split("speed ");
          splitText[index] = "<span class=\"speed-" + parsed[1] + "\">";
        } else if (s.substring(0, 6) === "/speed") {
          if (spansToBeClosed > 0) {
            splitText[index] = "</span>";
            spansToBeClosed--;
          } else {
            splitText[index] = "";
          }
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

defaultInterval = 50;

currentInterval = 0;

TextPrinter = {
  printText: function(text, interval) {
    if (timer !== null) {
      clearInterval(timer);
    }
    fullText = text;
    currentOffset = 0;
    if (interval === void 0) {
      currentInterval = defaultInterval;
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
  onTick: function() {
    var disp, i, str;
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

//# sourceMappingURL=data:application/json;base64,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TyxDQUFDLEtBQVIsQ0FBYywrQkFBQSxHQUFnQyxHQUE5QyxFQUhGOztBQUhtQyxDQUFyQzs7O0FBVUE7O0FBRUEsSUFBQSxHQUFPO0VBR0wsTUFBQSxFQUFRLFNBQUMsQ0FBRDtXQUNOLENBQUEsR0FBSSxDQUFKLEtBQVM7RUFESCxDQUhIO0VBT0wsS0FBQSxFQUFPLFNBQUMsQ0FBRDtXQUNMLElBQUksQ0FBQyxHQUFMLENBQVMsQ0FBQSxHQUFJLENBQWIsQ0FBQSxLQUFtQjtFQURkLENBUEY7RUFXTCxTQUFBLEVBQVcsU0FBQyxJQUFEO0FBQ1QsUUFBQTtJQUFBLEtBQUEsR0FBUTtXQUNSLElBQUksQ0FBQyxPQUFMLENBQWEsS0FBYixFQUFvQixFQUFwQjtFQUZTLENBWE47RUFnQkwsbUJBQUEsRUFBcUIsU0FBQyxDQUFEO0FBQ25CLFFBQUE7SUFBQSxJQUFBLEdBQU87QUFDUCxTQUFBLG1DQUFBOztNQUNFLElBQUcsQ0FBQSxLQUFLLEdBQVI7UUFDRSxJQUFBLEdBREY7O01BRUEsSUFBRyxDQUFBLEtBQUssR0FBUjtRQUNFLElBQUcsSUFBQSxHQUFPLENBQVY7VUFDRSxJQUFBLEdBREY7U0FBQSxNQUFBO0FBR0UsaUJBQU8sTUFIVDtTQURGOztBQUhGO0lBUUEsSUFBRyxJQUFBLEtBQVEsQ0FBWDtBQUNFLGFBQU8sS0FEVDtLQUFBLE1BQUE7QUFHRSxhQUFPLE1BSFQ7O0VBVm1CLENBaEJoQiIsImZpbGUiOiJub3ZlbC5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbIlxyXG4jIyMgU0FWSU5HIEFORCBMT0FESU5HICMjI1xyXG5cclxuR2FtZU1hbmFnZXIgPSB7XHJcblxyXG4gICMgTG9hZCBhIGJyb3dzZXIgY29va2llXHJcbiAgbG9hZENvb2tpZTogKGNuYW1lKSAtPlxyXG4gICAgbmFtZSA9IGNuYW1lICsgJz0nXHJcbiAgICBjYSA9IGRvY3VtZW50LmNvb2tpZS5zcGxpdCgnOycpXHJcbiAgICBpID0gMFxyXG4gICAgd2hpbGUgaSA8IGNhLmxlbmd0aFxyXG4gICAgICBjID0gY2FbaV1cclxuICAgICAgd2hpbGUgYy5jaGFyQXQoMCkgPT0gJyAnXHJcbiAgICAgICAgYyA9IGMuc3Vic3RyaW5nKDEpXHJcbiAgICAgIGlmIGMuaW5kZXhPZihuYW1lKSA9PSAwXHJcbiAgICAgICAgcmV0dXJuIGMuc3Vic3RyaW5nKG5hbWUubGVuZ3RoLCBjLmxlbmd0aClcclxuICAgICAgaSsrXHJcbiAgICAnJ1xyXG5cclxuICAjIFNhdmUgYSBicm93c2VyIGNvb2tpZVxyXG4gIHNhdmVDb29raWU6IChjbmFtZSwgY3ZhbHVlLCBleGRheXMpIC0+XHJcbiAgICBkID0gbmV3IERhdGVcclxuICAgIGQuc2V0VGltZSBkLmdldFRpbWUoKSArIGV4ZGF5cyAqIDI0ICogNjAgKiA2MCAqIDEwMDBcclxuICAgIGV4cGlyZXMgPSAnZXhwaXJlcz0nICsgZC50b1VUQ1N0cmluZygpXHJcbiAgICBkb2N1bWVudC5jb29raWUgPSBjbmFtZSArICc9JyArIGN2YWx1ZSArICc7ICcgKyBleHBpcmVzICsgJzsgcGF0aD0vJ1xyXG5cclxuICAjIExvYWQgdGhlIGdhbWUgZnJvbSBhIGNvb2tpZSBvciBlbnRlcmVkIGpzb25cclxuICBsb2FkR2FtZTogKGdhbWUpIC0+XHJcbiAgICBpZiBnYW1lID09IHVuZGVmaW5lZFxyXG4gICAgICBpZiBAbG9hZENvb2tpZShcImdhbWVEYXRhXCIpICE9ICcnXHJcbiAgICAgICAgY29uc29sZS5sb2cgXCJDb29raWUgZG91bmQhXCJcclxuICAgICAgICBjb29raWUgPSBAbG9hZENvb2tpZShcImdhbWVEYXRhXCIpXHJcbiAgICAgICAgY29uc29sZS5sb2cgXCJDb29raWUgbG9hZGVkXCJcclxuICAgICAgICBjb25zb2xlLmxvZyBjb29raWVcclxuICAgICAgICBkYXRhLmdhbWUgPSBKU09OLnBhcnNlKGF0b2IoQGxvYWRDb29raWUoXCJnYW1lRGF0YVwiKSkpXHJcbiAgICAgICAgY29uc29sZS5sb2cgXCJEYXRhIGxvYWRlZCFcIlxyXG4gICAgICAgIGRhdGEuZGVidWdNb2RlID0gZGF0YS5nYW1lLmRlYnVnTW9kZVxyXG4gICAgZWxzZSBpZiBnYW1lICE9IHVuZGVmaW5lZFxyXG4gICAgICBkYXRhLmdhbWUgPSBKU09OLnBhcnNlKGF0b2IoZ2FtZSkpXHJcbiAgICAgIGRhdGEuZGVidWdNb2RlID0gZGF0YS5nYW1lLmRlYnVnTW9kZVxyXG4gICAgICByZXR1cm5cclxuXHJcbiAgIyBTdGFydCB0aGUgZ2FtZSBieSBsb2FkaW5nIHRoZSBkZWZhdWx0IGdhbWUuanNvblxyXG4gIHN0YXJ0R2FtZTogLT5cclxuICAgIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3RcclxuICAgIHJlcXVlc3Qub3BlbiAnR0VUJywgZ2FtZVBhdGggKyAnL2dhbWUuanNvbicsIHRydWVcclxuICAgIHJlcXVlc3Qub25sb2FkID0gLT5cclxuICAgICAgaWYgcmVxdWVzdC5zdGF0dXMgPj0gMjAwIGFuZCByZXF1ZXN0LnN0YXR1cyA8IDQwMFxyXG4gICAgICAgIGpzb24gPSBKU09OLnBhcnNlKHJlcXVlc3QucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIGpzb24gPSBHYW1lTWFuYWdlci5wcmVwYXJlRGF0YShqc29uKVxyXG4gICAgICAgIGRhdGEuZ2FtZSA9IGpzb25cclxuICAgICAgICBkYXRhLmdhbWUuY3VycmVudFNjZW5lID0gU2NlbmUuY2hhbmdlU2NlbmUoZGF0YS5nYW1lLnNjZW5lc1swXS5uYW1lKVxyXG4gICAgICAgIGRhdGEuZGVidWdNb2RlID0gZGF0YS5nYW1lLmRlYnVnTW9kZVxyXG4gICAgcmVxdWVzdC5vbmVycm9yID0gLT5cclxuICAgICAgcmV0dXJuXHJcbiAgICByZXF1ZXN0LnNlbmQoKVxyXG5cclxuICAjIENvbnZlcnRzIHRoZSBnYW1lJ3Mgc3RhdGUgaW50byBqc29uIGFuZCBCYXNlNjQgZW5jb2RlIGl0XHJcbiAgc2F2ZUdhbWVBc0pzb246ICgpIC0+XHJcbiAgICBzYXZlID0gYnRvYShKU09OLnN0cmluZ2lmeShkYXRhLmdhbWUpKVxyXG4gICAgcmV0dXJuIHNhdmVcclxuXHJcbiAgIyBTYXZlIGdhbWUgaW4gdGhlIGRlZmluZWQgd2F5XHJcbiAgc2F2ZUdhbWU6IC0+XHJcbiAgICBzYXZlID0gQHNhdmVHYW1lQXNKc29uKClcclxuICAgIGlmIGRhdGEuZ2FtZS5zZXR0aW5ncy5zYXZlTW9kZSA9PSBcImNvb2tpZVwiXHJcbiAgICAgIEBzYXZlQ29va2llKFwiZ2FtZURhdGFcIixzYXZlLDM2NSlcclxuICAgIGVsc2UgaWYgZGF0YS5nYW1lLnNldHRpbmdzLnNhdmVNb2RlID09IFwidGV4dFwiXHJcbiAgICAgIFVJLnNob3dTYXZlTm90aWZpY2F0aW9uKHNhdmUpXHJcblxyXG4gICMgQWRkIHZhbHVlcyB0byBnYW1lLmpzb24gdGhhdCBhcmUgbm90IGRlZmluZWQgYnV0IGFyZSByZXF1aXJlZCBmb3IgVnVlLmpzIHZpZXcgdXBkYXRpbmdcclxuICBwcmVwYXJlRGF0YTogKGpzb24pIC0+XHJcbiAgICBqc29uLmN1cnJlbnRTY2VuZT1cIlwiXHJcbiAgICBqc29uLnBhcnNlZENob2ljZXM9XCJcIlxyXG4gICAgZm9yIGkgaW4ganNvbi5pbnZlbnRvcnlcclxuICAgICAgaWYgaS5kaXNwbGF5TmFtZSA9PSB1bmRlZmluZWRcclxuICAgICAgICBpLmRpc3BsYXlOYW1lID0gaS5uYW1lXHJcbiAgICBmb3IgcyBpbiBqc29uLnNjZW5lc1xyXG4gICAgICBzLmNvbWJpbmVkVGV4dCA9IFwiXCJcclxuICAgICAgcy5wYXJzZWRUZXh0ID0gXCJcIlxyXG4gICAgICBmb3IgYyBpbiBzLmNob2ljZXNcclxuICAgICAgICBjLnBhcnNlZFRleHQgPSBcIlwiXHJcbiAgICAgICAgaWYgYy5uZXh0U2NlbmUgPT0gdW5kZWZpbmVkXHJcbiAgICAgICAgICBjLm5leHRTY2VuZSA9IFwiXCJcclxuICAgICAgICBpZiBjLmFsd2F5c1Nob3cgPT0gdW5kZWZpbmVkXHJcbiAgICAgICAgICBjLmFsd2F5c1Nob3cgPSBmYWxzZVxyXG4gICAgcmV0dXJuIGpzb25cclxuXHJcbn1cclxuXG5cclxuIyMjIElOVkVOVE9SWSwgU1RBVCAmIFZBTFVFIE9QRVJBVElPTlMgIyMjXHJcblxyXG5JbnZlbnRvcnkgPSB7XHJcblxyXG4gICMgQ2hlY2sgaWYgaXRlbSBvciBzdGF0IHJlcXVpcmVtZW50cyBoYXZlIGJlZW4gZmlsbGVkXHJcbiAgY2hlY2tSZXF1aXJlbWVudHM6IChyZXF1aXJlbWVudHMsIGlzSXRlbSkgLT5cclxuICAgIHJlcXNGaWxsZWQgPSAwXHJcbiAgICBpZiBpc0l0ZW1cclxuICAgICAgZm9yIGkgaW4gZGF0YS5nYW1lLmludmVudG9yeVxyXG4gICAgICAgIGZvciBqIGluIHJlcXVpcmVtZW50c1xyXG4gICAgICAgICAgaWYgalswXSA9PSBpLm5hbWVcclxuICAgICAgICAgICAgaWYgalsxXSA8PSBpLmNvdW50XHJcbiAgICAgICAgICAgICAgcmVxc0ZpbGxlZCA9IHJlcXNGaWxsZWQgKyAxXHJcbiAgICBlbHNlXHJcbiAgICAgIGZvciBpIGluIGRhdGEuZ2FtZS5zdGF0c1xyXG4gICAgICAgIGZvciBqIGluIHJlcXVpcmVtZW50c1xyXG4gICAgICAgICAgaWYgalswXSA9PSBpLm5hbWVcclxuICAgICAgICAgICAgaWYgalsxXSA8PSBpLnZhbHVlXHJcbiAgICAgICAgICAgICAgcmVxc0ZpbGxlZCA9IHJlcXNGaWxsZWQgKyAxXHJcbiAgICBpZiByZXFzRmlsbGVkID09IHJlcXVpcmVtZW50cy5sZW5ndGhcclxuICAgICAgcmV0dXJuIHRydWVcclxuICAgIGVsc2VcclxuICAgICAgcmV0dXJuIGZhbHNlXHJcblxyXG4gICMgU2V0IGEgdmFsdWUgaW4gSlNPTlxyXG4gIHNldFZhbHVlOiAocGFyc2VkLCBuZXdWYWx1ZSkgLT5cclxuICAgIGdldFZhbHVlQXJyYXlMYXN0ID0gQGdldFZhbHVlQXJyYXlMYXN0KHBhcnNlZClcclxuICAgIHZhbHVlID0gUGFyc2VyLmZpbmRWYWx1ZShwYXJzZWQsZmFsc2UpXHJcbiAgICB2YWx1ZVtnZXRWYWx1ZUFycmF5TGFzdF0gPSBuZXdWYWx1ZVxyXG5cclxuICAjIEluY3JlYXNlIGEgdmFsdWUgaW4gSlNPTlxyXG4gIGluY3JlYXNlVmFsdWU6IChwYXJzZWQsIGNoYW5nZSkgLT5cclxuICAgIGdldFZhbHVlQXJyYXlMYXN0ID0gQGdldFZhbHVlQXJyYXlMYXN0KHBhcnNlZClcclxuICAgIHZhbHVlID0gUGFyc2VyLmZpbmRWYWx1ZShwYXJzZWQsZmFsc2UpXHJcbiAgICB2YWx1ZVtnZXRWYWx1ZUFycmF5TGFzdF0gPSB2YWx1ZVtnZXRWYWx1ZUFycmF5TGFzdF0gKyBjaGFuZ2VcclxuICAgIGlmICFpc05hTihwYXJzZUZsb2F0KHZhbHVlW2dldFZhbHVlQXJyYXlMYXN0XSkpXHJcbiAgICAgIHZhbHVlW2dldFZhbHVlQXJyYXlMYXN0XSA9IHBhcnNlRmxvYXQodmFsdWVbZ2V0VmFsdWVBcnJheUxhc3RdLnRvRml4ZWQoOCkpO1xyXG5cclxuICAjIERlY3JlYXNlIGEgdmFsdWUgaW4gSlNPTlxyXG4gIGRlY3JlYXNlVmFsdWU6IChwYXJzZWQsIGNoYW5nZSkgLT5cclxuICAgIGdldFZhbHVlQXJyYXlMYXN0ID0gQGdldFZhbHVlQXJyYXlMYXN0KHBhcnNlZClcclxuICAgIHZhbHVlID0gUGFyc2VyLmZpbmRWYWx1ZShwYXJzZWQsZmFsc2UpXHJcbiAgICB2YWx1ZVtnZXRWYWx1ZUFycmF5TGFzdF0gPSB2YWx1ZVtnZXRWYWx1ZUFycmF5TGFzdF0gLSBjaGFuZ2VcclxuICAgIGlmICFpc05hTihwYXJzZUZsb2F0KHZhbHVlW2dldFZhbHVlQXJyYXlMYXN0XSkpXHJcbiAgICAgIHZhbHVlW2dldFZhbHVlQXJyYXlMYXN0XSA9IHBhcnNlRmxvYXQodmFsdWVbZ2V0VmFsdWVBcnJheUxhc3RdLnRvRml4ZWQoOCkpO1xyXG5cclxuICAjIEdldCB0aGUgbGFzdCBpdGVtIGluIGEgdmFsdWUgYXJyYXlcclxuICBnZXRWYWx1ZUFycmF5TGFzdDogKHBhcnNlZCkgLT5cclxuICAgIGdldFZhbHVlQXJyYXlMYXN0ID0gcGFyc2VkLnNwbGl0KFwiLFwiKVxyXG4gICAgZ2V0VmFsdWVBcnJheUxhc3QgPSBnZXRWYWx1ZUFycmF5TGFzdFtnZXRWYWx1ZUFycmF5TGFzdC5sZW5ndGgtMV0uc3BsaXQoXCIuXCIpXHJcbiAgICBnZXRWYWx1ZUFycmF5TGFzdCA9IGdldFZhbHVlQXJyYXlMYXN0W2dldFZhbHVlQXJyYXlMYXN0Lmxlbmd0aC0xXVxyXG4gICAgcmV0dXJuIGdldFZhbHVlQXJyYXlMYXN0XHJcblxyXG4gICMgRWRpdCB0aGUgcGxheWVyJ3MgaXRlbXMgb3Igc3RhdHNcclxuICBlZGl0SXRlbXNPclN0YXRzOiAoaXRlbXMsIG1vZGUsIGlzSXRlbSkgLT5cclxuICAgIGlmIGlzSXRlbVxyXG4gICAgICBpbnZlbnRvcnkgPSBkYXRhLmdhbWUuaW52ZW50b3J5XHJcbiAgICAgIGlzSW52ID0gdHJ1ZVxyXG4gICAgZWxzZVxyXG4gICAgICBpbnZlbnRvcnkgPSBkYXRhLmdhbWUuc3RhdHNcclxuICAgICAgaXNJbnYgPSBmYWxzZVxyXG4gICAgZm9yIGogaW4gaXRlbXNcclxuICAgICAgaXRlbUFkZGVkID0gZmFsc2VcclxuICAgICAgZm9yIGkgaW4gaW52ZW50b3J5XHJcbiAgICAgICAgaWYgaS5uYW1lID09IGpbMF1cclxuICAgICAgICAgIHAgPSBqWzFdLnNwbGl0KFwiLFwiKVxyXG4gICAgICAgICAgcHJvYmFiaWxpdHkgPSAxXHJcbiAgICAgICAgICBpZiBwLmxlbmd0aCA+IDFcclxuICAgICAgICAgICAgZGlzcGxheU5hbWUgPSBwWzFdXHJcbiAgICAgICAgICAgIGNvdW50ID0gcGFyc2VJbnQocFswXSlcclxuICAgICAgICAgICAgaWYgIWlzTmFOKGRpc3BsYXlOYW1lKVxyXG4gICAgICAgICAgICAgIHByb2JhYmlsaXR5ID0gcFsxXVxyXG4gICAgICAgICAgICAgIGRpc3BsYXlOYW1lID0gai5uYW1lXHJcbiAgICAgICAgICAgIGlmIHAubGVuZ3RoID4gMlxyXG4gICAgICAgICAgICAgIHByb2JhYmlsaXR5ID0gcGFyc2VGbG9hdChwWzFdKVxyXG4gICAgICAgICAgICAgIGRpc3BsYXlOYW1lID0gcFsyXVxyXG4gICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBkaXNwbGF5TmFtZSA9IGpbMF1cclxuICAgICAgICAgICAgY291bnQgPSBwYXJzZUludChqWzFdKVxyXG4gICAgICAgICAgdmFsdWUgPSBNYXRoLnJhbmRvbSgpXHJcbiAgICAgICAgICBpZiB2YWx1ZSA8IHByb2JhYmlsaXR5XHJcbiAgICAgICAgICAgIGlmIChtb2RlID09IFwic2V0XCIpXHJcbiAgICAgICAgICAgICAgaWYgaXNJbnZcclxuICAgICAgICAgICAgICAgIGkuY291bnQgPSBwYXJzZUludChqWzFdKVxyXG4gICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGkudmFsdWUgPSBwYXJzZUludChqWzFdKVxyXG4gICAgICAgICAgICBlbHNlIGlmIChtb2RlID09IFwiYWRkXCIpXHJcbiAgICAgICAgICAgICAgaWYgaXNJbnZcclxuICAgICAgICAgICAgICAgIGkuY291bnQgPSBwYXJzZUludChpLmNvdW50KSArIGNvdW50XHJcbiAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgaWYgaXNOYU4gcGFyc2VJbnQoaS52YWx1ZSlcclxuICAgICAgICAgICAgICAgICAgaS52YWx1ZSA9IDBcclxuICAgICAgICAgICAgICAgIGkudmFsdWUgPSBwYXJzZUludChpLnZhbHVlKSArIGNvdW50XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKG1vZGUgPT0gXCJyZW1vdmVcIilcclxuICAgICAgICAgICAgICBpZiBpc0ludlxyXG4gICAgICAgICAgICAgICAgaS5jb3VudCA9IHBhcnNlSW50KGkuY291bnQpIC0gY291bnRcclxuICAgICAgICAgICAgICAgIGlmIGkuY291bnQgPCAwXHJcbiAgICAgICAgICAgICAgICAgIGkuY291bnQgPSAwXHJcbiAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgaS52YWx1ZSA9IHBhcnNlSW50KGkudmFsdWUpIC0gY291bnRcclxuICAgICAgICAgICAgICAgIGlmIGkudmFsdWUgPCAwXHJcbiAgICAgICAgICAgICAgICAgIGkudmFsdWUgPSAwXHJcbiAgICAgICAgICBpdGVtQWRkZWQgPSB0cnVlXHJcbiAgICAgIGlmICFpdGVtQWRkZWQgJiYgbW9kZSAhPSBcInJlbW92ZVwiXHJcbiAgICAgICAgcCA9IGpbMV0uc3BsaXQoXCIsXCIpXHJcbiAgICAgICAgcHJvYmFiaWxpdHkgPSAxXHJcbiAgICAgICAgaWYgcC5sZW5ndGggPiAxXHJcbiAgICAgICAgICBkaXNwbGF5TmFtZSA9IHBbMV1cclxuICAgICAgICAgIGNvdW50ID0gcGFyc2VJbnQocFswXSlcclxuICAgICAgICAgIGlmICFpc05hTihkaXNwbGF5TmFtZSlcclxuICAgICAgICAgICAgcHJvYmFiaWxpdHkgPSBwWzFdXHJcbiAgICAgICAgICAgIGRpc3BsYXlOYW1lID0gai5uYW1lXHJcbiAgICAgICAgICBpZiBwLmxlbmd0aCA+IDJcclxuICAgICAgICAgICAgcHJvYmFiaWxpdHkgPSBwYXJzZUZsb2F0KHBbMV0pXHJcbiAgICAgICAgICAgIGRpc3BsYXlOYW1lID0gcFsyXVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgIGRpc3BsYXlOYW1lID0galswXVxyXG4gICAgICAgICAgY291bnQgPSBwYXJzZUludChqWzFdKVxyXG4gICAgICAgIHZhbHVlID0gTWF0aC5yYW5kb20oKVxyXG4gICAgICAgIGlmIHZhbHVlIDwgcHJvYmFiaWxpdHlcclxuICAgICAgICAgIGludmVudG9yeS5wdXNoKHtcIm5hbWVcIjogalswXSwgXCJjb3VudFwiOiBjb3VudCwgXCJkaXNwbGF5TmFtZVwiOiBkaXNwbGF5TmFtZX0pXHJcbiAgICBpZiBpc0l0ZW1cclxuICAgICAgZGF0YS5nYW1lLmludmVudG9yeSA9IGludmVudG9yeVxyXG4gICAgZWxzZVxyXG4gICAgICBkYXRhLmdhbWUuc3RhdHMgPSBpbnZlbnRvcnlcclxuXHJcbn1cclxuXG5kYXRhID0ge1xyXG4gIGdhbWU6IG51bGwsXHJcbiAgY2hvaWNlczogbnVsbCxcclxuICBkZWJ1Z01vZGU6IGZhbHNlLFxyXG4gIHByaW50ZWRUZXh0OiBcIlwiLFxyXG4gIG11c2ljOiBbXVxyXG59XHJcblxyXG5nYW1lUGF0aCA9ICcuL2dhbWUnXHJcblxyXG4jIEdhbWUgYXJlYVxyXG5nYW1lQXJlYSA9IG5ldyBWdWUoXHJcbiAgZWw6ICcjZ2FtZS1hcmVhJ1xyXG4gIGRhdGE6IGRhdGFcclxuICBtZXRob2RzOlxyXG4gICAgcmVxdWlyZW1lbnRzRmlsbGVkOiAoY2hvaWNlKSAtPlxyXG4gICAgICByZXR1cm4gU2NlbmUucmVxdWlyZW1lbnRzRmlsbGVkKGNob2ljZSlcclxuXHJcbiAgICBzZWxlY3RDaG9pY2U6IChjaG9pY2UpIC0+XHJcbiAgICAgIFNjZW5lLmV4aXRTY2VuZShAZ2FtZS5jdXJyZW50U2NlbmUpXHJcbiAgICAgIFNjZW5lLnJlYWRJdGVtQW5kU3RhdHNFZGl0cyhjaG9pY2UpXHJcbiAgICAgIFNjZW5lLnJlYWRTb3VuZHMoY2hvaWNlLHRydWUpXHJcbiAgICAgIFNjZW5lLnJlYWRTYXZpbmcoY2hvaWNlKVxyXG4gICAgICBpZiBjaG9pY2UubmV4dFNjZW5lICE9IFwiXCJcclxuICAgICAgICBTY2VuZS5jaGFuZ2VTY2VuZShjaG9pY2UubmV4dFNjZW5lKVxyXG4gICAgICBlbHNlXHJcbiAgICAgICAgU2NlbmUudXBkYXRlU2NlbmUoQGdhbWUuY3VycmVudFNjZW5lKVxyXG4pXHJcblxyXG4jIyMgQW5kIGZpbmFsbHksIHN0YXJ0IHRoZSBnYW1lLi4uICMjI1xyXG5HYW1lTWFuYWdlci5zdGFydEdhbWUoKVxyXG5cblxyXG4jIyMgUEFSU0VSUyAjIyNcclxuXHJcblBhcnNlciA9IHtcclxuXHJcbiAgIyBQYXJzZSBhIHN0cmluZyBvZiBpdGVtcyBhbmQgb3V0cHV0IGFuIGFycmF5XHJcbiAgcGFyc2VJdGVtT3JTdGF0czogKGl0ZW1zKSAtPlxyXG4gICAgc2VwYXJhdGUgPSBpdGVtcy5zcGxpdChcInxcIilcclxuICAgIHBhcnNlZCA9IFtdXHJcbiAgICBmb3IgaSBpbiBzZXBhcmF0ZVxyXG4gICAgICBpID0gaS5zdWJzdHJpbmcoMCwgaS5sZW5ndGggLSAxKVxyXG4gICAgICBpID0gaS5zcGxpdChcIltcIilcclxuICAgICAgcGFyc2VkLnB1c2goaSlcclxuICAgIHJldHVybiBwYXJzZWRcclxuXHJcbiAgIyBQYXJzZSBhIHRleHQgZm9yIE5vdmVsLmpzIHRhZ3MsIGFuZCByZXBsYWNlIHRoZW0gd2l0aCB0aGUgY29ycmVjdCBIVE1MIHRhZ3MuXHJcbiAgcGFyc2VUZXh0OiAodGV4dCkgLT5cclxuICAgIGlmIHRleHQgIT0gdW5kZWZpbmVkXHJcbiAgICAgICMgW3NdIHRhZ3NcclxuICAgICAgZm9yIGkgaW4gWzAgLi4gOTldXHJcbiAgICAgICAgdGV4dCA9IHRleHQuc3BsaXQoXCJbc1wiICsgaSArIFwiXVwiKS5qb2luKFwiPHNwYW4gY2xhc3M9XFxcImhpZ2hsaWdodC1cIiArIGkgKyBcIlxcXCI+XCIpXHJcbiAgICAgIHRleHQgPSB0ZXh0LnNwbGl0KFwiWy9zXVwiKS5qb2luKFwiPC9zcGFuPlwiKVxyXG4gICAgICAjIE90aGVyIHRhZ3NcclxuICAgICAgc3BsaXRUZXh0ID0gdGV4dC5zcGxpdCgvXFxbfFxcXS8pXHJcbiAgICAgIHNwYW5zVG9CZUNsb3NlZCA9IDBcclxuICAgICAgYXNUb0JlQ2xvc2VkID0gMFxyXG4gICAgICBmb3IgaW5kZXggaW4gWzAgLi4gc3BsaXRUZXh0Lmxlbmd0aC0xXVxyXG4gICAgICAgIHMgPSBzcGxpdFRleHRbaW5kZXhdXHJcbiAgICAgICAgIyBbaWZdIHN0YXRlbWVudHNcclxuICAgICAgICBpZiBzLnN1YnN0cmluZygwLDIpID09IFwiaWZcIlxyXG4gICAgICAgICAgcGFyc2VkID0gcy5zcGxpdChcImlmIFwiKVxyXG4gICAgICAgICAgaWYgIUBwYXJzZVN0YXRlbWVudChwYXJzZWRbMV0pXHJcbiAgICAgICAgICAgIHNwbGl0VGV4dFtpbmRleF0gPSBcIjxzcGFuIHN0eWxlPVxcXCJkaXNwbGF5Om5vbmU7XFxcIj5cIlxyXG4gICAgICAgICAgICBzcGFuc1RvQmVDbG9zZWQrK1xyXG4gICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBzcGxpdFRleHRbaW5kZXhdID0gXCJcIlxyXG4gICAgICAgIGVsc2UgaWYgcy5zdWJzdHJpbmcoMCwzKSA9PSBcIi9pZlwiXHJcbiAgICAgICAgICBpZiBzcGFuc1RvQmVDbG9zZWQgPiAwXHJcbiAgICAgICAgICAgIHNwbGl0VGV4dFtpbmRleF0gPSBcIjwvc3Bhbj5cIlxyXG4gICAgICAgICAgICBzcGFuc1RvQmVDbG9zZWQtLVxyXG4gICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBzcGxpdFRleHRbaW5kZXhdID0gXCJcIlxyXG4gICAgICAgICMgUHJpbnRlZCBzdGF0IHZhbHVlc1xyXG4gICAgICAgIGVsc2UgaWYgcy5zdWJzdHJpbmcoMCw1KSA9PSBcInN0YXQuXCJcclxuICAgICAgICAgIHZhbHVlID0gcy5zdWJzdHJpbmcoNSxzLmxlbmd0aClcclxuICAgICAgICAgIGZvciBpIGluIGRhdGEuZ2FtZS5zdGF0c1xyXG4gICAgICAgICAgICBpZiBpLm5hbWUgPT0gdmFsdWVcclxuICAgICAgICAgICAgICBzcGxpdFRleHRbaW5kZXhdID0gaS52YWx1ZVxyXG4gICAgICAgICMgUHJpbnRlZCBpbnZlbnRvcnkgY291bnRzXHJcbiAgICAgICAgZWxzZSBpZiBzLnN1YnN0cmluZygwLDQpID09IFwiaW52LlwiXHJcbiAgICAgICAgICB2YWx1ZSA9IHMuc3Vic3RyaW5nKDQscy5sZW5ndGgpXHJcbiAgICAgICAgICBmb3IgaSBpbiBkYXRhLmdhbWUuaW52ZW50b3J5XHJcbiAgICAgICAgICAgIGlmIGkubmFtZSA9PSB2YWx1ZVxyXG4gICAgICAgICAgICAgIHNwbGl0VGV4dFtpbmRleF0gPSBpLmNvdW50XHJcbiAgICAgICAgIyBHZW5lcmljIHByaW50IGNvbW1hbmRcclxuICAgICAgICBlbHNlIGlmIHMuc3Vic3RyaW5nKDAsNSkgPT0gXCJwcmludFwiXHJcbiAgICAgICAgICBwYXJzZWQgPSBzLnNwbGl0KFwicHJpbnQgXCIpXHJcbiAgICAgICAgICBzcGxpdFRleHRbaW5kZXhdID0gQHBhcnNlU3RhdGVtZW50KHBhcnNlZFsxXSlcclxuICAgICAgICAjIFBsYXkgc291bmRcclxuICAgICAgICBlbHNlIGlmIHMuc3Vic3RyaW5nKDAsNSkgPT0gXCJzb3VuZFwiXHJcbiAgICAgICAgICBwYXJzZWQgPSBzLnNwbGl0KFwic291bmQgXCIpXHJcbiAgICAgICAgICBzcGxpdFRleHRbaW5kZXhdID0gXCI8c3BhbiBjbGFzcz1cXFwicGxheS1zb3VuZCBcIiArIHBhcnNlZFsxXSArIFwiXFxcIj5cIlxyXG4gICAgICAgICMgQ2hhbmdlIHNwZWVkXHJcbiAgICAgICAgZWxzZSBpZiBzLnN1YnN0cmluZygwLDUpID09IFwic3BlZWRcIlxyXG4gICAgICAgICAgcGFyc2VkID0gcy5zcGxpdChcInNwZWVkIFwiKVxyXG4gICAgICAgICAgc3BsaXRUZXh0W2luZGV4XSA9IFwiPHNwYW4gY2xhc3M9XFxcInNldC1zcGVlZCBcIiArIHBhcnNlZFsxXSArIFwiXFxcIj5cIlxyXG4gICAgICAgICMgSW5wdXQgZmllbGRcclxuICAgICAgICBlbHNlIGlmIHMuc3Vic3RyaW5nKDAsNSkgPT0gXCJpbnB1dFwiXHJcbiAgICAgICAgICBwYXJzZWQgPSBzLnNwbGl0KFwiaW5wdXQgXCIpXHJcbiAgICAgICAgICBuYW1lVGV4dCA9IFwiXCJcclxuICAgICAgICAgIGZvciBpIGluIGRhdGEuZ2FtZS5zdGF0c1xyXG4gICAgICAgICAgICBpZiBpLm5hbWUgPT0gcGFyc2VkWzFdXHJcbiAgICAgICAgICAgICAgbmFtZVRleHQgPSBpLnZhbHVlXHJcbiAgICAgICAgICBzcGxpdFRleHRbaW5kZXhdID0gXCI8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgdmFsdWU9XFxcIlwiICsgbmFtZVRleHQgKyBcIlxcXCIgbmFtZT1cXFwiaW5wdXRcXFwiIGNsYXNzPVxcXCJpbnB1dC1cIiArIHBhcnNlZFsxXSArICBcIlxcXCI+XCJcclxuICAgICAgICAjIFByaW50IHNwZWVkIGNoYW5nZXJcclxuICAgICAgICBlbHNlIGlmIHMuc3Vic3RyaW5nKDAsNSkgPT0gXCJzcGVlZFwiXHJcbiAgICAgICAgICBwYXJzZWQgPSBzLnNwbGl0KFwic3BlZWQgXCIpXHJcbiAgICAgICAgICBzcGxpdFRleHRbaW5kZXhdID0gXCI8c3BhbiBjbGFzcz1cXFwic3BlZWQtXCIgKyBwYXJzZWRbMV0gKyBcIlxcXCI+XCJcclxuICAgICAgICBlbHNlIGlmIHMuc3Vic3RyaW5nKDAsNikgPT0gXCIvc3BlZWRcIlxyXG4gICAgICAgICAgaWYgc3BhbnNUb0JlQ2xvc2VkID4gMFxyXG4gICAgICAgICAgICBzcGxpdFRleHRbaW5kZXhdID0gXCI8L3NwYW4+XCJcclxuICAgICAgICAgICAgc3BhbnNUb0JlQ2xvc2VkLS1cclxuICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgc3BsaXRUZXh0W2luZGV4XSA9IFwiXCJcclxuICAgICAgICAjIEVtYmVkZGVkIGNob2ljZVxyXG4gICAgICAgIGVsc2UgaWYgcy5zdWJzdHJpbmcoMCw2KSA9PSBcImNob2ljZVwiXHJcbiAgICAgICAgICBwYXJzZWQgPSBzLnNwbGl0KFwiY2hvaWNlIFwiKVxyXG4gICAgICAgICAgc3BsaXRUZXh0W2luZGV4XSA9IFwiPGEgaHJlZj1cXFwiI1xcXCIgb25jbGljaz1cXFwiU2NlbmUuc2VsZWN0Q2hvaWNlQnlOYW1lQnlDbGlja2luZyhldmVudCwnXCIrcGFyc2VkWzFdK1wiJylcXFwiPlwiXHJcbiAgICAgICAgICBhc1RvQmVDbG9zZWQrK1xyXG4gICAgICAgIGVsc2UgaWYgcy5zdWJzdHJpbmcoMCw3KSA9PSBcIi9jaG9pY2VcIlxyXG4gICAgICAgICAgaWYgYXNUb0JlQ2xvc2VkID4gMFxyXG4gICAgICAgICAgICBzcGxpdFRleHRbaW5kZXhdID0gXCI8L2E+XCJcclxuICAgICAgICAgICAgYXNUb0JlQ2xvc2VkLS1cclxuICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgc3BsaXRUZXh0W2luZGV4XSA9IFwiXCJcclxuICAgICAgICBpbmRleCsrXHJcbiAgICAgICMgSm9pbiBhbGwgYmFjayBpbnRvIGEgc3RyaW5nXHJcbiAgICAgIHRleHQgPSBzcGxpdFRleHQuam9pbihcIlwiKVxyXG4gICAgICByZXR1cm4gdGV4dFxyXG5cclxuICAjIFBhcnNlIGEgc3RhdGVtZW50IHRoYXQgcmV0dXJucyB0cnVlIG9yIGZhbHNlIG9yIGNhbGN1bGF0ZSBhIHZhbHVlXHJcbiAgcGFyc2VTdGF0ZW1lbnQ6IChzKSAtPlxyXG4gICAgIyBDaGVjayBmb3IgdmFsaWQgcGFyZW50aGVzZXNcclxuICAgIGlmICFVdGlsLnZhbGlkYXRlUGFyZW50aGVzZXMocylcclxuICAgICAgY29uc29sZS5lcnJvciBcIkVSUk9SOiBJbnZhbGlkIHBhcmVudGhlc2VzIGluIHN0YXRlbWVudFwiXHJcbiAgICAjIENsZWFuIHNwYWNlc1xyXG4gICAgcyA9IHMucmVwbGFjZSgvXFxzKy9nLCAnJyk7XHJcbiAgICAjIFJlbW92ZSBhbGwgb3BlcmF0b3JzIGFuZCBwYXJlbnRoZXNlc1xyXG4gICAgcGFyc2VkU3RyaW5nID0gcy5zcGxpdCgvXFwofFxcKXxcXCt8XFwqfFxcLXxcXC98PD18Pj18PHw+fD09fCE9fFxcfFxcfHwmJi8pXHJcbiAgICBwYXJzZWRWYWx1ZXMgPSBbXVxyXG4gICAgIyBQYXJzZSB0aGUgc3RyaW5ncyBmb3Iga25vd24gcHJlZml4ZXMsIGFuZCBwYXJzZSB0aGUgdmFsdWVzIGJhc2VkIG9uIHRoYXQuXHJcbiAgICBmb3IgdmFsIGluIHBhcnNlZFN0cmluZ1xyXG4gICAgICB0eXBlID0gQGdldFN0YXRlbWVudFR5cGUodmFsKVxyXG4gICAgICBzd2l0Y2ggdHlwZVxyXG4gICAgICAgIHdoZW4gXCJpdGVtXCJcclxuICAgICAgICAgIGZvciBpIGluIGRhdGEuZ2FtZS5pbnZlbnRvcnlcclxuICAgICAgICAgICAgaWYgaS5uYW1lID09IHZhbC5zdWJzdHJpbmcoNCx2YWwubGVuZ3RoKVxyXG4gICAgICAgICAgICAgIHBhcnNlZFZhbHVlcy5wdXNoIGkuY291bnRcclxuICAgICAgICB3aGVuIFwic3RhdHNcIlxyXG4gICAgICAgICAgZm9yIGkgaW4gZGF0YS5nYW1lLnN0YXRzXHJcbiAgICAgICAgICAgIGlmIGkubmFtZSA9PSB2YWwuc3Vic3RyaW5nKDUsdmFsLmxlbmd0aClcclxuICAgICAgICAgICAgICBwYXJzZWRWYWx1ZXMucHVzaCBpLnZhbHVlXHJcbiAgICAgICAgd2hlbiBcInZhclwiXHJcbiAgICAgICAgICB2YWwgPSBAZmluZFZhbHVlKHZhbC5zdWJzdHJpbmcoNCx2YWwubGVuZ3RoKSx0cnVlKVxyXG4gICAgICAgICAgaWYgIWlzTmFOKHBhcnNlRmxvYXQodmFsKSlcclxuICAgICAgICAgICAgcGFyc2VkVmFsdWVzLnB1c2ggdmFsXHJcbiAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHBhcnNlZFZhbHVlcy5wdXNoIFwiJ1wiICsgdmFsICsgXCInXCJcclxuICAgICAgICB3aGVuIFwiZmxvYXRcIlxyXG4gICAgICAgICAgcGFyc2VkVmFsdWVzLnB1c2ggcGFyc2VGbG9hdCh2YWwpXHJcbiAgICAgICAgd2hlbiBcImludFwiXHJcbiAgICAgICAgICBwYXJzZWRWYWx1ZXMucHVzaCBwYXJzZUludCh2YWwpXHJcbiAgICAgICAgd2hlbiBcInN0cmluZ1wiXHJcbiAgICAgICAgICBpZiB2YWwgIT0gXCJcIlxyXG4gICAgICAgICAgICBwYXJzZWRWYWx1ZXMucHVzaCBcIidcIiArIHZhbCArIFwiJ1wiXHJcbiAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHBhcnNlZFZhbHVlcy5wdXNoIFwiXCJcclxuICAgICMgUmVwbGFjZSBhbGwgdmFyaWFibGVzIHdpdGggdGhlaXIgY29ycmVjdCB2YWx1ZXNcclxuICAgIGZvciBpIGluIFswIC4uIHBhcnNlZFN0cmluZy5sZW5ndGgtMV1cclxuICAgICAgaWYgcGFyc2VkU3RyaW5nW2ldICE9IFwiXCIgJiYgcGFyc2VkVmFsdWVzW2ldICE9IFwiXCJcclxuICAgICAgICBzID0gcy5yZXBsYWNlKG5ldyBSZWdFeHAocGFyc2VkU3RyaW5nW2ldLCdnJykscGFyc2VkVmFsdWVzW2ldKVxyXG4gICAgIyBTb2x2ZSBvciBjYWxjdWxhdGUgdGhlIHN0YXRlbWVudFxyXG4gICAgcmV0dXJuIGV2YWwocylcclxuXHJcbiAgIyBSZWFkIGEgc3RyaW5nJ3MgYmVnaW5uaW5nIHRvIGRldGVjdCBpdHMgdHlwZVxyXG4gIGdldFN0YXRlbWVudFR5cGU6ICh2YWwpIC0+XHJcbiAgICB0eXBlID0gbnVsbFxyXG4gICAgaWYgdmFsLnN1YnN0cmluZygwLDUpID09IFwic3RhdC5cIlxyXG4gICAgICB0eXBlID0gXCJzdGF0c1wiXHJcbiAgICBlbHNlIGlmIHZhbC5zdWJzdHJpbmcoMCw0KSA9PSBcImludi5cIlxyXG4gICAgICB0eXBlID0gXCJpdGVtXCJcclxuICAgIGVsc2UgaWYgdmFsLnN1YnN0cmluZygwLDQpID09IFwidmFyLlwiXHJcbiAgICAgIHR5cGUgPSBcInZhclwiXHJcbiAgICBlbHNlIGlmICFpc05hTihwYXJzZUZsb2F0KHZhbCkpICYmIHZhbC50b1N0cmluZygpLmluZGV4T2YoXCIuXCIpID09IC0xXHJcbiAgICAgIHR5cGUgPSBcImludFwiXHJcbiAgICBlbHNlIGlmICFpc05hTihwYXJzZUZsb2F0KHZhbCkpICYmIHZhbC50b1N0cmluZygpLmluZGV4T2YoXCIuXCIpICE9IC0xXHJcbiAgICAgIHR5cGUgPSBcImZsb2F0XCJcclxuICAgIGVsc2VcclxuICAgICAgdHlwZSA9IFwic3RyaW5nXCJcclxuICAgIHJldHVybiB0eXBlXHJcblxyXG4gICMgRmluZCBhIHZhbHVlIGZyb20gdGhlIGdhbWUgZGF0YSBqc29uXHJcbiAgIyB0b1ByaW50ID09IHRydWUgcmV0dXJucyB0aGUgdmFsdWUsIHRvUHJpbnQgPT0gZmFsc2UgcmV0dXJucyB0aGUgb2JqZWN0XHJcbiAgZmluZFZhbHVlOiAocGFyc2VkLCB0b1ByaW50KSAtPlxyXG4gICAgc3BsaXR0ZWQgPSBwYXJzZWQuc3BsaXQoXCIsXCIpXHJcbiAgICAjIEZpbmQgdGhlIGZpcnN0IG9iamVjdCBpbiBoaWVyYXJjaHlcclxuICAgIGlmICF0b1ByaW50XHJcbiAgICAgIGlmIHNwbGl0dGVkLmxlbmd0aCA+IDFcclxuICAgICAgICB2YXJpYWJsZSA9IEBmaW5kVmFsdWVCeU5hbWUoZGF0YS5nYW1lLHNwbGl0dGVkWzBdKVswXVxyXG4gICAgICBlbHNlXHJcbiAgICAgICAgdmFyaWFibGUgPSBAZmluZFZhbHVlQnlOYW1lKGRhdGEuZ2FtZSxzcGxpdHRlZFswXSlbMV1cclxuICAgIGVsc2VcclxuICAgICAgdmFyaWFibGUgPSBAZmluZFZhbHVlQnlOYW1lKGRhdGEuZ2FtZSxzcGxpdHRlZFswXSlbMF1cclxuICAgICMgRm9sbG93IHRoZSBwYXRoXHJcbiAgICBmb3IgaSBpbiBbMCAuLiBzcGxpdHRlZC5sZW5ndGggLSAxXVxyXG4gICAgICBpZiBVdGlsLmlzT2RkKGkpXHJcbiAgICAgICAgdmFyaWFibGUgPSB2YXJpYWJsZVtwYXJzZUludChzcGxpdHRlZFtpXSldXHJcbiAgICAgIGVsc2UgaWYgaSAhPSAwXHJcbiAgICAgICAgaWYgIXRvUHJpbnRcclxuICAgICAgICAgIHZhcmlhYmxlID0gQGZpbmRWYWx1ZUJ5TmFtZSh2YXJpYWJsZSxzcGxpdHRlZFtpXSlbMV1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICBpZiBzcGxpdHRlZFtpXSA9PSBcInBhcnNlZFRleHRcIiB8fCBzcGxpdHRlZFtpXSA9PSBcInRleHRcIlxyXG4gICAgICAgICAgICBzcGxpdHRlZFtpXSA9IFwicGFyc2VkVGV4dFwiXHJcbiAgICAgICAgICAgIHZhcmlhYmxlLnBhcnNlZFRleHQgPSBQYXJzZXIucGFyc2VUZXh0KHZhcmlhYmxlLnRleHQpXHJcbiAgICAgICAgICB2YXJpYWJsZSA9IEBmaW5kVmFsdWVCeU5hbWUodmFyaWFibGUsc3BsaXR0ZWRbaV0pWzBdXHJcbiAgICByZXR1cm4gdmFyaWFibGVcclxuXHJcbiAgIyBGaW5kIGFuIG9iamVjdCBmcm9tIHRoZSBvYmplY3QgaGllcmFyY2h5IGJ5IHN0cmluZyBuYW1lXHJcbiAgZmluZFZhbHVlQnlOYW1lOiAob2JqLCBzdHJpbmcpIC0+XHJcbiAgICBwYXJ0cyA9IHN0cmluZy5zcGxpdCgnLicpXHJcbiAgICBuZXdPYmogPSBvYmpbcGFydHNbMF1dXHJcbiAgICBpZiBwYXJ0c1sxXVxyXG4gICAgICBwYXJ0cy5zcGxpY2UgMCwgMVxyXG4gICAgICBuZXdTdHJpbmcgPSBwYXJ0cy5qb2luKCcuJylcclxuICAgICAgcmV0dXJuIEBmaW5kVmFsdWVCeU5hbWUobmV3T2JqLCBuZXdTdHJpbmcpXHJcbiAgICByID0gW11cclxuICAgIHJbMF0gPSBuZXdPYmpcclxuICAgIHJbMV0gPSBvYmpcclxuICAgIHJldHVybiByXHJcblxyXG59XHJcblxuXHJcbiMjIyBTQ0VORSBNQU5JUFVMQVRJT04gIyMjXHJcblxyXG5TY2VuZSA9IHtcclxuXHJcbiAgI1xyXG4gIHNlbGVjdENob2ljZUJ5TmFtZUJ5Q2xpY2tpbmc6IChldmVudCwgbmFtZSkgLT5cclxuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICBAc2VsZWN0Q2hvaWNlQnlOYW1lKG5hbWUpXHJcblxyXG4gICMgU2VsZWN0IGEgY2hvaWNlIGJ5IG5hbWVcclxuICBzZWxlY3RDaG9pY2VCeU5hbWU6IChuYW1lKSAtPlxyXG4gICAgZm9yIGkgaW4gZGF0YS5nYW1lLmN1cnJlbnRTY2VuZS5jaG9pY2VzXHJcbiAgICAgIGlmIGkubmFtZSA9PSBuYW1lXHJcbiAgICAgICAgZ2FtZUFyZWEuc2VsZWN0Q2hvaWNlKGkpXHJcbiAgICAgICAgYnJlYWtcclxuXHJcbiAgIyBDYWxsZWQgd2hlbiBleGl0aW5nIGEgc2NlbmVcclxuICBleGl0U2NlbmU6IChzY2VuZSkgLT5cclxuICAgIFVJLnVwZGF0ZUlucHV0cyhzY2VuZSlcclxuXHJcbiAgIyBDYWxsZWQgd2hlbiBjaGFuZ2luZyBhIHNjZW5lXHJcbiAgY2hhbmdlU2NlbmU6IChzY2VuZU5hbWVzKSAtPlxyXG4gICAgc2NlbmUgPSBAZmluZFNjZW5lQnlOYW1lKEBzZWxlY3RSYW5kb21TY2VuZSBzY2VuZU5hbWVzKVxyXG4gICAgQHNldHVwU2NlbmUoc2NlbmUpXHJcbiAgICByZXR1cm4gc2NlbmVcclxuXHJcbiAgIyBTZXR1cCBhIHNjZW5lIGNoYW5nZWQgdG9cclxuICBzZXR1cFNjZW5lOiAoc2NlbmUpIC0+XHJcbiAgICBAdXBkYXRlU2NlbmUoc2NlbmUpXHJcbiAgICBAcmVhZEl0ZW1BbmRTdGF0c0VkaXRzKGRhdGEuZ2FtZS5jdXJyZW50U2NlbmUpXHJcbiAgICBAcmVhZFNvdW5kcyhkYXRhLmdhbWUuY3VycmVudFNjZW5lLGZhbHNlKVxyXG4gICAgQHJlYWRTYXZpbmcoZGF0YS5nYW1lLmN1cnJlbnRTY2VuZSlcclxuXHJcbiAgIyBJZiBub3QgY2hhbmdpbmcgc2NlbmVzIGJ1dCB1cGRhdGUgbmVlZGVkLCB0aGlzIGlzIGNhbGxlZFxyXG4gIHVwZGF0ZVNjZW5lOiAoc2NlbmUpIC0+XHJcbiAgICBTY2VuZS5jb21iaW5lU2NlbmVUZXh0cyhzY2VuZSlcclxuICAgIHNjZW5lLnBhcnNlZFRleHQgPSBQYXJzZXIucGFyc2VUZXh0IHNjZW5lLmNvbWJpbmVkVGV4dFxyXG4gICAgZGF0YS5nYW1lLmN1cnJlbnRTY2VuZSA9IHNjZW5lXHJcbiAgICBkYXRhLmdhbWUucGFyc2VkQ2hvaWNlcyA9IG51bGxcclxuICAgIFRleHRQcmludGVyLnByaW50VGV4dChzY2VuZS5wYXJzZWRUZXh0KVxyXG5cclxuICAjIFVwZGF0ZSBjaG9pY2UgdGV4dHMgd2hlbiB0aGV5IGFyZSBjaGFuZ2VkIC0gVnVlLmpzIGRvZXNuJ3QgZGV0ZWN0IHRoZW0gd2l0aG91dCB0aGlzLlxyXG4gIHVwZGF0ZUNob2ljZXM6IC0+XHJcbiAgICBnYW1lQXJlYS4kc2V0ICdnYW1lLnBhcnNlZENob2ljZXMnLCBkYXRhLmdhbWUuY3VycmVudFNjZW5lLmNob2ljZXMubWFwKChjaG9pY2UpIC0+XHJcbiAgICAgIGNob2ljZS5wYXJzZWRUZXh0ID0gUGFyc2VyLnBhcnNlVGV4dChjaG9pY2UudGV4dClcclxuICAgICAgaWYgZ2FtZUFyZWEuZ2FtZS5zZXR0aW5ncy5hbHdheXNTaG93RGlzYWJsZWRDaG9pY2VzXHJcbiAgICAgICAgY2hvaWNlLmFsd2F5c1Nob3cgPSB0cnVlXHJcbiAgICAgIGNob2ljZVxyXG4gICAgKVxyXG5cclxuICAjIFNlbGVjdCBhIHJhbmRvbSBzY2VuZSBmcm9tIGEgbGlzdCBzZXBhcmF0ZWQgYnkgfCwgdGFrZXMgc3RyaW5nXHJcbiAgc2VsZWN0UmFuZG9tU2NlbmU6IChuYW1lKSAtPlxyXG4gICAgc2VwYXJhdGUgPSBuYW1lLnNwbGl0KFwifFwiKVxyXG4gICAgaWYgc2VwYXJhdGUubGVuZ3RoID09IDFcclxuICAgICAgcmV0dXJuIHNlcGFyYXRlWzBdXHJcbiAgICBwYXJzZWQgPSBbXVxyXG4gICAgZm9yIGkgaW4gc2VwYXJhdGVcclxuICAgICAgaSA9IGkuc3Vic3RyaW5nKDAsIGkubGVuZ3RoIC0gMSlcclxuICAgICAgaSA9IGkuc3BsaXQoXCJbXCIpXHJcbiAgICAgIHBhcnNlZC5wdXNoKGkpXHJcbiAgICBwYXJzZWQgPSBAY2hvb3NlRnJvbU11bHRpcGxlU2NlbmVzIHBhcnNlZFxyXG4gICAgcmV0dXJuIHBhcnNlZFxyXG5cclxuICAjIFNlbGVjdCBhIHNjZW5lIHJhbmRvbWx5IGZyb20gbXVsdGlwbGUgc2NlbmVzIHdpdGggZGlmZmVyZW50IHByb2JhYmlsaXRpZXMsIHRha2VzIGFycmF5XHJcbiAgY2hvb3NlRnJvbU11bHRpcGxlU2NlbmVzOiAoc2NlbmVzKSAtPlxyXG4gICAgbmFtZXMgPSBbXVxyXG4gICAgY2hhbmNlcyA9IFtdXHJcbiAgICByYXdDaGFuY2VzID0gW11cclxuICAgIHByZXZpb3VzID0gMFxyXG4gICAgZm9yIGkgaW4gc2NlbmVzXHJcbiAgICAgIG5hbWVzLnB1c2ggaVswXVxyXG4gICAgICBwcmV2aW91cyA9IHBhcnNlRmxvYXQoaVsxXSkrcHJldmlvdXNcclxuICAgICAgY2hhbmNlcy5wdXNoIHByZXZpb3VzXHJcbiAgICAgIHJhd0NoYW5jZXMucHVzaCBwYXJzZUZsb2F0KGlbMV0pXHJcbiAgICB0b3RhbENoYW5jZSA9IDBcclxuICAgIGZvciBpIGluIHJhd0NoYW5jZXNcclxuICAgICAgdG90YWxDaGFuY2UgPSB0b3RhbENoYW5jZSArIHBhcnNlRmxvYXQoaSlcclxuICAgIGlmIHRvdGFsQ2hhbmNlICE9IDFcclxuICAgICAgY29uc29sZS5lcnJvciBcIkVSUk9SOiBJbnZhbGlkIHNjZW5lIG9kZHMhXCJcclxuICAgIHZhbHVlID0gTWF0aC5yYW5kb20oKVxyXG4gICAgbmFtZUluZGV4ID0gMFxyXG4gICAgZm9yIGkgaW4gY2hhbmNlc1xyXG4gICAgICBpZiB2YWx1ZSA8IGlcclxuICAgICAgICByZXR1cm4gbmFtZXNbbmFtZUluZGV4XVxyXG4gICAgICBuYW1lSW5kZXgrK1xyXG5cclxuICAjIFJldHVybiBhIHNjZW5lIGJ5IGl0cyBuYW1lOyB0aHJvdyBhbiBlcnJvciBpZiBub3QgZm91bmQuXHJcbiAgZmluZFNjZW5lQnlOYW1lOiAobmFtZSkgLT5cclxuICAgIGZvciBpIGluIGRhdGEuZ2FtZS5zY2VuZXNcclxuICAgICAgaWYgaS5uYW1lID09IG5hbWVcclxuICAgICAgICByZXR1cm4gaVxyXG4gICAgY29uc29sZS5lcnJvciBcIkVSUk9SOiBTY2VuZSBieSBuYW1lICdcIituYW1lK1wiJyBub3QgZm91bmQhXCJcclxuXHJcbiAgIyBDb21iaW5lIHRoZSBtdWx0aXBsZSBzY2VuZSB0ZXh0IHJvd3NcclxuICBjb21iaW5lU2NlbmVUZXh0czogKHNjZW5lKSAtPlxyXG4gICAgc2NlbmUuY29tYmluZWRUZXh0ID0gc2NlbmUudGV4dFxyXG4gICAgZm9yIGtleSBvZiBzY2VuZVxyXG4gICAgICBpZiBzY2VuZS5oYXNPd25Qcm9wZXJ0eShrZXkpXHJcbiAgICAgICAgaWYga2V5LmluY2x1ZGVzKFwidGV4dC1cIilcclxuICAgICAgICAgIHNjZW5lLmNvbWJpbmVkVGV4dCA9IHNjZW5lLmNvbWJpbmVkVGV4dC5jb25jYXQoc2NlbmVba2V5XSlcclxuXHJcbiAgIyBSZWFkIGl0ZW0sIHN0YXQgYW5kIHZhbCBlZGl0IGNvbW1hbmRzIGZyb20gc2NlbmUgb3IgY2hvaWNlXHJcbiAgcmVhZEl0ZW1BbmRTdGF0c0VkaXRzOiAoc291cmNlKSAtPlxyXG4gICAgaWYgc291cmNlLnJlbW92ZUl0ZW0gIT0gdW5kZWZpbmVkXHJcbiAgICAgIEludmVudG9yeS5lZGl0SXRlbXNPclN0YXRzKFBhcnNlci5wYXJzZUl0ZW1PclN0YXRzKHNvdXJjZS5yZW1vdmVJdGVtKSxcInJlbW92ZVwiLHRydWUpXHJcbiAgICBpZiBzb3VyY2UuYWRkSXRlbSAhPSB1bmRlZmluZWRcclxuICAgICAgSW52ZW50b3J5LmVkaXRJdGVtc09yU3RhdHMoUGFyc2VyLnBhcnNlSXRlbU9yU3RhdHMoc291cmNlLmFkZEl0ZW0pLFwiYWRkXCIsdHJ1ZSlcclxuICAgIGlmIHNvdXJjZS5zZXRJdGVtICE9IHVuZGVmaW5lZFxyXG4gICAgICBJbnZlbnRvcnkuZWRpdEl0ZW1zT3JTdGF0cyhQYXJzZXIucGFyc2VJdGVtT3JTdGF0cyhzb3VyY2Uuc2V0SXRlbSksXCJzZXRcIix0cnVlKVxyXG4gICAgaWYgc291cmNlLnJlbW92ZVN0YXRzICE9IHVuZGVmaW5lZFxyXG4gICAgICBJbnZlbnRvcnkuZWRpdEl0ZW1zT3JTdGF0cyhQYXJzZXIucGFyc2VJdGVtT3JTdGF0cyhzb3VyY2UucmVtb3ZlU3RhdHMpLFwicmVtb3ZlXCIsZmFsc2UpXHJcbiAgICBpZiBzb3VyY2UuYWRkU3RhdHMgIT0gdW5kZWZpbmVkXHJcbiAgICAgIEludmVudG9yeS5lZGl0SXRlbXNPclN0YXRzKFBhcnNlci5wYXJzZUl0ZW1PclN0YXRzKHNvdXJjZS5hZGRTdGF0cyksXCJhZGRcIixmYWxzZSlcclxuICAgIGlmIHNvdXJjZS5zZXRTdGF0cyAhPSB1bmRlZmluZWRcclxuICAgICAgSW52ZW50b3J5LmVkaXRJdGVtc09yU3RhdHMoUGFyc2VyLnBhcnNlSXRlbU9yU3RhdHMoc291cmNlLnNldFN0YXRzKSxcInNldFwiLGZhbHNlKVxyXG4gICAgaWYgc291cmNlLnNldFZhbHVlICE9IHVuZGVmaW5lZFxyXG4gICAgICBmb3IgdmFsIGluIHNvdXJjZS5zZXRWYWx1ZVxyXG4gICAgICAgIEludmVudG9yeS5zZXRWYWx1ZSh2YWwucGF0aCx2YWwudmFsdWUpXHJcbiAgICBpZiBzb3VyY2UuaW5jcmVhc2VWYWx1ZSAhPSB1bmRlZmluZWRcclxuICAgICAgZm9yIHZhbCBpbiBzb3VyY2UuaW5jcmVhc2VWYWx1ZVxyXG4gICAgICAgIEludmVudG9yeS5pbmNyZWFzZVZhbHVlKHZhbC5wYXRoLHZhbC52YWx1ZSlcclxuICAgIGlmIHNvdXJjZS5kZWNyZWFzZVZhbHVlICE9IHVuZGVmaW5lZFxyXG4gICAgICBmb3IgdmFsIGluIHNvdXJjZS5kZWNyZWFzZVZhbHVlXHJcbiAgICAgICAgSW52ZW50b3J5LmRlY3JlYXNlVmFsdWUodmFsLnBhdGgsdmFsLnZhbHVlKVxyXG5cclxuICAjIFJlYWQgc291bmQgY29tbWFuZHMgZnJvbSBzY2VuZSBvciBjaG9pY2VcclxuICByZWFkU291bmRzOiAoc291cmNlLGNsaWNrZWQpIC0+XHJcbiAgICBwbGF5ZWQgPSBmYWxzZVxyXG4gICAgaWYgc291cmNlLnBsYXlTb3VuZCAhPSB1bmRlZmluZWRcclxuICAgICAgU291bmQucGxheVNvdW5kKHNvdXJjZS5wbGF5U291bmQsZmFsc2UpXHJcbiAgICAgIHBsYXllZCA9IHRydWVcclxuICAgIGlmIGNsaWNrZWQgJiYgIXBsYXllZFxyXG4gICAgICBTb3VuZC5wbGF5RGVmYXVsdENsaWNrU291bmQoKVxyXG4gICAgaWYgc291cmNlLnN0YXJ0TXVzaWMgIT0gdW5kZWZpbmVkXHJcbiAgICAgIFNvdW5kLnN0YXJ0TXVzaWMoc291cmNlLnN0YXJ0TXVzaWMpXHJcbiAgICBpZiBzb3VyY2Uuc3RvcE11c2ljICE9IHVuZGVmaW5lZFxyXG4gICAgICBTb3VuZC5zdG9wTXVzaWMoc291cmNlLnN0b3BNdXNpYylcclxuXHJcbiAgIyBSZWFkIHNhdmUgYW5kIGxvYWQgY29tbWFuZHMgZnJvbSBzY2VuZSBvciBjaG9pY2VcclxuICByZWFkU2F2aW5nOiAoc291cmNlKSAtPlxyXG4gICAgaWYgc291cmNlLnNhdmVHYW1lICE9IHVuZGVmaW5lZFxyXG4gICAgICBzYXZlR2FtZSgpXHJcbiAgICBpZiBzb3VyY2UubG9hZEdhbWUgIT0gdW5kZWZpbmVkXHJcbiAgICAgIHNob3dMb2FkTm90aWZpY2F0aW9uKClcclxuXHJcbiAgIyBDaGVjayB3aGV0aGVyIHRoZSByZXF1aXJlbWVudHMgZm9yIGEgY2hvaWNlIGhhdmUgYmVlbiBtZXRcclxuICByZXF1aXJlbWVudHNGaWxsZWQ6IChjaG9pY2UpIC0+XHJcbiAgICByZXFzID0gW11cclxuICAgIGlmIGNob2ljZS5pdGVtUmVxdWlyZW1lbnQgIT0gdW5kZWZpbmVkXHJcbiAgICAgIHJlcXVpcmVtZW50cyA9IFBhcnNlci5wYXJzZUl0ZW1PclN0YXRzIGNob2ljZS5pdGVtUmVxdWlyZW1lbnRcclxuICAgICAgcmVxcy5wdXNoIEludmVudG9yeS5jaGVja1JlcXVpcmVtZW50cyhyZXF1aXJlbWVudHMsIHRydWUpXHJcbiAgICBpZiBjaG9pY2Uuc3RhdHNSZXF1aXJlbWVudCAhPSB1bmRlZmluZWRcclxuICAgICAgcmVxdWlyZW1lbnRzID0gUGFyc2VyLnBhcnNlSXRlbU9yU3RhdHMgY2hvaWNlLnN0YXRzUmVxdWlyZW1lbnRcclxuICAgICAgcmVxcy5wdXNoIEludmVudG9yeS5jaGVja1JlcXVpcmVtZW50cyhyZXF1aXJlbWVudHMsIGZhbHNlKVxyXG4gICAgaWYgY2hvaWNlLnJlcXVpcmVtZW50ICE9IHVuZGVmaW5lZFxyXG4gICAgICByZXFzLnB1c2ggSW52ZW50b3J5LnBhcnNlSWZTdGF0ZW1lbnQgY2hvaWNlLnJlcXVpcmVtZW50XHJcbiAgICBzdWNjZXNzID0gdHJ1ZVxyXG4gICAgZm9yIHIgaW4gcmVxc1xyXG4gICAgICBpZiByID09IGZhbHNlXHJcbiAgICAgICAgc3VjY2VzcyA9IGZhbHNlXHJcbiAgICByZXR1cm4gc3VjY2Vzc1xyXG5cclxufVxyXG5cblxyXG4jIyMgU09VTkRTICMjI1xyXG5cclxuIyBBIGNsYXNzIGZvciBzb3VuZCBmdW5jdGlvbnNcclxuU291bmQgPSB7XHJcblxyXG4gICMgUGxheSB0aGUgZGVmYXVsdCBzb3VuZCBmb3IgY2xpY2tpbmcgYW4gaXRlbVxyXG4gIHBsYXlEZWZhdWx0Q2xpY2tTb3VuZDogKG5hbWUsY2xpY2tlZCkgLT5cclxuICAgIEBwbGF5U291bmQoZGF0YS5nYW1lLnNldHRpbmdzLnNvdW5kU2V0dGluZ3MuZGVmYXVsdENsaWNrU291bmQsZmFsc2UpXHJcblxyXG4gICMgUGxheSBhIHNvdW5kIGJ5IG5hbWVcclxuICBwbGF5U291bmQ6IChuYW1lLCBpc011c2ljKSAtPlxyXG4gICAgZm9yIHMgaW4gZGF0YS5nYW1lLnNvdW5kc1xyXG4gICAgICBpZiBzLm5hbWUgPT0gbmFtZVxyXG4gICAgICAgIHNvdW5kID0gbmV3IEF1ZGlvKGdhbWVQYXRoKycvc291bmRzLycrcy5maWxlKVxyXG4gICAgICAgIGlmIGlzTXVzaWNcclxuICAgICAgICAgIHNvdW5kLnZvbHVtZSA9IGRhdGEuZ2FtZS5zZXR0aW5ncy5zb3VuZFNldHRpbmdzLm11c2ljVm9sdW1lXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgc291bmQudm9sdW1lID0gZGF0YS5nYW1lLnNldHRpbmdzLnNvdW5kU2V0dGluZ3Muc291bmRWb2x1bWVcclxuICAgICAgICBzb3VuZC5wbGF5KClcclxuICAgICAgICByZXR1cm4gc291bmRcclxuXHJcbiAgIyBJcyBtdXNpYyBwbGF5aW5nP1xyXG4gIGlzUGxheWluZzogKG5hbWUpIC0+XHJcbiAgICBmb3IgaSBpbiBkYXRhLm11c2ljXHJcbiAgICAgIGlmIGkucGF1c2VkXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICAgIGVsc2VcclxuICAgICAgICByZXR1cm4gdHJ1ZVxyXG5cclxuICAjIFN0YXJ0IG11c2ljXHJcbiAgc3RhcnRNdXNpYzogKG5hbWUpIC0+XHJcbiAgICBtdXNpYyA9IEBwbGF5U291bmQobmFtZSx0cnVlKVxyXG4gICAgbXVzaWMuYWRkRXZlbnRMaXN0ZW5lciAnZW5kZWQnLCAoLT5cclxuICAgICAgQGN1cnJlbnRUaW1lID0gMFxyXG4gICAgICBAcGxheSgpXHJcbiAgICAgIHJldHVyblxyXG4gICAgKSwgZmFsc2VcclxuICAgIGRhdGEubXVzaWMucHVzaCB7XCJuYW1lXCI6bmFtZSxcIm11c2ljXCI6bXVzaWN9XHJcblxyXG4gICMgU3RvcCBhIG11c2ljIHRoYXQgd2FzIHN0YXJ0ZWQgcHJldmlvdXNseVxyXG4gIHN0b3BNdXNpYzogKG5hbWUpIC0+XHJcbiAgICBmb3IgaSBpbiBkYXRhLm11c2ljXHJcbiAgICAgIGlmIG5hbWUgPT0gaS5uYW1lXHJcbiAgICAgICAgaS5tdXNpYy5wYXVzZSgpXHJcbiAgICAgICAgaW5kZXggPSBkYXRhLm11c2ljLmluZGV4T2YoaSlcclxuICAgICAgICBkYXRhLm11c2ljLnNwbGljZShpbmRleCwxKVxyXG5cclxufVxyXG5cbmZ1bGxUZXh0ID0gXCJcIlxyXG50aW1lciA9IG51bGxcclxuY3VycmVudE9mZnNldCA9IDBcclxuZGVmYXVsdEludGVydmFsID0gNTBcclxuY3VycmVudEludGVydmFsID0gMFxyXG5cclxuVGV4dFByaW50ZXIgPSB7XHJcblxyXG4gIHByaW50VGV4dDogKHRleHQsaW50ZXJ2YWwpIC0+XHJcbiAgICBpZiB0aW1lciAhPSBudWxsXHJcbiAgICAgIGNsZWFySW50ZXJ2YWwgdGltZXJcclxuICAgIGZ1bGxUZXh0ID0gdGV4dFxyXG4gICAgI2NvbnNvbGUubG9nIGZ1bGxUZXh0XHJcbiAgICBjdXJyZW50T2Zmc2V0ID0gMFxyXG4gICAgaWYgaW50ZXJ2YWwgPT0gdW5kZWZpbmVkXHJcbiAgICAgIGN1cnJlbnRJbnRlcnZhbCA9IGRlZmF1bHRJbnRlcnZhbFxyXG4gICAgZWxzZVxyXG4gICAgICBjdXJyZW50SW50ZXJ2YWwgPSBpbnRlcnZhbFxyXG4gICAgdGltZXIgPSBzZXRJbnRlcnZhbChAb25UaWNrLCBjdXJyZW50SW50ZXJ2YWwpXHJcblxyXG4gIGNvbXBsZXRlOiAtPlxyXG4gICAgY2xlYXJJbnRlcnZhbCB0aW1lclxyXG4gICAgdGltZXIgPSBudWxsXHJcbiAgICBkYXRhLnByaW50ZWRUZXh0ID0gZnVsbFRleHRcclxuICAgIFNjZW5lLnVwZGF0ZUNob2ljZXMoKVxyXG4gICAgcmV0dXJuIGZhbHNlXHJcblxyXG4gIG9uVGljazogLT5cclxuICAgIGlmIGN1cnJlbnRJbnRlcnZhbCA9PSAwXHJcbiAgICAgIFRleHRQcmludGVyLmNvbXBsZXRlKClcclxuICAgICAgcmV0dXJuXHJcblxyXG4gICAgI2NvbnNvbGUubG9nIGN1cnJlbnRPZmZzZXQgKyBcIjogXCIgKyBmdWxsVGV4dFtjdXJyZW50T2Zmc2V0XVxyXG4gICAgaWYgZnVsbFRleHRbY3VycmVudE9mZnNldF0gPT0gJzwnXHJcbiAgICAgIGkgPSBjdXJyZW50T2Zmc2V0XHJcbiAgICAgIHN0ciA9IFwiXCJcclxuICAgICAgd2hpbGUgZnVsbFRleHRbaV0gIT0gJz4nXHJcbiAgICAgICAgaSsrXHJcbiAgICAgICAgc3RyID0gc3RyICsgZnVsbFRleHRbaV1cclxuICAgICAgc3RyID0gc3RyLnN1YnN0cmluZygwLHN0ci5sZW5ndGgtMSlcclxuICAgICAgI2NvbnNvbGUubG9nIFwiSGFhISBcIiArIHN0clxyXG4gICAgICBpZiBzdHIuaW5kZXhPZihcImRpc3BsYXk6bm9uZTtcIikgPiAtMVxyXG4gICAgICAgICNjb25zb2xlLmxvZyBcIkRJU1BMQVkgTk9ORSBGT1VORFwiXHJcbiAgICAgICAgZGlzcCA9IFwiXCJcclxuICAgICAgICBpKytcclxuICAgICAgICB3aGlsZSBkaXNwLmluZGV4T2YoXCIvc3BhblwiKSA9PSAtMVxyXG4gICAgICAgICAgaSsrXHJcbiAgICAgICAgICBkaXNwID0gZGlzcCArIGZ1bGxUZXh0W2ldXHJcbiAgICAgICAgI2NvbnNvbGUubG9nIFwiRGlzcDogXCIgKyBkaXNwXHJcbiAgICAgIGN1cnJlbnRPZmZzZXQgPSBpXHJcblxyXG4gICAgI2NvbnNvbGUubG9nIGN1cnJlbnRPZmZzZXRcclxuXHJcbiAgICBjdXJyZW50T2Zmc2V0KytcclxuICAgIGlmIGN1cnJlbnRPZmZzZXQgPT0gZnVsbFRleHQubGVuZ3RoXHJcbiAgICAgIFRleHRQcmludGVyLmNvbXBsZXRlKClcclxuICAgICAgcmV0dXJuXHJcblxyXG4gICAgaWYgZnVsbFRleHRbY3VycmVudE9mZnNldF0gPT0gJzwnXHJcbiAgICAgIGRhdGEucHJpbnRlZFRleHQgPSBmdWxsVGV4dC5zdWJzdHJpbmcoMCwgY3VycmVudE9mZnNldC0xKVxyXG4gICAgZWxzZVxyXG4gICAgICBkYXRhLnByaW50ZWRUZXh0ID0gZnVsbFRleHQuc3Vic3RyaW5nKDAsIGN1cnJlbnRPZmZzZXQpXHJcblxyXG59XHJcblxuXHJcbiMjIyBVSSBTQ1JJUFRTICMjI1xyXG5cclxuVUkgPSB7XHJcblxyXG4gICMgU2hvdyB0aGUgc2F2ZSBub3RpZmljYXRpb24gd2luZG93LCBhbmQgdXBkYXRlIGl0cyB0ZXh0XHJcbiAgc2hvd1NhdmVOb3RpZmljYXRpb246ICh0ZXh0KSAtPlxyXG4gICAgZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2F2ZS1ub3RpZmljYXRpb25cIilcclxuICAgIHRleHRBcmVhID0gZS5xdWVyeVNlbGVjdG9yQWxsKFwidGV4dGFyZWFcIilcclxuICAgIHRleHRBcmVhWzBdLnZhbHVlID0gdGV4dFxyXG4gICAgZS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcclxuXHJcbiAgIyBDbG9zZSB0aGUgc2F2ZSBub3RpZmljYXRpb24gd2luZG93XHJcbiAgY2xvc2VTYXZlTm90aWZpY2F0aW9uOiAtPlxyXG4gICAgZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2F2ZS1ub3RpZmljYXRpb25cIilcclxuICAgIGUuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuXHJcbiAgIyBTaG93IHRoZSBsb2FkIG5vdGlmaWNhdGlvbiB3aW5kb3dcclxuICBzaG93TG9hZE5vdGlmaWNhdGlvbjogLT5cclxuICAgIGlmIGdhbWVBcmVhLmdhbWUuc2V0dGluZ3Muc2F2ZU1vZGUgPT0gXCJ0ZXh0XCJcclxuICAgICAgZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibG9hZC1ub3RpZmljYXRpb25cIilcclxuICAgICAgZS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcclxuICAgIGVsc2VcclxuICAgICAgbG9hZEdhbWUoKVxyXG5cclxuICAjIENsb3NlIHRoZSBsb2FkIG5vdGlmaWNhdGlvbiAtIGlmIGxvYWQsIHRoZW4gbG9hZCBhIHNhdmUuXHJcbiAgY2xvc2VMb2FkTm90aWZpY2F0aW9uOiAobG9hZCkgLT5cclxuICAgIGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxvYWQtbm90aWZpY2F0aW9uXCIpXHJcbiAgICBpZiBsb2FkXHJcbiAgICAgIHRleHRBcmVhID0gZS5xdWVyeVNlbGVjdG9yQWxsKFwidGV4dGFyZWFcIilcclxuICAgICAgbG9hZEdhbWUodGV4dEFyZWFbMF0udmFsdWUpXHJcbiAgICAgIHRleHRBcmVhWzBdLnZhbHVlID0gXCJcIlxyXG4gICAgZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcblxyXG4gICMgVXBkYXRlIHRoZSB2YWx1ZXMgb2YgdGhlIGlucHV0IGZpZWxkc1xyXG4gIHVwZGF0ZUlucHV0czogKHNjZW5lKSAtPlxyXG4gICAgaW5wdXRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lLWFyZWFcIikucXVlcnlTZWxlY3RvckFsbChcImlucHV0XCIpXHJcbiAgICBmb3IgaSBpbiBpbnB1dHNcclxuICAgICAgZm9yIGEgaW4gZGF0YS5nYW1lLnN0YXRzXHJcbiAgICAgICAgaWYgYS5uYW1lID09IGkuY2xhc3NOYW1lLnN1YnN0cmluZyg2LGkuY2xhc3NOYW1lLmxlbmd0aClcclxuICAgICAgICAgIGEudmFsdWUgPSBVdGlsLnN0cmlwSFRNTChpLnZhbHVlKVxyXG5cclxufVxyXG5cclxuIyBUaGUgYnV0dG9uIHRoYXQgY2FuIGJlIHVzZWQgdG8gY29weSB0aGUgdGV4dCBmcm9tIHRoZSBzYXZlIHdpbmRvdy5cclxuY29weUJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjb3B5LWJ1dHRvbicpXHJcbmNvcHlCdXR0b24uYWRkRXZlbnRMaXN0ZW5lciAnY2xpY2snLCAoZXZlbnQpIC0+XHJcbiAgY29weVRleHRhcmVhID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzYXZlLW5vdGlmaWNhdGlvblwiKS5xdWVyeVNlbGVjdG9yKFwidGV4dGFyZWFcIilcclxuICBjb3B5VGV4dGFyZWEuc2VsZWN0KClcclxuICB0cnlcclxuICAgIHN1Y2Nlc3NmdWwgPSBkb2N1bWVudC5leGVjQ29tbWFuZCgnY29weScpXHJcbiAgY2F0Y2ggZXJyXHJcbiAgICBjb25zb2xlLmVycm9yIFwiQ29weWluZyB0byBjbGlwYm9hcmQgZmFpbGVkOiBcIitlcnJcclxuICByZXR1cm5cclxuXG5cclxuIyMjIFVUSUxJVFkgU0NSSVBUUyAjIyNcclxuXHJcblV0aWwgPSB7XHJcblxyXG4gICMgQ2hlY2sgaWYgYSB2YWx1ZSBpcyBldmVuIG9yIG5vdFxyXG4gIGlzRXZlbjogKG4pIC0+XHJcbiAgICBuICUgMiA9PSAwXHJcblxyXG4gICMgQ2hlY2sgaWYgYSB2YWx1ZSBpcyBvZGQgb3Igbm90XHJcbiAgaXNPZGQ6IChuKSAtPlxyXG4gICAgTWF0aC5hYnMobiAlIDIpID09IDFcclxuXHJcbiAgIyBSZW1vdmUgSFRNTCB0YWdzIGZyb20gYSBzdHJpbmcgLSB1c2VkIHRvIGNsZWFuIGlucHV0XHJcbiAgc3RyaXBIVE1MOiAodGV4dCkgLT5cclxuICAgIHJlZ2V4ID0gLyg8KFtePl0rKT4pL2lnXHJcbiAgICB0ZXh0LnJlcGxhY2UgcmVnZXgsICcnXHJcblxyXG4gICMgQ2hlY2sgaWYgdGhlIHN0cmluZyBoYXMgdmFsaWQgcGFyZW50aGVzZXNcclxuICB2YWxpZGF0ZVBhcmVudGhlc2VzOiAocykgLT5cclxuICAgIG9wZW4gPSAwXHJcbiAgICBmb3IgaSBpbiBzXHJcbiAgICAgIGlmIGkgPT0gXCIoXCJcclxuICAgICAgICBvcGVuKytcclxuICAgICAgaWYgaSA9PSBcIilcIlxyXG4gICAgICAgIGlmIG9wZW4gPiAwXHJcbiAgICAgICAgICBvcGVuLS1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgIGlmIG9wZW4gPT0gMFxyXG4gICAgICByZXR1cm4gdHJ1ZVxyXG4gICAgZWxzZVxyXG4gICAgICByZXR1cm4gZmFsc2VcclxuXHJcbn1cclxuIl19
