
/* SAVING AND LOADING */
var GameManager, Inventory, Parser, Scene, Sound, TextPrinter, UI, Util, copyButton, currentOffset, data, defaultInterval, fullText, gameArea, gamePath, timer, timer2;

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

timer2 = null;

currentOffset = 0;

defaultInterval = 50;

TextPrinter = {
  printText: function(text) {
    fullText = text;
    currentOffset = 0;
    return timer = setInterval(this.onTick, defaultInterval);
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

//# sourceMappingURL=data:application/json;base64,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RFQ7S0FBQSxNQUFBO0FBR0UsYUFBTyxNQUhUOztFQVZtQixDQWhCaEIiLCJmaWxlIjoibm92ZWwuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyJcclxuIyMjIFNBVklORyBBTkQgTE9BRElORyAjIyNcclxuXHJcbkdhbWVNYW5hZ2VyID0ge1xyXG5cclxuICAjIExvYWQgYSBicm93c2VyIGNvb2tpZVxyXG4gIGxvYWRDb29raWU6IChjbmFtZSkgLT5cclxuICAgIG5hbWUgPSBjbmFtZSArICc9J1xyXG4gICAgY2EgPSBkb2N1bWVudC5jb29raWUuc3BsaXQoJzsnKVxyXG4gICAgaSA9IDBcclxuICAgIHdoaWxlIGkgPCBjYS5sZW5ndGhcclxuICAgICAgYyA9IGNhW2ldXHJcbiAgICAgIHdoaWxlIGMuY2hhckF0KDApID09ICcgJ1xyXG4gICAgICAgIGMgPSBjLnN1YnN0cmluZygxKVxyXG4gICAgICBpZiBjLmluZGV4T2YobmFtZSkgPT0gMFxyXG4gICAgICAgIHJldHVybiBjLnN1YnN0cmluZyhuYW1lLmxlbmd0aCwgYy5sZW5ndGgpXHJcbiAgICAgIGkrK1xyXG4gICAgJydcclxuXHJcbiAgIyBTYXZlIGEgYnJvd3NlciBjb29raWVcclxuICBzYXZlQ29va2llOiAoY25hbWUsIGN2YWx1ZSwgZXhkYXlzKSAtPlxyXG4gICAgZCA9IG5ldyBEYXRlXHJcbiAgICBkLnNldFRpbWUgZC5nZXRUaW1lKCkgKyBleGRheXMgKiAyNCAqIDYwICogNjAgKiAxMDAwXHJcbiAgICBleHBpcmVzID0gJ2V4cGlyZXM9JyArIGQudG9VVENTdHJpbmcoKVxyXG4gICAgZG9jdW1lbnQuY29va2llID0gY25hbWUgKyAnPScgKyBjdmFsdWUgKyAnOyAnICsgZXhwaXJlcyArICc7IHBhdGg9LydcclxuXHJcbiAgIyBMb2FkIHRoZSBnYW1lIGZyb20gYSBjb29raWUgb3IgZW50ZXJlZCBqc29uXHJcbiAgbG9hZEdhbWU6IChnYW1lKSAtPlxyXG4gICAgaWYgZ2FtZSA9PSB1bmRlZmluZWRcclxuICAgICAgaWYgQGxvYWRDb29raWUoXCJnYW1lRGF0YVwiKSAhPSAnJ1xyXG4gICAgICAgIGNvbnNvbGUubG9nIFwiQ29va2llIGRvdW5kIVwiXHJcbiAgICAgICAgY29va2llID0gQGxvYWRDb29raWUoXCJnYW1lRGF0YVwiKVxyXG4gICAgICAgIGNvbnNvbGUubG9nIFwiQ29va2llIGxvYWRlZFwiXHJcbiAgICAgICAgY29uc29sZS5sb2cgY29va2llXHJcbiAgICAgICAgZGF0YS5nYW1lID0gSlNPTi5wYXJzZShhdG9iKEBsb2FkQ29va2llKFwiZ2FtZURhdGFcIikpKVxyXG4gICAgICAgIGNvbnNvbGUubG9nIFwiRGF0YSBsb2FkZWQhXCJcclxuICAgICAgICBkYXRhLmRlYnVnTW9kZSA9IGRhdGEuZ2FtZS5kZWJ1Z01vZGVcclxuICAgIGVsc2UgaWYgZ2FtZSAhPSB1bmRlZmluZWRcclxuICAgICAgZGF0YS5nYW1lID0gSlNPTi5wYXJzZShhdG9iKGdhbWUpKVxyXG4gICAgICBkYXRhLmRlYnVnTW9kZSA9IGRhdGEuZ2FtZS5kZWJ1Z01vZGVcclxuICAgICAgcmV0dXJuXHJcblxyXG4gICMgU3RhcnQgdGhlIGdhbWUgYnkgbG9hZGluZyB0aGUgZGVmYXVsdCBnYW1lLmpzb25cclxuICBzdGFydEdhbWU6IC0+XHJcbiAgICByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0XHJcbiAgICByZXF1ZXN0Lm9wZW4gJ0dFVCcsIGdhbWVQYXRoICsgJy9nYW1lLmpzb24nLCB0cnVlXHJcbiAgICByZXF1ZXN0Lm9ubG9hZCA9IC0+XHJcbiAgICAgIGlmIHJlcXVlc3Quc3RhdHVzID49IDIwMCBhbmQgcmVxdWVzdC5zdGF0dXMgPCA0MDBcclxuICAgICAgICBqc29uID0gSlNPTi5wYXJzZShyZXF1ZXN0LnJlc3BvbnNlVGV4dClcclxuICAgICAgICBqc29uID0gR2FtZU1hbmFnZXIucHJlcGFyZURhdGEoanNvbilcclxuICAgICAgICBkYXRhLmdhbWUgPSBqc29uXHJcbiAgICAgICAgZGF0YS5nYW1lLmN1cnJlbnRTY2VuZSA9IFNjZW5lLmNoYW5nZVNjZW5lKGRhdGEuZ2FtZS5zY2VuZXNbMF0ubmFtZSlcclxuICAgICAgICBkYXRhLmRlYnVnTW9kZSA9IGRhdGEuZ2FtZS5kZWJ1Z01vZGVcclxuICAgIHJlcXVlc3Qub25lcnJvciA9IC0+XHJcbiAgICAgIHJldHVyblxyXG4gICAgcmVxdWVzdC5zZW5kKClcclxuXHJcbiAgIyBDb252ZXJ0cyB0aGUgZ2FtZSdzIHN0YXRlIGludG8ganNvbiBhbmQgQmFzZTY0IGVuY29kZSBpdFxyXG4gIHNhdmVHYW1lQXNKc29uOiAoKSAtPlxyXG4gICAgc2F2ZSA9IGJ0b2EoSlNPTi5zdHJpbmdpZnkoZGF0YS5nYW1lKSlcclxuICAgIHJldHVybiBzYXZlXHJcblxyXG4gICMgU2F2ZSBnYW1lIGluIHRoZSBkZWZpbmVkIHdheVxyXG4gIHNhdmVHYW1lOiAtPlxyXG4gICAgc2F2ZSA9IEBzYXZlR2FtZUFzSnNvbigpXHJcbiAgICBpZiBkYXRhLmdhbWUuc2V0dGluZ3Muc2F2ZU1vZGUgPT0gXCJjb29raWVcIlxyXG4gICAgICBAc2F2ZUNvb2tpZShcImdhbWVEYXRhXCIsc2F2ZSwzNjUpXHJcbiAgICBlbHNlIGlmIGRhdGEuZ2FtZS5zZXR0aW5ncy5zYXZlTW9kZSA9PSBcInRleHRcIlxyXG4gICAgICBVSS5zaG93U2F2ZU5vdGlmaWNhdGlvbihzYXZlKVxyXG5cclxuICAjIEFkZCB2YWx1ZXMgdG8gZ2FtZS5qc29uIHRoYXQgYXJlIG5vdCBkZWZpbmVkIGJ1dCBhcmUgcmVxdWlyZWQgZm9yIFZ1ZS5qcyB2aWV3IHVwZGF0aW5nXHJcbiAgcHJlcGFyZURhdGE6IChqc29uKSAtPlxyXG4gICAganNvbi5jdXJyZW50U2NlbmU9XCJcIlxyXG4gICAganNvbi5wYXJzZWRDaG9pY2VzPVwiXCJcclxuICAgIGZvciBpIGluIGpzb24uaW52ZW50b3J5XHJcbiAgICAgIGlmIGkuZGlzcGxheU5hbWUgPT0gdW5kZWZpbmVkXHJcbiAgICAgICAgaS5kaXNwbGF5TmFtZSA9IGkubmFtZVxyXG4gICAgZm9yIHMgaW4ganNvbi5zY2VuZXNcclxuICAgICAgcy5jb21iaW5lZFRleHQgPSBcIlwiXHJcbiAgICAgIHMucGFyc2VkVGV4dCA9IFwiXCJcclxuICAgICAgZm9yIGMgaW4gcy5jaG9pY2VzXHJcbiAgICAgICAgYy5wYXJzZWRUZXh0ID0gXCJcIlxyXG4gICAgICAgIGlmIGMubmV4dFNjZW5lID09IHVuZGVmaW5lZFxyXG4gICAgICAgICAgYy5uZXh0U2NlbmUgPSBcIlwiXHJcbiAgICAgICAgaWYgYy5hbHdheXNTaG93ID09IHVuZGVmaW5lZFxyXG4gICAgICAgICAgYy5hbHdheXNTaG93ID0gZmFsc2VcclxuICAgIHJldHVybiBqc29uXHJcblxyXG59XHJcblxuXHJcbiMjIyBJTlZFTlRPUlksIFNUQVQgJiBWQUxVRSBPUEVSQVRJT05TICMjI1xyXG5cclxuSW52ZW50b3J5ID0ge1xyXG5cclxuICAjIENoZWNrIGlmIGl0ZW0gb3Igc3RhdCByZXF1aXJlbWVudHMgaGF2ZSBiZWVuIGZpbGxlZFxyXG4gIGNoZWNrUmVxdWlyZW1lbnRzOiAocmVxdWlyZW1lbnRzLCBpc0l0ZW0pIC0+XHJcbiAgICByZXFzRmlsbGVkID0gMFxyXG4gICAgaWYgaXNJdGVtXHJcbiAgICAgIGZvciBpIGluIGRhdGEuZ2FtZS5pbnZlbnRvcnlcclxuICAgICAgICBmb3IgaiBpbiByZXF1aXJlbWVudHNcclxuICAgICAgICAgIGlmIGpbMF0gPT0gaS5uYW1lXHJcbiAgICAgICAgICAgIGlmIGpbMV0gPD0gaS5jb3VudFxyXG4gICAgICAgICAgICAgIHJlcXNGaWxsZWQgPSByZXFzRmlsbGVkICsgMVxyXG4gICAgZWxzZVxyXG4gICAgICBmb3IgaSBpbiBkYXRhLmdhbWUuc3RhdHNcclxuICAgICAgICBmb3IgaiBpbiByZXF1aXJlbWVudHNcclxuICAgICAgICAgIGlmIGpbMF0gPT0gaS5uYW1lXHJcbiAgICAgICAgICAgIGlmIGpbMV0gPD0gaS52YWx1ZVxyXG4gICAgICAgICAgICAgIHJlcXNGaWxsZWQgPSByZXFzRmlsbGVkICsgMVxyXG4gICAgaWYgcmVxc0ZpbGxlZCA9PSByZXF1aXJlbWVudHMubGVuZ3RoXHJcbiAgICAgIHJldHVybiB0cnVlXHJcbiAgICBlbHNlXHJcbiAgICAgIHJldHVybiBmYWxzZVxyXG5cclxuICAjIFNldCBhIHZhbHVlIGluIEpTT05cclxuICBzZXRWYWx1ZTogKHBhcnNlZCwgbmV3VmFsdWUpIC0+XHJcbiAgICBnZXRWYWx1ZUFycmF5TGFzdCA9IEBnZXRWYWx1ZUFycmF5TGFzdChwYXJzZWQpXHJcbiAgICB2YWx1ZSA9IFBhcnNlci5maW5kVmFsdWUocGFyc2VkLGZhbHNlKVxyXG4gICAgdmFsdWVbZ2V0VmFsdWVBcnJheUxhc3RdID0gbmV3VmFsdWVcclxuXHJcbiAgIyBJbmNyZWFzZSBhIHZhbHVlIGluIEpTT05cclxuICBpbmNyZWFzZVZhbHVlOiAocGFyc2VkLCBjaGFuZ2UpIC0+XHJcbiAgICBnZXRWYWx1ZUFycmF5TGFzdCA9IEBnZXRWYWx1ZUFycmF5TGFzdChwYXJzZWQpXHJcbiAgICB2YWx1ZSA9IFBhcnNlci5maW5kVmFsdWUocGFyc2VkLGZhbHNlKVxyXG4gICAgdmFsdWVbZ2V0VmFsdWVBcnJheUxhc3RdID0gdmFsdWVbZ2V0VmFsdWVBcnJheUxhc3RdICsgY2hhbmdlXHJcbiAgICBpZiAhaXNOYU4ocGFyc2VGbG9hdCh2YWx1ZVtnZXRWYWx1ZUFycmF5TGFzdF0pKVxyXG4gICAgICB2YWx1ZVtnZXRWYWx1ZUFycmF5TGFzdF0gPSBwYXJzZUZsb2F0KHZhbHVlW2dldFZhbHVlQXJyYXlMYXN0XS50b0ZpeGVkKDgpKTtcclxuXHJcbiAgIyBEZWNyZWFzZSBhIHZhbHVlIGluIEpTT05cclxuICBkZWNyZWFzZVZhbHVlOiAocGFyc2VkLCBjaGFuZ2UpIC0+XHJcbiAgICBnZXRWYWx1ZUFycmF5TGFzdCA9IEBnZXRWYWx1ZUFycmF5TGFzdChwYXJzZWQpXHJcbiAgICB2YWx1ZSA9IFBhcnNlci5maW5kVmFsdWUocGFyc2VkLGZhbHNlKVxyXG4gICAgdmFsdWVbZ2V0VmFsdWVBcnJheUxhc3RdID0gdmFsdWVbZ2V0VmFsdWVBcnJheUxhc3RdIC0gY2hhbmdlXHJcbiAgICBpZiAhaXNOYU4ocGFyc2VGbG9hdCh2YWx1ZVtnZXRWYWx1ZUFycmF5TGFzdF0pKVxyXG4gICAgICB2YWx1ZVtnZXRWYWx1ZUFycmF5TGFzdF0gPSBwYXJzZUZsb2F0KHZhbHVlW2dldFZhbHVlQXJyYXlMYXN0XS50b0ZpeGVkKDgpKTtcclxuXHJcbiAgIyBHZXQgdGhlIGxhc3QgaXRlbSBpbiBhIHZhbHVlIGFycmF5XHJcbiAgZ2V0VmFsdWVBcnJheUxhc3Q6IChwYXJzZWQpIC0+XHJcbiAgICBnZXRWYWx1ZUFycmF5TGFzdCA9IHBhcnNlZC5zcGxpdChcIixcIilcclxuICAgIGdldFZhbHVlQXJyYXlMYXN0ID0gZ2V0VmFsdWVBcnJheUxhc3RbZ2V0VmFsdWVBcnJheUxhc3QubGVuZ3RoLTFdLnNwbGl0KFwiLlwiKVxyXG4gICAgZ2V0VmFsdWVBcnJheUxhc3QgPSBnZXRWYWx1ZUFycmF5TGFzdFtnZXRWYWx1ZUFycmF5TGFzdC5sZW5ndGgtMV1cclxuICAgIHJldHVybiBnZXRWYWx1ZUFycmF5TGFzdFxyXG5cclxuICAjIEVkaXQgdGhlIHBsYXllcidzIGl0ZW1zIG9yIHN0YXRzXHJcbiAgZWRpdEl0ZW1zT3JTdGF0czogKGl0ZW1zLCBtb2RlLCBpc0l0ZW0pIC0+XHJcbiAgICBpZiBpc0l0ZW1cclxuICAgICAgaW52ZW50b3J5ID0gZGF0YS5nYW1lLmludmVudG9yeVxyXG4gICAgICBpc0ludiA9IHRydWVcclxuICAgIGVsc2VcclxuICAgICAgaW52ZW50b3J5ID0gZGF0YS5nYW1lLnN0YXRzXHJcbiAgICAgIGlzSW52ID0gZmFsc2VcclxuICAgIGZvciBqIGluIGl0ZW1zXHJcbiAgICAgIGl0ZW1BZGRlZCA9IGZhbHNlXHJcbiAgICAgIGZvciBpIGluIGludmVudG9yeVxyXG4gICAgICAgIGlmIGkubmFtZSA9PSBqWzBdXHJcbiAgICAgICAgICBwID0galsxXS5zcGxpdChcIixcIilcclxuICAgICAgICAgIHByb2JhYmlsaXR5ID0gMVxyXG4gICAgICAgICAgaWYgcC5sZW5ndGggPiAxXHJcbiAgICAgICAgICAgIGRpc3BsYXlOYW1lID0gcFsxXVxyXG4gICAgICAgICAgICBjb3VudCA9IHBhcnNlSW50KHBbMF0pXHJcbiAgICAgICAgICAgIGlmICFpc05hTihkaXNwbGF5TmFtZSlcclxuICAgICAgICAgICAgICBwcm9iYWJpbGl0eSA9IHBbMV1cclxuICAgICAgICAgICAgICBkaXNwbGF5TmFtZSA9IGoubmFtZVxyXG4gICAgICAgICAgICBpZiBwLmxlbmd0aCA+IDJcclxuICAgICAgICAgICAgICBwcm9iYWJpbGl0eSA9IHBhcnNlRmxvYXQocFsxXSlcclxuICAgICAgICAgICAgICBkaXNwbGF5TmFtZSA9IHBbMl1cclxuICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgZGlzcGxheU5hbWUgPSBqWzBdXHJcbiAgICAgICAgICAgIGNvdW50ID0gcGFyc2VJbnQoalsxXSlcclxuICAgICAgICAgIHZhbHVlID0gTWF0aC5yYW5kb20oKVxyXG4gICAgICAgICAgaWYgdmFsdWUgPCBwcm9iYWJpbGl0eVxyXG4gICAgICAgICAgICBpZiAobW9kZSA9PSBcInNldFwiKVxyXG4gICAgICAgICAgICAgIGlmIGlzSW52XHJcbiAgICAgICAgICAgICAgICBpLmNvdW50ID0gcGFyc2VJbnQoalsxXSlcclxuICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBpLnZhbHVlID0gcGFyc2VJbnQoalsxXSlcclxuICAgICAgICAgICAgZWxzZSBpZiAobW9kZSA9PSBcImFkZFwiKVxyXG4gICAgICAgICAgICAgIGlmIGlzSW52XHJcbiAgICAgICAgICAgICAgICBpLmNvdW50ID0gcGFyc2VJbnQoaS5jb3VudCkgKyBjb3VudFxyXG4gICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGlmIGlzTmFOIHBhcnNlSW50KGkudmFsdWUpXHJcbiAgICAgICAgICAgICAgICAgIGkudmFsdWUgPSAwXHJcbiAgICAgICAgICAgICAgICBpLnZhbHVlID0gcGFyc2VJbnQoaS52YWx1ZSkgKyBjb3VudFxyXG4gICAgICAgICAgICBlbHNlIGlmIChtb2RlID09IFwicmVtb3ZlXCIpXHJcbiAgICAgICAgICAgICAgaWYgaXNJbnZcclxuICAgICAgICAgICAgICAgIGkuY291bnQgPSBwYXJzZUludChpLmNvdW50KSAtIGNvdW50XHJcbiAgICAgICAgICAgICAgICBpZiBpLmNvdW50IDwgMFxyXG4gICAgICAgICAgICAgICAgICBpLmNvdW50ID0gMFxyXG4gICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGkudmFsdWUgPSBwYXJzZUludChpLnZhbHVlKSAtIGNvdW50XHJcbiAgICAgICAgICAgICAgICBpZiBpLnZhbHVlIDwgMFxyXG4gICAgICAgICAgICAgICAgICBpLnZhbHVlID0gMFxyXG4gICAgICAgICAgaXRlbUFkZGVkID0gdHJ1ZVxyXG4gICAgICBpZiAhaXRlbUFkZGVkICYmIG1vZGUgIT0gXCJyZW1vdmVcIlxyXG4gICAgICAgIHAgPSBqWzFdLnNwbGl0KFwiLFwiKVxyXG4gICAgICAgIHByb2JhYmlsaXR5ID0gMVxyXG4gICAgICAgIGlmIHAubGVuZ3RoID4gMVxyXG4gICAgICAgICAgZGlzcGxheU5hbWUgPSBwWzFdXHJcbiAgICAgICAgICBjb3VudCA9IHBhcnNlSW50KHBbMF0pXHJcbiAgICAgICAgICBpZiAhaXNOYU4oZGlzcGxheU5hbWUpXHJcbiAgICAgICAgICAgIHByb2JhYmlsaXR5ID0gcFsxXVxyXG4gICAgICAgICAgICBkaXNwbGF5TmFtZSA9IGoubmFtZVxyXG4gICAgICAgICAgaWYgcC5sZW5ndGggPiAyXHJcbiAgICAgICAgICAgIHByb2JhYmlsaXR5ID0gcGFyc2VGbG9hdChwWzFdKVxyXG4gICAgICAgICAgICBkaXNwbGF5TmFtZSA9IHBbMl1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICBkaXNwbGF5TmFtZSA9IGpbMF1cclxuICAgICAgICAgIGNvdW50ID0gcGFyc2VJbnQoalsxXSlcclxuICAgICAgICB2YWx1ZSA9IE1hdGgucmFuZG9tKClcclxuICAgICAgICBpZiB2YWx1ZSA8IHByb2JhYmlsaXR5XHJcbiAgICAgICAgICBpbnZlbnRvcnkucHVzaCh7XCJuYW1lXCI6IGpbMF0sIFwiY291bnRcIjogY291bnQsIFwiZGlzcGxheU5hbWVcIjogZGlzcGxheU5hbWV9KVxyXG4gICAgaWYgaXNJdGVtXHJcbiAgICAgIGRhdGEuZ2FtZS5pbnZlbnRvcnkgPSBpbnZlbnRvcnlcclxuICAgIGVsc2VcclxuICAgICAgZGF0YS5nYW1lLnN0YXRzID0gaW52ZW50b3J5XHJcblxyXG59XHJcblxuZGF0YSA9IHtcclxuICBnYW1lOiBudWxsLFxyXG4gIGNob2ljZXM6IG51bGwsXHJcbiAgZGVidWdNb2RlOiBmYWxzZSxcclxuICBwcmludGVkVGV4dDogXCJcIixcclxuICBtdXNpYzogW11cclxufVxyXG5cclxuZ2FtZVBhdGggPSAnLi9nYW1lJ1xyXG5cclxuIyBHYW1lIGFyZWFcclxuZ2FtZUFyZWEgPSBuZXcgVnVlKFxyXG4gIGVsOiAnI2dhbWUtYXJlYSdcclxuICBkYXRhOiBkYXRhXHJcbiAgbWV0aG9kczpcclxuICAgIHJlcXVpcmVtZW50c0ZpbGxlZDogKGNob2ljZSkgLT5cclxuICAgICAgcmV0dXJuIFNjZW5lLnJlcXVpcmVtZW50c0ZpbGxlZChjaG9pY2UpXHJcblxyXG4gICAgc2VsZWN0Q2hvaWNlOiAoY2hvaWNlKSAtPlxyXG4gICAgICBTY2VuZS5leGl0U2NlbmUoQGdhbWUuY3VycmVudFNjZW5lKVxyXG4gICAgICBTY2VuZS5yZWFkSXRlbUFuZFN0YXRzRWRpdHMoY2hvaWNlKVxyXG4gICAgICBTY2VuZS5yZWFkU291bmRzKGNob2ljZSx0cnVlKVxyXG4gICAgICBTY2VuZS5yZWFkU2F2aW5nKGNob2ljZSlcclxuICAgICAgaWYgY2hvaWNlLm5leHRTY2VuZSAhPSBcIlwiXHJcbiAgICAgICAgU2NlbmUuY2hhbmdlU2NlbmUoY2hvaWNlLm5leHRTY2VuZSlcclxuICAgICAgZWxzZVxyXG4gICAgICAgIFNjZW5lLnVwZGF0ZVNjZW5lKEBnYW1lLmN1cnJlbnRTY2VuZSlcclxuKVxyXG5cclxuIyMjIEFuZCBmaW5hbGx5LCBzdGFydCB0aGUgZ2FtZS4uLiAjIyNcclxuR2FtZU1hbmFnZXIuc3RhcnRHYW1lKClcclxuXG5cclxuIyMjIFBBUlNFUlMgIyMjXHJcblxyXG5QYXJzZXIgPSB7XHJcblxyXG4gICMgUGFyc2UgYSBzdHJpbmcgb2YgaXRlbXMgYW5kIG91dHB1dCBhbiBhcnJheVxyXG4gIHBhcnNlSXRlbU9yU3RhdHM6IChpdGVtcykgLT5cclxuICAgIHNlcGFyYXRlID0gaXRlbXMuc3BsaXQoXCJ8XCIpXHJcbiAgICBwYXJzZWQgPSBbXVxyXG4gICAgZm9yIGkgaW4gc2VwYXJhdGVcclxuICAgICAgaSA9IGkuc3Vic3RyaW5nKDAsIGkubGVuZ3RoIC0gMSlcclxuICAgICAgaSA9IGkuc3BsaXQoXCJbXCIpXHJcbiAgICAgIHBhcnNlZC5wdXNoKGkpXHJcbiAgICByZXR1cm4gcGFyc2VkXHJcblxyXG4gICMgUGFyc2UgYSB0ZXh0IGZvciBOb3ZlbC5qcyB0YWdzLCBhbmQgcmVwbGFjZSB0aGVtIHdpdGggdGhlIGNvcnJlY3QgSFRNTCB0YWdzLlxyXG4gIHBhcnNlVGV4dDogKHRleHQpIC0+XHJcbiAgICBpZiB0ZXh0ICE9IHVuZGVmaW5lZFxyXG4gICAgICAjIFtzXSB0YWdzXHJcbiAgICAgIGZvciBpIGluIFswIC4uIDk5XVxyXG4gICAgICAgIHRleHQgPSB0ZXh0LnNwbGl0KFwiW3NcIiArIGkgKyBcIl1cIikuam9pbihcIjxzcGFuIGNsYXNzPVxcXCJoaWdobGlnaHQtXCIgKyBpICsgXCJcXFwiPlwiKVxyXG4gICAgICB0ZXh0ID0gdGV4dC5zcGxpdChcIlsvc11cIikuam9pbihcIjwvc3Bhbj5cIilcclxuICAgICAgIyBPdGhlciB0YWdzXHJcbiAgICAgIHNwbGl0VGV4dCA9IHRleHQuc3BsaXQoL1xcW3xcXF0vKVxyXG4gICAgICBzcGFuc1RvQmVDbG9zZWQgPSAwXHJcbiAgICAgIGFzVG9CZUNsb3NlZCA9IDBcclxuICAgICAgZm9yIGluZGV4IGluIFswIC4uIHNwbGl0VGV4dC5sZW5ndGgtMV1cclxuICAgICAgICBzID0gc3BsaXRUZXh0W2luZGV4XVxyXG4gICAgICAgICMgW2lmXSBzdGF0ZW1lbnRzXHJcbiAgICAgICAgaWYgcy5zdWJzdHJpbmcoMCwyKSA9PSBcImlmXCJcclxuICAgICAgICAgIHBhcnNlZCA9IHMuc3BsaXQoXCJpZiBcIilcclxuICAgICAgICAgIGlmICFAcGFyc2VTdGF0ZW1lbnQocGFyc2VkWzFdKVxyXG4gICAgICAgICAgICBzcGxpdFRleHRbaW5kZXhdID0gXCI8c3BhbiBzdHlsZT1cXFwiZGlzcGxheTpub25lO1xcXCI+XCJcclxuICAgICAgICAgICAgc3BhbnNUb0JlQ2xvc2VkKytcclxuICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgc3BsaXRUZXh0W2luZGV4XSA9IFwiXCJcclxuICAgICAgICBlbHNlIGlmIHMuc3Vic3RyaW5nKDAsMykgPT0gXCIvaWZcIlxyXG4gICAgICAgICAgaWYgc3BhbnNUb0JlQ2xvc2VkID4gMFxyXG4gICAgICAgICAgICBzcGxpdFRleHRbaW5kZXhdID0gXCI8L3NwYW4+XCJcclxuICAgICAgICAgICAgc3BhbnNUb0JlQ2xvc2VkLS1cclxuICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgc3BsaXRUZXh0W2luZGV4XSA9IFwiXCJcclxuICAgICAgICAjIFByaW50ZWQgc3RhdCB2YWx1ZXNcclxuICAgICAgICBlbHNlIGlmIHMuc3Vic3RyaW5nKDAsNSkgPT0gXCJzdGF0LlwiXHJcbiAgICAgICAgICB2YWx1ZSA9IHMuc3Vic3RyaW5nKDUscy5sZW5ndGgpXHJcbiAgICAgICAgICBmb3IgaSBpbiBkYXRhLmdhbWUuc3RhdHNcclxuICAgICAgICAgICAgaWYgaS5uYW1lID09IHZhbHVlXHJcbiAgICAgICAgICAgICAgc3BsaXRUZXh0W2luZGV4XSA9IGkudmFsdWVcclxuICAgICAgICAjIFByaW50ZWQgaW52ZW50b3J5IGNvdW50c1xyXG4gICAgICAgIGVsc2UgaWYgcy5zdWJzdHJpbmcoMCw0KSA9PSBcImludi5cIlxyXG4gICAgICAgICAgdmFsdWUgPSBzLnN1YnN0cmluZyg0LHMubGVuZ3RoKVxyXG4gICAgICAgICAgZm9yIGkgaW4gZGF0YS5nYW1lLmludmVudG9yeVxyXG4gICAgICAgICAgICBpZiBpLm5hbWUgPT0gdmFsdWVcclxuICAgICAgICAgICAgICBzcGxpdFRleHRbaW5kZXhdID0gaS5jb3VudFxyXG4gICAgICAgICMgR2VuZXJpYyBwcmludCBjb21tYW5kXHJcbiAgICAgICAgZWxzZSBpZiBzLnN1YnN0cmluZygwLDUpID09IFwicHJpbnRcIlxyXG4gICAgICAgICAgcGFyc2VkID0gcy5zcGxpdChcInByaW50IFwiKVxyXG4gICAgICAgICAgc3BsaXRUZXh0W2luZGV4XSA9IEBwYXJzZVN0YXRlbWVudChwYXJzZWRbMV0pXHJcbiAgICAgICAgIyBJbnB1dCBmaWVsZFxyXG4gICAgICAgIGVsc2UgaWYgcy5zdWJzdHJpbmcoMCw1KSA9PSBcImlucHV0XCJcclxuICAgICAgICAgIHBhcnNlZCA9IHMuc3BsaXQoXCJpbnB1dCBcIilcclxuICAgICAgICAgIG5hbWVUZXh0ID0gXCJcIlxyXG4gICAgICAgICAgZm9yIGkgaW4gZGF0YS5nYW1lLnN0YXRzXHJcbiAgICAgICAgICAgIGlmIGkubmFtZSA9PSBwYXJzZWRbMV1cclxuICAgICAgICAgICAgICBuYW1lVGV4dCA9IGkudmFsdWVcclxuICAgICAgICAgIHNwbGl0VGV4dFtpbmRleF0gPSBcIjxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiB2YWx1ZT1cXFwiXCIgKyBuYW1lVGV4dCArIFwiXFxcIiBuYW1lPVxcXCJpbnB1dFxcXCIgY2xhc3M9XFxcImlucHV0LVwiICsgcGFyc2VkWzFdICsgIFwiXFxcIj5cIlxyXG4gICAgICAgICMgUHJpbnQgc3BlZWQgY2hhbmdlclxyXG4gICAgICAgIGVsc2UgaWYgcy5zdWJzdHJpbmcoMCw1KSA9PSBcInNwZWVkXCJcclxuICAgICAgICAgIHBhcnNlZCA9IHMuc3BsaXQoXCJzcGVlZCBcIilcclxuICAgICAgICAgIHNwbGl0VGV4dFtpbmRleF0gPSBcIjxzcGFuIGNsYXNzPVxcXCJzcGVlZC1cIiArIHBhcnNlZFsxXSArIFwiXFxcIj5cIlxyXG4gICAgICAgIGVsc2UgaWYgcy5zdWJzdHJpbmcoMCw2KSA9PSBcIi9zcGVlZFwiXHJcbiAgICAgICAgICBpZiBzcGFuc1RvQmVDbG9zZWQgPiAwXHJcbiAgICAgICAgICAgIHNwbGl0VGV4dFtpbmRleF0gPSBcIjwvc3Bhbj5cIlxyXG4gICAgICAgICAgICBzcGFuc1RvQmVDbG9zZWQtLVxyXG4gICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBzcGxpdFRleHRbaW5kZXhdID0gXCJcIlxyXG4gICAgICAgICMgRW1iZWRkZWQgY2hvaWNlXHJcbiAgICAgICAgZWxzZSBpZiBzLnN1YnN0cmluZygwLDYpID09IFwiY2hvaWNlXCJcclxuICAgICAgICAgIHBhcnNlZCA9IHMuc3BsaXQoXCJjaG9pY2UgXCIpXHJcbiAgICAgICAgICBzcGxpdFRleHRbaW5kZXhdID0gXCI8YSBocmVmPVxcXCIjXFxcIiBvbmNsaWNrPVxcXCJTY2VuZS5zZWxlY3RDaG9pY2VCeU5hbWVCeUNsaWNraW5nKGV2ZW50LCdcIitwYXJzZWRbMV0rXCInKVxcXCI+XCJcclxuICAgICAgICAgIGFzVG9CZUNsb3NlZCsrXHJcbiAgICAgICAgZWxzZSBpZiBzLnN1YnN0cmluZygwLDcpID09IFwiL2Nob2ljZVwiXHJcbiAgICAgICAgICBpZiBhc1RvQmVDbG9zZWQgPiAwXHJcbiAgICAgICAgICAgIHNwbGl0VGV4dFtpbmRleF0gPSBcIjwvYT5cIlxyXG4gICAgICAgICAgICBhc1RvQmVDbG9zZWQtLVxyXG4gICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBzcGxpdFRleHRbaW5kZXhdID0gXCJcIlxyXG4gICAgICAgIGluZGV4KytcclxuICAgICAgIyBKb2luIGFsbCBiYWNrIGludG8gYSBzdHJpbmdcclxuICAgICAgdGV4dCA9IHNwbGl0VGV4dC5qb2luKFwiXCIpXHJcbiAgICAgIHJldHVybiB0ZXh0XHJcblxyXG4gICMgUGFyc2UgYSBzdGF0ZW1lbnQgdGhhdCByZXR1cm5zIHRydWUgb3IgZmFsc2Ugb3IgY2FsY3VsYXRlIGEgdmFsdWVcclxuICBwYXJzZVN0YXRlbWVudDogKHMpIC0+XHJcbiAgICAjIENoZWNrIGZvciB2YWxpZCBwYXJlbnRoZXNlc1xyXG4gICAgaWYgIVV0aWwudmFsaWRhdGVQYXJlbnRoZXNlcyhzKVxyXG4gICAgICBjb25zb2xlLmVycm9yIFwiRVJST1I6IEludmFsaWQgcGFyZW50aGVzZXMgaW4gc3RhdGVtZW50XCJcclxuICAgICMgQ2xlYW4gc3BhY2VzXHJcbiAgICBzID0gcy5yZXBsYWNlKC9cXHMrL2csICcnKTtcclxuICAgICMgUmVtb3ZlIGFsbCBvcGVyYXRvcnMgYW5kIHBhcmVudGhlc2VzXHJcbiAgICBwYXJzZWRTdHJpbmcgPSBzLnNwbGl0KC9cXCh8XFwpfFxcK3xcXCp8XFwtfFxcL3w8PXw+PXw8fD58PT18IT18XFx8XFx8fCYmLylcclxuICAgIHBhcnNlZFZhbHVlcyA9IFtdXHJcbiAgICAjIFBhcnNlIHRoZSBzdHJpbmdzIGZvciBrbm93biBwcmVmaXhlcywgYW5kIHBhcnNlIHRoZSB2YWx1ZXMgYmFzZWQgb24gdGhhdC5cclxuICAgIGZvciB2YWwgaW4gcGFyc2VkU3RyaW5nXHJcbiAgICAgIHR5cGUgPSBAZ2V0U3RhdGVtZW50VHlwZSh2YWwpXHJcbiAgICAgIHN3aXRjaCB0eXBlXHJcbiAgICAgICAgd2hlbiBcIml0ZW1cIlxyXG4gICAgICAgICAgZm9yIGkgaW4gZGF0YS5nYW1lLmludmVudG9yeVxyXG4gICAgICAgICAgICBpZiBpLm5hbWUgPT0gdmFsLnN1YnN0cmluZyg0LHZhbC5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgcGFyc2VkVmFsdWVzLnB1c2ggaS5jb3VudFxyXG4gICAgICAgIHdoZW4gXCJzdGF0c1wiXHJcbiAgICAgICAgICBmb3IgaSBpbiBkYXRhLmdhbWUuc3RhdHNcclxuICAgICAgICAgICAgaWYgaS5uYW1lID09IHZhbC5zdWJzdHJpbmcoNSx2YWwubGVuZ3RoKVxyXG4gICAgICAgICAgICAgIHBhcnNlZFZhbHVlcy5wdXNoIGkudmFsdWVcclxuICAgICAgICB3aGVuIFwidmFyXCJcclxuICAgICAgICAgIHZhbCA9IEBmaW5kVmFsdWUodmFsLnN1YnN0cmluZyg0LHZhbC5sZW5ndGgpLHRydWUpXHJcbiAgICAgICAgICBpZiAhaXNOYU4ocGFyc2VGbG9hdCh2YWwpKVxyXG4gICAgICAgICAgICBwYXJzZWRWYWx1ZXMucHVzaCB2YWxcclxuICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgcGFyc2VkVmFsdWVzLnB1c2ggXCInXCIgKyB2YWwgKyBcIidcIlxyXG4gICAgICAgIHdoZW4gXCJmbG9hdFwiXHJcbiAgICAgICAgICBwYXJzZWRWYWx1ZXMucHVzaCBwYXJzZUZsb2F0KHZhbClcclxuICAgICAgICB3aGVuIFwiaW50XCJcclxuICAgICAgICAgIHBhcnNlZFZhbHVlcy5wdXNoIHBhcnNlSW50KHZhbClcclxuICAgICAgICB3aGVuIFwic3RyaW5nXCJcclxuICAgICAgICAgIGlmIHZhbCAhPSBcIlwiXHJcbiAgICAgICAgICAgIHBhcnNlZFZhbHVlcy5wdXNoIFwiJ1wiICsgdmFsICsgXCInXCJcclxuICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgcGFyc2VkVmFsdWVzLnB1c2ggXCJcIlxyXG4gICAgIyBSZXBsYWNlIGFsbCB2YXJpYWJsZXMgd2l0aCB0aGVpciBjb3JyZWN0IHZhbHVlc1xyXG4gICAgZm9yIGkgaW4gWzAgLi4gcGFyc2VkU3RyaW5nLmxlbmd0aC0xXVxyXG4gICAgICBpZiBwYXJzZWRTdHJpbmdbaV0gIT0gXCJcIiAmJiBwYXJzZWRWYWx1ZXNbaV0gIT0gXCJcIlxyXG4gICAgICAgIHMgPSBzLnJlcGxhY2UobmV3IFJlZ0V4cChwYXJzZWRTdHJpbmdbaV0sJ2cnKSxwYXJzZWRWYWx1ZXNbaV0pXHJcbiAgICAjIFNvbHZlIG9yIGNhbGN1bGF0ZSB0aGUgc3RhdGVtZW50XHJcbiAgICByZXR1cm4gZXZhbChzKVxyXG5cclxuICAjIFJlYWQgYSBzdHJpbmcncyBiZWdpbm5pbmcgdG8gZGV0ZWN0IGl0cyB0eXBlXHJcbiAgZ2V0U3RhdGVtZW50VHlwZTogKHZhbCkgLT5cclxuICAgIHR5cGUgPSBudWxsXHJcbiAgICBpZiB2YWwuc3Vic3RyaW5nKDAsNSkgPT0gXCJzdGF0LlwiXHJcbiAgICAgIHR5cGUgPSBcInN0YXRzXCJcclxuICAgIGVsc2UgaWYgdmFsLnN1YnN0cmluZygwLDQpID09IFwiaW52LlwiXHJcbiAgICAgIHR5cGUgPSBcIml0ZW1cIlxyXG4gICAgZWxzZSBpZiB2YWwuc3Vic3RyaW5nKDAsNCkgPT0gXCJ2YXIuXCJcclxuICAgICAgdHlwZSA9IFwidmFyXCJcclxuICAgIGVsc2UgaWYgIWlzTmFOKHBhcnNlRmxvYXQodmFsKSkgJiYgdmFsLnRvU3RyaW5nKCkuaW5kZXhPZihcIi5cIikgPT0gLTFcclxuICAgICAgdHlwZSA9IFwiaW50XCJcclxuICAgIGVsc2UgaWYgIWlzTmFOKHBhcnNlRmxvYXQodmFsKSkgJiYgdmFsLnRvU3RyaW5nKCkuaW5kZXhPZihcIi5cIikgIT0gLTFcclxuICAgICAgdHlwZSA9IFwiZmxvYXRcIlxyXG4gICAgZWxzZVxyXG4gICAgICB0eXBlID0gXCJzdHJpbmdcIlxyXG4gICAgcmV0dXJuIHR5cGVcclxuXHJcbiAgIyBGaW5kIGEgdmFsdWUgZnJvbSB0aGUgZ2FtZSBkYXRhIGpzb25cclxuICAjIHRvUHJpbnQgPT0gdHJ1ZSByZXR1cm5zIHRoZSB2YWx1ZSwgdG9QcmludCA9PSBmYWxzZSByZXR1cm5zIHRoZSBvYmplY3RcclxuICBmaW5kVmFsdWU6IChwYXJzZWQsIHRvUHJpbnQpIC0+XHJcbiAgICBzcGxpdHRlZCA9IHBhcnNlZC5zcGxpdChcIixcIilcclxuICAgICMgRmluZCB0aGUgZmlyc3Qgb2JqZWN0IGluIGhpZXJhcmNoeVxyXG4gICAgaWYgIXRvUHJpbnRcclxuICAgICAgaWYgc3BsaXR0ZWQubGVuZ3RoID4gMVxyXG4gICAgICAgIHZhcmlhYmxlID0gQGZpbmRWYWx1ZUJ5TmFtZShkYXRhLmdhbWUsc3BsaXR0ZWRbMF0pWzBdXHJcbiAgICAgIGVsc2VcclxuICAgICAgICB2YXJpYWJsZSA9IEBmaW5kVmFsdWVCeU5hbWUoZGF0YS5nYW1lLHNwbGl0dGVkWzBdKVsxXVxyXG4gICAgZWxzZVxyXG4gICAgICB2YXJpYWJsZSA9IEBmaW5kVmFsdWVCeU5hbWUoZGF0YS5nYW1lLHNwbGl0dGVkWzBdKVswXVxyXG4gICAgIyBGb2xsb3cgdGhlIHBhdGhcclxuICAgIGZvciBpIGluIFswIC4uIHNwbGl0dGVkLmxlbmd0aCAtIDFdXHJcbiAgICAgIGlmIFV0aWwuaXNPZGQoaSlcclxuICAgICAgICB2YXJpYWJsZSA9IHZhcmlhYmxlW3BhcnNlSW50KHNwbGl0dGVkW2ldKV1cclxuICAgICAgZWxzZSBpZiBpICE9IDBcclxuICAgICAgICBpZiAhdG9QcmludFxyXG4gICAgICAgICAgdmFyaWFibGUgPSBAZmluZFZhbHVlQnlOYW1lKHZhcmlhYmxlLHNwbGl0dGVkW2ldKVsxXVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgIGlmIHNwbGl0dGVkW2ldID09IFwicGFyc2VkVGV4dFwiIHx8IHNwbGl0dGVkW2ldID09IFwidGV4dFwiXHJcbiAgICAgICAgICAgIHNwbGl0dGVkW2ldID0gXCJwYXJzZWRUZXh0XCJcclxuICAgICAgICAgICAgdmFyaWFibGUucGFyc2VkVGV4dCA9IFBhcnNlci5wYXJzZVRleHQodmFyaWFibGUudGV4dClcclxuICAgICAgICAgIHZhcmlhYmxlID0gQGZpbmRWYWx1ZUJ5TmFtZSh2YXJpYWJsZSxzcGxpdHRlZFtpXSlbMF1cclxuICAgIHJldHVybiB2YXJpYWJsZVxyXG5cclxuICAjIEZpbmQgYW4gb2JqZWN0IGZyb20gdGhlIG9iamVjdCBoaWVyYXJjaHkgYnkgc3RyaW5nIG5hbWVcclxuICBmaW5kVmFsdWVCeU5hbWU6IChvYmosIHN0cmluZykgLT5cclxuICAgIHBhcnRzID0gc3RyaW5nLnNwbGl0KCcuJylcclxuICAgIG5ld09iaiA9IG9ialtwYXJ0c1swXV1cclxuICAgIGlmIHBhcnRzWzFdXHJcbiAgICAgIHBhcnRzLnNwbGljZSAwLCAxXHJcbiAgICAgIG5ld1N0cmluZyA9IHBhcnRzLmpvaW4oJy4nKVxyXG4gICAgICByZXR1cm4gQGZpbmRWYWx1ZUJ5TmFtZShuZXdPYmosIG5ld1N0cmluZylcclxuICAgIHIgPSBbXVxyXG4gICAgclswXSA9IG5ld09ialxyXG4gICAgclsxXSA9IG9ialxyXG4gICAgcmV0dXJuIHJcclxuXHJcbn1cclxuXG5cclxuIyMjIFNDRU5FIE1BTklQVUxBVElPTiAjIyNcclxuXHJcblNjZW5lID0ge1xyXG5cclxuICAjXHJcbiAgc2VsZWN0Q2hvaWNlQnlOYW1lQnlDbGlja2luZzogKGV2ZW50LCBuYW1lKSAtPlxyXG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcclxuICAgIEBzZWxlY3RDaG9pY2VCeU5hbWUobmFtZSlcclxuXHJcbiAgIyBTZWxlY3QgYSBjaG9pY2UgYnkgbmFtZVxyXG4gIHNlbGVjdENob2ljZUJ5TmFtZTogKG5hbWUpIC0+XHJcbiAgICBmb3IgaSBpbiBkYXRhLmdhbWUuY3VycmVudFNjZW5lLmNob2ljZXNcclxuICAgICAgaWYgaS5uYW1lID09IG5hbWVcclxuICAgICAgICBnYW1lQXJlYS5zZWxlY3RDaG9pY2UoaSlcclxuICAgICAgICBicmVha1xyXG5cclxuICAjIENhbGxlZCB3aGVuIGV4aXRpbmcgYSBzY2VuZVxyXG4gIGV4aXRTY2VuZTogKHNjZW5lKSAtPlxyXG4gICAgVUkudXBkYXRlSW5wdXRzKHNjZW5lKVxyXG5cclxuICAjIENhbGxlZCB3aGVuIGNoYW5naW5nIGEgc2NlbmVcclxuICBjaGFuZ2VTY2VuZTogKHNjZW5lTmFtZXMpIC0+XHJcbiAgICBzY2VuZSA9IEBmaW5kU2NlbmVCeU5hbWUoQHNlbGVjdFJhbmRvbVNjZW5lIHNjZW5lTmFtZXMpXHJcbiAgICBAc2V0dXBTY2VuZShzY2VuZSlcclxuICAgIHJldHVybiBzY2VuZVxyXG5cclxuICAjIFNldHVwIGEgc2NlbmUgY2hhbmdlZCB0b1xyXG4gIHNldHVwU2NlbmU6IChzY2VuZSkgLT5cclxuICAgIEB1cGRhdGVTY2VuZShzY2VuZSlcclxuICAgIEByZWFkSXRlbUFuZFN0YXRzRWRpdHMoZGF0YS5nYW1lLmN1cnJlbnRTY2VuZSlcclxuICAgIEByZWFkU291bmRzKGRhdGEuZ2FtZS5jdXJyZW50U2NlbmUsZmFsc2UpXHJcbiAgICBAcmVhZFNhdmluZyhkYXRhLmdhbWUuY3VycmVudFNjZW5lKVxyXG5cclxuICAjIElmIG5vdCBjaGFuZ2luZyBzY2VuZXMgYnV0IHVwZGF0ZSBuZWVkZWQsIHRoaXMgaXMgY2FsbGVkXHJcbiAgdXBkYXRlU2NlbmU6IChzY2VuZSkgLT5cclxuICAgIFNjZW5lLmNvbWJpbmVTY2VuZVRleHRzKHNjZW5lKVxyXG4gICAgc2NlbmUucGFyc2VkVGV4dCA9IFBhcnNlci5wYXJzZVRleHQgc2NlbmUuY29tYmluZWRUZXh0XHJcbiAgICBkYXRhLmdhbWUuY3VycmVudFNjZW5lID0gc2NlbmVcclxuICAgIGRhdGEuZ2FtZS5wYXJzZWRDaG9pY2VzID0gbnVsbFxyXG4gICAgVGV4dFByaW50ZXIucHJpbnRUZXh0KHNjZW5lLnBhcnNlZFRleHQpXHJcblxyXG4gICMgVXBkYXRlIGNob2ljZSB0ZXh0cyB3aGVuIHRoZXkgYXJlIGNoYW5nZWQgLSBWdWUuanMgZG9lc24ndCBkZXRlY3QgdGhlbSB3aXRob3V0IHRoaXMuXHJcbiAgdXBkYXRlQ2hvaWNlczogLT5cclxuICAgIGdhbWVBcmVhLiRzZXQgJ2dhbWUucGFyc2VkQ2hvaWNlcycsIGRhdGEuZ2FtZS5jdXJyZW50U2NlbmUuY2hvaWNlcy5tYXAoKGNob2ljZSkgLT5cclxuICAgICAgY2hvaWNlLnBhcnNlZFRleHQgPSBQYXJzZXIucGFyc2VUZXh0KGNob2ljZS50ZXh0KVxyXG4gICAgICBpZiBnYW1lQXJlYS5nYW1lLnNldHRpbmdzLmFsd2F5c1Nob3dEaXNhYmxlZENob2ljZXNcclxuICAgICAgICBjaG9pY2UuYWx3YXlzU2hvdyA9IHRydWVcclxuICAgICAgY2hvaWNlXHJcbiAgICApXHJcblxyXG4gICMgU2VsZWN0IGEgcmFuZG9tIHNjZW5lIGZyb20gYSBsaXN0IHNlcGFyYXRlZCBieSB8LCB0YWtlcyBzdHJpbmdcclxuICBzZWxlY3RSYW5kb21TY2VuZTogKG5hbWUpIC0+XHJcbiAgICBzZXBhcmF0ZSA9IG5hbWUuc3BsaXQoXCJ8XCIpXHJcbiAgICBpZiBzZXBhcmF0ZS5sZW5ndGggPT0gMVxyXG4gICAgICByZXR1cm4gc2VwYXJhdGVbMF1cclxuICAgIHBhcnNlZCA9IFtdXHJcbiAgICBmb3IgaSBpbiBzZXBhcmF0ZVxyXG4gICAgICBpID0gaS5zdWJzdHJpbmcoMCwgaS5sZW5ndGggLSAxKVxyXG4gICAgICBpID0gaS5zcGxpdChcIltcIilcclxuICAgICAgcGFyc2VkLnB1c2goaSlcclxuICAgIHBhcnNlZCA9IEBjaG9vc2VGcm9tTXVsdGlwbGVTY2VuZXMgcGFyc2VkXHJcbiAgICByZXR1cm4gcGFyc2VkXHJcblxyXG4gICMgU2VsZWN0IGEgc2NlbmUgcmFuZG9tbHkgZnJvbSBtdWx0aXBsZSBzY2VuZXMgd2l0aCBkaWZmZXJlbnQgcHJvYmFiaWxpdGllcywgdGFrZXMgYXJyYXlcclxuICBjaG9vc2VGcm9tTXVsdGlwbGVTY2VuZXM6IChzY2VuZXMpIC0+XHJcbiAgICBuYW1lcyA9IFtdXHJcbiAgICBjaGFuY2VzID0gW11cclxuICAgIHJhd0NoYW5jZXMgPSBbXVxyXG4gICAgcHJldmlvdXMgPSAwXHJcbiAgICBmb3IgaSBpbiBzY2VuZXNcclxuICAgICAgbmFtZXMucHVzaCBpWzBdXHJcbiAgICAgIHByZXZpb3VzID0gcGFyc2VGbG9hdChpWzFdKStwcmV2aW91c1xyXG4gICAgICBjaGFuY2VzLnB1c2ggcHJldmlvdXNcclxuICAgICAgcmF3Q2hhbmNlcy5wdXNoIHBhcnNlRmxvYXQoaVsxXSlcclxuICAgIHRvdGFsQ2hhbmNlID0gMFxyXG4gICAgZm9yIGkgaW4gcmF3Q2hhbmNlc1xyXG4gICAgICB0b3RhbENoYW5jZSA9IHRvdGFsQ2hhbmNlICsgcGFyc2VGbG9hdChpKVxyXG4gICAgaWYgdG90YWxDaGFuY2UgIT0gMVxyXG4gICAgICBjb25zb2xlLmVycm9yIFwiRVJST1I6IEludmFsaWQgc2NlbmUgb2RkcyFcIlxyXG4gICAgdmFsdWUgPSBNYXRoLnJhbmRvbSgpXHJcbiAgICBuYW1lSW5kZXggPSAwXHJcbiAgICBmb3IgaSBpbiBjaGFuY2VzXHJcbiAgICAgIGlmIHZhbHVlIDwgaVxyXG4gICAgICAgIHJldHVybiBuYW1lc1tuYW1lSW5kZXhdXHJcbiAgICAgIG5hbWVJbmRleCsrXHJcblxyXG4gICMgUmV0dXJuIGEgc2NlbmUgYnkgaXRzIG5hbWU7IHRocm93IGFuIGVycm9yIGlmIG5vdCBmb3VuZC5cclxuICBmaW5kU2NlbmVCeU5hbWU6IChuYW1lKSAtPlxyXG4gICAgZm9yIGkgaW4gZGF0YS5nYW1lLnNjZW5lc1xyXG4gICAgICBpZiBpLm5hbWUgPT0gbmFtZVxyXG4gICAgICAgIHJldHVybiBpXHJcbiAgICBjb25zb2xlLmVycm9yIFwiRVJST1I6IFNjZW5lIGJ5IG5hbWUgJ1wiK25hbWUrXCInIG5vdCBmb3VuZCFcIlxyXG5cclxuICAjIENvbWJpbmUgdGhlIG11bHRpcGxlIHNjZW5lIHRleHQgcm93c1xyXG4gIGNvbWJpbmVTY2VuZVRleHRzOiAoc2NlbmUpIC0+XHJcbiAgICBzY2VuZS5jb21iaW5lZFRleHQgPSBzY2VuZS50ZXh0XHJcbiAgICBmb3Iga2V5IG9mIHNjZW5lXHJcbiAgICAgIGlmIHNjZW5lLmhhc093blByb3BlcnR5KGtleSlcclxuICAgICAgICBpZiBrZXkuaW5jbHVkZXMoXCJ0ZXh0LVwiKVxyXG4gICAgICAgICAgc2NlbmUuY29tYmluZWRUZXh0ID0gc2NlbmUuY29tYmluZWRUZXh0LmNvbmNhdChzY2VuZVtrZXldKVxyXG5cclxuICAjIFJlYWQgaXRlbSwgc3RhdCBhbmQgdmFsIGVkaXQgY29tbWFuZHMgZnJvbSBzY2VuZSBvciBjaG9pY2VcclxuICByZWFkSXRlbUFuZFN0YXRzRWRpdHM6IChzb3VyY2UpIC0+XHJcbiAgICBpZiBzb3VyY2UucmVtb3ZlSXRlbSAhPSB1bmRlZmluZWRcclxuICAgICAgSW52ZW50b3J5LmVkaXRJdGVtc09yU3RhdHMoUGFyc2VyLnBhcnNlSXRlbU9yU3RhdHMoc291cmNlLnJlbW92ZUl0ZW0pLFwicmVtb3ZlXCIsdHJ1ZSlcclxuICAgIGlmIHNvdXJjZS5hZGRJdGVtICE9IHVuZGVmaW5lZFxyXG4gICAgICBJbnZlbnRvcnkuZWRpdEl0ZW1zT3JTdGF0cyhQYXJzZXIucGFyc2VJdGVtT3JTdGF0cyhzb3VyY2UuYWRkSXRlbSksXCJhZGRcIix0cnVlKVxyXG4gICAgaWYgc291cmNlLnNldEl0ZW0gIT0gdW5kZWZpbmVkXHJcbiAgICAgIEludmVudG9yeS5lZGl0SXRlbXNPclN0YXRzKFBhcnNlci5wYXJzZUl0ZW1PclN0YXRzKHNvdXJjZS5zZXRJdGVtKSxcInNldFwiLHRydWUpXHJcbiAgICBpZiBzb3VyY2UucmVtb3ZlU3RhdHMgIT0gdW5kZWZpbmVkXHJcbiAgICAgIEludmVudG9yeS5lZGl0SXRlbXNPclN0YXRzKFBhcnNlci5wYXJzZUl0ZW1PclN0YXRzKHNvdXJjZS5yZW1vdmVTdGF0cyksXCJyZW1vdmVcIixmYWxzZSlcclxuICAgIGlmIHNvdXJjZS5hZGRTdGF0cyAhPSB1bmRlZmluZWRcclxuICAgICAgSW52ZW50b3J5LmVkaXRJdGVtc09yU3RhdHMoUGFyc2VyLnBhcnNlSXRlbU9yU3RhdHMoc291cmNlLmFkZFN0YXRzKSxcImFkZFwiLGZhbHNlKVxyXG4gICAgaWYgc291cmNlLnNldFN0YXRzICE9IHVuZGVmaW5lZFxyXG4gICAgICBJbnZlbnRvcnkuZWRpdEl0ZW1zT3JTdGF0cyhQYXJzZXIucGFyc2VJdGVtT3JTdGF0cyhzb3VyY2Uuc2V0U3RhdHMpLFwic2V0XCIsZmFsc2UpXHJcbiAgICBpZiBzb3VyY2Uuc2V0VmFsdWUgIT0gdW5kZWZpbmVkXHJcbiAgICAgIGZvciB2YWwgaW4gc291cmNlLnNldFZhbHVlXHJcbiAgICAgICAgSW52ZW50b3J5LnNldFZhbHVlKHZhbC5wYXRoLHZhbC52YWx1ZSlcclxuICAgIGlmIHNvdXJjZS5pbmNyZWFzZVZhbHVlICE9IHVuZGVmaW5lZFxyXG4gICAgICBmb3IgdmFsIGluIHNvdXJjZS5pbmNyZWFzZVZhbHVlXHJcbiAgICAgICAgSW52ZW50b3J5LmluY3JlYXNlVmFsdWUodmFsLnBhdGgsdmFsLnZhbHVlKVxyXG4gICAgaWYgc291cmNlLmRlY3JlYXNlVmFsdWUgIT0gdW5kZWZpbmVkXHJcbiAgICAgIGZvciB2YWwgaW4gc291cmNlLmRlY3JlYXNlVmFsdWVcclxuICAgICAgICBJbnZlbnRvcnkuZGVjcmVhc2VWYWx1ZSh2YWwucGF0aCx2YWwudmFsdWUpXHJcblxyXG4gICMgUmVhZCBzb3VuZCBjb21tYW5kcyBmcm9tIHNjZW5lIG9yIGNob2ljZVxyXG4gIHJlYWRTb3VuZHM6IChzb3VyY2UsY2xpY2tlZCkgLT5cclxuICAgIHBsYXllZCA9IGZhbHNlXHJcbiAgICBpZiBzb3VyY2UucGxheVNvdW5kICE9IHVuZGVmaW5lZFxyXG4gICAgICBTb3VuZC5wbGF5U291bmQoc291cmNlLnBsYXlTb3VuZCxmYWxzZSlcclxuICAgICAgcGxheWVkID0gdHJ1ZVxyXG4gICAgaWYgY2xpY2tlZCAmJiAhcGxheWVkXHJcbiAgICAgIFNvdW5kLnBsYXlEZWZhdWx0Q2xpY2tTb3VuZCgpXHJcbiAgICBpZiBzb3VyY2Uuc3RhcnRNdXNpYyAhPSB1bmRlZmluZWRcclxuICAgICAgU291bmQuc3RhcnRNdXNpYyhzb3VyY2Uuc3RhcnRNdXNpYylcclxuICAgIGlmIHNvdXJjZS5zdG9wTXVzaWMgIT0gdW5kZWZpbmVkXHJcbiAgICAgIFNvdW5kLnN0b3BNdXNpYyhzb3VyY2Uuc3RvcE11c2ljKVxyXG5cclxuICAjIFJlYWQgc2F2ZSBhbmQgbG9hZCBjb21tYW5kcyBmcm9tIHNjZW5lIG9yIGNob2ljZVxyXG4gIHJlYWRTYXZpbmc6IChzb3VyY2UpIC0+XHJcbiAgICBpZiBzb3VyY2Uuc2F2ZUdhbWUgIT0gdW5kZWZpbmVkXHJcbiAgICAgIHNhdmVHYW1lKClcclxuICAgIGlmIHNvdXJjZS5sb2FkR2FtZSAhPSB1bmRlZmluZWRcclxuICAgICAgc2hvd0xvYWROb3RpZmljYXRpb24oKVxyXG5cclxuICAjIENoZWNrIHdoZXRoZXIgdGhlIHJlcXVpcmVtZW50cyBmb3IgYSBjaG9pY2UgaGF2ZSBiZWVuIG1ldFxyXG4gIHJlcXVpcmVtZW50c0ZpbGxlZDogKGNob2ljZSkgLT5cclxuICAgIHJlcXMgPSBbXVxyXG4gICAgaWYgY2hvaWNlLml0ZW1SZXF1aXJlbWVudCAhPSB1bmRlZmluZWRcclxuICAgICAgcmVxdWlyZW1lbnRzID0gUGFyc2VyLnBhcnNlSXRlbU9yU3RhdHMgY2hvaWNlLml0ZW1SZXF1aXJlbWVudFxyXG4gICAgICByZXFzLnB1c2ggSW52ZW50b3J5LmNoZWNrUmVxdWlyZW1lbnRzKHJlcXVpcmVtZW50cywgdHJ1ZSlcclxuICAgIGlmIGNob2ljZS5zdGF0c1JlcXVpcmVtZW50ICE9IHVuZGVmaW5lZFxyXG4gICAgICByZXF1aXJlbWVudHMgPSBQYXJzZXIucGFyc2VJdGVtT3JTdGF0cyBjaG9pY2Uuc3RhdHNSZXF1aXJlbWVudFxyXG4gICAgICByZXFzLnB1c2ggSW52ZW50b3J5LmNoZWNrUmVxdWlyZW1lbnRzKHJlcXVpcmVtZW50cywgZmFsc2UpXHJcbiAgICBpZiBjaG9pY2UucmVxdWlyZW1lbnQgIT0gdW5kZWZpbmVkXHJcbiAgICAgIHJlcXMucHVzaCBJbnZlbnRvcnkucGFyc2VJZlN0YXRlbWVudCBjaG9pY2UucmVxdWlyZW1lbnRcclxuICAgIHN1Y2Nlc3MgPSB0cnVlXHJcbiAgICBmb3IgciBpbiByZXFzXHJcbiAgICAgIGlmIHIgPT0gZmFsc2VcclxuICAgICAgICBzdWNjZXNzID0gZmFsc2VcclxuICAgIHJldHVybiBzdWNjZXNzXHJcblxyXG59XHJcblxuXHJcbiMjIyBTT1VORFMgIyMjXHJcblxyXG4jIEEgY2xhc3MgZm9yIHNvdW5kIGZ1bmN0aW9uc1xyXG5Tb3VuZCA9IHtcclxuXHJcbiAgIyBQbGF5IHRoZSBkZWZhdWx0IHNvdW5kIGZvciBjbGlja2luZyBhbiBpdGVtXHJcbiAgcGxheURlZmF1bHRDbGlja1NvdW5kOiAobmFtZSxjbGlja2VkKSAtPlxyXG4gICAgQHBsYXlTb3VuZChkYXRhLmdhbWUuc2V0dGluZ3Muc291bmRTZXR0aW5ncy5kZWZhdWx0Q2xpY2tTb3VuZCxmYWxzZSlcclxuXHJcbiAgIyBQbGF5IGEgc291bmQgYnkgbmFtZVxyXG4gIHBsYXlTb3VuZDogKG5hbWUsIGlzTXVzaWMpIC0+XHJcbiAgICBmb3IgcyBpbiBkYXRhLmdhbWUuc291bmRzXHJcbiAgICAgIGlmIHMubmFtZSA9PSBuYW1lXHJcbiAgICAgICAgc291bmQgPSBuZXcgQXVkaW8oZ2FtZVBhdGgrJy9zb3VuZHMvJytzLmZpbGUpXHJcbiAgICAgICAgaWYgaXNNdXNpY1xyXG4gICAgICAgICAgc291bmQudm9sdW1lID0gZGF0YS5nYW1lLnNldHRpbmdzLnNvdW5kU2V0dGluZ3MubXVzaWNWb2x1bWVcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICBzb3VuZC52b2x1bWUgPSBkYXRhLmdhbWUuc2V0dGluZ3Muc291bmRTZXR0aW5ncy5zb3VuZFZvbHVtZVxyXG4gICAgICAgIHNvdW5kLnBsYXkoKVxyXG4gICAgICAgIHJldHVybiBzb3VuZFxyXG5cclxuICAjIElzIG11c2ljIHBsYXlpbmc/XHJcbiAgaXNQbGF5aW5nOiAobmFtZSkgLT5cclxuICAgIGZvciBpIGluIGRhdGEubXVzaWNcclxuICAgICAgaWYgaS5wYXVzZWRcclxuICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgICAgZWxzZVxyXG4gICAgICAgIHJldHVybiB0cnVlXHJcblxyXG4gICMgU3RhcnQgbXVzaWNcclxuICBzdGFydE11c2ljOiAobmFtZSkgLT5cclxuICAgIG11c2ljID0gQHBsYXlTb3VuZChuYW1lLHRydWUpXHJcbiAgICBtdXNpYy5hZGRFdmVudExpc3RlbmVyICdlbmRlZCcsICgtPlxyXG4gICAgICBAY3VycmVudFRpbWUgPSAwXHJcbiAgICAgIEBwbGF5KClcclxuICAgICAgcmV0dXJuXHJcbiAgICApLCBmYWxzZVxyXG4gICAgZGF0YS5tdXNpYy5wdXNoIHtcIm5hbWVcIjpuYW1lLFwibXVzaWNcIjptdXNpY31cclxuXHJcbiAgIyBTdG9wIGEgbXVzaWMgdGhhdCB3YXMgc3RhcnRlZCBwcmV2aW91c2x5XHJcbiAgc3RvcE11c2ljOiAobmFtZSkgLT5cclxuICAgIGZvciBpIGluIGRhdGEubXVzaWNcclxuICAgICAgaWYgbmFtZSA9PSBpLm5hbWVcclxuICAgICAgICBpLm11c2ljLnBhdXNlKClcclxuICAgICAgICBpbmRleCA9IGRhdGEubXVzaWMuaW5kZXhPZihpKVxyXG4gICAgICAgIGRhdGEubXVzaWMuc3BsaWNlKGluZGV4LDEpXHJcblxyXG59XHJcblxuZnVsbFRleHQgPSBcIlwiXHJcbnRpbWVyID0gbnVsbFxyXG50aW1lcjIgPSBudWxsXHJcbmN1cnJlbnRPZmZzZXQgPSAwXHJcbmRlZmF1bHRJbnRlcnZhbCA9IDUwXHJcblxyXG5UZXh0UHJpbnRlciA9IHtcclxuXHJcbiAgcHJpbnRUZXh0OiAodGV4dCkgLT5cclxuICAgIGZ1bGxUZXh0ID0gdGV4dFxyXG4gICAgI2NvbnNvbGUubG9nIGZ1bGxUZXh0XHJcbiAgICBjdXJyZW50T2Zmc2V0ID0gMFxyXG4gICAgdGltZXIgPSBzZXRJbnRlcnZhbChAb25UaWNrLCBkZWZhdWx0SW50ZXJ2YWwpXHJcblxyXG4gIGNvbXBsZXRlOiAtPlxyXG4gICAgY2xlYXJJbnRlcnZhbCB0aW1lclxyXG4gICAgdGltZXIgPSBudWxsXHJcbiAgICBkYXRhLnByaW50ZWRUZXh0ID0gZnVsbFRleHRcclxuICAgIFNjZW5lLnVwZGF0ZUNob2ljZXMoKVxyXG4gICAgcmV0dXJuIGZhbHNlXHJcblxyXG4gIG9uVGljazogLT5cclxuICAgICNjb25zb2xlLmxvZyBjdXJyZW50T2Zmc2V0ICsgXCI6IFwiICsgZnVsbFRleHRbY3VycmVudE9mZnNldF1cclxuICAgIGlmIGZ1bGxUZXh0W2N1cnJlbnRPZmZzZXRdID09ICc8J1xyXG4gICAgICBpID0gY3VycmVudE9mZnNldFxyXG4gICAgICBzdHIgPSBcIlwiXHJcbiAgICAgIHdoaWxlIGZ1bGxUZXh0W2ldICE9ICc+J1xyXG4gICAgICAgIGkrK1xyXG4gICAgICAgIHN0ciA9IHN0ciArIGZ1bGxUZXh0W2ldXHJcbiAgICAgIHN0ciA9IHN0ci5zdWJzdHJpbmcoMCxzdHIubGVuZ3RoLTEpXHJcbiAgICAgICNjb25zb2xlLmxvZyBcIkhhYSEgXCIgKyBzdHJcclxuICAgICAgaWYgc3RyLmluZGV4T2YoXCJkaXNwbGF5Om5vbmU7XCIpID4gLTFcclxuICAgICAgICAjY29uc29sZS5sb2cgXCJESVNQTEFZIE5PTkUgRk9VTkRcIlxyXG4gICAgICAgIGRpc3AgPSBcIlwiXHJcbiAgICAgICAgaSsrXHJcbiAgICAgICAgd2hpbGUgZGlzcC5pbmRleE9mKFwiL3NwYW5cIikgPT0gLTFcclxuICAgICAgICAgIGkrK1xyXG4gICAgICAgICAgZGlzcCA9IGRpc3AgKyBmdWxsVGV4dFtpXVxyXG4gICAgICAgICNjb25zb2xlLmxvZyBcIkRpc3A6IFwiICsgZGlzcFxyXG4gICAgICBjdXJyZW50T2Zmc2V0ID0gaVxyXG5cclxuICAgICNjb25zb2xlLmxvZyBjdXJyZW50T2Zmc2V0XHJcblxyXG4gICAgY3VycmVudE9mZnNldCsrXHJcbiAgICBpZiBjdXJyZW50T2Zmc2V0ID09IGZ1bGxUZXh0Lmxlbmd0aFxyXG4gICAgICBUZXh0UHJpbnRlci5jb21wbGV0ZSgpXHJcbiAgICAgIHJldHVyblxyXG5cclxuICAgIGlmIGZ1bGxUZXh0W2N1cnJlbnRPZmZzZXRdID09ICc8J1xyXG4gICAgICBkYXRhLnByaW50ZWRUZXh0ID0gZnVsbFRleHQuc3Vic3RyaW5nKDAsIGN1cnJlbnRPZmZzZXQtMSlcclxuICAgIGVsc2VcclxuICAgICAgZGF0YS5wcmludGVkVGV4dCA9IGZ1bGxUZXh0LnN1YnN0cmluZygwLCBjdXJyZW50T2Zmc2V0KVxyXG5cclxufVxyXG5cblxyXG4jIyMgVUkgU0NSSVBUUyAjIyNcclxuXHJcblVJID0ge1xyXG5cclxuICAjIFNob3cgdGhlIHNhdmUgbm90aWZpY2F0aW9uIHdpbmRvdywgYW5kIHVwZGF0ZSBpdHMgdGV4dFxyXG4gIHNob3dTYXZlTm90aWZpY2F0aW9uOiAodGV4dCkgLT5cclxuICAgIGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmUtbm90aWZpY2F0aW9uXCIpXHJcbiAgICB0ZXh0QXJlYSA9IGUucXVlcnlTZWxlY3RvckFsbChcInRleHRhcmVhXCIpXHJcbiAgICB0ZXh0QXJlYVswXS52YWx1ZSA9IHRleHRcclxuICAgIGUuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XHJcblxyXG4gICMgQ2xvc2UgdGhlIHNhdmUgbm90aWZpY2F0aW9uIHdpbmRvd1xyXG4gIGNsb3NlU2F2ZU5vdGlmaWNhdGlvbjogLT5cclxuICAgIGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmUtbm90aWZpY2F0aW9uXCIpXHJcbiAgICBlLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcblxyXG4gICMgU2hvdyB0aGUgbG9hZCBub3RpZmljYXRpb24gd2luZG93XHJcbiAgc2hvd0xvYWROb3RpZmljYXRpb246IC0+XHJcbiAgICBpZiBnYW1lQXJlYS5nYW1lLnNldHRpbmdzLnNhdmVNb2RlID09IFwidGV4dFwiXHJcbiAgICAgIGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxvYWQtbm90aWZpY2F0aW9uXCIpXHJcbiAgICAgIGUuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XHJcbiAgICBlbHNlXHJcbiAgICAgIGxvYWRHYW1lKClcclxuXHJcbiAgIyBDbG9zZSB0aGUgbG9hZCBub3RpZmljYXRpb24gLSBpZiBsb2FkLCB0aGVuIGxvYWQgYSBzYXZlLlxyXG4gIGNsb3NlTG9hZE5vdGlmaWNhdGlvbjogKGxvYWQpIC0+XHJcbiAgICBlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsb2FkLW5vdGlmaWNhdGlvblwiKVxyXG4gICAgaWYgbG9hZFxyXG4gICAgICB0ZXh0QXJlYSA9IGUucXVlcnlTZWxlY3RvckFsbChcInRleHRhcmVhXCIpXHJcbiAgICAgIGxvYWRHYW1lKHRleHRBcmVhWzBdLnZhbHVlKVxyXG4gICAgICB0ZXh0QXJlYVswXS52YWx1ZSA9IFwiXCJcclxuICAgIGUuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xyXG5cclxuICAjIFVwZGF0ZSB0aGUgdmFsdWVzIG9mIHRoZSBpbnB1dCBmaWVsZHNcclxuICB1cGRhdGVJbnB1dHM6IChzY2VuZSkgLT5cclxuICAgIGlucHV0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZS1hcmVhXCIpLnF1ZXJ5U2VsZWN0b3JBbGwoXCJpbnB1dFwiKVxyXG4gICAgZm9yIGkgaW4gaW5wdXRzXHJcbiAgICAgIGZvciBhIGluIGRhdGEuZ2FtZS5zdGF0c1xyXG4gICAgICAgIGlmIGEubmFtZSA9PSBpLmNsYXNzTmFtZS5zdWJzdHJpbmcoNixpLmNsYXNzTmFtZS5sZW5ndGgpXHJcbiAgICAgICAgICBhLnZhbHVlID0gVXRpbC5zdHJpcEhUTUwoaS52YWx1ZSlcclxuXHJcbn1cclxuXHJcbiMgVGhlIGJ1dHRvbiB0aGF0IGNhbiBiZSB1c2VkIHRvIGNvcHkgdGhlIHRleHQgZnJvbSB0aGUgc2F2ZSB3aW5kb3cuXHJcbmNvcHlCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjY29weS1idXR0b24nKVxyXG5jb3B5QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIgJ2NsaWNrJywgKGV2ZW50KSAtPlxyXG4gIGNvcHlUZXh0YXJlYSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2F2ZS1ub3RpZmljYXRpb25cIikucXVlcnlTZWxlY3RvcihcInRleHRhcmVhXCIpXHJcbiAgY29weVRleHRhcmVhLnNlbGVjdCgpXHJcbiAgdHJ5XHJcbiAgICBzdWNjZXNzZnVsID0gZG9jdW1lbnQuZXhlY0NvbW1hbmQoJ2NvcHknKVxyXG4gIGNhdGNoIGVyclxyXG4gICAgY29uc29sZS5lcnJvciBcIkNvcHlpbmcgdG8gY2xpcGJvYXJkIGZhaWxlZDogXCIrZXJyXHJcbiAgcmV0dXJuXHJcblxuXHJcbiMjIyBVVElMSVRZIFNDUklQVFMgIyMjXHJcblxyXG5VdGlsID0ge1xyXG5cclxuICAjIENoZWNrIGlmIGEgdmFsdWUgaXMgZXZlbiBvciBub3RcclxuICBpc0V2ZW46IChuKSAtPlxyXG4gICAgbiAlIDIgPT0gMFxyXG5cclxuICAjIENoZWNrIGlmIGEgdmFsdWUgaXMgb2RkIG9yIG5vdFxyXG4gIGlzT2RkOiAobikgLT5cclxuICAgIE1hdGguYWJzKG4gJSAyKSA9PSAxXHJcblxyXG4gICMgUmVtb3ZlIEhUTUwgdGFncyBmcm9tIGEgc3RyaW5nIC0gdXNlZCB0byBjbGVhbiBpbnB1dFxyXG4gIHN0cmlwSFRNTDogKHRleHQpIC0+XHJcbiAgICByZWdleCA9IC8oPChbXj5dKyk+KS9pZ1xyXG4gICAgdGV4dC5yZXBsYWNlIHJlZ2V4LCAnJ1xyXG5cclxuICAjIENoZWNrIGlmIHRoZSBzdHJpbmcgaGFzIHZhbGlkIHBhcmVudGhlc2VzXHJcbiAgdmFsaWRhdGVQYXJlbnRoZXNlczogKHMpIC0+XHJcbiAgICBvcGVuID0gMFxyXG4gICAgZm9yIGkgaW4gc1xyXG4gICAgICBpZiBpID09IFwiKFwiXHJcbiAgICAgICAgb3BlbisrXHJcbiAgICAgIGlmIGkgPT0gXCIpXCJcclxuICAgICAgICBpZiBvcGVuID4gMFxyXG4gICAgICAgICAgb3Blbi0tXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICBpZiBvcGVuID09IDBcclxuICAgICAgcmV0dXJuIHRydWVcclxuICAgIGVsc2VcclxuICAgICAgcmV0dXJuIGZhbHNlXHJcblxyXG59XHJcbiJdfQ==
