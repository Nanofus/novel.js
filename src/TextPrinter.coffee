
### TEXT PRINTING (letter by letter etc.) ###

fullText = ""
timer = null
currentOffset = 0
currentInterval = 0
soundBuffer = []
musicBuffer = []
stopMusicBuffer = []
scrollSound = null

TextPrinter = {

  # Print a scene's text
  printText: (text,interval) ->
    data.printedText = ""
    # Disable the skip button
    if document.querySelector("#skip-button") != null
      document.querySelector("#skip-button").disabled = false;
    fullText = text
    #console.log fullText
    currentOffset = 0
    soundBuffer = []
    musicBuffer = []
    stopMusicBuffer = []
    if interval == undefined
      currentInterval = data.game.currentScene.scrollSpeed
    else
      currentInterval = interval
    clearInterval timer
    timer = null
    timer = setInterval(@onTick, currentInterval)

  # Instantly show all text
  complete: ->
    # Re-enable skip button
    if document.querySelector("#skip-button") != null
      document.querySelector("#skip-button").disabled = true;

    # Reset timer
    clearInterval timer
    timer = null

    # Play missed sounds
    ss = []
    if fullText.indexOf("play-sound") > -1
      s = fullText.split("play-sound ")
      for i in s
        ss.push(i.split(/\s|\"/)[0])
    if ss.length > 0
      for i in [0 .. ss.length]
        if !(ss[i] in soundBuffer)
          Sound.playSound(ss[i])
    ss = []
    if fullText.indexOf("play-music") > -1
      s = fullText.split("play-music ")
      for i in s
        ss.push(i.split(/\s|\"/)[0])
    if ss.length > 0
      for i in [0 .. ss.length]
        if !(ss[i] in musicBuffer)
          Sound.startMusic(ss[i])
    ss = []
    if fullText.indexOf("stop-music") > -1
      s = fullText.split("stop-music ")
      for i in s
        ss.push(i.split(/\s|\"/)[0])
    if ss.length > 0
      for i in [0 .. ss.length]
        if !(ss[i] in stopMusicBuffer)
          Sound.stopMusic(ss[i])

    # Set printed text and update choices
    data.printedText = fullText
    Scene.updateChoices()

  # Change the interval timer
  changeTimer: (time) ->
    clearInterval timer
    timer = setInterval(@onTick, time)

  # Return the interval timer to default
  resetTimer: ->
    clearInterval timer
    timer = setInterval(@onTick, currentInterval)

  # Show a new letter
  onTick: ->
    if currentInterval == 0
      TextPrinter.complete()
      return
    #console.log currentOffset + ": " + fullText[currentOffset]
    console.log fullText[currentOffset]
    offsetChanged = false
    if fullText[currentOffset] == '<'
      i = currentOffset
      str = ""
      while fullText[i] != '>'
        i++
        str = str + fullText[i]
      i++
      str = str.substring(0,str.length-1)
      console.log "Haa! " + str
      if str.indexOf("display:none;") > -1
        #console.log "DISPLAY NONE FOUND"
        disp = ""
        spans = 1
        while true
          i++
          disp = disp + fullText[i]
          if disp.indexOf("/span") != -1
            spans--
            disp = ""
          else if disp.indexOf("span") != -1
            spans++
            disp = ""
          if spans == 0
            break
      if str.indexOf("play-sound") > -1 && str.indexOf("display:none;") > -1
        s = str.split("play-sound ")
        s = s[1].split(/\s|\"/)[0]
        soundBuffer.push(s)
      if str.indexOf("play-music") > -1 && str.indexOf("display:none;") > -1
        s = str.split("play-music ")
        s = s[1].split(/\s|\"/)[0]
        musicBuffer.push(s)
      if str.indexOf("display:none;") == -1
        if str.indexOf("play-sound") > -1
          s = str.split("play-sound ")
          s = s[1].split(/\s|\"/)[0]
          soundBuffer.push(s)
          Sound.playSound(s)
        if str.indexOf("play-music") > -1
          s = str.split("play-music ")
          s = s[1].split(/\s|\"/)[0]
          musicBuffer.push(s)
          Sound.startMusic(s)
        if str.indexOf("stop-music") > -1
          s = str.split("stop-music ")
          s = s[1].split(/\s|\"/)[0]
          stopMusicBuffer.push(s)
          Sound.stopMusic(s)
        if str.indexOf("set-speed") > -1
          s = str.split("set-speed ")
          s = s[1].split(/\s|\"/)[0]
          TextPrinter.changeTimer(Parser.parseStatement(s))
        if str.indexOf("default-speed") > -1
          TextPrinter.resetTimer()
        if str.indexOf("set-scroll-sound") > -1
          s = str.split("set-scroll-sound ")
          s = s[1].split(/\s|\"/)[0]
          console.log s
          scrollSound = s
        if str.indexOf("default-scroll-sound") > -1
          scrollSound = null
      currentOffset = i
      offsetChanged = true

    if !offsetChanged
      currentOffset++
    if currentOffset >= fullText.length
      if (data.game.currentScene.scrollSound != undefined)
        Sound.playSound(data.game.currentScene.scrollSound)
      currentOffset = 0
      TextPrinter.complete()
      return

    data.printedText = fullText.substring(0, currentOffset)
    if scrollSound != null
      Sound.playSound(scrollSound)
    else if (data.game.currentScene.scrollSound != undefined)
      Sound.playSound(data.game.currentScene.scrollSound)
}
