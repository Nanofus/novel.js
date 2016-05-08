
### PARSERS ###

class Parser

  # Create instance
  instance = null
  constructor: ->
    if instance
      return instance
    else
      instance = this

  # Select a random scene or choice from a list separated by |, takes string
  @selectRandomOption: (name) ->
    Util.checkFormat(name,'string')
    separate = name.split("|")
    if separate.length is 1
      return separate[0]
    parsed = []
    for i in separate
      i = i.split(",")
      parsed.push(i)
    parsed = @chooseRandomly(parsed)
    return parsed

  # Select a scene or choice randomly from multiple scenes with different probabilities, takes array
  @chooseRandomly = (options) ->
    names = []
    chances = []
    rawChances = []
    previous = 0
    for i in options
      names.push i[0]
      previous = parseFloat(i[1])+previous
      chances.push previous
      rawChances.push parseFloat(i[1])
    totalChance = 0
    for i in rawChances
      totalChance = totalChance + parseFloat(i)
    if totalChance isnt 1
      console.error "ERROR: Invalid scene or choice odds (should add up to exactly 1)!"
    value = Math.random()
    nameIndex = 0
    for i in chances
      if value < i
        return names[nameIndex]
      nameIndex++

  # Parse a string of items and output an array
  @parseItems: (items) ->
    Util.checkFormat(items,'string')
    if items is ""
      return undefined
    separate = items.split("|")
    parsed = []
    for i in separate
      i = i.split(",")
      parsed.push(i)
    return parsed

  # Parse a text for Novel.js tags, and replace them with the correct HTML tags.
  @parseText: (text) ->
    if text isnt undefined
      Util.checkFormat(text,'string')
      if not Util.validateTagParentheses(text)
        console.error "ERROR: Invalid tags in text"
      # External files
      splitText = text.split("[file ")
      for index in [1 .. splitText.length]
        name = ""
        if splitText[index]
          for i in splitText[index].split('')
            if i isnt ']'
              name = name + i
            else
              break
        # Clean spaces
        name = name.replace(/\s+/g, '');
        # If name detected
        if name isnt ""
          newText = null
          # Find external text by name
          for i in novelData.novel.externalText
            if i.name is name
              newText = i.content
              break
          # If not found from files, get from CSV data
          if newText is null
            newText = LanguageManager.getCorrectLanguageCsvString(name)
          # Replace the text
          if newText isnt null
            text = text.split("[file "+name+"]").join(newText)
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
        if s.substring(0,2) is "if"
          parsed = s.split("if ")
          if not @parseStatement(parsed[1])
            splitText[index] = "<span style=\"display:none;\">"
            spansToBeClosed++
          else
            splitText[index] = ""
        # Endif
        else if s.substring(0,3) is "/if"
          if spansToBeClosed > 0
            splitText[index] = "</span>"
            spansToBeClosed--
          else
            splitText[index] = ""
        # Printed inventory counts
        else if s.substring(0,4) is "inv."
          value = s.substring(4,s.length)
          splitText[index] = 0
          for i in novelData.novel.inventories[novelData.novel.currentInventory]
            if i.name is value
              splitText[index] = i.value
        # Generic print command
        else if s.substring(0,5) is "print"
          parsed = s.split("print ")
          parsed = @parseStatement(parsed[1])
          if not isNaN(parseFloat(parsed))
            parsed = parseFloat(parsed.toFixed(novelData.novel.settings.floatPrecision))
          splitText[index] = parsed
        # Execute JavaScript
        else if s.substring(0,4) is "exec"
          parsed = s.substring(5,s.length)
          p = novelData.parsedJavascriptCommands.push(parsed)
          p--
          splitText[index] = "<span class=\"execute-command com-" + p + "\"></span>"
        # Pause
        else if s.substring(0,5) is "pause"
          parsed = s.substring(6,s.length)
          splitText[index] = "<span class=\"pause " + parsed + "\"></span>"
        # Play sound
        else if s.substring(0,5) is "sound"
          parsed = s.split("sound ")
          splitText[index] = "<span class=\"play-sound " + parsed[1] + "\"></span>"
        # Stop music
        else if s.substring(0,6) is "/music"
          parsed = s.split("/music ")
          splitText[index] = "<span class=\"stop-music " + parsed[1] + "\"></span>"
        # Play music
        else if s.substring(0,5) is "music"
          parsed = s.split("music ")
          splitText[index] = "<span class=\"play-music " + parsed[1] + "\"></span>"
        # Reset text speed
        else if s.substring(0,6) is "/speed"
          splitText[index] = "<span class=\"default-speed\"></span>"
        # Change speed
        else if s.substring(0,5) is "speed"
          parsed = s.split("speed ")
          splitText[index] = "<span class=\"set-speed " + parsed[1] + "\"></span>"
        # Reset scroll sound
        else if s.substring(0,12) is "/scrollSound"
          splitText[index] = "<span class=\"default-scroll-sound\"></span>"
        # Scroll sound
        else if s.substring(0,11) is "scrollSound"
          parsed = s.split("scrollSound ")
          splitText[index] = "<span class=\"set-scroll-sound " + parsed[1] + "\"></span>"
        # Input field
        else if s.substring(0,5) is "input"
          parsed = s.split("input ")
          nameText = ""
          for i in novelData.novel.inventories[novelData.novel.currentInventory]
            if i.name is parsed[1]
              nameText = i.value
          splitText[index] = "<input type=\"text\" value=\"" + nameText + "\" name=\"input\" class=\"input-" + parsed[1] +  "\" onblur=\"UI.updateInputs(true)\">"
        # Embedded choice
        else if s.substring(0,6) is "choice"
          parsed = s.split("choice ")
          splitText[index] = "<a href=\"#\" onclick=\"SceneManager.selectChoiceByNameByClicking(event,'"+parsed[1]+"')\">"
          asToBeClosed++
        # Choice end
        else if s.substring(0,7) is "/choice"
          if asToBeClosed > 0
            splitText[index] = "</a>"
            asToBeClosed--
          else
            splitText[index] = ""
        index++
      # Join all back into a string
      text = splitText.join("")
      #if novelData.markdownEnabled
      #  text = marked(text)
      return text

  # Parse a statement that returns true or false or calculate a value
  @parseStatement: (s) ->
    if s is undefined
      return undefined
    s = s.toString()
    Util.checkFormat(s,'string')
    # Check for valid parentheses
    if not Util.validateParentheses(s)
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
        # Parse item
        when "item"
          found = false
          for i in novelData.novel.inventories[novelData.novel.currentInventory]
            if i.name is val.substring(4,val.length)
              parsedValues.push i.value
              found = true
          if not found
            parsedValues.push 0
        # Generate a random value
        when "rand"
          val = val.split(".")
          vals = val[1].split(",")
          plus = true
          if vals[0].substring(0,5) is "minus"
            vals[0] = vals[0].substring(5,vals[0].length)
            plus = false
          if vals[1].substring(0,5) is "minus"
            vals[1] = vals[1].substring(5,vals[1].length)
            plus = false
          if plus
            result = Math.random()*vals[1] + vals[0]
          else
            result = Math.random()*vals[1] - vals[0]
          if vals[2] is undefined
            vals[2] = 0
          if vals[2] is 0
            result = Math.round(result)
          else
            result = parseFloat(result).toFixed(vals[2])
          parsedValues.push result
        # Parse variable
        when "var"
          val = @findValue(val.substring(4,val.length),true)
          if not isNaN(parseFloat(val))
            val = parseFloat(val).toFixed(novelData.novel.settings.floatPrecision)
          else
            val = "'" + val + "'"
          parsedValues.push val
        # Parse float
        when "float"
          parsedValues.push parseFloat(val).toFixed(novelData.novel.settings.floatPrecision)
        # Parse int
        when "int"
          parsedValues.push parseInt(val)
        # Parse string
        when "string"
          if val isnt ""
            parsedValues.push "'" + val + "'"
          else
            parsedValues.push ""
    # Replace all variables with their correct values
    for i in [0 .. parsedString.length-1]
      if parsedString[i] isnt "" and parsedValues[i] isnt ""
        s = s.replace(new RegExp(parsedString[i],'g'),parsedValues[i])
        s = s.replace(new RegExp("''",'g'),"'") # Remove double-':s caused by string parsing
    # Solve or calculate the statement
    returnVal = eval(s)
    # Fix booleans
    if returnVal is "true"
      returnVal = true
    if returnVal is "false"
      returnVal = false
    # Return the actual result
    return returnVal

  # Read a string's beginning to detect its type
  @getStatementType: (val) ->
    type = null
    if val.substring(0,4) is "inv."
      type = "item"
    else if val.substring(0,4) is "var."
      type = "var"
    else if val.substring(0,5) is "rand."
      type = "rand"
    else if not isNaN(parseFloat(val)) and val.toString().indexOf(".") is -1
      type = "int"
    else if not isNaN(parseFloat(val)) and val.toString().indexOf(".") isnt -1
      type = "float"
    else
      type = "string"
    return type

  # Find a value from the game novelData json
  # toPrint is true returns the value, toPrint is false returns the object
  @findValue: (parsed, toPrint) ->
    splitted = parsed.split(",")
    # Find the first object in hierarchy
    if not toPrint
      if splitted.length > 1
        variable = @findValueByName(novelData.novel,splitted[0])[0]
      else
        variable = @findValueByName(novelData.novel,splitted[0])[1]
    else
      variable = @findValueByName(novelData.novel,splitted[0])[0]
    # Follow the path
    for i in [0 .. splitted.length - 1]
      if Util.isOdd(i)
        variable = variable[parseInt(splitted[i])]
      else if i isnt 0
        if not toPrint
          variable = @findValueByName(variable,splitted[i])[1]
        else
          if splitted[i] is "parsedText" or splitted[i] is "text"
            splitted[i] = "parsedText"
            variable.parsedText = @parseText(variable.text)
          variable = @findValueByName(variable,splitted[i])[0]
    if variable is undefined
      console.warn "WARNING: Searched value not found."
    return variable

  # Find an object from the object hierarchy by string name
  @findValueByName: (obj, string) ->
    Util.checkFormat(string,'string')
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
