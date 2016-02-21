
### HANDLES KEYBOARD INPUT ###

presses = 0

InputManager = {

  # Gets keypresses and handles their functions
  keyDown: (charCode) ->
    if (charCode == 13 || charCode == 32)
      if data.game.settings.scrollSettings.continueWithKeyboard
        Scene.tryContinue()
      if data.game.settings.scrollSettings.skipWithKeyboard
        TextPrinter.trySkip()
      TextPrinter.unpause()

  keyPressed: (charCode) ->
    presses++
    if (charCode == 13 || charCode == 32)
      if presses > 2
        if data.game.settings.scrollSettings.fastScrollWithKeyboard
          TextPrinter.fastScroll()

  keyUp: (charCode) ->
    presses = 0
    if (charCode == 13 || charCode == 32)
      TextPrinter.stopFastScroll()

}

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
