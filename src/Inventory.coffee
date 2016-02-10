
### INVENTORY, STAT & VALUE OPERATIONS ###

Inventory = {

  # Check if item or stat requirements have been filled
  checkRequirements: (requirements, isItem) ->
    reqsFilled = 0
    if isItem
      for i in data.game.inventory
        for j in requirements
          if j[0] == i.name
            if j[1] <= i.count
              reqsFilled = reqsFilled + 1
    else
      for i in data.game.stats
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
    value = Parser.findValue(parsed,false)
    value[getValueArrayLast] = newValue

  # Increase a value in JSON
  increaseValue: (parsed, change) ->
    getValueArrayLast = @getValueArrayLast(parsed)
    value = Parser.findValue(parsed,false)
    value[getValueArrayLast] = value[getValueArrayLast] + change
    if !isNaN(parseFloat(value[getValueArrayLast]))
      value[getValueArrayLast] = parseFloat(value[getValueArrayLast].toFixed(8));

  # Decrease a value in JSON
  decreaseValue: (parsed, change) ->
    getValueArrayLast = @getValueArrayLast(parsed)
    value = Parser.findValue(parsed,false)
    value[getValueArrayLast] = value[getValueArrayLast] - change
    if !isNaN(parseFloat(value[getValueArrayLast]))
      value[getValueArrayLast] = parseFloat(value[getValueArrayLast].toFixed(8));

  # Get the last item in a value array
  getValueArrayLast: (parsed) ->
    getValueArrayLast = parsed.split(",")
    getValueArrayLast = getValueArrayLast[getValueArrayLast.length-1].split(".")
    getValueArrayLast = getValueArrayLast[getValueArrayLast.length-1]
    return getValueArrayLast

  # Edit the player's items or stats
  editItemsOrStats: (items, mode, isItem) ->
    if isItem
      inventory = data.game.inventory
      isInv = true
    else
      inventory = data.game.stats
      isInv = false
    for j in items
      itemAdded = false
      for i in inventory
        if i.name == j[0]
          p = j[1].split(",")
          probability = 1
          if p.length > 1
            displayName = p[1]
            count = parseInt(p[0])
            if !isNaN(displayName)
              probability = p[1]
              displayName = j.name
            if p.length > 2
              probability = parseFloat(p[1])
              displayName = p[2]
          else
            displayName = j[0]
            count = parseInt(j[1])
          value = Math.random()
          if value < probability
            if (mode == "set")
              if isInv
                i.count = parseInt(j[1])
              else
                i.value = parseInt(j[1])
            else if (mode == "add")
              if isInv
                i.count = parseInt(i.count) + count
              else
                if isNaN parseInt(i.value)
                  i.value = 0
                i.value = parseInt(i.value) + count
            else if (mode == "remove")
              if isInv
                i.count = parseInt(i.count) - count
                if i.count < 0
                  i.count = 0
              else
                i.value = parseInt(i.value) - count
                if i.value < 0
                  i.value = 0
          itemAdded = true
      if !itemAdded && mode != "remove"
        p = j[1].split(",")
        probability = 1
        if p.length > 1
          displayName = p[1]
          count = parseInt(p[0])
          if !isNaN(displayName)
            probability = p[1]
            displayName = j.name
          if p.length > 2
            probability = parseFloat(p[1])
            displayName = p[2]
        else
          displayName = j[0]
          count = parseInt(j[1])
        value = Math.random()
        if value < probability
          inventory.push({"name": j[0], "count": count, "displayName": displayName})
    if isItem
      data.game.inventory = inventory
    else
      data.game.stats = inventory

}
