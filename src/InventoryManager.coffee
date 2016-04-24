
### INVENTORY, STAT & VALUE OPERATIONS ###

class InventoryManager

  # Create instance
  instance = null
  constructor: ->
    if instance
      return instance
    else
      instance = this

  # Check if item or stat requirements have been filled
  @checkRequirements: (requirements) ->
    Util.checkFormat(requirements,'array')
    reqsFilled = 0
    # Go through all requirements
    for i in novelData.novel.inventories[novelData.novel.currentInventory]
      for j in requirements
        if j[0] is i.name
          if j[1] <= i.value
            reqsFilled = reqsFilled + 1
    # Check whether all requirements have been filled
    if reqsFilled is requirements.length
      return true
    else
      return false

  # Set a value in JSON
  @setValue: (parsed, newValue) ->
    Util.checkFormat(parsed,'string')
    getValueArrayLast = @getValueArrayLast(parsed)
    value = Parser.findValue(parsed,false)
    value[getValueArrayLast] = newValue

  # Increase a value in JSON
  @increaseValue: (parsed, change) ->
    Util.checkFormat(parsed,'string')
    getValueArrayLast = @getValueArrayLast(parsed)
    value = Parser.findValue(parsed,false)
    value[getValueArrayLast] = value[getValueArrayLast] + change
    if not isNaN(parseFloat(value[getValueArrayLast]))
      value[getValueArrayLast] = parseFloat(value[getValueArrayLast].toFixed(novelData.novel.settings.floatPrecision));

  # Decrease a value in JSON
  @decreaseValue: (parsed, change) ->
    Util.checkFormat(parsed,'string')
    getValueArrayLast = @getValueArrayLast(parsed)
    value = Parser.findValue(parsed,false)
    value[getValueArrayLast] = value[getValueArrayLast] - change
    if not isNaN(parseFloat(value[getValueArrayLast]))
      value[getValueArrayLast] = parseFloat(value[getValueArrayLast].toFixed(novelData.novel.settings.floatPrecision));

  # Get the last item in a value array
  @getValueArrayLast: (parsed) ->
    getValueArrayLast = parsed.split(",")
    getValueArrayLast = getValueArrayLast[getValueArrayLast.length-1].split(".")
    getValueArrayLast = getValueArrayLast[getValueArrayLast.length-1]
    return getValueArrayLast

  # Add items
  @addItems: (items) ->
    @editItems(items, "add")

  # Set items
  @setItems: (items) ->
    @editItems(items, "set")

  # Remove items
  @removeItems: (items) ->
    @editItems(items, "remove")

  # Edit the player's items or stats
  @editItems = (items, mode) ->
    Util.checkFormat(items,'array')
    for j in items
      hidden = false
      # If the item name begins with a "!", it is hidden
      if j[0].substring(0,1) is "!"
        hidden = true
        j[0] = j[0].substring(1,j[0].length)
      # Try to edit the item in the current inventory
      itemAdded = @tryEditInInventory(mode, j, hidden);
      # If it failed, add a new item
      if not itemAdded
        @tryEditNotInInventory(mode, j, hidden)

  # Try to edit an existing item
  @tryEditInInventory = (mode, j, hidden) ->
    for i in novelData.novel.inventories[novelData.novel.currentInventory]
      # If the item exists in the current inventory
      if i.name is j[0]
        probability = 1
        # Check the string for display names and probabilities
        if j.length > 2
          displayName = j[2]
          value = parseInt(Parser.parseStatement(j[1]))
          if not isNaN(displayName)
            probability = j[2]
            displayName = j.name
          if j.length > 3
            probability = parseFloat(j[2])
            displayName = j[3]
        else
          displayName = j[0]
          value = parseInt(Parser.parseStatement(j[1]))
        # Generate a random value to determine whether to continue
        random = Math.random()
        if random < probability
          # Set the item's value
          if (mode is "set")
            if isNaN parseInt(j[1])
              i.value = j[1]
            else
              i.value = parseInt(j[1])
          # Add to the item's value - if it was a string, change it into a number
          else if (mode is "add")
            if isNaN parseInt(i.value)
              i.value = 0
            i.value = parseInt(i.value) + value
          # Deduct from the item's value - if it's a string, change it into 0
          else if (mode is "remove")
            if not isNaN parseInt(i.value)
              i.value = parseInt(i.value) - value
              if i.value < 0
                i.value = 0
            else
              i.value = 0
          # Set whether to hide the item or not
          i.hidden = hidden
        return true
    return false

  # Edit an item that does not exist in inventory yet
  @tryEditNotInInventory = (mode, j, hidden) ->
    # Only do this if we don't want to remove anything
    if mode isnt "remove"
      probability = 1
      # Check the string for display names and probablities
      value = parseInt(Parser.parseStatement(j[1]))
      if isNaN value
        value = Parser.parseStatement(j[1])
      if j.length > 2
        displayName = j[2]
        if not isNaN(displayName)
          probability = j[2]
          displayName = j.name
        if j.length > 3
          probability = parseFloat(j[2])
          displayName = j[3]
      else
        displayName = j[0]
      random = Math.random()
      # Set the display name
      if displayName is undefined
        displayName = j[0]
      # If we're lucky enough, add the new item
      if random < probability
        novelData.novel.inventories[novelData.novel.currentInventory].push({"name": j[0], "value": value, "displayName": displayName, "hidden": hidden})
