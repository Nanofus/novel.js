fullText = ""
timer = null
timer2 = null
currentOffset = 0
defaultInterval = 50

TextPrinter = {

  printText: (text) ->
    fullText = text
    console.log fullText
    currentOffset = 0
    timer = setInterval(@onTick, defaultInterval)

  complete: ->
    clearInterval timer
    timer = null
    data.printedText = fullText
    Scene.updateChoices()

  onTick: ->
    endTag = ""

    if fullText[currentOffset] == '<'
      string = ""
      tag = fullText.substring(currentOffset+1,fullText.length).split(/[\s<>]+/)[0]
      console.log "TAG: " + tag
      for i in [ currentOffset .. fullText.length ]
        string = string + fullText[i]
        if string == "<span style=\"display:none;\">"
          skip = true
          console.log "Skipping hidden at "+i
        if string.substring(string.length-7,string.length) == "</span>"
          console.log "/span found"
          if skip == true
            console.log "Skip: " + currentOffset
            currentOffset = i
            console.log "Skipped! " + currentOffset
        currentOffset++
        if fullText[i] == '>'
          console.log "found"
          break

    currentOffset++
    if currentOffset == fullText.length
      TextPrinter.complete()
      return
    data.printedText = fullText.substring(0, currentOffset)

}
