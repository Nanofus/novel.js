
/* PARSERS */

class Parser {

  // Select a random scene or choice from a list separated by |, takes string
  static selectRandomOption(name) {
    Util.checkFormat(name,'string');
    let separate = name.split("|");
    if (separate.length === 1) {
      return separate[0];
    }
    let parsed = [];
    for (let j = 0; j < separate.length; j++) {
      let i = separate[j];
      i = i.split(",");
      parsed.push(i);
    }
    parsed = this.chooseRandomly(parsed);
    return parsed;
  }

  // Select a scene or choice randomly from multiple scenes with different probabilities, takes array
  static chooseRandomly(options) {
    let names = [];
    let chances = [];
    let rawChances = [];
    let previous = 0;
    for (let j = 0; j < options.length; j++) {
      var i = options[j];
      names.push(i[0]);
      previous = parseFloat(i[1])+previous;
      chances.push(previous);
      rawChances.push(parseFloat(i[1]));
    }
    let totalChance = 0;
    for (let k = 0; k < rawChances.length; k++) {
      var i = rawChances[k];
      totalChance = totalChance + parseFloat(i);
    }
    if (totalChance !== 1) {
      console.error("ERROR: Invalid scene or choice odds (should add up to exactly 1)!");
    }
    let value = Math.random();
    let nameIndex = 0;
    for (let i1 = 0; i1 < chances.length; i1++) {
      var i = chances[i1];
      if (value < i) {
        return names[nameIndex];
      }
      nameIndex++;
    }
  }

  // Parse a string of items and output an array
  static parseItems(items) {
    Util.checkFormat(items,'string');
    if (items === "") {
      return undefined;
    }
    let separate = items.split("|");
    let parsed = [];
    for (let j = 0; j < separate.length; j++) {
      let i = separate[j];
      i = i.split(",");
      parsed.push(i);
    }
    return parsed;
  }

  // Parse a text for Novel.js tags, and replace them with the correct HTML tags.
  static parseText(text) {
    if (text !== undefined) {
      Util.checkFormat(text,'string');
      if (!Util.validateTagParentheses(text)) {
        console.error("ERROR: Invalid tags in text");
      }
      // External files
      let splitText = text.split("[file ");
      let iterable = __range__(1, splitText.length, true);
      for (let j = 0; j < iterable.length; j++) {
        var index = iterable[j];
        let name = "";
        if (splitText[index]) {
          let iterable1 = splitText[index].split('');
          for (let k = 0; k < iterable1.length; k++) {
            var i = iterable1[k];
            if (i !== ']') {
              name = name + i;
            } else {
              break;
            }
          }
        }
        // Clean spaces
        name = name.replace(/\s+/g, '');
        // If name detected
        if (name !== "") {
          let newText = null;
          // Find external text by name
          for (let i1 = 0; i1 < novelData.novel.externalText.length; i1++) {
            var i = novelData.novel.externalText[i1];
            if (i.name === name) {
              newText = i.content;
              break;
            }
          }
          // If not found from files, get from CSV data
          if (newText === null) {
            newText = LanguageManager.getCorrectLanguageCsvString(name);
          }
          // Replace the text
          if (newText !== null) {
            text = text.split(`[file ${name}]`).join(newText);
          }
        }
      }
      // [p] tags
      for (let j1 = 0; j1 < novelData.novel.tagPresets.length; j1++) {
        var i = novelData.novel.tagPresets[j1];
        let tagName = `[p ${i.name}]`;
        if (text.indexOf(tagName) > -1) {
          text = text.split(tagName).join(i.start);
        }
        tagName = `[/p ${i.name}]`;
        if (text.indexOf(tagName) > -1) {
          text = text.split(tagName).join(i.end);
        }
      }
      // [s] tags
      for (let i = 0; i < 100; i++) {
        text = text.split(`[s${i}]`).join(`<span class="highlight-${i}">`);
      }
      text = text.split("[/s]").join("</span>");
      // Ignore /[ and /]
      text = text.replace(/\/\[/g, "OPEN_BRACKET_REPLACEMENT").replace(/\/\]/g, "CLOSE_BRACKET_REPLACEMENT");
      splitText = text.split(/\[|\]/);
      var index = 0;
      for (let i2 = 0; i2 < splitText.length; i2++) {
        var s = splitText[i2];
        splitText[index] = s.replace(/OPEN_BRACKET_REPLACEMENT/g,"[").replace(/CLOSE_BRACKET_REPLACEMENT/g,"]");
        index++;
      }
      // Other tags
      let spansToBeClosed = 0;
      let asToBeClosed = 0;
      index = 0;
      let iterable3 = __range__(0, splitText.length-1, true);
      for (let j2 = 0; j2 < iterable3.length; j2++) {
        index = iterable3[j2];
        var s = splitText[index];
        // [if] statements
        if (s.substring(0,2) === "if") {
          var parsed = s.split("if ");
          if (!this.parseStatement(parsed[1])) {
            splitText[index] = "<span style=\"display:none;\">";
            spansToBeClosed++;
          } else {
            splitText[index] = "";
          }
        // Endif
        } else if (s.substring(0,3) === "/if") {
          if (spansToBeClosed > 0) {
            splitText[index] = "</span>";
            spansToBeClosed--;
          } else {
            splitText[index] = "";
          }
        // Printed inventory counts
        } else if (s.substring(0,4) === "inv.") {
          let value = s.substring(4,s.length);
          splitText[index] = 0;
          for (let k2 = 0; k2 < novelData.novel.inventories[novelData.novel.currentInventory].length; k2++) {
            var i = novelData.novel.inventories[novelData.novel.currentInventory][k2];
            if (i.name === value) {
              splitText[index] = i.value;
            }
          }
        // Generic print command
        } else if (s.substring(0,5) === "print") {
          var parsed = s.split("print ");
          parsed = this.parseStatement(parsed[1]);
          if (!isNaN(parseFloat(parsed))) {
            parsed = parseFloat(parsed.toFixed(novelData.novel.settings.floatPrecision));
          }
          splitText[index] = parsed;
        // Execute JavaScript
        } else if (s.substring(0,4) === "exec") {
          var parsed = s.substring(5,s.length);
          let p = novelData.parsedJavascriptCommands.push(parsed);
          p--;
          splitText[index] = `<span class="execute-command com-${p}"></span>`;
        // Pause
        } else if (s.substring(0,5) === "pause") {
          var parsed = s.substring(6,s.length);
          splitText[index] = `<span class="pause ${parsed}"></span>`;
        // Play sound
        } else if (s.substring(0,5) === "sound") {
          var parsed = s.split("sound ");
          splitText[index] = `<span class="play-sound ${parsed[1]}"></span>`;
        // Stop music
        } else if (s.substring(0,6) === "/music") {
          var parsed = s.split("/music ");
          splitText[index] = `<span class="stop-music ${parsed[1]}"></span>`;
        // Play music
        } else if (s.substring(0,5) === "music") {
          var parsed = s.split("music ");
          splitText[index] = `<span class="play-music ${parsed[1]}"></span>`;
        // Reset text speed
        } else if (s.substring(0,6) === "/speed") {
          splitText[index] = "<span class=\"default-speed\"></span>";
        // Change speed
        } else if (s.substring(0,5) === "speed") {
          var parsed = s.split("speed ");
          splitText[index] = `<span class="set-speed ${parsed[1]}"></span>`;
        // Reset scroll sound
        } else if (s.substring(0,12) === "/scrollSound") {
          splitText[index] = "<span class=\"default-scroll-sound\"></span>";
        // Scroll sound
        } else if (s.substring(0,11) === "scrollSound") {
          var parsed = s.split("scrollSound ");
          let p = novelData.parsedScrollsounds.push(parsed);
          p--;
          splitText[index] = `<span class="set-scroll-sound s-${p}"></span>`;
        // Input field
        } else if (s.substring(0,5) === "input") {
          var parsed = s.split("input ");
          let nameText = "";
          for (let i3 = 0; i3 < novelData.novel.inventories[novelData.novel.currentInventory].length; i3++) {
            var i = novelData.novel.inventories[novelData.novel.currentInventory][i3];
            if (i.name === parsed[1]) {
              nameText = i.value;
            }
          }
          splitText[index] = `<input type="text" value="${nameText}" name="input" class="input-${parsed[1]}" onblur="UI.updateInputs(true)">`;
        // Embedded choice
        } else if (s.substring(0,6) === "choice") {
          var parsed = s.split("choice ");
          splitText[index] = `<a href="#" onclick="SceneManager.selectChoiceByNameByClicking(event,'${parsed[1]}')">`;
          asToBeClosed++;
        // Choice end
        } else if (s.substring(0,7) === "/choice") {
          if (asToBeClosed > 0) {
            splitText[index] = "</a>";
            asToBeClosed--;
          } else {
            splitText[index] = "";
          }
        }
        index++;
      }
      // Join all back into a string
      text = splitText.join("");
      //if novelData.markdownEnabled
      //  text = marked(text)
      return text;
    }
  }

  // Parse a statement that returns true or false or calculate a value
  static parseStatement(s) {
    if (s === undefined) {
      return undefined;
    }
    s = s.toString();
    Util.checkFormat(s,'string');
    // Check for valid parentheses
    if (!Util.validateParentheses(s)) {
      console.error("ERROR: Invalid parentheses in statement");
    }
    // Clean spaces
    s = s.replace(/\s+/g, '');
    // Remove all operators and parentheses
    let parsedString = s.split(/\(|\)|\+|\*|\-|\/|<=|>=|<|>|==|!=|\|\||&&/);
    let parsedValues = [];
    // Parse the strings for known prefixes, and parse the values based on that.
    for (let j = 0; j < parsedString.length; j++) {
      let val = parsedString[j];
      let type = this.getStatementType(val);
      switch (type) {
        // Parse item
        case "item":
          let found = false;
          for (let k = 0; k < novelData.novel.inventories[novelData.novel.currentInventory].length; k++) {
            var i = novelData.novel.inventories[novelData.novel.currentInventory][k];
            if (i.name === val.substring(4,val.length)) {
              parsedValues.push(i.value);
              found = true;
            }
          }
          if (!found) {
            parsedValues.push(0);
          }
          break;
        // Generate a random value
        case "rand":
          val = val.split(".");
          let vals = val[1].split(",");
          let plus = true;
          if (vals[0].substring(0,5) === "minus") {
            vals[0] = vals[0].substring(5,vals[0].length);
            plus = false;
          }
          if (vals[1].substring(0,5) === "minus") {
            vals[1] = vals[1].substring(5,vals[1].length);
            plus = false;
          }
          if (plus) {
            var result = (Math.random()*vals[1]) + vals[0];
          } else {
            var result = (Math.random()*vals[1]) - vals[0];
          }
          if (vals[2] === undefined) {
            vals[2] = 0;
          }
          if (vals[2] === 0) {
            var result = Math.round(result);
          } else {
            var result = parseFloat(result).toFixed(vals[2]);
          }
          parsedValues.push(result);
          break;
        // Parse variable
        case "var":
          val = this.findValue(val.substring(4,val.length),true);
          if (!isNaN(parseFloat(val))) {
            val = parseFloat(val).toFixed(novelData.novel.settings.floatPrecision);
          } else {
            val = `'${val}'`;
          }
          parsedValues.push(val);
          break;
        // Parse float
        case "float":
          parsedValues.push(parseFloat(val).toFixed(novelData.novel.settings.floatPrecision));
          break;
        // Parse int
        case "int":
          parsedValues.push(parseInt(val));
          break;
        // Parse string
        case "string":
          if (val !== "") {
            parsedValues.push(`'${val}'`);
          } else {
            parsedValues.push("");
          }
          break;
      }
    }
    // Replace all variables with their correct values
    let iterable = __range__(0, parsedString.length-1, true);
    for (let i1 = 0; i1 < iterable.length; i1++) {
      var i = iterable[i1];
      if (parsedString[i] !== "" && parsedValues[i] !== "") {
        s = s.replace(new RegExp(parsedString[i],'g'),parsedValues[i]);
        s = s.replace(new RegExp("''",'g'),"'"); // Remove double-':s caused by string parsing
      }
    }
    // Solve or calculate the statement
    let returnVal = eval(s);
    // Fix booleans
    if (returnVal === "true") {
      returnVal = true;
    }
    if (returnVal === "false") {
      returnVal = false;
    }
    // Return the actual result
    return returnVal;
  }

  // Read a string's beginning to detect its type
  static getStatementType(val) {
    let type = null;
    if (val.substring(0,4) === "inv.") {
      type = "item";
    } else if (val.substring(0,4) === "var.") {
      type = "var";
    } else if (val.substring(0,5) === "rand.") {
      type = "rand";
    } else if (!isNaN(parseFloat(val)) && val.toString().indexOf(".") === -1) {
      type = "int";
    } else if (!isNaN(parseFloat(val)) && val.toString().indexOf(".") !== -1) {
      type = "float";
    } else {
      type = "string";
    }
    return type;
  }

  // Find a value from the game novelData json
  // toPrint is true returns the value, toPrint is false returns the object
  static findValue(parsed, toPrint) {
    let splitted = parsed.split(",");
    // Find the first object in hierarchy
    if (!toPrint) {
      if (splitted.length > 1) {
        var variable = this.findValueByName(novelData.novel,splitted[0])[0];
      } else {
        var variable = this.findValueByName(novelData.novel,splitted[0])[1];
      }
    } else {
      var variable = this.findValueByName(novelData.novel,splitted[0])[0];
    }
    // Follow the path
    let iterable = __range__(0, splitted.length - 1, true);
    for (let j = 0; j < iterable.length; j++) {
      let i = iterable[j];
      if (Util.isOdd(i)) {
        var variable = variable[parseInt(splitted[i])];
      } else if (i !== 0) {
        if (!toPrint) {
          var variable = this.findValueByName(variable,splitted[i])[1];
        } else {
          if (splitted[i] === "parsedText" || splitted[i] === "text") {
            splitted[i] = "parsedText";
            variable.parsedText = this.parseText(variable.text);
          }
          var variable = this.findValueByName(variable,splitted[i])[0];
        }
      }
    }
    if (variable === undefined) {
      console.warn("WARNING: Searched value not found.");
    }
    return variable;
  }

  // Find an object from the object hierarchy by string name
  static findValueByName(obj, string) {
    Util.checkFormat(string,'string');
    let parts = string.split('.');
    let newObj = obj[parts[0]];
    if (parts[1]) {
      parts.splice(0, 1);
      let newString = parts.join('.');
      return this.findValueByName(newObj, newString);
    }
    let r = [];
    r[0] = newObj;
    r[1] = obj;
    return r;
  }
}

function __range__(left, right, inclusive) {
  let range = [];
  let ascending = left < right;
  let end = !inclusive ? right : ascending ? right + 1 : right - 1;
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }
  return range;
}
