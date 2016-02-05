var data, gameArea, gamePath, loadGame, prepareData;

data = {
  game: null,
  currentScene: null,
  parsedText: "",
  choices: null,
  debugMode: false
};

gamePath = './game';

prepareData = function(json) {
  var c, k, l, len, len1, ref, ref1, s;
  ref = json.scenes;
  for (k = 0, len = ref.length; k < len; k++) {
    s = ref[k];
    s.combinedText = "";
    ref1 = s.choices;
    for (l = 0, len1 = ref1.length; l < len1; l++) {
      c = ref1[l];
      c.parsedText = "";
      if (c.alwaysShow === void 0) {
        c.alwaysShow = false;
      }
    }
  }
  return json;
};

loadGame = function() {
  return $.getJSON('./game/game.json', function(json) {
    json = prepareData(json);
    data.game = json;
    data.currentScene = gameArea.changeScene(json.scenes[0].name);
    return data.debugMode = json.debugMode;
  });
};

loadGame();

gameArea = new Vue({
  el: '#game-area',
  data: data,
  methods: {
    selectChoice: function(choice) {
      this.readItemAndActionEdits(choice);
      this.readSounds(choice, true);
      return this.changeScene(choice.nextScene);
    },
    changeScene: function(sceneNames) {
      var scene;
      scene = this.findSceneByName(this.selectRandomScene(sceneNames));
      this.setupScene(scene);
      return scene;
    },
    setupScene: function(scene) {
      this.currentScene = scene;
      this.parseSceneText(this.currentScene);
      this.parsedText = this.parseText(this.currentScene.combinedText);
      this.updateChoices(this);
      this.readItemAndActionEdits(this.currentScene);
      return this.readSounds(this.currentScene, false);
    },
    updateChoices: function(vue) {
      return this.$set('parsedChoices', this.currentScene.choices.map(function(choice) {
        choice.parsedText = vue.parseText(choice.text);
        if (vue.game.settings.alwaysShowDisabledChoices) {
          choice.alwaysShow = true;
        }
        return choice;
      }));
    },
    readItemAndActionEdits: function(source) {
      var addedActions, addedItems, removedActions, removedItems, setActions, setItems;
      if (source.removeItem !== void 0) {
        removedItems = this.parseItemOrAction(source.removeItem);
        this.editItemsOrActions(removedItems, "remove", true);
      }
      if (source.addItem !== void 0) {
        addedItems = this.parseItemOrAction(source.addItem);
        this.editItemsOrActions(addedItems, "add", true);
      }
      if (source.removeAction !== void 0) {
        removedActions = this.parseItemOrAction(source.removeAction);
        this.editItemsOrActions(removedActions, "remove", false);
      }
      if (source.addAction !== void 0) {
        addedActions = this.parseItemOrAction(source.addAction);
        this.editItemsOrActions(addedActions, "add", false);
      }
      if (source.setAction !== void 0) {
        setActions = this.parseItemOrAction(source.setAction);
        this.editItemsOrActions(setActions, "set", false);
      }
      if (source.setItem !== void 0) {
        setItems = this.parseItemOrAction(source.setItem);
        return this.editItemsOrActions(setItems, "set", true);
      }
    },
    readSounds: function(source, clicked) {
      var played;
      played = false;
      if (source.playSound !== void 0) {
        this.playSound(source.playSound);
        played = true;
      }
      if (clicked && !played) {
        return this.playDefaultClickSound();
      }
    },
    requirementsFilled: function(choice) {
      var requirements;
      if (choice.itemRequirement !== void 0) {
        requirements = this.parseItemOrAction(choice.itemRequirement);
        return this.parseRequirements(requirements);
      } else if (choice.actionRequirement !== void 0) {
        requirements = this.parseItemOrAction(choice.actionRequirement);
        return this.parseRequirements(requirements);
      } else {
        return true;
      }
    },
    parseSceneText: function(scene) {
      var key, results1;
      scene.combinedText = scene.text;
      results1 = [];
      for (key in scene) {
        if (scene.hasOwnProperty(key)) {
          if (key.includes("text-")) {
            results1.push(scene.combinedText = scene.combinedText.concat(scene[key]));
          } else {
            results1.push(void 0);
          }
        } else {
          results1.push(void 0);
        }
      }
      return results1;
    },
    parseItemOrAction: function(items) {
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
      var i, index, k, l, len, len1, len2, m, n, parsed, ref, ref1, s, splitText, tagToBeClosed, value;
      for (i = k = 0; k <= 99; i = ++k) {
        text = text.split("[s" + i + "]").join("<span class=\"highlight-" + i + "\">");
      }
      text = text.split("[/s]").join("</span>");
      splitText = text.split(/\[|\]/);
      index = 0;
      tagToBeClosed = false;
      for (l = 0, len = splitText.length; l < len; l++) {
        s = splitText[l];
        if (s.substring(0, 2) === "if") {
          parsed = s.split(" ");
          if (!this.parseIfStatement(parsed[1])) {
            splitText[index] = "<span style=\"display:none;\">";
            tagToBeClosed = true;
          } else {
            splitText[index] = "";
          }
        }
        if (s.substring(0, 4) === "act.") {
          value = s.substring(4, s.length);
          ref = this.game.actions;
          for (m = 0, len1 = ref.length; m < len1; m++) {
            i = ref[m];
            if (i.name === value) {
              splitText[index] = i.count;
            }
          }
        }
        if (s.substring(0, 4) === "inv.") {
          value = s.substring(4, s.length);
          ref1 = this.game.inventory;
          for (n = 0, len2 = ref1.length; n < len2; n++) {
            i = ref1[n];
            if (i.name === value) {
              splitText[index] = i.count;
            }
          }
        }
        if (s.substring(0, 3) === "/if") {
          if (tagToBeClosed) {
            splitText[index] = "</span>";
            tagToBeClosed = false;
          } else {
            splitText[index] = "";
          }
        }
        index++;
      }
      text = splitText.join("");
      return text;
    },
    parseIfStatement: function(s) {
      var fail, i, k, l, len, len1, m, mode, r, ref, results, statement, success;
      statement = s.split("&&");
      mode = "";
      if (statement.length > 1) {
        mode = "&&";
      } else {
        statement = s.split("||");
        if (statement.length > 1) {
          mode = "||";
        }
      }
      results = [];
      for (i = k = 0, ref = statement.length - 1; 0 <= ref ? k <= ref : k >= ref; i = 0 <= ref ? ++k : --k) {
        s = statement[i].split("||");
        if (s.length > 1) {
          results.push(this.parseIfStatement(statement[i]));
        } else if (this.parseEquation(statement[i])) {
          results.push(true);
        } else {
          results.push(false);
        }
      }
      if (mode === "&&") {
        fail = false;
        for (l = 0, len = results.length; l < len; l++) {
          r = results[l];
          if (r === false) {
            fail = true;
          }
        }
        if (fail) {
          return false;
        } else {
          return true;
        }
      }
      if (mode === "||") {
        success = false;
        for (m = 0, len1 = results.length; m < len1; m++) {
          r = results[m];
          if (r === true) {
            success = true;
          }
        }
        if (success) {
          return true;
        } else {
          return false;
        }
      }
      if (mode === "") {
        return this.parseEquation(statement[0]);
      }
    },
    parseEquation: function(s) {
      var entity, i, k, l, len, len1, parsedValue, ref, ref1, sign, statement, type;
      sign = '';
      statement = s.split("==");
      if (statement.length > 1) {
        sign = "==";
      } else {
        statement = s.split("!=");
        if (statement.length > 1) {
          sign = "!=";
        } else {
          statement = s.split("<=");
          if (statement.length > 1) {
            sign = "<=";
          } else {
            statement = s.split("<");
            if (statement.length > 1) {
              sign = "<";
            } else {
              statement = s.split(">=");
              if (statement.length > 1) {
                sign = ">=";
              } else {
                statement = s.split(">");
                if (statement.length > 1) {
                  sign = ">";
                }
              }
            }
          }
        }
      }
      s = statement[0];
      type = null;
      if (s.substring(0, 4) === "act.") {
        type = "action";
      } else if (s.substring(0, 4) === "inv.") {
        type = "item";
      }
      entity = null;
      if (type === "item") {
        ref = this.game.inventory;
        for (k = 0, len = ref.length; k < len; k++) {
          i = ref[k];
          if (i.name === s.substring(4, s.length)) {
            entity = i;
            break;
          }
        }
      }
      if (type === "action") {
        ref1 = this.game.actions;
        for (l = 0, len1 = ref1.length; l < len1; l++) {
          i = ref1[l];
          if (i.name === s.substring(4, s.length)) {
            entity = i;
            break;
          }
        }
      }
      parsedValue = parseInt(statement[1]);
      switch (sign) {
        case "==":
          if (i.count === parsedValue) {
            return true;
          }
          break;
        case "!=":
          if (i.count !== parsedValue) {
            return true;
          }
          break;
        case "<=":
          if (i.count <= parsedValue) {
            return true;
          }
          break;
        case ">=":
          if (i.count >= parsedValue) {
            return true;
          }
          break;
        case "<":
          if (i.count < parsedValue) {
            return true;
          }
          break;
        case ">":
          if (i.count > parsedValue) {
            return true;
          }
      }
      return false;
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
    editItemsOrActions: function(items, mode, isItem) {
      var i, inventory, itemAdded, j, k, l, len, len1;
      if (isItem) {
        inventory = this.game.inventory;
      } else {
        inventory = this.game.actions;
      }
      for (k = 0, len = items.length; k < len; k++) {
        j = items[k];
        itemAdded = false;
        for (l = 0, len1 = inventory.length; l < len1; l++) {
          i = inventory[l];
          if (i.name === j[0]) {
            if (mode === "set") {
              i.count = parseInt(j[1]);
            } else if (mode === "add") {
              i.count = parseInt(i.count) + parseInt(j[1]);
            } else if (mode === "remove") {
              i.count = parseInt(i.count) - parseInt(j[1]);
              if (i.count < 0) {
                i.count = 0;
              }
            }
            itemAdded = true;
          }
        }
        if (!itemAdded && mode !== "remove") {
          inventory.push({
            "name": j[0],
            "count": j[1]
          });
        }
      }
      if (isItem) {
        return this.game.inventory = inventory;
      } else {
        return this.game.actions = inventory;
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
      return this.playSound(this.game.settings.defaultClickSound);
    },
    playSound: function(name) {
      var k, len, ref, results1, s, sound;
      ref = this.game.sounds;
      results1 = [];
      for (k = 0, len = ref.length; k < len; k++) {
        s = ref[k];
        if (s.name === name) {
          sound = new Audio(gamePath + '/sounds/' + s.file);
          sound.volume = this.game.settings.soundVolume;
          results1.push(sound.play());
        } else {
          results1.push(void 0);
        }
      }
      return results1;
    }
  }
});
