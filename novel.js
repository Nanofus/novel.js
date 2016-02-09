var data, gameArea, gamePath, isEven, isOdd, loadGame, prepareData, saveGame, stripHTML;

data = {
  game: null,
  choices: null,
  debugMode: false,
  music: []
};

gamePath = './game';

prepareData = function(json) {
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
};

loadGame = function(game) {
  var request;
  if (game === void 0) {
    request = new XMLHttpRequest;
    request.open('GET', gamePath + '/game.json', true);
    request.onload = function() {
      var json;
      if (request.status >= 200 && request.status < 400) {
        json = JSON.parse(request.responseText);
        json = prepareData(json);
        data.game = json;
        data.game.currentScene = gameArea.changeScene(data.game.scenes[0].name);
        return data.debugMode = data.game.debugMode;
      }
    };
    request.onerror = function() {};
    return request.send();
  } else if (game !== void 0) {
    data.game = JSON.parse(atob(game));
    data.debugMode = data.game.debugMode;
  }
};

saveGame = function() {
  if (data.game.settings.saveMode === "cookie") {
    return console.log("cookie");
  } else if (data.game.settings.saveMode === "text") {
    return console.log("text");
  }
};

loadGame();

gameArea = new Vue({
  el: '#game-area',
  data: data,
  methods: {
    saveGameAsJson: function() {
      var save;
      save = btoa(JSON.stringify(this.game));
      console.log("Save data: " + save);
      return save;
    },
    selectChoice: function(choice) {
      this.exitScene(this.game.currentScene);
      this.readItemAndStatsEdits(choice);
      this.readSounds(choice, true);
      if (choice.nextScene !== "") {
        return this.changeScene(choice.nextScene);
      } else {
        return this.updateScene(this.game.currentScene);
      }
    },
    selectChoiceByName: function(name) {
      var i, k, len, ref, results;
      ref = this.game.currentScene.choices;
      results = [];
      for (k = 0, len = ref.length; k < len; k++) {
        i = ref[k];
        if (i.name === name) {
          this.selectChoice(i);
          break;
        } else {
          results.push(void 0);
        }
      }
      return results;
    },
    exitScene: function(scene) {
      return this.updateInputs(scene);
    },
    changeScene: function(sceneNames) {
      var scene;
      scene = this.findSceneByName(this.selectRandomScene(sceneNames));
      this.setupScene(scene);
      return scene;
    },
    setupScene: function(scene) {
      this.updateScene(scene);
      this.readItemAndStatsEdits(this.game.currentScene);
      return this.readSounds(this.game.currentScene, false);
    },
    updateScene: function(scene) {
      this.combineSceneTexts(scene);
      scene.parsedText = this.parseText(scene.combinedText);
      this.game.currentScene = scene;
      return this.updateChoices(this);
    },
    updateChoices: function(vue) {
      return this.$set('game.parsedChoices', this.game.currentScene.choices.map(function(choice) {
        choice.parsedText = vue.parseText(choice.text);
        if (vue.game.settings.alwaysShowDisabledChoices) {
          choice.alwaysShow = true;
        }
        return choice;
      }));
    },
    readItemAndStatsEdits: function(source) {
      var k, l, len, len1, len2, m, ref, ref1, ref2, results, val;
      if (source.removeItem !== void 0) {
        this.editItemsOrStats(this.parseItemOrStats(source.removeItem), "remove", true);
      }
      if (source.addItem !== void 0) {
        this.editItemsOrStats(this.parseItemOrStats(source.addItem), "add", true);
      }
      if (source.setItem !== void 0) {
        this.editItemsOrStats(this.parseItemOrStats(source.setItem), "set", true);
      }
      if (source.removeStats !== void 0) {
        this.editItemsOrStats(this.parseItemOrStats(source.removeStats), "remove", false);
      }
      if (source.addStats !== void 0) {
        this.editItemsOrStats(this.parseItemOrStats(source.addStats), "add", false);
      }
      if (source.setStats !== void 0) {
        this.editItemsOrStats(this.parseItemOrStats(source.setStats), "set", false);
      }
      if (source.setValue !== void 0) {
        ref = source.setValue;
        for (k = 0, len = ref.length; k < len; k++) {
          val = ref[k];
          this.setValue(val.path, val.value);
        }
      }
      if (source.increaseValue !== void 0) {
        ref1 = source.increaseValue;
        for (l = 0, len1 = ref1.length; l < len1; l++) {
          val = ref1[l];
          this.increaseValue(val.path, val.value);
        }
      }
      if (source.decreaseValue !== void 0) {
        ref2 = source.decreaseValue;
        results = [];
        for (m = 0, len2 = ref2.length; m < len2; m++) {
          val = ref2[m];
          results.push(this.decreaseValue(val.path, val.value));
        }
        return results;
      }
    },
    readSounds: function(source, clicked) {
      var played;
      played = false;
      if (source.playSound !== void 0) {
        this.playSound(source.playSound, false);
        played = true;
      }
      if (clicked && !played) {
        this.playDefaultClickSound();
      }
      if (source.startMusic !== void 0) {
        this.startMusic(source.startMusic);
      }
      if (source.stopMusic !== void 0) {
        return this.stopMusic(source.stopMusic);
      }
    },
    requirementsFilled: function(choice) {
      var k, len, r, reqs, requirements, success;
      reqs = [];
      if (choice.itemRequirement !== void 0) {
        requirements = this.parseItemOrStats(choice.itemRequirement);
        reqs.push(this.parseRequirements(requirements));
      }
      if (choice.statsRequirement !== void 0) {
        requirements = this.parseItemOrStats(choice.statsRequirement);
        reqs.push(this.parseRequirements(requirements));
      }
      if (choice.requirement !== void 0) {
        reqs.push(this.parseIfStatement(choice.requirement));
      }
      success = true;
      for (k = 0, len = reqs.length; k < len; k++) {
        r = reqs[k];
        if (r === false) {
          success = false;
        }
      }
      return success;
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
        console.warn("ERROR: Invalid scene odds!");
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
          } else if (s.substring(0, 5) === "stat.") {
            value = s.substring(5, s.length);
            ref1 = this.game.stats;
            for (m = 0, len = ref1.length; m < len; m++) {
              i = ref1[m];
              if (i.name === value) {
                splitText[index] = i.count;
              }
            }
          } else if (s.substring(0, 4) === "inv.") {
            value = s.substring(4, s.length);
            ref2 = this.game.inventory;
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
            ref3 = this.game.stats;
            for (q = 0, len2 = ref3.length; q < len2; q++) {
              i = ref3[q];
              if (i.name === parsed[1]) {
                nameText = i.count;
              }
            }
            splitText[index] = "<input type=\"text\" value=\"" + nameText + "\" name=\"input\" class=\"input-" + parsed[1] + "\">";
          } else if (s.substring(0, 6) === "choice") {
            parsed = s.split("choice ");
            splitText[index] = "<a href=\"#\" onclick=\"gameArea.selectChoiceByName('" + parsed[1] + "')\">";
            asToBeClosed++;
          } else if (s.substring(0, 7) === "/choice") {
            if (asToBeClosed > 0) {
              splitText[index] = "</a>";
              asToBeClosed--;
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
          }
          index++;
        }
        text = splitText.join("");
        return text;
      }
    },
    updateInputs: function(scene) {
      var a, i, inputs, k, len, results;
      inputs = document.getElementById("game-area").querySelectorAll("input");
      results = [];
      for (k = 0, len = inputs.length; k < len; k++) {
        i = inputs[k];
        results.push((function() {
          var l, len1, ref, results1;
          ref = this.game.stats;
          results1 = [];
          for (l = 0, len1 = ref.length; l < len1; l++) {
            a = ref[l];
            if (a.name === i.className.substring(6, i.className.length)) {
              results1.push(a.count = stripHTML(i.value));
            } else {
              results1.push(void 0);
            }
          }
          return results1;
        }).call(this));
      }
      return results;
    },
    setValue: function(parsed, newValue) {
      var arrLast, value;
      arrLast = this.arrLast(parsed);
      value = this.findValue(parsed, false);
      return value[arrLast] = newValue;
    },
    increaseValue: function(parsed, newValue) {
      var arrLast, value;
      arrLast = this.arrLast(parsed);
      value = this.findValue(parsed, false);
      value[arrLast] = value[arrLast] + newValue;
      if (!isNaN(parseFloat(value[arrLast]))) {
        return value[arrLast] = parseFloat(value[arrLast].toFixed(8));
      }
    },
    decreaseValue: function(parsed, newValue) {
      var arrLast, value;
      arrLast = this.arrLast(parsed);
      value = this.findValue(parsed, false);
      value[arrLast] = value[arrLast] - newValue;
      if (!isNaN(parseFloat(value[arrLast]))) {
        return value[arrLast] = parseFloat(value[arrLast].toFixed(8));
      }
    },
    arrLast: function(parsed) {
      var arrLast;
      arrLast = parsed.split(",");
      arrLast = arrLast[arrLast.length - 1].split(".");
      arrLast = arrLast[arrLast.length - 1];
      return arrLast;
    },
    findValue: function(parsed, toPrint) {
      var i, k, ref, splitted, variable;
      splitted = parsed.split(",");
      if (!toPrint) {
        if (splitted.length > 1) {
          variable = this.findValueByName(this.game, splitted[0])[0];
        } else {
          variable = this.findValueByName(this.game, splitted[0])[1];
        }
      } else {
        variable = this.findValueByName(this.game, splitted[0])[0];
      }
      for (i = k = 0, ref = splitted.length - 1; 0 <= ref ? k <= ref : k >= ref; i = 0 <= ref ? ++k : --k) {
        if (isOdd(i)) {
          variable = variable[parseInt(splitted[i])];
        } else if (i !== 0) {
          if (!toPrint) {
            variable = this.findValueByName(variable, splitted[i])[1];
          } else {
            if (splitted[i] === "parsedText" || splitted[i] === "text") {
              splitted[i] = "parsedText";
              variable.parsedText = this.parseText(variable.text);
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
    },
    parseStatement: function(s) {
      var i, k, l, len, len1, len2, m, o, parsedString, parsedValues, ref, ref1, ref2, type, val;
      if (!this.checkForValidParentheses(s)) {
        console.warn("ERROR: Invalid parentheses in statement");
      }
      s = s.replace(/\s+/g, '');
      parsedString = s.split(/\(|\)|\+|\*|\-|\/|<=|>=|<|>|==|!=|\|\||&&/);
      parsedValues = [];
      for (k = 0, len = parsedString.length; k < len; k++) {
        val = parsedString[k];
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
        switch (type) {
          case "item":
            ref = this.game.inventory;
            for (l = 0, len1 = ref.length; l < len1; l++) {
              i = ref[l];
              if (i.name === val.substring(4, val.length)) {
                parsedValues.push(i.count);
              }
            }
            break;
          case "stats":
            ref1 = this.game.stats;
            for (m = 0, len2 = ref1.length; m < len2; m++) {
              i = ref1[m];
              if (i.name === val.substring(5, val.length)) {
                parsedValues.push(i.count);
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
    checkForValidParentheses: function(s) {
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
    },
    parseRequirements: function(requirements) {
      var i, j, k, l, len, len1, ref, reqsFilled;
      reqsFilled = 0;
      ref = this.game.inventory;
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
      if (reqsFilled === requirements.length) {
        return true;
      } else {
        return false;
      }
    },
    editItemsOrStats: function(items, mode, isItem) {
      var count, displayName, i, inventory, itemAdded, j, k, l, len, len1, p, probability, value;
      if (isItem) {
        inventory = this.game.inventory;
      } else {
        inventory = this.game.stats;
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
                i.count = parseInt(j[1]);
              } else if (mode === "add") {
                i.count = parseInt(i.count) + count;
              } else if (mode === "remove") {
                i.count = parseInt(i.count) - count;
                if (i.count < 0) {
                  i.count = 0;
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
        return this.game.inventory = inventory;
      } else {
        return this.game.stats = inventory;
      }
    },
    findSceneByName: function(name) {
      var i, k, len, ref;
      ref = this.game.scenes;
      for (k = 0, len = ref.length; k < len; k++) {
        i = ref[k];
        if (i.name === name) {
          return i;
        }
      }
      return console.warn("ERROR: Scene by name '" + name + "' not found!");
    },
    playDefaultClickSound: function(name, clicked) {
      return this.playSound(this.game.settings.soundSettings.defaultClickSound, false);
    },
    playSound: function(name, isMusic) {
      var k, len, ref, s, sound;
      ref = this.game.sounds;
      for (k = 0, len = ref.length; k < len; k++) {
        s = ref[k];
        if (s.name === name) {
          sound = new Audio(gamePath + '/sounds/' + s.file);
          if (isMusic) {
            sound.volume = this.game.settings.soundSettings.musicVolume;
          } else {
            sound.volume = this.game.settings.soundSettings.soundVolume;
          }
          sound.play();
          return sound;
        }
      }
    },
    isPlaying: function(name) {
      var i, k, len, ref;
      ref = this.music;
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
      return this.music.push({
        "name": name,
        "music": music
      });
    },
    stopMusic: function(name) {
      var i, index, k, len, ref, results;
      ref = this.music;
      results = [];
      for (k = 0, len = ref.length; k < len; k++) {
        i = ref[k];
        if (name === i.name) {
          i.music.pause();
          index = this.music.indexOf(i);
          results.push(this.music.splice(index, 1));
        } else {
          results.push(void 0);
        }
      }
      return results;
    }
  }
});

isEven = function(n) {
  return n % 2 === 0;
};

isOdd = function(n) {
  return Math.abs(n % 2) === 1;
};

stripHTML = function(text) {
  var regex;
  regex = /(<([^>]+)>)/ig;
  return text.replace(regex, '');
};
