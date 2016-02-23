
### INVENTORY, STAT & VALUE OPERATIONS ###

class InventoryManager

  # Check if item or stat requirements have been filled
  checkRequirements: (requirements) ->
    reqsFilled = 0
    for i in data.game.inventories[data.game.currentInventory]
      for j in requirements
        if j[0] == i.name
          if j[1] <= i.value
            reqsFilled = reqsFilled + 1
    if reqsFilled == requirements.length
      return true
    else
      return false

  # Set a value in JSON
  setValue: (parsed, newValue) ->
    getValueArrayLast = @getValueArrayLast(parsed)
    value = parser.findValue(parsed,false)
    value[getValueArrayLast] = newValue

  # Increase a value in JSON
  increaseValue: (parsed, change) ->
    getValueArrayLast = @getValueArrayLast(parsed)
    value = parser.findValue(parsed,false)
    value[getValueArrayLast] = value[getValueArrayLast] + change
    if !isNaN(parseFloat(value[getValueArrayLast]))
      value[getValueArrayLast] = parseFloat(value[getValueArrayLast].toFixed(data.game.settings.floatPrecision));

  # Decrease a value in JSON
  decreaseValue: (parsed, change) ->
    getValueArrayLast = @getValueArrayLast(parsed)
    value = parser.findValue(parsed,false)
    value[getValueArrayLast] = value[getValueArrayLast] - change
    if !isNaN(parseFloat(value[getValueArrayLast]))
      value[getValueArrayLast] = parseFloat(value[getValueArrayLast].toFixed(data.game.settings.floatPrecision));

  # Get the last item in a value array
  getValueArrayLast: (parsed) ->
    getValueArrayLast = parsed.split(",")
    getValueArrayLast = getValueArrayLast[getValueArrayLast.length-1].split(".")
    getValueArrayLast = getValueArrayLast[getValueArrayLast.length-1]
    return getValueArrayLast

  # Edit the player's items or stats
  editItems: (items, mode) ->
    for j in items
      hidden = false
      if j[0].substring(0,1) == "!"
        hidden = true
        j[0] = j[0].substring(1,j[0].length)
      itemAdded = false
      for i in data.game.inventories[data.game.currentInventory]
        if i.name == j[0]
          probability = 1
          if j.length > 2
            displayName = j[2]
            value = parseInt(parser.parseStatement(j[1]))
            if !isNaN(displayName)
              probability = j[2]
              displayName = j.name
            if j.length > 3
              probability = parseFloat(j[2])
              displayName = j[3]
          else
            displayName = j[0]
            value = parseInt(parser.parseStatement(j[1]))
          random = Math.random()
          if random < probability
            if (mode == "set")
              if isNaN parseInt(j[1])
                i.value = j[1]
              else
                i.value = parseInt(j[1])
            else if (mode == "add")
              if isNaN parseInt(i.value)
                i.value = 0
              i.value = parseInt(i.value) + value
            else if (mode == "remove")
              if !isNaN parseInt(i.value)
                i.value = parseInt(i.value) - value
                if i.value < 0
                  i.value = 0
              else
                i.value = 0
          itemAdded = true
      if !itemAdded && mode != "remove"
        probability = 1
        value = parseInt(parser.parseStatement(j[1]))
        if isNaN value
          value = parser.parseStatement(j[1])
        if j.length > 2
          displayName = j[2]
          if !isNaN(displayName)
            probability = j[2]
            displayName = j.name
          if j.length > 3
            probability = parseFloat(j[2])
            displayName = j[3]
        else
          displayName = j[0]
        random = Math.random()
        if displayName == undefined
          displayName = j[0]
        if random < probability
          data.game.inventories[data.game.currentInventory].push({"name": j[0], "value": value, "displayName": displayName, "hidden": hidden})
