fullText = ""
timer = null
currentOffset = 0
defaultInterval = 50
currentInterval = 0

TextPrinter = {

  printText: (text,interval) ->
    if timer != null
      clearInterval timer
    fullText = text
    #console.log fullText
    currentOffset = 0
    if interval == undefined
      currentInterval = defaultInterval
    else
      currentInterval = interval
    timer = setInterval(@onTick, currentInterval)

  complete: ->
    clearInterval timer
    timer = null
    data.printedText = fullText
    Scene.updateChoices()
    return false

  onTick: ->
    if currentInterval == 0
      TextPrinter.complete()
      return

    #console.log currentOffset + ": " + fullText[currentOffset]
    if fullText[currentOffset] == '<'
      i = currentOffset
      str = ""
      while fullText[i] != '>'
        i++
        str = str + fullText[i]
      str = str.substring(0,str.length-1)
      #console.log "Haa! " + str
      if str.indexOf("display:none;") > -1
        #console.log "DISPLAY NONE FOUND"
        disp = ""
        i++
        while disp.indexOf("/span") == -1
          i++
          disp = disp + fullText[i]
        #console.log "Disp: " + disp
      if str.indexOf("play-sound") > -1
      currentOffset = i

    #console.log currentOffset

    currentOffset++
    if currentOffset == fullText.length
      TextPrinter.complete()
      return

    if fullText[currentOffset] == '<'
      data.printedText = fullText.substring(0, currentOffset-1)
    else
      data.printedText = fullText.substring(0, currentOffset)

}
