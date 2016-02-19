
### UI SCRIPTS ###

UI = {

  # Show the save notification window, and update its text
  showSaveNotification: (text) ->
    e = document.getElementById("save-notification")
    textArea = e.querySelectorAll("textarea")
    textArea[0].value = text
    e.style.display = 'block';

  # Close the save notification window
  closeSaveNotification: ->
    e = document.getElementById("save-notification")
    e.style.display = 'none';

  # Show the load notification window
  showLoadNotification: ->
    if gameArea.game.settings.saveMode == "text"
      e = document.getElementById("load-notification")
      e.style.display = 'block';
    else
      GameManager.loadGame()

  # Close the load notification - if load, then load a save.
  closeLoadNotification: (load) ->
    e = document.getElementById("load-notification")
    if load
      textArea = e.querySelectorAll("textarea")
      GameManager.loadGame(textArea[0].value)
      textArea[0].value = ""
    e.style.display = 'none'

  # Update the values of the input fields
  updateInputs: (scene) ->
    inputs = document.getElementById("game-area").querySelectorAll("input")
    for i in inputs
      for a in data.game.stats
        if a.name == i.className.substring(6,i.className.length)
          a.value = Util.stripHTML(i.value)

}

# The button that can be used to copy the text from the save window.
copyButton = document.querySelector('#copy-button')
copyButton.addEventListener 'click', (event) ->
  copyTextarea = document.getElementById("save-notification").querySelector("textarea")
  copyTextarea.select()
  try
    successful = document.execCommand('copy')
  catch err
    console.error "Copying to clipboard failed: "+err
  return
