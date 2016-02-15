class TextPrinter
  constructor: ->
      @fullText = ''
      @timer = null
      @currentOffset = 0

  printText: (text) ->
    @fullText = text
    @currentOffset = 0
    @timer = setInterval(@onTick, 100)
    return

  onTick: ->
    @currentOffset++
    if @currentOffset == @fullText.length
      @complete()
      return
    data.printedText = @fullText.substring(0, currentOffset)
    return

  complete: ->
    clearInterval timer
    @timer = null
    data.printedText = @fullText
    return
