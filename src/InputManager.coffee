
### HANDLES KEYBOARD INPUT ###

class InputManager

  # Create instance
  instance = null
  constructor: ->
    if instance
      return instance
    else
      instance = this

  # Set class-wide variables
  @presses: 0

  # Gets key down and handles their functions
  @keyDown: (charCode) ->
    if @formsSelected()
      return
    # Use SPACE to skip or continue
    if (charCode is 13 or charCode is 32)
      if novelData.novel.settings.scrollSettings.continueWithKeyboard
        SceneManager.tryContinue()
      if novelData.novel.settings.scrollSettings.skipWithKeyboard
        TextPrinter.trySkip()
      TextPrinter.unpause()

  # Gets key being pressed
  @keyPressed: (charCode) ->
    if @formsSelected()
      return
    @presses++
    # Use SPACE to fast scroll
    if (charCode is 13 or charCode is 32)
      if @presses > 2
        if novelData.novel.settings.scrollSettings.fastScrollWithKeyboard
          TextPrinter.fastScroll()

  # Gets key release
  @keyUp: (charCode) ->
    if @formsSelected()
      return
    @presses = 0
    # Release SPACE to stop fast scroll
    if (charCode is 13 or charCode is 32)
      TextPrinter.stopFastScroll()

  # Checks if any forms on the page are active
  @formsSelected: ->
    novelArea = document.getElementById("novel-area")
    if novelArea
      inputs = novelArea.querySelectorAll("input")
      for i in inputs
        if i is document.activeElement
          return true
    return false

document.onkeydown = (evt) ->
  evt = evt or window.event
  charCode = evt.keyCode or evt.which
  InputManager.keyDown(charCode)

document.onkeypress = (evt) ->
  evt = evt or window.event
  charCode = evt.keyCode or evt.which
  InputManager.keyPressed(charCode)

document.onkeyup = (evt) ->
  evt = evt or window.event
  charCode = evt.keyCode or evt.which
  InputManager.keyUp(charCode)
