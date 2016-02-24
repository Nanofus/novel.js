
/* SAVING AND LOADING */
var GameManager, InputManager, InventoryManager, Parser, SceneManager, SoundManager, TextPrinter, UI, Util, copyButton, data, gameArea, gameManager, gamePath, inputManager, inventoryManager, parser, sceneManager, soundManager, textPrinter, ui, util,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

GameManager = (function() {
  function GameManager() {}

  GameManager.prototype.loadCookie = function(cname) {
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
  };

  GameManager.prototype.saveCookie = function(cname, cvalue, exdays) {
    var d, expires;
    d = new Date;
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    expires = 'expires=' + d.toUTCString();
    return document.cookie = cname + '=' + cvalue + '; ' + expires + '; path=/';
  };

  GameManager.prototype.loadGame = function(game) {
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
  };

  GameManager.prototype.prepareLoadedGame = function(loadedData) {
    if (data.game.gameName !== loadedData.gameName) {
      console.error("ERROR! Game name mismatch");
      return;
    }
    if (data.game.version !== loadedData.version) {
      console.warn("WARNING! Game version mismatch");
    }
    data.game = loadedData;
    data.debugMode = data.game.debugMode;
    return sceneManager.updateScene(data.game.currentScene, true);
  };

  GameManager.prototype.startGame = function() {
    var request;
    request = new XMLHttpRequest;
    request.open('GET', gamePath + '/game.json', true);
    request.onload = function() {
      var json;
      if (request.status >= 200 && request.status < 400) {
        json = JSON.parse(request.responseText);
        json = gameManager.prepareData(json);
        data.game = json;
        data.game.currentScene = sceneManager.changeScene(data.game.scenes[0].name);
        return data.debugMode = data.game.debugMode;
      }
    };
    request.onerror = function() {};
    request.send();
    if (document.querySelector("#continue-button") !== null) {
      return document.querySelector("#continue-button").style.display = 'none';
    }
  };

  GameManager.prototype.saveGameAsJson = function() {
    var save;
    save = btoa(JSON.stringify(data.game));
    return save;
  };

  GameManager.prototype.saveGame = function() {
    var save;
    save = this.saveGameAsJson();
    if (data.game.settings.saveMode === "cookie") {
      return this.saveCookie("gameData", save, 365);
    } else if (data.game.settings.saveMode === "text") {
      return ui.showSaveNotification(save);
    }
  };

  GameManager.prototype.prepareData = function(json) {
    var c, i, j, k, l, len, len1, len2, len3, m, o, ref, ref1, ref2, s;
    json.currentScene = "";
    json.parsedChoices = "";
    if (json.currentInventory === void 0) {
      json.currentInventory = 0;
    }
    if (json.inventories === void 0) {
      json.inventories = [];
    }
    if (json.scenes === void 0) {
      json.scenes = [];
    }
    ref = json.inventories;
    for (k = 0, len = ref.length; k < len; k++) {
      i = ref[k];
      for (l = 0, len1 = i.length; l < len1; l++) {
        j = i[l];
        if (j.displayName === void 0) {
          j.displayName = j.name;
        }
      }
    }
    ref1 = json.scenes;
    for (m = 0, len2 = ref1.length; m < len2; m++) {
      s = ref1[m];
      s.combinedText = "";
      s.parsedText = "";
      ref2 = s.choices;
      for (o = 0, len3 = ref2.length; o < len3; o++) {
        c = ref2[o];
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

  return GameManager;

})();


/* HANDLES KEYBOARD INPUT */

InputManager = (function() {
  function InputManager() {}

  InputManager.prototype.presses = 0;

  InputManager.prototype.keyDown = function(charCode) {
    if (this.formsSelected()) {
      return;
    }
    if (charCode === 13 || charCode === 32) {
      if (data.game.settings.scrollSettings.continueWithKeyboard) {
        sceneManager.tryContinue();
      }
      if (data.game.settings.scrollSettings.skipWithKeyboard) {
        textPrinter.trySkip();
      }
      return textPrinter.unpause();
    }
  };

  InputManager.prototype.keyPressed = function(charCode) {
    if (this.formsSelected()) {
      return;
    }
    this.presses++;
    if (charCode === 13 || charCode === 32) {
      if (this.presses > 2) {
        if (data.game.settings.scrollSettings.fastScrollWithKeyboard) {
          return textPrinter.fastScroll();
        }
      }
    }
  };

  InputManager.prototype.keyUp = function(charCode) {
    if (this.formsSelected()) {
      return;
    }
    this.presses = 0;
    if (charCode === 13 || charCode === 32) {
      return textPrinter.stopFastScroll();
    }
  };

  InputManager.prototype.formsSelected = function() {
    var i, inputs, k, len;
    inputs = document.getElementById("game-area").querySelectorAll("input");
    for (k = 0, len = inputs.length; k < len; k++) {
      i = inputs[k];
      if (i === document.activeElement) {
        return true;
      }
    }
    return false;
  };

  return InputManager;

})();

document.onkeydown = function(evt) {
  var charCode;
  evt = evt || window.event;
  charCode = evt.keyCode || evt.which;
  return inputManager.keyDown(charCode);
};

document.onkeypress = function(evt) {
  var charCode;
  evt = evt || window.event;
  charCode = evt.keyCode || evt.which;
  return inputManager.keyPressed(charCode);
};

document.onkeyup = function(evt) {
  var charCode;
  evt = evt || window.event;
  charCode = evt.keyCode || evt.which;
  return inputManager.keyUp(charCode);
};


/* PARSERS */

Parser = (function() {
  function Parser() {}

  Parser.prototype.parseItems = function(items) {
    var i, k, len, parsed, separate;
    util.checkFormat(items, 'string');
    if (items === "") {
      return void 0;
    }
    separate = items.split("|");
    parsed = [];
    for (k = 0, len = separate.length; k < len; k++) {
      i = separate[k];
      i = i.split(",");
      parsed.push(i);
    }
    return parsed;
  };

  Parser.prototype.parseText = function(text) {
    var asToBeClosed, i, index, k, l, len, len1, len2, len3, m, nameText, o, p, parsed, q, ref, ref1, ref2, ref3, s, spansToBeClosed, splitText, t, tagName, value;
    if (text !== void 0) {
      util.checkFormat(text, 'string');
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
      text = text.replace(/\/\[/g, "OPEN_BRACKET_REPLACEMENT").replace(/\/\]/g, "CLOSE_BRACKET_REPLACEMENT");
      splitText = text.split(/\[|\]/);
      index = 0;
      for (m = 0, len1 = splitText.length; m < len1; m++) {
        s = splitText[m];
        splitText[index] = s.replace(/OPEN_BRACKET_REPLACEMENT/g, "[").replace(/CLOSE_BRACKET_REPLACEMENT/g, "]");
        index++;
      }
      spansToBeClosed = 0;
      asToBeClosed = 0;
      index = 0;
      for (index = o = 0, ref1 = splitText.length - 1; 0 <= ref1 ? o <= ref1 : o >= ref1; index = 0 <= ref1 ? ++o : --o) {
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
        } else if (s.substring(0, 4) === "inv.") {
          value = s.substring(4, s.length);
          splitText[index] = 0;
          ref2 = data.game.inventories[data.game.currentInventory];
          for (q = 0, len2 = ref2.length; q < len2; q++) {
            i = ref2[q];
            if (i.name === value) {
              splitText[index] = i.value;
            }
          }
        } else if (s.substring(0, 5) === "print") {
          parsed = s.split("print ");
          parsed = this.parseStatement(parsed[1]);
          if (!isNaN(parseFloat(parsed))) {
            parsed = parseFloat(parsed.toFixed(data.game.settings.floatPrecision));
          }
          splitText[index] = parsed;
        } else if (s.substring(0, 4) === "exec") {
          parsed = s.substring(5, s.length);
          p = data.parsedJavascriptCommands.push(parsed);
          p--;
          splitText[index] = "<span class=\"execute-command com-" + p + "\"></span>";
        } else if (s.substring(0, 5) === "pause") {
          parsed = s.substring(6, s.length);
          splitText[index] = "<span class=\"pause " + parsed + "\"></span>";
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
          ref3 = data.game.inventories[data.game.currentInventory];
          for (t = 0, len3 = ref3.length; t < len3; t++) {
            i = ref3[t];
            if (i.name === parsed[1]) {
              nameText = i.value;
            }
          }
          splitText[index] = "<input type=\"text\" value=\"" + nameText + "\" name=\"input\" class=\"input-" + parsed[1] + "\" onblur=\"ui.updateInputs(true)\">";
        } else if (s.substring(0, 6) === "choice") {
          parsed = s.split("choice ");
          splitText[index] = "<a href=\"#\" onclick=\"sceneManager.selectChoiceByNameByClicking(event,'" + parsed[1] + "')\">";
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
  };

  Parser.prototype.parseStatement = function(s) {
    var found, i, k, l, len, len1, m, parsedString, parsedValues, plus, ref, ref1, result, type, val, vals;
    if (s === void 0) {
      return void 0;
    }
    s = s.toString();
    util.checkFormat(s, 'string');
    if (!util.validateParentheses(s)) {
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
          found = false;
          ref = data.game.inventories[data.game.currentInventory];
          for (l = 0, len1 = ref.length; l < len1; l++) {
            i = ref[l];
            if (i.name === val.substring(4, val.length)) {
              parsedValues.push(i.value);
              found = true;
            }
          }
          if (!found) {
            parsedValues.push(0);
          }
          break;
        case "rand":
          val = val.split(".");
          vals = val[1].split(",");
          plus = true;
          if (vals[0].substring(0, 5) === "minus") {
            vals[0] = vals[0].substring(5, vals[0].length);
            plus = false;
          }
          if (vals[1].substring(0, 5) === "minus") {
            vals[1] = vals[1].substring(5, vals[1].length);
            plus = false;
          }
          if (plus) {
            result = Math.random() * vals[1] + vals[0];
          } else {
            result = Math.random() * vals[1] - vals[0];
          }
          if (vals[2] === void 0) {
            vals[2] = 0;
          }
          if (vals[2] === 0) {
            result = Math.round(result);
          } else {
            result = parseFloat(result).toFixed(vals[2]);
          }
          parsedValues.push(result);
          break;
        case "var":
          val = this.findValue(val.substring(4, val.length), true);
          if (!isNaN(parseFloat(val))) {
            parsedValues.push(parseFloat(val).toFixed(data.game.settings.floatPrecision));
          } else {
            parsedValues.push("'" + val + "'");
          }
          break;
        case "float":
          parsedValues.push(parseFloat(val).toFixed(data.game.settings.floatPrecision));
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
    for (i = m = 0, ref1 = parsedString.length - 1; 0 <= ref1 ? m <= ref1 : m >= ref1; i = 0 <= ref1 ? ++m : --m) {
      if (parsedString[i] !== "" && parsedValues[i] !== "") {
        parsedString[i] = parsedString[i].replace("{", "\{");
        parsedString[i] = parsedString[i].replace("}", "\}");
        s = s.replace(new RegExp(parsedString[i], 'g'), parsedValues[i]);
      }
    }
    return eval(s);
  };

  Parser.prototype.getStatementType = function(val) {
    var type;
    type = null;
    if (val.substring(0, 4) === "inv.") {
      type = "item";
    } else if (val.substring(0, 4) === "var.") {
      type = "var";
    } else if (val.substring(0, 5) === "rand.") {
      type = "rand";
    } else if (!isNaN(parseFloat(val)) && val.toString().indexOf(".") === -1) {
      type = "int";
    } else if (!isNaN(parseFloat(val)) && val.toString().indexOf(".") !== -1) {
      type = "float";
    } else {
      type = "string";
    }
    return type;
  };

  Parser.prototype.findValue = function(parsed, toPrint) {
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
      if (util.isOdd(i)) {
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
  };

  Parser.prototype.findValueByName = function(obj, string) {
    var newObj, newString, parts, r;
    util.checkFormat(string, 'string');
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
  };

  return Parser;

})();


/* INVENTORY, STAT & VALUE OPERATIONS */

InventoryManager = (function() {
  function InventoryManager() {}

  InventoryManager.prototype.checkRequirements = function(requirements) {
    var i, j, k, l, len, len1, ref, reqsFilled;
    util.checkFormat(requirements, 'array');
    reqsFilled = 0;
    ref = data.game.inventories[data.game.currentInventory];
    for (k = 0, len = ref.length; k < len; k++) {
      i = ref[k];
      for (l = 0, len1 = requirements.length; l < len1; l++) {
        j = requirements[l];
        if (j[0] === i.name) {
          if (j[1] <= i.value) {
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
  };

  InventoryManager.prototype.setValue = function(parsed, newValue) {
    var getValueArrayLast, value;
    util.checkFormat(parsed, 'string');
    getValueArrayLast = this.getValueArrayLast(parsed);
    value = parser.findValue(parsed, false);
    return value[getValueArrayLast] = newValue;
  };

  InventoryManager.prototype.increaseValue = function(parsed, change) {
    var getValueArrayLast, value;
    util.checkFormat(parsed, 'string');
    getValueArrayLast = this.getValueArrayLast(parsed);
    value = parser.findValue(parsed, false);
    value[getValueArrayLast] = value[getValueArrayLast] + change;
    if (!isNaN(parseFloat(value[getValueArrayLast]))) {
      return value[getValueArrayLast] = parseFloat(value[getValueArrayLast].toFixed(data.game.settings.floatPrecision));
    }
  };

  InventoryManager.prototype.decreaseValue = function(parsed, change) {
    var getValueArrayLast, value;
    util.checkFormat(parsed, 'string');
    getValueArrayLast = this.getValueArrayLast(parsed);
    value = parser.findValue(parsed, false);
    value[getValueArrayLast] = value[getValueArrayLast] - change;
    if (!isNaN(parseFloat(value[getValueArrayLast]))) {
      return value[getValueArrayLast] = parseFloat(value[getValueArrayLast].toFixed(data.game.settings.floatPrecision));
    }
  };

  InventoryManager.prototype.getValueArrayLast = function(parsed) {
    var getValueArrayLast;
    getValueArrayLast = parsed.split(",");
    getValueArrayLast = getValueArrayLast[getValueArrayLast.length - 1].split(".");
    getValueArrayLast = getValueArrayLast[getValueArrayLast.length - 1];
    return getValueArrayLast;
  };

  InventoryManager.prototype.editItems = function(items, mode) {
    var displayName, hidden, i, itemAdded, j, k, l, len, len1, probability, random, ref, results, value;
    util.checkFormat(items, 'array');
    results = [];
    for (k = 0, len = items.length; k < len; k++) {
      j = items[k];
      hidden = false;
      if (j[0].substring(0, 1) === "!") {
        hidden = true;
        j[0] = j[0].substring(1, j[0].length);
      }
      itemAdded = false;
      ref = data.game.inventories[data.game.currentInventory];
      for (l = 0, len1 = ref.length; l < len1; l++) {
        i = ref[l];
        if (i.name === j[0]) {
          probability = 1;
          if (j.length > 2) {
            displayName = j[2];
            value = parseInt(parser.parseStatement(j[1]));
            if (!isNaN(displayName)) {
              probability = j[2];
              displayName = j.name;
            }
            if (j.length > 3) {
              probability = parseFloat(j[2]);
              displayName = j[3];
            }
          } else {
            displayName = j[0];
            value = parseInt(parser.parseStatement(j[1]));
          }
          random = Math.random();
          if (random < probability) {
            if (mode === "set") {
              if (isNaN(parseInt(j[1]))) {
                i.value = j[1];
              } else {
                i.value = parseInt(j[1]);
              }
            } else if (mode === "add") {
              if (isNaN(parseInt(i.value))) {
                i.value = 0;
              }
              i.value = parseInt(i.value) + value;
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
          }
          itemAdded = true;
        }
      }
      if (!itemAdded && mode !== "remove") {
        probability = 1;
        value = parseInt(parser.parseStatement(j[1]));
        if (isNaN(value)) {
          value = parser.parseStatement(j[1]);
        }
        if (j.length > 2) {
          displayName = j[2];
          if (!isNaN(displayName)) {
            probability = j[2];
            displayName = j.name;
          }
          if (j.length > 3) {
            probability = parseFloat(j[2]);
            displayName = j[3];
          }
        } else {
          displayName = j[0];
        }
        random = Math.random();
        if (displayName === void 0) {
          displayName = j[0];
        }
        if (random < probability) {
          results.push(data.game.inventories[data.game.currentInventory].push({
            "name": j[0],
            "value": value,
            "displayName": displayName,
            "hidden": hidden
          }));
        } else {
          results.push(void 0);
        }
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  return InventoryManager;

})();


/* SCENE MANIPULATION */

SceneManager = (function() {
  function SceneManager() {}

  SceneManager.prototype.tryContinue = function() {
    if (textPrinter.printCompleted && textPrinter.tickSpeedMultiplier === 1) {
      return this.selectChoiceByName("Continue");
    }
  };

  SceneManager.prototype.selectChoice = function(choice) {
    this.exitScene(data.game.currentScene);
    this.readItemEdits(choice);
    this.readSounds(choice, true);
    this.readSaving(choice);
    this.readExecutes(choice);
    this.readCheckpoints(choice);
    if (choice.nextScene !== "") {
      return this.changeScene(choice.nextScene);
    } else if (choice.nextScene === "") {
      if (choice.nextChoice !== void 0) {
        return this.selectChoiceByName(this.selectRandomOption(choice.nextChoice));
      } else {
        return this.updateScene(data.game.currentScene, true);
      }
    }
  };

  SceneManager.prototype.selectChoiceByNameByClicking = function(event, name) {
    event.stopPropagation();
    event.preventDefault();
    return this.selectChoiceByName(name);
  };

  SceneManager.prototype.selectChoiceByName = function(name) {
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
  };

  SceneManager.prototype.exitScene = function(scene) {
    return ui.updateInputs(false);
  };

  SceneManager.prototype.changeScene = function(sceneNames) {
    var scene;
    util.checkFormat(sceneNames, 'string');
    scene = this.findSceneByName(this.selectRandomOption(sceneNames));
    this.setupScene(scene);
    return scene;
  };

  SceneManager.prototype.setupScene = function(scene) {
    this.updateScene(scene, false);
    this.readItemEdits(data.game.currentScene);
    this.readSounds(data.game.currentScene, false);
    this.readSaving(data.game.currentScene);
    this.readExecutes(data.game.currentScene);
    this.readCheckpoints(data.game.currentScene);
    this.readMisc(data.game.currentScene);
    return textPrinter.printText(scene.parsedText, false);
  };

  SceneManager.prototype.updateScene = function(scene, onlyUpdating) {
    this.combineSceneTexts(scene);
    scene.parsedText = parser.parseText(scene.combinedText);
    data.game.currentScene = scene;
    if (!onlyUpdating) {
      return data.game.parsedChoices = null;
    } else {
      textPrinter.printText(scene.parsedText, true);
      return textPrinter.complete();
    }
  };

  SceneManager.prototype.updateChoices = function() {
    return gameArea.$set('game.parsedChoices', data.game.currentScene.choices.map(function(choice) {
      choice.parsedText = parser.parseText(choice.text);
      if (gameArea.game.settings.alwaysShowDisabledChoices) {
        choice.alwaysShow = true;
      }
      return choice;
    }));
  };

  SceneManager.prototype.selectRandomOption = function(name) {
    var i, k, len, parsed, separate;
    util.checkFormat(name, 'string');
    separate = name.split("|");
    if (separate.length === 1) {
      return separate[0];
    }
    parsed = [];
    for (k = 0, len = separate.length; k < len; k++) {
      i = separate[k];
      i = i.split(",");
      parsed.push(i);
    }
    parsed = this.chooseRandomly(parsed);
    return parsed;
  };

  SceneManager.prototype.chooseRandomly = function(options) {
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
  };

  SceneManager.prototype.findSceneByName = function(name) {
    var i, k, len, ref;
    util.checkFormat(name, 'string');
    ref = data.game.scenes;
    for (k = 0, len = ref.length; k < len; k++) {
      i = ref[k];
      if (i.name === name) {
        return i;
      }
    }
    return console.error("ERROR: Scene by name '" + name + "' not found!");
  };

  SceneManager.prototype.combineSceneTexts = function(s) {
    var i, k, len, ref, results;
    util.checkFormat(s, 'object');
    util.checkFormat(s.text, 'arrayOrString');
    s.combinedText = "";
    if (Object.prototype.toString.call(s.text) === "[object Array]") {
      ref = s.text;
      results = [];
      for (k = 0, len = ref.length; k < len; k++) {
        i = ref[k];
        results.push(s.combinedText = s.combinedText + "<p>" + i + "</p>");
      }
      return results;
    } else {
      return s.combinedText = s.text;
    }
  };

  SceneManager.prototype.readItemEdits = function(source) {
    var k, l, len, len1, len2, m, ref, ref1, ref2, results, val;
    if (source.changeInventory !== void 0) {
      data.game.currentInventory = parser.parseStatement(source.changeInventory);
    }
    if (source.removeItem !== void 0) {
      inventoryManager.editItems(parser.parseItems(source.removeItem), "remove");
    }
    if (source.addItem !== void 0) {
      inventoryManager.editItems(parser.parseItems(source.addItem), "add");
    }
    if (source.setItem !== void 0) {
      inventoryManager.editItems(parser.parseItems(source.setItem), "set");
    }
    if (source.setValue !== void 0) {
      ref = source.setValue;
      for (k = 0, len = ref.length; k < len; k++) {
        val = ref[k];
        inventoryManager.setValue(val.path, parser.parseStatement(val.value.toString()));
      }
    }
    if (source.increaseValue !== void 0) {
      ref1 = source.increaseValue;
      for (l = 0, len1 = ref1.length; l < len1; l++) {
        val = ref1[l];
        inventoryManager.increaseValue(val.path, parser.parseStatement(val.value.toString()));
      }
    }
    if (source.decreaseValue !== void 0) {
      ref2 = source.decreaseValue;
      results = [];
      for (m = 0, len2 = ref2.length; m < len2; m++) {
        val = ref2[m];
        results.push(inventoryManager.decreaseValue(val.path, parser.parseStatement(val.value.toString())));
      }
      return results;
    }
  };

  SceneManager.prototype.readSounds = function(source, clicked) {
    var played;
    played = false;
    if (source.playSound !== void 0) {
      soundManager.playSound(parser.parseStatement(source.playSound), false);
      played = true;
    }
    if (clicked && !played) {
      soundManager.playDefaultClickSound();
    }
    if (source.startMusic !== void 0) {
      soundManager.startMusic(parser.parseStatement(source.startMusic));
    }
    if (source.stopMusic !== void 0) {
      soundManager.stopMusic(parser.parseStatement(source.stopMusic));
    }
    if (source.scrollSound !== void 0) {
      return data.game.currentScene.scrollSound = parser.parseStatement(source.scrollSound);
    } else {
      if (data.game.settings.soundSettings.defaultScrollSound) {
        return data.game.currentScene.scrollSound = data.game.settings.soundSettings.defaultScrollSound;
      } else {
        return data.game.currentScene.scrollSound = void 0;
      }
    }
  };

  SceneManager.prototype.readExecutes = function(source) {
    if (source.executeJs !== void 0) {
      return eval(source.executeJs);
    }
  };

  SceneManager.prototype.readMisc = function(source) {
    if (source.skipEnabled !== void 0) {
      data.game.currentScene.skipEnabled = parser.parseStatement(source.skipEnabled);
    } else {
      data.game.currentScene.skipEnabled = data.game.settings.scrollSettings.textSkipEnabled;
    }
    if (source.scrollSpeed !== void 0) {
      data.game.currentScene.scrollSpeed = source.scrollSpeed;
    } else {
      data.game.currentScene.scrollSpeed = data.game.settings.scrollSettings.defaultScrollSpeed;
    }
    if (source.inventoryHidden !== void 0) {
      return data.inventoryHidden = parser.parseStatement(source.inventoryHidden);
    } else {
      return data.inventoryHidden = false;
    }
  };

  SceneManager.prototype.readSaving = function(source) {
    if (source.saveGame !== void 0) {
      gameManager.saveGame();
    }
    if (source.loadGame !== void 0) {
      return ui.showLoadNotification();
    }
  };

  SceneManager.prototype.readCheckpoints = function(source) {
    var checkpoint, dataChanged, i, k, l, len, len1, ref, ref1, results;
    if (source.saveCheckpoint !== void 0) {
      if (data.game.checkpoints === void 0) {
        data.game.checkpoints = [];
      }
      dataChanged = false;
      ref = data.game.checkpoints;
      for (k = 0, len = ref.length; k < len; k++) {
        i = ref[k];
        if (i.name === parser.parseStatement(source.saveCheckpoint)) {
          i.scene = data.game.currentScene.name;
          dataChanged = true;
        }
      }
      if (!dataChanged) {
        checkpoint = {
          name: parser.parseStatement(source.saveCheckpoint),
          scene: data.game.currentScene.name
        };
        data.game.checkpoints.push(checkpoint);
      }
    }
    if (source.loadCheckpoint !== void 0) {
      if (data.game.checkpoints === void 0) {
        data.game.checkpoints = [];
      }
      ref1 = data.game.checkpoints;
      results = [];
      for (l = 0, len1 = ref1.length; l < len1; l++) {
        i = ref1[l];
        if (i.name === parser.parseStatement(source.loadCheckpoint)) {
          results.push(this.changeScene(i.scene));
        } else {
          results.push(void 0);
        }
      }
      return results;
    }
  };

  SceneManager.prototype.requirementsFilled = function(choice) {
    var k, len, r, reqs, requirements, success;
    reqs = [];
    if (choice.itemRequirement !== void 0) {
      requirements = parser.parseItems(choice.itemRequirement);
      reqs.push(inventoryManager.checkRequirements(requirements));
    }
    if (choice.requirement !== void 0) {
      reqs.push(inventoryManager.parseIfStatement(choice.requirement));
    }
    success = true;
    for (k = 0, len = reqs.length; k < len; k++) {
      r = reqs[k];
      if (r === false) {
        success = false;
      }
    }
    return success;
  };

  return SceneManager;

})();


/* SOUNDS */

SoundManager = (function() {
  function SoundManager() {}

  SoundManager.prototype.playDefaultClickSound = function(name, clicked) {
    return this.playSound(data.game.settings.soundSettings.defaultClickSound, false);
  };

  SoundManager.prototype.playSound = function(name, isMusic) {
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
  };

  SoundManager.prototype.isPlaying = function(name) {
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
  };

  SoundManager.prototype.startMusic = function(name) {
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
  };

  SoundManager.prototype.stopMusic = function(name) {
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
  };

  return SoundManager;

})();


/* TEXT PRINTING (letter by letter etc.) */

TextPrinter = (function() {
  function TextPrinter() {}

  TextPrinter.prototype.fullText = "";

  TextPrinter.prototype.currentOffset = 0;

  TextPrinter.prototype.defaultInterval = 0;

  TextPrinter.prototype.soundBuffer = [];

  TextPrinter.prototype.musicBuffer = [];

  TextPrinter.prototype.stopMusicBuffer = [];

  TextPrinter.prototype.executeBuffer = [];

  TextPrinter.prototype.addItemBuffer = [];

  TextPrinter.prototype.setItemBuffer = [];

  TextPrinter.prototype.removeItemBuffer = [];

  TextPrinter.prototype.buffersExecuted = false;

  TextPrinter.prototype.scrollSound = null;

  TextPrinter.prototype.tickSoundFrequency = 1;

  TextPrinter.prototype.tickCounter = 0;

  TextPrinter.prototype.tickSpeedMultiplier = 1;

  TextPrinter.prototype.speedMod = false;

  TextPrinter.prototype.pause = 0;

  TextPrinter.prototype.interval = 0;

  TextPrinter.prototype.printCompleted = false;

  TextPrinter.prototype.printText = function(text, noBuffers) {
    this.printCompleted = false;
    data.printedText = "";
    if (document.querySelector("#skip-button") !== null) {
      document.querySelector("#skip-button").disabled = false;
    }
    this.fullText = text;
    this.currentOffset = -1;
    this.soundBuffer = [];
    this.musicBuffer = [];
    this.stopMusicBuffer = [];
    this.executeBuffer = [];
    this.addItemBuffer = [];
    this.setItemBuffer = [];
    this.removeItemBuffer = [];
    this.buffersExecuted = false;
    if (noBuffers) {
      this.buffersExecuted = true;
    }
    this.defaultInterval = data.game.currentScene.scrollSpeed;
    this.setTickSoundFrequency(this.defaultInterval);
    return setTimeout(this.onTick(), this.defaultInterval);
  };

  TextPrinter.prototype.trySkip = function() {
    if (data.game.currentScene.skipEnabled) {
      return this.complete();
    }
  };

  TextPrinter.prototype.complete = function() {
    var first, i, k, l, len, len1, len2, len3, m, o, q, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, s, ss, t, u, v;
    this.printCompleted = true;
    this.currentOffset = 0;
    if (document.querySelector("#skip-button") !== null) {
      document.querySelector("#skip-button").disabled = true;
    }
    if (!this.buffersExecuted) {
      ss = [];
      first = true;
      if (this.fullText.indexOf("play-sound") > -1) {
        s = this.fullText.split("play-sound ");
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
          if (!(ref1 = ss[i], indexOf.call(this.soundBuffer, ref1) >= 0)) {
            soundManager.playSound(parser.parseStatement(ss[i]));
          }
        }
      }
      ss = [];
      first = true;
      if (this.fullText.indexOf("play-music") > -1) {
        s = this.fullText.split("play-music ");
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
          if (!(ref3 = ss[i], indexOf.call(this.musicBuffer, ref3) >= 0)) {
            soundManager.startMusic(parser.parseStatement(ss[i]));
          }
        }
      }
      ss = [];
      first = true;
      if (this.fullText.indexOf("stop-music") > -1) {
        s = this.fullText.split("stop-music ");
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
          if (!(ref5 = ss[i], indexOf.call(this.stopMusicBuffer, ref5) >= 0)) {
            soundManager.stopMusic(parser.parseStatement(ss[i]));
          }
        }
      }
      ss = [];
      first = true;
      if (this.fullText.indexOf("execute-command") > -1) {
        s = this.fullText.split("execute-command ");
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
          if (!(ref7 = ss[i], indexOf.call(this.executeBuffer, ref7) >= 0) && ss[i] !== void 0) {
            eval(data.parsedJavascriptCommands[parseInt(s.substring(4, s.length))]);
          }
        }
      }
      this.buffersExecuted = true;
    }
    data.printedText = this.fullText;
    return sceneManager.updateChoices();
  };

  TextPrinter.prototype.unpause = function() {
    if (document.querySelector("#continue-button") !== null) {
      document.querySelector("#continue-button").style.display = 'none';
    }
    if (this.pause === "input") {
      return this.pause = 0;
    }
  };

  TextPrinter.prototype.fastScroll = function() {
    if (data.game.currentScene.skipEnabled) {
      return this.tickSpeedMultiplier = data.game.settings.scrollSettings.fastScrollSpeedMultiplier;
    }
  };

  TextPrinter.prototype.stopFastScroll = function() {
    return this.tickSpeedMultiplier = 1;
  };

  TextPrinter.prototype.setTickSoundFrequency = function(freq) {
    var threshold;
    threshold = data.game.settings.scrollSettings.tickFreqThreshold;
    this.tickSoundFrequency = 1;
    if (freq <= (threshold * 2)) {
      this.tickSoundFrequency = 2;
    }
    if (freq <= threshold) {
      return this.tickSoundFrequency = 3;
    }
  };

  TextPrinter.prototype.onTick = function() {
    var offsetChanged;
    if (this.pause !== "input" && this.pause > 0) {
      this.pause--;
    }
    if (this.pause === 0) {
      if (!this.speedMod) {
        this.interval = this.defaultInterval;
      }
      if (this.defaultInterval === 0) {
        this.complete();
        return;
      }
      if (data.printedText === this.fullText) {
        return;
      }
      offsetChanged = false;
      while (this.fullText[this.currentOffset] === ' ' || this.fullText[this.currentOffset] === '<' || this.fullText[this.currentOffset] === '>') {
        this.readTags();
      }
      data.printedText = this.fullText.substring(0, this.currentOffset);
      if (!offsetChanged) {
        this.currentOffset++;
      }
      if (this.currentOffset >= this.fullText.length) {
        this.complete();
        return;
      }
      this.tickCounter++;
      if (this.tickCounter >= this.tickSoundFrequency) {
        if (this.scrollSound !== "none" && this.interval !== 0) {
          if (this.scrollSound !== null) {
            soundManager.playSound(this.scrollSound);
          } else if (data.game.currentScene.scrollSound !== void 0) {
            soundManager.playSound(data.game.currentScene.scrollSound);
          }
          this.tickCounter = 0;
        }
      }
    }
    this.setTickSoundFrequency(this.interval / this.tickSpeedMultiplier);
    return setTimeout((function() {
      textPrinter.onTick();
    }), this.interval / this.tickSpeedMultiplier);
  };

  TextPrinter.prototype.readTags = function() {
    var disp, i, s, spans, str;
    if (this.fullText[this.currentOffset] === ' ') {
      this.currentOffset++;
    }
    if (this.fullText[this.currentOffset] === '>') {
      this.currentOffset++;
    }
    if (this.fullText[this.currentOffset] === '<') {
      i = this.currentOffset;
      str = "";
      i++;
      while (this.fullText[i - 1] !== '>' && this.fullText[i] !== '<') {
        str = str + this.fullText[i];
        i++;
      }
      str = str.substring(1, str.length);
      if (str.indexOf("display:none;") > -1) {
        disp = "";
        spans = 1;
        while (true) {
          i++;
          disp = disp + this.fullText[i];
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
        this.soundBuffer.push(parser.parseStatement(s));
      }
      if (str.indexOf("play-music") > -1 && str.indexOf("display:none;") > -1) {
        s = str.split("play-music ");
        s = s[1].split(/\s|\"/)[0];
        this.musicBuffer.push(parser.parseStatement(s));
      }
      if (str.indexOf("stop-music") > -1 && str.indexOf("display:none;") > -1) {
        s = str.split("stop-music ");
        s = s[1].split(/\s|\"/)[0];
        this.stopMusicBuffer.push(parser.parseStatement(s));
      }
      if (str.indexOf("execute-command") > -1 && str.indexOf("display:none;") > -1) {
        s = str.split("execute-command ");
        s = s[1].split(/\s|\"/)[0];
        this.executeBuffer.push(parser.parseStatement(s));
      }
      if (str.indexOf("display:none;") === -1) {
        if (str.indexOf("play-sound") > -1) {
          s = str.split("play-sound ");
          s = s[1].split(/\s|\"/)[0];
          this.soundBuffer.push(parser.parseStatement(s));
          soundManager.playSound(parser.parseStatement(s));
        }
        if (str.indexOf("play-music") > -1) {
          s = str.split("play-music ");
          s = s[1].split(/\s|\"/)[0];
          this.musicBuffer.push(parser.parseStatement(s));
          soundManager.startMusic(parser.parseStatement(s));
        }
        if (str.indexOf("stop-music") > -1) {
          s = str.split("stop-music ");
          s = s[1].split(/\s|\"/)[0];
          this.stopMusicBuffer.push(parser.parseStatement(s));
          soundManager.stopMusic(parser.parseStatement(s));
        }
        if (str.indexOf("pause") > -1) {
          s = str.split("pause ");
          s = s[1].split(/\s|\"/)[0];
          this.pause = s;
          if (document.querySelector("#continue-button") !== null) {
            document.querySelector("#continue-button").style.display = 'inline';
          }
        }
        if (str.indexOf("execute-command") > -1) {
          s = str.split("execute-command ");
          s = s[1].split(/\s|\"/)[0];
          this.executeBuffer.push(s);
          if (s !== void 0) {
            eval(data.parsedJavascriptCommands[parseInt(s.substring(4, s.length))]);
          }
        }
        if (str.indexOf("set-speed") > -1) {
          s = str.split("set-speed ");
          s = s[1].split(/\s|\"/)[0];
          this.interval = parser.parseStatement(s);
          this.speedMod = true;
        }
        if (str.indexOf("default-speed") > -1) {
          this.interval = this.defaultInterval;
          this.speedMod = false;
        }
        if (str.indexOf("set-scroll-sound") > -1) {
          s = str.split("set-scroll-sound ");
          s = s[1].split(/\s|\"/)[0];
          this.scrollSound = parser.parseStatement(s);
        }
        if (str.indexOf("default-scroll-sound") > -1) {
          this.scrollSound = null;
        }
      }
      this.currentOffset = i;
      return this.offsetChanged = true;
    }
  };

  return TextPrinter;

})();


/* UI SCRIPTS */

UI = (function() {
  function UI() {}

  UI.prototype.showSaveNotification = function(text) {
    var e, textArea;
    e = document.getElementById("save-notification");
    textArea = e.querySelectorAll("textarea");
    textArea[0].value = text;
    return e.style.display = 'block';
  };

  UI.prototype.closeSaveNotification = function() {
    var e;
    e = document.getElementById("save-notification");
    return e.style.display = 'none';
  };

  UI.prototype.showLoadNotification = function() {
    var e;
    if (gameArea.game.settings.saveMode === "text") {
      e = document.getElementById("load-notification");
      return e.style.display = 'block';
    } else {
      return gameManager.loadGame();
    }
  };

  UI.prototype.closeLoadNotification = function(load) {
    var e, textArea;
    e = document.getElementById("load-notification");
    if (load) {
      textArea = e.querySelectorAll("textarea");
      gameManager.loadGame(textArea[0].value);
      textArea[0].value = "";
    }
    return e.style.display = 'none';
  };

  UI.prototype.updateInputs = function(needForUpdate) {
    var a, i, inputs, k, len, results;
    inputs = document.getElementById("game-area").querySelectorAll("input");
    results = [];
    for (k = 0, len = inputs.length; k < len; k++) {
      i = inputs[k];
      results.push((function() {
        var l, len1, ref, results1;
        ref = data.game.inventories[data.game.currentInventory];
        results1 = [];
        for (l = 0, len1 = ref.length; l < len1; l++) {
          a = ref[l];
          if (a.name === i.className.substring(6, i.className.length)) {
            a.value = util.stripHTML(i.value);
            if (needForUpdate) {
              results1.push(sceneManager.updateScene(data.game.currentScene, true));
            } else {
              results1.push(void 0);
            }
          } else {
            results1.push(void 0);
          }
        }
        return results1;
      })());
    }
    return results;
  };

  return UI;

})();

copyButton = document.querySelector('#copy-button');

if (copyButton !== null) {
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
}


/* UTILITY SCRIPTS */

Util = (function() {
  function Util() {}

  Util.prototype.isEven = function(n) {
    return n % 2 === 0;
  };

  Util.prototype.isOdd = function(n) {
    return Math.abs(n % 2) === 1;
  };

  Util.prototype.stripHTML = function(text) {
    var regex;
    regex = /(<([^>]+)>)/ig;
    return text.replace(regex, '');
  };

  Util.prototype.checkFormat = function(s, format) {
    if (format === 'array') {
      if (Object.prototype.toString.call(s) === '[object Array]') {
        return true;
      } else {
        console.error("ERROR: Invalid input format (should be " + format + ")");
        return false;
      }
    } else if (format === 'arrayOrString') {
      if (Object.prototype.toString.call(s) === '[object Array]' || typeof s === 'string') {
        return true;
      } else {
        console.error("ERROR: Invalid input format in (should be " + format + ")");
        return false;
      }
    } else {
      if (typeof s === format) {
        return true;
      } else {
        console.error("ERROR: Invalid input format in (should be " + format + ")");
        return false;
      }
    }
  };

  Util.prototype.validateParentheses = function(s) {
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
  };

  return Util;

})();

data = {
  game: null,
  choices: null,
  debugMode: false,
  inventoryHidden: false,
  printedText: "",
  parsedJavascriptCommands: [],
  music: []
};

gamePath = './game';

gameManager = new GameManager;

inputManager = new InputManager;

inventoryManager = new InventoryManager;

parser = new Parser;

sceneManager = new SceneManager;

soundManager = new SoundManager;

textPrinter = new TextPrinter;

ui = new UI;

util = new Util;


/* GAME AREA */

gameArea = new Vue({
  el: '#game-area',
  data: data,
  methods: {
    requirementsFilled: function(choice) {
      return sceneManager.requirementsFilled(choice);
    },
    textSkipEnabled: function(choice) {
      return data.game.currentScene.skipEnabled && data.game.settings.skipButtonShown;
    },
    itemsOverZeroAndAreHidden: function(item) {
      var i, k, len, ref;
      ref = data.game.inventories[data.game.currentInventory];
      for (k = 0, len = ref.length; k < len; k++) {
        i = ref[k];
        if (i.name === item.name && (i.hidden && i.hidden !== void 0)) {
          if (i.value > 0) {
            return true;
          }
          if (isNaN(i.value)) {
            return true;
          }
        }
      }
      return false;
    },
    itemsOverZeroAndNotHidden: function(item) {
      var i, k, len, ref;
      ref = data.game.inventories[data.game.currentInventory];
      for (k = 0, len = ref.length; k < len; k++) {
        i = ref[k];
        if (i.name === item.name && (!i.hidden || i.hidden === void 0)) {
          if (i.value > 0) {
            return true;
          }
          if (isNaN(i.value)) {
            return true;
          }
        }
      }
      return false;
    },
    itemsOverZeroAndHidden: function(item) {
      return inventoryManager.itemsOverZero(item) && inventoryManager.itemHidden(item);
    },
    selectChoice: function(choice) {
      return sceneManager.selectChoice(choice);
    }
  }
});


/* And finally, start the game... */

gameManager.startGame();
