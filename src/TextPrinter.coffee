fullText = ""
timer = null
timer2 = null
currentOffset = 0
defaultInterval = 50

TextPrinter = {

  printText: (text) ->
    fullText = text
    #console.log fullText
    currentOffset = 0
    timer = setInterval(@onTick, defaultInterval)

  complete: ->
    clearInterval timer
    timer = null
    data.printedText = fullText
    Scene.updateChoices()
    return false

  onTick: ->
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
