
### HANDLES KEYBOARD INPUT ###

class InputManager
  presses: 0

  # Gets key down and handles their functions
  keyDown: (charCode) ->
    if @formsSelected()
      return
    if (charCode == 13 || charCode == 32)
      if novelData.novel.settings.scrollSettings.continueWithKeyboard
        sceneManager.tryContinue()
      if novelData.novel.settings.scrollSettings.skipWithKeyboard
        textPrinter.trySkip()
      textPrinter.unpause()

  # Gets key being pressed
  keyPressed: (charCode) ->
    if @formsSelected()
      return
    @presses++
    if (charCode == 13 || charCode == 32)
      if @presses > 2
        if novelData.novel.settings.scrollSettings.fastScrollWithKeyboard
          textPrinter.fastScroll()

  # Gets key release
  keyUp: (charCode) ->
    if @formsSelected()
      return
    @presses = 0
    if (charCode == 13 || charCode == 32)
      textPrinter.stopFastScroll()

  # Checks if any forms on the page are active
  formsSelected: ->
    inputs = document.getElementById("novel-area").querySelectorAll("input")
    for i in inputs
      if i == document.activeElement
        return true
    return false

document.onkeydown = (evt) ->
  evt = evt or window.event
  charCode = evt.keyCode or evt.which
  inputManager.keyDown(charCode)

document.onkeypress = (evt) ->
  evt = evt or window.event
  charCode = evt.keyCode or evt.which
  inputManager.keyPressed(charCode)

document.onkeyup = (evt) ->
  evt = evt or window.event
  charCode = evt.keyCode or evt.which
  inputManager.keyUp(charCode)
