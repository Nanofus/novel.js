
### UI SCRIPTS ###

class UI

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
    if novelArea.novel.settings.saveMode == "text"
      e = document.getElementById("load-notification")
      e.style.display = 'block';
    else
      novelManager.loadGame()

  # Close the load notification - if load, then load a save. ChangeScene defines whether the scene should be updated or not.
  closeLoadNotification: (load, changeScene) ->
    e = document.getElementById("load-notification")
    if load
      textArea = e.querySelectorAll("textarea")
      novelManager.loadData(textArea[0].value,changeScene)
      textArea[0].value = ""
    e.style.display = 'none'

  # Update the values of the input fields
  updateInputs: (needForUpdate) ->
    inputs = document.getElementById("novel-area").querySelectorAll("input")
    for i in inputs
      for a in novelData.novel.inventories[novelData.novel.currentInventory]
        if a.name == i.className.substring(6,i.className.length)
          a.value = util.stripHTML(i.value)
          if needForUpdate
            sceneManager.updateScene(novelData.novel.currentScene,true)

# The button that can be used to copy the text from the save window.
copyButton = document.querySelector('#copy-button')
if copyButton != null
  copyButton.addEventListener 'click', (event) ->
    copyTextarea = document.getElementById("save-notification").querySelector("textarea")
    copyTextarea.select()
    try
      successful = document.execCommand('copy')
    catch err
      console.error "Copying to clipboard failed: "+err
    return
