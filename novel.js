
/* SAVING AND LOADING */
var InputManager, InventoryManager, NovelManager, Parser, SceneManager, SoundManager, TextPrinter, UI, Util, copyButton, novelArea, novelData, novelPath,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

NovelManager = (function() {
  var instance;

  instance = null;

  function NovelManager() {
    if (instance) {
      return instance;
    } else {
      instance = this;
    }
  }

  NovelManager.loadCookie = function(cname) {
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
  };

  NovelManager.saveCookie = function(cname, cvalue, exdays) {
    var d, expires;
    d = new Date;
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    expires = 'expires=' + d.toUTCString();
    return document.cookie = cname + '=' + cvalue + '; ' + expires + '; path=/';
  };

  NovelManager.loadData = function(novel, changeScene) {
    var cookie, loadedData;
    if (changeScene === void 0) {
      changeScene = true;
    }
    if (novel === void 0) {
      if (this.loadCookie("gameData") !== '') {
        console.log("Cookie found!");
        cookie = this.loadCookie("gameData");
        console.log("Cookie loaded");
        console.log(cookie);
        loadedData = JSON.parse(atob(this.loadCookie("gameData")));
        return this.prepareLoadedData(loadedData, changeScene);
      }
    } else if (novel !== void 0) {
      loadedData = JSON.parse(atob(novel));
      return this.prepareLoadedData(loadedData, changeScene);
    }
  };

  NovelManager.prepareLoadedData = function(loadedData, changeScene) {
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
      return SceneManager.updateScene(loadedData.currentScene, true);
    }
  };

  NovelManager.saveDataAsJson = function() {
    var save, saveData;
    saveData = JSON.parse(JSON.stringify(novelData.novel));
    delete saveData.scenes;
    delete saveData.tagPresets;
    delete saveData.sounds;
    delete saveData.externalText;
    delete saveData.externalJson;
    save = btoa(JSON.stringify(saveData));
    return save;
  };

  NovelManager.saveData = function() {
    var save;
    save = this.saveDataAsJson();
    if (novelData.novel.settings.saveMode === "cookie") {
      return this.saveCookie("novelData", save, 365);
    } else if (novelData.novel.settings.saveMode === "text") {
      return UI.showSaveNotification(save);
    }
  };

  NovelManager.prepareData = function(json) {
    var c, i, j, k, l, len, len1, len2, o, ref, ref1, results, s;
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
    results = [];
    for (o = 0, len2 = ref1.length; o < len2; o++) {
      s = ref1[o];
      s.combinedText = "";
      s.parsedText = "";
      s.visited = false;
      if (s.text === void 0) {
        console.warn("WARNING! scene " + s.name + " has no text");
        s.text = "";
      }
      if (s.choices === void 0) {
        console.warn("WARNING! scene " + s.name + " has no choices");
        s.choices = [];
      }
      results.push((function() {
        var len3, q, ref2, results1;
        ref2 = s.choices;
        results1 = [];
        for (q = 0, len3 = ref2.length; q < len3; q++) {
          c = ref2[q];
          c.parsedText = "";
          if (c.alwaysShow === void 0) {
            results1.push(c.alwaysShow = false);
          } else {
            results1.push(void 0);
          }
        }
        return results1;
      })());
    }
    return results;
  };

  NovelManager.start = function() {
    console.log("-- Starting Novel.js... --");
    return this.loadMainJson();
  };

  NovelManager.loadMainJson = function() {
    var request;
    console.log("Loading main json...");
    request = new XMLHttpRequest;
    request.open('GET', novelPath + '/novel.json', true);
    request.onload = function() {
      var json;
      if (request.status >= 200 && request.status < 400) {
        json = JSON.parse(request.responseText);
        return NovelManager.loadExternalJson(json);
      }
    };
    request.onerror = function() {};
    request.send();
    if (document.querySelector("#continue-button") !== null) {
      return document.querySelector("#continue-button").style.display = 'none';
    }
  };

  NovelManager.loadExternalJson = function(json) {
    var k, len, ready, ref, results, s;
    console.log("Loading external json files...");
    ready = 0;
    ref = json.externalJson;
    results = [];
    for (k = 0, len = ref.length; k < len; k++) {
      s = ref[k];
      results.push((function(s) {
        var request;
        request = new XMLHttpRequest;
        request.open('GET', novelPath + '/json/' + s.file, true);
        request.onload = function() {
          if (request.status >= 200 && request.status < 400) {
            s.content = JSON.parse(request.responseText);
            ready++;
            if (ready === json.externalJson.length) {
              NovelManager.includeJsons(json, json);
              NovelManager.loadExternalText(json);
            }
          }
        };
        request.onerror = function() {};
        return request.send();
      })(s));
    }
    return results;
  };

  NovelManager.includeJsons = function(root, object) {
    var i, results, x;
    results = [];
    for (x in object) {
      if (typeof object[x] === 'object') {
        this.includeJsons(root, object[x]);
      }
      if (object[x].include !== void 0) {
        results.push((function() {
          var k, len, ref, results1;
          ref = root.externalJson;
          results1 = [];
          for (k = 0, len = ref.length; k < len; k++) {
            i = ref[k];
            if (i.name === object[x].include) {
              object[x] = i.content;
              this.includeJsons(root, object[x]);
              break;
            } else {
              results1.push(void 0);
            }
          }
          return results1;
        }).call(this));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  NovelManager.loadExternalText = function(json) {
    var k, len, ready, ref, results, s;
    console.log("Loading external text files...");
    ready = 0;
    ref = json.externalText;
    results = [];
    for (k = 0, len = ref.length; k < len; k++) {
      s = ref[k];
      results.push((function(s) {
        var request;
        request = new XMLHttpRequest;
        request.open('GET', novelPath + '/texts/' + s.file, true);
        request.onload = function() {
          if (request.status >= 200 && request.status < 400) {
            s.content = request.responseText;
            ready++;
            if (ready === json.externalText.length) {
              NovelManager.prepareLoadedJson(json);
            }
          }
        };
        request.onerror = function() {};
        return request.send();
      })(s));
    }
    return results;
  };

  NovelManager.prepareLoadedJson = function(json) {
    this.prepareData(json);
    novelData.novel = json;
    novelData.debugMode = novelData.novel.debugMode;
    SoundManager.init();
    novelData.novel.currentScene = SceneManager.changeScene(novelData.novel.scenes[0].name);
    novelData.status = "Ready";
    return console.log("-- Loading Novel.js complete! --");
  };

  return NovelManager;

})();


/* HANDLES KEYBOARD INPUT */

InputManager = (function() {
  var instance;

  instance = null;

  function InputManager() {
    if (instance) {
      return instance;
    } else {
      instance = this;
    }
  }

  InputManager.presses = 0;

  InputManager.keyDown = function(charCode) {
    if (this.formsSelected()) {
      return;
    }
    if (charCode === 13 || charCode === 32) {
      if (novelData.novel.settings.scrollSettings.continueWithKeyboard) {
        SceneManager.tryContinue();
      }
      if (novelData.novel.settings.scrollSettings.skipWithKeyboard) {
        TextPrinter.trySkip();
      }
      return TextPrinter.unpause();
    }
  };

  InputManager.keyPressed = function(charCode) {
    if (this.formsSelected()) {
      return;
    }
    this.presses++;
    if (charCode === 13 || charCode === 32) {
      if (this.presses > 2) {
        if (novelData.novel.settings.scrollSettings.fastScrollWithKeyboard) {
          return TextPrinter.fastScroll();
        }
      }
    }
  };

  InputManager.keyUp = function(charCode) {
    if (this.formsSelected()) {
      return;
    }
    this.presses = 0;
    if (charCode === 13 || charCode === 32) {
      return TextPrinter.stopFastScroll();
    }
  };

  InputManager.formsSelected = function() {
    var i, inputs, k, len;
    inputs = document.getElementById("novel-area").querySelectorAll("input");
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
  return InputManager.keyDown(charCode);
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


/* PARSERS */

Parser = (function() {
  var instance;

  instance = null;

  function Parser() {
    if (instance) {
      return instance;
    } else {
      instance = this;
    }
  }

  Parser.selectRandomOption = function(name) {
    var i, k, len, parsed, separate;
    Util.checkFormat(name, 'string');
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

  Parser.chooseRandomly = function(options) {
    var chances, i, k, l, len, len1, len2, nameIndex, names, o, previous, rawChances, totalChance, value;
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
    for (o = 0, len2 = chances.length; o < len2; o++) {
      i = chances[o];
      if (value < i) {
        return names[nameIndex];
      }
      nameIndex++;
    }
  };

  Parser.parseItems = function(items) {
    var i, k, len, parsed, separate;
    Util.checkFormat(items, 'string');
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

  Parser.parseText = function(text) {
    var asToBeClosed, i, index, k, l, len, len1, len2, len3, len4, len5, name, nameText, newText, o, p, parsed, q, ref, ref1, ref2, ref3, ref4, ref5, ref6, s, spansToBeClosed, splitText, t, tagName, u, v, value, w, y;
    if (text !== void 0) {
      Util.checkFormat(text, 'string');
      if (!Util.validateTagParentheses(text)) {
        console.error("ERROR: Invalid tags in text");
      }
      splitText = text.split("[file ");
      for (index = k = 1, ref = splitText.length; 1 <= ref ? k <= ref : k >= ref; index = 1 <= ref ? ++k : --k) {
        name = "";
        if (splitText[index]) {
          ref1 = splitText[index].split('');
          for (l = 0, len = ref1.length; l < len; l++) {
            i = ref1[l];
            if (i !== ']') {
              name = name + i;
            } else {
              break;
            }
          }
        }
        name = name.replace(/\s+/g, '');
        if (name !== "") {
          newText = null;
          ref2 = novelData.novel.externalText;
          for (o = 0, len1 = ref2.length; o < len1; o++) {
            i = ref2[o];
            if (i.name === name) {
              newText = i.content;
              break;
            }
          }
          if (newText !== null) {
            text = text.split("[file " + name + "]").join(newText);
          }
        }
      }
      ref3 = novelData.novel.tagPresets;
      for (q = 0, len2 = ref3.length; q < len2; q++) {
        i = ref3[q];
        tagName = "[p " + i.name + "]";
        if (text.indexOf(tagName) > -1) {
          text = text.split(tagName).join(i.start);
        }
        tagName = "[/p " + i.name + "]";
        if (text.indexOf(tagName) > -1) {
          text = text.split(tagName).join(i.end);
        }
      }
      for (i = t = 0; t <= 99; i = ++t) {
        text = text.split("[s" + i + "]").join("<span class=\"highlight-" + i + "\">");
      }
      text = text.split("[/s]").join("</span>");
      text = text.replace(/\/\[/g, "OPEN_BRACKET_REPLACEMENT").replace(/\/\]/g, "CLOSE_BRACKET_REPLACEMENT");
      splitText = text.split(/\[|\]/);
      index = 0;
      for (u = 0, len3 = splitText.length; u < len3; u++) {
        s = splitText[u];
        splitText[index] = s.replace(/OPEN_BRACKET_REPLACEMENT/g, "[").replace(/CLOSE_BRACKET_REPLACEMENT/g, "]");
        index++;
      }
      spansToBeClosed = 0;
      asToBeClosed = 0;
      index = 0;
      for (index = v = 0, ref4 = splitText.length - 1; 0 <= ref4 ? v <= ref4 : v >= ref4; index = 0 <= ref4 ? ++v : --v) {
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
          ref5 = novelData.novel.inventories[novelData.novel.currentInventory];
          for (w = 0, len4 = ref5.length; w < len4; w++) {
            i = ref5[w];
            if (i.name === value) {
              splitText[index] = i.value;
            }
          }
        } else if (s.substring(0, 5) === "print") {
          parsed = s.split("print ");
          parsed = this.parseStatement(parsed[1]);
          if (!isNaN(parseFloat(parsed))) {
            parsed = parseFloat(parsed.toFixed(novelData.novel.settings.floatPrecision));
          }
          splitText[index] = parsed;
        } else if (s.substring(0, 4) === "exec") {
          parsed = s.substring(5, s.length);
          p = novelData.parsedJavascriptCommands.push(parsed);
          p--;
          splitText[index] = "<span class=\"execute-command com-" + p + "\"></span>";
        } else if (s.substring(0, 5) === "pause") {
          parsed = s.substring(6, s.length);
          splitText[index] = "<span class=\"pause " + parsed + "\"></span>";
        } else if (s.substring(0, 5) === "sound") {
          parsed = s.split("sound ");
          splitText[index] = "<span class=\"play-sound " + parsed[1] + "\"></span>";
        } else if (s.substring(0, 6) === "/music") {
          parsed = s.split("/music ");
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
          ref6 = novelData.novel.inventories[novelData.novel.currentInventory];
          for (y = 0, len5 = ref6.length; y < len5; y++) {
            i = ref6[y];
            if (i.name === parsed[1]) {
              nameText = i.value;
            }
          }
          splitText[index] = "<input type=\"text\" value=\"" + nameText + "\" name=\"input\" class=\"input-" + parsed[1] + "\" onblur=\"ui.updateInputs(true)\">";
        } else if (s.substring(0, 6) === "choice") {
          parsed = s.split("choice ");
          splitText[index] = "<a href=\"#\" onclick=\"SceneManager.selectChoiceByNameByClicking(event,'" + parsed[1] + "')\">";
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

  Parser.parseStatement = function(s) {
    var found, i, k, l, len, len1, o, parsedString, parsedValues, plus, ref, ref1, result, returnVal, type, val, vals;
    if (s === void 0) {
      return void 0;
    }
    s = s.toString();
    Util.checkFormat(s, 'string');
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
          found = false;
          ref = novelData.novel.inventories[novelData.novel.currentInventory];
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
            val = parseFloat(val).toFixed(novelData.novel.settings.floatPrecision);
          } else {
            val = "'" + val + "'";
          }
          parsedValues.push(val);
          break;
        case "float":
          parsedValues.push(parseFloat(val).toFixed(novelData.novel.settings.floatPrecision));
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
    for (i = o = 0, ref1 = parsedString.length - 1; 0 <= ref1 ? o <= ref1 : o >= ref1; i = 0 <= ref1 ? ++o : --o) {
      if (parsedString[i] !== "" && parsedValues[i] !== "") {
        parsedString[i] = parsedString[i].replace("{", "\{");
        parsedString[i] = parsedString[i].replace("}", "\}");
        s = s.replace(new RegExp(parsedString[i], 'g'), parsedValues[i]);
      }
    }
    returnVal = eval(s);
    if (returnVal === "true") {
      returnVal = true;
    }
    if (returnVal === "false") {
      returnVal = false;
    }
    return returnVal;
  };

  Parser.getStatementType = function(val) {
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

  Parser.findValue = function(parsed, toPrint) {
    var i, k, ref, splitted, variable;
    splitted = parsed.split(",");
    if (!toPrint) {
      if (splitted.length > 1) {
        variable = this.findValueByName(novelData.novel, splitted[0])[0];
      } else {
        variable = this.findValueByName(novelData.novel, splitted[0])[1];
      }
    } else {
      variable = this.findValueByName(novelData.novel, splitted[0])[0];
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
            variable.parsedText = this.parseText(variable.text);
          }
          variable = this.findValueByName(variable, splitted[i])[0];
        }
      }
    }
    if (variable === void 0) {
      console.warn("WARNING: Searched value not found.");
    }
    return variable;
  };

  Parser.findValueByName = function(obj, string) {
    var newObj, newString, parts, r;
    Util.checkFormat(string, 'string');
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
  var instance;

  instance = null;

  function InventoryManager() {
    if (instance) {
      return instance;
    } else {
      instance = this;
    }
  }

  InventoryManager.checkRequirements = function(requirements) {
    var i, j, k, l, len, len1, ref, reqsFilled;
    Util.checkFormat(requirements, 'array');
    reqsFilled = 0;
    ref = novelData.novel.inventories[novelData.novel.currentInventory];
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

  InventoryManager.setValue = function(parsed, newValue) {
    var getValueArrayLast, value;
    Util.checkFormat(parsed, 'string');
    getValueArrayLast = this.getValueArrayLast(parsed);
    value = Parser.findValue(parsed, false);
    return value[getValueArrayLast] = newValue;
  };

  InventoryManager.increaseValue = function(parsed, change) {
    var getValueArrayLast, value;
    Util.checkFormat(parsed, 'string');
    getValueArrayLast = this.getValueArrayLast(parsed);
    value = Parser.findValue(parsed, false);
    value[getValueArrayLast] = value[getValueArrayLast] + change;
    if (!isNaN(parseFloat(value[getValueArrayLast]))) {
      return value[getValueArrayLast] = parseFloat(value[getValueArrayLast].toFixed(novelData.novel.settings.floatPrecision));
    }
  };

  InventoryManager.decreaseValue = function(parsed, change) {
    var getValueArrayLast, value;
    Util.checkFormat(parsed, 'string');
    getValueArrayLast = this.getValueArrayLast(parsed);
    value = Parser.findValue(parsed, false);
    value[getValueArrayLast] = value[getValueArrayLast] - change;
    if (!isNaN(parseFloat(value[getValueArrayLast]))) {
      return value[getValueArrayLast] = parseFloat(value[getValueArrayLast].toFixed(novelData.novel.settings.floatPrecision));
    }
  };

  InventoryManager.getValueArrayLast = function(parsed) {
    var getValueArrayLast;
    getValueArrayLast = parsed.split(",");
    getValueArrayLast = getValueArrayLast[getValueArrayLast.length - 1].split(".");
    getValueArrayLast = getValueArrayLast[getValueArrayLast.length - 1];
    return getValueArrayLast;
  };

  InventoryManager.addItems = function(items) {
    return this.editItems(items, "add");
  };

  InventoryManager.setItems = function(items) {
    return this.editItems(items, "set");
  };

  InventoryManager.removeItems = function(items) {
    return this.editItems(items, "remove");
  };

  InventoryManager.editItems = function(items, mode) {
    var hidden, itemAdded, j, k, len, results;
    Util.checkFormat(items, 'array');
    results = [];
    for (k = 0, len = items.length; k < len; k++) {
      j = items[k];
      hidden = false;
      if (j[0].substring(0, 1) === "!") {
        hidden = true;
        j[0] = j[0].substring(1, j[0].length);
      }
      itemAdded = this.tryEditInInventory(mode, j, hidden);
      if (!itemAdded) {
        results.push(this.tryEditNotInInventory(mode, j, hidden));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  InventoryManager.tryEditInInventory = function(mode, j, hidden) {
    var displayName, i, k, len, probability, random, ref, value;
    ref = novelData.novel.inventories[novelData.novel.currentInventory];
    for (k = 0, len = ref.length; k < len; k++) {
      i = ref[k];
      if (i.name === j[0]) {
        probability = 1;
        if (j.length > 2) {
          displayName = j[2];
          value = parseInt(Parser.parseStatement(j[1]));
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
          value = parseInt(Parser.parseStatement(j[1]));
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
          i.hidden = hidden;
        }
        return true;
      }
    }
    return false;
  };

  InventoryManager.tryEditNotInInventory = function(mode, j, hidden) {
    var displayName, probability, random, value;
    if (mode !== "remove") {
      probability = 1;
      value = parseInt(Parser.parseStatement(j[1]));
      if (isNaN(value)) {
        value = Parser.parseStatement(j[1]);
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
        return novelData.novel.inventories[novelData.novel.currentInventory].push({
          "name": j[0],
          "value": value,
          "displayName": displayName,
          "hidden": hidden
        });
      }
    }
  };

  return InventoryManager;

})();


/* SCENE MANIPULATION */

SceneManager = (function() {
  var instance;

  instance = null;

  function SceneManager() {
    if (instance) {
      return instance;
    } else {
      instance = this;
    }
  }

  SceneManager.tryContinue = function() {
    if (TextPrinter.printCompleted && TextPrinter.tickSpeedMultiplier === 1) {
      return this.selectChoiceByName("Continue");
    }
  };

  SceneManager.selectChoice = function(choice) {
    this.exitScene(novelData.novel.currentScene);
    this.readItemEdits(choice);
    this.readSounds(choice, true);
    this.readSaving(choice);
    this.readExecutes(choice);
    this.readCheckpoints(choice);
    if (choice.nextScene !== void 0) {
      return this.changeScene(choice.nextScene);
    } else {
      if (choice.nextChoice !== void 0) {
        return this.selectChoiceByName(Parser.selectRandomOption(choice.nextChoice));
      } else {
        return this.updateScene(novelData.novel.currentScene, true);
      }
    }
  };

  SceneManager.selectChoiceByNameByClicking = function(event, name) {
    event.stopPropagation();
    event.preventDefault();
    return this.selectChoiceByName(name);
  };

  SceneManager.selectChoiceByName = function(name) {
    var i, k, len, ref, results;
    ref = novelData.novel.currentScene.choices;
    results = [];
    for (k = 0, len = ref.length; k < len; k++) {
      i = ref[k];
      if (i.name === name) {
        novelArea.selectChoice(i);
        break;
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  SceneManager.exitScene = function(scene) {
    scene.visited = true;
    return UI.updateInputs(false);
  };

  SceneManager.changeScene = function(sceneNames) {
    var scene;
    Util.checkFormat(sceneNames, 'string');
    scene = this.findSceneByName(Parser.selectRandomOption(sceneNames));
    this.setupScene(scene);
    return scene;
  };

  SceneManager.setupScene = function(scene) {
    this.updateScene(scene, false);
    this.readItemEdits(novelData.novel.currentScene);
    this.readSounds(novelData.novel.currentScene, false);
    this.readSaving(novelData.novel.currentScene);
    this.readExecutes(novelData.novel.currentScene);
    this.readCheckpoints(novelData.novel.currentScene);
    this.readMisc(novelData.novel.currentScene);
    return TextPrinter.printText(scene.parsedText, false);
  };

  SceneManager.updateScene = function(scene, onlyUpdating) {
    scene = this.combineSceneTexts(scene);
    scene.parsedText = Parser.parseText(scene.combinedText);
    novelData.novel.currentScene = scene;
    if (!onlyUpdating) {
      return novelData.novel.parsedChoices = null;
    } else {
      TextPrinter.printText(scene.parsedText, true);
      return TextPrinter.complete();
    }
  };

  SceneManager.updateChoices = function() {
    return novelArea.$set('novel.parsedChoices', novelData.novel.currentScene.choices.map(function(choice) {
      choice.parsedText = Parser.parseText(choice.text);
      if (novelArea.novel.settings.alwaysShowDisabledChoices) {
        choice.alwaysShow = true;
      }
      return choice;
    }));
  };

  SceneManager.findSceneByName = function(name) {
    var i, k, len, ref;
    Util.checkFormat(name, 'string');
    ref = novelData.novel.scenes;
    for (k = 0, len = ref.length; k < len; k++) {
      i = ref[k];
      if (i.name === name) {
        return i;
      }
    }
    return console.error("ERROR: Scene by name '" + name + "' not found!");
  };

  SceneManager.combineSceneTexts = function(s) {
    var i, k, len, ref;
    Util.checkFormat(s, 'object');
    Util.checkFormat(s.text, 'arrayOrString');
    s.combinedText = "";
    if (Object.prototype.toString.call(s.text) === "[object Array]") {
      ref = s.text;
      for (k = 0, len = ref.length; k < len; k++) {
        i = ref[k];
        s.combinedText = s.combinedText + "<p>" + i + "</p>";
      }
    } else {
      s.combinedText = s.text;
    }
    return s;
  };

  SceneManager.readItemEdits = function(source) {
    var i, k, l, len, len1, len2, o, q, ref, ref1, ref2, ref3, results, val;
    if (source.changeInventory !== void 0) {
      novelData.novel.currentInventory = Parser.parseStatement(source.changeInventory);
      if (novelData.novel.currentInventory > novelData.novel.inventories.length) {
        for (i = k = 0, ref = novelData.novel.currentInventory; 0 <= ref ? k <= ref : k >= ref; i = 0 <= ref ? ++k : --k) {
          if (novelData.novel.inventories[i] === void 0) {
            novelData.novel.inventories[i] = [];
          }
        }
      }
    }
    if (source.removeItem !== void 0) {
      InventoryManager.removeItems(Parser.parseItems(source.removeItem));
    }
    if (source.addItem !== void 0) {
      InventoryManager.addItems(Parser.parseItems(source.addItem));
    }
    if (source.setItem !== void 0) {
      InventoryManager.setItems(Parser.parseItems(source.setItem));
    }
    if (source.setValue !== void 0) {
      ref1 = source.setValue;
      for (l = 0, len = ref1.length; l < len; l++) {
        val = ref1[l];
        InventoryManager.setValue(val.path, Parser.parseStatement(val.value.toString()));
      }
    }
    if (source.increaseValue !== void 0) {
      ref2 = source.increaseValue;
      for (o = 0, len1 = ref2.length; o < len1; o++) {
        val = ref2[o];
        InventoryManager.increaseValue(val.path, Parser.parseStatement(val.value.toString()));
      }
    }
    if (source.decreaseValue !== void 0) {
      ref3 = source.decreaseValue;
      results = [];
      for (q = 0, len2 = ref3.length; q < len2; q++) {
        val = ref3[q];
        results.push(InventoryManager.decreaseValue(val.path, Parser.parseStatement(val.value.toString())));
      }
      return results;
    }
  };

  SceneManager.readSounds = function(source, clicked) {
    var played;
    played = false;
    if (source.playSound !== void 0) {
      SoundManager.playSound(Parser.parseStatement(source.playSound), false);
      played = true;
    }
    if (clicked && !played) {
      SoundManager.playDefaultClickSound();
    }
    if (source.startMusic !== void 0) {
      SoundManager.startMusic(Parser.parseStatement(source.startMusic));
    }
    if (source.stopMusic !== void 0) {
      SoundManager.stopMusic(Parser.parseStatement(source.stopMusic));
    }
    if (source.scrollSound !== void 0) {
      return novelData.novel.currentScene.scrollSound = Parser.parseStatement(source.scrollSound);
    } else {
      if (novelData.novel.settings.soundSettings.defaultScrollSound) {
        return novelData.novel.currentScene.scrollSound = novelData.novel.settings.soundSettings.defaultScrollSound;
      } else {
        return novelData.novel.currentScene.scrollSound = void 0;
      }
    }
  };

  SceneManager.readExecutes = function(source) {
    if (source.executeJs !== void 0) {
      return eval(source.executeJs);
    }
  };

  SceneManager.readMisc = function(source) {
    if (source.skipEnabled !== void 0) {
      novelData.novel.currentScene.skipEnabled = Parser.parseStatement(source.skipEnabled);
    } else {
      novelData.novel.currentScene.skipEnabled = novelData.novel.settings.scrollSettings.textSkipEnabled;
    }
    if (source.revisitSkipEnabled !== void 0) {
      novelData.novel.currentScene.revisitSkipEnabled = Parser.parseStatement(source.revisitSkipEnabled);
    } else {
      novelData.novel.currentScene.revisitSkipEnabled = novelData.novel.settings.scrollSettings.revisitSkipEnabled;
    }
    if (source.scrollSpeed !== void 0) {
      novelData.novel.currentScene.scrollSpeed = source.scrollSpeed;
    } else {
      novelData.novel.currentScene.scrollSpeed = novelData.novel.settings.scrollSettings.defaultScrollSpeed;
    }
    if (source.inventoryHidden !== void 0) {
      novelData.inventoryHidden = Parser.parseStatement(source.inventoryHidden);
    } else {
      novelData.inventoryHidden = novelData.novel.settings.inventoryHidden;
    }
    if (source.choicesHidden !== void 0) {
      return novelData.choicesHidden = Parser.parseStatement(source.choicesHidden);
    } else {
      return novelData.choicesHidden = novelData.novel.settings.choicesHidden;
    }
  };

  SceneManager.readSaving = function(source) {
    if (source.save !== void 0) {
      NovelManager.saveData();
    }
    if (source.load !== void 0) {
      return UI.showLoadNotification();
    }
  };

  SceneManager.readCheckpoints = function(source) {
    var checkpoint, dataChanged, i, k, l, len, len1, ref, ref1, results;
    if (source.saveCheckpoint !== void 0) {
      if (novelData.novel.checkpoints === void 0) {
        novelData.novel.checkpoints = [];
      }
      dataChanged = false;
      ref = novelData.novel.checkpoints;
      for (k = 0, len = ref.length; k < len; k++) {
        i = ref[k];
        if (i.name === Parser.parseStatement(source.saveCheckpoint)) {
          i.scene = novelData.novel.currentScene.name;
          dataChanged = true;
        }
      }
      if (!dataChanged) {
        checkpoint = {
          name: Parser.parseStatement(source.saveCheckpoint),
          scene: novelData.novel.currentScene.name
        };
        novelData.novel.checkpoints.push(checkpoint);
      }
    }
    if (source.loadCheckpoint !== void 0) {
      if (novelData.novel.checkpoints === void 0) {
        novelData.novel.checkpoints = [];
      }
      ref1 = novelData.novel.checkpoints;
      results = [];
      for (l = 0, len1 = ref1.length; l < len1; l++) {
        i = ref1[l];
        if (i.name === Parser.parseStatement(source.loadCheckpoint)) {
          results.push(this.changeScene(i.scene));
        } else {
          results.push(void 0);
        }
      }
      return results;
    }
  };

  SceneManager.requirementsFilled = function(choice) {
    var k, len, r, reqs, requirements, success;
    reqs = [];
    if (choice.itemRequirement !== void 0) {
      requirements = Parser.parseItems(choice.itemRequirement);
      reqs.push(InventoryManager.checkRequirements(requirements));
    }
    if (choice.requirement !== void 0) {
      reqs.push(Parser.parseStatement(choice.requirement));
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
  var instance;

  instance = null;

  function SoundManager() {
    if (instance) {
      return instance;
    } else {
      instance = this;
    }
  }

  SoundManager.init = function() {
    var index, k, len, ref, results, s;
    index = 0;
    ref = novelData.novel.sounds;
    results = [];
    for (k = 0, len = ref.length; k < len; k++) {
      s = ref[k];
      s.sound = new Audio(novelPath + '/sounds/' + s.file);
      results.push(index++);
    }
    return results;
  };

  SoundManager.playDefaultClickSound = function(name, clicked) {
    return this.playSound(novelData.novel.settings.soundSettings.defaultClickSound, false);
  };

  SoundManager.playSound = function(name, isMusic) {
    var k, len, ref, s, sound;
    if (name === void 0) {
      return;
    }
    name = Parser.selectRandomOption(name);
    ref = novelData.novel.sounds;
    for (k = 0, len = ref.length; k < len; k++) {
      s = ref[k];
      if (s.name === name) {
        sound = s.sound;
        if (isMusic) {
          sound.volume = novelData.novel.settings.soundSettings.musicVolume;
        } else {
          sound.volume = novelData.novel.settings.soundSettings.soundVolume;
        }
        sound.play();
        return sound;
      }
    }
  };

  SoundManager.isPlaying = function(name) {
    var i, k, len, ref;
    ref = novelData.music;
    for (k = 0, len = ref.length; k < len; k++) {
      i = ref[k];
      if (i.paused) {
        return false;
      } else {
        return true;
      }
    }
  };

  SoundManager.startMusic = function(name) {
    var k, len, m, music, ref;
    ref = novelData.music;
    for (k = 0, len = ref.length; k < len; k++) {
      m = ref[k];
      if (m.name === name) {
        return;
      }
    }
    music = this.playSound(name, true);
    if (music === void 0) {
      return;
    }
    music.addEventListener('ended', (function() {
      this.currentTime = 0;
      this.play();
    }), false);
    return novelData.music.push({
      "name": name,
      "music": music
    });
  };

  SoundManager.stopMusic = function(name) {
    var i, index, k, len, ref, results;
    ref = novelData.music;
    results = [];
    for (k = 0, len = ref.length; k < len; k++) {
      i = ref[k];
      if (name === i.name) {
        i.music.pause();
        index = novelData.music.indexOf(i);
        results.push(novelData.music.splice(index, 1));
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
  var instance;

  instance = null;

  function TextPrinter() {
    if (instance) {
      return instance;
    } else {
      instance = this;
    }
  }

  TextPrinter.fullText = "";

  TextPrinter.currentOffset = 0;

  TextPrinter.defaultInterval = 0;

  TextPrinter.soundBuffer = [];

  TextPrinter.musicBuffer = [];

  TextPrinter.stopMusicBuffer = [];

  TextPrinter.executeBuffer = [];

  TextPrinter.buffersExecuted = false;

  TextPrinter.scrollSound = null;

  TextPrinter.tickSoundFrequency = 1;

  TextPrinter.tickCounter = 0;

  TextPrinter.tickSpeedMultiplier = 1;

  TextPrinter.speedMod = false;

  TextPrinter.pause = 0;

  TextPrinter.interval = 0;

  TextPrinter.printCompleted = false;

  TextPrinter.printText = function(text, noBuffers) {
    this.printCompleted = false;
    novelData.printedText = "";
    if (document.querySelector("#skip-button") !== null) {
      document.querySelector("#skip-button").disabled = false;
    }
    this.fullText = text;
    this.currentOffset = -1;
    this.soundBuffer = [];
    this.musicBuffer = [];
    this.stopMusicBuffer = [];
    this.executeBuffer = [];
    this.buffersExecuted = false;
    if (noBuffers) {
      this.buffersExecuted = true;
    }
    this.defaultInterval = novelData.novel.currentScene.scrollSpeed;
    this.setTickSoundFrequency(this.defaultInterval);
    if (novelData.novel.currentScene.visited && novelData.novel.currentScene.revisitSkipEnabled) {
      this.complete();
      return;
    }
    return setTimeout(this.onTick(), this.defaultInterval);
  };

  TextPrinter.trySkip = function() {
    if (novelData.novel.currentScene.skipEnabled) {
      return this.complete();
    }
  };

  TextPrinter.complete = function() {
    var first, i, k, l, len, len1, len2, len3, o, q, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, s, ss, t, u, v, w;
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
            SoundManager.playSound(Parser.parseStatement(ss[i]));
          }
        }
      }
      ss = [];
      first = true;
      if (this.fullText.indexOf("play-music") > -1) {
        s = this.fullText.split("play-music ");
        for (o = 0, len1 = s.length; o < len1; o++) {
          i = s[o];
          if (!first) {
            ss.push(i.split(/\s|\"/)[0]);
          }
          first = false;
        }
      }
      if (ss.length > 0) {
        for (i = q = 0, ref2 = ss.length; 0 <= ref2 ? q <= ref2 : q >= ref2; i = 0 <= ref2 ? ++q : --q) {
          if (!(ref3 = ss[i], indexOf.call(this.musicBuffer, ref3) >= 0)) {
            SoundManager.startMusic(Parser.parseStatement(ss[i]));
          }
        }
      }
      ss = [];
      first = true;
      if (this.fullText.indexOf("stop-music") > -1) {
        s = this.fullText.split("stop-music ");
        for (t = 0, len2 = s.length; t < len2; t++) {
          i = s[t];
          if (!first) {
            ss.push(i.split(/\s|\"/)[0]);
          }
          first = false;
        }
      }
      if (ss.length > 0) {
        for (i = u = 0, ref4 = ss.length; 0 <= ref4 ? u <= ref4 : u >= ref4; i = 0 <= ref4 ? ++u : --u) {
          if (!(ref5 = ss[i], indexOf.call(this.stopMusicBuffer, ref5) >= 0)) {
            SoundManager.stopMusic(Parser.parseStatement(ss[i]));
          }
        }
      }
      ss = [];
      first = true;
      if (this.fullText.indexOf("execute-command") > -1) {
        s = this.fullText.split("execute-command ");
        for (v = 0, len3 = s.length; v < len3; v++) {
          i = s[v];
          if (!first) {
            ss.push(i.split(/\s|\"/)[0]);
          }
          first = false;
        }
      }
      if (ss.length > 0) {
        for (i = w = 0, ref6 = ss.length; 0 <= ref6 ? w <= ref6 : w >= ref6; i = 0 <= ref6 ? ++w : --w) {
          if (!(ref7 = ss[i], indexOf.call(this.executeBuffer, ref7) >= 0) && ss[i] !== void 0) {
            eval(novelData.parsedJavascriptCommands[parseInt(ss[i].substring(4, ss[i].length))]);
          }
        }
      }
      this.buffersExecuted = true;
    }
    novelData.printedText = this.fullText;
    return SceneManager.updateChoices();
  };

  TextPrinter.unpause = function() {
    if (document.querySelector("#continue-button") !== null) {
      document.querySelector("#continue-button").style.display = 'none';
    }
    if (this.pause === "input") {
      return this.pause = 0;
    }
  };

  TextPrinter.fastScroll = function() {
    if (novelData.novel.currentScene.skipEnabled) {
      return this.tickSpeedMultiplier = novelData.novel.settings.scrollSettings.fastScrollSpeedMultiplier;
    }
  };

  TextPrinter.stopFastScroll = function() {
    return this.tickSpeedMultiplier = 1;
  };

  TextPrinter.setTickSoundFrequency = function(freq) {
    var threshold;
    threshold = novelData.novel.settings.scrollSettings.tickFreqThreshold;
    this.tickSoundFrequency = 1;
    if (freq <= (threshold * 2)) {
      this.tickSoundFrequency = 2;
    }
    if (freq <= threshold) {
      return this.tickSoundFrequency = 3;
    }
  };

  TextPrinter.onTick = function() {
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
      if (novelData.printedText === this.fullText) {
        return;
      }
      offsetChanged = false;
      while (this.fullText[this.currentOffset] === ' ' || this.fullText[this.currentOffset] === '<' || this.fullText[this.currentOffset] === '>') {
        this.readTags();
      }
      novelData.printedText = this.fullText.substring(0, this.currentOffset);
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
            SoundManager.playSound(this.scrollSound);
          } else if (novelData.novel.currentScene.scrollSound !== void 0) {
            SoundManager.playSound(novelData.novel.currentScene.scrollSound);
          }
          this.tickCounter = 0;
        }
      }
    }
    this.setTickSoundFrequency(this.interval / this.tickSpeedMultiplier);
    return setTimeout((function() {
      TextPrinter.onTick();
    }), this.interval / this.tickSpeedMultiplier);
  };

  TextPrinter.readTags = function() {
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
        this.soundBuffer.push(Parser.parseStatement(s));
      }
      if (str.indexOf("play-music") > -1 && str.indexOf("display:none;") > -1) {
        s = str.split("play-music ");
        s = s[1].split(/\s|\"/)[0];
        this.musicBuffer.push(Parser.parseStatement(s));
      }
      if (str.indexOf("stop-music") > -1 && str.indexOf("display:none;") > -1) {
        s = str.split("stop-music ");
        s = s[1].split(/\s|\"/)[0];
        this.stopMusicBuffer.push(Parser.parseStatement(s));
      }
      if (str.indexOf("execute-command") > -1 && str.indexOf("display:none;") > -1) {
        s = str.split("execute-command ");
        s = s[1].split(/\s|\"/)[0];
        this.executeBuffer.push(Parser.parseStatement(s));
      }
      if (str.indexOf("display:none;") === -1) {
        if (str.indexOf("play-sound") > -1) {
          s = str.split("play-sound ");
          s = s[1].split(/\s|\"/)[0];
          this.soundBuffer.push(Parser.parseStatement(s));
          SoundManager.playSound(Parser.parseStatement(s));
        }
        if (str.indexOf("play-music") > -1) {
          s = str.split("play-music ");
          s = s[1].split(/\s|\"/)[0];
          this.musicBuffer.push(Parser.parseStatement(s));
          SoundManager.startMusic(Parser.parseStatement(s));
        }
        if (str.indexOf("stop-music") > -1) {
          s = str.split("stop-music ");
          s = s[1].split(/\s|\"/)[0];
          this.stopMusicBuffer.push(Parser.parseStatement(s));
          SoundManager.stopMusic(Parser.parseStatement(s));
        }
        if (str.indexOf("pause") > -1) {
          s = str.split("pause ");
          s = s[1].split(/\s|\"/)[0];
          this.pause = s;
          if (this.pause === "input") {
            if (document.querySelector("#continue-button") !== null) {
              document.querySelector("#continue-button").style.display = 'inline';
            }
          }
        }
        if (str.indexOf("execute-command") > -1) {
          s = str.split("execute-command ");
          s = s[1].split(/\s|\"/)[0];
          this.executeBuffer.push(s);
          if (s !== void 0) {
            eval(novelData.parsedJavascriptCommands[parseInt(s.substring(4, s.length))]);
          }
        }
        if (str.indexOf("set-speed") > -1) {
          s = str.split("set-speed ");
          s = s[1].split(/\s|\"/)[0];
          this.interval = Parser.parseStatement(s);
          this.speedMod = true;
        }
        if (str.indexOf("default-speed") > -1) {
          this.interval = this.defaultInterval;
          this.speedMod = false;
        }
        if (str.indexOf("set-scroll-sound") > -1) {
          s = str.split("set-scroll-sound ");
          s = s[1].split(/\s|\"/)[0];
          this.scrollSound = Parser.parseStatement(s);
        }
        if (str.indexOf("default-scroll-sound") > -1) {
          this.scrollSound = void 0;
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
  var instance;

  instance = null;

  function UI() {
    if (instance) {
      return instance;
    } else {
      instance = this;
    }
  }

  UI.showSaveNotification = function(text) {
    var e, textArea;
    e = document.getElementById("save-notification");
    textArea = e.querySelectorAll("textarea");
    textArea[0].value = text;
    return e.style.display = 'block';
  };

  UI.closeSaveNotification = function() {
    var e;
    e = document.getElementById("save-notification");
    return e.style.display = 'none';
  };

  UI.showLoadNotification = function() {
    var e;
    if (novelArea.novel.settings.saveMode === "text") {
      e = document.getElementById("load-notification");
      return e.style.display = 'block';
    } else {
      return NovelManager.loadGame();
    }
  };

  UI.closeLoadNotification = function(load, changeScene) {
    var e, textArea;
    e = document.getElementById("load-notification");
    if (load) {
      textArea = e.querySelectorAll("textarea");
      NovelManager.loadData(textArea[0].value, changeScene);
      textArea[0].value = "";
    }
    return e.style.display = 'none';
  };

  UI.updateInputs = function(needForUpdate) {
    var a, i, inputs, k, len, results;
    inputs = document.getElementById("novel-area").querySelectorAll("input");
    results = [];
    for (k = 0, len = inputs.length; k < len; k++) {
      i = inputs[k];
      results.push((function() {
        var l, len1, ref, results1;
        ref = novelData.novel.inventories[novelData.novel.currentInventory];
        results1 = [];
        for (l = 0, len1 = ref.length; l < len1; l++) {
          a = ref[l];
          if (a.name === i.className.substring(6, i.className.length)) {
            a.value = Util.stripHTML(i.value);
            if (needForUpdate) {
              results1.push(SceneManager.updateScene(novelData.novel.currentScene, true));
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
      return successful = document.execCommand('copy');
    } catch (error) {
      err = error;
      return console.error("Copying to clipboard failed: " + err);
    }
  });
}


/* UTILITY SCRIPTS */

Util = (function() {
  var instance;

  instance = null;

  function Util() {
    if (instance) {
      return instance;
    } else {
      instance = this;
    }
  }

  Util.isEven = function(n) {
    return n % 2 === 0;
  };

  Util.isOdd = function(n) {
    return Math.abs(n % 2) === 1;
  };

  Util.stripHTML = function(text) {
    var regex;
    regex = /(<([^>]+)>)/ig;
    return text.replace(regex, '');
  };

  Util.checkFormat = function(s, format) {
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
        console.error("ERROR: Invalid input format (should be " + format + ")");
        return false;
      }
    } else {
      if (typeof s === format) {
        return true;
      } else {
        console.error("ERROR: Invalid input format (should be " + format + ")");
        return false;
      }
    }
  };

  Util.validateParentheses = function(s) {
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

  Util.validateTagParentheses = function(s) {
    var i, index, k, len, open;
    open = 0;
    index = 0;
    for (k = 0, len = s.length; k < len; k++) {
      i = s[k];
      if (i === "[") {
        if (s[index - 1]) {
          if (s[index - 1] !== "/") {
            open++;
          }
        } else {
          open++;
        }
      }
      if (i === "]") {
        if (s[index - 1]) {
          if (s[index - 1] !== "/") {
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
  };

  return Util;

})();


/* GLOBAL GAME DATA */

novelData = {
  novel: null,
  choices: null,
  debugMode: false,
  status: "Loading",
  inventoryHidden: false,
  choicesHidden: false,
  printedText: "",
  parsedJavascriptCommands: [],
  music: []
};

novelPath = './novel';


/* GAME AREA */

novelArea = new Vue({
  el: '#novel-area',
  data: novelData,
  methods: {
    requirementsFilled: function(choice) {
      return SceneManager.requirementsFilled(choice);
    },
    textSkipEnabled: function(choice) {
      return novelData.novel.currentScene.skipEnabled && novelData.novel.settings.skipButtonShown;
    },
    itemsOverZeroAndAreHidden: function(item) {
      var i, k, len, ref;
      ref = novelData.novel.inventories[novelData.novel.currentInventory];
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
      ref = novelData.novel.inventories[novelData.novel.currentInventory];
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
      return InventoryManager.itemsOverZero(item) && InventoryManager.itemHidden(item);
    },
    selectChoice: function(choice) {
      return SceneManager.selectChoice(choice);
    }
  }
});


/* And finally, start the game... */

NovelManager.start();
