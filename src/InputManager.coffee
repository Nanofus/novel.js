
### HANDLES KEYBOARD INPUT ###

class InputManager
  presses: 0

  # Gets keypresses and handles their functions
  keyDown: (charCode) ->
    if (charCode == 13 || charCode == 32)
      if data.game.settings.scrollSettings.continueWithKeyboard
        sceneManager.tryContinue()
      if data.game.settings.scrollSettings.skipWithKeyboard
        textPrinter.trySkip()
      textPrinter.unpause()

  keyPressed: (charCode) ->
    @presses++
    if (charCode == 13 || charCode == 32)
      if @presses > 2
        if data.game.settings.scrollSettings.fastScrollWithKeyboard
          textPrinter.fastScroll()

  keyUp: (charCode) ->
    @presses = 0
    if (charCode == 13 || charCode == 32)
      textPrinter.stopFastScroll()

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
