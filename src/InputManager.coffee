
### HANDLES KEYBOARD INPUT ###

InputManager = {

  # Gets keypresses and handles their functions
  keyPressed: (charCode) ->
    if (charCode == 13 || charCode == 32)
      if data.game.settings.scrollSettings.continueWithKeyboard
        Scene.tryContinue()
      if data.game.settings.scrollSettings.skipWithKeyboard
        TextPrinter.trySkip()
      if data.game.settings.scrollSettings.fastScrollWithKeyboard
        TextPrinter.fastScroll()

  keyUp: (charCode) ->
    if (charCode == 13 || charCode == 32)
      TextPrinter.stopFastScroll()

}

document.onkeypress = (evt) ->
  evt = evt or window.event
  charCode = evt.keyCode or evt.which
  InputManager.keyPressed(charCode)

document.onkeyup = (evt) ->
  evt = evt or window.event
  charCode = evt.keyCode or evt.which
  InputManager.keyUp(charCode)
