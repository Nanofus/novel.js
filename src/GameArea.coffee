
### GAME AREA ###

gameArea = new Vue(
  el: '#game-area'
  data: data
  methods:
    # Return whether the requirements of a choice have been filled
    requirementsFilled: (choice) ->
      return sceneManager.requirementsFilled(choice)

    # Return whether the text can be skipped
    textSkipEnabled: (choice) ->
      return data.game.currentScene.skipEnabled && data.game.settings.skipButtonShown

    # Check if specific item's count is over 0; if it isn't, it's not shown. Also it should be hidden.
    itemsOverZeroAndAreHidden: (item) ->
      for i in data.game.inventory
        if i.name == item.name && (i.hidden && i.hidden != undefined)
          if i.value > 0
            return true
          if isNaN i.value
            return true
      return false

    # Check if specific item's count is over 0; if it isn't, it's not shown. Also should not be hidden.
    itemsOverZeroAndNotHidden: (item) ->
      for i in data.game.inventory
        if i.name == item.name && (!i.hidden || i.hidden == undefined)
          if i.value > 0
            return true
          if isNaN i.value
            return true
      return false

    # Check if specific item's count is over 0; if it isn't, it's not shown. Also should be hidden.
    itemsOverZeroAndHidden: (item) ->
      return inventoryManager.itemsOverZero(item) && inventoryManager.itemHidden(item)

    # Select a choice
    selectChoice: (choice) ->
      sceneManager.selectChoice(choice)
)
