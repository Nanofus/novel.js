
### PARSERS ###

class Parser

  # Parse a string of items and output an array
  parseItems: (items) ->
    util.checkFormat(items,'string')
    if items == ""
      return undefined
    separate = items.split("|")
    parsed = []
    for i in separate
      i = i.split(",")
      parsed.push(i)
    return parsed

  # Parse a text for Novel.js tags, and replace them with the correct HTML tags.
  parseText: (text) ->
    if text != undefined
      util.checkFormat(text,'string')
      # [p] tags
      for i in novelData.novel.tagPresets
        tagName = "[p " + i.name + "]"
        if text.indexOf(tagName) > -1
          text = text.split(tagName).join(i.start)
        tagName = "[/p " + i.name + "]"
        if text.indexOf(tagName) > -1
          text = text.split(tagName).join(i.end)
      # [s] tags
      for i in [0 .. 99]
        text = text.split("[s" + i + "]").join("<span class=\"highlight-" + i + "\">")
      text = text.split("[/s]").join("</span>")
      # Ignore /[ and /]
      text = text.replace(/\/\[/g, "OPEN_BRACKET_REPLACEMENT").replace(/\/\]/g, "CLOSE_BRACKET_REPLACEMENT")
      splitText = text.split(/\[|\]/)
      index = 0
      for s in splitText
        splitText[index] = s.replace(/OPEN_BRACKET_REPLACEMENT/g,"[").replace(/CLOSE_BRACKET_REPLACEMENT/g,"]")
        index++
      # Other tags
      spansToBeClosed = 0
      asToBeClosed = 0
      index = 0
      for index in [0 .. splitText.length-1]
        s = splitText[index]
        # [if] statements
        if s.substring(0,2) == "if"
          parsed = s.split("if ")
          if !@parseStatement(parsed[1])
            splitText[index] = "<span style=\"display:none;\">"
            spansToBeClosed++
          else
            splitText[index] = ""
        else if s.substring(0,3) == "/if"
          if spansToBeClosed > 0
            splitText[index] = "</span>"
            spansToBeClosed--
          else
            splitText[index] = ""
        # Printed inventory counts
        else if s.substring(0,4) == "inv."
          value = s.substring(4,s.length)
          splitText[index] = 0
          for i in novelData.novel.inventories[novelData.novel.currentInventory]
            if i.name == value
              splitText[index] = i.value
        # Generic print command
        else if s.substring(0,5) == "print"
          parsed = s.split("print ")
          parsed = @parseStatement(parsed[1])
          if !isNaN(parseFloat(parsed))
            parsed = parseFloat(parsed.toFixed(novelData.novel.settings.floatPrecision))
          splitText[index] = parsed
        # Execute JavaScript
        else if s.substring(0,4) == "exec"
          parsed = s.substring(5,s.length)
          p = novelData.parsedJavascriptCommands.push(parsed)
          p--
          splitText[index] = "<span class=\"execute-command com-" + p + "\"></span>"
        # Pause
        else if s.substring(0,5) == "pause"
          parsed = s.substring(6,s.length)
          splitText[index] = "<span class=\"pause " + parsed + "\"></span>"
        # Play sound
        else if s.substring(0,5) == "sound"
          parsed = s.split("sound ")
          splitText[index] = "<span class=\"play-sound " + parsed[1] + "\"></span>"
        # Stop music
        else if s.substring(0,9) == "stopMusic"
          parsed = s.split("stopMusic ")
          splitText[index] = "<span class=\"stop-music " + parsed[1] + "\"></span>"
        # Play music
        else if s.substring(0,5) == "music"
          parsed = s.split("music ")
          splitText[index] = "<span class=\"play-music " + parsed[1] + "\"></span>"
        # Reset text speed
        else if s.substring(0,6) == "/speed"
          splitText[index] = "<span class=\"default-speed\"></span>"
        # Change speed
        else if s.substring(0,5) == "speed"
          parsed = s.split("speed ")
          splitText[index] = "<span class=\"set-speed " + parsed[1] + "\"></span>"
        # Reset scroll sound
        else if s.substring(0,12) == "/scrollSound"
          splitText[index] = "<span class=\"default-scroll-sound\"></span>"
        # Scroll sound
        else if s.substring(0,11) == "scrollSound"
          parsed = s.split("scrollSound ")
          splitText[index] = "<span class=\"set-scroll-sound " + parsed[1] + "\"></span>"
        # Input field
        else if s.substring(0,5) == "input"
          parsed = s.split("input ")
          nameText = ""
          for i in novelData.novel.inventories[novelData.novel.currentInventory]
            if i.name == parsed[1]
              nameText = i.value
          splitText[index] = "<input type=\"text\" value=\"" + nameText + "\" name=\"input\" class=\"input-" + parsed[1] +  "\" onblur=\"ui.updateInputs(true)\">"
        # Embedded choice
        else if s.substring(0,6) == "choice"
          parsed = s.split("choice ")
          splitText[index] = "<a href=\"#\" onclick=\"sceneManager.selectChoiceByNameByClicking(event,'"+parsed[1]+"')\">"
          asToBeClosed++
        else if s.substring(0,7) == "/choice"
          if asToBeClosed > 0
            splitText[index] = "</a>"
            asToBeClosed--
          else
            splitText[index] = ""
        index++
      # Join all back into a string
      text = splitText.join("")
      return text

  # Parse a statement that returns true or false or calculate a value
  parseStatement: (s) ->
    if s == undefined
      return undefined
    s = s.toString()
    util.checkFormat(s,'string')
    # Check for valid parentheses
    if !util.validateParentheses(s)
      console.error "ERROR: Invalid parentheses in statement"
    # Clean spaces
    s = s.replace(/\s+/g, '');
    # Remove all operators and parentheses
    parsedString = s.split(/\(|\)|\+|\*|\-|\/|<=|>=|<|>|==|!=|\|\||&&/)
    parsedValues = []
    # Parse the strings for known prefixes, and parse the values based on that.
    for val in parsedString
      type = @getStatementType(val)
      switch type
        when "item"
          found = false
          for i in novelData.novel.inventories[novelData.novel.currentInventory]
            if i.name == val.substring(4,val.length)
              parsedValues.push i.value
              found = true
          if !found
            parsedValues.push 0
        when "rand"
          val = val.split(".")
          vals = val[1].split(",")
          plus = true
          if vals[0].substring(0,5) == "minus"
            vals[0] = vals[0].substring(5,vals[0].length)
            plus = false
          if vals[1].substring(0,5) == "minus"
            vals[1] = vals[1].substring(5,vals[1].length)
            plus = false
          if plus
            result = Math.random()*vals[1] + vals[0]
          else
            result = Math.random()*vals[1] - vals[0]
          if vals[2] == undefined
            vals[2] = 0
          if vals[2] == 0
            result = Math.round(result)
          else
            result = parseFloat(result).toFixed(vals[2])
          parsedValues.push result
        when "var"
          val = @findValue(val.substring(4,val.length),true)
          if !isNaN(parseFloat(val))
            parsedValues.push parseFloat(val).toFixed(novelData.novel.settings.floatPrecision)
          else
            parsedValues.push "'" + val + "'"
        when "float"
          parsedValues.push parseFloat(val).toFixed(novelData.novel.settings.floatPrecision)
        when "int"
          parsedValues.push parseInt(val)
        when "string"
          if val != ""
            parsedValues.push "'" + val + "'"
          else
            parsedValues.push ""
    # Replace all variables with their correct values
    for i in [0 .. parsedString.length-1]
      if parsedString[i] != "" && parsedValues[i] != ""
        parsedString[i] = parsedString[i].replace("{","\{")
        parsedString[i] = parsedString[i].replace("}","\}")
        s = s.replace(new RegExp(parsedString[i],'g'),parsedValues[i])
    # Solve or calculate the statement
    return eval(s)

  # Read a string's beginning to detect its type
  getStatementType: (val) ->
    type = null
    if val.substring(0,4) == "inv."
      type = "item"
    else if val.substring(0,4) == "var."
      type = "var"
    else if val.substring(0,5) == "rand."
      type = "rand"
    else if !isNaN(parseFloat(val)) && val.toString().indexOf(".") == -1
      type = "int"
    else if !isNaN(parseFloat(val)) && val.toString().indexOf(".") != -1
      type = "float"
    else
      type = "string"
    return type

  # Find a value from the game novelData json
  # toPrint == true returns the value, toPrint == false returns the object
  findValue: (parsed, toPrint) ->
    splitted = parsed.split(",")
    # Find the first object in hierarchy
    if !toPrint
      if splitted.length > 1
        variable = @findValueByName(novelData.novel,splitted[0])[0]
      else
        variable = @findValueByName(novelData.novel,splitted[0])[1]
    else
      variable = @findValueByName(novelData.novel,splitted[0])[0]
    # Follow the path
    for i in [0 .. splitted.length - 1]
      if util.isOdd(i)
        variable = variable[parseInt(splitted[i])]
      else if i != 0
        if !toPrint
          variable = @findValueByName(variable,splitted[i])[1]
        else
          if splitted[i] == "parsedText" || splitted[i] == "text"
            splitted[i] = "parsedText"
            variable.parsedText = @parseText(variable.text)
          variable = @findValueByName(variable,splitted[i])[0]
    if variable == undefined
      console.warn "WARNING: Searched value not found."
    return variable

  # Find an object from the object hierarchy by string name
  findValueByName: (obj, string) ->
    util.checkFormat(string,'string')
    parts = string.split('.')
    newObj = obj[parts[0]]
    if parts[1]
      parts.splice 0, 1
      newString = parts.join('.')
      return @findValueByName(newObj, newString)
    r = []
    r[0] = newObj
    r[1] = obj
    return r
