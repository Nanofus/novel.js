
### HANDLES KEYBOARD INPUT ###

InputManager = {

  keyPressed: (charCode) ->
    if (charCode == 13 || charCode == 32) && data.game.settings.scrollSettings.skipWithKeyboard
      if printCompleted
        Scene.tryContinue()
      else
        TextPrinter.trySkip()

}

document.onkeypress = (evt) ->
  evt = evt or window.event
  charCode = evt.keyCode or evt.which
  InputManager.keyPressed(charCode)
  charStr = String.fromCharCode(charCode)
